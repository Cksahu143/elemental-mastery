import { useState } from 'react';
import { ElementType, ELEMENT_COLORS, ZONE_NAMES, BOSS_NAMES } from '../game/types';
import {
  adminTravelTo, adminUnlockAllElements, adminFullHeal, adminGodMode,
  adminAddLevels, adminDefeatBoss,
} from '../game/engine';
import { EndgameState, TRUE_KEYS } from '../game/endgame';

const ZONES: ElementType[] = ['fire', 'ice', 'lightning', 'shadow', 'earth', 'wind', 'nature', 'void'];

export interface AdminJumpTargets {
  toEmptyArena: () => void;
  toSealedDoor: () => void;
  toSecretRoom: () => void;
  toEndingSelect: () => void;
  toConvergence: () => void;
  toAscendedMalachar: () => void;
  toTrueEnding: () => void;
  startMalacharFight: () => void;
}

export interface AdminPanelProps {
  endgame: EndgameState;
  onUpdateEndgame: (next: EndgameState) => void;
  onClose: () => void;
  onNotify: (msg: string) => void;
  jumps: AdminJumpTargets;
}

export default function AdminPanel({ endgame, onUpdateEndgame, onClose, onNotify, jumps }: AdminPanelProps) {
  const [tab, setTab] = useState<'player' | 'world' | 'endgame'>('player');

  const grantAllKeys = () => {
    const next: EndgameState = {
      ...endgame,
      keysCollected: ZONES.reduce((acc, z) => ({ ...acc, [z]: true }), {} as Record<ElementType, boolean>),
    };
    onUpdateEndgame(next);
    onNotify('🗝 All boss keys granted');
  };

  const grantAllTrueKeys = () => {
    const next: EndgameState = {
      ...endgame,
      trueKeys: { balanceCore: true, creationCore: true, freedomCore: true },
    };
    onUpdateEndgame(next);
    onNotify('💠 All true keys granted');
  };

  const markMalacharDefeated = () => {
    onUpdateEndgame({ ...endgame, malacharDefeatedOnce: true });
    onNotify('Malachar marked as defeated');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[680px] max-h-[88vh] overflow-y-auto bg-card border-2 border-yellow-500/60 rounded-lg shadow-2xl"
           style={{ boxShadow: '0 0 40px rgba(250,204,21,0.25)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-500/40 bg-yellow-500/5">
          <div>
            <h2 className="text-lg font-display font-bold text-yellow-400 tracking-widest">⚙ ADMIN CONSOLE</h2>
            <p className="text-[10px] font-ui text-muted-foreground uppercase tracking-wider">
              Press ` (backtick) to toggle · Esc to close
            </p>
          </div>
          <button onClick={onClose}
            className="px-3 py-1 text-xs font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors">
            Close
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['player', 'world', 'endgame'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-ui uppercase tracking-widest transition-colors ${
                tab === t ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-500/5' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-5">
          {tab === 'player' && (
            <>
              <Section title="Vitals">
                <Btn label="Full Heal (HP + MP)" onClick={() => { adminFullHeal(); onNotify('Fully healed'); }} />
                <Btn label="Godmode (9999s)" onClick={() => { adminGodMode(); onNotify('Godmode ON'); }} />
              </Section>
              <Section title="Progression">
                <Btn label="+1 Level" onClick={() => { adminAddLevels(1); onNotify('+1 Level'); }} />
                <Btn label="+5 Levels" onClick={() => { adminAddLevels(5); onNotify('+5 Levels'); }} />
                <Btn label="+10 Levels" onClick={() => { adminAddLevels(10); onNotify('+10 Levels'); }} />
                <Btn label="Unlock All Elements" onClick={() => { adminUnlockAllElements(); onNotify('All 8 elements unlocked'); }} />
              </Section>
            </>
          )}

          {tab === 'world' && (
            <>
              <Section title="Force Travel (bypasses unlock)">
                <div className="grid grid-cols-2 gap-1.5 w-full">
                  {ZONES.map(z => (
                    <button
                      key={z}
                      onClick={() => { adminTravelTo(z, 1); onNotify(`Traveled to ${ZONE_NAMES[z]}`); onClose(); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-ui font-bold uppercase tracking-wider border rounded transition-all hover:scale-[1.02]"
                      style={{ borderColor: ELEMENT_COLORS[z], color: ELEMENT_COLORS[z], background: `${ELEMENT_COLORS[z]}10` }}
                    >
                      <span>{ZONE_NAMES[z]}</span>
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Defeat Boss (awards key + unlocks next zone)">
                <div className="grid grid-cols-2 gap-1.5 w-full">
                  {ZONES.map(z => (
                    <button
                      key={z}
                      onClick={() => { adminDefeatBoss(z); onNotify(`${BOSS_NAMES[z]} defeated`); }}
                      className="px-3 py-2 text-xs font-ui font-bold border rounded transition-all hover:scale-[1.02]"
                      style={{ borderColor: ELEMENT_COLORS[z], color: ELEMENT_COLORS[z] }}
                    >
                      Slay {BOSS_NAMES[z]}
                    </button>
                  ))}
                </div>
              </Section>
            </>
          )}

          {tab === 'endgame' && (
            <>
              <Section title="Boss Keys">
                <Btn label="Grant All 8 Boss Keys" onClick={grantAllKeys} />
                <Btn label="Grant All True Keys" onClick={grantAllTrueKeys} />
              </Section>
              <Section title="Malachar Flags">
                <Btn label="Mark Malachar Defeated Once" onClick={markMalacharDefeated} />
                <Btn label="Start Malachar Fight"
                     onClick={() => { jumps.startMalacharFight(); onClose(); }} />
              </Section>
              <Section title="Jump To Endgame Scene">
                <Btn label="Silent Arena (after Malachar)"
                     onClick={() => { jumps.toEmptyArena(); onClose(); }} />
                <Btn label="Sealed Door (key insertion)"
                     onClick={() => { jumps.toSealedDoor(); onClose(); }} />
                <Btn label="Secret Room"
                     onClick={() => { jumps.toSecretRoom(); onClose(); }} />
                <Btn label="Ending Selection"
                     onClick={() => { jumps.toEndingSelect(); onClose(); }} />
                <Btn label="Convergence Dungeon"
                     onClick={() => { jumps.toConvergence(); onClose(); }} />
                <Btn label="Ascended Malachar Fight"
                     onClick={() => { jumps.toAscendedMalachar(); onClose(); }} />
                <Btn label="True Ending Cutscene"
                     onClick={() => { jumps.toTrueEnding(); onClose(); }} />
              </Section>
              <Section title="Current Endgame State">
                <div className="text-[10px] font-ui text-muted-foreground space-y-1 w-full">
                  <div>Boss keys: <span className="text-foreground">{Object.values(endgame.keysCollected).filter(Boolean).length} / 8</span></div>
                  <div>True keys: <span className="text-foreground">{Object.values(endgame.trueKeys).filter(Boolean).length} / {TRUE_KEYS.length}</span></div>
                  <div>Malachar defeated once: <span className="text-foreground">{endgame.malacharDefeatedOnce ? 'yes' : 'no'}</span></div>
                  <div>Secret room unlocked: <span className="text-foreground">{endgame.secretRoomUnlocked ? 'yes' : 'no'}</span></div>
                  <div>Ascended Malachar defeated: <span className="text-foreground">{endgame.ascendedMalacharDefeated ? 'yes' : 'no'}</span></div>
                  <div>Ending chosen: <span className="text-foreground">{endgame.endingChosen ?? '—'}</span></div>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-ui font-bold text-yellow-500/80 uppercase tracking-widest mb-2">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Btn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-2 text-xs font-ui font-bold border border-yellow-500/40 text-yellow-100 bg-yellow-500/5 rounded hover:bg-yellow-500/15 hover:border-yellow-500 transition-colors"
    >
      {label}
    </button>
  );
}