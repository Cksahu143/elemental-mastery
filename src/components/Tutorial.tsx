import { useState } from 'react';

interface TutorialProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Welcome, Fragment Bearer',
    text: 'You have awoken in the ruins of a shattered world. The elements are in chaos — and you are the key to restoring balance.',
    keys: null,
  },
  {
    title: 'Movement',
    text: 'Use WASD to move through the dungeon. Explore carefully — enemies lurk in every room.',
    keys: ['W', 'A', 'S', 'D'],
  },
  {
    title: 'Aim & Attack',
    text: 'Aim with your mouse and click to fire elemental projectiles at enemies.',
    keys: ['🖱 Aim', 'Click Attack'],
  },
  {
    title: 'Dash',
    text: 'Press SPACE while moving to dash, granting brief invincibility. Use it to dodge enemy attacks!',
    keys: ['SPACE'],
  },
  {
    title: 'Skills',
    text: 'Unlock abilities in the Skill Tree, then press 1-4 to cast them. Each skill costs mana.',
    keys: ['1', '2', '3', '4'],
  },
  {
    title: 'Progression',
    text: 'Defeat enemies to earn XP. Level up to gain stat points for Attack, Defense, Speed, and Elemental Power. Defeat bosses every 5 floors to unlock new elements!',
    keys: null,
  },
  {
    title: 'Ready?',
    text: 'Clear each room to reveal the exit. May the elements guide you, Bearer.',
    keys: null,
  },
];

export default function Tutorial({ onComplete }: TutorialProps) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4 border border-primary/30 bg-card p-8 text-center"
        style={{ boxShadow: '0 0 40px rgba(249,115,22,0.1)' }}>
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-colors"
              style={{
                backgroundColor: i === step ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
              }}
            />
          ))}
        </div>

        <h2 className="text-xl font-display font-bold text-primary tracking-wider mb-4">
          {current.title}
        </h2>
        <p className="text-sm font-ui text-foreground/80 leading-relaxed mb-6">
          {current.text}
        </p>

        {current.keys && (
          <div className="flex justify-center gap-2 mb-6">
            {current.keys.map(k => (
              <span
                key={k}
                className="px-3 py-1.5 text-xs font-ui font-bold border border-primary/40 text-primary bg-primary/5 tracking-wider"
              >
                {k}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-2 text-sm font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
            className="px-6 py-2 text-sm font-ui font-bold uppercase tracking-wider border border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            {isLast ? 'Begin' : 'Next'}
          </button>
        </div>

        <button
          onClick={onComplete}
          className="mt-4 text-xs font-ui text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
}
