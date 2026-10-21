// A single tall arched plum-magenta door in a dark frame, with recessed panels and a big gold ring knocker.
// `open` (0..1) sets --om-door-open; art.css swings the leaf on its LEFT hinge (rotateY up to -105deg).
// Leaf: .om-art-door-leaf (also .om-art-door-l for compatibility). Ring: .om-art-ring (origin at its top).
// Glowing opening behind the leaf: .om-art-door-light.
import './art.css';
import { useSketchIds, svgProps } from './sketch.jsx';

const OPENING = 'M22 314 L22 104 A78 78 0 0 1 178 104 L178 314 Z';

export default function Door({ open = 0, className, style, ...rest }) {
  const { id, url } = useSketchIds();
  const o = Math.max(0, Math.min(1, Number(open) || 0));
  return (
    <svg {...svgProps('0 0 200 320', 'om-art-door', className, { '--om-door-open': o, ...style })} {...rest}>
      <defs>
        <linearGradient id={id('plum')} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#7A1E5A" />
          <stop offset="1" stopColor="#5E1546" />
        </linearGradient>
        <linearGradient id={id('recess')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4d0f39" stopOpacity=".55" />
          <stop offset="1" stopColor="#8a2a68" stopOpacity=".25" />
        </linearGradient>
        <radialGradient id={id('light')} cx="0.5" cy="0.55" r="0.62">
          <stop offset="0" stopColor="#FFF3B0" />
          <stop offset="0.6" stopColor="#F9D46E" />
          <stop offset="1" stopColor="#F5B83D" />
        </radialGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe48a" />
          <stop offset="0.5" stopColor="#e2a92e" />
          <stop offset="1" stopColor="#a8700f" />
        </linearGradient>
        <filter id={id('glow')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* dark frame */}
      <path d="M8 320 L8 104 A92 92 0 0 1 192 104 L192 320 Z" fill="#241019" />
      <path d="M8 320 L8 104 A92 92 0 0 1 192 104 L192 320" fill="none" stroke="#3a1a2a" strokeWidth="2" />

      {/* golden opening */}
      <g className="om-art-door-light">
        <path d={OPENING} fill={url('light')} />
        <ellipse cx="100" cy="200" rx="46" ry="80" fill="#fffbe0" opacity=".55" filter={url('glow')} />
      </g>

      {/* the single leaf, hinged on the left */}
      <g className="om-art-door-leaf om-art-door-l">
        <path d={OPENING} fill={url('plum')} />
        {/* edge highlight + bottom shade */}
        <path d="M24 312 L24 104 A76 76 0 0 1 100 28" fill="none" stroke="#a8478a" strokeWidth="1.6" strokeOpacity=".6" />
        <path d="M22 300 L178 300 L178 314 L22 314 Z" fill="#000" opacity=".12" />
        {/* upper arched recessed panel */}
        <path d="M42 170 L42 108 A58 58 0 0 1 158 108 L158 170 Z" fill={url('recess')} stroke="#4a0e37" strokeWidth="2" />
        <path d="M44 168 L44 108 A56 56 0 0 1 100 52" fill="none" stroke="#a8478a" strokeWidth="1" strokeOpacity=".5" transform="translate(1 1)" />
        {/* lower recessed panel */}
        <rect x="42" y="188" width="116" height="106" rx="4" fill={url('recess')} stroke="#4a0e37" strokeWidth="2" />
        <path d="M44 292 L44 190 L156 190" fill="none" stroke="#a8478a" strokeWidth="1" strokeOpacity=".5" />
        {/* knocker mount */}
        <circle cx="100" cy="150" r="6" fill={url('gold')} stroke="#6b4508" strokeWidth="1.2" />
        <g className="om-art-ring">
          <rect x="97" y="150" width="6" height="7" rx="2" fill={url('gold')} stroke="#6b4508" strokeWidth="1" />
          <circle cx="100" cy="179" r="22" fill="none" stroke="#5e3a06" strokeWidth="9.5" opacity=".55" transform="translate(1.5 2.5)" />
          <circle cx="100" cy="179" r="22" fill="none" stroke={url('gold')} strokeWidth="8" />
          <path d="M84 168 A20 20 0 0 1 104 158" fill="none" stroke="#fff6c8" strokeWidth="2" strokeLinecap="round" opacity=".85" />
        </g>
      </g>
    </svg>
  );
}
