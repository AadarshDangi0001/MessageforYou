import gsap from 'gsap';
import { reduced } from '../../lib/motion.js';

const rand = (a, b) => a + Math.random() * (b - a);

/**
 * Confetti strips + rose petals that fly up out of a point, then flutter down with gravity.
 * `host` must be position:relative (or absolute). x/y are px inside host.
 */
export function confettiBurst(host, x, y, { count = 46, petals = 16 } = {}) {
  if (!host || reduced()) return;
  const colors = ['#FF7FA3', '#E23B67', '#F0A93B', '#FFD27A', '#B23A76', '#FFC2D4', '#9ED3B0'];
  const w = host.clientWidth || 360;
  const spread = Math.min(w * 0.55, 320);
  const total = count + petals;
  for (let i = 0; i < total; i++) {
    const petal = i >= count;
    const el = document.createElement('span');
    el.className = petal ? 'om-fx-petal' : 'om-fx-confetti';
    if (!petal) {
      el.style.background = colors[i % colors.length];
      el.style.width = `${rand(6, 10)}px`;
      el.style.height = `${rand(10, 16)}px`;
      el.style.borderRadius = Math.random() > 0.6 ? '50%' : '2px';
    } else {
      const s = rand(12, 20);
      el.style.width = `${s}px`; el.style.height = `${s * 0.78}px`;
      el.style.background = `radial-gradient(circle at 30% 30%, #FFD6E2, ${Math.random() > 0.5 ? '#F07A9C' : '#D8456B'})`;
    }
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    host.appendChild(el);
    const a = rand(-Math.PI * 0.92, -Math.PI * 0.08);
    const up = rand(0.5, 1) * spread;
    const dx = Math.cos(a) * up;
    const peakY = Math.sin(a) * up;
    const fall = rand(160, 340);
    const dur = petal ? rand(2.2, 3) : rand(1.5, 2.2);
    gsap.timeline({ onComplete: () => el.remove() })
      .fromTo(el, { x: 0, y: 0, scale: 0.3, rotation: rand(0, 180), opacity: 1 },
        { x: dx, y: peakY, scale: 1, duration: 0.55, ease: 'power3.out' })
      .to(el, {
        x: dx + rand(-60, 60), y: peakY + fall, rotation: `+=${rand(160, 540)}`,
        rotationX: petal ? rand(120, 360) : rand(200, 700),
        duration: dur, ease: 'power1.in',
      }, 0.5)
      .to(el, { opacity: 0, duration: 0.5, ease: 'power1.in' }, 0.5 + dur - 0.5);
  }
}

/** Big glyph hearts blowing outward from a point. */
export function heartBurst(host, x, y, { count = 22, colors = ['#FF5F86', '#E23B67', '#FFA9C4', '#D8456B', '#F0A93B'] } = {}) {
  if (!host || reduced()) return;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'om-fx-heart';
    el.textContent = i % 5 === 4 ? '✦' : '♥';
    el.style.color = colors[i % colors.length];
    el.style.fontSize = `${rand(16, 40)}px`;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    host.appendChild(el);
    const a = rand(0, Math.PI * 2), d = rand(90, Math.min(260, (host.clientWidth || 360) * 0.6));
    gsap.timeline({ onComplete: () => el.remove() })
      .fromTo(el, { x: 0, y: 0, scale: 0.2, opacity: 1, rotation: 0 },
        { x: Math.cos(a) * d, y: Math.sin(a) * d - rand(10, 50), scale: rand(0.8, 1.3), rotation: rand(-90, 90), duration: rand(0.8, 1.2), ease: 'power3.out' })
      .to(el, { opacity: 0, y: '+=30', duration: 0.5, ease: 'power1.in' }, rand(0.45, 0.7));
  }
}

/** Splits text into per-letter spans grouped by word (words never break mid-way). */
export function splitWords(text) {
  return String(text).split(/(\s+)/).filter(Boolean).map((w, wi) => (
    /^\s+$/.test(w) ? { space: true, key: `s${wi}` } : { key: `w${wi}`, letters: Array.from(w) }
  ));
}
