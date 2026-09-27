/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AcousticSoundscapeEngine } from './AcousticSoundscapeEngine';
import { ProjectedAudioMix, ProjectedEventDescriptor } from '../ecology/acoustic/AcousticProjection';

/**
 * Unified Procedural Web Audio API sound generator & Acoustic Soundscape for Chronos Aquarium.
 * Fully synthetic: zero external assets, instant loading, and zero latency.
 * Combines direct interaction audio with the authoritative 6-layer Acoustic Ecology soundscape.
 */
class AquariumAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = true;
  private volume: number = 0.45;
  private lastScrapeTime: number = 0;
  private lastMedusaPulseTime: number = 0;

  // Layered Acoustic Soundscape Engine (Task 004)
  public soundscape: AcousticSoundscapeEngine;

  constructor() {
    this.soundscape = new AcousticSoundscapeEngine();
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable in sandbox or unsupported
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.soundscape.resume();
  }

  public toggleMute(): boolean {
    this.resume();
    this.isMuted = !this.isMuted;
    this.soundscape.toggleMute();

    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
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
    this.soundscape.setVolume(this.volume);
    if (!this.isMuted && this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Applies projected continuous mix from the authoritative AcousticProjection
   */
  public applyProjectedMix(mix: ProjectedAudioMix) {
    this.soundscape.applyProjectedMix(mix);
  }

  /**
   * Plays a discrete spatialized event with distance attenuation and 3D panning
   */
  public playSpatialEvent(projected: ProjectedEventDescriptor) {
    this.soundscape.playSpatialEvent(projected);
  }

  public startAmbient() {
    this.resume();
  }

  public stopAmbient() {
    // Handled by soundscape mute/volume
  }

  public playFoodDrop() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
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
    } catch {
      // Audio error fallback
    }
  }

  public playNibble() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
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
    } catch {
      // Audio error fallback
    }
  }

  public playGlassTap() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.09);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

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
    } catch {
      // Audio error fallback
    }
  }

  public playGlassScrape() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = performance.now();
    if (now - this.lastScrapeTime < 90) return;
    this.lastScrapeTime = now;

    try {
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
    } catch {
      // Audio error fallback
    }
  }

  public playTemporalChime(pitchMultiplier: number = 1.0) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
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
    } catch {
      // Audio error fallback
    }
  }

  public playCrabSnap() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
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
    } catch {
      // Audio error fallback
    }
  }

  public playShrimpDart() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
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
    } catch {
      // Audio error fallback
    }
  }

  public playSnailGraze() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
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
    } catch {
      // Audio error fallback
    }
  }

  public playMedusaPulse() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    const now = performance.now();
    if (now - this.lastMedusaPulseTime < 350) return;
    this.lastMedusaPulseTime = now;

    try {
      const t = this.ctx.currentTime;
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
      // Audio error fallback
    }
  }

  public playCameraShutter() {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    try {
      const t = this.ctx.currentTime;
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
