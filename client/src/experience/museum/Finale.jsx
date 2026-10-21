import { useEffect, useMemo, useRef, useState } from 'react';
import PaperGrain from '../../art/PaperGrain.jsx';
import * as audio from '../audio.js';
import { reduced, haptic, revealIn, burst } from '../../lib/motion.js';
import { OCCASIONS } from '../../config/options.js';
import './finale.css';

const ODO_MS = 1500;
const HOLD_MS = 650;

/* ---------- small shared helpers (also used by Room4Letter / Room5Promises) ---------- */

/** Call an audio helper by name if it exists (audio.js is owned by another agent). */
export const sfx = (name, ...args) => {
  try { const f = audio[name]; if (typeof f === 'function') return f(...args); } catch (e) {}
  return null;
};
export const duck = (on) => {
  try { const m = audio.music; if (m && typeof m.duck === 'function') m.duck(on); } catch (e) {}
};

const CONFETTI = ['#E23B67', '#FF7FA3', '#7C5CE0', '#F0A93B', '#B23A76', '#FFB3C8'];

/** Lightweight falling confetti/petals. CSS-only animation, capped particle count. */
export function ConfettiRain({ count = 26, once = false, petals = false }) {
  const pieces = useMemo(() => Array.from({ length: Math.min(count, 48) }, (_, i) => {
    const kind = petals && i % 3 === 0 ? (i % 2 ? 'petal' : 'heart') : 'strip';
    return {
      kind,
      left: Math.random() * 100,
      dur: (once ? 2.2 : 7) + Math.random() * (once ? 1.6 : 6),
      delay: once ? Math.random() * 0.9 : -Math.random() * 12,
      sway: (Math.random() * 2 - 1) * 40,
      rot: Math.random() * 360,
      size: 0.7 + Math.random() * 0.6,
      color: CONFETTI[i % CONFETTI.length],
    };
  }), [count, once, petals]);
  if (reduced()) return null;
  return (
    <div className={`om-fn-rain${once ? ' is-once' : ''}`} aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="om-fn-rain-col"
          style={{ left: `${p.left}%`, '--dur': `${p.dur}s`, '--delay': `${p.delay}s` }}
        >
          <i
            className={`om-fn-rain-p is-${p.kind}`}
            style={{ '--sway': `${p.sway}px`, '--rot': `${p.rot}deg`, '--s': p.size, '--c': p.color }}
          >{p.kind === 'heart' ? '♥' : null}</i>
        </span>
      ))}
    </div>
  );
}

