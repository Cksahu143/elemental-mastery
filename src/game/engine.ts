import {
  PlayerState, Enemy, Projectile, DamageNumber, Particle,
  GameRoom, Position, ElementType, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT,
  ELEMENT_COLORS, ELEMENT_COLORS_DARK, StatusEffect,
} from './types';
import { generateRoom, getTileColor } from './dungeon';
import { SaveData } from './types';

// ─── Input tracking ───
const keys: Record<string, boolean> = {};
let mousePos: Position = { x: 0, y: 0 };
let mouseDown = false;
let canvasRect = { left: 0, top: 0 };

export function initInput(canvas: HTMLCanvasElement) {
  canvasRect = canvas.getBoundingClientRect();
  window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; e.preventDefault(); });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
  canvas.addEventListener('mousemove', (e) => {
    canvasRect = canvas.getBoundingClientRect();
    mousePos = { x: e.clientX - canvasRect.left, y: e.clientY - canvasRect.top };
  });
  canvas.addEventListener('mousedown', () => { mouseDown = true; });
  canvas.addEventListener('mouseup', () => { mouseDown = false; });
}

// ─── Game State ───
let player: PlayerState;
let room: GameRoom;
let projectiles: Projectile[] = [];
let damageNumbers: DamageNumber[] = [];
let particles: Particle[] = [];
let camera: Position = { x: 0, y: 0 };
let screenShake = 0;
let floor = 1;
let gameTime = 0;
let projIdCounter = 0;
let dmgIdCounter = 0;
let onStateChange: (() => void) | null = null;
let onBossEncounter: ((zone: ElementType) => void) | null = null;
let onLoreFound: ((id: string) => void) | null = null;
let onLevelUp: (() => void) | null = null;
let onRoomCleared: (() => void) | null = null;
let bossDialogueShown = false;

export function setCallbacks(cbs: {
  onStateChange?: () => void;
  onBossEncounter?: (zone: ElementType) => void;
  onLoreFound?: (id: string) => void;
  onLevelUp?: () => void;
  onRoomCleared?: () => void;
}) {
  onStateChange = cbs.onStateChange || null;
  onBossEncounter = cbs.onBossEncounter || null;
  onLoreFound = cbs.onLoreFound || null;
  onLevelUp = cbs.onLevelUp || null;
  onRoomCleared = cbs.onRoomCleared || null;
}

export function getPlayer(): PlayerState { return player; }
export function getFloor(): number { return floor; }
export function getRoom(): GameRoom { return room; }

export function initGame(save: SaveData) {
  player = {
    pos: { x: 0, y: 0 },
    hp: save.hp,
    maxHp: save.maxHp,
    mana: save.mana,
    maxMana: save.maxMana,
    xp: save.xp,
    xpToNext: save.xpToNext,
    level: save.level,
    stats: { ...save.stats },
    statPoints: save.statPoints,
    element: save.currentZone,
    unlockedElements: [...save.unlockedElements],
    skills: [...save.skills],
    dashCooldown: 0,
    attackCooldown: 0,
    facing: { x: 1, y: 0 },
    isAttacking: false,
    isDashing: false,
    dashTimer: 0,
    invincible: 0,
  };
  floor = save.currentFloor;
  bossDialogueShown = false;
  loadRoom(save.currentZone, floor);
}

function loadRoom(zone: ElementType, fl: number) {
  const isBoss = fl % 5 === 0;
  room = generateRoom(zone, fl, isBoss);
  const cx = Math.floor(room.width / 2);
  const cy = Math.floor(room.height / 2);
  player.pos = { x: cx * TILE_SIZE, y: (room.height - 3) * TILE_SIZE };
  projectiles = [];
  damageNumbers = [];
  particles = [];
  
  if (isBoss && !bossDialogueShown) {
    bossDialogueShown = true;
    onBossEncounter?.(zone);
  }
}

export function nextRoom() {
  floor++;
  bossDialogueShown = false;
  loadRoom(player.element, floor);
  onStateChange?.();
}

export function getSaveData(): SaveData {
  return {
    level: player.level,
    stats: { ...player.stats },
    statPoints: player.statPoints,
    unlockedElements: [...player.unlockedElements],
    skills: [...player.skills],
    loreUnlocked: [],
    bossesDefeated: [],
    currentZone: player.element,
    currentFloor: floor,
    hp: player.hp,
    maxHp: player.maxHp,
    mana: player.mana,
    maxMana: player.maxMana,
    xp: player.xp,
    xpToNext: player.xpToNext,
  };
}

