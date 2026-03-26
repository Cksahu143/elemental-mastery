// Sprite loading and rendering system
import { ElementType, ELEMENT_COLORS, EnemyType, Enemy, PlayerState, TILE_SIZE } from './types';
import playerSpriteUrl from '../assets/player-sprite.png';
import bossFireUrl from '../assets/boss-fire.png';
import bossIceUrl from '../assets/boss-ice.png';
import bossLightningUrl from '../assets/boss-lightning.png';
import bossShadowUrl from '../assets/boss-shadow.png';
import bossEarthUrl from '../assets/boss-earth.png';
import bossWindUrl from '../assets/boss-wind.png';
import bossNatureUrl from '../assets/boss-nature.png';
import bossVoidUrl from '../assets/boss-void.png';
import enemiesSpriteUrl from '../assets/enemies-sprite.png';
import enemiesElementalUrl from '../assets/enemies-elemental.png';
import dungeonTilesUrl from '../assets/dungeon-tiles.png';

// ─── Sprite Sheet Management ───
interface SpriteSheet {
  image: HTMLImageElement;
  loaded: boolean;
  frameWidth: number;
  frameHeight: number;
  frames: number;
}

const spriteSheets: Record<string, SpriteSheet> = {};

function loadSprite(key: string, url: string, frames: number): SpriteSheet {
  if (spriteSheets[key]) return spriteSheets[key];
  const img = new Image();
  img.src = url;
  const sheet: SpriteSheet = { image: img, loaded: false, frameWidth: 0, frameHeight: 0, frames };
  img.onload = () => {
    sheet.loaded = true;
    sheet.frameWidth = img.naturalWidth / frames;
    sheet.frameHeight = img.naturalHeight;
  };
  spriteSheets[key] = sheet;
  return sheet;
}

// Pre-load all sprites
let spritesInitialized = false;
export function initSprites() {
  if (spritesInitialized) return;
  spritesInitialized = true;
  loadSprite('player', playerSpriteUrl, 4);
  loadSprite('boss_fire', bossFireUrl, 1);
  loadSprite('boss_ice', bossIceUrl, 1);
  loadSprite('boss_lightning', bossLightningUrl, 1);
  loadSprite('boss_shadow', bossShadowUrl, 1);
  loadSprite('enemies', enemiesSpriteUrl, 4);
  loadSprite('enemies_elemental', enemiesElementalUrl, 4);
  loadSprite('tiles', dungeonTilesUrl, 1);
}

// ─── Draw Player ───
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  player: PlayerState,
  gameTime: number
) {
  const sheet = spriteSheets['player'];
  const px = player.pos.x;
  const py = player.pos.y;
  const size = 32; // render size
  const offset = (size - 24) / 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(px + 12, py + 28, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Invincibility flash
  if (player.invincible > 0 && Math.floor(player.invincible * 20) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  // Element aura glow
  const auraAlpha = 0.15 + Math.sin(gameTime * 3) * 0.08;
  ctx.shadowColor = ELEMENT_COLORS[player.element];
  ctx.shadowBlur = 15;

  if (sheet?.loaded) {
    // Determine animation frame
    let frame = 0;
    if (player.hp <= player.maxHp * 0.2) frame = 3; // hurt
    else if (player.isAttacking) frame = 2;
    else if (player.isDashing) frame = 1;
    else frame = Math.floor(gameTime * 4) % 2 === 0 ? 0 : 1; // idle/walk toggle

    const sw = sheet.frameWidth;
    const sh = sheet.frameHeight;
    
    // Apply element tint via composite
    ctx.drawImage(
      sheet.image,
      frame * sw, 0, sw, sh,
      px - offset - 2, py - offset - 8, size + 4, size + 8
    );
  } else {
    // Fallback: Enhanced procedural player
    drawProceduralPlayer(ctx, player, gameTime);
  }

  ctx.shadowBlur = 0;

  // Element aura ring
  ctx.strokeStyle = ELEMENT_COLORS[player.element];
  ctx.globalAlpha = auraAlpha;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px + 12, py + 12, 18 + Math.sin(gameTime * 4) * 2, 0, Math.PI * 2);
  ctx.stroke();

  // Facing direction indicator (small energy orb)
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = ELEMENT_COLORS[player.element];
  ctx.beginPath();
  ctx.arc(
    px + 12 + player.facing.x * 14,
    py + 12 + player.facing.y * 14,
    3, 0, Math.PI * 2
  );
  ctx.fill();

  ctx.globalAlpha = 1;
}

function drawProceduralPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, gameTime: number) {
  const px = player.pos.x;
  const py = player.pos.y;
  const color = ELEMENT_COLORS[player.element];
  const bob = Math.sin(gameTime * 6) * 1.5;

  // Body (darker inner)
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(px + 4, py + 6 + bob, 16, 14);
  // Armor overlay
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(px + 5, py + 7 + bob, 14, 12);
  ctx.globalAlpha = 1;
  // Head
  ctx.fillStyle = '#2a2a3e';
  ctx.fillRect(px + 7, py + 1 + bob, 10, 8);
  // Eyes (glow with element)
  ctx.fillStyle = color;
  ctx.fillRect(px + 9, py + 4 + bob, 2, 2);
  ctx.fillRect(px + 13, py + 4 + bob, 2, 2);
  // Legs
  ctx.fillStyle = '#1a1a2e';
  const legSwing = Math.sin(gameTime * 8) * 2;
  ctx.fillRect(px + 6, py + 20 + bob, 4, 6);
  ctx.fillRect(px + 14, py + 20 + bob, 4, 6);
  // Weapon arm
  if (player.isAttacking) {
    ctx.fillStyle = color;
    ctx.fillRect(px + 20, py + 8 + bob, 6, 3);
  }
}

