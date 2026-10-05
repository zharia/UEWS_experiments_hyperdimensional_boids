/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * PhenomenonGenerator: Generates dynamic environmental currents, upwellings,
 * sediment plumes, and bubble vents.
 */

import { DynamicPhenomenon4DFeature, ILandscapeFeature } from '../LandscapeFeature';
import { FeatureGenerator, GenerationContext } from './FeatureGenerator';

export class PhenomenonGenerator implements FeatureGenerator<ILandscapeFeature> {
  public readonly id = 'GENERATOR_PHENOMENON';
  public readonly name = 'Dynamic Environmental Phenomena Generator';

  public generate(context: GenerationContext): ILandscapeFeature[] {
    const features: ILandscapeFeature[] = [];

    // 1. Benthic Drift Bottom Current
    features.push(
      new DynamicPhenomenon4DFeature({
        id: 'CURRENT_BENTHIC_DRIFT_01',
        name: 'Main Longitudinal Benthic Flow Current',
        kind: 'current',
        position4D: { x: 0.0, y: -6.5, z: 0.0, w: 0.0 },
        scale4D: { x: 12.0, y: 1.5, z: 6.0, w: 100.0 },
        flowVelocity: { x: 0.18, y: 0.02, z: -0.05 },
        intensity: 0.85,
        wRange: [-1000, 1000],
        temporalInfluence: {
          frequency: 0.12,
          amplitude: 0.25,
          phase: 0.4,
          temporalBehavior: 'dynamic',
        },
        relationships: [
          { sourceId: 'CURRENT_BENTHIC_DRIFT_01', targetId: 'TERRAIN', type: 'surrounds' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    // 2. Trench Cold Upwelling Plume
    features.push(
      new DynamicPhenomenon4DFeature({
        id: 'UPWELLING_TRENCH_01',
        name: 'Central Trench Cold Nutrient Upwelling',
        kind: 'upwelling',
        position4D: { x: 0.5, y: -7.0, z: -2.0, w: 60.0 },
        scale4D: { x: 3.5, y: 3.0, z: 2.5, w: 35.0 },
        flowVelocity: { x: 0.02, y: 0.22, z: 0.04 },
        intensity: 0.9,
        wRange: [40, 80],
        temporalInfluence: {
          frequency: 0.18,
          amplitude: 0.35,
          phase: 1.2,
          temporalBehavior: 'dynamic',
        },
        relationships: [
          { sourceId: 'UPWELLING_TRENCH_01', targetId: 'FORMATION_CENTRAL_TRENCH', type: 'derived-from' },
        ],
        parentId: 'ZONE_TRENCH_DEPTHS',
      })
    );

    // 3. Sediment Suspension Plume
    features.push(
      new DynamicPhenomenon4DFeature({
        id: 'SEDIMENT_PLUME_EAST_01',
        name: 'Eastern Bank Fine Particulate Sediment Plume',
        kind: 'sediment_plume',
        position4D: { x: 5.0, y: -6.4, z: 1.0, w: 35.0 },
        scale4D: { x: 4.0, y: 1.8, z: 2.8, w: 40.0 },
        flowVelocity: { x: -0.08, y: 0.06, z: 0.1 },
        intensity: 0.7,
        wRange: [20, 60],
        temporalInfluence: {
          frequency: 0.15,
          amplitude: 0.3,
          phase: 2.1,
          temporalBehavior: 'dynamic',
        },
        relationships: [
          { sourceId: 'SEDIMENT_PLUME_EAST_01', targetId: 'DEPOSIT_SAND_FAN_01', type: 'associated-with' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    // 4. Benthic Gas Seep / Bubble Field
    features.push(
      new DynamicPhenomenon4DFeature({
        id: 'BUBBLE_FIELD_NEXUS_01',
        name: 'Central Nexus Substrate Micro-Bubble Vent',
        kind: 'bubble_field',
        position4D: { x: -1.0, y: -6.8, z: -2.2, w: 0.0 },
        scale4D: { x: 1.5, y: 2.5, z: 1.5, w: 100.0 },
        flowVelocity: { x: 0.01, y: 0.35, z: 0.01 },
        intensity: 0.8,
        wRange: [-100, 100],
        temporalInfluence: {
          frequency: 0.25,
          amplitude: 0.4,
          phase: 0.0,
          temporalBehavior: 'dynamic',
        },
        relationships: [
          { sourceId: 'BUBBLE_FIELD_NEXUS_01', targetId: 'STRUCTURE_001', type: 'near' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    return features;
  }
}
