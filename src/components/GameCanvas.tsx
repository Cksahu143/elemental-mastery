import { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ElementType, SKILLS } from '../game/types';
import { initInput, initGame, update, render, setCallbacks, getPlayer, getFloor, getSaveData, isPlayerDead, respawnPlayer, nextRoom, getRoom, switchElement, switchElementBattle, unlockSkill, getActiveSkills, setKingdomRegen, getCameraMode, getGameTime, startMalacharFight, isMalacharActive, fireAllOutAttack, getAllOutCooldown, isGameCompleted, getProgressionZone } from '../game/engine';
import { getDefaultSave, saveGame, loadGame, getLoreEntries } from '../game/saveSystem';
import { POST_BOSS_DIALOGUES } from '../game/lore';
import { SFX } from '../game/audio';
import { loadKingdom, saveKingdom, awardBossGold, awardRoomGold, getKingdomBonuses, KingdomState } from '../game/kingdom';
import {
  GUIDE_INTRO_DIALOGUE, GUIDE_ZONE_DIALOGUES, VILLAIN_TAUNTS,
  getDefaultQuestState, updateQuestProgress, QuestState, QUESTS,
} from '../game/story';
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
import WorldMap from './WorldMap';

type GamePhase = 'title' | 'intro' | 'playing' | 'paused';

