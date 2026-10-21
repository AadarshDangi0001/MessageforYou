// Small sketchy doodles. Named exports: Heart, Sparkle, Leaf, Flower, Star. Props: {size, color, className, style}.
// size: number (px) or any CSS length; defaults to 1.4em so they scale with text.
const INK = '#2b1a1a';

function Doodle({ size = '1.4em', className, style, name, children, ...rest }) {
  const w = typeof size === 'number' ? `${size}px` : size;
  return (
    <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
      className={['om-art-doodle', `om-art-doodle-${name}`, className].filter(Boolean).join(' ')}
      style={{ width: w, height: 'auto', display: 'inline-block', overflow: 'visible', verticalAlign: 'middle', ...style }}
      fill="none" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {children}
    </svg>
  );
}

export function Heart({ color = '#d8456b', ...p }) {
  return (
    <Doodle name="heart" {...p}>
      <path d="M20 33 C9 25 4 19 5 12 C6 6 14 4 19 11 C23 4 33 5 34 12 C35 19 30 25 20 33 Z" fill={color} fillOpacity=".85" stroke={INK} strokeWidth="1.8" />
      <path d="M21 32 C12 25 7 19 7.5 13" stroke={INK} strokeWidth=".9" strokeOpacity=".5" />
      <path d="M11 11 q2 -2 4 0" stroke="#fff" strokeWidth="1.6" strokeOpacity=".7" />
    </Doodle>
  );
}

export function Sparkle({ color = '#e9ad4c', ...p }) {
  return (
    <Doodle name="sparkle" {...p}>
      <path d="M20 3 C21 14 26 19 37 20 C26 21 21 26 20 37 C19 26 14 21 3 20 C14 19 19 14 20 3 Z" fill={color} stroke={INK} strokeWidth="1.6" />
      <path d="M33 5 l0 5 M30.5 7.5 l5 0" stroke={INK} strokeWidth="1.2" />
    </Doodle>
  );
}

export function Leaf({ color = '#8fae7a', ...p }) {
  return (
    <Doodle name="leaf" {...p}>
      <path d="M6 34 C6 16 18 6 34 5 C34 22 24 34 6 34 Z" fill={color} fillOpacity=".8" stroke={INK} strokeWidth="1.7" />
      <path d="M6 34 C14 26 22 18 30 10 M14 26 l-1 -6 M20 20 l5 1 M22 17 l-1 -5" stroke={INK} strokeWidth="1" />
    </Doodle>
  );
}

export function Flower({ color = '#f19ab4', ...p }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <Doodle name="flower" {...p}>
      {petals.map((r) => (
        <ellipse key={r} cx="20" cy="10.5" rx="5.5" ry="8" transform={`rotate(${r} 20 20)`} fill={color} fillOpacity=".85" stroke={INK} strokeWidth="1.4" />
      ))}
      <circle cx="20" cy="20" r="4.6" fill="#f0c25a" stroke={INK} strokeWidth="1.4" />
    </Doodle>
  );
}

export function Star({ color = '#f0c25a', ...p }) {
  return (
    <Doodle name="star" {...p}>
      <path d="M20 4 L24.5 14.5 L36 15.5 L27 23 L30 34.5 L20 28.5 L10 34.5 L13 23 L4 15.5 L15.5 14.5 Z" fill={color} fillOpacity=".9" stroke={INK} strokeWidth="1.7" />
      <path d="M17 16 l2 -4" stroke="#fff" strokeWidth="1.4" strokeOpacity=".7" />
    </Doodle>
  );
}

const Doodles = { Heart, Sparkle, Leaf, Flower, Star };
export default Doodles;