export function allocateStat(stat: keyof PlayerState['stats']) {
  if (player.statPoints <= 0) return;
  player.statPoints--;
  player.stats[stat]++;
  if (stat === 'defense') {
    player.maxHp += 5;
    player.hp = Math.min(player.hp + 5, player.maxHp);
  }
  if (stat === 'elementalPower') {
    player.maxMana += 3;
    player.mana = Math.min(player.mana + 3, player.maxMana);
  }
  onStateChange?.();
}

// ─── Update ───
export function update(dt: number) {
  if (!player || !room) return;
  gameTime += dt;

  // Mana regen
  player.mana = Math.min(player.maxMana, player.mana + 0.5 * dt);

  // Movement
  const speed = (2 + player.stats.speed * 0.3) * TILE_SIZE;
  let dx = 0, dy = 0;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.sqrt(dx * dx + dy * dy);
    dx /= len; dy /= len;
  }

  // Dash
  if ((keys[' '] || keys['shift']) && player.dashCooldown <= 0 && (dx !== 0 || dy !== 0)) {
    player.isDashing = true;
    player.dashTimer = 0.15;
    player.dashCooldown = 1;
    player.invincible = 0.2;
    // Dash particles
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: player.pos.x + 12, y: player.pos.y + 12,
        vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
        life: 0.3, maxLife: 0.3,
        color: ELEMENT_COLORS[player.element],
        size: 3,
      });
    }
  }

  if (player.dashTimer > 0) {
    player.dashTimer -= dt;
    const dashSpeed = speed * 3;
    const nx = player.pos.x + dx * dashSpeed * dt;
    const ny = player.pos.y + dy * dashSpeed * dt;
    if (!collidesWith(nx, ny)) {
      player.pos.x = nx;
      player.pos.y = ny;
    }
  } else {
    player.isDashing = false;
    const nx = player.pos.x + dx * speed * dt;
    const ny = player.pos.y + dy * speed * dt;
    if (!collidesWith(nx, player.pos.y)) player.pos.x = nx;
    if (!collidesWith(player.pos.x, ny)) player.pos.y = ny;
  }

  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.invincible = Math.max(0, player.invincible - dt);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);

  // Facing direction (toward mouse)
  const worldMouseX = mousePos.x + camera.x;
  const worldMouseY = mousePos.y + camera.y;
  const fdx = worldMouseX - (player.pos.x + 12);
  const fdy = worldMouseY - (player.pos.y + 12);
  const flen = Math.sqrt(fdx * fdx + fdy * fdy);
  if (flen > 0) {
    player.facing = { x: fdx / flen, y: fdy / flen };
  }

  // Attack
  if (mouseDown && player.attackCooldown <= 0) {
    player.attackCooldown = Math.max(0.15, 0.4 - player.stats.speed * 0.02);
    player.isAttacking = true;
    const projSpeed = 300;
    projectiles.push({
      id: `proj_${projIdCounter++}`,
      pos: { x: player.pos.x + 12, y: player.pos.y + 12 },
      vel: { x: player.facing.x * projSpeed, y: player.facing.y * projSpeed },
      damage: player.stats.attack + player.stats.elementalPower * 0.5,
      element: player.element,
      fromPlayer: true,
      lifetime: 0.8,
      radius: 6,
    });
    // Muzzle particles
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: player.pos.x + 12 + player.facing.x * 16,
        y: player.pos.y + 12 + player.facing.y * 16,
        vx: player.facing.x * 80 + (Math.random() - 0.5) * 60,
        vy: player.facing.y * 80 + (Math.random() - 0.5) * 60,
        life: 0.2, maxLife: 0.2,
        color: ELEMENT_COLORS[player.element],
        size: 2 + Math.random() * 2,
      });
    }
    setTimeout(() => { player.isAttacking = false; }, 100);
  }

  // Hazard damage
  const ptx = Math.floor((player.pos.x + 12) / TILE_SIZE);
  const pty = Math.floor((player.pos.y + 12) / TILE_SIZE);
  if (pty >= 0 && pty < room.height && ptx >= 0 && ptx < room.width) {
    if (room.tiles[pty][ptx] === 2 && player.invincible <= 0) {
      player.hp -= 5 * dt;
    }
  }

  // Update enemies
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    updateEnemy(enemy, dt);
  }

  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.pos.x += p.vel.x * dt;
    p.pos.y += p.vel.y * dt;
    p.lifetime -= dt;

    // Trail particles
    if (Math.random() < 0.5) {
      particles.push({
        x: p.pos.x, y: p.pos.y,
        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
        life: 0.15, maxLife: 0.15,
        color: ELEMENT_COLORS[p.element],
        size: 2,
      });
    }

    if (p.lifetime <= 0) {
      projectiles.splice(i, 1);
      continue;
    }

    // Collision with walls
    const tx = Math.floor(p.pos.x / TILE_SIZE);
    const ty = Math.floor(p.pos.y / TILE_SIZE);
    if (ty < 0 || ty >= room.height || tx < 0 || tx >= room.width || room.tiles[ty][tx] === 1) {
      projectiles.splice(i, 1);
      continue;
    }

    if (p.fromPlayer) {
      // Hit enemies
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        const edist = dist(p.pos, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
        if (edist < p.radius + 12) {
          const isCrit = Math.random() < 0.15;
          const dmg = Math.floor(p.damage * (isCrit ? 2 : 1));
          enemy.hp -= dmg;
          enemy.knockback = { x: p.vel.x * 0.05, y: p.vel.y * 0.05 };
          addDamageNumber(enemy.pos, dmg, p.element, isCrit);
          applyElementEffect(enemy, p.element);
          screenShake = isCrit ? 6 : 3;
          if (enemy.hp <= 0) onEnemyKill(enemy);
          projectiles.splice(i, 1);
          break;
        }
      }
    } else {
      // Hit player
      const pdist = dist(p.pos, { x: player.pos.x + 12, y: player.pos.y + 12 });
      if (pdist < p.radius + 10 && player.invincible <= 0) {
        const dmg = Math.max(1, Math.floor(p.damage - player.stats.defense * 0.5));
        player.hp -= dmg;
        player.invincible = 0.3;
        addDamageNumber(player.pos, dmg, p.element, false);
        screenShake = 4;
        projectiles.splice(i, 1);
      }
    }
  }

  // Update status effects on enemies
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    for (let j = enemy.statusEffects.length - 1; j >= 0; j--) {
      const eff = enemy.statusEffects[j];
      eff.duration -= dt;
      if (eff.type === 'burn') {
        enemy.hp -= eff.damage * dt;
        if (Math.random() < 0.3) {
          particles.push({
            x: enemy.pos.x + Math.random() * 24,
            y: enemy.pos.y + Math.random() * 24,
            vx: (Math.random() - 0.5) * 30, vy: -30 - Math.random() * 30,
            life: 0.4, maxLife: 0.4,
            color: '#ff6622', size: 3,
          });
        }
        if (enemy.hp <= 0) onEnemyKill(enemy);
      }
      if (eff.duration <= 0) enemy.statusEffects.splice(j, 1);
    }
    // Knockback decay
    enemy.knockback.x *= 0.9;
    enemy.knockback.y *= 0.9;
    enemy.pos.x += enemy.knockback.x;
    enemy.pos.y += enemy.knockback.y;
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Update damage numbers
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    damageNumbers[i].pos.y -= 40 * dt;
    damageNumbers[i].lifetime -= dt;
    if (damageNumbers[i].lifetime <= 0) damageNumbers.splice(i, 1);
  }

  // Screen shake decay
  screenShake *= 0.9;
  if (screenShake < 0.5) screenShake = 0;

  // Camera
  camera.x = player.pos.x - CANVAS_WIDTH / 2 + 12;
  camera.y = player.pos.y - CANVAS_HEIGHT / 2 + 12;
  camera.x = Math.max(0, Math.min(camera.x, room.width * TILE_SIZE - CANVAS_WIDTH));
  camera.y = Math.max(0, Math.min(camera.y, room.height * TILE_SIZE - CANVAS_HEIGHT));

  // Check room cleared
  if (!room.cleared && room.enemies.every(e => e.hp <= 0)) {
    room.cleared = true;
    onRoomCleared?.();
    // Random lore find
    if (Math.random() < 0.3) {
      const loreIds = ['shattering_event', 'corruption_origin', 'fragment_bearers', 'prophecy', 
        'guardian_ignis', 'guardian_glacius', 'guardian_voltaris', 'guardian_umbra'];
      const randomLore = loreIds[Math.floor(Math.random() * loreIds.length)];
      onLoreFound?.(randomLore);
    }
  }

  // Check if player at exit
  if (room.cleared && room.exits.length > 0) {
    for (const exit of room.exits) {
      const edist = dist(player.pos, { x: exit.x * TILE_SIZE, y: exit.y * TILE_SIZE });
      if (edist < TILE_SIZE) {
        nextRoom();
        return;
      }
    }
  }

  // Player death
  if (player.hp <= 0) {
    player.hp = 0;
  }

  onStateChange?.();
}

