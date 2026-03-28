import { GameRoom, Enemy, ElementType, EnemyType, Position, TILE_SIZE } from './types';

// Malachar boss arena generator — enormous arena for the final fight
export function generateMalacharArena(): GameRoom {
  const width = 30;
  const height = 26;
  const tiles: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        tiles[y][x] = 1;
      } else {
        tiles[y][x] = 0;
      }
    }
  }
  
  // Elemental hazard ring around arena
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  for (let a = 0; a < 24; a++) {
    const angle = (a / 24) * Math.PI * 2;
    const r = 9;
    const hx = cx + Math.round(Math.cos(angle) * r);
    const hy = cy + Math.round(Math.sin(angle) * r);
    if (hx > 0 && hx < width - 1 && hy > 0 && hy < height - 1) {
      tiles[hy][hx] = 2;
    }
  }
  
  // Pillar obstacles for cover
  const pillars = [[5,5],[width-6,5],[5,height-6],[width-6,height-6],[cx-5,cy],[cx+5,cy]];
  for (const [px,py] of pillars) {
    if (px > 0 && px < width-1 && py > 0 && py < height-1) {
      tiles[py][px] = 1;
    }
  }
  
  // Corner hazard pools
  for (const [ox, oy] of [[3,3],[width-5,3],[3,height-5],[width-5,height-5]]) {
    for (let dy = 0; dy < 3; dy++) {
      for (let dx = 0; dx < 3; dx++) {
        if (oy + dy > 0 && oy + dy < height - 1 && ox + dx > 0 && ox + dx < width - 1) {
          tiles[oy + dy][ox + dx] = 2;
        }
      }
    }
  }
  
  // Malachar boss — MUCH harder: 15000 HP, high damage, fast
  const boss: Enemy = {
    id: 'malachar_boss',
    type: 'boss',
    pos: { x: cx * TILE_SIZE, y: 4 * TILE_SIZE },
    hp: 15000,
    maxHp: 15000,
    speed: 2.5,
    damage: 80,
    attackCooldown: 0.4,
    attackTimer: 0,
    element: 'void' as ElementType,
    isBoss: true,
    phase: 1,
    state: 'idle',
    stateTimer: 0,
    statusEffects: [],
    knockback: { x: 0, y: 0 },
    isTired: false,
    tiredTimer: 0,
    summonCooldown: 0,
  };
  (boss as any).isMalachar = true;
  
  return { tiles, enemies: [boss], width, height, exits: [], cleared: false, zone: 'void' as ElementType };
}

let enemyIdCounter = 0;

function createEnemy(type: EnemyType, pos: Position, element: ElementType, isBoss = false): Enemy {
  const baseStats: Record<EnemyType, { hp: number; speed: number; damage: number }> = {
    melee: { hp: 30, speed: 1.5, damage: 8 },
    ranged: { hp: 20, speed: 1, damage: 12 },
    assassin: { hp: 15, speed: 3, damage: 15 },
    tank: { hp: 80, speed: 0.7, damage: 5 },
    miniboss: { hp: 150, speed: 1.2, damage: 18 },
    boss: { hp: 1200, speed: 1.3, damage: 35 },
  };

  const stats = baseStats[type];
  return {
    id: `enemy_${enemyIdCounter++}`,
    type,
    pos: { ...pos },
    hp: stats.hp,
    maxHp: stats.hp,
    speed: stats.speed,
    damage: stats.damage,
    attackCooldown: type === 'assassin' ? 0.5 : type === 'ranged' ? 1.5 : 1,
    attackTimer: 0,
    element,
    isBoss,
    phase: 1,
    state: 'idle',
    stateTimer: 0,
    statusEffects: [],
    knockback: { x: 0, y: 0 },
    isTired: false,
    tiredTimer: 0,
    summonCooldown: 0,
  };
}

// Floor labeling helper
export function getFloorLabel(floor: number): string {
  const section = Math.ceil(floor / 5);
  const sub = ((floor - 1) % 5) + 1;
  const letter = String.fromCharCode(64 + sub); // A, B, C, D, E
  return `${section}-${letter}`;
}

