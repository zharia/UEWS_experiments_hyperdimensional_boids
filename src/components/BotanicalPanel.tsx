/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Flower2,
  Leaf,
  Sparkles,
  Scissors,
  Droplets,
  RotateCcw,
  X,
  FastForward,
  Info,
} from 'lucide-react';
import { BotanicalPlant, PlantLifecycleSimulation, PlantLifecycleStage } from '../simulation/plantLifecycle';

interface BotanicalPanelProps {
  lifecycleSim: PlantLifecycleSimulation | null | undefined;
  isOpen: boolean;
  onClose: () => void;
}

export function BotanicalPanel({ lifecycleSim, isOpen, onClose }: BotanicalPanelProps) {
  const [, setTick] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  // Poll state at 6 Hz to display real-time growth, wilting, and detritus telemetry
  useEffect(() => {
    if (!isOpen || !lifecycleSim) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 160);
    return () => clearInterval(interval);
  }, [isOpen, lifecycleSim]);

  if (!isOpen || !lifecycleSim) return null;

  const plants = lifecycleSim.plants;
  const activePlant = plants.find(p => p.id === selectedPlantId) || plants[0];

  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    lifecycleSim.setSpeedMultiplier(val);
  };

  const getStageBadge = (stage: PlantLifecycleStage) => {
    switch (stage) {
      case 'sprout':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            <Sprout className="w-3 h-3 text-emerald-400" />
            Sprout
          </span>
        );
      case 'growing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-teal-950/80 text-teal-300 border border-teal-700/60">
            <Leaf className="w-3 h-3 text-teal-400" />
            Growing
          </span>
        );
      case 'flourishing':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-fuchsia-950/80 text-fuchsia-300 border border-fuchsia-700/60">
            <Flower2 className="w-3 h-3 text-fuchsia-400" />
            Flourishing
          </span>
        );
      case 'senescent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-700/60">
            <Leaf className="w-3 h-3 text-amber-400 rotate-180" />
            Senescent
          </span>
        );
      case 'rebirth':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-sky-950/80 text-sky-300 border border-sky-700/60">
            <RotateCcw className="w-3 h-3 text-sky-400" />
            Rebirth
          </span>
        );
    }
  };

  return (
    <div
      id="botanical-lifecycle-modal"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900/95 backdrop-blur-md border-l border-slate-700/70 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/70 bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Botanical Morphology & Lifecycle
            </h2>
            <p className="text-xs text-slate-400">
              C1/C2 Smooth-Minima Junctions & Splat Venation
            </p>
          </div>
        </div>
        <button
          id="btn-close-botanical-panel"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Global Lifecycle Controls Bar */}
      <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            Simulation Rate:
          </span>
          <span className="font-mono text-cyan-400 font-semibold">{speed.toFixed(1)}x</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="slider-lifecycle-speed"
            type="range"
            min="0.2"
            max="12.0"
            step="0.2"
            value={speed}
            onChange={e => handleSpeedChange(parseFloat(e.target.value))}
            className="flex-1 accent-emerald-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            id="btn-trigger-bloom"
            onClick={() => lifecycleSim.triggerSynchronizedBloom()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-xs font-medium rounded-md bg-fuchsia-950/70 hover:bg-fuchsia-900/80 border border-fuchsia-700/60 text-fuchsia-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
            Spore Dispersal
          </button>
        </div>
      </div>

      {/* Plant Specimen Selector Grid */}
      <div className="p-3 bg-slate-900/80 border-b border-slate-800">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Aquarium Specimens ({plants.length})
        </div>
        <div className="grid grid-cols-2 gap-2">
          {plants.map(p => {
            const isSelected = activePlant?.id === p.id;
            return (
              <button
                key={p.id}
                id={`btn-select-plant-${p.id}`}
                onClick={() => setSelectedPlantId(p.id)}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-slate-800/95 border-emerald-500/80 shadow-sm shadow-emerald-950'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                    {p.commonName}
                  </span>
                  {getStageBadge(p.stage)}
                </div>
                <span className="text-[10px] text-slate-400 italic truncate">
                  {p.scientificName}
                </span>

                {/* Mini lifecycle timeline bar */}
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className={`h-full transition-all duration-300 ${
                      p.stage === 'senescent'
                        ? 'bg-amber-500'
                        : p.stage === 'flourishing'
                        ? 'bg-fuchsia-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.round(p.overallProgress * 100)}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Specimen Detail Card */}
      {activePlant && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {activePlant.commonName}
                </h3>
                <p className="text-xs text-emerald-400 italic font-mono">
                  {activePlant.scientificName}
                </p>
              </div>
              {getStageBadge(activePlant.stage)}
            </div>

            {/* Stage Progress Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Stage Progress</span>
                <span className="font-mono text-slate-200">
                  {Math.round(activePlant.stageProgress * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${Math.round(activePlant.stageProgress * 100)}%` }}
                />
              </div>
            </div>

            {/* Physiological Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Growth Stature</div>
                <div className="text-sm font-semibold text-white font-mono">
                  {Math.round(activePlant.growthScale * 100)}%
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Turgor / Sag</div>
                <div className="text-sm font-semibold text-amber-300 font-mono">
                  {activePlant.wiltAmount > 0.05
                    ? `Wilted ${(activePlant.wiltAmount * 100).toFixed(0)}%`
                    : 'Turgid (Upright)'}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Chlorosis (Decay)</div>
                <div className="text-sm font-semibold text-amber-400 font-mono">
                  {Math.round(activePlant.chlorosis * 100)}%
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">Shed Detritus Flakes</div>
                <div className="text-sm font-semibold text-cyan-300 font-mono">
                  {activePlant.shedLeavesCount} flakes
                </div>
              </div>
            </div>

            {/* Interactive Botanical Actions */}
            <div className="flex gap-2 pt-2">
              <button
                id={`btn-fertilize-${activePlant.id}`}
                onClick={() => lifecycleSim.fertilizePlant(activePlant.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-emerald-900/60 hover:bg-emerald-800/70 border border-emerald-600/60 text-emerald-200 transition-colors"
              >
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                Fertilize (Surge)
              </button>

              <button
                id={`btn-prune-${activePlant.id}`}
                onClick={() => lifecycleSim.prunePlant(activePlant.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-colors"
              >
                <Scissors className="w-3.5 h-3.5 text-slate-300" />
                Prune & Regrow
              </button>
            </div>
          </div>

          {/* Morphological Architectural Note */}
          <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-300">
              <Info className="w-4 h-4 text-emerald-400" />
              Morphology & Splat Integration
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Stems and holdfasts are synthesized via quadratic smooth-minimum (<code className="text-emerald-300 font-mono">smin</code>) blending to eliminate rigid polygonal seams at branch bifurcations. Foliage surfaces utilize procedural oriented-quad splats with procedural venation, cellular stippling, and chloroplast scattering.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
