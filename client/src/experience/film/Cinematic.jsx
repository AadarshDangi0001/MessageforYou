import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { OCCASIONS } from '../../config/options.js';
import { reduced } from '../../lib/motion.js';
import { splitWords } from './fx.js';
import './film.css';

/** Font size for a Great Vibes line so its longest word always fits the width. */
function lineSize(text) {
  const longest = Math.max(4, ...String(text).split(/\s+/).map((w) => w.length));
  const vw = Math.min(19, 86 / (longest * 0.46));
  return `min(clamp(58px, ${vw.toFixed(2)}vw, 150px), ${vw.toFixed(2)}vw)`;
}

function Line({ text, cls }) {
  return (
    <span className={`om-cine-line ${cls}`} style={{ fontSize: lineSize(text) }} aria-hidden="true">
      {splitWords(text).map((w) => (w.space
        ? <span key={w.key} className="om-cine-space"> </span>
        : <span key={w.key} className="om-cine-word">{w.letters.map((l, i) => <span key={i} className="om-cine-ch">{l}</span>)}</span>))}
    </span>
  );
}

/** Scene 5: letterboxed magenta title card. The occasion heading writes on, then a golden bloom carries us on. */
export default function Cinematic({ gift, onNext }) {
  const root = useRef(null);
  const done = useRef(false);
  const tlRef = useRef(null);
  const occ = OCCASIONS.find((o) => o.id === gift.occasion) || OCCASIONS[0];
  const l1 = occ.heading || 'Just';
  const l2 = occ.headingB || 'Because';

  const finish = () => { if (!done.current) { done.current = true; onNext(); } };

  useLayoutEffect(() => {
    if (reduced()) { const t = setTimeout(finish, 3200); return () => clearTimeout(t); }
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.1 });
      tlRef.current = tl;
      tl.fromTo(q('.om-cine-bar--t'), { yPercent: -100 }, { yPercent: 0, duration: 0.6, ease: 'power2.out' }, 0)
        .fromTo(q('.om-cine-bar--b'), { yPercent: 100 }, { yPercent: 0, duration: 0.6, ease: 'power2.out' }, 0)
        .fromTo(q('.om-cine-glow'), { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 2.4, ease: 'sine.out' }, 0)
        .fromTo(q('.om-cine-pre'), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.45)
        .fromTo(q('.om-cine-l1 .om-cine-ch'),
          { opacity: 0, y: 26, rotation: -14, scale: 0.7, filter: 'blur(6px)' },
          { opacity: 1, y: 0, rotation: 0, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'back.out(1.7)', stagger: 0.07 }, 0.7)
        .fromTo(q('.om-cine-l2 .om-cine-ch'),
          { opacity: 0, y: 26, rotation: -14, scale: 0.7, filter: 'blur(6px)' },
          { opacity: 1, y: 0, rotation: 0, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'back.out(1.7)', stagger: 0.07 }, '-=0.25')
        .fromTo(q('.om-cine-swash path'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, '-=0.2')
        .fromTo(q('.om-cine-post'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.25')
        .addLabel('hold')
        .to({}, { duration: 1.3 })
        .addLabel('bloom')
        // the golden light-burst
        .fromTo(q('.om-cine-bloom'), { opacity: 0, scale: 0.02 }, { opacity: 1, scale: 1, duration: 0.75, ease: 'power2.in' })
        .to(q('.om-cine-bar'), { opacity: 0, duration: 0.3 }, '<0.35')
        .add(finish);
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // a tap jumps straight to the bloom once the title is on screen
  const skip = () => {
    const tl = tlRef.current;
    if (!tl || done.current) return;
    if (tl.time() < tl.labels.hold) tl.seek('hold');
    else if (tl.time() < tl.labels.bloom) tl.seek('bloom');
  };

  return (
    <section className="om-scene om-film om-film-cine" ref={root} onClick={skip}>
      <div className="om-cine-bg" aria-hidden="true"><span className="om-cine-glow" /></div>
      <div className="om-cine-bar om-cine-bar--t" aria-hidden="true" />
      <div className="om-cine-bar om-cine-bar--b" aria-hidden="true" />
      <div className="om-cine-body">
        <p className="om-cine-pre">this one is for you&hellip;</p>
        <h1 className="om-cine-title" aria-label={`${l1} ${l2}`}>
          <Line text={l1} cls="om-cine-l1" />
          <Line text={l2} cls="om-cine-l2" />
        </h1>
        <svg className="om-cine-swash" viewBox="0 0 200 14" aria-hidden="true">
          <path d="M4 9 C50 3 130 3 196 8 M70 11 C110 9 150 9 186 11" pathLength="1" />
        </svg>
        <p className="om-cine-post">to the best thing that ever happened to me</p>
      </div>
      <div className="om-cine-bloom" aria-hidden="true" />
    </section>
  );
}
