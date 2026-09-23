/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BoidSimulation4D } from './simulation/boids4D';
import { ProceduralFloraSimulation } from './simulation/flora';
import { AquariumSceneManager } from './rendering/aquariumScene';
import { DeskHeader } from './components/DeskHeader';
import { TemporalTimeline } from './components/TemporalTimeline';
import { AquariumControls } from './components/AquariumControls';
import { FloraOverlay } from './components/FloraOverlay';
import { BenchmarkPanel } from './components/BenchmarkPanel';
import { BotanicalPanel } from './components/BotanicalPanel';
import { EcosystemInspectorModal } from './components/EcosystemInspectorModal';
import { OrganismDossierCard } from './components/OrganismDossierCard';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { EcologySimulation } from './simulation/EcologySimulation';
import { InspectedOrganism, InteractionTool, LightingPreset, SimulationStats } from './types';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Core Simulation Singletons
  const [boidSim] = useState(() => new BoidSimulation4D(3, 190, 240));
  const [floraSim] = useState(() => new ProceduralFloraSimulation(1024, 512));
  const [ecologySim] = useState(() => new EcologySimulation());
  const [sceneManager, setSceneManager] = useState<AquariumSceneManager | null>(null);

  // App UI State
  const [currentTool, setCurrentTool] = useState<InteractionTool>('feed');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('daylight');
  const [deskLampOn, setDeskLampOn] = useState<boolean>(true);
  const [currentTimeW, setCurrentTimeW] = useState<number>(50.0);
  const [timeDirection, setTimeDirection] = useState<number>(1);
  const [timeSpeed, setTimeSpeed] = useState<number>(6.0);
  const [showEchoes, setShowEchoes] = useState<boolean>(true);
  const [showBenchmark, setShowBenchmark] = useState<boolean>(false);
  const [showBotanical, setShowBotanical] = useState<boolean>(false);
  const [showEcology, setShowEcology] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

  // Organism Focus & Zen Camera State
  const [inspectedOrganism, setInspectedOrganism] = useState<InspectedOrganism | null>(null);
  const [isTrackingCamera, setIsTrackingCamera] = useState<boolean>(true);
  const [isZenTour, setIsZenTour] = useState<boolean>(false);
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);

  // Telemetry stats
  const [stats, setStats] = useState<SimulationStats>({
    fps: 60,
    totalBoids: 433,
    visibleBoids: 433,
    macroCount: 3,
    mesoCount: 190,
    microCount: 240,
    currentTimeW: 50.0,
    timeDirection: 1,
    timeSpeed: 6.0,
    algaeCoverage: 18,
    foodCount: 0,
    kuramotoSync: 0.85,
    dayNightPhase: 0.25,
    dayNightPeriod: 60,
    dayNightEnabled: true,
    fireflyCyclePhase: 0.0,
    fireflyCyclePeriod: 40,
    fireflyCycleEnabled: true,
    fireflyMinCount: 35,
    fireflyMaxCount: 420,
    crabCount: 4,
    snailCount: 4,
    shrimpCount: 6,
    medusaCount: 4,
    totalMicroFauna: 18,
  });

  // Mount Three.js Scene
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const manager = new AquariumSceneManager(
      canvasContainerRef.current,
      boidSim,
      floraSim
    );
    manager.onOrganismSelect = (org) => {
      setInspectedOrganism(org);
      if (org) {
        setCurrentTool('inspect');
      }
    };
    setSceneManager(manager);

    // Telemetry update interval (runs at 3 Hz to minimize React state churn)
    const intervalId = setInterval(() => {
      // Sync inspected organism telemetry live
      if (manager.trackedOrganism) {
        const live = manager.getInspectedOrganismLiveData(manager.trackedOrganism.id);
        if (live) setInspectedOrganism(live);
      }

      // Count visible fish and fireflies in current 4D time slice
      let visible = 0;
      const boids = boidSim.boids;
      for (let i = 0; i < boids.length; i++) {
        if (boids[i].temporalAlpha > 0.15) visible++;
      }
      const fireflies = boidSim.fireflies;
      for (let i = 0; i < fireflies.length; i++) {
        if (fireflies[i].temporalAlpha > 0.15) visible++;
      }

      // Update underlying artificial ecology simulation
      ecologySim.update(0.3, floraSim.coverage, currentTool === 'clean_glass' ? 0.6 : 0.0);

      setCurrentTimeW(boidSim.currentTimeW);

      setStats({
        fps: manager.currentFps,
        totalBoids: boidSim.boids.length + boidSim.fireflies.length,
        visibleBoids: visible,
        macroCount: boidSim.macroCount,
        mesoCount: boidSim.mesoCount,
        microCount: boidSim.fireflies.length,
        currentTimeW: boidSim.currentTimeW,
        timeDirection: boidSim.timeFlowDirection,
        timeSpeed: boidSim.timeSpeed,
        algaeCoverage: floraSim.coverage,
        foodCount: boidSim.foodPellets.length,
        kuramotoSync: boidSim.kuramotoSync,
        dayNightPhase: manager.dayNightCycle.currentPhase,
        dayNightPeriod: manager.dayNightCycle.periodSeconds,
        dayNightEnabled: manager.dayNightCycle.enabled,
        fireflyCyclePhase: boidSim.fireflyCycle.currentPhase,
        fireflyCyclePeriod: boidSim.fireflyCycle.periodSeconds,
        fireflyCycleEnabled: boidSim.fireflyCycle.enabled,
        fireflyMinCount: boidSim.fireflyCycle.minCount,
        fireflyMaxCount: boidSim.fireflyCycle.maxCount,
        crabCount: manager.microFaunaSim.config.crabs,
        snailCount: manager.microFaunaSim.config.snails,
        shrimpCount: manager.microFaunaSim.config.shrimp,
        medusaCount: manager.microFaunaSim.config.medusae,
        totalMicroFauna: manager.microFaunaSim.entities.length,
      });
    }, 300);

    return () => {
      clearInterval(intervalId);
      manager.destroy();
    };
  }, [boidSim, floraSim]);

  // Handlers
  const handleSelectTool = (tool: InteractionTool) => {
    setCurrentTool(tool);
  };

  const handleSelectLighting = (preset: LightingPreset) => {
    setLightingPreset(preset);
    if (sceneManager) {
      sceneManager.setLightingPreset(preset);
    }
  };

  const handleToggleDeskLamp = () => {
    if (sceneManager) {
      const newState = sceneManager.toggleDeskLamp();
      setDeskLampOn(newState);
    }
  };

  const handleScrubTime = (val: number) => {
    boidSim.currentTimeW = val;
    setCurrentTimeW(val);
  };

  const handleTogglePlay = (dir: number) => {
    boidSim.timeFlowDirection = dir;
    setTimeDirection(dir);
  };

  const handleSetSpeed = (speed: number) => {
    boidSim.timeSpeed = speed;
    setTimeSpeed(speed);
  };

  const handleToggleEchoes = () => {
    const next = !showEchoes;
    boidSim.showTemporalEchoes = next;
    setShowEchoes(next);
  };

  const handleToggleZenTour = () => {
    const next = sceneManager?.toggleZenTour() ?? !isZenTour;
    setIsZenTour(next);
    if (next) {
      setInspectedOrganism(null);
    }
  };

  const handleCaptureSnapshot = () => {
    setSnapshotFlash(true);
    setTimeout(() => setSnapshotFlash(false), 220);
    sceneManager?.captureSnapshot();
  };

  const handleToggleTrackingCamera = () => {
    const next = !isTrackingCamera;
    setIsTrackingCamera(next);
    sceneManager?.setTrackingCamera(next);
  };

  const handleCloseDossier = () => {
    setInspectedOrganism(null);
    sceneManager?.clearInspectedOrganism();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const nextDir = timeDirection === 0 ? 1 : 0;
        handleTogglePlay(nextDir);
      } else if (e.key === 'i' || e.key === 'I') {
        setCurrentTool('inspect');
      } else if (e.key === 'f' || e.key === 'F') {
        setCurrentTool('feed');
      } else if (e.key === 'w' || e.key === 'W') {
        setCurrentTool('wafer');
      } else if (e.key === 'c' || e.key === 'C') {
        setCurrentTool('clean_glass');
      } else if (e.key === 's' || e.key === 'S') {
        setCurrentTool('stir_water');
      } else if (e.key === 'z' || e.key === 'Z') {
        handleToggleZenTour();
      } else if (e.key === 'p' || e.key === 'P') {
        handleCaptureSnapshot();
      } else if (e.key === 'l' || e.key === 'L') {
        handleToggleDeskLamp();
      } else if (e.key === '1') {
        handleSelectLighting('daylight');
      } else if (e.key === '2') {
        handleSelectLighting('sunset');
      } else if (e.key === '3') {
        handleSelectLighting('bioluminescent');
      } else if (e.key === '4') {
        handleSelectLighting('midnight');
      } else if (e.key === 'b' || e.key === 'B') {
        setShowBenchmark((prev) => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        setShowEcology((prev) => !prev);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowShortcuts((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (inspectedOrganism) {
          handleCloseDossier();
        } else if (showShortcuts) {
          setShowShortcuts(false);
        } else if (showBenchmark) {
          setShowBenchmark(false);
        } else if (showBotanical) {
          setShowBotanical(false);
        } else if (showEcology) {
          setShowEcology(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeDirection, sceneManager, isZenTour, inspectedOrganism, showShortcuts, showBenchmark, showBotanical, showEcology]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Three.js 2.5D Canvas Viewport */}
      <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Interactive Flora Cleaning & Feeding Touch/Click Overlay */}
      <FloraOverlay
        currentTool={currentTool}
        floraSim={floraSim}
        sceneManager={sceneManager}
      />

      {/* Top Header & Telemetry Badges */}
      <DeskHeader
        stats={stats}
        currentPhase={ecologySim.phaseEngine.currentPhase}
        isZenTour={isZenTour}
        onToggleZenTour={handleToggleZenTour}
        onCaptureSnapshot={handleCaptureSnapshot}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onOpenBenchmark={() => setShowBenchmark(true)}
        onOpenBotanical={() => setShowBotanical(true)}
        onOpenEcology={() => setShowEcology(true)}
      />

      {/* Interactive Controls & Settings */}
      <AquariumControls
        currentTool={currentTool}
        onSelectTool={handleSelectTool}
        lightingPreset={lightingPreset}
        onSelectLighting={handleSelectLighting}
        deskLampOn={deskLampOn}
        onToggleDeskLamp={handleToggleDeskLamp}
        boidSim={boidSim}
        floraSim={floraSim}
        sceneManager={sceneManager}
      />

      {/* Bottom 4D Temporal Timeline */}
      <TemporalTimeline
        boidSim={boidSim}
        currentTimeW={currentTimeW}
        timeDirection={timeDirection}
        timeSpeed={timeSpeed}
        showEchoes={showEchoes}
        onScrubTime={handleScrubTime}
        onTogglePlay={handleTogglePlay}
        onSetSpeed={handleSetSpeed}
        onToggleEchoes={handleToggleEchoes}
      />

      {/* Live Organism Dossier Card HUD */}
      <OrganismDossierCard
        organism={inspectedOrganism}
        onClose={handleCloseDossier}
        isTrackingCamera={isTrackingCamera}
        onToggleTrackingCamera={handleToggleTrackingCamera}
        sceneManager={sceneManager}
      />

      {/* Keyboard Shortcuts & Controls Modal */}
      <ShortcutsHelpModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Botanical Plant Morphology & Lifecycle Management HUD */}
      <BotanicalPanel
        isOpen={showBotanical}
        onClose={() => setShowBotanical(false)}
        lifecycleSim={sceneManager?.coralObjects?.plantLifecycleSim}
      />

      {/* Performance Benchmarking & Hitch Diagnostics HUD Modal */}
      <BenchmarkPanel
        isOpen={showBenchmark}
        onClose={() => setShowBenchmark(false)}
      />

      {/* Ecosystem Intelligence & Telemetry Inspector HUD */}
      <EcosystemInspectorModal
        isOpen={showEcology}
        onClose={() => setShowEcology(false)}
        ecologySim={ecologySim}
      />

      {/* High-res camera shutter visual flash effect */}
      <div
        className={`absolute inset-0 bg-white transition-opacity duration-200 pointer-events-none z-50 ${
          snapshotFlash ? 'opacity-90' : 'opacity-0'
        }`}
      />

      {/* Subtle bottom room ambient vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />
    </main>
  );
}
