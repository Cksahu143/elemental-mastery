import { useRef, useEffect } from 'react';
import { ElementType } from '../game/types';

interface CutsceneBackgroundProps {
  zone: ElementType;
  intensity?: number;
}

const ZONE_VISUALS: Record<ElementType, {
  colors: string[];
  bgGradient: string;
  particleCount: number;
  speed: number;
}> = {
  fire: {
    colors: ['#F97316', '#FF4500', '#EF4444', '#FBBF24', '#DC2626'],
    bgGradient: 'radial-gradient(ellipse at 50% 80%, #1a0800 0%, #0d0200 40%, #000000 100%)',
    particleCount: 80,
    speed: 1.5,
  },
  ice: {
    colors: ['#38BDF8', '#67E8F9', '#06B6D4', '#A5F3FC', '#0EA5E9'],
    bgGradient: 'radial-gradient(ellipse at 50% 20%, #001a3d 0%, #000a1a 40%, #000005 100%)',
    particleCount: 60,
    speed: 0.8,
  },
  lightning: {
    colors: ['#EAB308', '#FDE047', '#FACC15', '#F59E0B', '#FFFFFF'],
    bgGradient: 'radial-gradient(ellipse at 50% 50%, #1a1500 0%, #0a0800 40%, #000000 100%)',
    particleCount: 50,
    speed: 2.5,
  },
  shadow: {
    colors: ['#A855F7', '#C084FC', '#8B5CF6', '#7C3AED', '#6D28D9'],
    bgGradient: 'radial-gradient(ellipse at 50% 60%, #1a0030 0%, #0a001a 40%, #000000 100%)',
    particleCount: 70,
    speed: 1.0,
  },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'float' | 'streak' | 'glow';
}

export default function CutsceneBackground({ zone, intensity = 1 }: CutsceneBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const config = ZONE_VISUALS[zone];
    const particles = particlesRef.current;

    // Initialize particles
    particles.length = 0;
    for (let i = 0; i < config.particleCount * intensity; i++) {
      particles.push(createParticle(canvas.width, canvas.height, config));
    }

    const loop = (time: number) => {
      const dt = 0.016;
      timeRef.current += dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Animated ambient light
      const t = timeRef.current;
      const pulseAlpha = 0.03 + Math.sin(t * 0.5) * 0.02;
      const gradX = 0.5 + Math.sin(t * 0.3) * 0.2;
      const gradY = 0.5 + Math.cos(t * 0.2) * 0.2;
      const grad = ctx.createRadialGradient(
        canvas.width * gradX, canvas.height * gradY, 0,
        canvas.width * gradX, canvas.height * gradY, canvas.width * 0.6
      );
      grad.addColorStop(0, `${config.colors[0]}${Math.floor(pulseAlpha * 255).toString(16).padStart(2, '0')}`);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lightning flashes
      if (zone === 'lightning' && Math.random() < 0.01) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.15})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Update and render particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * config.speed * dt * 60;
        p.y += p.vy * config.speed * dt * 60;
        p.life -= dt;

        if (p.life <= 0 || p.y < -20 || p.y > canvas.height + 20 || p.x < -20 || p.x > canvas.width + 20) {
          particles[i] = createParticle(canvas.width, canvas.height, config);
          continue;
        }

        const alpha = Math.min(1, p.life / (p.maxLife * 0.3)) * Math.min(1, (p.maxLife - p.life) / 0.5);

        if (p.type === 'glow') {
          const glowGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
          glowGrad.addColorStop(0, `${p.color}${Math.floor(alpha * 80).toString(16).padStart(2, '0')}`);
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(p.x - p.size * 3, p.y - p.size * 3, p.size * 6, p.size * 6);
        } else if (p.type === 'streak') {
          ctx.strokeStyle = `${p.color}${Math.floor(alpha * 200).toString(16).padStart(2, '0')}`;
          ctx.lineWidth = p.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 8, p.y - p.vy * 8);
          ctx.stroke();
        } else {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [zone, intensity]);

  const config = ZONE_VISUALS[zone];

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: config.bgGradient }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

function createParticle(w: number, h: number, config: typeof ZONE_VISUALS['fire']): Particle {
  const type = Math.random() < 0.15 ? 'glow' : Math.random() < 0.3 ? 'streak' : 'float';
  return {
    x: Math.random() * w,
    y: type === 'float' ? h + Math.random() * 20 : Math.random() * h,
    vx: (Math.random() - 0.5) * 1.5,
    vy: type === 'float' ? -(0.5 + Math.random() * 2) : (Math.random() - 0.5) * 1.5,
    size: type === 'glow' ? 10 + Math.random() * 20 : 1 + Math.random() * 3,
    color: config.colors[Math.floor(Math.random() * config.colors.length)],
    life: 3 + Math.random() * 5,
    maxLife: 3 + Math.random() * 5,
    type,
  };
}
