// A corner bunch of dried roses, designed to sit in the top-left corner (blooms at 0,0, stems trail down-right).
import { useSketchIds, svgProps, Wobble, Hatch, line } from './sketch.jsx';

function Rose({ x, y, r, rot, fill, dark }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${r / 20})`}>
      {/* outer crinkled petals */}
      <path d="M-20 2 C-24 -14 -8 -24 4 -21 C18 -20 24 -6 20 6 C17 18 2 23 -8 20 C-18 17 -22 10 -20 2 Z" fill={fill} {...line(1.6)} />
      <path d="M-14 12 C-6 18 8 16 14 8 M-16 -6 C-10 -14 2 -16 10 -12" fill="none" {...line(1.1)} />
      {/* inner bud and spiral */}
      <path d="M-9 -2 C-9 -11 6 -12 8 -3 C9 5 -2 9 -7 4" fill={dark} {...line(1.3)} />
      <path d="M-3 -3 C-2 -7 4 -6 3 -1 C2 2 -2 1 -1 -1" fill="none" {...line(1.1)} />
    </g>
  );
}

export default function Roses({ className, style, ...rest }) {
  const { id, url } = useSketchIds();
  const petal = url('petal');
  return (
    <svg {...svgProps('0 0 200 200', 'om-art-roses', className, style)} {...rest}>
      <defs>
        <Wobble id={id('wob')} scale={1.8} />
        <Hatch id={id('petal')} bg="#b5646b" color="#6e1f2b" angle={40} gap={2.6} width={0.9} />
        <Hatch id={id('petal2')} bg="#a65159" color="#5c1622" angle={-30} gap={2.6} width={0.9} />
        <Hatch id={id('leaf')} bg="#9a8a5a" color="#4d4224" angle={60} gap={2.4} width={0.8} />
        <filter id={id('drop')} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="5" stdDeviation="4" floodColor="#4a1f2e" floodOpacity=".25" />
        </filter>
      </defs>
      <g filter={url('drop')}>
        <g filter={url('wob')}>
          {/* stems */}
          <path d="M28 40 C70 70 110 100 168 150" fill="none" {...line(2)} stroke="#4a3a22" />
          <path d="M62 22 C90 60 120 90 150 168" fill="none" {...line(1.8)} stroke="#4a3a22" />
          <path d="M20 84 C60 96 100 120 128 176" fill="none" {...line(1.6)} stroke="#4a3a22" />
          {/* thorns */}
          <path d="M96 90 l6 -5 M118 108 l7 -2 M100 76 l-4 -6 M78 105 l-3 7" fill="none" {...line(1.2)} stroke="#4a3a22" />
          {/* dried curling leaves */}
          <path d="M84 72 C94 58 110 60 112 64 C104 72 94 76 84 72 Z" fill={url('leaf')} {...line(1.2)} />
          <path d="M70 110 C60 124 62 134 66 136 C72 128 74 120 70 110 Z" fill={url('leaf')} {...line(1.2)} />
          <path d="M130 120 C144 112 156 116 158 120 C148 126 140 126 130 120 Z" fill={url('leaf')} {...line(1.2)} />
          <path d="M112 64 q6 2 8 8" fill="none" {...line(1)} />

          {/* blooms */}
          <Rose x={62} y={22} r={20} rot={-20} fill={url('petal2')} dark="#7a2733" />
          <Rose x={24} y={36} r={26} rot={15} fill={petal} dark="#6e1f2b" />
          <Rose x={22} y={84} r={18} rot={60} fill={url('petal2')} dark="#7a2733" />
          {/* loose petal */}
          <path d="M60 60 C66 54 74 58 70 64 C66 68 60 66 60 60 Z" fill={petal} {...line(1)} />
        </g>
      </g>
    </svg>
  );
}