function updateEnemy(enemy: Enemy, dt: number) {
  const slowFactor = enemy.statusEffects.some(e => e.type === 'slow') ? 0.4 : 1;
  const toPlayer = { x: player.pos.x - enemy.pos.x, y: player.pos.y - enemy.pos.y };
  const dToPlayer = Math.sqrt(toPlayer.x * toPlayer.x + toPlayer.y * toPlayer.y);
  
  enemy.attackTimer = Math.max(0, enemy.attackTimer - dt);
  enemy.stateTimer -= dt;

  if (dToPlayer > 300) {
    enemy.state = 'idle';
  } else if (enemy.state === 'idle' && dToPlayer < 250) {
    enemy.state = 'chase';
  }

  if (enemy.state === 'chase' && dToPlayer > 1) {
    const speed = enemy.speed * TILE_SIZE * slowFactor;
    const ndx = (toPlayer.x / dToPlayer) * speed * dt;
    const ndy = (toPlayer.y / dToPlayer) * speed * dt;
    
    if (enemy.type === 'ranged' && dToPlayer < 120) {
      // ranged enemies keep distance
      enemy.pos.x -= ndx;
      enemy.pos.y -= ndy;
    } else {
      const nx = enemy.pos.x + ndx;
      const ny = enemy.pos.y + ndy;
      if (!collidesWith(nx, ny)) {
        enemy.pos.x = nx;
        enemy.pos.y = ny;
      }
    }
  }

  // Attack
  if (enemy.attackTimer <= 0 && dToPlayer < (enemy.type === 'ranged' ? 200 : 30)) {
    enemy.attackTimer = enemy.attackCooldown;
    
    if (enemy.type === 'ranged' || enemy.isBoss) {
      // Shoot projectile
      const pdx = toPlayer.x / dToPlayer;
      const pdy = toPlayer.y / dToPlayer;
      projectiles.push({
        id: `proj_${projIdCounter++}`,
        pos: { x: enemy.pos.x + 12, y: enemy.pos.y + 12 },
        vel: { x: pdx * 180, y: pdy * 180 },
        damage: enemy.damage,
        element: enemy.element,
        fromPlayer: false,
        lifetime: 1.5,
        radius: 5,
      });
    } else if (dToPlayer < 30 && player.invincible <= 0) {
      // Melee hit
      const dmg = Math.max(1, enemy.damage - player.stats.defense * 0.5);
      player.hp -= dmg;
      player.invincible = 0.3;
      addDamageNumber(player.pos, Math.floor(dmg), enemy.element, false);
      screenShake = 3;
    }
  }

  // Boss special attacks
  if (enemy.isBoss && enemy.hp < enemy.maxHp * 0.5 && enemy.phase === 1) {
    enemy.phase = 2;
    enemy.damage = Math.floor(enemy.damage * 1.3);
    enemy.speed *= 1.2;
    screenShake = 10;
    // Phase 2 burst
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      projectiles.push({
        id: `proj_${projIdCounter++}`,
        pos: { x: enemy.pos.x + 12, y: enemy.pos.y + 12 },
        vel: { x: Math.cos(angle) * 150, y: Math.sin(angle) * 150 },
        damage: enemy.damage,
        element: enemy.element,
        fromPlayer: false,
        lifetime: 2,
        radius: 6,
      });
    }
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: enemy.pos.x + 12, y: enemy.pos.y + 12,
        vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
        life: 0.5, maxLife: 0.5,
        color: ELEMENT_COLORS[enemy.element],
        size: 4,
      });
    }
  }
}

