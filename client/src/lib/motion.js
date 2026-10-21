import gsap from 'gsap';

export const reduced = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const haptic = (ms = 12) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/** Stagger children of `el` (matching `sel`) up and in. Returns the tween (or null under reduced motion). */
export function revealIn(el, sel = '[data-reveal]', opts = {}) {
  if (!el) return null;
  const targets = el.querySelectorAll(sel);
  if (reduced()) { gsap.set(targets, { opacity: 1, y: 0, scale: 1, filter: 'none' }); return null; }
  return gsap.fromTo(targets,
    { opacity: 0, y: 24, scale: .98, filter: 'blur(6px)' },
    { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: .8, ease: 'power3.out', stagger: .09, ...opts });
}

/** Type `text` into `el` one character at a time. Returns a cancel function. Tap-to-skip: call cancel(true). */
export function typeText(el, text, { speed = 26, onDone } = {}) {
  if (!el) return () => {};
  if (reduced()) { el.textContent = text; onDone && onDone(); return () => {}; }
  let i = 0, t = 0, dead = false;
  const step = () => {
    if (dead) return;
    el.textContent = text.slice(0, ++i);
    if (i < text.length) t = setTimeout(step, text[i - 1] === '.' || text[i - 1] === ',' ? speed * 6 : speed);
    else onDone && onDone();
  };
  el.textContent = ''; step();
  return (finish) => { dead = true; clearTimeout(t); if (finish) { el.textContent = text; onDone && onDone(); } };
}

/** Burst of small particles (hearts/sparkles) from a point inside `host` (position:relative). */
export function burst(host, { x = '50%', y = '50%', glyphs = ['♥', '✦', '❀', '♡'], count = 18, colors = ['#E23B67', '#F0A93B', '#FF9DBA', '#B23A76'] } = {}) {
  if (!host || reduced()) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.textContent = glyphs[i % glyphs.length];
    Object.assign(s.style, { position: 'absolute', left: x, top: y, color: colors[i % colors.length], fontSize: `${12 + Math.random() * 16}px`, pointerEvents: 'none', zIndex: 30, willChange: 'transform,opacity' });
    host.appendChild(s);
    const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 160;
    gsap.fromTo(s, { x: 0, y: 0, scale: .2, opacity: 1, rotate: 0 },
      { x: Math.cos(a) * d, y: Math.sin(a) * d - 40, scale: 1, opacity: 0, rotate: (Math.random() - .5) * 180, duration: 1.1 + Math.random() * .6, ease: 'power2.out', onComplete: () => s.remove() });
  }
}
