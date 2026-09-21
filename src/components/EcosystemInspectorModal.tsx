/**
 * Ecosystem Inspector & Telemetry HUD.
 *
 * Provides real-time visibility into the underlying multi-scalar artificial ecology:
 *  - Ecological Phase & State Transitions
 *  - Multi-scalar Simulation Clock Controls
 *  - Active Episodic Antics & Progress
 *  - Recent Antic History & Repetition Penalties
 *  - Live Antic Candidates Queue
 *  - Deep Agent Inspector (Drives, Episodic Memory, Social Relationships, Selected Behaviour)
 *  - Environmental Field Summary (Nutrients, Temperature, Oxygen, Illumination)
 *  - Versioned World State Persistence (Save/Load/Reset)
 */

import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  FastForward,
  Save,
  RotateCcw,
  Download,
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
  const [activeTab, setActiveTab] = useState<'overview' | 'antics' | 'agents' | 'fields' | 'persistence'>('overview');
  const [selectedAgentId, setSelectedAgentId] = useState<string>(ecologySim.agents[0]?.id || '');
  const [persistenceFeedback, setPersistenceFeedback] = useState<string>('');

  if (!isOpen) return null;

  const telemetry = ecologySim.getTelemetry();
  const selectedAgent = ecologySim.agents.find((a) => a.id === selectedAgentId) || ecologySim.agents[0];

  const handleSave = async () => {
    const success = await ecologySim.save();
    setPersistenceFeedback(success ? 'World state saved successfully (v0.1)!' : 'Failed to save world state.');
    setTimeout(() => setPersistenceFeedback(''), 3500);
  };

  const handleLoad = async () => {
    const success = await ecologySim.load();
    setPersistenceFeedback(success ? 'World state restored successfully (v0.1)!' : 'No saved world found.');
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
      <div className="flex flex-col w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-900/50 border border-teal-700/50 text-teal-300">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold tracking-wide text-white">Ecosystem Intelligence Inspector</h2>
                <span className={`px-2.5 py-0.5 text-xs font-mono font-medium rounded-full border ${getPhaseColor(telemetry.currentPhase)}`}>
                  {telemetry.currentPhase}
                </span>
                <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-400">
                  Observer: {telemetry.observerState}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Sim Time: {telemetry.simulationTime.toFixed(1)}s (Epoch duration: {telemetry.phaseDurationSeconds.toFixed(1)}s)
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
        <div className="flex px-6 border-b border-slate-800 bg-slate-900/50">
          {[
            { id: 'overview', label: 'Ecology Overview', icon: Layers },
            { id: 'antics', label: `Episodic Antics (${telemetry.activeAntics.length})`, icon: Sparkles },
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
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
                  <div className="text-xs text-slate-400 font-medium">Dominant Motivation</div>
                  <div className="text-lg font-mono font-semibold text-sky-300 mt-2">
                    {telemetry.averageCuriosity > telemetry.averageHunger ? 'Curiosity' : 'Hunger'}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    H: {(telemetry.averageHunger * 100).toFixed(0)}% | C: {(telemetry.averageCuriosity * 100).toFixed(0)}%
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

              {/* Active Antics Snapshot */}
              <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-3">
                  Currently Manifest Episodic Antics
                </h3>
                {telemetry.activeAntics.length === 0 ? (
                  <div className="text-xs text-slate-400 italic py-3 text-center">
                    Ambient equilibrium cruising. No multi-agent antics currently triggered.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {telemetry.activeAntics.map((antic) => (
                      <div key={antic.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-teal-300">{antic.type}</span>
                          <span className="text-xs font-mono text-slate-400">Phase: {antic.phase}</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-teal-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(5, antic.progress * 100))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'antics' && (
            <div className="space-y-6">
              {/* Active Antics Detailed */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Active Antics ({ecologySim.anticScheduler.activeAntics.length})</h3>
                {ecologySim.anticScheduler.activeAntics.length === 0 ? (
                  <div className="text-xs text-slate-400 italic p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center">
                    No active antics currently executing.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {ecologySim.anticScheduler.activeAntics.map((antic) => (
                      <div key={antic.id} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-teal-300">{antic.type}</span>
                            <span className={`px-2 py-0.5 text-xs font-mono rounded ${antic.isManifest ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-slate-800 text-slate-400'}`}>
                              {antic.isManifest ? 'MANIFEST (Observable)' : 'LATENT (Subconscious)'}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-400">
                            Duration: {antic.duration.toFixed(1)}s (Salience: {antic.salience.toFixed(2)})
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{antic.trigger}</p>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                          <span className="text-slate-400">Phase Sequence:</span>
                          {antic.phases.map((ph, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 rounded ${
                                idx === antic.currentPhaseIndex
                                  ? 'bg-teal-700 text-white font-bold'
                                  : idx < antic.currentPhaseIndex
                                  ? 'bg-slate-800 text-slate-400 line-through'
                                  : 'bg-slate-900 text-slate-400'
                              }`}
                            >
                              {ph}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Antic History & Repetition Suppression */}
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">Recent Antic History & Repetition Suppression</h3>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  {ecologySim.anticHistory.getRecentAntics(6).map((rec, i) => (
                    <div key={i} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-slate-900 border border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-400">T+{rec.startTime.toFixed(1)}s</span>
                        <span className="text-slate-200 font-semibold">{rec.type}</span>
                        <span className="text-slate-400">({rec.outcome})</span>
                      </div>
                      <span className="text-xs text-amber-400/80">
                        Cooldown Penalty: {(ecologySim.anticHistory.getRepetitionPenalty(rec.type, ecologySim.clock.simulationTime) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Agent Selector List */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Agent Roster ({ecologySim.agents.length})</div>
                <div className="space-y-1.5 max-h-[55vh] overflow-y-auto pr-1">
                  {ecologySim.agents.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAgentId(a.id)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                        selectedAgent?.id === a.id
                          ? 'bg-teal-900/60 border border-teal-700/80 text-teal-200'
                          : 'bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{a.id}</div>
                        <div className="text-[10px] text-slate-400">{a.species} ({a.lifecycle})</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {a.behaviour.currentBehaviour.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Agent Cognition & Internal State */}
              <div className="md:col-span-2 space-y-4">
                {selectedAgent && (
                  <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                    {/* Header Details */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <h4 className="text-base font-mono font-bold text-white">{selectedAgent.id}</h4>
                        <p className="text-xs text-slate-400 font-mono">
                          Species: {selectedAgent.species} | Stage: {selectedAgent.lifecycle} | Age: {selectedAgent.ageSeconds.toFixed(1)}s
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono text-slate-400">Energy</div>
                        <div className="text-lg font-mono font-bold text-emerald-400">
                          {selectedAgent.energy.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Active Behaviour & Locomotion Intent */}
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-teal-300 font-semibold">Active Behaviour: {selectedAgent.behaviour.currentBehaviour.type}</span>
                        <span className="text-slate-400">Speed Mult: {selectedAgent.behaviour.currentBehaviour.desiredSpeedMultiplier}x</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{selectedAgent.behaviour.currentBehaviour.reason}</p>
                    </div>

                    {/* Internal Drives Gauges */}
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Motivational Drives</div>
                      <div className="grid grid-cols-2 gap-2">
                        {['hunger', 'fear', 'curiosity', 'rest', 'exploration', 'socialisation', 'territoriality'].map((d) => {
                          const val = selectedAgent.drives.get(d);
                          return (
                            <div key={d} className="p-2 rounded bg-slate-900 border border-slate-800">
                              <div className="flex justify-between text-[11px] font-mono mb-1">
                                <span className="capitalize text-slate-300">{d}</span>
                                <span className="text-teal-400">{(val * 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${val * 100}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Episodic Memory */}
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Episodic Memories ({selectedAgent.memory.count})</div>
                      {selectedAgent.memory.count === 0 ? (
                        <div className="text-xs text-slate-400 italic">No episodic memories recorded yet.</div>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                          {selectedAgent.memory.getAllMemories().map((m) => (
                            <div key={m.id} className="text-xs font-mono p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                              <span className="text-slate-300">{m.eventType}</span>
                              <span className="text-slate-400">Valence: {m.valence > 0 ? `+${m.valence.toFixed(2)}` : m.valence.toFixed(2)} | Strength: {(m.strength * 100).toFixed(0)}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Relationships */}
                    <div>
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Inter-agent Social Relationships</div>
                      {selectedAgent.relationships.getAllRelationships().length === 0 ? (
                        <div className="text-xs text-slate-400 italic">No interpersonal ties recorded yet.</div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedAgent.relationships.getAllRelationships().slice(0, 4).map((rel) => (
                            <div key={rel.targetAgentId} className="p-2 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                              <div className="font-semibold text-slate-200">{rel.targetAgentId}</div>
                              <div className="text-slate-400 text-[10px]">
                                Affinity: {rel.affinity.toFixed(2)} | Familiarity: {(rel.familiarity * 100).toFixed(0)}%
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'fields' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-3">Spatially Addressable 3D Environmental Fields</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Fields form an abiotic substrate continuously driving nutrient bio-cycling, light attenuation, dissolved oxygen gradients, and temperature stratification.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { field: 'temperature', label: 'Water Temperature', unit: '°C', val: ecologySim.fields.sample(0, 0, 0, 'temperature').toFixed(1) + ' °C' },
                    { field: 'illumination', label: 'Center Illumination', unit: 'lux', val: (ecologySim.fields.sample(0, 0, 0, 'illumination') * 100).toFixed(0) + '%' },
                    { field: 'nutrients', label: 'Dissolved Nutrients', unit: 'ppm', val: (ecologySim.fields.sample(0, 0, 0, 'nutrients') * 100).toFixed(1) + ' ppm' },
                    { field: 'oxygen', label: 'Dissolved Oxygen', unit: 'mg/L', val: (ecologySim.fields.sample(0, 0, 0, 'oxygen') * 100).toFixed(0) + '%' },
                    { field: 'food', label: 'Dissolved Organic Matter', unit: 'mg/L', val: (ecologySim.fields.sample(0, 0, 0, 'food') * 100).toFixed(1) },
                    { field: 'water_flow', label: 'Micro-current Velocity', unit: 'cm/s', val: '2.4 cm/s' },
                  ].map((item) => (
                    <div key={item.field} className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                      <div className="text-xs text-slate-400">{item.label}</div>
                      <div className="text-lg font-bold text-teal-300 mt-1">{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ecological Resources */}
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 mb-3">Ecological Resources ({ecologySim.resources.resources.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ecologySim.resources.resources.map((res) => (
                    <div key={res.id} className="flex items-center justify-between text-xs font-mono p-2 rounded bg-slate-900 border border-slate-800">
                      <div>
                        <span className="text-slate-200 font-semibold">{res.type}</span>
                        <span className="text-slate-400 text-[10px] ml-2">({res.id})</span>
                      </div>
                      <span className="text-teal-400">Qty: {res.quantity.toFixed(2)} / {res.maxQuantity.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'persistence' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-teal-900/40 text-teal-300 border border-teal-700/50">
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-mono font-bold text-white">Versioned World State Persistence (v0.1)</h3>
                <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
                  Captures complete simulation state: multi-scalar clock, ecological epoch transitions, agent identities, motivations, episodic memories, inter-agent ties, environmental fields, and antics history.
                </p>

                {persistenceFeedback && (
                  <div className="p-3 rounded-lg bg-teal-950 border border-teal-800 text-xs font-mono text-teal-300">
                    {persistenceFeedback}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save World Snapshot
                  </button>

                  <button
                    onClick={handleLoad}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Load World Snapshot
                  </button>

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 font-medium text-xs transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Genesis
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
