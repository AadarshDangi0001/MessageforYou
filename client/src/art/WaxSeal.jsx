// A wax seal split into two halves (.om-art-seal-l / .om-art-seal-r). `broken` cracks them apart.
import './art.css';
import { useSketchIds, svgProps, Wobble } from './sketch.jsx';

// wobbly wax blob around (60,60)
const BLOB = 'M60 10 C72 9 80 16 90 18 C100 24 104 34 108 44 C112 56 108 66 108 76 C104 88 94 96 86 102 C76 110 64 110 52 108 C40 108 30 102 22 94 C14 84 12 72 12 60 C12 48 16 36 24 28 C34 18 46 11 60 10 Z';
// zig-zag crack down the middle
const CRACK = 'L64 22 L56 36 L66 50 L54 64 L65 78 L57 92 L63 112';
const LEFT_CLIP = `M-10 -10 L60 -10 L60 8 ${CRACK} L60 130 L-10 130 Z`;
const RIGHT_CLIP = `M130 -10 L60 -10 L60 8 ${CRACK} L60 130 L130 130 Z`;

function Body({ url, color, glyph }) {
  return (
    <>
      <path d={BLOB} fill={color} filter={url('wob')} />
      <path d={BLOB} fill={url('shade')} />
      <circle cx="60" cy="60" r="34" fill="none" stroke="#000" strokeOpacity=".22" strokeWidth="3" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.2" transform="translate(-1 -1.4)" />
      <text x="60" y="61" textAnchor="middle" dominantBaseline="central" fontSize="36"
        fill="#000" fillOpacity=".3" style={{ fontFamily: 'var(--font-disp, serif)' }}>{glyph}</text>
      <text x="59" y="59.5" textAnchor="middle" dominantBaseline="central" fontSize="36"
        fill="#fff" fillOpacity=".28" style={{ fontFamily: 'var(--font-disp, serif)' }}>{glyph}</text>
      <path d="M34 30 C42 22 54 19 62 20" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />
    </>
  );
}

export default function WaxSeal({ glyph = '♥', broken = false, color = '#b3283d', className, style, ...rest }) {
  const { id, url } = useSketchIds();
  const cls = `om-art-seal${broken ? ' is-broken' : ''}`;
  return (
    <svg {...svgProps('0 0 120 120', cls, className, style)} {...rest}>
      <defs>
        <Wobble id={id('wob')} scale={3} freq={0.06} />
        <radialGradient id={id('shade')} cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".35" />
        </radialGradient>
        <clipPath id={id('cl')}><path d={LEFT_CLIP} /></clipPath>
        <clipPath id={id('cr')}><path d={RIGHT_CLIP} /></clipPath>
      </defs>
      <g className="om-art-seal-l">
        <g clipPath={url('cl')}><Body url={url} color={color} glyph={glyph} /></g>
      </g>
      <g className="om-art-seal-r">
        <g clipPath={url('cr')}><Body url={url} color={color} glyph={glyph} /></g>
      </g>
      {/* hairline crack, visible only while intact */}
      {!broken && <path d={`M60 8 ${CRACK}`} fill="none" stroke="#000" strokeOpacity=".18" strokeWidth=".8" />}
    </svg>
  );
}
