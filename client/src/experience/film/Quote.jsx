import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Heart, Leaf, Sparkle, Flower } from '../../art/Doodles.jsx';
import { reduced, haptic } from '../../lib/motion.js';
import './film.css';

const Hl = ({ tone, children }) => (
  <span className={`om-hl om-hl--${tone}`}><span className="om-hl-bar" aria-hidden="true" /><span className="om-hl-word">{children}</span></span>
);

/** Scene 3: the quote card with four highlighter swipes, then "tap anywhere to go in". */
export default function Quote({ gift, onNext }) {
  const root = useRef(null);
  const ready = useRef(false);
  const done = useRef(false);
  const you = (gift.yourName || '').trim() || 'someone';

  useLayoutEffect(() => {
    const q = gsap.utils.selector(root);
    if (reduced()) { ready.current = true; return undefined; }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.2 });
      tl.fromTo(q('.om-quote-card'), { opacity: 0, y: 40, rotation: 2.5, scale: 0.94 },
        { opacity: 1, y: 0, rotation: -1.2, scale: 1, duration: 1, ease: 'back.out(1.4)' })
        .fromTo(q('.om-quote-doodle'), { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: 'back.out(2.5)' }, 0.5);
      // each line appears, then its highlighter swipes in left → right
      q('.om-quote-line').forEach((line, i) => {
        const at = 0.75 + i * 1.0;
        tl.fromTo(line, { opacity: 0, y: 12, filter: 'blur(5px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, at);
        line.querySelectorAll('.om-hl').forEach((hl, j) => {
          const t = at + 0.35 + j * 0.42;
          tl.fromTo(hl.querySelector('.om-hl-bar'), { scaleX: 0 }, { scaleX: 1, duration: 0.45, ease: 'power2.inOut' }, t)
            .fromTo(hl, { scale: 1 }, { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut' }, t + 0.3);
        });
      });
      tl.fromTo(q('.om-quote-see'), { opacity: 0, y: 16, '--wipe': '0%' },
        { opacity: 1, y: 0, '--wipe': '118%', duration: 1.2, ease: 'power2.out' }, '+=0.15')
        .fromTo(q('.om-tap'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, '-=0.5')
        .fromTo(q('.om-quote-hint'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=0.3')
        .add(() => { ready.current = true; });
      // let an early tap through after the card has landed, so nobody is held hostage
      gsap.delayedCall(1.6, () => { ready.current = true; });
    }, root);
    return () => ctx.revert();
  }, []);

  const go = () => {
    if (!ready.current || done.current) return;
    done.current = true;
    haptic(12);
    if (reduced()) return onNext();
    gsap.to(root.current.querySelector('.om-tap'), { scale: 1.3, opacity: 0, duration: 0.35, ease: 'power2.out', onComplete: onNext });
  };

  return (
    <section
      className="om-scene om-film om-film-quote"
      ref={root}
      onClick={go}
      role="button"
      tabIndex={0}
      aria-label="Tap anywhere to go in"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }}
    >
      <figure className="om-quote-card">
        <span className="om-quote-doodle om-quote-doodle--tl"><Heart size={26} color="#E58A9C" /></span>
        <span className="om-quote-doodle om-quote-doodle--tr"><Flower size={20} color="#8DBF95" /></span>
        <span className="om-quote-doodle om-quote-doodle--bl"><Sparkle size={16} color="#C9A86A" /></span>
        <span className="om-quote-doodle om-quote-doodle--br"><Leaf size={22} color="#8DBF95" /></span>
        <span className="om-quote-doodle om-quote-doodle--br2"><Heart size={20} color="#E58A9C" /></span>
        <blockquote className="om-quote-text">
          <span className="om-quote-line">In your <Hl tone="pink">smile</Hl>, I found my <Hl tone="green">peace</Hl>.</span>
          <span className="om-quote-line">In your <Hl tone="red">love</Hl>, I found my <Hl tone="gold">home</Hl>.</span>
        </blockquote>
      </figure>
      <p className="om-quote-see">See what {you} built for you</p>
      <div className="om-tap" aria-hidden="true"><span className="om-tap-ring" /><span className="om-tap-ring om-tap-ring--2" /><span className="om-tap-dot">👆</span></div>
      <p className="om-quote-hint">tap anywhere to go in</p>
    </section>
  );
}
