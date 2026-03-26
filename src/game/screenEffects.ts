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
  progress: number;
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
      const grad = ctx.createLinearGradient(CANVAS_WIDTH * p - 40, 0, CANVAS_WIDTH * p + 40, 0);
      grad.addColorStop(0, transition.color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(CANVAS_WIDTH * p - 40, 0, 80, CANVAS_HEIGHT);
      break;
    }
    case 'iris': {
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

  const vigAlpha = Math.sin(t * Math.PI) * 0.4;
  const vig = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.15,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.6
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

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

  if (deathTime > 0.5) {
    ctx.fillStyle = `rgba(139,0,0,${Math.min(0.3, (deathTime - 0.5) * 0.15)})`;
    for (let x = 0; x < CANVAS_WIDTH; x += 30 + Math.sin(x * 0.1) * 10) {
      const dripLen = Math.min(CANVAS_HEIGHT * 0.3, (deathTime - 0.5) * 80 + Math.sin(x) * 20);
      ctx.fillRect(x, 0, 3 + Math.sin(x * 0.3) * 2, dripLen);
    }
  }
}

// ─── Lightweight Torch Lighting (NO multiply composite — fixes blur!) ───
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
  // Subtle vignette darkness instead of multiply overlay (prevents blur)
  const vig = ctx.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.25,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.65
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Colored torch glows using screen blend (additive, no blur)
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const torch of torches) {
    const sx = torch.x - cameraX;
    const sy = torch.y - cameraY;
    if (sx < -torch.radius || sx > CANVAS_WIDTH + torch.radius || sy < -torch.radius || sy > CANVAS_HEIGHT + torch.radius) continue;

    const flicker = 1 + Math.sin(gameTime * 10 + torch.x * 0.1) * 0.1;
    const r = torch.radius * 0.5 * flicker;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
    grad.addColorStop(0, `${torch.color}25`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
  }

  // Player colored glow
  const playerSX = playerX - cameraX;
  const playerSY = playerY - cameraY;
  const pGrad = ctx.createRadialGradient(playerSX, playerSY, 0, playerSX, playerSY, 60);
  pGrad.addColorStop(0, `${playerColor}18`);
  pGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = pGrad;
  ctx.fillRect(playerSX - 60, playerSY - 60, 120, 120);
  ctx.restore();
}

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

// ─── POST-PROCESSING EFFECTS ───

// Bloom effect on projectiles — renders glow halos
export function renderBloom(
  ctx: CanvasRenderingContext2D,
  projectiles: { pos: { x: number; y: number }; element: ElementType; radius: number }[],
  cameraX: number,
  cameraY: number
) {
  if (projectiles.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const proj of projectiles) {
    const sx = proj.pos.x - cameraX;
    const sy = proj.pos.y - cameraY;
    if (sx < -40 || sx > CANVAS_WIDTH + 40 || sy < -40 || sy > CANVAS_HEIGHT + 40) continue;

    const color = ELEMENT_COLORS[proj.element];
    const bloomRadius = proj.radius * 3;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, bloomRadius);
    grad.addColorStop(0, `${color}40`);
    grad.addColorStop(0.4, `${color}15`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(sx - bloomRadius, sy - bloomRadius, bloomRadius * 2, bloomRadius * 2);
  }
  ctx.restore();
}

// Chromatic aberration during screen shake
export function renderChromaticAberration(
  ctx: CanvasRenderingContext2D,
  shakeIntensity: number
) {
  if (shakeIntensity < 2) return;
  const offset = Math.min(shakeIntensity * 0.5, 4);

  // Get current canvas image data for RGB split
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.08 * Math.min(shakeIntensity / 5, 1);
  
  // Red channel shift
  ctx.fillStyle = 'rgba(255,0,0,1)';
  ctx.fillRect(offset, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Blue channel shift opposite direction
  ctx.fillStyle = 'rgba(0,0,255,1)';
  ctx.fillRect(-offset, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  ctx.restore();
}

// Motion blur trail during dash/fast movement
let motionBlurAlpha = 0;
let motionBlurActive = false;

export function triggerMotionBlur() {
  motionBlurAlpha = 0.3;
  motionBlurActive = true;
}

export function updateMotionBlur(dt: number) {
  if (!motionBlurActive) return;
  motionBlurAlpha -= dt * 0.8;
  if (motionBlurAlpha <= 0) {
    motionBlurAlpha = 0;
    motionBlurActive = false;
  }
}

export function renderMotionBlur(ctx: CanvasRenderingContext2D) {
  if (!motionBlurActive || motionBlurAlpha <= 0) return;
  // Semi-transparent dark overlay that creates a trail/ghost effect
  ctx.save();
  ctx.fillStyle = `rgba(10,10,20,${motionBlurAlpha * 0.4})`;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

// Element aura glow around the player
export function renderElementAura(
  ctx: CanvasRenderingContext2D,
  playerScreenX: number,
  playerScreenY: number,
  element: ElementType,
  gameTime: number
) {
  const color = ELEMENT_COLORS[element];
  const pulse = 0.5 + Math.sin(gameTime * 3) * 0.2;
  const auraRadius = 28 + Math.sin(gameTime * 2) * 4;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  
  // Outer aura ring
  const grad = ctx.createRadialGradient(
    playerScreenX, playerScreenY, auraRadius * 0.4,
    playerScreenX, playerScreenY, auraRadius
  );
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.6, `${color}${safeHex(Math.floor(pulse * 30))}`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(
    playerScreenX - auraRadius, playerScreenY - auraRadius,
    auraRadius * 2, auraRadius * 2
  );

  // Rotating element particles in aura
  for (let i = 0; i < 4; i++) {
    const angle = gameTime * 2 + (i / 4) * Math.PI * 2;
    const orbitR = auraRadius * 0.7;
    const px = playerScreenX + Math.cos(angle) * orbitR;
    const py = playerScreenY + Math.sin(angle) * orbitR;
    
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4 + Math.sin(gameTime * 4 + i) * 0.2;
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.globalAlpha = 1;
  ctx.restore();
}
