import { PlayerState, ElementType, ELEMENT_COLORS, ZONE_NAMES, SKILLS } from '../game/types';
import { switchElementBattle, getActiveSkills, getCameraMode, setCameraMode, type CameraMode, fireAllOutAttack, getAllOutCooldown } from '../game/engine';
import { getFloorLabel } from '../game/dungeon';
import QuestTracker from './QuestTracker';
import { QuestState } from '../game/story';

interface GameHUDProps {
  player: PlayerState;
  floor: number;
  zone: ElementType;
  questState: QuestState;
  onOpenLore: () => void;
  onOpenStats: () => void;
  onOpenSkills: () => void;
  onOpenMap: () => void;
  onPause: () => void;
}

const elementEmoji: Record<ElementType, string> = {
  fire: '🔥', ice: '❄️', lightning: '⚡', shadow: '🌑',
  earth: '🪨', wind: '🌀', nature: '🌿', void: '🕳️',
};

const ALL_OUT_NAMES: Record<ElementType, string> = {
  fire: 'INFERNAL JUDGEMENT',
  ice: 'ABSOLUTE ZERO',
  lightning: 'THUNDER GOD',
  shadow: 'VOID ANNIHILATION',
  earth: 'TECTONIC DEVASTATION',
  wind: 'HURRICANE',
  nature: 'WORLD TREE',
  void: 'SINGULARITY COLLAPSE',
};

