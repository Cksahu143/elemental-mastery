import { useEffect, useState } from 'react';
import { ELEMENT_COLORS, ElementType } from '../game/types';

const ELEMENTS: ElementType[] = ['fire', 'ice', 'lightning', 'shadow', 'earth', 'wind', 'nature', 'void'];

const LINES = [
  { speaker: 'Aethon',   text: 'It is done. The convergence is yours.' },
  { speaker: 'Malachar', text: 'You did not destroy me. You… became the answer.' },
  { speaker: 'Aethon',   text: 'Eight elements, one will. The Fifth Guardian rises.' },
  { speaker: '—',        text: 'You do not feel victory. You feel the weight of holding the world together.' },
  { speaker: '—',        text: 'You are no longer Aethon\'s student. You are the seam reality clings to.' },
];

export default function TrueEndingCutscene({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [showCard, setShowCard] = useState(false);

  useEffect(() => {
    if (step >= LINES.length) {
      const t = setTimeout(() => setShowCard(true), 800);
      return () => clearTimeout(t);
    }
  }, [step]);

  useEffect(() => {
    if (!showCard) return;
    const t = setTimeout(onComplete, 6000);
    return () => clearTimeout(t);
  }, [showCard, onComplete]);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Eight-color aura */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[480px] h-[480px]">
          {ELEMENTS.map((el, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * 180;
            const y = Math.sin(angle) * 180;
            return (
              <div
                key={el}
                className="absolute left-1/2 top-1/2 w-40 h-40 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"
                style={{
                  transform: `translate(${x - 80}px, ${y - 80}px)`,
                  background: `radial-gradient(circle, ${ELEMENT_COLORS[el]}40, transparent 70%)`,
                  filter: 'blur(20px)',
                  animationDuration: `${3 + i * 0.2}s`,
                }}
              />
            );
          })}
          <div
            className="absolute left-1/2 top-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle, white, rgba(250,204,21,0.6) 40%, transparent 80%)',
              boxShadow: '0 0 120px rgba(255,255,255,0.6)',
            }}
          />
        </div>
      </div>

      {!showCard && step < LINES.length && (
        <div
          className="relative z-10 max-w-2xl px-8 py-6 bg-black/70 border border-white/20 rounded-lg backdrop-blur-md text-center cursor-pointer"
          onClick={() => setStep(s => s + 1)}
        >
          <p className="text-[10px] font-ui uppercase tracking-[0.4em] text-yellow-300 mb-2">
            {LINES[step].speaker}
          </p>
          <p className="text-lg text-foreground/90 font-display italic">"{LINES[step].text}"</p>
          <p className="text-[10px] text-muted-foreground mt-4">click to continue</p>
        </div>
      )}

      {showCard && (
        <div className="relative z-10 text-center">
          <p className="text-[12px] font-ui uppercase tracking-[0.5em] text-yellow-300 mb-4">True Ending</p>
          <h1
            className="text-6xl font-display text-white"
            style={{ textShadow: '0 0 40px rgba(250,204,21,0.8), 0 0 80px rgba(236,72,153,0.4)' }}
          >
            The Fifth Guardian
          </h1>
          <p className="text-sm text-foreground/70 mt-6 italic">Not victory. Transformation.</p>
        </div>
      )}
    </div>
  );
}
