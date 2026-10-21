import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { reduced, haptic, revealIn, burst } from '../../lib/motion.js';
import * as audio from '../audio.js';
import './museum.css';

const play = (name) => { try { const fn = audio[name]; if (typeof fn === 'function') fn(); } catch (e) {} };

const ROOM_ICONS = ['🖼️', '🧩', '📝', '✉️', '🤞', '🎁', '✨', '💞'];
/** Room-progress pill: one dot per room, filled for rooms visited (roomIndex is 0-based). */
export function RoomDots({ roomIndex, roomCount }) {
  const total = Number(roomCount) > 0 ? Number(roomCount) : 0;
  const at = Number.isFinite(Number(roomIndex)) ? Number(roomIndex) : -1;
  if (!total) return null;
  return (
    <div className="om-mu-roomdots" role="img" aria-label={`Room ${Math.max(0, at) + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`om-mu-roomdot${i <= at ? ' is-on' : ''}${i === at ? ' is-cur' : ''}`}>{i <= at ? ROOM_ICONS[i % ROOM_ICONS.length] : ''}</span>
      ))}
    </div>
  );
}

const REVEAL_AT = 0.5;      // fraction of foil cleared before it falls away
const SKIP_AFTER = 2;       // gentle "keep walking anyway" after this many reveals

/** Paint a gold foil with grain and sparkles onto ctx (device px). */
function paintFoil(ctx, w, h, dpr, seed) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#F7DB93'); g.addColorStop(0.28, '#E6B655'); g.addColorStop(0.5, '#FBE8B4');
  g.addColorStop(0.72, '#D9A441'); g.addColorStop(1, '#F3CF7E');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  // soft pastel sheen
  const sheen = ctx.createRadialGradient(w * 0.3, h * 0.25, 0, w * 0.3, h * 0.25, Math.max(w, h) * 0.7);
  sheen.addColorStop(0, 'rgba(255,214,228,.45)'); sheen.addColorStop(1, 'rgba(255,214,228,0)');
  ctx.fillStyle = sheen; ctx.fillRect(0, 0, w, h);
  // deterministic pseudo-random
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  // grain
  const grains = Math.round((w * h) / (90 * dpr * dpr));
  for (let i = 0; i < grains; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(255,250,230,.35)' : 'rgba(150,100,20,.16)';
    ctx.fillRect(rnd() * w, rnd() * h, dpr, dpr);
  }
  // diagonal brushed lines
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = dpr;
  for (let x = -h; x < w; x += 7 * dpr) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke(); }
  // sparkles (four-point stars)
  const stars = Math.round((w * h) / (5200 * dpr * dpr)) + 6;
  for (let i = 0; i < stars; i++) {
    const x = rnd() * w, y = rnd() * h, r = (3 + rnd() * 7) * dpr;
    ctx.fillStyle = rnd() > 0.35 ? 'rgba(255,255,255,.85)' : 'rgba(255,190,214,.8)';
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r * 0.42, y);
    ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r * 0.42, y);
    ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  }
  ctx.restore();
}

/** Scratch-off canvas over one exhibit. Calls onReveal once ~50% is cleared. */
function ScratchFoil({ seed, gone, onReveal, onStart }) {
  const cvRef = useRef(null);
  const st = useRef({ ctx: null, down: false, last: null, moves: 0, done: false, dpr: 1 });

  const setup = useCallback(() => {
    const cv = cvRef.current;
    if (!cv || st.current.done) return;
    const rect = cv.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(rect.width * dpr), h = Math.round(rect.height * dpr);
    if (!w || !h) return;
    if (cv.width === w && cv.height === h && st.current.ctx) return;
    // keep what was already scratched when the frame resizes
    let snap = null;
    if (st.current.ctx && cv.width && cv.height) {
      snap = document.createElement('canvas');
      snap.width = cv.width; snap.height = cv.height;
      snap.getContext('2d').drawImage(cv, 0, 0);
    }
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) { st.current.done = true; onReveal(); return; }
    paintFoil(ctx, w, h, dpr, seed);
    if (snap) { ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(snap, 0, 0, w, h); }
    ctx.globalCompositeOperation = 'destination-out';
    st.current.ctx = ctx; st.current.dpr = dpr;
  }, [seed, onReveal]);

  useEffect(() => {
    setup();
    const cv = cvRef.current;
    if (!cv || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setup());
    ro.observe(cv);
    return () => ro.disconnect();
  }, [setup]);

  const dab = (x, y) => {
    const ctx = st.current.ctx;
    const r = Math.max(14 * st.current.dpr, ctx.canvas.width * 0.085);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    return r;
  };

  const scratchTo = (cx, cy) => {
    const cv = cvRef.current, s = st.current;
    if (!s.ctx || !cv) return;
    const rect = cv.getBoundingClientRect();
    if (!rect.width) return;
    const x = (cx - rect.left) * (cv.width / rect.width);
    const y = (cy - rect.top) * (cv.height / rect.height);
    if (s.last) {
      const dx = x - s.last.x, dy = y - s.last.y, dist = Math.hypot(dx, dy);
      const step = Math.max(2, Math.max(14 * s.dpr, cv.width * 0.085) / 3);
      for (let d = step; d < dist; d += step) dab(s.last.x + (dx * d) / dist, s.last.y + (dy * d) / dist);
    }
    dab(x, y);
    s.last = { x, y };
  };

  const cleared = () => {
    const ctx = st.current.ctx;
    if (!ctx) return 0;
    try {
      const { width, height } = ctx.canvas;
      const data = ctx.getImageData(0, 0, width, height).data;
      let n = 0, clear = 0;
      for (let i = 3; i < data.length; i += 4 * 23) { n++; if (data[i] < 40) clear++; }
      return n ? clear / n : 0;
    } catch (e) { return 1; }
  };

  const reveal = () => {
    if (st.current.done) return;
    st.current.done = true; st.current.down = false; st.current.ctx = null;
    onReveal();
  };

  const onDown = (e) => {
    if (st.current.done || !st.current.ctx) return;
    e.preventDefault();
    st.current.down = true; st.current.last = null;
    try { cvRef.current.setPointerCapture(e.pointerId); } catch (err) {}
    onStart && onStart();
    scratchTo(e.clientX, e.clientY);
  };
  const onMove = (e) => {
    if (!st.current.down) return;
    e.preventDefault();
    scratchTo(e.clientX, e.clientY);
    if (++st.current.moves % 8 === 0 && cleared() > REVEAL_AT) reveal();
  };
  const onUp = (e) => {
    if (!st.current.down) return;
    st.current.down = false; st.current.last = null;
    try { cvRef.current.releasePointerCapture(e.pointerId); } catch (err) {}
    if (cleared() > REVEAL_AT) reveal();
  };

  return (
    <canvas
      ref={cvRef}
      className={`om-mu-scratch${gone ? ' is-gone' : ''}`}
      aria-label="Covered photo. Drag your finger across to scratch it off."
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    />
  );
}

export default function Room1Gallery({ gift, onNext, roomIndex = 0, roomCount }) {
  const rootRef = useRef(null);
  const exhRef = useRef(null);
  const wrapRef = useRef(null);
  const done = useRef(false);
  const swipe = useRef(null);

  const photos = useMemo(() => {
    const all = (gift?.photos || []).filter((p) => p && p.url);
    const rest = all.filter((p) => !p.puzzle);
    return rest.length ? rest : all;
  }, [gift]);
  const n = photos.length;
  const from = (gift?.yourName || '').trim();

  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(() => (reduced() ? photos.map(() => true) : photos.map(() => false)));
  const [hintOff, setHintOff] = useState(false);
  const [fading, setFading] = useState(-1);   // index whose foil is fading out right now
  const count = revealed.filter(Boolean).length;
  const allDone = n > 0 && count >= n;
  const cur = photos[idx];
  const isClear = !!revealed[idx];

  useLayoutEffect(() => { const t = revealIn(rootRef.current); return () => t && t.kill(); }, []);
  useEffect(() => { setHintOff(false); }, [idx]);

  const go = (dir) => {
    if (n < 2) return;
    const nextIdx = (idx + dir + n) % n;
    const el = exhRef.current;
    if (!el || reduced()) { setIdx(nextIdx); return; }
    gsap.to(el, {
      x: -dir * 60, opacity: 0, rotate: -dir * 1.5, duration: 0.22, ease: 'power2.in',
      onComplete: () => {
        setIdx(nextIdx);
        gsap.fromTo(el, { x: dir * 70, opacity: 0, rotate: dir * 1.5 }, { x: 0, opacity: 1, rotate: 0, duration: 0.45, ease: 'power3.out' });
      },
    });
    haptic(8);
  };

  const onReveal = useCallback(() => {
    setRevealed((r) => { const c = r.slice(); c[idx] = true; return c; });
    setFading(idx);
    setTimeout(() => setFading((f) => (f === idx ? -1 : f)), 800);
    haptic(14);
    play('pop');
    if (wrapRef.current) burst(wrapRef.current, { glyphs: ['✦', '✧', '♡', '·'], colors: ['#F0A93B', '#FFE6B4', '#FF9DBA', '#fff'], count: 22 });
  }, [idx]);

  // swipe left/right once a photo is uncovered (the foil itself captures the finger while covered)
  const onSwipeDown = (e) => { if (isClear) swipe.current = { x: e.clientX, y: e.clientY }; };
  const onSwipeUp = (e) => {
    const s = swipe.current; swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
  };

  const finish = () => { if (done.current) return; done.current = true; onNext && onNext(); };

  return (
    <section ref={rootRef} className="om-scene om-mu-room om-mu-gallery">
      <header className="om-mu-head">
        <p className="om-mu-eyebrow" data-reveal>Room 1 · The gallery</p>
        <h1 className="om-mu-h1" data-reveal>Our <span className="om-accent">photos</span></h1>
        <p className="om-mu-sub" data-reveal>Each one is covered. Rub your finger across to see it.</p>
      </header>

      {n === 0 ? (
        <div className="om-mu-empty" data-reveal>The walls are still being hung. Walk on through.</div>
      ) : (
        <div className="om-mu-exhibit" data-reveal>
          <div ref={exhRef} className="om-mu-exh-slide">
            <figure className="om-mu-frame">
              <div
                ref={wrapRef}
                className={`om-mu-exh-wrap${isClear ? ' is-clear' : ''}`}
                onPointerDown={onSwipeDown}
                onPointerUp={onSwipeUp}
                onPointerCancel={() => { swipe.current = null; }}
              >
                <img className="om-mu-exh-img" src={cur.url} alt={isClear ? (cur.caption || `Exhibit ${idx + 1}`) : `Exhibit ${idx + 1}, still covered`} draggable={false} />
                {(!isClear || fading === idx) && <ScratchFoil key={idx} seed={idx + 3} gone={isClear} onReveal={onReveal} onStart={() => setHintOff(true)} />}
                {!isClear && (
                  <div className={`om-mu-scratch-hint${hintOff ? ' is-off' : ''}`} aria-hidden="true">
                    <span className="om-mu-scratch-finger">👈</span>
                    <b>Scratch to see it</b>
                    <small>drag your finger across</small>
                  </div>
                )}
              </div>
            </figure>
            <div className="om-mu-plaque">
              <span className="om-mu-plaque-n">Exhibit {idx + 1}</span>
              <b className="om-mu-plaque-cap">{isClear ? (cur.caption || 'Untitled') : 'Untitled'}</b>
              <small>from the {from ? `${from}` : 'private'} collection</small>
            </div>
          </div>

          <div className="om-mu-exh-nav">
            <button type="button" className="om-mu-arrow" onClick={() => go(-1)} disabled={n < 2} aria-label="Previous photo">←</button>
            <div className="om-mu-exh-mid">
              <span className="om-mu-exh-count">{idx + 1} / {n}</span>
              <span className="om-mu-dots" aria-hidden="true">
                {photos.map((_, i) => <i key={i} className={`${i === idx ? 'is-cur' : ''}${revealed[i] ? ' is-done' : ''}`} />)}
              </span>
            </div>
            <button type="button" className={`om-mu-arrow${isClear && !allDone && n > 1 ? ' is-nudge' : ''}`} onClick={() => go(1)} disabled={n < 2} aria-label="Next photo">→</button>
          </div>
        </div>
      )}

      <div className="om-mu-foot" data-reveal>
        <button type="button" className="om-mu-cta" onClick={finish} disabled={n > 0 && !allDone}>
          {n > 0 && !allDone ? `Uncover every photo · ${count} / ${n}` : 'Keep walking →'}
        </button>
        {n > 0 && !allDone && count >= Math.min(SKIP_AFTER, n) && (
          <button type="button" className="om-mu-skip" onClick={finish}>or keep walking anyway →</button>
        )}
      </div>
      <RoomDots roomIndex={roomIndex} roomCount={roomCount} />
    </section>
  );
}
