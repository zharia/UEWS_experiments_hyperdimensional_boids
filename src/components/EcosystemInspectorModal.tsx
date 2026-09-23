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
} from 'lucide-react';
import { EcologySimulation } from '../simulation/EcologySimulation';
import { EcologicalAgent } from '../agents/agent/EcologicalAgent';
import { EcologicalPhaseType } from '../phases/phase/EcologicalPhase';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'populations' | 'history' | 'antics' | 'agents' | 'fields' | 'persistence'>('overview');
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
