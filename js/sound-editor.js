/* ============================================
   SYNTHWAVE MELODIZER - Sound Editor
   UI for editing synth patches
   ============================================ */

var SoundEditor = (function() {
  var currentPatchType = 'melody'; // 'melody' or 'bass'
  var editorModal = null;
  var keyboardOctave = 4;
  var activeKeys = {};
  
  // Key to MIDI note mapping (computer keyboard)
  var KEY_MAP = {
    'a': 0, 'w': 1, 's': 2, 'e': 3, 'd': 4, 'f': 5, 
    't': 6, 'g': 7, 'y': 8, 'h': 9, 'u': 10, 'j': 11, 'k': 12
  };
  
  /**
   * Create oscillator controls HTML
   */
  function createOscillatorHTML(num) {
    var checked = num <= 2 ? ' checked' : '';
    var detune = num === 2 ? '7' : '0';
    var level = num === 1 ? '0.7' : (num === 2 ? '0.5' : '0.3');
    var levelPct = num === 1 ? '70%' : (num === 2 ? '50%' : '30%');
    
    return [
      '<div class="osc-panel" id="oscPanel' + num + '">',
      '  <div class="osc-header">',
      '    <label class="osc-enable">',
      '      <input type="checkbox" id="osc' + num + 'Enabled"' + checked + '>',
      '      <span>OSC ' + num + '</span>',
      '    </label>',
      '  </div>',
      '  <div class="osc-controls">',
      '    <div class="param-group">',
      '      <label>WAVE</label>',
      '      <select id="osc' + num + 'Waveform" class="param-select">',
      '        <option value="sine">Sine</option>',
      '        <option value="triangle">Triangle</option>',
      '        <option value="sawtooth" selected>Saw</option>',
      '        <option value="square">Square</option>',
      '      </select>',
      '    </div>',
      '    <div class="param-group">',
      '      <label>OCTAVE</label>',
      '      <select id="osc' + num + 'Octave" class="param-select">',
      '        <option value="-2">16\'</option>',
      '        <option value="-1">8\'</option>',
      '        <option value="0" selected>4\'</option>',
      '        <option value="1">2\'</option>',
      '        <option value="2">1\'</option>',
      '      </select>',
      '    </div>',
      '    <div class="param-group">',
      '      <label>DETUNE</label>',
      '      <input type="range" id="osc' + num + 'Detune" min="-50" max="50" value="' + detune + '" class="param-slider">',
      '      <span class="param-value" id="osc' + num + 'DetuneVal">' + detune + '</span>',
      '    </div>',
      '    <div class="param-group">',
      '      <label>LEVEL</label>',
      '      <input type="range" id="osc' + num + 'Level" min="0" max="1" step="0.01" value="' + level + '" class="param-slider">',
      '      <span class="param-value" id="osc' + num + 'LevelVal">' + levelPct + '</span>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
  }
  
  /**
   * Create the editor modal HTML
   */
  function createEditorHTML() {
    var html = [
      '<div class="sound-editor-modal" id="soundEditorModal">',
      '  <div class="sound-editor">',
      '    <div class="editor-header">',
      '      <h2>SOUND DESIGN</h2>',
      '      <div class="patch-tabs">',
      '        <button class="patch-tab active" data-patch="melody">MELODY</button>',
      '        <button class="patch-tab" data-patch="bass">BASS</button>',
      '      </div>',
      '      <button class="editor-close" id="editorClose">&times;</button>',
      '    </div>',
      '    <div class="editor-content">',
      '      <!-- Oscillators Section -->',
      '      <div class="editor-section oscillators-section">',
      '        <h3>OSCILLATORS</h3>',
      '        <div class="osc-grid">',
               createOscillatorHTML(1),
               createOscillatorHTML(2),
               createOscillatorHTML(3),
      '        </div>',
      '      </div>',
      '      <!-- Filter Section -->',
      '      <div class="editor-section filter-section">',
      '        <h3>FILTER</h3>',
      '        <div class="param-row">',
      '          <div class="param-group">',
      '            <label>CUTOFF</label>',
      '            <input type="range" id="filterCutoff" min="20" max="20000" value="2000" class="param-slider">',
      '            <span class="param-value" id="filterCutoffVal">2000 Hz</span>',
      '          </div>',
      '          <div class="param-group">',
      '            <label>RESONANCE</label>',
      '            <input type="range" id="filterResonance" min="0.1" max="20" step="0.1" value="2" class="param-slider">',
      '            <span class="param-value" id="filterResonanceVal">2.0</span>',
      '          </div>',
      '          <div class="param-group">',
      '            <label>ENV AMT</label>',
      '            <input type="range" id="filterEnvAmt" min="0" max="8000" value="3000" class="param-slider">',
      '            <span class="param-value" id="filterEnvAmtVal">3000</span>',
      '          </div>',
      '          <div class="param-group">',
      '            <label>KEY TRACK</label>',
      '            <input type="range" id="filterKeyTrack" min="0" max="1" step="0.1" value="0.5" class="param-slider">',
      '            <span class="param-value" id="filterKeyTrackVal">0.5</span>',
      '          </div>',
      '        </div>',
      '      </div>',
      '      <!-- Envelopes Section -->',
      '      <div class="editor-section envelopes-section">',
      '        <div class="envelope-container">',
      '          <h3>AMP ENVELOPE</h3>',
      '          <div class="param-row">',
      '            <div class="param-group">',
      '              <label>A</label>',
      '              <input type="range" id="ampAttack" min="0.001" max="2" step="0.001" value="0.01" class="param-slider vertical">',
      '              <span class="param-value" id="ampAttackVal">10ms</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>D</label>',
      '              <input type="range" id="ampDecay" min="0.001" max="2" step="0.001" value="0.2" class="param-slider vertical">',
      '              <span class="param-value" id="ampDecayVal">200ms</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>S</label>',
      '              <input type="range" id="ampSustain" min="0" max="1" step="0.01" value="0.7" class="param-slider vertical">',
      '              <span class="param-value" id="ampSustainVal">70%</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>R</label>',
      '              <input type="range" id="ampRelease" min="0.01" max="3" step="0.01" value="0.3" class="param-slider vertical">',
      '              <span class="param-value" id="ampReleaseVal">300ms</span>',
      '            </div>',
      '          </div>',
      '        </div>',
      '        <div class="envelope-container">',
      '          <h3>FILTER ENVELOPE</h3>',
      '          <div class="param-row">',
      '            <div class="param-group">',
      '              <label>A</label>',
      '              <input type="range" id="filtEnvAttack" min="0.001" max="2" step="0.001" value="0.01" class="param-slider vertical">',
      '              <span class="param-value" id="filtEnvAttackVal">10ms</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>D</label>',
      '              <input type="range" id="filtEnvDecay" min="0.001" max="2" step="0.001" value="0.3" class="param-slider vertical">',
      '              <span class="param-value" id="filtEnvDecayVal">300ms</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>S</label>',
      '              <input type="range" id="filtEnvSustain" min="0" max="1" step="0.01" value="0.3" class="param-slider vertical">',
      '              <span class="param-value" id="filtEnvSustainVal">30%</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>R</label>',
      '              <input type="range" id="filtEnvRelease" min="0.01" max="3" step="0.01" value="0.5" class="param-slider vertical">',
      '              <span class="param-value" id="filtEnvReleaseVal">500ms</span>',
      '            </div>',
      '          </div>',
      '        </div>',
      '      </div>',
      '      <!-- LFO Section -->',
      '      <div class="editor-section lfo-section">',
      '        <h3>LFO</h3>',
      '        <div class="param-row">',
      '          <div class="param-group">',
      '            <label>RATE</label>',
      '            <input type="range" id="lfoRate" min="0.1" max="20" step="0.1" value="5" class="param-slider">',
      '            <span class="param-value" id="lfoRateVal">5.0 Hz</span>',
      '          </div>',
      '          <div class="param-group">',
      '            <label>WAVE</label>',
      '            <select id="lfoWaveform" class="param-select">',
      '              <option value="sine">Sine</option>',
      '              <option value="triangle">Triangle</option>',
      '              <option value="square">Square</option>',
      '              <option value="sawtooth">Saw</option>',
      '            </select>',
      '          </div>',
      '          <div class="param-group">',
      '            <label>DEST</label>',
      '            <select id="lfoDestination" class="param-select">',
      '              <option value="filter">Filter</option>',
      '              <option value="pitch">Pitch</option>',
      '            </select>',
      '          </div>',
      '          <div class="param-group">',
      '            <label>AMOUNT</label>',
      '            <input type="range" id="lfoAmount" min="0" max="100" value="0" class="param-slider">',
      '            <span class="param-value" id="lfoAmountVal">0</span>',
      '          </div>',
      '        </div>',
      '      </div>',
      '      <!-- Effects Section -->',
      '      <div class="editor-section effects-section">',
      '        <div class="effect-container">',
      '          <h3>REVERB</h3>',
      '          <div class="param-row">',
      '            <div class="param-group">',
      '              <label>WET</label>',
      '              <input type="range" id="reverbWet" min="0" max="1" step="0.01" value="0.2" class="param-slider">',
      '              <span class="param-value" id="reverbWetVal">20%</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>DECAY</label>',
      '              <input type="range" id="reverbDecay" min="0.5" max="5" step="0.1" value="2" class="param-slider">',
      '              <span class="param-value" id="reverbDecayVal">2.0s</span>',
      '            </div>',
      '          </div>',
      '        </div>',
      '        <div class="effect-container">',
      '          <h3>DELAY</h3>',
      '          <div class="param-row">',
      '            <div class="param-group">',
      '              <label>TIME</label>',
      '              <input type="range" id="delayTime" min="0.05" max="1" step="0.01" value="0.3" class="param-slider">',
      '              <span class="param-value" id="delayTimeVal">300ms</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>FEEDBACK</label>',
      '              <input type="range" id="delayFeedback" min="0" max="0.9" step="0.01" value="0.3" class="param-slider">',
      '              <span class="param-value" id="delayFeedbackVal">30%</span>',
      '            </div>',
      '            <div class="param-group">',
      '              <label>WET</label>',
      '              <input type="range" id="delayWet" min="0" max="1" step="0.01" value="0.2" class="param-slider">',
      '              <span class="param-value" id="delayWetVal">20%</span>',
      '            </div>',
      '          </div>',
      '        </div>',
      '      </div>',
      '      <!-- Master & Keyboard -->',
      '      <div class="editor-section master-section">',
      '        <div class="master-volume">',
      '          <h3>MASTER</h3>',
      '          <div class="param-group">',
      '            <label>VOLUME</label>',
      '            <input type="range" id="masterVolume" min="0" max="1" step="0.01" value="0.7" class="param-slider">',
      '            <span class="param-value" id="masterVolumeVal">70%</span>',
      '          </div>',
      '        </div>',
      '        <div class="test-keyboard">',
      '          <h3>TEST KEYBOARD <span class="keyboard-hint">(A-K keys, Z/X octave)</span></h3>',
      '          <div class="keyboard-keys" id="testKeyboard">',
      '            <div class="white-key" data-note="0">C</div>',
      '            <div class="black-key" data-note="1">C#</div>',
      '            <div class="white-key" data-note="2">D</div>',
      '            <div class="black-key" data-note="3">D#</div>',
      '            <div class="white-key" data-note="4">E</div>',
      '            <div class="white-key" data-note="5">F</div>',
      '            <div class="black-key" data-note="6">F#</div>',
      '            <div class="white-key" data-note="7">G</div>',
      '            <div class="black-key" data-note="8">G#</div>',
      '            <div class="white-key" data-note="9">A</div>',
      '            <div class="black-key" data-note="10">A#</div>',
      '            <div class="white-key" data-note="11">B</div>',
      '            <div class="white-key" data-note="12">C</div>',
      '          </div>',
      '          <div class="octave-display">Octave: <span id="octaveDisplay">4</span></div>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="editor-footer">',
      '      <button class="editor-btn" id="resetPatch">RESET</button>',
      '      <button class="editor-btn primary" id="savePatch">DONE</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');
    
    return html;
  }
  
  /**
   * Initialize the sound editor
   */
  function init() {
    // Add editor HTML to document
    var editorContainer = document.createElement('div');
    editorContainer.innerHTML = createEditorHTML();
    document.body.appendChild(editorContainer.firstChild);
    
    editorModal = document.getElementById('soundEditorModal');
    
    if (!editorModal) {
      console.error('Sound editor modal not found');
      return;
    }
    
    // Bind events
    bindEvents();
  }
  
  /**
   * Bind all editor events
   */
  function bindEvents() {
    // Close button
    var closeBtn = document.getElementById('editorClose');
    var saveBtn = document.getElementById('savePatch');
    var resetBtn = document.getElementById('resetPatch');
    
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (saveBtn) saveBtn.addEventListener('click', close);
    if (resetBtn) resetBtn.addEventListener('click', resetPatch);
    
    // Patch tabs
    var tabs = document.querySelectorAll('.patch-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        currentPatchType = tab.getAttribute('data-patch');
        loadPatchToUI();
      });
    });
    
    // Close on backdrop click
    editorModal.addEventListener('click', function(e) {
      if (e.target === editorModal) {
        close();
      }
    });
    
    // Bind all parameter controls
    bindParameterControls();
    
    // Test keyboard
    bindKeyboard();
  }
  
  /**
   * Bind parameter control events
   */
  function bindParameterControls() {
    // Oscillators
    for (var i = 1; i <= 3; i++) {
      bindOscillatorControls(i);
    }
    
    // Filter
    bindSlider('filterCutoff', 'filter', 'cutoff', function(v) { return Math.round(v) + ' Hz'; });
    bindSlider('filterResonance', 'filter', 'resonance', function(v) { return parseFloat(v).toFixed(1); });
    bindSlider('filterEnvAmt', 'filter', 'envAmount', function(v) { return Math.round(v); });
    bindSlider('filterKeyTrack', 'filter', 'keyTrack', function(v) { return parseFloat(v).toFixed(1); });
    
    // Amp Envelope
    bindSlider('ampAttack', 'ampEnv', 'attack', formatTime);
    bindSlider('ampDecay', 'ampEnv', 'decay', formatTime);
    bindSlider('ampSustain', 'ampEnv', 'sustain', formatPercent);
    bindSlider('ampRelease', 'ampEnv', 'release', formatTime);
    
    // Filter Envelope
    bindSlider('filtEnvAttack', 'filterEnv', 'attack', formatTime);
    bindSlider('filtEnvDecay', 'filterEnv', 'decay', formatTime);
    bindSlider('filtEnvSustain', 'filterEnv', 'sustain', formatPercent);
    bindSlider('filtEnvRelease', 'filterEnv', 'release', formatTime);
    
    // LFO
    bindSlider('lfoRate', 'lfo', 'rate', function(v) { return parseFloat(v).toFixed(1) + ' Hz'; });
    bindSelect('lfoWaveform', 'lfo', 'waveform');
    bindSelect('lfoDestination', 'lfo', 'destination');
    bindSlider('lfoAmount', 'lfo', 'amount', function(v) { return Math.round(v); });
    
    // Effects
    bindSlider('reverbWet', 'reverb', 'wet', formatPercent);
    bindSlider('reverbDecay', 'reverb', 'decay', function(v) { return parseFloat(v).toFixed(1) + 's'; }, function() {
      var patch = Synth.getPatch(currentPatchType);
      Synth.updateReverbDecay(patch.reverb.decay);
    });
    bindSlider('delayTime', 'delay', 'time', function(v) { return Math.round(v * 1000) + 'ms'; });
    bindSlider('delayFeedback', 'delay', 'feedback', formatPercent);
    bindSlider('delayWet', 'delay', 'wet', formatPercent);
    
    // Master
    var masterVol = document.getElementById('masterVolume');
    if (masterVol) {
      masterVol.addEventListener('input', function(e) {
        var patch = Synth.getPatch(currentPatchType);
        patch.volume = parseFloat(e.target.value);
        var valEl = document.getElementById('masterVolumeVal');
        if (valEl) valEl.textContent = formatPercent(patch.volume);
        Synth.setPatch(currentPatchType, patch);
      });
    }
  }
  
  /**
   * Bind oscillator controls
   */
  function bindOscillatorControls(num) {
    var oscKey = 'osc' + num;
    
    // Enable checkbox
    var enableEl = document.getElementById(oscKey + 'Enabled');
    if (enableEl) {
      enableEl.addEventListener('change', function(e) {
        var patch = Synth.getPatch(currentPatchType);
        patch[oscKey].enabled = e.target.checked;
        Synth.setPatch(currentPatchType, patch);
        
        var panel = document.getElementById('oscPanel' + num);
        if (panel) panel.classList.toggle('disabled', !e.target.checked);
      });
    }
    
    // Waveform
    var waveEl = document.getElementById(oscKey + 'Waveform');
    if (waveEl) {
      waveEl.addEventListener('change', function(e) {
        var patch = Synth.getPatch(currentPatchType);
        patch[oscKey].waveform = e.target.value;
        Synth.setPatch(currentPatchType, patch);
      });
    }
    
    // Octave
    var octEl = document.getElementById(oscKey + 'Octave');
    if (octEl) {
      octEl.addEventListener('change', function(e) {
        var patch = Synth.getPatch(currentPatchType);
        patch[oscKey].octave = parseInt(e.target.value);
        Synth.setPatch(currentPatchType, patch);
      });
    }
    
    // Detune
    var detEl = document.getElementById(oscKey + 'Detune');
    if (detEl) {
      detEl.addEventListener('input', function(e) {
        var patch = Synth.getPatch(currentPatchType);
        patch[oscKey].detune = parseInt(e.target.value);
        var valEl = document.getElementById(oscKey + 'DetuneVal');
        if (valEl) valEl.textContent = patch[oscKey].detune;
        Synth.setPatch(currentPatchType, patch);
      });
    }
    
    // Level
    var lvlEl = document.getElementById(oscKey + 'Level');
    if (lvlEl) {
      lvlEl.addEventListener('input', function(e) {
        var patch = Synth.getPatch(currentPatchType);
        patch[oscKey].level = parseFloat(e.target.value);
        var valEl = document.getElementById(oscKey + 'LevelVal');
        if (valEl) valEl.textContent = formatPercent(patch[oscKey].level);
        Synth.setPatch(currentPatchType, patch);
      });
    }
  }
  
  /**
   * Bind a slider control
   */
  function bindSlider(elementId, section, param, formatter, extraCallback) {
    var el = document.getElementById(elementId);
    if (!el) return;
    
    el.addEventListener('input', function(e) {
      var patch = Synth.getPatch(currentPatchType);
      var value = parseFloat(e.target.value);
      patch[section][param] = value;
      var valEl = document.getElementById(elementId + 'Val');
      if (valEl) valEl.textContent = formatter(value);
      Synth.setPatch(currentPatchType, patch);
      Synth.updateEffects(patch);
      if (extraCallback) extraCallback();
    });
  }
  
  /**
   * Bind a select control
   */
  function bindSelect(elementId, section, param) {
    var el = document.getElementById(elementId);
    if (!el) return;
    
    el.addEventListener('change', function(e) {
      var patch = Synth.getPatch(currentPatchType);
      patch[section][param] = e.target.value;
      Synth.setPatch(currentPatchType, patch);
    });
  }
  
  /**
   * Format time value
   */
  function formatTime(v) {
    if (v < 1) {
      return Math.round(v * 1000) + 'ms';
    }
    return parseFloat(v).toFixed(1) + 's';
  }
  
  /**
   * Format percent value
   */
  function formatPercent(v) {
    return Math.round(v * 100) + '%';
  }
  
  /**
   * Bind test keyboard
   */
  function bindKeyboard() {
    var keyboard = document.getElementById('testKeyboard');
    if (!keyboard) return;
    
    var keys = keyboard.querySelectorAll('.white-key, .black-key');
    
    // Mouse events
    keys.forEach(function(key) {
      key.addEventListener('mousedown', function(e) {
        e.preventDefault();
        var note = parseInt(key.getAttribute('data-note'));
        playTestNote(note);
        key.classList.add('active');
      });
      
      key.addEventListener('mouseup', function() {
        var note = parseInt(key.getAttribute('data-note'));
        stopTestNote(note);
        key.classList.remove('active');
      });
      
      key.addEventListener('mouseleave', function() {
        var note = parseInt(key.getAttribute('data-note'));
        stopTestNote(note);
        key.classList.remove('active');
      });
    });
    
    // Computer keyboard events
    document.addEventListener('keydown', function(e) {
      if (!editorModal || !editorModal.classList.contains('visible')) return;
      if (e.repeat) return;
      
      var key = e.key.toLowerCase();
      
      // Octave change
      if (key === 'z') {
        keyboardOctave = Math.max(1, keyboardOctave - 1);
        var octDisp = document.getElementById('octaveDisplay');
        if (octDisp) octDisp.textContent = keyboardOctave;
        return;
      }
      if (key === 'x') {
        keyboardOctave = Math.min(7, keyboardOctave + 1);
        var octDisp = document.getElementById('octaveDisplay');
        if (octDisp) octDisp.textContent = keyboardOctave;
        return;
      }
      
      if (KEY_MAP.hasOwnProperty(key) && !activeKeys[key]) {
        activeKeys[key] = true;
        var note = KEY_MAP[key];
        playTestNote(note);
        highlightKey(note, true);
      }
    });
    
    document.addEventListener('keyup', function(e) {
      if (!editorModal || !editorModal.classList.contains('visible')) return;
      
      var key = e.key.toLowerCase();
      if (KEY_MAP.hasOwnProperty(key)) {
        activeKeys[key] = false;
        var note = KEY_MAP[key];
        stopTestNote(note);
        highlightKey(note, false);
      }
    });
  }
  
  /**
   * Play a test note
   */
  function playTestNote(noteOffset) {
    var midiNote = (keyboardOctave + 1) * 12 + noteOffset;
    Synth.noteOn(midiNote, 100, currentPatchType);
  }
  
  /**
   * Stop a test note
   */
  function stopTestNote(noteOffset) {
    var midiNote = (keyboardOctave + 1) * 12 + noteOffset;
    Synth.noteOff(midiNote, currentPatchType);
  }
  
  /**
   * Highlight keyboard key
   */
  function highlightKey(note, active) {
    var keys = document.querySelectorAll('#testKeyboard [data-note="' + note + '"]');
    keys.forEach(function(key) {
      key.classList.toggle('active', active);
    });
  }
  
  /**
   * Load patch values to UI
   */
  function loadPatchToUI() {
    var patch = Synth.getPatch(currentPatchType);
    
    // Oscillators
    for (var i = 1; i <= 3; i++) {
      var osc = patch['osc' + i];
      var enableEl = document.getElementById('osc' + i + 'Enabled');
      var waveEl = document.getElementById('osc' + i + 'Waveform');
      var octEl = document.getElementById('osc' + i + 'Octave');
      var detEl = document.getElementById('osc' + i + 'Detune');
      var detValEl = document.getElementById('osc' + i + 'DetuneVal');
      var lvlEl = document.getElementById('osc' + i + 'Level');
      var lvlValEl = document.getElementById('osc' + i + 'LevelVal');
      var panel = document.getElementById('oscPanel' + i);
      
      if (enableEl) enableEl.checked = osc.enabled;
      if (waveEl) waveEl.value = osc.waveform;
      if (octEl) octEl.value = osc.octave;
      if (detEl) detEl.value = osc.detune;
      if (detValEl) detValEl.textContent = osc.detune;
      if (lvlEl) lvlEl.value = osc.level;
      if (lvlValEl) lvlValEl.textContent = formatPercent(osc.level);
      if (panel) panel.classList.toggle('disabled', !osc.enabled);
    }
    
    // Filter
    setSliderValue('filterCutoff', patch.filter.cutoff, Math.round(patch.filter.cutoff) + ' Hz');
    setSliderValue('filterResonance', patch.filter.resonance, patch.filter.resonance.toFixed(1));
    setSliderValue('filterEnvAmt', patch.filter.envAmount, Math.round(patch.filter.envAmount));
    setSliderValue('filterKeyTrack', patch.filter.keyTrack, patch.filter.keyTrack.toFixed(1));
    
    // Amp Envelope
    setSliderValue('ampAttack', patch.ampEnv.attack, formatTime(patch.ampEnv.attack));
    setSliderValue('ampDecay', patch.ampEnv.decay, formatTime(patch.ampEnv.decay));
    setSliderValue('ampSustain', patch.ampEnv.sustain, formatPercent(patch.ampEnv.sustain));
    setSliderValue('ampRelease', patch.ampEnv.release, formatTime(patch.ampEnv.release));
    
    // Filter Envelope
    setSliderValue('filtEnvAttack', patch.filterEnv.attack, formatTime(patch.filterEnv.attack));
    setSliderValue('filtEnvDecay', patch.filterEnv.decay, formatTime(patch.filterEnv.decay));
    setSliderValue('filtEnvSustain', patch.filterEnv.sustain, formatPercent(patch.filterEnv.sustain));
    setSliderValue('filtEnvRelease', patch.filterEnv.release, formatTime(patch.filterEnv.release));
    
    // LFO
    setSliderValue('lfoRate', patch.lfo.rate, patch.lfo.rate.toFixed(1) + ' Hz');
    var lfoWaveEl = document.getElementById('lfoWaveform');
    var lfoDestEl = document.getElementById('lfoDestination');
    if (lfoWaveEl) lfoWaveEl.value = patch.lfo.waveform;
    if (lfoDestEl) lfoDestEl.value = patch.lfo.destination;
    setSliderValue('lfoAmount', patch.lfo.amount, Math.round(patch.lfo.amount));
    
    // Effects
    setSliderValue('reverbWet', patch.reverb.wet, formatPercent(patch.reverb.wet));
    setSliderValue('reverbDecay', patch.reverb.decay, patch.reverb.decay.toFixed(1) + 's');
    setSliderValue('delayTime', patch.delay.time, Math.round(patch.delay.time * 1000) + 'ms');
    setSliderValue('delayFeedback', patch.delay.feedback, formatPercent(patch.delay.feedback));
    setSliderValue('delayWet', patch.delay.wet, formatPercent(patch.delay.wet));
    
    // Master
    setSliderValue('masterVolume', patch.volume, formatPercent(patch.volume));
  }
  
  /**
   * Helper to set slider and value display
   */
  function setSliderValue(id, value, displayValue) {
    var el = document.getElementById(id);
    var valEl = document.getElementById(id + 'Val');
    if (el) el.value = value;
    if (valEl) valEl.textContent = displayValue;
  }
  
  /**
   * Reset current patch to defaults
   */
  function resetPatch() {
    var defaultPatch = Synth.getDefaultPatch();
    if (currentPatchType === 'bass') {
      defaultPatch.name = 'Init Bass';
      defaultPatch.osc1.octave = -1;
      defaultPatch.osc2.octave = -1;
      defaultPatch.osc3.octave = -2;
      defaultPatch.filter.cutoff = 800;
      defaultPatch.filter.envAmount = 1500;
      defaultPatch.ampEnv.attack = 0.005;
      defaultPatch.ampEnv.decay = 0.1;
      defaultPatch.ampEnv.sustain = 0.8;
      defaultPatch.reverb.wet = 0.1;
    }
    Synth.setPatch(currentPatchType, defaultPatch);
    loadPatchToUI();
  }
  
  /**
   * Open the editor
   */
  function open(patchType) {
    currentPatchType = patchType || 'melody';
    
    // Update tabs
    var tabs = document.querySelectorAll('.patch-tab');
    tabs.forEach(function(tab) {
      tab.classList.toggle('active', tab.getAttribute('data-patch') === currentPatchType);
    });
    
    // Initialize synth if needed
    Synth.init();
    
    loadPatchToUI();
    if (editorModal) editorModal.classList.add('visible');
  }
  
  /**
   * Close the editor
   */
  function close() {
    if (editorModal) editorModal.classList.remove('visible');
    Synth.allNotesOff();
    activeKeys = {};
  }
  
  /**
   * Check if editor is open
   */
  function isOpen() {
    return editorModal && editorModal.classList.contains('visible');
  }
  
  // Public API
  return {
    init: init,
    open: open,
    close: close,
    isOpen: isOpen
  };
})();
