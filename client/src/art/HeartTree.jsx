// A tree whose canopy is a big heart made of ~140 small glossy hearts.
// Props: grown (draws trunk + branches), bloom (pops the canopy hearts, staggered). Both default true.
// Classes for GSAP: .om-art-trunk, .om-art-branch (pathLength=1, animate stroke-dashoffset 1 -> 0),
// .om-art-canopy, .om-art-leafheart (transform-box fill-box, centre origin, free of transform attributes).
import './art.css';
import { useSketchIds, svgProps } from './sketch.jsx';

const CX = 200, CY = 192, S = 150, COUNT = 140;
const PALETTE = [
  ['pink', '#ffc4d8', '#f27aa5', '#d94a80'],
  ['magenta', '#f79ac7', '#d6338a', '#a3165f'],
  ['coral', '#ffc3a8', '#f8846a', '#de5a4a'],
  ['gold', '#ffe7a6', '#f6c25a', '#d9952c'],
];

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// classic implicit heart: (x^2 + y^2 - 1)^3 - x^2 y^3 <= 0, y up; x in [-1.14,1.14], y in [-1,1.24]
const inHeart = (x, y) => {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
};

const HEARTS = (() => {
  const r = rng(20240214);
  const out = [];
  let guard = 0;
  while (out.length < COUNT && guard++ < 20000) {
    const x = (r() * 2 - 1) * 1.14;
    const y = r() * 2.24 - 1;
    if (!inHeart(x / 0.94, (y - 0.04) / 0.94)) continue; // keep hearts slightly inside the edge
    out.push({
      x: +(CX + x * S).toFixed(1),
      y: +(CY - y * S).toFixed(1),
      s: +(1.4 + r() * 0.9).toFixed(2),
      rot: Math.round(r() * 50 - 25),
      c: Math.floor(r() * PALETTE.length),
    });
  }
  // draw top-to-bottom so lower hearts overlap upper ones like layered foliage
  return out.sort((a, b) => a.y - b.y);
})();

const BRANCHES = [
  ['M200 318 C190 270 150 240 110 200', 7],
  ['M200 318 C214 268 252 236 292 196', 7],
  ['M200 300 C196 240 182 170 150 112', 5],
  ['M200 300 C206 240 222 170 252 110', 5],
  ['M200 286 C200 230 200 180 200 128', 4.5],
  ['M150 230 C126 216 96 160 78 132', 3.5],
  ['M250 228 C276 214 304 160 322 132', 3.5],
  ['M168 176 C150 150 130 120 108 96', 2.6],
  ['M232 176 C252 150 272 120 292 96', 2.6],
];

// one small heart, ~20 units wide, centred on the origin
const H = 'M0 8 C-7 3.5 -10 0 -10 -3.5 C-10 -7 -7.5 -9 -5 -9 C-2.5 -9 -1 -7.5 0 -5.5 C1 -7.5 2.5 -9 5 -9 C7.5 -9 10 -7 10 -3.5 C10 0 7 3.5 0 8 Z';

export default function HeartTree({ grown = true, bloom = true, className, style, ...rest }) {
  const { id, url } = useSketchIds();
  const cls = `om-art-tree${grown ? ' is-grown' : ''}${bloom ? ' is-bloom' : ''}`;
  return (
    <svg {...svgProps('0 0 400 460', cls, className, style)} {...rest}>
      <defs>
        <linearGradient id={id('bark')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a2026" />
          <stop offset="0.45" stopColor="#6b3f44" />
          <stop offset="1" stopColor="#2e161b" />
        </linearGradient>
        {PALETTE.map(([name, hi, mid, lo]) => (
          <radialGradient key={name} id={id(`g-${name}`)} cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor={hi} />
            <stop offset="0.5" stopColor={mid} />
            <stop offset="1" stopColor={lo} />
          </radialGradient>
        ))}
        {PALETTE.map(([name]) => (
          <symbol key={name} id={id(`h-${name}`)} viewBox="-11 -10 22 19" overflow="visible">
            <path d={H} fill={url(`g-${name}`)} />
            <ellipse cx="-4.6" cy="-4.6" rx="2.6" ry="1.5" fill="#fff" opacity=".7" transform="rotate(-25 -4.6 -4.6)" />
          </symbol>
        ))}
      </defs>

      <path className="om-art-trunk" fill={url('bark')}
        d="M184 460 C188 410 192 360 192 318 C192 300 194 290 196 280 L204 280 C206 290 208 300 208 318 C208 360 212 410 218 460 Z" />

      <g fill="none" stroke="#4a2a30" strokeLinecap="round">
        {BRANCHES.map(([d, w], i) => (
          <path key={i} className="om-art-branch" d={d} pathLength="1" strokeWidth={w} />
        ))}
      </g>

      <g className="om-art-canopy">
        {HEARTS.map((h, i) => (
          <g key={i} transform={`translate(${h.x} ${h.y}) rotate(${h.rot})`}>
            <g className="om-art-leafheart" style={{ '--d': `${(i * 0.012).toFixed(3)}s` }}>
              <use href={`#${id(`h-${PALETTE[h.c][0]}`)}`} x={-11 * h.s} y={-10 * h.s} width={22 * h.s} height={19 * h.s} />
            </g>
          </g>
        ))}
      </g>
    </svg>
  );
}
