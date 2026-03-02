// Kingdom Hub data & logic

export type BuildingId =
  | 'forge'       // Increases attack
  | 'sanctuary'   // Increases max HP & healing
  | 'arcane_well' // Increases max mana
  | 'watchtower'  // Increases XP gain
  | 'vault'       // Increases gold/resources gain
  | 'shrine'      // Passive regen during runs
  | 'barracks'    // Increases defense
  | 'library'     // Increases elemental power
  | 'market'      // Reduces upgrade costs
  | 'beacon';     // Increases dash & speed

export interface Building {
  id: BuildingId;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  costPerLevel: number[]; // gold cost for each upgrade level
  bonusPerLevel: string[];
}

export interface KingdomState {
  gold: number;
  buildings: Record<BuildingId, number>; // level 0 = not built
}

export const BUILDINGS: Building[] = [
  {
    id: 'forge',
    name: 'Elemental Forge',
    description: 'The fires of creation burn here. Strengthen your attacks.',
    icon: '⚒️',
    maxLevel: 5,
    costPerLevel: [50, 120, 220, 380, 600],
    bonusPerLevel: ['+5 Attack', '+10 Attack', '+16 Attack', '+23 Attack', '+32 Attack'],
  },
  {
    id: 'sanctuary',
    name: 'Life Sanctuary',
    description: 'A hallowed place of healing. Expand your vitality.',
    icon: '🏛️',
    maxLevel: 5,
    costPerLevel: [50, 120, 220, 380, 600],
    bonusPerLevel: ['+25 Max HP', '+55 Max HP', '+90 Max HP', '+130 Max HP', '+175 Max HP'],
  },
  {
    id: 'arcane_well',
    name: 'Arcane Well',
    description: 'A deep reservoir of elemental mana. Cast more spells.',
    icon: '🌀',
    maxLevel: 5,
    costPerLevel: [60, 140, 250, 420, 650],
    bonusPerLevel: ['+20 Max Mana', '+45 Max Mana', '+75 Max Mana', '+110 Max Mana', '+150 Max Mana'],
  },
  {
    id: 'watchtower',
    name: 'Watcher\'s Tower',
    description: 'From these heights, experience is gained faster.',
    icon: '🗼',
    maxLevel: 4,
    costPerLevel: [80, 200, 400, 700],
    bonusPerLevel: ['+15% XP', '+30% XP', '+50% XP', '+75% XP'],
  },
  {
    id: 'vault',
    name: 'Shard Vault',
    description: 'Store and multiply the elemental shards you collect.',
    icon: '💎',
    maxLevel: 4,
    costPerLevel: [70, 170, 320, 550],
    bonusPerLevel: ['+20% Gold', '+45% Gold', '+75% Gold', '+120% Gold'],
  },
  {
    id: 'shrine',
    name: 'Elemental Shrine',
    description: 'Ancient energies slowly restore HP and Mana during runs.',
    icon: '🔮',
    maxLevel: 4,
    costPerLevel: [100, 240, 450, 750],
    bonusPerLevel: ['0.5 HP/s regen', '1 HP/s regen', '1 HP/s + 0.5 Mana/s', '2 HP/s + 1 Mana/s'],
  },
  {
    id: 'barracks',
    name: 'War Barracks',
    description: 'Train defenders to bolster your armor in battle.',
    icon: '🛡️',
    maxLevel: 5,
    costPerLevel: [60, 140, 260, 420, 650],
    bonusPerLevel: ['+3 Defense', '+6 Defense', '+10 Defense', '+15 Defense', '+21 Defense'],
  },
  {
    id: 'library',
    name: 'Arcane Library',
    description: 'Ancient tomes amplify your elemental power.',
    icon: '📚',
    maxLevel: 5,
    costPerLevel: [70, 160, 280, 460, 700],
    bonusPerLevel: ['+4 Elem Power', '+9 Elem Power', '+15 Elem Power', '+22 Elem Power', '+30 Elem Power'],
  },
  {
    id: 'market',
    name: 'Trade Market',
    description: 'Merchants bring rare goods, reducing building costs.',
    icon: '🏪',
    maxLevel: 3,
    costPerLevel: [150, 400, 800],
    bonusPerLevel: ['-10% Build Costs', '-20% Build Costs', '-30% Build Costs'],
  },
  {
    id: 'beacon',
    name: 'Speed Beacon',
    description: 'Enchanted beacon empowers your agility and dash recovery.',
    icon: '⚡',
    maxLevel: 4,
    costPerLevel: [80, 200, 380, 600],
    bonusPerLevel: ['+1 Speed', '+2 Speed', '+3 Speed', '+5 Speed'],
  },
];

