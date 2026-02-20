import { useEffect, useRef } from 'react';
import { ElementType, ELEMENT_COLORS } from '../game/types';

interface DialogueParticlesProps {
  element?: ElementType;
  intensity?: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  glow: number;
}

const ZONE_PARTICLE_CONFIGS: Record<ElementType, { colors: string[]; gravity: number; speed: number; sizeRange: [number, number]; count: number }> = {
  fire: {
    colors: ['#F97316', '#FF4500', '#FFD700', '#FF6B35', '#DC2626'],
    gravity: -0.3,
    speed: 1.2,
    sizeRange: [1, 4],
    count: 60,
  },
  ice: {
    colors: ['#38BDF8', '#67E8F9', '#E0F2FE', '#BAE6FD', '#7DD3FC'],
    gravity: 0.05,
    speed: 0.5,
    sizeRange: [1, 3],
    count: 50,
  },
  lightning: {
    colors: ['#EAB308', '#FDE047', '#FBBF24', '#FCD34D', '#FFFFFF'],
    gravity: 0,
    speed: 3,
    sizeRange: [1, 2],
    count: 40,
  },
  shadow: {
    colors: ['#A855F7', '#7C3AED', '#6D28D9', '#C084FC', '#581C87'],
    gravity: 0.1,
    speed: 0.8,
    sizeRange: [2, 5],
    count: 45,
  },
  earth: {
    colors: ['#92400E', '#B45309', '#D97706', '#78350F', '#A16207'],
    gravity: 0.3,
    speed: 0.6,
    sizeRange: [2, 6],
    count: 40,
  },
  wind: {
    colors: ['#34D399', '#6EE7B7', '#10B981', '#A7F3D0', '#FFFFFF'],
    gravity: -0.1,
    speed: 4.0,
    sizeRange: [1, 3],
    count: 70,
  },
  nature: {
    colors: ['#22C55E', '#4ADE80', '#86EFAC', '#16A34A', '#BBF7D0'],
    gravity: -0.05,
    speed: 0.9,
    sizeRange: [1, 4],
    count: 55,
  },
  void: {
    colors: ['#EC4899', '#F472B6', '#DB2777', '#BE185D', '#FBCFE8'],
    gravity: 0.0,
    speed: 1.5,
    sizeRange: [2, 5],
    count: 50,
  },
};

export default function DialogueParticles({ element = 'fire', intensity = 1 }: DialogueParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Spark[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const config = ZONE_PARTICLE_CONFIGS[element];
    particlesRef.current = [];

    const spawnParticle = (): Spark => {
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];
      const life = 2 + Math.random() * 4;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * config.speed * 30,
        vy: (Math.random() - 0.5) * config.speed * 30,
        size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
        life,
        maxLife: life,
        color,
        glow: 5 + Math.random() * 15,
      };
    };

    // Initial spawn
    const count = Math.floor(config.count * intensity);
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(spawnParticle());
    }

    let lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += config.gravity * 60 * dt;
        p.life -= dt;

        if (p.life <= 0 || p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50) {
          particlesRef.current[i] = spawnParticle();
          // Spawn from edges for fire (bottom), ice (top), lightning (random), shadow (edges)
          const np = particlesRef.current[i];
          if (element === 'fire') {
            np.y = canvas.height + 10;
            np.vy = -(30 + Math.random() * 60);
          } else if (element === 'ice') {
            np.y = -10;
            np.vy = 10 + Math.random() * 20;
            np.vx = (Math.random() - 0.5) * 40;
          } else if (element === 'lightning') {
            np.x = Math.random() * canvas.width;
            np.y = Math.random() * canvas.height;
          }
          continue;
        }

        const alpha = Math.min(1, (p.life / p.maxLife) * 2) * 0.6;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.glow;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [element, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ opacity: 0.7 }}
    />
  );
}