function applyElementEffect(enemy: Enemy, element: ElementType) {
  switch (element) {
    case 'fire':
      if (!enemy.statusEffects.some(e => e.type === 'burn')) {
        enemy.statusEffects.push({ type: 'burn', duration: 3, damage: 5 });
      }
      break;
    case 'ice':
      if (!enemy.statusEffects.some(e => e.type === 'slow')) {
        enemy.statusEffects.push({ type: 'slow', duration: 2, damage: 0 });
      }
      break;
    case 'lightning':
      // Chain to nearby enemies
      for (const other of room.enemies) {
        if (other.id !== enemy.id && other.hp > 0) {
          const d = dist(enemy.pos, other.pos);
          if (d < 80) {
            other.hp -= 3;
            addDamageNumber(other.pos, 3, 'lightning', false);
          }
        }
      }
      break;
    case 'shadow':
      player.hp = Math.min(player.maxHp, player.hp + 2);
      break;
  }
}

function onEnemyKill(enemy: Enemy) {
  const xpGain = enemy.isBoss ? 100 : enemy.type === 'miniboss' ? 40 : 15 + floor * 2;
  player.xp += xpGain;
  
  // Death particles
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: enemy.pos.x + 12, y: enemy.pos.y + 12,
      vx: (Math.random() - 0.5) * 150, vy: (Math.random() - 0.5) * 150,
      life: 0.5, maxLife: 0.5,
      color: ELEMENT_COLORS[enemy.element],
      size: 3 + Math.random() * 3,
    });
  }

  // Level up check
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(player.xpToNext * 1.3);
    player.statPoints += 3;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    screenShake = 8;
    onLevelUp?.();
    // Level up particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      particles.push({
        x: player.pos.x + 12, y: player.pos.y + 12,
        vx: Math.cos(angle) * 100, vy: Math.sin(angle) * 100,
        life: 0.6, maxLife: 0.6,
        color: '#FFD700', size: 4,
      });
    }
  }

  if (enemy.isBoss) {
    const loreId = `guardian_${enemy.element === 'fire' ? 'ignis' : enemy.element === 'ice' ? 'glacius' : enemy.element === 'lightning' ? 'voltaris' : 'umbra'}`;
    onLoreFound?.(loreId);
  }
}

