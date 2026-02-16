import { BOSS_DIALOGUES } from '../game/lore';
import { ElementType, ELEMENT_COLORS } from '../game/types';
import { useState, useEffect } from 'react';
import DialogueParticles from './DialogueParticles';

interface BossDialogueProps {
  zone: ElementType;
  onComplete: () => void;
}

export default function BossDialogue({ zone, onComplete }: BossDialogueProps) {
  const lines = BOSS_DIALOGUES[zone] || [];
  const [currentLine, setCurrentLine] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    setOpacity(0);
    const fadeIn = setTimeout(() => setOpacity(1), 100);
    const next = setTimeout(() => {
      if (currentLine < lines.length - 1) {
        setOpacity(0);
        setTimeout(() => setCurrentLine(i => i + 1), 400);
      } else {
        setOpacity(0);
        setTimeout(onComplete, 400);
      }
    }, 2500);
    return () => { clearTimeout(fadeIn); clearTimeout(next); };
  }, [currentLine, lines.length, onComplete]);

  return (
    <div className="fixed inset-0 bg-background/80 z-50 flex items-end justify-center pb-24">
      <DialogueParticles element={zone} intensity={1.5} />
      <div
        className="border px-8 py-4 max-w-lg text-center transition-opacity duration-300 z-50 bg-card/90 backdrop-blur-sm"
        style={{
          opacity,
          borderColor: ELEMENT_COLORS[zone],
          boxShadow: `0 0 20px ${ELEMENT_COLORS[zone]}40`,
        }}
      >
        <p className="text-lg font-display" style={{ color: ELEMENT_COLORS[zone] }}>
          {lines[currentLine]}
        </p>
      </div>
    </div>
  );
}
