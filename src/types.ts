/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SpeciesType =
  | 'titan_discus'
  | 'celestial_ray'
  | 'neon_tetra'
  | 'golden_guppy'
  | 'azure_discus'
  | 'bioluminescent_tang';

export type BoidScaleRegime = 'macro_pelagic' | 'meso_schooling' | 'micro_firefly';

export type ProcessRegimePreset = 'balanced' | 'firefly_bloom' | 'leviathan_abyss' | 'schooling_frenzy';

export interface BoidSpeciesConfig {
  name: string;
  regime: BoidScaleRegime;
  bodyColor: [number, number, number]; // RGB 0-1
  stripeColor: [number, number, number];
  finColor: [number, number, number];
  bioluminescentColor: [number, number, number];
  baseScale: number;
  maxSpeed: number;
  tailWagFrequency: number;
  description?: string;
}

export interface Boid4D {
  // 4D Position
  x: number;
  y: number;
  z: number;
  w: number; // 4th dimension (temporal coordinate)

  // 4D Velocity
  vx: number;
  vy: number;
  vz: number;
  vw: number;

  // Species & visual state
  speciesIndex: number;
  regime: BoidScaleRegime;
  scale: number;
  swimPhase: number;
  speed: number;
  temporalAlpha: number; // Visibility fade based on |w - currentTime|
  bioluminescence: number; // 0-1 pulse
  mass: number; // Inertial mass for multi-scalar momentum dynamics

  // Subtle Kinematic & Biological Behaviors
  burstPhase?: number; // Burst-and-coast propulsion cycle (0-1)
  isBursting?: boolean; // Currently flapping caudal fin vs low-drag coasting
  curiosityTimer?: number; // Duration remaining investigating reef/substrate/cursor
  curiosityTarget?: { x: number; y: number; z: number };
}

export interface FireflyBoid4D {
  id: number;
  x: number;
  y: number;
  z: number;
  w: number;
  vx: number;
  vy: number;
  vz: number;
  vw: number;
  flashPhase: number; // Kuramoto oscillator phase [0, 2*PI)
  naturalFrequency: number; // Intrinsic flash cycle speed
  flashIntensity: number; // Instantaneous brightness 0-1
  scale: number; // Micro-scale 0.12 - 0.24
  colorType: number; // 0: lime green, 1: electric cyan, 2: warm amber
  temporalAlpha: number;
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  z: number;
  w: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  nutrition: number;
  createdAt: number;
}

export type LightingPreset = 'daylight' | 'sunset' | 'bioluminescent' | 'midnight';

export interface LightingConfig {
  preset: LightingPreset;
  deskLampOn: boolean;
  waterTurbidity: number; // 0-1 light scattering turbidity
  causticIntensity: number; // 0-1
  godRayIntensity: number; // 0-1
  bioluminescenceStrength: number; // 0-1
  ambientIntensity: number;
}

export interface TankBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  minW: number; // Temporal loop minimum
  maxW: number; // Temporal loop maximum
}

export type InteractionTool = 'inspect' | 'feed' | 'clean_glass' | 'stir_water' | 'wafer';

export interface DayNightCycleConfig {
  enabled: boolean;
  periodSeconds: number; // Duration of full 24h cycle in seconds
  currentPhase: number; // 0.0 to 1.0 (0=Dawn, 0.25=Noon, 0.5=Sunset, 0.72=Twilight, 0.88=Midnight)
}

export interface FireflyCycleConfig {
  enabled: boolean;
  periodSeconds: number; // Duration of firefly population ebb and flow
  currentPhase: number; // 0.0 to 2*PI
  minCount: number; // Minimum fireflies at cycle trough
  maxCount: number; // Maximum fireflies at cycle bloom peak
}

export type MicroFaunaCategory = 'crab' | 'snail' | 'shrimp' | 'medusa';

export type MicroFaunaSpecies =
  | 'hermit_crab'
  | 'shore_crab'
  | 'nerite_snail'
  | 'mystery_snail'
  | 'ghost_shrimp'
  | 'hydromedusa';

export type MicroFaunaState =
  | 'foraging'
  | 'seeking_food'
  | 'eating'
  | 'defensive'
  | 'resting'
  | 'gliding'
  | 'grazing'
  | 'retracted'
  | 'perched'
  | 'hovering'
  | 'escape_dart'
  | 'contracting'
  | 'relaxing'
  | 'drifting';

export interface MicroFaunaEntity {
  id: string;
  category: MicroFaunaCategory;
  species: MicroFaunaSpecies;
  name: string;

  // 3D coordinates & motion
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotationY: number;
  pitch: number;
  roll: number;

  // Navigation targets
  targetX: number;
  targetY: number;
  targetZ: number;

  // Behavior state machine
  state: MicroFaunaState;
  stateTimer: number; // Duration remaining in state
  energy: number; // 0-100%
  sizeScale: number;

  // Surface attachment (for snails & perching shrimp)
  attachedSurface: 'sand' | 'front_glass' | 'back_glass' | 'left_glass' | 'right_glass' | 'rock' | 'free_water';

  // Animation cycle clocks
  animCycle: number;
  secondaryCycle: number;
  alertness: number; // 0 (calm) to 1 (alert / threatened)

  // Jellyfish soft-body dynamics
  constriction?: number; // -0.4 (flared) to 1.0 (constricted)
  strokePhase?: number; // 0 to 1
  pulseIntensity?: number; // 1.0 normal, 1.8 escape
  escapePulsesRemaining?: number;

  // Species-specific behavioral articulators
  eyestalkFlick?: number; // Crab eyestalk blinking/retraction timer
  radulaPhase?: number; // Snail mouth grazing & rasping cycle (0-1)
  pleopodPhase?: number; // Shrimp swimmeret flutter cycle
  abdomenFlex?: number; // Shrimp tail curl angle (0 = flat, >1 = curled/dart)
}

export interface MicroFaunaPopulationConfig {
  crabs: number;
  snails: number;
  shrimp: number;
  medusae: number;
}

export interface SimulationStats {
  fps: number;
  totalBoids: number;
  visibleBoids: number;
  macroCount: number;
  mesoCount: number;
  microCount: number;
  currentTimeW: number;
  timeDirection: number; // 1 = forward, -1 = reverse, 0 = paused
  timeSpeed: number;
  algaeCoverage: number; // 0-100%
  foodCount: number;
  kuramotoSync: number; // Flash phase coherence [0, 1]
  dayNightPhase: number;
  dayNightPeriod: number;
  dayNightEnabled: boolean;
  fireflyCyclePhase: number;
  fireflyCyclePeriod: number;
  fireflyCycleEnabled: boolean;
  fireflyMinCount: number;
  fireflyMaxCount: number;
  crabCount: number;
  snailCount: number;
  shrimpCount: number;
  medusaCount: number;
  totalMicroFauna: number;
}

export interface InspectedOrganism {
  id: string;
  type: 'boid' | 'microfauna';
  name: string;
  scientificName: string;
  category: string;
  speciesIndex?: number;
  description?: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  speed: number;
  w?: number;
  scale: number;
  state: string;
  energy: number; // 0 - 100
  alertness?: number; // 0 - 1
  colorHex?: string;
}
