'use client';

import { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { Center, Text3D } from '@react-three/drei';
import type * as THREE from 'three';

const FONT = '/fonts/helvetiker_bold.typeface.json';

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
  const target = useRef(0);
  const [hover, setHover] = useState(false);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    const cur = groupRef.current.rotation.y;
    const diff = target.current - cur;
    if (Math.abs(diff) < 0.0005) {
      groupRef.current.rotation.y = target.current;
      return;
    }
    groupRef.current.rotation.y = cur + diff * Math.min(1, dt * 6);
  });

  function spin(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation();
    target.current += Math.PI * 2;
  }

  return (
    <group
      ref={groupRef}
      onPointerDown={spin}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = '';
      }}
    >
      <Center>
        {/* Single yellow drop-shadow behind the main Q. */}
        <Text3D {...text3dProps} position={[0.14, -0.14, -0.15]}>
          Q
          <meshStandardMaterial color="#FAD55A" roughness={0.5} />
        </Text3D>
        {/* Main black Q in front */}
        <Text3D {...text3dProps}>
          Q
          <meshStandardMaterial
            color={hover ? '#1a1a1a' : '#0a0a0a'}
            metalness={0.2}
            roughness={0.4}
          />
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
      <ambientLight intensity={0.75} />
      <directionalLight position={[4, 6, 5]} intensity={1.3} />
      <directionalLight position={[-3, -2, 2]} intensity={0.4} color="#FAD55A" />
      <Suspense fallback={null}>
        <QMesh />
      </Suspense>
    </Canvas>
  );
}