/** Room-progress pill. `index` is the 0-based current room, `count` the number of rooms. */
export function RoomDots({ index, count }) {
  if (!count || count < 2 || index == null) return null;
  return (
    <div className="om-fn-dots" role="img" aria-label={`Room ${Math.min(index + 1, count)} of ${count}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className={`om-fn-dot${i < index ? ' is-done' : ''}${i === index ? ' is-now' : ''}`}>
          {i <= index ? '♥' : ''}
        </span>
      ))}
    </div>
  );
}

/* ---------- days counter ---------- */

export function daysSince(since) {
  if (!since || !since.year) return 0;
  const m = Math.min(12, Math.max(1, Number(since.month) || 1));
  const start = new Date(Number(since.year), m - 1, 1);
  const d = Math.floor((Date.now() - start.getTime()) / 864e5);
  return d > 0 ? d : 0;
}

function Odometer({ value, roll }) {
  const chars = value.toLocaleString('en-US').split('');
  const digits = chars.filter((c) => /\d/.test(c)).length;
  let di = 0;
  return (
    <p className="om-fn-odo" aria-label={`${value.toLocaleString('en-US')} days`}>
      {chars.map((c, i) => {
        if (!/\d/.test(c)) return <span key={i} className="om-fn-odo-sep" aria-hidden="true">{c}</span>;
        const d = Number(c);
        const k = di++;
        const delay = (k / Math.max(1, digits)) * 0.25;
        return (
          <span key={i} className="om-fn-odo-col" aria-hidden="true">
            <span
              className="om-fn-odo-strip"
              style={{
                transform: `translateY(${roll ? -(10 + d) * 5 : 0}%)`,
                transitionDuration: `${ODO_MS / 1000 - delay}s`,
                transitionDelay: `${delay}s`,
              }}
            >
              {Array.from({ length: 20 }, (_, n) => <span key={n}>{n % 10}</span>)}
            </span>
          </span>
        );
      })}
    </p>
  );
}

/* ---------- keepsake PNG (drawn by hand on a canvas) ---------- */

function heartPath(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.42);
  ctx.bezierCurveTo(cx - s * 1.05, cy - s * 0.2, cx - s * 0.5, cy - s * 0.98, cx, cy - s * 0.42);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.98, cx + s * 1.05, cy - s * 0.2, cx, cy + s * 0.42);
  ctx.closePath();
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function wrapLines(ctx, text, maxW, maxLines) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s,.;:!?]+\S*$/, '')}…`;
  }
  return lines;
}

async function renderKeepsake({ greeting, her, you, days, note }) {
  const fonts = ['600 46px "Shantell Sans"', '400 140px "Great Vibes"', '700 150px "DynaPuff"'];
  try { await Promise.all(fonts.map((f) => document.fonts && document.fonts.load(f))); } catch (e) {}

  const W = 1080, H = 1620, cx = W / 2;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, '#FBE3EC'); g.addColorStop(1, '#F6C1D3');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(cx, H * 0.3, 40, cx, H * 0.3, W * 0.8);
  glow.addColorStop(0, 'rgba(255,255,255,.55)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  // faint scattered hearts (seeded so the image is stable)
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  ctx.save();
  for (let i = 0; i < 28; i++) {
    ctx.globalAlpha = 0.06 + rnd() * 0.12;
    ctx.fillStyle = '#E9739C';
    heartPath(ctx, rnd() * W, rnd() * H, 22 + rnd() * 40);
    ctx.fill();
  }
  ctx.restore();

  const inset = 70;
  ctx.save();
  ctx.strokeStyle = 'rgba(226,59,103,.34)'; ctx.lineWidth = 3; ctx.setLineDash([14, 12]);
  roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, 44);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let y = 280;
  ctx.font = '600 46px "Shantell Sans", "Comic Sans MS", cursive';
  ctx.fillStyle = 'rgba(74,31,46,.62)';
  try { ctx.letterSpacing = '4px'; } catch (e) {}
  ctx.fillText(String(greeting).toUpperCase(), cx, y);
  try { ctx.letterSpacing = '0px'; } catch (e) {}

  // names in script, shrink to fit, two lines if they are very long
  const maxW = W - inset * 2 - 80;
  const names = `${her} & ${you}`;
  let size = 150;
  ctx.fillStyle = '#8A2458';
  const setScript = () => { ctx.font = `400 ${size}px "Great Vibes", cursive`; };
  setScript();
  while (ctx.measureText(names).width > maxW && size > 96) { size -= 6; setScript(); }
  y += size * 1.05 + 20;
  if (ctx.measureText(names).width > maxW) {
    for (const l of wrapLines(ctx, names, maxW, 2)) { ctx.fillText(l, cx, y); y += size * 0.95; }
    y -= size * 0.95;
  } else ctx.fillText(names, cx, y);

  y += 70;
  ctx.save();
  ctx.strokeStyle = 'rgba(226,59,103,.5)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - 90, y); ctx.lineTo(cx + 90, y); ctx.stroke();
  ctx.restore();

  if (days > 0) {
    y += 170;
    ctx.font = '700 150px "DynaPuff", "Baloo 2", sans-serif';
    ctx.fillStyle = '#E23B67';
    ctx.fillText(days.toLocaleString('en-US'), cx, y);
    y += 64;
    ctx.font = '600 40px "Shantell Sans", "Comic Sans MS", cursive';
    ctx.fillStyle = 'rgba(74,31,46,.62)';
    try { ctx.letterSpacing = '4px'; } catch (e) {}
    ctx.fillText('DAYS OF US, SO FAR', cx, y);
    try { ctx.letterSpacing = '0px'; } catch (e) {}
  }

  if (note) {
    y += days > 0 ? 130 : 170;
    ctx.font = '600 58px "Shantell Sans", "Comic Sans MS", cursive';
    ctx.fillStyle = 'rgba(74,31,46,.82)';
    const room = H - 420 - y;
    const lines = wrapLines(ctx, `“${note}”`, maxW - 40, Math.max(1, Math.min(4, Math.floor(room / 76) + 1)));
    for (const l of lines) { ctx.fillText(l, cx, y); y += 76; }
  }

  ctx.fillStyle = '#E9739C';
  heartPath(ctx, cx, H - 300, 78);
  ctx.fill();
  ctx.font = '600 40px "Shantell Sans", "Comic Sans MS", cursive';
  ctx.fillStyle = 'rgba(74,31,46,.55)';
  ctx.fillText('made by hand, for one person', cx, H - 160);

  return new Promise((resolve) => {
    if (c.toBlob) c.toBlob((b) => resolve(b), 'image/png');
    else {
      const bin = atob(c.toDataURL('image/png').split(',')[1]);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      resolve(new Blob([arr], { type: 'image/png' }));
    }
  });
}

