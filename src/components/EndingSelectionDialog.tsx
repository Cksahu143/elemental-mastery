import { EndgameState, hasAllTrueKeys, TRUE_KEYS } from '../game/endgame';

export type EndingChoice = 'restore' | 'rewrite' | 'reject' | 'fix';

interface Props {
  endgame: EndgameState;
  onChoose: (choice: EndingChoice) => void;
  onClose: () => void;
}

const OPTIONS = [
  {
    id: 'restore' as const,
    title: 'Restore the World',
    desc: 'Return what was, mend the Shattering, accept the cost.',
    color: '#34D399',
    coreId: 'balanceCore' as const,
  },
  {
    id: 'rewrite' as const,
    title: 'Rewrite Reality',
    desc: 'Author a new world from raw elemental will.',
    color: '#FACC15',
    coreId: 'creationCore' as const,
  },
  {
    id: 'reject' as const,
    title: 'Reject Everything',
    desc: 'Refuse all gods and elements. Stand alone.',
    color: '#EC4899',
    coreId: 'freedomCore' as const,
  },
];

export default function EndingSelectionDialog({ endgame, onChoose, onClose }: Props) {
  const fixReady = hasAllTrueKeys(endgame);

  return (
    <div className="fixed inset-0 z-[55] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <p className="text-[11px] font-ui uppercase tracking-[0.4em] text-muted-foreground">The Altar Speaks</p>
          <h2 className="text-3xl font-display text-foreground mt-2">Choose a path. Prove it through trial.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {OPTIONS.map(opt => {
            const completed = !!endgame.trueKeys[opt.coreId];
            return (
              <button
                key={opt.id}
                onClick={() => !completed && onChoose(opt.id)}
                disabled={completed}
                className="text-left p-5 border-2 rounded-lg transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-default"
                style={{
                  borderColor: opt.color,
                  background: `linear-gradient(180deg, ${opt.color}15, transparent)`,
                  boxShadow: completed ? `0 0 24px ${opt.color}80` : `0 0 12px ${opt.color}30`,
                }}
              >
                <h3 className="text-lg font-display mb-2" style={{ color: opt.color }}>{opt.title}</h3>
                <p className="text-xs font-ui text-foreground/80 mb-3">{opt.desc}</p>
                <p className="text-[10px] font-ui uppercase tracking-wider" style={{ color: opt.color }}>
                  {completed ? '✓ Trial Complete' : 'Begin Trial'}
                </p>
              </button>
            );
          })}
        </div>

        {fixReady && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => onChoose('fix')}
              className="px-10 py-4 rounded-lg border-2 border-yellow-400 text-yellow-100 font-display text-xl tracking-[0.3em] uppercase animate-pulse"
              style={{
                background: 'radial-gradient(circle, rgba(250,204,21,0.3), rgba(0,0,0,0.6))',
                boxShadow: '0 0 60px rgba(250,204,21,0.5)',
              }}
            >
              ✦ Fix the World ✦
            </button>
          </div>
        )}

        <div className="mt-6 text-center">
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Step away from the altar
          </button>
        </div>
      </div>
    </div>
  );
}
