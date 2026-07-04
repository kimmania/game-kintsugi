let ctx: AudioContext | null = null;
let _muted = false;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

export function unlockAudio(): void {
  try {
    const c = getCtx();
    if (c.state === 'suspended') {
      c.resume();
    }
  } catch {
    // ignore
  }
}

export function setMuted(v: boolean): void {
  _muted = v;
}

export function isMuted(): boolean {
  return _muted;
}

function playOsc(
  freq: number,
  duration: number,
  type: OscillatorType,
  vol: number,
  slideTo?: number
): void {
  if (_muted) return;
  try {
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo !== undefined) {
      o.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 1), c.currentTime + duration);
    }
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + duration + 0.02);
  } catch {
    // ignore
  }
}

export function playTransfer(): void {
  unlockAudio();
  playOsc(320, 0.15, 'sine', 0.12, 200);
}

export function playInvalid(): void {
  unlockAudio();
  playOsc(180, 0.18, 'triangle', 0.12, 120);
}

export function playGoldApply(): void {
  unlockAudio();
  playOsc(840, 0.18, 'sine', 0.14, 520);
  setTimeout(() => playOsc(1320, 0.3, 'sine', 0.08), 120);
}

export function playGoldAbsorb(): void {
  unlockAudio();
  playOsc(660, 0.24, 'sine', 0.12, 990);
  playOsc(990, 0.3, 'sine', 0.08);
}

export function playWinBowl(): void {
  unlockAudio();
  playOsc(330, 0.6, 'sine', 0.12);
  setTimeout(() => playOsc(440, 0.6, 'sine', 0.1), 150);
  setTimeout(() => playOsc(660, 0.8, 'sine', 0.1), 300);
}

export function playUndo(): void {
  unlockAudio();
  playOsc(300, 0.12, 'sine', 0.08, 220);
}

export function playReset(): void {
  unlockAudio();
  playOsc(260, 0.2, 'triangle', 0.1, 180);
}

export function playButton(): void {
  unlockAudio();
  playOsc(520, 0.06, 'square', 0.04, 420);
}
