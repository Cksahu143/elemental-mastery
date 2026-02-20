import { useRef, useEffect, useState } from 'react';
import { ElementType } from '../game/types';

interface IntroCutsceneProps {
  onComplete: () => void;
}

const STORY_CARDS = [
  {
    title: 'In the Age of Elemental Harmony...',
    text: 'Eight great Guardians maintained balance across the realm — beings of pure elemental power, each commanding the forces of creation itself.',
    element: 'fire' as ElementType,
    color: '#F97316',
  },
  {
    title: 'The Shattering',
    text: 'Then came the Void — an endless hunger that corrupted the Guardians one by one, shattering the elemental bonds that held the world together.',
    element: 'shadow' as ElementType,
    color: '#A855F7',
  },
  {
    title: 'The Last Hope',
    text: 'You are a Fragment Bearer — a mortal soul infused with scattered elemental energy. Only you can absorb the elements, defeat the corrupted Guardians, and restore balance.',
    element: 'lightning' as ElementType,
    color: '#EAB308',
  },
  {
    title: 'Your Journey Begins',
    text: 'Start in the Volcanic Ruins, where Ignis — once Guardian of Fire — now burns with corrupted rage. Absorb the fire element and grow stronger with each victory.',
    element: 'fire' as ElementType,
    color: '#F97316',
  },
];

const ELEMENT_PARTICLE_COLORS: Record<ElementType, string[]> = {
  fire: ['#F97316', '#EF4444', '#FBBF24', '#FF6B35'],
  ice: ['#38BDF8', '#7DD3FC', '#BAE6FD', '#0EA5E9'],
  lightning: ['#EAB308', '#FDE047', '#FBBF24', '#FFF9C4'],
  shadow: ['#A855F7', '#7C3AED', '#EC4899', '#C084FC'],
  earth: ['#92400E', '#B45309', '#D97706', '#78350F'],
  wind: ['#34D399', '#6EE7B7', '#A7F3D0', '#10B981'],
  nature: ['#22C55E', '#4ADE80', '#86EFAC', '#16A34A'],
  void: ['#EC4899', '#F472B6', '#DB2777', '#BE185D'],
};

