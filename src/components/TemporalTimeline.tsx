/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { FastForward, Ghost, Pause, Play, RotateCcw } from 'lucide-react';
import { BoidSimulation4D } from '../simulation/boids4D';
import { aquariumAudio } from '../audio/aquariumAudio';

interface TemporalTimelineProps {
  boidSim: BoidSimulation4D;
  currentTimeW: number;
  timeDirection: number;
  timeSpeed: number;
  showEchoes: boolean;
  onScrubTime: (val: number) => void;
  onTogglePlay: (dir: number) => void;
  onSetSpeed: (speed: number) => void;
  onToggleEchoes: () => void;
}

export const TemporalTimeline: React.FC<TemporalTimelineProps> = ({
  boidSim,
  currentTimeW,
  timeDirection,
  timeSpeed,
  showEchoes,
  onScrubTime,
  onTogglePlay,
  onSetSpeed,
  onToggleEchoes,
}) => {
  const speeds = [3.0, 6.0, 12.0, 24.0];
  const lastChimeRef = useRef<number>(0);

  const handleScrub = (val: number) => {
    onScrubTime(val);
    const now = performance.now();
    if (now - lastChimeRef.current > 160) {
      lastChimeRef.current = now;
      aquariumAudio.playTemporalChime();
    }
  };

  const handlePlayClick = (dir: number) => {
    onTogglePlay(dir);
    if (dir !== 0) {
      aquariumAudio.playTemporalChime(dir > 0 ? 1.0 : 0.8);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-2xl bg-slate-900/85 backdrop-blur-md rounded-2xl p-3 border border-slate-700/60 shadow-2xl flex flex-col gap-2">
      {/* Top row: Label, Time scrub slider, Value */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-cyan-400 font-semibold tracking-wider uppercase whitespace-nowrap">
          4D Time Slice
        </span>

        {/* Temporal Scrubber */}
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={boidSim.bounds.minW}
            max={boidSim.bounds.maxW}
            step={0.1}
            value={currentTimeW}
            onChange={(e) => handleScrub(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
          {/* Subtle indicator ticks */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] pointer-events-none"
            style={{
              left: `${((currentTimeW - boidSim.bounds.minW) / (boidSim.bounds.maxW - boidSim.bounds.minW)) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        <span className="text-xs font-mono text-cyan-300 w-12 text-right">
          {currentTimeW.toFixed(1)}&tau;
        </span>
      </div>

      {/* Bottom row: Playback transport & temporal modes */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        {/* Playback Controls */}
        <div className="flex items-center gap-1">
          {/* Reverse */}
          <button
            onClick={() => handlePlayClick(-1)}
            title="Reverse 4D Temporal Flow"
            className={`p-1.5 rounded-lg border transition-all ${
              timeDirection === -1
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Pause */}
          <button
            onClick={() => handlePlayClick(0)}
            title="Freeze 4D Time"
            className={`p-1.5 rounded-lg border transition-all ${
              timeDirection === 0
                ? 'bg-amber-950 text-amber-300 border-amber-700 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
          </button>

          {/* Forward */}
          <button
            onClick={() => handlePlayClick(1)}
            title="Forward 4D Temporal Flow"
            className={`p-1.5 rounded-lg border transition-all ${
              timeDirection === 1
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700 shadow-sm'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>

        {/* Speed presets */}
        <div className="flex items-center gap-1">
          <FastForward className="w-3 h-3 text-slate-500 mr-0.5" />
          {speeds.map((s, idx) => {
            const labels = ['0.5x', '1x', '2x', '4x'];
            const active = timeSpeed === s;
            return (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-600/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
                }`}
              >
                {labels[idx]}
              </button>
            );
          })}
        </div>

        {/* 4D Echoes / Hyperplane toggle */}
        <button
          onClick={onToggleEchoes}
          title="Toggle 4D Past/Future Echoes (faint ghost trails of boids in other time slices)"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono transition-all ${
            showEchoes
              ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
              : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Ghost className="w-3.5 h-3.5" />
          <span>4D Echoes</span>
        </button>
      </div>
    </div>
  );
};
