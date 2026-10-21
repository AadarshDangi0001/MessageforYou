import { VIBES } from '../config/options.js';

export function applyTheme(vibeId, element) {
  const el = element || document.documentElement;
  const v = VIBES.find((x) => x.id === vibeId) || VIBES[0];
  const c = v.colors;
  el.style.setProperty('--om-bg', c.bg);
  el.style.setProperty('--om-bg2', c.bg2);
  el.style.setProperty('--om-ink', c.ink);
  el.style.setProperty('--om-accent', c.accent);
  el.style.setProperty('--om-accent2', c.accent2);
  el.style.setProperty('--om-card', c.card);
  return v;
}
