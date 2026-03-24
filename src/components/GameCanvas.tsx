import { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ElementType, SKILLS } from '../game/types';
import { initInput, initGame, update, render, setCallbacks, getPlayer, getFloor, getSaveData, isPlayerDead, respawnPlayer, nextRoom, getRoom, switchElement, unlockSkill, getActiveSkills, setKingdomRegen, getCameraMode, getGameTime } from '../game/engine';
import { getDefaultSave, saveGame, loadGame, getLoreEntries } from '../game/saveSystem';
import { POST_BOSS_DIALOGUES } from '../game/lore';
import { SFX } from '../game/audio';
import { loadKingdom, saveKingdom, awardBossGold, awardRoomGold, getKingdomBonuses, KingdomState } from '../game/kingdom';
import TitleScreen from './TitleScreen';
import GameHUD from './GameHUD';
import LoreCodex from './LoreCodex';
import StatAllocation from './StatAllocation';
import BossDialogue from './BossDialogue';
import DeathScreen from './DeathScreen';
import PauseMenu from './PauseMenu';
import SkillTree from './SkillTree';
import Tutorial from './Tutorial';
import NPCDialogue from './NPCDialogue';
import StoryCutscene from './StoryCutscene';
import SceneBackground from './SceneBackground';
import KingdomHub from './KingdomHub';
import IntroCutscene from './IntroCutscene';
import Game3DCanvas from './Game3DCanvas';

type GamePhase = 'title' | 'intro' | 'playing' | 'paused';

const ZONE_ORDER: ElementType[] = ['fire', 'ice', 'lightning', 'shadow', 'earth', 'wind', 'nature', 'void'];

const POST_INTRO_DIALOGUE = [
  { speaker: 'Mysterious Voice', text: 'You stir at last... The Shattering has left this world in ruin.', color: '#A855F7' },
  { speaker: 'Mysterious Voice', text: 'I am but an echo — a fragment of what the Guardians once were.', color: '#A855F7' },
  { speaker: 'Mysterious Voice', text: 'The fire element burns strongest here. Absorb its shards and grow.', color: '#F97316' },
  { speaker: 'Mysterious Voice', text: 'Press 1-4 to cast abilities once you\'ve unlocked them in the Skill Tree.', color: '#EAB308' },
  { speaker: 'Mysterious Voice', text: 'Defeat the bosses that guard each zone. Reclaim the elements. Restore balance.', color: '#38BDF8' },
  { speaker: 'Mysterious Voice', text: 'Go now, Fragment Bearer. The world awaits.', color: '#A855F7' },
];

