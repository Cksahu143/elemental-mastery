import { PlayerState } from '../game/types';
import { allocateStat } from '../game/engine';

interface StatAllocationProps {
  player: PlayerState;
  onClose: () => void;
}

export default function StatAllocation({ player, onClose }: StatAllocationProps) {
  const stats: { key: 'attack' | 'defense' | 'speed' | 'elementalPower'; label: string; icon: string; desc: string }[] = [
    { key: 'attack', label: 'Attack', icon: '⚔', desc: 'Increases projectile damage' },
    { key: 'defense', label: 'Defense', icon: '🛡', desc: 'Reduces incoming damage, +5 HP' },
    { key: 'speed', label: 'Speed', icon: '💨', desc: 'Increases movement & attack speed' },
    { key: 'elementalPower', label: 'Elemental Power', icon: '✦', desc: 'Boosts elemental damage, +3 MP' },
  ];

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border max-w-md w-full mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-primary tracking-wider">Level Up!</h2>
          <span className="text-sm font-ui text-accent font-bold">{player.statPoints} points</span>
        </div>
        <div className="space-y-3">
          {stats.map(s => (
            <div key={s.key} className="flex items-center gap-3 p-3 border border-border hover:border-primary/30 transition-colors">
              <span className="text-xl">{s.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-ui font-semibold text-foreground">{s.label}</span>
                  <span className="text-sm font-ui text-primary font-bold">{player.stats[s.key]}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <button
                onClick={() => { allocateStat(s.key); }}
                disabled={player.statPoints <= 0}
                className="px-3 py-1 text-xs font-ui font-bold border border-primary text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                +
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
