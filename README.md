# 🌆 Synthwave Melodizer

A browser-based synthesizer and melody generator with a retro synthwave aesthetic. Generate melodic patterns, customize sounds with subtractive synthesis, and output via the built-in synth engine or external MIDI devices.

![Synthwave Melodizer](https://img.shields.io/badge/version-5.1-ff0080) ![License](https://img.shields.io/badge/license-MIT-00ffff)

## ✨ Features

### Melody Generation
- **10 Melody Styles**: Arpeggiate, Sequence, Jumping, Flowing, Staccato, Legato, Wandering, Pulsing, Climbing, and Random
- **6 Rhythm Patterns**: Straight 16ths, Syncopated, Dotted, Triplet Feel, Sparse, and Dense
- **10 Musical Scales**: Minor, Major, Harmonic Minor, Dorian, Phrygian, Lydian, Mixolydian, Pentatonic Minor, Pentatonic Major, and Blues
- **All 12 Root Notes**: C through B with flat notation
- **Octave Selection**: Octaves 2-6

### Chord Progressions
- **16 Built-in Progressions**: Classic minor and major progressions
- **Scale-Aware**: Progressions automatically filter to match selected scale
- **Random Mode**: Generates musically coherent random progressions
- **Visual Feedback**: Chord names displayed on piano roll

### Bass Generation
- **Chord-Following Bass**: Whole notes on chord roots when using chord mode
- **Independent Basslines**: Stepwise motion with chord tone gravity in scale mode
- **Separate Channel Routing**: Route bass to different MIDI channels (2-10) or same as melody

### Internal Synthesizer
Full subtractive synthesis engine with:

| Section | Parameters |
|---------|------------|
| **3 Oscillators** | Waveform (Sine, Triangle, Saw, Square), Octave (16', 8', 4', 2', 1'), Detune (±50 cents), Level |
| **Filter** | Cutoff frequency, Resonance (Q), Envelope amount, Keyboard tracking |
| **Amp Envelope** | Attack, Decay, Sustain, Release |
| **Filter Envelope** | Attack, Decay, Sustain, Release |
| **LFO** | Rate, Waveform, Destination (Filter/Pitch), Amount |
| **Reverb** | Wet mix, Decay time |
| **Delay** | Time, Feedback, Wet mix |
| **Master** | Volume |

### Audio Routing
- **Dual Sound Sources**: Independent routing for melody and bass
- **Internal Synth**: Built-in Web Audio synthesizer (works without any external hardware)
- **MIDI Output**: Send to external synths, DAWs, or virtual instruments
- **Mix & Match**: Use internal synth for melody and MIDI for bass, or any combination

### Visual Piano Roll
- **Full-Width Display**: Dynamic sizing to fill available space
- **Scale Highlighting**: In-scale notes visually indicated
- **Chord Labels**: Current chord displayed above each bar
- **Color-Coded Notes**: Pink for melody, green for bass
- **Real-Time Playhead**: Follows playback with auto-scroll
- **Active Note Highlighting**: Notes light up during playback

## 🚀 Getting Started

### Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- No installation required!

### Quick Start
1. Open `index.html` in your browser
2. Click **⟳ GENERATE** to create a melody
3. Playback starts automatically
4. Adjust parameters and generate again!

### Using the Internal Synth
The app works immediately with the built-in synthesizer—no MIDI device needed.

1. Ensure **INT** is selected for Melody and/or Bass
2. Click the **✎** button to open the Sound Design editor
3. Adjust oscillators, filter, envelopes, and effects
4. Use the test keyboard to preview sounds (mouse or computer keyboard A-K, Z/X for octave)
5. Click **DONE** to save changes

### Using MIDI Output
1. Connect a MIDI device or virtual MIDI port
2. The status dot will turn green when connected
3. Select your device from the dropdown
4. Click **MIDI** for Melody and/or Bass routing
5. Select MIDI channel (1-16 for melody, 2-10 for bass)

## 🎛️ Controls Reference

### Top Row - Musical Settings
| Control | Description |
|---------|-------------|
| **KEY** | Root note of the scale (C, Db, D, etc.) |
| **OCT** | Base octave for melody (2-6) |
| **SCALE** | Musical scale/mode |
| **STYLE** | Melody generation algorithm |
| **RHYTHM** | Rhythmic pattern |

### Second Row - Generation & Playback
| Control | Description |
|---------|-------------|
| **CHORDS** | Toggle chord progression mode |
| **Progression** | Select chord progression (when enabled) |
| **BASS** | Toggle bass note generation |
| **Bass Channel** | MIDI channel for bass (Same, or 2-10) |
| **MELODY** | INT/MIDI routing + Edit button |
| **BASS OUT** | INT/MIDI routing + Edit button |
| **BPM** | Tempo (60-200) |
| **⟳** | Generate new melody |
| **▶** | Replay current melody |
| **■** | Stop playback |
| **Loop** | Toggle looping |

### MIDI Section
| Control | Description |
|---------|-------------|
| **Status Dot** | Green = connected, Red = disconnected |
| **Device** | Select MIDI output device |
| **CH** | MIDI channel for melody (1-16) |

## 🎹 Sound Design Editor

Access by clicking the **✎** button next to MELODY or BASS OUT.

### Oscillators (OSC 1-3)
- **Enable**: Toggle oscillator on/off
- **Wave**: Sine, Triangle, Saw, Square
- **Octave**: 16' (-2), 8' (-1), 4' (0), 2' (+1), 1' (+2)
- **Detune**: Fine-tune ±50 cents
- **Level**: Mix volume 0-100%

### Filter
- **Cutoff**: Low-pass filter frequency (20-20,000 Hz)
- **Resonance**: Filter Q/emphasis (0.1-20)
- **Env Amt**: How much the envelope affects cutoff
- **Key Track**: Higher notes = brighter sound (0-1)

### Envelopes (Amp & Filter)
- **A (Attack)**: Time to reach peak (1ms - 2s)
- **D (Decay)**: Time to fall to sustain level (1ms - 2s)
- **S (Sustain)**: Level while key held (0-100%)
- **R (Release)**: Time to silence after release (10ms - 3s)

### LFO
- **Rate**: Speed of modulation (0.1-20 Hz)
- **Wave**: Sine, Triangle, Square, Saw
- **Dest**: Target parameter (Filter or Pitch)
- **Amount**: Modulation depth (0-100)

### Effects
- **Reverb**: Wet mix, Decay time
- **Delay**: Time, Feedback, Wet mix

### Test Keyboard
- **Mouse**: Click keys to play
- **Computer Keyboard**: A-K keys play notes
- **Z/X**: Octave down/up

## 🎵 Melody Styles Explained

| Style | Description |
|-------|-------------|
| **Arpeggiate** | Broken chord patterns, cycling through scale tones |
| **Sequence** | Repeating melodic motifs transposed through the scale |
| **Jumping** | Large interval leaps for dramatic effect |
| **Flowing** | Smooth, connected phrases with stepwise motion |
| **Staccato** | Short, detached notes with rests |
| **Legato** | Long, sustained notes that flow together |
| **Wandering** | Free-form exploration of the scale |
| **Pulsing** | Rhythmic repetition on single notes |
| **Climbing** | Generally ascending melodic motion |
| **Random** | Unpredictable note selection |

## 🎼 Chord Progressions

### Minor Scale Progressions
- i - iv - V - i (Classic minor)
- i - VI - III - VII (Dramatic)
- i - VII - VI - VII (Synthwave staple)
- i - iv - VII - III (Dark)
- i - III - VII - VI (Uplifting minor)
- i - v - VI - IV (Emotional)

### Major Scale Progressions
- I - IV - V - I (Classic major)
- I - V - vi - IV (Pop progression)
- I - vi - IV - V (50s progression)
- I - IV - vi - V (Uplifting)
- I - ii - V - I (Jazz influenced)
- vi - IV - I - V (Axis progression)

### Universal
- I - IV - V - IV (Pentatonic-friendly)
- Random (algorithmically generated)

## 📁 Project Structure

```
synthwave-melodizer/
├── index.html          # Main HTML structure
├── styles.css          # All styling including sound editor
├── README.md           # This file
└── js/
    ├── config.js       # Constants, scales, chord definitions
    ├── midi.js         # Web MIDI API handler
    ├── synth.js        # Web Audio synthesizer engine
    ├── piano-roll.js   # Visual piano roll display
    ├── generator.js    # Melody generation algorithms
    ├── playback.js     # Sequencer and playback control
    ├── sound-editor.js # Synth patch editor UI
    └── app.js          # Main application logic
```

## 🔧 Technical Details

### Technologies Used
- **Web Audio API**: Internal synthesizer, effects processing
- **Web MIDI API**: External device communication
- **Vanilla JavaScript**: No frameworks or dependencies
- **CSS3**: Animations, gradients, glassmorphism effects

### Browser Compatibility
- ✅ Chrome 43+ (full support)
- ✅ Firefox 108+ (full support)
- ✅ Edge 79+ (full support)
- ✅ Safari 14+ (Web Audio only, no MIDI)
- ❌ Internet Explorer (not supported)

### Audio Architecture
```
Oscillators → Oscillator Gains → Amp Envelope → Filter → Voice Output
                                                            ↓
                                                       Master Gain
                                                      ↙    ↓    ↘
                                               Reverb  Dry   Delay
                                                  ↘     ↓     ↙
                                                   Destination
```

## 💡 Tips & Tricks

1. **Quick Sound Design**: Start with a preset-like setup—two detuned saws for classic synthwave leads

2. **Fat Bass**: Enable OSC 3 at 16' (two octaves down), use square wave, lower the filter cutoff

3. **Plucky Sounds**: Short attack, short decay, low sustain, moderate release

4. **Pad Sounds**: Long attack, long release, add reverb and delay

5. **Chord + Bass Combo**: Enable both for instant full arrangements

6. **Tempo Sync Delay**: Set delay time to match tempo (e.g., 300ms at 100 BPM for dotted eighth)

7. **Layer with MIDI**: Use internal synth for one part, MIDI out to a DAW/synth for the other

## 📜 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- Inspired by the sounds of 80s synthwave and retrowave music
- Built with modern Web APIs for maximum compatibility
- Designed for musicians, producers, and synth enthusiasts

---

*Made with 💜 and lots of neon*
