import { useEffect, useState } from 'react';
import { TRUE_KEYS, TrueKeyId } from '../game/endgame';

export type TrialId = 'restore' | 'rewrite' | 'reject';

interface TrialConfig {
  id: TrialId;
  name: string;
  reward: TrueKeyId;
  rewardName: string;
  color: string;
  intro: string;
  rule: string;
  // Mini-game: a sequence of timed key presses representing the trial mechanic.
  sequence: { prompt: string; key: string; window: number }[];
}

const TRIALS: Record<TrialId, TrialConfig> = {
  restore: {
    id: 'restore',
    name: 'Trial of Restoration',
    reward: 'balanceCore',
    rewardName: 'Balance Core',
    color: '#34D399',
    intro: 'Mend what was broken. Catch every fading mote.',
    rule: 'Press the key shown before the timer empties. Miss none.',
    sequence: [
      { prompt: 'Catch the Fire mote',      key: '1', window: 1.6 },
      { prompt: 'Catch the Ice mote',       key: '2', window: 1.4 },
      { prompt: 'Catch the Lightning mote', key: '3', window: 1.2 },
      { prompt: 'Catch the Nature mote',    key: '4', window: 1.0 },
      { prompt: 'Catch the Void mote',      key: '5', window: 0.9 },
    ],
  },
  rewrite: {
    id: 'rewrite',
    name: 'Trial of Creation',
    reward: 'creationCore',
    rewardName: 'Creation Core',
    color: '#FACC15',
    intro: 'Reshape reality on the fly. Adapt, or unravel.',
    rule: 'The element of the world keeps changing. Match the rune in time.',
    sequence: [
      { prompt: 'Form: A',  key: 'a', window: 1.2 },
      { prompt: 'Form: S',  key: 's', window: 1.1 },
      { prompt: 'Form: D',  key: 'd', window: 1.0 },
      { prompt: 'Form: F',  key: 'f', window: 0.9 },
      { prompt: 'Form: G',  key: 'g', window: 0.8 },
      { prompt: 'Form: H',  key: 'h', window: 0.7 },
    ],
  },
  reject: {
    id: 'reject',
    name: 'Trial of Freedom',
    reward: 'freedomCore',
    rewardName: 'Freedom Core',
    color: '#EC4899',
    intro: 'No element. No god. No safety net. Only you.',
    rule: 'Strike with raw will. No skills, just timing.',
    sequence: [
      { prompt: 'STRIKE', key: ' ', window: 1.0 },
      { prompt: 'STRIKE', key: ' ', window: 0.9 },
      { prompt: 'STRIKE', key: ' ', window: 0.8 },
      { prompt: 'STRIKE', key: ' ', window: 0.7 },
      { prompt: 'STRIKE', key: ' ', window: 0.6 },
      { prompt: 'STRIKE', key: ' ', window: 0.55 },
      { prompt: 'STRIKE', key: ' ', window: 0.5 },
    ],
  },
};

interface Props {
  trial: TrialId;
  onComplete: (success: boolean, reward: TrueKeyId) => void;
}

export default function TrialScreen({ trial, onComplete }: Props) {
  const cfg = TRIALS[trial];
  const [phase, setPhase] = useState<'intro' | 'play' | 'win' | 'fail'>('intro');
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(cfg.sequence[0].window);
  const [hits, setHits] = useState(0);

  // Intro autoplay
  useEffect(() => {
    if (phase !== 'intro') return;
    const t = setTimeout(() => setPhase('play'), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== 'play') return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const remain = cfg.sequence[step].window - elapsed;
      if (remain <= 0) {
        setPhase('fail');
        return;
      }
      setTimeLeft(remain);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, step, cfg.sequence]);

  // Input
  useEffect(() => {
    if (phase !== 'play') return;
    const handler = (e: KeyboardEvent) => {
      const want = cfg.sequence[step].key.toLowerCase();
      const got = e.key.toLowerCase();
      if (got === want || (want === ' ' && e.key === ' ')) {
        e.preventDefault();
        const next = step + 1;
        setHits(h => h + 1);
        if (next >= cfg.sequence.length) {
          setPhase('win');
        } else {
          setStep(next);
          setTimeLeft(cfg.sequence[next].window);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, step, cfg.sequence]);

  // Win/fail handoff
  useEffect(() => {
    if (phase === 'win') {
      const t = setTimeout(() => onComplete(true, cfg.reward), 1800);
      return () => clearTimeout(t);
    }
    if (phase === 'fail') {
      const t = setTimeout(() => {
        // Auto-restart the trial — cannot be skipped
        setStep(0);
        setHits(0);
        setTimeLeft(cfg.sequence[0].window);
        setPhase('intro');
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete, cfg]);

  const pct = Math.max(0, (timeLeft / cfg.sequence[step].window) * 100);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6"
      style={{ background: `radial-gradient(circle at center, ${cfg.color}10, #000 70%)` }}
    >
      <p className="text-[10px] font-ui uppercase tracking-[0.4em] text-muted-foreground">Trial</p>
      <h2 className="text-4xl font-display mb-2 mt-1" style={{ color: cfg.color, textShadow: `0 0 24px ${cfg.color}` }}>
        {cfg.name}
      </h2>

      {phase === 'intro' && (
        <div className="text-center max-w-lg mt-6">
          <p className="text-foreground/90 italic mb-3">"{cfg.intro}"</p>
          <p className="text-xs text-muted-foreground">{cfg.rule}</p>
        </div>
      )}

      {phase === 'play' && (
        <div className="text-center mt-8 w-full max-w-xl">
          <p className="text-xs font-ui uppercase tracking-widest text-muted-foreground mb-2">
            {step + 1} / {cfg.sequence.length}
          </p>
          <p
            className="text-5xl font-display mb-6"
            style={{ color: cfg.color, textShadow: `0 0 32px ${cfg.color}` }}
          >
            {cfg.sequence[step].prompt}
          </p>
          <div
            className="inline-block px-6 py-3 border-2 rounded-lg font-ui text-2xl tracking-widest"
            style={{ borderColor: cfg.color, color: cfg.color }}
          >
            {cfg.sequence[step].key === ' ' ? 'SPACE' : cfg.sequence[step].key.toUpperCase()}
          </div>
          <div className="h-2 w-full bg-black/60 border border-white/10 rounded mt-6 overflow-hidden">
            <div
              className="h-full transition-none"
              style={{ width: `${pct}%`, background: cfg.color, boxShadow: `0 0 12px ${cfg.color}` }}
            />
          </div>
        </div>
      )}

      {phase === 'win' && (
        <div className="text-center mt-8">
          <p className="text-xs font-ui uppercase tracking-[0.3em] text-muted-foreground">Trial Complete</p>
          <p className="text-4xl font-display mt-2" style={{ color: cfg.color, textShadow: `0 0 32px ${cfg.color}` }}>
            {cfg.rewardName} obtained
          </p>
          <p className="text-sm text-foreground/70 mt-3">Hits: {hits}/{cfg.sequence.length}</p>
        </div>
      )}

      {phase === 'fail' && (
        <div className="text-center mt-8">
          <p className="text-2xl font-display text-red-400">The trial unmakes you…</p>
          <p className="text-xs text-muted-foreground mt-2">Restarting — trials cannot be skipped.</p>
        </div>
      )}
    </div>
  );
}
