import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ElementType, ELEMENT_COLORS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, GameRoom, PlayerState, Enemy, Projectile } from '../game/types';
import { getPlayer, getRoom, getFloor, getProjectiles } from '../game/engine';

// ─── Zone color configs ───
const ZONE_FLOOR_COLORS: Record<ElementType, string> = {
  fire: '#1a0a04', ice: '#040a1a', lightning: '#0f0d04', shadow: '#0a041a',
  earth: '#1a1004', wind: '#041a10', nature: '#041a04', void: '#1a0410',
};
const ZONE_WALL_COLORS: Record<ElementType, string> = {
  fire: '#3d1a0a', ice: '#0a1a3d', lightning: '#2d2a0a', shadow: '#1a0a3d',
  earth: '#3d2a0a', wind: '#0a3d20', nature: '#0a3d0a', void: '#3d0a20',
};
const ZONE_HAZARD_COLORS: Record<ElementType, string> = {
  fire: '#ff4400', ice: '#00aaff', lightning: '#ffcc00', shadow: '#9900ff',
  earth: '#cc7700', wind: '#00ffaa', nature: '#00dd44', void: '#ff00aa',
};

// ─── Dungeon Floor ───
function DungeonFloor({ room }: { room: GameRoom }) {
  const color = ZONE_FLOOR_COLORS[room.zone];
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[room.width / 2, -0.01, room.height / 2]}>
      <planeGeometry args={[room.width, room.height]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

// ─── Walls using instanced mesh ───
function DungeonWalls({ room }: { room: GameRoom }) {
  const wallColor = ZONE_WALL_COLORS[room.zone];
  const positions = useMemo(() => {
    const pos: [number, number][] = [];
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        if (room.tiles[y]?.[x] === 1) pos.push([x, y]);
      }
    }
    return pos;
  }, [room.tiles, room.width, room.height]);

  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!ref.current || positions.length === 0) return;
    const mat = new THREE.Matrix4();
    positions.forEach(([x, y], i) => {
      mat.setPosition(x + 0.5, 0.75, y + 0.5);
      ref.current!.setMatrixAt(i, mat);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  if (positions.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={[1, 1.5, 1]} />
      <meshStandardMaterial color={wallColor} roughness={0.7} />
    </instancedMesh>
  );
}

// ─── Player 3D — reads live state every frame ───
function Player3D() {
  const ref = useRef<THREE.Group>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const player = getPlayer();
    if (!ref.current || !player) return;
    const t = clock.getElapsedTime();
    const px = player.pos.x / TILE_SIZE + 0.5;
    const pz = player.pos.y / TILE_SIZE + 0.5;
    const bob = Math.sin(t * 4) * 0.05;
    ref.current.position.set(px, 0.5 + bob, pz);
    const angle = Math.atan2(player.facing.x, player.facing.y);
    ref.current.rotation.y = angle;
    
    const color = new THREE.Color(ELEMENT_COLORS[player.element]);
    if (auraRef.current) {
      (auraRef.current.material as THREE.MeshStandardMaterial).color = color;
      (auraRef.current.material as THREE.MeshStandardMaterial).emissive = color;
      (auraRef.current.material as THREE.MeshStandardMaterial).opacity = 0.15 + Math.sin(t * 3) * 0.05;
    }
    if (lightRef.current) {
      lightRef.current.color = color;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      <mesh ref={auraRef}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial transparent opacity={0.15} emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>
      <pointLight ref={lightRef} intensity={2} distance={4} />
    </group>
  );
}

// ─── Enemies 3D — reads live state every frame ───
function EnemiesGroup() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<Map<string, THREE.Group>>(new Map());
  const [, setTick] = useState(0);

  useFrame(({ clock }) => {
    const room = getRoom();
    if (!room) return;
    const t = clock.getElapsedTime();
    
    // Force React re-render periodically to add/remove enemy meshes
    if (Math.floor(t * 4) % 2 === 0) setTick(n => n + 1);
    
    // Update positions of existing meshes
    for (const enemy of room.enemies) {
      const mesh = meshRefs.current.get(enemy.id);
      if (!mesh || enemy.hp <= 0) continue;
      const px = enemy.pos.x / TILE_SIZE + 0.5;
      const pz = enemy.pos.y / TILE_SIZE + 0.5;
      const size = enemy.isBoss ? 0.6 : enemy.type === 'tank' ? 0.4 : 0.25;
      const numericId = parseFloat(enemy.id.replace(/\D/g, '') || '0');
      const bob = Math.sin(t * 3 + numericId) * 0.03;
      mesh.position.set(px, size + bob, pz);
    }
  });

  const room = getRoom();
  if (!room) return null;

  const aliveEnemies = room.enemies.filter(e => e.hp > 0);

  return (
    <group ref={groupRef}>
      {aliveEnemies.map(enemy => {
        const color = ELEMENT_COLORS[enemy.element];
        const size = enemy.isBoss ? 0.6 : enemy.type === 'tank' ? 0.4 : 0.25;
        return (
          <group key={enemy.id} ref={(ref) => { if (ref) meshRefs.current.set(enemy.id, ref); }}>
            <mesh>
              <boxGeometry args={[size * 2, size * 2, size * 2]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
            </mesh>
            {enemy.isBoss && <pointLight color={color} intensity={3} distance={6} />}
          </group>
        );
      })}
    </group>
  );
}

// ─── Projectiles 3D ───
function Projectiles3D() {
  const [, setTick] = useState(0);
  
  useFrame(() => setTick(n => n + 1));
  
  const projs = getProjectiles();
  
  return (
    <>
      {projs.map(proj => {
        const px = proj.pos.x / TILE_SIZE + 0.5;
        const pz = proj.pos.y / TILE_SIZE + 0.5;
        const color = ELEMENT_COLORS[proj.element];
        const size = proj.radius / TILE_SIZE;
        return (
          <mesh key={proj.id} position={[px, 0.5, pz]}>
            <sphereGeometry args={[Math.max(0.08, size), 6, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.9} />
          </mesh>
        );
      })}
    </>
  );
}

// ─── Camera Controller ───
function CameraController() {
  const { camera } = useThree();
  
  useFrame(() => {
    const player = getPlayer();
    if (!player) return;
    const px = player.pos.x / TILE_SIZE + 0.5;
    const pz = player.pos.y / TILE_SIZE + 0.5;
    camera.position.set(px + 8, 12, pz + 8);
    camera.lookAt(px, 0, pz);
  });

  return null;
}

// ─── Hazard tiles ───
function HazardTiles({ room }: { room: GameRoom }) {
  const hazardColor = ZONE_HAZARD_COLORS[room.zone];
  const positions = useMemo(() => {
    const pos: [number, number][] = [];
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        if (room.tiles[y]?.[x] === 2) pos.push([x, y]);
      }
    }
    return pos;
  }, [room.tiles, room.width, room.height]);

  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!ref.current || positions.length === 0) return;
    const mat = new THREE.Matrix4();
    positions.forEach(([x, y], i) => {
      mat.setPosition(x + 0.5, 0.02, y + 0.5);
      ref.current!.setMatrixAt(i, mat);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  if (positions.length === 0) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, positions.length]}>
      <boxGeometry args={[0.9, 0.04, 0.9]} />
      <meshStandardMaterial color={hazardColor} emissive={hazardColor} emissiveIntensity={0.5} transparent opacity={0.8} />
    </instancedMesh>
  );
}

function Scene3D() {
  const room = getRoom();
  const player = getPlayer();
  if (!player || !room) return null;

  return (
    <>
      <CameraController />
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={0.4} />
      <fog attach="fog" args={['#0a0a14', 8, 30]} />
      
      <DungeonFloor room={room} />
      <DungeonWalls room={room} />
      <HazardTiles room={room} />
      <Player3D />
      <EnemiesGroup />
      <Projectiles3D />
    </>
  );
}

interface Game3DCanvasProps {
  gameTime: number;
}

export default function Game3DCanvas({ gameTime }: Game3DCanvasProps) {
  const player = getPlayer();
  const room = getRoom();

  if (!player || !room) return null;

  return (
    <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} className="border border-border">
      <Canvas
        camera={{ position: [10, 12, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a14');
        }}
      >
        <Scene3D />
      </Canvas>
    </div>
  );
}
