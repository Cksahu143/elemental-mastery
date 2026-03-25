// Screen transition and post-processing effects
import { CANVAS_WIDTH, CANVAS_HEIGHT, ElementType, ELEMENT_COLORS } from './types';

// ─── Safe hex color utility ───
export function safeHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

// ─── Screen Transitions ───
export type TransitionType = 'fade' | 'wipe' | 'iris' | 'dissolve';

interface TransitionState {
  active: boolean;
  type: TransitionType;
  progress: number; // 0 to 1
  duration: number;
  direction: 'in' | 'out';
  color: string;
  onComplete?: () => void;
}

let transition: TransitionState = {
  active: false, type: 'fade', progress: 0, duration: 0.5,
  direction: 'out', color: '#000000',
};

export function startTransition(type: TransitionType, direction: 'in' | 'out', duration: number, color?: string, onComplete?: () => void) {
  transition = {
    active: true, type, progress: 0, duration,
    direction, color: color || '#000000', onComplete,
  };
}

export function updateTransition(dt: number): boolean {
  if (!transition.active) return false;
  transition.progress += dt / transition.duration;
  if (transition.progress >= 1) {
    transition.progress = 1;
    transition.active = false;
    transition.onComplete?.();
  }
  return true;
}

export function renderTransition(ctx: CanvasRenderingContext2D) {
  if (!transition.active && transition.progress < 1) return;
  const p = transition.direction === 'out' ? transition.progress : 1 - transition.progress;
  if (p <= 0) return;

  switch (transition.type) {
    case 'fade': {
      ctx.fillStyle = transition.color;
      ctx.globalAlpha = p;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalAlpha = 1;
      break;
    }
    case 'wipe': {
      ctx.fillStyle = transition.color;
      ctx.fillRect(0, 0, CANVAS_WIDTH * p, CANVAS_HEIGHT);
      // Gradient edge
      const grad = ctx.createLinearGradient(CANVAS_WIDTH * p - 40, 0, CANVAS_WIDTH * p + 40, 0);
      grad.addColorStop(0, transition.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(CANVAS_WIDTH * p - 40, 0, 80, CANVAS_HEIGHT);
      break;
    }
    case 'iris': {
      // Circular iris wipe
      const maxR = Math.sqrt(CANVAS_WIDTH * CANVAS_WIDTH + CANVAS_HEIGHT * CANVAS_HEIGHT) / 2;
      const r = maxR * (1 - p);
      ctx.save();
      ctx.fillStyle = transition.color;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
      break;
    }
    case 'dissolve': {
      ctx.fillStyle = transition.color;
      const cellSize = 8;
      for (let y = 0; y < CANVAS_HEIGHT; y += cellSize) {
        for (let x = 0; x < CANVAS_WIDTH; x += cellSize) {
          const seed = (x * 7 + y * 13) % 100 / 100;
          if (seed < p) {
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
      break;
    }
  }
}

// ─── Boss Intro Camera Zoom ───
interface BossZoomState {
  active: boolean;
  progress: number;
  duration: number;
  targetX: number;
  targetY: number;
  zone: ElementType;
}

let bossZoom: BossZoomState = {
  active: false, progress: 0, duration: 1.5,
  targetX: 0, targetY: 0, zone: 'fire',
};

export function startBossIntroZoom(x: number, y: number, zone: ElementType) {
  bossZoom = { active: true, progress: 0, duration: 1.5, targetX: x, targetY: y, zone };
}

export function updateBossZoom(dt: number): { zoom: number; offsetX: number; offsetY: number } | null {
  if (!bossZoom.active) return null;
  bossZoom.progress += dt / bossZoom.duration;
  if (bossZoom.progress >= 1) {
    bossZoom.active = false;
    return null;
  }
  // Ease in-out
  const t = bossZoom.progress;
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const zoom = 1 + ease * 0.5 * (t < 0.5 ? 1 : 2 - 2 * t);
  return {
    zoom,
    offsetX: bossZoom.targetX * (zoom - 1) * 0.3,
    offsetY: bossZoom.targetY * (zoom - 1) * 0.3,
  };
}

export function renderBossZoomOverlay(ctx: CanvasRenderingContext2D) {
  if (!bossZoom.active) return;
  const t = bossZoom.progress;
  const color = ELEMENT_COLORS[bossZoom.zone];

  // Dramatic vignette
  const vigAlpha = Math.sin(t * Math.PI) * 0.4;
  const vig = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.15,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.6
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Element color flash at peak
  if (t > 0.4 && t < 0.6) {
    const flashAlpha = (1 - Math.abs(t - 0.5) / 0.1) * 0.15;
    ctx.fillStyle = color;
    ctx.globalAlpha = Math.max(0, flashAlpha);
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
  }
}

// ─── Death Screen Overlay ───
export function renderDeathOverlay(ctx: CanvasRenderingContext2D, deathTime: number) {
  // Red vignette that grows
  const alpha = Math.min(0.6, deathTime * 0.3);
  const vig = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.1,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.5
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(0.5, `rgba(139,0,0,${alpha * 0.5})`);
  vig.addColorStop(1, `rgba(0,0,0,${alpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Blood drip effect from top
  if (deathTime > 0.5) {
    ctx.fillStyle = `rgba(139,0,0,${Math.min(0.3, (deathTime - 0.5) * 0.15)})`;
    for (let x = 0; x < CANVAS_WIDTH; x += 30 + Math.sin(x * 0.1) * 10) {
      const dripLen = Math.min(CANVAS_HEIGHT * 0.3, (deathTime - 0.5) * 80 + Math.sin(x) * 20);
      ctx.fillRect(x, 0, 3 + Math.sin(x * 0.3) * 2, dripLen);
    }
  }
}

// ─── Dynamic Torch Lighting ───
export interface TorchLight {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export function renderDynamicLighting(
  ctx: CanvasRenderingContext2D,
  torches: TorchLight[],
  playerX: number,
  playerY: number,
  playerColor: string,
  cameraX: number,
  cameraY: number,
  gameTime: number
) {
  // Create a darkness overlay
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';

  // Base darkness
  ctx.fillStyle = 'rgba(20,20,40,0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.globalCompositeOperation = 'destination-out';

  // Player light
  const playerSX = playerX - cameraX;
  const playerSY = playerY - cameraY;
  const playerFlicker = 1 + Math.sin(gameTime * 8) * 0.05;
  const playerGrad = ctx.createRadialGradient(playerSX, playerSY, 0, playerSX, playerSY, 120 * playerFlicker);
  playerGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
  playerGrad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
  playerGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = playerGrad;
  ctx.fillRect(playerSX - 120, playerSY - 120, 240, 240);

  // Torch lights
  for (const torch of torches) {
    const sx = torch.x - cameraX;
    const sy = torch.y - cameraY;
    if (sx < -torch.radius || sx > CANVAS_WIDTH + torch.radius || sy < -torch.radius || sy > CANVAS_HEIGHT + torch.radius) continue;

    const flicker = 1 + Math.sin(gameTime * 10 + torch.x * 0.1) * 0.1 + Math.cos(gameTime * 7 + torch.y * 0.1) * 0.05;
    const r = torch.radius * flicker;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.3)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }

  ctx.restore();

  // Add colored light overlays for torches
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const torch of torches) {
    const sx = torch.x - cameraX;
    const sy = torch.y - cameraY;
    if (sx < -torch.radius || sx > CANVAS_WIDTH + torch.radius || sy < -torch.radius || sy > CANVAS_HEIGHT + torch.radius) continue;

    const flicker = 1 + Math.sin(gameTime * 10 + torch.x * 0.1) * 0.1;
    const r = torch.radius * 0.6 * flicker;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, `${torch.color}30`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }

  // Player colored glow
  const pGrad = ctx.createRadialGradient(playerSX, playerSY, 0, playerSX, playerSY, 80);
  pGrad.addColorStop(0, `${playerColor}20`);
  pGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = pGrad;
  ctx.fillRect(playerSX - 80, playerSY - 80, 160, 160);
  ctx.restore();
}

// Collect torch positions from room tiles
export function collectTorches(tiles: number[][], zone: ElementType, tileSize: number): TorchLight[] {
  const torches: TorchLight[] = [];
  const color = ELEMENT_COLORS[zone];
  for (let y = 0; y < tiles.length; y++) {
    for (let x = 0; x < tiles[y].length; x++) {
      if (tiles[y][x] === 1) {
        const seed = (x * 7 + y * 13) % 100;
        if (seed % 12 === 0) {
          torches.push({
            x: x * tileSize + tileSize / 2,
            y: y * tileSize + tileSize * 0.3,
            radius: 90 + (seed % 30),
            color,
          });
        }
      }
    }
  }
  return torches;
}
