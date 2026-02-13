import { LoreEntry } from '../game/types';

interface LoreCodexProps {
  entries: LoreEntry[];
  onClose: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  guardians: 'The Elemental Guardians',
  shattering: 'The Shattering',
  corruption: 'The Corruption',
  bearers: 'The Fragment Bearers',
  prophecy: 'Ancient Prophecy',
};

export default function LoreCodex({ entries, onClose }: LoreCodexProps) {
  const categories = ['guardians', 'shattering', 'corruption', 'bearers', 'prophecy'];

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-2xl font-display text-primary tracking-wider">Lore Codex</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-ui uppercase tracking-wider"
          >
            Close [ESC]
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-6">
          {categories.map(cat => {
            const catEntries = entries.filter(e => e.category === cat);
            return (
              <div key={cat}>
                <h3 className="text-sm font-ui font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  {CATEGORY_NAMES[cat]}
                </h3>
                <div className="space-y-3">
                  {catEntries.map(entry => (
                    <div
                      key={entry.id}
                      className={`p-3 border ${entry.unlocked ? 'border-primary/30 bg-muted/20' : 'border-border bg-muted/5'}`}
                    >
                      <h4 className={`font-display text-sm ${entry.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {entry.unlocked ? entry.title : '???'}
                      </h4>
                      {entry.unlocked && (
                        <p className="text-xs font-ui text-muted-foreground mt-1 leading-relaxed">
                          {entry.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
