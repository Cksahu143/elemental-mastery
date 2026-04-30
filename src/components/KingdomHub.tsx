import { useState, useRef, useEffect } from 'react';
import {
  KingdomState, BuildingId, BUILDINGS, canAfford, upgradeBuilding, getKingdomBonuses, Building,
} from '../game/kingdom';
import { ElementType } from '../game/types';

interface KingdomHubProps {
  kingdom: KingdomState;
  defeatedZone: ElementType;
  nextZone: ElementType;
  onUpdateKingdom: (k: KingdomState) => void;
  onContinue: () => void;
  standalone?: boolean; // opened mid-run, no continue to next zone
  showReturnToArena?: boolean;
  onReturnToArena?: () => void;
}

const ZONE_COLORS: Record<ElementType, string> = {
  fire: 'hsl(24 95% 53%)',
  ice: 'hsl(200 80% 55%)',
  lightning: 'hsl(45 90% 55%)',
  shadow: 'hsl(270 60% 50%)',
  earth: 'hsl(30 60% 40%)',
  wind: 'hsl(160 60% 50%)',
  nature: 'hsl(120 60% 40%)',
  void: 'hsl(300 70% 30%)',
};

const ZONE_NAMES: Record<ElementType, string> = {
  fire: 'Volcanic Ruins',
  ice: 'Frozen Wastes',
  lightning: 'Storm Citadel',
  shadow: 'Abyssal Hollow',
  earth: 'Ancient Badlands',
  wind: 'Sky Peaks',
  nature: 'Verdant Depths',
  void: 'The Abyss',
};

const BOSS_NAMES: Record<ElementType, string> = {
  fire: 'Ignis',
  ice: 'Glacius',
  lightning: 'Voltaris',
  shadow: 'Umbra',
  earth: 'Terrath',
  wind: 'Zephyros',
  nature: 'Sylvara',
  void: 'Nullex',
};

// Building positions on the map (percentage-based)
const BUILDING_POSITIONS: Record<BuildingId, { x: number; y: number }> = {
  forge:      { x: 15, y: 45 },
  sanctuary:  { x: 35, y: 30 },
  arcane_well:{ x: 55, y: 30 },
  watchtower: { x: 80, y: 25 },
  vault:      { x: 70, y: 60 },
  shrine:     { x: 30, y: 65 },
  barracks:   { x: 50, y: 55 },
  library:    { x: 20, y: 75 },
  market:     { x: 65, y: 78 },
  beacon:     { x: 85, y: 50 },
};

// Building visual representations at each level
const BUILDING_VISUALS: Record<BuildingId, { levels: string[]; colors: string[] }> = {
  forge: {
    levels: ['⚒️', '🔨', '🔥⚒️', '🌋⚒️', '💎⚒️'],
    colors: ['#F97316', '#FB923C', '#EF4444', '#DC2626', '#FF6B35'],
  },
  sanctuary: {
    levels: ['🏛️', '🏯', '⛩️', '🕌', '👑🏛️'],
    colors: ['#22C55E', '#16A34A', '#15803D', '#166534', '#4ADE80'],
  },
  arcane_well: {
    levels: ['🌀', '🔵', '💧🌀', '🌊🌀', '✨🌀'],
    colors: ['#38BDF8', '#0EA5E9', '#0284C7', '#0369A1', '#7DD3FC'],
  },
  watchtower: {
    levels: ['🗼', '🏰', '⚔️🗼', '🌟🗼', '🔭🗼'],
    colors: ['#EAB308', '#CA8A04', '#A16207', '#854D0E', '#FDE047'],
  },
  vault: {
    levels: ['💎', '🏺', '💰💎', '🪙💎', '👑💎'],
    colors: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#A78BFA'],
  },
  shrine: {
    levels: ['🔮', '🕯️', '🌙🔮', '⭐🔮', '🌌🔮'],
    colors: ['#EC4899', '#DB2777', '#BE185D', '#9D174D', '#F472B6'],
  },
  barracks: {
    levels: ['🛡️', '⚔️🛡️', '🏰🛡️', '🗡️🛡️', '👑🛡️'],
    colors: ['#94A3B8', '#64748B', '#475569', '#334155', '#CBD5E1'],
  },
  library: {
    levels: ['📚', '📖📚', '✨📚', '🌟📚', '💫📚'],
    colors: ['#A78BFA', '#8B5CF6', '#7C3AED', '#6D28D9', '#C4B5FD'],
  },
  market: {
    levels: ['🏪', '🏬', '🏛️🏪'],
    colors: ['#FBBF24', '#F59E0B', '#D97706'],
  },
  beacon: {
    levels: ['⚡', '💨⚡', '🌪️⚡', '🌟⚡'],
    colors: ['#34D399', '#10B981', '#059669', '#047857'],
  },
};

