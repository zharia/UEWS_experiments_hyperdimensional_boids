/**
 * Task 007 — Dynamic 4D Landscape Evolution, Geometry & Topology
 * Type definitions for the 4D landscape subsystem.
 */

export type FeatureClassification = 'flat' | 'ridge' | 'valley' | 'basin' | 'saddle' | 'peak';

export type LandscapeFeatureCategory =
  | 'terrain'
  | 'rock'
  | 'formation'
  | 'reef_structure'
  | 'flora_anchor';

export type TopologyRelationType =
  | 'supported_by'
  | 'adjacent_to'
  | 'attached_to'
  | 'rooted_on';

export interface TopologyRelation {
  targetId: string;
  relation: TopologyRelationType;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Vector4D {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface LandscapeFeatureState {
  id: string;
  name: string;
  category: LandscapeFeatureCategory;
  position4D: Vector4D;
  scale4D: Vector4D;
  wRange: [number, number];
  visible: boolean;
  projectedPosition: Vector3D;
  projectedScale: Vector3D;
  projectedRotation: Vector3D;
  curvature: number;
  deformation: Vector3D;
  topologyRelations: TopologyRelation[];
  sliceProgress: number;
  surfaceElevation: number;
  embeddingDepth: number;
}

export interface SurfaceResolution {
  elevation: number;
  normal: Vector3D;
  curvature: number;
  flowDelta: Vector3D;
  gradient: { dx: number; dz: number };
}

export interface GeometricValidationIssue {
  featureId: string;
  type:
    | 'nan_or_infinite'
    | 'degenerate_scale'
    | 'out_of_bounds'
    | 'unsupported_floating'
    | 'terrain_penetration';
  message: string;
}

export interface GeometricValidationReport {
  isValid: boolean;
  issues: GeometricValidationIssue[];
  timestamp: number;
}

export interface LandscapeFeature {
  id: string; // e.g. 'RIDGE_001', 'BASIN_001'
  name: string;
  type: FeatureClassification;
  centroid: { x: number; y: number; z: number };
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number; minY: number; maxY: number };
  neighbors: string[]; // Adjacent feature IDs
  meanHeight: number;
  meanCurvature: number;
  dominantCurvatureAxis: { x: number; z: number };
}

export interface LandscapeTopology {
  features: LandscapeFeature[];
  adjacency: Record<string, string[]>;
  connectedComponents: number;
  isInvariant: boolean;
  lastTopologyCheck: number;
  mutationHistory: Array<{ timestamp: number; description: string }>;
}

export interface CurvatureField {
  meanCurvature: number;
  laplacian: number;
  maxLaplacian: number;
  minLaplacian: number;
  classificationAt: (x: number, z: number) => FeatureClassification;
}

export interface DistortionSample {
  D: number; // Beltrami dilatation distortion metric in [0, 1)
  sigmaMax: number; // Principal stretch major axis
  sigmaMin: number; // Principal stretch minor axis
  angle: number; // Principal axis orientation angle
}

export interface DistortionField {
  maxAllowedDistortion: number; // D_max upper bound
  currentMaxDistortion: number;
  averageDistortion: number;
  conformalDeviation: number; // Cauchy-Riemann error measure
  sampleDistortionAt: (x: number, z: number) => DistortionSample;
}

export type DeformationModeType =
  | 'breathing'
  | 'ridge_migration'
  | 'basin_expansion'
  | 'conformal_wave'
  | 'quasi_conformal_pulse'
  | 'curvature_flow';

export interface DeformationMode {
  id: string;
  type: DeformationModeType;
  name: string;
  amplitude: number;
  frequencyW: number;
  phase: number;
  active: boolean;
  evaluate: (x: number, z: number, w: number) => { dx: number; dy: number; dz: number };
}

export interface LandscapeEvolutionState {
  traversalVelocity: number; // v_w (units of 4D time per simulation second)
  conformalStrength: number;
  quasiConformalStrength: number;
  curvatureStrength: number;
  modes: DeformationMode[];
}

export interface LandscapeGeometry {
  time4D: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  sampleHeight: (x: number, z: number) => number;
  sampleNormal: (x: number, z: number) => { x: number; y: number; z: number };
  sampleGradient: (x: number, z: number) => { dx: number; dz: number };
  sampleHessian: (x: number, z: number) => { dxx: number; dzz: number; dxz: number };
}

export interface LandscapeState {
  time4D: number;
  topology: LandscapeTopology;
  geometry: LandscapeGeometry;
  evolution: LandscapeEvolutionState;
  curvature: CurvatureField;
  distortion: DistortionField;
  features: LandscapeFeature[];
}

export interface LandscapeDiagnostics {
  time4D: number;
  traversalVelocity: number;
  conformalStrength: number;
  conformalDeviation: number;
  quasiConformalStrength: number;
  maxLocalDistortion: number;
  curvatureStrength: number;
  meanCurvatureMagnitude: number;
  topologyPreserved: boolean;
  activeModeCount: number;
  rootMeanSquareDisplacement: number;
}
