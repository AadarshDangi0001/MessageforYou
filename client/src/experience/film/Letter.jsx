import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import Couple from '../../art/Couple.jsx';
import Roses from '../../art/Roses.jsx';
import { reduced } from '../../lib/motion.js';
import './film.css';

const FILM_NOTE_MS = 3600;

/** Scene 2: "From me to you." writes on, the couple fades up, then it moves on by itself (or on tap/scroll). */
export default function Letter({ onNext }) {
  const root = useRef(null);
  const done = useRef(false);
  const ready = useRef(false);
  const timer = useRef(0);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    clearTimeout(timer.current);
    onNext();
  };

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    const arm = () => { ready.current = true; timer.current = setTimeout(finish, FILM_NOTE_MS); };
    if (reduced()) { arm(); return () => clearTimeout(timer.current); }
    const ctx = gsap.context(() => {
      gsap.timeline({ delay: 0.25, onComplete: arm })
        .fromTo(q('.om-letter-roses'), { opacity: 0, x: -60, y: -60, rotation: -18 },
          { opacity: 1, x: 0, y: 0, rotation: 0, duration: 1.4, ease: 'power3.out' }, 0)
        // pen write-on: reveal left→right with a soft feathered edge
        .fromTo(q('.om-letter-h1'), { '--wipe': '0%', opacity: 1 },
          { '--wipe': '118%', duration: 1.7, ease: 'power1.inOut' }, 0.1)
        .fromTo(q('.om-letter-nib'), { left: '0%', opacity: 1 },
          { left: '100%', duration: 1.7, ease: 'power1.inOut' }, 0.1)
        .to(q('.om-letter-nib'), { opacity: 0, duration: 0.3 }, 1.7)
        .fromTo(q('.om-letter-sub'), { opacity: 0, y: 14, filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' }, 1.25)
        .fromTo(q('.om-letter-art'), { opacity: 0, y: 26, scale: 0.94, filter: 'blur(8px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' }, 1.55)
        .fromTo(q('.om-letter-orn > span'), { opacity: 0, scale: 0.2, y: 8 },
          { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'back.out(2.4)' }, 2.1)
        .fromTo(q('.om-letter-scroll'), { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, 2.5);
      gsap.to(q('.om-letter-scroll i'), { y: 6, duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 3 });
      gsap.to(q('.om-letter-orn > span:nth-child(2)'), { scale: 1.18, duration: 0.7, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 3 });
    }, root);
    return () => { ctx.revert(); clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A downward scroll gesture (wheel / swipe up) also moves on — but only when the screen
  // itself can't scroll any further, so we never hijack normal scrolling.
  useEffect(() => {
    const el = root.current;
    const scroller = el && el.closest('.om-screen');
    if (!el || !scroller) return undefined;
    const atEnd = () => scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4;
    let startY = null;
    const onWheel = (e) => { if (ready.current && e.deltaY > 18 && atEnd()) finish(); };
    const onStart = (e) => { startY = e.touches[0].clientY; };
    const onMove = (e) => { if (ready.current && startY != null && startY - e.touches[0].clientY > 50 && atEnd()) { startY = null; finish(); } };
    scroller.addEventListener('wheel', onWheel, { passive: true });
    scroller.addEventListener('touchstart', onStart, { passive: true });
    scroller.addEventListener('touchmove', onMove, { passive: true });
    return () => {
      scroller.removeEventListener('wheel', onWheel);
      scroller.removeEventListener('touchstart', onStart);
      scroller.removeEventListener('touchmove', onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="om-scene om-film om-film-letter" ref={root} onClick={() => ready.current && finish()}>
      <div className="om-letter-roses" aria-hidden="true"><Roses /></div>
      <div className="om-drift" aria-hidden="true">
        {['8%', '22%', '74%', '88%', '60%'].map((l, i) => (
          <span key={i} style={{ left: l, animationDelay: `${i * 1.3}s`, animationDuration: `${9 + (i % 3) * 2}s` }}>{i % 2 ? '♡' : '♥'}</span>
        ))}
      </div>
      <h1 className="om-letter-h1">
        <span className="om-letter-ink">From me to you.</span>
        <span className="om-letter-nib" aria-hidden="true" />
      </h1>
      <p className="om-letter-sub">This is how much I love you.</p>
      <div className="om-letter-art" aria-hidden="true"><Couple /></div>
      <div className="om-letter-orn" aria-hidden="true"><span>✦</span><span>♡</span><span>✦</span></div>
      <div className="om-letter-scroll" aria-hidden="true"><span>scroll</span><i>⌄</i></div>
    </section>
  );
}
