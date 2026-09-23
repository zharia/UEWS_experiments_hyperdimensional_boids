/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Procedural Web Audio API sound generator for Chronos Aquarium.
 * Fully synthetic: zero external assets, instant loading, and zero latency.
 */
class AquariumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private isMuted: boolean = true;
  private volume: number = 0.45;
  private isAmbientPlaying: boolean = false;
  private lastScrapeTime: number = 0;
  private lastMedusaPulseTime: number = 0;
  private bubbleTimer: number | null = null;

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Ambient channel
      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.ambientFilter = this.ctx.createBiquadFilter();
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.setValueAtTime(260, this.ctx.currentTime);
      this.ambientFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

      this.ambientGain.connect(this.ambientFilter);
      this.ambientFilter.connect(this.masterGain);
    } catch {
      // AudioContext unavailable in sandbox or unsupported
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.resume();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    if (!this.isMuted && !this.isAmbientPlaying) {
      this.startAmbient();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (!this.isMuted && this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public startAmbient() {
    this.resume();
    if (!this.ctx || !this.ambientGain || this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;

    // 1. Continuous pink noise generator for soothing water filter murmur
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    whiteNoise.connect(this.ambientGain);
    whiteNoise.start();

    // 2. Schedule gentle random micro-bubbles
    const scheduleBubble = () => {
      if (!this.isAmbientPlaying) return;
      this.playMicroBubble();
      const nextDelay = 400 + Math.random() * 1200;
      this.bubbleTimer = window.setTimeout(scheduleBubble, nextDelay);
    };
    scheduleBubble();
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.bubbleTimer) {
      clearTimeout(this.bubbleTimer);
      this.bubbleTimer = null;
    }
  }

  private playMicroBubble() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Frequency sweep upward like a popping bubble
    const startFreq = 420 + Math.random() * 300;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 1.6, t + 0.06);

    gain.gain.setValueAtTime(0.04 + Math.random() * 0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playFoodDrop() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Resonant water droplet "plop"
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(780 + Math.random() * 80, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.12);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  public playNibble() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1100 + Math.random() * 300, t);
    osc.frequency.exponentialRampToValueAtTime(650, t + 0.04);

    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playGlassTap() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Dull acoustic thud with glass ring
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    // High glass harmonic chime
    const harmonic = this.ctx.createOscillator();
    const hGain = this.ctx.createGain();
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(1650, t);
    harmonic.frequency.exponentialRampToValueAtTime(1420, t + 0.08);

    hGain.gain.setValueAtTime(0.08, t);
    hGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    harmonic.connect(hGain);
    hGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);
    harmonic.start(t);
    harmonic.stop(t + 0.1);
  }

  public playGlassScrape() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = performance.now();
    if (now - this.lastScrapeTime < 90) return; // Throttle scrape ticks
    this.lastScrapeTime = now;

    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(380 + (Math.random() - 0.5) * 60, t);

    gain.gain.setValueAtTime(0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playTemporalChime(pitchMultiplier: number = 1.0) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 major arpeggio
    const baseFreq = notes[Math.floor(Math.random() * notes.length)] * pitchMultiplier;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, t + 0.22);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.28);
  }

  public playCrabSnap() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Crisp chitinous click / claw snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1800 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.025);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.035);
  }

  public playShrimpDart() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Hydrodynamic tail-flip whoosh with water flutter
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.08);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playSnailGraze() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Soft wet radula micro-scrape
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450 + Math.random() * 100, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.04);

    gain.gain.setValueAtTime(0.025, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playMedusaPulse() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;

    const now = performance.now();
    if (now - this.lastMedusaPulseTime < 350) return; // Strict cooldown throttle
    this.lastMedusaPulseTime = now;

    try {
      const t = this.ctx.currentTime;

      // Soft, deep hydrodynamic water pulse / bell constriction
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.19);
    } catch {
      // Ignore audio synthesis errors in background/unfocused state
    }
  }

  public playCameraShutter() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      // Dual-click mechanical shutter sound
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1200, t);
      osc1.frequency.exponentialRampToValueAtTime(260, t + 0.04);
      gain1.gain.setValueAtTime(0.18, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(t);
      osc1.stop(t + 0.05);

      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(950, t + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(180, t + 0.11);
      gain2.gain.setValueAtTime(0.15, t + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t + 0.06);
      osc2.stop(t + 0.13);
    } catch {
      // Audio error fallback
    }
  }
}

export const aquariumAudio = new AquariumAudioEngine();
