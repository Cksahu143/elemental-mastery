import { ElementType } from './types';
import { BOSS_NAMES } from './types';

// ─── Boss Key System ───
// A "key" is permanently awarded when the player defeats a zone boss.
// All 8 keys + a prior Malachar defeat are required to unlock the Secret Room.

export const BOSS_KEY_ZONES: ElementType[] = [
  'fire', 'ice', 'lightning', 'shadow', 'earth', 'wind', 'nature', 'void',
];

export type TrueKeyId = 'balanceCore' | 'creationCore' | 'freedomCore';

export const TRUE_KEYS: { id: TrueKeyId; name: string; trial: 'restore' | 'rewrite' | 'reject'; color: string }[] = [
  { id: 'balanceCore',  name: 'Balance Core',  trial: 'restore', color: '#34D399' },
  { id: 'creationCore', name: 'Creation Core', trial: 'rewrite', color: '#FACC15' },
  { id: 'freedomCore',  name: 'Freedom Core',  trial: 'reject',  color: '#EC4899' },
];

export interface EndgameState {
  keysCollected: Partial<Record<ElementType, boolean>>;
  trueKeys: Partial<Record<TrueKeyId, boolean>>;
  malacharDefeatedOnce: boolean;
  secretRoomUnlocked: boolean;
  ascendedMalacharDefeated: boolean;
  endingChosen?: 'restore' | 'rewrite' | 'reject' | 'true';
}

export function makeDefaultEndgame(): EndgameState {
  return {
    keysCollected: {},
    trueKeys: {},
    malacharDefeatedOnce: false,
    secretRoomUnlocked: false,
    ascendedMalacharDefeated: false,
  };
}

export function hasAllBossKeys(state: EndgameState): boolean {
  return BOSS_KEY_ZONES.every(z => state.keysCollected[z]);
}

export function hasAllTrueKeys(state: EndgameState): boolean {
  return TRUE_KEYS.every(k => state.trueKeys[k.id]);
}

export function bossKeyName(zone: ElementType): string {
  return `Key of ${BOSS_NAMES[zone]}`;
}

export function keyCount(state: EndgameState): number {
  return BOSS_KEY_ZONES.filter(z => state.keysCollected[z]).length;
}
