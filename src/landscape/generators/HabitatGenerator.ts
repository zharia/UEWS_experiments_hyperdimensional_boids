/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * HabitatGenerator: Generates semantic ecological regions (shelter zones, nursery zones,
 * feeding grounds, spawning grounds) for fish and boids.
 */

import { HabitatRegion4DFeature, ILandscapeFeature } from '../LandscapeFeature';
import { FeatureGenerator, GenerationContext } from './FeatureGenerator';

export class HabitatGenerator implements FeatureGenerator<ILandscapeFeature> {
  public readonly id = 'GENERATOR_HABITAT';
  public readonly name = 'Habitat & Ecological Regions Generator';

  public generate(context: GenerationContext): ILandscapeFeature[] {
    const features: ILandscapeFeature[] = [];

    // 1. Central Complex Shelter Zone
    features.push(
      new HabitatRegion4DFeature({
        id: 'SHELTER_ZONE_CENTRAL_01',
        name: 'Central Reef Mound High-Shelter Sanctuary',
        kind: 'shelter_zone',
        position4D: { x: 0.0, y: -6.2, z: -1.2, w: 0.0 },
        scale4D: { x: 3.5, y: 1.5, z: 2.8, w: 100.0 },
        shelterCapacity: 15,
        wRange: [-100, 100],
        relationships: [
          { sourceId: 'SHELTER_ZONE_CENTRAL_01', targetId: 'STRUCTURE_001', type: 'sheltered-by' },
          { sourceId: 'SHELTER_ZONE_CENTRAL_01', targetId: 'ROCK_005', type: 'sheltered-by' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    // 2. Western Nursery Zone (protected kelp and escarpment juvenile sanctuary)
    features.push(
      new HabitatRegion4DFeature({
        id: 'NURSERY_ZONE_WEST_01',
        name: 'Western Kelp Canopy Juvenile Nursery',
        kind: 'nursery_zone',
        position4D: { x: -8.0, y: -6.4, z: -1.5, w: 20.0 },
        scale4D: { x: 3.2, y: 1.2, z: 2.5, w: 70.0 },
        shelterCapacity: 12,
        wRange: [-30, 85],
        relationships: [
          { sourceId: 'NURSERY_ZONE_WEST_01', targetId: 'KELP_FOREST_WEST_01', type: 'sheltered-by' },
          { sourceId: 'NURSERY_ZONE_WEST_01', targetId: 'FORMATION_WEST_SHELF', type: 'inside' },
        ],
        parentId: 'ZONE_WEST_SHELF',
      })
    );

    // 3. Northern Feeding Ground (productive current intersection)
    features.push(
      new HabitatRegion4DFeature({
        id: 'FEEDING_GROUND_NORTH_01',
        name: 'Northern Planktonic Benthic Feeding Ground',
        kind: 'feeding_ground',
        position4D: { x: 2.5, y: -6.6, z: 2.2, w: 35.0 },
        scale4D: { x: 4.0, y: 1.8, z: 3.0, w: 60.0 },
        shelterCapacity: 4,
        wRange: [-50, 95],
        relationships: [
          { sourceId: 'FEEDING_GROUND_NORTH_01', targetId: 'SEAGRASS_MEADOW_CENTRAL_01', type: 'associated-with' },
        ],
        parentId: 'ZONE_CENTRAL_REEF',
      })
    );

    // 4. Eastern Spawning Ground (sheltered plateau hollow)
    features.push(
      new HabitatRegion4DFeature({
        id: 'SPAWNING_GROUND_EAST_01',
        name: 'Eastern Deep Shelf Spawning Ground',
        kind: 'spawning_ground',
        position4D: { x: 6.5, y: -6.2, z: -0.5, w: 50.0 },
        scale4D: { x: 3.0, y: 1.2, z: 2.2, w: 50.0 },
        shelterCapacity: 8,
        wRange: [20, 80],
        relationships: [
          { sourceId: 'SPAWNING_GROUND_EAST_01', targetId: 'FORMATION_EAST_BANK', type: 'inside' },
        ],
        parentId: 'ZONE_EAST_PLATEAU',
      })
    );

    return features;
  }
}
