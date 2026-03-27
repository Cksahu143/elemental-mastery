// Web Audio API Sound System — Rich Procedural Music
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
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

// Filtered noise for better percussion
function playFilteredNoise(duration: number, vol: number, freq: number, type: BiquadFilterType = 'highpass') {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start();
}

// Play a note with attack-sustain-release envelope
function playNote(freq: number, duration: number, type: OscillatorType, vol: number, attack = 0.01, release = 0.1) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
  gain.gain.setValueAtTime(vol, ctx.currentTime + duration - release);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// Kick drum
function playKick() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

// Snare
function playSnare() {
  playFilteredNoise(0.1, 0.12, 2000, 'highpass');
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 200;
  gain.gain.setValueAtTime(0.1, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.08);
}

// Hi-hat
function playHihat(open = false) {
  playFilteredNoise(open ? 0.12 : 0.04, open ? 0.06 : 0.04, 6000, 'highpass');
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

// ─── Ambient music system ───
let ambientIntervals: number[] = [];
let currentZone: string | null = null;

interface ZoneAmbience {
  scale: number[];
  droneFreqs: number[];
  tempo: number;         // ms per "pulse"
  type: OscillatorType;
  droneType: OscillatorType;
  melodyVol: number;
  droneVol: number;
}

const ZONE_AMBIENCE: Record<string, ZoneAmbience> = {
  fire: {
    scale: [220, 261, 293, 349, 392, 440, 523],
    droneFreqs: [110, 55],
    tempo: 3000,
    type: 'triangle',
    droneType: 'sawtooth',
    melodyVol: 0.035,
    droneVol: 0.02,
  },
  ice: {
    scale: [523, 587, 659, 784, 880, 1047],
    droneFreqs: [131, 196],
    tempo: 4000,
    type: 'sine',
    droneType: 'sine',
    melodyVol: 0.025,
    droneVol: 0.015,
  },
  lightning: {
    scale: [329, 392, 440, 523, 587, 659, 784],
    droneFreqs: [165, 82],
    tempo: 2500,
    type: 'square',
    droneType: 'triangle',
    melodyVol: 0.025,
    droneVol: 0.02,
  },
  shadow: {
    scale: [196, 233, 261, 293, 311, 349, 392],
    droneFreqs: [65, 98],
    tempo: 3500,
    type: 'sine',
    droneType: 'sawtooth',
    melodyVol: 0.03,
    droneVol: 0.025,
  },
  earth: {
    scale: [147, 165, 196, 220, 247, 294, 330],
    droneFreqs: [73, 55],
    tempo: 3800,
    type: 'triangle',
    droneType: 'sawtooth',
    melodyVol: 0.03,
    droneVol: 0.025,
  },
  wind: {
    scale: [392, 440, 494, 523, 587, 659, 784],
    droneFreqs: [196, 131],
    tempo: 2800,
    type: 'sine',
    droneType: 'triangle',
    melodyVol: 0.025,
    droneVol: 0.018,
  },
  nature: {
    scale: [262, 294, 330, 349, 392, 440, 523],
    droneFreqs: [131, 98],
    tempo: 3200,
    type: 'sine',
    droneType: 'sine',
    melodyVol: 0.028,
    droneVol: 0.02,
  },
  void: {
    scale: [185, 196, 220, 233, 262, 277, 311],
    droneFreqs: [49, 62],
    tempo: 4500,
    type: 'sawtooth',
    droneType: 'sawtooth',
    melodyVol: 0.02,
    droneVol: 0.03,
  },
};

export function startAmbientMusic(zone: string) {
  if (currentZone === zone) return;
  stopAmbientMusic();
  currentZone = zone;
  const config = ZONE_AMBIENCE[zone] || ZONE_AMBIENCE.fire;

  // Drone layer — slow evolving pads
  const droneId = window.setInterval(() => {
    const freq = config.droneFreqs[Math.floor(Math.random() * config.droneFreqs.length)];
    playNote(freq, 4, config.droneType, config.droneVol, 0.5, 1.5);
    // Slight detuned second voice for width
    playNote(freq * 1.002, 4, config.droneType, config.droneVol * 0.6, 0.8, 1.5);
  }, 4000);
  ambientIntervals.push(droneId);

  // Melody layer — sparse, atmospheric notes
  const melodyId = window.setInterval(() => {
    if (Math.random() < 0.6) {
      const note = config.scale[Math.floor(Math.random() * config.scale.length)];
      playNote(note, 1.5 + Math.random() * 2, config.type, config.melodyVol, 0.1, 0.5);
    }
    // Occasional second note for harmony
    if (Math.random() < 0.25) {
      const note2 = config.scale[Math.floor(Math.random() * config.scale.length)];
      setTimeout(() => playNote(note2, 1 + Math.random(), config.type, config.melodyVol * 0.7, 0.2, 0.4), 400);
    }
  }, config.tempo);
  ambientIntervals.push(melodyId);

  // Texture layer — zone-specific atmospheric sounds
  const textureId = window.setInterval(() => {
    if (zone === 'fire') {
      // Crackling
      if (Math.random() < 0.4) playFilteredNoise(0.15, 0.02, 3000, 'highpass');
    } else if (zone === 'ice') {
      // Crystalline chimes
      if (Math.random() < 0.3) {
        const chime = config.scale[Math.floor(Math.random() * 3) + 3];
        playNote(chime * 2, 0.8, 'sine', 0.015, 0.01, 0.5);
      }
    } else if (zone === 'lightning') {
      // Distant thunder rumble
      if (Math.random() < 0.15) {
        playTone(40 + Math.random() * 30, 0.6, 'sawtooth', 0.03);
      }
    } else if (zone === 'shadow') {
      if (Math.random() < 0.2) {
        playFilteredNoise(0.3, 0.015, 800, 'bandpass');
      }
    } else if (zone === 'earth') {
      // Deep rumbles
      if (Math.random() < 0.2) {
        playTone(50 + Math.random() * 20, 0.5, 'sawtooth', 0.02);
      }
    } else if (zone === 'wind') {
      // Whooshing
      if (Math.random() < 0.3) {
        playFilteredNoise(0.4, 0.02, 1200, 'bandpass');
      }
    } else if (zone === 'nature') {
      // Birds / chimes
      if (Math.random() < 0.25) {
        const chime = config.scale[Math.floor(Math.random() * 3) + 4];
        playNote(chime * 2, 0.5, 'sine', 0.012, 0.01, 0.3);
      }
    } else if (zone === 'void') {
      // Deep unsettling pulses
      if (Math.random() < 0.2) {
        playTone(35 + Math.random() * 15, 0.8, 'sawtooth', 0.025);
        playFilteredNoise(0.2, 0.01, 500, 'bandpass');
      }
    }
  }, 2000);
  ambientIntervals.push(textureId);
}

export function stopAmbientMusic() {
  ambientIntervals.forEach(id => clearInterval(id));
  ambientIntervals = [];
  currentZone = null;
}

// ─── Boss music system — intense, zone-specific tracks ───
let bossIntervals: number[] = [];
let currentBossZone: string | null = null;

interface BossTrack {
  bpm: number;
  bassPattern: number[];   // scale degrees
  melodyPattern: number[]; // scale degrees, -1 = rest
  scale: number[];         // actual frequencies
  bassType: OscillatorType;
  leadType: OscillatorType;
  bassVol: number;
  leadVol: number;
  drumIntensity: number;   // 0-1
  flavor: 'aggressive' | 'ominous' | 'frantic' | 'dark';
}

const BOSS_TRACKS: Record<string, BossTrack> = {
  fire: {
    bpm: 155,
    scale: [110, 130.8, 146.8, 164.8, 196, 220, 261.6, 293.7, 329.6, 392, 440],
    bassPattern: [0, 0, 3, 3, 5, 5, 3, 4],
    melodyPattern: [7, -1, 9, 8, 7, -1, 6, 5, 7, -1, 10, 9, 8, 7, 6, 5],
    bassType: 'sawtooth',
    leadType: 'square',
    bassVol: 0.09,
    leadVol: 0.05,
    drumIntensity: 0.9,
    flavor: 'aggressive',
  },
  ice: {
    bpm: 130,
    scale: [130.8, 146.8, 155.6, 174.6, 196, 207.7, 233.1, 261.6, 293.7, 311.1, 349.2],
    bassPattern: [0, 0, 4, 4, 2, 2, 5, 3],
    melodyPattern: [7, 8, -1, 6, 7, -1, 9, -1, 8, 7, 6, -1, 5, 7, -1, 8],
    bassType: 'triangle',
    leadType: 'sine',
    bassVol: 0.08,
    leadVol: 0.045,
    drumIntensity: 0.7,
    flavor: 'ominous',
  },
  lightning: {
    bpm: 175,
    scale: [164.8, 196, 220, 246.9, 261.6, 293.7, 329.6, 349.2, 392, 440, 493.9],
    bassPattern: [0, 2, 0, 4, 0, 2, 5, 3],
    melodyPattern: [6, 7, 8, -1, 9, 10, -1, 8, 7, 6, 8, 9, -1, 7, 6, -1],
    bassType: 'sawtooth',
    leadType: 'sawtooth',
    bassVol: 0.08,
    leadVol: 0.04,
    drumIntensity: 1.0,
    flavor: 'frantic',
  },
  shadow: {
    bpm: 120,
    scale: [98, 116.5, 130.8, 146.8, 155.6, 174.6, 196, 207.7, 233.1, 261.6, 293.7],
    bassPattern: [0, 0, 2, 1, 3, 3, 1, 2],
    melodyPattern: [7, -1, -1, 6, 8, -1, 5, -1, 9, -1, 7, -1, 6, -1, -1, 5],
    bassType: 'sawtooth',
    leadType: 'triangle',
    bassVol: 0.1,
    leadVol: 0.04,
    drumIntensity: 0.75,
    flavor: 'dark',
  },
  earth: {
    bpm: 110,
    scale: [82.4, 98, 110, 123.5, 130.8, 146.8, 165, 174.6, 196, 220, 247],
    bassPattern: [0, 0, 3, 2, 4, 4, 2, 3],
    melodyPattern: [6, -1, 7, -1, 8, 7, -1, 6, 9, -1, -1, 8, 7, -1, 6, -1],
    bassType: 'sawtooth',
    leadType: 'triangle',
    bassVol: 0.1,
    leadVol: 0.04,
    drumIntensity: 0.85,
    flavor: 'aggressive',
  },
  wind: {
    bpm: 165,
    scale: [196, 220, 247, 261.6, 293.7, 329.6, 349.2, 392, 440, 494, 523],
    bassPattern: [0, 2, 4, 2, 0, 3, 5, 3],
    melodyPattern: [7, 8, 9, -1, 10, 9, 8, -1, 7, 6, -1, 8, 9, -1, 7, 6],
    bassType: 'triangle',
    leadType: 'sawtooth',
    bassVol: 0.07,
    leadVol: 0.045,
    drumIntensity: 0.9,
    flavor: 'frantic',
  },
  nature: {
    bpm: 140,
    scale: [131, 147, 165, 175, 196, 220, 247, 262, 294, 330, 349],
    bassPattern: [0, 0, 4, 3, 5, 5, 3, 2],
    melodyPattern: [7, 8, -1, 9, 8, 7, -1, 6, 8, -1, 9, 10, -1, 8, 7, -1],
    bassType: 'triangle',
    leadType: 'sine',
    bassVol: 0.08,
    leadVol: 0.04,
    drumIntensity: 0.8,
    flavor: 'ominous',
  },
  void: {
    bpm: 100,
    scale: [73.4, 82.4, 87.3, 98, 110, 116.5, 123.5, 131, 147, 165, 175],
    bassPattern: [0, 1, 0, 3, 2, 1, 4, 0],
    melodyPattern: [7, -1, -1, 8, -1, 6, -1, -1, 9, -1, 7, -1, -1, 6, -1, 5],
    bassType: 'sawtooth',
    leadType: 'sawtooth',
    bassVol: 0.11,
    leadVol: 0.035,
    drumIntensity: 0.7,
    flavor: 'dark',
  },
  malachar: {
    bpm: 140,
    scale: [65.4, 73.4, 82.4, 87.3, 98, 110, 123.5, 131, 147, 165, 196],
    bassPattern: [0, 0, 2, 1, 4, 3, 1, 0],
    melodyPattern: [8, 9, 10, -1, 9, 8, 7, -1, 10, -1, 8, 9, -1, 7, 6, -1],
    bassType: 'sawtooth',
    leadType: 'square',
    bassVol: 0.12,
    leadVol: 0.055,
    drumIntensity: 1.0,
    flavor: 'aggressive',
  },
};

export function startBossMusic(zone: string) {
  stopBossMusic();
  stopAmbientMusic();
  currentBossZone = zone;
  const track = BOSS_TRACKS[zone] || BOSS_TRACKS.fire;
  const beatMs = 60000 / track.bpm;
  let beat = 0;

  // ─── Drum loop ───
  const drumId = window.setInterval(() => {
    const b = beat % 16;

    // Kick pattern: every beat, with emphasis on 0, 4, 8, 12
    if (b % 2 === 0) playKick();
    // Offbeat kicks for intensity
    if (track.drumIntensity > 0.8 && (b === 3 || b === 11)) playKick();

    // Snare on 4 and 12
    if (b === 4 || b === 12) playSnare();
    // Ghost snares for high intensity
    if (track.drumIntensity > 0.6 && (b === 7 || b === 15)) {
      playFilteredNoise(0.06, 0.04, 3000, 'highpass');
    }

    // Hi-hat pattern
    if (b % 2 === 0) playHihat(false);
    if (b % 4 === 2) playHihat(true);
    // Double-time hats for frantic feel
    if (track.flavor === 'frantic' && b % 2 === 1) playHihat(false);

    beat++;
  }, beatMs);
  bossIntervals.push(drumId);

  // ─── Bass line ───
  let bassStep = 0;
  const bassId = window.setInterval(() => {
    const degree = track.bassPattern[bassStep % track.bassPattern.length];
    const freq = track.scale[degree];
    // Main bass note
    playNote(freq, beatMs * 1.8 / 1000, track.bassType, track.bassVol, 0.01, 0.05);
    // Sub-bass for weight
    playNote(freq / 2, beatMs * 1.8 / 1000, 'sine', track.bassVol * 0.5, 0.02, 0.1);
    bassStep++;
  }, beatMs * 2);
  bossIntervals.push(bassId);

  // ─── Lead melody ───
  let melodyStep = 0;
  const melodyId = window.setInterval(() => {
    const degree = track.melodyPattern[melodyStep % track.melodyPattern.length];
    if (degree >= 0) {
      const freq = track.scale[Math.min(degree, track.scale.length - 1)];
      playNote(freq, beatMs * 0.9 / 1000, track.leadType, track.leadVol, 0.005, 0.05);
      // Octave shimmer on some notes
      if (melodyStep % 4 === 0) {
        playNote(freq * 2, beatMs * 0.6 / 1000, 'sine', track.leadVol * 0.3, 0.01, 0.08);
      }
    }
    melodyStep++;
  }, beatMs);
  bossIntervals.push(melodyId);

  // ─── Power chord stabs every 8 beats ───
  let chordBeat = 0;
  const chordId = window.setInterval(() => {
    const root = track.scale[track.bassPattern[chordBeat % track.bassPattern.length]];
    // Power chord: root + fifth + octave
    playNote(root * 2, 0.3, 'sawtooth', 0.035, 0.005, 0.15);
    playNote(root * 3, 0.3, 'sawtooth', 0.025, 0.005, 0.15);
    playNote(root * 4, 0.25, 'triangle', 0.02, 0.01, 0.12);
    chordBeat++;
  }, beatMs * 8);
  bossIntervals.push(chordId);

  // ─── Zone-specific flavor layer ───
  if (track.flavor === 'aggressive') {
    // Fire: rising tension scrapes
    const fireId = window.setInterval(() => {
      playFilteredNoise(0.2, 0.03, 1500, 'bandpass');
    }, beatMs * 16);
    bossIntervals.push(fireId);
  } else if (track.flavor === 'ominous') {
    // Ice: eerie high sustained tones
    const iceId = window.setInterval(() => {
      const high = track.scale[8 + Math.floor(Math.random() * 3)];
      playNote(high, 2, 'sine', 0.02, 0.3, 0.8);
    }, beatMs * 12);
    bossIntervals.push(iceId);
  } else if (track.flavor === 'frantic') {
    // Lightning: staccato arpeggios
    let arpBeat = 0;
    const lId = window.setInterval(() => {
      const idx = (arpBeat % 4);
      const notes = [4, 6, 8, 10];
      const freq = track.scale[notes[idx]];
      playNote(freq, 0.06, 'square', 0.03, 0.002, 0.02);
      arpBeat++;
    }, beatMs / 2);
    bossIntervals.push(lId);
  } else if (track.flavor === 'dark') {
    // Shadow: deep rumbling pulse
    const sId = window.setInterval(() => {
      playNote(40, 1.5, 'sawtooth', 0.04, 0.2, 0.8);
      setTimeout(() => playNote(45, 1, 'sawtooth', 0.03, 0.3, 0.5), 500);
    }, beatMs * 8);
    bossIntervals.push(sId);
  }
}

export function stopBossMusic() {
  bossIntervals.forEach(id => clearInterval(id));
  bossIntervals = [];
  currentBossZone = null;
}

export function getCurrentBossZone(): string | null {
  return currentBossZone;
}
