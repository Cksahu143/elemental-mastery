import { useState, useEffect, useMemo, useRef } from 'react';
import portraitMalachar from '../assets/portrait-nullex.jpg';

export type QTEType = 'block' | 'dodge' | 'counter';

interface MalacharQTEProps {
  qteType?: QTEType;
  onComplete: (success: boolean) => void;
}

const QTE_CONFIG: Record<QTEType, {
  title: string;
  subtitle: string;
  accent: string;
  duration: number;
  bgGradient: string;
}> = {
  block: {
    title: 'MALACHAR STRIKES!',
    subtitle: 'SPAM [B] TO BLOCK',
    accent: '#FF0040',
    duration: 2.2,
    bgGradient: 'radial-gradient(circle at center, #4a0010 0%, #000 80%)',
  },
  dodge: {
    title: 'VOID BEAM INCOMING!',
    subtitle: 'PRESS THE ARROWS IN ORDER',
    accent: '#A855F7',
    duration: 3.0,
    bgGradient: 'radial-gradient(circle at center, #2a004a 0%, #000 80%)',
  },
  counter: {
    title: 'REFLECT THE SPELL!',
    subtitle: 'PRESS THE ELEMENT KEYS',
    accent: '#FFD700',
    duration: 3.2,
    bgGradient: 'radial-gradient(circle at center, #4a3a00 0%, #000 80%)',
  },
};

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'] as const;
const ARROW_GLYPH: Record<string, string> = {
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
};

const ELEMENT_KEYS: { key: string; name: string; color: string }[] = [
  { key: '1', name: 'Fire', color: '#FF4500' },
  { key: '2', name: 'Ice', color: '#67E8F9' },
  { key: '3', name: 'Lightning', color: '#FACC15' },
  { key: '4', name: 'Shadow', color: '#A855F7' },
  { key: '5', name: 'Earth', color: '#D97706' },
  { key: '6', name: 'Wind', color: '#6EE7B7' },
  { key: '7', name: 'Nature', color: '#4ADE80' },
  { key: '8', name: 'Void', color: '#EC4899' },
];

