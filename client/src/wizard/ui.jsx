import React from 'react';
import { haptic } from '../lib/motion.js';

/** 2-column grid of dashed "+" suggestion pills. */
export function Sugs({ items, isUsed = () => false, isOn = () => false, onPick }) {
  return (
    <div className="wz-sugs">
      {items.map((s) => {
        const used = isUsed(s);
        return (
          <button key={s} type="button" disabled={used}
            className={'wz-sug' + (used ? ' is-used' : '') + (isOn(s) ? ' is-on' : '')}
            onClick={() => { haptic(8); onPick(s); }}>
            <i aria-hidden="true">{isOn(s) ? '✓' : '+'}</i><span>{s}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Chosen items as removable chips. */
export function Chosen({ items, onRemove }) {
  if (!items.length) return null;
  return (
    <ul className="wz-chosen">
      {items.map((n) => (
        <li key={n} className="wz-rchip">
          <span>{n}</span>
          <button type="button" onClick={() => onRemove(n)} aria-label={`Remove "${n}"`}>×</button>
        </li>
      ))}
    </ul>
  );
}

/** Picker tiles (occasion, kind, seal, sticker). */
export function Tiles({ items, value, onPick, small = false, labelled = true }) {
  return (
    <div className={'wz-tiles' + (small ? ' wz-picks' : '')} role="radiogroup">
      {items.map((o) => {
        const on = value === o.id;
        return (
          <button key={o.id} type="button" role="radio" aria-checked={on} aria-label={o.label}
            className={'wz-tile' + (on ? ' is-on' : '')}
            onClick={() => { haptic(10); onPick(o.id); }}>
            <span className="wz-tile-ic" aria-hidden="true">{o.emoji}</span>
            {labelled && <span className="wz-tile-t">{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Vibes({ items, value, onPick }) {
  return (
    <div className="wz-vibes" role="radiogroup">
      {items.map((v) => {
        const on = value === v.id;
        return (
          <button key={v.id} type="button" role="radio" aria-checked={on}
            className={'wz-vibe' + (on ? ' is-on' : '')}
            style={{ '--v-a': v.colors.accent, '--v-b': v.colors.accent2, '--v-bg': v.colors.bg }}
            onClick={() => { haptic(10); onPick(v.id); }}>
            <span className="wz-vibe-ic" aria-hidden="true">{v.emoji}</span>
            <span className="wz-vibe-t"><b>{v.label}</b><small>{v.sub}</small></span>
            <span className="wz-vibe-sw" aria-hidden="true">
              <i style={{ background: v.colors.bg }} /><i style={{ background: v.colors.accent }} /><i style={{ background: v.colors.accent2 }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
