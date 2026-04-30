// Game constants and types

export const TILE_SIZE = 48;
export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;

export type ElementType = 'fire' | 'ice' | 'lightning' | 'shadow' | 'earth' | 'wind' | 'nature' | 'void';

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
  type: 'burn' | 'slow' | 'chain' | 'lifesteal' | 'root' | 'poison' | 'weaken';
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
  category: 'guardians' | 'shattering' | 'corruption' | 'bearers' | 'prophecy' | 'villain' | 'guide' | 'world';
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
  // ─── Endgame Key System ───
  keysCollected?: Partial<Record<ElementType, boolean>>;
  trueKeys?: { balanceCore?: boolean; creationCore?: boolean; freedomCore?: boolean };
  malacharDefeatedOnce?: boolean;
  secretRoomUnlocked?: boolean;
  ascendedMalacharDefeated?: boolean;
  endingChosen?: 'restore' | 'rewrite' | 'reject' | 'true';
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#F97316',
  ice: '#38BDF8',
  lightning: '#EAB308',
  shadow: '#A855F7',
  earth: '#92400E',
  wind: '#34D399',
  nature: '#22C55E',
  void: '#EC4899',
};

export const ELEMENT_COLORS_DARK: Record<ElementType, string> = {
  fire: '#C2410C',
  ice: '#0284C7',
  lightning: '#A16207',
  shadow: '#7C3AED',
  earth: '#78350F',
  wind: '#059669',
  nature: '#15803D',
  void: '#BE185D',
};

export const ZONE_NAMES: Record<ElementType, string> = {
  fire: 'Volcanic Ruins',
  ice: 'Frozen Wastes',
  lightning: 'Storm Citadel',
  shadow: 'Abyssal Hollow',
  earth: 'Ancient Badlands',
  wind: 'Sky Peaks',
  nature: 'Verdant Depths',
  void: 'The Abyss',
};

export const BOSS_NAMES: Record<ElementType, string> = {
  fire: 'Ignis',
  ice: 'Glacius',
  lightning: 'Voltaris',
  shadow: 'Umbra',
  earth: 'Terrath',
  wind: 'Zephyros',
  nature: 'Sylvara',
  void: 'Nullex',
};

