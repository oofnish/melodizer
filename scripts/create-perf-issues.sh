#!/bin/bash
# Script to create GitHub issues for performance findings in melodizer
# Usage: GITHUB_TOKEN=your_token ./create-perf-issues.sh
# Or: gh auth login && ./create-perf-issues.sh

set -e

REPO="oofnish/melodizer"

# Check for authentication
if command -v gh &> /dev/null && gh auth status &> /dev/null; then
    USE_GH=true
    echo "Using GitHub CLI for authentication"
elif [ -n "$GITHUB_TOKEN" ]; then
    USE_GH=false
    echo "Using GITHUB_TOKEN for authentication"
else
    echo "Error: No authentication found."
    echo "Either:"
    echo "  1. Install and authenticate gh CLI: gh auth login"
    echo "  2. Set GITHUB_TOKEN environment variable"
    exit 1
fi

create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"

    echo "Creating issue: $title"

    if [ "$USE_GH" = true ]; then
        gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels"
    else
        curl -s -X POST \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github+json" \
            "https://api.github.com/repos/$REPO/issues" \
            -d "$(jq -n --arg title "$title" --arg body "$body" --argjson labels "$(echo "$labels" | jq -R 'split(",")')" \
                '{title: $title, body: $body, labels: $labels}')"
    fi

    echo "  ✓ Created"
    sleep 1  # Rate limiting
}

echo "Creating performance issues for $REPO..."
echo "==========================================="

# Issue 1: CRITICAL - highlightActiveNotes Performance
create_issue \
"[CRITICAL] highlightActiveNotes() causes severe playback lag" \
'## Summary
The `highlightActiveNotes()` function in `js/piano-roll.js` (lines 276-296) is called on every playback step (~42 times/second at 100 BPM) and performs expensive DOM operations that cause noticeable playback lag.

## Location
**File:** `js/piano-roll.js`
**Lines:** 276-296
**Called from:** `js/playback.js` line 89

## Problem Details
```javascript
function highlightActiveNotes(melody, step) {
  // Query 1: Find ALL active note blocks
  var activeBlocks = document.querySelectorAll(".note-block.active");
  activeBlocks.forEach(function(el) { el.classList.remove("active"); });

  // Query 2: Find ALL active keys
  var activeKeys = document.querySelectorAll(".piano-key.active-key");
  activeKeys.forEach(function(el) { el.classList.remove("active-key"); });

  // Loops through ALL melody notes
  melody.forEach(function(note, index) {
    if (note.isRest) return;

    if (step >= note.step && step < note.step + note.duration) {
      var blockEl = document.getElementById("note-" + index);
      if (blockEl) blockEl.classList.add("active");

      // EXPENSIVE: Complex attribute selector for every active note
      var keyEl = document.querySelector(".piano-key[data-midi=\"" + note.note + "\"]");
      if (keyEl) keyEl.classList.add("active-key");
    }
  });
}
```

### Performance Issues:
1. **Two global DOM queries per frame** (`querySelectorAll`)
2. **Complex selector for each note:** `.piano-key[data-midi="X"]` - attribute selector requires DOM scan
3. **Loop through entire melody array** (64+ notes) on every step
4. **Inefficient approach:** Clears all highlights, then re-adds instead of diffing

### Impact
At 100 BPM with 16th note steps: ~42 steps/second × complex DOM operations = significant jank/lag

