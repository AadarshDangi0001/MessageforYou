import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { reduced, haptic, revealIn, burst } from '../../lib/motion.js';
import * as audio from '../audio.js';
import { RoomDots } from './Room1Gallery.jsx';
import './museum.css';

const play = (name) => { try { const fn = audio[name]; if (typeof fn === 'function') fn(); } catch (e) {} };
// cream sticky cards; each pin gets its own colour
const PINS = ['#E23B67', '#F0A93B', '#B23A76', '#4FA3A5', '#FF7FA3', '#8A6BC4'];
// stable "random" tilt per note
const tilt = (i) => [-3.2, 2.4, -1.6, 3.4, -2.6, 1.8, -3.8, 2.9][i % 8];

export default function Room3Notes({ gift, onNext, roomIndex = 2, roomCount }) {
  const rootRef = useRef(null);
  const done = useRef(false);
  const notes = useMemo(() => (gift?.notes || []).map((t) => String(t || '').trim()).filter(Boolean), [gift]);
  const [open, setOpen] = useState(() => notes.map(() => false));
  const opened = open.filter(Boolean).length;
  const all = opened >= notes.length;
  const from = (gift?.yourName || '').trim();

  useLayoutEffect(() => { const t = revealIn(rootRef.current, '[data-reveal]', { stagger: 0.07 }); return () => t && t.kill(); }, []);

  const toggle = (i, e) => {
    if (open[i]) return;
    setOpen((o) => { const c = o.slice(); c[i] = true; return c; });
    haptic(10);
    play('pop');
    const host = e.currentTarget;
    if (!reduced() && host) setTimeout(() => burst(host, { count: 8, glyphs: ['♡', '✦'], colors: ['#E23B67', '#F0A93B', '#B23A76'] }), 260);
  };

  const finish = () => { if (done.current) return; done.current = true; onNext && onNext(); };

  return (
    <section ref={rootRef} className="om-scene om-mu-room om-mu-notes">
      <header className="om-mu-head">
        <p className="om-mu-eyebrow" data-reveal>Room 3 · The note wall</p>
        <h1 className="om-mu-h1" data-reveal>{from || 'They'} wrote these <span className="om-accent">about you</span></h1>
        <p className="om-mu-sub" data-reveal>Tap each note to open it.</p>
      </header>

      {notes.length === 0 ? (
        <div className="om-mu-empty" data-reveal>The notes are all in their heart today. Walk on through.</div>
      ) : (
        <>
          <ul className={`om-mu-wall${notes.length === 1 ? ' is-one' : ''}`}>
            {notes.map((t, i) => (
              <li key={i} className="om-mu-note-cell" data-reveal style={{ '--tilt': `${tilt(i)}deg` }}>
                <button
                  type="button"
                  className={`om-mu-note${open[i] ? ' is-open' : ''}`}
                  style={{ '--pin': PINS[i % PINS.length] }}
                  onClick={(e) => toggle(i, e)}
                  aria-expanded={open[i]}
                  aria-label={open[i] ? `Note ${i + 1}: ${t}` : `Open note ${i + 1}`}
                >
                  <span className="om-mu-pin" aria-hidden="true" />
                  <span className="om-mu-note-inner">
                    <span className="om-mu-note-face om-mu-note-front" aria-hidden={open[i]}>
                      <span className="om-mu-note-glyph">📄</span>
                      <span className="om-mu-note-lbl">Note {i + 1}</span>
                    </span>
                    <span className="om-mu-note-face om-mu-note-back" aria-hidden={!open[i]}>
                      <span className="om-mu-note-text">{t}</span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="om-mu-wallcount" aria-live="polite">{opened} of {notes.length} opened</p>
        </>
      )}

      <div className="om-mu-foot">
        <button type="button" className="om-mu-cta" onClick={finish} disabled={!all}>
          {all ? 'Next room →' : 'Open every note first'}
        </button>
      </div>
      <RoomDots roomIndex={roomIndex} roomCount={roomCount} />
    </section>
  );
}
