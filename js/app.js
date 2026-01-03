/* ============================================
   SYNTHWAVE MELODIZER - Main Application
   ============================================ */

var App = (function() {
  // DOM elements
  var generateBtn = document.getElementById('generateBtn');
  var playBtn = document.getElementById('playBtn');
  var stopBtn = document.getElementById('stopBtn');
  var loopToggle = document.getElementById('loopToggle');
  var tempoSlider = document.getElementById('tempo');
  var tempoValue = document.getElementById('tempoValue');
  var styleSelect = document.getElementById('style');
  var rhythmSelect = document.getElementById('rhythm');
  var rootNoteSelect = document.getElementById('rootNote');
  var octaveSelect = document.getElementById('octave');
  var scaleSelect = document.getElementById('scale');
  var chordToggle = document.getElementById('chordToggle');
  var chordProgressionSelect = document.getElementById('chordProgression');
  var bassToggle = document.getElementById('bassToggle');
  var bassChannelSelect = document.getElementById('bassChannel');
  
  // Audio source buttons
  var melodySrcInternal = document.getElementById('melodySrcInternal');
  var melodySrcMidi = document.getElementById('melodySrcMidi');
  var melodyEdit = document.getElementById('melodyEdit');
  var bassSrcInternal = document.getElementById('bassSrcInternal');
  var bassSrcMidi = document.getElementById('bassSrcMidi');
  var bassEdit = document.getElementById('bassEdit');
  
  /**
   * Get current settings from UI
   */
  function getSettings() {
    var mainChannel = parseInt(document.getElementById('midiChannel').value);
    var bassChannelValue = bassChannelSelect.value;
    var bassChannel = bassChannelValue === 'same' ? mainChannel : parseInt(bassChannelValue);
    
    return {
      rootNote: rootNoteSelect.value,
      octave: parseInt(octaveSelect.value),
      scale: scaleSelect.value,
      scaleIntervals: SCALES[scaleSelect.value],
      style: styleSelect.value,
      rhythm: rhythmSelect.value,
      tempo: parseInt(tempoSlider.value),
      channel: mainChannel,
      useChords: chordToggle.checked,
      chordProgression: chordProgressionSelect.value,
      useBass: bassToggle.checked,
      bassChannel: bassChannel
    };
  }
  
  /**
   * Update chord progression selector based on scale
   */
  function updateChordProgressions() {
    var scaleName = scaleSelect.value;
    var progressions = getProgressionsForScale(scaleName);
    var currentValue = chordProgressionSelect.value;
    
    chordProgressionSelect.innerHTML = '';
    
    for (var key in progressions) {
      var option = document.createElement('option');
      option.value = key;
      option.textContent = progressions[key].name;
      chordProgressionSelect.appendChild(option);
    }
    
    // Try to keep current selection if it exists
    if (progressions[currentValue]) {
      chordProgressionSelect.value = currentValue;
    }
  }
  
  /**
   * Update piano roll display with current settings
   */
  function updatePianoRoll(chordProgression) {
    var settings = getSettings();
    PianoRoll.init(
      settings.rootNote, 
      settings.octave, 
      settings.scaleIntervals, 
      chordProgression || null,
      settings.useBass
    );
  }
  
  /**
   * Update audio source buttons state
   */
  function updateAudioSourceUI() {
    var sources = Playback.getAudioSources();
    
    melodySrcInternal.classList.toggle('active', sources.melody === 'internal');
    melodySrcMidi.classList.toggle('active', sources.melody === 'midi');
    bassSrcInternal.classList.toggle('active', sources.bass === 'internal');
    bassSrcMidi.classList.toggle('active', sources.bass === 'midi');
  }
  
  /**
   * Check if we can generate (internal synth or MIDI connected)
   */
  function canGenerate() {
    var sources = Playback.getAudioSources();
    var needsMidi = sources.melody === 'midi' || sources.bass === 'midi';
    
    // Can generate if using internal synth or MIDI is connected
    if (!needsMidi) return true;
    return MidiHandler.isConnected();
  }
  
  /**
   * Generate a new melody and start playback
   */
  function generateAndPlay() {
    Playback.stop();
    
    var settings = getSettings();
    
    // Generate melody
    var melody = MelodyGenerator.generate(settings);
    
    // Get chord progression (may be null if not using chords)
    var chordProgression = MelodyGenerator.getLastChordProgression();
    
    // Update piano roll display with chord progression
    updatePianoRoll(chordProgression);
    
    if (melody.length > 0) {
      Playback.setCurrentMelody(melody);
      PianoRoll.renderNotes(melody);
      
      // Start playback
      Playback.play(melody, {
        tempo: settings.tempo,
        channel: settings.channel,
        bassChannel: settings.bassChannel
      });
    }
  }
  
  /**
   * Replay the current melody
   */
  function replay() {
    var melody = Playback.getCurrentMelody();
    if (melody.length > 0) {
      var settings = getSettings();
      Playback.play(melody, {
        tempo: settings.tempo,
        channel: settings.channel,
        bassChannel: settings.bassChannel
      });
    }
  }
  
  /**
   * Update button states based on playback state
   */
  function updateButtonStates(playing) {
    generateBtn.disabled = playing || !canGenerate();
    playBtn.disabled = playing || Playback.getCurrentMelody().length === 0;
    stopBtn.disabled = !playing;
  }
  
  /**
   * Initialize event listeners
   */
  function initEventListeners() {
    // Generate button
    generateBtn.addEventListener('click', generateAndPlay);
    
    // Play button
    playBtn.addEventListener('click', replay);
    
    // Stop button
    stopBtn.addEventListener('click', function() {
      Playback.stop();
    });
    
    // Loop toggle
    loopToggle.addEventListener('change', function(e) {
      Playback.setLooping(e.target.checked);
    });
    
    // Tempo slider
    tempoSlider.addEventListener('input', function() {
      tempoValue.textContent = tempoSlider.value;
    });
    
    // Style select - auto-update rhythm
    styleSelect.addEventListener('change', function() {
      var style = MELODY_STYLES[styleSelect.value];
      if (style && style.prefRhythm) {
        rhythmSelect.value = style.prefRhythm;
      }
    });
    
    // Root note / octave / scale change - update piano roll
    rootNoteSelect.addEventListener('change', function() {
      updateChordProgressions();
      if (Playback.getCurrentMelody().length === 0) {
        updatePianoRoll();
      }
    });
    
    octaveSelect.addEventListener('change', function() {
      if (Playback.getCurrentMelody().length === 0) {
        updatePianoRoll();
      }
    });
    
    scaleSelect.addEventListener('change', function() {
      updateChordProgressions();
      if (Playback.getCurrentMelody().length === 0) {
        updatePianoRoll();
      }
    });
    
    // Chord toggle
    chordToggle.addEventListener('change', function(e) {
      chordProgressionSelect.disabled = !e.target.checked;
    });
    
    // Bass toggle
    bassToggle.addEventListener('change', function(e) {
      bassChannelSelect.disabled = !e.target.checked;
      if (Playback.getCurrentMelody().length === 0) {
        updatePianoRoll();
      }
    });
    
    // Audio source buttons - Melody
    melodySrcInternal.addEventListener('click', function() {
      var sources = Playback.getAudioSources();
      Playback.setAudioSources('internal', sources.bass);
      updateAudioSourceUI();
      generateBtn.disabled = !canGenerate();
    });
    
    melodySrcMidi.addEventListener('click', function() {
      var sources = Playback.getAudioSources();
      Playback.setAudioSources('midi', sources.bass);
      updateAudioSourceUI();
      generateBtn.disabled = !canGenerate();
    });
    
    melodyEdit.addEventListener('click', function() {
      SoundEditor.open('melody');
    });
    
    // Audio source buttons - Bass
    bassSrcInternal.addEventListener('click', function() {
      var sources = Playback.getAudioSources();
      Playback.setAudioSources(sources.melody, 'internal');
      updateAudioSourceUI();
      generateBtn.disabled = !canGenerate();
    });
    
    bassSrcMidi.addEventListener('click', function() {
      var sources = Playback.getAudioSources();
      Playback.setAudioSources(sources.melody, 'midi');
      updateAudioSourceUI();
      generateBtn.disabled = !canGenerate();
    });
    
    bassEdit.addEventListener('click', function() {
      SoundEditor.open('bass');
    });
    
    // MIDI state change
    document.addEventListener('midiStateChange', function(e) {
      generateBtn.disabled = !canGenerate();
    });
    
    // Playback events
    document.addEventListener('playbackStart', function() {
      updateButtonStates(true);
    });
    
    document.addEventListener('playbackStop', function() {
      updateButtonStates(false);
    });
  }
  
  /**
   * Initialize the application
   */
  function init() {
    console.log('Synthwave Melodizer v5.1 initializing...');
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize chord progressions for default scale
    updateChordProgressions();
    
    // Set initial disabled states
    bassChannelSelect.disabled = !bassToggle.checked;
    
    // Initialize audio source UI
    updateAudioSourceUI();
    
    // Initialize sound editor
    SoundEditor.init();
    
    // Initialize MIDI (optional now with internal synth)
    MidiHandler.init(function(success) {
      if (success) {
        console.log('MIDI initialized successfully');
      } else {
        console.log('MIDI not available - using internal synth');
      }
      // Enable generate button (internal synth is always available)
      generateBtn.disabled = false;
    });
    
    // Initialize piano roll with default settings (slight delay for DOM to settle)
    setTimeout(function() {
      updatePianoRoll();
    }, 50);
    
    console.log('Synthwave Melodizer ready!');
  }
  
  // Public API
  return {
    init: init
  };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  App.init();
});

// Fallback for when script is loaded after DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  App.init();
}
