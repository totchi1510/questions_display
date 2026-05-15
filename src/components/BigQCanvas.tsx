'use client';

import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text3D } from '@react-three/drei';
import type * as THREE from 'three';

const FONT = '/fonts/helvetiker_bold.typeface.json';
// Radians of rotation per pixel of scroll/wheel input. ~360° per ~1000px.
const SCROLL_FACTOR = 0.006;

const text3dProps = {
  font: FONT,
  size: 2.2,
  height: 0.5,
  bevelEnabled: true,
  bevelSize: 0.04,
  bevelThickness: 0.08,
  bevelSegments: 4,
  curveSegments: 12,
};

function QMesh() {
  const groupRef = useRef<THREE.Group>(null);
  const scrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const wheelOffsetRef = useRef(0);

  useEffect(() => {
    function onScroll() {
      // Page scroll position. Works while the page actually scrolls.
      scrollYRef.current = window.scrollY + wheelOffsetRef.current;
    }
    function onWheel(e: WheelEvent) {
      // Accumulate wheel deltas so the Q still spins on pages that don't
      // overflow the viewport.
      wheelOffsetRef.current += e.deltaY;
      scrollYRef.current = window.scrollY + wheelOffsetRef.current;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('wheel', onWheel);
    };
  }, []);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const target = scrollYRef.current * SCROLL_FACTOR;
    const cur = groupRef.current.rotation.y;
    groupRef.current.rotation.y = cur + (target - cur) * Math.min(1, dt * 10);
  });

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D {...text3dProps}>
          Q
          <meshStandardMaterial color="#0a0a0a" metalness={0.2} roughness={0.45} />
        </Text3D>
      </Center>
    </group>
  );
}

export default function BigQCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-3, -2, 2]} intensity={0.35} />
      <Suspense fallback={null}>
        <QMesh />
      </Suspense>
    </Canvas>
  );
}