function addDamageNumber(pos: Position, value: number, element: ElementType, isCrit: boolean) {
  damageNumbers.push({
    id: `dmg_${dmgIdCounter++}`,
    pos: { x: pos.x + (Math.random() - 0.5) * 20, y: pos.y - 10 },
    value, element, lifetime: 0.8, isCrit,
  });
}

function collidesWith(x: number, y: number): boolean {
  const margin = 4;
  const checks = [
    { cx: x + margin, cy: y + margin },
    { cx: x + 24 - margin, cy: y + margin },
    { cx: x + margin, cy: y + 24 - margin },
    { cx: x + 24 - margin, cy: y + 24 - margin },
  ];
  for (const c of checks) {
    const tx = Math.floor(c.cx / TILE_SIZE);
    const ty = Math.floor(c.cy / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= room.width || ty >= room.height) return true;
    if (room.tiles[ty][tx] === 1) return true;
  }
  return false;
}

function dist(a: Position, b: Position): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ─── Render ───
export function render(ctx: CanvasRenderingContext2D) {
  if (!player || !room) return;
  
  ctx.save();
  
  // Screen shake
  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
  ctx.translate(-camera.x + shakeX, -camera.y + shakeY);

  // Tiles
  for (let y = 0; y < room.height; y++) {
    for (let x = 0; x < room.width; x++) {
      const sx = x * TILE_SIZE - camera.x;
      const sy = y * TILE_SIZE - camera.y;
      if (sx > -TILE_SIZE && sx < CANVAS_WIDTH + TILE_SIZE && sy > -TILE_SIZE && sy < CANVAS_HEIGHT + TILE_SIZE) {
        ctx.fillStyle = getTileColor(room.tiles[y][x], room.zone);
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        if (room.tiles[y][x] === 1) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE + TILE_SIZE - 4, TILE_SIZE, 4);
        }
        if (room.tiles[y][x] === 2) {
          ctx.globalAlpha = 0.3 + Math.sin(gameTime * 3 + x + y) * 0.2;
          ctx.fillStyle = ELEMENT_COLORS[room.zone];
          ctx.fillRect(x * TILE_SIZE + 4, y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // Exit indicator
  if (room.cleared) {
    for (const exit of room.exits) {
      ctx.fillStyle = `rgba(100, 255, 100, ${0.5 + Math.sin(gameTime * 4) * 0.3})`;
      ctx.fillRect(exit.x * TILE_SIZE + 4, exit.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.fillStyle = '#fff';
      ctx.font = '10px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', exit.x * TILE_SIZE + TILE_SIZE / 2, exit.y * TILE_SIZE + TILE_SIZE / 2 + 4);
    }
  }

  // Enemies
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    const color = ELEMENT_COLORS[enemy.element];
    const darkColor = ELEMENT_COLORS_DARK[enemy.element];
    
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(enemy.pos.x + 12, enemy.pos.y + 26, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body
    const size = enemy.isBoss ? 32 : enemy.type === 'tank' ? 28 : 24;
    const offset = (size - 24) / 2;
    ctx.fillStyle = darkColor;
    ctx.fillRect(enemy.pos.x - offset, enemy.pos.y - offset, size, size);
    ctx.fillStyle = color;
    ctx.fillRect(enemy.pos.x - offset + 2, enemy.pos.y - offset + 2, size - 4, size - 4);
    
    // Enemy type indicator
    ctx.fillStyle = '#000';
    ctx.font = `${enemy.isBoss ? '14' : '10'}px Rajdhani`;
    ctx.textAlign = 'center';
    const typeChar = enemy.type === 'melee' ? '⚔' : enemy.type === 'ranged' ? '◎' : enemy.type === 'assassin' ? '☆' : enemy.type === 'tank' ? '■' : enemy.isBoss ? '♛' : '◆';
    ctx.fillText(typeChar, enemy.pos.x + 12, enemy.pos.y + 16);
    
    // HP bar
    if (enemy.hp < enemy.maxHp) {
      const barW = size + 4;
      const barH = 3;
      const barX = enemy.pos.x - offset - 2;
      const barY = enemy.pos.y - offset - 8;
      ctx.fillStyle = '#000';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(barX, barY, barW * (enemy.hp / enemy.maxHp), barH);
    }

    // Status effect indicators
    if (enemy.statusEffects.length > 0) {
      ctx.globalAlpha = 0.5 + Math.sin(gameTime * 6) * 0.3;
      for (const eff of enemy.statusEffects) {
        if (eff.type === 'burn') {
          ctx.fillStyle = '#ff4400';
          ctx.fillRect(enemy.pos.x - 2, enemy.pos.y - 2, 28, 28);
        } else if (eff.type === 'slow') {
          ctx.fillStyle = '#44aaff';
          ctx.fillRect(enemy.pos.x - 2, enemy.pos.y - 2, 28, 28);
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // Projectiles
  for (const proj of projectiles) {
    ctx.fillStyle = ELEMENT_COLORS[proj.element];
    ctx.shadowColor = ELEMENT_COLORS[proj.element];
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(proj.pos.x, proj.pos.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Player
  if (player.hp > 0) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(player.pos.x + 12, player.pos.y + 26, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Invincibility flash
    if (player.invincible > 0 && Math.floor(player.invincible * 20) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Body
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(player.pos.x, player.pos.y, 24, 24);
    ctx.fillStyle = ELEMENT_COLORS[player.element];
    ctx.fillRect(player.pos.x + 2, player.pos.y + 2, 20, 20);
    
    // Direction indicator
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(
      player.pos.x + 12 + player.facing.x * 8,
      player.pos.y + 12 + player.facing.y * 8,
      3, 0, Math.PI * 2
    );
    ctx.fill();

    ctx.globalAlpha = 1;
    
    // Element aura
    ctx.strokeStyle = ELEMENT_COLORS[player.element];
    ctx.globalAlpha = 0.3 + Math.sin(gameTime * 3) * 0.1;
    ctx.lineWidth = 2;
    ctx.strokeRect(player.pos.x - 4, player.pos.y - 4, 32, 32);
    ctx.globalAlpha = 1;
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  // Damage numbers
  for (const dmg of damageNumbers) {
    ctx.globalAlpha = dmg.lifetime;
    ctx.font = `${dmg.isCrit ? 'bold 18' : '14'}px Rajdhani`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(dmg.value.toString(), dmg.pos.x + 1, dmg.pos.y + 1);
    ctx.fillStyle = dmg.isCrit ? '#FFD700' : ELEMENT_COLORS[dmg.element];
    ctx.fillText((dmg.isCrit ? 'CRIT! ' : '') + dmg.value.toString(), dmg.pos.x, dmg.pos.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function isPlayerDead(): boolean {
  return player && player.hp <= 0;
}

export function respawnPlayer() {
  player.hp = player.maxHp;
  player.mana = player.maxMana;
  floor = Math.max(1, floor - 1);
  bossDialogueShown = false;
  loadRoom(player.element, floor);
}
