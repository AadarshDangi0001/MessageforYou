// Shared sketch helpers for the hand-drawn SVG art (pure presentation, no app logic).
import { useState } from 'react';

let seq = 0;

export const INK = '#2b1a1a';

/** Unique, url()-safe id factory per component instance.
 *  A module counter (not useId) so ids stay unique even across separate React roots/renders. */
export function useSketchIds() {
  const [raw] = useState(() => (++seq).toString(36));
  const id = (name) => `om-${name}-${raw}`;
  const url = (name) => `url(#${id(name)})`;
  return { id, url };
}

/** Responsive SVG root props: viewBox, width 100%, height auto, merged class/style. */
export function svgProps(viewBox, cls, className, style) {
  return {
    viewBox,
    xmlns: 'http://www.w3.org/2000/svg',
    className: ['om-art', cls, className].filter(Boolean).join(' '),
    style: { width: '100%', height: 'auto', display: 'block', overflow: 'visible', ...style },
    'aria-hidden': true,
    focusable: 'false',
  };
}

/** Wobbly-line filter. Apply with filter={url('wob')}. */
export function Wobble({ id, scale = 2.2, freq = 0.035, seed = 3 }) {
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed={seed} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={scale} xChannelSelector="R" yChannelSelector="G" />
    </filter>
  );
}

/** Pencil hatching: a pattern of thin diagonal strokes over a soft base colour. */
export function Hatch({ id, bg, color, angle = 35, gap = 4, width = 1.1, opacity = 0.75 }) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform={`rotate(${angle})`}>
      <rect width={gap} height={gap} fill={bg} />
      <line x1="0" y1="0" x2="0" y2={gap} stroke={color} strokeWidth={width} strokeOpacity={opacity} />
    </pattern>
  );
}

/** Common stroke props for the dark sketch line. */
export const line = (w = 2) => ({
  stroke: INK, strokeWidth: w, strokeLinecap: 'round', strokeLinejoin: 'round',
});
