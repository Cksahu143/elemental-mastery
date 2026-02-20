import { PlayerState, ElementType, ELEMENT_COLORS, SKILLS } from '../game/types';
import { unlockSkill } from '../game/engine';

interface SkillTreeProps {
  player: PlayerState;
  onClose: () => void;
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  fire: '🔥 Fire',
  ice: '❄ Ice',
  lightning: '⚡ Lightning',
  shadow: '🌑 Shadow',
  earth: '🪨 Earth',
  wind: '🌪️ Wind',
  nature: '🌿 Nature',
  void: '🕳️ Void',
};

export default function SkillTree({ player, onClose }: SkillTreeProps) {
  const handleUnlock = (skillId: string, manaCost: number) => {
    if (player.skills.includes(skillId)) return;
    if (player.statPoints < 1) return;
    // Spend 1 stat point to unlock
    player.statPoints--;
    unlockSkill(skillId);
  };

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display text-primary tracking-wider">Skill Tree</h2>
          <span className="text-sm font-ui text-accent font-bold">{player.statPoints} points available</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(SKILLS) as ElementType[]).map(element => {
            const unlocked = player.unlockedElements.includes(element);
            const skills = SKILLS[element];
            const color = ELEMENT_COLORS[element];

            return (
              <div
                key={element}
                className="border p-4 transition-colors"
                style={{
                  borderColor: unlocked ? color : 'hsl(var(--border))',
                  opacity: unlocked ? 1 : 0.4,
                }}
              >
                <h3
                  className="text-sm font-display font-bold tracking-wider mb-3 uppercase"
                  style={{ color: unlocked ? color : 'hsl(var(--muted-foreground))' }}
                >
                  {ELEMENT_LABELS[element]}
                </h3>

                <div className="space-y-2">
                  {skills.map((skill, idx) => {
                    const isOwned = player.skills.includes(skill.id);
                    const canUnlock = unlocked && !isOwned && player.level >= skill.unlockLevel && player.statPoints > 0;
                    // For branching: second skill requires first
                    const prevUnlocked = idx === 0 || player.skills.includes(skills[idx - 1].id);

                    return (
                      <div key={skill.id} className="relative">
                        {idx > 0 && (
                          <div
                            className="absolute -top-2 left-5 w-0.5 h-2"
                            style={{ backgroundColor: isOwned ? color : 'hsl(var(--border))' }}
                          />
                        )}
                        <div
                          className="flex items-center gap-3 p-2 border transition-all"
                          style={{
                            borderColor: isOwned ? color : 'hsl(var(--border))',
                            backgroundColor: isOwned ? `${color}15` : 'transparent',
                          }}
                        >
                          <div
                            className="w-8 h-8 flex items-center justify-center border text-xs font-bold"
                            style={{
                              borderColor: isOwned ? color : 'hsl(var(--muted-foreground))',
                              color: isOwned ? color : 'hsl(var(--muted-foreground))',
                              boxShadow: isOwned ? `0 0 8px ${color}40` : 'none',
                            }}
                          >
                            {isOwned ? '✓' : `L${skill.unlockLevel}`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-ui font-bold text-foreground">{skill.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{skill.description}</p>
                            <p className="text-[10px] font-ui" style={{ color }}>{skill.manaCost} MP</p>
                          </div>
                          {!isOwned && (
                            <button
                              onClick={() => handleUnlock(skill.id, skill.manaCost)}
                              disabled={!canUnlock || !prevUnlocked}
                              className="px-2 py-1 text-[10px] font-ui font-bold border transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              style={{
                                borderColor: canUnlock && prevUnlocked ? color : 'hsl(var(--border))',
                                color: canUnlock && prevUnlocked ? color : 'hsl(var(--muted-foreground))',
                              }}
                              title={
                                !unlocked ? 'Element not unlocked' :
                                !prevUnlocked ? 'Unlock previous skill first' :
                                player.level < skill.unlockLevel ? `Requires level ${skill.unlockLevel}` :
                                player.statPoints <= 0 ? 'No stat points' : 'Unlock (1 point)'
                              }
                            >
                              Unlock
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
