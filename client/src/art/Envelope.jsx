// A sketched envelope. `open` flips the flap (.om-art-flap) up and slides the letter (.om-art-letter) out a little.
import './art.css';
import { useSketchIds, svgProps, Wobble, Hatch, line } from './sketch.jsx';

export default function Envelope({ open = false, className, style, ...rest }) {
  const { id, url } = useSketchIds();
  const cls = `om-art-envelope${open ? ' is-open' : ''}`;
  return (
    <svg {...svgProps('0 0 240 170', cls, className, style)} {...rest}>
      <defs>
        <Wobble id={id('wob')} scale={1.6} />
        <Hatch id={id('paper')} bg="#f3e2c4" color="#b89868" angle={40} gap={4} width={0.7} opacity={0.5} />
        <Hatch id={id('inside')} bg="#e8c9a6" color="#9c7a52" angle={-40} gap={3.2} width={0.8} opacity={0.6} />
        <Hatch id={id('flap')} bg="#f7d6dc" color="#d2708b" angle={30} gap={3.4} width={0.8} opacity={0.6} />
      </defs>

      {/* back + inside */}
      <g filter={url('wob')}>
        <rect x="12" y="44" width="216" height="116" rx="5" fill={url('inside')} {...line(2.2)} />
      </g>

      {/* letter (hidden by the pocket until open) */}
      <g className="om-art-letter">
          <rect x="30" y="54" width="180" height="100" rx="3" fill="#fffaf0" {...line(1.4)} />
          <path d="M48 76 H190 M48 90 H178 M48 104 H186 M48 118 H150" fill="none" stroke="#c9a7a7" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M120 70 c-3 -5 -10 -3 -8 2 l8 7 l8 -7 c2 -5 -5 -7 -8 -2 z" fill="#d8456b" opacity=".85" />
      </g>

      {/* front pocket */}
      <g filter={url('wob')}>
        <path d="M12 160 L12 48 L104 112 Q120 122 136 112 L228 48 L228 160 Z" fill={url('paper')} {...line(2.2)} />
        <path d="M14 158 L102 104 M226 158 L138 104" fill="none" {...line(1.4)} strokeOpacity=".6" />
      </g>

      {/* flap: hinged on its top edge */}
      <g className="om-art-flap">
        <g filter={url('wob')}>
          <path d="M12 44 L228 44 L130 116 Q120 122 110 116 Z" fill={url('flap')} {...line(2.2)} />
          <path d="M22 48 L118 112" fill="none" {...line(0.9)} strokeOpacity=".4" />
        </g>
      </g>
    </svg>
  );
}
