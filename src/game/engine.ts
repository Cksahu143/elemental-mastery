import {
  PlayerState, Enemy, EnemyType, Projectile, DamageNumber, Particle,
  GameRoom, Position, ElementType, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT,
  ELEMENT_COLORS, ELEMENT_COLORS_DARK, StatusEffect, SKILLS,
} from './types';
import { generateRoom, getTileColor } from './dungeon';
import { SaveData } from './types';
import { SFX, startAmbientMusic, startBossMusic, stopBossMusic } from './audio';
import type { KingdomBonuses } from './kingdom';
import { initSprites, drawPlayer, drawEnemy, drawTile } from './sprites';
import { updateAmbient, renderAmbient, renderIceFrost, renderHeatDistortion, resetAmbient } from './environment';
import { updateTransition, renderTransition, startTransition, renderDynamicLighting, collectTorches, renderDeathOverlay, startBossIntroZoom, updateBossZoom, renderBossZoomOverlay } from './screenEffects';
import type { TorchLight } from './screenEffects';

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
let onBossDefeated: ((zone: ElementType) => void) | null = null;
let bossDialogueShown = false;

export function setCallbacks(cbs: {
  onStateChange?: () => void;
  onBossEncounter?: (zone: ElementType) => void;
  onLoreFound?: (id: string) => void;
  onLevelUp?: () => void;
  onRoomCleared?: () => void;
  onBossDefeated?: (zone: ElementType) => void;
}) {
  onStateChange = cbs.onStateChange || null;
  onBossEncounter = cbs.onBossEncounter || null;
  onLoreFound = cbs.onLoreFound || null;
  onLevelUp = cbs.onLevelUp || null;
  onRoomCleared = cbs.onRoomCleared || null;
  onBossDefeated = cbs.onBossDefeated || null;
}

export function getPlayer(): PlayerState { return player; }
export function getFloor(): number { return floor; }
export function getRoom(): GameRoom { return room; }

// Track applied kingdom bonuses so we can strip them when saving
let appliedKingdomBonuses: KingdomBonuses = { attackBonus: 0, hpBonus: 0, manaBonus: 0, xpMultiplier: 1, goldMultiplier: 1, hpRegen: 0, manaRegen: 0, defenseBonus: 0, elemPowerBonus: 0, speedBonus: 0, costReduction: 1 };

