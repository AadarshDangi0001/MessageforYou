import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import WaxSeal from '../../art/WaxSeal.jsx';
import Envelope from '../../art/Envelope.jsx';
import { Heart, Sparkle } from '../../art/Doodles.jsx';
import PaperGrain from '../../art/PaperGrain.jsx';
import * as audio from '../audio.js';
import { reduced, haptic, revealIn, typeText, burst } from '../../lib/motion.js';
import { SEALS, STICKERS } from '../../config/options.js';
import { RoomDots, sfx, duck } from './Finale.jsx';
import './finale.css';

const TYPE_MS = 26;
const WAX = '#B3203A';

const WAVE = Array.from({ length: 28 }, (_, i) => 0.28 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)) * 0.72);

function VoicePill({ url }) {
  const [playing, setPlaying] = useState(false);
  const elRef = useRef(null);
  const rafRef = useRef(0);
  const rootRef = useRef(null);
  const timeRef = useRef(null);

  const setProgress = (p, secs) => {
    const r = rootRef.current;
    if (r) r.style.setProperty('--p', `${Math.max(0, Math.min(1, p)) * 100}%`);
    if (timeRef.current && secs != null) {
      const s = Math.max(0, Math.round(secs));
      timeRef.current.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }
  };

  const finish = () => {
    cancelAnimationFrame(rafRef.current);
    duck(false);
    setPlaying(false);
    setProgress(1);
  };

  const stop = () => {
    cancelAnimationFrame(rafRef.current);
    sfx('stopVoice');
    duck(false);
    setPlaying(false);
  };

  const toggle = () => {
    if (playing) { stop(); return; }
    haptic(10);
    duck(true);
    setProgress(0, 0);
    let el = sfx('playVoice', url, { onEnd: finish });
    if (!el && typeof audio.playVoice !== 'function') {
      // Fallback when the audio helper is unavailable.
      try { el = new Audio(url); el.addEventListener('ended', finish); el.play().catch(finish); } catch (e) { el = null; }
    }
    elRef.current = el && typeof el.currentTime === 'number' ? el : null;
    setPlaying(true);
    const t0 = performance.now();
    const tick = () => {
      const a = elRef.current;
      if (a && a.duration && isFinite(a.duration)) {
        setProgress(a.currentTime / a.duration, a.currentTime);
        if (a.ended) { finish(); return; }
      } else {
        const s = (performance.now() - t0) / 1000;
        setProgress(Math.min(0.97, s / 45), s);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    if (elRef.current && typeof audio.playVoice !== 'function') { try { elRef.current.pause(); } catch (e) {} }
    sfx('stopVoice');
    duck(false);
  }, []);

  return (
    <button
      ref={rootRef}
      type="button"
      className={`om-fn-voice${playing ? ' is-playing' : ''}`}
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? 'Pause the voice note' : 'Hear it out loud'}
    >
      <span className="om-fn-voice-btn" aria-hidden="true">{playing ? '❚❚' : '▶'}</span>
      <span className="om-fn-voice-body">
        <span className="om-fn-voice-label">{playing ? 'Playing…' : 'Hear it out loud'}</span>
        <span className="om-fn-wave" aria-hidden="true">
          <span className="om-fn-wave-row">
            {WAVE.map((h, i) => <i key={i} style={{ '--h': h, '--d': `${(i % 7) * 0.09}s` }} />)}
          </span>
          <span className="om-fn-wave-row is-fill">
            {WAVE.map((h, i) => <i key={i} style={{ '--h': h, '--d': `${(i % 7) * 0.09}s` }} />)}
          </span>
        </span>
      </span>
      <span className="om-fn-voice-time" ref={timeRef} aria-hidden="true">0:00</span>
    </button>
  );
}

