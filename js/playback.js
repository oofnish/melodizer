/* ============================================
   SYNTHWAVE MELODIZER - Playback Controller
   ============================================ */

var Playback = (function() {
  var isPlaying = false;
  var isLooping = false;
  var playInterval = null;
  var currentStep = 0;
  var currentMelody = [];
  var stepMap = {};
  var currentBassChannel = 1;
  var currentMelodyChannel = 1;
  
  // Audio source settings
  var melodySource = 'internal'; // 'internal' or 'midi'
  var bassSource = 'internal';   // 'internal' or 'midi'
  
  /**
   * Build a map of steps to notes for quick lookup
   */
  function buildStepMap(melody) {
    stepMap = {};
    melody.forEach(function(note, index) {
      if (!stepMap[note.step]) {
        stepMap[note.step] = [];
      }
      stepMap[note.step].push({
        note: note.note,
        velocity: note.velocity,
        duration: note.duration,
        isRest: note.isRest,
        isBass: note.isBass || false,
        index: index
      });
    });
  }
  
  /**
   * Set audio sources
   */
  function setAudioSources(melody, bass) {
    melodySource = melody;
    bassSource = bass;
  }
  
  /**
   * Get current audio sources
   */
  function getAudioSources() {
    return { melody: melodySource, bass: bassSource };
  }
  
  /**
   * Start playback of a melody
   * @param {Array} melody - The melody to play
   * @param {Object} options - Playback options
   */
  function play(melody, options) {
    if (melody.length === 0) return;
    
    currentMelody = melody;
    isPlaying = true;
    currentStep = 0;
    
    buildStepMap(melody);
    PianoRoll.resetScroll();
    
    var tempo = options.tempo;
    var channel = options.channel;
    var bassChannel = options.bassChannel || channel;
    currentBassChannel = bassChannel;
    currentMelodyChannel = channel;
    var stepMs = (60000 / tempo) / 4; // Duration of one 16th note
    
    // Initialize internal synth if needed
    if (melodySource === 'internal' || bassSource === 'internal') {
      Synth.init();
    }
    
    // Dispatch play start event
    document.dispatchEvent(new CustomEvent('playbackStart'));
    
    playInterval = setInterval(function() {
      if (!isPlaying) return;
      
      // Update visual display
      PianoRoll.updatePlayhead(currentStep);
      PianoRoll.highlightActiveNotes(currentMelody, currentStep);
      
      // Play notes starting at this step
      if (stepMap[currentStep]) {
        stepMap[currentStep].forEach(function(note) {
          if (!note.isRest) {
            var durationMs = note.duration * stepMs;
            
            if (note.isBass) {
              // Bass note
              if (bassSource === 'internal') {
                Synth.playNote(note.note, note.velocity, durationMs, 'bass');
              } else {
                MidiHandler.sendNote(note.note, note.velocity, note.duration, bassChannel, stepMs);
              }
            } else {
              // Melody note
              if (melodySource === 'internal') {
                Synth.playNote(note.note, note.velocity, durationMs, 'melody');
              } else {
                MidiHandler.sendNote(note.note, note.velocity, note.duration, channel, stepMs);
              }
            }
          }
        });
      }
      
      currentStep++;
      
      // Check for end of melody
      if (currentStep >= TOTAL_STEPS) {
        if (isLooping) {
          currentStep = 0;
          PianoRoll.resetScroll();
        } else {
          stop();
        }
      }
    }, stepMs);
  }
  
  /**
   * Stop playback
   */
  function stop() {
    isPlaying = false;
    
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
    
    PianoRoll.hidePlayhead();
    PianoRoll.clearHighlights();
    
    // Stop internal synth
    Synth.allNotesOff();
    
    // Stop MIDI notes
    if (MidiHandler.isConnected()) {
      MidiHandler.allNotesOff(currentMelodyChannel);
      if (currentBassChannel !== currentMelodyChannel) {
        MidiHandler.allNotesOff(currentBassChannel);
      }
    }
    
    // Dispatch play stop event
    document.dispatchEvent(new CustomEvent('playbackStop'));
  }
  
  /**
   * Set looping state
   */
  function setLooping(loop) {
    isLooping = loop;
  }
  
  /**
   * Check if currently playing
   */
  function getIsPlaying() {
    return isPlaying;
  }
  
  /**
   * Get current melody
   */
  function getCurrentMelody() {
    return currentMelody;
  }
  
  /**
   * Set current melody (for replay)
   */
  function setCurrentMelody(melody) {
    currentMelody = melody;
  }
  
  // Public API
  return {
    play: play,
    stop: stop,
    setLooping: setLooping,
    getIsPlaying: getIsPlaying,
    getCurrentMelody: getCurrentMelody,
    setCurrentMelody: setCurrentMelody,
    setAudioSources: setAudioSources,
    getAudioSources: getAudioSources
  };
})();