export function generateRoom(zone: ElementType, floor: number, isBossRoom: boolean): GameRoom {
  const width = isBossRoom ? 22 : 14 + Math.floor(Math.random() * 6);
  const height = isBossRoom ? 18 : 12 + Math.floor(Math.random() * 4);
  
  // Generate tiles: 0 = floor, 1 = wall, 2 = hazard
  const tiles: number[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        tiles[y][x] = 1; // walls
      } else if (!isBossRoom && Math.random() < 0.05) {
        tiles[y][x] = 2; // hazard
      } else if (!isBossRoom && Math.random() < 0.08 && x > 2 && y > 2 && x < width - 3 && y < height - 3) {
        tiles[y][x] = 1; // interior walls
      } else {
        tiles[y][x] = 0;
      }
    }
  }

  // Ensure center is clear for spawning
  const cx = Math.floor(width / 2);
  const cy = Math.floor(height / 2);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (cy + dy > 0 && cy + dy < height - 1 && cx + dx > 0 && cx + dx < width - 1) {
        tiles[cy + dy][cx + dx] = 0;
      }
    }
  }

  // Generate enemies
  const enemies: Enemy[] = [];
  if (isBossRoom) {
    const boss = createEnemy('boss', { x: cx * TILE_SIZE, y: 3 * TILE_SIZE }, zone, true);
    boss.hp = Math.floor(boss.hp * (1 + floor * 0.12));
    boss.maxHp = boss.hp;
    boss.damage = Math.floor(boss.damage * (1 + floor * 0.08));
    boss.speed *= 1.1;
    enemies.push(boss);
    // Add lava/hazard pools in boss arena
    const hazardPositions = [
      [3, 3], [width - 4, 3], [3, height - 4], [width - 4, height - 4],
      [cx - 3, cy], [cx + 3, cy], [cx, cy - 3], [cx, cy + 3],
    ];
    for (const [hx, hy] of hazardPositions) {
      if (hx > 0 && hx < width - 1 && hy > 0 && hy < height - 1) {
        tiles[hy][hx] = 2;
        if (hx + 1 < width - 1) tiles[hy][hx + 1] = 2;
        if (hy + 1 < height - 1) tiles[hy + 1][hx] = 2;
      }
    }
  } else {
    // Gentler start: fewer enemies on early floors
    const enemyCount = floor <= 2 ? 2 + Math.floor(floor * 0.5) : 3 + Math.floor(floor * 0.8);
    // Early floors only have basic melee enemies
    const types: EnemyType[] = floor <= 1 ? ['melee'] : floor <= 3 ? ['melee', 'melee', 'ranged'] : ['melee', 'melee', 'ranged', 'assassin', 'tank'];
    
    for (let i = 0; i < enemyCount; i++) {
      let ex, ey;
      do {
        ex = 2 + Math.floor(Math.random() * (width - 4));
        ey = 2 + Math.floor(Math.random() * (height - 4));
      } while (tiles[ey][ex] !== 0 || (Math.abs(ex - cx) < 3 && Math.abs(ey - cy) < 3));
      
      const type = types[Math.floor(Math.random() * types.length)];
      const scaledEnemy = createEnemy(type, { x: ex * TILE_SIZE, y: ey * TILE_SIZE }, zone);
      // Scale with floor — gentle at start
      const hpScale = floor <= 2 ? 1 + floor * 0.05 : 1 + floor * 0.15;
      const dmgScale = floor <= 2 ? 1 : 1 + floor * 0.1;
      scaledEnemy.hp = Math.floor(scaledEnemy.hp * hpScale);
      scaledEnemy.maxHp = scaledEnemy.hp;
      scaledEnemy.damage = Math.floor(scaledEnemy.damage * dmgScale);
      enemies.push(scaledEnemy);
    }

    // Add miniboss every 3 floors
    if (floor % 3 === 0 && floor > 0) {
      enemies.push(createEnemy('miniboss', { x: (cx + 3) * TILE_SIZE, y: cy * TILE_SIZE }, zone));
    }
  }

  // Exits
  const exits: Position[] = [];
  if (!isBossRoom) {
    // Top exit
    tiles[0][cx] = 0;
    exits.push({ x: cx, y: 0 });
  }

  return { tiles, enemies, width, height, exits, cleared: false, zone };
}

export function getTileColor(tile: number, zone: ElementType): string {
  const floorColors: Record<ElementType, string> = {
    fire: '#1a0a04',
    ice: '#040a1a',
    lightning: '#0f0d04',
    shadow: '#0a041a',
    earth: '#1a1004',
    wind: '#041a10',
    nature: '#041a04',
    void: '#1a0410',
  };
  const wallColors: Record<ElementType, string> = {
    fire: '#3d1a0a',
    ice: '#0a1a3d',
    lightning: '#2d2a0a',
    shadow: '#1a0a3d',
    earth: '#3d2a0a',
    wind: '#0a3d20',
    nature: '#0a3d0a',
    void: '#3d0a20',
  };
  const hazardColors: Record<ElementType, string> = {
    fire: '#ff4400',
    ice: '#00aaff',
    lightning: '#ffcc00',
    shadow: '#9900ff',
    earth: '#cc7700',
    wind: '#00ffaa',
    nature: '#00dd44',
    void: '#ff00aa',
  };

  if (tile === 0) return floorColors[zone];
  if (tile === 1) return wallColors[zone];
  return hazardColors[zone];
}
