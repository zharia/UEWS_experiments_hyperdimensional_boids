/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BenchmarkStage =
  | 'boidsPhysics'
  | 'floraSim'
  | 'instancedFish'
  | 'instancedFireflies'
  | 'ambientObjects'
  | 'plantLifecycle'
  | 'microFaunaSim'
  | 'microFaunaRender'
  | 'webglRender'
  | 'screenSpaceDisplacement';

export interface HitchRecord {
  id: number;
  timestamp: number;
  frameTimeMs: number;
  renderCpuMs: number;
  culprit: string;
  culpritMs: number;
  stages: Record<BenchmarkStage, number>;
  unaccountedMs: number; // Browser / GC / Event Loop delay
}

export interface BenchmarkSnapshot {
  fps: number;
  smoothFps: number;
  meanFrameMs: number;
  minFrameMs: number;
  maxFrameMs: number;
  p95FrameMs: number;
  p99FrameMs: number;
  jitterMs: number;
  renderCpuMs: number;
  totalHitches: number;
  recentHitches: number; // in last 5s
  recentFrameTimes: number[]; // Last 120 frame durations
  stageAverages: Record<BenchmarkStage, number>;
  latestStages: Record<BenchmarkStage, number>;
  hitches: HitchRecord[];
  activeHitch: HitchRecord | null;
  drawCalls: number;
  triangles: number;
  memoryMb: { used: number; total: number; limit: number } | null;
}

const RING_BUFFER_SIZE = 120;
const HITCH_LOG_SIZE = 40;
const HITCH_THRESHOLD_MS = 25.0; // Any frame exceeding 25ms (< 40 FPS) is flagged

export class PerformanceBenchmarkEngine {
  private static instance: PerformanceBenchmarkEngine | null = null;

  // Frame timing
  private lastFrameTimestamp: number = 0;
  private frameStartTimestamp: number = 0;
  private currentStageStart: number = 0;

  // Pre-allocated ring buffers for zero GC pressure
  private frameTimesRing: Float32Array = new Float32Array(RING_BUFFER_SIZE);
  private ringIndex: number = 0;
  private ringCount: number = 0;

  // Per-stage measurement for current frame
  private currentStages: Record<BenchmarkStage, number> = {
    boidsPhysics: 0,
    floraSim: 0,
    instancedFish: 0,
    instancedFireflies: 0,
    ambientObjects: 0,
    plantLifecycle: 0,
    microFaunaSim: 0,
    microFaunaRender: 0,
    webglRender: 0,
    screenSpaceDisplacement: 0,
  };

  // Stage historical accumulators for rolling average
  private stageAccumulators: Record<BenchmarkStage, number> = {
    boidsPhysics: 0,
    floraSim: 0,
    instancedFish: 0,
    instancedFireflies: 0,
    ambientObjects: 0,
    plantLifecycle: 0,
    microFaunaSim: 0,
    microFaunaRender: 0,
    webglRender: 0,
    screenSpaceDisplacement: 0,
  };
  private stageSampleCount: number = 0;

  // Hitch history
  private hitchCounter: number = 0;
  private hitches: HitchRecord[] = [];
  private activeHitch: HitchRecord | null = null;
  private activeHitchTimeout: number = 0;

  // WebGL Info
  private drawCalls: number = 0;
  private triangles: number = 0;

  // Listeners
  private listeners: Set<(snapshot: BenchmarkSnapshot) => void> = new Set();
  private lastBroadcast: number = 0;
  public enabled: boolean = true;
  public logToConsoleOnHitch: boolean = false;

  private constructor() {
    this.lastFrameTimestamp = performance.now();
  }

  public static getInstance(): PerformanceBenchmarkEngine {
    if (!PerformanceBenchmarkEngine.instance) {
      PerformanceBenchmarkEngine.instance = new PerformanceBenchmarkEngine();
    }
    return PerformanceBenchmarkEngine.instance;
  }

  /**
   * Marks the start of a new animation frame.
   */
  public beginFrame() {
    if (!this.enabled) return;
    const now = performance.now();
    const frameInterval = now - this.lastFrameTimestamp;
    this.lastFrameTimestamp = now;
    this.frameStartTimestamp = now;

    // Record total frame-to-frame delta (including browser event loop / compositing / GC)
    if (frameInterval > 0 && frameInterval < 1000) {
      this.frameTimesRing[this.ringIndex] = frameInterval;
      this.ringIndex = (this.ringIndex + 1) % RING_BUFFER_SIZE;
      if (this.ringCount < RING_BUFFER_SIZE) {
        this.ringCount++;
      }
    }

    this.currentStageStart = now;
  }

