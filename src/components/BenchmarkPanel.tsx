/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  benchmarkEngine,
  BenchmarkSnapshot,
  BenchmarkStage,
} from '../utils/performanceBenchmark';

interface BenchmarkPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAGE_LABELS: Record<BenchmarkStage, { label: string; color: string; desc: string }> = {
  boidsPhysics: {
    label: '4D Boids & Kuramoto',
    color: 'bg-emerald-500',
    desc: 'Spatial grid partitioning, 4D hypersphere advection & synchrony',
  },
  microFaunaRender: {
    label: 'Soft-Body & Micro-Fauna Rig',
    color: 'bg-cyan-500',
    desc: 'Verlet particle chains, elastic constraints & bell deformation',
  },
  microFaunaSim: {
    label: 'Micro-Fauna State Sim',
    color: 'bg-teal-500',
    desc: 'Benthic foraging, grazing logic & state machine timers',
  },
  instancedFish: {
    label: 'Fish Matrix Buffers',
    color: 'bg-blue-500',
    desc: 'Per-fish orientation, swim phase & GPU instanced attributes',
  },
  instancedFireflies: {
    label: 'Firefly Photophores',
    color: 'bg-amber-400',
    desc: 'Plankton instanced transforms & flash intensity buffers',
  },
  floraSim: {
    label: 'Micro-Flora & Canvas Upload',
    color: 'bg-lime-500',
    desc: '2D canvas filament rasterization & WebGL texture update',
  },
  ambientObjects: {
    label: 'Ambient & Shader Uniforms',
    color: 'bg-indigo-500',
    desc: 'Anemone kinematics, rising bubbles & caustics time uniforms',
  },
  plantLifecycle: {
    label: 'Botanical Lifecycle & Splats',
    color: 'bg-emerald-600',
    desc: 'Morphology growth/wilting, detritus shedding, and spore drift',
  },
  webglRender: {
    label: 'Three.js WebGL Render',
    color: 'bg-violet-500',
    desc: 'GPU draw calls, depth sorting & fragment shading',
  },
  screenSpaceDisplacement: {
    label: 'Screen Space Displacement',
    color: 'bg-teal-400',
    desc: 'Hydrodynamic wave refraction, wake shockwaves & chromatic dispersion',
  },
};

