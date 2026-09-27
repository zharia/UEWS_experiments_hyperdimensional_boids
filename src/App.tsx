/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { BoidSimulation4D } from './simulation/boids4D';
import { ProceduralFloraSimulation } from './simulation/flora';
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
import { AquariumSceneManager, CameraPreset, CAMERA_PRESETS } from './rendering/aquariumScene';
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
  const [isTimeToolbarExpanded, setIsTimeToolbarExpanded] = useState<boolean>(false);
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
  const [activeCameraPreset, setActiveCameraPreset] = useState<CameraPreset>('front');
  const [snapshotFlash, setSnapshotFlash] = useState<boolean>(false);

  // HUD Quick Hotkey Feedback Toast
  const [hotkeyToast, setHotkeyToast] = useState<{ key: string; label: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showHotkeyFeedback = (key: string, label: string) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setHotkeyToast({ key, label });
    toastTimeoutRef.current = window.setTimeout(() => {
      setHotkeyToast(null);
    }, 1800);
  };

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
    algaeCoverage: 0,
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
      floraSim,
      ecologySim
    );
    manager.onOrganismSelect = (org) => {
      setInspectedOrganism(org);
      if (org) {
        setCurrentTool('inspect');
      }
    };
    manager.onCameraPresetChange = (preset) => {
      setActiveCameraPreset(preset);
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

  const handleCycleCameraPreset = () => {
    if (sceneManager) {
      const next = sceneManager.cycleCameraPreset();
      setActiveCameraPreset(next);
      setIsZenTour(false);
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
    // Ensure window has focus when mounted
    try {
      window.focus();
    } catch {
      // ignore
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only ignore if the user is genuinely typing into a text field
      if (
        (e.target instanceof HTMLInputElement && ['text', 'search', 'email', 'password'].includes(e.target.type)) ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = (e.key || '').toLowerCase();
      const code = e.code || '';

      // Spacebar: Play / Pause
      if (code === 'Space' || key === ' ' || key === 'spacebar') {
        e.preventDefault();
        const nextDir = timeDirection === 0 ? 1 : 0;
        handleTogglePlay(nextDir);
        showHotkeyFeedback('SPACE', nextDir === 0 ? 'Simulation Paused' : 'Simulation Playing (1.0x)');
        if (document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
        return;
      }

      // I: Inspect Tool
      if (key === 'i') {
        setCurrentTool('inspect');
        showHotkeyFeedback('I', 'Tool: Organism Inspector');
        return;
      }

      // F: Feed Flakes Tool + Spawn Flakes
      if (key === 'f') {
        setCurrentTool('feed');
        if (sceneManager) {
          sceneManager.dropFoodAtScreen(window.innerWidth / 2, window.innerHeight * 0.35);
        }
        showHotkeyFeedback('F', 'Feed Flakes (Flakes dropped)');
        return;
      }

      // W: Substrate Wafer Tool + Drop Wafer
      if (key === 'w') {
        setCurrentTool('wafer');
        if (sceneManager) {
          sceneManager.dropSubstrateWafer(0, 0);
        }
        showHotkeyFeedback('W', 'Substrate Wafer (Wafer dropped)');
        return;
      }

      // C: Clean Glass Tool
      if (key === 'c') {
        setCurrentTool('clean_glass');
        floraSim.cleanRadius(floraSim.width / 2, floraSim.height / 2, 80);
        showHotkeyFeedback('C', 'Clean Glass Scrubber');
        return;
      }

      // S: Stir Water Tool + Agitate Currents
      if (key === 's') {
        setCurrentTool('stir_water');
        if (sceneManager) {
          sceneManager.stirWaterAtScreen(window.innerWidth / 2, window.innerHeight / 2);
        }
        showHotkeyFeedback('S', 'Stir Currents & Tap Glass');
        return;
      }

      // V: Camera Perspective Preset
      if (key === 'v') {
        if (sceneManager) {
          const next = sceneManager.cycleCameraPreset();
          setActiveCameraPreset(next);
          setIsZenTour(false);
          showHotkeyFeedback('V', `Camera: ${CAMERA_PRESETS[next]?.name || next}`);
        }
        return;
      }

      // Z: Zen Cinematic Tour
      if (key === 'z') {
        const next = sceneManager?.toggleZenTour() ?? !isZenTour;
        setIsZenTour(next);
        if (next) {
          setInspectedOrganism(null);
        }
        showHotkeyFeedback('Z', `Zen Cinematic Tour: ${next ? 'ON' : 'OFF'}`);
        return;
      }

      // P: High-Res Photo Snapshot
      if (key === 'p') {
        handleCaptureSnapshot();
        showHotkeyFeedback('P', 'High-Res Photo Snapshot Captured');
        return;
      }

      // L: Desk Reading Lamp
      if (key === 'l') {
        if (sceneManager) {
          const newState = sceneManager.toggleDeskLamp();
          setDeskLampOn(newState);
          showHotkeyFeedback('L', `Desk Reading Lamp: ${newState ? 'ON' : 'OFF'}`);
        }
        return;
      }

      // T: Toggle 4D Time Toolbar (Expand / Collapse)
      if (key === 't') {
        setIsTimeToolbarExpanded((prev) => {
          const next = !prev;
          showHotkeyFeedback('T', `4D Time Toolbar: ${next ? 'Expanded' : 'Collapsed'}`);
          return next;
        });
        return;
      }

      // 1 - 4: Lighting Presets
      if (key === '1' || code === 'Digit1' || code === 'Numpad1') {
        handleSelectLighting('daylight');
        showHotkeyFeedback('1', 'Lighting: Daylight');
        return;
      }
      if (key === '2' || code === 'Digit2' || code === 'Numpad2') {
        handleSelectLighting('sunset');
        showHotkeyFeedback('2', 'Lighting: Golden Sunset');
        return;
      }
      if (key === '3' || code === 'Digit3' || code === 'Numpad3') {
        handleSelectLighting('bioluminescent');
        showHotkeyFeedback('3', 'Lighting: Bioluminescent Deep');
        return;
      }
      if (key === '4' || code === 'Digit4' || code === 'Numpad4') {
        handleSelectLighting('midnight');
        showHotkeyFeedback('4', 'Lighting: Midnight Moon');
        return;
      }

      // B: Benchmark HUD
      if (key === 'b') {
        setShowBenchmark((prev) => {
          showHotkeyFeedback('B', `Benchmark Diagnostics HUD: ${!prev ? 'OPEN' : 'CLOSED'}`);
          return !prev;
        });
        return;
      }

      // E: Ecosystem Inspector HUD
      if (key === 'e') {
        setShowEcology((prev) => {
          showHotkeyFeedback('E', `Ecosystem Inspector: ${!prev ? 'OPEN' : 'CLOSED'}`);
          return !prev;
        });
        return;
      }

      // ? or /: Shortcuts Help
      if (key === '?' || key === '/' || code === 'Slash') {
        setShowShortcuts((prev) => !prev);
        return;
      }

      // Escape: Close active overlays
      if (key === 'escape' || code === 'Escape') {
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

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [timeDirection, sceneManager, isZenTour, inspectedOrganism, showShortcuts, showBenchmark, showBotanical, showEcology]);

  return (
    <main
      tabIndex={0}
      onPointerDown={() => {
        try {
          window.focus();
        } catch {
          // ignore
        }
      }}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none focus:outline-none"
    >
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
        cameraPresetName={CAMERA_PRESETS[activeCameraPreset]?.name}
        onCycleCameraPreset={handleCycleCameraPreset}
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

      {/* Bottom 4D Temporal Timeline (Collapsed by default) */}
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
        isExpanded={isTimeToolbarExpanded}
        onToggleExpanded={setIsTimeToolbarExpanded}
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

      {/* Floating HUD Hotkey Confirmation Toast */}
      {hotkeyToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 shadow-[0_0_24px_rgba(6,182,212,0.3)] text-white text-xs font-medium">
            <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-mono text-[11px] font-bold">
              {hotkeyToast.key}
            </span>
            <span className="text-slate-200">{hotkeyToast.label}</span>
          </div>
        </div>
      )}

      {/* Subtle bottom room ambient vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />
    </main>
  );
}
