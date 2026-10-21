import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import PaperGrain from '../../art/PaperGrain.jsx';
import { reduced, haptic, revealIn, burst } from '../../lib/motion.js';
import { ConfettiRain, RoomDots, sfx } from './Finale.jsx';
import './finale.css';

/* Wobbly hand-drawn box, slightly different per row so they do not look stamped out. */
const boxPath = (i) => {
  const j = (n) => Math.abs((Math.sin(i * 12.9 + n * 78.2) * 43758.5) % 1) * 1.6;
  return `M${4 + j(1)} ${5 + j(2)} C 12 ${3 + j(3)}, 22 ${4 + j(4)}, ${29 + j(5)} ${4 + j(6)}`
    + ` C ${30 + j(7)} 12, 29 22, ${29 + j(8)} ${29 + j(9)}`
    + ` C 21 ${30 + j(10)}, 11 29, ${4 + j(11)} ${29 + j(12)}`
    + ` C ${3 + j(13)} 21, 4 12, ${4 + j(1)} ${5 + j(2)}`;
};

export default function Room5Promises({ gift = {}, onNext, roomIndex, roomCount }) {
  const list = (gift.promises || []).map((s) => String(s || '').trim()).filter(Boolean);
  const her = gift.herName || 'you';
  const you = gift.yourName || 'me';
  const [ticked, setTicked] = useState(() => list.map(() => false));
  const [sealed, setSealed] = useState(false);
  const [rain, setRain] = useState(false);
  const rootRef = useRef(null);
  const certRef = useRef(null);
  const stampRef = useRef(null);
  const fired = useRef(false);
  const timers = useRef([]);

  const count = ticked.filter(Boolean).length;
  const allDone = count === list.length;

  useEffect(() => {
    revealIn(rootRef.current, '[data-reveal]');
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const toggle = (i, e) => {
    if (sealed) return;
    const on = !ticked[i];
    setTicked((t) => t.map((v, k) => (k === i ? on : v)));
    haptic(on ? 12 : 6);
    if (!on) return;
    sfx('pop');
    const cert = certRef.current;
    const box = e.currentTarget.querySelector('.om-fn-check');
    if (cert && box) {
      const a = cert.getBoundingClientRect(), b = box.getBoundingClientRect();
      burst(cert, {
        x: `${b.left - a.left + b.width / 2}px`, y: `${b.top - a.top + b.height / 2}px`,
        glyphs: ['♥', '♡', '♥'], count: 8, colors: ['#E23B67', '#FF9DBA', '#B23A76'],
      });
    }
  };

  const next = () => {
    if (fired.current) return;
    fired.current = true;
    onNext && onNext();
  };

  const seal = () => {
    if (!allDone || sealed) return;
    setSealed(true);
    setRain(true);
    const stamp = stampRef.current, cert = certRef.current;
    if (reduced() || !stamp) {
      if (stamp) gsap.set(stamp, { opacity: 0.92, scale: 1, rotate: -14 });
      sfx('chime');
      timers.current.push(setTimeout(next, 1500));
      return;
    }
    const thump = () => {
      sfx('pop');
      haptic(30);
      if (cert) {
        const a = cert.getBoundingClientRect(), b = stamp.getBoundingClientRect();
        burst(cert, {
          x: `${b.left - a.left + b.width / 2}px`, y: `${b.top - a.top + b.height / 2}px`,
          glyphs: ['•', '·', '∙', '•'], count: 22, colors: ['#C9B79A', '#B8A385', '#E6D8BF', '#A88F6E'],
        });
      }
    };
    gsap.timeline({ onComplete: () => { sfx('chime'); timers.current.push(setTimeout(next, 1300)); } })
      .fromTo(stamp, { opacity: 0, scale: 2.5, rotate: -30 }, { opacity: 0.92, scale: 1, rotate: -14, duration: 0.42, ease: 'power4.in' })
      .add(thump)
      .to(cert, { x: -7, y: 3, rotate: -0.6, duration: 0.05, ease: 'none' })
      .to(cert, { x: 6, y: -2, rotate: 0.5, duration: 0.05, ease: 'none' })
      .to(cert, { x: -4, y: 1, rotate: -0.3, duration: 0.05, ease: 'none' })
      .to(cert, { x: 2, y: 0, rotate: 0.2, duration: 0.05, ease: 'none' })
      .to(cert, { x: 0, y: 0, rotate: 0, duration: 0.12, ease: 'power2.out' })
      .fromTo(stamp, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: 'back.out(3)' }, '<');
  };

  const label = sealed ? 'Sealed ✓' : allDone ? 'Make it official ✍️' : `Tick every promise (${count}/${list.length})`;

  return (
    <section className="om-scene om-fn-room om-fn-r5" ref={rootRef}>
      <PaperGrain />
      {rain && <ConfettiRain count={44} once />}
      <div className="om-fn-inner">
        <header className="om-fn-head">
          <p className="om-fn-eyebrow" data-reveal>Room 5 · The promises</p>
          <h1 className="om-fn-h1" data-reveal>Tick the ones you’ll <span className="om-accent">hold on to</span>.</h1>
        </header>

        <div className="om-fn-cert" ref={certRef} data-reveal>
          <h2 className="om-fn-cert-title">Our Promises</h2>
          <p className="om-fn-cert-sub">between {her} and {you}</p>

          <ul className="om-fn-clauses">
            {list.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={ticked[i]}
                  className={`om-fn-clause${ticked[i] ? ' is-on' : ''}`}
                  onClick={(e) => toggle(i, e)}
                  disabled={sealed}
                >
                  <svg className="om-fn-check" viewBox="0 0 34 34" aria-hidden="true">
                    <path className="om-fn-check-fill" d={boxPath(i + 1)} />
                    <path className="om-fn-check-box" d={boxPath(i + 1)} />
                    <path className="om-fn-check-mark" pathLength="1" d="M9 17.5 C 11 19.5, 12.5 21.5, 14.5 24.5 C 17.5 17.5, 21.5 12, 27 7.5" />
                  </svg>
                  <span className="om-fn-clause-t">{i + 1}. {p}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="om-fn-sigs">
            <div className="om-fn-sig"><span className="om-fn-sig-name">{gift.herName || 'You'}</span><span className="om-fn-sig-line" /></div>
            <div className="om-fn-sig"><span className="om-fn-sig-name">{gift.yourName || 'Me'}</span><span className="om-fn-sig-line" /></div>
          </div>

          <div className="om-fn-stamp" ref={stampRef} aria-hidden={!sealed}>
            <b>Sealed</b>
            <small>with love</small>
          </div>
        </div>

        <div className="om-fn-tail" data-reveal>
          <button
            type="button"
            className={`om-fn-cta${sealed ? ' is-sealed' : ''}`}
            onClick={seal}
            disabled={!allDone || sealed}
            aria-live="polite"
          >
            {label}
          </button>
        </div>
        <RoomDots index={roomIndex} count={roomCount} />
      </div>
    </section>
  );
}
