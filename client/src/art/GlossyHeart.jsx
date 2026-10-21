// Big glossy 3D-ish pink heart with a highlight. The heart group has class om-art-heart.
import './art.css';
import { useSketchIds, svgProps } from './sketch.jsx';

const HEART = 'M100 172 C46 132 12 100 12 60 C12 30 36 12 60 12 C78 12 92 22 100 38 C108 22 122 12 140 12 C164 12 188 30 188 60 C188 100 154 132 100 172 Z';

export default function GlossyHeart({ className, style, ...rest }) {
  const { id, url } = useSketchIds();
  return (
    <svg {...svgProps('0 0 200 190', 'om-art-glossy', className, style)} {...rest}>
      <defs>
        <radialGradient id={id('body')} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffd3e2" />
          <stop offset="0.35" stopColor="#f68fb3" />
          <stop offset="0.75" stopColor="#e2507f" />
          <stop offset="1" stopColor="#b8244f" />
        </radialGradient>
        <linearGradient id={id('rim')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0.5" stopColor="#b8244f" stopOpacity="0" />
          <stop offset="1" stopColor="#8f1638" stopOpacity=".55" />
        </linearGradient>
        <radialGradient id={id('hl')}>
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id={id('drop')} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#c2345e" floodOpacity=".35" />
        </filter>
      </defs>
      <g className="om-art-heart" filter={url('drop')}>
        <path d={HEART} fill={url('body')} />
        <path d={HEART} fill={url('rim')} />
        {/* soft inner bounce light along the lower right */}
        <path d="M150 104 C140 124 124 140 106 154" fill="none" stroke="#ffc2d6" strokeWidth="5" strokeLinecap="round" opacity=".35" />
        {/* main specular highlight + glints */}
        <ellipse cx="62" cy="50" rx="20" ry="12" fill={url('hl')} transform="rotate(-18 62 50)" />
        <ellipse cx="62" cy="49" rx="10" ry="6" fill="#fff" opacity=".9" transform="rotate(-18 62 49)" />
        <circle cx="140" cy="40" r="5" fill="#fff" opacity=".45" />
      </g>
    </svg>
  );
}