export default function IntroCutscene({ onComplete }: IntroCutsceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [cardVisible, setCardVisible] = useState(false);
  const [skipVisible, setSkipVisible] = useState(false);
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; color: string; size: number;
  }>>([]);

  const currentCard = STORY_CARDS[cardIndex];

  // Spawn initial particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth || 960;
    const H = canvas.offsetHeight || 640;
    particlesRef.current = Array.from({ length: 80 }, () => {
      const colors = ELEMENT_PARTICLE_COLORS[currentCard.element];
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 20,
        vy: -(5 + Math.random() * 25),
        life: Math.random() * 4,
        maxLife: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 1 + Math.random() * 3,
      };
    });
  }, [cardIndex]);

  // Card fade-in
  useEffect(() => {
    setCardVisible(false);
    const t = setTimeout(() => setCardVisible(true), 300);
    const s = setTimeout(() => setSkipVisible(true), 800);
    return () => { clearTimeout(t); clearTimeout(s); };
  }, [cardIndex]);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (t: number) => {
      const dt = Math.min((t - timeRef.current) / 1000, 0.05);
      timeRef.current = t;

      const W = canvas.width, H = canvas.height;
      const color = currentCard.color;
      const colors = ELEMENT_PARTICLE_COLORS[currentCard.element];

      // Background
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.8);
      bg.addColorStop(0, `${color}15`);
      bg.addColorStop(0.5, '#050510');
      bg.addColorStop(1, '#020208');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Animated energy rings
      const numRings = 4;
      for (let r = 0; r < numRings; r++) {
        const phase = (t / 1000 * 0.3 + r / numRings) % 1;
        const radius = phase * W * 0.6;
        const alpha = (1 - phase) * 0.15;
        ctx.beginPath();
        ctx.arc(W / 2, H / 2, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Central glow
      const centerGlow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 200);
      const pulse = 0.5 + 0.3 * Math.sin(t / 1000 * 1.5);
      centerGlow.addColorStop(0, `${color}${Math.round(pulse * 40).toString(16).padStart(2, '0')}`);
      centerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, W, H);

      // Element symbol in center
      ctx.save();
      ctx.font = `${80 + Math.sin(t / 1000) * 5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = 0.12 + Math.sin(t / 1000 * 0.7) * 0.04;
      ctx.fillStyle = color;
      const symbols: Record<ElementType, string> = {
        fire: '🔥', ice: '❄️', lightning: '⚡', shadow: '🌑',
        earth: '🪨', wind: '🌪️', nature: '🌿', void: '🕳️',
      };
      ctx.fillText(symbols[currentCard.element], W / 2, H / 2);
      ctx.globalAlpha = 1;
      ctx.restore();

      // Update & draw particles
      const pts = particlesRef.current;
      for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        // Respawn
        if (p.life <= 0) {
          p.x = Math.random() * W;
          p.y = H + 10;
          p.vx = (Math.random() - 0.5) * 20;
          p.vy = -(8 + Math.random() * 30);
          p.life = p.maxLife;
          p.color = colors[Math.floor(Math.random() * colors.length)];
        }

        const alpha = Math.min(p.life / p.maxLife, 1) * 0.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
      }

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85);
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, 'rgba(0,0,0,0.7)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [currentCard]);

  const handleAdvance = () => {
    if (cardIndex < STORY_CARDS.length - 1) {
      setCardVisible(false);
      setSkipVisible(false);
      setTimeout(() => setCardIndex(i => i + 1), 400);
    } else {
      setCardVisible(false);
      setTimeout(onComplete, 400);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer flex flex-col items-center justify-center"
      onClick={handleAdvance}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Story card */}
      <div
        className="relative z-10 max-w-2xl w-full mx-8 transition-all duration-500"
        style={{
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
        }}
      >
        {/* Card number */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1.5">
            {STORY_CARDS.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: i === cardIndex ? 24 : 8,
                  background: i <= cardIndex ? currentCard.color : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
          <span className="text-xs font-ui text-muted-foreground ml-auto">
            {cardIndex + 1} / {STORY_CARDS.length}
          </span>
        </div>

        {/* Card content */}
        <div
          className="rounded-2xl border p-8 backdrop-blur-md"
          style={{
            background: `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(10,5,20,0.9))`,
            borderColor: currentCard.color + '40',
            boxShadow: `0 0 40px ${currentCard.color}20, 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 ${currentCard.color}20`,
          }}
        >
          {/* Element accent */}
          <div
            className="w-12 h-1 rounded-full mb-4"
            style={{ background: `linear-gradient(90deg, ${currentCard.color}, transparent)` }}
          />

          <h2
            className="text-2xl font-display font-bold mb-3 leading-tight"
            style={{ color: currentCard.color }}
          >
            {currentCard.title}
          </h2>
          <p className="text-muted-foreground font-ui leading-relaxed text-sm">
            {currentCard.text}
          </p>

          {/* Continue hint */}
          {skipVisible && (
            <div className="mt-6 flex items-center justify-between">
              <div />
              <p className="text-xs font-ui text-muted-foreground animate-pulse">
                {cardIndex < STORY_CARDS.length - 1 ? 'Click to continue →' : 'Click to begin your journey →'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Skip button */}
      {skipVisible && (
        <button
          onClick={(e) => { e.stopPropagation(); onComplete(); }}
          className="absolute top-4 right-4 z-20 px-3 py-1.5 text-xs font-ui text-muted-foreground hover:text-foreground transition-colors bg-black/40 rounded border border-white/10 hover:border-white/30"
        >
          Skip Intro ↗
        </button>
      )}
    </div>
  );
}