## Suggested Fix
```javascript
// Cache piano keys at initialization
var pianoKeyCache = {};
document.querySelectorAll(".piano-key").forEach(function(key) {
  pianoKeyCache[key.dataset.midi] = key;
});

// Track currently active notes
var currentlyActiveNotes = new Set();
var currentlyActiveKeys = new Set();

function highlightActiveNotes(melody, step) {
  var newActiveNotes = new Set();
  var newActiveKeys = new Set();

  // Only check notes that could be playing at this step
  melody.forEach(function(note, index) {
    if (note.isRest) return;
    if (step >= note.step && step < note.step + note.duration) {
      newActiveNotes.add(index);
      newActiveKeys.add(note.note);
    }
  });

  // Remove highlights only from notes that are no longer active
  currentlyActiveNotes.forEach(function(idx) {
    if (!newActiveNotes.has(idx)) {
      var el = document.getElementById("note-" + idx);
      if (el) el.classList.remove("active");
    }
  });

  // Add highlights only to newly active notes
  newActiveNotes.forEach(function(idx) {
    if (!currentlyActiveNotes.has(idx)) {
      var el = document.getElementById("note-" + idx);
      if (el) el.classList.add("active");
    }
  });

  // Same for piano keys using cache
  currentlyActiveKeys.forEach(function(midi) {
    if (!newActiveKeys.has(midi) && pianoKeyCache[midi]) {
      pianoKeyCache[midi].classList.remove("active-key");
    }
  });

  newActiveKeys.forEach(function(midi) {
    if (!currentlyActiveKeys.has(midi) && pianoKeyCache[midi]) {
      pianoKeyCache[midi].classList.add("active-key");
    }
  });

  currentlyActiveNotes = newActiveNotes;
  currentlyActiveKeys = newActiveKeys;
}
```

## Expected Improvement
- Eliminate global DOM queries during playback
- O(1) piano key lookups instead of O(n) attribute selector scans
- Only update DOM elements that actually changed
- Estimated 50-100% improvement in playback responsiveness' \
"Performance,Critical"

# Issue 2: CRITICAL - Memory Leak in Sound Editor
create_issue \
"[CRITICAL] Memory leak: Document event listeners never removed in sound-editor.js" \
'## Summary
Document-level keyboard event listeners are added when the sound editor opens but are **never removed** when it closes, causing progressive memory growth and multiple handler execution.

## Location
**File:** `js/sound-editor.js`
**Lines:** 546-584 (listeners added), 731-735 (close function missing cleanup)

## Problem Details
```javascript
// Line 546: Added when sound editor opens
document.addEventListener("keydown", function(e) {
  if (!editorModal || !editorModal.classList.contains("visible")) return;
  // ... keyboard handling
});

// Line 574: Added when sound editor opens
document.addEventListener("keyup", function(e) {
  if (!editorModal || !editorModal.classList.contains("visible")) return;
  // ... keyboard handling
});
```

These listeners are created inside `bindKeyboard()` which is called from `init()` (line 303). The close function at lines 731-735 does not remove these listeners.

### Memory Leak Pattern
Each time a user opens the sound editor, two new event listeners are added to the document. After 10 open/close cycles, there are 20 keydown/keyup listeners:
- Consuming memory
- All firing on every keypress (even though they early-return when modal not visible)

## Suggested Fix
```javascript
// Store references to handlers
var keydownHandler = null;
var keyupHandler = null;

function bindKeyboard() {
  // Remove existing listeners first
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
  }
  if (keyupHandler) {
    document.removeEventListener("keyup", keyupHandler);
  }

  keydownHandler = function(e) {
    if (!editorModal || !editorModal.classList.contains("visible")) return;
    // ... keyboard handling
  };

  keyupHandler = function(e) {
    if (!editorModal || !editorModal.classList.contains("visible")) return;
    // ... keyboard handling
  };

  document.addEventListener("keydown", keydownHandler);
  document.addEventListener("keyup", keyupHandler);
}

function close() {
  // ... existing close logic ...

  // Clean up event listeners
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler);
    keydownHandler = null;
  }
  if (keyupHandler) {
    document.removeEventListener("keyup", keyupHandler);
    keyupHandler = null;
  }
}
```

## Impact
- Progressive memory growth over time
- Multiple event handler execution on every keypress
- Estimated 30-40% memory reduction after fix' \
"Performance,Critical"

