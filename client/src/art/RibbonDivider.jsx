// A twisted pink and gold ribbon with a gold centre knot (wizard step 7 summary card).
import { useSketchIds, svgProps, Wobble } from './sketch.jsx';

// one half (left), mirrored for the right; two strands in counter-phase so they twist around each other
const PINK_L = 'M14 30 C40 16 70 16 96 30 S152 44 186 30';
const GOLD_L = 'M14 30 C40 44 70 44 96 30 S152 16 186 30';

function Strand({ d, color, edge }) {
  return (
    <>
      <path d={d} fill="none" stroke={edge} strokeWidth="9" strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth="6.4" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.3" strokeLinecap="round" transform="translate(0 -1.4)" />
    </>
  );
}

export default function RibbonDivider({ className, style, ...rest }) {
  const { id, url } = useSketchIds();
  const half = (
    <>
      <Strand d={GOLD_L} color="#e9ad4c" edge="#c98a2a" />
      <Strand d={PINK_L} color="#e07aa2" edge="#bf4f7c" />
    </>
  );
  return (
    <svg {...svgProps('0 0 400 60', 'om-art-ribbon', className, style)} {...rest}>
      <defs>
        <Wobble id={id('wob')} scale={1.2} freq={0.05} />
        <radialGradient id={id('knot')} cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffe3a3" />
          <stop offset="0.6" stopColor="#eab04a" />
          <stop offset="1" stopColor="#c98a2a" />
        </radialGradient>
      </defs>
      <g filter={url('wob')}>
        {half}
        <g transform="translate(400 0) scale(-1 1)">{half}</g>
      </g>
      <circle cx="200" cy="30" r="13" fill="#fff" opacity=".9" />
      <circle cx="200" cy="30" r="10.5" fill={url('knot')} stroke="#b77a1f" strokeWidth="1.2" />
      <ellipse cx="196.5" cy="26.5" rx="3.4" ry="2.2" fill="#fff" opacity=".7" />
    </svg>
  );
}
