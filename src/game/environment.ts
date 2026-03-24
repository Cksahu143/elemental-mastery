// Biome-specific ambient effects: particles, fog, lighting
import { ElementType, ELEMENT_COLORS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, GameRoom, Position } from './types';

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'ember' | 'snow' | 'spark' | 'wisp' | 'leaf' | 'ash' | 'bubble' | 'dust';
}

let ambientParticles: AmbientParticle[] = [];
let fogOffset = 0;
const MAX_AMBIENT = 120;

export function resetAmbient() {
  ambientParticles = [];
  fogOffset = 0;
}

export function updateAmbient(dt: number, zone: ElementType, camera: Position, roomWidth: number, roomHeight: number) {
  fogOffset += dt * 15;

  // Spawn new ambient particles
  const spawnRate = getSpawnRate(zone);
  if (ambientParticles.length < MAX_AMBIENT && Math.random() < spawnRate * dt) {
    spawnAmbientParticle(zone, camera);
  }

  // Update particles
  for (let i = ambientParticles.length - 1; i >= 0; i--) {
    const p = ambientParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;

    // Zone-specific behavior
    if (p.type === 'snow') {
      p.vx = Math.sin(p.life * 3 + p.x * 0.01) * 15; // drift
    } else if (p.type === 'ember') {
      p.vy -= 20 * dt; // rise faster
      p.vx += Math.sin(p.life * 5) * 10 * dt;
    } else if (p.type === 'leaf') {
      p.vx = Math.sin(p.life * 2) * 25;
      p.vy += Math.cos(p.life * 3) * 5 * dt;
    }

    if (p.life <= 0) {
      ambientParticles.splice(i, 1);
    }
  }
}

function getSpawnRate(zone: ElementType): number {
  switch (zone) {
    case 'fire': return 30;
    case 'ice': return 25;
    case 'lightning': return 15;
    case 'shadow': return 10;
    case 'earth': return 12;
    case 'wind': return 20;
    case 'nature': return 18;
    case 'void': return 14;
    default: return 10;
  }
}

function spawnAmbientParticle(zone: ElementType, camera: Position) {
  const cx = camera.x + Math.random() * CANVAS_WIDTH;
  const cy = camera.y + Math.random() * CANVAS_HEIGHT;

  const configs: Record<ElementType, () => AmbientParticle> = {
    fire: () => ({
      x: cx, y: cy + CANVAS_HEIGHT * 0.5 + Math.random() * CANVAS_HEIGHT * 0.5,
      vx: (Math.random() - 0.5) * 30, vy: -40 - Math.random() * 60,
      life: 2 + Math.random() * 2, maxLife: 3, size: 1 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#ff6622' : '#ff9944', alpha: 0.6 + Math.random() * 0.3,
      type: 'ember'
    }),
    ice: () => ({
      x: cx, y: cy - 20,
      vx: (Math.random() - 0.5) * 20, vy: 15 + Math.random() * 25,
      life: 3 + Math.random() * 3, maxLife: 4, size: 1 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#67E8F9' : '#ffffff', alpha: 0.4 + Math.random() * 0.4,
      type: 'snow'
    }),
    lightning: () => ({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80,
      life: 0.2 + Math.random() * 0.5, maxLife: 0.5, size: 1 + Math.random() * 3,
      color: '#FDE047', alpha: 0.7 + Math.random() * 0.3,
      type: 'spark'
    }),
    shadow: () => ({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 10, vy: -10 - Math.random() * 15,
      life: 2 + Math.random() * 3, maxLife: 4, size: 2 + Math.random() * 3,
      color: '#C084FC', alpha: 0.2 + Math.random() * 0.2,
      type: 'wisp'
    }),
    earth: () => ({
      x: cx, y: cy + CANVAS_HEIGHT * 0.3,
      vx: (Math.random() - 0.5) * 15, vy: -5 - Math.random() * 10,
      life: 2 + Math.random() * 2, maxLife: 3, size: 1 + Math.random() * 2,
      color: '#D97706', alpha: 0.3 + Math.random() * 0.2,
      type: 'dust'
    }),
    wind: () => ({
      x: cx - CANVAS_WIDTH * 0.3, y: cy,
      vx: 60 + Math.random() * 80, vy: (Math.random() - 0.5) * 20,
      life: 2 + Math.random() * 2, maxLife: 3, size: 1 + Math.random() * 1,
      color: '#6EE7B7', alpha: 0.3 + Math.random() * 0.3,
      type: 'leaf'
    }),
    nature: () => ({
      x: cx, y: cy - 10,
      vx: (Math.random() - 0.5) * 15, vy: 5 + Math.random() * 15,
      life: 3 + Math.random() * 3, maxLife: 5, size: 2 + Math.random() * 2,
      color: Math.random() > 0.5 ? '#4ADE80' : '#86efac', alpha: 0.3 + Math.random() * 0.3,
      type: 'leaf'
    }),
    void: () => ({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 25, vy: (Math.random() - 0.5) * 25,
      life: 1.5 + Math.random() * 2, maxLife: 3, size: 1 + Math.random() * 4,
      color: '#F472B6', alpha: 0.15 + Math.random() * 0.25,
      type: 'wisp'
    }),
  };

  ambientParticles.push(configs[zone]());
}

