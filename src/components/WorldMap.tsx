import { useState, useRef, useEffect } from 'react';
import { ElementType, ELEMENT_COLORS } from '../game/types';
import { getWorldMapZones, WorldMapZone, QUESTS, QuestState, GUIDE_NAME, GUIDE_COLOR } from '../game/story';

interface WorldMapProps {
  unlockedElements: ElementType[];
  bossesDefeated: string[];
  currentZone: ElementType;
  questState: QuestState;
  onSelectZone: (zone: ElementType) => void;
  onClose: () => void;
}

function MapCanvas({ zones, hoveredZone }: { zones: WorldMapZone[]; hoveredZone: string | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    const W = canvas.offsetWidth, H = canvas.offsetHeight;

    let time = 0;
    const draw = () => {
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Background — dark parchment
      const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
      bg.addColorStop(0, '#0f1419');
      bg.addColorStop(0.7, '#0a0e14');
      bg.addColorStop(1, '#050810');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Stars
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137 + 17) % W;
        const sy = (i * 79 + 31) % (H * 0.4);
        const pulse = 0.3 + 0.4 * Math.sin(time * 1.2 + i * 0.8);
        ctx.fillStyle = `rgba(255,255,255,${pulse * 0.5})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 0.6 + pulse * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mountain silhouettes
      ctx.fillStyle = 'rgba(15,20,35,0.8)';
      ctx.beginPath();
      ctx.moveTo(0, H * 0.35);
      for (let i = 0; i <= 12; i++) {
        const x = (i / 12) * W;
        const y = H * 0.25 - Math.sin(i * 1.1 + 0.5) * H * 0.08;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H * 0.35);
      ctx.closePath();
      ctx.fill();

      // Ground
      const grd = ctx.createLinearGradient(0, H * 0.35, 0, H);
      grd.addColorStop(0, '#111820');
      grd.addColorStop(1, '#0a0f16');
      ctx.fillStyle = grd;
      ctx.fillRect(0, H * 0.35, W, H * 0.65);

      // Connection paths
      ctx.lineWidth = 2;
      for (const zone of zones) {
        if (!zone.unlocked) continue;
        for (const connId of zone.connectedTo) {
          const conn = zones.find(z => z.id === connId);
          if (!conn || !conn.unlocked) continue;
          const x1 = zone.x / 100 * W, y1 = zone.y / 100 * H;
          const x2 = conn.x / 100 * W, y2 = conn.y / 100 * H;
          const grad = ctx.createLinearGradient(x1, y1, x2, y2);
          grad.addColorStop(0, zone.color + '60');
          grad.addColorStop(1, conn.color + '60');
          ctx.strokeStyle = grad;
          ctx.shadowColor = zone.color;
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Zone nodes
      for (const zone of zones) {
        const x = zone.x / 100 * W;
        const y = zone.y / 100 * H;
        const isHovered = hoveredZone === zone.id;
        const pulse = 0.8 + 0.2 * Math.sin(time * 2 + zone.x * 0.1);
        const r = zone.unlocked ? (isHovered ? 22 : 18) : 10;

        if (zone.unlocked) {
          // Glow
          const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
          glow.addColorStop(0, zone.color + '40');
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);

          // Node circle
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = zone.cleared
            ? zone.color + '90'
            : `rgba(15,20,30,${0.85 * pulse})`;
          ctx.fill();
          ctx.strokeStyle = zone.color;
          ctx.lineWidth = zone.cleared ? 3 : 2;
          ctx.stroke();

          // Icon
          ctx.font = `${r * 0.9}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.fillText(zone.icon, x, y + 1);

          // Cleared check
          if (zone.cleared) {
            ctx.font = 'bold 10px sans-serif';
            ctx.fillStyle = '#4ADE80';
            ctx.fillText('✓', x + r * 0.7, y - r * 0.7);
          }
        } else {
          // Locked node
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(30,30,40,0.6)';
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = `${r * 0.8}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#555';
          ctx.fillText('🔒', x, y + 1);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [zones, hoveredZone]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function WorldMap({ unlockedElements, bossesDefeated, currentZone, questState, onSelectZone, onClose }: WorldMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<WorldMapZone | null>(null);
  const zones = getWorldMapZones(unlockedElements, bossesDefeated);

  const handleZoneClick = (zone: WorldMapZone) => {
    if (!zone.unlocked) return;
    setSelectedZone(zone);
  };

  const activeQuests = questState.active.map(id => QUESTS.find(q => q.id === id)).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Map area */}
      <div className="relative flex-1">
        <MapCanvas zones={zones} hoveredZone={hoveredZone} />

        {/* Clickable zone overlays */}
        {zones.map(zone => (
          <button
            key={zone.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full transition-all ${
              zone.unlocked ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'
            }`}
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: zone.unlocked ? 44 : 24,
              height: zone.unlocked ? 44 : 24,
            }}
            onMouseEnter={() => setHoveredZone(zone.id)}
            onMouseLeave={() => setHoveredZone(null)}
            onClick={() => handleZoneClick(zone)}
          />
        ))}

        {/* Zone labels */}
        {zones.filter(z => z.unlocked).map(zone => (
          <div
            key={`label-${zone.id}`}
            className="absolute transform -translate-x-1/2 pointer-events-none text-center"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y + 5}%`,
            }}
          >
            <p className="text-[10px] font-ui font-bold tracking-wider" style={{ color: zone.color }}>
              {zone.name}
            </p>
          </div>
        ))}

        {/* Title */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <h1 className="text-2xl font-display font-bold text-foreground tracking-widest">
            WORLD MAP
          </h1>
          <p className="text-xs font-ui text-muted-foreground mt-1">
            Select a zone to travel
          </p>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 px-4 py-2 text-xs font-ui uppercase tracking-wider border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors bg-card/80 backdrop-blur-sm"
        >
          Close (M)
        </button>

        {/* Current zone indicator */}
        <div className="absolute bottom-4 left-4 bg-card/80 backdrop-blur-sm border border-border px-4 py-2 rounded">
          <p className="text-[10px] font-ui text-muted-foreground uppercase tracking-wider">Current Zone</p>
          <p className="text-sm font-display font-bold" style={{ color: ELEMENT_COLORS[currentZone] }}>
            {zones.find(z => z.id === currentZone)?.name || currentZone}
          </p>
        </div>
      </div>

      {/* Right panel — zone details & quests */}
      <div className="w-80 bg-black/80 backdrop-blur-md border-l border-white/10 flex flex-col overflow-y-auto">
        {selectedZone ? (
          <div className="p-5 flex flex-col gap-4">
            {/* Zone header */}
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full border-2 flex items-center justify-center text-2xl"
                style={{
                  borderColor: selectedZone.color,
                  background: `radial-gradient(circle, ${selectedZone.color}20, transparent)`,
                }}
              >
                {selectedZone.icon}
              </div>
              <div>
                <h2 className="font-display text-lg font-bold" style={{ color: selectedZone.color }}>
                  {selectedZone.name}
                </h2>
                <p className="text-xs font-ui text-muted-foreground">
                  Boss: {selectedZone.bossName}
                </p>
              </div>
            </div>

            <p className="text-xs font-ui text-muted-foreground leading-relaxed">
              {selectedZone.description}
            </p>

            {selectedZone.cleared && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded">
                <span className="text-green-400 text-sm">✓</span>
                <span className="text-xs font-ui text-green-400">Boss Defeated</span>
              </div>
            )}

            {selectedZone.unlocked && selectedZone.id !== 'malachar' && (
              <button
                onClick={() => {
                  onSelectZone(selectedZone.id as ElementType);
                  onClose();
                }}
                className="w-full py-3 text-sm font-ui font-bold uppercase tracking-wider border-2 transition-all hover:scale-105"
                style={{
                  borderColor: selectedZone.color,
                  color: selectedZone.color,
                  background: `${selectedZone.color}15`,
                }}
              >
                {currentZone === selectedZone.id ? 'Continue Exploring' : 'Travel Here'}
              </button>
            )}

            {/* Zone quests */}
            <div>
              <h3 className="text-xs font-ui font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Zone Quests
              </h3>
              {QUESTS.filter(q => q.zone === selectedZone.id || q.zone === 'any').slice(0, 3).map(quest => {
                const isActive = questState.active.includes(quest.id);
                const isCompleted = questState.completed.includes(quest.id);
                return (
                  <div
                    key={quest.id}
                    className="px-3 py-2 mb-1 rounded border text-xs font-ui"
                    style={{
                      borderColor: isCompleted ? '#4ADE8030' : isActive ? selectedZone.color + '40' : '#ffffff10',
                      background: isCompleted ? '#4ADE8008' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span>{isCompleted ? '✅' : isActive ? '📋' : '🔒'}</span>
                      <span className={isCompleted ? 'text-green-400 line-through' : isActive ? 'text-foreground' : 'text-muted-foreground'}>
                        {quest.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-5">
            {/* Quest log */}
            <h2 className="text-lg font-display font-bold text-foreground mb-3">📋 Active Quests</h2>
            {activeQuests.length === 0 ? (
              <p className="text-xs font-ui text-muted-foreground">No active quests.</p>
            ) : (
              activeQuests.map(quest => {
                if (!quest) return null;
                const zoneData = zones.find(z => z.id === quest.zone);
                return (
                  <div
                    key={quest.id}
                    className="mb-3 px-3 py-3 rounded border border-white/10 bg-white/5"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={quest.type === 'main' ? 'text-yellow-400' : 'text-blue-400'}>
                        {quest.type === 'main' ? '⭐' : '📌'}
                      </span>
                      <span className="text-sm font-ui font-bold text-foreground">{quest.title}</span>
                    </div>
                    <p className="text-[10px] font-ui text-muted-foreground mb-2">{quest.description}</p>
                    {quest.objectives.map(obj => {
                      const current = questState.objectives[obj.id] || 0;
                      const done = current >= obj.required;
                      return (
                        <div key={obj.id} className="flex items-center gap-2 text-[10px] font-ui mb-0.5">
                          <span>{done ? '✅' : '⬜'}</span>
                          <span className={done ? 'text-green-400 line-through' : 'text-foreground'}>{obj.text}</span>
                          <span className="text-muted-foreground ml-auto">{current}/{obj.required}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}

            {/* Guide tip */}
            <div className="mt-4 px-3 py-3 rounded border border-blue-500/20 bg-blue-500/5">
              <div className="flex items-center gap-2 mb-1">
                <span>📘</span>
                <span className="text-xs font-ui font-bold" style={{ color: GUIDE_COLOR }}>{GUIDE_NAME}</span>
              </div>
              <p className="text-[10px] font-ui text-muted-foreground leading-relaxed">
                Click on a zone to see details and travel there. Complete quests to unlock new areas and earn rewards!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
