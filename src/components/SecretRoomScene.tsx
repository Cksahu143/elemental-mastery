import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ELEMENT_COLORS, BOSS_NAMES, ElementType } from '../game/types';
import { BOSS_KEY_ZONES, EndgameState, hasAllTrueKeys, TRUE_KEYS } from '../game/endgame';

function ZoneFragment({ zone, index }: { zone: ElementType; index: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const baseAngle = (index / 8) * Math.PI * 2;
  const radius = 6 + (index % 2) * 1.4;
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.3 + baseAngle;
    ref.current.position.x = Math.cos(t) * radius;
    ref.current.position.z = Math.sin(t) * radius;
    ref.current.position.y = Math.sin(t * 1.3 + index) * 0.6;
    ref.current.rotation.x += 0.005;
    ref.current.rotation.y += 0.007;
  });
  const color = ELEMENT_COLORS[zone];
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} roughness={0.3} />
    </mesh>
  );
}

function Altar({ active }: { active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) ref.current.rotation.y = t * 0.5;
    if (lightRef.current) lightRef.current.intensity = (active ? 4 : 2) + Math.sin(t * 2) * 0.5;
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[1.2, 1.4, 0.4, 16]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh ref={ref} position={[0, 0.2, 0]}>
        <octahedronGeometry args={[0.6, 0]} />
        <meshStandardMaterial
          color={active ? '#FACC15' : '#A855F7'}
          emissive={active ? '#FACC15' : '#A855F7'}
          emissiveIntensity={1.5}
        />
      </mesh>
      <pointLight ref={lightRef} color={active ? '#FACC15' : '#A855F7'} distance={15} />
    </group>
  );
}

function VoidParticles() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(800 * 3);
    for (let i = 0; i < 800; i++) {
      arr[i*3] = (Math.random() - 0.5) * 30;
      arr[i*3+1] = (Math.random() - 0.5) * 14;
      arr[i*3+2] = (Math.random() - 0.5) * 30;
    }
    return arr;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.05;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={800} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#EC4899" size={0.06} transparent opacity={0.6} />
    </points>
  );
}

interface Props {
  endgame: EndgameState;
  onInteract: () => void;
  onLeave: () => void;
}

export default function SecretRoomScene({ endgame, onInteract, onLeave }: Props) {
  const [near, setNear] = useState(true);
  const fixUnlocked = hasAllTrueKeys(endgame);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && near) onInteract();
      if (e.key === 'Escape') onLeave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [near, onInteract, onLeave]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <Canvas camera={{ position: [0, 3, 9], fov: 60 }} gl={{ antialias: true }}>
        <fog attach="fog" args={['#08000f', 6, 30]} />
        <ambientLight intensity={0.15} />
        <Altar active={fixUnlocked} />
        <VoidParticles />
        {BOSS_KEY_ZONES.map((z, i) => <ZoneFragment key={z} zone={z} index={i} />)}
      </Canvas>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] font-ui uppercase tracking-[0.4em] text-pink-300/70">Between Realms</p>
          <h2 className="text-2xl font-display text-pink-100 mt-1">The Convergence Chamber</h2>
        </div>

        <div className="absolute top-6 right-6 pointer-events-auto">
          <div className="bg-black/60 border border-pink-900/50 rounded px-3 py-2 backdrop-blur-sm max-w-[220px]">
            <p className="text-[10px] font-ui uppercase tracking-wider text-pink-200/80 mb-2">Trial Cores</p>
            {TRUE_KEYS.map(k => {
              const owned = !!endgame.trueKeys[k.id];
              return (
                <div key={k.id} className="flex items-center gap-2 my-1">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: owned ? k.color : '#222', boxShadow: owned ? `0 0 8px ${k.color}` : 'none' }}
                  />
                  <span className="text-[11px] font-ui" style={{ color: owned ? k.color : '#666' }}>
                    {k.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center">
          <p
            className="font-display text-lg tracking-widest"
            style={{ color: fixUnlocked ? '#FACC15' : '#F472B6', textShadow: `0 0 12px ${fixUnlocked ? '#FACC15' : '#F472B6'}` }}
          >
            [E] Approach the Altar
          </p>
          <p className="text-[10px] font-ui text-muted-foreground mt-1 uppercase tracking-wider">
            [Esc] Leave the chamber
          </p>
        </div>
      </div>
    </div>
  );
}
