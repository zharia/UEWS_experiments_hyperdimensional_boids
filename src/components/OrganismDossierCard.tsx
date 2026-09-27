/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Activity,
  Compass,
  Eye,
  FastForward,
  Fish,
  Layers,
  Sparkles,
  Video,
  Volume2,
  Waves,
  X,
  Zap,
} from 'lucide-react';
import { InspectedOrganism } from '../types';
import { AquariumSceneManager } from '../rendering/aquariumScene';

interface OrganismDossierCardProps {
  organism: InspectedOrganism | null;
  onClose: () => void;
  isTrackingCamera: boolean;
  onToggleTrackingCamera: () => void;
  sceneManager: AquariumSceneManager | null;
}

export const OrganismDossierCard: React.FC<OrganismDossierCardProps> = ({
  organism,
  onClose,
  isTrackingCamera,
  onToggleTrackingCamera,
  sceneManager,
}) => {
  if (!organism) return null;

  const handleFeedNearby = () => {
    if (!sceneManager) return;
    if (organism.type === 'boid') {
      sceneManager.boidSim.addFood(organism.x, organism.y + 0.8, organism.z);
    } else {
      sceneManager.microFaunaSim.dropSubstrateWafer(organism.x, organism.z);
    }
  };

  const handleStartle = () => {
    if (!sceneManager) return;
    sceneManager.stirWaterAtScreen(window.innerWidth / 2, window.innerHeight / 2);
  };

  return (
    <div
      role="region"
      aria-label="Inspected Organism Dossier"
      className="absolute bottom-24 left-4 z-20 w-80 sm:w-88 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl text-slate-200 pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {/* Header bar */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-inner"
            style={{
              backgroundColor: organism.colorHex ? `${organism.colorHex}22` : '#38bdf822',
              borderColor: organism.colorHex ? `${organism.colorHex}66` : '#38bdf866',
              borderWidth: 1,
            }}
          >
            {organism.type === 'boid' ? (
              <Fish className="w-4 h-4 text-cyan-400" />
            ) : (
              <span className="text-base leading-none">🦀</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-white tracking-wide font-['Space_Grotesk']">
                {organism.name}
              </h3>
              <span
                className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded border"
                style={{
                  color: organism.colorHex || '#38bdf8',
                  borderColor: `${organism.colorHex || '#38bdf8'}40`,
                  backgroundColor: `${organism.colorHex || '#38bdf8'}15`,
                }}
              >
                {organism.category}
              </span>
            </div>
            <p className="text-[11px] italic text-slate-400 font-serif">
              {organism.scientificName}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          title="Close Dossier (Esc)"
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Real-time telemetry metrics */}
      <div className="grid grid-cols-2 gap-2 my-3 text-xs font-mono">
        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Compass className="w-3 h-3 text-cyan-400" />
            <span>Position 3D</span>
          </div>
          <span className="text-slate-200">
            {organism.x.toFixed(1)}, {organism.y.toFixed(1)}, {organism.z.toFixed(1)}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <FastForward className="w-3 h-3 text-emerald-400" />
            <span>Kinetic Velocity</span>
          </div>
          <span className="text-slate-200">{organism.speed.toFixed(2)} u/s</span>
        </div>

        {organism.w !== undefined && (
          <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>4D Time Phase</span>
            </div>
            <span className="text-amber-300">&tau; = {organism.w.toFixed(1)}</span>
          </div>
        )}

        <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Activity className="w-3 h-3 text-purple-400" />
            <span>Behavior State</span>
          </div>
          <span className="text-purple-300 truncate" title={organism.state}>
            {organism.state}
          </span>
        </div>
      </div>

      {/* Vitality / Energy bar */}
      <div className="mb-3 bg-slate-950/40 p-2 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span>Vital Satiation</span>
          <span className="text-emerald-400 font-bold">{organism.energy}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
            style={{ width: `${organism.energy}%` }}
          />
        </div>
      </div>

      {/* Acoustic & Lateral Line Senses */}
      {organism.perceivedAcousticDb !== undefined && (
        <div className="mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/90 text-xs font-mono">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <div className="flex items-center gap-1.5">
              <Volume2 className="w-3 h-3 text-cyan-400" />
              <span>Acoustic Reception</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                organism.isAcousticallyStartled
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-slate-800 text-cyan-300'
              }`}
            >
              {organism.perceivedAcousticDb} dB
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Waves className="w-3 h-3 text-teal-400 shrink-0" />
            <span className="truncate" title={organism.acousticSensorySummary}>
              {organism.acousticSensorySummary || 'Laminar acoustic equilibrium'}
            </span>
          </div>
        </div>
      )}

      {/* Morphological Signature & Posture Dynamics (Task 005) */}
      {organism.morphology && (
        <div className="mb-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/90 text-xs font-mono">
          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-teal-400" />
              <span>Morphological Signature & Posture</span>
            </div>
            <span className="text-[9px] text-teal-300 font-semibold">
              Aspect {organism.morphology.aspect}x
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-300 mb-1.5">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-500">Depth / Taper:</span>
              <span className="text-slate-200">{organism.morphology.bodyDepth}x / {organism.morphology.taper}</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-500">Asymmetry:</span>
              <span className={organism.morphology.asymmetryBias >= 0 ? 'text-sky-300' : 'text-purple-300'}>
                {organism.morphology.asymmetryBias >= 0 ? `+${organism.morphology.asymmetryBias}` : organism.morphology.asymmetryBias}
              </span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-500">Flex / Tension:</span>
              <span className="text-teal-300">{organism.morphology.flexibility}x / {(organism.morphology.propulsionTension * 100).toFixed(0)}%</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-500">Axial Compress:</span>
              <span className={organism.morphology.compression > 0 ? 'text-amber-300' : 'text-emerald-300'}>
                {(organism.morphology.compression * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Body Spine Curvature:</span>
            <span className="text-amber-300 font-semibold">
              {organism.morphology.curvature > 0.05
                ? `Bend Right ${(organism.morphology.curvature * 100).toFixed(0)}%`
                : organism.morphology.curvature < -0.05
                ? `Bend Left ${(Math.abs(organism.morphology.curvature) * 100).toFixed(0)}%`
                : 'Relaxed Cruising'}
            </span>
          </div>
        </div>
      )}

      {/* Interactive controls */}
      <div className="flex items-center gap-1.5 pt-1">
        <button
          onClick={onToggleTrackingCamera}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
            isTrackingCamera
              ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title={isTrackingCamera ? 'Disable follow-camera' : 'Lock camera to follow this organism'}
        >
          <Video className="w-3.5 h-3.5" />
          <span>{isTrackingCamera ? 'Following' : 'Follow Cam'}</span>
        </button>

        <button
          onClick={handleFeedNearby}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-medium bg-amber-950/70 hover:bg-amber-900/90 text-amber-300 border border-amber-700/60 shadow-sm transition-all cursor-pointer"
          title="Drop nutrition pellet near this creature"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Target Feed</span>
        </button>

        <button
          onClick={handleStartle}
          className="flex items-center justify-center p-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          title="Tap glass to elicit startle reflex"
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>
    </div>
  );
};
