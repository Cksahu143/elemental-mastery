import { LoreEntry } from './types';

export const LORE_ENTRIES: LoreEntry[] = [
  // ─── Guardians ───
  {
    id: 'guardian_ignis',
    title: 'Ignis, the Flame Warden',
    text: 'Before the Shattering, Ignis stood as the first among equals. His eternal flame burned at the heart of the world, a beacon that kept the darkness at bay. They say his laughter could melt glaciers, and his rage could birth volcanoes. When the corruption came, he fought the longest — and fell the hardest.',
    category: 'guardians',
    unlocked: false,
  },
  {
    id: 'guardian_ignis_fall',
    title: 'The Fall of Ignis',
    text: 'Ignis did not simply die. His flame fractured into a thousand burning shards, each one carrying a fragment of his consciousness. The Ember Lord Kael was born from his final, desperate act — a guardian shaped from rage and sorrow, cursed to protect the ruins of what once was.',
    category: 'guardians',
    unlocked: false,
  },
  {
    id: 'guardian_glacius',
    title: 'Glacius, the Still Sovereign',
    text: 'Glacius ruled the northern reaches where time itself seemed frozen. Patient and calculating, she wove the frost that preserved ancient knowledge within crystalline archives. Her silence was not emptiness but contemplation — every snowflake a thought, every blizzard a decree.',
    category: 'guardians',
    unlocked: false,
  },
  {
    id: 'guardian_glacius_archive',
    title: 'The Crystalline Archives',
    text: 'Deep within the Frozen Wastes lie Glacius\'s archives — entire histories frozen in perfect ice. Those who touch them see visions of the world before the Shattering: cities of light, skies unmarred by corruption. But the visions always end the same way — in fire, then silence.',
    category: 'guardians',
    unlocked: false,
  },
  {
    id: 'guardian_voltaris',
    title: 'Voltaris, the Storm Herald',
    text: 'Between sky and earth, Voltaris danced. The fastest of the Guardians, he carried messages between realms in bolts of light. His laughter was thunder, his tears were rain. He alone sensed the corruption before it arrived — but his warnings came too late.',
    category: 'guardians',
    unlocked: false,
  },
  {
    id: 'guardian_voltaris_warning',
    title: 'The Unheeded Warning',
    text: 'Voltaris sent his final message as a bolt that split the sky in two. The message was simple: "It comes from within." No one understood its meaning. By the time they did, the Shattering had already begun. Some say the bolt still echoes in the Storm Citadel, repeating its warning to deaf walls.',
    category: 'guardians',
    unlocked: false,
  },
  {
    id: 'guardian_umbra',
    title: 'Umbra, the Void Walker',
    text: 'Umbra existed in the spaces between. Neither evil nor good, she was balance incarnate — the necessary darkness that gave meaning to light. When the corruption twisted her domain, she did not fight it. She absorbed it. And in doing so, became something else entirely.',
    category: 'guardians',
    unlocked: false,
  },
  {
    id: 'guardian_umbra_sacrifice',
    title: 'Umbra\'s Sacrifice',
    text: 'What Umbra absorbed was not mere corruption — it was the Void itself, a hunger that existed before the elements were born. She became a prison, trapping the Void within her own being. But prisons crack. And something in the Abyssal Hollow still whispers her name.',
    category: 'guardians',
    unlocked: false,
  },

  // ─── The Shattering ───
  {
    id: 'shattering_event',
    title: 'The Shattering',
    text: 'No one knows what truly caused the Shattering. One moment, the four elements existed in harmony. The next, reality cracked like glass struck by an invisible hand. The Guardians were scattered, their power fragmented into countless shards. The world split into unstable zones, each warped by uncontrolled elemental energy.',
    category: 'shattering',
    unlocked: false,
  },
  {
    id: 'shattering_aftermath',
    title: 'The Aftermath',
    text: 'In the hours following the Shattering, the sky burned four colors. Fire in the south, ice in the north, lightning in the east, shadow in the west. Where the colors met, reality folded upon itself — creating the Broken Zones where the laws of nature hold no sway.',
    category: 'shattering',
    unlocked: false,
  },
  {
    id: 'shattering_survivors',
    title: 'The First Survivors',
    text: 'Not everyone perished in the Shattering. Those closest to elemental energy survived — transformed. Blacksmiths became fire-touched, sailors gained frost in their veins, scholars found lightning in their thoughts. These "Touched" were the ancestors of the Fragment Bearers.',
    category: 'shattering',
    unlocked: false,
  },

  // ─── Corruption ───
  {
    id: 'corruption_origin',
    title: 'The Nameless Corruption',
    text: 'It has no name because names give power, and it already has too much. The corruption seeps through the cracks in reality, turning creatures into hollow shells of rage. Some scholars believe it is not a being at all, but the absence of one — a void where a fifth element should have been.',
    category: 'corruption',
    unlocked: false,
  },
  {
    id: 'corruption_spread',
    title: 'How Corruption Spreads',
    text: 'The corruption does not destroy — it replaces. It fills the cracks left by the Shattering, mimicking elemental energy while hollowing out its meaning. A corrupted fire burns but gives no warmth. Corrupted ice freezes but preserves nothing. It is imitation without purpose.',
    category: 'corruption',
    unlocked: false,
  },
  {
    id: 'corruption_whispers',
    title: 'The Whispering Dark',
    text: 'Those who linger too long in corrupted zones hear whispers. Not words, but feelings — doubt, fear, hunger. The whispers promise power in exchange for surrender. Many have accepted. None have returned whole.',
    category: 'corruption',
    unlocked: false,
  },
  {
    id: 'corruption_heart',
    title: 'The Heart of Corruption',
    text: 'Deep beneath the Abyssal Hollow, something pulses. A heart that beats without blood, a core that glows without light. Some say it is the Corruption\'s true form. Others say it is what remains of the world\'s original creator — bitter, broken, and very, very angry.',
    category: 'corruption',
    unlocked: false,
  },

  // ─── Fragment Bearers ───
  {
    id: 'fragment_bearers',
    title: 'The Fragment Bearers',
    text: 'When the Guardians fell, their power did not vanish — it chose new hosts. The Fragment Bearers are ordinary beings touched by extraordinary power. They alone can absorb elemental shards without being consumed. Whether they will restore balance or claim dominion remains to be seen.',
    category: 'bearers',
    unlocked: false,
  },
  {
    id: 'bearer_history',
    title: 'Bearers Before You',
    text: 'You are not the first Fragment Bearer. Others have risen, absorbed the shards, and either restored fragments of balance or been consumed by their own power. The Volcanic Ruins are littered with the weapons of fallen Bearers, each one a gravestone without a name.',
    category: 'bearers',
    unlocked: false,
  },
  {
    id: 'bearer_burden',
    title: 'The Bearer\'s Burden',
    text: 'Every shard you absorb changes you. Fire shards burn away doubt. Ice shards freeze away compassion. Lightning shards scatter your thoughts. Shadow shards deepen your hunger. The power is a gift, but the cost is who you were before you claimed it.',
    category: 'bearers',
    unlocked: false,
  },

  // ─── Prophecy ───
  {
    id: 'prophecy',
    title: 'The Prophecy of Convergence',
    text: '"When the four become one and the one becomes none, the Bearer shall stand at the crossroads of creation. In their hands: the power to mend what was broken, or to shatter it beyond all mending. The elements remember — do you?"',
    category: 'prophecy',
    unlocked: false,
  },
  {
    id: 'prophecy_balance',
    title: 'The Path of Balance',
    text: '"Should the Bearer walk the narrow path, holding each element in equal measure, the Guardians shall reform. The Shattering shall be undone. The world will remember what it was — but the Bearer will forget who they were. Such is the price of creation."',
    category: 'prophecy',
    unlocked: false,
  },
  {
    id: 'prophecy_domination',
    title: 'The Path of Domination',
    text: '"Should the Bearer choose to command rather than balance, the elements shall bow. A new Guardian shall rise — not four, but one. All-powerful, all-consuming. The corruption shall end, for there will be nothing left to corrupt. The world will not be saved. It will be replaced."',
    category: 'prophecy',
    unlocked: false,
  },
];

