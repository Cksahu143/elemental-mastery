import { GameRoom, Enemy, ElementType, EnemyType, Position, TILE_SIZE } from './types';

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

export function generateRoom(zone: ElementType, floor: number, isBossRoom: boolean): GameRoom {
  const width = isBossRoom ? 20 : 14 + Math.floor(Math.random() * 6);
  const height = isBossRoom ? 16 : 12 + Math.floor(Math.random() * 4);
  
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
    // Scale boss with floor
    boss.hp = Math.floor(boss.hp * (1 + floor * 0.12));
    boss.maxHp = boss.hp;
    boss.damage = Math.floor(boss.damage * (1 + floor * 0.08));
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
  };
  const wallColors: Record<ElementType, string> = {
    fire: '#3d1a0a',
    ice: '#0a1a3d',
    lightning: '#2d2a0a',
    shadow: '#1a0a3d',
  };
  const hazardColors: Record<ElementType, string> = {
    fire: '#ff4400',
    ice: '#00aaff',
    lightning: '#ffcc00',
    shadow: '#9900ff',
  };

  if (tile === 0) return floorColors[zone];
  if (tile === 1) return wallColors[zone];
  return hazardColors[zone];
}
