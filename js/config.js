/* ============================================
   SYNTHWAVE MELODIZER - Configuration
   ============================================ */

// Musical note names (using flats)
var NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Black keys (for visual display)
var BLACK_KEYS = [1, 3, 6, 8, 10];

// Scale definitions (intervals from root)
var SCALES = {
  'Minor':      [0, 2, 3, 5, 7, 8, 10],
  'Major':      [0, 2, 4, 5, 7, 9, 11],
  'PentMinor':  [0, 3, 5, 7, 10],
  'PentMajor':  [0, 2, 4, 7, 9],
  'Dorian':     [0, 2, 3, 5, 7, 9, 10],
  'Phrygian':   [0, 1, 3, 5, 7, 8, 10],
  'Lydian':     [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'HarmMinor':  [0, 2, 3, 5, 7, 8, 11],
  'MelMinor':   [0, 2, 3, 5, 7, 9, 11]
};

// Chord tones (scale degree indices: 1st, 3rd, 5th)
var CHORD_TONES = [0, 2, 4];

// Piano roll display settings
var KEY_HEIGHT = 16;
var STEP_WIDTH = 14;
var TOTAL_STEPS = 64; // 4 bars of 16 steps each

/* ============================================
   CHORD DEFINITIONS
   ============================================ */

// Chord types with intervals from root
var CHORD_TYPES = {
  'maj':  { intervals: [0, 4, 7], symbol: '' },
  'min':  { intervals: [0, 3, 7], symbol: 'm' },
  'dim':  { intervals: [0, 3, 6], symbol: '°' },
  'aug':  { intervals: [0, 4, 8], symbol: '+' },
  'maj7': { intervals: [0, 4, 7, 11], symbol: 'maj7' },
  'min7': { intervals: [0, 3, 7, 10], symbol: 'm7' },
  'dom7': { intervals: [0, 4, 7, 10], symbol: '7' },
  'dim7': { intervals: [0, 3, 6, 9], symbol: '°7' },
  'sus4': { intervals: [0, 5, 7], symbol: 'sus4' },
  'sus2': { intervals: [0, 2, 7], symbol: 'sus2' }
};

// Scale degree names for display
var DEGREE_NAMES_MINOR = ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'];
var DEGREE_NAMES_MAJOR = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];

// Diatonic chords for each scale type
// Each entry: [scale degree index, chord type]
var DIATONIC_CHORDS = {
  'Minor': [
    { degree: 0, type: 'min', numeral: 'i' },
    { degree: 1, type: 'dim', numeral: 'ii°' },
    { degree: 2, type: 'maj', numeral: 'III' },
    { degree: 3, type: 'min', numeral: 'iv' },
    { degree: 4, type: 'min', numeral: 'v' },
    { degree: 5, type: 'maj', numeral: 'VI' },
    { degree: 6, type: 'maj', numeral: 'VII' }
  ],
  'Major': [
    { degree: 0, type: 'maj', numeral: 'I' },
    { degree: 1, type: 'min', numeral: 'ii' },
    { degree: 2, type: 'min', numeral: 'iii' },
    { degree: 3, type: 'maj', numeral: 'IV' },
    { degree: 4, type: 'maj', numeral: 'V' },
    { degree: 5, type: 'min', numeral: 'vi' },
    { degree: 6, type: 'dim', numeral: 'vii°' }
  ],
  'HarmMinor': [
    { degree: 0, type: 'min', numeral: 'i' },
    { degree: 1, type: 'dim', numeral: 'ii°' },
    { degree: 2, type: 'aug', numeral: 'III+' },
    { degree: 3, type: 'min', numeral: 'iv' },
    { degree: 4, type: 'maj', numeral: 'V' },
    { degree: 5, type: 'maj', numeral: 'VI' },
    { degree: 6, type: 'dim', numeral: 'vii°' }
  ],
  'Dorian': [
    { degree: 0, type: 'min', numeral: 'i' },
    { degree: 1, type: 'min', numeral: 'ii' },
    { degree: 2, type: 'maj', numeral: 'III' },
    { degree: 3, type: 'maj', numeral: 'IV' },
    { degree: 4, type: 'min', numeral: 'v' },
    { degree: 5, type: 'dim', numeral: 'vi°' },
    { degree: 6, type: 'maj', numeral: 'VII' }
  ]
};

