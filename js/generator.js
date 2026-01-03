/* ============================================
   SYNTHWAVE MELODIZER - Melody Generator
   ============================================ */

var MelodyGenerator = (function() {
  
  // Store last generated chord progression for display
  var lastChordProgression = null;
  
  /**
   * Pick a random element from an array
   */
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  
  /**
   * Clamp a value between min and max
   */
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  
  /**
   * Generate a chord progression
   */
  function generateChordProgression(options) {
    var scaleName = options.scale;
    var progressionKey = options.chordProgression;
    var rootNote = options.rootNote;
    var octave = options.octave;
    var rootMidi = NOTES.indexOf(rootNote) + (octave + 1) * 12;
    
    var diatonicChords = getDiatonicChords(scaleName);
    var scale = SCALES[scaleName];
    var progression = [];
    
    var degrees;
    if (progressionKey === 'random' || !CHORD_PROGRESSIONS[progressionKey]) {
      // Generate random progression
      // Start on i/I, end on i/I or V, middle can be anything
      degrees = [0]; // Start on tonic
      degrees.push(Math.floor(Math.random() * 7)); // Random
      degrees.push(Math.floor(Math.random() * 7)); // Random
      degrees.push(Math.random() < 0.7 ? 0 : 4); // End on tonic or dominant
    } else {
      degrees = CHORD_PROGRESSIONS[progressionKey].degrees;
    }
    
    for (var i = 0; i < 4; i++) {
      var degree = degrees[i];
      // Clamp degree to valid range for this scale's diatonic chords
      degree = degree % diatonicChords.length;
      var chordDef = diatonicChords[degree] || diatonicChords[0];
      
      // Calculate chord root MIDI note
      var chordRootInterval = scale[degree] || 0;
      var chordRootMidi = rootMidi + chordRootInterval;
      
      // Get chord intervals
      var chordType = CHORD_TYPES[chordDef.type] || CHORD_TYPES['min'];
      var chordIntervals = chordType.intervals;
      
      // Build chord tones (MIDI notes)
      var chordTones = [];
      for (var j = 0; j < chordIntervals.length; j++) {
        chordTones.push(chordRootMidi + chordIntervals[j]);
      }
      
      // Get display name
      var chordRootIndex = chordRootMidi % 12;
      var displayName = NOTES[chordRootIndex] + chordType.symbol;
      
      progression.push({
        bar: i,
        degree: degree,
        numeral: chordDef.numeral,
        type: chordDef.type,
        rootMidi: chordRootMidi,
        tones: chordTones,
        displayName: displayName,
        scaleName: scaleName
      });
    }
    
    return progression;
  }
  
  /**
   * Build array of available notes based on chord tones
   */
  function buildChordNotes(chordTones, range, centerMidi) {
    var available = [];
    var halfRange = Math.floor(range / 2);
    var minMidi = centerMidi - halfRange;
    var maxMidi = centerMidi + halfRange;
    
    // Expand chord tones across the range
    for (var midi = minMidi; midi <= maxMidi; midi++) {
      var pitchClass = midi % 12;
      
      // Check if this pitch class is in the chord
      for (var i = 0; i < chordTones.length; i++) {
        if (chordTones[i] % 12 === pitchClass) {
          available.push({
            midi: midi,
            isChordTone: true,
            chordDegree: i // 0 = root, 1 = third, 2 = fifth, etc.
          });
          break;
        }
      }
    }
    
    return available;
  }
  
  /**
   * Build array of available notes based on scale and range
   */
  function buildScaleNotes(rootMidi, scale, range) {
    var available = [];
    var halfRange = Math.floor(range / 2);
    
    for (var midi = rootMidi - halfRange; midi <= rootMidi + halfRange; midi++) {
      var interval = ((midi - rootMidi) % 12 + 12) % 12;
      
      if (scale.indexOf(interval) >= 0) {
        var scaleIndex = scale.indexOf(interval);
        var isChordTone = CHORD_TONES.indexOf(scaleIndex % scale.length) >= 0;
        
        available.push({
          midi: midi,
          interval: interval,
          scaleIndex: scaleIndex,
          isChordTone: isChordTone
        });
      }
    }
    
    return available;
  }
  
  /**
   * Find index of target note in available notes array
   */
  function findNoteIndex(available, targetMidi) {
    for (var i = 0; i < available.length; i++) {
      if (available[i].midi === targetMidi) {
        return i;
      }
    }
    // If not found, find closest
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
  
  /**
   * Calculate next note index based on style parameters
   */
  function calculateNextNote(currentIdx, available, style, isEnding, targetMidi) {
    var nextIdx;
    
    // If ending, resolve toward target (root)
    if (isEnding && targetMidi !== null) {
      var targetIdx = findNoteIndex(available, targetMidi);
      var diff = targetIdx - currentIdx;
      if (Math.abs(diff) <= 1) {
        nextIdx = targetIdx;
      } else {
        nextIdx = currentIdx + (diff > 0 ? 1 : -1);
      }
      return clamp(nextIdx, 0, available.length - 1);
    }
    
    // Check for note repeat
    if (Math.random() < style.repeatProb) {
      return currentIdx;
    }
    
    // Determine movement type
    var roll = Math.random();
    var movement = 0;
    var direction = Math.random() < (0.5 + style.dirBias * 0.3) ? 1 : -1;
    
    if (roll < style.octaveProb) {
      // Octave jump (move by ~7 scale degrees)
      movement = direction * 7;
    } else if (roll < style.octaveProb + style.leapProb) {
      // Large leap (4th or 5th)
      movement = direction * (3 + Math.floor(Math.random() * 2));
    } else if (roll < style.octaveProb + style.leapProb + style.skipProb) {
      // Skip (3rd)
      movement = direction * 2;
    } else {
      // Stepwise motion
      movement = direction;
    }
    
    nextIdx = currentIdx + movement;
    
    // Apply chord tone gravity
    if (Math.random() < style.chordProb) {
      var nearest = nextIdx;
      var minDist = 999;
      
      for (var i = 0; i < available.length; i++) {
        if (available[i].isChordTone) {
          var dist = Math.abs(i - nextIdx);
          if (dist < minDist) {
            minDist = dist;
            nearest = i;
          }
        }
      }
      
      if (minDist <= 2) {
        nextIdx = nearest;
      }
    }
    
    return clamp(nextIdx, 0, available.length - 1);
  }
  
  /**
   * Generate bass notes for chord mode (whole notes on chord roots)
   */
  function generateChordBass(chordProgression, octave) {
    var bassNotes = [];
    var bassOctave = octave - 2; // Two octaves below
    
    for (var bar = 0; bar < 4; bar++) {
      var chord = chordProgression[bar];
      // Get the chord root in bass octave
      var chordRootPitchClass = chord.rootMidi % 12;
      var bassMidi = chordRootPitchClass + (bassOctave + 1) * 12;
      
      bassNotes.push({
        note: bassMidi,
        duration: 16, // Whole note (16 sixteenth notes)
        step: bar * 16,
        bar: bar,
        stepInBar: 0,
        velocity: 90,
        isRest: false,
        isBass: true
      });
    }
    
    return bassNotes;
  }
  
  /**
   * Generate bass notes for non-chord mode (independent bassline)
   */
  function generateScaleBass(rootMidi, scale, style, rhythmPatterns, octave) {
    var bassNotes = [];
    var bassOctave = octave - 2;
    var bassRootMidi = (rootMidi % 12) + (bassOctave + 1) * 12;
    
    // Build bass-range scale notes
    var available = [];
    for (var midi = bassRootMidi - 5; midi <= bassRootMidi + 7; midi++) {
      var interval = ((midi - bassRootMidi) % 12 + 12) % 12;
      if (scale.indexOf(interval) >= 0) {
        var scaleIndex = scale.indexOf(interval);
        var isChordTone = CHORD_TONES.indexOf(scaleIndex % scale.length) >= 0;
        available.push({
          midi: midi,
          isChordTone: isChordTone
        });
      }
    }
    
    if (available.length === 0) return bassNotes;
    
    // Use sparse rhythm for bass
    var bassRhythms = RHYTHM_PATTERNS['sparse'] || [[4,4,4,4]];
    var structure = pickRandom(BAR_STRUCTURES);
    var patternMap = {
      'A': pickRandom(bassRhythms),
      'B': pickRandom(bassRhythms),
      'C': pickRandom(bassRhythms)
    };
    
    var noteIdx = findNoteIndex(available, bassRootMidi);
    var globalStep = 0;
    
    for (var bar = 0; bar < 4; bar++) {
      var pattern = patternMap[structure[bar]];
      var isLastBar = bar === 3;
      var stepInBar = 0;
      
      for (var i = 0; i < pattern.length; i++) {
        var duration = pattern[i];
        var isBarStart = stepInBar === 0;
        var isEnding = isLastBar && stepInBar >= 12;
        
        // Bass has fewer rests
        var isRest = !isBarStart && Math.random() < 0.05;
        
        if (!isRest) {
          // Bass movement - prefer chord tones and stepwise motion
          var targetMidi = null;
          if (isBarStart) {
            targetMidi = bassRootMidi;
          } else if (isEnding) {
            targetMidi = bassRootMidi;
          }
          
          if (targetMidi !== null && Math.random() < 0.7) {
            noteIdx = findNoteIndex(available, targetMidi);
          } else {
            // Move by step or stay
            var move = Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? 1 : -1);
            noteIdx = clamp(noteIdx + move, 0, available.length - 1);
            
            // Gravity toward chord tones
            if (Math.random() < 0.6) {
              for (var j = 0; j < available.length; j++) {
                if (available[j].isChordTone && Math.abs(j - noteIdx) <= 1) {
                  noteIdx = j;
                  break;
                }
              }
            }
          }
          
          bassNotes.push({
            note: available[noteIdx].midi,
            duration: duration,
            step: globalStep,
            bar: bar,
            stepInBar: stepInBar,
            velocity: 85 + (isBarStart ? 10 : 0),
            isRest: false,
            isBass: true
          });
        }
        
        stepInBar += duration;
        globalStep += duration;
      }
    }
    
    return bassNotes;
  }
  
  /**
   * Generate a 4-bar melody
   */
  function generate(options) {
    var rootNote = options.rootNote;
    var octave = options.octave;
    var scaleName = options.scale;
    var styleName = options.style;
    var rhythmName = options.rhythm;
    var useChords = options.useChords;
    var useBass = options.useBass;
    
    var scale = SCALES[scaleName];
    var style = MELODY_STYLES[styleName];
    var rhythmPatterns = RHYTHM_PATTERNS[rhythmName];
    var rootMidi = NOTES.indexOf(rootNote) + (octave + 1) * 12;
    
    // Generate chord progression if enabled
    var chordProgression = null;
    if (useChords) {
      chordProgression = generateChordProgression(options);
      lastChordProgression = chordProgression;
    } else {
      lastChordProgression = null;
    }
    
    // Choose bar structure and rhythm patterns
    var structure = pickRandom(BAR_STRUCTURES);
    var patternMap = {
      'A': pickRandom(rhythmPatterns),
      'B': pickRandom(rhythmPatterns),
      'C': pickRandom(rhythmPatterns)
    };
    
    // Initialize generation
    var melody = [];
    var currentMidi = rootMidi;
    var globalStep = 0;
    
    // Generate each bar
    for (var bar = 0; bar < 4; bar++) {
      var pattern = patternMap[structure[bar]];
      var isLastBar = bar === 3;
      var stepInBar = 0;
      
      // Get available notes for this bar
      var available;
      var barRootMidi = rootMidi;
      
      if (useChords && chordProgression) {
        // Use chord tones for this bar
        var chord = chordProgression[bar];
        available = buildChordNotes(chord.tones, style.range, rootMidi);
        barRootMidi = chord.rootMidi;
      } else {
        // Use full scale
        available = buildScaleNotes(rootMidi, scale, style.range);
      }
      
      if (available.length === 0) {
        console.error('No available notes for bar', bar);
        // Fallback to scale notes
        available = buildScaleNotes(rootMidi, scale, style.range);
      }
      
      // Find starting position for this bar
      var noteIdx = findNoteIndex(available, currentMidi);
      
      // Generate notes for this bar
      for (var i = 0; i < pattern.length; i++) {
        var duration = pattern[i];
        var isBarStart = stepInBar === 0;
        var isEnding = isLastBar && stepInBar >= 12;
        
        // Determine if this should be a rest
        var isRest = !isBarStart && Math.random() < style.restProb;
        
        var noteData = null;
        var velocity = 0;
        
        if (!isRest) {
          // Calculate next note
          var targetMidi = isEnding ? rootMidi : (isBarStart ? barRootMidi : null);
          var nextIdx = calculateNextNote(noteIdx, available, style, isEnding, targetMidi);
          
          // On bar start, bias toward chord root
          if (isBarStart && Math.random() < 0.6) {
            var rootIdx = findNoteIndex(available, barRootMidi);
            if (rootIdx >= 0 && rootIdx < available.length) {
              nextIdx = rootIdx;
            }
          }
          
          noteData = available[nextIdx];
          noteIdx = nextIdx;
          currentMidi = noteData.midi;
          
          // Calculate velocity with variation
          velocity = 70 + Math.floor(Math.random() * 30);
          if (isBarStart) {
            velocity = Math.min(127, velocity + 15);
          }
        }
        
        // Add note to melody
        melody.push({
          note: isRest ? null : noteData.midi,
          duration: duration,
          step: globalStep,
          bar: bar,
          stepInBar: stepInBar,
          velocity: velocity,
          isRest: isRest,
          isBass: false
        });
        
        stepInBar += duration;
        globalStep += duration;
      }
    }
    
    // Generate bass notes if enabled
    if (useBass) {
      var bassNotes;
      if (useChords && chordProgression) {
        bassNotes = generateChordBass(chordProgression, octave);
      } else {
        bassNotes = generateScaleBass(rootMidi, scale, style, rhythmPatterns, octave);
      }
      
      // Add bass notes to melody array
      melody = melody.concat(bassNotes);
    }
    
    console.log('Generated melody with ' + melody.length + ' events');
    if (chordProgression) {
      console.log('Chord progression:', chordProgression.map(function(c) { return c.displayName; }).join(' - '));
    }
    
    return melody;
  }
  
  /**
   * Get the last generated chord progression
   */
  function getLastChordProgression() {
    return lastChordProgression;
  }
  
  // Public API
  return {
    generate: generate,
    getLastChordProgression: getLastChordProgression,
    generateChordProgression: generateChordProgression
  };
})();