export function initGame(save: SaveData, kingdomBonuses?: KingdomBonuses) {
  initSprites();
  const kb = kingdomBonuses;
  appliedKingdomBonuses = kb ? { ...kb } : { attackBonus: 0, hpBonus: 0, manaBonus: 0, xpMultiplier: 1, goldMultiplier: 1, hpRegen: 0, manaRegen: 0, defenseBonus: 0, elemPowerBonus: 0, speedBonus: 0, costReduction: 1 };
  player = {
    pos: { x: 0, y: 0 },
    hp: Math.min(save.hp + (kb?.hpBonus ?? 0), save.maxHp + (kb?.hpBonus ?? 0)),
    maxHp: save.maxHp + (kb?.hpBonus ?? 0),
    mana: Math.min(save.mana + (kb?.manaBonus ?? 0), save.maxMana + (kb?.manaBonus ?? 0)),
    maxMana: save.maxMana + (kb?.manaBonus ?? 0),
    xp: save.xp,
    xpToNext: save.xpToNext,
    level: save.level,
    stats: { ...save.stats, attack: save.stats.attack + (kb?.attackBonus ?? 0), defense: save.stats.defense + (kb?.defenseBonus ?? 0), elementalPower: save.stats.elementalPower + (kb?.elemPowerBonus ?? 0), speed: save.stats.speed + (kb?.speedBonus ?? 0) },
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
  startAmbientMusic(save.currentZone);
}

// Kingdom regen stored separately, applied per update tick
let kingdomHpRegen = 0;
let kingdomManaRegen = 0;
export function setKingdomRegen(hpR: number, manaR: number) {
  kingdomHpRegen = hpR;
  kingdomManaRegen = manaR;
}

let torchCache: TorchLight[] = [];

function loadRoom(zone: ElementType, fl: number) {
  const isBoss = fl % 5 === 0;
  room = generateRoom(zone, fl, isBoss);
  const cx = Math.floor(room.width / 2);
  const cy = Math.floor(room.height / 2);
  player.pos = { x: cx * TILE_SIZE, y: (room.height - 3) * TILE_SIZE };
  projectiles = [];
  damageNumbers = [];
  particles = [];
  resetAmbient();
  torchCache = collectTorches(room.tiles, zone, TILE_SIZE);
  
  // Room transition
  startTransition('fade', 'in', 0.4);
  
  if (isBoss && !bossDialogueShown) {
    bossDialogueShown = true;
    SFX.bossRoar();
    startBossMusic(zone);
    // Boss intro zoom
    const boss = room.enemies.find(e => e.isBoss);
    if (boss) {
      startBossIntroZoom(boss.pos.x, boss.pos.y, zone);
    }
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
  // Strip kingdom bonuses before saving to prevent stacking on reload
  const kb = appliedKingdomBonuses;
  return {
    level: player.level,
    stats: {
      attack: player.stats.attack - kb.attackBonus,
      defense: player.stats.defense - kb.defenseBonus,
      speed: player.stats.speed - kb.speedBonus,
      elementalPower: player.stats.elementalPower - kb.elemPowerBonus,
    },
    statPoints: player.statPoints,
    unlockedElements: [...player.unlockedElements],
    skills: [...player.skills],
    loreUnlocked: [],
    bossesDefeated: [],
    currentZone: player.element,
    currentFloor: floor,
    hp: Math.min(player.hp, player.maxHp - kb.hpBonus),
    maxHp: player.maxHp - kb.hpBonus,
    mana: Math.min(player.mana, player.maxMana - kb.manaBonus),
    maxMana: player.maxMana - kb.manaBonus,
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
    player.maxMana += 5;
    player.mana = Math.min(player.mana + 5, player.maxMana);
  }
  onStateChange?.();
}

// ─── Update ───
export function update(dt: number) {
  if (!player || !room) return;
  gameTime += dt;

  // Update screen effects
  updateTransition(dt);
  updateBossZoom(dt);

  // Update ambient environment effects
  updateAmbient(dt, player.element, camera, room.width, room.height);

  // Kingdom shrine passive regen
  if (kingdomHpRegen > 0) player.hp = Math.min(player.maxHp, player.hp + kingdomHpRegen * dt);
  if (kingdomManaRegen > 0) player.mana = Math.min(player.maxMana, player.mana + kingdomManaRegen * dt);

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
    SFX.dash();
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

  // Skill usage (keys 1-4)
  const skillSlots = getActiveSkills();
  for (let si = 0; si < skillSlots.length; si++) {
    const sk = skillSlots[si];
    if (keys[`${si + 1}`] && player.mana >= sk.manaCost && player.attackCooldown <= 0) {
      keys[`${si + 1}`] = false; // consume key press
      player.mana -= sk.manaCost;
      player.attackCooldown = 0.5;
      SFX.skill();
      fireSkill(sk.id);
    }
  }

  // Attack
  if (mouseDown && player.attackCooldown <= 0) {
    player.attackCooldown = Math.max(0.15, 0.4 - player.stats.speed * 0.02);
    player.isAttacking = true;
    SFX.attack();
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
        // Boss is shielded while summoning (but not while tired)
        if (enemy.isBoss && enemy.state === 'special') continue;
        const edist = dist(p.pos, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
        if (edist < p.radius + 12) {
          const isCrit = Math.random() < 0.15;
          const tiredMultiplier = enemy.isTired ? 2.5 : 1;
          const dmg = Math.floor(p.damage * (isCrit ? 2 : 1) * tiredMultiplier);
          enemy.hp -= dmg;
          // Knockback scaling: bigger enemies resist more
          const kbScale = enemy.isBoss ? 0.005 : enemy.type === 'tank' ? 0.015 : enemy.type === 'miniboss' ? 0.02 : 0.05;
          enemy.knockback = { x: p.vel.x * kbScale, y: p.vel.y * kbScale };
          addDamageNumber(enemy.pos, dmg, p.element, isCrit);
          applyElementEffect(enemy, p.element);
          screenShake = isCrit ? 6 : 3;
          if (isCrit) SFX.critHit(); else SFX.hit();
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
        SFX.playerHurt();
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
    // Knockback decay — clamp to prevent wall-stuck
    enemy.knockback.x *= 0.9;
    enemy.knockback.y *= 0.9;
    const newEx = enemy.pos.x + enemy.knockback.x;
    const newEy = enemy.pos.y + enemy.knockback.y;
    if (!collidesWith(newEx, newEy)) {
      enemy.pos.x = newEx;
      enemy.pos.y = newEy;
    } else {
      // If knockback would push into wall, stop knockback entirely
      enemy.knockback.x = 0;
      enemy.knockback.y = 0;
    }
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
    SFX.roomCleared();
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

  // Boss special attacks — 4 phases + summon mechanic
  if (enemy.isBoss) {
    const hpPct = enemy.hp / enemy.maxHp;

    // Tired state — boss takes 2x damage and can't attack
    if (enemy.isTired) {
      enemy.tiredTimer = (enemy.tiredTimer || 0) - dt;
      if ((enemy.tiredTimer || 0) <= 0) {
        enemy.isTired = false;
        enemy.tiredTimer = 0;
      }
      // Boss just idles while tired — skip all attacks
      return;
    }

    // Summon cooldown
    enemy.summonCooldown = (enemy.summonCooldown || 0) - dt;

    // Summon phase: spawn minions at 60% and 30% HP, or periodically
    const shouldSummon = (
      (hpPct < 0.6 && enemy.phase < 3 && (enemy.summonCooldown || 0) <= 0) ||
      (hpPct < 0.3 && enemy.phase >= 3 && (enemy.summonCooldown || 0) <= 0)
    );

    if (shouldSummon) {
      enemy.summonCooldown = 15; // cooldown before next summon
      SFX.phaseTransition();
      screenShake = 10;
      
      // Spawn minions around the boss — ensure they land on floor tiles
      const minionCount = 3 + enemy.phase;
      for (let i = 0; i < minionCount; i++) {
        const angle = (i / minionCount) * Math.PI * 2;
        const spawnDist = 80 + Math.random() * 40;
        let mx = enemy.pos.x + Math.cos(angle) * spawnDist;
        let my = enemy.pos.y + Math.sin(angle) * spawnDist;
        // Clamp to valid floor tiles
        let tx = Math.floor(mx / TILE_SIZE);
        let ty = Math.floor(my / TILE_SIZE);
        tx = Math.max(2, Math.min(tx, room.width - 3));
        ty = Math.max(2, Math.min(ty, room.height - 3));
        // Find nearest floor tile if inside a wall
        if (room.tiles[ty]?.[tx] !== 0) {
          let found = false;
          for (let r = 1; r <= 4 && !found; r++) {
            for (let dy = -r; dy <= r && !found; dy++) {
              for (let dx = -r; dx <= r && !found; dx++) {
                const ny = ty + dy, nx = tx + dx;
                if (ny > 0 && ny < room.height - 1 && nx > 0 && nx < room.width - 1 && room.tiles[ny]?.[nx] === 0) {
                  tx = nx; ty = ny; found = true;
                }
              }
            }
          }
        }
        mx = tx * TILE_SIZE;
        my = ty * TILE_SIZE;
        const minionType: EnemyType = i % 3 === 0 ? 'ranged' : i % 3 === 1 ? 'assassin' : 'melee';
        const minion: Enemy = {
          id: `enemy_summon_${projIdCounter++}`,
          type: minionType,
          pos: { x: mx, y: my },
          hp: 25 + floor * 5,
          maxHp: 25 + floor * 5,
          speed: 2,
          damage: 8 + floor * 2,
          attackCooldown: minionType === 'ranged' ? 1.2 : 0.8,
          attackTimer: 0,
          element: enemy.element,
          isBoss: false,
          phase: 1,
          state: 'chase',
          stateTimer: 0,
          statusEffects: [],
          knockback: { x: 0, y: 0 },
        };
        room.enemies.push(minion);
        // Spawn particles
        for (let p = 0; p < 6; p++) {
          particles.push({
            x: mx + 12, y: my + 12,
            vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
            life: 0.4, maxLife: 0.4,
            color: ELEMENT_COLORS[enemy.element], size: 3,
          });
        }
      }

      // Make boss invulnerable while minions are alive — mark as summoning
      enemy.state = 'special';
    }

    // Check if summoned minions are all dead — boss gets tired
    if (enemy.state === 'special') {
      const summonsAlive = room.enemies.some(e => !e.isBoss && e.hp > 0);
      if (!summonsAlive) {
        enemy.state = 'chase';
        enemy.isTired = true;
        enemy.tiredTimer = 4; // 4 seconds of vulnerability
        screenShake = 8;
        SFX.phaseTransition();
        // Visual feedback — boss stunned particles
        for (let i = 0; i < 15; i++) {
          particles.push({
            x: enemy.pos.x + 12, y: enemy.pos.y - 10,
            vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 40,
            life: 0.6, maxLife: 0.6,
            color: '#FFD700', size: 3,
          });
        }
      }
      return; // Don't attack while summoning
    }
    
    // Phase 2 at 75%
    if (hpPct < 0.75 && enemy.phase === 1) {
      enemy.phase = 2;
      enemy.damage = Math.floor(enemy.damage * 1.2);
      enemy.speed *= 1.15;
      enemy.attackCooldown *= 0.85;
      screenShake = 8;
      SFX.phaseTransition();
      // Radial burst
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        projectiles.push({
          id: `proj_${projIdCounter++}`,
          pos: { x: enemy.pos.x + 12, y: enemy.pos.y + 12 },
          vel: { x: Math.cos(angle) * 150, y: Math.sin(angle) * 150 },
          damage: enemy.damage, element: enemy.element, fromPlayer: false, lifetime: 2, radius: 6,
        });
      }
    }
    
    // Phase 3 at 50% — unique elemental spell per boss
    if (hpPct < 0.5 && enemy.phase === 2) {
      enemy.phase = 3;
      enemy.damage = Math.floor(enemy.damage * 1.2);
      enemy.speed *= 1.15;
      screenShake = 12;
      SFX.phaseTransition();

      // Each boss uses a signature spell
      if (enemy.element === 'fire') {
        // Fire Rain — cascading projectiles from above
        for (let i = 0; i < 12; i++) {
          const rx = (2 + Math.random() * (room.width - 4)) * TILE_SIZE;
          setTimeout(() => {
            projectiles.push({
              id: `proj_${projIdCounter++}`,
              pos: { x: rx, y: 2 * TILE_SIZE },
              vel: { x: (Math.random() - 0.5) * 30, y: 200 },
              damage: enemy.damage * 1.3, element: 'fire', fromPlayer: false, lifetime: 3, radius: 8,
            });
            for (let p = 0; p < 4; p++) {
              particles.push({
                x: rx, y: 2 * TILE_SIZE,
                vx: (Math.random() - 0.5) * 60, vy: 30 + Math.random() * 40,
                life: 0.5, maxLife: 0.5, color: '#FF4500', size: 4,
              });
            }
          }, i * 150);
        }
      } else if (enemy.element === 'ice') {
        // Absolute Zero — expanding freeze rings from boss
        for (let ring = 0; ring < 3; ring++) {
          setTimeout(() => {
            const count = 12 + ring * 4;
            for (let a = 0; a < count; a++) {
              const angle = (a / count) * Math.PI * 2;
              const speed = 80 + ring * 40;
              projectiles.push({
                id: `proj_${projIdCounter++}`,
                pos: { x: enemy.pos.x + 12, y: enemy.pos.y + 12 },
                vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
                damage: enemy.damage * 0.8, element: 'ice', fromPlayer: false, lifetime: 3, radius: 6,
              });
            }
          }, ring * 400);
        }
      } else if (enemy.element === 'lightning') {
        // Thunderstorm — random lightning strikes across the room
        for (let i = 0; i < 15; i++) {
          const lx = (2 + Math.random() * (room.width - 4)) * TILE_SIZE;
          const ly = (2 + Math.random() * (room.height - 4)) * TILE_SIZE;
          setTimeout(() => {
            for (let p = 0; p < 6; p++) {
              particles.push({
                x: lx, y: ly,
                vx: (Math.random() - 0.5) * 80, vy: -60 - Math.random() * 80,
                life: 0.4, maxLife: 0.4, color: '#FACC15', size: 5,
              });
            }
            projectiles.push({
              id: `proj_${projIdCounter++}`,
              pos: { x: lx, y: ly },
              vel: { x: 0, y: 0 },
              damage: enemy.damage * 1.5, element: 'lightning', fromPlayer: false, lifetime: 0.5, radius: 20,
            });
            screenShake = 5;
          }, i * 200);
        }
      } else if (enemy.element === 'shadow') {
        // Void Collapse — pull player toward boss then explode
        const pullDuration = 2000;
        const enemyRef = enemy;
        const pullInterval = setInterval(() => {
          const dx = enemyRef.pos.x - player.pos.x;
          const dy = enemyRef.pos.y - player.pos.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d > 10) {
            player.pos.x += (dx / d) * 2;
            player.pos.y += (dy / d) * 2;
          }
          for (let p = 0; p < 3; p++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 80 + Math.random() * 60;
            particles.push({
              x: enemyRef.pos.x + Math.cos(angle) * r,
              y: enemyRef.pos.y + Math.sin(angle) * r,
              vx: -Math.cos(angle) * 100, vy: -Math.sin(angle) * 100,
              life: 0.4, maxLife: 0.4, color: '#A855F7', size: 3,
            });
          }
        }, 50);
        setTimeout(() => {
          clearInterval(pullInterval);
          for (let a = 0; a < 20; a++) {
            const angle = (a / 20) * Math.PI * 2;
            projectiles.push({
              id: `proj_${projIdCounter++}`,
              pos: { x: enemyRef.pos.x + 12, y: enemyRef.pos.y + 12 },
              vel: { x: Math.cos(angle) * 160, y: Math.sin(angle) * 160 },
              damage: enemyRef.damage * 1.4, element: 'shadow', fromPlayer: false, lifetime: 2, radius: 8,
            });
          }
          screenShake = 15;
        }, pullDuration);
      } else if (enemy.element === 'earth') {
        // Seismic Slam — ground spikes erupt in cross pattern
        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [ddx, ddy] of dirs) {
          for (let i = 1; i <= 6; i++) {
            setTimeout(() => {
              const sx = enemy.pos.x + 12 + ddx * i * TILE_SIZE * 0.7;
              const sy = enemy.pos.y + 12 + ddy * i * TILE_SIZE * 0.7;
              projectiles.push({
                id: `proj_${projIdCounter++}`, pos: { x: sx, y: sy },
                vel: { x: 0, y: 0 }, damage: enemy.damage * 1.2,
                element: 'earth', fromPlayer: false, lifetime: 0.6, radius: 18,
              });
              for (let p = 0; p < 4; p++) {
                particles.push({
                  x: sx, y: sy, vx: (Math.random()-0.5)*80, vy: -40-Math.random()*60,
                  life: 0.5, maxLife: 0.5, color: '#D97706', size: 4,
                });
              }
              screenShake = 4;
            }, i * 120);
          }
        }
      } else if (enemy.element === 'wind') {
        // Tornado Barrage — spinning projectile spiral
        for (let i = 0; i < 24; i++) {
          setTimeout(() => {
            const angle = (i / 24) * Math.PI * 6;
            projectiles.push({
              id: `proj_${projIdCounter++}`,
              pos: { x: enemy.pos.x + 12, y: enemy.pos.y + 12 },
              vel: { x: Math.cos(angle) * (100 + i * 5), y: Math.sin(angle) * (100 + i * 5) },
              damage: enemy.damage * 0.9, element: 'wind', fromPlayer: false, lifetime: 2, radius: 6,
            });
          }, i * 80);
        }
      } else if (enemy.element === 'nature') {
        // Vine Eruption — roots from multiple ground points
        for (let i = 0; i < 10; i++) {
          const rx = (2 + Math.random() * (room.width - 4)) * TILE_SIZE;
          const ry = (2 + Math.random() * (room.height - 4)) * TILE_SIZE;
          setTimeout(() => {
            // Mark hazard tiles
            const tx = Math.floor(rx / TILE_SIZE);
            const ty = Math.floor(ry / TILE_SIZE);
            if (tx > 0 && tx < room.width - 1 && ty > 0 && ty < room.height - 1) {
              room.tiles[ty][tx] = 2;
            }
            projectiles.push({
              id: `proj_${projIdCounter++}`, pos: { x: rx, y: ry },
              vel: { x: 0, y: 0 }, damage: enemy.damage * 1.1,
              element: 'nature', fromPlayer: false, lifetime: 0.8, radius: 22,
            });
            for (let p = 0; p < 6; p++) {
              particles.push({
                x: rx, y: ry, vx: (Math.random()-0.5)*60, vy: -50-Math.random()*40,
                life: 0.6, maxLife: 0.6, color: '#22C55E', size: 4,
              });
            }
          }, i * 200);
        }
      } else if (enemy.element === 'void') {
        // Reality Collapse — everything distorts, random teleport attacks
        for (let i = 0; i < 20; i++) {
          setTimeout(() => {
            const rx = (1 + Math.random() * (room.width - 2)) * TILE_SIZE;
            const ry = (1 + Math.random() * (room.height - 2)) * TILE_SIZE;
            projectiles.push({
              id: `proj_${projIdCounter++}`, pos: { x: rx, y: ry },
              vel: { x: (Math.random()-0.5)*100, y: (Math.random()-0.5)*100 },
              damage: enemy.damage * 1.5, element: 'void', fromPlayer: false, lifetime: 1.2, radius: 12,
            });
            for (let p = 0; p < 5; p++) {
              particles.push({
                x: rx, y: ry, vx: (Math.random()-0.5)*120, vy: (Math.random()-0.5)*120,
                life: 0.5, maxLife: 0.5, color: '#EC4899', size: 5,
              });
            }
            screenShake = 6;
          }, i * 150);
        }
      }

      // Expand arena hazards
      for (let y = 1; y < room.height - 1; y++) {
        for (let x = 1; x < room.width - 1; x++) {
          if (room.tiles[y][x] === 2) {
            if (x + 1 < room.width - 1 && room.tiles[y][x + 1] === 0 && Math.random() < 0.4) room.tiles[y][x + 1] = 2;
            if (y + 1 < room.height - 1 && room.tiles[y + 1][x] === 0 && Math.random() < 0.4) room.tiles[y + 1][x] = 2;
          }
        }
      }
    }
    
    // Phase 4 (Enrage) at 25%
    if (hpPct < 0.25 && enemy.phase === 3) {
      enemy.phase = 4;
      enemy.damage = Math.floor(enemy.damage * 1.3);
      enemy.speed *= 1.3;
      enemy.attackCooldown *= 0.6;
      screenShake = 15;
      SFX.phaseTransition();
      // Massive burst
      for (let a = 0; a < 24; a++) {
        const angle = (a / 24) * Math.PI * 2;
        projectiles.push({
          id: `proj_${projIdCounter++}`,
          pos: { x: enemy.pos.x + 12, y: enemy.pos.y + 12 },
          vel: { x: Math.cos(angle) * 180, y: Math.sin(angle) * 180 },
          damage: enemy.damage * 1.2, element: enemy.element, fromPlayer: false, lifetime: 2, radius: 8,
        });
      }
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: enemy.pos.x + 12, y: enemy.pos.y + 12,
          vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300,
          life: 0.7, maxLife: 0.7,
          color: ELEMENT_COLORS[enemy.element], size: 5,
        });
      }
    }

    // Boss periodic attacks based on phase
    if (enemy.stateTimer <= 0) {
      enemy.stateTimer = Math.max(0.8, 2.5 - enemy.phase * 0.4);
      // Spiral attack in higher phases
      if (enemy.phase >= 2) {
        const spiralCount = enemy.phase + 2;
        for (let a = 0; a < spiralCount; a++) {
          const angle = (a / spiralCount) * Math.PI * 2 + gameTime * 2;
          projectiles.push({
            id: `proj_${projIdCounter++}`,
            pos: { x: enemy.pos.x + 16, y: enemy.pos.y + 16 },
            vel: { x: Math.cos(angle) * 130, y: Math.sin(angle) * 130 },
            damage: enemy.damage * 0.6, element: enemy.element, fromPlayer: false, lifetime: 2, radius: 5,
          });
        }
      }
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
    case 'earth':
      // Roots — apply slow
      if (!enemy.statusEffects.some(e => e.type === 'slow')) {
        enemy.statusEffects.push({ type: 'slow', duration: 3, damage: 0 });
      }
      break;
    case 'wind':
      // Extra knockback
      enemy.knockback.x *= 3;
      enemy.knockback.y *= 3;
      break;
    case 'nature':
      // Poison DoT
      if (!enemy.statusEffects.some(e => e.type === 'burn')) {
        enemy.statusEffects.push({ type: 'burn', duration: 4, damage: 3 });
      }
      break;
    case 'void':
      // Massive damage bonus, no other effect
      break;
  }
}

