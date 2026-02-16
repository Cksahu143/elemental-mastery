// Web Audio API Sound System
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', vol = 0.15, detune = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration: number, vol = 0.1) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(gain).connect(ctx.destination);
  src.start();
}

export const SFX = {
  attack() {
    playTone(400, 0.08, 'sawtooth', 0.12);
    playTone(600, 0.06, 'square', 0.08);
  },
  hit() {
    playTone(200, 0.1, 'sawtooth', 0.15);
    playNoise(0.05, 0.08);
  },
  critHit() {
    playTone(800, 0.08, 'square', 0.15);
    playTone(1200, 0.12, 'square', 0.1);
    playNoise(0.06, 0.1);
  },
  dash() {
    playTone(300, 0.15, 'sine', 0.1);
    playTone(600, 0.1, 'sine', 0.06);
  },
  levelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.3, 'triangle', 0.12), i * 100);
    });
  },
  bossRoar() {
    playTone(80, 0.6, 'sawtooth', 0.2);
    playTone(60, 0.8, 'sawtooth', 0.15, 10);
    playNoise(0.4, 0.12);
  },
  bossDefeat() {
    const notes = [392, 494, 587, 784, 988, 1175];
    notes.forEach((f, i) => {
      setTimeout(() => playTone(f, 0.4, 'triangle', 0.1), i * 120);
    });
  },
  elementUnlock() {
    playTone(440, 0.3, 'sine', 0.1);
    setTimeout(() => playTone(660, 0.3, 'sine', 0.1), 150);
    setTimeout(() => playTone(880, 0.5, 'triangle', 0.12), 300);
  },
  enemyDeath() {
    playTone(300, 0.1, 'sawtooth', 0.1);
    playTone(150, 0.15, 'square', 0.08);
  },
  skill() {
    playTone(500, 0.12, 'triangle', 0.1);
    playTone(750, 0.1, 'sine', 0.08);
  },
  loreFound() {
    playTone(660, 0.2, 'sine', 0.08);
    setTimeout(() => playTone(880, 0.3, 'sine', 0.08), 200);
  },
  uiClick() {
    playTone(800, 0.05, 'square', 0.06);
  },
  playerHurt() {
    playTone(150, 0.15, 'sawtooth', 0.12);
    playNoise(0.08, 0.06);
  },
  roomCleared() {
    playTone(523, 0.15, 'triangle', 0.08);
    setTimeout(() => playTone(659, 0.15, 'triangle', 0.08), 100);
    setTimeout(() => playTone(784, 0.25, 'triangle', 0.1), 200);
  },
  phaseTransition() {
    playNoise(0.3, 0.15);
    playTone(100, 0.5, 'sawtooth', 0.2);
    setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.15), 200);
  },
};

// Ambient music system
let ambientInterval: number | null = null;
let currentZone: string | null = null;

const ZONE_SCALES: Record<string, number[]> = {
  fire: [220, 261, 293, 349, 392, 440],
  ice: [261, 311, 349, 415, 466, 523],
  lightning: [329, 392, 440, 523, 587, 659],
  shadow: [196, 233, 261, 311, 349, 392],
};

export function startAmbientMusic(zone: string) {
  if (currentZone === zone) return;
  stopAmbientMusic();
  currentZone = zone;
  const scale = ZONE_SCALES[zone] || ZONE_SCALES.fire;
  
  ambientInterval = window.setInterval(() => {
    const note = scale[Math.floor(Math.random() * scale.length)];
    const type: OscillatorType = Math.random() > 0.5 ? 'sine' : 'triangle';
    playTone(note, 1.5 + Math.random() * 2, type, 0.03 + Math.random() * 0.02);
  }, 2000 + Math.random() * 3000);
}

export function stopAmbientMusic() {
  if (ambientInterval !== null) {
    clearInterval(ambientInterval);
    ambientInterval = null;
    currentZone = null;
  }
}

// Boss music system — unique per zone
let bossInterval: number | null = null;
let currentBossZone: string | null = null;

const BOSS_SCALES: Record<string, { notes: number[]; bassNotes: number[]; tempo: number }> = {
  fire: {
    notes: [440, 554, 659, 880, 1108],
    bassNotes: [110, 138, 165, 220],
    tempo: 280,
  },
  ice: {
    notes: [523, 622, 784, 932, 1047],
    bassNotes: [131, 165, 196, 261],
    tempo: 400,
  },
  lightning: {
    notes: [659, 784, 880, 1047, 1319],
    bassNotes: [165, 196, 220, 329],
    tempo: 200,
  },
  shadow: {
    notes: [392, 466, 523, 622, 784],
    bassNotes: [98, 116, 131, 196],
    tempo: 350,
  },
};

export function startBossMusic(zone: string) {
  stopBossMusic();
  stopAmbientMusic();
  currentBossZone = zone;
  const config = BOSS_SCALES[zone] || BOSS_SCALES.fire;
  
  let beat = 0;
  bossInterval = window.setInterval(() => {
    beat++;
    // Driving bass
    const bassNote = config.bassNotes[beat % config.bassNotes.length];
    playTone(bassNote, 0.2, 'sawtooth', 0.08);
    
    // Percussion
    if (beat % 2 === 0) playNoise(0.05, 0.06);
    
    // Melody on alternating beats
    if (beat % 3 === 0) {
      const note = config.notes[Math.floor(Math.random() * config.notes.length)];
      playTone(note, 0.15, 'square', 0.05);
    }
    
    // Tension chord every 8 beats
    if (beat % 8 === 0) {
      const chord = config.notes.slice(0, 3);
      chord.forEach((n, i) => {
        setTimeout(() => playTone(n, 0.4, 'triangle', 0.04), i * 30);
      });
    }
  }, config.tempo);
}

export function stopBossMusic() {
  if (bossInterval !== null) {
    clearInterval(bossInterval);
    bossInterval = null;
    currentBossZone = null;
  }
}

export function getCurrentBossZone(): string | null {
  return currentBossZone;
}