  /**
   * Records execution time for a specific subsystem stage.
   */
  public markStage(stage: BenchmarkStage) {
    if (!this.enabled) return;
    const now = performance.now();
    const duration = Math.max(0, now - this.currentStageStart);
    this.currentStages[stage] = duration;

    // Accumulate for rolling average
    this.stageAccumulators[stage] += duration;
    this.currentStageStart = now;
  }

  /**
   * Concludes the frame timing, checks for hitches, and updates diagnostics.
   */
  public endFrame(drawCalls: number = 0, triangles: number = 0) {
    if (!this.enabled) return;
    const now = performance.now();
    const renderCpuMs = now - this.frameStartTimestamp;
    this.drawCalls = drawCalls;
    this.triangles = triangles;

    this.stageSampleCount++;

    // Calculate latest frame duration
    const latestDuration = this.ringCount > 0
      ? this.frameTimesRing[(this.ringIndex - 1 + RING_BUFFER_SIZE) % RING_BUFFER_SIZE]
      : renderCpuMs;

    // Check for frame hitch / stutter
    if (latestDuration >= HITCH_THRESHOLD_MS) {
      this.recordHitch(latestDuration, renderCpuMs, now);
    }

    // Clear active hitch visual indicator after 1.8s
    if (this.activeHitch && now - this.activeHitchTimeout > 1800) {
      this.activeHitch = null;
    }

    // Broadcast snapshot to UI subscribers at ~10 Hz to prevent React overhead
    if (now - this.lastBroadcast > 100 && this.listeners.size > 0) {
      this.lastBroadcast = now;
      const snapshot = this.getSnapshot();
      for (const listener of this.listeners) {
        listener(snapshot);
      }
    }
  }

  private recordHitch(frameTimeMs: number, renderCpuMs: number, now: number) {
    // Find the primary culprit stage
    let maxStage: BenchmarkStage = 'webglRender';
    let maxStageMs = 0;

    const stagesCopy: Record<BenchmarkStage, number> = {
      boidsPhysics: this.currentStages.boidsPhysics,
      floraSim: this.currentStages.floraSim,
      instancedFish: this.currentStages.instancedFish,
      instancedFireflies: this.currentStages.instancedFireflies,
      ambientObjects: this.currentStages.ambientObjects,
      plantLifecycle: this.currentStages.plantLifecycle,
      microFaunaSim: this.currentStages.microFaunaSim,
      microFaunaRender: this.currentStages.microFaunaRender,
      webglRender: this.currentStages.webglRender,
      screenSpaceDisplacement: this.currentStages.screenSpaceDisplacement,
    };

    for (const [key, val] of Object.entries(stagesCopy)) {
      if (val > maxStageMs) {
        maxStageMs = val;
        maxStage = key as BenchmarkStage;
      }
    }

    // If total frame time significantly exceeds render CPU time, it is GC / Event Loop Stutter
    const unaccountedMs = Math.max(0, frameTimeMs - renderCpuMs);
    let culpritName = '';
    let culpritMs = 0;

    if (unaccountedMs > maxStageMs && unaccountedMs > 12.0) {
      culpritName = 'Main Thread Delay / Garbage Collection';
      culpritMs = unaccountedMs;
    } else {
      const stageLabels: Record<BenchmarkStage, string> = {
        boidsPhysics: '4D Boids Simulation',
        floraSim: 'Micro-Flora Canvas & Texture Upload',
        instancedFish: 'Fish Instanced Matrix Update',
        instancedFireflies: 'Firefly Instanced Buffers',
        ambientObjects: 'Ambient Uniforms & Bubbles',
        plantLifecycle: 'Botanical Lifecycle & Splats',
        microFaunaSim: 'Micro-Fauna State Simulation',
        microFaunaRender: 'Soft-Body Verlet / Mesh Deformation',
        webglRender: 'Three.js WebGL Render Call',
        screenSpaceDisplacement: 'Screen Space Displacement & Optics',
      };
      culpritName = stageLabels[maxStage] || maxStage;
      culpritMs = maxStageMs;
    }

    this.hitchCounter++;
    const hitch: HitchRecord = {
      id: this.hitchCounter,
      timestamp: now,
      frameTimeMs: Math.round(frameTimeMs * 10) / 10,
      renderCpuMs: Math.round(renderCpuMs * 10) / 10,
      culprit: culpritName,
      culpritMs: Math.round(culpritMs * 10) / 10,
      stages: stagesCopy,
      unaccountedMs: Math.round(unaccountedMs * 10) / 10,
    };

    this.hitches.unshift(hitch);
    if (this.hitches.length > HITCH_LOG_SIZE) {
      this.hitches.pop();
    }

    this.activeHitch = hitch;
    this.activeHitchTimeout = now;

    if (this.logToConsoleOnHitch) {
      console.warn(
        `[Chronos Benchmark] ⚠️ Frame hitch: ${frameTimeMs.toFixed(1)}ms (target <=16.6ms) | Culprit: ${culpritName} (${culpritMs.toFixed(1)}ms) | CPU: ${renderCpuMs.toFixed(1)}ms`
      );
    }
  }

