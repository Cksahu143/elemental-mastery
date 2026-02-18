// Game constants and types

export const TILE_SIZE = 48;
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

export type ElementType = 'fire' | 'ice' | 'lightning' | 'shadow';

export interface Position {
  x: number;
  y: number;
}

export interface Stats {
  attack: number;
  defense: number;
  speed: number;
  elementalPower: number;
}

export interface PlayerState {
  pos: Position;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  xpToNext: number;
  level: number;
  stats: Stats;
  statPoints: number;
  element: ElementType;
  unlockedElements: ElementType[];
  skills: string[];
  dashCooldown: number;
  attackCooldown: number;
  facing: Position;
  isAttacking: boolean;
  isDashing: boolean;
  dashTimer: number;
  invincible: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  pos: Position;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  attackCooldown: number;
  attackTimer: number;
  element: ElementType;
  isBoss: boolean;
  phase: number;
  state: 'idle' | 'chase' | 'attack' | 'special';
  stateTimer: number;
  statusEffects: StatusEffect[];
  knockback: Position;
  isTired?: boolean;
  tiredTimer?: number;
  summonCooldown?: number;
}

export type EnemyType = 'melee' | 'ranged' | 'assassin' | 'tank' | 'miniboss' | 'boss';

export interface StatusEffect {
  type: 'burn' | 'slow' | 'chain' | 'lifesteal';
  duration: number;
  damage: number;
}

export interface Projectile {
  id: string;
  pos: Position;
  vel: Position;
  damage: number;
  element: ElementType;
  fromPlayer: boolean;
  lifetime: number;
  radius: number;
}

export interface DamageNumber {
  id: string;
  pos: Position;
  value: number;
  element: ElementType;
  lifetime: number;
  isCrit: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface LoreEntry {
  id: string;
  title: string;
  text: string;
  category: 'guardians' | 'shattering' | 'corruption' | 'bearers' | 'prophecy';
  unlocked: boolean;
}

export interface GameRoom {
  tiles: number[][];
  enemies: Enemy[];
  width: number;
  height: number;
  exits: Position[];
  cleared: boolean;
  zone: ElementType;
}

export interface SaveData {
  level: number;
  stats: Stats;
  statPoints: number;
  unlockedElements: ElementType[];
  skills: string[];
  loreUnlocked: string[];
  bossesDefeated: string[];
  currentZone: ElementType;
  currentFloor: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  xpToNext: number;
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#F97316',
  ice: '#38BDF8',
  lightning: '#EAB308',
  shadow: '#A855F7',
};

export const ELEMENT_COLORS_DARK: Record<ElementType, string> = {
  fire: '#C2410C',
  ice: '#0284C7',
  lightning: '#A16207',
  shadow: '#7C3AED',
};

export const ZONE_NAMES: Record<ElementType, string> = {
  fire: 'Volcanic Ruins',
  ice: 'Frozen Wastes',
  lightning: 'Storm Citadel',
  shadow: 'Abyssal Hollow',
};

export const SKILLS: Record<ElementType, { name: string; id: string; description: string; manaCost: number; unlockLevel: number }[]> = {
  fire: [
    { name: 'Flame Wave', id: 'flame_wave', description: 'Release a wave of fire in front of you', manaCost: 20, unlockLevel: 2 },
    { name: 'Meteor Drop', id: 'meteor_drop', description: 'Call down a meteor at cursor position', manaCost: 40, unlockLevel: 5 },
  ],
  ice: [
    { name: 'Frost Wall', id: 'frost_wall', description: 'Create a wall of ice that slows enemies', manaCost: 25, unlockLevel: 2 },
    { name: 'Absolute Zero', id: 'absolute_zero', description: 'Freeze all nearby enemies', manaCost: 50, unlockLevel: 5 },
  ],
  lightning: [
    { name: 'Thunder Dash', id: 'thunder_dash', description: 'Dash with lightning, damaging enemies', manaCost: 15, unlockLevel: 2 },
    { name: 'Storm Field', id: 'storm_field', description: 'Create a field of lightning strikes', manaCost: 45, unlockLevel: 5 },
  ],
  shadow: [
    { name: 'Shadow Clone', id: 'shadow_clone', description: 'Create a clone that fights for you', manaCost: 30, unlockLevel: 2 },
    { name: 'Void Rift', id: 'void_rift', description: 'Open a rift that pulls and damages enemies', manaCost: 50, unlockLevel: 5 },
  ],
};
