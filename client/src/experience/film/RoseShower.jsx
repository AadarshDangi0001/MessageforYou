import { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { RoseSymbolDefs } from '../../art/Rose.jsx';
import { reduced } from '../../lib/motion.js';
import './film.css';

const COLORS = ['pink', 'coral', 'white'];

/** Jittered grid of roses that, once all landed, covers the viewport. 60–90 instances. */
function layout() {
  const W = typeof window !== 'undefined' ? window.innerWidth : 390;
  const H = typeof window !== 'undefined' ? window.innerHeight : 844;
  let size = Math.max(84, Math.min(180, Math.sqrt((W * H) / 70) * 1.25));
  let cols, rows;
  for (let k = 0; k < 6; k++) {
    cols = Math.ceil(W / (size * 0.62)) + 1;
    rows = Math.ceil(H / (size * 0.62)) + 1;
    if (cols * rows <= 90) break;
    size *= 1.12;
  }
  const out = [];
  const cw = W / (cols - 1), rh = H / (rows - 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const s = size * (0.82 + Math.random() * 0.4);
      out.push({
        x: c * cw + (Math.random() - 0.5) * cw * 0.6 - s / 2,
        y: r * rh + (Math.random() - 0.5) * rh * 0.6 - s / 2,
        s,
        rot: Math.random() * 360,
        color: COLORS[(r * 7 + c * 3 + Math.floor(Math.random() * 3)) % 3],
        // roses land bottom-up so they "pile" from the floor to the top
        order: (rows - r) + Math.random() * 1.6,
      });
    }
  }
  return out.sort((a, b) => a.order - b.order);
}

/** Transition after the gift: roses rain down and pile up until they cover the screen, then clear. */
export default function RoseShower({ onNext }) {
  const root = useRef(null);
  const roses = useMemo(layout, []);

  useLayoutEffect(() => {
    if (reduced()) { const t = setTimeout(onNext, 350); return () => clearTimeout(t); }
    const q = gsap.utils.selector(root);
    const H = window.innerHeight;
    const els = q('.om-rose');
    let called = false;
    const next = () => { if (!called) { called = true; onNext(); } };
    const ctx = gsap.context(() => {
      gsap.timeline({ delay: 0.35 })
        .fromTo(els,
          { y: (i) => -(roses[i].y + roses[i].s + H * (0.15 + Math.random() * 0.25)), rotation: (i) => roses[i].rot - 120, opacity: 1, scale: 0.9 },
          { y: 0, rotation: (i) => roses[i].rot, scale: 1, duration: 0.85, ease: 'bounce.out', stagger: { each: 1.5 / els.length } })
        .to({}, { duration: 0.45 }) // hold, fully covered
        .to(els, {
          y: () => H * (1.05 + Math.random() * 0.4),
          rotation: () => `+=${(Math.random() - 0.5) * 220}`,
          opacity: 0,
          duration: 1.0,
          ease: 'power2.in',
          stagger: { each: 0.9 / els.length, from: 'end' },
        })
        .add(next, '-=0.7');
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="om-scene om-film om-film-roses" ref={root} aria-label="Roses">
      <RoseSymbolDefs />
      <div className="om-roses-field" aria-hidden="true">
        {roses.map((r, i) => (
          <svg
            key={i}
            className="om-rose"
            viewBox="-50 -50 100 100"
            style={{ left: r.x, top: r.y, width: r.s, height: r.s, transform: `rotate(${r.rot}deg)` }}
          >
            <use href={`#om-rose-${r.color}`} width="100" height="100" x="-50" y="-50" />
          </svg>
        ))}
      </div>
    </section>
  );
}
