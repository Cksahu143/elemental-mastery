import { SaveData, ElementType, LoreEntry } from './types';
import { LORE_ENTRIES } from './lore';
import { EXPANDED_LORE } from './story';

const SAVE_KEY = 'elemental_ascension_save';

export function getDefaultSave(): SaveData {
  return {
    level: 1,
    stats: { attack: 5, defense: 3, speed: 3, elementalPower: 5 },
    statPoints: 0,
    unlockedElements: ['fire'],
    skills: [],
    loreUnlocked: [],
    bossesDefeated: [],
    currentZone: 'fire',
    currentFloor: 1,
    hp: 100,
    maxHp: 100,
    mana: 80,
    maxMana: 80,
    xp: 0,
    xpToNext: 80,
    keysCollected: {},
    trueKeys: {},
    malacharDefeatedOnce: false,
    secretRoomUnlocked: false,
    ascendedMalacharDefeated: false,
  };
}

export function saveGame(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

export function loadGame(): SaveData | null {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SaveData;
  } catch {
    return null;
  }
}

export function deleteSave(): void {
  localStorage.removeItem(SAVE_KEY);
}

export function getLoreEntries(unlockedIds: string[]): LoreEntry[] {
  const allEntries = [...LORE_ENTRIES, ...EXPANDED_LORE];
  return allEntries.map(e => ({
    ...e,
    unlocked: unlockedIds.includes(e.id),
  }));
}