# Issue 3: HIGH - Duplicate indexOf Calls
create_issue \
"[HIGH] Redundant indexOf() calls in scale building functions" \
'## Summary
The `buildScaleNotes()` and `generateScaleBass()` functions call `scale.indexOf()` twice for the same value in tight loops, causing unnecessary array traversals.

## Location
**File:** `js/generator.js`
**Lines:** 128-130, 273-275

## Problem Details
```javascript
// Lines 128-130 - buildScaleNotes()
for (var midi = rootMidi - halfRange; midi <= rootMidi + halfRange; midi++) {
  var interval = ((midi - rootMidi) % 12 + 12) % 12;
  if (scale.indexOf(interval) >= 0) {           // FIRST SEARCH
    var scaleIndex = scale.indexOf(interval);   // SECOND SEARCH - REDUNDANT!
    var isChordTone = CHORD_TONES.indexOf(scaleIndex % scale.length) >= 0;
```

### Impact
With a range of ~28 semitones, this causes **56+ redundant array searches** per scale note generation.

## Suggested Fix
```javascript
for (var midi = rootMidi - halfRange; midi <= rootMidi + halfRange; midi++) {
  var interval = ((midi - rootMidi) % 12 + 12) % 12;
  var scaleIndex = scale.indexOf(interval);  // Single search
  if (scaleIndex >= 0) {
    var isChordTone = CHORD_TONES.indexOf(scaleIndex % scale.length) >= 0;
    // ...
  }
}
```

## Files Affected
- `js/generator.js` lines 128-130
- `js/generator.js` lines 273-275 (same pattern in `generateScaleBass`)' \
"Performance,High"

# Issue 4: HIGH - O(n*m) Chord Tone Lookup
create_issue \
"[HIGH] Nested loops for chord tone checking - O(n*m) complexity" \
'## Summary
The `buildChordNotes()` function uses nested loops to check chord tones, resulting in O(n×m) complexity when O(n) is achievable with a Set.

## Location
**File:** `js/generator.js`
**Lines:** 99-116

## Problem Details
```javascript
// buildChordNotes() - O(n*m) complexity
for (var midi = minMidi; midi <= maxMidi; midi++) {
  var pitchClass = midi % 12;

  // Inner loop: searches through chord tones for every MIDI note
  for (var i = 0; i < chordTones.length; i++) {
    if (chordTones[i] % 12 === pitchClass) {
      available.push({...});
      break;
    }
  }
}
```

### Impact
~28 notes × 3-4 chord tones = 84-112 comparisons per chord bar.

## Suggested Fix
```javascript
function buildChordNotes(chordTones, minMidi, maxMidi) {
  var available = [];

  // Pre-compute chord tone pitch classes as a Set - O(m)
  var chordPitchClasses = new Set();
  chordTones.forEach(function(tone) {
    chordPitchClasses.add(tone % 12);
  });

  // Now O(n) instead of O(n*m)
  for (var midi = minMidi; midi <= maxMidi; midi++) {
    var pitchClass = midi % 12;
    if (chordPitchClasses.has(pitchClass)) {  // O(1) lookup
      available.push({
        midi: midi,
        isChordTone: true
      });
    }
  }

  return available;
}
```' \
"Performance,High"

# Issue 5: HIGH - Linear Search in findNoteIndex
create_issue \
"[HIGH] Linear search in findNoteIndex() called multiple times per generation" \
'## Summary
The `findNoteIndex()` function performs linear searches through the available notes array and is called 5+ times per melody generation.

## Location
**File:** `js/generator.js`
**Lines:** 147-164
**Called from:** Lines 174, 294, 320, 423, 444

## Problem Details
```javascript
function findNoteIndex(available, targetMidi) {
  // First linear search - O(n)
  for (var i = 0; i < available.length; i++) {
    if (available[i].midi === targetMidi) {
      return i;
    }
  }

  // If not found, ANOTHER linear search to find closest - O(n)
  var closest = 0;
  var minDist = 999;
  for (var j = 0; j < available.length; j++) {
    var dist = Math.abs(available[j].midi - targetMidi);
    if (dist < minDist) {
      minDist = dist;
      closest = j;
    }
  }
  return closest;
}
```