export default function MalacharQTE({ qteType = 'block', onComplete }: MalacharQTEProps) {
  const cfg = QTE_CONFIG[qteType];
  const [timeLeft, setTimeLeft] = useState(cfg.duration);
  const [introPhase, setIntroPhase] = useState(true);
  const completedRef = useRef(false);

  const [presses, setPresses] = useState(0);
  const REQUIRED_PRESSES = 8;

  const dodgeSequence = useMemo(
    () => Array.from({ length: 5 }, () => ARROW_KEYS[Math.floor(Math.random() * 4)]),
    []
  );
  const [dodgeIdx, setDodgeIdx] = useState(0);

  const counterSequence = useMemo(
    () => Array.from({ length: 4 }, () => ELEMENT_KEYS[Math.floor(Math.random() * ELEMENT_KEYS.length)]),
    []
  );
  const [counterIdx, setCounterIdx] = useState(0);

  const finish = (success: boolean) => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete(success);
  };

  useEffect(() => {
    const t = setTimeout(() => setIntroPhase(false), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (introPhase) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 0.05;
        if (next <= 0) {
          clearInterval(interval);
          finish(false);
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [introPhase]);

  useEffect(() => {
    if (introPhase) return;
    const handler = (e: KeyboardEvent) => {
      if (qteType === 'block') {
        if (e.key.toLowerCase() === 'b') {
          setPresses(prev => {
            const next = prev + 1;
            if (next >= REQUIRED_PRESSES) finish(true);
            return next;
          });
        }
      } else if (qteType === 'dodge') {
        if ((ARROW_KEYS as readonly string[]).includes(e.key)) {
          e.preventDefault();
          setDodgeIdx(prev => {
            if (e.key === dodgeSequence[prev]) {
              const next = prev + 1;
              if (next >= dodgeSequence.length) finish(true);
              return next;
            }
            setTimeLeft(t => Math.max(0.1, t - 0.4));
            return prev;
          });
        }
      } else if (qteType === 'counter') {
        const idx = ELEMENT_KEYS.findIndex(el => el.key === e.key);
        if (idx >= 0) {
          setCounterIdx(prev => {
            if (e.key === counterSequence[prev].key) {
              const next = prev + 1;
              if (next >= counterSequence.length) finish(true);
              return next;
            }
            setTimeLeft(t => Math.max(0.1, t - 0.5));
            return prev;
          });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [introPhase, qteType, dodgeSequence, counterSequence]);

  const timePct = (timeLeft / cfg.duration) * 100;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: cfg.bgGradient }}
    >
      {/* Letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-black z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-black z-10" />

      {/* Diagonal speed lines */}
      <div
        className="absolute inset-0 opacity-30 animate-pulse"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, ${cfg.accent}40 0px, ${cfg.accent}40 2px, transparent 2px, transparent 30px)`,
        }}
      />

      {/* Slam-in portrait */}
      <div
        className={introPhase ? 'animate-scale-in' : ''}
        style={{
          position: 'absolute',
          left: '8%',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 20,
        }}
      >
        <div className="relative" style={{ filter: `drop-shadow(0 0 40px ${cfg.accent})` }}>
          <img
            src={portraitMalachar}
            alt="Malachar"
            className="w-48 h-48 rounded-full object-cover border-4"
            style={{ borderColor: cfg.accent, boxShadow: `0 0 60px ${cfg.accent}, inset 0 0 30px ${cfg.accent}80` }}
          />
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded font-display font-bold tracking-widest text-xs whitespace-nowrap"
            style={{ background: cfg.accent, color: '#000' }}
          >
            MALACHAR
          </div>
        </div>
      </div>

      {/* Intro slam text */}
      {introPhase && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-scale-in">
          <p
            className="text-7xl font-display font-bold tracking-widest text-center px-4"
            style={{
              color: cfg.accent,
              textShadow: `0 0 60px ${cfg.accent}, 0 0 120px ${cfg.accent}, 4px 4px 0 #000`,
              transform: 'skewX(-8deg)',
            }}
          >
            {cfg.title}
          </p>
        </div>
      )}

      {/* Main QTE UI */}
      {!introPhase && (
        <div className="relative z-20 text-center space-y-6 ml-48 animate-fade-in">
          <div>
            <p
              className="text-5xl font-display font-bold tracking-widest"
              style={{ color: cfg.accent, textShadow: `0 0 40px ${cfg.accent}, 0 0 80px ${cfg.accent}80` }}
            >
              {cfg.title}
            </p>
            <p className="text-2xl font-display text-foreground mt-2 animate-pulse">
              {cfg.subtitle}
            </p>
          </div>

          {qteType === 'block' && (
            <>
              <div className="flex items-center justify-center gap-3">
                <span
                  className="text-4xl font-bold px-6 py-3 border-4 rounded animate-bounce"
                  style={{ borderColor: cfg.accent, color: cfg.accent, boxShadow: `0 0 30px ${cfg.accent}` }}
                >
                  B
                </span>
              </div>
              <div className="w-96 mx-auto">
                <div className="h-8 bg-muted/30 rounded-full overflow-hidden border-2" style={{ borderColor: cfg.accent }}>
                  <div
                    className="h-full transition-all duration-75 rounded-full"
                    style={{
                      width: `${Math.min(100, (presses / REQUIRED_PRESSES) * 100)}%`,
                      background: 'linear-gradient(90deg, #4ade80, #22c55e)',
                      boxShadow: '0 0 20px #22c55e80',
                    }}
                  />
                </div>
                <p className="text-sm font-ui text-muted-foreground mt-1">{presses}/{REQUIRED_PRESSES}</p>
              </div>
            </>
          )}

          {qteType === 'dodge' && (
            <div className="flex items-center justify-center gap-3">
              {dodgeSequence.map((k, i) => {
                const done = i < dodgeIdx;
                const active = i === dodgeIdx;
                return (
                  <div
                    key={i}
                    className={`w-16 h-16 flex items-center justify-center text-4xl font-bold rounded border-4 transition-all ${active ? 'animate-pulse scale-125' : ''}`}
                    style={{
                      borderColor: done ? '#22c55e' : active ? cfg.accent : '#666',
                      color: done ? '#22c55e' : active ? cfg.accent : '#888',
                      background: done ? '#22c55e20' : 'transparent',
                      boxShadow: active ? `0 0 30px ${cfg.accent}` : 'none',
                    }}
                  >
                    {ARROW_GLYPH[k]}
                  </div>
                );
              })}
            </div>
          )}

          {qteType === 'counter' && (
            <div className="flex items-center justify-center gap-3">
              {counterSequence.map((el, i) => {
                const done = i < counterIdx;
                const active = i === counterIdx;
                return (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-1 transition-all ${active ? 'animate-pulse scale-125' : ''}`}
                  >
                    <div
                      className="w-16 h-16 flex items-center justify-center text-3xl font-bold rounded border-4"
                      style={{
                        borderColor: done ? '#22c55e' : active ? el.color : '#666',
                        color: done ? '#22c55e' : active ? el.color : '#888',
                        background: done ? '#22c55e20' : `${el.color}10`,
                        boxShadow: active ? `0 0 30px ${el.color}` : 'none',
                      }}
                    >
                      {el.key}
                    </div>
                    <span
                      className="text-[10px] font-ui uppercase tracking-wider"
                      style={{ color: done ? '#22c55e' : active ? el.color : '#666' }}
                    >
                      {el.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="w-96 mx-auto">
            <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-75 rounded-full"
                style={{
                  width: `${timePct}%`,
                  background: timePct < 30 ? '#ef4444' : timePct < 60 ? '#f59e0b' : cfg.accent,
                }}
              />
            </div>
            <p className="text-xs font-ui text-muted-foreground mt-1">TIME: {timeLeft.toFixed(1)}s</p>
          </div>
        </div>
      )}
    </div>
  );
}