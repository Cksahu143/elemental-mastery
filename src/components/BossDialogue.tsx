import { BOSS_DIALOGUES } from '../game/lore';
import { ElementType, ELEMENT_COLORS } from '../game/types';
import { useState, useEffect } from 'react';
import DialogueParticles from './DialogueParticles';
import CutsceneBackground from './CutsceneBackground';
import { getPortrait } from '../game/portraits';

interface BossDialogueProps {
  zone: ElementType | 'malachar';
  onComplete: () => void;
}

export default function BossDialogue({ zone, onComplete }: BossDialogueProps) {
  const lines = BOSS_DIALOGUES[zone] || [];
  const [currentLine, setCurrentLine] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const color = zone === 'malachar' ? '#991B1B' : ELEMENT_COLORS[zone as ElementType];

  // Map zone to boss speaker for portrait lookup
  const bossNames: Record<string, string> = {
    fire: 'Ember Lord Kael', ice: 'Frostbane', lightning: 'Thunderclaw',
    shadow: 'Voidmaw', earth: 'Stone Colossus', wind: 'Tempest Drake',
    nature: 'Thornlord', void: 'Nullex', malachar: 'Malachar',
  };
  const bossName = bossNames[zone] || zone;
  const portrait = getPortrait(bossName);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center pb-24">
      <CutsceneBackground zone={zone === 'malachar' ? 'void' : zone as ElementType} intensity={2} />
      <DialogueParticles element={zone === 'malachar' ? 'void' : zone as ElementType} intensity={1.5} />
      <div className="flex flex-col items-center z-50">
        {portrait && (
          <img
            src={portrait}
            alt={bossName}
            className="w-24 h-24 rounded-full border-2 mb-3 object-cover"
            style={{
              opacity,
              borderColor: color,
              boxShadow: `0 0 40px ${color}60`,
              transition: 'opacity 0.3s',
            }}
          />
        )}
        <div
          className="border px-8 py-4 max-w-lg text-center transition-opacity duration-300 bg-card/90 backdrop-blur-sm"
          style={{
            opacity,
            borderColor: color,
            boxShadow: `0 0 20px ${color}40`,
          }}
        >
          <p className="text-xs font-ui font-bold uppercase tracking-widest mb-1" style={{ color }}>
            {bossName}
          </p>
          <p className="text-lg font-display" style={{ color }}>
            {lines[currentLine]}
          </p>
        </div>
      </div>
    </div>
  );
}
