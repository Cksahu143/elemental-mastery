import { useState, useEffect } from 'react';

interface NPCDialogueProps {
  lines: { speaker: string; text: string; color?: string }[];
  onComplete: () => void;
}

export default function NPCDialogue({ lines, onComplete }: NPCDialogueProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(0);
    const fadeIn = setTimeout(() => setOpacity(1), 100);
    return () => clearTimeout(fadeIn);
  }, [currentLine]);

  const handleClick = () => {
    if (currentLine < lines.length - 1) {
      setOpacity(0);
      setTimeout(() => setCurrentLine(i => i + 1), 300);
    } else {
      onComplete();
    }
  };

  const line = lines[currentLine];

  return (
    <div
      className="fixed inset-0 bg-background/70 z-50 flex items-end justify-center pb-20 cursor-pointer"
      onClick={handleClick}
    >
      <div
        className="border px-8 py-5 max-w-lg w-full mx-4 bg-card transition-opacity duration-300"
        style={{
          opacity,
          borderColor: line.color || 'hsl(var(--primary))',
          boxShadow: `0 0 20px ${line.color || 'hsl(var(--primary))'}30`,
        }}
      >
        <p
          className="text-xs font-ui font-bold uppercase tracking-widest mb-2"
          style={{ color: line.color || 'hsl(var(--primary))' }}
        >
          {line.speaker}
        </p>
        <p className="text-sm font-display text-foreground leading-relaxed">
          {line.text}
        </p>
        <p className="text-[10px] font-ui text-muted-foreground mt-3 text-right animate-pulse">
          Click to continue
        </p>
      </div>
    </div>
  );
}