export const BOSS_DIALOGUES: Record<string, string[]> = {
  fire: [
    "You dare enter the Volcanic Ruins?",
    "I am Ember Lord Kael... the last flame of Ignis.",
    "His fire lives in me... AND IT WILL CONSUME YOU.",
  ],
  ice: [
    "The cold... it whispers your name.",
    "I am Frostbane... Glacius's final tear.",
    "You will be preserved forever... in perfect ice.",
  ],
  lightning: [
    "The storm answers to no one.",
    "I am Thunderclaw... born from Voltaris's last bolt.",
    "The sky itself demands your end!",
  ],
  shadow: [
    "You cannot fight what you cannot see.",
    "I am Voidmaw... Umbra's hunger given form.",
    "The darkness does not consume. It BECOMES.",
  ],
  earth: [
    "The mountain does not move for the wind.",
    "I am Stone Colossus... Terrath's unbroken will.",
    "You will be ground to DUST beneath my weight.",
  ],
  wind: [
    "You cannot catch what flies above you.",
    "I am Tempest Drake... Zephyros's final breath.",
    "The sky will swallow you WHOLE.",
  ],
  nature: [
    "The forest remembers every trespass.",
    "I am Thornlord... Sylvara's grief made thorns.",
    "You will be consumed by the roots of the world.",
  ],
  void: [
    "There is nothing here. There never was.",
    "I am Nullex... the absence that devours.",
    "Reality itself unravels in my presence. YOU ARE NOTHING.",
  ],
  malachar: [
    "At last... we meet, little Fragment Bearer.",
    "I am Malachar. The Fifth Guardian. The Architect of Ruin.",
    "I held the harmony of FIVE elements. You hold eight fragments.",
    "But fragments are just... PIECES. Let me show you TRUE power!",
    "SHOW ME EVERYTHING YOU'VE LEARNED... AND WATCH IT FAIL!",
  ],
};

