/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BoidSpeciesConfig } from '../types';

export const SPECIES_CONFIGS: BoidSpeciesConfig[] = [
  {
    name: 'Titan Leviathan',
    regime: 'macro_pelagic',
    // Majestic apex solitary grazer: Imperial midnight indigo with burnished gold crest
    bodyColor: [0.12, 0.1, 0.28],
    stripeColor: [1.0, 0.78, 0.2],
    finColor: [0.28, 0.22, 0.52],
    bioluminescentColor: [1.0, 0.85, 0.25],
    baseScale: 2.7,
    maxSpeed: 2.2,
    tailWagFrequency: 2.4,
    description: 'Pelagic apex grazer with high momentum and serene cruising arcs.',
  },
  {
    name: 'Celestial Ray',
    regime: 'macro_pelagic',
    // Luminous ethereal deep abyssal cyan with constellations of cyan/white photophores
    bodyColor: [0.06, 0.28, 0.42],
    stripeColor: [0.35, 0.95, 0.95],
    finColor: [0.15, 0.55, 0.68],
    bioluminescentColor: [0.2, 1.0, 0.9],
    baseScale: 3.1,
    maxSpeed: 1.9,
    tailWagFrequency: 1.8,
    description: 'Stately glider with wide temporal wavelength and calm rhythmic sweeps.',
  },
  {
    name: 'Neon Tetra',
    regime: 'meso_schooling',
    // Vivid electric blue dorsal stripe, red belly, translucent fins
    bodyColor: [0.08, 0.52, 0.95],
    stripeColor: [0.98, 0.15, 0.28],
    finColor: [0.4, 0.8, 1.0],
    bioluminescentColor: [0.2, 0.8, 1.0],
    baseScale: 0.85,
    maxSpeed: 4.8,
    tailWagFrequency: 7.0,
    description: 'Fast, agile schooler with hyper-polarized cohesive flocking.',
  },
  {
    name: 'Golden Guppy',
    regime: 'meso_schooling',
    // Warm golden amber iridescent scales, warm orange-gold fins
    bodyColor: [0.95, 0.72, 0.18],
    stripeColor: [1.0, 0.42, 0.12],
    finColor: [1.0, 0.85, 0.4],
    bioluminescentColor: [1.0, 0.7, 0.2],
    baseScale: 1.0,
    maxSpeed: 4.2,
    tailWagFrequency: 6.0,
    description: 'Surface and mid-column grazer with active temporal exploration.',
  },
  {
    name: 'Azure Discus',
    regime: 'meso_schooling',
    // Royal deep sea cyan and indigo with glowing stripes
    bodyColor: [0.12, 0.82, 0.76],
    stripeColor: [0.18, 0.25, 0.88],
    finColor: [0.35, 0.92, 0.85],
    bioluminescentColor: [0.3, 1.0, 0.9],
    baseScale: 1.25,
    maxSpeed: 3.5,
    tailWagFrequency: 4.5,
    description: 'Mid-column schooling discus navigating between golden coral trees.',
  },
  {
    name: 'Bioluminescent Tang',
    regime: 'meso_schooling',
    // Deep twilight violet with intense neon magenta & cyan bioluminescent photophores
    bodyColor: [0.22, 0.08, 0.42],
    stripeColor: [0.95, 0.22, 0.85],
    finColor: [0.65, 0.2, 0.9],
    bioluminescentColor: [1.0, 0.3, 0.9],
    baseScale: 1.1,
    maxSpeed: 4.0,
    tailWagFrequency: 5.5,
    description: 'Deep nocturnal schooler glowing brightly in twilight and midnight.',
  },
];
