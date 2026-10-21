import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import gsap from 'gsap';
import { applyTheme } from '../lib/theme.js';
import { getGift, visit } from '../lib/api.js';
import { reduced } from '../lib/motion.js';
import music from './audio.js';
import PaperGrain from '../art/PaperGrain.jsx';

import Gift from './film/Gift.jsx';
import Letter from './film/Letter.jsx';
import Quote from './film/Quote.jsx';
import RoseShower from './film/RoseShower.jsx';
import Arrow from './film/Arrow.jsx';
import Cinematic from './film/Cinematic.jsx';
import HeartTreeScene from './film/HeartTreeScene.jsx';

import Door from './museum/Door.jsx';
import Room1Gallery from './museum/Room1Gallery.jsx';
import Room2Puzzle from './museum/Room2Puzzle.jsx';
import Room3Notes from './museum/Room3Notes.jsx';
import Room4Letter from './museum/Room4Letter.jsx';
import Room5Promises from './museum/Room5Promises.jsx';
import Finale from './museum/Finale.jsx';

import './chrome.css';

/** Ordered list of scenes for this gift; rooms 1–3 only appear when they have something to show. */
function buildScenes(gift) {
  const photos = Array.isArray(gift.photos) ? gift.photos.filter((p) => p && p.url) : [];
  const notes = Array.isArray(gift.notes) ? gift.notes.filter((n) => n && String(n).trim()) : [];
  const list = [
    { id: 'gift', C: Gift },
    { id: 'roses', C: RoseShower },
    { id: 'letter', C: Letter },
    { id: 'quote', C: Quote },
    { id: 'arrow', C: Arrow },
    { id: 'cinematic', C: Cinematic },
    { id: 'tree', C: HeartTreeScene },
    { id: 'door', C: Door, door: true },
  ];
  const rooms = [];
  if (photos.length) rooms.push({ id: 'room1', C: Room1Gallery });
  if (photos.some((p) => p.puzzle)) rooms.push({ id: 'room2', C: Room2Puzzle });
  if (notes.length) rooms.push({ id: 'room3', C: Room3Notes });
  rooms.push({ id: 'room4', C: Room4Letter }, { id: 'room5', C: Room5Promises });
  // room progress: 0-based roomIndex, roomCount = rooms actually shown (the finale counts as "all done")
  rooms.forEach((r, i) => list.push({ ...r, roomIndex: i }));
  list.push({ id: 'finale', C: Finale, finale: true, roomIndex: rooms.length });
  list.forEach((s) => { s.roomCount = rooms.length; });
  return list;
}

/** Resolve once the experience fonts are usable (or after a short timeout, so we never hang). */
function fontsReady() {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  const loads = ['400 48px "Great Vibes"', '700 32px "DynaPuff"', '400 20px "Shantell Sans"', '400 28px "Caveat Brush"', '400 28px "Sacramento"']
    .map((f) => document.fonts.load(f).catch(() => {}));
  const all = Promise.all(loads).then(() => document.fonts.ready);
  return Promise.race([all, new Promise((r) => setTimeout(r, 3000))]);
}

function Chrome({ preview, onExit }) {
  const [on, setOn] = useState(() => music.isOn());
  return (
    <>
      {preview && onExit && (
        <button type="button" className="om-chrome-back om-xp-chrome" onClick={onExit}>&larr; Back</button>
      )}
      {preview && <span className="om-chrome-badge">PREVIEW</span>}
      <button
        type="button"
        className={'om-chrome-sound om-xp-chrome' + (on ? '' : ' is-off')}
        aria-label={on ? 'Turn sound off' : 'Turn sound on'}
        aria-pressed={on}
        onClick={() => setOn(music.toggle())}
      >
        <span aria-hidden="true">{on ? '🔈' : '🔇'}</span>
      </button>
    </>
  );
}