export const POST_BOSS_DIALOGUES: Record<string, { speaker: string; text: string; color: string }[]> = {
  fire: [
    { speaker: 'Ember Lord Kael', text: 'You... you carry the flame now...', color: '#F97316' },
    { speaker: 'Ember Lord Kael', text: 'Ignis would be... proud. Or terrified.', color: '#F97316' },
    { speaker: 'Echo of Ignis', text: 'Bearer... the cold awaits in the north. Glacius\'s tears have frozen into something... wrong.', color: '#FF4500' },
    { speaker: 'Echo of Ignis', text: 'Seek the Frozen Wastes. Free what remains of the Still Sovereign.', color: '#FF4500' },
    { speaker: 'Mysterious Voice', text: 'The Ice element has awakened within you. Switch elements to explore the Frozen Wastes.', color: '#A855F7' },
  ],
  ice: [
    { speaker: 'Frostbane', text: 'The ice... shatters... at last...', color: '#38BDF8' },
    { speaker: 'Echo of Glacius', text: 'My archives... they remember everything. Even the storm that follows.', color: '#67E8F9' },
    { speaker: 'Echo of Glacius', text: 'Voltaris\'s citadel crackles with unchecked fury. Go. Calm the storm.', color: '#67E8F9' },
    { speaker: 'Mysterious Voice', text: 'Lightning surges through you. The Storm Citadel awaits.', color: '#A855F7' },
  ],
  lightning: [
    { speaker: 'Thunderclaw', text: 'The bolt... returns... to the sky...', color: '#EAB308' },
    { speaker: 'Echo of Voltaris', text: 'You heard my warning at last. But the darkest trial remains.', color: '#FACC15' },
    { speaker: 'Echo of Voltaris', text: 'Umbra\'s hollow calls. What waits there is... not what it seems. Be ready.', color: '#FACC15' },
    { speaker: 'Mysterious Voice', text: 'Shadow beckons. Enter the Abyssal Hollow — if you dare.', color: '#A855F7' },
  ],
  shadow: [
    { speaker: 'Voidmaw', text: 'The hunger... fades... finally...', color: '#A855F7' },
    { speaker: 'Echo of Umbra', text: 'You hold four elements, Bearer. But four more await in the ancient lands.', color: '#C084FC' },
    { speaker: 'Echo of Umbra', text: 'Terrath sleeps in the Ancient Badlands. The earth element calls to you.', color: '#C084FC' },
    { speaker: 'Mysterious Voice', text: 'Earth awakens within you. Seek the Ancient Badlands.', color: '#A855F7' },
  ],
  earth: [
    { speaker: 'Stone Colossus', text: 'The... mountain... yields...', color: '#D97706' },
    { speaker: 'Echo of Terrath', text: 'The Sky Peaks. Zephyros was gentle once — before the winds turned against the world.', color: '#B45309' },
    { speaker: 'Echo of Terrath', text: 'Find him. Free him. Let the wind carry hope again.', color: '#B45309' },
    { speaker: 'Mysterious Voice', text: 'Wind flows through you. Ascend to the Sky Peaks.', color: '#A855F7' },
  ],
  wind: [
    { speaker: 'Tempest Drake', text: 'The gale... dies... to a whisper...', color: '#34D399' },
    { speaker: 'Echo of Zephyros', text: 'Sylvara waits in the Verdant Depths. The forest has grown dark without her light.', color: '#6EE7B7' },
    { speaker: 'Echo of Zephyros', text: 'Six elements. Two more. Nature and the Void await.', color: '#6EE7B7' },
    { speaker: 'Mysterious Voice', text: 'Nature stirs within you. Descend into the Verdant Depths.', color: '#A855F7' },
  ],
  nature: [
    { speaker: 'Thornlord', text: 'The roots... release... their grip...', color: '#22C55E' },
    { speaker: 'Echo of Sylvara', text: 'Seven elements united in you, Bearer. One remains. The Void.', color: '#4ADE80' },
    { speaker: 'Echo of Sylvara', text: 'Nullex is not a Guardian. It is the corruption itself given form. Be ready.', color: '#4ADE80' },
    { speaker: 'Mysterious Voice', text: 'Void energy swirls within you. Enter the Abyss. End this.', color: '#A855F7' },
  ],
  void: [
    { speaker: 'Nullex', text: 'I... cannot be... destroyed... I am... everything... and nothing...', color: '#EC4899' },
    { speaker: 'The Eight Echoes', text: 'You hold all eight elements, Bearer. The Convergence is complete.', color: '#FFD700' },
    { speaker: 'The Eight Echoes', text: 'Balance is restored. For now. The world breathes again.', color: '#FFD700' },
    { speaker: 'Mysterious Voice', text: 'You have done it. The Fragment Bearer\'s journey is complete... or is it just beginning?', color: '#A855F7' },
  ],
};

export const INTRO_TEXT = [
  "The world was once whole...",
  "Four Elemental Guardians maintained the balance of all things.",
  "Fire. Ice. Lightning. Shadow.",
  "Then came the Shattering.",
  "Reality cracked. The Guardians fell. Corruption spread.",
  "Now, from the ruins of the old world...",
  "A Fragment Bearer awakens.",
  "You.",
];
