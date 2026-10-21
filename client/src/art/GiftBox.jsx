// Hand-sketched pink gift box with a bow. `open` lifts and tilts the lid (art.css).
import './art.css';
import { useSketchIds, svgProps, Wobble, Hatch, line, INK } from './sketch.jsx';

export default function GiftBox({ open = false, className, style, ...rest }) {
  const { id, url } = useSketchIds();
  const cls = `om-art-gift${open ? ' is-open' : ''}`;
  return (
    <svg {...svgProps('0 0 200 200', cls, className, style)} {...rest}>
      <defs>
        <Wobble id={id('wob')} />
        <Hatch id={id('body')} bg="#f7c9d4" color="#d2486e" angle={62} gap={3.6} />
        <Hatch id={id('lid')} bg="#f9d3dc" color="#d2486e" angle={-28} gap={3.4} />
        <Hatch id={id('rib')} bg="#e0607f" color="#9e2446" angle={40} gap={3} width={1.2} />
        <radialGradient id={id('shadow')}>
          <stop offset="0" stopColor="#7a3a2a" stopOpacity=".28" />
          <stop offset="1" stopColor="#7a3a2a" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="186" rx="70" ry="9" fill={url('shadow')} />

      {/* body */}
      <g className="om-art-box">
        <g filter={url('wob')}>
          <path d="M48 98 L152 97 L150 182 L50 183 Z" fill={url('body')} {...line(2.4)} />
          {/* side shading + a second sketchy contour */}
          <path d="M138 100 L137 180 L150 181 L151 99 Z" fill="#c63d63" opacity=".22" />
          <path d="M51 101 L149 100 M52 179 L148 180" fill="none" {...line(1)} strokeOpacity=".5" />
          {/* ribbon */}
          <path d="M92 97 L108 97 L107 183 L93 183 Z" fill={url('rib')} {...line(1.8)} />
        </g>
      </g>

      {/* lid + bow */}
      <g className="om-art-lid">
        <g filter={url('wob')}>
          <path d="M40 78 L160 76 L161 100 L39 101 Z" fill={url('lid')} {...line(2.4)} />
          <path d="M42 96 L158 95" fill="none" {...line(1)} strokeOpacity=".45" />
          <path d="M91 77 L109 77 L109 100 L91 100 Z" fill={url('rib')} {...line(1.8)} />
          <g className="om-art-bow">
            {/* tails */}
            <path d="M96 70 L80 92 L88 90 L91 98 L100 72 Z" fill={url('rib')} {...line(1.8)} />
            <path d="M104 70 L118 93 L111 91 L108 99 L100 72 Z" fill={url('rib')} {...line(1.8)} />
            {/* loops */}
            <path d="M98 66 C80 46 58 44 56 58 C54 72 78 74 97 70 Z" fill={url('rib')} {...line(2.2)} />
            <path d="M102 66 C120 44 144 44 145 58 C146 72 122 74 103 70 Z" fill={url('rib')} {...line(2.2)} />
            {/* inner loop folds */}
            <path d="M94 66 C82 56 68 54 64 60 M106 66 C118 56 132 54 137 60" fill="none" {...line(1.2)} />
            {/* knot */}
            <path d="M93 62 Q100 58 107 62 L108 72 Q100 76 92 72 Z" fill="#d84d71" {...line(2)} />
            <path d="M96 64 L97 71 M103 64 L104 71" stroke={INK} strokeWidth=".9" strokeOpacity=".5" />
          </g>
        </g>
      </g>
    </svg>
  );
}
