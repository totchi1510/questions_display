/**
 * 3D-stacked "Q" using layered text-shadows.
 * Decorative; pair with an sr-only "問い" for accessibility.
 */
type Props = {
  className?: string;
};

export default function BigQ({ className = '' }: Props) {
  // Each entry is a depth layer; later layers are darker / further offset.
  const layers = [
    '1px 1px 0 #FAD55A',
    '2px 2px 0 #f5cc4a',
    '3px 3px 0 #efbf30',
    '4px 4px 0 #e0b223',
    '5px 5px 0 #ca9f1d',
    '6px 6px 0 #a88018',
    '7px 7px 0 #866614',
    '8px 8px 0 #5e480e',
    '12px 14px 22px rgba(0,0,0,0.25)',
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
