/**
 * Ecological Resources & Bio-cycling System.
 *
 * Models physical resource entities (food pellets, biofilm patches, shelter crevices)
 * and their coupling with environmental fields (nutrients, dissolved oxygen).
 */

import { Vector3D, IVector3D } from '../../space/physical/Vector3D';
import { ISpatialFieldProvider } from '../../space/fields/EnvironmentalField';

export type ResourceType = 'food_pellet' | 'biofilm_patch' | 'shelter_crevice' | 'vegetation_frond';

export interface EcologicalResource {
  id: string;
  type: ResourceType;
  position: Vector3D;
  quantity: number; // 0 to 1 (or mass)
  maxQuantity: number;
  regenerationRate: number; // units per second (e.g. algae regrowth)
  createdAt: number;
  decayTimeSeconds: number;
}

export interface IResourceSystemJSON {
  resources: {
    id: string;
    type: ResourceType;
    position: IVector3D;
    quantity: number;
    maxQuantity: number;
    regenerationRate: number;
    createdAt: number;
    decayTimeSeconds: number;
  }[];
}

export class ResourceSystem {
  public resources: EcologicalResource[] = [];

  constructor() {
    this.seedSheltersAndVegetation();
  }

  private seedSheltersAndVegetation() {
    // Reef shelter crevices
    this.resources.push({
      id: 'shelter_reef_left',
      type: 'shelter_crevice',
      position: new Vector3D(-6.0, -5.5, 0.0),
      quantity: 1.0,
      maxQuantity: 1.0,
      regenerationRate: 0,
      createdAt: 0,
      decayTimeSeconds: Infinity,
    });
    this.resources.push({
      id: 'shelter_reef_right',
      type: 'shelter_crevice',
      position: new Vector3D(6.0, -5.5, 0.0),
      quantity: 1.0,
      maxQuantity: 1.0,
      regenerationRate: 0,
      createdAt: 0,
      decayTimeSeconds: Infinity,
    });

    // Biofilm grazing patches on glass/rocks
    this.resources.push({
      id: 'biofilm_rock_center',
      type: 'biofilm_patch',
      position: new Vector3D(0.0, -6.2, 1.5),
      quantity: 0.8,
      maxQuantity: 1.0,
      regenerationRate: 0.005,
      createdAt: 0,
      decayTimeSeconds: Infinity,
    });
  }

  public addFoodPellet(pos: IVector3D, simTime: number, nutrition: number = 1.0): EcologicalResource {
    const pellet: EcologicalResource = {
      id: 'food_' + Math.random().toString(36).substring(2, 9),
      type: 'food_pellet',
      position: new Vector3D(pos.x, pos.y, pos.z),
      quantity: nutrition,
      maxQuantity: nutrition,
      regenerationRate: 0,
      createdAt: simTime,
      decayTimeSeconds: 45.0,
    };
    this.resources.push(pellet);
    return pellet;
  }

  public update(simDt: number, simTime: number, fields?: ISpatialFieldProvider): void {
    for (let i = this.resources.length - 1; i >= 0; i--) {
      const res = this.resources[i];

      // Sinking dynamics for food pellets
      if (res.type === 'food_pellet') {
        if (res.position.y > -6.5) {
          res.position.y -= 0.65 * simDt;
        }
        
        // Dissolve into water column if left unconsumed
        if (fields && Math.random() < 0.2) {
          fields.add(res.position.x, res.position.y, res.position.z, 'food', 0.01 * simDt);
        }

        if (simTime - res.createdAt > res.decayTimeSeconds) {
          // Food decomposes into organic nutrients
          if (fields) {
            fields.add(res.position.x, res.position.y, res.position.z, 'nutrients', 0.15);
          }
          this.resources.splice(i, 1);
          continue;
        }
      }

      // Regrow biofilm and vegetation
      if (res.regenerationRate > 0 && res.quantity < res.maxQuantity) {
        // Regeneration boosted by light and nutrients
        let boost = 1.0;
        if (fields) {
          const light = fields.sample(res.position.x, res.position.y, res.position.z, 'illumination');
          const nut = fields.sample(res.position.x, res.position.y, res.position.z, 'nutrients');
          boost = (0.5 + light) * (0.5 + nut);
        }
        res.quantity = Math.min(res.maxQuantity, res.quantity + res.regenerationRate * boost * simDt);
      }
    }
  }

  public consume(resourceId: string, amount: number, fields?: ISpatialFieldProvider): number {
    const idx = this.resources.findIndex((r) => r.id === resourceId);
    if (idx === -1) return 0;

    const res = this.resources[idx];
    const taken = Math.min(res.quantity, amount);
    res.quantity -= taken;

    // Metabolic excretion: feeding creates local nutrients
    if (fields && taken > 0) {
      fields.add(res.position.x, res.position.y, res.position.z, 'nutrients', taken * 0.08);
    }

    if (res.type === 'food_pellet' && res.quantity <= 0.01) {
      this.resources.splice(idx, 1);
    }

    return taken;
  }

  public toJSON(): IResourceSystemJSON {
    return {
      resources: this.resources.map((r) => ({
        id: r.id,
        type: r.type,
        position: r.position.toJSON(),
        quantity: r.quantity,
        maxQuantity: r.maxQuantity,
        regenerationRate: r.regenerationRate,
        createdAt: r.createdAt,
        decayTimeSeconds: r.decayTimeSeconds,
      })),
    };
  }

  public fromJSON(data: IResourceSystemJSON): void {
    if (!data?.resources) return;
    this.resources = data.resources.map((r) => ({
      id: r.id,
      type: r.type,
      position: Vector3D.fromJSON(r.position),
      quantity: r.quantity,
      maxQuantity: r.maxQuantity,
      regenerationRate: r.regenerationRate,
      createdAt: r.createdAt,
      decayTimeSeconds: r.decayTimeSeconds,
    }));
  }
}
