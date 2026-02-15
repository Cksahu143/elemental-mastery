import { useState, useEffect } from 'react';

interface CutsceneLine {
  speaker: string;
  text: string;
  color: string;
}

interface StoryCutsceneProps {
  lines: CutsceneLine[];
  title?: string;
  onComplete: () => void;
}

export default function StoryCutscene({ lines, title, onComplete }: StoryCutsceneProps) {
  const [currentLine, setCurrentLine] = useState(-1);
  const [opacity, setOpacity] = useState(0);
  const [titleVisible, setTitleVisible] = useState(!!title);

  useEffect(() => {
    if (titleVisible) {
      setOpacity(1);
      const timer = setTimeout(() => {
        setOpacity(0);
        setTimeout(() => { setTitleVisible(false); setCurrentLine(0); }, 600);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [titleVisible]);

  useEffect(() => {
    if (currentLine < 0) return;
    setOpacity(0);
    const fadeIn = setTimeout(() => setOpacity(1), 100);
    return () => clearTimeout(fadeIn);
  }, [currentLine]);

  const handleClick = () => {
    if (titleVisible) return;
    if (currentLine < lines.length - 1) {
      setOpacity(0);
      setTimeout(() => setCurrentLine(i => i + 1), 300);
    } else {
      setOpacity(0);
      setTimeout(onComplete, 300);
    }
  };

  const line = currentLine >= 0 ? lines[currentLine] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
      onClick={handleClick}
      style={{ background: 'radial-gradient(ellipse at center, hsl(var(--card)) 0%, hsl(var(--background)) 100%)' }}
    >
      {titleVisible && (
        <div className="text-center transition-opacity duration-500" style={{ opacity }}>
          <h2 className="text-3xl font-display text-primary tracking-widest text-glow-fire mb-2">
            {title}
          </h2>
          <div className="w-32 h-0.5 bg-primary/40 mx-auto" />
        </div>
      )}

      {line && (
        <div className="max-w-xl w-full mx-4 flex flex-col items-center">
          {/* Character portrait area */}
          <div
            className="w-20 h-20 rounded-full border-2 mb-4 flex items-center justify-center text-3xl transition-opacity duration-300"
            style={{
              opacity,
              borderColor: line.color,
              boxShadow: `0 0 30px ${line.color}40`,
              background: `radial-gradient(circle, ${line.color}20 0%, transparent 70%)`,
            }}
          >
            {line.speaker.includes('Ignis') || line.speaker.includes('Ember') || line.speaker.includes('Kael')
              ? '🔥'
              : line.speaker.includes('Glacius') || line.speaker.includes('Frost')
              ? '❄️'
              : line.speaker.includes('Voltaris') || line.speaker.includes('Thunder')
              ? '⚡'
              : line.speaker.includes('Umbra') || line.speaker.includes('Void')
              ? '🌑'
              : line.speaker.includes('Four')
              ? '✦'
              : '👁️'}
          </div>

          {/* Dialogue box */}
          <div
            className="border px-8 py-5 w-full bg-card transition-opacity duration-300"
            style={{
              opacity,
              borderColor: line.color,
              boxShadow: `0 0 25px ${line.color}25, inset 0 0 15px ${line.color}08`,
            }}
          >
            <p
              className="text-xs font-ui font-bold uppercase tracking-[0.2em] mb-2"
              style={{ color: line.color }}
            >
              {line.speaker}
            </p>
            <p className="text-sm font-display text-foreground leading-relaxed">
              {line.text}
            </p>
          </div>

          <p className="text-[10px] font-ui text-muted-foreground mt-3 animate-pulse">
            Click to continue
          </p>
        </div>
      )}
    </div>
  );
}
