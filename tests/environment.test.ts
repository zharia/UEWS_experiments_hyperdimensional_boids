import { describe, it, expect } from 'vitest';
import { DiscreteEnvironmentalFieldGrid } from '../src/space/fields/EnvironmentalField';
import { ResourceSystem } from '../src/ecology/resources/ResourceSystem';
import { Vector3D } from '../src/space/physical/Vector3D';

describe('Environmental Fields and Resources', () => {
  it('should support spatial field lookup and addressability', () => {
    const fields = new DiscreteEnvironmentalFieldGrid();
    const tempAtCenter = fields.sample(0, 0, 0, 'temperature');
    expect(tempAtCenter).toBeGreaterThan(20.0);
    expect(tempAtCenter).toBeLessThan(30.0);

    const lightAtTop = fields.sample(0, 6.0, 0, 'illumination');
    const lightAtBottom = fields.sample(0, -6.0, 0, 'illumination');
    expect(lightAtTop).toBeGreaterThan(lightAtBottom);
  });

  it('should support field modification, delta additions, and diffusion', () => {
    const fields = new DiscreteEnvironmentalFieldGrid();
    const initialNutrient = fields.sample(0, 0, 0, 'nutrients');

    fields.add(0, 0, 0, 'nutrients', 0.5);
    const afterAdd = fields.sample(0, 0, 0, 'nutrients');
    expect(afterAdd).toBeCloseTo(initialNutrient + 0.5, 2);

    // Simulate diffusion over 50 simulation seconds
    fields.update(5.0, 10.0);
    const afterDiffuse = fields.sample(0, 0, 0, 'nutrients');
    expect(afterDiffuse).toBeLessThan(afterAdd); // Diffused outwards
  });

  it('should consume resources and modify world and nutrient state', () => {
    const fields = new DiscreteEnvironmentalFieldGrid();
    const resources = new ResourceSystem();

    const pellet = resources.addFoodPellet(new Vector3D(1, 2, 3), 0.0, 1.0);
    expect(resources.resources.some((r) => r.id === pellet.id)).toBe(true);

    const initialNutrient = fields.sample(1, 2, 3, 'nutrients');
    const consumed = resources.consume(pellet.id, 0.6, fields);

    expect(consumed).toBeCloseTo(0.6, 2);
    expect(pellet.quantity).toBeCloseTo(0.4, 2);

    // Metabolic nutrient excretion modifies local field state
    const afterNutrient = fields.sample(1, 2, 3, 'nutrients');
    expect(afterNutrient).toBeGreaterThan(initialNutrient);

    // Exhausting pellet removes it from simulation
    resources.consume(pellet.id, 0.4, fields);
    expect(resources.resources.some((r) => r.id === pellet.id)).toBe(false);
  });

  it('should handle food pellet sinking and natural decomposition', () => {
    const fields = new DiscreteEnvironmentalFieldGrid();
    const resources = new ResourceSystem();

    const pellet = resources.addFoodPellet(new Vector3D(0, 2.0, 0), 0.0, 1.0);
    resources.update(2.0, 2.0, fields);
    expect(pellet.position.y).toBeLessThan(2.0); // Sunk downwards

    // Simulating past decay expiration triggers nutrient decomposition
    const nutrientBefore = fields.sample(0, -6.5, 0, 'nutrients');
    resources.update(50.0, 60.0, fields);
    expect(resources.resources.some((r) => r.id === pellet.id)).toBe(false);
    const nutrientAfter = fields.sample(0, -6.5, 0, 'nutrients');
    expect(nutrientAfter).toBeGreaterThanOrEqual(nutrientBefore);
  });
});