// ─── Draw Enemy ───
export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  gameTime: number
) {
  if (enemy.hp <= 0) return;

  const sheet = spriteSheets['enemies'];
  const bossSheet = enemy.isBoss ? spriteSheets[`boss_${enemy.element}`] : null;
  const size = enemy.isBoss ? 48 : enemy.type === 'tank' ? 36 : enemy.type === 'miniboss' ? 32 : 28;
  const offset = (size - 24) / 2;
  const ex = enemy.pos.x;
  const ey = enemy.pos.y;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(ex + 12, ey + size - offset - 2, size * 0.4, size * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Boss glow
  if (enemy.isBoss) {
    ctx.shadowColor = ELEMENT_COLORS[enemy.element];
    ctx.shadowBlur = 20 + Math.sin(gameTime * 3) * 8;
  }

  if (enemy.isBoss && bossSheet?.loaded) {
    // Draw boss sprite
    ctx.drawImage(
      bossSheet.image,
      0, 0, bossSheet.image.naturalWidth, bossSheet.image.naturalHeight,
      ex - offset - 8, ey - offset - 12, size + 16, size + 16
    );
  } else if (!enemy.isBoss && sheet?.loaded) {
    // Pick enemy frame based on type
    const frameMap: Record<EnemyType, number> = {
      melee: 0, ranged: 1, assassin: 2, tank: 3, miniboss: 0, boss: 0
    };
    const frame = frameMap[enemy.type] ?? 0;
    const sw = sheet.frameWidth;
    const sh = sheet.frameHeight;
    
    // Tint with element color
    ctx.drawImage(
      sheet.image,
      frame * sw, 0, sw, sh,
      ex - offset, ey - offset - 4, size, size + 4
    );
    
    // Element color overlay
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = ELEMENT_COLORS[enemy.element];
    ctx.fillRect(ex - offset, ey - offset - 4, size, size + 4);
    ctx.globalAlpha = 1;
  } else {
    // Fallback: Enhanced procedural enemy
    drawProceduralEnemy(ctx, enemy, gameTime);
  }

  ctx.shadowBlur = 0;

  // HP bar
  if (enemy.hp < enemy.maxHp) {
    const barW = size + 8;
    const barH = enemy.isBoss ? 5 : 3;
    const barX = ex - offset - 4;
    const barY = ey - offset - (enemy.isBoss ? 16 : 10);
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
    // HP fill
    const hpPct = enemy.hp / enemy.maxHp;
    const hpColor = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barW * hpPct, barH);
    // Boss HP text
    if (enemy.isBoss) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(enemy.hp)}/${enemy.maxHp}`, ex + 12, barY - 2);
    }
  }

  // Status effect visuals
  for (const eff of enemy.statusEffects) {
    ctx.globalAlpha = 0.3 + Math.sin(gameTime * 6) * 0.15;
    if (eff.type === 'burn') {
      // Fire particles around enemy
      for (let i = 0; i < 3; i++) {
        const fx = ex + Math.random() * size - offset;
        const fy = ey + Math.random() * size - offset;
        ctx.fillStyle = '#ff4400';
        ctx.fillRect(fx, fy, 2, 2);
      }
    } else if (eff.type === 'slow') {
      ctx.strokeStyle = '#44aaff';
      ctx.lineWidth = 1;
      ctx.strokeRect(ex - offset - 1, ey - offset - 1, size + 2, size + 2);
    }
    ctx.globalAlpha = 1;
  }

  // Tired indicator
  if (enemy.isBoss && enemy.isTired) {
    ctx.globalAlpha = 0.8 + Math.sin(gameTime * 8) * 0.2;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('💫 EXHAUSTED!', ex + 12, ey - offset - 20);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(ex - offset - 4, ey - offset - 4, size + 8, size + 8);
    ctx.globalAlpha = 1;
  }

  // Summoning shield
  if (enemy.isBoss && enemy.state === 'special') {
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = ELEMENT_COLORS[enemy.element];
    ctx.lineWidth = 3;
    const shieldR = size * 0.8 + Math.sin(gameTime * 4) * 4;
    ctx.beginPath();
    ctx.arc(ex + 12, ey + 12, shieldR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = ELEMENT_COLORS[enemy.element];
    ctx.font = 'bold 10px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('SUMMONING...', ex + 12, ey - offset - 18);
    ctx.globalAlpha = 1;
  }
}

function drawProceduralEnemy(ctx: CanvasRenderingContext2D, enemy: Enemy, gameTime: number) {
  const color = ELEMENT_COLORS[enemy.element];
  const darkColor = '#1a1a2e';
  const size = enemy.isBoss ? 48 : enemy.type === 'tank' ? 36 : enemy.type === 'miniboss' ? 32 : 28;
  const offset = (size - 24) / 2;
  const ex = enemy.pos.x;
  const ey = enemy.pos.y;
  const bob = Math.sin(gameTime * 4 + ex) * 1;

  // Body
  ctx.fillStyle = darkColor;
  ctx.fillRect(ex - offset, ey - offset + bob, size, size);
  ctx.fillStyle = color;
  ctx.fillRect(ex - offset + 2, ey - offset + 2 + bob, size - 4, size - 4);

  // Eyes
  ctx.fillStyle = '#fff';
  const eyeSize = enemy.isBoss ? 4 : 2;
  ctx.fillRect(ex + 4, ey + 4 + bob, eyeSize, eyeSize);
  ctx.fillRect(ex + 14, ey + 4 + bob, eyeSize, eyeSize);

  // Type indicator
  ctx.fillStyle = '#000';
  ctx.font = `${enemy.isBoss ? '16' : '11'}px Rajdhani`;
  ctx.textAlign = 'center';
  const typeChar = enemy.type === 'melee' ? '⚔' : enemy.type === 'ranged' ? '◎' : enemy.type === 'assassin' ? '☆' : enemy.type === 'tank' ? '■' : enemy.isBoss ? '♛' : '◆';
  ctx.fillText(typeChar, ex + 12, ey + 18 + bob);
}

// ─── Draw Enhanced Tile ───
export function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: number,
  zone: ElementType,
  x: number,
  y: number,
  gameTime: number,
  isIso: boolean
) {
  const tx = x * TILE_SIZE;
  const ty = y * TILE_SIZE;
  const seed = (x * 7 + y * 13) % 100; // deterministic variation

  if (tile === 0) {
    // Floor tile with stone brick pattern
    drawFloorTile(ctx, tx, ty, zone, seed, gameTime);
  } else if (tile === 1) {
    // Wall tile with depth
    drawWallTile(ctx, tx, ty, zone, seed, isIso, gameTime);
  } else if (tile === 2) {
    // Hazard tile with animated effects
    drawHazardTile(ctx, tx, ty, zone, seed, gameTime);
  }
}

function drawFloorTile(ctx: CanvasRenderingContext2D, x: number, y: number, zone: ElementType, seed: number, gameTime: number) {
  const floorColors: Record<ElementType, [string, string]> = {
    fire: ['#1a0a04', '#241008'],
    ice: ['#040a1a', '#080e24'],
    lightning: ['#0f0d04', '#171508'],
    shadow: ['#0a041a', '#0e0824'],
    earth: ['#1a1004', '#241808'],
    wind: ['#041a10', '#082418'],
    nature: ['#041a04', '#082408'],
    void: ['#1a0410', '#240818'],
  };
  const [base, variant] = floorColors[zone];
  
  // Base color with slight variation
  ctx.fillStyle = seed % 3 === 0 ? variant : base;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Stone brick lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  // Horizontal brick line
  ctx.beginPath();
  ctx.moveTo(x, y + TILE_SIZE / 2);
  ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE / 2);
  ctx.stroke();
  // Vertical brick lines (offset per row)
  const vOffset = (seed % 2) * TILE_SIZE * 0.4;
  ctx.beginPath();
  ctx.moveTo(x + vOffset + TILE_SIZE * 0.3, y);
  ctx.lineTo(x + vOffset + TILE_SIZE * 0.3, y + TILE_SIZE / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + TILE_SIZE * 0.7, y + TILE_SIZE / 2);
  ctx.lineTo(x + TILE_SIZE * 0.7, y + TILE_SIZE);
  ctx.stroke();

  // Random cracks
  if (seed % 7 === 0) {
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + TILE_SIZE * 0.3, y + TILE_SIZE * 0.2);
    ctx.lineTo(x + TILE_SIZE * 0.5, y + TILE_SIZE * 0.5);
    ctx.lineTo(x + TILE_SIZE * 0.7, y + TILE_SIZE * 0.6);
    ctx.stroke();
  }

  // Moss/dirt spots for nature/earth zones
  if ((zone === 'nature' || zone === 'earth') && seed % 5 === 0) {
    ctx.fillStyle = zone === 'nature' ? 'rgba(34,197,94,0.15)' : 'rgba(139,90,43,0.15)';
    ctx.beginPath();
    ctx.arc(x + (seed % 40) + 4, y + ((seed * 3) % 40) + 4, 4 + (seed % 3), 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWallTile(ctx: CanvasRenderingContext2D, x: number, y: number, zone: ElementType, seed: number, isIso: boolean, gameTime: number) {
  const wallColors: Record<ElementType, [string, string]> = {
    fire: ['#3d1a0a', '#4d2210'],
    ice: ['#0a1a3d', '#10224d'],
    lightning: ['#2d2a0a', '#3d3510'],
    shadow: ['#1a0a3d', '#22104d'],
    earth: ['#3d2a0a', '#4d3510'],
    wind: ['#0a3d20', '#104d28'],
    nature: ['#0a3d0a', '#104d10'],
    void: ['#3d0a20', '#4d1028'],
  };
  const [base, variant] = wallColors[zone];

  // Main wall face
  ctx.fillStyle = seed % 4 === 0 ? variant : base;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Brick pattern
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  for (let row = 0; row < 3; row++) {
    const rowY = y + row * (TILE_SIZE / 3);
    ctx.beginPath();
    ctx.moveTo(x, rowY);
    ctx.lineTo(x + TILE_SIZE, rowY);
    ctx.stroke();
    const brickOffset = (row % 2) * (TILE_SIZE / 3);
    for (let col = 0; col < 3; col++) {
      ctx.beginPath();
      ctx.moveTo(x + brickOffset + col * (TILE_SIZE / 2.5), rowY);
      ctx.lineTo(x + brickOffset + col * (TILE_SIZE / 2.5), rowY + TILE_SIZE / 3);
      ctx.stroke();
    }
  }

  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x, y, TILE_SIZE, 3);

  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x, y + TILE_SIZE - 4, TILE_SIZE, 4);

  if (isIso) {
    // Wall height for isometric
    const wallH = 20;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y - wallH, TILE_SIZE, wallH);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, y - wallH, TILE_SIZE, 2);
  }

  // Torch on certain walls
  if (seed % 12 === 0) {
    drawTorch(ctx, x + TILE_SIZE / 2, y + TILE_SIZE * 0.3, gameTime, zone);
  }
}

function drawHazardTile(ctx: CanvasRenderingContext2D, x: number, y: number, zone: ElementType, seed: number, gameTime: number) {
  // Base hazard color
  const hazardBase: Record<ElementType, string> = {
    fire: '#1a0500', ice: '#000a1a', lightning: '#0f0d04',
    shadow: '#0a001a', earth: '#1a0c00', wind: '#001a10',
    nature: '#001a00', void: '#1a0020',
  };
  ctx.fillStyle = hazardBase[zone];
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // Animated hazard effect
  const t = gameTime * 2 + seed * 0.1;
  const glowIntensity = 0.4 + Math.sin(t) * 0.2;
  
  if (zone === 'fire') {
    // Flowing lava pool — NOT a cross shape
    // Base lava fill
    ctx.fillStyle = `rgba(180,40,0,${glowIntensity})`;
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    // Bright flowing surface
    ctx.fillStyle = `rgba(255,100,0,${glowIntensity * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 6);
    ctx.lineTo(x + TILE_SIZE - 6, y + 8 + Math.sin(t) * 3);
    ctx.lineTo(x + TILE_SIZE - 8, y + TILE_SIZE - 6);
    ctx.lineTo(x + 8 + Math.sin(t * 1.3) * 3, y + TILE_SIZE - 8);
    ctx.closePath();
    ctx.fill();
    // Hot spots (bright yellow-orange blobs)
    const blobCount = 3;
    for (let b = 0; b < blobCount; b++) {
      const bx = x + 10 + ((seed * (b + 1) * 7) % (TILE_SIZE - 20));
      const by = y + 10 + ((seed * (b + 1) * 11) % (TILE_SIZE - 20));
      const br = 3 + Math.sin(t * 2 + b * 2) * 2;
      ctx.fillStyle = `rgba(255,200,50,${0.5 + Math.sin(t * 3 + b) * 0.3})`;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    // Bubble pops
    if (seed % 3 === 0) {
      const bubbleY = y + TILE_SIZE * 0.3 + Math.sin(t * 3 + seed) * 4;
      ctx.fillStyle = `rgba(255,220,100,${0.4 + Math.sin(t * 4 + seed) * 0.3})`;
      ctx.beginPath();
      ctx.arc(x + 10 + (seed % 20), bubbleY, 2 + Math.sin(t * 2) * 1, 0, Math.PI * 2);
      ctx.fill();
    }
    // Surface shimmer
    ctx.strokeStyle = `rgba(255,180,50,${0.3 + Math.sin(t * 1.5) * 0.15})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let sx = x + 4; sx < x + TILE_SIZE - 4; sx += 6) {
      const sy = y + TILE_SIZE / 2 + Math.sin(t * 2 + sx * 0.15) * 6;
      if (sx === x + 4) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  } else if (zone === 'ice') {
    // Ice crystals
    ctx.fillStyle = `rgba(56,189,248,${glowIntensity * 0.5})`;
    ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.strokeStyle = `rgba(103,232,249,${glowIntensity})`;
    ctx.lineWidth = 1;
    // Crystal pattern
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + t * 0.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 16, cy + Math.sin(angle) * 16);
      ctx.stroke();
    }
  } else {
    // Generic hazard glow
    ctx.fillStyle = ELEMENT_COLORS[zone];
    ctx.globalAlpha = glowIntensity * 0.6;
    ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    ctx.globalAlpha = 1;
  }

  // Border glow
  ctx.shadowColor = ELEMENT_COLORS[zone];
  ctx.shadowBlur = 8 + Math.sin(t) * 4;
  ctx.strokeStyle = ELEMENT_COLORS[zone];
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

function drawTorch(ctx: CanvasRenderingContext2D, x: number, y: number, gameTime: number, zone: ElementType) {
  const flicker = Math.sin(gameTime * 10 + x) * 2 + Math.cos(gameTime * 7 + y) * 1;
  const color = ELEMENT_COLORS[zone];
  
  // Bracket
  ctx.fillStyle = '#333';
  ctx.fillRect(x - 2, y + 2, 4, 8);
  
  // Flame
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - 3, y + 2);
  ctx.quadraticCurveTo(x + flicker * 0.5, y - 6 + flicker, x + 3, y + 2);
  ctx.fill();
  
  // Flame core
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(x, y, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Light glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 20 + flicker * 3;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.05;
  ctx.beginPath();
  ctx.arc(x, y, 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}
