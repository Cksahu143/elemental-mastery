import { PlayerState, ElementType, ELEMENT_COLORS, ZONE_NAMES, SKILLS } from '../game/types';
import { switchElement, getActiveSkills, getCameraMode, setCameraMode, type CameraMode } from '../game/engine';

interface GameHUDProps {
  player: PlayerState;
  floor: number;
  zone: ElementType;
  onOpenLore: () => void;
  onOpenStats: () => void;
  onOpenSkills: () => void;
  onPause: () => void;
}

export default function GameHUD({ player, floor, zone, onOpenLore, onOpenStats, onOpenSkills, onPause }: GameHUDProps) {
  const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
  const manaPct = Math.max(0, (player.mana / player.maxMana) * 100);
  const xpPct = (player.xp / player.xpToNext) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top-left: HP & Mana */}
      <div className="absolute top-4 left-4 pointer-events-auto">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-ui font-bold text-destructive w-8">HP</span>
          <div className="w-48 h-4 bg-muted/50 border border-border overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${hpPct}%`,
                background: `linear-gradient(90deg, #991b1b, #dc2626)`,
                boxShadow: hpPct < 30 ? '0 0 10px rgba(220,38,38,0.5)' : 'none',
              }}
            />
          </div>
          <span className="text-xs font-ui text-foreground">{Math.floor(player.hp)}/{player.maxHp}</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-ui font-bold text-secondary w-8">MP</span>
          <div className="w-48 h-3 bg-muted/50 border border-border overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${manaPct}%`,
                background: `linear-gradient(90deg, #1e40af, #3b82f6)`,
              }}
            />
          </div>
          <span className="text-xs font-ui text-foreground">{Math.floor(player.mana)}/{player.maxMana}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-ui font-bold text-accent w-8">XP</span>
          <div className="w-48 h-2 bg-muted/50 border border-border overflow-hidden">
            <div
              className="h-full transition-all duration-200"
              style={{
                width: `${xpPct}%`,
                background: `linear-gradient(90deg, #a16207, #eab308)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Top-center: Zone & Floor */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-auto">
        <p className="text-xs font-ui tracking-widest uppercase text-muted-foreground">
          {ZONE_NAMES[zone]}
        </p>
        <p className="text-sm font-display" style={{ color: ELEMENT_COLORS[zone] }}>
          Floor {floor}
        </p>
      </div>

      {/* Top-right: Level & Buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-3 pointer-events-auto">
        <div className="text-right mr-2">
          <p className="text-xs font-ui text-muted-foreground">Level</p>
          <p className="text-2xl font-display font-bold text-primary leading-none">{player.level}</p>
        </div>
        {player.statPoints > 0 && (
          <button
            onClick={onOpenStats}
            className="px-3 py-1 text-xs font-ui font-bold uppercase tracking-wider border border-accent text-accent hover:bg-accent/10 transition-colors animate-pulse-glow"
          >
            +{player.statPoints} Pts
          </button>
        )}
        <button
          onClick={onOpenSkills}
          className="px-3 py-1 text-xs font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Skills
        </button>
        <button
          onClick={onOpenLore}
          className="px-3 py-1 text-xs font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Lore
        </button>
        <button
          onClick={onPause}
          className="px-3 py-1 text-xs font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Menu
        </button>
        <button
          onClick={() => {
            const modes: CameraMode[] = ['2d', 'isometric'];
            const cur = getCameraMode();
            const next = modes[(modes.indexOf(cur) + 1) % modes.length];
            setCameraMode(next);
          }}
          className="px-3 py-1 text-xs font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          {getCameraMode() === '2d' ? '2D' : 'ISO'}
        </button>
      </div>

      {/* Bottom-left: Element switcher */}
      {player.unlockedElements.length > 1 && (
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <p className="text-[10px] font-ui text-muted-foreground mb-1 uppercase tracking-wider">Element</p>
          <div className="flex gap-2">
            {player.unlockedElements.map(el => (
              <button
                key={el}
                onClick={() => switchElement(el)}
                className="w-10 h-10 border-2 flex items-center justify-center text-sm font-ui font-bold transition-all"
                style={{
                  borderColor: player.element === el ? ELEMENT_COLORS[el] : 'hsl(var(--border))',
                  color: ELEMENT_COLORS[el],
                  backgroundColor: player.element === el ? `${ELEMENT_COLORS[el]}20` : 'transparent',
                  boxShadow: player.element === el ? `0 0 10px ${ELEMENT_COLORS[el]}40` : 'none',
                }}
                title={`Switch to ${el}`}
              >
                {el === 'fire' ? '🔥' : el === 'ice' ? '❄' : el === 'lightning' ? '⚡' : el === 'shadow' ? '🌑' : el === 'earth' ? '🪨' : el === 'wind' ? '🌀' : el === 'nature' ? '🌿' : '🕳️'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom-center: Dash + Skills */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="flex items-center gap-3">
          {/* Skill slots */}
          {(() => {
            const activeSkills = getActiveSkills();
            const allSkills = SKILLS[player.element] || [];
            return allSkills.map((skill, idx) => {
              const owned = activeSkills.some(s => s.id === skill.id);
              const hasEnoughMana = player.mana >= skill.manaCost;
              return (
                <div key={skill.id} className="text-center">
                  <div
                    className="w-12 h-12 border-2 flex flex-col items-center justify-center text-[10px] font-ui font-bold transition-colors"
                    style={{
                      borderColor: !owned ? 'hsl(var(--muted))' : hasEnoughMana ? ELEMENT_COLORS[player.element] : 'hsl(var(--muted-foreground))',
                      color: !owned ? 'hsl(var(--muted))' : hasEnoughMana ? ELEMENT_COLORS[player.element] : 'hsl(var(--muted-foreground))',
                      opacity: owned ? 1 : 0.3,
                      boxShadow: owned && hasEnoughMana ? `0 0 10px ${ELEMENT_COLORS[player.element]}40` : 'none',
                    }}
                    title={owned ? `${skill.name} (${skill.manaCost} MP)` : 'Locked'}
                  >
                    <span className="text-sm font-bold">{idx + 1}</span>
                    <span className="text-[8px] truncate w-full text-center px-0.5">{owned ? skill.name.split(' ')[0] : '?'}</span>
                  </div>
                </div>
              );
            });
          })()}

          {/* Dash */}
          <div className="text-center">
            <div
              className="w-12 h-12 border-2 flex items-center justify-center text-lg font-ui font-bold transition-colors"
              style={{
                borderColor: player.dashCooldown > 0 ? 'hsl(var(--muted-foreground))' : ELEMENT_COLORS[player.element],
                color: player.dashCooldown > 0 ? 'hsl(var(--muted-foreground))' : ELEMENT_COLORS[player.element],
                opacity: player.dashCooldown > 0 ? 0.4 : 1,
                boxShadow: player.dashCooldown <= 0 ? `0 0 10px ${ELEMENT_COLORS[player.element]}40` : 'none',
              }}
            >
              ⚡
            </div>
            <span className="text-[10px] font-ui text-muted-foreground mt-1 block">DASH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
