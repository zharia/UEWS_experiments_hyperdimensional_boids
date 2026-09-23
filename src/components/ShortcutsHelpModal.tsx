/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keyLabel: string;
  action: string;
  category: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keyLabel: 'Space', action: 'Toggle Simulation Play / Pause', category: 'Time & Physics' },
  { keyLabel: 'I', action: 'Inspect & Select Organism Tool', category: 'Interaction' },
  { keyLabel: 'F', action: 'Feed Flakes Tool (Surface Pellets)', category: 'Interaction' },
  { keyLabel: 'W', action: 'Substrate Wafer Tool (Benthic Crabs)', category: 'Interaction' },
  { keyLabel: 'C', action: 'Clean Glass Scrubber Tool', category: 'Interaction' },
  { keyLabel: 'S', action: 'Stir Water Currents & Tap Glass', category: 'Interaction' },
  { keyLabel: 'Z', action: 'Toggle Ambient Zen Cinematic Tour', category: 'Camera & Visuals' },
  { keyLabel: 'P', action: 'Capture High-Res Photo Snapshot', category: 'Camera & Visuals' },
  { keyLabel: 'L', action: 'Toggle Wood Desk Reading Lamp', category: 'Lighting' },
  { keyLabel: '1', action: 'Daylight Lighting Preset', category: 'Lighting' },
  { keyLabel: '2', action: 'Sunset Lighting Preset', category: 'Lighting' },
  { keyLabel: '3', action: 'Bioluminescent Twilight Preset', category: 'Lighting' },
  { keyLabel: '4', action: 'Midnight Abyssal Preset', category: 'Lighting' },
  { keyLabel: 'B', action: 'Performance Benchmarking HUD', category: 'Diagnostics' },
  { keyLabel: 'E', action: 'Ecosystem Intelligence & Causal Ledger', category: 'Diagnostics' },
  { keyLabel: 'Esc', action: 'Deselect Organism / Close Modals', category: 'General' },
];

export const ShortcutsHelpModal: React.FC<ShortcutsHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 id="shortcuts-title" className="text-base font-semibold text-white font-['Space_Grotesk']">
                Keyboard Controls & Hotkeys
              </h2>
              <p className="text-xs text-slate-400 font-['Plus_Jakarta_Sans']">
                Quick tactile shortcuts for aquarium navigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list grouped by category */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {categories.map((cat) => (
            <div key={cat} className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/90 font-semibold block">
                {cat}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {SHORTCUTS.filter((s) => s.category === cat).map((s) => (
                  <div
                    key={s.keyLabel}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <span className="text-slate-300 pr-2">{s.action}</span>
                    <kbd className="px-2 py-0.5 rounded-md bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700 shadow-sm shrink-0">
                      {s.keyLabel}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400">
          <span>Click on organisms directly to inspect them in 3D</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all cursor-pointer font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
