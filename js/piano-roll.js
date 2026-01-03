/* ============================================
   SYNTHWAVE MELODIZER - Piano Roll
   ============================================ */

var PianoRoll = (function() {
  // DOM elements (lazy initialized)
  var pianoKeys = null;
  var pianoRollGrid = null;
  var pianoRollScroll = null;
  var gridLines = null;
  var notesLayer = null;
  var playhead = null;
  var placeholder = null;
  var domInitialized = false;
  
  // State
  var pianoRange = { min: 48, max: 72 };
  var keyHeight = KEY_HEIGHT;
  var stepWidth = STEP_WIDTH;
  
  /**
   * Initialize DOM references
   */
  function initDOM() {
    if (domInitialized) return;
    pianoKeys = document.getElementById('pianoKeys');
    pianoRollGrid = document.getElementById('pianoRollGrid');
    pianoRollScroll = document.getElementById('pianoRollScroll');
    gridLines = document.getElementById('gridLines');
    notesLayer = document.getElementById('notesLayer');
    playhead = document.getElementById('playhead');
    placeholder = document.getElementById('placeholder');
    domInitialized = true;
  }
  
  /**
   * Calculate dynamic sizing based on available space
   */
  function calculateSizing() {
    initDOM();
    if (!pianoRollScroll || !pianoRollScroll.parentElement) return { keyHeight: KEY_HEIGHT, stepWidth: STEP_WIDTH };
    
    var wrapperHeight = pianoRollScroll.parentElement.clientHeight;
    var scrollWidth = pianoRollScroll.clientWidth;
    var numKeys = pianoRange.max - pianoRange.min + 1;
    
    // Calculate key height to fill vertical space
    keyHeight = Math.max(12, Math.floor(wrapperHeight / numKeys));
    
    // Calculate step width to fill horizontal space (minimum to fit 4 bars)
    var minGridWidth = TOTAL_STEPS * 10; // minimum 10px per step
    stepWidth = Math.max(12, Math.floor(scrollWidth / TOTAL_STEPS));
    
    return { keyHeight: keyHeight, stepWidth: stepWidth };
  }
  
  /**
   * Get current step width for playback calculations
   */
  function getStepWidth() {
    return stepWidth;
  }
  
  /**
   * Update the piano roll range based on root note and octave
   */
  function updateRange(rootNote, octave, includeBass) {
    var rootIndex = NOTES.indexOf(rootNote);
    var rootMidi = rootIndex + (octave + 1) * 12;
    
    if (includeBass) {
      // Expand range to include bass octave (2 octaves below)
      pianoRange = { 
        min: rootMidi - 24 - 5,  // Bass range
        max: rootMidi + 14       // Melody range
      };
    } else {
      pianoRange = { 
        min: rootMidi - 14, 
        max: rootMidi + 14 
      };
    }
  }
  
  /**
   * Get current piano range
   */
  function getRange() {
    return pianoRange;
  }
  
  /**
   * Render the piano keys on the left side
   */
  function renderKeys(rootNote, octave, scaleIntervals) {
    initDOM();
    if (!pianoKeys) return;
    
    var rootIndex = NOTES.indexOf(rootNote);
    var rootMidi = rootIndex + (octave + 1) * 12;
    
    pianoKeys.innerHTML = '';
    
    for (var midi = pianoRange.max; midi >= pianoRange.min; midi--) {
      var noteIdx = midi % 12;
      var isBlack = BLACK_KEYS.indexOf(noteIdx) >= 0;
      var isRoot = midi === rootMidi;
      
      // Check if this note is in the scale
      var interval = ((midi - rootMidi) % 12 + 12) % 12;
      var isScaleNote = scaleIntervals && scaleIntervals.indexOf(interval) >= 0;
      
      var key = document.createElement('div');
      key.className = 'piano-key ' + (isBlack ? 'black-key' : 'white-key');
      if (isRoot) key.className += ' root-key';
      if (isScaleNote && !isRoot) key.className += ' scale-note';
      key.setAttribute('data-midi', midi);
      key.textContent = NOTES[noteIdx] + (Math.floor(midi / 12) - 1);
      key.style.height = keyHeight + 'px';
      
      pianoKeys.appendChild(key);
    }
  }
  
  /**
   * Render the grid lines (rows and bar/beat lines)
   */
  function renderGrid(rootNote, octave, scaleIntervals, chordProgression) {
    initDOM();
    if (!gridLines || !pianoRollScroll || !pianoRollGrid) return;
    
    gridLines.innerHTML = '';
    
    var numKeys = pianoRange.max - pianoRange.min + 1;
    var scrollWidth = pianoRollScroll.clientWidth;
    
    // Grid should fill at least the scroll width
    var gridWidth = Math.max(scrollWidth, TOTAL_STEPS * stepWidth);
    var gridHeight = numKeys * keyHeight;
    
    pianoRollGrid.style.width = gridWidth + 'px';
    pianoRollGrid.style.height = gridHeight + 'px';
    
    // Recalculate step width based on full grid
    stepWidth = gridWidth / TOTAL_STEPS;
    
    // Calculate root MIDI if provided
    var rootMidi = null;
    if (rootNote && octave !== undefined) {
      var rootIndex = NOTES.indexOf(rootNote);
      rootMidi = rootIndex + (octave + 1) * 12;
    }
    
    // Horizontal rows
    for (var midi = pianoRange.max; midi >= pianoRange.min; midi--) {
      var row = document.createElement('div');
      var isBlack = BLACK_KEYS.indexOf(midi % 12) >= 0;
      row.className = 'grid-row ' + (isBlack ? 'black-row' : 'white-row');
      
      // Check if this note is in the scale
      if (rootMidi !== null && scaleIntervals) {
        var interval = ((midi - rootMidi) % 12 + 12) % 12;
        var isScaleNote = scaleIntervals.indexOf(interval) >= 0;
        if (isScaleNote) {
          row.className += ' scale-row';
        }
      }
      
      row.style.height = keyHeight + 'px';
      gridLines.appendChild(row);
    }
    
    // Vertical bar and beat lines
    for (var step = 0; step <= TOTAL_STEPS; step += 4) {
      var isBar = step % 16 === 0;
      
      var line = document.createElement('div');
      line.className = 'bar-line' + (isBar ? '' : ' beat');
      line.style.left = (step * stepWidth) + 'px';
      gridLines.appendChild(line);
      
      // Bar numbers and chord labels
      if (isBar && step < TOTAL_STEPS) {
        var barIndex = step / 16;
        
        var num = document.createElement('div');
        num.className = 'bar-number';
        num.style.left = (step * stepWidth + 4) + 'px';
        num.textContent = 'BAR ' + (barIndex + 1);
        gridLines.appendChild(num);
        
        // Add chord label if progression exists
        if (chordProgression && chordProgression[barIndex]) {
          var chordLabel = document.createElement('div');
          chordLabel.className = 'chord-label';
          chordLabel.style.left = (step * stepWidth + 4) + 'px';
          chordLabel.textContent = chordProgression[barIndex].displayName;
          gridLines.appendChild(chordLabel);
        }
      }
    }
  }
  
  /**
   * Render note blocks on the piano roll
   */
  function renderNotes(melody) {
    initDOM();
    if (!notesLayer || !placeholder) return;
    
    notesLayer.innerHTML = '';
    placeholder.style.display = 'none';
    
    melody.forEach(function(note, index) {
      if (note.isRest) return;
      
      var block = document.createElement('div');
      block.className = 'note-block';
      if (note.isBass) {
        block.className += ' bass-note';
      }
      block.id = 'note-' + index;
      
      var yPos = (pianoRange.max - note.note) * keyHeight + 1;
      var xPos = note.step * stepWidth + 1;
      var width = note.duration * stepWidth - 2;
      
      block.style.top = yPos + 'px';
      block.style.left = xPos + 'px';
      block.style.width = width + 'px';
      block.style.height = (keyHeight - 2) + 'px';
      
      notesLayer.appendChild(block);
    });
  }
  
  /**
   * Update playhead position
   */
  function updatePlayhead(step) {
    initDOM();
    if (!playhead || !pianoRollScroll) return;
    
    playhead.style.left = (step * stepWidth) + 'px';
    playhead.classList.add('visible');
    
    // Auto-scroll to keep playhead visible
    var pos = step * stepWidth;
    var scrollLeft = pianoRollScroll.scrollLeft;
    var scrollWidth = pianoRollScroll.clientWidth;
    
    if (pos < scrollLeft + 30 || pos > scrollLeft + scrollWidth - 30) {
      pianoRollScroll.scrollLeft = Math.max(0, pos - 50);
    }
  }
  
  /**
   * Hide the playhead
   */
  function hidePlayhead() {
    initDOM();
    if (playhead) playhead.classList.remove('visible');
  }
  
  /**
   * Reset scroll position
   */
  function resetScroll() {
    initDOM();
    if (pianoRollScroll) pianoRollScroll.scrollLeft = 0;
  }
  
  /**
   * Highlight active notes at current step
   */
  function highlightActiveNotes(melody, step) {
    // Clear previous highlights
    var activeBlocks = document.querySelectorAll('.note-block.active');
    activeBlocks.forEach(function(el) { el.classList.remove('active'); });
    
    var activeKeys = document.querySelectorAll('.piano-key.active-key');
    activeKeys.forEach(function(el) { el.classList.remove('active-key'); });
    
    // Highlight notes playing at this step
    melody.forEach(function(note, index) {
      if (note.isRest) return;
      
      if (step >= note.step && step < note.step + note.duration) {
        var blockEl = document.getElementById('note-' + index);
        if (blockEl) blockEl.classList.add('active');
        
        var keyEl = document.querySelector('.piano-key[data-midi="' + note.note + '"]');
        if (keyEl) keyEl.classList.add('active-key');
      }
    });
  }
  
  /**
   * Clear all highlights
   */
  function clearHighlights() {
    var activeBlocks = document.querySelectorAll('.note-block.active');
    activeBlocks.forEach(function(el) { el.classList.remove('active'); });
    
    var activeKeys = document.querySelectorAll('.piano-key.active-key');
    activeKeys.forEach(function(el) { el.classList.remove('active-key'); });
  }
  
  /**
   * Initialize the piano roll with current settings
   */
  function init(rootNote, octave, scaleIntervals, chordProgression, includeBass) {
    initDOM();
    updateRange(rootNote, octave, includeBass);
    calculateSizing();
    renderKeys(rootNote, octave, scaleIntervals);
    renderGrid(rootNote, octave, scaleIntervals, chordProgression);
  }
  
  // Handle window resize
  window.addEventListener('resize', function() {
    // Debounce resize
    clearTimeout(window.pianoRollResizeTimeout);
    window.pianoRollResizeTimeout = setTimeout(function() {
      var rootNote = document.getElementById('rootNote').value;
      var octave = parseInt(document.getElementById('octave').value);
      var scaleName = document.getElementById('scale').value;
      var scaleIntervals = SCALES[scaleName];
      var chordProgression = MelodyGenerator.getLastChordProgression();
      var includeBass = document.getElementById('bassToggle').checked;
      init(rootNote, octave, scaleIntervals, chordProgression, includeBass);
      
      // Re-render notes if there's a current melody
      var melody = Playback.getCurrentMelody();
      if (melody && melody.length > 0) {
        renderNotes(melody);
      }
    }, 100);
  });
  
  // Public API
  return {
    init: init,
    updateRange: updateRange,
    getRange: getRange,
    getStepWidth: getStepWidth,
    renderKeys: renderKeys,
    renderGrid: renderGrid,
    renderNotes: renderNotes,
    updatePlayhead: updatePlayhead,
    hidePlayhead: hidePlayhead,
    resetScroll: resetScroll,
    highlightActiveNotes: highlightActiveNotes,
    clearHighlights: clearHighlights
  };
})();
