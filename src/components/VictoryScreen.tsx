import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import CutsceneBackground from './CutsceneBackground';
import DialogueParticles from './DialogueParticles';
import malacharPortrait from '../assets/portrait-nullex.jpg';
import victoryVideoAsset from '../assets/victory-cutscene.mp4.asset.json';

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

// Subtitle captions synced to the 5-second victory video (in seconds)
const VIDEO_CAPTIONS: { start: number; end: number; text: string }[] = [
  { start: 0.0, end: 1.2, text: 'Malachar — Architect of Ruin — falls.' },
  { start: 1.2, end: 2.4, text: 'His obsidian armor shatters into light.' },
  { start: 2.4, end: 3.5, text: 'The Bearer raises the Eight-Fold Crystal.' },
  { start: 3.5, end: 4.5, text: 'The corruption is undone.' },
  { start: 4.5, end: 5.0, text: 'Dawn breaks over the broken world.' },
];

export default function VictoryScreen({ floor, bossesDefeated, onReturnToTitle, onVisitKingdom }: VictoryScreenProps) {
  const [phase, setPhase] = useState<'video' | 'fanfare' | 'epilogue' | 'stats'>('video');
  const [lineIdx, setLineIdx] = useState(0);
  const [showLine, setShowLine] = useState(false);
  const [videoTime, setVideoTime] = useState(0);

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
    if (phase === 'video') setPhase('fanfare');
    else if (phase === 'fanfare') setPhase('epilogue');
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
      {phase !== 'video' && (
        <>
          <CutsceneBackground zone="void" intensity={2} />
          <DialogueParticles element="void" intensity={2} />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80 pointer-events-none" />
        </>
      )}

      {phase === 'video' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center animate-fade-in">
          <video
            src={victoryVideoAsset.url}
            autoPlay
            muted
            playsInline
            onEnded={() => setPhase('fanfare')}
            onError={() => setPhase('fanfare')}
            onTimeUpdate={(e) => setVideoTime((e.target as HTMLVideoElement).currentTime)}
            className="w-full h-full object-contain"
          />
          {/* Letterbox bars for cinematic feel */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-black pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-black pointer-events-none" />
          {/* Synced subtitles */}
          {(() => {
            const cap = VIDEO_CAPTIONS.find(c => videoTime >= c.start && videoTime < c.end);
            if (!cap) return null;
            return (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-2 max-w-3xl pointer-events-none">
                <p
                  key={cap.text}
                  className="text-center text-xl md:text-2xl font-display text-white animate-fade-in"
                  style={{ textShadow: '0 0 8px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,1)' }}
                >
                  {cap.text}
                </p>
              </div>
            );
          })()}
          <p className="absolute bottom-4 right-6 text-xs font-ui tracking-widest text-muted-foreground/70 animate-pulse">
            Click to skip
          </p>
        </div>
      )}

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

            <div className="mb-6 mx-auto max-w-md p-3 rounded border border-pink-500/40 bg-pink-500/5 text-center">
              <p className="text-[10px] font-ui uppercase tracking-[0.3em] text-pink-300 mb-1">A whisper remains…</p>
              <p className="text-sm text-pink-100/80 italic">
                A door remains sealed in his arena. Eight keys, eight Guardians.
              </p>
            </div>

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