// Full-cover paper-noise overlay. Absolutely positioned, pointer-events none. Parent needs position: relative.
import './art.css';
import { useSketchIds } from './sketch.jsx';

export default function PaperGrain({ opacity = 0.22, className, style, ...rest }) {
  const { id, url } = useSketchIds();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={['om-art-grain', className].filter(Boolean).join(' ')}
      style={{ opacity, ...style }}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <filter id={id('grain')} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        {/* warm brown speckle, alpha from noise */}
        <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.30  0 0 0 0 0.20  0 0 0 0.9 -0.28" />
      </filter>
      <rect width="100%" height="100%" filter={url('grain')} />
    </svg>
  );
}
