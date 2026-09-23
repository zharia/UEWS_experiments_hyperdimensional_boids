/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { InteractionTool } from '../types';
import { ProceduralFloraSimulation } from '../simulation/flora';
import { AquariumSceneManager } from '../rendering/aquariumScene';
import { aquariumAudio } from '../audio/aquariumAudio';

interface FloraOverlayProps {
  currentTool: InteractionTool;
  floraSim: ProceduralFloraSimulation;
  sceneManager: AquariumSceneManager | null;
}

export const FloraOverlay: React.FC<FloraOverlayProps> = ({
  currentTool,
  floraSim,
  sceneManager,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [cleanerPos, setCleanerPos] = useState<{ x: number; y: number } | null>(null);
  const [inspectorPos, setInspectorPos] = useState<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sceneManager || !containerRef.current) return;

    if (currentTool === 'inspect') {
      sceneManager.raycastOrganism(e.clientX, e.clientY);
    } else if (currentTool === 'feed') {
      sceneManager.dropFoodAtScreen(e.clientX, e.clientY);
    } else if (currentTool === 'wafer') {
      sceneManager.dropSubstrateWafer(e.clientX, e.clientY);
    } else if (currentTool === 'clean_glass') {
      setIsCleaning(true);
      cleanAt(e.clientX, e.clientY);
    } else if (currentTool === 'stir_water') {
      sceneManager.stirWaterAtScreen(e.clientX, e.clientY);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sceneManager || !containerRef.current) return;

    if (currentTool === 'inspect') {
      setInspectorPos({ x: e.clientX, y: e.clientY });
    } else if (currentTool === 'clean_glass') {
      setCleanerPos({ x: e.clientX, y: e.clientY });
      if (isCleaning) {
        cleanAt(e.clientX, e.clientY);
      }
    } else if (currentTool === 'stir_water' && e.buttons > 0) {
      sceneManager.stirWaterAtScreen(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    setIsCleaning(false);
  };

  const handlePointerLeave = () => {
    setIsCleaning(false);
    setCleanerPos(null);
    setInspectorPos(null);
  };

  const cleanAt = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Map screen coordinate to front glass texture dimensions
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    // Approximate front glass UV region in center of viewport
    const canvasX = relX * floraSim.width;
    const canvasY = relY * floraSim.height;

    floraSim.cleanRadius(canvasX, canvasY, 44);
    aquariumAudio.playGlassScrape();
  };

  const handleDoubleClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sceneManager) return;
    // On double click, if organism clicked, inspect it; otherwise stir water
    const clickedOrg = sceneManager.raycastOrganism(e.clientX, e.clientY);
    if (!clickedOrg) {
      sceneManager.stirWaterAtScreen(e.clientX, e.clientY);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onDoubleClick={handleDoubleClick}
      className={`absolute inset-0 z-10 ${
        currentTool === 'clean_glass'
          ? 'cursor-none'
          : currentTool === 'inspect'
          ? 'cursor-crosshair'
          : currentTool === 'feed' || currentTool === 'wafer'
          ? 'cursor-crosshair'
          : currentTool === 'stir_water'
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-default'
      }`}
    >
      {/* Reticle indicator following cursor in inspect mode */}
      {currentTool === 'inspect' && inspectorPos && (
        <div
          className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-75"
          style={{ left: `${inspectorPos.x}px`, top: `${inspectorPos.y}px` }}
        >
          <div className="w-10 h-10 rounded-full border border-sky-400/60 flex items-center justify-center animate-pulse">
            <div className="w-2 h-2 rounded-full bg-sky-400/80" />
            <div className="absolute top-0 bottom-0 w-[1px] bg-sky-400/40" />
            <div className="absolute left-0 right-0 h-[1px] bg-sky-400/40" />
          </div>
          <span className="absolute -bottom-5 text-[9px] font-mono uppercase tracking-widest text-sky-300 whitespace-nowrap bg-slate-950/80 px-1.5 py-0.2 rounded border border-sky-800/50">
            Target Focus
          </span>
        </div>
      )}

      {/* Magnetic Glass Cleaner puck indicator following cursor */}
      {currentTool === 'clean_glass' && cleanerPos && (
        <div
          className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform duration-75"
          style={{ left: `${cleanerPos.x}px`, top: `${cleanerPos.y}px` }}
        >
          {/* Outer magnetic felt block */}
          <div
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-2xl transition-all ${
              isCleaning
                ? 'bg-emerald-500/30 border-emerald-400 scale-95 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
                : 'bg-slate-800/80 border-slate-400 scale-100'
            }`}
          >
            {/* Magnetic handle grip */}
            <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-600 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>
          {/* Glass scraper label */}
          <span className="absolute -bottom-6 text-[10px] font-mono uppercase tracking-widest text-emerald-300 whitespace-nowrap bg-slate-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
            Magnetic Cleaner
          </span>
        </div>
      )}
    </div>
  );
};