### Impact
Each call is O(n), called 5+ times per generation = O(5n) per melody.

## Suggested Fix
```javascript
// Create a lookup map once when building available notes
function createNoteLookup(available) {
  var lookup = new Map();
  available.forEach(function(note, index) {
    lookup.set(note.midi, index);
  });
  return lookup;
}

function findNoteIndex(available, targetMidi, lookup) {
  // O(1) lookup
  if (lookup.has(targetMidi)) {
    return lookup.get(targetMidi);
  }

  // Binary search for closest (if array is sorted by midi)
  // Or use the existing linear search as fallback
  var closest = 0;
  var minDist = 999;
  for (var j = 0; j < available.length; j++) {
    var dist = Math.abs(available[j].midi - targetMidi);
    if (dist < minDist) {
      minDist = dist;
      closest = j;
    }
  }
  return closest;
}
```' \
"Performance,High"

# Issue 6: MEDIUM - Window Resize Listener Pollution
create_issue \
"[MEDIUM] Window resize listener never removed, uses global variable" \
'## Summary
The piano roll module adds a window resize listener that is never removed and stores debounce state in the global `window` object.

## Location
**File:** `js/piano-roll.js`
**Lines:** 321-339

## Problem Details
```javascript
window.addEventListener("resize", function() {
  // Debounce resize
  clearTimeout(window.pianoRollResizeTimeout);  // Global variable pollution
  window.pianoRollResizeTimeout = setTimeout(function() {
    // ... resize handling
  }, 100);
});
```

### Issues
1. Event listener is **never removed**
2. Stores state in global `window` object (`window.pianoRollResizeTimeout`)
3. Multiple event listeners could accumulate if module loads multiple times

## Suggested Fix
```javascript
// Store in module scope
var resizeTimeout = null;
var resizeHandler = null;

function initResizeHandler() {
  resizeHandler = function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      // ... resize handling
    }, 100);
  };

  window.addEventListener("resize", resizeHandler);
}

function cleanupResizeHandler() {
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
    resizeTimeout = null;
  }
}
```' \
"Performance,Medium"

# Issue 7: MEDIUM - MIDI Timeout Array Accumulation
create_issue \
"[MEDIUM] MIDI note timeouts array grows indefinitely" \
'## Summary
The `noteTimeouts` array in the MIDI module accumulates timeout IDs and is only cleared when `allNotesOff()` is called, leading to potential memory growth.

## Location
**File:** `js/midi.js`
**Lines:** 8, 117-122

## Problem Details
```javascript
var noteTimeouts = [];  // Line 8 - persists in closure

function sendNote(note, velocity, duration, channel, stepMs) {
  // ...
  var timeout = setTimeout(function() {
    selectedOutput.send(noteOffMessage);
  }, stepMs * duration * 0.9);

  noteTimeouts.push(timeout);  // Line 121 - ACCUMULATES
}

function allNotesOff(channel) {
  noteTimeouts.forEach(function(t) { clearTimeout(t); });
  noteTimeouts = [];  // Only cleared here
}
```

### Impact
If playback stops before all notes finish, timeout IDs remain in the array. Over multiple play/stop cycles, the array grows.

## Suggested Fix
```javascript
var noteTimeouts = [];

function sendNote(note, velocity, duration, channel, stepMs) {
  // ...
  var timeout = setTimeout(function() {
    selectedOutput.send(noteOffMessage);
    // Remove this timeout from array after it fires
    var idx = noteTimeouts.indexOf(timeout);
    if (idx > -1) noteTimeouts.splice(idx, 1);
  }, stepMs * duration * 0.9);

  noteTimeouts.push(timeout);
}
```' \
"Performance,Medium"