export function renderAmbient(ctx: CanvasRenderingContext2D, zone: ElementType, camera: Position, gameTime: number) {
  // 1. Fog layer (behind everything)
  renderFog(ctx, zone, camera, gameTime);

  // 2. Ambient particles
  for (const p of ambientParticles) {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    if (sx < -20 || sx > CANVAS_WIDTH + 20 || sy < -20 || sy > CANVAS_HEIGHT + 20) continue;

    const lifeRatio = p.life / p.maxLife;
    ctx.globalAlpha = p.alpha * lifeRatio;

    if (p.type === 'ember') {
      // Glowing ember
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (p.type === 'snow') {
      // Snowflake
      ctx.fillStyle = p.color;
      ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    } else if (p.type === 'spark') {
      // Lightning spark — flash
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(sx - p.size, sy, p.size * 2, 1);
      ctx.fillRect(sx, sy - p.size, 1, p.size * 2);
      ctx.shadowBlur = 0;
    } else if (p.type === 'wisp') {
      // Ghostly wisp
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size * (0.5 + lifeRatio * 0.5), 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'leaf') {
      // Leaf shape
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(gameTime * 2 + p.x * 0.01);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.type === 'dust') {
      ctx.fillStyle = p.color;
      ctx.fillRect(sx - p.size / 2, sy - p.size / 2, p.size, p.size);
    } else if (p.type === 'bubble') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}

function renderFog(ctx: CanvasRenderingContext2D, zone: ElementType, camera: Position, gameTime: number) {
  const fogColors: Record<ElementType, string> = {
    fire: 'rgba(255,68,0,', ice: 'rgba(56,189,248,', lightning: 'rgba(234,179,8,',
    shadow: 'rgba(168,85,247,', earth: 'rgba(217,119,6,', wind: 'rgba(52,211,153,',
    nature: 'rgba(34,197,94,', void: 'rgba(236,72,153,',
  };
  const fogBase = fogColors[zone];

  // Ground fog — two layers with different speeds
  for (let layer = 0; layer < 2; layer++) {
    const alpha = layer === 0 ? 0.06 : 0.03;
    const speed = layer === 0 ? 1 : 0.5;
    const yPos = CANVAS_HEIGHT * (0.6 + layer * 0.15);
    
    ctx.fillStyle = `${fogBase}${alpha})`;
    const width = CANVAS_WIDTH + 100;
    const offset = (fogOffset * speed * (layer === 0 ? 1 : -1)) % width;
    
    // Wavy fog using arc shapes
    ctx.beginPath();
    ctx.moveTo(-50 + offset, yPos);
    for (let x = -50; x <= CANVAS_WIDTH + 50; x += 60) {
      const wave = Math.sin((x + gameTime * 20 * speed) * 0.02) * 15;
      ctx.lineTo(x, yPos + wave);
    }
    ctx.lineTo(CANVAS_WIDTH + 50, CANVAS_HEIGHT);
    ctx.lineTo(-50, CANVAS_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  // Vignette overlay
  const gradient = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.3,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

// Ice screen frost effect
export function renderIceFrost(ctx: CanvasRenderingContext2D, zone: ElementType, playerHp: number, maxHp: number) {
  if (zone !== 'ice') return;
  const frostAlpha = Math.max(0, 0.1 - (playerHp / maxHp) * 0.08);
  if (frostAlpha <= 0) return;
  
  ctx.fillStyle = `rgba(180,230,255,${frostAlpha})`;
  // Frost borders
  const borderW = 40;
  ctx.fillRect(0, 0, CANVAS_WIDTH, borderW); // top
  ctx.fillRect(0, CANVAS_HEIGHT - borderW, CANVAS_WIDTH, borderW); // bottom
  ctx.fillRect(0, 0, borderW, CANVAS_HEIGHT); // left
  ctx.fillRect(CANVAS_WIDTH - borderW, 0, borderW, CANVAS_HEIGHT); // right
}

// Fire heat distortion hint
export function renderHeatDistortion(ctx: CanvasRenderingContext2D, zone: ElementType, gameTime: number) {
  if (zone !== 'fire') return;
  // Subtle warm overlay at bottom
  const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT * 0.7, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, 'rgba(255,68,0,0)');
  gradient.addColorStop(1, 'rgba(255,68,0,0.04)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, CANVAS_HEIGHT * 0.7, CANVAS_WIDTH, CANVAS_HEIGHT * 0.3);
}