function onEnemyKill(enemy: Enemy) {
  const xpGain = enemy.isBoss ? 200 : enemy.type === 'miniboss' ? 40 : 15 + floor * 2;
  player.xp += xpGain;
  
  if (enemy.isBoss) {
    SFX.bossDefeat();
    stopBossMusic();
    startAmbientMusic(player.element);
  } else {
    SFX.enemyDeath();
  }
  
  // Death particles
  const particleCount = enemy.isBoss ? 30 : 12;
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: enemy.pos.x + 12, y: enemy.pos.y + 12,
      vx: (Math.random() - 0.5) * (enemy.isBoss ? 300 : 150),
      vy: (Math.random() - 0.5) * (enemy.isBoss ? 300 : 150),
      life: enemy.isBoss ? 1 : 0.5, maxLife: enemy.isBoss ? 1 : 0.5,
      color: ELEMENT_COLORS[enemy.element],
      size: 3 + Math.random() * (enemy.isBoss ? 6 : 3),
    });
  }

  // Level up check
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(player.xpToNext * (player.level >= 10 ? 1.05 : 1.2));
    player.statPoints += 3;
    player.hp = player.maxHp;
    player.mana = player.maxMana;
    screenShake = 8;
    SFX.levelUp();
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
    const BOSS_LORE_MAP: Record<string, string> = {
      fire: 'guardian_ignis', ice: 'guardian_glacius', lightning: 'guardian_voltaris', shadow: 'guardian_umbra',
      earth: 'guardian_terrath', wind: 'guardian_zephyros', nature: 'guardian_sylvara', void: 'guardian_nullex',
    };
    const loreId = BOSS_LORE_MAP[enemy.element];
    if (loreId) onLoreFound?.(loreId);
    // Also unlock the fall/extra lore
    const extraLore: Record<string, string> = {
      fire: 'guardian_ignis_fall',
      ice: 'guardian_glacius_archive',
      lightning: 'guardian_voltaris_warning',
      shadow: 'guardian_umbra_sacrifice',
      earth: 'guardian_terrath_legacy',
      wind: 'guardian_zephyros_song',
      nature: 'guardian_sylvara_grief',
      void: 'guardian_nullex_origin',
    };
    if (extraLore[enemy.element]) onLoreFound?.(extraLore[enemy.element]);
    
    // Unlock the boss's element
    if (!player.unlockedElements.includes(enemy.element)) {
      player.unlockedElements.push(enemy.element);
      SFX.elementUnlock();
      onStateChange?.();
    }
    // Unlock next zone
    const zoneOrder: ElementType[] = ['fire', 'ice', 'lightning', 'shadow', 'earth', 'wind', 'nature', 'void'];
    const nextIdx = zoneOrder.indexOf(enemy.element) + 1;
    if (nextIdx < zoneOrder.length && !player.unlockedElements.includes(zoneOrder[nextIdx])) {
      player.unlockedElements.push(zoneOrder[nextIdx]);
      onStateChange?.();
    }
    // Trigger post-boss cutscene
    onBossDefeated?.(enemy.element);
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