function Stage({ gift, preview, onExit, onDone, screenRef }) {
  const scenes = useMemo(() => buildScenes(gift), [gift]);
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(null); // { idx, offset }
  const layers = useRef({});
  const idxRef = useRef(0);

  // stop sound when the experience unmounts (preview closed, route change)
  useEffect(() => () => { music.stopVoice(); music.stop(0.4); }, []);

  const goNext = useCallback((from) => {
    if (from !== idxRef.current) return; // only the live scene may advance, and only once
    const to = Math.min(from + 1, scenes.length - 1);
    if (to === from) return;
    idxRef.current = to;
    const scroller = screenRef.current;
    setLeaving({ idx: from, offset: scroller ? scroller.scrollTop : 0 });
    setIdx(to);
  }, [scenes.length, screenRef]);

  // Cross-fade: outgoing layer blurs/shrinks away, incoming blooms in. Always land at the top.
  useLayoutEffect(() => {
    const scroller = screenRef.current;
    if (scroller) scroller.scrollTop = 0;
    const inEl = layers.current[idx];
    const outEl = leaving ? layers.current[leaving.idx] : null;
    if (reduced()) {
      if (inEl) gsap.set(inEl, { clearProps: 'all' });
      if (leaving) setLeaving(null);
      return;
    }
    const tl = gsap.timeline({ onComplete: () => setLeaving(null) });
    if (outEl) {
      gsap.set(outEl, { y: -leaving.offset });
      tl.to(outEl, {
        opacity: 0, scale: 0.965, rotationX: 6, yPercent: -1.5, filter: 'blur(12px)',
        transformOrigin: '50% 0%', duration: 0.7, ease: 'power2.inOut',
      }, 0);
    }
    if (inEl) {
      tl.fromTo(inEl,
        { opacity: 0, scale: 1.035, rotationX: -4, filter: 'blur(14px)', transformOrigin: '50% 100%' },
        { opacity: 1, scale: 1, rotationX: 0, filter: 'blur(0px)', duration: idx === 0 ? 1.1 : 0.9, ease: 'power3.out', clearProps: 'transform,filter' },
        outEl ? 0.22 : 0);
    }
    return () => tl.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const renderScene = (i, live) => {
    const s = scenes[i];
    const C = s.C;
    if (s.finale) return <C gift={gift} preview={!!preview} onDone={onDone} onExit={onExit} roomIndex={s.roomIndex} roomCount={s.roomCount} />;
    const onNext = live ? () => goNext(i) : () => {};
    if (s.door) return <C gift={gift} onNext={onNext} roomCount={s.roomCount} />;
    if (s.roomIndex != null) return <C gift={gift} onNext={onNext} roomIndex={s.roomIndex} roomCount={s.roomCount} />;
    return <C gift={gift} onNext={onNext} />;
  };

  const shown = leaving && leaving.idx !== idx ? [leaving.idx, idx] : [idx];
  return (
    <div className="om-xp-stage">
      {shown.map((i) => {
        const live = i === idx;
        return (
          <div
            key={i}
            ref={(el) => { if (el) layers.current[i] = el; else delete layers.current[i]; }}
            className={'om-xp-layer' + (live ? ' is-live' : ' is-leaving')}
            data-scene={scenes[i].id}
            aria-hidden={live ? undefined : true}
          >
            {renderScene(i, live)}
          </div>
        );
      })}
    </div>
  );
}

function Shell({ gift, preview, onExit, children }) {
  const screenRef = useRef(null);
  useLayoutEffect(() => {
    if (gift && screenRef.current) applyTheme(gift.vibe, screenRef.current);
  }, [gift && gift.vibe]);
  return (
    <div className="om-screen om-xp" ref={screenRef}>
      <div className="om-xp-grain" aria-hidden="true"><PaperGrain /></div>
      <div className="om-xp-vignette" aria-hidden="true" />
      {typeof children === 'function' ? children(screenRef) : children}
      <Chrome preview={preview} onExit={onExit} />
    </div>
  );
}

function Loading({ label = 'Unwrapping something…' }) {
  return (
    <section className="om-scene om-xp-status" aria-busy="true">
      <div className="om-xp-loader" aria-hidden="true"><span>♥</span></div>
      <p className="om-xp-status-text">{label}</p>
    </section>
  );
}

function Closed() {
  return (
    <section className="om-scene om-xp-status">
      <div className="om-xp-closed-card">
        <div className="om-xp-closed-sign" aria-hidden="true">
          <span>CLOSED</span>
        </div>
        <h1 className="om-xp-closed-title">This museum has closed</h1>
        <p className="om-xp-closed-sub">This link isn&rsquo;t open anymore. Ask whoever sent it for a fresh one, or build one back for them.</p>
        <a className="om-xp-closed-btn" href="/">Build my own &rarr;</a>
      </div>
    </section>
  );
}

export default function Experience({ gift: giftProp, preview = false, onExit, onDone }) {
  const { slug } = useParams();
  const [gift, setGift] = useState(giftProp || null);
  const [state, setState] = useState(giftProp ? 'ok' : 'loading');
  const [fontsOk, setFontsOk] = useState(false);

  useEffect(() => { if (giftProp) { setGift(giftProp); setState('ok'); } }, [giftProp]);

  useEffect(() => {
    if (giftProp) return undefined;
    if (!slug) { setState('missing'); return undefined; }
    let dead = false;
    getGift(slug)
      .then((g) => {
        if (dead) return;
        setGift(g); setState('ok');
        if (!preview) visit(slug).catch(() => {});
      })
      .catch(() => { if (!dead) setState('missing'); });
    return () => { dead = true; };
  }, [slug, giftProp, preview]);

  useEffect(() => {
    let dead = false;
    fontsReady().then(() => { if (!dead) setFontsOk(true); });
    return () => { dead = true; };
  }, []);

  if (state === 'missing' || (state === 'ok' && !gift)) {
    return <Shell preview={preview} onExit={onExit}><Closed /></Shell>;
  }
  if (state === 'loading' || !fontsOk) {
    return <Shell gift={gift} preview={preview} onExit={onExit}><Loading /></Shell>;
  }
  return (
    <Shell gift={gift} preview={preview} onExit={onExit}>
      {(screenRef) => <Stage gift={gift} preview={preview} onExit={onExit} onDone={onDone} screenRef={screenRef} />}
    </Shell>
  );
}
