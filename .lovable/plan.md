
# Endgame Expansion: Keys, Secret Room & Ascended Malachar

A new hidden layer of progression that activates **after** the player has beaten Malachar once **and** collected all 8 boss keys. It adds a sealed door in the Malachar arena, a reality-bending Secret Room, three Trials, and a final Convergence Dungeon culminating in Ascended Malachar.

---

## 1. Save Data Extensions

Extend `SaveData` in `src/game/types.ts` with:

```ts
keysCollected: Partial<Record<ElementType | 'malachar', boolean>>; // 8 boss keys
trueKeys: { balanceCore?: boolean; creationCore?: boolean; freedomCore?: boolean };
malacharDefeatedOnce: boolean;
secretRoomUnlocked: boolean;
ascendedMalacharDefeated: boolean;
endingChosen?: 'restore' | 'rewrite' | 'reject' | 'true';
```

`getDefaultSave()` initializes them empty/false. `saveSystem.ts` is otherwise unchanged (already uses JSON).

---

## 2. Boss Key Drops

In `GameCanvas.tsx` `onBossDefeated` callback:
- When a normal zone boss falls, set `keysCollected[zone] = true` and call `autosave('Key of <Boss> Obtained')`.
- Show notification: `"Key of <BossName> obtained!"` with key icon.
- Keys persist permanently and never consume.

Add a new `KeyInventory` UI panel (small, in `GameHUD.tsx`) showing 8 key slots; lit when collected. Also surface in Lore Codex / Pause Menu as a “Keys” tab.

---

## 3. Post-Victory Arena State (Empty Malachar Arena)

New engine flag `malacharCleared` (derived from save). Modify `startMalacharFight()` in `src/game/engine.ts`:
- If `save.malacharDefeatedOnce === true`, generate a **silent variant** of the arena via a new `generateEmptyMalacharArena()` in `src/game/dungeon.ts`:
  - Same layout as current arena, but **no boss enemy**, hazard pools dimmed, broken pillars (some walls converted to rubble tiles).
  - At the back-center add a special **Sealed Door** tile (new tile type `3`) at `(cx, height-3)`.
  - No boss music — engine signals `audio.playAmbient('void_silent')`.

Re-entry path: from Kingdom Hub or World Map, allow “Return to Final Arena” option once `malacharDefeatedOnce`. Triggered via existing `switchElement('void')` + new `enterMalacharArena()` engine call.

---

## 4. Sealed Door Interaction

New component `src/components/SealedDoor.tsx` — an interaction overlay shown when player stands within ~1 tile of the door tile. Engine adds `getNearbySealedDoor()` polled from `useFrame`-style hook in `GameCanvas`.

Prompt UI:
- Locked state: `"Sealed Door — Keys: 5/8"` (greyed).
- Unlocked state (8/8): `"Press E — Use Keys"`.

On confirm with all 8 keys:
- Trigger `KeyOrbitCutscene` (new component): keys orbit player, door dissolves with particle burst (use existing `screenEffects.ts` flash + new shader-less canvas overlay).
- Set `secretRoomUnlocked = true`, autosave `"Secret Room Unlocked"`.
- Transition into Secret Room scene.

---

## 5. The Secret Room

New file `src/game/secretRoom.ts` building a `SecretRoomState` independent of dungeon system. Rendered via a new `SecretRoomScene.tsx` using **R3F** (consistent with `Game3DCanvas`):
- Floating fragments of past zones (8 small islands, each tinted with that zone’s color, slowly orbiting).
- Echo silhouettes of guardians (sprite billboards from `portraits.ts`, semi-transparent, drifting).
- Distorted skybox (gradient + post-process noise via custom shader material — kept simple).
- Center: glowing **Altar** mesh with interaction prompt.

Player movement uses a simplified WASD controller (no combat). Approaching altar opens **Ending Selection** menu.

---

## 6. Ending Selection & Trials

New component `EndingSelectionDialog.tsx` with 3 cards: **Restore the World**, **Rewrite Reality**, **Reject Everything**.

Each card launches a **Trial** — a short bespoke gameplay room (not a cutscene), implemented by reusing the existing dungeon engine with a special trial config.

`src/game/trials.ts`:
```ts
export type TrialId = 'restore' | 'rewrite' | 'reject';
export const TRIALS: Record<TrialId, { name: string; reward: keyof SaveData['trueKeys']; build: () => GameRoom }>;
```

Trial concepts:
| Trial | Gameplay hook | Reward |
|---|---|---|
| Restore | Survive waves while reviving fallen guardian motes (touch motes to “heal” the room). | `balanceCore` |
| Rewrite | Element of room cycles every 5s; player must adapt skill loadout to match. | `creationCore` |
| Reject | All abilities disabled except basic attack & dash; pure mechanical fight vs corrupted echo. | `freedomCore` |

On trial completion: set respective `trueKeys.<core> = true`, autosave `"Trial Completed — <name>"`, return player to Secret Room. Trials cannot be skipped (no “quit” returns progress).