export const BenchmarkPanel: React.FC<BenchmarkPanelProps> = ({ isOpen, onClose }) => {
  const [snapshot, setSnapshot] = useState<BenchmarkSnapshot>(() => benchmarkEngine.getSnapshot());
  const [copied, setCopied] = useState<boolean>(false);
  const [logConsole, setLogConsole] = useState<boolean>(benchmarkEngine.logToConsoleOnHitch);
  const sparklineCanvasRef = useRef<HTMLCanvasElement>(null);

  // Subscribe to benchmark engine stream
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = benchmarkEngine.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Render real-time frame-time sparkline graph
  useEffect(() => {
    if (!isOpen || !sparklineCanvasRef.current) return;
    const canvas = sparklineCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    // 16.6ms target guide line (60 FPS)
    const targetY16 = h - (16.6 / 50.0) * h;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)'; // Emerald
    ctx.setLineDash([3, 3]);
    ctx.moveTo(0, targetY16);
    ctx.lineTo(w, targetY16);
    ctx.stroke();

    // 33.3ms guide line (30 FPS)
    const targetY33 = h - (33.3 / 50.0) * h;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.4)'; // Rose
    ctx.moveTo(0, targetY33);
    ctx.lineTo(w, targetY33);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw frame-time bars
    const times = snapshot.recentFrameTimes;
    if (times.length === 0) return;

    const barWidth = w / 120;
    for (let i = 0; i < times.length; i++) {
      const ft = times[i];
      const barH = Math.min(h, (ft / 50.0) * h);
      const x = i * barWidth;
      const y = h - barH;

      if (ft > 30.0) {
        ctx.fillStyle = '#f87171'; // Red hitch
      } else if (ft > 20.0) {
        ctx.fillStyle = '#fbbf24'; // Amber warning
      } else {
        ctx.fillStyle = '#34d399'; // Smooth green
      }

      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barH);
    }
  }, [isOpen, snapshot.recentFrameTimes]);

  if (!isOpen) return null;

  const handleCopyReport = () => {
    const report = benchmarkEngine.generateReport();
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleReset = () => {
    benchmarkEngine.reset();
    setSnapshot(benchmarkEngine.getSnapshot());
  };

  const handleToggleConsoleLog = () => {
    const next = !logConsole;
    benchmarkEngine.logToConsoleOnHitch = next;
    setLogConsole(next);
  };

  const isHitching = snapshot.recentHitches > 0;
  const fpsColor =
    snapshot.smoothFps >= 55
      ? 'text-emerald-400'
      : snapshot.smoothFps >= 38
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900/95 border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-wide text-slate-100">
                  Simulation Performance & Hitch Diagnostics
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    isHitching
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}
                >
                  {isHitching ? `⚠️ ${snapshot.recentHitches} Hitches (Last 5s)` : '● Locked 60 FPS'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Sub-millisecond instrumentation profiling soft-body physics, 4D boids, canvas & WebGL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyReport}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
              title="Copy markdown diagnostic report to clipboard"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  <span>Export Report</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Reset frame counters and hitch log"
            >
              Reset
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              title="Close panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Real-time Sparkline Graph */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-400">
                Real-Time Frame Latency History (Last 120 Frames)
              </span>
              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full inline-block" />
                  Target 16.6ms (60 FPS)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-rose-400 rounded-full inline-block" />
                  Hitch Threshold 33.3ms (30 FPS)
                </span>
              </div>
            </div>
            <div className="w-full h-24 relative">
              <canvas
                ref={sparklineCanvasRef}
                width={800}
                height={96}
                className="w-full h-full rounded bg-slate-950 border border-slate-900"
              />
            </div>
          </div>

          {/* Metric Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Smooth FPS</div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold font-mono ${fpsColor}`}>{snapshot.smoothFps}</span>
                <span className="text-xs text-slate-500 font-mono">({snapshot.fps} inst)</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Mean: {snapshot.meanFrameMs} ms</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Percentiles (P95 / P99)</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-cyan-300">{snapshot.p95FrameMs}</span>
                <span className="text-xs text-slate-400">/</span>
                <span className="text-xl font-bold font-mono text-amber-300">{snapshot.p99FrameMs}</span>
                <span className="text-xs text-slate-500">ms</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Jitter: ±{snapshot.jitterMs} ms</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Frame Hitches (&gt;25ms)</div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold font-mono ${snapshot.totalHitches > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {snapshot.totalHitches}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({snapshot.recentHitches} in 5s)
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Max Hitch: {snapshot.maxFrameMs} ms</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">WebGL / JS Heap</div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold font-mono text-slate-200">{snapshot.drawCalls}</span>
                <span className="text-xs text-slate-500">draws</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {snapshot.memoryMb ? `${snapshot.memoryMb.used} MB used` : `${(snapshot.triangles / 1000).toFixed(1)}k tris`}
              </div>
            </div>
          </div>

          {/* Subsystem Timing Breakdown */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Subsystem Timing Breakdown</h3>
                <p className="text-xs text-slate-400">
                  Rolling CPU time spent inside each simulation component per frame
                </p>
              </div>
              <div className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/40">
                Render CPU: {snapshot.renderCpuMs} ms / 16.6 ms (
                {Math.round((snapshot.renderCpuMs / 16.6) * 100)}%)
              </div>
            </div>

            <div className="space-y-3">
              {(Object.keys(STAGE_LABELS) as BenchmarkStage[]).map((stage) => {
                const config = STAGE_LABELS[stage];
                const avgMs = snapshot.stageAverages[stage] || 0;
                const pctOfBudget = Math.min(100, Math.round((avgMs / 16.6) * 100));

                return (
                  <div key={stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-sm ${config.color}`} />
                        <span className="font-medium text-slate-200">{config.label}</span>
                        <span className="text-slate-500 hidden sm:inline">- {config.desc}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-200">{avgMs.toFixed(2)} ms</span>
                        <span className="text-slate-500 text-[11px]">({pctOfBudget}%)</span>
                      </div>
                    </div>
                    {/* Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${config.color}`}
                        style={{ width: `${Math.max(1, pctOfBudget)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hitch & Glitch Diagnostics Log */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Frame Stutter / Hitch Diagnostic Log</h3>
                <p className="text-xs text-slate-400">
                  Automatically flags any frame exceeding 25ms and isolates the primary culprit
                </p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={logConsole}
                  onChange={handleToggleConsoleLog}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500/20"
                />
                Log to DevTools Console
              </label>
            </div>

            {snapshot.hitches.length === 0 ? (
              <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                <svg className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs font-medium text-slate-400">Zero Stutter Events Detected</div>
                <div className="text-[11px] text-slate-600 mt-0.5">The render pipeline is executing smoothly within the 16.6ms frame budget.</div>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {snapshot.hitches.slice(0, 15).map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {h.frameTimeMs} ms
                      </span>
                      <div>
                        <span className="font-medium text-slate-200">Culprit: {h.culprit}</span>
                        <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                          ({h.culpritMs} ms)
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>CPU: {h.renderCpuMs}ms</span>
                      <span>GC/Delay: {h.unaccountedMs}ms</span>
                      <span className="text-slate-600">{new Date(h.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">B</kbd> to toggle</span>
            <span>•</span>
            <span>Target budget: 16.6ms / frame</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
