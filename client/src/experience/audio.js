// Sound for the recipient experience.
// - Background music: a user-supplied file (VITE_BGM_URL or /music/bgm.mp3) looped at 0.4,
//   otherwise a generated, soft music-box loop (I–V–vi–IV at 72bpm, bell timbre, convolver reverb).
// - Voice notes (HTMLAudio) duck the music while they play.
// - Small WebAudio sound effects: knock(), pop(), chime().
// Everything is a silent no-op when WebAudio is unavailable. The on/off preference is remembered.

const PREF_KEY = 'om-sound';
const MUSIC_VOL = 0.4;
const DUCK_VOL = 0.07;
const FADE_IN = 2;

let ctx = null;
let master = null;   // music bus -> destination
let sfxBus = null;   // effects bus -> destination
let reverb = null;   // convolver shared by music + chime
let started = false; // start() has been called (first gesture happened)
let playing = false;
let ducked = false;
let fileBuf = null;  // decoded user-supplied loop (if any)
let fileProbe = null;
let fileSrc = null;
let schedTimer = 0;
let nextTime = 0;
let step = 0;
let voice = null;

function readPref() {
  try { return localStorage.getItem(PREF_KEY) !== '0'; } catch (e) { return true; }
}
function writePref(on) {
  try { localStorage.setItem(PREF_KEY, on ? '1' : '0'); } catch (e) { /* private mode */ }
}
let enabled = readPref();

function ensureCtx() {
  if (ctx) return ctx;
  const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!AC) return null;
  try { ctx = new AC(); } catch (e) { return null; }
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(ctx.destination);
  reverb = ctx.createConvolver(); reverb.buffer = impulse(2.8, 2.6);
  const wet = ctx.createGain(); wet.gain.value = 0.42;
  reverb.connect(wet); wet.connect(master);
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else if (playing || voice) ctx.resume().catch(() => {});
    });
  }
  return ctx;
}

// Generated impulse: stereo noise with an exponential tail, gently low-passed by averaging.
function impulse(seconds, decay) {
  const rate = ctx.sampleRate, len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const n = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      last = last * 0.55 + n * 0.45;
      d[i] = last;
    }
  }
  return buf;
}

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

/* ---------------- music box ---------------- */
const BPM = 72;
const EIGHTH = 60 / BPM / 2;
// C major, I–V–vi–IV twice. Melody in eighth notes (null = rest), pentatonic/diatonic.
const CHORDS = [
  [48, 55, 64, 67], [43, 50, 59, 62], [45, 52, 60, 64], [41, 48, 57, 60],
];
const MELODY = [
  [76, null, 79, null, 84, null, 79, null],
  [74, null, 79, null, 83, null, 79, 74],
  [72, null, 76, null, 81, null, 79, 76],
  [77, null, 81, null, 84, null, 81, null],
  [84, null, 83, 79, 76, null, 79, null],
  [74, null, 79, 81, 79, null, 74, null],
  [76, null, 72, null, 69, null, 72, 76],
  [77, null, 76, null, 72, null, null, null],
];

function bell(t, freq, vol, dur = 1.8, dest) {
  const out = ctx.createGain();
  out.gain.setValueAtTime(0.0001, t);
  out.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200;
  out.connect(lp); lp.connect(dest || master); lp.connect(reverb);
  // fundamental + slightly detuned twin (shimmer) + quick metallic partial
  const parts = [[1, 1, dur], [1.0035, 0.45, dur * 0.9], [2.0, 0.22, dur * 0.45], [3.01, 0.08, dur * 0.22]];
  parts.forEach(([ratio, g, d]) => {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = freq * ratio;
    const pg = ctx.createGain();
    pg.gain.setValueAtTime(g, t);
    pg.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(pg); pg.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  });
}

function pad(t, freq, vol, dur) {
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
  o.connect(g); g.connect(lp); lp.connect(master); lp.connect(reverb);
  o.start(t); o.stop(t + dur + 0.05);
}

function scheduleStep(t, s) {
  const bar = Math.floor(s / 8) % MELODY.length;
  const slot = s % 8;
  const chord = CHORDS[bar % 4];
  const human = (Math.random() - 0.5) * 0.012;
  const note = MELODY[bar][slot];
  if (note != null) bell(t + human, mtof(note), slot % 2 === 0 ? 0.16 : 0.11, 2.2);
  if (slot === 0) pad(t, mtof(chord[0]), 0.12, EIGHTH * 8);
  if (slot % 2 === 0) { // soft broken-chord accompaniment on quarter notes
    const tone = chord[1 + (slot / 2) % 3] + 12;
    bell(t + 0.004, mtof(tone), 0.045, 1.2);
  }
}

function scheduler() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.25) {
    scheduleStep(nextTime, step);
    step++;
    nextTime += EIGHTH;
  }
}

/* ---------------- user file ---------------- */
let fileNode = null;
function probeFile() {
  if (fileProbe) return fileProbe;
  const envUrl = import.meta.env && import.meta.env.VITE_BGM_URL;
  const candidates = envUrl ? [envUrl, '/music/bgm.mp3'] : ['/music/bgm.mp3'];
  fileProbe = (async () => {
    for (const url of candidates) {
      try {
        const res = await fetch(url);
        const type = res.headers.get('content-type') || '';
        if (!res.ok || /text\/html/.test(type)) continue; // SPA fallback, not audio
        const data = await res.arrayBuffer();
        fileBuf = await new Promise((ok, bad) => ctx.decodeAudioData(data, ok, bad));
        fileSrc = url;
        return fileBuf;
      } catch (e) { /* try next */ }
    }
    return null;
  })();
  return fileProbe;
}

function targetVol() { return ducked ? DUCK_VOL : (fileBuf ? MUSIC_VOL : 0.55); }

