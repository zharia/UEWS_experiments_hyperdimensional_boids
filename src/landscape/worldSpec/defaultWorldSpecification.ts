/**
 * Task 001 (v0.0.3) — Feature Registry v2: Rich Procedural Environment Architecture
 * Default World Specification: Concrete, versioned, rich environment specification.
 */

import { WorldSpecification } from './worldSpecTypes';

export function createDefaultWorldSpecification(seed: number = 1337): WorldSpecification {
  return {
    schemaVersion: '2.0.0',
    seed,
    metadata: {
      name: 'Benthic Substrate & Reef Trench Environment',
      description: 'A multi-zone marine environment with shelf, transitional reef wall, deep trench, and sediment fan.',
      author: 'AI Studio Simulation Architecture',
      created: '2026-10-05T00:00:00Z',
    },
    regions: [
      {
        id: 'REGION_WEST',
        name: 'Western Continental Shelf Region',
        bounds: { minX: -14.0, maxX: -4.0, minZ: -6.0, maxZ: 6.0 },
        depthRange: [-7.2, -5.8],
        theme: 'Rocky shelf with dense kelp canopy and migratory sand dunes',
        zones: [
          {
            id: 'ZONE_WEST_SHELF',
            name: 'Western Escarpment & Dune Shelf',
            parentId: 'REGION_WEST',
            bounds: { minX: -12.0, maxX: -5.0, minZ: -4.5, maxZ: 4.5 },
            dominantSubstrate: 'exposed_rock',
          },
        ],
      },
      {
        id: 'REGION_CENTRAL',
        name: 'Central Trench & Reef Nexus Region',
        bounds: { minX: -4.0, maxX: 4.0, minZ: -6.0, maxZ: 6.0 },
        depthRange: [-7.8, -6.0],
        theme: 'Deep central depression and coral holdfast mound',
        zones: [
          {
            id: 'ZONE_CENTRAL_REEF',
            name: 'Central Reef Mound & Arch Sanctuary',
            parentId: 'REGION_CENTRAL',
            bounds: { minX: -3.0, maxX: 3.0, minZ: -2.5, maxZ: 2.5 },
            dominantSubstrate: 'coral_rubble',
          },
          {
            id: 'ZONE_TRENCH_DEPTHS',
            name: 'Deep Benthic Sediment Trench',
            parentId: 'REGION_CENTRAL',
            bounds: { minX: -2.0, maxX: 2.0, minZ: -5.5, maxZ: -1.0 },
            dominantSubstrate: 'silt',
          },
        ],
      },
      {
        id: 'REGION_EAST',
        name: 'Eastern Substrate Plateau Region',
        bounds: { minX: 4.0, maxX: 14.0, minZ: -6.0, maxZ: 6.0 },
        depthRange: [-6.8, -5.5],
        theme: 'Sandy rise shelf with sponge gardens and deltaic fan',
        zones: [
          {
            id: 'ZONE_EAST_PLATEAU',
            name: 'Eastern Benthic Sand Shelf & Sponge Garden',
            parentId: 'REGION_EAST',
            bounds: { minX: 5.0, maxX: 12.0, minZ: -4.0, maxZ: 4.0 },
            dominantSubstrate: 'sand',
          },
        ],
      },
    ],
    populations: [
      {
        id: 'POP_BOULDERS_WEST',
        name: 'Western Shelf Boulder Outcrops',
        domain: 'structure',
        kind: 'boulder',
        archetypes: ['boulder', 'rounded'],
        count: 3,
        spatialBounds: { minX: -11.0, maxX: -5.5, minZ: -3.5, maxZ: 2.5 },
        sizeDistribution: {
          minScale: { x: 0.9, y: 0.7, z: 0.9 },
          maxScale: { x: 1.6, y: 1.3, z: 1.5 },
        },
        seed: seed + 301,
        wRange: [-30, 80],
        parentId: 'ZONE_WEST_SHELF',
        baseEmbedding: 0.22,
      },
      {
        id: 'POP_SLABS_EAST',
        name: 'Eastern Plateau Structural Slabs',
        domain: 'structure',
        kind: 'slab',
        archetypes: ['slab', 'angular'],
        count: 3,
        spatialBounds: { minX: 5.5, maxX: 10.5, minZ: -2.5, maxZ: 3.0 },
        sizeDistribution: {
          minScale: { x: 1.0, y: 0.5, z: 0.8 },
          maxScale: { x: 1.7, y: 0.9, z: 1.4 },
        },
        seed: seed + 302,
        wRange: [-20, 90],
        parentId: 'ZONE_EAST_PLATEAU',
        baseEmbedding: 0.2,
      },
    ],
  };
}
