/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  Clock,
  Cpu,
  Eye,
  Fish,
  Moon,
  Sparkles,
  Sprout,
  Sun,
  Sunset,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react';
import { SimulationStats } from '../types';
import { aquariumAudio } from '../audio/aquariumAudio';

interface DeskHeaderProps {
  stats: SimulationStats;
  currentPhase?: string;
  onOpenBenchmark?: () => void;
  onOpenBotanical?: () => void;
  onOpenEcology?: () => void;
}

export const DeskHeader: React.FC<DeskHeaderProps> = ({
  stats,
  currentPhase = 'COLONISATION',
  onOpenBenchmark,
  onOpenBotanical,
  onOpenEcology,
}) => {
  const [isMuted, setIsMuted] = useState(aquariumAudio.getIsMuted());

  const handleToggleSound = () => {
    const nextMuted = aquariumAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  // Circadian Time of Day formatting (Phase 0.0 = 06:00 Dawn, 0.25 = 12:00 Noon)
  const totalMinutes = Math.floor((((stats.dayNightPhase ?? 0.25) * 24 + 6) % 24) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  let circadianLabel = 'Daylight';
  let CircadianIcon = Sun;
  let circadianBadgeColor = 'text-amber-300 border-amber-800/50 bg-amber-950/50';

  if (hours >= 5 && hours < 9) {
    circadianLabel = 'Dawn';
    CircadianIcon = Sun;
    circadianBadgeColor = 'text-amber-300 border-amber-800/50 bg-amber-950/50';
  } else if (hours >= 9 && hours < 17) {
    circadianLabel = 'Midday';
    CircadianIcon = Sun;
    circadianBadgeColor = 'text-sky-300 border-sky-800/50 bg-sky-950/50';
  } else if (hours >= 17 && hours < 20) {
    circadianLabel = 'Sunset';
    CircadianIcon = Sunset;
    circadianBadgeColor = 'text-orange-300 border-orange-800/50 bg-orange-950/50';
  } else if (hours >= 20 && hours < 23) {
    circadianLabel = 'Twilight';
    CircadianIcon = Sparkles;
    circadianBadgeColor = 'text-teal-300 border-teal-800/50 bg-teal-950/50';
  } else {
    circadianLabel = 'Midnight';
    CircadianIcon = Moon;
    circadianBadgeColor = 'text-purple-300 border-purple-800/50 bg-purple-950/50';
  }

  // Firefly Swarm Tide State
  const fireflyPhase = stats.fireflyCyclePhase ?? 0;
  const sinPhase = Math.sin(fireflyPhase);
  const cosPhase = Math.cos(fireflyPhase);
  let swarmTrend = 'Waxing ↗';
  if (cosPhase < -0.8) {
    swarmTrend = 'Peak Bloom ✨';
  } else if (cosPhase > 0.8) {
    swarmTrend = 'Trough 🌙';
  } else if (sinPhase > 0) {
    swarmTrend = 'Waxing ↗';
  } else {
    swarmTrend = 'Waning ↘';
  }
  return (
    <header className="absolute top-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
      {/* Brand & Concept */}
      <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-700/60 shadow-lg pointer-events-auto">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-teal-400 flex items-center justify-center shadow-inner">
          <Fish className="w-5 h-5 text-slate-950 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-wide text-slate-100 font-['Space_Grotesk']">
              Chronos Aquarium
            </h1>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
              4D Boids
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-['Plus_Jakarta_Sans']">
            2.5D Desk Environment &bull; GPU Light Scattering &bull; Glass Flora
          </p>
        </div>
      </div>

      {/* Telemetry HUD Badges */}
      <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
        {/* FPS & Performance Diagnostics trigger */}
        <button
          onClick={onOpenBenchmark}
          title="Open Performance Benchmarking & Hitch Diagnostics (Hotkey: B)"
          className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-500/50 text-xs font-mono text-emerald-400 transition-all cursor-pointer group shadow-sm"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>{stats.fps} FPS</span>
          <span className="text-[10px] text-cyan-400 opacity-60 group-hover:opacity-100 hidden sm:inline">⚡ Perf</span>
        </button>

        {/* Circadian Day/Night Diurnal Clock */}
        <div
          className={`flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1.5 rounded-lg border text-xs font-mono shadow-sm ${circadianBadgeColor}`}
          title={`Circadian Diurnal Phase: ${((stats.dayNightPhase ?? 0.25) * 100).toFixed(0)}% (Cycle period: ${stats.dayNightPeriod ?? 60}s, ${stats.dayNightEnabled ? 'Auto-cycling' : 'Manual'})`}
        >
          <CircadianIcon className="w-3.5 h-3.5" />
          <span>{timeStr}</span>
          <span className="text-[10px] opacity-75">{circadianLabel}</span>
        </div>

        {/* 4D Temporal Coordinate */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-800/60 text-xs font-mono text-cyan-300 shadow-sm">
          <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>T = {stats.currentTimeW.toFixed(1)} &tau;</span>
        </div>

        {/* Firefly Swarm Tide */}
        {stats.microCount > 0 && (
          <div
            className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-lime-800/60 text-xs font-mono text-lime-300 shadow-sm"
            title={`Separate Firefly Population Cycle: ${stats.microCount} fireflies (Range: ${stats.fireflyMinCount}-${stats.fireflyMaxCount}, Period: ${stats.fireflyCyclePeriod}s)`}
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <span className="text-lime-200">{stats.microCount}</span>
            <span className="text-[10px] text-lime-400/90">{swarmTrend}</span>
          </div>
        )}

        {/* Benthic Micro-Fauna Badge */}
        {stats.totalMicroFauna > 0 && (
          <div
            className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-teal-800/60 text-xs font-mono text-teal-300 shadow-sm"
            title={`Micro-Fauna: ${stats.crabCount} Crabs, ${stats.snailCount} Snails, ${stats.shrimpCount} Ghost Shrimp, ${stats.medusaCount} Hydromedusae`}
          >
            <span className="text-sm leading-none">🦀</span>
            <span className="text-teal-200">{stats.totalMicroFauna}</span>
            <span className="text-[10px] text-teal-400/90 hidden xl:inline">Benthic</span>
          </div>
        )}

        {/* Population & Visibility */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {stats.visibleBoids} <span className="text-slate-500">/ {stats.totalBoids}</span>
          </span>
          <span className="text-[10px] text-slate-400 ml-0.5">visible</span>
        </div>

        {/* Multi-Scalar Breakdown */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono">
          <span className="text-purple-300" title="Macro Pelagic Leviathans (Scale 2.7x-3.1x)">
            {stats.macroCount} Macro
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-cyan-300" title="Meso Schooling Teleosts (Scale 0.85x-1.25x)">
            {stats.mesoCount} Meso
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-lime-300" title="Micro-Firefly Bioluminescent Plankton (Scale 0.12x-0.24x)">
            {stats.microCount} Fireflies
          </span>
        </div>

        {/* Kuramoto Flash Coherence */}
        {stats.microCount > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-lime-800/50 text-[11px] font-mono text-lime-300 shadow-sm" title="Kuramoto oscillator flash phase coherence parameter">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-ping inline-block" />
            <span>Sync: {Math.round(stats.kuramotoSync * 100)}%</span>
          </div>
        )}

        {/* Ecology Intelligence Inspector Modal Trigger */}
        {onOpenEcology && (
          <button
            id="btn-header-ecology"
            onClick={onOpenEcology}
            title="Inspect Artificial Ecology, Drives, Memory, Antics, and Ecological Epochs"
            className="flex items-center gap-1.5 bg-teal-950/80 hover:bg-teal-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-teal-700/60 text-xs font-mono text-teal-300 transition-all cursor-pointer shadow-sm group"
          >
            <Brain className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
            <span>Ecology: {currentPhase}</span>
          </button>
        )}

        {/* Botanical Plant Morphology & Lifecycle Modal Trigger */}
        {onOpenBotanical && (
          <button
            id="btn-header-botanical"
            onClick={onOpenBotanical}
            title="Inspect Botanical Morphology, Splats, and Lifecycle Growth/Senescence Simulation"
            className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-emerald-700/60 text-xs font-mono text-emerald-300 transition-all cursor-pointer shadow-sm group"
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Botanical Flora</span>
          </button>
        )}

        {/* GPU Acceleration Tag */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400">
          <Cpu className="w-3 h-3 text-cyan-400" />
          <span>GPU Shaders</span>
        </div>

        {/* Screen Space Displacement (SSD) Refraction Badge */}
        <div
          className="hidden md:flex items-center gap-1 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-teal-800/60 text-[11px] font-mono text-teal-300"
          title="Screen Space Displacement: Real-time fluid refraction, boid school wakes, and chromatic dispersion optics active"
        >
          <Waves className="w-3 h-3 text-teal-400" />
          <span>SSD Refraction</span>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={handleToggleSound}
          title={isMuted ? 'Turn on relaxing aquarium ambient audio' : 'Mute aquarium audio'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
            !isMuted
              ? 'bg-cyan-950/90 text-cyan-300 border-cyan-700 shadow-sm hover:bg-cyan-900'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
          }`}
        >
          {!isMuted ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span>Audio Muted</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