  public getSnapshot(): BenchmarkSnapshot {
    const now = performance.now();
    const count = this.ringCount;

    if (count === 0) {
      return {
        fps: 60,
        smoothFps: 60,
        meanFrameMs: 16.6,
        minFrameMs: 16.6,
        maxFrameMs: 16.6,
        p95FrameMs: 16.6,
        p99FrameMs: 16.6,
        jitterMs: 0,
        renderCpuMs: 0,
        totalHitches: 0,
        recentHitches: 0,
        recentFrameTimes: [],
        stageAverages: { ...this.currentStages },
        latestStages: { ...this.currentStages },
        hitches: [],
        activeHitch: null,
        drawCalls: 0,
        triangles: 0,
        memoryMb: null,
      };
    }

    // Calculate statistics
    let sum = 0;
    let min = Infinity;
    let max = -Infinity;
    const sorted = new Float32Array(count);
    const recent: number[] = [];

    for (let i = 0; i < count; i++) {
      const idx = (this.ringIndex - count + i + RING_BUFFER_SIZE) % RING_BUFFER_SIZE;
      const val = this.frameTimesRing[idx];
      sum += val;
      if (val < min) min = val;
      if (val > max) max = val;
      sorted[i] = val;
      recent.push(Math.round(val * 10) / 10);
    }

    const mean = sum / count;
    sorted.sort();

    const p95 = sorted[Math.floor(count * 0.95)] || mean;
    const p99 = sorted[Math.floor(count * 0.99)] || max;

    // Jitter (Standard Deviation)
    let varianceSum = 0;
    for (let i = 0; i < count; i++) {
      const diff = sorted[i] - mean;
      varianceSum += diff * diff;
    }
    const jitter = Math.sqrt(varianceSum / count);

    // Recent hitches in last 5 seconds
    const recentHitches = this.hitches.filter((h) => now - h.timestamp < 5000).length;

    // Stage averages
    const sampleDiv = Math.max(1, this.stageSampleCount);
    const stageAverages: Record<BenchmarkStage, number> = {
      boidsPhysics: Math.round((this.stageAccumulators.boidsPhysics / sampleDiv) * 100) / 100,
      floraSim: Math.round((this.stageAccumulators.floraSim / sampleDiv) * 100) / 100,
      instancedFish: Math.round((this.stageAccumulators.instancedFish / sampleDiv) * 100) / 100,
      instancedFireflies: Math.round((this.stageAccumulators.instancedFireflies / sampleDiv) * 100) / 100,
      ambientObjects: Math.round((this.stageAccumulators.ambientObjects / sampleDiv) * 100) / 100,
      plantLifecycle: Math.round((this.stageAccumulators.plantLifecycle / sampleDiv) * 100) / 100,
      microFaunaSim: Math.round((this.stageAccumulators.microFaunaSim / sampleDiv) * 100) / 100,
      microFaunaRender: Math.round((this.stageAccumulators.microFaunaRender / sampleDiv) * 100) / 100,
      webglRender: Math.round((this.stageAccumulators.webglRender / sampleDiv) * 100) / 100,
      screenSpaceDisplacement: Math.round((this.stageAccumulators.screenSpaceDisplacement / sampleDiv) * 100) / 100,
    };

    // Instant & Smooth FPS
    const latestFrameTime = this.frameTimesRing[(this.ringIndex - 1 + RING_BUFFER_SIZE) % RING_BUFFER_SIZE] || 16.6;
    const instantFps = Math.round(1000 / Math.max(1, latestFrameTime));
    const smoothFps = Math.round(1000 / Math.max(1, mean));

    // Memory info (Chrome/Chromium performance.memory API)
    let memoryMb: { used: number; total: number; limit: number } | null = null;
    const perfMem = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    if (perfMem) {
      memoryMb = {
        used: Math.round(perfMem.usedJSHeapSize / (1024 * 1024)),
        total: Math.round(perfMem.totalJSHeapSize / (1024 * 1024)),
        limit: Math.round(perfMem.jsHeapSizeLimit / (1024 * 1024)),
      };
    }

    return {
      fps: instantFps,
      smoothFps,
      meanFrameMs: Math.round(mean * 10) / 10,
      minFrameMs: Math.round(min * 10) / 10,
      maxFrameMs: Math.round(max * 10) / 10,
      p95FrameMs: Math.round(p95 * 10) / 10,
      p99FrameMs: Math.round(p99 * 10) / 10,
      jitterMs: Math.round(jitter * 10) / 10,
      renderCpuMs: Math.round(
        (this.currentStages.boidsPhysics +
          this.currentStages.floraSim +
          this.currentStages.instancedFish +
          this.currentStages.instancedFireflies +
          this.currentStages.ambientObjects +
          this.currentStages.microFaunaSim +
          this.currentStages.microFaunaRender +
          this.currentStages.webglRender) *
          10
      ) / 10,
      totalHitches: this.hitchCounter,
      recentHitches,
      recentFrameTimes: recent,
      stageAverages,
      latestStages: { ...this.currentStages },
      hitches: [...this.hitches],
      activeHitch: this.activeHitch,
      drawCalls: this.drawCalls,
      triangles: this.triangles,
      memoryMb,
    };
  }

