/* ============================================
   SYNTHWAVE MELODIZER - Synthesizer Engine
   Web Audio API based subtractive synthesizer
   ============================================ */

var Synth = (function() {
  var audioContext = null;
  var masterGain = null;
  var reverbNode = null;
  var delayNode = null;
  var delayFeedback = null;
  var delayWetGain = null;
  var reverbWetGain = null;
  var activeVoices = {};
  var voiceIdCounter = 0;
  var scheduledNoteOffs = {};
  
  // Default patch template
  var DEFAULT_PATCH = {
    name: 'Init Synth',
    
    // Oscillators (up to 3)
    osc1: { enabled: true, waveform: 'sawtooth', octave: 0, detune: 0, level: 0.7 },
    osc2: { enabled: true, waveform: 'sawtooth', octave: 0, detune: 7, level: 0.5 },
    osc3: { enabled: false, waveform: 'square', octave: -1, detune: 0, level: 0.3 },
    
    // Filter
    filter: {
      cutoff: 2000,      // Hz
      resonance: 2,      // Q factor
      envAmount: 3000,   // Hz modulation amount
      keyTrack: 0.5      // 0-1 keyboard tracking
    },
    
    // Amp Envelope (ADSR in seconds)
    ampEnv: {
      attack: 0.01,
      decay: 0.2,
      sustain: 0.7,
      release: 0.3
    },
    
    // Filter Envelope
    filterEnv: {
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      release: 0.5
    },
    
    // LFO
    lfo: {
      rate: 5,           // Hz
      waveform: 'sine',
      destination: 'filter', // 'pitch' or 'filter'
      amount: 0          // 0-100
    },
    
    // Effects
    reverb: {
      wet: 0.2,
      decay: 2
    },
    delay: {
      time: 0.3,
      feedback: 0.3,
      wet: 0.2
    },
    
    // Master
    volume: 0.7
  };
  
  // Current patches for melody and bass
  var patches = {
    melody: JSON.parse(JSON.stringify(DEFAULT_PATCH)),
    bass: JSON.parse(JSON.stringify(DEFAULT_PATCH))
  };
  
  // Initialize bass patch with different defaults
  patches.bass.name = 'Init Bass';
  patches.bass.osc1.octave = -1;
  patches.bass.osc2.octave = -1;
  patches.bass.osc3.octave = -2;
  patches.bass.filter.cutoff = 800;
  patches.bass.filter.envAmount = 1500;
  patches.bass.ampEnv.attack = 0.005;
  patches.bass.ampEnv.decay = 0.1;
  patches.bass.ampEnv.sustain = 0.8;
  patches.bass.reverb.wet = 0.1;
  
  /**
   * Initialize the audio context and effects
   */
  function init() {
    if (audioContext) return;
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Master gain
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0.8;
      
      // Create reverb (convolver with generated impulse)
      reverbNode = audioContext.createConvolver();
      reverbNode.buffer = createReverbImpulse(2, 2);
      
      reverbWetGain = audioContext.createGain();
      reverbWetGain.gain.value = 0.2;
      
      // Create delay
      delayNode = audioContext.createDelay(2);
      delayNode.delayTime.value = 0.3;
      
      delayFeedback = audioContext.createGain();
      delayFeedback.gain.value = 0.3;
      
      delayWetGain = audioContext.createGain();
      delayWetGain.gain.value = 0.2;
      
      // Routing
      // Dry path
      masterGain.connect(audioContext.destination);
      
      // Reverb path
      masterGain.connect(reverbNode);
      reverbNode.connect(reverbWetGain);
      reverbWetGain.connect(audioContext.destination);
      
      // Delay path
      masterGain.connect(delayNode);
      delayNode.connect(delayFeedback);
      delayFeedback.connect(delayNode);
      delayNode.connect(delayWetGain);
      delayWetGain.connect(audioContext.destination);
      
      console.log('Synth initialized');
    } catch (e) {
      console.error('Failed to initialize Web Audio:', e);
    }
  }
  
  /**
   * Create reverb impulse response
   */
  function createReverbImpulse(duration, decay) {
    var sampleRate = audioContext.sampleRate;
    var length = sampleRate * duration;
    var impulse = audioContext.createBuffer(2, length, sampleRate);
    
    for (var channel = 0; channel < 2; channel++) {
      var channelData = impulse.getChannelData(channel);
      for (var i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    
    return impulse;
  }
  
  /**
   * Convert MIDI note to frequency
   */
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  
  /**
   * Convert octave setting to multiplier
   * 16' = -2 octaves, 8' = 0, 4' = +1, 2' = +2
   */
  function octaveToMultiplier(octave) {
    return Math.pow(2, octave);
  }
  
  /**
   * Create a single voice (note)
   */
  function createVoice(midiNote, velocity, patch) {
    if (!audioContext) init();
    
    var now = audioContext.currentTime;
    var freq = midiToFreq(midiNote);
    var velGain = velocity / 127;
    
    var voice = {
      id: ++voiceIdCounter,
      midiNote: midiNote,
      oscillators: [],
      gains: [],
      filter: null,
      lfo: null,
      lfoGain: null,
      ampEnvGain: null,
      outputGain: null,
      isReleasing: false
    };
    
    // Output gain for this voice
    voice.outputGain = audioContext.createGain();
    voice.outputGain.gain.value = patch.volume * velGain;
    voice.outputGain.connect(masterGain);
    
    // Create filter
    voice.filter = audioContext.createBiquadFilter();
    voice.filter.type = 'lowpass';
    voice.filter.frequency.value = patch.filter.cutoff;
    voice.filter.Q.value = patch.filter.resonance;
    voice.filter.connect(voice.outputGain);
    
    // Key tracking for filter
    var keyTrackOffset = (midiNote - 60) * 50 * patch.filter.keyTrack;
    voice.filter.frequency.value = Math.max(20, Math.min(20000, patch.filter.cutoff + keyTrackOffset));
    
    // Amp envelope gain
    voice.ampEnvGain = audioContext.createGain();
    voice.ampEnvGain.gain.value = 0;
    voice.ampEnvGain.connect(voice.filter);
    
    // Apply amp envelope
    var ampEnv = patch.ampEnv;
    voice.ampEnvGain.gain.setValueAtTime(0, now);
    voice.ampEnvGain.gain.linearRampToValueAtTime(1, now + ampEnv.attack);
    voice.ampEnvGain.gain.linearRampToValueAtTime(ampEnv.sustain, now + ampEnv.attack + ampEnv.decay);
    
    // Apply filter envelope
    var filterEnv = patch.filterEnv;
    var filterBase = voice.filter.frequency.value;
    var filterPeak = Math.min(20000, filterBase + patch.filter.envAmount);
    
    voice.filter.frequency.setValueAtTime(filterBase, now);
    voice.filter.frequency.linearRampToValueAtTime(filterPeak, now + filterEnv.attack);
    voice.filter.frequency.linearRampToValueAtTime(
      filterBase + (filterPeak - filterBase) * filterEnv.sustain,
      now + filterEnv.attack + filterEnv.decay
    );
    
    // Create LFO
    if (patch.lfo.amount > 0) {
      voice.lfo = audioContext.createOscillator();
      voice.lfo.type = patch.lfo.waveform;
      voice.lfo.frequency.value = patch.lfo.rate;
      
      voice.lfoGain = audioContext.createGain();
      
      if (patch.lfo.destination === 'pitch') {
        voice.lfoGain.gain.value = patch.lfo.amount * 0.5; // cents
      } else {
        voice.lfoGain.gain.value = patch.lfo.amount * 20; // Hz for filter
        voice.lfo.connect(voice.lfoGain);
        voice.lfoGain.connect(voice.filter.frequency);
      }
      
      voice.lfo.start(now);
    }
    
    // Create oscillators
    var oscConfigs = [patch.osc1, patch.osc2, patch.osc3];
    
    oscConfigs.forEach(function(oscConfig, idx) {
      if (!oscConfig.enabled) return;
      
      var osc = audioContext.createOscillator();
      osc.type = oscConfig.waveform === 'pulse' ? 'square' : oscConfig.waveform;
      
      var oscFreq = freq * octaveToMultiplier(oscConfig.octave);
      osc.frequency.value = oscFreq;
      osc.detune.value = oscConfig.detune;
      
      // LFO to pitch
      if (voice.lfo && patch.lfo.destination === 'pitch') {
        voice.lfo.connect(voice.lfoGain);
        voice.lfoGain.connect(osc.detune);
      }
      
      var oscGain = audioContext.createGain();
      oscGain.gain.value = oscConfig.level;
      
      osc.connect(oscGain);
      oscGain.connect(voice.ampEnvGain);
      
      osc.start(now);
      
      voice.oscillators.push(osc);
      voice.gains.push(oscGain);
    });
    
    return voice;
  }
  
  /**
   * Stop and cleanup a voice
   */
  function cleanupVoice(voice) {
    if (!voice) return;
    
    try {
      // Stop all oscillators
      voice.oscillators.forEach(function(osc) {
        try { osc.stop(); } catch(e) {}
        try { osc.disconnect(); } catch(e) {}
      });
      
      // Stop LFO
      if (voice.lfo) {
        try { voice.lfo.stop(); } catch(e) {}
        try { voice.lfo.disconnect(); } catch(e) {}
      }
      
      // Disconnect all nodes
      if (voice.lfoGain) try { voice.lfoGain.disconnect(); } catch(e) {}
      if (voice.ampEnvGain) try { voice.ampEnvGain.disconnect(); } catch(e) {}
      if (voice.filter) try { voice.filter.disconnect(); } catch(e) {}
      if (voice.outputGain) try { voice.outputGain.disconnect(); } catch(e) {}
      
      voice.gains.forEach(function(g) {
        try { g.disconnect(); } catch(e) {}
      });
    } catch(e) {
      console.warn('Error cleaning up voice:', e);
    }
  }
  
  /**
   * Play a note
   */
  function noteOn(midiNote, velocity, patchType) {
    if (!audioContext) init();
    
    // Resume context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    var patch = patches[patchType] || patches.melody;
    var voiceKey = patchType + '-' + midiNote;
    
    // Stop existing voice on same note
    if (activeVoices[voiceKey]) {
      var oldVoice = activeVoices[voiceKey];
      cleanupVoice(oldVoice);
      delete activeVoices[voiceKey];
    }
    
    // Cancel any scheduled note-off for this key
    if (scheduledNoteOffs[voiceKey]) {
      clearTimeout(scheduledNoteOffs[voiceKey]);
      delete scheduledNoteOffs[voiceKey];
    }
    
    var voice = createVoice(midiNote, velocity, patch);
    activeVoices[voiceKey] = voice;
    
    // Update effects based on patch
    updateEffects(patch);
    
    return voice.id;
  }
  
  /**
   * Stop a note
   */
  function noteOff(midiNote, patchType) {
    var voiceKey = patchType + '-' + midiNote;
    var voice = activeVoices[voiceKey];
    
    if (!voice || voice.isReleasing) return;
    
    voice.isReleasing = true;
    
    var patch = patches[patchType] || patches.melody;
    var now = audioContext.currentTime;
    var releaseTime = patch.ampEnv.release;
    
    // Release envelope - ramp to zero
    voice.ampEnvGain.gain.cancelScheduledValues(now);
    voice.ampEnvGain.gain.setValueAtTime(voice.ampEnvGain.gain.value, now);
    voice.ampEnvGain.gain.linearRampToValueAtTime(0, now + releaseTime);
    
    // Filter release
    voice.filter.frequency.cancelScheduledValues(now);
    voice.filter.frequency.setValueAtTime(voice.filter.frequency.value, now);
    voice.filter.frequency.linearRampToValueAtTime(patch.filter.cutoff, now + releaseTime);
    
    // Schedule cleanup after release completes
    var cleanupDelay = (releaseTime * 1000) + 50;
    setTimeout(function() {
      // Make sure this is still the same voice
      if (activeVoices[voiceKey] === voice) {
        cleanupVoice(voice);
        delete activeVoices[voiceKey];
      }
    }, cleanupDelay);
  }
  
  /**
   * Play a note with duration (for sequencer playback)
   */
  function playNote(midiNote, velocity, durationMs, patchType) {
    if (!audioContext) init();
    
    // Resume context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    var patch = patches[patchType] || patches.melody;
    
    // Create a unique voice for this note event (don't use shared voiceKey)
    var voice = createVoice(midiNote, velocity, patch);
    var uniqueKey = patchType + '-' + midiNote + '-' + voice.id;
    activeVoices[uniqueKey] = voice;
    
    // Update effects
    updateEffects(patch);
    
    // Schedule the release
    var releaseTime = patch.ampEnv.release;
    
    setTimeout(function() {
      if (!voice || voice.isReleasing) return;
      voice.isReleasing = true;
      
      var now = audioContext.currentTime;
      
      // Release envelope
      voice.ampEnvGain.gain.cancelScheduledValues(now);
      voice.ampEnvGain.gain.setValueAtTime(voice.ampEnvGain.gain.value, now);
      voice.ampEnvGain.gain.linearRampToValueAtTime(0, now + releaseTime);
      
      // Filter release
      voice.filter.frequency.cancelScheduledValues(now);
      voice.filter.frequency.setValueAtTime(voice.filter.frequency.value, now);
      voice.filter.frequency.linearRampToValueAtTime(patch.filter.cutoff, now + releaseTime);
      
      // Cleanup after release
      setTimeout(function() {
        cleanupVoice(voice);
        delete activeVoices[uniqueKey];
      }, (releaseTime * 1000) + 50);
      
    }, durationMs);
  }
  
  /**
   * Stop all notes
   */
  function allNotesOff() {
    // Clear all scheduled note-offs
    for (var key in scheduledNoteOffs) {
      clearTimeout(scheduledNoteOffs[key]);
    }
    scheduledNoteOffs = {};
    
    // Stop and cleanup all voices
    for (var voiceKey in activeVoices) {
      var voice = activeVoices[voiceKey];
      cleanupVoice(voice);
    }
    activeVoices = {};
  }
  
  /**
   * Update effect parameters
   */
  function updateEffects(patch) {
    if (!audioContext) return;
    
    reverbWetGain.gain.value = patch.reverb.wet;
    delayNode.delayTime.value = patch.delay.time;
    delayFeedback.gain.value = patch.delay.feedback;
    delayWetGain.gain.value = patch.delay.wet;
  }
  
  /**
   * Update reverb decay
   */
  function updateReverbDecay(decay) {
    if (!audioContext) return;
    reverbNode.buffer = createReverbImpulse(decay, decay);
  }
  
  /**
   * Get a patch
   */
  function getPatch(patchType) {
    return patches[patchType] || patches.melody;
  }
  
  /**
   * Set a patch
   */
  function setPatch(patchType, patch) {
    patches[patchType] = patch;
  }
  
  /**
   * Get default patch
   */
  function getDefaultPatch() {
    return JSON.parse(JSON.stringify(DEFAULT_PATCH));
  }
  
  /**
   * Check if audio is initialized
   */
  function isInitialized() {
    return audioContext !== null;
  }
  
  /**
   * Get audio context (for external use)
   */
  function getContext() {
    if (!audioContext) init();
    return audioContext;
  }
  
  // Public API
  return {
    init: init,
    noteOn: noteOn,
    noteOff: noteOff,
    playNote: playNote,
    allNotesOff: allNotesOff,
    getPatch: getPatch,
    setPatch: setPatch,
    getDefaultPatch: getDefaultPatch,
    updateEffects: updateEffects,
    updateReverbDecay: updateReverbDecay,
    isInitialized: isInitialized,
    getContext: getContext
  };
})();
