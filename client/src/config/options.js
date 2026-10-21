export const LIMITS = {
  photos: 8, photoMaxBytes: 5 * 1024 * 1024, photoMaxDim: 800,
  notes: 5, noteLen: 80, letter: 500, voiceSeconds: 45, promises: 5, promiseLen: 80,
  nameLen: 30, firstLine: 80,
};

export const OCCASIONS = [
  { id: 'just', emoji: '💌', label: 'Just because', heading: 'Always', headingB: 'You', greeting: "It's always been you", tag: 'No reason. Just you.' },
  { id: 'love', emoji: '❤️', label: 'I love you', heading: 'I Love', headingB: 'You', greeting: 'I love you', tag: 'Someone wanted you to know' },
  { id: 'anniv', emoji: '🥂', label: 'Our anniversary', heading: 'Happy', headingB: 'Anniversary', greeting: 'Happy Anniversary', tag: 'Happy anniversary' },
  { id: 'bday', emoji: '🎂', label: 'Her birthday', heading: 'Happy', headingB: 'Birthday', greeting: 'Happy Birthday', tag: 'Happy birthday' },
  { id: 'val', emoji: '🌹', label: 'Valentine’s', heading: 'Happy', headingB: 'Valentine’s Day', greeting: 'Happy Valentine’s Day', tag: 'Happy Valentine’s Day' },
  { id: 'gfday', emoji: '💕', label: 'Girlfriend’s Day', heading: 'Happy', headingB: 'Girlfriend’s Day', greeting: 'Happy Girlfriend’s Day', tag: 'Happy Girlfriend’s Day' },
];

export const KINDS = [
  { id: 'gf', emoji: '💕', label: 'My girlfriend', phrase: 'my girlfriend' },
  { id: 'love', emoji: '💘', label: 'Love of my life', phrase: 'the love of my life' },
  { id: 'ld', emoji: '🌍', label: 'Long distance', phrase: 'my long-distance love' },
  { id: 'bff', emoji: '🤍', label: 'Best friend too', phrase: 'my best friend and my girlfriend' },
  { id: 'fiancee', emoji: '💍', label: 'My fiancée', phrase: 'my fiancée' },
  { id: 'partner', emoji: '🤝', label: 'My partner', phrase: 'my partner in everything' },
];

// colors become CSS custom properties via lib/theme.js
export const VIBES = [
  { id: 'soft', emoji: '🌙', label: 'Soft & quiet', sub: 'Long hugs and late-night talks',
    colors: { bg: '#fdeef2', bg2: '#f6d5e3', ink: '#4a2340', accent: '#d9578a', accent2: '#a86bc4', card: '#fff8fa' } },
  { id: 'silly', emoji: '🤪', label: 'Silly & loud', sub: 'Inside jokes nobody else gets',
    colors: { bg: '#fff4d6', bg2: '#ffd9e6', ink: '#3d2a4f', accent: '#ff6f91', accent2: '#ffb100', card: '#fffdf5' } },
  { id: 'fire', emoji: '🔥', label: 'Still butterflies', sub: 'You still make me nervous',
    colors: { bg: '#2a0f1f', bg2: '#531b3a', ink: '#ffe9ef', accent: '#ff4d6d', accent2: '#ff9a62', card: '#3a1629' } },
  { id: 'ride', emoji: '🛡️', label: 'Ride or die', sub: 'One call and I am already there',
    colors: { bg: '#1d1633', bg2: '#35275f', ink: '#f2ebff', accent: '#b78cff', accent2: '#ff8fb8', card: '#2a2047' } },
];

export const SEALS = [
  { id: 'heart', emoji: '💞', label: 'a heart seal' }, { id: 'kiss', emoji: '💋', label: 'sealed with a kiss' },
  { id: 'rose', emoji: '🌹', label: 'a rose seal' }, { id: 'fire', emoji: '🔥', label: 'a fire seal' },
  { id: 'infinity', emoji: '♾️', label: 'a forever seal' },
];
export const STICKERS = [
  { id: 'love', emoji: '🥰', label: 'Smitten' }, { id: 'kiss', emoji: '😘', label: 'A kiss' },
  { id: 'teary', emoji: '🥹', label: 'Teary' }, { id: 'eyes', emoji: '😍', label: 'Heart eyes' },
  { id: 'bear', emoji: '🧸', label: 'Teddy' },
];

export const NOTE_SUGGESTIONS = [
  'You make ordinary days feel like something',
  'The way you laugh at your own jokes',
  'You always know when something is off',
  'You feel like home',
  'You never make me earn your kindness',
  'The way you look at me when I am not looking',
  'You are the best part of my day',
  'You make me want to be better',
];
export const PROMISE_SUGGESTIONS = [
  'Never go to bed angry',
  'Say the hard thing, gently',
  'Always share the last bite',
  'Hold your hand in every crowd',
  'Choose you again, every ordinary morning',
  'Answer the phone at 3am, always',
  'Pick you first. Every time.',
];
export const FIRST_LINE_SUGGESTIONS = [
  'I was thinking about you.',
  'You are my favourite person.',
  'Still you. Always you.',
  'I made you something.',
  'Every day, it is you.',
];
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
