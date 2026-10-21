import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import DoorArt from '../../art/Door.jsx';
import * as audio from '../audio.js';
import { OCCASIONS } from '../../config/options.js';
import { reduced, haptic, revealIn, burst } from '../../lib/motion.js';
import './museum.css';

const play = (name, ...args) => { try { const fn = audio[name]; if (typeof fn === 'function') fn(...args); } catch (e) {} };

const HINTS = ['Tap the brass ring 👈', 'Twice more…', 'Once more…', 'Someone’s coming…'];

/**
 * Scene 6: the museum door. A single arched plum door; knock three times on the ring,
 * the leaf swings open on its left hinge (real CSS 3D) to golden light, and the camera walks in.
 */
export default function Door({ gift, onNext, roomCount }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const leafRef = useRef(null);
  const timers = useRef([]);
  const done = useRef(false);
  const knockRef = useRef(0);
  const [knocks, setKnocks] = useState(0);
  const [phase, setPhase] = useState('closed'); // closed | peeping | open | walking
  const [hint, setHint] = useState(HINTS[0]);
  const [ripples, setRipples] = useState([]);   // {id, x, y}

  const you = (gift?.yourName || '').trim() || 'Someone';
  const her = (gift?.herName || '').trim() || 'you';
  const occ = OCCASIONS.find((o) => o.id === gift?.occasion) || OCCASIONS[0];
  const rooms = Number(roomCount) > 0 ? Number(roomCount) : 6;

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useLayoutEffect(() => { const t = revealIn(rootRef.current); return () => t && t.kill(); }, []);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onNext && onNext();
  };

  // where the knocker sits (relative to the stage), so ripples start from the ring
  const ringPoint = () => {
    const stage = stageRef.current;
    const ring = stage && stage.querySelector('.om-art-ring');
    if (!stage) return { x: '50%', y: '47%' };
    const s = stage.getBoundingClientRect();
    if (!ring || !s.width) return { x: '50%', y: '47%' };
    const r = ring.getBoundingClientRect();
    return { x: `${((r.left + r.width / 2 - s.left) / s.width) * 100}%`, y: `${((r.top + r.height / 2 - s.top) / s.height) * 100}%` };
  };

  const knock = () => {
    if (knockRef.current >= 3) return;
    const n = ++knockRef.current;
    setKnocks(n);
    play('knock');
    haptic(18);
    const pt = ringPoint();
    const id = Date.now() + Math.random();
    setRipples((r) => [...r, { id, ...pt }]);
    later(() => setRipples((r) => r.filter((x) => x.id !== id)), 1300);

    const ring = stageRef.current && stageRef.current.querySelector('.om-art-ring');
    if (!reduced()) {
      if (ring) { ring.classList.remove('om-mu-ring-swing'); void ring.getBoundingClientRect(); ring.classList.add('om-mu-ring-swing'); }
      if (leafRef.current) {
        // Shake the art inside the leaf, never the leaf itself: an inline transform on the leaf
        // would override the CSS rotateY that swings the door open.
        gsap.fromTo(leafRef.current.firstElementChild, { x: 0, rotate: 0 }, {
          keyframes: [{ x: -4, rotate: -0.5, duration: 0.05 }, { x: 4, rotate: 0.5, duration: 0.06 }, { x: -2, rotate: -0.25, duration: 0.06 }, { x: 0, rotate: 0, duration: 0.07 }],
          ease: 'power1.inOut', clearProps: 'transform',
        });
      }
    }
    if (n < 3) { setHint(HINTS[n]); return; }

    // third knock: someone's coming…
    setHint(HINTS[3]);
    const r = reduced();
    later(() => { setPhase('peeping'); play('pop'); }, r ? 0 : 420);
    later(() => {
      setPhase('open');
      play('creak');
      haptic([12, 60, 24]);
      setHint('Walking you in…');
      if (!r && stageRef.current) burst(stageRef.current, { y: '55%', glyphs: ['✦', '✧', '·', '♡'], colors: ['#FFF3B0', '#FFC966', '#F5B83D', '#FFEFE6'], count: 22 });
    }, r ? 20 : 1050);
    later(() => {
      setPhase('walking');
      if (!r && stageRef.current) gsap.to(stageRef.current, { scale: 3.4, duration: 1.3, ease: 'power3.in', transformOrigin: '60% 55%' });
    }, r ? 1800 : 3600);
    later(finish, r ? 2600 : 4800);
  };

  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); knock(); } };
  const isOpen = phase === 'open' || phase === 'walking';

  return (
    <section ref={rootRef} className={`om-scene om-mu-door is-${phase}`}>
      <div className="om-mu-door-glow" aria-hidden="true" />
      <div className="om-mu-door-head">
        <span className="om-mu-door-pill" data-reveal>{occ.emoji || '💌'} {occ.tag}</span>
        <p className="om-mu-door-eyebrow" data-reveal>Closed to everyone. Except you.</p>
        <h1 className="om-mu-door-h" data-reveal>{you} built you a <span className="om-accent">museum</span>.</h1>
        <p className="om-mu-door-sub" data-reveal>Knock three times. That’s the rule.</p>
      </div>

      <div className="om-mu-door-wrap" data-reveal>
        <div
          ref={stageRef}
          className="om-mu-door-stage"
          role="button"
          tabIndex={knocks >= 3 ? -1 : 0}
          aria-label={knocks >= 3 ? 'The door is opening' : `Knock on the door (${3 - knocks} left)`}
          onClick={knock}
          onKeyDown={onKey}
        >
          {/* the opening behind the leaf: golden light with the welcome inside */}
          <div className="om-mu-door-opening" aria-hidden={!isOpen}>
            <div className="om-mu-door-words">
              <b>Come in, {her}.</b>
              <span>{rooms} rooms, and every one of them is about you.</span>
            </div>
          </div>
          <div className="om-mu-door-peep" aria-hidden="true" />

          {/* the leaf: our door art plus a pinned placard, hinged on the left in real 3D */}
          <div ref={leafRef} className="om-mu-door-leaf">
            <div className="om-mu-door-art"><DoorArt open={0} /></div>
            <div className="om-mu-placard" aria-hidden="true">
              <i className="om-mu-placard-pin" />
              <b>The Museum of {her}</b>
              <span>one visitor only</span>
            </div>
          </div>

          {ripples.map((r) => (
            <span key={r.id} className="om-mu-ripple" style={{ left: r.x, top: r.y }} aria-hidden="true"><i /><i /><i /></span>
          ))}
        </div>
      </div>

      <div className="om-mu-knockcount" aria-hidden="true">
        {[0, 1, 2].map((i) => <span key={i} className={`om-mu-knockdot${knocks > i ? ' is-on' : ''}`} />)}
      </div>
      <p className="om-mu-door-hint" aria-live="polite">{hint}</p>

      <div className={`om-mu-door-after${isOpen ? ' is-in' : ''}`}>
        <button type="button" className="om-mu-cta om-mu-cta-warm" onClick={finish} disabled={!isOpen} tabIndex={isOpen ? 0 : -1}>Come in →</button>
      </div>
      <div className={`om-mu-door-flood${phase === 'walking' ? ' is-on' : ''}`} aria-hidden="true" />
    </section>
  );
}