/* ---------- the finale scene ---------- */

const CARD_HEARTS = [
  [12, 14, 1.1], [78, 10, 0.8], [88, 30, 1.2], [8, 46, 0.9], [70, 52, 0.7], [20, 70, 1],
  [84, 72, 0.9], [46, 34, 0.7], [62, 86, 1.1], [14, 90, 0.8], [36, 8, 0.7], [54, 62, 0.6],
];

export default function Finale({ gift = {}, preview, onDone, onExit, roomIndex, roomCount }) {
  const occ = OCCASIONS.find((o) => o.id === gift.occasion) || OCCASIONS[0];
  const her = gift.herName || 'you';
  const you = gift.yourName || 'me';
  const note = (gift.notes || []).map((n) => String(n || '').trim()).filter(Boolean)[0] || occ.tag || '';
  const days = daysSince(gift.since);

  const rootRef = useRef(null);
  const holdT = useRef(0);
  const [rolled, setRolled] = useState(false);
  const [holding, setHolding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheet, setSheet] = useState(null); // { url, file }

  useEffect(() => {
    const root = rootRef.current;
    revealIn(root, '[data-reveal]');
    sfx('chime');
    burst(root, { x: '50%', y: '22%', count: 40, glyphs: ['■', '●', '▲', '♥', '✦'], colors: CONFETTI });
    const t = setTimeout(() => setRolled(true), reduced() ? 0 : 450);
    return () => { clearTimeout(t); clearTimeout(holdT.current); };
  }, []);

  useEffect(() => () => { if (sheet) URL.revokeObjectURL(sheet.url); }, [sheet]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    haptic(25);
    sfx('pop');
    try {
      const blob = await renderKeepsake({ greeting: occ.greeting, her, you, days, note });
      if (blob) {
        const name = `${String(her).replace(/[^\w-]+/g, '-').toLowerCase() || 'our'}-keepsake.png`;
        let file = null;
        try { file = new File([blob], name, { type: 'image/png' }); } catch (e) {}
        setSheet({ url: URL.createObjectURL(blob), file, name });
      }
    } catch (e) {}
    setBusy(false);
  };

  const startHold = (e) => {
    if (e.button != null && e.button > 0) return;
    clearTimeout(holdT.current);
    setHolding(true);
    holdT.current = setTimeout(() => { setHolding(false); save(); }, HOLD_MS);
  };
  const endHold = () => { clearTimeout(holdT.current); setHolding(false); };

  const canShare = !!(sheet && sheet.file && navigator.canShare && (() => {
    try { return navigator.canShare({ files: [sheet.file] }); } catch (e) { return false; }
  })());
  const share = async () => {
    try { await navigator.share({ files: [sheet.file], title: 'Our keepsake 💞' }); } catch (e) {}
  };

  return (
    <section className="om-scene om-fn-room om-fn-finale" ref={rootRef}>
      <PaperGrain />
      <ConfettiRain count={30} petals />
      <div className="om-fn-inner">
        <header className="om-fn-head">
          <p className="om-fn-final-emoji" data-reveal aria-hidden="true">💞</p>
          <h1 className="om-fn-h1" data-reveal>{occ.greeting}, <span className="om-accent">{her}</span>.</h1>
        </header>

        <div
          className={`om-fn-keep${holding ? ' is-holding' : ''}${busy ? ' is-busy' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Keepsake card. Press and hold to save it as an image."
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); save(); } }}
          data-reveal
        >
          <span className="om-fn-keep-hearts" aria-hidden="true">
            {CARD_HEARTS.map(([x, y, s], i) => (
              <i key={i} style={{ left: `${x}%`, top: `${y}%`, '--s': s }}>♥</i>
            ))}
          </span>
          <div className="om-fn-keep-in">
            <p className="om-fn-keep-greet">{occ.greeting}</p>
            <p className="om-fn-keep-names">{her} &amp; {you}</p>
            <span className="om-fn-keep-rule" aria-hidden="true" />
            {days > 0 && (
              <div className="om-fn-odowrap">
                <Odometer value={days} roll={rolled} />
                <p className="om-fn-odo-unit">days of us, so far</p>
              </div>
            )}
            {note && <p className="om-fn-keep-note">“{note}”</p>}
            <svg className="om-fn-keep-heart" viewBox="0 0 48 44" aria-hidden="true">
              <path d="M24 41 C 8 30, 1 21, 3 12 C 5 3.5, 17 1, 24 11 C 31 1, 43 3.5, 45 12 C 47 21, 40 30, 24 41 Z" />
              <path className="om-fn-keep-heart-hi" d="M11 10 C 13 7.5, 16 7, 18 8.5" />
            </svg>
            <p className="om-fn-keep-made">made by hand, for one person</p>
          </div>
          <span className="om-fn-keep-hold" aria-hidden="true" />
        </div>

        <p className="om-fn-keephint" data-reveal>
          {busy ? 'Making your keepsake…' : 'Press and hold the card to save it 💞'}
        </p>

        <p className="om-fn-close" data-reveal>
          {preview
            ? `That is the whole thing — end to end, exactly as ${her} will get it.`
            : 'Nobody else has this link. It was made by hand, for one person, and that person is you.'}
        </p>

        {preview ? (
          <div className="om-fn-panel" data-reveal>
            <p className="om-fn-panel-h">Happy with it? 👌</p>
            <p className="om-fn-panel-s">
              Get the link and send it to {her}. Use ← Back at the top if you want to change something first.
            </p>
            <button type="button" className="om-fn-cta" onClick={() => onDone && onDone()}>
              Create the link for {her} →
            </button>
            <p className="om-fn-panel-note">💌 Free · no account needed</p>
            <button type="button" className="om-fn-ghost" onClick={() => onExit && onExit()}>↺ Watch again</button>
          </div>
        ) : (
          <div className="om-fn-tail" data-reveal>
            <a className="om-fn-cta" href="/">Build one back →</a>
          </div>
        )}

        <RoomDots index={roomIndex} count={roomCount} />
      </div>

      {sheet && (
        <div className="om-fn-sheet" role="dialog" aria-modal="true" aria-label="Save your keepsake" onClick={() => setSheet(null)}>
          <div className="om-fn-sheet-card" onClick={(e) => e.stopPropagation()}>
            <img src={sheet.url} alt={`Keepsake card for ${her} and ${you}`} />
            <div className="om-fn-sheet-row">
              {canShare && <button type="button" className="om-fn-cta" onClick={share}>Share 💞</button>}
              <a className={canShare ? 'om-fn-ghost' : 'om-fn-cta'} href={sheet.url} download={sheet.name}>⬇ Download</a>
            </div>
            <button type="button" className="om-fn-sheet-x" onClick={() => setSheet(null)}>Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
