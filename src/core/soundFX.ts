const MUTE_STORAGE_KEY = "p2play:sound:muted";

export class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled = true;

  constructor() {
    try {
      const stored = localStorage.getItem(MUTE_STORAGE_KEY);
      if (stored !== null) this.enabled = stored !== "true";
    } catch {
      /* ignore */
    }
  }

  public init(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(!enabled));
    } catch {
      /* ignore */
    }
  }

  private beep(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  playClick() {
    this.beep(660, 0.05);
  }
  playPing() {
    this.beep(880, 0.2);
  }
  playCard() {
    this.beep(420, 0.08, "triangle", 0.2);
  }
  playDraw() {
    this.beep(300, 0.12, "square", 0.1);
  }
  playWild() {
    this.beep(520, 0.15, "sawtooth", 0.12);
    setTimeout(() => this.beep(720, 0.15, "sawtooth", 0.12), 80);
  }
  playUno() {
    this.beep(600, 0.1);
    setTimeout(() => this.beep(900, 0.2), 100);
  }
  playVictory() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.beep(f, 0.25, "sine", 0.18), i * 120),
    );
  }
  playDefeat() {
    this.beep(200, 0.4, "sine", 0.2);
  }
}

export const soundManager = new SoundFX();
