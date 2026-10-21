// A sketched couple sitting forehead to forehead, holding hands, with sprigs and a small heart.
import { useSketchIds, svgProps, Wobble, Hatch, line, INK } from './sketch.jsx';

const SKIN = '#f8dcc8';

function Sprig({ x, flip, fill }) {
  const leaves = [[0, -14, 30], [0, -30, -28], [2, -44, 32], [3, -58, -26], [5, -70, 20]];
  return (
    <g transform={`translate(${x} 146) scale(${flip ? -1 : 1} 1)`}>
      <path d="M0 0 C-2 -24 2 -50 6 -78" fill="none" {...line(1.2)} />
      {leaves.map(([lx, ly, r], i) => (
        <ellipse key={i} cx={lx + (r > 0 ? 6 : -5)} cy={ly} rx="6" ry="2.6"
          transform={`rotate(${r} ${lx} ${ly})`} fill={fill} {...line(1)} />
      ))}
      <circle cx="-8" cy="-60" r="1.4" fill={INK} opacity=".6" />
      <circle cx="12" cy="-34" r="1.1" fill={INK} opacity=".5" />
    </g>
  );
}

export default function Couple({ className, style, ...rest }) {
  const { id, url } = useSketchIds();
  return (
    <svg {...svgProps('0 0 240 170', 'om-art-couple', className, style)} {...rest}>
      <defs>
        <Wobble id={id('wob')} scale={1.6} />
        <Hatch id={id('hood')} bg="#ecd8b4" color="#a9875a" angle={50} gap={3} width={0.8} />
        <Hatch id={id('sweat')} bg="#f7c6d2" color="#d0607f" angle={-40} gap={3} width={0.8} />
        <Hatch id={id('jeans')} bg="#bdb8b8" color="#6d6566" angle={30} gap={2.6} width={0.8} />
        <Hatch id={id('hairB')} bg="#6b4630" color="#2b1a1a" angle={70} gap={2.4} width={0.8} />
        <Hatch id={id('hairG')} bg="#4a2c22" color="#1d1010" angle={80} gap={2.2} width={0.8} />
        <Hatch id={id('leaf')} bg="#f2c3cf" color="#c4627c" angle={20} gap={2.4} width={0.7} />
        <Hatch id={id('ground')} bg="none" color="#8a7a52" angle={10} gap={2.4} width={0.8} />
      </defs>

      <g filter={url('wob')}>
        {/* ground */}
        <path d="M30 146 Q120 141 212 146 Q120 152 30 146 Z" fill={url('ground')} />
        <path d="M24 147 Q120 143 216 147" fill="none" {...line(1.2)} />

        <Sprig x={50} fill={url('leaf')} />
        <Sprig x={192} flip fill={url('leaf')} />

        {/* her long hair (behind) */}
        <path d="M124 52 Q132 36 150 42 Q164 52 160 76 Q170 98 164 126 Q156 116 152 100 Q148 84 144 72 Q134 62 124 58 Z"
          fill={url('hairG')} {...line(1.4)} />

        {/* legs (knees up, both) */}
        <path d="M92 145 Q104 112 120 116 Q138 112 150 145 Z" fill={url('jeans')} {...line(1.6)} />
        <path d="M120 118 L121 144" fill="none" {...line(1)} />

        {/* his hoodie */}
        <path d="M90 76 Q72 84 72 112 L74 145 L110 145 Q116 116 112 88 Q106 78 98 76 Z" fill={url('hood')} {...line(1.8)} />
        <path d="M86 78 Q82 86 90 92 Q100 92 104 82" fill="none" {...line(1.2)} />
        <path d="M80 110 Q90 106 98 112" fill="none" {...line(0.9)} strokeOpacity=".6" />

        {/* her sweater */}
        <path d="M130 80 Q150 78 158 104 L162 145 L126 145 Q122 112 130 80 Z" fill={url('sweat')} {...line(1.8)} />

        {/* arms meeting in the middle */}
        <path d="M100 88 Q112 96 117 104 L113 109 Q103 100 96 94 Z" fill={url('hood')} {...line(1.4)} />
        <path d="M136 88 Q127 96 124 104 L128 109 Q134 100 140 94 Z" fill={url('sweat')} {...line(1.4)} />
        <ellipse cx="117.5" cy="106" rx="4.5" ry="4" fill={SKIN} {...line(1.2)} />
        <ellipse cx="124" cy="106" rx="4.2" ry="4" fill={SKIN} {...line(1.2)} />

        {/* his head */}
        <circle cx="103" cy="60" r="16" fill={SKIN} {...line(1.8)} />
        <path d="M86 60 Q84 40 102 40 Q118 40 121 52 Q113 47 106 50 Q98 46 94 54 Q91 60 89 66 Z"
          fill={url('hairB')} {...line(1.4)} />
        <path d="M95 41 L92 36 M103 40 L104 35 M111 42 L115 38" fill="none" {...line(1.2)} />
        <path d="M109 61 Q112 63 115 61" fill="none" {...line(1.2)} />
        <circle cx="111" cy="67" r="3" fill="#f39aae" opacity=".55" />

        {/* her head */}
        <circle cx="136" cy="62" r="15" fill={SKIN} {...line(1.8)} />
        <path d="M122 56 Q126 44 140 45 Q151 48 152 60 Q144 52 134 54 Q128 54 122 58 Z"
          fill={url('hairG')} {...line(1.3)} />
        <path d="M125 63 Q128 65 131 63" fill="none" {...line(1.2)} />
        <circle cx="129" cy="69" r="3" fill="#f39aae" opacity=".55" />

        {/* little heart above */}
        <path d="M120 26 C116 20 109 23 112 29 L120 36 L128 29 C131 23 124 20 120 26 Z" fill="#d8456b" {...line(1.2)} />
      </g>
    </svg>
  );
}