// Default to minor for scales without specific chord definitions
var DEFAULT_DIATONIC = DIATONIC_CHORDS['Minor'];

/* ============================================
   CHORD PROGRESSIONS
   Pattern arrays use scale degree indices (0-6)
   ============================================ */
var CHORD_PROGRESSIONS = {
  // Minor key progressions
  'i-iv-V-i': {
    name: 'i - iv - V - i',
    degrees: [0, 3, 4, 0],
    scales: ['Minor', 'HarmMinor', 'Dorian', 'Phrygian', 'MelMinor']
  },
  'i-VI-III-VII': {
    name: 'i - VI - III - VII',
    degrees: [0, 5, 2, 6],
    scales: ['Minor', 'Dorian', 'Phrygian']
  },
  'i-VII-VI-VII': {
    name: 'i - VII - VI - VII',
    degrees: [0, 6, 5, 6],
    scales: ['Minor', 'Dorian']
  },
  'i-iv-VII-III': {
    name: 'i - iv - VII - III',
    degrees: [0, 3, 6, 2],
    scales: ['Minor', 'Dorian']
  },
  'i-III-VII-VI': {
    name: 'i - III - VII - VI',
    degrees: [0, 2, 6, 5],
    scales: ['Minor', 'Dorian']
  },
  'i-v-VI-IV': {
    name: 'i - v - VI - IV',
    degrees: [0, 4, 5, 3],
    scales: ['Minor', 'Dorian']
  },
  
  // Major key progressions
  'I-IV-V-I': {
    name: 'I - IV - V - I',
    degrees: [0, 3, 4, 0],
    scales: ['Major', 'Lydian', 'Mixolydian']
  },
  'I-V-vi-IV': {
    name: 'I - V - vi - IV',
    degrees: [0, 4, 5, 3],
    scales: ['Major', 'Lydian', 'Mixolydian']
  },
  'I-vi-IV-V': {
    name: 'I - vi - IV - V',
    degrees: [0, 5, 3, 4],
    scales: ['Major', 'Lydian']
  },
  'I-IV-vi-V': {
    name: 'I - IV - vi - V',
    degrees: [0, 3, 5, 4],
    scales: ['Major', 'Mixolydian']
  },
  'I-ii-V-I': {
    name: 'I - ii - V - I',
    degrees: [0, 1, 4, 0],
    scales: ['Major', 'Lydian']
  },
  'vi-IV-I-V': {
    name: 'vi - IV - I - V',
    degrees: [5, 3, 0, 4],
    scales: ['Major']
  },
  
  // Pentatonic (simplified - use 1, 4, 5)
  'I-IV-V-IV': {
    name: 'I - IV - V - IV',
    degrees: [0, 3, 4, 3],
    scales: ['PentMajor', 'PentMinor']
  }
};

/* ============================================
   RHYTHM PATTERNS
   Each pattern sums to 16 (one bar of 16th notes)
   ============================================ */
