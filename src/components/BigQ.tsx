'use client';

import dynamic from 'next/dynamic';

const BigQCanvas = dynamic(() => import('./BigQCanvas'), {
  ssr: false,
  loading: () => <BigQFallback />,
});

function BigQFallback() {
  return (
    <span
      aria-hidden="true"
      className="block leading-none select-none text-black font-black"
      style={{
        fontSize: 'clamp(8rem, 18vw, 14rem)',
        textShadow:
          '1px 1px 0 #FAD55A, 2px 2px 0 #f5cf4d, 3px 3px 0 #ecc63b, 4px 4px 0 #dcb52a, 6px 8px 14px rgba(0,0,0,0.12)',
      }}
    >
      Q
    </span>
  );
}

type Props = {
  className?: string;
};

export default function BigQ({ className = '' }: Props) {
  return (
    <div
      aria-hidden="true"
      className={`block ${className}`}
      style={{
        width: 'clamp(12rem, 22vw, 18rem)',
        height: 'clamp(12rem, 22vw, 18rem)',
      }}
    >
      <BigQCanvas />
    </div>
  );
}