const ZONE_ORDER: ElementType[] = ['fire', 'ice', 'lightning', 'shadow', 'earth', 'wind', 'nature', 'void'];

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
  const [kingdom, setKingdom] = useState<KingdomState>(() => loadKingdom());
  const [showKingdom, setShowKingdom] = useState(false);
  const [kingdomDefeatedZone, setKingdomDefeatedZone] = useState<ElementType>('fire');
  // New: quest state, world map, villain cutscene
  const [questState, setQuestState] = useState<QuestState>(() => getDefaultQuestState());
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [villainCutscene, setVillainCutscene] = useState<ElementType | null>(null);
  const [bossesDefeated, setBossesDefeated] = useState<string[]>([]);
  const [totalFloorsCleared, setTotalFloorsCleared] = useState(0);

  const hasSave = loadGame() !== null;

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  // Quest progress helper
  const progressQuest = useCallback((type: any, target: any, amount = 1) => {
    setQuestState(prev => {
      const result = updateQuestProgress(prev, type, target, amount);
      for (const q of result.completed) {
        showNotif(`Quest Complete: ${q.title}!`);
        // Award rewards
        if (q.rewards.loreId) {
          setLoreUnlocked(l => l.includes(q.rewards.loreId!) ? l : [...l, q.rewards.loreId!]);
        }
      }
      for (const q of result.newQuests) {
        showNotif(`New Quest: ${q.title}`);
      }
      return result.state;
    });
  }, [showNotif]);

  const startGame = useCallback((save: ReturnType<typeof getDefaultSave>, isNew: boolean, kb?: KingdomState) => {
    const kingdomState = kb ?? kingdom;
    const bonuses = getKingdomBonuses(kingdomState);
    initGame(save, bonuses);
    setKingdomRegen(bonuses.hpRegen, bonuses.manaRegen);
    setLoreUnlocked(save.loreUnlocked || []);
    setBossesDefeated(save.bossesDefeated || []);
    setCurrentZone(save.currentZone);
    setShowDeath(false);
    if (isNew) {
      setQuestState(getDefaultQuestState());
      setPhase('intro');
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
        // Only trigger zone dialogues when the progression zone changes (not mid-battle element switching)
        const progZone = getProgressionZone();
        if (progZone !== currentZone) {
          const prevZone = currentZone;
          setCurrentZone(progZone);
          const dialogues = GUIDE_ZONE_DIALOGUES[progZone];
          if (dialogues && dialogues.length > 0 && prevZone !== progZone) {
            setZoneEntryDialogue(progZone);
            progressQuest('collect_element', progZone);
          }
        }
      },
      onBossEncounter: (zone) => setBossZone(zone as any),
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
        setTotalFloorsCleared(prev => {
          const next = prev + 1;
          progressQuest('clear_floors', next, 1);
          progressQuest('reach_floor', getFloor());
          return next;
        });
        setKingdom(prev => {
          const updated = awardRoomGold(prev, getFloor());
          saveKingdom(updated);
          return updated;
        });
      },
      onBossDefeated: (zone) => {
        // If zone is 'malachar', handle Malachar-specific cutscene
        if (zone === 'malachar' as any) {
          setBossCutsceneZone('malachar' as any);
          setBossesDefeated(prev => prev.includes('malachar') ? prev : [...prev, 'malachar']);
          progressQuest('defeat_malachar', 'malachar');
          return;
        }
        setBossCutsceneZone(zone);
        setBossesDefeated(prev => prev.includes(zone) ? prev : [...prev, zone]);
        progressQuest('kill_boss', zone);
        setKingdom(prev => {
          const updated = awardBossGold(prev, getFloor());
          saveKingdom(updated);
          return updated;
        });
      },
    });
  }, [showNotif, currentZone, progressQuest]);

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

      const isPaused = showLore || showStats || showSkills || bossZone || showDeath || showTutorial || showNPCDialogue || bossCutsceneZone || zoneEntryDialogue || showKingdom || showWorldMap || villainCutscene;
      if (!isPaused) {
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
  }, [phase, showLore, showStats, showSkills, bossZone, showDeath, showTutorial, showNPCDialogue, bossCutsceneZone, zoneEntryDialogue, showKingdom, showWorldMap, villainCutscene]);

  // Key bindings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showWorldMap) setShowWorldMap(false);
        else if (showLore) setShowLore(false);
        else if (showSkills) setShowSkills(false);
        else if (showStats) setShowStats(false);
        else if (phase === 'playing') setPhase('paused');
        else if (phase === 'paused') setPhase('playing');
      }
      if (e.key.toLowerCase() === 'm' && phase === 'playing' && !showLore && !showSkills && !showStats && !bossZone && !showDeath && !showTutorial && !showNPCDialogue && !bossCutsceneZone && !villainCutscene) {
        setShowWorldMap(prev => !prev);
      }
      // Q key for All-Out Attack
      if (e.key.toLowerCase() === 'q' && phase === 'playing' && !showLore && !showSkills && !showStats && !bossZone && !showDeath && !showTutorial && !showNPCDialogue && !bossCutsceneZone && !villainCutscene && !showWorldMap) {
        fireAllOutAttack();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, showLore, showStats, showSkills, showWorldMap, bossZone, showDeath, showTutorial, showNPCDialogue, bossCutsceneZone, villainCutscene]);

  const handleSave = useCallback(() => {
    const data = getSaveData();
    data.loreUnlocked = loreUnlocked;
    data.bossesDefeated = bossesDefeated;
    saveGame(data);
    showNotif('Game Saved!');
  }, [loreUnlocked, bossesDefeated, showNotif]);

  // After boss post-dialogue, show villain taunt, then kingdom
  const handleBossCutsceneComplete = useCallback(() => {
    const zone = bossCutsceneZone!;
    setBossCutsceneZone(null);
    // Malachar defeat — show his post-defeat dialogue
    if (zone === 'malachar' as any) {
      // Show Malachar post-defeat as villain cutscene
      setVillainCutscene('malachar' as any);
      return;
    }
    // Show villain taunt
    if (VILLAIN_TAUNTS[zone as ElementType] && VILLAIN_TAUNTS[zone as ElementType].length > 0) {
      setVillainCutscene(zone);
    } else {
      proceedToKingdom(zone as ElementType);
    }
  }, [bossCutsceneZone]);

  const proceedToKingdom = useCallback((zone: ElementType) => {
    const zoneIdx = ZONE_ORDER.indexOf(zone);
    const nextZoneIdx = (zoneIdx + 1) % ZONE_ORDER.length;
    const nextZone = ZONE_ORDER[nextZoneIdx];
    setKingdomDefeatedZone(zone);
    setCurrentZone(nextZone);
    // Advance the engine's progression zone to next zone
    switchElement(nextZone);
    setShowKingdom(true);
    progressQuest('visit_kingdom', 'kingdom');
  }, [progressQuest]);

  const handleVillainCutsceneComplete = useCallback(() => {
    const zone = villainCutscene!;
    setVillainCutscene(null);
    // After void boss villain cutscene, trigger Malachar fight
    if (zone === 'void') {
      startMalacharFight();
      return;
    }
    // After Malachar defeat villain cutscene — game won, go to kingdom
    if (zone === 'malachar' as any) {
      setKingdomDefeatedZone('void');
      setShowKingdom(true);
      return;
    }
    proceedToKingdom(zone);
  }, [villainCutscene, proceedToKingdom]);

  const handleKingdomContinue = useCallback(() => {
    setShowKingdom(false);
    // If game is completed (Malachar defeated), go back to title
    if (isGameCompleted()) {
      showNotif('Congratulations! You saved the world!');
      setTimeout(() => setPhase('title'), 3000);
      return;
    }
    nextRoom();
  }, [showNotif]);

  const handleMapSelectZone = useCallback((zone: ElementType) => {
    switchElement(zone);
    setCurrentZone(zone);
    setShowWorldMap(false);
  }, []);

  if (phase === 'title') {
    return <TitleScreen onNewGame={handleNewGame} onContinue={handleContinue} hasSave={hasSave} />;
  }

  if (phase === 'intro') {
    return <IntroCutscene onComplete={handleIntroComplete} />;
  }

  const player = getPlayer();
  const floor = getFloor();
  const loreEntries = getLoreEntries(loreUnlocked);
  const nextZone = ZONE_ORDER[(ZONE_ORDER.indexOf(kingdomDefeatedZone) + 1) % ZONE_ORDER.length];

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
            questState={questState}
            onOpenLore={() => setShowLore(true)}
            onOpenStats={() => setShowStats(true)}
            onOpenSkills={() => setShowSkills(true)}
            onOpenMap={() => setShowWorldMap(true)}
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

      {/* Guide intro dialogue (replaces old Mysterious Voice) */}
      {showNPCDialogue && (
        <NPCDialogue
          lines={GUIDE_INTRO_DIALOGUE}
          zone={currentZone}
          onComplete={() => { setShowNPCDialogue(false); setShowTutorial(true); }}
        />
      )}
      {showTutorial && <Tutorial onComplete={() => setShowTutorial(false)} />}

      {/* Guide zone commentary */}
      {zoneEntryDialogue && (
        <NPCDialogue
          lines={GUIDE_ZONE_DIALOGUES[zoneEntryDialogue]}
          zone={zoneEntryDialogue}
          onComplete={() => setZoneEntryDialogue(null)}
        />
      )}

      {/* Boss post-fight cutscene */}
      {bossCutsceneZone && (
        <StoryCutscene
          title={`${BOSS_NAME_MAP[bossCutsceneZone]} Defeated`}
          lines={POST_BOSS_DIALOGUES[bossCutsceneZone] || []}
          zone={bossCutsceneZone}
          onComplete={handleBossCutsceneComplete}
        />
      )}

      {/* Villain taunt after boss */}
      {villainCutscene && (
        <StoryCutscene
          title="A Dark Presence..."
          lines={VILLAIN_TAUNTS[villainCutscene]}
          zone={villainCutscene}
          onComplete={handleVillainCutsceneComplete}
        />
      )}

      {/* World Map */}
      {showWorldMap && player && (
        <WorldMap
          unlockedElements={player.unlockedElements}
          bossesDefeated={bossesDefeated}
          currentZone={currentZone}
          questState={questState}
          onSelectZone={handleMapSelectZone}
          onClose={() => setShowWorldMap(false)}
        />
      )}

      {showKingdom && (
        <KingdomHub
          kingdom={kingdom}
          defeatedZone={kingdomDefeatedZone}
          nextZone={nextZone}
          onUpdateKingdom={(k) => {
            setKingdom(k);
            saveKingdom(k);
            // Check building upgrade quests
            const builtCount = Object.values(k.buildings).filter(v => v > 0).length;
            progressQuest('upgrade_building', builtCount);
            Object.entries(k.buildings).forEach(([id, level]) => {
              if (level > 0) progressQuest('upgrade_building', id);
            });
          }}
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
