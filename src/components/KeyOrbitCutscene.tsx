import { useEffect, useState } from 'react';
import { BOSS_KEY_ZONES } from '../game/endgame';
import { ELEMENT_COLORS } from '../game/types';

export default function KeyOrbitCutscene({ onComplete }: { onComplete: () => void }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      setT(elapsed);
      if (elapsed < 4.2) raf = requestAnimationFrame(tick);
      else onComplete();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const radius = Math.max(40, 220 - t * 50);
  const flash = t > 3.6 ? Math.min(1, (t - 3.6) / 0.6) : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center overflow-hidden">
      <div className="relative w-[400px] h-[400px]">
        {/* Player silhouette */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(250,204,21,${0.4 + flash * 0.6}), transparent 70%)`,
            boxShadow: `0 0 ${60 + flash * 200}px rgba(250,204,21,${0.6 + flash * 0.4})`,
          }}
        />
        {BOSS_KEY_ZONES.map((zone, i) => {
          const angle = (i / 8) * Math.PI * 2 + t * 2.4;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
            <div
              key={zone}
              className="absolute left-1/2 top-1/2 w-8 h-8 flex items-center justify-center text-2xl transition-opacity"
              style={{
                transform: `translate(${x - 16}px, ${y - 16}px)`,
                color: ELEMENT_COLORS[zone],
                textShadow: `0 0 16px ${ELEMENT_COLORS[zone]}, 0 0 32px ${ELEMENT_COLORS[zone]}`,
                opacity: 1 - flash * 0.5,
              }}
            >
              🗝
            </div>
          );
        })}
        {flash > 0 && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, white, transparent 70%)',
              opacity: flash,
            }}
          />
        )}
      </div>
      <p
        className="absolute bottom-20 left-1/2 -translate-x-1/2 text-yellow-200 font-display text-xl tracking-[0.3em] uppercase"
        style={{ opacity: t < 3 ? 0.8 : 1 - flash }}
      >
        The door dissolves…
      </p>
    </div>
  );
}
