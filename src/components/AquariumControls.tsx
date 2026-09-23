/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Cookie,
  Eraser,
  Lamp,
  Moon,
  MousePointer,
  Sparkles,
  Sun,
  Sunset,
  Waves,
  ChevronRight,
  ChevronLeft,
  Zap,
  Layers,
  Flame,
  Fish,
  Play,
  Pause,
  Clock,
  RotateCcw,
  CircleDot,
} from 'lucide-react';
import { InteractionTool, LightingPreset, ProcessRegimePreset } from '../types';
import { ProceduralFloraSimulation } from '../simulation/flora';
import { AquariumSceneManager } from '../rendering/aquariumScene';
import { BoidSimulation4D } from '../simulation/boids4D';
import { SPECIES_CONFIGS } from '../simulation/species';

interface AquariumControlsProps {
  currentTool: InteractionTool;
  onSelectTool: (tool: InteractionTool) => void;
  lightingPreset: LightingPreset;
  onSelectLighting: (preset: LightingPreset) => void;
  deskLampOn: boolean;
  onToggleDeskLamp: () => void;
  boidSim: BoidSimulation4D;
  floraSim: ProceduralFloraSimulation;
  sceneManager: AquariumSceneManager | null;
  onStateChanged?: () => void;
}

export const AquariumControls: React.FC<AquariumControlsProps> = ({
  currentTool,
  onSelectTool,
  lightingPreset,
  onSelectLighting,
  deskLampOn,
  onToggleDeskLamp,
  boidSim,
  floraSim,
  sceneManager,
  onStateChanged,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [, setRerenderTrigger] = useState(0);

  const forceUpdate = () => {
    setRerenderTrigger((n) => n + 1);
    onStateChanged?.();
  };

  const handleApplyPreset = (preset: ProcessRegimePreset) => {
    boidSim.applyRegimePreset(preset);
    forceUpdate();
  };

  const handleMacroChange = (val: number) => {
    boidSim.setMacroCount(val);
    forceUpdate();
  };

  const handleMesoChange = (val: number) => {
    boidSim.setMesoCount(val);
    forceUpdate();
  };

  const handleFireflyChange = (val: number) => {
    boidSim.setFireflyCount(val);
    forceUpdate();
  };

  const handleToggleKuramoto = () => {
    boidSim.kuramotoEnabled = !boidSim.kuramotoEnabled;
    forceUpdate();
  };

  const handleCouplingChange = (val: number) => {
    boidSim.kuramotoCoupling = val;
    forceUpdate();
  };

  // Day-Night Circadian Cycle Handlers
  const handleToggleDayNight = () => {
    if (sceneManager) {
      sceneManager.setDayNightCycleEnabled(!sceneManager.dayNightCycle.enabled);
      forceUpdate();
    }
  };

  const handleDayNightPeriodChange = (val: number) => {
    if (sceneManager) {
      sceneManager.setDayNightCyclePeriod(val);
      forceUpdate();
    }
  };

  const handleDayNightPhaseChange = (val: number) => {
    if (sceneManager) {
      sceneManager.setDayNightPhase(val);
      forceUpdate();
    }
  };

  // Separate Firefly Swarm Quantity Cycle Handlers
  const handleToggleFireflyCycle = () => {
    boidSim.setFireflyCycleEnabled(!boidSim.fireflyCycle.enabled);
    forceUpdate();
  };

  const handleFireflyPeriodChange = (val: number) => {
    boidSim.setFireflyCyclePeriod(val);
    forceUpdate();
  };

  const handleFireflyMinChange = (val: number) => {
    boidSim.setFireflyCycleMinMax(val, boidSim.fireflyCycle.maxCount);
    forceUpdate();
  };

  const handleFireflyMaxChange = (val: number) => {
    boidSim.setFireflyCycleMinMax(boidSim.fireflyCycle.minCount, val);
    forceUpdate();
  };

  const handleFireflyPhaseChange = (val: number) => {
    boidSim.setFireflyCyclePhase(val);
    forceUpdate();
  };

  // Benthic & Epibenthic Micro-Fauna Handlers
  const handleMicroCrabChange = (val: number) => {
    if (sceneManager) {
      sceneManager.microFaunaSim.setPopulationCounts({ crabs: val });
      sceneManager.microFaunaRenderer.rebuildMeshes();
      forceUpdate();
    }
  };

  const handleMicroSnailChange = (val: number) => {
    if (sceneManager) {
      sceneManager.microFaunaSim.setPopulationCounts({ snails: val });
      sceneManager.microFaunaRenderer.rebuildMeshes();
      forceUpdate();
    }
  };

  const handleMicroShrimpChange = (val: number) => {
    if (sceneManager) {
      sceneManager.microFaunaSim.setPopulationCounts({ shrimp: val });
      sceneManager.microFaunaRenderer.rebuildMeshes();
      forceUpdate();
    }
  };

  const handleMicroMedusaChange = (val: number) => {
    if (sceneManager) {
      sceneManager.microFaunaSim.setPopulationCounts({ medusae: val });
      sceneManager.microFaunaRenderer.rebuildMeshes();
      forceUpdate();
    }
  };

  // Day-Night Circadian Status
  const dayNightPhase = sceneManager?.dayNightCycle.currentPhase ?? 0.25;
  const dayNightEnabled = sceneManager?.dayNightCycle.enabled ?? true;
  const dayNightPeriod = sceneManager?.dayNightCycle.periodSeconds ?? 60;

  const totalMinutes = Math.floor(((dayNightPhase * 24 + 6) % 24) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  let circadianName = 'High Noon';
  let CircadianIcon = Sun;
  if (hours >= 5 && hours < 8) {
    circadianName = 'Dawn';
    CircadianIcon = Sun;
  } else if (hours >= 8 && hours < 11) {
    circadianName = 'Morning';
    CircadianIcon = Sun;
  } else if (hours >= 11 && hours < 15) {
    circadianName = 'High Noon';
    CircadianIcon = Sun;
  } else if (hours >= 15 && hours < 18) {
    circadianName = 'Afternoon';
    CircadianIcon = Sun;
  } else if (hours >= 18 && hours < 20) {
    circadianName = 'Sunset';
    CircadianIcon = Sunset;
  } else if (hours >= 20 && hours < 23) {
    circadianName = 'Biolum Twilight';
    CircadianIcon = Sparkles;
  } else {
    circadianName = 'Midnight';
    CircadianIcon = Moon;
  }

  // Firefly Swarm Tide Status
  const fireflyCycle = boidSim.fireflyCycle;
  const fireflyPhase = fireflyCycle.currentPhase;
  const cosPhase = Math.cos(fireflyPhase);
  const sinPhase = Math.sin(fireflyPhase);
  let swarmTrendName = 'Waxing ↗';
  if (cosPhase < -0.8) swarmTrendName = 'Peak Bloom ✨';
  else if (cosPhase > 0.8) swarmTrendName = 'Trough 🌙';
  else if (sinPhase > 0) swarmTrendName = 'Waxing ↗';
  else swarmTrendName = 'Waning ↘';

  const tidePercent = Math.round((1 - Math.cos(fireflyPhase)) * 50);

  return (
    <div className="absolute top-20 right-4 z-20 flex items-start gap-2">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-300 hover:text-white shadow-lg transition-all"
        title="Toggle Control Panel"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Control Card */}
      {isOpen && (
        <div className="w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700/70 rounded-2xl p-4 shadow-2xl flex flex-col gap-4 max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Interaction Tools */}
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2 block">
              Interaction Tool
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onSelectTool('inspect')}
                className={`col-span-2 flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                  currentTool === 'inspect'
                    ? 'bg-sky-950/80 text-sky-300 border-sky-500 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-sky-400" />
                  <span>Inspect & Focus Organism</span>
                </div>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-900 text-sky-300 font-mono text-[10px] border border-slate-700">
                  I
                </kbd>
              </button>

              <button
                onClick={() => onSelectTool('feed')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                  currentTool === 'feed'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cookie className="w-4 h-4 text-amber-400" />
                  <span>Feed Flakes</span>
                </div>
                <kbd className="px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]">
                  F
                </kbd>
              </button>

              <button
                onClick={() => onSelectTool('wafer')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                  currentTool === 'wafer'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-amber-400" />
                  <span>Crab Wafer</span>
                </div>
                <kbd className="px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]">
                  W
                </kbd>
              </button>

              <button
                onClick={() => onSelectTool('clean_glass')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                  currentTool === 'clean_glass'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Eraser className="w-4 h-4 text-emerald-400" />
                  <span>Clean Glass</span>
                </div>
                <kbd className="px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]">
                  C
                </kbd>
              </button>

              <button
                onClick={() => onSelectTool('stir_water')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                  currentTool === 'stir_water'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600 shadow-sm'
                    : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span>Stir & Tap</span>
                </div>
                <kbd className="px-1 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]">
                  S
                </kbd>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 italic">
              {currentTool === 'inspect' && 'Click any fish, crab, snail, or shrimp to lock inspection and follow-cam.'}
              {currentTool === 'feed' && 'Click in the tank to drop sinking food flakes.'}
              {currentTool === 'wafer' && 'Click to drop substrate wafers for bottom-dwelling crabs.'}
              {currentTool === 'clean_glass' && 'Drag magnetic scrubber across the glass to scrape off algae.'}
              {currentTool === 'stir_water' && 'Click or drag to create currents; taps startle micro-fauna.'}
            </p>
          </div>

          {/* Multi-Scalar Ecosystem & Process Regimes */}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Multi-Scalar Regimes</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                {boidSim.boids.length + boidSim.fireflies.length} total
              </span>
            </div>

            {/* Regime Presets */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleApplyPreset('balanced')}
                className={`p-2 rounded-xl border text-xs text-left transition-all ${
                  boidSim.activePreset === 'balanced'
                    ? 'bg-cyan-950/80 text-cyan-200 border-cyan-600 shadow-sm'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium text-slate-100">Balanced</div>
                <div className="text-[10px] text-slate-400">Macro + Meso + Fireflies</div>
              </button>

              <button
                onClick={() => handleApplyPreset('firefly_bloom')}
                className={`p-2 rounded-xl border text-xs text-left transition-all ${
                  boidSim.activePreset === 'firefly_bloom'
                    ? 'bg-lime-950/80 text-lime-200 border-lime-500 shadow-sm'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium text-lime-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-lime-400" />
                  <span>Firefly Bloom</span>
                </div>
                <div className="text-[10px] text-slate-400">450 Synchronized Fireflies</div>
              </button>

              <button
                onClick={() => handleApplyPreset('leviathan_abyss')}
                className={`p-2 rounded-xl border text-xs text-left transition-all ${
                  boidSim.activePreset === 'leviathan_abyss'
                    ? 'bg-purple-950/80 text-purple-200 border-purple-600 shadow-sm'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium text-purple-300">Leviathan Abyss</div>
                <div className="text-[10px] text-slate-400">5 Apex Pelagic Giants</div>
              </button>

              <button
                onClick={() => handleApplyPreset('schooling_frenzy')}
                className={`p-2 rounded-xl border text-xs text-left transition-all ${
                  boidSim.activePreset === 'schooling_frenzy'
                    ? 'bg-amber-950/80 text-amber-200 border-amber-600 shadow-sm'
                    : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <div className="font-medium text-amber-300">Schooling Frenzy</div>
                <div className="text-[10px] text-slate-400">340 Agile Meso Schoolers</div>
              </button>
            </div>

            {/* Scale Sliders */}
            <div className="flex flex-col gap-2.5 pt-2">
              {/* 1. Macro Pelagic */}
              <div className="bg-slate-800/40 p-2 rounded-xl border border-purple-900/40">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-purple-300 flex items-center gap-1">
                    <span>Macro Pelagic</span>
                    <span className="text-[10px] text-slate-400 font-mono">(2.7x-3.1x)</span>
                  </span>
                  <span className="font-mono text-purple-300 font-semibold">{boidSim.macroCount} giants</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={1}
                  value={boidSim.macroCount}
                  onChange={(e) => handleMacroChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  High inertia solitary grazers; meso schools steer clear around their wake.
                </p>
              </div>

              {/* 2. Meso Schooling */}
              <div className="bg-slate-800/40 p-2 rounded-xl border border-cyan-900/40">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-cyan-300 flex items-center gap-1">
                    <span>Meso Schooling</span>
                    <span className="text-[10px] text-slate-400 font-mono">(0.85x-1.25x)</span>
                  </span>
                  <span className="font-mono text-cyan-300 font-semibold">{boidSim.mesoCount} fish</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={450}
                  step={10}
                  value={boidSim.mesoCount}
                  onChange={(e) => handleMesoChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Polarized schooling teleosts; coordinate turns and dash toward food flakes.
                </p>
              </div>

              {/* 3. Micro Fireflies & Population Cycle */}
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-lime-900/40 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-lime-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-lime-400" />
                    <span>Micro-Firefly Swarm</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-lime-300 font-semibold">{boidSim.fireflyCount} boids</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-lime-950 text-lime-300 border border-lime-800/60 font-mono">
                      {swarmTrendName}
                    </span>
                  </div>
                </div>

                {/* Firefly Separate Cycle Toggle & Period */}
                <div className="bg-slate-900/70 p-2 rounded-lg border border-lime-900/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
                      <span>Separate Swarm Tide</span>
                    </span>
                    <button
                      onClick={handleToggleFireflyCycle}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                        fireflyCycle.enabled
                          ? 'bg-lime-950 text-lime-300 border border-lime-700'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {fireflyCycle.enabled ? (
                        <>
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Tidal Bloom: ON</span>
                        </>
                      ) : (
                        <>
                          <Pause className="w-2.5 h-2.5" />
                          <span>Hold Quantity</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Tunable Period Slider */}
                  {fireflyCycle.enabled ? (
                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/70">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                          <span>Bloom Cycle Period</span>
                          <span className="text-lime-400 font-semibold">{fireflyCycle.periodSeconds}s</span>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={180}
                          step={5}
                          value={fireflyCycle.periodSeconds}
                          onChange={(e) => handleFireflyPeriodChange(parseInt(e.target.value, 10))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                        />
                      </div>

                      {/* Swarm Min & Max Tuning */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                            <span>Trough Min</span>
                            <span className="text-lime-300">{fireflyCycle.minCount}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={150}
                            step={10}
                            value={fireflyCycle.minCount}
                            onChange={(e) => handleFireflyMinChange(parseInt(e.target.value, 10))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                            <span>Peak Max</span>
                            <span className="text-lime-300">{fireflyCycle.maxCount}</span>
                          </div>
                          <input
                            type="range"
                            min={150}
                            max={500}
                            step={20}
                            value={fireflyCycle.maxCount}
                            onChange={(e) => handleFireflyMaxChange(parseInt(e.target.value, 10))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                          />
                        </div>
                      </div>

                      {/* Tide Phase scrubber */}
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                          <span>Tide Scrubber</span>
                          <span className="text-lime-400 font-semibold">{tidePercent}% Full Bloom</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.PI * 2}
                          step={0.05}
                          value={fireflyCycle.currentPhase}
                          onChange={(e) => handleFireflyPhaseChange(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Manual Firefly Count Slider when cycle paused */
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                        <span>Manual Firefly Count</span>
                        <span className="text-lime-400">{boidSim.fireflyCount} fireflies</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={500}
                        step={10}
                        value={boidSim.fireflyCount}
                        onChange={(e) => handleFireflyChange(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                      />
                    </div>
                  )}
                </div>

                {/* Kuramoto Flash Synchronization Settings */}
                {boidSim.fireflyCount > 0 && (
                  <div className="bg-slate-900/60 p-2 rounded-lg border border-lime-900/30 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-lime-200 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-lime-400" />
                        <span>Kuramoto Flash Sync</span>
                      </span>
                      <button
                        onClick={handleToggleKuramoto}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                          boidSim.kuramotoEnabled
                            ? 'bg-lime-950 text-lime-300 border border-lime-700'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {boidSim.kuramotoEnabled ? 'Synchronized' : 'Desync'}
                      </button>
                    </div>

                    {boidSim.kuramotoEnabled && (
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                          <span>Coupling Strength (K)</span>
                          <span className="text-lime-400">{boidSim.kuramotoCoupling.toFixed(1)}</span>
                        </div>
                        <input
                          type="range"
                          min={0.5}
                          max={5.0}
                          step={0.1}
                          value={boidSim.kuramotoCoupling}
                          onChange={(e) => handleCouplingChange(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-lime-400"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Gentle Tunable Circadian Day & Night Cycle */}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <CircadianIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>Day & Night Cycle</span>
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-semibold text-amber-300">{timeStr}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {circadianName}
                </span>
              </div>
            </div>

            {/* Auto-Cycle Toggle & Period Tuning */}
            <div className="bg-slate-800/40 p-2.5 rounded-xl border border-amber-900/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-300">Circadian Progression</span>
                <button
                  onClick={handleToggleDayNight}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                    dayNightEnabled
                      ? 'bg-amber-950 text-amber-300 border border-amber-700'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {dayNightEnabled ? (
                    <>
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Auto-Cycle: Active</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-2.5 h-2.5" />
                      <span>Manual Hold</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tunable Day/Night Cycle Period Slider */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                  <span>Cycle Duration</span>
                  <span className="text-amber-400 font-semibold">{dayNightPeriod}s</span>
                </div>
                <input
                  type="range"
                  min={15}
                  max={240}
                  step={5}
                  value={dayNightPeriod}
                  onChange={(e) => handleDayNightPeriodChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Time of Day Scrubber */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-0.5 font-mono">
                  <span>Time of Day Scrubber</span>
                  <span className="text-amber-300">{timeStr} ({((dayNightPhase * 100)).toFixed(0)}%)</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={dayNightPhase}
                  onChange={(e) => handleDayNightPhaseChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Quick Jump Anchors */}
              <div className="grid grid-cols-5 gap-1 pt-1 border-t border-slate-800">
                <button
                  onClick={() => onSelectLighting('daylight')}
                  className={`flex flex-col items-center py-1 rounded text-[9px] font-mono transition-all ${
                    lightingPreset === 'daylight'
                      ? 'bg-sky-950 text-sky-300 border border-sky-600'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="06:00 Dawn"
                >
                  <Sun className="w-3 h-3 text-amber-300 mb-0.5" />
                  <span>Dawn</span>
                </button>

                <button
                  onClick={() => handleDayNightPhaseChange(0.25)}
                  className={`flex flex-col items-center py-1 rounded text-[9px] font-mono transition-all ${
                    Math.abs(dayNightPhase - 0.25) < 0.08
                      ? 'bg-sky-950 text-sky-200 border border-sky-500'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="12:00 High Noon"
                >
                  <Sun className="w-3 h-3 text-sky-300 mb-0.5" />
                  <span>Noon</span>
                </button>

                <button
                  onClick={() => onSelectLighting('sunset')}
                  className={`flex flex-col items-center py-1 rounded text-[9px] font-mono transition-all ${
                    lightingPreset === 'sunset'
                      ? 'bg-orange-950 text-orange-200 border border-orange-600'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="18:00 Sunset"
                >
                  <Sunset className="w-3 h-3 text-orange-400 mb-0.5" />
                  <span>Sunset</span>
                </button>

                <button
                  onClick={() => onSelectLighting('bioluminescent')}
                  className={`flex flex-col items-center py-1 rounded text-[9px] font-mono transition-all ${
                    lightingPreset === 'bioluminescent'
                      ? 'bg-teal-950 text-teal-200 border border-teal-500'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="21:00 Twilight"
                >
                  <Sparkles className="w-3 h-3 text-teal-400 mb-0.5" />
                  <span>Twilight</span>
                </button>

                <button
                  onClick={() => onSelectLighting('midnight')}
                  className={`flex flex-col items-center py-1 rounded text-[9px] font-mono transition-all ${
                    lightingPreset === 'midnight'
                      ? 'bg-purple-950 text-purple-200 border border-purple-600'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                  title="00:00 Midnight"
                >
                  <Moon className="w-3 h-3 text-purple-400 mb-0.5" />
                  <span>Night</span>
                </button>
              </div>
            </div>

            {/* Desk Lamp Toggle */}
            <button
              onClick={onToggleDeskLamp}
              className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                deskLampOn
                  ? 'bg-amber-950/50 text-amber-200 border-amber-600/70'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lamp className={`w-4 h-4 ${deskLampOn ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Desk Reading Lamp</span>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  deskLampOn ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {deskLampOn ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* Benthic & Epibenthic Micro-Fauna */}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <span className="text-sm leading-none">🦀</span>
                <span>Benthic Micro-Fauna</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                {sceneManager ? sceneManager.microFaunaSim.entities.length : 18} Active
              </span>
            </div>

            {/* Quick Action Triggers */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  sceneManager?.dropSubstrateWafer();
                  forceUpdate();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-200 hover:bg-amber-950/70 transition-all shadow-sm"
                title="Drop sinking food wafer directly onto seabed sand for bottom crabs"
              >
                <CircleDot className="w-3.5 h-3.5 text-amber-400" />
                <span>Drop Wafer</span>
              </button>

              <button
                onClick={() => {
                  sceneManager?.startleMicroFauna();
                  forceUpdate();
                }}
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-teal-950/40 border border-teal-800/60 text-[11px] text-teal-200 hover:bg-teal-950/70 transition-all shadow-sm"
                title="Tap tank glass to trigger crab threat displays, snail retractions, and shrimp escape darts"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                <span>Tap & Startle</span>
              </button>
            </div>

            {/* Micro-Fauna Sliders */}
            <div className="bg-slate-800/40 p-2.5 rounded-xl border border-teal-900/30 flex flex-col gap-2.5">
              {/* Crabs */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <span>🦀</span>
                    <span>Crabs (Hermit & Shore)</span>
                  </span>
                  <span className="text-teal-400">{sceneManager?.microFaunaSim.config.crabs ?? 4}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={sceneManager?.microFaunaSim.config.crabs ?? 4}
                  onChange={(e) => handleMicroCrabChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <p className="text-[10px] text-slate-400 italic mt-0.5">
                  Tripod gait scuttle, forage sand dunes, defensive claw displays, and snatch sunken food.
                </p>
              </div>

              {/* Snails */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <span>🐌</span>
                    <span>Snails (Nerite & Mystery)</span>
                  </span>
                  <span className="text-teal-400">{sceneManager?.microFaunaSim.config.snails ?? 4}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={sceneManager?.microFaunaSim.config.snails ?? 4}
                  onChange={(e) => handleMicroSnailChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <p className="text-[10px] text-slate-400 italic mt-0.5">
                  Glide across glass and sand, actively grazing algae trails with rasping radulas.
                </p>
              </div>

              {/* Crystal Ghost Shrimp */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <span>🦐</span>
                    <span>Crystal Ghost Shrimp</span>
                  </span>
                  <span className="text-cyan-400">{sceneManager?.microFaunaSim.config.shrimp ?? 6}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={12}
                  step={1}
                  value={sceneManager?.microFaunaSim.config.shrimp ?? 6}
                  onChange={(e) => handleMicroShrimpChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-slate-400 italic mt-0.5">
                  Glass translucent body, fluttering swimmerets, perching on reef, and backward caridoid escape dart reflex.
                </p>
              </div>

              {/* Hydromedusae */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-mono">
                  <span className="flex items-center gap-1">
                    <span>🪼</span>
                    <span>Hydromedusae (Micro-Jellyfish)</span>
                  </span>
                  <span className="text-cyan-300">{sceneManager?.microFaunaSim.config.medusae ?? 4}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={sceneManager?.microFaunaSim.config.medusae ?? 4}
                  onChange={(e) => handleMicroMedusaChange(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-300"
                />
                <p className="text-[10px] text-slate-400 italic mt-0.5">
                  Rhythmic umbrella contractions, cyan bioluminescent core, and hydrodynamic trailing tentacles.
                </p>
              </div>
            </div>
          </div>

          {/* Micro-Flora on Tank Glass */}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Glass Micro-Flora
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                {floraSim.coverage}% Algae
              </span>
            </div>

            {/* Coverage bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                style={{ width: `${Math.min(100, floraSim.coverage)}%` }}
              />
            </div>

            {/* Auto Cleaning Snails & Reset */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => {
                  floraSim.isAutoCleaning = !floraSim.isAutoCleaning;
                  forceUpdate();
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg border text-[11px] transition-all ${
                  floraSim.isAutoCleaning
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                Auto-Clean Snails: {floraSim.isAutoCleaning ? 'Active' : 'Off'}
              </button>

              <button
                onClick={() => {
                  floraSim.clearAll();
                  forceUpdate();
                }}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-[11px] text-slate-300 hover:bg-slate-800 hover:text-white"
                title="Wipe Glass Completely Clean"
              >
                Wipe Clean
              </button>
            </div>
          </div>

          {/* Screen Space Displacement (SSD Optics) */}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-teal-400" />
                Screen Space Displacement
              </span>
              <button
                id="btn-toggle-ssd"
                onClick={() => {
                  if (sceneManager?.ssdPass) {
                    sceneManager.ssdPass.config.enabled = !sceneManager.ssdPass.config.enabled;
                    forceUpdate();
                  }
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  sceneManager?.ssdPass?.config.enabled
                    ? 'bg-teal-950/80 text-teal-300 border-teal-700/60'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                {sceneManager?.ssdPass?.config.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {sceneManager?.ssdPass && (
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-teal-900/30 flex flex-col gap-2.5">
                {/* Displacement Strength Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-mono">
                    <span>Displacement Strength</span>
                    <span className="text-teal-400">
                      {sceneManager.ssdPass.config.displacementStrength.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    id="slider-ssd-strength"
                    type="range"
                    min={0.0}
                    max={2.5}
                    step={0.05}
                    value={sceneManager.ssdPass.config.displacementStrength}
                    onChange={(e) => {
                      sceneManager.ssdPass.config.displacementStrength = parseFloat(e.target.value);
                      forceUpdate();
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <p className="text-[10px] text-slate-400 italic mt-0.5">
                    Screen-space refractive distortion through water fluid and glass boundary meniscus.
                  </p>
                </div>

                {/* Chromatic Aberration Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-mono">
                    <span>Spectral Dispersion (CA)</span>
                    <span className="text-cyan-400">
                      {sceneManager.ssdPass.config.chromaticAberration.toFixed(2)}x
                    </span>
                  </div>
                  <input
                    id="slider-ssd-chromatic"
                    type="range"
                    min={0.0}
                    max={2.0}
                    step={0.05}
                    value={sceneManager.ssdPass.config.chromaticAberration}
                    onChange={(e) => {
                      sceneManager.ssdPass.config.chromaticAberration = parseFloat(e.target.value);
                      forceUpdate();
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                  <p className="text-[10px] text-slate-400 italic mt-0.5">
                    Wavelength-dependent light prism split at fluid deflection boundaries.
                  </p>
                </div>

                {/* Wave Ripple Frequency & Speed */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-300 mb-0.5 font-mono">
                      <span>Ripple Freq</span>
                      <span className="text-teal-300">
                        {sceneManager.ssdPass.config.waveFrequency.toFixed(1)}
                      </span>
                    </div>
                    <input
                      id="slider-ssd-frequency"
                      type="range"
                      min={0.2}
                      max={3.0}
                      step={0.1}
                      value={sceneManager.ssdPass.config.waveFrequency}
                      onChange={(e) => {
                        sceneManager.ssdPass.config.waveFrequency = parseFloat(e.target.value);
                        forceUpdate();
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-300 mb-0.5 font-mono">
                      <span>Wave Speed</span>
                      <span className="text-teal-300">
                        {sceneManager.ssdPass.config.waveSpeed.toFixed(1)}
                      </span>
                    </div>
                    <input
                      id="slider-ssd-speed"
                      type="range"
                      min={0.2}
                      max={3.0}
                      step={0.1}
                      value={sceneManager.ssdPass.config.waveSpeed}
                      onChange={(e) => {
                        sceneManager.ssdPass.config.waveSpeed = parseFloat(e.target.value);
                        forceUpdate();
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                    />
                  </div>
                </div>

                {/* Toggles & Presets */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    id="btn-ssd-wake-toggle"
                    onClick={() => {
                      sceneManager.ssdPass.config.wakeInfluence = !sceneManager.ssdPass.config.wakeInfluence;
                      forceUpdate();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-mono transition-all ${
                      sceneManager.ssdPass.config.wakeInfluence
                        ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700'
                    }`}
                  >
                    Fish Wakes: {sceneManager.ssdPass.config.wakeInfluence ? 'On' : 'Off'}
                  </button>

                  <button
                    id="btn-ssd-debug-toggle"
                    onClick={() => {
                      sceneManager.ssdPass.config.debugMode = !sceneManager.ssdPass.config.debugMode;
                      forceUpdate();
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-mono transition-all ${
                      sceneManager.ssdPass.config.debugMode
                        ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700'
                    }`}
                  >
                    Vector Field: {sceneManager.ssdPass.config.debugMode ? 'Visible' : 'Off'}
                  </button>
                </div>

                {/* Quick Optics Presets */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    onClick={() => {
                      sceneManager.ssdPass.config.displacementStrength = 0.35;
                      sceneManager.ssdPass.config.chromaticAberration = 0.25;
                      sceneManager.ssdPass.config.waveFrequency = 0.7;
                      sceneManager.ssdPass.config.waveSpeed = 0.6;
                      forceUpdate();
                    }}
                    className="flex-1 py-1 rounded bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 text-[10px] text-slate-300 font-mono transition-colors"
                  >
                    Still
                  </button>
                  <button
                    onClick={() => {
                      sceneManager.ssdPass.config.displacementStrength = 0.85;
                      sceneManager.ssdPass.config.chromaticAberration = 0.65;
                      sceneManager.ssdPass.config.waveFrequency = 1.0;
                      sceneManager.ssdPass.config.waveSpeed = 1.0;
                      forceUpdate();
                    }}
                    className="flex-1 py-1 rounded bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 text-[10px] text-slate-300 font-mono transition-colors"
                  >
                    Natural
                  </button>
                  <button
                    onClick={() => {
                      sceneManager.ssdPass.config.displacementStrength = 1.55;
                      sceneManager.ssdPass.config.chromaticAberration = 1.15;
                      sceneManager.ssdPass.config.waveFrequency = 1.4;
                      sceneManager.ssdPass.config.waveSpeed = 1.3;
                      forceUpdate();
                    }}
                    className="flex-1 py-1 rounded bg-slate-800/70 hover:bg-slate-800 border border-slate-700/70 text-[10px] text-slate-300 font-mono transition-colors"
                  >
                    Currents
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4D Multi-Scalar Species Field Guide */}
          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Species & Ecosystem Field Guide ({SPECIES_CONFIGS.length + 4})
            </span>
            <div className="flex flex-col gap-1.5">
              {SPECIES_CONFIGS.map((sp, idx) => {
                const rgbBody = `rgb(${Math.round(sp.bodyColor[0] * 255)}, ${Math.round(
                  sp.bodyColor[1] * 255
                )}, ${Math.round(sp.bodyColor[2] * 255)})`;
                const rgbBio = `rgb(${Math.round(sp.bioluminescentColor[0] * 255)}, ${Math.round(
                  sp.bioluminescentColor[1] * 255
                )}, ${Math.round(sp.bioluminescentColor[2] * 255)})`;
                const isMacro = sp.regime === 'macro_pelagic';

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-1 p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-sm"
                          style={{
                            backgroundColor: rgbBody,
                            boxShadow: `0 0 8px ${rgbBio}`,
                          }}
                        />
                        <span className="text-slate-200 font-medium">{sp.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isMacro
                            ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                            : 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        }`}
                      >
                        {isMacro ? 'Macro 2.7x' : 'Meso'}
                      </span>
                    </div>
                    {sp.description && (
                      <p className="text-[10px] text-slate-400 italic pl-5">{sp.description}</p>
                    )}
                  </div>
                );
              })}

              {/* Micro Firefly Entry in Guide */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-800/40 border border-lime-900/50 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-lime-400 shadow-[0_0_8px_#84cc16] bg-lime-400"
                    />
                    <span className="text-slate-200 font-medium">Micro-Firefly Ostracods</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-lime-950 text-lime-300 border border-lime-800/60">
                    Micro 0.18x
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic pl-5">
                  Bioluminescent swarms synchronizing flashes with Kuramoto phase coupling and scattering from fish wakes.
                </p>
              </div>

              {/* Hermit & Shore Crabs */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-800/40 border border-teal-900/50 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border border-orange-500 shadow-[0_0_8px_#f97316] bg-orange-500" />
                    <span className="text-slate-200 font-medium">Scarlet Hermit & Shore Crabs</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                    Benthic 0.42x
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic pl-5">
                  Smooth-sculpted carapaces with gastric lobes and logarithmic spiral conch shells, 3-segment articulated walking legs (merus, carpus, dactylus), serrated clamping chelae, and exploratory antennules.
                </p>
              </div>

              {/* Nerite & Mystery Snails */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-800/40 border border-teal-900/50 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border border-amber-500 shadow-[0_0_8px_#f59e0b] bg-amber-600" />
                    <span className="text-slate-200 font-medium">Zebra Nerite & Mystery Snails</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800/60">
                    Benthic 0.35x
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic pl-5">
                  Helicospiral shells with smooth-min suture blending and flared aperture lips, crawling on cohesive muscular soles with peristaltic locomotion waves, dorsal operculum plates, and tactile ommatophore tentacles.
                </p>
              </div>

              {/* Bioluminescent Hydromedusae */}
              <div className="flex flex-col gap-1 p-2 rounded-xl bg-slate-800/40 border border-cyan-900/50 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full border border-cyan-300 shadow-[0_0_8px_#38bdf8] bg-cyan-400/80" />
                    <span className="text-slate-200 font-medium">Bioluminescent Hydromedusae</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    Pelagic 0.32x
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 italic pl-5">
                  Delicate translucent hydrozoan umbrella bell with dynamic peristaltic contraction, radial canals, internal glowing manubrium, marginal rhopalia beads, and gracefully trailing fluid tentacles.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
