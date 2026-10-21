import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { reduced, haptic, revealIn, burst } from '../../lib/motion.js';
import * as audio from '../audio.js';
import { RoomDots } from './Room1Gallery.jsx';
import './museum.css';

const play = (name) => { try { const fn = audio[name]; if (typeof fn === 'function') fn(); } catch (e) {} };
const N = 3;
const PUZZLE_SKIP_MS = 25000;
const DRAG_PX = 6;

function shuffled() {
  const a = [...Array(N * N).keys()];
  // shuffle until no more than two pieces sit in their home slot (and never solved)
  do {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  } while (a.filter((v, i) => v === i).length > 2);
  return a;
}
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const slotPos = (slot) => ({ left: `${(slot % N) * (100 / N)}%`, top: `${Math.floor(slot / N) * (100 / N)}%` });

export default function Room2Puzzle({ gift, onNext, roomIndex = 1, roomCount }) {
  const rootRef = useRef(null);
  const boardRef = useRef(null);
  const matRef = useRef(null);
  const pieceEls = useRef({});
  const prevRects = useRef(null);
  const drag = useRef(null);
  const done = useRef(false);

  const photo = useMemo(() => {
    const all = (gift?.photos || []).filter((p) => p && p.url);
    return all.find((p) => p.puzzle) || all[all.length - 1] || null;
  }, [gift]);

  const [order, setOrder] = useState(shuffled);   // order[slot] = piece id
  const [sel, setSel] = useState(null);           // selected slot
  const [moves, setMoves] = useState(0);
  const [secs, setSecs] = useState(0);
  const [peek, setPeek] = useState(false);
  const [canSkip, setCanSkip] = useState(false);
  const [solved, setSolved] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [dragSlot, setDragSlot] = useState(null);

  useLayoutEffect(() => { const t = revealIn(rootRef.current); return () => t && t.kill(); }, []);

  // timer + skip offer
  useEffect(() => {
    if (solved) return undefined;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [solved]);
  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), reduced() ? 400 : PUZZLE_SKIP_MS);
    return () => clearTimeout(t);
  }, []);

  // FLIP: animate pieces from where they were to their new slot
  useLayoutEffect(() => {
    const before = prevRects.current;
    prevRects.current = null;
    if (!before) return;
    if (reduced()) { Object.values(pieceEls.current).forEach((el) => el && gsap.set(el, { x: 0, y: 0, scale: 1, zIndex: '' })); return; }
    Object.entries(pieceEls.current).forEach(([id, el]) => {
      if (!el || !before[id]) return;
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0, scale: 1 });
      const now = el.getBoundingClientRect();
      const dx = before[id].left - now.left, dy = before[id].top - now.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) { gsap.set(el, { x: 0, y: 0 }); return; }
      gsap.fromTo(el, { x: dx, y: dy, scale: 1.06, zIndex: 5 },
        { x: 0, y: 0, scale: 1, duration: 0.42, ease: 'back.out(1.5)', clearProps: 'zIndex', onComplete: () => gsap.set(el, { zIndex: '' }) });
    });
  }, [order]);

  const snapshot = () => {
    const r = {};
    Object.entries(pieceEls.current).forEach(([id, el]) => { if (el) r[id] = el.getBoundingClientRect(); });
    prevRects.current = r;
  };

  const onSolved = () => {
    setSolved(true);
    setSel(null);
    haptic([14, 50, 20]);
    play('chime');
    setTimeout(() => { if (matRef.current) burst(matRef.current, { count: 30, glyphs: ['♥', '✦', '❀', '■', '●'], colors: ['#E23B67', '#F0A93B', '#FF9DBA', '#B23A76', '#7FC8A9'] }); }, reduced() ? 0 : 380);
  };

  const swap = (a, b) => {
    if (a === b || solved) return;
    snapshot();
    const next = order.slice();
    [next[a], next[b]] = [next[b], next[a]];
    setOrder(next);
    setMoves((m) => m + 1);
    haptic(10);
    play('tick');
    if (next.every((v, i) => v === i)) onSolved();
  };

  const tapSlot = (slot) => {
    if (solved) return;
    if (sel === null) { setSel(slot); haptic(6); return; }
    if (sel === slot) { setSel(null); return; }
    const a = sel; setSel(null); swap(a, slot);
  };

  const slotAt = (cx, cy) => {
    const r = boardRef.current && boardRef.current.getBoundingClientRect();
    if (!r) return -1;
    const c = Math.floor(((cx - r.left) / r.width) * N), w = Math.floor(((cy - r.top) / r.height) * N);
    if (c < 0 || c >= N || w < 0 || w >= N) return -1;
    return w * N + c;
  };

  const onDown = (slot) => (e) => {
    if (solved) return;
    e.preventDefault();
    const el = e.currentTarget;
    try { el.setPointerCapture(e.pointerId); } catch (err) {}
    drag.current = { slot, el, x: e.clientX, y: e.clientY, moving: false };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.moving && Math.hypot(dx, dy) > DRAG_PX) { d.moving = true; setDragSlot(d.slot); setSel(null); }
    if (d.moving) gsap.set(d.el, { x: dx, y: dy, scale: 1.08, zIndex: 10 });
  };
  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    try { d.el.releasePointerCapture(e.pointerId); } catch (err) {}
    if (!d.moving) { tapSlot(d.slot); return; }
    setDragSlot(null);
    const target = slotAt(e.clientX, e.clientY);
    if (target < 0 || target === d.slot) {
      gsap.to(d.el, { x: 0, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.6)', onComplete: () => gsap.set(d.el, { zIndex: '' }) });
      return;
    }
    swap(d.slot, target);   // FLIP measures the dragged piece from where it was dropped
  };
  const onCancel = () => {
    const d = drag.current; drag.current = null; setDragSlot(null);
    if (d && d.moving) gsap.to(d.el, { x: 0, y: 0, scale: 1, duration: 0.3 });
  };

  const showMe = () => {
    if (solved) return;
    snapshot();
    setSkipped(true);
    setOrder([...Array(N * N).keys()]);
    onSolved();
  };

  const startPeek = (e) => { if (e) e.preventDefault(); if (!solved) setPeek(true); };
  const endPeek = () => setPeek(false);
  const finish = () => { if (done.current) return; done.current = true; onNext && onNext(); };

  const bg = photo ? `url("${String(photo.url).replace(/"/g, '\\"')}")` : 'none';

  return (
    <section ref={rootRef} className="om-scene om-mu-room om-mu-puzzle">
      <header className="om-mu-head">
        <p className="om-mu-eyebrow" data-reveal>Room 2 · The restoration desk</p>
        <h1 className="om-mu-h1" data-reveal>This photo fell <span className="om-accent">apart</span>.</h1>
        <p className="om-mu-sub" data-reveal>Nine pieces. Tap two to swap them, or drag one where you want it.</p>
      </header>

      {!photo ? (
        <div className="om-mu-empty" data-reveal>This desk is empty today. Walk on through.</div>
      ) : (
        <>
          <div className="om-mu-pz-stats" data-reveal>
            <span>Moves <b>{moves}</b></span>
            <span>⏱️ <b>{fmt(secs)}</b></span>
          </div>

          <div ref={matRef} className={`om-mu-pzmat${solved ? ' is-solved' : ''}${peek ? ' is-peek' : ''}`} data-reveal>
            <div ref={boardRef} className="om-mu-board" role="grid" aria-label="Photo puzzle, three by three">
              {order.map((piece, slot) => {
                const c = piece % N, r = Math.floor(piece / N);
                return (
                  <button
                    key={piece}
                    type="button"
                    ref={(el) => { pieceEls.current[piece] = el; }}
                    className={`om-mu-piece${sel === slot ? ' is-sel' : ''}${dragSlot === slot ? ' is-drag' : ''}${piece === slot && !solved ? ' is-home' : ''}`}
                    style={{ ...slotPos(slot), backgroundImage: bg, backgroundPosition: `${c * 50}% ${r * 50}%` }}
                    aria-label={`Piece ${piece + 1}, in slot ${slot + 1}${sel === slot ? ', selected' : ''}`}
                    onPointerDown={onDown(slot)}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onCancel}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapSlot(slot); } }}
                    disabled={solved}
                  />
                );
              })}
              <div className="om-mu-peeklayer" style={{ backgroundImage: bg }} aria-hidden="true" />
            </div>
          </div>

          {!solved ? (
            <div className="om-mu-pz-tools" data-reveal>
              <button
                type="button"
                className="om-mu-peek"
                onPointerDown={startPeek}
                onPointerUp={endPeek}
                onPointerLeave={endPeek}
                onPointerCancel={endPeek}
                onContextMenu={(e) => e.preventDefault()}
                onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') startPeek(e); }}
                onKeyUp={endPeek}
                onBlur={endPeek}
              >👁️ Hold to peek</button>
              {canSkip && <button type="button" className="om-mu-skip om-mu-skip-in" onClick={showMe}>Just show me the photo →</button>}
            </div>
          ) : (
            <div className="om-mu-pz-done">
              {photo.caption && <p className="om-mu-pz-cap">“{photo.caption}”</p>}
              <p className="om-mu-pz-score">
                {skipped ? 'Restored, with a little help. It still counts.' : <>Put back together in <b>{moves}</b> moves and <b>{fmt(secs)}</b>.</>}
              </p>
            </div>
          )}
        </>
      )}

      <div className="om-mu-foot">
        {(solved || !photo) && <button type="button" className="om-mu-cta om-mu-cta-in" onClick={finish}>Next room →</button>}
      </div>
      <RoomDots roomIndex={roomIndex} roomCount={roomCount} />
    </section>
  );
}