const ZONE_ENTRY_DIALOGUES: Record<ElementType, { speaker: string; text: string; color: string }[]> = {
  fire: [],
  ice: [
    { speaker: 'Echo of Ignis', text: 'The Frozen Wastes stretch before you. Glacius\'s sorrow has crystallized the very air.', color: '#FF4500' },
    { speaker: 'Echo of Ignis', text: 'Tread carefully — the ice remembers all who fall upon it.', color: '#FF4500' },
    { speaker: 'Mysterious Voice', text: 'Ice enemies resist cold. Switch to Fire for advantage, or master ice\'s slowing power.', color: '#A855F7' },
  ],
  lightning: [
    { speaker: 'Echo of Glacius', text: 'The Storm Citadel crackles with unchecked fury. Voltaris\'s rage echoes in every bolt.', color: '#67E8F9' },
    { speaker: 'Echo of Glacius', text: 'The storms here are alive — and they do not welcome visitors.', color: '#67E8F9' },
    { speaker: 'Mysterious Voice', text: 'Lightning enemies are fast. Use ice to slow them, or match their speed.', color: '#A855F7' },
  ],
  shadow: [
    { speaker: 'Echo of Voltaris', text: 'The Abyssal Hollow... even my light cannot reach its depths.', color: '#FACC15' },
    { speaker: 'Echo of Voltaris', text: 'What waits below is not merely an enemy. It is hunger itself.', color: '#FACC15' },
    { speaker: 'Mysterious Voice', text: 'Shadow enemies drain life. Your shadow skills heal — use that wisely.', color: '#A855F7' },
  ],
  earth: [
    { speaker: 'Echo of Umbra', text: 'The Ancient Badlands... the earth itself remembers the cataclysm.', color: '#C084FC' },
    { speaker: 'Echo of Umbra', text: 'Terrath was once a gentle guardian. Now stone and rage are all that remain.', color: '#C084FC' },
    { speaker: 'Mysterious Voice', text: 'Earth enemies are armored. Use lightning to crack their defenses.', color: '#A855F7' },
  ],
  wind: [
    { speaker: 'Echo of Terrath', text: 'The Sky Peaks. I never thought I\'d see these heights again...', color: '#D97706' },
    { speaker: 'Echo of Terrath', text: 'Zephyros rides the storm winds like a blade. Watch the skies.', color: '#D97706' },
    { speaker: 'Mysterious Voice', text: 'Wind enemies are agile — earth slows them. Use your positioning.', color: '#A855F7' },
  ],
  nature: [
    { speaker: 'Echo of Zephyros', text: 'The Verdant Depths... what was once beautiful is now a trap of thorns.', color: '#34D399' },
    { speaker: 'Echo of Zephyros', text: 'Sylvara\'s grief has turned the forest against all who enter.', color: '#34D399' },
    { speaker: 'Mysterious Voice', text: 'Nature enemies regenerate. Burn them down fast with fire or void.', color: '#A855F7' },
  ],
  void: [
    { speaker: 'Echo of Sylvara', text: 'The Abyss. Even I am afraid. Nullex is not merely corrupted — it is the corruption.', color: '#4ADE80' },
    { speaker: 'Echo of Sylvara', text: 'All elements exist to combat the void. You will need them all.', color: '#4ADE80' },
    { speaker: 'Mysterious Voice', text: 'Void enemies negate your skills. Adapt. Survive. End this.', color: '#A855F7' },
  ],
};

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [phase, setPhase] = useState<GamePhase>('title');
  const [, forceUpdate] = useState(0);
  const [showLore, setShowLore] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [bossZone, setBossZone] = useState<ElementType | null>(null);
  const [showDeath, setShowDeath] = useState(false);
  const [loreUnlocked, setLoreUnlocked] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showNPCDialogue, setShowNPCDialogue] = useState(false);
  const [bossCutsceneZone, setBossCutsceneZone] = useState<ElementType | null>(null);
  const [zoneEntryDialogue, setZoneEntryDialogue] = useState<ElementType | null>(null);
  const [currentZone, setCurrentZone] = useState<ElementType>('fire');
  // Kingdom state
  const [kingdom, setKingdom] = useState<KingdomState>(() => loadKingdom());
  const [showKingdom, setShowKingdom] = useState(false);
  const [kingdomDefeatedZone, setKingdomDefeatedZone] = useState<ElementType>('fire');

  const hasSave = loadGame() !== null;

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  const startGame = useCallback((save: ReturnType<typeof getDefaultSave>, isNew: boolean, kb?: KingdomState) => {
    const kingdomState = kb ?? kingdom;
    const bonuses = getKingdomBonuses(kingdomState);
    initGame(save, bonuses);
    setKingdomRegen(bonuses.hpRegen, bonuses.manaRegen);
    setLoreUnlocked(save.loreUnlocked || []);
    setCurrentZone(save.currentZone);
    setShowDeath(false);
    if (isNew) {
      setPhase('intro'); // show animated intro first
    } else {
      setPhase('playing');
    }
  }, [kingdom]);

  const handleNewGame = useCallback(() => {
    startGame(getDefaultSave(), true);
  }, [startGame]);

  const handleContinue = useCallback(() => {
    const save = loadGame();
    if (save) startGame(save, false);
    else startGame(getDefaultSave(), true);
  }, [startGame]);

  const handleIntroComplete = useCallback(() => {
    setPhase('playing');
    setShowNPCDialogue(true);
  }, []);

  // Set up callbacks
  useEffect(() => {
    setCallbacks({
      onStateChange: () => {
        forceUpdate(n => n + 1);
        const p = getPlayer();
        if (p && p.element !== currentZone) {
          const prevZone = currentZone;
          setCurrentZone(p.element);
          const dialogues = ZONE_ENTRY_DIALOGUES[p.element];
          if (dialogues && dialogues.length > 0 && prevZone !== p.element) {
            setZoneEntryDialogue(p.element);
          }
        }
      },
      onBossEncounter: (zone) => setBossZone(zone),
      onLoreFound: (id) => {
        setLoreUnlocked(prev => {
          if (prev.includes(id)) return prev;
          showNotif('Lore fragment discovered!');
          SFX.loreFound();
          return [...prev, id];
        });
      },
      onLevelUp: () => {
        showNotif('LEVEL UP!');
        setShowStats(true);
      },
      onRoomCleared: () => {
        showNotif('Room Cleared!');
        // Award gold for room clear
        setKingdom(prev => {
          const updated = awardRoomGold(prev, getFloor());
          saveKingdom(updated);
          return updated;
        });
      },
      onBossDefeated: (zone) => {
        setBossCutsceneZone(zone);
        // Award boss gold
        setKingdom(prev => {
          const updated = awardBossGold(prev, getFloor());
          saveKingdom(updated);
          return updated;
        });
      },
    });
  }, [showNotif, currentZone]);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initInput(canvas);

    const loop = (time: number) => {
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      if (!showLore && !showStats && !showSkills && !bossZone && !showDeath && !showTutorial && !showNPCDialogue && !bossCutsceneZone && !zoneEntryDialogue && !showKingdom) {
        update(dt);
      }

      if (isPlayerDead() && !showDeath) {
        setShowDeath(true);
      }

      ctx.fillStyle = '#0a0a14';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      render(ctx);

      animRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = 0;
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase, showLore, showStats, showSkills, bossZone, showDeath, showTutorial, showNPCDialogue, bossCutsceneZone, zoneEntryDialogue, showKingdom]);

  // ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLore) setShowLore(false);
        else if (showSkills) setShowSkills(false);
        else if (showStats) setShowStats(false);
        else if (phase === 'playing') setPhase('paused');
        else if (phase === 'paused') setPhase('playing');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, showLore, showStats, showSkills]);

  const handleSave = useCallback(() => {
    const data = getSaveData();
    data.loreUnlocked = loreUnlocked;
    saveGame(data);
    showNotif('Game Saved!');
  }, [loreUnlocked, showNotif]);

  // After boss cutscene completes, show kingdom hub instead of proceeding directly
  const handleBossCutsceneComplete = useCallback(() => {
    const zone = bossCutsceneZone!;
    setBossCutsceneZone(null);
    const zoneIdx = ZONE_ORDER.indexOf(zone);
    const nextZoneIdx = (zoneIdx + 1) % ZONE_ORDER.length;
    setKingdomDefeatedZone(zone);
    // store next zone for after kingdom
    setCurrentZone(ZONE_ORDER[nextZoneIdx]);
    setShowKingdom(true);
  }, [bossCutsceneZone]);

  const handleKingdomContinue = useCallback(() => {
    setShowKingdom(false);
    // Continue to next floor/zone
    nextRoom();
  }, []);

  if (phase === 'title') {
    return <TitleScreen onNewGame={handleNewGame} onContinue={handleContinue} hasSave={hasSave} />;
  }

  if (phase === 'intro') {
    return <IntroCutscene onComplete={handleIntroComplete} />;
  }

  const player = getPlayer();
  const floor = getFloor();
  const room = getRoom();
  const loreEntries = getLoreEntries(loreUnlocked);
  const nextZone = ZONE_ORDER[(ZONE_ORDER.indexOf(kingdomDefeatedZone) + 1) % ZONE_ORDER.length];

  // Boss name lookup
  const BOSS_NAME_MAP: Record<ElementType, string> = {
    fire: 'Ignis', ice: 'Glacius', lightning: 'Voltaris', shadow: 'Umbra',
    earth: 'Terrath', wind: 'Zephyros', nature: 'Sylvara', void: 'Nullex',
  };

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <SceneBackground zone={currentZone} />

      <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        {getCameraMode() === '3d' ? (
          <Game3DCanvas gameTime={getGameTime()} />
        ) : (
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border border-border cursor-crosshair"
            style={{ imageRendering: 'pixelated' }}
          />
        )}
        {player && (
          <GameHUD
            player={player}
            floor={floor}
            zone={player.element}
            onOpenLore={() => setShowLore(true)}
            onOpenStats={() => setShowStats(true)}
            onOpenSkills={() => setShowSkills(true)}
            onPause={() => setPhase('paused')}
          />
        )}
        {notification && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <p className="text-2xl font-display font-bold text-accent text-glow-lightning tracking-widest animate-pulse-glow">
              {notification}
            </p>
          </div>
        )}
      </div>

      {showLore && <LoreCodex entries={loreEntries} onClose={() => setShowLore(false)} />}
      {showSkills && player && <SkillTree player={player} onClose={() => setShowSkills(false)} />}
      {showStats && player && <StatAllocation player={player} onClose={() => setShowStats(false)} />}
      {bossZone && <BossDialogue zone={bossZone} onComplete={() => setBossZone(null)} />}
      {showNPCDialogue && (
        <NPCDialogue
          lines={POST_INTRO_DIALOGUE}
          zone={currentZone}
          onComplete={() => { setShowNPCDialogue(false); setShowTutorial(true); }}
        />
      )}
      {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}
      {zoneEntryDialogue && (
        <NPCDialogue
          lines={ZONE_ENTRY_DIALOGUES[zoneEntryDialogue]}
          zone={zoneEntryDialogue}
          onComplete={() => setZoneEntryDialogue(null)}
        />
      )}
      {bossCutsceneZone && (
        <StoryCutscene
          title={`${BOSS_NAME_MAP[bossCutsceneZone]} Defeated`}
          lines={POST_BOSS_DIALOGUES[bossCutsceneZone] || []}
          zone={bossCutsceneZone}
          onComplete={handleBossCutsceneComplete}
        />
      )}
      {showKingdom && (
        <KingdomHub
          kingdom={kingdom}
          defeatedZone={kingdomDefeatedZone}
          nextZone={nextZone}
          onUpdateKingdom={(k) => { setKingdom(k); saveKingdom(k); }}
          onContinue={handleKingdomContinue}
          standalone={!bossCutsceneZone}
        />
      )}
      {showDeath && (
        <DeathScreen
          onRespawn={() => { respawnPlayer(); setShowDeath(false); }}
          onQuit={() => { setPhase('title'); setShowDeath(false); }}
          floor={floor}
          zone={player?.element || 'fire'}
        />
      )}
      {phase === 'paused' && (
        <PauseMenu
          onResume={() => setPhase('playing')}
          onSave={handleSave}
          onQuit={() => setPhase('title')}
          onKingdom={() => {
            setKingdomDefeatedZone(player?.element || 'fire');
            setPhase('playing');
            setShowKingdom(true);
          }}
        />
      )}
    </div>
  );
}