export default function GameHUD({ player, floor, zone, questState, onOpenLore, onOpenStats, onOpenSkills, onOpenMap, onPause }: GameHUDProps) {
  const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
  const manaPct = Math.max(0, (player.mana / player.maxMana) * 100);
  const xpPct = (player.xp / player.xpToNext) * 100;
  const allOutCD = getAllOutCooldown();
  const floorLabel = getFloorLabel(floor);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* ═══ TOP-LEFT: Player portrait + bars ═══ */}
      <div className="absolute top-3 left-3 pointer-events-auto flex items-start gap-2">
        <div
          className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            borderColor: ELEMENT_COLORS[zone],
            background: `radial-gradient(circle, ${ELEMENT_COLORS[zone]}30, rgba(0,0,0,0.6))`,
            boxShadow: `0 0 12px ${ELEMENT_COLORS[zone]}50`,
          }}
        >
          {elementEmoji[zone]}
        </div>

        <div className="flex flex-col gap-0.5 min-w-[180px]">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-ui font-bold text-foreground">Lv.{player.level}</span>
            <span className="text-[10px] font-ui text-muted-foreground uppercase tracking-wider">
              {ZONE_NAMES[zone]} · F{floorLabel}
            </span>
          </div>

          {/* HP bar */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-ui font-bold text-red-400 w-5">HP</span>
            <div className="flex-1 h-3.5 bg-black/50 border border-red-900/50 rounded-sm overflow-hidden relative">
              <div
                className="h-full transition-all duration-300 rounded-sm"
                style={{
                  width: `${hpPct}%`,
                  background: hpPct < 25
                    ? 'linear-gradient(90deg, #7f1d1d, #dc2626)'
                    : 'linear-gradient(90deg, #991b1b, #ef4444)',
                  boxShadow: hpPct < 25 ? '0 0 8px rgba(220,38,38,0.6)' : 'none',
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-ui font-bold text-white/90 drop-shadow">
                {Math.floor(player.hp)}/{player.maxHp}
              </span>
            </div>
          </div>

          {/* MP bar */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-ui font-bold text-blue-400 w-5">MP</span>
            <div className="flex-1 h-3 bg-black/50 border border-blue-900/50 rounded-sm overflow-hidden relative">
              <div
                className="h-full transition-all duration-300 rounded-sm"
                style={{ width: `${manaPct}%`, background: 'linear-gradient(90deg, #1e3a8a, #3b82f6)' }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-ui font-bold text-white/80 drop-shadow">
                {Math.floor(player.mana)}/{player.maxMana}
              </span>
            </div>
          </div>

          {/* XP bar */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-ui font-bold text-yellow-500 w-5">XP</span>
            <div className="flex-1 h-2 bg-black/50 border border-yellow-900/30 rounded-sm overflow-hidden">
              <div
                className="h-full transition-all duration-200 rounded-sm"
                style={{ width: `${xpPct}%`, background: 'linear-gradient(90deg, #854d0e, #eab308)' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TOP-RIGHT: Menu buttons ═══ */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-auto">
        {player.statPoints > 0 && (
          <button
            onClick={onOpenStats}
            className="px-2 py-1 text-[10px] font-ui font-bold uppercase tracking-wider border rounded animate-pulse"
            style={{ borderColor: ELEMENT_COLORS[zone], color: ELEMENT_COLORS[zone] }}
          >
            +{player.statPoints}
          </button>
        )}
        <HudButton icon="⚔️" label="Skills" onClick={onOpenSkills} />
        <HudButton icon="📖" label="Lore" onClick={onOpenLore} />
        <HudButton icon="🗺️" label="Map" onClick={onOpenMap} />
        <HudButton icon="⚙️" label="Menu" onClick={onPause} />
        <button
          onClick={() => {
            const modes: CameraMode[] = ['2d', 'isometric', '3d'];
            const cur = getCameraMode();
            const next = modes[(modes.indexOf(cur) + 1) % modes.length];
            setCameraMode(next);
          }}
          className="w-8 h-8 rounded border border-border bg-black/50 flex items-center justify-center text-[10px] font-ui font-bold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          {getCameraMode() === '2d' ? '2D' : getCameraMode() === 'isometric' ? 'ISO' : '3D'}
        </button>
      </div>

      {/* ═══ TOP-RIGHT BELOW: Quest tracker ═══ */}
      <div className="absolute top-14 right-3">
        <QuestTracker questState={questState} onOpenMap={onOpenMap} />
      </div>

      {/* ═══ BOTTOM-LEFT: Battle element switcher ═══ */}
      {player.unlockedElements.length > 1 && (
        <div className="absolute bottom-4 left-3 pointer-events-auto">
          <p className="text-[8px] font-ui text-muted-foreground mb-1 uppercase tracking-wider">Switch Element</p>
          <div className="flex gap-1.5 flex-wrap max-w-[200px]">
            {player.unlockedElements.map(el => (
              <button
                key={el}
                onClick={() => switchElementBattle(el)}
                className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm transition-all hover:scale-110"
                style={{
                  borderColor: player.element === el ? ELEMENT_COLORS[el] : 'rgba(255,255,255,0.15)',
                  backgroundColor: player.element === el ? `${ELEMENT_COLORS[el]}30` : 'rgba(0,0,0,0.4)',
                  boxShadow: player.element === el ? `0 0 10px ${ELEMENT_COLORS[el]}50` : 'none',
                }}
                title={`Switch to ${el} (mid-battle)`}
              >
                {elementEmoji[el]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ BOTTOM-CENTER: Skill bar + All-Out Attack ═══ */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-end gap-1.5 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-white/10">
          {(() => {
            const activeSkills = getActiveSkills();
            const allSkills = SKILLS[player.element] || [];
            return allSkills.map((skill, idx) => {
              const owned = activeSkills.some(s => s.id === skill.id);
              const hasEnoughMana = player.mana >= skill.manaCost;
              return (
                <div key={skill.id} className="text-center group relative">
                  <div
                    className="w-11 h-11 rounded-lg border-2 flex flex-col items-center justify-center transition-all"
                    style={{
                      borderColor: !owned ? '#333' : hasEnoughMana ? ELEMENT_COLORS[player.element] : '#555',
                      background: !owned ? 'rgba(0,0,0,0.4)' : hasEnoughMana ? `${ELEMENT_COLORS[player.element]}15` : 'rgba(0,0,0,0.3)',
                      opacity: owned ? 1 : 0.35,
                      boxShadow: owned && hasEnoughMana ? `0 0 8px ${ELEMENT_COLORS[player.element]}30` : 'none',
                    }}
                  >
                    <span className="text-xs font-bold font-ui" style={{ color: owned ? ELEMENT_COLORS[player.element] : '#555' }}>
                      {idx + 1}
                    </span>
                    <span className="text-[7px] font-ui truncate w-full text-center px-0.5 text-muted-foreground">
                      {owned ? skill.name.split(' ')[0] : '?'}
                    </span>
                  </div>
                  {owned && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-card/95 border border-border rounded px-2 py-1 whitespace-nowrap z-50">
                      <p className="text-[10px] font-ui font-bold text-foreground">{skill.name}</p>
                      <p className="text-[8px] font-ui text-muted-foreground">{skill.manaCost} MP</p>
                    </div>
                  )}
                </div>
              );
            });
          })()}

          {/* Separator */}
          <div className="w-px h-8 bg-white/10 mx-0.5" />

          {/* All-Out Attack Button */}
          <div className="text-center group relative">
            <button
              onClick={() => fireAllOutAttack()}
              disabled={allOutCD > 0 || player.mana < 50}
              className="w-14 h-11 rounded-lg border-2 flex flex-col items-center justify-center transition-all relative overflow-hidden"
              style={{
                borderColor: allOutCD > 0 ? '#555' : '#FFD700',
                background: allOutCD > 0 ? 'rgba(0,0,0,0.3)' : 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,100,0,0.2))',
                opacity: allOutCD > 0 ? 0.5 : 1,
                boxShadow: allOutCD <= 0 ? '0 0 12px rgba(255,215,0,0.4)' : 'none',
              }}
            >
              {allOutCD > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-[10px] font-ui font-bold text-white">{Math.ceil(allOutCD)}s</span>
                </div>
              )}
              <span className="text-sm">💥</span>
              <span className="text-[6px] font-ui font-bold text-yellow-400">Q</span>
            </button>
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-card/95 border border-yellow-600 rounded px-2 py-1 whitespace-nowrap z-50 min-w-[120px]">
              <p className="text-[10px] font-ui font-bold text-yellow-400">{ALL_OUT_NAMES[player.element]}</p>
              <p className="text-[8px] font-ui text-muted-foreground">50 MP · All-Out Attack</p>
              <p className="text-[7px] font-ui text-yellow-600">Press Q to unleash</p>
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-white/10 mx-0.5" />

          {/* Dash */}
          <div className="text-center">
            <div
              className="w-11 h-11 rounded-lg border-2 flex items-center justify-center text-base transition-all"
              style={{
                borderColor: player.dashCooldown > 0 ? '#555' : ELEMENT_COLORS[player.element],
                background: player.dashCooldown > 0 ? 'rgba(0,0,0,0.3)' : `${ELEMENT_COLORS[player.element]}15`,
                opacity: player.dashCooldown > 0 ? 0.4 : 1,
              }}
            >
              💨
            </div>
            <span className="text-[7px] font-ui text-muted-foreground mt-0.5 block">SPACE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HudButton({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded border border-border bg-black/50 flex items-center justify-center text-sm hover:bg-black/70 hover:border-foreground/30 transition-colors group relative"
      title={label}
    >
      {icon}
      <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-ui text-muted-foreground hidden group-hover:block whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
