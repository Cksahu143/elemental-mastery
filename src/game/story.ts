// ─── Guide, Villain, and Expanded Story System ───
import { ElementType } from './types';

// ═══════════════════════════════════════════
// AETHON — The Guide / Mentor
// ═══════════════════════════════════════════
export const GUIDE_NAME = 'Aethon';
export const GUIDE_TITLE = 'Aethon, the Last Chronicler';
export const GUIDE_COLOR = '#60A5FA';
export const GUIDE_ICON = '📘';

// ═══════════════════════════════════════════
// MALACHAR — The Main Villain
// ═══════════════════════════════════════════
export const VILLAIN_NAME = 'Malachar';
export const VILLAIN_TITLE = 'Malachar, the Architect of Ruin';
export const VILLAIN_COLOR = '#991B1B';
export const VILLAIN_ICON = '👁️‍🗨️';

// ═══════════════════════════════════════════
// INTRO GUIDE DIALOGUE (replaces "Mysterious Voice")
// ═══════════════════════════════════════════
export const GUIDE_INTRO_DIALOGUE = [
  { speaker: GUIDE_TITLE, text: 'You stir at last... I have waited centuries for someone like you.', color: GUIDE_COLOR },
  { speaker: GUIDE_NAME, text: 'I am Aethon — once a scholar of the old world. Now... merely a chronicler of its ruins.', color: GUIDE_COLOR },
  { speaker: GUIDE_NAME, text: 'The Shattering broke more than the land. It broke the Guardians, the balance, everything.', color: GUIDE_COLOR },
  { speaker: GUIDE_NAME, text: 'But it was no accident. A man named Malachar orchestrated it all.', color: '#DC2626' },
  { speaker: GUIDE_NAME, text: 'He was once the Fifth Guardian — the one who kept the others in harmony.', color: GUIDE_COLOR },
  { speaker: GUIDE_NAME, text: 'He believed the world was flawed. That it needed to be... unmade and reforged in his image.', color: GUIDE_COLOR },
  { speaker: GUIDE_NAME, text: 'The fire element burns strongest here. Absorb its shards and grow stronger.', color: '#F97316' },
  { speaker: GUIDE_NAME, text: 'Press 1-4 to cast abilities. Defeat the corrupted Guardians. Reclaim the elements.', color: '#EAB308' },
  { speaker: GUIDE_NAME, text: 'I will guide you, Fragment Bearer. Open your Map with M to see the world.', color: GUIDE_COLOR },
  { speaker: GUIDE_NAME, text: 'And remember — Malachar is watching. He knows you have awakened.', color: '#DC2626' },
];

