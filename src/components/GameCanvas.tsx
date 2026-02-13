import { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, ElementType, LoreEntry } from '../game/types';
import { initInput, initGame, update, render, setCallbacks, getPlayer, getFloor, getSaveData, isPlayerDead, respawnPlayer, nextRoom, getRoom } from '../game/engine';
import { getDefaultSave, saveGame, loadGame, getLoreEntries } from '../game/saveSystem';
import TitleScreen from './TitleScreen';
import GameHUD from './GameHUD';
import LoreCodex from './LoreCodex';
import StatAllocation from './StatAllocation';
import BossDialogue from './BossDialogue';
import DeathScreen from './DeathScreen';
import PauseMenu from './PauseMenu';

type GamePhase = 'title' | 'playing' | 'paused';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [phase, setPhase] = useState<GamePhase>('title');
  const [, forceUpdate] = useState(0);
  const [showLore, setShowLore] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [bossZone, setBossZone] = useState<ElementType | null>(null);
  const [showDeath, setShowDeath] = useState(false);
  const [loreUnlocked, setLoreUnlocked] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  const hasSave = loadGame() !== null;

  const showNotif = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  const startGame = useCallback((save: ReturnType<typeof getDefaultSave>) => {
    initGame(save);
    setLoreUnlocked(save.loreUnlocked || []);
    setPhase('playing');
    setShowDeath(false);
  }, []);

  const handleNewGame = useCallback(() => {
    startGame(getDefaultSave());
  }, [startGame]);

  const handleContinue = useCallback(() => {
    const save = loadGame();
    if (save) startGame(save);
    else startGame(getDefaultSave());
  }, [startGame]);

  // Set up callbacks
  useEffect(() => {
    setCallbacks({
      onStateChange: () => forceUpdate(n => n + 1),
      onBossEncounter: (zone) => setBossZone(zone),
      onLoreFound: (id) => {
        setLoreUnlocked(prev => {
          if (prev.includes(id)) return prev;
          showNotif('Lore fragment discovered!');
          return [...prev, id];
        });
      },
      onLevelUp: () => {
        showNotif('LEVEL UP!');
        setShowStats(true);
      },
      onRoomCleared: () => showNotif('Room Cleared!'),
    });
  }, [showNotif]);

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

      if (!showLore && !showStats && !bossZone && !showDeath) {
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
  }, [phase, showLore, showStats, bossZone, showDeath]);

  // ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showLore) setShowLore(false);
        else if (showStats) setShowStats(false);
        else if (phase === 'playing') setPhase('paused');
        else if (phase === 'paused') setPhase('playing');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, showLore, showStats]);

  const handleSave = useCallback(() => {
    const data = getSaveData();
    data.loreUnlocked = loreUnlocked;
    saveGame(data);
    showNotif('Game Saved!');
  }, [loreUnlocked, showNotif]);

  if (phase === 'title') {
    return <TitleScreen onNewGame={handleNewGame} onContinue={handleContinue} hasSave={hasSave} />;
  }

  const player = getPlayer();
  const floor = getFloor();
  const room = getRoom();
  const loreEntries = getLoreEntries(loreUnlocked);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center">
      <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border border-border cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
        />
        {player && (
          <GameHUD
            player={player}
            floor={floor}
            zone={player.element}
            onOpenLore={() => setShowLore(true)}
            onOpenStats={() => setShowStats(true)}
            onPause={() => setPhase('paused')}
          />
        )}
        {/* Notification */}
        {notification && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <p className="text-2xl font-display font-bold text-accent text-glow-lightning tracking-widest animate-pulse-glow">
              {notification}
            </p>
          </div>
        )}
      </div>

      {showLore && <LoreCodex entries={loreEntries} onClose={() => setShowLore(false)} />}
      {showStats && player && <StatAllocation player={player} onClose={() => setShowStats(false)} />}
      {bossZone && <BossDialogue zone={bossZone} onComplete={() => setBossZone(null)} />}
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
        />
      )}
    </div>
  );
}
