// A soft, painted-look rose head (layered petals, subtle gradients, two leaves).
// Default export <Rose color="pink|coral|white" />.
// Named export <RoseSymbolDefs /> renders a hidden <svg> with <symbol id="om-rose-pink|coral|white"> for
// light-weight showers: <svg viewBox="-50 -50 100 100"><use href="#om-rose-pink" /></svg>.
import { useSketchIds, svgProps } from './sketch.jsx';

export const ROSE_COLORS = {
  pink:  { light: '#fcd6e2', mid: '#ef94b4', dark: '#c4527d', core: '#a83a64', edge: '#b04772' },
  coral: { light: '#f8c9ad', mid: '#de8c69', dark: '#b55d3e', core: '#93432a', edge: '#a2502f' },
  white: { light: '#fffdf4', mid: '#f1ecd9', dark: '#cfc6a4', core: '#b3a982', edge: '#beb38d' },
};

// petal pointing up from the origin, ~46 units long
const PETAL = 'M0 0 C-20 -4 -26 -32 -13 -42 C-5 -47 5 -47 13 -42 C26 -32 20 -4 0 0 Z';
const LAYERS = [
  { n: 7, s: 1, off: 0 },
  { n: 6, s: 0.74, off: 26 },
  { n: 5, s: 0.5, off: 12 },
];

function RoseDefs({ g, c }) {
  return (
    <>
      <linearGradient id={g('petal')} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor={c.dark} />
        <stop offset="0.55" stopColor={c.mid} />
        <stop offset="1" stopColor={c.light} />
      </linearGradient>
      <radialGradient id={g('core')} cx="0.45" cy="0.4" r="0.6">
        <stop offset="0" stopColor={c.mid} />
        <stop offset="1" stopColor={c.core} />
      </radialGradient>
      <radialGradient id={g('shade')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0.55" stopColor={c.core} stopOpacity="0" />
        <stop offset="1" stopColor={c.core} stopOpacity=".35" />
      </radialGradient>
      <linearGradient id={g('leaf')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#9cbf84" />
        <stop offset="1" stopColor="#557a45" />
      </linearGradient>
    </>
  );
}

function RoseShape({ u, c }) {
  return (
    <>
      {/* leaves peeking out below */}
      <path d="M-6 30 C-26 30 -40 40 -46 50 C-30 50 -16 44 -6 30 Z" fill={u('leaf')} opacity=".95" />
      <path d="M8 30 C26 28 40 36 46 46 C30 48 16 42 8 30 Z" fill={u('leaf')} opacity=".95" />
      <path d="M-8 32 C-22 38 -34 44 -42 49 M10 32 C24 36 34 41 42 45" fill="none" stroke="#3f5e33" strokeWidth=".8" opacity=".6" />
      {LAYERS.map(({ n, s, off }, li) => (
        <g key={li} transform={`scale(${s})`}>
          {Array.from({ length: n }, (_, i) => {
            const r = off + (360 / n) * i;
            return (
              <g key={i} transform={`rotate(${r})`}>
                <path d={PETAL} fill={u('petal')} stroke={c.edge} strokeOpacity=".35" strokeWidth="1" />
                <path d="M-11 -40 C-4 -44 4 -44 11 -40" fill="none" stroke={c.light} strokeWidth="2" strokeLinecap="round" opacity=".8" />
              </g>
            );
          })}
        </g>
      ))}
      <circle r="44" fill={u('shade')} />
      {/* cupped centre with a soft spiral */}
      <circle r="11" fill={u('core')} />
      <path d="M-7 1 C-7 -7 6 -9 7 -1 C8 6 -2 8 -4 2 C-5 -3 2 -4 2 0" fill="none" stroke={c.light} strokeWidth="1.6" strokeLinecap="round" opacity=".85" />
      <path d="M-11 4 C-6 12 8 12 11 3" fill="none" stroke={c.light} strokeWidth="1.4" strokeLinecap="round" opacity=".6" />
    </>
  );
}

export default function Rose({ color = 'pink', className, style, ...rest }) {
  const c = ROSE_COLORS[color] || ROSE_COLORS.pink;
  const { id, url } = useSketchIds();
  return (
    <svg {...svgProps('-50 -50 100 100', `om-art-rose om-art-rose-${color}`, className, style)} {...rest}>
      <defs><RoseDefs g={id} c={c} /></defs>
      <RoseShape u={url} c={c} />
    </svg>
  );
}

/** Mount once; then reference #om-rose-pink, #om-rose-coral, #om-rose-white (viewBox -50 -50 100 100). */
export function RoseSymbolDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <defs>
        {Object.entries(ROSE_COLORS).map(([name, c]) => {
          const g = (k) => `om-rose-${name}-${k}`;
          const u = (k) => `url(#${g(k)})`;
          return (
            <g key={name}>
              <RoseDefs g={g} c={c} />
              <symbol id={`om-rose-${name}`} viewBox="-50 -50 100 100" overflow="visible">
                <RoseShape u={u} c={c} />
              </symbol>
            </g>
          );
        })}
      </defs>
    </svg>
  );
}
