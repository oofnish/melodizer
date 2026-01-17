# CLAUDE.md

## Project Overview

Synthwave Melodizer is a browser-based MIDI melody generator and synthesizer with a retro synthwave aesthetic. It uses vanilla JavaScript with Web Audio API and Web MIDI API - no build tools or dependencies required.

## Development Commands

### Running the Application
```bash
# Open directly in browser (simplest)
open index.html

# Or serve locally with any HTTP server
python3 -m http.server 8000
# Then open http://localhost:8000
```

### No Build/Test/Lint
This is a zero-dependency vanilla JS project. There is no build step, no test framework, and no linter configured. Testing is done manually in the browser.

### GitHub CLI
When using `gh` commands in cloud environments, always include the repository flag to avoid proxy issues:
```bash
gh -R oofnish/melodizer <command>
```

## Architecture

### Module Load Order (Critical)
Scripts load in this specific order in `index.html`:
1. `config.js` - Constants and music theory data
2. `midi.js` - Web MIDI API handler
3. `synth.js` - Web Audio synthesizer engine
4. `piano-roll.js` - Visual display
5. `generator.js` - Melody algorithms
6. `playback.js` - Sequencer
7. `sound-editor.js` - Patch editing UI
8. `app.js` - Main orchestration (loads last)

### Data Flow
```
User Action → app.js → generator.js → melody array
                ↓
         playback.js (sequencer)
           ↓         ↓
      synth.js    midi.js
           ↓         ↓
      Web Audio   External MIDI
```

### Key Module Responsibilities

**config.js**: All musical constants - scales (10), root notes (12), chord types, diatonic chord definitions, chord progressions (16), rhythm patterns (7), and piano roll settings.

**generator.js**: `MelodyGenerator.generate(settings)` returns an array of note objects: `{step, note, velocity, duration, isRest, isBass}`. Implements 10 melody styles and bass generation with chord-following logic.

**synth.js**: Subtractive synthesis with 3 oscillators, low-pass filter, 2 ADSR envelopes, LFO, reverb, and delay. Maintains separate `patches.melody` and `patches.bass` configurations.

**playback.js**: Sequencer using `setInterval`. Manages `isPlaying`, `currentStep`, `currentMelody` state. Routes notes to both synth and MIDI based on audio source settings.

**midi.js**: Web MIDI API wrapper. `MidiHandler.sendNote()` for output, maintains connection status and device selection.

**piano-roll.js**: Renders 64 steps (4 bars) with MIDI range 48-72. Updates playhead position during playback. Color codes melody (pink) vs bass (green) notes.

**app.js**: UI event handlers and `getSettings()` which collects all control values. Orchestrates generation → display → playback flow.

### State Management
Each module manages its own state privately with public APIs exposed. No global store.

## Adding New Features

**New melody style**: Add style name to `STYLES` array in `config.js`, implement generation logic in `generator.js` within the style switch statement.

**New scale**: Add to `SCALES` object in `config.js` with semitone intervals. Add diatonic chords to `DIATONIC_CHORDS` if chord progression support needed.

**Synth parameters**: Modify `DEFAULT_PATCH` in `synth.js` and add corresponding UI controls in `sound-editor.js`.

## Browser Compatibility
- Chrome 43+, Firefox 108+, Edge 79+: Full support
- Safari 14+: Web Audio only (no MIDI)

## Commit Guidelines
Do not include co-authorship information in commit messages.
