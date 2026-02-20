import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ElementType } from '../game/types';

const ZONE_CONFIGS: Record<ElementType, { accentColor: string; fogColor: string; particleColor: string }> = {
  fire: { accentColor: '#F97316', fogColor: '#0d0200', particleColor: '#FF6B35' },
  ice: { accentColor: '#38BDF8', fogColor: '#00051a', particleColor: '#67E8F9' },
  lightning: { accentColor: '#EAB308', fogColor: '#050400', particleColor: '#FDE047' },
  shadow: { accentColor: '#A855F7', fogColor: '#05000d', particleColor: '#C084FC' },
  earth: { accentColor: '#D97706', fogColor: '#0d0700', particleColor: '#B45309' },
  wind: { accentColor: '#34D399', fogColor: '#000d08', particleColor: '#6EE7B7' },
  nature: { accentColor: '#22C55E', fogColor: '#000d00', particleColor: '#4ADE80' },
  void: { accentColor: '#EC4899', fogColor: '#0d0010', particleColor: '#F472B6' },
};

function FloatingParticles({ color, count = 200 }: { color: string; count?: number }) {
  const meshRef = useRef<THREE.Points>(null);
  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 3 + 1;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime() * 0.15;
    meshRef.current.rotation.y = t;
    meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.1;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.08} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function RotatingRing({ color, radius, speed }: { color: string; radius: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.x = clock.getElapsedTime() * speed;
    ref.current.rotation.z = clock.getElapsedTime() * speed * 0.5;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.3} />
    </mesh>
  );
}

function SceneContent({ zone }: { zone: ElementType }) {
  const config = ZONE_CONFIGS[zone];
  return (
    <>
      <fog attach="fog" args={[config.fogColor, 5, 25]} />
      <ambientLight intensity={0.1} />
      <pointLight position={[0, 5, 0]} color={config.accentColor} intensity={2} distance={20} />
      <FloatingParticles color={config.particleColor} count={300} />
      <RotatingRing color={config.accentColor} radius={3} speed={0.2} />
      <RotatingRing color={config.accentColor} radius={5} speed={-0.1} />
      <RotatingRing color={config.particleColor} radius={7} speed={0.05} />
    </>
  );
}

export default function SceneBackground3D({ zone }: { zone: ElementType }) {
  return (
    <div className="fixed inset-0" style={{ zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }} gl={{ antialias: false, alpha: true }}>
        <SceneContent zone={zone} />
      </Canvas>
    </div>
  );
}
