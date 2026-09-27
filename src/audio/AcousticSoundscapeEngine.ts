/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectedAudioMix, ProjectedEventDescriptor } from '../ecology/acoustic/AcousticProjection';
import { AcousticEvent } from '../ecology/acoustic/AcousticState';

/**
 * Web Audio API Soundscape Engine for Acoustic Ecology (Task 004).
 *
 * Implements the 6-Layer Acoustic Hierarchy:
 *  - Layer 0: Environmental Bed (low-level continuous physical tank presence)
 *  - Layer 1: Water Dynamics (laminar flow murmur, turbulent current, procedural bubbles)
 *  - Layer 2: Biological Texture (subtle micro-clicks, radula grazing, hydrodynamic drift)
 *  - Layer 3: Spatial Audio (stereo panning, distance attenuation, depth lowpass)
 *  - Layer 4: Discrete Environmental Events (feeding strikes, substrate settling, ripples)
 *  - Layer 5: Significant Antic Manifestations (courtship shimmers, territorial snaps)
 *
 * Anti-musical, restrained, continuous, and non-distracting for extended listening.
 */
export class AcousticSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterVolume: number = 0.5;

  // Master and Subgroup Mixers
  private masterGain: GainNode | null = null;
  private dynamicsCompressor: DynamicsCompressorNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;

  private envGain: GainNode | null = null;
  private bioGain: GainNode | null = null;
  private eventGain: GainNode | null = null;

  // Layer 0: Environmental Bed
  private bedGain: GainNode | null = null;
  private bedFilter: BiquadFilterNode | null = null;
  private bedSource: AudioBufferSourceNode | null = null;

  // Layer 1: Water Flow
  private waterGain: GainNode | null = null;
  private waterFilter: BiquadFilterNode | null = null;
  private waterSource: AudioBufferSourceNode | null = null;

  // Layer 2: Biological Texture
  private bioTextureTimer: number | null = null;
  private bubbleTimer: number | null = null;

  private isRunning: boolean = false;
  private currentMix: ProjectedAudioMix | null = null;

  constructor() {
    // Lazy AudioContext initialization on first user interaction / resume
  }

  private initAudio() {
    if (this.ctx) return;
    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();

      // Master output stage with soft dynamics compression
      this.dynamicsCompressor = this.ctx.createDynamicsCompressor();
      this.dynamicsCompressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
      this.dynamicsCompressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.dynamicsCompressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.dynamicsCompressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
      this.dynamicsCompressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);

      this.masterFilter = this.ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
      this.masterFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.dynamicsCompressor.connect(this.masterFilter);
      this.masterFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      // Sub-mixers
      this.envGain = this.ctx.createGain();
      this.bioGain = this.ctx.createGain();
      this.eventGain = this.ctx.createGain();

      this.envGain.connect(this.dynamicsCompressor);
      this.bioGain.connect(this.dynamicsCompressor);
      this.eventGain.connect(this.dynamicsCompressor);

      // Initialize continuous procedural generators
      this.initEnvironmentalBed();
      this.initWaterDynamics();
      this.startContinuousBiologicalTexture();
    } catch {
      // AudioContext unavailable in sandbox or unsupported environment
    }
  }

  /**
   * Layer 0: Continuous Environmental Bed generator.
   * Generates low-frequency filtered pink noise that creates the tangible feeling of
   * an enclosed aquarium room tone without noticeable loops.
   */
  private initEnvironmentalBed() {
    if (!this.ctx || !this.envGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.76160 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.022;
      b6 = white * 0.115926;
    }

    this.bedFilter = this.ctx.createBiquadFilter();
    this.bedFilter.type = 'lowpass';
    this.bedFilter.frequency.setValueAtTime(110, this.ctx.currentTime); // Deep resonant warmth
    this.bedFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    this.bedGain = this.ctx.createGain();
    this.bedGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    this.bedSource = this.ctx.createBufferSource();
    this.bedSource.buffer = noiseBuffer;
    this.bedSource.loop = true;

    this.bedSource.connect(this.bedFilter);
    this.bedFilter.connect(this.bedGain);
    this.bedGain.connect(this.envGain);

    this.bedSource.start();
  }

  /**
   * Layer 1: Water Dynamics generator.
   * Continuous gentle water flow murmur + dynamic micro-bubble streams.
   */
  private initWaterDynamics() {
    if (!this.ctx || !this.envGain) return;

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * 2;
    const waterBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = waterBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.018;
    }

    this.waterFilter = this.ctx.createBiquadFilter();
    this.waterFilter.type = 'bandpass';
    this.waterFilter.frequency.setValueAtTime(340, this.ctx.currentTime);
    this.waterFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    this.waterGain = this.ctx.createGain();
    this.waterGain.gain.setValueAtTime(0.15, this.ctx.currentTime);

    this.waterSource = this.ctx.createBufferSource();
    this.waterSource.buffer = waterBuffer;
    this.waterSource.loop = true;

    this.waterSource.connect(this.waterFilter);
    this.waterFilter.connect(this.waterGain);
    this.waterGain.connect(this.envGain);

    this.waterSource.start();

    // Schedule subtle dynamic micro-bubbles
    this.scheduleDynamicBubbles();
  }

  private scheduleDynamicBubbles() {
    if (this.bubbleTimer) {
      window.clearTimeout(this.bubbleTimer);
    }

    const run = () => {
      if (this.isRunning && !this.isMuted && this.currentMix && this.currentMix.isAudible) {
        this.playProceduralMicroBubble();
      }
      // Speed up bubble rate if water dynamics are active
      const waterActivity = this.currentMix?.waterDynamicsGain ?? 0.15;
      const delay = Math.max(300, 1800 - waterActivity * 1600 + Math.random() * 600);
      this.bubbleTimer = window.setTimeout(run, delay);
    };

    run();
  }

  private playProceduralMicroBubble() {
    if (!this.ctx || !this.envGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = 380 + Math.random() * 260;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(startFreq * 1.5, t + 0.05);

      gain.gain.setValueAtTime(0.02 + Math.random() * 0.025, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.envGain);

      osc.start(t);
      osc.stop(t + 0.07);
    } catch {
      // Ignore background audio interruptions
    }
  }

  /**
   * Layer 2: Biological Texture generator.
   * Produces subtle, irregular organic impulses (micro-grazing, gentle hydro-flutters).
   */
  private startContinuousBiologicalTexture() {
    if (this.bioTextureTimer) {
      window.clearTimeout(this.bioTextureTimer);
    }

    const run = () => {
      if (this.isRunning && !this.isMuted && this.currentMix && this.currentMix.isAudible) {
        this.playOrganicBioTexture();
      }
      const bioGain = this.currentMix?.biologicalTextureGain ?? 0.15;
      const delay = Math.max(400, 2400 - bioGain * 2000 + Math.random() * 800);
      this.bioTextureTimer = window.setTimeout(run, delay);
    };

    run();
  }

  private playOrganicBioTexture() {
    if (!this.ctx || !this.bioGain || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Soft radula graze or hydrodynamic fin-flick
      osc.type = 'triangle';
      const freq = 520 + Math.random() * 280;
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + 0.035);

      gain.gain.setValueAtTime(0.015 + Math.random() * 0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.bioGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Catch transient audio errors
    }
  }

  /**
   * Applies continuous projected audio mix parameters to sub-mixers and filters.
   */
  public applyProjectedMix(mix: ProjectedAudioMix) {
    this.currentMix = mix;
    this.resume();

    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const timeConstant = 0.15; // Smooth gain transitions

    // Update Master Gain and Filter
    if (this.masterGain) {
      const targetMaster = this.isMuted ? 0 : this.masterVolume * mix.masterGain;
      this.masterGain.gain.setTargetAtTime(targetMaster, t, timeConstant);
    }

    if (this.masterFilter) {
      this.masterFilter.frequency.setTargetAtTime(mix.lowpassFilterCutoffHz, t, timeConstant);
    }

    // Layer 0: Bed Gain
    if (this.bedGain) {
      this.bedGain.gain.setTargetAtTime(mix.environmentalBedGain, t, timeConstant);
    }

    // Layer 1: Water Dynamics Gain
    if (this.waterGain) {
      this.waterGain.gain.setTargetAtTime(mix.waterDynamicsGain, t, timeConstant);
    }

    // Layer 2: Biological Texture Gain
    if (this.bioGain) {
      this.bioGain.gain.setTargetAtTime(mix.biologicalTextureGain, t, timeConstant);
    }

    // Layer 4 & 5: Event Subgroup Gain
    if (this.eventGain) {
      this.eventGain.gain.setTargetAtTime(mix.eventsGain, t, timeConstant);
    }
  }

  /**
   * Layer 3 & 4 & 5: Plays a discrete spatialized event with deterministic acoustic characteristics.
   */
  public playSpatialEvent(projected: ProjectedEventDescriptor) {
    if (this.isMuted || !this.ctx || !this.eventGain) return;
    const { event, spatial, finalGain } = projected;

    try {
      const t = this.ctx.currentTime;

      // Event gain node
      const eventVol = this.ctx.createGain();
      eventVol.gain.setValueAtTime(finalGain * 0.35, t);

      // Depth lowpass filter
      const eventFilter = this.ctx.createBiquadFilter();
      eventFilter.type = 'lowpass';
      eventFilter.frequency.setValueAtTime(spatial.lowpassCutoffHz, t);

      // Stereo panner
      let finalOutputNode: AudioNode = eventFilter;
      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(spatial.pan, t);
        eventFilter.connect(panner);
        finalOutputNode = panner;
      }

      eventVol.connect(eventFilter);
      finalOutputNode.connect(this.eventGain);

      // Synthesize event by source type
      switch (event.source) {
        case 'feeding_strike':
          this.synthesizeFeedingStrike(t, eventVol, event.spectral_character);
          break;

        case 'substrate_disturbance':
        case 'substrate_settling':
          this.synthesizeSubstrateDisturbance(t, eventVol, event.duration, event.spectral_character);
          break;

        case 'water_ripple':
          this.synthesizeWaterRipple(t, eventVol, event.spectral_character);
          break;

        case 'antic_manifestation':
          this.synthesizeAnticManifestation(t, eventVol, event.duration, event.spectral_character);
          break;

        case 'organism_collision':
          this.synthesizeCollision(t, eventVol, event.spectral_character);
          break;

        default:
          this.synthesizeGenericImpulse(t, eventVol, event.spectral_character);
          break;
      }
    } catch {
      // Audio node connection fallback
    }
  }

  private synthesizeFeedingStrike(t: number, outGain: GainNode, spectral: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 540 + spectral * 300;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, t + 0.05);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(outGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  private synthesizeSubstrateDisturbance(t: number, outGain: GainNode, duration: number, spectral: number) {
    if (!this.ctx) return;
    // Deep physical benthic thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 85 + spectral * 60;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + duration * 0.6);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(outGain);

    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private synthesizeWaterRipple(t: number, outGain: GainNode, spectral: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = 720 + spectral * 280;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(outGain);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  private synthesizeAnticManifestation(t: number, outGain: GainNode, duration: number, spectral: number) {
    if (!this.ctx) return;
    // Dual-tone harmonic shimmer (e.g. courtship display vibration or territorial alert)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq1 = 280 + spectral * 160;
    const freq2 = freq1 * 1.5; // Perfect fifth

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(freq1, t);
    osc2.frequency.setValueAtTime(freq2, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(outGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  private synthesizeCollision(t: number, outGain: GainNode, spectral: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + spectral * 200, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);

    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(outGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  private synthesizeGenericImpulse(t: number, outGain: GainNode, spectral: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400 + spectral * 200, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(outGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  public resume() {
    this.initAudio();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    this.isRunning = true;
  }

  public toggleMute(): boolean {
    this.resume();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.masterVolume * (this.currentMix?.masterGain ?? 0.5);
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (!this.isMuted && this.masterGain && this.ctx) {
      const target = this.masterVolume * (this.currentMix?.masterGain ?? 0.5);
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  public dispose() {
    this.isRunning = false;
    if (this.bioTextureTimer) clearTimeout(this.bioTextureTimer);
    if (this.bubbleTimer) clearTimeout(this.bubbleTimer);
    try {
      this.bedSource?.stop();
      this.waterSource?.stop();
      this.ctx?.close();
    } catch {
      // Ignored
    }
  }
}
