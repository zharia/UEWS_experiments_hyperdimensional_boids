/**
 * Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology
 * LandscapeInspectorModal: HUD modal providing live diagnostics telemetry and controls
 * for the 4D landscape evolution subsystem.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Layers,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Waves,
  Mountain,
} from 'lucide-react';
import { LandscapeEvolutionSystem } from '../landscape/LandscapeEvolutionSystem';
import { LandscapeDiagnostics, LandscapeState } from '../landscape/types';

interface LandscapeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  landscapeSim?: LandscapeEvolutionSystem;
}

export const LandscapeInspectorModal: React.FC<LandscapeInspectorModalProps> = ({
  isOpen,
  onClose,
  landscapeSim,
}) => {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'modes' | 'topology'>('telemetry');
  const [diagnostics, setDiagnostics] = useState<LandscapeDiagnostics | null>(null);
  const [landscapeState, setLandscapeState] = useState<LandscapeState | null>(null);
  const [, setTick] = useState<number>(0);

  // Poll diagnostics at 10 Hz when modal is open
  useEffect(() => {
    if (!isOpen || !landscapeSim) return;

    const interval = setInterval(() => {
      setDiagnostics(landscapeSim.getDiagnostics());
      setLandscapeState(landscapeSim.getState());
      setTick((t) => t + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, landscapeSim]);

  if (!isOpen || !landscapeSim) return null;

  const diag = diagnostics || landscapeSim.getDiagnostics();
  const state = landscapeState || landscapeSim.getState();

  const handleTogglePlayPause = () => {
    if (landscapeSim.traversalVelocity === 0) {
      landscapeSim.resume();
    } else {
      landscapeSim.pause();
    }
  };

  const handleReverse = () => {
    landscapeSim.reverse();
  };

  const handleResetToZero = () => {
    landscapeSim.setTime4D(0);
  };

  const handleVelocityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    landscapeSim.setVelocity(parseFloat(e.target.value));
  };

  const handleConformalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    landscapeSim.conformalStrength = parseFloat(e.target.value);
  };

  const handleQuasiConformalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    landscapeSim.quasiConformalStrength = parseFloat(e.target.value);
  };

  const handleCurvatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    landscapeSim.curvatureStrength = parseFloat(e.target.value);
  };

  const handleToggleMode = (modeId: string) => {
    const mode = state.evolution.modes.find((m) => m.id === modeId);
    if (mode) {
      mode.active = !mode.active;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="landscape-inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/40 text-slate-950">
              <Mountain className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="landscape-inspector-title" className="text-base font-semibold text-white font-['Space_Grotesk']">
                  Dynamic 4D Landscape Evolution
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 font-semibold">
                  M⁴ ⊃ Σₜ³ Section
                </span>
              </div>
              <p className="text-xs text-slate-400 font-['Plus_Jakarta_Sans']">
                Continuous 4D manifold traversal, conformal flow & topological invariance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Traversal Controls */}
            <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-lg border border-slate-800">
              <button
                onClick={handleReverse}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition"
                title="Reverse Traversal Direction"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleTogglePlayPause}
                className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
                title={diag.traversalVelocity === 0 ? 'Resume Traversal' : 'Pause Traversal'}
              >
                {diag.traversalVelocity === 0 ? (
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                ) : (
                  <Pause className="w-4 h-4 text-amber-400 fill-amber-400" />
                )}
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-slate-800 bg-slate-950/40 shrink-0">
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Diagnostics Telemetry (Section 28)</span>
          </button>

          <button
            onClick={() => setActiveTab('modes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'modes'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Deformation Modes ({state.evolution.modes.filter((m) => m.active).length} Active)</span>
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'topology'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Topology & Invariant Features ({state.features.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              {/* Core 8 Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* 1. 4D Coordinate */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>4D Coordinate (w)</span>
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-cyan-300">
                    {diag.time4D.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Temporal cross-section</div>
                </div>

                {/* 2. Traversal Velocity */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Traversal Velocity (v_w)</span>
                    <Waves className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold font-mono text-amber-300">
                    {diag.traversalVelocity > 0 ? `+${diag.traversalVelocity.toFixed(2)}` : diag.traversalVelocity.toFixed(2)}{' '}
                    <span className="text-xs text-slate-400 font-normal">w/s</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {diag.traversalVelocity === 0 ? 'Paused' : diag.traversalVelocity > 0 ? 'Forward progression' : 'Reverse traversal'}
                  </div>
                </div>

                {/* 3. Conformal Deformation */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Conformal Strength</span>
                    <span className="text-[10px] font-mono text-emerald-400">J = sR</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-emerald-300">
                    {diag.conformalStrength.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    C-R error: {diag.conformalDeviation.toExponential(2)}
                  </div>
                </div>

                {/* 4. Quasi-Conformal Strength */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Quasi-Conformal</span>
                    <span className="text-[10px] font-mono text-purple-400">J = RS</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-purple-300">
                    {diag.quasiConformalStrength.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Bounded dilatation</div>
                </div>

                {/* 5. Curvature Flow Magnitude */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Curvature Flow</span>
                    <span className="text-[10px] font-mono text-indigo-400">∂X/∂t=F(κ)</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-indigo-300">
                    {diag.curvatureStrength.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Mean |κ|: {diag.meanCurvatureMagnitude.toFixed(4)}
                  </div>
                </div>

                {/* 6. Maximum Local Distortion */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Max Distortion D</span>
                    <span className="text-[10px] font-mono text-pink-400">D &lt; 0.45</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-pink-300">
                    {diag.maxLocalDistortion.toFixed(3)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Beltrami dilatation</div>
                </div>

                {/* 7. Topology Invariant */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>Topology Status</span>
                    {diag.topologyPreserved ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {diag.topologyPreserved ? 'INVARIANT' : 'MUTATED'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    1 connected component
                  </div>
                </div>

                {/* 8. RMS Displacement */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
                    <span>RMS Displacement</span>
                    <span className="text-[10px] font-mono text-teal-400">‖ΔL‖</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-teal-300">
                    {diag.rootMeanSquareDisplacement.toFixed(4)}{' '}
                    <span className="text-xs text-slate-400 font-normal">m</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Frame displacement</div>
                </div>
              </div>

              {/* Real-Time Interactive Sliders */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">
                  Geometric Flow Field Parameters
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Traversal Velocity Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">4D Traversal Velocity (v_w)</span>
                      <span className="font-mono text-amber-300">{diag.traversalVelocity.toFixed(2)} w/s</span>
                    </div>
                    <input
                      type="range"
                      min="-0.8"
                      max="0.8"
                      step="0.02"
                      value={diag.traversalVelocity}
                      onChange={handleVelocityChange}
                      className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>-0.8 (Reverse)</span>
                      <span>0.0 (Paused)</span>
                      <span>+0.8 (Accelerated)</span>
                    </div>
                  </div>

                  {/* Conformal Strength Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Conformal Weight (Angle Preservation)</span>
                      <span className="font-mono text-emerald-300">{diag.conformalStrength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={diag.conformalStrength}
                      onChange={handleConformalChange}
                      className="w-full accent-emerald-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>0.0 (Inactive)</span>
                      <span>0.35 (Default)</span>
                      <span>1.0 (Maximum)</span>
                    </div>
                  </div>

                  {/* Quasi-Conformal Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Quasi-Conformal Bounded Distortion Weight</span>
                      <span className="font-mono text-purple-300">{diag.quasiConformalStrength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={diag.quasiConformalStrength}
                      onChange={handleQuasiConformalChange}
                      className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>0.0 (Inactive)</span>
                      <span>0.28 (Default)</span>
                      <span>1.0 (Maximum)</span>
                    </div>
                  </div>

                  {/* Curvature Flow Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Curvature Flow Redistribution Weight</span>
                      <span className="font-mono text-indigo-300">{diag.curvatureStrength.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={diag.curvatureStrength}
                      onChange={handleCurvatureChange}
                      className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>0.0 (Inactive)</span>
                      <span>0.18 (Default)</span>
                      <span>1.0 (Maximum)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={handleResetToZero}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    Reset w to 0.0
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Low-dimensional deformation modes composable through the geometric flow field:{' '}
                <code className="text-amber-300 font-mono">V = V_4D + V_conf + V_qc + V_curv + V_modal</code>
              </p>

              <div className="space-y-2.5">
                {state.evolution.modes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`p-4 rounded-xl border transition flex items-center justify-between ${
                      mode.active
                        ? 'bg-slate-950/70 border-amber-600/40 shadow-sm'
                        : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{mode.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {mode.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                        <span>Amplitude: {mode.amplitude.toFixed(2)}</span>
                        <span>Freq (w): {mode.frequencyW.toFixed(2)}</span>
                        <span>Phase: {mode.phase.toFixed(2)} rad</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleMode(mode.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                        mode.active
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {mode.active ? 'ACTIVE' : 'MUTED'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'topology' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Persistent geological structures decoupled from mesh vertex indices. Connected components:{' '}
                <strong className="text-emerald-400">{state.topology.connectedComponents}</strong>, Invariant Status:{' '}
                <strong className="text-emerald-400">{state.topology.isInvariant ? 'PRESERVED' : 'CORRUPTED'}</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {state.features.map((f) => (
                  <div
                    key={f.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white font-mono">{f.id}</span>
                        <span className="text-xs text-slate-300">{f.name}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                        {f.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 pt-1">
                      <div>
                        Centroid:{' '}
                        <span className="text-slate-200">
                          [{f.centroid.x.toFixed(1)}, {f.centroid.y.toFixed(2)}, {f.centroid.z.toFixed(1)}]
                        </span>
                      </div>
                      <div>
                        Mean Height: <span className="text-slate-200">{f.meanHeight.toFixed(2)} m</span>
                      </div>
                      <div>
                        Curvature: <span className="text-slate-200">{f.meanCurvature.toFixed(4)}</span>
                      </div>
                      <div>
                        Neighbors:{' '}
                        <span className="text-amber-400">{f.neighbors.length} adjacent</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Adjacency: {f.neighbors.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
