import { QUESTS, QuestState } from '../game/story';

interface QuestTrackerProps {
  questState: QuestState;
  onOpenMap: () => void;
}

export default function QuestTracker({ questState, onOpenMap }: QuestTrackerProps) {
  // Show the first active main quest, fallback to first active side quest
  const mainQuest = questState.active
    .map(id => QUESTS.find(q => q.id === id))
    .find(q => q?.type === 'main');
  const tracked = mainQuest || questState.active
    .map(id => QUESTS.find(q => q.id === id))
    .find(Boolean);

  if (!tracked) return null;

  const nextObj = tracked.objectives.find(obj => {
    const current = questState.objectives[obj.id] || 0;
    return current < obj.required;
  });

  return (
    <div className="pointer-events-auto">
      <button
        onClick={onOpenMap}
        className="bg-card/80 backdrop-blur-sm border border-border rounded px-3 py-2 text-left hover:bg-card/95 transition-colors max-w-[200px]"
      >
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px]">{tracked.type === 'main' ? '⭐' : '📌'}</span>
          <span className="text-[10px] font-ui font-bold text-foreground truncate">{tracked.title}</span>
        </div>
        {nextObj && (
          <div className="flex items-center gap-1.5">
            <span className="text-[8px]">▸</span>
            <span className="text-[9px] font-ui text-muted-foreground truncate">{nextObj.text}</span>
            <span className="text-[8px] font-ui text-muted-foreground ml-auto">
              {questState.objectives[nextObj.id] || 0}/{nextObj.required}
            </span>
          </div>
        )}
        <p className="text-[8px] font-ui text-muted-foreground/60 mt-1">Press M for Map</p>
      </button>
    </div>
  );
}
