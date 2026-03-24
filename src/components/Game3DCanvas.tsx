// 3D Mode Renderer using React Three Fiber
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ElementType, ELEMENT_COLORS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, GameRoom, PlayerState, Enemy } from '../game/types';
import { getPlayer, getRoom, getFloor } from '../game/engine';

// ─── Zone color configs ───
const ZONE_FLOOR_COLORS: Record<ElementType, string> = {
  fire: '#1a0a04', ice: '#040a1a', lightning: '#0f0d04', shadow: '#0a041a',
  earth: '#1a1004', wind: '#041a10', nature: '#041a04', void: '#1a0410',
};
const ZONE_WALL_COLORS: Record<ElementType, string> = {
  fire: '#3d1a0a', ice: '#0a1a3d', lightning: '#2d2a0a', shadow: '#1a0a3d',
  earth: '#3d2a0a', wind: '#0a3d20', nature: '#0a3d0a', void: '#3d0a20',
};

// ─── Dungeon Floor ───
function DungeonFloor({ room }: { room: GameRoom }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const color = ZONE_FLOOR_COLORS[room.zone];
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[room.width / 2, -0.01, room.height / 2]}>
      <planeGeometry args={[room.width, room.height]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

// ─── Walls ───
function DungeonWalls({ room }: { room: GameRoom }) {
  const wallColor = ZONE_WALL_COLORS[room.zone];
  const positions = useMemo(() => {
    const pos: [number, number][] = [];
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        if (room.tiles[y][x] === 1) {
          pos.push([x, y]);
        }
      }
    }
    return pos;
  }, [room]);

  return (
    <instancedMesh args={[undefined, undefined, positions.length]}>
      <boxGeometry args={[1, 1.5, 1]} />
      <meshStandardMaterial color={wallColor} roughness={0.7} />
      {positions.map(([x, y], i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(x + 0.5, 0.75, y + 0.5);
        return <primitive key={i} object={matrix} attach={`instanceMatrix-${i}`} />;
      })}
    </instancedMesh>
  );
}

// Simple wall rendering without instancedMesh attach issues
function SimpleWalls({ room }: { room: GameRoom }) {
  const wallColor = ZONE_WALL_COLORS[room.zone];
  const positions = useMemo(() => {
    const pos: [number, number][] = [];
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        if (room.tiles[y][x] === 1) {
          pos.push([x, y]);
        }
      }
    }
    return pos;
  }, [room]);

  const ref = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!ref.current) return;
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

// ─── Hazard tiles ───
function HazardTiles({ room, gameTime }: { room: GameRoom; gameTime: number }) {
  const hazardColor = ELEMENT_COLORS[room.zone];
  const positions = useMemo(() => {
    const pos: [number, number][] = [];
    for (let y = 0; y < room.height; y++) {
      for (let x = 0; x < room.width; x++) {
        if (room.tiles[y][x] === 2) {
          pos.push([x, y]);
        }
      }
    }
    return pos;
  }, [room]);

  return (
    <>
      {positions.map(([x, y], i) => (
        <mesh key={i} position={[x + 0.5, 0.02, y + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.9, 0.9]} />
          <meshStandardMaterial
            color={hazardColor}
            emissive={hazardColor}
            emissiveIntensity={0.3 + Math.sin(gameTime * 3 + i) * 0.15}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </>
  );
}

// ─── Player 3D ───
function Player3D({ player, gameTime }: { player: PlayerState; gameTime: number }) {
  const ref = useRef<THREE.Group>(null);
  const color = ELEMENT_COLORS[player.element];
  const bob = Math.sin(gameTime * 4) * 0.05;

  useFrame(() => {
    if (!ref.current) return;
    const px = player.pos.x / TILE_SIZE + 0.5;
    const pz = player.pos.y / TILE_SIZE + 0.5;
    ref.current.position.set(px, 0.5 + bob, pz);
    // Face direction
    const angle = Math.atan2(player.facing.x, player.facing.y);
    ref.current.rotation.y = angle;
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>
      {/* Aura */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15 + Math.sin(gameTime * 3) * 0.05}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial color="#2a2a3e" />
      </mesh>
      {/* Element light */}
      <pointLight color={color} intensity={2} distance={4} />
    </group>
  );
}

// ─── Enemy 3D ───
function Enemy3D({ enemy, gameTime }: { enemy: Enemy; gameTime: number }) {
  const ref = useRef<THREE.Group>(null);
  if (enemy.hp <= 0) return null;
  
  const color = ELEMENT_COLORS[enemy.element];
  const size = enemy.isBoss ? 0.6 : enemy.type === 'tank' ? 0.4 : 0.25;
  const bob = Math.sin(gameTime * 3 + parseFloat(enemy.id.replace(/\D/g, '') || '0')) * 0.03;

  const px = enemy.pos.x / TILE_SIZE + 0.5;
  const pz = enemy.pos.y / TILE_SIZE + 0.5;

  return (
    <group ref={ref} position={[px, size + bob, pz]}>
      <mesh>
        <boxGeometry args={[size * 2, size * 2, size * 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {enemy.isBoss && (
        <pointLight color={color} intensity={3} distance={6} />
      )}
    </group>
  );
}

// ─── Camera Controller ───
function CameraController({ player }: { player: PlayerState }) {
  const { camera } = useThree();
  
  useFrame(() => {
    const px = player.pos.x / TILE_SIZE + 0.5;
    const pz = player.pos.y / TILE_SIZE + 0.5;
    // Third-person isometric camera
    camera.position.set(px + 8, 12, pz + 8);
    camera.lookAt(px, 0, pz);
  });

  return null;
}

// ─── Main 3D Scene ───
function Scene3D({ gameTime }: { gameTime: number }) {
  const player = getPlayer();
  const room = getRoom();
  
  if (!player || !room) return null;

  const accentColor = ELEMENT_COLORS[player.element];

  return (
    <>
      <CameraController player={player} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 10, 5]} intensity={0.3} />
      <fog attach="fog" args={['#0a0a14', 8, 25]} />
      
      <DungeonFloor room={room} />
      <SimpleWalls room={room} />
      <HazardTiles room={room} gameTime={gameTime} />
      <Player3D player={player} gameTime={gameTime} />
      
      {room.enemies.map(enemy => (
        <Enemy3D key={enemy.id} enemy={enemy} gameTime={gameTime} />
      ))}
    </>
  );
}

interface Game3DCanvasProps {
  gameTime: number;
}

export default function Game3DCanvas({ gameTime }: Game3DCanvasProps) {
  return (
    <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }} className="border border-border">
      <Canvas
        camera={{ position: [10, 12, 10], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor('#0a0a14');
        }}
      >
        <Scene3D gameTime={gameTime} />
      </Canvas>
    </div>
  );
}
