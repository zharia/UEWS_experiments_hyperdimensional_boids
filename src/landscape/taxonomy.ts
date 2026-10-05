/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * Environmental Taxonomy: Domains, Kinds, Archetypes, and Category mappings.
 */

import { LandscapeFeatureCategory } from './types';

export type FeatureDomain =
  | 'geology'
  | 'geomorphology'
  | 'substrate'
  | 'structure'
  | 'habitat'
  | 'vegetation'
  | 'colony'
  | 'ecological'
  | 'phenomenon';

export type GeologyFeatureKind =
  | 'formation'
  | 'strata'
  | 'shelf'
  | 'basin'
  | 'trench'
  | 'ridge'
  | 'escarpment'
  | 'plateau'
  | 'channel'
  | 'gully'
  | 'sediment_fan'
  | 'deposit';

export type StructureFeatureKind =
  | 'rock'
  | 'boulder'
  | 'slab'
  | 'pillar'
  | 'pinnacle'
  | 'outcrop'
  | 'arch'
  | 'overhang'
  | 'cavern'
  | 'rubble_field'
  | 'reef'
  | 'reef_wall'
  | 'reef_mound'
  | 'reef_ridge';

export type SubstrateFeatureKind =
  | 'sand'
  | 'gravel'
  | 'silt'
  | 'mud'
  | 'exposed_rock'
  | 'shell_bed'
  | 'organic_detritus';

export type BiologyFeatureKind =
  | 'coral_colony'
  | 'sponge_colony'
  | 'kelp_forest'
  | 'seagrass_meadow'
  | 'algae_bed'
  | 'anemone_field'
  | 'microbial_mat'
  | 'flora_anchor';

export type HabitatFeatureKind =
  | 'shelter_zone'
  | 'nursery_zone'
  | 'feeding_ground'
  | 'spawning_ground'
  | 'cleaning_station'
  | 'territorial_zone';

export type PhenomenonFeatureKind =
  | 'current'
  | 'upwelling'
  | 'sediment_plume'
  | 'particulate_bloom'
  | 'bubble_field'
  | 'thermal_vent'
  | 'disturbance_zone';

export type FeatureKind =
  | GeologyFeatureKind
  | StructureFeatureKind
  | SubstrateFeatureKind
  | BiologyFeatureKind
  | HabitatFeatureKind
  | PhenomenonFeatureKind;

export type RockArchetype =
  | 'rounded'
  | 'angular'
  | 'slab'
  | 'shard'
  | 'pillar'
  | 'pinnacle'
  | 'boulder'
  | 'plate'
  | 'outcrop'
  | 'rubble'
  | 'fragment';

export type ReefArchetype =
  | 'mound'
  | 'ridge'
  | 'wall'
  | 'pillar'
  | 'arch'
  | 'bridge'
  | 'overhang'
  | 'cavern'
  | 'labyrinth'
  | 'rubble';

export type CoralMorphologyArchetype =
  | 'branching'
  | 'brain'
  | 'plate'
  | 'table'
  | 'fan'
  | 'tube'
  | 'massive'
  | 'encrusting';

export type VegetationMorphologyArchetype =
  | 'kelp_blade'
  | 'seagrass_shoot'
  | 'cabomba_stem'
  | 'anemone_tentacle'
  | 'turf_mat';

export type MorphologyArchetype =
  | RockArchetype
  | ReefArchetype
  | CoralMorphologyArchetype
  | VegetationMorphologyArchetype
  | string;

export type FeatureRelationshipType =
  | 'embedded-in'
  | 'attached-to'
  | 'rooted-in'
  | 'supported-by'
  | 'sheltered-by'
  | 'inside'
  | 'near'
  | 'associated-with'
  | 'derived-from'
  | 'feeds-from'
  | 'grows-on'
  | 'surrounds'
  | 'connects-to'
  | 'adjacent_to'
  | 'supports'
  | 'rooted_on';

export const VALID_DOMAINS: ReadonlySet<FeatureDomain> = new Set([
  'geology',
  'geomorphology',
  'substrate',
  'structure',
  'habitat',
  'vegetation',
  'colony',
  'ecological',
  'phenomenon',
]);

export const VALID_KINDS_BY_DOMAIN: Record<FeatureDomain, ReadonlySet<FeatureKind>> = {
  geology: new Set<FeatureKind>([
    'formation',
    'strata',
    'shelf',
    'basin',
    'trench',
    'ridge',
    'escarpment',
    'plateau',
    'channel',
    'gully',
    'sediment_fan',
    'deposit',
  ]),
  geomorphology: new Set<FeatureKind>([
    'formation',
    'shelf',
    'basin',
    'trench',
    'ridge',
    'escarpment',
    'plateau',
    'channel',
    'gully',
    'sediment_fan',
    'deposit',
  ]),
  substrate: new Set<FeatureKind>([
    'sand',
    'gravel',
    'silt',
    'mud',
    'exposed_rock',
    'shell_bed',
    'organic_detritus',
  ]),
  structure: new Set<FeatureKind>([
    'rock',
    'boulder',
    'slab',
    'pillar',
    'pinnacle',
    'outcrop',
    'arch',
    'overhang',
    'cavern',
    'rubble_field',
    'reef',
    'reef_wall',
    'reef_mound',
    'reef_ridge',
  ]),
  habitat: new Set<FeatureKind>([
    'shelter_zone',
    'nursery_zone',
    'feeding_ground',
    'spawning_ground',
    'cleaning_station',
    'territorial_zone',
  ]),
  vegetation: new Set<FeatureKind>([
    'kelp_forest',
    'seagrass_meadow',
    'algae_bed',
    'anemone_field',
    'microbial_mat',
    'flora_anchor',
  ]),
  colony: new Set<FeatureKind>([
    'coral_colony',
    'sponge_colony',
    'anemone_field',
    'microbial_mat',
  ]),
  ecological: new Set<FeatureKind>([
    'shelter_zone',
    'nursery_zone',
    'feeding_ground',
    'spawning_ground',
    'cleaning_station',
    'territorial_zone',
  ]),
  phenomenon: new Set<FeatureKind>([
    'current',
    'upwelling',
    'sediment_plume',
    'particulate_bloom',
    'bubble_field',
    'thermal_vent',
    'disturbance_zone',
  ]),
};

/**
 * Maps modern domain & kind to backward-compatible legacy LandscapeFeatureCategory.
 */
export function mapToLegacyCategory(domain: FeatureDomain, kind: FeatureKind): LandscapeFeatureCategory {
  if (domain === 'structure') {
    if (kind === 'reef' || kind === 'reef_mound' || kind === 'reef_wall' || kind === 'reef_ridge' || kind === 'arch' || kind === 'overhang' || kind === 'cavern') {
      return 'reef_structure';
    }
    return 'rock';
  }
  if (domain === 'geology' || domain === 'geomorphology') {
    return 'formation';
  }
  if (domain === 'vegetation' || domain === 'colony') {
    return 'flora_anchor';
  }
  return 'terrain';
}
