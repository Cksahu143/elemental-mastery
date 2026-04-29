import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import CutsceneBackground from './CutsceneBackground';
import DialogueParticles from './DialogueParticles';
import malacharPortrait from '../assets/portrait-nullex.jpg';

interface VictoryScreenProps {
  floor: number;
  bossesDefeated: string[];
  onReturnToTitle: () => void;
  onVisitKingdom: () => void;
}

const EPILOGUE_LINES = [
  'And so, the long night ended.',
  'Malachar — Architect of Ruin, Fifth Guardian, Betrayer of the Balance — fell to a single Fragment Bearer.',
  'The eight elements, scattered across a broken world, were made whole again in your hand.',
  'The Echoes of the Guardians sang their final song, and at last, they slept.',
  'Reality knit itself back together. The sky remembered how to be blue.',
  'In the ruined kingdoms, people looked up. They had forgotten what hope felt like.',
  'They would learn again.',
  'You stand now where Malachar once stood — at the heart of all things.',
  'The world is yours to rebuild.',
  'This is not the end of the story.',
  'It is the beginning of yours.',
];

export default function VictoryScreen({ floor, bossesDefeated, onReturnToTitle, onVisitKingdom }: VictoryScreenProps) {
  const [phase, setPhase] = useState<'fanfare' | 'epilogue' | 'stats'>('fanfare');
  const [lineIdx, setLineIdx] = useState(0);
  const [showLine, setShowLine] = useState(false);

  // Fanfare → epilogue
  useEffect(() => {
    if (phase !== 'fanfare') return;
    const t = setTimeout(() => setPhase('epilogue'), 3200);
    return () => clearTimeout(t);
  }, [phase]);

  // Epilogue line cycle
  useEffect(() => {
    if (phase !== 'epilogue') return;
    setShowLine(false);
    const fadeIn = setTimeout(() => setShowLine(true), 200);
    const next = setTimeout(() => {
      if (lineIdx < EPILOGUE_LINES.length - 1) {
        setLineIdx(i => i + 1);
      } else {
        setPhase('stats');
      }
    }, 4200);
    return () => { clearTimeout(fadeIn); clearTimeout(next); };
  }, [phase, lineIdx]);

  const skip = () => {
    if (phase === 'fanfare') setPhase('epilogue');
    else if (phase === 'epilogue') {
      if (lineIdx < EPILOGUE_LINES.length - 1) setLineIdx(i => i + 1);
      else setPhase('stats');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-background overflow-hidden"
      onClick={phase !== 'stats' ? skip : undefined}
    >
      <CutsceneBackground zone="void" intensity={2} />
      <DialogueParticles element="void" intensity={2} />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80 pointer-events-none" />

      {phase === 'fanfare' && (
        <div className="relative z-10 text-center px-8 animate-fade-in">
          <p className="text-sm font-ui tracking-[0.4em] text-muted-foreground mb-4 animate-pulse">
            ── THE SHATTERING ENDS ──
          </p>
          <h1
            className="font-display font-bold text-7xl md:text-8xl tracking-wider mb-6"
            style={{
              background: 'linear-gradient(135deg, hsl(45 100% 65%), hsl(280 80% 60%), hsl(45 100% 65%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 40px hsl(45 100% 65% / 0.6))',
            }}
          >
            VICTORY
          </h1>
          <p className="text-xl font-display text-foreground/90 italic">
            Malachar has fallen.
          </p>
        </div>
      )}

      {phase === 'epilogue' && (
        <div className="relative z-10 max-w-3xl px-8 text-center">
          <div className="mb-10 flex justify-center">
            <div
              className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/40"
              style={{ boxShadow: '0 0 60px hsl(280 80% 60% / 0.5)' }}
            >
              <img src={malacharPortrait} alt="Malachar" className="w-full h-full object-cover grayscale opacity-60" />
            </div>
          </div>
          <p
            className={`text-2xl md:text-3xl font-display text-foreground leading-relaxed transition-opacity duration-700 ${
              showLine ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ textShadow: '0 0 20px hsl(var(--background))' }}
          >
            {EPILOGUE_LINES[lineIdx]}
          </p>
          <p className="mt-12 text-xs font-ui tracking-widest text-muted-foreground animate-pulse">
            Click to continue
          </p>
        </div>
      )}

      {phase === 'stats' && (
        <div className="relative z-10 max-w-2xl w-full px-8 animate-fade-in">
          <div className="bg-card/80 backdrop-blur-sm border border-primary/40 rounded-lg p-8"
            style={{ boxShadow: '0 0 60px hsl(280 80% 60% / 0.3)' }}
          >
            <h2 className="font-display text-4xl text-center mb-2 text-foreground">The Bearer's Saga</h2>
            <p className="text-center text-sm font-ui tracking-widest text-muted-foreground mb-8">
              ── A LEGEND COMPLETE ──
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="text-center p-4 rounded bg-background/40 border border-border">
                <p className="text-xs font-ui text-muted-foreground tracking-wider">FLOORS CONQUERED</p>
                <p className="text-3xl font-display font-bold text-accent">{floor}</p>
              </div>
              <div className="text-center p-4 rounded bg-background/40 border border-border">
                <p className="text-xs font-ui text-muted-foreground tracking-wider">GUARDIANS FREED</p>
                <p className="text-3xl font-display font-bold text-accent">{bossesDefeated.filter(b => b !== 'malachar').length} / 8</p>
              </div>
            </div>

            <p className="text-center text-foreground/80 italic mb-8 leading-relaxed">
              "The kingdom remembers your name. The Echoes whisper it on the wind.<br />
              You are the Fragment Bearer who made the world whole."
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onVisitKingdom} variant="default" size="lg" className="font-display tracking-wider">
                Visit Your Kingdom
              </Button>
              <Button onClick={onReturnToTitle} variant="outline" size="lg" className="font-display tracking-wider">
                Return to Title
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}