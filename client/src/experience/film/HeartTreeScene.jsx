import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import HeartTree from '../../art/HeartTree.jsx';
import { OCCASIONS } from '../../config/options.js';
import { reduced, haptic } from '../../lib/motion.js';
import './film.css';

/** Scene 6: bokeh light, a tree grows and blooms a heart-shaped canopy; a glass panel holds the greeting. */
export default function HeartTreeScene({ gift, onNext }) {
  const root = useRef(null);
  const [grown, setGrown] = useState(() => reduced());
  const [bloom, setBloom] = useState(() => reduced());
  const ready = useRef(reduced());
  const done = useRef(false);
  const occ = OCCASIONS.find((o) => o.id === gift.occasion) || OCCASIONS[0];
  const greeting = occ.greeting || "It's always been you";

  const bokeh = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: `${(i * 37 + 7) % 100}%`, top: `${(i * 53 + 11) % 100}%`,
    size: 40 + ((i * 29) % 110), delay: -(i * 1.7), dur: 14 + (i % 5) * 3,
    tone: i % 3,
  })), []);
  const falling = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    left: `${12 + ((i * 41) % 76)}%`, delay: 2.4 + i * 0.9, dur: 7 + (i % 4) * 1.6, size: 12 + (i % 4) * 5,
    color: ['#F27AA5', '#D6338A', '#F8846A', '#F6C25A'][i % 4],
  })), []);

  useLayoutEffect(() => {
    if (reduced()) return undefined;
    const q = gsap.utils.selector(root);
    const ctx = gsap.context(() => {
      gsap.timeline()
        // the golden bloom from the previous scene fades away
        .fromTo(q('.om-tree-bloomout'), { opacity: 1 }, { opacity: 0, duration: 1.1, ease: 'power2.out' }, 0)
        .add(() => setGrown(true), 0.25)          // trunk rises, branches draw (CSS transitions in the art)
        .add(() => setBloom(true), 1.45)          // ~140 hearts pop in, staggered top → bottom
        .fromTo(q('.om-tree-art'), { scale: 0.96, y: 10 }, { scale: 1, y: 0, duration: 3.2, ease: 'sine.out' }, 0.2)
        .fromTo(q('.om-tree-panel'), { opacity: 0, x: -24, filter: 'blur(10px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' }, 1.6)
        .fromTo(q('.om-tree-pre'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 1.9)
        .fromTo(q('.om-tree-greet'), { opacity: 0, y: 18, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.6)' }, 2.2)
        .fromTo(q('.om-tree-post'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 2.9)
        .fromTo(q('.om-tree-hint'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 3.5)
        .add(() => { ready.current = true; }, 1.2);
      // the whole tree breathes gently
      gsap.to(q('.om-tree-sway'), { rotation: 1.2, duration: 3.4, yoyo: true, repeat: -1, ease: 'sine.inOut', transformOrigin: '50% 100%', delay: 3.4 });
    }, root);
    return () => ctx.revert();
  }, []);

  const go = () => {
    if (!ready.current || done.current) return;
    done.current = true;
    haptic(12);
    onNext();
  };

  return (
    <section className="om-scene om-film om-film-tree" ref={root} onClick={go}>
      <div className="om-tree-bg" aria-hidden="true">
        {bokeh.map((b, i) => (
          <span key={i} className={`om-bokeh om-bokeh--${b.tone}`}
            style={{ left: b.left, top: b.top, width: b.size, height: b.size, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }} />
        ))}
      </div>
      <div className="om-tree-layout">
        <div className="om-tree-art" aria-hidden="true">
          <div className="om-tree-sway"><HeartTree grown={grown} bloom={bloom} /></div>
          {bloom && falling.map((f, i) => (
            <span key={i} className="om-tree-fall"
              style={{ left: f.left, fontSize: f.size, color: f.color, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }}>♥</span>
          ))}
        </div>
        <div className="om-tree-panel">
          <p className="om-tree-pre">made for you, by hand</p>
          <h1 className="om-tree-greet">{greeting}</h1>
          <p className="om-tree-post">and every ordinary day with you</p>
        </div>
      </div>
      <p className="om-tree-hint">tap anywhere to keep going</p>
      <div className="om-tree-bloomout" aria-hidden="true" />
    </section>
  );
}