export function getDefaultKingdom(): KingdomState {
  return {
    gold: 0,
    buildings: {
      forge: 0,
      sanctuary: 0,
      arcane_well: 0,
      watchtower: 0,
      vault: 0,
      shrine: 0,
      barracks: 0,
      library: 0,
      market: 0,
      beacon: 0,
    },
  };
}

const KINGDOM_KEY = 'elemental_ascension_kingdom';

export function saveKingdom(state: KingdomState): void {
  localStorage.setItem(KINGDOM_KEY, JSON.stringify(state));
}

export function loadKingdom(): KingdomState {
  const raw = localStorage.getItem(KINGDOM_KEY);
  if (!raw) return getDefaultKingdom();
  try {
    const saved = JSON.parse(raw) as KingdomState;
    // Merge with defaults to handle new buildings added in updates
    const defaults = getDefaultKingdom();
    return {
      gold: saved.gold ?? 0,
      buildings: { ...defaults.buildings, ...saved.buildings },
    };
  } catch {
    return getDefaultKingdom();
  }
}

/** Returns passive stat bonuses applied to saves from kingdom buildings */
export interface KingdomBonuses {
  attackBonus: number;
  hpBonus: number;
  manaBonus: number;
  xpMultiplier: number;
  goldMultiplier: number;
  hpRegen: number;
  manaRegen: number;
  defenseBonus: number;
  elemPowerBonus: number;
  speedBonus: number;
  costReduction: number;
}

const ATTACK_BONUS = [0, 5, 10, 16, 23, 32];
const HP_BONUS = [0, 25, 55, 90, 130, 175];
const MANA_BONUS = [0, 20, 45, 75, 110, 150];
const XP_MULT = [1, 1.15, 1.30, 1.50, 1.75];
const GOLD_MULT = [1, 1.20, 1.45, 1.75, 2.20];
const HP_REGEN = [0, 0.5, 1, 1, 2];
const MANA_REGEN = [0, 0, 0, 0.5, 1];
const DEFENSE_BONUS = [0, 3, 6, 10, 15, 21];
const ELEM_POWER_BONUS = [0, 4, 9, 15, 22, 30];
const SPEED_BONUS = [0, 1, 2, 3, 5];
const COST_REDUCTION = [1, 0.9, 0.8, 0.7];

export function getKingdomBonuses(kingdom: KingdomState): KingdomBonuses {
  const bl = kingdom.buildings;
  return {
    attackBonus: ATTACK_BONUS[bl.forge] ?? 0,
    hpBonus: HP_BONUS[bl.sanctuary] ?? 0,
    manaBonus: MANA_BONUS[bl.arcane_well] ?? 0,
    xpMultiplier: XP_MULT[bl.watchtower] ?? 1,
    goldMultiplier: GOLD_MULT[bl.vault] ?? 1,
    hpRegen: HP_REGEN[bl.shrine] ?? 0,
    manaRegen: MANA_REGEN[bl.shrine] ?? 0,
    defenseBonus: DEFENSE_BONUS[bl.barracks] ?? 0,
    elemPowerBonus: ELEM_POWER_BONUS[bl.library] ?? 0,
    speedBonus: SPEED_BONUS[bl.beacon] ?? 0,
    costReduction: COST_REDUCTION[bl.market] ?? 1,
  };
}

export function canAfford(kingdom: KingdomState, id: BuildingId): boolean {
  const building = BUILDINGS.find(b => b.id === id)!;
  const level = kingdom.buildings[id];
  if (level >= building.maxLevel) return false;
  return kingdom.gold >= building.costPerLevel[level];
}

export function upgradeBuilding(kingdom: KingdomState, id: BuildingId): KingdomState {
  const building = BUILDINGS.find(b => b.id === id)!;
  const level = kingdom.buildings[id];
  if (level >= building.maxLevel) return kingdom;
  const cost = building.costPerLevel[level];
  if (kingdom.gold < cost) return kingdom;
  return {
    ...kingdom,
    gold: kingdom.gold - cost,
    buildings: { ...kingdom.buildings, [id]: level + 1 },
  };
}

/** Call after defeating a boss — awards gold */
export function awardBossGold(kingdom: KingdomState, floor: number): KingdomState {
  const base = 40 + floor * 15;
  const multiplier = GOLD_MULT[kingdom.buildings.vault] ?? 1;
  const earned = Math.round(base * multiplier);
  return { ...kingdom, gold: kingdom.gold + earned };
}

/** Award gold for clearing a regular room */
export function awardRoomGold(kingdom: KingdomState, floor: number): KingdomState {
  const base = 5 + floor * 2;
  const multiplier = GOLD_MULT[kingdom.buildings.vault] ?? 1;
  const earned = Math.round(base * multiplier);
  return { ...kingdom, gold: kingdom.gold + earned };
}
