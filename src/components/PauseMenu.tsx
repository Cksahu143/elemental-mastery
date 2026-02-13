interface PauseMenuProps {
  onResume: () => void;
  onSave: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onSave, onQuit }: PauseMenuProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border p-8 text-center min-w-[280px]">
        <h2 className="text-2xl font-display text-foreground tracking-wider mb-6">Paused</h2>
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="py-2 text-sm font-ui uppercase tracking-widest border border-primary/50 text-primary hover:bg-primary/10 transition-colors"
          >
            Resume
          </button>
          <button
            onClick={onSave}
            className="py-2 text-sm font-ui uppercase tracking-widest border border-accent/50 text-accent hover:bg-accent/10 transition-colors"
          >
            Save Game
          </button>
          <button
            onClick={onQuit}
            className="py-2 text-sm font-ui uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Quit to Title
          </button>
        </div>
      </div>
    </div>
  );
}