---

## 7. “Fix the World” Unlock

When `trueKeys.balanceCore && trueKeys.creationCore && trueKeys.freedomCore`, the altar adds a 4th option: **Fix the World** (golden, pulsing).

On click:
1. Aethon dialogue overlay (uses existing `NPCDialogue`):
   - `"Fix… the world? Or finish what you started?"`
2. `screenEffects.collapse()` — new effect: room geometry scales inward with chromatic aberration overlay.
3. Autosave `"Convergence Initiated"`, then transition to Convergence Dungeon.

---

## 8. Convergence Dungeon

New `src/game/convergenceDungeon.ts`. A **5-room linear dungeon** generated with `generateRoom()` but with extensions:
- `ConvergenceEnemy`: hybrid type, holds **two** elements; uses random ability from each per attack.
- Room element shifts every ~10s (changes hazard color + applies elemental weakness rotation).
- Difficulty scaling +50% over normal void floor.

Visual chaos: enable all `SceneBackground3D` particle systems blended; tint cycles each shift. Keep gameplay readable by ensuring hazards always render with high-contrast outline (modify `dungeon.ts` `getTileColor` for convergence zone).

Autosave on entry: `"Convergence Dungeon Entered"`.

---

## 9. Ascended Malachar (Final Boss)

New `generateAscendedMalacharArena()` in `dungeon.ts` and special boss config in `engine.ts`:

- HP: 30,000 (2× current Malachar).
- 3 phases driven by HP thresholds (100%→66%→33%):
  - **Phase 1 — Adaptive**: tracks player’s most-used element this fight, gains +30% resist to it; switches own element to counter.
  - **Phase 2 — Elemental Convergence**: hybrid attacks (e.g., fire+lightning beam, ice+void rift). Reuse boss attack templates with combined effects.
  - **Phase 3 — True Duel**: HUD fades to minimal (hide minimap, quest tracker), soundtrack drops to heartbeat, player & boss both gain +50% speed, no skills cooldown — pure dodge/strike loop.
- Awareness flavor: pre-fight monologue references player choices (`endingChosen`, kingdom buildings count, deaths) via templated lines in `story.ts`.

---

## 10. True Ending

On Ascended Malachar defeat:
- New `TrueEndingCutscene.tsx`: video-less sequence using `StoryCutscene` with custom transformation visuals (player sprite gains 8-color aura).
- Set `ascendedMalacharDefeated = true`, `endingChosen = 'true'`, autosave `"True Ending Achieved"`.
- Tone: transformation, not victory. Final card: **“The Fifth Guardian”**.
- Returns to Title Screen with new “New Game+” affordance unlocked (placeholder for future expansion).

---

## 11. Autosave Triggers (additions)

Reuse existing `autosave(reason, overrides)`:
- Key obtained
- Secret room unlocked
- Trial completed (×3)
- Convergence dungeon entered
- Ascended Malachar defeated

---

## 12. Files (new vs modified)

**New**
- `src/components/SealedDoor.tsx`
- `src/components/KeyOrbitCutscene.tsx`
- `src/components/SecretRoomScene.tsx`
- `src/components/EndingSelectionDialog.tsx`
- `src/components/TrueEndingCutscene.tsx`
- `src/components/KeyInventory.tsx`
- `src/game/secretRoom.ts`
- `src/game/trials.ts`
- `src/game/convergenceDungeon.ts`

**Modified**
- `src/game/types.ts` — SaveData fields, new tile type `3` (sealed door), `ConvergenceEnemy` type.
- `src/game/saveSystem.ts` — defaults for new fields.
- `src/game/dungeon.ts` — `generateEmptyMalacharArena`, `generateAscendedMalacharArena`, sealed door tile color.
- `src/game/engine.ts` — `enterMalacharArena`, sealed-door proximity check, ascended boss logic, awareness tracking, phase 3 minimal mode flag.
- `src/game/story.ts` — Aethon interrupt line, ascended Malachar templated taunts, true ending lines.
- `src/components/GameCanvas.tsx` — wire new screens, key drops, autosaves, post-victory arena routing.
- `src/components/GameHUD.tsx` — Key inventory chip + minimal-mode toggle.
- `src/components/KingdomHub.tsx` — “Return to Final Arena” button shown when `malacharDefeatedOnce`.
- `src/components/VictoryScreen.tsx` — add hint: *“A door remains sealed in his arena…”*

---

## 13. Modular Future-Proofing

- Trials registered in a map (`TRIALS`) — easy to add 4th/5th.
- Convergence dungeon room generator parameterized by element pool — supports DLC zones.
- `keysCollected` keyed by string — supports adding more bosses later.
- Ending state stored — enables future “New Game+” reading prior choices.

---

## Out of Scope (for this pass)

- Full new Aethon voice acting.
- Multiple True Endings beyond the single transformation ending.
- Cross-save sharing of keys (single-save model retained).
