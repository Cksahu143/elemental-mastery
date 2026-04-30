import { useEffect } from 'react';
import { EndgameState, hasAllBossKeys, keyCount } from '../game/endgame';

interface Props {
  endgame: EndgameState;
  onUseKeys: () => void;
  onLeave: () => void;
}

export default function SealedDoor({ endgame, onUseKeys, onLeave }: Props) {
  const ready = hasAllBossKeys(endgame);
  const count = keyCount(endgame);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (ready && e.key.toLowerCase() === 'e') onUseKeys();
      if (e.key === 'Escape') onLeave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [ready, onUseKeys, onLeave]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-24 pointer-events-none">
      <div
        className="pointer-events-auto bg-black/80 border-2 rounded-lg px-6 py-4 backdrop-blur-md max-w-md"
        style={{
          borderColor: ready ? '#FACC15' : '#444',
          boxShadow: ready ? '0 0 40px rgba(250,204,21,0.4)' : '0 0 20px rgba(0,0,0,0.6)',
        }}
      >
        <p className="text-xs font-ui uppercase tracking-[0.3em] text-muted-foreground mb-2 text-center">
          ⛓ Sealed Door ⛓
        </p>
        {ready ? (
          <>
            <p className="text-yellow-300 text-center text-lg font-display mb-3">
              The eight keys hum in resonance.
            </p>
            <button
              onClick={onUseKeys}
              className="w-full px-4 py-2 bg-yellow-500/20 border border-yellow-500 text-yellow-100 hover:bg-yellow-500/40 transition-colors font-ui font-bold tracking-widest"
            >
              [E] USE KEYS
            </button>
          </>
        ) : (
          <>
            <p className="text-center text-foreground/80 mb-2">
              The door is sealed by an unknown power.
            </p>
            <p className="text-center text-yellow-200/80 text-sm font-ui">
              Keys: <span className="font-bold">{count}/8</span>
            </p>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              Defeat every elemental Guardian to break the seal.
            </p>
          </>
        )}
        <button
          onClick={onLeave}
          className="mt-3 w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          [Esc] Step away
        </button>
      </div>
    </div>
  );
}
