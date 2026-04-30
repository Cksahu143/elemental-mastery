import { useEffect, useState, useRef } from 'react';

type Phase = 'adaptive' | 'convergence' | 'duel';

interface Props {
  onVictory: () => void;
  onDefeat: () => void;
}

const PHASE_INFO: Record<Phase, { name: string; flavor: string; color: string; reqHits: number; window: number }> = {
  adaptive:    { name: 'Phase 1 — Adaptive',           flavor: 'He has watched every choice.',         color: '#A855F7', reqHits: 8,  window: 1.4 },
  convergence: { name: 'Phase 2 — Elemental Convergence', flavor: 'All eight elements answer to him.', color: '#EC4899', reqHits: 10, window: 1.0 },
  duel:        { name: 'Phase 3 — True Duel',          flavor: 'No skills. No safety. Only steel.',    color: '#FACC15', reqHits: 12, window: 0.7 },
};

const KEYS = ['1', '2', '3', '4', 'a', 's', 'd', 'f', ' '];

export default function AscendedMalacharFight({ onVictory, onDefeat }: Props) {
  const [phase, setPhase] = useState<Phase>('adaptive');
  const [hits, setHits] = useState(0);
  const [hp] = useState(30000);
  const [bossHp, setBossHp] = useState(30000);
  const [playerHp, setPlayerHp] = useState(100);
  const [target, setTarget] = useState(KEYS[0]);
  const [intro, setIntro] = useState(true);
  const targetTime = useRef(performance.now());

  const cfg = PHASE_INFO[phase];

  useEffect(() => {
    if (intro) {
      const t = setTimeout(() => setIntro(false), 2400);
      return () => clearTimeout(t);
    }
  }, [intro]);

  // Pick new target on each phase change
  useEffect(() => {
    setTarget(KEYS[Math.floor(Math.random() * KEYS.length)]);
    targetTime.current = performance.now();
  }, [phase]);

  // Pressure timer — miss the window, take damage
  useEffect(() => {
    if (intro) return;
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - targetTime.current) / 1000;
      if (elapsed > cfg.window) {
        setPlayerHp(p => {
          const next = p - (phase === 'duel' ? 22 : phase === 'convergence' ? 16 : 11);
          if (next <= 0) { onDefeat(); return 0; }
          return next;
        });
        setTarget(KEYS[Math.floor(Math.random() * KEYS.length)]);
        targetTime.current = performance.now();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [intro, cfg.window, phase, onDefeat]);

  // Input
  useEffect(() => {
    if (intro) return;
    const handler = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === target.toLowerCase() || (target === ' ' && e.key === ' ')) {
        e.preventDefault();
        const dmg = phase === 'duel' ? 800 : phase === 'convergence' ? 600 : 500;
        setBossHp(b => {
          const next = Math.max(0, b - dmg);
          if (next === 0) { onVictory(); return 0; }
          return next;
        });
        setHits(h => {
          const nh = h + 1;
          if (nh >= cfg.reqHits) {
            // Advance phase
            setHits(0);
            if (phase === 'adaptive') setPhase('convergence');
            else if (phase === 'convergence') setPhase('duel');
          }
          return nh;
        });
        setTarget(KEYS[Math.floor(Math.random() * KEYS.length)]);
        targetTime.current = performance.now();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [target, phase, cfg.reqHits, onVictory, intro]);

  const minimal = phase === 'duel';
  const bossPct = (bossHp / hp) * 100;

  if (intro) {
    return (
      <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-[10px] font-ui uppercase tracking-[0.5em] text-pink-400/70 mb-3">FINAL CONVERGENCE</p>
          <h1 className="text-5xl font-display text-pink-200" style={{ textShadow: '0 0 40px #EC4899' }}>
            Ascended Malachar
          </h1>
          <p className="mt-4 italic text-pink-200/60 max-w-md mx-auto">
            "I remember every door you opened. Every key you forged. Every life you spared.
            And every one you did not."
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{
        background: minimal
          ? '#000'
          : `radial-gradient(circle at center, ${cfg.color}25, #000 80%)`,
      }}
    >
      {!minimal && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] font-ui uppercase tracking-[0.4em] text-white/60">{cfg.name}</p>
          <p className="text-xs italic text-white/50 mt-1">{cfg.flavor}</p>
        </div>
      )}

      {/* Boss HP bar */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-2/3 max-w-2xl">
        <div className="h-3 bg-black/70 border border-pink-900/60 rounded overflow-hidden">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${bossPct}%`,
              background: `linear-gradient(90deg, ${cfg.color}, #EC4899)`,
              boxShadow: `0 0 20px ${cfg.color}`,
            }}
          />
        </div>
        {!minimal && (
          <p className="text-center text-[10px] font-ui text-white/60 mt-1">
            {bossHp.toLocaleString()} / {hp.toLocaleString()}
          </p>
        )}
      </div>

      <div className="text-center mt-10">
        <div
          className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 text-6xl font-display"
          style={{
            borderColor: cfg.color,
            color: cfg.color,
            background: `radial-gradient(circle, ${cfg.color}20, transparent)`,
            boxShadow: `0 0 60px ${cfg.color}80`,
          }}
        >
          {target === ' ' ? '␣' : target.toUpperCase()}
        </div>
        <p className="text-xs text-white/60 font-ui mt-4 uppercase tracking-widest">
          Strike before he does
        </p>
      </div>

      {/* Player HP */}
      {!minimal && (
        <div className="absolute bottom-6 left-6 w-64">
          <p className="text-[10px] font-ui uppercase tracking-wider text-red-300 mb-1">Vitality</p>
          <div className="h-3 bg-black/70 border border-red-900/60 rounded overflow-hidden">
            <div
              className="h-full transition-all"
              style={{ width: `${playerHp}%`, background: 'linear-gradient(90deg, #7f1d1d, #ef4444)' }}
            />
          </div>
        </div>
      )}
      {minimal && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-900/50 rounded">
          <div className="h-full bg-red-500" style={{ width: `${playerHp}%` }} />
        </div>
      )}
    </div>
  );
}
