import { useEffect, useState } from 'react';
import { ELEMENT_COLORS, ElementType } from '../game/types';

const ELEMENTS: ElementType[] = ['fire', 'ice', 'lightning', 'shadow', 'earth', 'wind', 'nature', 'void'];

interface Props {
  onReachBoss: () => void;
  onAbandon: () => void;
}

// Lightweight narrative-gameplay traversal of 5 hybrid rooms before the
// Ascended Malachar fight. Each "room" demands timed input under shifting elements.
export default function ConvergenceDungeon({ onReachBoss, onAbandon }: Props) {
  const [room, setRoom] = useState(0);
  const [shift, setShift] = useState<[ElementType, ElementType]>(['fire', 'void']);
  const [hits, setHits] = useState(0);
  const [target, setTarget] = useState<number>(1);
  const REQUIRED = 4;
  const TOTAL_ROOMS = 5;

  // Element shifter
  useEffect(() => {
    const id = setInterval(() => {
      const a = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      let b = ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)];
      if (b === a) b = ELEMENTS[(ELEMENTS.indexOf(a) + 1) % ELEMENTS.length];
      setShift([a, b]);
      setTarget(1 + Math.floor(Math.random() * 4));
    }, 2200);
    return () => clearInterval(id);
  }, [room]);

  // Input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === String(target)) {
        setHits(h => {
          const next = h + 1;
          if (next >= REQUIRED) {
            const nextRoom = room + 1;
            if (nextRoom >= TOTAL_ROOMS) {
              onReachBoss();
            } else {
              setRoom(nextRoom);
              return 0;
            }
          }
          return next;
        });
      } else if (e.key === 'Escape') {
        onAbandon();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [target, room, onReachBoss, onAbandon]);

  const [a, b] = shift;
  const grad = `linear-gradient(135deg, ${ELEMENT_COLORS[a]}, ${ELEMENT_COLORS[b]})`;

  return (
    <div
      className="fixed inset-0 z-[55] flex flex-col items-center justify-center p-6 transition-all duration-700"
      style={{ background: `radial-gradient(circle at center, ${ELEMENT_COLORS[a]}30, ${ELEMENT_COLORS[b]}40, #000 80%)` }}
    >
      <p className="text-[10px] font-ui uppercase tracking-[0.4em] text-white/60">Convergence Dungeon</p>
      <h2
        className="text-4xl font-display mt-2 mb-1 bg-clip-text text-transparent"
        style={{ backgroundImage: grad }}
      >
        Room {room + 1} / {TOTAL_ROOMS}
      </h2>
      <p className="text-xs text-white/70 mb-8">
        Hybrid Element: <span style={{ color: ELEMENT_COLORS[a] }}>{a}</span>
        <span className="mx-2 text-white/40">+</span>
        <span style={{ color: ELEMENT_COLORS[b] }}>{b}</span>
      </p>

      <div
        className="w-32 h-32 rounded-full flex items-center justify-center text-6xl font-display border-4 mb-6"
        style={{ borderImage: `${grad} 1`, borderColor: ELEMENT_COLORS[a], boxShadow: `0 0 40px ${ELEMENT_COLORS[b]}80` }}
      >
        {target}
      </div>
      <p className="text-sm text-white/80 mb-2">Press the matching number to break the convergence</p>

      <div className="w-64 h-2 bg-black/60 border border-white/20 rounded overflow-hidden">
        <div
          className="h-full transition-all duration-200"
          style={{ width: `${(hits / REQUIRED) * 100}%`, background: grad }}
        />
      </div>

      <p className="text-[10px] text-white/40 mt-8 uppercase tracking-widest">
        [Esc] Retreat to the chamber
      </p>
    </div>
  );
}
