import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import GlossyHeart from '../../art/GlossyHeart.jsx';
import BowArrow from '../../art/BowArrow.jsx';
import { reduced, haptic } from '../../lib/motion.js';
import music from '../audio.js';
import { heartBurst, confettiBurst } from './fx.js';
import './film.css';

const ART_AIM = -42;   // BowArrow's built-in aim (degrees, screen space, arrow points +x then rotated)
const FIRE_AT = 0.2;   // minimum pull that counts as a shot

/** A tiny standalone arrow (points +x) that does the flying. */
function FlyingArrow() {
  return (
    <svg viewBox="0 0 140 28" width="100%" aria-hidden="true">
      <path d="M8 14 H122" stroke="#3B1524" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M8 14 H122" stroke="#B07A48" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10 14 Q17 2 32 4 L26 14 Z M10 14 Q17 26 32 24 L26 14 Z" fill="#F08FAE" stroke="#3B1524" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M137 14 C131 2 118 4 122 12 L122 16 C118 24 131 26 137 14 Z" fill="#F5C048" stroke="#3B1524" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

/** Scene 4: drag back on the bow, let go, the arrow curves into the heart, the heart bursts → first line. */
export default function Arrow({ gift, onNext }) {
  const root = useRef(null);
  const heartRef = useRef(null);
  const bowRef = useRef(null);
  const flyRef = useRef(null);
  const aimRef = useRef(null);
  const flashRef = useRef(null);
  const geo = useRef(null);
  const drag = useRef(null);
  const raf = useRef(0);
  const [pull, setPull] = useState(0);
  const [phase, setPhase] = useState('aim'); // aim | flying | reveal
  const [fallback, setFallback] = useState(false);
  const fired = useRef(false);
  const doneRef = useRef(false);
  const you = (gift.yourName || '').trim();
  const firstLine = (gift.firstLine || '').trim() || 'I was thinking about you.';

  /** Bow & heart centres inside the scene, and the aim angle between them. */
  const measure = () => {
    const host = root.current.getBoundingClientRect();
    const b = bowRef.current.getBoundingClientRect();
    const h = heartRef.current.getBoundingClientRect();
    const bx = b.left + b.width / 2 - host.left, by = b.top + b.height / 2 - host.top;
    const hx = h.left + h.width / 2 - host.left, hy = h.top + h.height * 0.48 - host.top;
    const ang = Math.atan2(hy - by, hx - bx);
    geo.current = { bx, by, hx, hy, ang, dist: Math.hypot(hx - bx, hy - by), size: b.width };
    return geo.current;
  };

  const aimBow = () => {
    if (!bowRef.current || !heartRef.current || fired.current) return;
    const g = measure();
    const deg = (g.ang * 180) / Math.PI;
    gsap.set(bowRef.current.querySelector('.om-bow-rot'), { rotation: deg - ART_AIM });
  };

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    aimBow();
    const onResize = () => aimBow();
    window.addEventListener('resize', onResize);
    let ctx;
    if (!reduced()) {
      ctx = gsap.context(() => {
        gsap.timeline({ delay: 0.15 })
          .fromTo(q('.om-arrow-title'), { opacity: 0, y: -14, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' })
          .fromTo(q('.om-arrow-heart'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 1.1, ease: 'elastic.out(1, 0.5)' }, 0.2)
          .fromTo(q('.om-arrow-halo'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 1.4, ease: 'power2.out' }, 0.2)
          .fromTo(q('.om-arrow-bow'), { opacity: 0, x: -30, y: 30 }, { opacity: 1, x: 0, y: 0, duration: 0.8, ease: 'back.out(1.6)' }, 0.6)
          .fromTo(q('.om-arrow-label'), { opacity: 0, letterSpacing: '0.6em' }, { opacity: 1, letterSpacing: '0.32em', duration: 0.9, ease: 'power2.out' }, 0.9);
        // heartbeat while waiting
        gsap.timeline({ repeat: -1, repeatDelay: 0.7, delay: 1.4 })
          .to(q('.om-arrow-heart-in'), { scale: 1.08, duration: 0.14, ease: 'power2.out' })
          .to(q('.om-arrow-heart-in'), { scale: 0.98, duration: 0.16, ease: 'power2.in' })
          .to(q('.om-arrow-heart-in'), { scale: 1.05, duration: 0.12, ease: 'power2.out' })
          .to(q('.om-arrow-heart-in'), { scale: 1, duration: 0.3, ease: 'power2.inOut' });
        // the bow sways a little, inviting a pull
        gsap.to(q('.om-bow-bob'), { y: -5, rotation: -2, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 });
      }, root);
    }
    const t = setTimeout(() => setFallback(true), 4200);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); ctx && ctx.revert(); cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep the aim line in sync with pull
  useEffect(() => {
    const g = geo.current, el = aimRef.current;
    if (!g || !el) return;
    const len = g.dist * (0.25 + 0.75 * pull);
    el.style.left = `${g.bx}px`; el.style.top = `${g.by}px`;
    el.style.width = `${len}px`;
    el.style.transform = `rotate(${g.ang}rad)`;
    el.style.opacity = phase === 'aim' ? String(Math.min(1, pull * 1.6)) : '0';
  }, [pull, phase]);

  const reveal = () => {
    setPhase('reveal');
    const q = gsap.utils.selector(root);
    if (reduced()) return;
    gsap.timeline()
      .fromTo(q('.om-arrow-line'), { opacity: 0, y: 40, scale: 0.9, filter: 'blur(12px)' },
        { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.85, ease: 'power3.out' })
      .fromTo(q('.om-arrow-sign'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, '-=0.35')
      .fromTo(q('.om-arrow-next'), { opacity: 0 }, { opacity: 1, duration: 0.45 }, '+=0.4');
  };

  const fire = (strength) => {
    if (fired.current) return;
    fired.current = true;
    setFallback(false);
    haptic(20);
    if (reduced()) { setPull(0); setPhase('reveal'); return; }
    const g = measure();
    const q = gsap.utils.selector(root);
    setPhase('flying');
    gsap.killTweensOf(q('.om-bow-bob'));
    gsap.killTweensOf(q('.om-arrow-heart-in'));

    // string snaps back with a springy wobble
    const s = { v: strength };
    gsap.to(s, { v: 0, duration: 0.5, ease: 'elastic.out(1, 0.34)', onUpdate: () => setPull(s.v) });

    // the flight: a gentle arc sampled into x/y/rotation keyframes
    const fly = flyRef.current;
    const arrowLen = Math.max(70, g.size * 0.78);
    gsap.set(fly, { width: arrowLen, left: g.bx - arrowLen / 2, top: g.by - arrowLen * 0.1, opacity: 1, x: 0, y: 0, rotation: (g.ang * 180) / Math.PI });
    const ex = g.hx - Math.cos(g.ang) * arrowLen * 0.38 - g.bx;
    const ey = g.hy - Math.sin(g.ang) * arrowLen * 0.38 - g.by;
    // control point: perpendicular "up" from the midpoint (lob a little)
    let nx = -Math.sin(g.ang), ny = Math.cos(g.ang);
    if (ny > 0) { nx = -nx; ny = -ny; }
    const bend = g.dist * (0.16 - strength * 0.08);
    const cx = ex / 2 + nx * bend, cy = ey / 2 + ny * bend;
    const N = 12;
    const total = 0.34 + (1 - strength) * 0.22;
    const frames = [];
    for (let i = 1; i <= N; i++) {
      const t = i / N, u = 1 - t;
      const x = 2 * u * t * cx + t * t * ex, y = 2 * u * t * cy + t * t * ey;
      const dx = 2 * u * cx + 2 * t * (ex - cx), dy = 2 * u * cy + 2 * t * (ey - cy);
      frames.push({ x, y, rotation: (Math.atan2(dy, dx) * 180) / Math.PI, duration: total / N });
    }
    const heart = q('.om-arrow-heart-in');
    gsap.timeline({ onComplete: reveal })
      .to(fly, { keyframes: frames, ease: 'power1.in' }, 0.04)
      .add(() => { music.pop(); haptic(30); }, total + 0.04)
      // impact: squash, arrow quiver
      .to(heart, { scaleX: 1.16, scaleY: 0.86, x: Math.cos(g.ang) * 8, y: Math.sin(g.ang) * 8, duration: 0.07, ease: 'power2.out' }, total + 0.04)
      .to(heart, { scaleX: 1, scaleY: 1, x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' }, total + 0.11)
      .to(fly, { rotation: '+=5', duration: 0.05, yoyo: true, repeat: 5, ease: 'sine.inOut' }, total + 0.05)
      // swell, then burst
      .to(heart, { scale: 1.34, duration: 0.22, ease: 'power2.out' }, total + 0.6)
      .to(q('.om-arrow-halo'), { scale: 1.5, opacity: 1, duration: 0.3, ease: 'power2.out' }, total + 0.6)
      .add(() => {
        const host = root.current;
        heartBurst(host, g.hx, g.hy, { count: 26 });
        confettiBurst(host, g.hx, g.hy, { count: 26, petals: 6 });
        music.chime();
      }, total + 0.82)
      .to([heart, fly], { scale: 0.06, opacity: 0, duration: 0.28, ease: 'power2.in' }, total + 0.82)
      .fromTo(flashRef.current, { opacity: 0 }, { opacity: 0.9, duration: 0.09, ease: 'power1.out' }, total + 0.84)
      .to(flashRef.current, { opacity: 0, duration: 0.7, ease: 'power2.out' }, total + 0.95)
      .to(q('.om-arrow-halo'), { scale: 2.4, opacity: 0.55, duration: 0.9, ease: 'power2.out' }, total + 0.84)
      .to(q('.om-arrow-title, .om-arrow-label'), { opacity: 0, y: -10, duration: 0.4 }, total + 0.84);
  };

  /* ---------- pointer drag on the bow only ---------- */
  const onDown = (e) => {
    if (fired.current) return;
    e.preventDefault();
    const g = measure();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, max: Math.max(60, g.size * 0.55), pull: 0 };
    gsap.killTweensOf(root.current.querySelector('.om-bow-bob'));
    gsap.to(root.current.querySelector('.om-bow-bob'), { y: 0, rotation: 0, duration: 0.2 });
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const g = geo.current;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    // distance pulled AWAY from the heart (forgiving: any drag counts a bit)
    const away = -(dx * Math.cos(g.ang) + dy * Math.sin(g.ang));
    const dist = Math.max(away, Math.hypot(dx, dy) * 0.45);
    d.pull = Math.max(0, Math.min(1, dist / d.max));
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => setPull(d.pull));
  };
  const onUp = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    cancelAnimationFrame(raf.current);
    if (d.pull >= FIRE_AT) { fire(d.pull); return; }
    // not enough: ease the string back
    const s = { v: d.pull };
    gsap.to(s, { v: 0, duration: 0.45, ease: 'elastic.out(1, 0.4)', onUpdate: () => setPull(s.v) });
  };
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); autoShoot(); }
  };

  /** Fallback: draw the bow automatically, then let go. */
  const autoShoot = () => {
    if (fired.current || drag.current) return;
    if (reduced()) return fire(1);
    setFallback(false);
    const s = { v: pull };
    gsap.to(s, { v: 0.9, duration: 0.55, ease: 'power2.out', onUpdate: () => setPull(s.v), onComplete: () => fire(0.9) });
  };

  const next = () => {
    if (phase !== 'reveal' || doneRef.current) return;
    doneRef.current = true;
    onNext();
  };

  return (
    <section className={`om-scene om-film om-film-arrow is-${phase}`} ref={root} onClick={next}>
      <div className="om-arrow-bg" aria-hidden="true" />
      <p className="om-arrow-title">someone made this, just for you</p>

      <div className="om-arrow-stage">
        <span className="om-arrow-halo" aria-hidden="true" />
        <div className="om-arrow-heart" ref={heartRef} aria-hidden={phase === 'reveal'}>
          <div className="om-arrow-heart-in"><GlossyHeart /></div>
        </div>
        {phase === 'reveal' && (
          <div className="om-arrow-reveal" aria-live="polite">
            <p className="om-arrow-line">{firstLine}</p>
            {you && <p className="om-arrow-sign">&mdash; {you}</p>}
          </div>
        )}
      </div>

      <div className="om-arrow-range">
        <div
          className="om-arrow-bow"
          ref={bowRef}
          role="button"
          tabIndex={phase === 'aim' ? 0 : -1}
          aria-label="Pull the bow back and let go"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onKeyDown={onKey}
        >
          <div className="om-bow-bob">
            <div className="om-bow-rot">
              <BowArrow pull={pull} className={phase !== 'aim' ? 'is-released is-loosed' : undefined} />
            </div>
          </div>
        </div>
      </div>

      <span className="om-arrow-aim" ref={aimRef} aria-hidden="true" />
      <span className="om-arrow-fly" ref={flyRef} aria-hidden="true"><FlyingArrow /></span>

      <div className="om-arrow-foot">
        {phase === 'reveal' ? (
          <p className="om-arrow-next">tap to keep going</p>
        ) : (
          <>
            <p className="om-arrow-label">PULL &amp; LET GO</p>
            <button
              type="button"
              className={'om-arrow-fallback' + (fallback ? ' is-shown' : '')}
              onClick={(e) => { e.stopPropagation(); autoShoot(); }}
              tabIndex={fallback ? 0 : -1}
            >
              tap to keep going
            </button>
          </>
        )}
      </div>
      <div className="om-arrow-flash" ref={flashRef} aria-hidden="true" />
    </section>
  );
}
