/**
 * 3D-stacked "Q" using layered text-shadows.
 * Decorative; pair with an sr-only "問い" for accessibility.
 */
type Props = {
  className?: string;
};

export default function BigQ({ className = '' }: Props) {
  // Subtle depth: a few light yellow steps + a soft drop shadow.
  const layers = [
    '1px 1px 0 #FAD55A',
    '2px 2px 0 #f5cf4d',
    '3px 3px 0 #ecc63b',
    '4px 4px 0 #dcb52a',
    '6px 8px 14px rgba(0,0,0,0.12)',
  ];
  return (
    <span
      aria-hidden="true"
      className={`inline-block leading-none select-none text-black font-black ${className}`}
      style={{
        fontSize: 'clamp(8rem, 18vw, 14rem)',
        textShadow: layers.join(', '),
      }}
    >
      Q
    </span>
  );
}