var RHYTHM_PATTERNS = {
  // Constant 16th note pulse
  straight16: [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,2,2],
    [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,1,1,1,2,1,1,1,1,1,1,2,1,1]
  ],
  
  // Steady 8th notes
  straight8: [
    [2,2,2,2,2,2,2,2],
    [2,2,2,2,4,4],
    [4,2,2,2,2,2,2],
    [2,2,4,2,2,4],
    [2,4,2,4,2,2]
  ],
  
  // Off-beat accents
  syncopated: [
    [3,1,2,2,3,1,2,2],
    [1,3,2,2,1,3,2,2],
    [3,3,2,3,3,2],
    [2,1,1,2,2,1,1,2,2,2],
    [1,2,1,2,2,1,2,1,2,2]
  ],
  
  // Long-short patterns (shuffle feel)
  dotted: [
    [3,1,3,1,3,1,3,1],
    [3,1,3,1,4,4],
    [6,2,6,2],
    [3,1,2,2,3,1,2,2],
    [4,2,2,3,1,2,2]
  ],
  
  // Varied rhythms
  mixed: [
    [2,2,1,1,2,4,2,2],
    [4,2,2,1,1,2,2,2],
    [2,1,1,4,2,2,2,2],
    [3,1,2,2,4,2,2],
    [1,1,2,4,4,2,2],
    [2,2,2,2,1,1,1,1,2,2]
  ],
  
  // Long sustained notes
  sparse: [
    [4,4,4,4],
    [8,4,4],
    [4,4,8],
    [8,8],
    [6,2,4,4],
    [4,8,4],
    [4,4,4,2,2]
  ],
  
  // Driving patterns with strong beats
  driving: [
    [2,2,2,2,2,2,2,2],
    [2,2,2,2,1,1,2,2,2],
    [1,1,2,1,1,2,1,1,2,1,1,2],
    [2,1,1,2,1,1,2,1,1,2,2]
  ]
};

/* ============================================
   BAR STRUCTURES
   Define pattern usage across 4 bars
   ============================================ */
var BAR_STRUCTURES = [
  ['A', 'A', 'B', 'A'],   // Classic AABA
  ['A', 'B', 'A', 'B'],   // Alternating
  ['A', 'A', 'A', 'B'],   // Build to variation
  ['A', 'B', 'B', 'A'],   // ABBA
  ['A', 'B', 'C', 'A'],   // Journey and return
  ['A', 'A', 'B', 'C']    // Progressive
];

/* ============================================
   MELODY STYLES
   Define character/behavior of melody generation
   ============================================ */
