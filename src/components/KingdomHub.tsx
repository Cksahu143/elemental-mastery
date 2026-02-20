import { useState } from 'react';
import {
  KingdomState, BuildingId, BUILDINGS, canAfford, upgradeBuilding, getKingdomBonuses,
} from '../game/kingdom';
import { ElementType } from '../game/types';

interface KingdomHubProps {
  kingdom: KingdomState;
  defeatedZone: ElementType;
  nextZone: ElementType;
  onUpdateKingdom: (k: KingdomState) => void;
  onContinue: () => void;
}

const ZONE_COLORS: Record<ElementType, string> = {
  fire: 'hsl(24 95% 53%)',
  ice: 'hsl(200 80% 55%)',
  lightning: 'hsl(45 90% 55%)',
  shadow: 'hsl(270 60% 50%)',
};

const ZONE_NAMES: Record<ElementType, string> = {
  fire: 'Volcanic Ruins',
  ice: 'Frozen Wastes',
  lightning: 'Storm Citadel',
  shadow: 'Abyssal Hollow',
};

const BOSS_NAMES: Record<ElementType, string> = {
  fire: 'Ignis',
  ice: 'Glacius',
  lightning: 'Voltaris',
  shadow: 'Umbra',
};

export default function KingdomHub({
  kingdom,
  defeatedZone,
  nextZone,
  onUpdateKingdom,
  onContinue,
}: KingdomHubProps) {
  const [selected, setSelected] = useState<BuildingId | null>(null);
  const [upgradeAnim, setUpgradeAnim] = useState<BuildingId | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const bonuses = getKingdomBonuses(kingdom);
  const zoneColor = ZONE_COLORS[defeatedZone];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${zoneColor}18 0%, hsl(220 20% 4%) 65%)`,
        }}
      />

      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full opacity-40"
            style={{
              background: zoneColor,
              left: `${(i * 17 + 5) % 100}%`,
              bottom: '-10px',
              animation: `ember-rise ${2 + (i % 3)}s ${(i * 0.4) % 4}s infinite ease-out`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-4 flex flex-col gap-4 max-h-screen overflow-y-auto py-6">

        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-ui tracking-[0.4em] uppercase mb-1" style={{ color: zoneColor }}>
            {BOSS_NAMES[defeatedZone]} Defeated
          </p>
          <h1 className="text-4xl font-display font-bold text-foreground">
            The Kingdom
          </h1>
          <p className="text-muted-foreground font-ui mt-1 text-sm">
            Invest your gold to strengthen the realm before venturing into{' '}
            <span style={{ color: ZONE_COLORS[nextZone] }}>{ZONE_NAMES[nextZone]}</span>
          </p>
        </div>

        {/* Gold & Bonuses bar */}
        <div className="flex items-center justify-between bg-card border border-border rounded-lg px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="text-2xl font-display font-bold text-accent">{kingdom.gold}</span>
            <span className="text-muted-foreground font-ui text-sm ml-1">Gold</span>
          </div>
          <div className="flex gap-6 text-xs font-ui text-muted-foreground">
            {bonuses.attackBonus > 0 && <span className="text-fire">+{bonuses.attackBonus} ATK</span>}
            {bonuses.hpBonus > 0 && <span className="text-red-400">+{bonuses.hpBonus} HP</span>}
            {bonuses.manaBonus > 0 && <span className="text-ice">+{bonuses.manaBonus} MP</span>}
            {bonuses.xpMultiplier > 1 && <span className="text-accent">×{bonuses.xpMultiplier.toFixed(2)} XP</span>}
            {bonuses.hpRegen > 0 && <span className="text-green-400">{bonuses.hpRegen} HP/s</span>}
            {bonuses.manaRegen > 0 && <span className="text-ice">{bonuses.manaRegen} MP/s</span>}
          </div>
        </div>

        {/* Main layout: buildings grid + detail panel */}
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-3">
          {BUILDINGS.map(building => {
            const level = kingdom.buildings[building.id];
            const affordable = canAfford(kingdom, building.id);
            const maxed = level >= building.maxLevel;
            const isSelected = selected === building.id;
            const isAnimating = upgradeAnim === building.id;

            return (
              <button
                key={building.id}
                onClick={() => setSelected(isSelected ? null : building.id)}
                className={`relative text-left rounded-lg border p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-card hover:border-muted-foreground/50 hover:bg-muted/30'
                } ${isAnimating ? 'scale-95' : 'scale-100'}`}
              >
                {/* Level pips */}
                <div className="flex gap-1 absolute top-2 right-2">
                  {Array.from({ length: building.maxLevel }, (_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: i < level ? zoneColor : 'hsl(var(--muted))',
                      }}
                    />
                  ))}
                </div>

                <div className="text-3xl mb-2">{building.icon}</div>
                <h3 className="font-display text-sm font-semibold text-foreground leading-tight">{building.name}</h3>

                {/* Current bonus */}
                {level > 0 && (
                  <p className="text-xs font-ui mt-1" style={{ color: zoneColor }}>
                    {building.bonusPerLevel[level - 1]}
                  </p>
                )}

                {/* Status */}
                <div className="mt-2">
                  {maxed ? (
                    <span className="text-xs font-ui text-accent">MAX LEVEL</span>
                  ) : (
                    <span className={`text-xs font-ui ${affordable ? 'text-accent' : 'text-muted-foreground'}`}>
                      {building.costPerLevel[level]} 💰
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail + Upgrade panel */}
        {selectedBuilding && (
          <div
            className="rounded-lg border p-5 bg-card transition-all"
            style={{ borderColor: zoneColor + '60' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{selectedBuilding.icon}</span>
                  <div>
                    <h2 className="font-display text-lg font-bold text-foreground">{selectedBuilding.name}</h2>
                    <p className="text-xs font-ui text-muted-foreground">Level {selectedLevel} / {selectedBuilding.maxLevel}</p>
                  </div>
                </div>
                <p className="text-sm font-ui text-muted-foreground mb-3">{selectedBuilding.description}</p>

                {/* Bonus progression */}
                <div className="flex flex-wrap gap-2">
                  {selectedBuilding.bonusPerLevel.map((bonus, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-xs font-ui border"
                      style={{
                        borderColor: i < selectedLevel ? zoneColor : 'hsl(var(--border))',
                        color: i < selectedLevel ? zoneColor : 'hsl(var(--muted-foreground))',
                        background: i < selectedLevel ? zoneColor + '15' : 'transparent',
                      }}
                    >
                      Lv{i + 1}: {bonus}
                    </span>
                  ))}
                </div>
              </div>

              {/* Upgrade button */}
              <div className="flex flex-col items-center gap-2 min-w-[120px]">
                {selectedLevel < selectedBuilding.maxLevel ? (
                  <>
                    <p className="text-xs font-ui text-muted-foreground">Next Level</p>
                    <p className="text-sm font-ui" style={{ color: zoneColor }}>
                      {selectedBuilding.bonusPerLevel[selectedLevel]}
                    </p>
                    <button
                      onClick={() => handleUpgrade(selectedBuilding.id)}
                      disabled={!canAfford(kingdom, selectedBuilding.id)}
                      className="w-full px-4 py-2 rounded font-ui font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: canAfford(kingdom, selectedBuilding.id) ? zoneColor : 'hsl(var(--muted))',
                        color: 'hsl(var(--background))',
                      }}
                    >
                      Upgrade ({selectedBuilding.costPerLevel[selectedLevel]} 💰)
                    </button>
                  </>
                ) : (
                  <p className="text-accent font-display font-bold text-sm">MAXED OUT</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
            <p className="text-xl font-display font-bold text-accent animate-pulse-glow tracking-widest">
              {notification}
            </p>
          </div>
        )}

        {/* Continue button */}
        <div className="flex justify-center mt-2">
          <button
            onClick={onContinue}
            className="px-16 py-3 text-lg font-display font-semibold tracking-widest uppercase border transition-all duration-300"
            style={{
              borderColor: ZONE_COLORS[nextZone] + '80',
              color: ZONE_COLORS[nextZone],
              background: 'transparent',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = ZONE_COLORS[nextZone] + '18';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            Enter {ZONE_NAMES[nextZone]} →
          </button>
        </div>
      </div>
    </div>
  );
}