function rampMaster(v, secs) {
  if (!master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), t);
  master.gain.exponentialRampToValueAtTime(Math.max(0.0001, v), t + secs);
}

async function beginPlayback() {
  if (playing || !ensureCtx()) return;
  playing = true;
  ctx.resume().catch(() => {});
  master.gain.setValueAtTime(0.0001, ctx.currentTime);
  const buf = await probeFile();
  if (!playing) return; // stopped while probing
  if (buf) {
    fileNode = ctx.createBufferSource();
    fileNode.buffer = buf; fileNode.loop = true;
    fileNode.connect(master);
    fileNode.start();
  } else {
    nextTime = ctx.currentTime + 0.08; step = 0;
    scheduler();
    schedTimer = setInterval(scheduler, 90);
  }
  rampMaster(targetVol(), FADE_IN);
}

function endPlayback(fade = 0.8) {
  if (!playing) return;
  playing = false;
  clearInterval(schedTimer); schedTimer = 0;
  if (!ctx) return;
  rampMaster(0.0001, fade);
  const n = fileNode; fileNode = null;
  if (n) setTimeout(() => { try { n.stop(); } catch (e) {} }, fade * 1000 + 60);
}

/* ---------------- sound effects ---------------- */
function sfxReady() {
  if (!enabled || !ensureCtx()) return false;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return true;
}

function noiseBuffer(secs) {
  const len = Math.floor(ctx.sampleRate * secs);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** A short wooden knock: band-passed noise click + a low pitched-down thump. */
function knock() {
  if (!sfxReady()) return;
  const t = ctx.currentTime + 0.005;
  const n = ctx.createBufferSource(); n.buffer = noiseBuffer(0.12);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 820 + Math.random() * 120; bp.Q.value = 3.2;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.9, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  n.connect(bp); bp.connect(ng); ng.connect(sfxBus);
  n.start(t); n.stop(t + 0.12);

  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(58, t + 0.13);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.85, t + 0.004);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
  o.connect(og); og.connect(lp); lp.connect(sfxBus);
  o.start(t); o.stop(t + 0.2);
}

/** A soft bubbly pop. */
function pop() {
  if (!sfxReady()) return;
  const t = ctx.currentTime + 0.005;
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(980, t + 0.07);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
  o.connect(g); g.connect(sfxBus);
  o.start(t); o.stop(t + 0.15);
}

/** A sparkly three-note bell chime. */
function chime() {
  if (!sfxReady()) return;
  const t = ctx.currentTime + 0.01;
  [84, 88, 91, 96].forEach((m, i) => bell(t + i * 0.075, mtof(m), 0.13 - i * 0.015, 1.6, sfxBus));
}

/** A slow wooden door creak: a wobbling, resonant sawtooth through a narrow band-pass. */
function creak() {
  if (!sfxReady()) return;
  const t = ctx.currentTime + 0.01, dur = 1.1;
  const o = ctx.createOscillator(); o.type = 'sawtooth';
  o.frequency.setValueAtTime(70, t);
  o.frequency.linearRampToValueAtTime(110, t + dur * 0.4);
  o.frequency.linearRampToValueAtTime(82, t + dur);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 23;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 9;
  lfo.connect(lfoGain); lfoGain.connect(o.frequency);
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 680; bp.Q.value = 7;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.32, t + 0.12);
  g.gain.setValueAtTime(0.28, t + dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(bp); bp.connect(g); g.connect(sfxBus); g.connect(reverb);
  o.start(t); lfo.start(t); o.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
}

/** A tiny soft tick (checkbox / UI feedback). */
function tick() {
  if (!sfxReady()) return;
  const t = ctx.currentTime + 0.003;
  const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(1800, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.03);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g); g.connect(sfxBus);
  o.start(t); o.stop(t + 0.06);
}

/* ---------------- voice notes ---------------- */
function duck(on) {
  ducked = !!on;
  if (playing && master) rampMaster(targetVol(), on ? 0.35 : 0.9);
}

function stopVoice() {
  if (!voice) return;
  const v = voice; voice = null;
  try { v.pause(); } catch (e) {}
  duck(false);
}

/** Plays a voice note, ducking the music meanwhile. Returns the HTMLAudioElement (or null). */
function playVoice(url, { onEnd } = {}) {
  if (!url) return null;
  stopVoice();
  const a = new Audio(url);
  voice = a;
  duck(true);
  let done = false;
  const end = () => {
    if (done) return; done = true;
    if (voice === a) { voice = null; duck(false); }
    onEnd && onEnd();
  };
  a.addEventListener('ended', end);
  a.addEventListener('error', end);
  const p = a.play();
  if (p && p.catch) p.catch(end);
  return a;
}

/* ---------------- public api ---------------- */
export const music = {
  /** Call from the first user gesture (the gift tap). Plays only if the visitor hasn't muted. */
  start() {
    started = true;
    if (!ensureCtx()) return;
    ctx.resume().catch(() => {});
    if (enabled) beginPlayback();
  },
  stop(fade = 0.8) { started = false; endPlayback(fade); },
  /** Flips the remembered preference. Returns the new state. */
  toggle() {
    enabled = !enabled;
    writePref(enabled);
    if (enabled) { started = true; ensureCtx(); beginPlayback(); }
    else endPlayback(0.4);
    return enabled;
  },
  isOn() { return enabled; },
  isPlaying() { return playing; },
  hasStarted() { return started; },
  source() { return fileSrc || 'generated'; },
  duck,
  playVoice,
  stopVoice,
  knock,
  pop,
  chime,
  creak,
  tick,
};

export { playVoice, stopVoice, knock, pop, chime, creak, tick, duck };
export default music;
