import { useState, useEffect, useCallback } from 'react';
import { ELEMENT_COLORS } from '../game/types';

interface MalacharQTEProps {
  onComplete: (blocked: boolean) => void;
}

export default function MalacharQTE({ onComplete }: MalacharQTEProps) {
  const [presses, setPresses] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2.0);
  const REQUIRED_PRESSES = 8;

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 0.05;
        if (next <= 0) {
          clearInterval(interval);
          onComplete(false);
          return 0;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'b') {
        setPresses(prev => {
          const next = prev + 1;
          if (next >= REQUIRED_PRESSES) {
            onComplete(true);
          }
          return next;
        });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onComplete]);

  const progress = Math.min(100, (presses / REQUIRED_PRESSES) * 100);
  const timePct = (timeLeft / 2.0) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      <div className="text-center space-y-6">
        {/* Dramatic title */}
        <div className="animate-pulse">
          <p className="text-5xl font-display font-bold tracking-widest" style={{ color: '#FF0040', textShadow: '0 0 40px #FF0040, 0 0 80px #FF004060' }}>
            MALACHAR STRIKES!
          </p>
        </div>
        
        <p className="text-2xl font-display text-foreground animate-bounce">
          SPAM <span className="text-4xl font-bold px-3 py-1 border-2 border-accent rounded mx-2">B</span> TO BLOCK!
        </p>

        {/* Progress bar */}
        <div className="w-80 mx-auto">
          <div className="h-6 bg-muted/30 rounded-full overflow-hidden border border-border">
            <div
              className="h-full transition-all duration-75 rounded-full"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, #4ade80, #22c55e)`,
                boxShadow: '0 0 20px #22c55e80',
              }}
            />
          </div>
          <p className="text-sm font-ui text-muted-foreground mt-1">{presses}/{REQUIRED_PRESSES}</p>
        </div>

        {/* Timer bar */}
        <div className="w-80 mx-auto">
          <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-75 rounded-full"
              style={{
                width: `${timePct}%`,
                background: timePct < 30 ? '#ef4444' : timePct < 60 ? '#f59e0b' : '#3b82f6',
              }}
            />
          </div>
          <p className="text-xs font-ui text-muted-foreground mt-1">TIME: {timeLeft.toFixed(1)}s</p>
        </div>
      </div>
    </div>
  );
}
