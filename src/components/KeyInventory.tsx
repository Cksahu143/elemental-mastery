import { BOSS_KEY_ZONES, EndgameState, keyCount } from '../game/endgame';
import { ELEMENT_COLORS, BOSS_NAMES } from '../game/types';

const ELEMENT_EMOJI: Record<string, string> = {
  fire: '🔥', ice: '❄️', lightning: '⚡', shadow: '🌑',
  earth: '🪨', wind: '🌀', nature: '🌿', void: '🕳️',
};

export default function KeyInventory({ endgame, compact = true }: { endgame: EndgameState; compact?: boolean }) {
  const total = keyCount(endgame);
  return (
    <div className="bg-black/60 border border-yellow-900/50 rounded px-2 py-1 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] font-ui font-bold text-yellow-400 uppercase tracking-wider">
          Boss Keys
        </span>
        <span className="text-[9px] font-ui text-yellow-200/80">{total}/8</span>
      </div>
      <div className="flex gap-0.5">
        {BOSS_KEY_ZONES.map(zone => {
          const owned = !!endgame.keysCollected[zone];
          return (
            <div
              key={zone}
              title={`${BOSS_NAMES[zone]} — ${owned ? 'Collected' : 'Locked'}`}
              className="w-5 h-5 rounded-sm border flex items-center justify-center text-[10px] transition-all"
              style={{
                borderColor: owned ? ELEMENT_COLORS[zone] : '#333',
                background: owned ? `${ELEMENT_COLORS[zone]}30` : 'rgba(0,0,0,0.4)',
                boxShadow: owned ? `0 0 6px ${ELEMENT_COLORS[zone]}80` : 'none',
                opacity: owned ? 1 : 0.4,
              }}
            >
              {owned ? '🗝' : '·'}
            </div>
          );
        })}
      </div>
      {!compact && (
        <div className="mt-1 text-[8px] font-ui text-muted-foreground">
          {total === 8 ? 'A door awaits in the void…' : 'Defeat all 8 elemental bosses'}
        </div>
      )}
    </div>
  );
}
