import React from 'react';
import RibbonDivider from '../art/RibbonDivider.jsx';
import { OCCASIONS, KINDS, VIBES, SEALS } from '../config/options.js';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Step 7 "Have a look" summary card + meta chips. */
export default function Summary({ gift, hasVoice }) {
  const occ = OCCASIONS.find((o) => o.id === gift.occasion) || OCCASIONS[0];
  const kind = KINDS.find((k) => k.id === gift.relation) || KINDS[0];
  const vibe = VIBES.find((v) => v.id === gift.vibe) || VIBES[0];
  const seal = SEALS.find((s) => s.id === gift.seal) || SEALS[0];

  const rooms = [
    ['🎀', 'The gift', true],
    ['🏹', 'The arrow', true],
    ['🚪', 'The door', true],
    ['🖼️', 'The gallery', gift.photos.length > 0],
    ['🧩', 'The puzzle', gift.photos.some((p) => p.puzzle)],
    ['📝', 'The note wall', gift.notes.length > 0],
    ['✉️', 'The letter', !!gift.letter],
    ['🤞', 'The promises', gift.promises.length > 0],
    ['🎁', 'Something to keep', true],
  ];
  const meta = [
    [occ.emoji, occ.label],
    [vibe.emoji, vibe.label],
    ['📝', plural(gift.notes.length, 'note', 'notes')],
    [seal.emoji, seal.label],
    ['✍️', plural(gift.promises.length, 'promise', 'promises')],
  ];
  if (gift.photos.length) meta.splice(2, 0, ['📸', plural(gift.photos.length, 'photo', 'photos')]);
  if (hasVoice) meta.push(['🎙️', 'a voice note']);

  return (
    <>
      <div className="wz-pv" data-reveal>
        <div className="wz-pv-band"><RibbonDivider /></div>
        <div className="wz-pv-to">For {gift.herName || 'you'}</div>
        <div className="wz-pv-from">from {gift.yourName || 'someone'} — {kind.phrase}</div>
        <ul className="wz-rooms" aria-label="Rooms in her museum">
          {rooms.map(([ic, t, on], i) => (
            <li key={t} className={'wz-room' + (on ? '' : ' is-off')} style={{ '--d': `${i * 45}ms` }}
              title={on ? t : `${t} (nothing added yet)`}>
              <span aria-hidden="true">{ic}</span> {t}
            </li>
          ))}
        </ul>
      </div>
      <ul className="wz-meta" data-reveal>
        {meta.map(([ic, t]) => (
          <li key={t} className="wz-metachip"><span aria-hidden="true">{ic}</span> <b>{t}</b></li>
        ))}
      </ul>
    </>
  );
}
