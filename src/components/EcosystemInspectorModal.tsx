/**
 * Ecosystem Inspector & Telemetry HUD.
 *
 * Provides real-time visibility into the underlying multi-scalar artificial ecology:
 *  - Ecological Phase & State Transitions
 *  - Multi-scalar Simulation Clock Controls
 *  - Populations, Demographics & Habitat Niche Allocations
 *  - Authoritative Causal Ecological Event Ledger with historical trace
 *  - Active Episodic Antics & Manifested Antic Scenes
 *  - Deep Agent Inspector (Drives, Episodic Memory, Social Relationships, Selected Behaviour, Lifecycle)
 *  - Environmental Field Summary (Nutrients, Temperature, Oxygen, Illumination)
 *  - Versioned World State Persistence (v0.2 Save/Load/Reset with idle-time simulation)
 */

import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  FastForward,
  Save,
  RotateCcw,
  Upload,
  Brain,
  Layers,
  Sparkles,
  Compass,
  Heart,
  Eye,
  Shield,
  Zap,
  Activity,
  ChevronRight,
  Database,
  Users,
  ScrollText,
  GitBranch,
  MapPin,
  Radio,
  Volume2,
  Waves,
} from 'lucide-react';
import { EcologySimulation } from '../simulation/EcologySimulation';
import { EcologicalAgent } from '../agents/agent/EcologicalAgent';
import { EcologicalPhaseType } from '../phases/phase/EcologicalPhase';
import { generateMorphologicalSignature } from '../morphology/MorphologicalSignature';

interface EcosystemInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  ecologySim: EcologySimulation;
}

