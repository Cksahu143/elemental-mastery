import { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ElementType, SKILLS } from '../game/types';
import { initInput, initGame, update, render, setCallbacks, getPlayer, getFloor, getSaveData, isPlayerDead, respawnPlayer, nextRoom, getRoom, switchElement, switchElementBattle, unlockSkill, getActiveSkills, setKingdomRegen, getCameraMode, getGameTime, startMalacharFight, isMalacharActive, fireAllOutAttack, getAllOutCooldown, isGameCompleted, getProgressionZone, getComboState, setMalacharQTECallback, resolveMalacharQTE, isMalacharPhase2, type MalacharQTEType } from '../game/engine';
import { getDefaultSave, saveGame, loadGame, getLoreEntries } from '../game/saveSystem';
import { POST_BOSS_DIALOGUES } from '../game/lore';
import { SFX } from '../game/audio';
import { loadKingdom, saveKingdom, awardBossGold, awardRoomGold, getKingdomBonuses, KingdomState } from '../game/kingdom';
import {
  GUIDE_INTRO_DIALOGUE, GUIDE_ZONE_DIALOGUES, VILLAIN_TAUNTS,
  MALACHAR_DEFEAT_TAUNTS,
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
import MalacharQTE from './MalacharQTE';
import VictoryScreen from './VictoryScreen';
import SealedDoor from './SealedDoor';
import KeyOrbitCutscene from './KeyOrbitCutscene';
import SecretRoomScene from './SecretRoomScene';
import EndingSelectionDialog, { EndingChoice } from './EndingSelectionDialog';
import TrialScreen, { TrialId } from './TrialScreen';
import ConvergenceDungeon from './ConvergenceDungeon';
import AscendedMalacharFight from './AscendedMalacharFight';
import TrueEndingCutscene from './TrueEndingCutscene';
import { EndgameState, makeDefaultEndgame, hasAllBossKeys, bossKeyName, TRUE_KEYS } from '../game/endgame';
import AdminPanel from './AdminPanel';

type GamePhase = 'title' | 'intro' | 'playing' | 'paused';
type FinalBossSceneZone = ElementType | 'malachar';

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
  const [bossCutsceneZone, setBossCutsceneZone] = useState<FinalBossSceneZone | null>(null);
  const [zoneEntryDialogue, setZoneEntryDialogue] = useState<ElementType | null>(null);
  const [currentZone, setCurrentZone] = useState<ElementType>('fire');
  const [kingdom, setKingdom] = useState<KingdomState>(() => loadKingdom());
  const [showKingdom, setShowKingdom] = useState(false);
  const [kingdomDefeatedZone, setKingdomDefeatedZone] = useState<ElementType>('fire');
  // New: quest state, world map, villain cutscene
  const [questState, setQuestState] = useState<QuestState>(() => getDefaultQuestState());
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [villainCutscene, setVillainCutscene] = useState<FinalBossSceneZone | null>(null);
  const [bossesDefeated, setBossesDefeated] = useState<string[]>([]);
  const [totalFloorsCleared, setTotalFloorsCleared] = useState(0);
  const [showMalacharQTE, setShowMalacharQTE] = useState(false);
  const [qteType, setQteType] = useState<MalacharQTEType>('block');
  const [showVictory, setShowVictory] = useState(false);
  // ─── Endgame layer state ───
  const [endgame, setEndgame] = useState<EndgameState>(() => {
    const s = loadGame();
    if (!s) return makeDefaultEndgame();
    return {
      keysCollected: s.keysCollected ?? {},
      trueKeys: s.trueKeys ?? {},
      malacharDefeatedOnce: s.malacharDefeatedOnce ?? false,
      secretRoomUnlocked: s.secretRoomUnlocked ?? false,
      ascendedMalacharDefeated: s.ascendedMalacharDefeated ?? false,
      endingChosen: s.endingChosen,
    };
  });
  // post-victory empty arena overlays
  const [inEmptyArena, setInEmptyArena] = useState(false);
  const [showSealedDoor, setShowSealedDoor] = useState(false);
  const [showKeyOrbit, setShowKeyOrbit] = useState(false);
  const [showSecretRoom, setShowSecretRoom] = useState(false);
  const [showEndingSelect, setShowEndingSelect] = useState(false);
  const [activeTrial, setActiveTrial] = useState<TrialId | null>(null);
  const [showConvergence, setShowConvergence] = useState(false);
  const [showAscended, setShowAscended] = useState(false);
  const [showTrueEnding, setShowTrueEnding] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const hasSave = loadGame() !== null;

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  // Centralized autosave — call after any progression checkpoint
  const autosave = useCallback((reason: string, overrides?: { bossesDefeated?: string[]; loreUnlocked?: string[]; endgame?: EndgameState }) => {
    const data = getSaveData();
    data.loreUnlocked = overrides?.loreUnlocked ?? loreUnlocked;
    data.bossesDefeated = overrides?.bossesDefeated ?? bossesDefeated;
    const eg = overrides?.endgame ?? endgame;
    data.keysCollected = eg.keysCollected;
    data.trueKeys = eg.trueKeys;
    data.malacharDefeatedOnce = eg.malacharDefeatedOnce;
    data.secretRoomUnlocked = eg.secretRoomUnlocked;
    data.ascendedMalacharDefeated = eg.ascendedMalacharDefeated;
    data.endingChosen = eg.endingChosen;
    saveGame(data);
    showNotif(`Autosaved — ${reason}`);
  }, [loreUnlocked, bossesDefeated, endgame, showNotif]);

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
    setEndgame({
      keysCollected: save.keysCollected ?? {},
      trueKeys: save.trueKeys ?? {},
      malacharDefeatedOnce: save.malacharDefeatedOnce ?? false,
      secretRoomUnlocked: save.secretRoomUnlocked ?? false,
      ascendedMalacharDefeated: save.ascendedMalacharDefeated ?? false,
      endingChosen: save.endingChosen,
    });
    // Reset transient endgame overlays
    setInEmptyArena(false);
    setShowSealedDoor(false);
    setShowKeyOrbit(false);
    setShowSecretRoom(false);
    setShowEndingSelect(false);
    setActiveTrial(null);
    setShowConvergence(false);
    setShowAscended(false);
    setShowTrueEnding(false);
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

  // Set up Malachar QTE callback
  useEffect(() => {
    setMalacharQTECallback((type) => {
      setQteType(type);
      setShowMalacharQTE(true);
    });
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
        autosave('Level Up');
      },
      onElementUnlocked: (zone) => {
        autosave(`${zone.charAt(0).toUpperCase() + zone.slice(1)} Element Unlocked`);
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
          setBossesDefeated(prev => {
            const next = prev.includes('malachar') ? prev : [...prev, 'malachar'];
            autosave('Malachar Defeated', { bossesDefeated: next });
            return next;
          });
          // Mark Malachar defeated once — unlocks empty-arena re-entry
          setEndgame(prev => {
            const next = { ...prev, malacharDefeatedOnce: true };
            autosave('Malachar Defeated Once', { endgame: next });
            return next;
          });
          progressQuest('defeat_malachar', 'malachar');
          return;
        }
        setBossCutsceneZone(zone);
        setBossesDefeated(prev => {
          const next = prev.includes(zone) ? prev : [...prev, zone];
          autosave(`${zone.charAt(0).toUpperCase() + zone.slice(1)} Boss Defeated`, { bossesDefeated: next });
          return next;
        });
        // Award key if not yet collected
        setEndgame(prev => {
          if (prev.keysCollected[zone]) return prev;
          const next: EndgameState = { ...prev, keysCollected: { ...prev.keysCollected, [zone]: true } };
          showNotif(`🗝 ${bossKeyName(zone)} obtained!`);
          autosave(`${bossKeyName(zone)} Obtained`, { endgame: next });
          return next;
        });
        progressQuest('kill_boss', zone);
        setKingdom(prev => {
          const updated = awardBossGold(prev, getFloor());
          saveKingdom(updated);
          return updated;
        });
      },
    });
  }, [showNotif, currentZone, progressQuest, autosave]);

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

      const isPaused = showLore || showStats || showSkills || bossZone || showDeath || showTutorial || showNPCDialogue || bossCutsceneZone || zoneEntryDialogue || showKingdom || showWorldMap || villainCutscene || showMalacharQTE || showVictory || inEmptyArena || showSealedDoor || showKeyOrbit || showSecretRoom || showEndingSelect || !!activeTrial || showConvergence || showAscended || showTrueEnding || showAdmin;
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
  }, [phase, showLore, showStats, showSkills, bossZone, showDeath, showTutorial, showNPCDialogue, bossCutsceneZone, zoneEntryDialogue, showKingdom, showWorldMap, villainCutscene, showMalacharQTE, showVictory, inEmptyArena, showSealedDoor, showKeyOrbit, showSecretRoom, showEndingSelect, activeTrial, showConvergence, showAscended, showTrueEnding, showAdmin]);

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
      // Admin panel toggle: backtick (`) — only while playing
      if ((e.key === '`' || e.key === '~') && phase === 'playing') {
        setShowAdmin(prev => !prev);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, showLore, showStats, showSkills, showWorldMap, bossZone, showDeath, showTutorial, showNPCDialogue, bossCutsceneZone, villainCutscene]);

  const handleSave = useCallback(() => {
    const data = getSaveData();
    data.loreUnlocked = loreUnlocked;
    data.bossesDefeated = bossesDefeated;
    data.keysCollected = endgame.keysCollected;
    data.trueKeys = endgame.trueKeys;
    data.malacharDefeatedOnce = endgame.malacharDefeatedOnce;
    data.secretRoomUnlocked = endgame.secretRoomUnlocked;
    data.ascendedMalacharDefeated = endgame.ascendedMalacharDefeated;
    data.endingChosen = endgame.endingChosen;
    saveGame(data);
    showNotif('Game Saved!');
  }, [loreUnlocked, bossesDefeated, endgame, showNotif]);

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
    // After Malachar defeat villain cutscene — game won, show epic victory screen.
    if (zone === 'malachar') {
      setShowVictory(true);
      return;
    }
    proceedToKingdom(zone);
}, [villainCutscene, proceedToKingdom]);

 const handleKingdomContinue = useCallback(() => {
    setShowKingdom(false);
    if (isGameCompleted()) {
      showNotif('Congratulations! You saved the world!');
      setTimeout(() => setPhase('title'), 3000);
      return;
    }
    if (kingdomDefeatedZone === 'void' && !endgame.malacharDefeatedOnce) {
      startMalacharFight();
      return;
    }
    nextRoom();
}, [showNotif, kingdomDefeatedZone, endgame]);

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
            endgame={endgame}
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
        {/* Combo Display */}
        {(() => {
          const combo = getComboState();
          return (
            <>
              {combo.display && (
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none text-center">
                  <p
                    className="text-3xl font-display font-bold tracking-widest animate-pulse"
                    style={{ color: combo.display.color, textShadow: `0 0 30px ${combo.display.color}, 0 0 60px ${combo.display.color}50` }}
                  >
                    {combo.display.name}!
                  </p>
                  {combo.counter > 1 && (
                    <p className="text-lg font-ui font-bold mt-1" style={{ color: combo.display.color }}>
                      {combo.counter}x COMBO — {Math.floor(combo.counter * 15)}% BONUS
                    </p>
                  )}
                </div>
              )}
              {combo.counter > 0 && !combo.display && (
                <div className="absolute top-4 right-4 z-30 pointer-events-none">
                  <div className="bg-card/80 border border-border rounded px-3 py-1 text-center">
                    <p className="text-xs font-ui text-muted-foreground">COMBO</p>
                    <p className="text-xl font-display font-bold text-accent">{combo.counter}x</p>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Malachar QTE */}
      {showMalacharQTE && (
        <MalacharQTE
          qteType={qteType}
          onComplete={(success) => {
            setShowMalacharQTE(false);
            resolveMalacharQTE(success);
            if (success) {
              if (qteType === 'counter') showNotif('REFLECTED! Malachar takes massive damage!');
              else if (qteType === 'dodge') showNotif('DODGED! Malachar is off-balance!');
              else showNotif('BLOCKED! Malachar is stunned!');
            } else {
              if (qteType === 'counter') showNotif('Failed to reflect — devastating hit!');
              else if (qteType === 'dodge') showNotif('Beam connected!');
              else showNotif('Failed to block!');
            }
          }}
        />
      )}

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
          title={`${bossCutsceneZone === 'malachar' ? 'Malachar' : BOSS_NAME_MAP[bossCutsceneZone]} Defeated`}
          lines={POST_BOSS_DIALOGUES[bossCutsceneZone] || []}
          zone={bossCutsceneZone === 'malachar' ? 'void' : bossCutsceneZone}
          onComplete={handleBossCutsceneComplete}
        />
      )}

      {/* Villain taunt after boss */}
      {villainCutscene && (
        <StoryCutscene
          title="A Dark Presence..."
          lines={villainCutscene === 'malachar' ? MALACHAR_DEFEAT_TAUNTS : VILLAIN_TAUNTS[villainCutscene]}
          zone={villainCutscene === 'malachar' ? 'void' : villainCutscene}
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
          showReturnToArena={endgame.malacharDefeatedOnce && !endgame.ascendedMalacharDefeated}
          onReturnToArena={() => {
            setShowKingdom(false);
            setInEmptyArena(true);
            showNotif('You enter the silent arena…');
          }}
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
      {showVictory && (
        <VictoryScreen
          floor={floor}
          bossesDefeated={bossesDefeated}
          onReturnToTitle={() => {
            setShowVictory(false);
            setPhase('title');
          }}
          onVisitKingdom={() => {
            setShowVictory(false);
            setKingdomDefeatedZone('void');
            setShowKingdom(true);
          }}
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

      {/* ─── Endgame Layer ─── */}
      {inEmptyArena && (
        <EmptyArenaOverlay
          endgame={endgame}
          onApproachDoor={() => setShowSealedDoor(true)}
          onLeave={() => {
            setInEmptyArena(false);
            setKingdomDefeatedZone('void');
            setShowKingdom(true);
          }}
        />
      )}
      {showSealedDoor && (
        <SealedDoor
          endgame={endgame}
          onUseKeys={() => {
            if (!hasAllBossKeys(endgame)) return;
            setShowSealedDoor(false);
            setShowKeyOrbit(true);
          }}
          onLeave={() => setShowSealedDoor(false)}
        />
      )}
      {showKeyOrbit && (
        <KeyOrbitCutscene
          onComplete={() => {
            setShowKeyOrbit(false);
            setEndgame(prev => {
              const next = { ...prev, secretRoomUnlocked: true };
              autosave('Secret Room Unlocked', { endgame: next });
              return next;
            });
            setInEmptyArena(false);
            setShowSecretRoom(true);
          }}
        />
      )}
      {showSecretRoom && (
        <SecretRoomScene
          endgame={endgame}
          onInteract={() => setShowEndingSelect(true)}
          onLeave={() => {
            setShowSecretRoom(false);
            setKingdomDefeatedZone('void');
            setShowKingdom(true);
          }}
        />
      )}
      {showEndingSelect && (
        <EndingSelectionDialog
          endgame={endgame}
          onChoose={(choice: EndingChoice) => {
            setShowEndingSelect(false);
            if (choice === 'fix') {
              setEndgame(prev => {
                const next = { ...prev, endingChosen: 'true' as const };
                autosave('Convergence Initiated', { endgame: next });
                return next;
              });
              setShowSecretRoom(false);
              setShowConvergence(true);
            } else {
              setActiveTrial(choice as TrialId);
            }
          }}
          onClose={() => setShowEndingSelect(false)}
        />
      )}
      {activeTrial && (
        <TrialScreen
          trial={activeTrial}
          onComplete={(success, reward) => {
            if (success) {
              setEndgame(prev => {
                const next: EndgameState = { ...prev, trueKeys: { ...prev.trueKeys, [reward]: true } };
                const trialName = TRUE_KEYS.find(k => k.id === reward)?.name ?? 'Trial';
                autosave(`Trial Completed — ${trialName}`, { endgame: next });
                return next;
              });
            }
            setActiveTrial(null);
          }}
        />
      )}
      {showConvergence && (
        <ConvergenceDungeon
          onReachBoss={() => {
            setShowConvergence(false);
            setShowAscended(true);
          }}
          onAbandon={() => {
            setShowConvergence(false);
            setShowSecretRoom(true);
          }}
        />
      )}
      {showAscended && (
        <AscendedMalacharFight
          onVictory={() => {
            setShowAscended(false);
            setEndgame(prev => {
              const next = { ...prev, ascendedMalacharDefeated: true, endingChosen: 'true' as const };
              autosave('Ascended Malachar Defeated', { endgame: next });
              return next;
            });
            setShowTrueEnding(true);
          }}
          onDefeat={() => {
            setShowAscended(false);
            showNotif('Ascended Malachar overwhelmed you…');
            setShowSecretRoom(true);
          }}
        />
      )}
      {showTrueEnding && (
        <TrueEndingCutscene
          onComplete={() => {
            setShowTrueEnding(false);
            setPhase('title');
          }}
        />
      )}

      {/* ─── Admin / Debug Console (toggle with `) ─── */}
      {showAdmin && (
        <AdminPanel
          endgame={endgame}
          onUpdateEndgame={(next) => {
            setEndgame(next);
            autosave('Admin update', { endgame: next });
          }}
          onClose={() => setShowAdmin(false)}
          onNotify={showNotif}
          jumps={{
            toEmptyArena: () => {
              setEndgame(prev => prev.malacharDefeatedOnce ? prev : { ...prev, malacharDefeatedOnce: true });
              setShowSealedDoor(false); setShowKeyOrbit(false); setShowSecretRoom(false);
              setShowEndingSelect(false); setActiveTrial(null);
              setShowConvergence(false); setShowAscended(false); setShowTrueEnding(false);
              setInEmptyArena(true);
            },
            toSealedDoor: () => {
              setInEmptyArena(false); setShowKeyOrbit(false); setShowSecretRoom(false);
              setShowEndingSelect(false); setActiveTrial(null);
              setShowConvergence(false); setShowAscended(false); setShowTrueEnding(false);
              setShowSealedDoor(true);
            },
            toSecretRoom: () => {
              setEndgame(prev => prev.secretRoomUnlocked ? prev : { ...prev, secretRoomUnlocked: true, malacharDefeatedOnce: true });
              setInEmptyArena(false); setShowSealedDoor(false); setShowKeyOrbit(false);
              setShowEndingSelect(false); setActiveTrial(null);
              setShowConvergence(false); setShowAscended(false); setShowTrueEnding(false);
              setShowSecretRoom(true);
            },
            toEndingSelect: () => {
              setShowSecretRoom(true);
              setShowEndingSelect(true);
            },
            toConvergence: () => {
              setInEmptyArena(false); setShowSealedDoor(false); setShowKeyOrbit(false);
              setShowSecretRoom(false); setShowEndingSelect(false); setActiveTrial(null);
              setShowAscended(false); setShowTrueEnding(false);
              setShowConvergence(true);
            },
            toAscendedMalachar: () => {
              setInEmptyArena(false); setShowSealedDoor(false); setShowKeyOrbit(false);
              setShowSecretRoom(false); setShowEndingSelect(false); setActiveTrial(null);
              setShowConvergence(false); setShowTrueEnding(false);
              setShowAscended(true);
            },
            toTrueEnding: () => {
              setInEmptyArena(false); setShowSealedDoor(false); setShowKeyOrbit(false);
              setShowSecretRoom(false); setShowEndingSelect(false); setActiveTrial(null);
              setShowConvergence(false); setShowAscended(false);
              setShowTrueEnding(true);
            },
            startMalacharFight: () => {
              setInEmptyArena(false); setShowSealedDoor(false); setShowKeyOrbit(false);
              setShowSecretRoom(false); setShowEndingSelect(false); setActiveTrial(null);
              setShowConvergence(false); setShowAscended(false); setShowTrueEnding(false);
              startMalacharFight();
            },
          }}
        />
      )}
    </div>
  );
}

// ─── Quiet, broken arena visited after defeating Malachar. ───
// Pure UI overlay — engine remains paused while the player browses.
function EmptyArenaOverlay({
  endgame, onApproachDoor, onLeave,
}: { endgame: EndgameState; onApproachDoor: () => void; onLeave: () => void }) {
  return (
    <div className="fixed inset-0 z-40 bg-gradient-to-b from-black via-purple-950/40 to-black flex flex-col items-center justify-center">
      {/* Broken arena flavor */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-pink-500/10 blur-2xl"
            style={{
              width: 60 + Math.random() * 120,
              height: 60 + Math.random() * 120,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-xl px-6">
        <p className="text-[10px] font-ui uppercase tracking-[0.5em] text-pink-300/60 mb-2">
          Where the Architect Fell
        </p>
        <h2 className="text-3xl font-display text-pink-100 mb-4">The Silent Arena</h2>
        <p className="text-foreground/70 text-sm italic mb-6">
          The hazards have dimmed. The pillars are cracked. At the back of the chamber,
          a door you never noticed before now hums faintly.
        </p>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={onApproachDoor}
            className="px-8 py-3 border-2 border-yellow-500/70 text-yellow-100 bg-yellow-500/10 rounded font-display tracking-widest uppercase hover:scale-105 transition-all"
            style={{ boxShadow: '0 0 30px rgba(250,204,21,0.3)' }}
          >
            Approach the Sealed Door
          </button>
          <button
            onClick={onLeave}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Leave the arena
          </button>
        </div>
      </div>
    </div>
  );
}