  public reset() {
    this.ringIndex = 0;
    this.ringCount = 0;
    this.frameTimesRing.fill(0);
    this.hitches = [];
    this.hitchCounter = 0;
    this.activeHitch = null;
    this.stageSampleCount = 0;
    for (const key of Object.keys(this.stageAccumulators)) {
      this.stageAccumulators[key as BenchmarkStage] = 0;
    }
  }

  public subscribe(listener: (snapshot: BenchmarkSnapshot) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public generateReport(): string {
    const s = this.getSnapshot();
    const lines = [
      '# Chronos Aquarium Performance & Diagnostic Report',
      `Generated at: ${new Date().toLocaleTimeString()}`,
      '',
      '## Frame Rate & Latency Profile',
      `- Smooth FPS: ${s.smoothFps} FPS (Instant: ${s.fps} FPS)`,
      `- Mean Frame Time: ${s.meanFrameMs} ms (60 FPS budget: 16.6 ms)`,
      `- 95th Percentile (P95): ${s.p95FrameMs} ms`,
      `- 99th Percentile (P99): ${s.p99FrameMs} ms`,
      `- Max Frame Hitch: ${s.maxFrameMs} ms`,
      `- Frame Jitter (StdDev): ${s.jitterMs} ms`,
      `- Total Hitch Count (>25ms): ${s.totalHitches} (Recent in last 5s: ${s.recentHitches})`,
      '',
      '## Subsystem Timing Breakdown (Rolling Average)',
      `- 4D Boids Physics & Kuramoto: ${s.stageAverages.boidsPhysics.toFixed(2)} ms`,
      `- Soft-Body Physics & Micro-Fauna Render: ${s.stageAverages.microFaunaRender.toFixed(2)} ms`,
      `- Micro-Fauna State Simulation: ${s.stageAverages.microFaunaSim.toFixed(2)} ms`,
      `- Instanced Fish Buffers: ${s.stageAverages.instancedFish.toFixed(2)} ms`,
      `- Instanced Firefly Photophores: ${s.stageAverages.instancedFireflies.toFixed(2)} ms`,
      `- Micro-Flora Canvas & GPU Upload: ${s.stageAverages.floraSim.toFixed(2)} ms`,
      `- Ambient Objects & Shader Uniforms: ${s.stageAverages.ambientObjects.toFixed(2)} ms`,
      `- Three.js WebGL Render: ${s.stageAverages.webglRender.toFixed(2)} ms`,
      '',
      '## GPU & Memory Profile',
      `- WebGL Draw Calls: ${s.drawCalls}`,
      `- Rendered Triangles: ${s.triangles}`,
      s.memoryMb ? `- JS Heap Used: ${s.memoryMb.used} MB / ${s.memoryMb.total} MB (Limit: ${s.memoryMb.limit} MB)` : '- JS Heap: N/A',
      '',
      '## Recent Hitch Events Log',
      ...(s.hitches.length === 0
        ? ['- Zero hitches recorded! Running at a clean, locked 60 FPS.']
        : s.hitches.slice(0, 15).map(
            (h) =>
              `- [${new Date(h.timestamp).toLocaleTimeString()}] Hitch ${h.frameTimeMs} ms -> Culprit: ${h.culprit} (${h.culpritMs} ms) | Unaccounted/GC: ${h.unaccountedMs} ms`
          )),
    ];
    return lines.join('\n');
  }
}

export const benchmarkEngine = PerformanceBenchmarkEngine.getInstance();
