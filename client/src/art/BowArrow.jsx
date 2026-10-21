// A sketched bow and arrow aimed up-right. `pull` (0..1) bends the string back and draws the arrow with it.
// Structure: .om-art-arrow (free for GSAP flight) > .om-art-arrow-pull (follows the string, inline style).
import './art.css';
import { useSketchIds, svgProps, Wobble, Hatch, line, INK } from './sketch.jsx';

const TIP_X = 80;      // x of the bow tips (local frame, arrow points +x)
const DRAW = 46;       // max string draw in user units

export default function BowArrow({ pull = 0, className, style, ...rest }) {
  const { id, url } = useSketchIds();
  const p = Math.max(0, Math.min(1, Number(pull) || 0));
  const sx = TIP_X - p * DRAW;           // string nock x
  // the limbs flex a touch inward as the string is drawn
  const flex = p * 6;
  const bow = `M${TIP_X + flex} ${36 + flex} Q${150 - flex} 110 ${TIP_X + flex} ${184 - flex}`;
  const str = `M${TIP_X + flex} ${36 + flex} L${sx} 110 L${TIP_X + flex} ${184 - flex}`;
  return (
    <svg {...svgProps('0 0 220 220', 'om-art-bowarrow', className, style)} {...rest}>
      <defs>
        <Wobble id={id('wob')} scale={1.4} />
        <Hatch id={id('wood')} bg="#8a5a36" color="#3e2414" angle={70} gap={2.4} width={0.8} />
        <Hatch id={id('fl')} bg="#f08fae" color="#c23f69" angle={30} gap={2.2} width={0.8} />
        <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#d2860e" />
        </linearGradient>
      </defs>
      <g transform="rotate(-42 110 110)">
        <g filter={url('wob')}>
          {/* bow limb: drawn as a thick outlined stroke */}
          <path d={bow} fill="none" stroke={INK} strokeWidth="8" strokeLinecap="round" />
          <path d={bow} fill="none" stroke={url('wood')} strokeWidth="5.4" strokeLinecap="round" />
          {/* grip wrap */}
          <path d="M111 96 L119 98 L119 122 L111 124 Z" fill="#3b2418" {...line(1.4)} />
          <path d="M112 102 L118 103 M112 108 L118 109 M112 114 L118 115" fill="none" stroke="#c9a06a" strokeWidth=".9" />
        </g>
        <path className="om-art-string" d={str} fill="none" stroke="#5a4636" strokeWidth="1.3" strokeLinejoin="round" />

        <g className="om-art-arrow">
          <g className="om-art-arrow-pull" style={{ transform: `translateX(${-p * DRAW}px)` }}>
            <g filter={url('wob')}>
              {/* shaft */}
              <path d="M80 110 L196 110" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
              <path d="M80 110 L196 110" stroke="#b07a48" strokeWidth="1.6" strokeLinecap="round" />
              {/* fletching */}
              <path d="M84 110 Q90 96 104 98 L98 110 Z" fill={url('fl')} {...line(1.2)} />
              <path d="M84 110 Q90 124 104 122 L98 110 Z" fill={url('fl')} {...line(1.2)} />
              <path d="M78 107 L82 110 L78 113" fill="none" {...line(1.4)} />
              {/* heart tip */}
              <path d="M210 110 C204 98 192 100 196 108 L196 112 C192 120 204 122 210 110 Z"
                fill={url('gold')} {...line(1.4)} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