var MELODY_STYLES = {
  // Fast flowing arpeggios
  arpeggio: {
    name: 'Arpeggio',
    description: 'Fast flowing arpeggios with consistent 16th note movement',
    chordProb: 0.75,      // Probability of targeting chord tones
    stepProb: 0.25,       // Probability of stepwise motion
    skipProb: 0.45,       // Probability of skipping (3rds)
    leapProb: 0.25,       // Probability of larger leaps (4ths/5ths)
    octaveProb: 0.15,     // Probability of octave jumps
    restProb: 0.02,       // Probability of rests
    repeatProb: 0.05,     // Probability of repeating notes
    dirBias: 0,           // Direction bias (-1 to 1)
    range: 14,            // Melodic range in semitones
    prefRhythm: 'straight16'
  },
  
  // Steady 8th note pulse
  driving: {
    name: 'Driving',
    description: 'Steady 8th note pulse with strong downbeats',
    chordProb: 0.65,
    stepProb: 0.35,
    skipProb: 0.35,
    leapProb: 0.2,
    octaveProb: 0.1,
    restProb: 0.05,
    repeatProb: 0.15,
    dirBias: 0,
    range: 10,
    prefRhythm: 'driving'
  },
  
  // Expressive lead lines
  lead: {
    name: 'Synth Lead',
    description: 'Expressive melodic lines with syncopated accents',
    chordProb: 0.5,
    stepProb: 0.45,
    skipProb: 0.3,
    leapProb: 0.2,
    octaveProb: 0.1,
    restProb: 0.08,
    repeatProb: 0.12,
    dirBias: 0,
    range: 12,
    prefRhythm: 'syncopated'
  },
  
  // Smooth sustained phrases
  nightdrive: {
    name: 'Night Drive',
    description: 'Smooth, sustained phrases with gentle movement',
    chordProb: 0.6,
    stepProb: 0.55,
    skipProb: 0.25,
    leapProb: 0.15,
    octaveProb: 0.05,
    restProb: 0.1,
    repeatProb: 0.15,
    dirBias: 0,
    range: 8,
    prefRhythm: 'sparse'
  },
  
  // Rhythmic with repeated notes
  pulse: {
    name: 'Neon Pulse',
    description: 'Rhythmic patterns with repeated notes and octave jumps',
    chordProb: 0.7,
    stepProb: 0.15,
    skipProb: 0.25,
    leapProb: 0.35,
    octaveProb: 0.25,
    restProb: 0.05,
    repeatProb: 0.35,
    dirBias: 0,
    range: 14,
    prefRhythm: 'syncopated'
  },
  
  // Ascending melodic lines
  soaring: {
    name: 'Soaring',
    description: 'Ascending melodic lines reaching upward',
    chordProb: 0.55,
    stepProb: 0.4,
    skipProb: 0.35,
    leapProb: 0.2,
    octaveProb: 0.12,
    restProb: 0.05,
    repeatProb: 0.08,
    dirBias: 0.5,        // Upward bias
    range: 14,
    prefRhythm: 'dotted'
  },
  
  // Dark and unpredictable
  mysterious: {
    name: 'Mysterious',
    description: 'Dark, unpredictable patterns with dramatic pauses',
    chordProb: 0.4,
    stepProb: 0.45,
    skipProb: 0.3,
    leapProb: 0.2,
    octaveProb: 0.1,
    restProb: 0.18,
    repeatProb: 0.1,
    dirBias: -0.2,       // Slight downward bias
    range: 10,
    prefRhythm: 'mixed'
  },
  
  // Intense and energetic
  aggressive: {
    name: 'Aggressive',
    description: 'Intense, driving patterns with wide leaps',
    chordProb: 0.6,
    stepProb: 0.2,
    skipProb: 0.3,
    leapProb: 0.4,
    octaveProb: 0.25,
    restProb: 0.03,
    repeatProb: 0.2,
    dirBias: 0,
    range: 16,
    prefRhythm: 'driving'
  },
  
  // Floating and ethereal
  dreamy: {
    name: 'Dreamy',
    description: 'Floating melodies with space to breathe',
    chordProb: 0.6,
    stepProb: 0.5,
    skipProb: 0.3,
    leapProb: 0.15,
    octaveProb: 0.08,
    restProb: 0.15,
    repeatProb: 0.1,
    dirBias: 0.15,
    range: 10,
    prefRhythm: 'sparse'
  },
  
  // Low-end bass patterns
  bassline: {
    name: 'Bassline',
    description: 'Low-end patterns with root note emphasis',
    chordProb: 0.8,
    stepProb: 0.3,
    skipProb: 0.4,
    leapProb: 0.25,
    octaveProb: 0.2,
    restProb: 0.08,
    repeatProb: 0.25,
    dirBias: -0.3,       // Downward bias
    range: 12,
    prefRhythm: 'syncopated'
  }
};

/* ============================================
   HELPER: Get available progressions for scale
   ============================================ */
function getProgressionsForScale(scaleName) {
  var result = { 'random': { name: 'Random', degrees: null } };
  
  for (var key in CHORD_PROGRESSIONS) {
    var prog = CHORD_PROGRESSIONS[key];
    if (prog.scales.indexOf(scaleName) >= 0) {
      result[key] = prog;
    }
  }
  
  // If no specific progressions, add generic ones
  if (Object.keys(result).length <= 1) {
    result['I-IV-V-I'] = CHORD_PROGRESSIONS['I-IV-V-I'];
    result['i-iv-V-i'] = CHORD_PROGRESSIONS['i-iv-V-i'];
  }
  
  return result;
}

/* ============================================
   HELPER: Get diatonic chords for scale
   ============================================ */
function getDiatonicChords(scaleName) {
  return DIATONIC_CHORDS[scaleName] || DEFAULT_DIATONIC;
}