// ═══════════════════════════════════════════
// VILLAIN TAUNTS — appear at end of each boss fight
// ═══════════════════════════════════════════
export const VILLAIN_TAUNTS: Record<ElementType, { speaker: string; text: string; color: string }[]> = {
  fire: [
    { speaker: VILLAIN_NAME, text: 'So you defeated Kael. Impressive... for an insect.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'Ignis was the weakest of them. You have proven nothing.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'Enjoy your little flame, Bearer. It will not save you from what comes.', color: VILLAIN_COLOR },
  ],
  ice: [
    { speaker: VILLAIN_NAME, text: 'Glacius\'s tears freeze no more... How sentimental.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'You collect fragments like a child collects stones. You understand nothing.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'The cold was meant to preserve my masterpiece. You have merely... delayed it.', color: VILLAIN_COLOR },
  ],
  lightning: [
    { speaker: VILLAIN_NAME, text: 'Voltaris always was too fast for his own good. Now his speed is yours.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'Three elements. You think that makes you strong? I held FIVE.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'The closer you get, the more you feed my design. Keep coming, little Bearer.', color: VILLAIN_COLOR },
  ],
  shadow: [
    { speaker: VILLAIN_NAME, text: 'Umbra imprisoned me once. Now her power flows through YOU? Delicious irony.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'Four elements... You are becoming dangerous. I shall have to take notice.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'Come to me when you are ready. I am in the Heart of the Abyss. I will be waiting.', color: '#FF0000' },
  ],
  earth: [
    { speaker: VILLAIN_NAME, text: 'Terrath... my old friend. Even in death, you serve my purpose.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'Every Guardian you free weakens the prison and strengthens the key.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'You do not realize it yet, but you are building my weapon for me.', color: VILLAIN_COLOR },
  ],
  wind: [
    { speaker: VILLAIN_NAME, text: 'Six elements. The convergence approaches, and you do not even know what it means.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'Aethon has not told you everything, has he? Ask him about the Fifth Element.', color: VILLAIN_COLOR },
  ],
  nature: [
    { speaker: VILLAIN_NAME, text: 'Seven elements unified... You are almost complete.', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'When you claim the void shard, the gate will open. And I will be free at last.', color: '#FF0000' },
    { speaker: VILLAIN_NAME, text: 'Thank you, Fragment Bearer. You have done exactly what I needed.', color: VILLAIN_COLOR },
  ],
  void: [
    { speaker: VILLAIN_NAME, text: 'YES! All eight elements! The prison SHATTERS!', color: '#FF0000' },
    { speaker: VILLAIN_NAME, text: 'Did you truly believe you were the hero of this story?', color: VILLAIN_COLOR },
    { speaker: VILLAIN_NAME, text: 'You were the KEY. And now... I AM FREE.', color: '#FF0000' },
    { speaker: GUIDE_NAME, text: 'No... Bearer, I am sorry. I should have told you sooner.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Malachar was sealed by the eight elements. By gathering them... you broke the seal.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'But do not despair. You hold his power now. You CAN defeat him.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'The Heart of the Abyss awaits. This is the final battle. Go, Fragment Bearer.', color: '#FFD700' },
  ],
};

// ═══════════════════════════════════════════
// GUIDE ZONE COMMENTARY — replaces "Mysterious Voice" / "Echo" entries
// ═══════════════════════════════════════════
export const GUIDE_ZONE_DIALOGUES: Record<ElementType, { speaker: string; text: string; color: string }[]> = {
  fire: [],
  ice: [
    { speaker: GUIDE_NAME, text: 'The Frozen Wastes... I visited here once, long ago. The beauty was breathtaking.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Glacius froze her tears into crystals. Each one holds a memory of the old world.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Be careful — ice enemies resist cold. Use your fire to melt their armor.', color: '#F97316' },
  ],
  lightning: [
    { speaker: GUIDE_NAME, text: 'The Storm Citadel. Voltaris\'s final warning still echoes here.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: '"It comes from within." He was talking about Malachar. We just didn\'t know.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Lightning enemies are fast. Slow them with ice, or match their speed.', color: '#38BDF8' },
  ],
  shadow: [
    { speaker: GUIDE_NAME, text: 'The Abyssal Hollow... This is where Malachar was first imprisoned.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Umbra sacrificed herself to seal him here. The shadows are her chains.', color: '#A855F7' },
    { speaker: GUIDE_NAME, text: 'Shadow enemies drain life. Your shadow skills can heal you — use that wisely.', color: '#A855F7' },
  ],
  earth: [
    { speaker: GUIDE_NAME, text: 'The Ancient Badlands. Terrath once built great cities from living stone.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Malachar corrupted him last. The earth remembers his screams.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Earth enemies are heavily armored. Lightning can crack their defenses.', color: '#EAB308' },
  ],
  wind: [
    { speaker: GUIDE_NAME, text: 'The Sky Peaks. The air here is thin and treacherous.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Zephyros was Malachar\'s closest friend before the betrayal. This corrupted him most deeply.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Wind enemies are agile. Earth slows them. Use your positioning carefully.', color: '#92400E' },
  ],
  nature: [
    { speaker: GUIDE_NAME, text: 'The Verdant Depths. Sylvara wept when she saw what Malachar had done.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Her tears became thorns. The forest itself turned hostile.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Nature enemies regenerate. Burn them fast with fire, or void erases them.', color: '#F97316' },
  ],
  void: [
    { speaker: GUIDE_NAME, text: 'Bearer... this is it. The Abyss. Malachar\'s prison.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'I must tell you something. When you claim the void shard...', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: '...the seal on Malachar will break. All eight elements are the key.', color: '#FF0000' },
    { speaker: GUIDE_NAME, text: 'I should have told you sooner. But without the shards, you cannot fight him.', color: GUIDE_COLOR },
    { speaker: GUIDE_NAME, text: 'Defeat Nullex. Claim the final element. And then face Malachar himself.', color: '#FFD700' },
  ],
};

// ═══════════════════════════════════════════
// MALACHAR FINAL BOSS DIALOGUES
// ═══════════════════════════════════════════
export const MALACHAR_BOSS_DIALOGUE = [
  "At last... we meet, little Fragment Bearer.",
  "I am Malachar. I was the Fifth Guardian — the one who held the others together.",
  "And I am the one who TORE THEM APART.",
  "Show me what eight elements can do against the one who CREATED them.",
];

export const MALACHAR_POST_DEFEAT = [
  { speaker: VILLAIN_NAME, text: 'Im...possible... I am... the Architect... I cannot...', color: VILLAIN_COLOR },
  { speaker: VILLAIN_NAME, text: 'You... you hold all eight... and the fifth... my power...', color: VILLAIN_COLOR },
  { speaker: GUIDE_NAME, text: 'It is done, Bearer. Malachar falls. The corruption dies with him.', color: GUIDE_COLOR },
  { speaker: GUIDE_NAME, text: 'The Guardians are free at last. Their echoes can finally rest.', color: '#FFD700' },
  { speaker: 'Echo of the Guardians', text: 'Thank you, Fragment Bearer. The world remembers.', color: '#FFD700' },
  { speaker: GUIDE_NAME, text: 'And so the story ends... or perhaps, it truly begins.', color: GUIDE_COLOR },
  { speaker: GUIDE_NAME, text: 'The kingdom is yours now. Rebuild. Grow. The world is in your hands.', color: GUIDE_COLOR },
];

// ═══════════════════════════════════════════
// EXPANDED LORE — Additional entries
// ═══════════════════════════════════════════
export const EXPANDED_LORE = [
  // Malachar lore
  {
    id: 'villain_origin',
    title: 'The Fifth Guardian',
    text: 'Before there were four, there were five. Malachar was the Guardian of Harmony — the one who kept fire from consuming ice, shadow from devouring light. Without him, the elements would have warred. With him, they sang.',
    category: 'corruption' as const,
    unlocked: false,
  },
  {
    id: 'villain_betrayal',
    title: 'The Betrayal of Malachar',
    text: 'Malachar did not fall to corruption. He chose it. He believed the world was a failed experiment — beautiful but doomed. Rather than watch it decay, he decided to unmake it entirely and rebuild it as something "perfect." The other Guardians disagreed. The Shattering was his response.',
    category: 'corruption' as const,
    unlocked: false,
  },
  {
    id: 'villain_prison',
    title: 'The Eight-Fold Seal',
    text: 'The four Guardians gave their power to seal Malachar in the Abyss. But four was not enough. They split their power further — creating eight elements from four. Each shard became a lock. Only by reuniting all eight could the seal be broken. It was meant to be impossible. It was not.',
    category: 'corruption' as const,
    unlocked: false,
  },
  // Aethon lore
  {
    id: 'guide_origin',
    title: 'Aethon, the Last Chronicler',
    text: 'Aethon was the greatest scholar of the old world. When the Shattering came, he was reading in the Great Library. The explosion crystallized the library around him, preserving him in amber-light for a thousand years. When he woke, the world was broken and he was alone.',
    category: 'bearers' as const,
    unlocked: false,
  },
  {
    id: 'guide_purpose',
    title: 'The Chronicler\'s Guilt',
    text: 'Aethon knew about Malachar\'s plan before the Shattering. He had read the signs in the ancient texts. But he was a scholar, not a warrior, and by the time he tried to warn the Guardians, it was already too late. He has spent centuries searching for a Fragment Bearer strong enough to finish what he could not.',
    category: 'bearers' as const,
    unlocked: false,
  },
  // World lore
  {
    id: 'world_old',
    title: 'The World Before',
    text: 'Before the Shattering, the world was a single continent united under the Council of Five. Cities floated on clouds of elemental energy. Music was woven from lightning. Forests grew in harmonious spirals. It was not perfect, but it was magnificent. Those who remember weep for what was lost.',
    category: 'shattering' as const,
    unlocked: false,
  },
  {
    id: 'world_zones',
    title: 'The Broken Zones',
    text: 'Each zone was once a province of the old world. The Volcanic Ruins were the Industrial Heart. The Frozen Wastes were the Archives. The Storm Citadel was the Communications Hub. The Abyssal Hollow was the Prison. Now they are twisted reflections, warped by uncontrolled elemental fury.',
    category: 'shattering' as const,
    unlocked: false,
  },
  // Prophecy expansion
  {
    id: 'prophecy_truth',
    title: 'The True Prophecy',
    text: '"The key and the lock are the same. The Bearer who frees the world will free the destroyer. But the Bearer who holds all eight need not fear the fifth, for eight is greater than one. The question is not whether the seal will break, but whether the Bearer will be strong enough when it does."',
    category: 'prophecy' as const,
    unlocked: false,
  },
];

// ═══════════════════════════════════════════
// QUEST SYSTEM
// ═══════════════════════════════════════════
export interface Quest {
  id: string;
  title: string;
  description: string;
  zone: ElementType | 'any' | 'malachar';
  type: 'main' | 'side';
  objectives: QuestObjective[];
  rewards: { xp: number; gold: number; loreId?: string };
  prerequisite?: string; // quest id that must be completed first
}

export interface QuestObjective {
  id: string;
  text: string;
  type: 'kill_boss' | 'clear_floors' | 'collect_element' | 'reach_floor' | 'visit_kingdom' | 'upgrade_building' | 'defeat_malachar';
  target: string | number;
  current: number;
  required: number;
}

export const QUESTS: Quest[] = [
  // ─── Main Quests ───
  {
    id: 'mq_fire',
    title: 'The First Flame',
    description: 'Aethon says the fire element burns strongest in the Volcanic Ruins. Defeat the Ember Lord and claim the first shard.',
    zone: 'fire',
    type: 'main',
    objectives: [
      { id: 'mq_fire_1', text: 'Reach Floor 5 of the Volcanic Ruins', type: 'reach_floor', target: 5, current: 0, required: 5 },
      { id: 'mq_fire_2', text: 'Defeat Ember Lord Kael', type: 'kill_boss', target: 'fire', current: 0, required: 1 },
    ],
    rewards: { xp: 100, gold: 75, loreId: 'guardian_ignis' },
  },
  {
    id: 'mq_ice',
    title: 'Tears of the Sovereign',
    description: 'The Frozen Wastes hold Glacius\'s crystalline archives. Free her from corruption and claim the ice shard.',
    zone: 'ice',
    type: 'main',
    objectives: [
      { id: 'mq_ice_1', text: 'Enter the Frozen Wastes', type: 'collect_element', target: 'ice', current: 0, required: 1 },
      { id: 'mq_ice_2', text: 'Defeat Frostbane', type: 'kill_boss', target: 'ice', current: 0, required: 1 },
    ],
    rewards: { xp: 150, gold: 100, loreId: 'guardian_glacius' },
    prerequisite: 'mq_fire',
  },
  {
    id: 'mq_lightning',
    title: 'The Unheeded Warning',
    description: 'Voltaris\'s message still echoes in the Storm Citadel. Find its meaning and claim the lightning shard.',
    zone: 'lightning',
    type: 'main',
    objectives: [
      { id: 'mq_lightning_1', text: 'Enter the Storm Citadel', type: 'collect_element', target: 'lightning', current: 0, required: 1 },
      { id: 'mq_lightning_2', text: 'Defeat Thunderclaw', type: 'kill_boss', target: 'lightning', current: 0, required: 1 },
    ],
    rewards: { xp: 200, gold: 150, loreId: 'guardian_voltaris' },
    prerequisite: 'mq_ice',
  },
  {
    id: 'mq_shadow',
    title: 'Into the Hollow',
    description: 'Umbra\'s prison holds dark secrets. Enter the Abyssal Hollow and claim the shadow shard.',
    zone: 'shadow',
    type: 'main',
    objectives: [
      { id: 'mq_shadow_1', text: 'Enter the Abyssal Hollow', type: 'collect_element', target: 'shadow', current: 0, required: 1 },
      { id: 'mq_shadow_2', text: 'Defeat Voidmaw', type: 'kill_boss', target: 'shadow', current: 0, required: 1 },
    ],
    rewards: { xp: 250, gold: 200, loreId: 'guardian_umbra' },
    prerequisite: 'mq_lightning',
  },
  {
    id: 'mq_earth',
    title: 'The Unbroken Will',
    description: 'Terrath sleeps in the Ancient Badlands. Wake the stone and claim the earth shard.',
    zone: 'earth',
    type: 'main',
    objectives: [
      { id: 'mq_earth_1', text: 'Enter the Ancient Badlands', type: 'collect_element', target: 'earth', current: 0, required: 1 },
      { id: 'mq_earth_2', text: 'Defeat Stone Colossus', type: 'kill_boss', target: 'earth', current: 0, required: 1 },
    ],
    rewards: { xp: 300, gold: 250, loreId: 'villain_origin' },
    prerequisite: 'mq_shadow',
  },
  {
    id: 'mq_wind',
    title: 'The Sky\'s Lament',
    description: 'Zephyros rides the storm winds of the Sky Peaks. Calm his fury and claim the wind shard.',
    zone: 'wind',
    type: 'main',
    objectives: [
      { id: 'mq_wind_1', text: 'Enter the Sky Peaks', type: 'collect_element', target: 'wind', current: 0, required: 1 },
      { id: 'mq_wind_2', text: 'Defeat Tempest Drake', type: 'kill_boss', target: 'wind', current: 0, required: 1 },
    ],
    rewards: { xp: 350, gold: 300, loreId: 'villain_betrayal' },
    prerequisite: 'mq_earth',
  },
  {
    id: 'mq_nature',
    title: 'Roots of Grief',
    description: 'Sylvara\'s thorns choke the Verdant Depths. Free her and claim the nature shard.',
    zone: 'nature',
    type: 'main',
    objectives: [
      { id: 'mq_nature_1', text: 'Enter the Verdant Depths', type: 'collect_element', target: 'nature', current: 0, required: 1 },
      { id: 'mq_nature_2', text: 'Defeat Thornlord', type: 'kill_boss', target: 'nature', current: 0, required: 1 },
    ],
    rewards: { xp: 400, gold: 350, loreId: 'villain_prison' },
    prerequisite: 'mq_wind',
  },
  {
    id: 'mq_void',
    title: 'The Seal Breaks',
    description: 'Nullex guards the final shard in the Abyss. Defeating it will unleash Malachar.',
    zone: 'void',
    type: 'main',
    objectives: [
      { id: 'mq_void_1', text: 'Enter the Abyss', type: 'collect_element', target: 'void', current: 0, required: 1 },
      { id: 'mq_void_2', text: 'Defeat Nullex', type: 'kill_boss', target: 'void', current: 0, required: 1 },
    ],
    rewards: { xp: 500, gold: 400, loreId: 'prophecy_truth' },
    prerequisite: 'mq_nature',
  },
  {
    id: 'mq_malachar',
    title: 'The Architect Falls',
    description: 'Malachar is free. Only you — holding all eight elements — can stop him. Enter the Heart of the Abyss.',
    zone: 'malachar',
    type: 'main',
    objectives: [
      { id: 'mq_mal_1', text: 'Defeat Malachar, the Architect of Ruin', type: 'defeat_malachar', target: 'malachar', current: 0, required: 1 },
    ],
    rewards: { xp: 1000, gold: 1000 },
    prerequisite: 'mq_void',
  },

  // ─── Side Quests ───
  {
    id: 'sq_kingdom',
    title: 'A Place to Call Home',
    description: 'Visit the Kingdom and begin rebuilding civilization.',
    zone: 'any',
    type: 'side',
    objectives: [
      { id: 'sq_kingdom_1', text: 'Visit the Kingdom Hub', type: 'visit_kingdom', target: 'kingdom', current: 0, required: 1 },
    ],
    rewards: { xp: 50, gold: 100 },
  },
  {
    id: 'sq_forge',
    title: 'Tempered Steel',
    description: 'Upgrade the Elemental Forge to strengthen your attacks.',
    zone: 'any',
    type: 'side',
    objectives: [
      { id: 'sq_forge_1', text: 'Upgrade the Forge to Level 2', type: 'upgrade_building', target: 'forge', current: 0, required: 2 },
    ],
    rewards: { xp: 75, gold: 50, loreId: 'guide_origin' },
    prerequisite: 'sq_kingdom',
  },
  {
    id: 'sq_explorer',
    title: 'Dungeon Crawler',
    description: 'Prove your worth by clearing multiple dungeon floors.',
    zone: 'any',
    type: 'side',
    objectives: [
      { id: 'sq_explorer_1', text: 'Clear 10 dungeon floors', type: 'clear_floors', target: 10, current: 0, required: 10 },
    ],
    rewards: { xp: 150, gold: 200, loreId: 'world_old' },
  },
  {
    id: 'sq_collector',
    title: 'Elemental Collector',
    description: 'Unlock four different elements to prove your affinity.',
    zone: 'any',
    type: 'side',
    objectives: [
      { id: 'sq_collector_1', text: 'Unlock 4 elements', type: 'collect_element', target: 4, current: 0, required: 4 },
    ],
    rewards: { xp: 200, gold: 150, loreId: 'guide_purpose' },
  },
  {
    id: 'sq_builder',
    title: 'Master Builder',
    description: 'Upgrade 5 different buildings in the Kingdom.',
    zone: 'any',
    type: 'side',
    objectives: [
      { id: 'sq_builder_1', text: 'Upgrade 5 different buildings', type: 'upgrade_building', target: 5, current: 0, required: 5 },
    ],
    rewards: { xp: 300, gold: 300, loreId: 'world_zones' },
  },
];

// ═══════════════════════════════════════════
// QUEST STATE MANAGEMENT
// ═══════════════════════════════════════════
export interface QuestState {
  active: string[];     // quest IDs
  completed: string[];  // quest IDs
  objectives: Record<string, number>; // objective_id -> current progress
}

export function getDefaultQuestState(): QuestState {
  return {
    active: ['mq_fire', 'sq_kingdom'],
    completed: [],
    objectives: {},
  };
}

export function getAvailableQuests(state: QuestState): Quest[] {
  return QUESTS.filter(q => {
    if (state.completed.includes(q.id)) return false;
    if (state.active.includes(q.id)) return false;
    if (q.prerequisite && !state.completed.includes(q.prerequisite)) return false;
    return true;
  });
}

export function updateQuestProgress(
  state: QuestState,
  type: QuestObjective['type'],
  target: string | number,
  amount: number = 1
): { state: QuestState; completed: Quest[]; newQuests: Quest[] } {
  const newState = { ...state, objectives: { ...state.objectives } };
  const justCompleted: Quest[] = [];

  for (const questId of newState.active) {
    const quest = QUESTS.find(q => q.id === questId);
    if (!quest) continue;

    for (const obj of quest.objectives) {
      if (obj.type !== type) continue;
      
      let matches = false;
      if (typeof target === 'string' && typeof obj.target === 'string') {
        matches = target === obj.target || obj.target === 'any';
      } else if (typeof target === 'number' && typeof obj.target === 'number') {
        matches = true;
      }

      if (matches) {
        const current = newState.objectives[obj.id] || 0;
        newState.objectives[obj.id] = Math.min(current + amount, obj.required);
      }
    }

    // Check if quest is complete
    const allDone = quest.objectives.every(obj => {
      return (newState.objectives[obj.id] || 0) >= obj.required;
    });

    if (allDone) {
      justCompleted.push(quest);
    }
  }

  // Move completed quests
  for (const q of justCompleted) {
    newState.active = newState.active.filter(id => id !== q.id);
    newState.completed = [...newState.completed, q.id];
  }

  // Unlock new quests
  const newQuests: Quest[] = [];
  for (const quest of QUESTS) {
    if (newState.completed.includes(quest.id)) continue;
    if (newState.active.includes(quest.id)) continue;
    if (quest.prerequisite && !newState.completed.includes(quest.prerequisite)) continue;
    newState.active = [...newState.active, quest.id];
    newQuests.push(quest);
  }

  return { state: newState, completed: justCompleted, newQuests };
}

// ═══════════════════════════════════════════
// WORLD MAP DATA
// ═══════════════════════════════════════════
export interface WorldMapZone {
  id: ElementType | 'malachar';
  name: string;
  description: string;
  x: number; // percentage position
  y: number;
  color: string;
  icon: string;
  bossName: string;
  unlocked: boolean;
  cleared: boolean;
  connectedTo: string[];
}

export function getWorldMapZones(unlockedElements: ElementType[], bossesDefeated: string[]): WorldMapZone[] {
  return [
    {
      id: 'fire', name: 'Volcanic Ruins', description: 'The blazing heart of the old Industrial District. Rivers of lava flow between crumbling forges.',
      x: 20, y: 70, color: '#F97316', icon: '🌋', bossName: 'Ember Lord Kael',
      unlocked: true, cleared: bossesDefeated.includes('fire'),
      connectedTo: ['ice'],
    },
    {
      id: 'ice', name: 'Frozen Wastes', description: 'Glacius\'s crystalline archives stretch endlessly. Every snowflake holds a forgotten memory.',
      x: 35, y: 35, color: '#38BDF8', icon: '❄️', bossName: 'Frostbane',
      unlocked: unlockedElements.includes('ice'), cleared: bossesDefeated.includes('ice'),
      connectedTo: ['fire', 'lightning'],
    },
    {
      id: 'lightning', name: 'Storm Citadel', description: 'Voltaris\'s last bolt still crackles through these towers. The storms never stop.',
      x: 55, y: 20, color: '#EAB308', icon: '⚡', bossName: 'Thunderclaw',
      unlocked: unlockedElements.includes('lightning'), cleared: bossesDefeated.includes('lightning'),
      connectedTo: ['ice', 'shadow'],
    },
    {
      id: 'shadow', name: 'Abyssal Hollow', description: 'The prison of Malachar. Umbra\'s chains of shadow still rattle in the darkness.',
      x: 75, y: 35, color: '#A855F7', icon: '🌑', bossName: 'Voidmaw',
      unlocked: unlockedElements.includes('shadow'), cleared: bossesDefeated.includes('shadow'),
      connectedTo: ['lightning', 'earth'],
    },
    {
      id: 'earth', name: 'Ancient Badlands', description: 'Once-great cities of living stone, now crumbled to dust. Terrath\'s will endures.',
      x: 80, y: 60, color: '#92400E', icon: '🪨', bossName: 'Stone Colossus',
      unlocked: unlockedElements.includes('earth'), cleared: bossesDefeated.includes('earth'),
      connectedTo: ['shadow', 'wind'],
    },
    {
      id: 'wind', name: 'Sky Peaks', description: 'Floating islands connected by bridges of solidified wind. The air cuts like blades.',
      x: 60, y: 75, color: '#34D399', icon: '🌀', bossName: 'Tempest Drake',
      unlocked: unlockedElements.includes('wind'), cleared: bossesDefeated.includes('wind'),
      connectedTo: ['earth', 'nature'],
    },
    {
      id: 'nature', name: 'Verdant Depths', description: 'A forest turned hostile. Sylvara\'s thorns and vines choke everything that enters.',
      x: 40, y: 80, color: '#22C55E', icon: '🌿', bossName: 'Thornlord',
      unlocked: unlockedElements.includes('nature'), cleared: bossesDefeated.includes('nature'),
      connectedTo: ['wind', 'void'],
    },
    {
      id: 'void', name: 'The Abyss', description: 'Where reality ends. Nullex waits in the space between spaces.',
      x: 50, y: 50, color: '#EC4899', icon: '🕳️', bossName: 'Nullex',
      unlocked: unlockedElements.includes('void'), cleared: bossesDefeated.includes('void'),
      connectedTo: ['nature', 'malachar'],
    },
    {
      id: 'malachar', name: 'Heart of the Abyss', description: 'Malachar\'s sanctum. The final battle awaits.',
      x: 50, y: 30, color: '#991B1B', icon: '👁️', bossName: 'Malachar',
      unlocked: bossesDefeated.includes('void'), cleared: bossesDefeated.includes('malachar'),
      connectedTo: ['void'],
    },
  ];
}
