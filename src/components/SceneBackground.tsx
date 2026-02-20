import { useRef, useMemo, useState, useEffect } from 'react';
import { ElementType } from '../game/types';

const ZONE_CONFIGS: Record<ElementType, { baseColor: string; accentColor: string; fogColor: string; particleColor: string }> = {
  fire: { baseColor: '#1a0500', accentColor: '#F97316', fogColor: '#0d0200', particleColor: '#FF6B35' },
  ice: { baseColor: '#000a1a', accentColor: '#38BDF8', fogColor: '#00051a', particleColor: '#67E8F9' },
  lightning: { baseColor: '#0a0800', accentColor: '#EAB308', fogColor: '#050400', particleColor: '#FDE047' },
  shadow: { baseColor: '#0a001a', accentColor: '#A855F7', fogColor: '#05000d', particleColor: '#C084FC' },
  earth: { baseColor: '#1a0c00', accentColor: '#92400E', fogColor: '#0d0700', particleColor: '#D97706' },
  wind: { baseColor: '#001a10', accentColor: '#34D399', fogColor: '#000d08', particleColor: '#6EE7B7' },
  nature: { baseColor: '#001a00', accentColor: '#22C55E', fogColor: '#000d00', particleColor: '#4ADE80' },
  void: { baseColor: '#1a0020', accentColor: '#EC4899', fogColor: '#0d0010', particleColor: '#F472B6' },
};

function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('webgl2') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

// CSS-based fallback background with animated gradients
function CSSFallbackBackground({ zone }: { zone: ElementType }) {
  const config = ZONE_CONFIGS[zone];
  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: -1,
        background: `radial-gradient(ellipse at 30% 20%, ${config.accentColor}15 0%, transparent 50%),
                      radial-gradient(ellipse at 70% 80%, ${config.particleColor}10 0%, transparent 50%),
                      ${config.baseColor}`,
      }}
    >
      {/* Animated floating dots via CSS */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: config.particleColor,
            opacity: Math.random() * 0.4 + 0.1,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

interface SceneBackgroundProps {
  zone: ElementType;
  className?: string;
}

export default function SceneBackground({ zone, className = '' }: SceneBackgroundProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);
  const [WebGLScene, setWebGLScene] = useState<React.ComponentType<{ zone: ElementType }> | null>(null);

  useEffect(() => {
    const supported = checkWebGLSupport();
    setWebglSupported(supported);
    if (supported) {
      // Dynamically import Three.js only if WebGL works
      import('./SceneBackground3D').then(mod => {
        setWebGLScene(() => mod.default);
      }).catch(() => {
        setWebglSupported(false);
      });
    }
  }, []);

  if (webglSupported === false || !WebGLScene) {
    return <CSSFallbackBackground zone={zone} />;
  }

  return <WebGLScene zone={zone} />;
}
