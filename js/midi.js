/* ============================================
   SYNTHWAVE MELODIZER - MIDI Handler
   ============================================ */

var MidiHandler = (function() {
  var midiAccess = null;
  var selectedOutput = null;
  var noteTimeouts = [];
  
  // DOM elements (grabbed in init)
  var statusDot = null;
  var outputSelect = null;
  
  /**
   * Initialize Web MIDI API
   */
  function init(onReady) {
    // Get DOM elements
    statusDot = document.getElementById('statusDot');
    outputSelect = document.getElementById('outputSelect');
    
    if (!navigator.requestMIDIAccess) {
      setStatus(false);
      if (onReady) onReady(false);
      return;
    }
    
    navigator.requestMIDIAccess({ sysex: false })
      .then(function(access) {
        midiAccess = access;
        updateOutputs();
        midiAccess.onstatechange = updateOutputs;
        if (onReady) onReady(true);
      })
      .catch(function(err) {
        console.error('MIDI Access Failed:', err);
        setStatus(false);
        if (onReady) onReady(false);
      });
  }
  
  /**
   * Update status display
   */
  function setStatus(connected) {
    if (statusDot) {
      statusDot.className = 'status-dot ' + (connected ? 'connected' : 'disconnected');
    }
  }
  
  /**
   * Update available MIDI outputs
   */
  function updateOutputs() {
    if (!midiAccess) return;
    
    var outputs = Array.from(midiAccess.outputs.values());
    
    if (outputs.length === 0) {
      setStatus(false);
      if (outputSelect) {
        outputSelect.innerHTML = '<option>No MIDI Device</option>';
        outputSelect.disabled = true;
      }
      selectedOutput = null;
      
      // Dispatch event for app to handle
      document.dispatchEvent(new CustomEvent('midiStateChange', { 
        detail: { connected: false } 
      }));
      return;
    }
    
    setStatus(true);
    if (outputSelect) {
      outputSelect.disabled = false;
      
      // Populate output select
      outputSelect.innerHTML = '';
      outputs.forEach(function(output, index) {
        var option = document.createElement('option');
        option.value = index;
        option.textContent = output.name;
        outputSelect.appendChild(option);
      });
      
      outputSelect.onchange = function(e) {
        selectedOutput = outputs[parseInt(e.target.value)];
      };
    }
    
    selectedOutput = outputs[0];
    
    // Dispatch event for app to handle
    document.dispatchEvent(new CustomEvent('midiStateChange', { 
      detail: { connected: true } 
    }));
  }
  
  /**
   * Send a MIDI note
   * @param {number} note - MIDI note number (0-127)
   * @param {number} velocity - Note velocity (0-127)
   * @param {number} duration - Duration in 16th note steps
   * @param {number} channel - MIDI channel (1-16)
   * @param {number} stepMs - Duration of one 16th note in ms
   */
  function sendNote(note, velocity, duration, channel, stepMs) {
    if (!selectedOutput || note === null) return;
    
    var ch = channel - 1; // Convert to 0-indexed
    var noteOnMessage = [0x90 + ch, note, velocity];
    var noteOffMessage = [0x80 + ch, note, 0];
    
    selectedOutput.send(noteOnMessage);
    
    var timeout = setTimeout(function() {
      selectedOutput.send(noteOffMessage);
    }, stepMs * duration * 0.9);
    
    noteTimeouts.push(timeout);
  }
  
  /**
   * Send all notes off (panic)
   * @param {number} channel - MIDI channel (1-16)
   */
  function allNotesOff(channel) {
    // Clear pending note-offs
    noteTimeouts.forEach(function(t) { clearTimeout(t); });
    noteTimeouts = [];
    
    if (!selectedOutput) return;
    
    var ch = channel - 1;
    for (var note = 0; note < 128; note++) {
      selectedOutput.send([0x80 + ch, note, 0]);
    }
  }
  
  /**
   * Check if MIDI is connected
   */
  function isConnected() {
    return selectedOutput !== null;
  }
  
  // Public API
  return {
    init: init,
    sendNote: sendNote,
    allNotesOff: allNotesOff,
    isConnected: isConnected
  };
})();