export const EcosystemInspectorModal: React.FC<EcosystemInspectorModalProps> = ({
  isOpen,
  onClose,
  ecologySim,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'populations' | 'history' | 'antics' | 'agents' | 'fields' | 'persistence' | 'acoustic'>('overview');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(ecologySim.agents[0]?.id || '');
  const [persistenceFeedback, setPersistenceFeedback] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  if (!isOpen) return null;

  const telemetry = ecologySim.getTelemetry();
  const selectedAgent = ecologySim.agents.find((a) => a.id === selectedAgentId) || ecologySim.agents[0];
  const allEvents = ecologySim.eventLedger.getAllEvents().slice(-50).reverse();
  const causalChain = selectedEventId ? ecologySim.eventLedger.traceCausalChain(selectedEventId) : [];

  const handleSave = async () => {
    const success = await ecologySim.save();
    setPersistenceFeedback(success ? 'World state saved successfully (v0.2 with Populations, Habitats, & Ledger)!' : 'Failed to save world state.');
    setTimeout(() => setPersistenceFeedback(''), 3500);
  };

  const handleLoad = async () => {
    const success = await ecologySim.load();
    setPersistenceFeedback(success ? 'World state restored successfully (v0.2)!' : 'No saved world found.');
    setTimeout(() => setPersistenceFeedback(''), 3500);
  };

  const handleReset = () => {
    ecologySim.initializeDefaultPopulation();
    ecologySim.phaseEngine.currentPhase = 'COLONISATION';
    ecologySim.clock.simulationTime = 0;
    setPersistenceFeedback('Ecosystem re-seeded to initial colonisation state.');
    setTimeout(() => setPersistenceFeedback(''), 3500);
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'GENESIS': return 'bg-slate-800 text-slate-300 border-slate-700';
      case 'COLONISATION': return 'bg-sky-950 text-sky-300 border-sky-800';
      case 'ESTABLISHMENT': return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'DIVERSIFICATION': return 'bg-teal-950 text-teal-300 border-teal-800';
      case 'EQUILIBRIUM': return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'PERTURBATION': return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'COLLAPSE': return 'bg-rose-950 text-rose-300 border-rose-800';
      case 'REGENERATION': return 'bg-lime-950 text-lime-300 border-lime-800';
      default: return 'bg-cyan-950 text-cyan-300 border-cyan-800';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="flex flex-col w-full max-w-5xl h-[88vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-900/50 border border-teal-700/50 text-teal-300">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-wide text-white">Ecosystem Dynamics & Causal Ledger</h2>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-medium rounded-full border ${getPhaseColor(telemetry.currentPhase)}`}>
                  {telemetry.currentPhase}
                </span>
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-400">
                  Observer: {telemetry.observerState}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Sim Time: {telemetry.simulationTime.toFixed(1)}s (Epoch duration: {telemetry.phaseDurationSeconds.toFixed(1)}s) | {telemetry.agentCount} Organisms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Simulation Clock Quick Controls */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-lg border border-slate-700/60">
              <button
                onClick={() => { ecologySim.clock.isPaused = !ecologySim.clock.isPaused; }}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 transition-colors"
                title={ecologySim.clock.isPaused ? "Resume Clock" : "Pause Clock"}
              >
                {ecologySim.clock.isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
              </button>
              {[1.0, 2.0, 5.0].map((scale) => (
                <button
                  key={scale}
                  onClick={() => { ecologySim.clock.timeScale = scale; }}
                  className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                    ecologySim.clock.timeScale === scale
                      ? 'bg-teal-700 text-white font-semibold'
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {scale}x
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 border-b border-slate-800 bg-slate-900/50 overflow-x-auto">
          {[
            { id: 'overview', label: 'Ecology Overview', icon: Layers },
            { id: 'populations', label: `Populations & Habitats`, icon: Users },
            { id: 'history', label: `Causal Ledger (${allEvents.length})`, icon: ScrollText },
            { id: 'antics', label: `Antics & Scenes (${telemetry.activeAntics.length})`, icon: Sparkles },
            { id: 'agents', label: `Agent Cognition (${ecologySim.agents.length})`, icon: Brain },
            { id: 'fields', label: 'Environmental Fields', icon: Compass },
            { id: 'acoustic', label: 'Acoustic Soundscape', icon: Volume2 },
            { id: 'persistence', label: 'World Persistence', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-teal-400 text-teal-300 bg-teal-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Macro Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Biodiversity Index</div>
                  <div className="text-2xl font-mono font-bold text-teal-300 mt-1">
                    {telemetry.biodiversityIndex.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">Shannon entropy</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Total Biomass</div>
                  <div className="text-2xl font-mono font-bold text-emerald-300 mt-1">
                    {telemetry.totalBiomass.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">{telemetry.agentCount} autonomous agents</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Average Energy</div>
                  <div className="text-2xl font-mono font-bold text-amber-300 mt-1">
                    {telemetry.averageEnergy.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">Metabolic capacity</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-xs text-slate-400 font-medium">Demographics</div>
                  <div className="text-sm font-mono font-semibold text-sky-300 mt-2">
                    J: {telemetry.demographics?.juvenileCount || 0} | M: {telemetry.demographics?.matureCount || 0} | S: {telemetry.demographics?.senescentCount || 0}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Births: {telemetry.demographics?.birthCount || 0}
                  </div>
                </div>
              </div>

              {/* Ecological Phase Epoch Details */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Ecological Epoch & Succession Transitions
                  </h3>
                  <span className={`px-2 py-0.5 text-xs font-mono rounded ${getPhaseColor(telemetry.currentPhase)}`}>
                    Active: {telemetry.currentPhase}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The artificial ecology progresses through state-driven non-linear epochs: Genesis, Colonisation, Establishment, Diversification, Perturbation, Succession, Equilibrium, Collapse, and Regeneration. Transitions depend on multi-scalar world state indicators rather than scripted clocks.
                </p>

                {/* Transition History */}
                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <div className="text-xs font-mono text-slate-400 mb-2">Recent Epoch Transitions:</div>
                  {ecologySim.phaseEngine.transitionHistory.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No transitions yet. Current epoch entered at T=0.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {ecologySim.phaseEngine.transitionHistory.map((rec, i) => (
                        <div key={i} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-teal-400">T+{rec.timestamp.toFixed(1)}s: {rec.fromPhase} → {rec.toPhase}</span>
                          <span className="text-slate-400">{rec.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Habitats Summary */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Spatial Habitat Occupancy & Partitioning
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {ecologySim.habitats.getAllHabitats().map((h) => (
                    <div key={h.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-teal-300">{h.name}</span>
                        <span className="text-xs font-mono text-slate-400">{h.occupantCount}/{h.capacity}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Zone: {h.type}</div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, (h.occupantCount / Math.max(1, h.capacity)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'populations' && (
            <div className="space-y-6">
              {/* Demographics Overview */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Ecology Demographics & Cohort Lifecycles
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Births / Neonates</div>
                    <div className="text-xl font-mono text-pink-400 font-bold">{telemetry.demographics?.birthCount || 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Juveniles</div>
                    <div className="text-xl font-mono text-amber-400 font-bold">{telemetry.demographics?.juvenileCount || 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Mature Adults</div>
                    <div className="text-xl font-mono text-emerald-400 font-bold">{telemetry.demographics?.matureCount || 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Senescent Elders</div>
                    <div className="text-xl font-mono text-purple-400 font-bold">{telemetry.demographics?.senescentCount || 0}</div>
                  </div>
                </div>
              </div>

              {/* Species Carrying Capacities & Rates */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Species Populations, Carrying Capacity, & Biomass
                </h3>
                <div className="space-y-3">
                  {ecologySim.populations.getAllPopulations().map((pop) => {
                    const ratio = pop.carryingCapacity > 0 ? (pop.count / pop.carryingCapacity) : 0;
                    return (
                      <div key={pop.species} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-semibold text-teal-300">{pop.species}</span>
                          <span className="text-slate-400">
                            Count: {pop.count} | Cap: {pop.carryingCapacity} | Biomass: {pop.totalBiomass.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${ratio > 0.8 ? 'bg-amber-500' : 'bg-teal-500'}`}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                          <span>Births: {pop.birthsTotal} (Rate: {(pop.birthRate * 60).toFixed(1)}/min)</span>
                          <span>Deaths: {pop.deathsTotal} (Rate: {(pop.mortalityRate * 60).toFixed(1)}/min)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Habitats Detail */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Habitat Niches & Environmental Profiles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ecologySim.habitats.getAllHabitats().map((h) => (
                    <div key={h.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          {h.name}
                        </h4>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {h.occupantCount} residents
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{h.description}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs font-mono mt-3 p-2 bg-slate-950 rounded border border-slate-800/60">
                        <div>
                          <div className="text-[10px] text-slate-400">Nutrients</div>
                          <div className="text-emerald-400 font-bold">{h.profile.nutrients.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Oxygen</div>
                          <div className="text-sky-400 font-bold">{h.profile.dissolvedOxygen.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400">Light</div>
                          <div className="text-amber-400 font-bold">{h.profile.lightLevel.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Authoritative Ecological Event Ledger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Causally coupled event ledger recording vital demographic, trophic, and behavioral milestones. Click any event to trace its causal origin chain.
                  </p>
                </div>
                {selectedEventId && (
                  <button
                    onClick={() => setSelectedEventId(null)}
                    className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
                  >
                    Clear Causal Trace
                  </button>
                )}
              </div>

              {/* Causal Chain Trace Panel */}
              {selectedEventId && causalChain.length > 0 && (
                <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-800/60">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-teal-300 mb-2">
                    <GitBranch className="w-4 h-4" />
                    Causal Historical Chain ({causalChain.length} steps):
                  </div>
                  <div className="space-y-2">
                    {causalChain.map((evt, idx) => (
                      <div key={evt.id} className="flex items-start gap-3 p-2.5 rounded bg-slate-900/90 border border-teal-800/40 text-xs font-mono">
                        <span className="px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 font-bold">Step {idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">[{evt.eventType}] {evt.description}</span>
                            <span className="text-slate-400">T+{evt.timestamp.toFixed(1)}s</span>
                          </div>
                          {evt.cause && (
                            <div className="text-[11px] text-amber-300/90 mt-1">
                              Cause: {evt.cause.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Ledger Stream */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {allEvents.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-6 text-center">No events recorded in ledger yet.</div>
                ) : (
                  allEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventId(evt.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedEventId === evt.id
                          ? 'bg-teal-950/50 border-teal-500'
                          : 'bg-slate-900 hover:bg-slate-850 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.eventType === 'REPRODUCTION' || evt.eventType === 'BIRTH' ? 'bg-pink-950 text-pink-300 border border-pink-800' :
                            evt.eventType === 'DEATH' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                            evt.eventType === 'FEEDING' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            evt.eventType === 'ANTIC_MANIFESTED' ? 'bg-purple-950 text-purple-300 border border-purple-800' :
                            'bg-slate-800 text-slate-300'
                          }`}>
                            {evt.eventType}
                          </span>
                          <span className="text-slate-300 font-medium">{evt.description}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-400">
                          <span>Sig: {(evt.significance * 100).toFixed(0)}%</span>
                          <span>T+{evt.timestamp.toFixed(1)}s</span>
                        </div>
                      </div>
                      {evt.cause && (
                        <div className="text-[11px] font-mono text-slate-400 mt-1 pl-2 border-l border-slate-700">
                          Reason: {evt.cause.description}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'antics' && (
            <div className="space-y-6">
              {/* Manifest Scenes representation */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Manifested Antic Scenes ({ecologySim.anticScheduler.activeScenes.length})
                </h3>
                {ecologySim.anticScheduler.activeScenes.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-3 text-center">
                    No scenes actively manifested for observation.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ecologySim.anticScheduler.activeScenes.map((scene) => (
                      <div key={scene.id} className="p-4 rounded-xl bg-slate-900 border border-teal-800/60">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-teal-300">{scene.type}</span>
                          <span className="text-xs font-mono text-emerald-400">Sig: {(scene.significance * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2">{scene.eventContext}</p>
                        <div className="text-[11px] font-mono text-slate-400 mt-2">
                          Focus: ({scene.spatialFocus.x.toFixed(1)}, {scene.spatialFocus.y.toFixed(1)}, {scene.spatialFocus.z.toFixed(1)}) | Radius: {scene.spatialRadius.toFixed(1)}m
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-1">
                          Participants: {scene.participants.map((p) => `${p.agentId} (${p.role})`).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Antics Details */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Active Antics & Execution States
                </h3>
                {telemetry.activeAntics.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-3 text-center">
                    No multi-agent antics currently scheduled.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ecologySim.anticScheduler.activeAntics.map((antic) => (
                      <div key={antic.id} className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-teal-300">{antic.type}</span>
                            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
                              Phase: {antic.currentPhase}
                            </span>
                            {antic.isManifest && (
                              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Manifest
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            Progress: {(antic.progress * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{antic.trigger}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent History */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Recent Antics History (Repetition Suppression Filter)
                </h3>
                <div className="space-y-2">
                  {ecologySim.anticHistory.getRecentAntics(6).map((rec, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-mono p-2.5 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-300 font-semibold">{rec.type}</span>
                      <span className="text-slate-400">{rec.outcome}</span>
                      <span className="text-teal-400">T+{rec.startTime.toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Agent List */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 max-h-[600px] overflow-y-auto">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Select Autonomous Agent
                </div>
                {ecologySim.agents.map((ag) => (
                  <button
                    key={ag.id}
                    onClick={() => setSelectedAgentId(ag.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors font-mono text-xs ${
                      selectedAgent?.id === ag.id
                        ? 'bg-teal-900/40 border border-teal-500 text-teal-200'
                        : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{ag.id}</div>
                      <div className="text-[11px] text-slate-400">{ag.species} ({ag.lifecycle})</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                ))}
              </div>

              {/* Agent Details */}
              {selectedAgent && (
                <div className="md:col-span-2 space-y-4">
                  {/* Status header */}
                  <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white font-mono">{selectedAgent.id}</h3>
                        <p className="text-xs text-slate-400 font-mono">
                          Species: {selectedAgent.species} | Lifecycle: {selectedAgent.lifecycle} | Gen: {selectedAgent.generation} | Habitat: {selectedAgent.currentHabitatId || 'Open Column'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono text-emerald-400 font-bold">{selectedAgent.energy.toFixed(1)}% Energy</div>
                        <div className="text-xs font-mono text-sky-400">Health: {selectedAgent.health.toFixed(1)}%</div>
                      </div>
                    </div>

                    {/* Current Behavior */}
                    <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-xs font-mono text-slate-400">Active Behavioural Mode:</div>
                      <div className="text-sm font-mono font-semibold text-teal-300 mt-1">
                        [{selectedAgent.behaviour.currentBehaviour.type.toUpperCase()}] {selectedAgent.behaviour.currentBehaviour.reason}
                      </div>
                    </div>
                  </div>

                  {/* Drives & Motivations */}
                  <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                      Internal Drive Motivations
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Hunger', val: selectedAgent.drives.get('hunger'), color: 'bg-amber-500' },
                        { label: 'Fear', val: selectedAgent.drives.get('fear'), color: 'bg-rose-500' },
                        { label: 'Curiosity', val: selectedAgent.drives.get('curiosity'), color: 'bg-teal-500' },
                        { label: 'Socialisation', val: selectedAgent.drives.get('socialisation'), color: 'bg-sky-500' },
                        { label: 'Territoriality', val: selectedAgent.drives.get('territoriality'), color: 'bg-purple-500' },
                        { label: 'Rest', val: selectedAgent.drives.get('rest'), color: 'bg-indigo-500' },
                      ].map((d) => (
                        <div key={d.label} className="p-2.5 rounded bg-slate-900 border border-slate-800">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400">{d.label}</span>
                            <span className="font-semibold text-white">{(d.val * 100).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full rounded-full ${d.color}`} style={{ width: `${Math.min(100, d.val * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Episodic Memories */}
                  <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">
                      Episodic Memory Buffer ({selectedAgent.memory.count} entries)
                    </h4>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {selectedAgent.memory.getAllMemories().slice(-6).map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-300">{m.eventType}</span>
                          <span className="text-slate-400">Valence: {m.valence.toFixed(2)} | Str: {m.strength.toFixed(2)}</span>
                          <span className="text-teal-400">T+{m.timestamp.toFixed(1)}s</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Acoustic Perception & Lateral Line Telemetry */}
                  <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                          Acoustic & Lateral-Line Perception
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                        {selectedAgent.lastAcousticSensoryState?.ambientSoundPressureDb.toFixed(1) ?? '-36.0'} dB
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs font-mono">
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Hearing Acuity</span>
                        <span className="font-semibold text-white">
                          {(selectedAgent.speciesTraits.traits.acousticSensory?.hearingAcuity ?? 1.0).toFixed(2)}x
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Lateral-Line Sens.</span>
                        <span className="font-semibold text-teal-300">
                          {(selectedAgent.speciesTraits.traits.acousticSensory?.lateralLineSensitivity ?? 1.0).toFixed(2)}x
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Startle Threshold</span>
                        <span className="font-semibold text-rose-300">
                          {((selectedAgent.speciesTraits.traits.acousticSensory?.startleThreshold ?? 0.5) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Foraging Attraction</span>
                        <span className="font-semibold text-amber-300">
                          {((selectedAgent.speciesTraits.traits.acousticSensory?.foragingAcousticAttraction ?? 0.5) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Lateral Line Flow Vibration */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 mb-3 text-xs font-mono">
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span className="flex items-center gap-1.5">
                          <Waves className="w-3.5 h-3.5 text-teal-400" />
                          Neuromast Flow Vibration:
                        </span>
                        <span className="text-teal-300 font-semibold">
                          {((selectedAgent.lastAcousticSensoryState?.flowVibrationLevel ?? 0) * 100).toFixed(0)}% ({selectedAgent.lastAcousticSensoryState?.dominantCondition ?? 'calm'})
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (selectedAgent.lastAcousticSensoryState?.flowVibrationLevel ?? 0) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Recently Heard Discrete Sounds */}
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                        Heard Discrete Sound Events ({selectedAgent.lastPerceivedAcousticEvents.length} in range):
                      </span>
                      {selectedAgent.lastPerceivedAcousticEvents.length === 0 ? (
                        <div className="text-[11px] font-mono text-slate-500 italic p-2 rounded bg-slate-900 border border-slate-800 text-center">
                          No discrete shockwaves or feeding clicks detected in immediate auditory range.
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-xs">
                          {selectedAgent.lastPerceivedAcousticEvents.map((ev) => (
                            <div
                              key={ev.id}
                              className={`flex items-center justify-between p-2 rounded border ${
                                ev.isStartling
                                  ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                                  : ev.isAttractive
                                  ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold uppercase text-[10px]">
                                  {ev.sourceType.replace(/_/g, ' ')}
                                </span>
                                {ev.isStartling && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-rose-900 text-rose-200 uppercase font-bold">
                                    Startle Reflex
                                  </span>
                                )}
                                {ev.isAttractive && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-amber-900 text-amber-200 uppercase font-bold">
                                    Foraging Cue
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-400 text-[11px]">
                                {ev.distance.toFixed(1)}m | {(ev.perceivedIntensity * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Morphological Signature & Posture Expression (Task 005) */}
                  {(() => {
                    const morphSig = generateMorphologicalSignature(selectedAgent.id, 0);
                    return (
                      <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-teal-400" />
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                              Morphological Identity & Posture Signature (Task 005)
                            </h4>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-950/80 border border-teal-800 text-teal-300">
                            Aspect: {morphSig.aspect}x
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs font-mono">
                          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Body Depth</span>
                            <span className="font-semibold text-white">{morphSig.bodyDepth}x</span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Anterior Taper</span>
                            <span className="font-semibold text-white">{morphSig.taper}</span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Compliance / Flex</span>
                            <span className="font-semibold text-teal-300">{morphSig.flexibility}x</span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Asymmetry Bias</span>
                            <span className={`font-semibold ${morphSig.asymmetryBias >= 0 ? 'text-sky-300' : 'text-purple-300'}`}>
                              {morphSig.asymmetryBias >= 0 ? `+${morphSig.asymmetryBias}` : morphSig.asymmetryBias}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Mass Distribution</span>
                            <span className="text-slate-300">
                              {morphSig.massDistribution > 0 ? `Anterior (+${morphSig.massDistribution})` : `Posterior (${morphSig.massDistribution})`}
                            </span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Posterior Locomotion</span>
                            <span className="text-slate-300">{morphSig.posteriorExpression}x hydro-wave</span>
                          </div>
                          <div className="p-2 rounded bg-slate-900 border border-slate-800">
                            <span className="text-[10px] text-slate-400 block">Surface Complexity</span>
                            <span className="text-slate-300">{morphSig.surfaceComplexity} ripple</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {activeTab === 'fields' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Discrete Spatial Environmental Fields
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Environmental fields (Nutrients, Illumination, Dissolved Oxygen, and Temperature) are spatially resolved continuous fields that couple directly with agent perception, algae proliferation, and resource bio-cycling.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Nutrients (Organic)</div>
                    <div className="text-xl font-mono text-emerald-400 font-bold mt-1">
                      {ecologySim.fields.sample(0, 0, 0, 'nutrients').toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Illumination (Lux)</div>
                    <div className="text-xl font-mono text-amber-400 font-bold mt-1">
                      {ecologySim.fields.sample(0, 0, 0, 'illumination').toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Dissolved Oxygen</div>
                    <div className="text-xl font-mono text-sky-400 font-bold mt-1">
                      {ecologySim.fields.sample(0, 0, 0, 'oxygen').toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Water Temperature</div>
                    <div className="text-xl font-mono text-teal-400 font-bold mt-1">
                      {ecologySim.fields.sample(0, 0, 0, 'temperature').toFixed(1)}°C
                    </div>
                  </div>
                </div>
              </div>

              {/* Authoritative Environmental World Model (Task 003) */}
              {ecologySim.environment && (
                <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                      Authoritative Environmental Dynamics (Task 003)
                    </h3>
                    <span className="text-xs font-mono text-teal-400">
                      Substrate: {ecologySim.environment.substrate.composition.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono mb-4">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Water Flow Velocity</span>
                      <span className="text-teal-300 font-bold">
                        ({ecologySim.environment.water.flow.x.toFixed(2)}, {ecologySim.environment.water.flow.y.toFixed(2)}, {ecologySim.environment.water.flow.z.toFixed(2)})
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Turbulence & Stirring</span>
                      <span className="text-sky-300 font-bold">
                        {(ecologySim.environment.water.turbulence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Water Turbidity</span>
                      <span className="text-amber-300 font-bold">
                        {(ecologySim.environment.water.turbidity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Optical Clarity</span>
                      <span className="text-emerald-300 font-bold">
                        {(ecologySim.environment.water.clarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Benthic Sediment Puff</span>
                      <span className="text-amber-200 font-bold">
                        {(ecologySim.environment.substrate.sediment * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Substrate Stability</span>
                      <span className="text-emerald-300 font-bold">
                        {(ecologySim.environment.substrate.stability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Vegetation Canopy</span>
                      <span className="text-teal-300 font-bold">
                        {(ecologySim.environment.vegetation.density * 100).toFixed(1)}% (Health: {(ecologySim.environment.vegetation.health * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block text-[11px]">Suspended Particulates</span>
                      <span className="text-sky-300 font-bold">
                        {ecologySim.environment.particles.density} particles
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources Status */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Ecological Resources & Detritus Bio-cycling
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {ecologySim.resources.resources.slice(0, 9).map((res) => (
                    <div key={res.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-teal-300">{res.type}</span>
                        <span className="text-slate-400">Qty: {res.quantity.toFixed(2)}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Pos: ({res.position.x.toFixed(1)}, {res.position.y.toFixed(1)}, {res.position.z.toFixed(1)})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'acoustic' && (
            <div className="space-y-6">
              {/* Telemetry & Signature Overview */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                      Authoritative Acoustic Ecology Field
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Atmosphere, not a soundtrack. Soundscape derived dynamically from physics, populations, and historical event causality.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                      Estimated: {telemetry.acousticTelemetry?.signature.estimated_loudness_db.toFixed(1)} dB
                    </span>
                  </div>
                </div>

                {/* 6-Layer Architecture Gauges */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Layer 0: Ambient Bed</span>
                      <span className="font-mono text-cyan-300 font-semibold">
                        {((telemetry.acousticTelemetry?.state.ambient_level ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${(telemetry.acousticTelemetry?.state.ambient_level ?? 0) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Layer 1: Water Dynamics</span>
                      <span className="font-mono text-teal-300 font-semibold">
                        {((telemetry.acousticTelemetry?.state.water_activity ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${(telemetry.acousticTelemetry?.state.water_activity ?? 0) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Layer 2: Biological Texture</span>
                      <span className="font-mono text-emerald-300 font-semibold">
                        {((telemetry.acousticTelemetry?.state.biological_activity ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(telemetry.acousticTelemetry?.state.biological_activity ?? 0) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Substrate Activity</span>
                      <span className="font-mono text-amber-300 font-semibold">
                        {((telemetry.acousticTelemetry?.state.substrate_activity ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(telemetry.acousticTelemetry?.state.substrate_activity ?? 0) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Turbulence & Eddies</span>
                      <span className="font-mono text-sky-300 font-semibold">
                        {((telemetry.acousticTelemetry?.state.turbulence ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500 rounded-full" style={{ width: `${(telemetry.acousticTelemetry?.state.turbulence ?? 0) * 100}%` }} />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Disturbance Level</span>
                      <span className="font-mono text-rose-300 font-semibold">
                        {((telemetry.acousticTelemetry?.state.disturbance ?? 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(telemetry.acousticTelemetry?.state.disturbance ?? 0) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 37: "Why am I hearing this?" Causal Chain Inspection */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <ScrollText className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Causal Acoustic Traces ("Why am I hearing this?")
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Every discrete acoustic event retains an authoritative reference to its simulated ecological cause.
                </p>

                {telemetry.acousticTelemetry?.recentCausalTraces && telemetry.acousticTelemetry.recentCausalTraces.length > 0 ? (
                  <div className="space-y-2.5">
                    {telemetry.acousticTelemetry.recentCausalTraces.map((trace, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-300 font-semibold uppercase tracking-wider">
                            {trace.source.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            t = {trace.timestamp.toFixed(1)}s | at {trace.location}
                          </span>
                        </div>
                        <div className="text-slate-300 text-[11px] pl-3 border-l-2 border-cyan-700/60 mt-0.5">
                          <span className="text-slate-400">Cause: </span>
                          <span>{trace.cause}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 font-mono text-xs bg-slate-900/50 rounded-xl border border-slate-800/80">
                    No discrete event sounds active. Continuous baseline ambient bed and laminar water flow murmuring gently.
                  </div>
                )}
              </div>

              {/* Closed-Loop Bi-directional Sensory Feedback */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
                    Closed-Loop Acoustic Ecology (Bi-directional Sensory Coupling)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Sound is not merely an output projection. Organisms actively sense acoustic pressure waves and fluid vibrations via lateral lines and inner ear otoliths. Sudden shockwaves provoke startle/flee responses, while surface food-drop impacts attract foraging cohorts.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Acoustic Listeners</span>
                    <span className="text-base text-cyan-300 font-bold mt-1 block">
                      {ecologySim.agents.filter((a) => a.lifecycle !== 'dead').length} organisms
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Sampling at 10Hz</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Startle State Active</span>
                    <span className="text-base text-rose-400 font-bold mt-1 block">
                      {ecologySim.agents.filter((a) => a.startleCooldown > 0).length} organisms
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">C-start evasive reflexes</span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Acoustically Attracted</span>
                    <span className="text-base text-amber-300 font-bold mt-1 block">
                      {ecologySim.agents.filter((a) => a.behaviour.currentBehaviour.reason.includes('Acoustic') || a.behaviour.currentBehaviour.reason.includes('acoustic')).length} organisms
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Orienting to feeding sounds</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'persistence' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  World State Persistence (Schema v0.2)
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Saves and restores the entire multi-scalar artificial ecology into persistent browser storage, including multi-scalar clock, ecological succession phases, population demographics, spatial habitats, authoritative causal event ledger, agent cognition, and environmental bio-cycling. Includes automatic idle-time catch-up simulation.
                </p>

                {persistenceFeedback && (
                  <div className="p-3 rounded-lg bg-teal-950 border border-teal-700 text-teal-300 text-xs font-mono mb-4">
                    {persistenceFeedback}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs transition-colors shadow-lg shadow-teal-900/30"
                  >
                    <Save className="w-4 h-4" />
                    Save World Snapshot (v0.2)
                  </button>
                  <button
                    onClick={handleLoad}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Load Stored State
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 font-medium text-xs border border-rose-800 transition-colors ml-auto"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Simulation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