function BuildingNode({
  building,
  level,
  position,
  selected,
  affordable,
  animating,
  zoneColor,
  onClick,
}: {
  building: Building;
  level: number;
  position: { x: number; y: number };
  selected: boolean;
  affordable: boolean;
  animating: boolean;
  zoneColor: string;
  onClick: () => void;
}) {
  const visual = BUILDING_VISUALS[building.id];
  const maxed = level >= building.maxLevel;
  const built = level > 0;
  const levelIdx = Math.max(0, level - 1);
  const icon = built ? visual.levels[levelIdx] : '🪨';
  const color = built ? visual.colors[levelIdx] : '#555';

  return (
    <button
      onClick={onClick}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group transition-all duration-300 ${
        animating ? 'scale-125' : 'hover:scale-110'
      }`}
      style={{ left: `${position.x}%`, top: `${position.y}%` }}
    >
      {/* Building structure */}
      <div
        className={`relative flex items-center justify-center rounded-full border-2 transition-all duration-300 ${
          selected ? 'border-white shadow-2xl' : built ? 'border-transparent' : 'border-dashed border-gray-600'
        }`}
        style={{
          width: built ? 72 : 52,
          height: built ? 72 : 52,
          background: built
            ? `radial-gradient(circle at 35% 35%, ${color}cc, ${color}44)`
            : 'rgba(30,30,40,0.7)',
          boxShadow: selected
            ? `0 0 30px ${color}, 0 0 60px ${color}40`
            : built
            ? `0 0 15px ${color}60, 0 4px 12px rgba(0,0,0,0.5)`
            : 'none',
        }}
      >
        <span className="text-2xl select-none">{icon}</span>

        {/* Level pips */}
        {built && (
          <div className="absolute -bottom-1 flex gap-0.5">
            {Array.from({ length: building.maxLevel }, (_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full border border-black/30"
                style={{ background: i < level ? color : '#333' }}
              />
            ))}
          </div>
        )}

        {/* Upgrade available badge */}
        {!maxed && affordable && !selected && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold animate-bounce"
            style={{ background: zoneColor, color: 'black' }}
          >
            +
          </div>
        )}

        {/* Max badge */}
        {maxed && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold bg-yellow-400 text-black">
            ★
          </div>
        )}
      </div>

      {/* Building name label */}
      <div
        className={`mt-1 px-2 py-0.5 rounded text-[10px] font-ui font-semibold backdrop-blur-sm transition-all duration-200 ${
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
        style={{
          background: 'rgba(0,0,0,0.75)',
          color: built ? color : '#888',
          border: `1px solid ${built ? color + '40' : '#444'}`,
        }}
      >
        {building.name}
      </div>
    </button>
  );
}

// Animated map canvas background
function KingdomMapCanvas({ zoneColor }: { zoneColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const draw = (t: number) => {
      timeRef.current = t / 1000;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6);
      sky.addColorStop(0, '#050510');
      sky.addColorStop(0.5, '#0a0820');
      sky.addColorStop(1, '#0d1228');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.save();
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 137 + 17) % W);
        const sy = ((i * 79 + 31) % (H * 0.55));
        const pulse = 0.5 + 0.5 * Math.sin(timeRef.current * 1.5 + i * 0.7);
        const alpha = 0.2 + 0.5 * pulse;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.8 + pulse * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Distant mountains
      ctx.save();
      for (let layer = 0; layer < 3; layer++) {
        const alpha = 0.15 + layer * 0.12;
        ctx.fillStyle = `rgba(20,15,50,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(0, H * 0.55);
        const peaks = 6 + layer * 2;
        for (let p = 0; p <= peaks; p++) {
          const px = (p / peaks) * W;
          const py = H * (0.3 + layer * 0.08) - Math.sin(p * 1.3 + layer) * H * (0.12 - layer * 0.03);
          if (p === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.lineTo(W, H * 0.55);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();

      // Ground gradient
      const ground = ctx.createLinearGradient(0, H * 0.52, 0, H);
      ground.addColorStop(0, '#0e1520');
      ground.addColorStop(0.4, '#111827');
      ground.addColorStop(1, '#0a0f18');
      ctx.fillStyle = ground;
      ctx.fillRect(0, H * 0.52, W, H * 0.48);

      // Glowing ground paths (dirt roads between buildings)
      const paths: [number, number, number, number][] = [
        [0.15, 0.45, 0.35, 0.30],
        [0.35, 0.30, 0.55, 0.30],
        [0.55, 0.30, 0.80, 0.25],
        [0.35, 0.30, 0.30, 0.65],
        [0.30, 0.65, 0.70, 0.60],
        [0.55, 0.30, 0.70, 0.60],
        [0.50, 0.55, 0.30, 0.65],
        [0.50, 0.55, 0.70, 0.60],
        [0.20, 0.75, 0.30, 0.65],
        [0.65, 0.78, 0.70, 0.60],
        [0.80, 0.25, 0.85, 0.50],
      ];
      ctx.save();
      ctx.lineWidth = 3;
      for (const [x1, y1, x2, y2] of paths) {
        const grad = ctx.createLinearGradient(x1 * W, y1 * H, x2 * W, y2 * H);
        grad.addColorStop(0, `${zoneColor}30`);
        grad.addColorStop(0.5, `${zoneColor}60`);
        grad.addColorStop(1, `${zoneColor}30`);
        ctx.strokeStyle = grad;
        ctx.shadowColor = zoneColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(x1 * W, y1 * H);
        ctx.lineTo(x2 * W, y2 * H);
        ctx.stroke();
      }
      ctx.restore();

      // Ambient glow orbs
      const orbs = [
        { x: 0.25, y: 0.7, r: 80 },
        { x: 0.75, y: 0.6, r: 60 },
        { x: 0.5, y: 0.45, r: 100 },
      ];
      for (const orb of orbs) {
        const pulse = 0.4 + 0.2 * Math.sin(timeRef.current * 0.8 + orb.x * 5);
        const grd = ctx.createRadialGradient(orb.x * W, orb.y * H, 0, orb.x * W, orb.y * H, orb.r);
        grd.addColorStop(0, `${zoneColor}${Math.max(0, Math.min(255, Math.round(pulse * 30))).toString(16).padStart(2, '0')}`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [zoneColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export default function KingdomHub({
  kingdom,
  defeatedZone,
  nextZone,
  onUpdateKingdom,
  onContinue,
  standalone = false,
}: KingdomHubProps) {
  const [selected, setSelected] = useState<BuildingId | null>(null);
  const [upgradeAnim, setUpgradeAnim] = useState<BuildingId | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [tab, setTab] = useState<'map' | 'stats'>('map');

  const bonuses = getKingdomBonuses(kingdom);
  const zoneColor = ZONE_COLORS[defeatedZone] || 'hsl(24 95% 53%)';

  const handleUpgrade = (id: BuildingId) => {
    if (!canAfford(kingdom, id)) return;
    const next = upgradeBuilding(kingdom, id);
    onUpdateKingdom(next);
    setUpgradeAnim(id);
    setNotification('Building upgraded!');
    setTimeout(() => setUpgradeAnim(null), 600);
    setTimeout(() => setNotification(null), 2000);
  };

  const selectedBuilding = selected ? BUILDINGS.find(b => b.id === selected) : null;
  const selectedLevel = selected ? kingdom.buildings[selected] : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Animated map canvas */}
      <div className="absolute inset-0">
        <KingdomMapCanvas zoneColor={zoneColor} />
      </div>

      {/* UI overlay */}
      <div className="relative z-10 flex flex-col h-full">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-black/40 backdrop-blur-sm border-b border-white/10">
          <div>
            {!standalone && (
              <p className="text-xs font-ui tracking-[0.3em] uppercase" style={{ color: zoneColor }}>
                {BOSS_NAMES[defeatedZone] || '?'} Defeated
              </p>
            )}
            <h1 className="text-2xl font-display font-bold text-foreground">
              {standalone ? '⚔️ Kingdom' : '👑 The Kingdom'}
            </h1>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-black/40 rounded-lg p-1 border border-white/10">
            <button
              onClick={() => setTab('map')}
              className={`px-4 py-1.5 rounded text-xs font-ui font-semibold transition-all ${
                tab === 'map' ? 'bg-white/15 text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              🗺️ Map
            </button>
            <button
              onClick={() => setTab('stats')}
              className={`px-4 py-1.5 rounded text-xs font-ui font-semibold transition-all ${
                tab === 'stats' ? 'bg-white/15 text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              📊 Stats
            </button>
          </div>

          {/* Gold */}
          <div className="flex items-center gap-2 bg-black/50 rounded-lg px-4 py-2 border border-yellow-500/30">
            <span className="text-xl">💰</span>
            <span className="text-xl font-display font-bold text-yellow-400">{kingdom.gold}</span>
            <span className="text-muted-foreground font-ui text-xs">Gold</span>
          </div>
        </div>

        {/* Map view */}
        {tab === 'map' && (
          <div className="flex flex-1 overflow-hidden">
            {/* Interactive map */}
            <div className="relative flex-1">
              {BUILDINGS.map(building => {
                const level = kingdom.buildings[building.id];
                const affordable = canAfford(kingdom, building.id);
                const pos = BUILDING_POSITIONS[building.id];
                return (
                  <BuildingNode
                    key={building.id}
                    building={building}
                    level={level}
                    position={pos}
                    selected={selected === building.id}
                    affordable={affordable}
                    animating={upgradeAnim === building.id}
                    zoneColor={zoneColor}
                    onClick={() => setSelected(selected === building.id ? null : building.id)}
                  />
                );
              })}

              {/* Center kingdom name */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <p
                  className="text-xs font-ui tracking-[0.3em] uppercase opacity-50"
                  style={{ color: zoneColor }}
                >
                  Realm of the Fragment Bearer
                </p>
              </div>
            </div>

            {/* Detail panel */}
            {selectedBuilding && (
              <div
                className="w-72 flex-shrink-0 flex flex-col bg-black/70 backdrop-blur-md border-l border-white/10 p-5 overflow-y-auto"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-3xl border-2"
                    style={{
                      borderColor: BUILDING_VISUALS[selectedBuilding.id].colors[Math.max(0, selectedLevel - 1)] + '80',
                      background: `radial-gradient(circle, ${BUILDING_VISUALS[selectedBuilding.id].colors[Math.max(0, selectedLevel - 1)]}20, transparent)`,
                    }}
                  >
                    {selectedLevel > 0
                      ? BUILDING_VISUALS[selectedBuilding.id].levels[selectedLevel - 1]
                      : '🪨'}
                  </div>
                  <div>
                    <h2 className="font-display text-base font-bold text-foreground">{selectedBuilding.name}</h2>
                    <p className="text-xs font-ui text-muted-foreground">
                      Level {selectedLevel} / {selectedBuilding.maxLevel}
                    </p>
                  </div>
                </div>

                <p className="text-xs font-ui text-muted-foreground mb-4 leading-relaxed">
                  {selectedBuilding.description}
                </p>

                {/* Level progression */}
                <div className="flex flex-col gap-1.5 mb-4">
                  {selectedBuilding.bonusPerLevel.map((bonus, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-2 py-1 rounded text-xs font-ui"
                      style={{
                        background: i < selectedLevel
                          ? BUILDING_VISUALS[selectedBuilding.id].colors[i] + '20'
                          : 'rgba(255,255,255,0.03)',
                        borderLeft: `2px solid ${i < selectedLevel
                          ? BUILDING_VISUALS[selectedBuilding.id].colors[i]
                          : 'rgba(255,255,255,0.1)'}`,
                        color: i < selectedLevel
                          ? BUILDING_VISUALS[selectedBuilding.id].colors[i]
                          : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      <span className="opacity-60">Lv{i + 1}</span>
                      <span>{bonus}</span>
                      {i === selectedLevel - 1 && (
                        <span className="ml-auto opacity-70">✓</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upgrade button */}
                {selectedLevel < selectedBuilding.maxLevel ? (
                  <div className="mt-auto">
                    <p className="text-xs font-ui text-muted-foreground mb-1 text-center">
                      Next: {selectedBuilding.bonusPerLevel[selectedLevel]}
                    </p>
                    <button
                      onClick={() => handleUpgrade(selectedBuilding.id)}
                      disabled={!canAfford(kingdom, selectedBuilding.id)}
                      className="w-full py-2.5 rounded font-ui font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95"
                      style={{
                        background: canAfford(kingdom, selectedBuilding.id)
                          ? `linear-gradient(135deg, ${zoneColor}, ${zoneColor}99)`
                          : 'hsl(var(--muted))',
                        color: 'black',
                      }}
                    >
                      Upgrade — {selectedBuilding.costPerLevel[selectedLevel]} 💰
                    </button>
                    {!canAfford(kingdom, selectedBuilding.id) && (
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        Need {selectedBuilding.costPerLevel[selectedLevel] - kingdom.gold} more gold
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-auto text-center">
                    <p className="text-yellow-400 font-display font-bold text-sm">⭐ FULLY UPGRADED ⭐</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats tab */}
        {tab === 'stats' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
              <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h3 className="font-display text-sm font-bold text-foreground mb-3">⚔️ Combat Bonuses</h3>
                <div className="space-y-2">
                  <StatRow label="Attack Bonus" value={`+${bonuses.attackBonus}`} color="#F97316" />
                  <StatRow label="HP Bonus" value={`+${bonuses.hpBonus}`} color="#22C55E" />
                  <StatRow label="Mana Bonus" value={`+${bonuses.manaBonus}`} color="#38BDF8" />
                </div>
              </div>
              <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h3 className="font-display text-sm font-bold text-foreground mb-3">📈 Multipliers</h3>
                <div className="space-y-2">
                  <StatRow label="XP Rate" value={`×${bonuses.xpMultiplier.toFixed(2)}`} color="#EAB308" />
                  <StatRow label="Gold Rate" value={`×${bonuses.goldMultiplier.toFixed(2)}`} color="#FBBF24" />
                  <StatRow label="HP Regen" value={`${bonuses.hpRegen}/s`} color="#4ADE80" />
                  <StatRow label="Mana Regen" value={`${bonuses.manaRegen}/s`} color="#7DD3FC" />
                </div>
              </div>
              <div className="col-span-2 bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                <h3 className="font-display text-sm font-bold text-foreground mb-3">🏗️ Buildings</h3>
                <div className="grid grid-cols-3 gap-3">
                  {BUILDINGS.map(b => {
                    const lv = kingdom.buildings[b.id];
                    const visual = BUILDING_VISUALS[b.id];
                    const color = lv > 0 ? visual.colors[lv - 1] : '#555';
                    return (
                      <div
                        key={b.id}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                      >
                        <span className="text-xl">{lv > 0 ? visual.levels[lv - 1] : '🪨'}</span>
                        <div>
                          <p className="text-xs font-ui font-semibold" style={{ color }}>
                            {b.name}
                          </p>
                          <p className="text-[10px] font-ui text-muted-foreground">
                            Lv {lv} / {b.maxLevel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="px-6 py-3 bg-black/50 backdrop-blur-sm border-t border-white/10 flex items-center justify-between">
          <p className="text-xs font-ui text-muted-foreground">
            {standalone
              ? 'Return to the dungeon when ready'
              : `Venture into ${ZONE_NAMES[nextZone] || 'the next zone'} when ready`}
          </p>
          <button
            onClick={onContinue}
            className="px-10 py-2.5 text-sm font-display font-semibold tracking-widest uppercase border transition-all duration-300 rounded hover:scale-105 active:scale-95"
            style={{
              borderColor: zoneColor + '80',
              color: zoneColor,
              background: zoneColor + '15',
            }}
          >
            {standalone ? '⚔️ Return to Battle' : `Enter ${ZONE_NAMES[nextZone] || 'Next Zone'} →`}
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
            <p className="text-xl font-display font-bold text-accent animate-pulse tracking-widest bg-black/80 px-6 py-3 rounded-xl border border-accent/30">
              ✨ {notification}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-ui text-muted-foreground">{label}</span>
      <span className="text-xs font-ui font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