// ─── Camera mode ───
export type CameraMode = '2d' | 'isometric' | '3d';
let cameraMode: CameraMode = '2d';
export function setCameraMode(mode: CameraMode) { cameraMode = mode; }
export function getCameraMode(): CameraMode { return cameraMode; }
export function getGameTime(): number { return gameTime; }

// ─── Render ───
export function render(ctx: CanvasRenderingContext2D) {
  if (!player || !room) return;
  
  ctx.save();
  
  // Screen shake
  const shakeX = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;
  const shakeY = screenShake > 0 ? (Math.random() - 0.5) * screenShake : 0;

  const isIso = cameraMode === 'isometric';

  if (isIso) {
    ctx.translate(CANVAS_WIDTH / 2 + shakeX, CANVAS_HEIGHT * 0.15 + shakeY);
    ctx.scale(1, 0.6);
    ctx.translate(-camera.x - CANVAS_WIDTH / 2, -camera.y - CANVAS_HEIGHT / 2);
  } else {
    ctx.translate(-camera.x + shakeX, -camera.y + shakeY);
  }

  // Enhanced Tiles
  for (let y = 0; y < room.height; y++) {
    for (let x = 0; x < room.width; x++) {
      const sx = x * TILE_SIZE - camera.x;
      const sy = y * TILE_SIZE - camera.y;
      if (sx > -TILE_SIZE && sx < CANVAS_WIDTH + TILE_SIZE && sy > -TILE_SIZE && sy < CANVAS_HEIGHT + TILE_SIZE) {
        drawTile(ctx, room.tiles[y][x], room.zone, x, y, gameTime, isIso);
      }
    }
  }

  // Exit indicator
  if (room.cleared) {
    for (const exit of room.exits) {
      // Glowing exit portal
      const pulse = 0.5 + Math.sin(gameTime * 4) * 0.3;
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 15 + Math.sin(gameTime * 3) * 5;
      ctx.fillStyle = `rgba(74, 222, 128, ${pulse})`;
      ctx.fillRect(exit.x * TILE_SIZE + 4, exit.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.shadowBlur = 0;
      // Arrow
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px Rajdhani';
      ctx.textAlign = 'center';
      ctx.fillText('▲ EXIT', exit.x * TILE_SIZE + TILE_SIZE / 2, exit.y * TILE_SIZE + TILE_SIZE / 2 + 4);
    }
  }

  // Enemies (using sprite system)
  for (const enemy of room.enemies) {
    if (enemy.hp <= 0) continue;
    drawEnemy(ctx, enemy, gameTime);
  }

  // Projectiles (enhanced with glow trails)
  for (const proj of projectiles) {
    const color = ELEMENT_COLORS[proj.element];
    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(proj.pos.x, proj.pos.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    // Inner bright core
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(proj.pos.x, proj.pos.y, proj.radius * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Player (using sprite system)
  if (player.hp > 0) {
    drawPlayer(ctx, player, gameTime);
  }

  // Particles (enhanced rendering)
  for (const p of particles) {
    const lifeRatio = p.life / p.maxLife;
    ctx.globalAlpha = lifeRatio;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (0.5 + lifeRatio * 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Damage numbers (enhanced with outlines)
  for (const dmg of damageNumbers) {
    ctx.globalAlpha = dmg.lifetime;
    const fontSize = dmg.isCrit ? 20 : 14;
    ctx.font = `${dmg.isCrit ? 'bold ' : ''}${fontSize}px Rajdhani`;
    ctx.textAlign = 'center';
    // Shadow/outline
    ctx.fillStyle = '#000';
    ctx.fillText(dmg.value.toString(), dmg.pos.x + 1, dmg.pos.y + 1);
    ctx.fillText(dmg.value.toString(), dmg.pos.x - 1, dmg.pos.y - 1);
    // Colored text
    ctx.fillStyle = dmg.isCrit ? '#FFD700' : ELEMENT_COLORS[dmg.element];
    const text = (dmg.isCrit ? 'CRIT! ' : '') + dmg.value.toString();
    ctx.fillText(text, dmg.pos.x, dmg.pos.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // Post-processing effects (rendered in screen space)
  ctx.save();
  renderAmbient(ctx, room.zone, camera, gameTime);
  renderIceFrost(ctx, room.zone, player.hp, player.maxHp);
  renderHeatDistortion(ctx, room.zone, gameTime);
  
  // Dynamic torch lighting
  renderDynamicLighting(ctx, torchCache, player.pos.x + 12, player.pos.y + 12, ELEMENT_COLORS[player.element], camera.x, camera.y, gameTime);
  
  // Boss intro zoom overlay
  renderBossZoomOverlay(ctx);
  
  // Death overlay
  if (player.hp <= 0) {
    renderDeathOverlay(ctx, gameTime);
  }
  
  // Screen transition
  renderTransition(ctx);
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

export function switchElement(element: ElementType) {
  if (!player.unlockedElements.includes(element)) return;
  player.element = element;
  floor = 1;
  bossDialogueShown = false;
  loadRoom(element, floor);
  onStateChange?.();
}

export function unlockSkill(skillId: string) {
  if (!player.skills.includes(skillId)) {
    player.skills.push(skillId);
    onStateChange?.();
  }
}

export function getActiveSkills() {
  if (!player) return [];
  const allSkills = SKILLS[player.element] || [];
  return allSkills.filter(s => player.skills.includes(s.id));
}

function fireSkill(skillId: string) {
  const px = player.pos.x + 12;
  const py = player.pos.y + 12;
  const fx = player.facing.x;
  const fy = player.facing.y;
  const baseDmg = player.stats.attack + player.stats.elementalPower;

  switch (skillId) {
    case 'flame_wave': {
      for (let i = -2; i <= 2; i++) {
        const angle = Math.atan2(fy, fx) + i * 0.25;
        projectiles.push({
          id: `proj_${projIdCounter++}`,
          pos: { x: px, y: py },
          vel: { x: Math.cos(angle) * 250, y: Math.sin(angle) * 250 },
          damage: baseDmg * 0.8,
          element: 'fire', fromPlayer: true, lifetime: 0.6, radius: 8,
        });
      }
      break;
    }
    case 'meteor_drop': {
      const tx = mousePos.x + camera.x;
      const ty = mousePos.y + camera.y;
      // Delayed impact — spawn projectiles in a ring at target
      setTimeout(() => {
        for (let a = 0; a < 8; a++) {
          const angle = (a / 8) * Math.PI * 2;
          projectiles.push({
            id: `proj_${projIdCounter++}`,
            pos: { x: tx, y: ty },
            vel: { x: Math.cos(angle) * 80, y: Math.sin(angle) * 80 },
            damage: baseDmg * 1.5,
            element: 'fire', fromPlayer: true, lifetime: 0.4, radius: 10,
          });
        }
        screenShake = 10;
        for (let i = 0; i < 15; i++) {
          particles.push({
            x: tx, y: ty,
            vx: (Math.random() - 0.5) * 200, vy: (Math.random() - 0.5) * 200,
            life: 0.5, maxLife: 0.5, color: '#ff6622', size: 4 + Math.random() * 4,
          });
        }
      }, 300);
      break;
    }
    case 'frost_wall': {
      // Create a line of slow projectiles perpendicular to facing
      const perp = { x: -fy, y: fx };
      for (let i = -3; i <= 3; i++) {
        projectiles.push({
          id: `proj_${projIdCounter++}`,
          pos: { x: px + perp.x * i * 20 + fx * 60, y: py + perp.y * i * 20 + fy * 60 },
          vel: { x: 0, y: 0 },
          damage: baseDmg * 0.3,
          element: 'ice', fromPlayer: true, lifetime: 2.5, radius: 10,
        });
      }
      break;
    }
    case 'absolute_zero': {
      // AoE freeze around player
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist({ x: px, y: py }, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
        if (d < 150) {
          enemy.hp -= baseDmg * 0.6;
          applyElementEffect(enemy, 'ice');
          applyElementEffect(enemy, 'ice');
          addDamageNumber(enemy.pos, Math.floor(baseDmg * 0.6), 'ice', false);
          if (enemy.hp <= 0) onEnemyKill(enemy);
        }
      }
      screenShake = 6;
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        particles.push({
          x: px, y: py,
          vx: Math.cos(angle) * 120, vy: Math.sin(angle) * 120,
          life: 0.5, maxLife: 0.5, color: '#38BDF8', size: 4,
        });
      }
      break;
    }
    case 'thunder_dash': {
      // Dash forward damaging enemies in path
      const dashDist = 120;
      player.pos.x += fx * dashDist;
      player.pos.y += fy * dashDist;
      player.invincible = 0.3;
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist(player.pos, enemy.pos);
        if (d < 80) {
          enemy.hp -= baseDmg;
          addDamageNumber(enemy.pos, Math.floor(baseDmg), 'lightning', false);
          applyElementEffect(enemy, 'lightning');
          if (enemy.hp <= 0) onEnemyKill(enemy);
        }
      }
      screenShake = 5;
      break;
    }
    case 'storm_field': {
      const tx = mousePos.x + camera.x;
      const ty = mousePos.y + camera.y;
      // Create lightning strikes over time
      for (let t = 0; t < 5; t++) {
        setTimeout(() => {
          const sx = tx + (Math.random() - 0.5) * 100;
          const sy = ty + (Math.random() - 0.5) * 100;
          projectiles.push({
            id: `proj_${projIdCounter++}`,
            pos: { x: sx, y: sy },
            vel: { x: 0, y: 0 },
            damage: baseDmg * 0.7,
            element: 'lightning', fromPlayer: true, lifetime: 0.3, radius: 14,
          });
          screenShake = 3;
        }, t * 200);
      }
      break;
    }
    case 'shadow_clone': {
      // Spawn a clone that fires at enemies
      const cloneX = px + (Math.random() - 0.5) * 60;
      const cloneY = py + (Math.random() - 0.5) * 60;
      for (let t = 0; t < 6; t++) {
        setTimeout(() => {
          // Find nearest enemy
          let nearest: Enemy | null = null;
          let nd = Infinity;
          for (const e of room.enemies) {
            if (e.hp <= 0) continue;
            const d = dist({ x: cloneX, y: cloneY }, e.pos);
            if (d < nd) { nd = d; nearest = e; }
          }
          if (nearest) {
            const dx = nearest.pos.x - cloneX;
            const dy = nearest.pos.y - cloneY;
            const dl = Math.sqrt(dx * dx + dy * dy);
            projectiles.push({
              id: `proj_${projIdCounter++}`,
              pos: { x: cloneX, y: cloneY },
              vel: { x: (dx / dl) * 250, y: (dy / dl) * 250 },
              damage: baseDmg * 0.5,
              element: 'shadow', fromPlayer: true, lifetime: 0.8, radius: 5,
            });
          }
        }, t * 300);
      }
      break;
    }
    case 'void_rift': {
      const tx = mousePos.x + camera.x;
      const ty = mousePos.y + camera.y;
      // Pull enemies toward point and damage
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist({ x: tx, y: ty }, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
        if (d < 160) {
          const pull = 80 / Math.max(d, 30);
          enemy.knockback.x += (tx - enemy.pos.x) * pull * 0.1;
          enemy.knockback.y += (ty - enemy.pos.y) * pull * 0.1;
          enemy.hp -= baseDmg * 0.4;
          addDamageNumber(enemy.pos, Math.floor(baseDmg * 0.4), 'shadow', false);
          applyElementEffect(enemy, 'shadow');
          if (enemy.hp <= 0) onEnemyKill(enemy);
        }
      }
      screenShake = 6;
      for (let i = 0; i < 15; i++) {
        particles.push({
          x: tx + (Math.random() - 0.5) * 80, y: ty + (Math.random() - 0.5) * 80,
          vx: (tx - (tx + (Math.random() - 0.5) * 80)) * 2,
          vy: (ty - (ty + (Math.random() - 0.5) * 80)) * 2,
          life: 0.6, maxLife: 0.6, color: '#A855F7', size: 3,
        });
      }
      break;
    }
    case 'fire_shield': {
      // Ring of fire projectiles orbiting player
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const ox = Math.cos(angle) * 50;
        const oy = Math.sin(angle) * 50;
        projectiles.push({
          id: `proj_${projIdCounter++}`,
          pos: { x: px + ox, y: py + oy },
          vel: { x: Math.cos(angle + Math.PI / 2) * 60, y: Math.sin(angle + Math.PI / 2) * 60 },
          damage: baseDmg * 0.4,
          element: 'fire', fromPlayer: true, lifetime: 2.0, radius: 8,
        });
      }
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.push({
          x: px + Math.cos(angle) * 50, y: py + Math.sin(angle) * 50,
          vx: Math.cos(angle) * 30, vy: Math.sin(angle) * 30,
          life: 1.0, maxLife: 1.0, color: '#F97316', size: 3,
        });
      }
      break;
    }
    case 'inferno_blast': {
      // Massive AoE explosion
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist({ x: px, y: py }, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
        if (d < 200) {
          const dmg = baseDmg * 2.0 * (1 - d / 200);
          enemy.hp -= dmg;
          applyElementEffect(enemy, 'fire');
          applyElementEffect(enemy, 'fire');
          addDamageNumber(enemy.pos, Math.floor(dmg), 'fire', dmg > baseDmg * 1.5);
          enemy.knockback.x += (enemy.pos.x - px) * 0.3;
          enemy.knockback.y += (enemy.pos.y - py) * 0.3;
          if (enemy.hp <= 0) onEnemyKill(enemy);
        }
      }
      screenShake = 15;
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 200;
        particles.push({
          x: px, y: py,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 0.8, maxLife: 0.8, color: i % 2 === 0 ? '#F97316' : '#ff4400', size: 3 + Math.random() * 5,
        });
      }
      break;
    }
    case 'blizzard': {
      // Spawn projectiles over time in an area around cursor
      const tx = mousePos.x + camera.x;
      const ty = mousePos.y + camera.y;
      for (let t = 0; t < 8; t++) {
        setTimeout(() => {
          const sx = tx + (Math.random() - 0.5) * 140;
          const sy = ty + (Math.random() - 0.5) * 140;
          projectiles.push({
            id: `proj_${projIdCounter++}`,
            pos: { x: sx, y: sy - 40 },
            vel: { x: (Math.random() - 0.5) * 40, y: 60 + Math.random() * 40 },
            damage: baseDmg * 0.5,
            element: 'ice', fromPlayer: true, lifetime: 0.8, radius: 8,
          });
          particles.push({
            x: sx, y: sy,
            vx: (Math.random() - 0.5) * 60, vy: -20 - Math.random() * 30,
            life: 0.6, maxLife: 0.6, color: '#38BDF8', size: 2 + Math.random() * 3,
          });
        }, t * 150);
      }
      break;
    }
    case 'glacial_spike': {
      // Fast piercing projectile that shatters
      const angle = Math.atan2(fy, fx);
      projectiles.push({
        id: `proj_${projIdCounter++}`,
        pos: { x: px, y: py },
        vel: { x: Math.cos(angle) * 400, y: Math.sin(angle) * 400 },
        damage: baseDmg * 2.0,
        element: 'ice', fromPlayer: true, lifetime: 0.8, radius: 6,
      });
      // Shatter fragments after delay
      setTimeout(() => {
        const sx = px + Math.cos(angle) * 300;
        const sy = py + Math.sin(angle) * 300;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          projectiles.push({
            id: `proj_${projIdCounter++}`,
            pos: { x: sx, y: sy },
            vel: { x: Math.cos(a) * 150, y: Math.sin(a) * 150 },
            damage: baseDmg * 0.6,
            element: 'ice', fromPlayer: true, lifetime: 0.4, radius: 5,
          });
        }
        screenShake = 4;
      }, 500);
      break;
    }
    case 'ball_lightning': {
      // Slow-moving orb that zaps nearby enemies
      const angle = Math.atan2(fy, fx);
      const orbX = px;
      const orbY = py;
      for (let t = 0; t < 10; t++) {
        setTimeout(() => {
          const cx = orbX + Math.cos(angle) * (t * 25 + 30);
          const cy = orbY + Math.sin(angle) * (t * 25 + 30);
          // Zap nearby enemies
          for (const enemy of room.enemies) {
            if (enemy.hp <= 0) continue;
            const d = dist({ x: cx, y: cy }, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
            if (d < 80) {
              enemy.hp -= baseDmg * 0.3;
              addDamageNumber(enemy.pos, Math.floor(baseDmg * 0.3), 'lightning', false);
              applyElementEffect(enemy, 'lightning');
              if (enemy.hp <= 0) onEnemyKill(enemy);
            }
          }
          particles.push({
            x: cx, y: cy,
            vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60,
            life: 0.3, maxLife: 0.3, color: '#EAB308', size: 6,
          });
        }, t * 200);
      }
      break;
    }
    case 'thunderstorm': {
      // Random lightning bolts across the room
      for (let t = 0; t < 10; t++) {
        setTimeout(() => {
          const sx = px + (Math.random() - 0.5) * 400;
          const sy = py + (Math.random() - 0.5) * 400;
          projectiles.push({
            id: `proj_${projIdCounter++}`,
            pos: { x: sx, y: sy },
            vel: { x: 0, y: 0 },
            damage: baseDmg * 0.9,
            element: 'lightning', fromPlayer: true, lifetime: 0.2, radius: 16,
          });
          screenShake = 4;
          for (let i = 0; i < 5; i++) {
            particles.push({
              x: sx, y: sy,
              vx: (Math.random() - 0.5) * 150, vy: -100 - Math.random() * 100,
              life: 0.3, maxLife: 0.3, color: '#EAB308', size: 2 + Math.random() * 3,
            });
          }
        }, t * 150);
      }
      break;
    }
    case 'shadow_step': {
      // Teleport to cursor, damage at both locations
      const tx = mousePos.x + camera.x;
      const ty = mousePos.y + camera.y;
      // Damage at origin
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist({ x: px, y: py }, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
        if (d < 80) {
          enemy.hp -= baseDmg * 0.6;
          addDamageNumber(enemy.pos, Math.floor(baseDmg * 0.6), 'shadow', false);
          applyElementEffect(enemy, 'shadow');
          if (enemy.hp <= 0) onEnemyKill(enemy);
        }
      }
      // Teleport
      player.pos.x = tx - 12;
      player.pos.y = ty - 12;
      player.invincible = 0.5;
      // Damage at destination
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist({ x: tx, y: ty }, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
        if (d < 80) {
          enemy.hp -= baseDmg * 0.6;
          addDamageNumber(enemy.pos, Math.floor(baseDmg * 0.6), 'shadow', false);
          applyElementEffect(enemy, 'shadow');
          if (enemy.hp <= 0) onEnemyKill(enemy);
        }
      }
      screenShake = 5;
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: px, y: py,
          vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
          life: 0.4, maxLife: 0.4, color: '#A855F7', size: 3,
        });
        particles.push({
          x: tx, y: ty,
          vx: (Math.random() - 0.5) * 100, vy: (Math.random() - 0.5) * 100,
          life: 0.4, maxLife: 0.4, color: '#A855F7', size: 3,
        });
      }
      break;
    }
    case 'soul_drain': {
      // Drain life from all nearby enemies
      let totalDrain = 0;
      for (const enemy of room.enemies) {
        if (enemy.hp <= 0) continue;
        const d = dist({ x: px, y: py }, { x: enemy.pos.x + 12, y: enemy.pos.y + 12 });
        if (d < 140) {
          const dmg = baseDmg * 0.7;
          enemy.hp -= dmg;
          totalDrain += dmg * 0.4;
          addDamageNumber(enemy.pos, Math.floor(dmg), 'shadow', false);
          applyElementEffect(enemy, 'shadow');
          if (enemy.hp <= 0) onEnemyKill(enemy);
          // Drain particles from enemy to player
          for (let i = 0; i < 3; i++) {
            particles.push({
              x: enemy.pos.x + 12, y: enemy.pos.y + 12,
              vx: (px - enemy.pos.x) * 2, vy: (py - enemy.pos.y) * 2,
              life: 0.4, maxLife: 0.4, color: '#22c55e', size: 3,
            });
          }
        }
      }
      // Heal player
      player.hp = Math.min(player.maxHp, player.hp + totalDrain);
      if (totalDrain > 0) {
        addDamageNumber(player.pos, Math.floor(totalDrain), 'shadow', true);
      }
      break;
    }
  }
}