export const SKILLS: Record<ElementType, { name: string; id: string; description: string; manaCost: number; unlockLevel: number }[]> = {
  fire: [
    { name: 'Flame Wave', id: 'flame_wave', description: 'Release a wave of fire in front of you', manaCost: 20, unlockLevel: 2 },
    { name: 'Meteor Drop', id: 'meteor_drop', description: 'Call down a meteor at cursor position', manaCost: 40, unlockLevel: 5 },
    { name: 'Fire Shield', id: 'fire_shield', description: 'Surround yourself with a ring of fire that damages nearby enemies', manaCost: 30, unlockLevel: 7 },
    { name: 'Inferno Blast', id: 'inferno_blast', description: 'Charge up and release a massive explosion around you', manaCost: 60, unlockLevel: 10 },
  ],
  ice: [
    { name: 'Frost Wall', id: 'frost_wall', description: 'Create a wall of ice that slows enemies', manaCost: 25, unlockLevel: 2 },
    { name: 'Absolute Zero', id: 'absolute_zero', description: 'Freeze all nearby enemies', manaCost: 50, unlockLevel: 5 },
    { name: 'Blizzard', id: 'blizzard', description: 'Summon a blizzard that damages and slows enemies over time', manaCost: 35, unlockLevel: 7 },
    { name: 'Glacial Spike', id: 'glacial_spike', description: 'Launch a piercing ice spike that shatters on impact', manaCost: 55, unlockLevel: 10 },
  ],
  lightning: [
    { name: 'Thunder Dash', id: 'thunder_dash', description: 'Dash with lightning, damaging enemies', manaCost: 15, unlockLevel: 2 },
    { name: 'Storm Field', id: 'storm_field', description: 'Create a field of lightning strikes', manaCost: 45, unlockLevel: 5 },
    { name: 'Ball Lightning', id: 'ball_lightning', description: 'Launch a slow orb that zaps nearby enemies repeatedly', manaCost: 35, unlockLevel: 7 },
    { name: 'Thunderstorm', id: 'thunderstorm', description: 'Call down a barrage of lightning bolts across the room', manaCost: 65, unlockLevel: 10 },
  ],
  shadow: [
    { name: 'Shadow Clone', id: 'shadow_clone', description: 'Create a clone that fights for you', manaCost: 30, unlockLevel: 2 },
    { name: 'Void Rift', id: 'void_rift', description: 'Open a rift that pulls and damages enemies', manaCost: 50, unlockLevel: 5 },
    { name: 'Shadow Step', id: 'shadow_step', description: 'Teleport to cursor position, damaging enemies at both locations', manaCost: 25, unlockLevel: 7 },
    { name: 'Soul Drain', id: 'soul_drain', description: 'Drain life from all nearby enemies, healing yourself', manaCost: 55, unlockLevel: 10 },
  ],
  earth: [
    { name: 'Stone Spike', id: 'stone_spike', description: 'Erupt spikes from the ground in a line', manaCost: 22, unlockLevel: 2 },
    { name: 'Quake', id: 'quake', description: 'Slam the ground, stunning and damaging all nearby enemies', manaCost: 48, unlockLevel: 5 },
    { name: 'Boulder Toss', id: 'boulder_toss', description: 'Hurl a massive boulder that crushes enemies', manaCost: 35, unlockLevel: 7 },
    { name: 'Terra Fortress', id: 'terra_fortress', description: 'Encase yourself in stone, becoming immune and reflecting damage', manaCost: 60, unlockLevel: 10 },
  ],
  wind: [
    { name: 'Gust Slash', id: 'gust_slash', description: 'Launch a razor-sharp blade of wind', manaCost: 18, unlockLevel: 2 },
    { name: 'Cyclone', id: 'cyclone', description: 'Create a tornado that pulls and shreds enemies', manaCost: 45, unlockLevel: 5 },
    { name: 'Aerial Barrage', id: 'aerial_barrage', description: 'Unleash a volley of wind blades in all directions', manaCost: 38, unlockLevel: 7 },
    { name: 'Eye of the Storm', id: 'eye_of_storm', description: 'Become the eye of a massive storm, massively boosting speed and damage', manaCost: 65, unlockLevel: 10 },
  ],
  nature: [
    { name: 'Vine Grasp', id: 'vine_grasp', description: 'Roots enemies in place with erupting vines', manaCost: 20, unlockLevel: 2 },
    { name: 'Spore Cloud', id: 'spore_cloud', description: 'Release a toxic spore cloud that poisons enemies', manaCost: 42, unlockLevel: 5 },
    { name: 'Regrowth', id: 'regrowth', description: 'Call upon nature to heal yourself over time', manaCost: 35, unlockLevel: 7 },
    { name: 'Overgrowth', id: 'overgrowth', description: 'The forest erupts — massive roots and thorns fill the room', manaCost: 60, unlockLevel: 10 },
  ],
  void: [
    { name: 'Null Bolt', id: 'null_bolt', description: 'Fire a bolt of pure void energy that ignores defense', manaCost: 25, unlockLevel: 2 },
    { name: 'Dimension Rift', id: 'dimension_rift', description: 'Tear a rift that warps enemy positions', manaCost: 50, unlockLevel: 5 },
    { name: 'Entropy Field', id: 'entropy_field', description: 'Create a field of chaos that weakens all enemies in range', manaCost: 38, unlockLevel: 7 },
    { name: 'Singularity', id: 'singularity', description: 'Collapse reality into a point, dealing catastrophic damage to all enemies', manaCost: 75, unlockLevel: 10 },
  ],
};
