import { useState, useEffect, useCallback } from 'react';
import { INTRO_TEXT } from '../game/lore';
import CutsceneBackground from './CutsceneBackground';

interface TitleScreenProps {
  onNewGame: () => void;
  onContinue: () => void;
  hasSave: boolean;
}

export default function TitleScreen({ onNewGame, onContinue, hasSave }: TitleScreenProps) {
  const [phase, setPhase] = useState<'intro' | 'title'>('intro');
  const [introLine, setIntroLine] = useState(0);
  const [lineOpacity, setLineOpacity] = useState(0);
  const [titleReady, setTitleReady] = useState(false);
  const [embers, setEmbers] = useState<{ id: number; x: number; delay: number; duration: number }[]>([]);

  useEffect(() => {
    const e = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3,
    }));
    setEmbers(e);
  }, []);

  useEffect(() => {
    if (phase !== 'intro') return;
    setLineOpacity(0);
    const fadeIn = setTimeout(() => setLineOpacity(1), 100);
    const next = setTimeout(() => {
      if (introLine < INTRO_TEXT.length - 1) {
        setLineOpacity(0);
        setTimeout(() => setIntroLine(i => i + 1), 500);
      } else {
        setLineOpacity(0);
        setTimeout(() => setPhase('title'), 500);
      }
    }, 2500);
    return () => { clearTimeout(fadeIn); clearTimeout(next); };
  }, [introLine, phase]);

  useEffect(() => {
    if (phase === 'title') {
      setTimeout(() => setTitleReady(true), 300);
    }
  }, [phase]);

  const skipIntro = useCallback(() => {
    setPhase('title');
  }, []);

  // Cycle through element visuals during intro
  const introElements: ('fire' | 'ice' | 'lightning' | 'shadow')[] = ['fire', 'ice', 'lightning', 'shadow'];
  const introElement = introElements[Math.min(introLine, introElements.length - 1) % introElements.length];

  if (phase === 'intro') {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center cursor-pointer"
        onClick={skipIntro}
      >
        <CutsceneBackground zone={introElement} intensity={1.5} />
        <div className="text-center max-w-lg px-8 z-10">
          <p
            className="text-xl font-display text-foreground transition-opacity duration-500"
            style={{ opacity: lineOpacity }}
          >
            {INTRO_TEXT[introLine]}
          </p>
          <p className="text-muted-foreground text-sm mt-12 animate-pulse">
            Click to skip
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Embers */}
      {embers.map(e => (
        <div
          key={e.id}
          className="absolute w-1 h-1 rounded-full bg-primary opacity-60"
          style={{
            left: `${e.x}%`,
            bottom: '-10px',
            animation: `ember-rise ${e.duration}s ${e.delay}s infinite ease-out`,
          }}
        />
      ))}

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, hsl(24 95% 53%) 0%, transparent 70%)' }}
        />
      </div>

      <div
        className={`text-center z-10 transition-all duration-1000 ${titleReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <h1
          className="text-5xl md:text-7xl font-display font-bold tracking-widest text-glow-fire text-primary mb-2"
          style={{ animation: titleReady ? 'title-reveal 1.5s ease-out forwards' : undefined }}
        >
          ELEMENTAL
        </h1>
        <h2
          className="text-3xl md:text-5xl font-display tracking-[0.3em] text-foreground mb-2"
        >
          ASCENSION
        </h2>
        <p className="text-sm font-ui tracking-[0.5em] text-muted-foreground uppercase mb-16">
          Shards of the Broken Realm
        </p>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onNewGame}
            className="px-12 py-3 text-lg font-ui font-semibold tracking-widest uppercase border border-primary/50 text-primary bg-transparent hover:bg-primary/10 hover:border-primary transition-all duration-300 min-w-[240px] border-glow-fire"
          >
            New Game
          </button>
          {hasSave && (
            <button
              onClick={onContinue}
              className="px-12 py-3 text-lg font-ui font-semibold tracking-widest uppercase border border-muted-foreground/30 text-muted-foreground bg-transparent hover:bg-muted/20 hover:text-foreground transition-all duration-300 min-w-[240px]"
            >
              Continue
            </button>
          )}
        </div>

        <div className="mt-16 flex items-center gap-6 text-xs text-muted-foreground font-ui">
          <span>WASD Move</span>
          <span className="w-px h-3 bg-muted-foreground/30" />
          <span>Mouse Aim</span>
          <span className="w-px h-3 bg-muted-foreground/30" />
          <span>Click Attack</span>
          <span className="w-px h-3 bg-muted-foreground/30" />
          <span>Space Dash</span>
        </div>
      </div>
    </div>
  );
}