# Issue 8: MEDIUM - Full Grid Recreation on Resize
create_issue \
"[MEDIUM] Piano roll grid recreates all DOM elements on resize" \
'## Summary
The `renderGrid()` function destroys and recreates 40+ DOM elements on every window resize instead of updating existing elements.

## Location
**File:** `js/piano-roll.js`
**Lines:** 128-202 (function), called from line 331 (resize handler)

## Problem Details
```javascript
function renderGrid(rootNote, octave, scaleIntervals, chordProgression) {
  gridLines.innerHTML = "";  // Destroy all existing elements

  // Recreate all grid rows (24+ elements)
  for (var midi = pianoRange.max; midi >= pianoRange.min; midi--) {
    var row = document.createElement("div");
    // ... setup row ...
    gridLines.appendChild(row);  // Create new element
  }

  // Recreate all bar lines and labels (16+ elements)
  for (var step = 0; step <= TOTAL_STEPS; step += 4) {
    var line = document.createElement("div");
    // ... setup line ...
    gridLines.appendChild(line);
  }
}
```

### Impact
On resize: ~40 DOM element destructions + ~40 DOM element creations = significant layout thrashing.

## Suggested Fix
Option 1: Use CSS Grid with percentage-based sizing that handles resize automatically.

Option 2: Update existing elements instead of recreating:
```javascript
var gridRows = [];
var barLines = [];

function renderGrid(rootNote, octave, scaleIntervals, chordProgression) {
  // First render: create elements
  if (gridRows.length === 0) {
    // ... create elements and store references in gridRows/barLines
  }

  // Subsequent renders: update existing elements
  gridRows.forEach(function(row, index) {
    // Update row dimensions/positions
    row.style.width = calculateWidth() + "px";
  });
}
```' \
"Performance,Medium"

# Issue 9: MEDIUM - Multiple innerHTML Clears
create_issue \
"[MEDIUM] Multiple innerHTML clears cause layout thrashing" \
'## Summary
Multiple functions clear element contents using `innerHTML = ""` which triggers synchronous layout recalculations.

## Location
**File:** `js/piano-roll.js`
**Lines:** 102, 132, 211

## Problem Details
```javascript
// Line 102 - renderKeys()
pianoKeys.innerHTML = "";

// Line 132 - renderGrid()
gridLines.innerHTML = "";

// Line 211 - renderNotes()
notesLayer.innerHTML = "";
```

### Impact
Each `innerHTML = ""` operation:
1. Removes all child nodes
2. Triggers layout recalculation
3. Forces browser to repaint

When called in sequence or during animations, this causes visible jank.

## Suggested Fix
Use `DocumentFragment` for batch operations or reuse existing elements:

```javascript
function renderNotes(melody) {
  // Use DocumentFragment for batch DOM operations
  var fragment = document.createDocumentFragment();

  melody.forEach(function(note, index) {
    var noteEl = document.createElement("div");
    // ... setup note element
    fragment.appendChild(noteEl);
  });

  // Single DOM operation
  notesLayer.innerHTML = "";
  notesLayer.appendChild(fragment);
}
```

Or better yet, maintain element references and update in place rather than recreating.' \
"Performance,Medium"

# Issue 10: MEDIUM - Nested Loop for Chord Tone Gravity
create_issue \
"[MEDIUM] calculateNextNote() uses nested loop for chord tone gravity" \
'## Summary
The `calculateNextNote()` function loops through all available notes to find the nearest chord tone, which could be optimized.

## Location
**File:** `js/generator.js`
**Lines:** 215-228

## Problem Details
```javascript
// calculateNextNote() - Line 215-228
for (var i = 0; i < available.length; i++) {
  if (available[i].isChordTone) {
    var dist = Math.abs(i - nextIdx);
    if (dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  }
}
```

### Impact
Loops through all available notes (~15-20) to find nearest chord tone. Called multiple times during melody generation.

## Suggested Fix
Pre-compute chord tone indices when building available notes:

```javascript
function buildScaleNotes(rootMidi, scale, range) {
  var available = [];
  var chordToneIndices = [];  // Track indices of chord tones

  // ... existing logic ...

  if (isChordTone) {
    chordToneIndices.push(available.length);
  }

  available.push({ midi, interval, isChordTone });

  return { available, chordToneIndices };
}

// In calculateNextNote, use binary search on chordToneIndices
function findNearestChordTone(chordToneIndices, targetIdx) {
  // Binary search for nearest index
  // ...
}
```' \
"Performance,Medium"

# Issue 11: LOW - Uncached Scale-to-Progression Lookups
create_issue \
"[LOW] getProgressionsForScale() recalculates on every scale change" \
'## Summary
The `getProgressionsForScale()` function loops through all chord progressions every time it is called, without caching results.

## Location
**File:** `js/config.js`
**Lines:** 428-445

**Called from:** `js/app.js` lines 205, 218, 300

## Problem Details
```javascript
function getProgressionsForScale(scaleName) {
  var result = { "random": { name: "Random", degrees: null } };

  // Loops through ALL progressions every call
  for (var key in CHORD_PROGRESSIONS) {
    var prog = CHORD_PROGRESSIONS[key];
    if (prog.scales.indexOf(scaleName) >= 0) {
      result[key] = prog;
    }
  }

  if (Object.keys(result).length <= 1) {
    result["I-IV-V-I"] = CHORD_PROGRESSIONS["I-IV-V-I"];
    result["i-iv-V-i"] = CHORD_PROGRESSIONS["i-iv-V-i"];
  }

  return result;  // New object created each time
}
```

### Impact
Not critical (only called on scale change), but wasteful for repeated lookups with same scale.

## Suggested Fix
```javascript
var progressionCache = {};

function getProgressionsForScale(scaleName) {
  // Return cached result if available
  if (progressionCache[scaleName]) {
    return progressionCache[scaleName];
  }

  var result = { "random": { name: "Random", degrees: null } };

  for (var key in CHORD_PROGRESSIONS) {
    var prog = CHORD_PROGRESSIONS[key];
    if (prog.scales.indexOf(scaleName) >= 0) {
      result[key] = prog;
    }
  }

  if (Object.keys(result).length <= 1) {
    result["I-IV-V-I"] = CHORD_PROGRESSIONS["I-IV-V-I"];
    result["i-iv-V-i"] = CHORD_PROGRESSIONS["i-iv-V-i"];
  }

  // Cache the result
  progressionCache[scaleName] = result;
  return result;
}
```' \
"Performance,Low"

# Issue 12: LOW - Console Logging During Generation
create_issue \
"[LOW] Console logging with string operations during melody generation" \
'## Summary
Debug console.log statements with string manipulation execute on every melody generation, even when the developer console is closed.

## Location
**File:** `js/generator.js`
**Lines:** 491-494

## Problem Details
```javascript
console.log("Generated melody with " + melody.length + " events");
if (chordProgression) {
  console.log("Chord progression:", chordProgression.map(function(c) {
    return c.displayName;
  }).join(" - "));
}
```

### Impact
- String concatenation happens on every generation
- `map()` and `join()` operations execute even when console is closed
- Minor performance overhead

## Suggested Fix
Option 1: Remove in production:
```javascript
// Remove these lines or wrap in DEBUG flag
if (typeof DEBUG !== "undefined" && DEBUG) {
  console.log("Generated melody with " + melody.length + " events");
  // ...
}
```

Option 2: Use conditional logging:
```javascript
var DEBUG = false;  // Set to true during development

function debugLog() {
  if (DEBUG) {
    console.log.apply(console, arguments);
  }
}

// Usage
debugLog("Generated melody with " + melody.length + " events");
```' \
"Performance,Low"

echo ""
echo "==========================================="
echo "All issues created successfully!"
echo "View them at: https://github.com/$REPO/issues"
