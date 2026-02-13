import { LoreEntry } from './types';

export const LORE_ENTRIES: LoreEntry[] = [
  {
    id: 'guardian_ignis',
    title: 'Ignis, the Flame Warden',
    text: 'Before the Shattering, Ignis stood as the first among equals. His eternal flame burned at the heart of the world, a beacon that kept the darkness at bay. They say his laughter could melt glaciers, and his rage could birth volcanoes. When the corruption came, he fought the longest — and fell the hardest.',
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
    id: 'guardian_voltaris',
    title: 'Voltaris, the Storm Herald',
    text: 'Between sky and earth, Voltaris danced. The fastest of the Guardians, he carried messages between realms in bolts of light. His laughter was thunder, his tears were rain. He alone sensed the corruption before it arrived — but his warnings came too late.',
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
    id: 'shattering_event',
    title: 'The Shattering',
    text: 'No one knows what truly caused the Shattering. One moment, the four elements existed in harmony. The next, reality cracked like glass struck by an invisible hand. The Guardians were scattered, their power fragmented into countless shards. The world split into unstable zones, each warped by uncontrolled elemental energy.',
    category: 'shattering',
    unlocked: false,
  },
  {
    id: 'corruption_origin',
    title: 'The Nameless Corruption',
    text: 'It has no name because names give power, and it already has too much. The corruption seeps through the cracks in reality, turning creatures into hollow shells of rage. Some scholars believe it is not a being at all, but the absence of one — a void where a fifth element should have been.',
    category: 'corruption',
    unlocked: false,
  },
  {
    id: 'fragment_bearers',
    title: 'The Fragment Bearers',
    text: 'When the Guardians fell, their power did not vanish — it chose new hosts. The Fragment Bearers are ordinary beings touched by extraordinary power. They alone can absorb elemental shards without being consumed. Whether they will restore balance or claim dominion remains to be seen.',
    category: 'bearers',
    unlocked: false,
  },
  {
    id: 'prophecy',
    title: 'The Prophecy of Convergence',
    text: '"When the four become one and the one becomes none, the Bearer shall stand at the crossroads of creation. In their hands: the power to mend what was broken, or to shatter it beyond all mending. The elements remember — do you?"',
    category: 'prophecy',
    unlocked: false,
  },
];

export const BOSS_DIALOGUES: Record<string, string[]> = {
  fire: [
    "You dare enter the Volcanic Ruins?",
    "I am Ember Lord Kael... the last flame of Ignis.",
    "You will BURN.",
  ],
  ice: [
    "The cold... it whispers your name.",
    "I am Frostbane... Glacius's final tear.",
    "Freeze. Forever.",
  ],
  lightning: [
    "The storm answers to no one.",
    "I am Thunderclaw... born from Voltaris's last bolt.",
    "Feel the sky's wrath!",
  ],
  shadow: [
    "You cannot fight what you cannot see.",
    "I am Voidmaw... Umbra's hunger given form.",
    "The darkness... consumes.",
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
