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
import { InteractionTool, LightingPreset, SimulationStats } from './types';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Core Simulation Singletons
  const [boidSim] = useState(() => new BoidSimulation4D(3, 190, 240));
  const [floraSim] = useState(() => new ProceduralFloraSimulation(1024, 512));
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
    setSceneManager(manager);

    // Telemetry update interval (runs at 3 Hz to minimize React state churn)
    const intervalId = setInterval(() => {
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        const nextDir = timeDirection === 0 ? 1 : 0;
        handleTogglePlay(nextDir);
      } else if (e.key === 'f' || e.key === 'F') {
        setCurrentTool('feed');
      } else if (e.key === 'c' || e.key === 'C') {
        setCurrentTool('clean_glass');
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeDirection, sceneManager]);

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
        onOpenBenchmark={() => setShowBenchmark(true)}
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

      {/* Performance Benchmarking & Hitch Diagnostics HUD Modal */}
      <BenchmarkPanel
        isOpen={showBenchmark}
        onClose={() => setShowBenchmark(false)}
      />

      {/* Subtle bottom room ambient vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.7)]" />
    </main>
  );
}