export default function Room4Letter({ gift = {}, onNext, roomIndex, roomCount }) {
  const seal = SEALS.find((s) => s.id === gift.seal) || SEALS[0];
  const sticker = STICKERS.find((s) => s.id === gift.sticker) || STICKERS[0];
  const letter = String(gift.letter || gift.firstLine || '').trim();
  const you = gift.yourName || 'Me';

  // sealed -> cracking -> reading
  const [phase, setPhase] = useState('sealed');
  const [broken, setBroken] = useState(false);
  const [envOpen, setEnvOpen] = useState(false);
  const [envGone, setEnvGone] = useState(false);
  const [unfolded, setUnfolded] = useState(false);
  const [typed, setTyped] = useState(false);

  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const envRef = useRef(null);
  const sealRef = useRef(null);
  const paperRef = useRef(null);
  const flapTopRef = useRef(null);
  const flapBotRef = useRef(null);
  const textRef = useRef(null);
  const stickerRef = useRef(null);
  const tailRef = useRef(null);
  const cancelType = useRef(null);
  const timers = useRef([]);
  const fired = useRef(false);

  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)); };

  useEffect(() => {
    revealIn(rootRef.current, '.om-fn-head [data-reveal], .om-fn-envwrap, .om-fn-hint');
    return () => {
      timers.current.forEach(clearTimeout);
      cancelType.current && cancelType.current();
    };
  }, []);

  const breakSeal = () => {
    if (phase !== 'sealed') return;
    setPhase('cracking');
    sfx('pop');
    haptic(18);
    setBroken(true);
    const st = stageRef.current, s = sealRef.current;
    if (st && s) {
      const a = st.getBoundingClientRect(), b = s.getBoundingClientRect();
      burst(st, {
        x: `${b.left - a.left + b.width / 2}px`, y: `${b.top - a.top + b.height / 2}px`,
        glyphs: ['●', '•', '◆', '▪'], count: 16, colors: ['#B3203A', '#8E1428', '#D4485E', '#6F0F1F'],
      });
    }
    if (reduced()) { setEnvOpen(true); setPhase('reading'); return; }
    later(() => setEnvOpen(true), 380);
    later(() => { sfx('chime'); setPhase('reading'); }, 1050);
  };

  // Paper slides out of the envelope, then unfolds (two folds, with perspective).
  useLayoutEffect(() => {
    if (phase !== 'reading') return undefined;
    const paper = paperRef.current, env = envRef.current;
    const ft = flapTopRef.current, fb = flapBotRef.current;
    if (!paper) return undefined;

    const st = { a1: 180, a2: 180 };
    const third = 100 / 3;
    const apply = () => {
      if (ft) ft.style.transform = `perspective(1100px) rotateX(${-st.a1}deg)`;
      if (fb) fb.style.transform = `perspective(1100px) rotateX(${st.a2}deg)`;
      const top = third * (1 - Math.max(0, Math.cos((st.a1 * Math.PI) / 180)));
      const bot = third * (1 - Math.max(0, Math.cos((st.a2 * Math.PI) / 180)));
      paper.style.clipPath = `inset(${Math.max(0, top - 1.5)}% -40px ${Math.max(0, bot - 1.5)}% -40px)`;
    };
    const done = () => {
      paper.style.clipPath = 'none';
      setEnvGone(true);
      setUnfolded(true);
    };

    if (reduced()) { done(); return undefined; }

    apply();
    let y0 = 0;
    if (env) {
      const pr = paper.getBoundingClientRect(), er = env.getBoundingClientRect();
      y0 = (er.top + er.height * 0.5) - (pr.top + pr.height / 2);
    }
    const tl = gsap.timeline({ onComplete: done });
    tl.fromTo(paper, { y: y0 + 50, scale: 0.78, opacity: 0 }, { y: y0 - 40, scale: 0.88, opacity: 1, duration: 0.7, ease: 'power2.out' })
      .to(env, { y: 140, opacity: 0, rotate: 4, duration: 0.6, ease: 'power2.in' }, '<0.3')
      .to(paper, { y: 0, scale: 1, duration: 0.7, ease: 'power3.inOut' })
      .to(st, { a1: 0, duration: 0.8, ease: 'power2.inOut', onUpdate: apply }, '-=0.25')
      .to(st, { a2: 0, duration: 0.8, ease: 'power2.inOut', onUpdate: apply }, '-=0.4');
    return () => { tl.kill(); };
  }, [phase]);

  // Once open: slap the sticker on and type the letter.
  useEffect(() => {
    if (!unfolded) return;
    const s = stickerRef.current;
    if (s) {
      if (reduced()) gsap.set(s, { opacity: 1, scale: 1, rotate: 12 });
      else {
        gsap.fromTo(s, { opacity: 0, scale: 2.6, rotate: -40 }, { opacity: 1, scale: 1, rotate: 12, duration: 0.9, ease: 'elastic.out(1, 0.5)', delay: 0.15 });
        later(() => { sfx('pop'); haptic(8); }, 260);
      }
    }
    cancelType.current = typeText(textRef.current, letter, { speed: TYPE_MS, onDone: () => setTyped(true) });
  }, [unfolded]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typed) revealIn(tailRef.current, '[data-reveal]');
  }, [typed]);

  const skip = () => { if (unfolded && !typed && cancelType.current) cancelType.current(true); };

  const next = () => {
    if (fired.current) return;
    fired.current = true;
    sfx('stopVoice');
    duck(false);
    onNext && onNext();
  };

  return (
    <section className="om-scene om-fn-room om-fn-r4" ref={rootRef}>
      <PaperGrain />
      <div className="om-fn-inner">
        <header className="om-fn-head">
          <p className="om-fn-eyebrow" data-reveal>Room 4 · The reading room</p>
          <h1 className="om-fn-h1" data-reveal>A letter, sealed just for <span className="om-accent">you</span>.</h1>
        </header>

        <div className="om-fn-stack" ref={stageRef}>
          {!envGone && (
            <div className="om-fn-envwrap" ref={envRef}>
              <button
                type="button"
                className={`om-fn-env${phase === 'sealed' ? ' is-sealed' : ''}`}
                onClick={breakSeal}
                disabled={phase !== 'sealed'}
                aria-label="Tap to break the seal and open the letter"
              >
                <span className="om-fn-env-art"><Envelope open={envOpen} /></span>
                <span className={`om-fn-seal${broken ? ' is-broken' : ''}`} ref={sealRef} aria-hidden="true">
                  <WaxSeal glyph={seal.emoji} broken={broken} color={WAX} />
                </span>
                <span className="om-fn-env-heart is-a" aria-hidden="true"><Heart size={22} color="#E23B67" /></span>
                <span className="om-fn-env-heart is-b" aria-hidden="true"><Sparkle size={20} color="#F0A93B" /></span>
              </button>
            </div>
          )}

          {phase === 'reading' && (
            <article
              className={`om-fn-paper${unfolded ? ' is-open' : ''}`}
              ref={paperRef}
              onClick={skip}
              aria-label={`A letter from ${you}`}
            >
              {!unfolded && (
                <>
                  <span className="om-fn-flap is-top" ref={flapTopRef} aria-hidden="true" />
                  <span className="om-fn-flap is-bot" ref={flapBotRef} aria-hidden="true" />
                </>
              )}
              <span className="om-fn-crease is-1" aria-hidden="true" />
              <span className="om-fn-crease is-2" aria-hidden="true" />
              <span className="om-fn-sticker" ref={stickerRef} aria-hidden="true">{sticker.emoji}</span>
              <p className="om-fn-letter-to">My {gift.herName || 'love'},</p>
              <div className="om-fn-lines">
                <p className="om-fn-letter-ghost" aria-hidden="true">{letter}</p>
                <p className="om-fn-letter-text" ref={textRef} aria-hidden="true" />
              </div>
              <p className="om-fn-sr">{letter}</p>
              <p className={`om-fn-sign${typed ? ' is-in' : ''}`}>— {you}</p>
              {unfolded && !typed && <span className="om-fn-skip" aria-hidden="true">tap to skip</span>}
            </article>
          )}
        </div>

        {phase === 'sealed' && (
          <p className="om-fn-hint"><span className="om-fn-point" aria-hidden="true">👈</span> Tap to break the seal</p>
        )}

        {unfolded && gift.voiceUrl && (
          <div className="om-fn-voicewrap"><VoicePill url={gift.voiceUrl} /></div>
        )}

        <div className="om-fn-tail" ref={tailRef}>
          {typed && (
            <button type="button" className="om-fn-cta" onClick={next} data-reveal>One last room →</button>
          )}
        </div>
        <RoomDots index={roomIndex} count={roomCount} />
      </div>
    </section>
  );
}
