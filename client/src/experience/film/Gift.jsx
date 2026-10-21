import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import GiftBox from '../../art/GiftBox.jsx';
import { reduced, haptic } from '../../lib/motion.js';
import music from '../audio.js';
import { confettiBurst } from './fx.js';
import './film.css';

/** Scene 1: a sketched gift floats; tapping pops the lid, bursts confetti + petals, starts the music. */
export default function Gift({ gift, onNext }) {
  const root = useRef(null);
  const boxWrap = useRef(null);
  const floatTl = useRef(null);
  const [open, setOpen] = useState(false);
  const done = useRef(false);
  const name = (gift.herName || '').trim();

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    if (reduced()) { gsap.set(q('[data-in]'), { opacity: 1 }); return undefined; }
    const ctx = gsap.context(() => {
      gsap.timeline({ delay: 0.15 })
        .fromTo(q('.om-gift-box'), { opacity: 0, y: 40, scale: 0.86, rotation: -4 },
          { opacity: 1, y: 0, scale: 1, rotation: 0, duration: 1.1, ease: 'elastic.out(1, 0.6)' })
        .fromTo(q('.om-gift-shadow'), { opacity: 0, scaleX: 0.5 }, { opacity: 1, scaleX: 1, duration: 0.8, ease: 'power2.out' }, 0.2)
        .fromTo(q('.om-gift-title'), { opacity: 0, y: 18, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: 'power3.out' }, 0.45)
        .fromTo(q('.om-gift-hint'), { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0.95);

      // gentle float + an occasional little "something's inside" wobble
      floatTl.current = gsap.timeline({ repeat: -1, delay: 1.2 })
        .to(boxWrap.current, { y: -12, duration: 1.6, ease: 'sine.inOut' })
        .to(boxWrap.current, { keyframes: [
          { rotation: -4, duration: 0.11 }, { rotation: 4, duration: 0.11 },
          { rotation: -3, duration: 0.1 }, { rotation: 2, duration: 0.1 }, { rotation: 0, duration: 0.12 },
        ], ease: 'sine.inOut' }, 1.0)
        .to(boxWrap.current, { y: 0, duration: 1.6, ease: 'sine.inOut' })
        .to({}, { duration: 0.6 });
      gsap.to(q('.om-gift-shadow'), { scaleX: 0.86, opacity: 0.7, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 });
      gsap.to(q('.om-gift-hint'), { opacity: 0.45, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.6 });
    }, root);
    return () => ctx.revert();
  }, []);

  const openIt = () => {
    if (done.current) return;
    done.current = true;
    music.start();
    haptic(18);
    if (reduced()) { setOpen(true); setTimeout(onNext, 450); return; }
    floatTl.current && floatTl.current.kill();
    const q = gsap.utils.selector(root);
    const wrap = boxWrap.current;
    const hostRect = root.current.getBoundingClientRect();
    const r = wrap.getBoundingClientRect();
    const cx = r.left + r.width / 2 - hostRect.left;
    const cy = r.top + r.height * 0.3 - hostRect.top;

    gsap.killTweensOf(q('.om-gift-hint'));
    gsap.timeline({ onComplete: onNext })
      // anticipation squash
      .to(wrap, { scaleX: 1.08, scaleY: 0.88, y: 6, rotation: 0, duration: 0.16, ease: 'power2.in', transformOrigin: '50% 100%' })
      // release: stretch up with a spring, the lid pops
      .add(() => { setOpen(true); music.pop(); })
      .to(wrap, { scaleX: 0.95, scaleY: 1.08, y: -16, duration: 0.18, ease: 'power2.out' })
      .add(() => { confettiBurst(root.current, cx, cy); music.chime(); }, '-=0.08')
      .fromTo(q('.om-gift-glow'), { opacity: 0, scale: 0.3 }, { opacity: 1, scale: 1.25, duration: 0.6, ease: 'power2.out' }, '<')
      .to(wrap, { scaleX: 1, scaleY: 1, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)' }, '<0.05')
      .to(q('.om-gift-hint'), { opacity: 0, y: 8, duration: 0.3 }, '<')
      .to(q('.om-gift-title'), { scale: 1.04, duration: 0.5, ease: 'sine.out' }, '<')
      .to({}, { duration: 0.75 })
      .to(q('.om-gift-glow'), { opacity: 0, duration: 0.5 });
  };

  return (
    <section className="om-scene om-film om-film-gift" ref={root} onClick={openIt}>
      <button
        type="button"
        className="om-gift-btn"
        aria-label={`Open your gift${name ? `, ${name}` : ''}`}
        onClick={(e) => { e.stopPropagation(); openIt(); }}
      >
        <span className="om-gift-glow" aria-hidden="true" />
        <span className="om-gift-box" ref={boxWrap} data-in>
          <GiftBox open={open} />
        </span>
        <span className="om-gift-shadow" aria-hidden="true" />
      </button>
      <h1 className="om-gift-title" data-in>For you{name ? `, ${name}` : ''}.</h1>
      <p className="om-gift-hint" data-in>(tap to open)</p>
    </section>
  );
}
