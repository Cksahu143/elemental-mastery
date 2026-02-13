import { ElementType, ELEMENT_COLORS } from '../game/types';

interface DeathScreenProps {
  onRespawn: () => void;
  onQuit: () => void;
  floor: number;
  zone: ElementType;
}

export default function DeathScreen({ onRespawn, onQuit, floor, zone }: DeathScreenProps) {
  return (
    <div className="fixed inset-0 bg-background/90 z-50 flex items-center justify-center">
      <div className="text-center">
        <h2
          className="text-5xl font-display font-bold tracking-widest mb-2"
          style={{ color: ELEMENT_COLORS[zone] }}
        >
          FALLEN
        </h2>
        <p className="text-muted-foreground font-ui mb-8">
          You perished on Floor {floor}
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onRespawn}
            className="px-10 py-2 text-sm font-ui font-semibold uppercase tracking-widest border text-primary border-primary/50 hover:bg-primary/10 transition-colors min-w-[200px]"
          >
            Rise Again
          </button>
          <button
            onClick={onQuit}
            className="px-10 py-2 text-sm font-ui uppercase tracking-widest border border-border text-muted-foreground hover:text-foreground transition-colors min-w-[200px]"
          >
            Return to Title
          </button>
        </div>
      </div>
    </div>
  );
}
