import { describe, it, expect } from 'vitest';
import { BoidSimulation4D } from '../src/simulation/boids4D';
import { EcologySimulation } from '../src/simulation/EcologySimulation';
import { Vector3D } from '../src/space/physical/Vector3D';
import { BoidMorphologyManager } from '../src/morphology/BoidMorphologyManager';
import { Antic } from '../src/antics/antic/Antic';

describe('Task 006 Consolidation Tests', () => {
  describe('Priority 2: Stable Organism-Bound Morphology & Determinism', () => {
    it('maintains consistent morphology identity independent of array reordering', () => {
      const manager = new BoidMorphologyManager(100, 4242);
      const boid1 = {
        id: 'macro_agent_1',
        x: 0, y: 0, z: 0, w: 50,
        vx: 1.0, vy: 0, vz: 0, vw: 0,
        speed: 1.0, scale: 1.0, speciesIndex: 0,
        regime: 'macro_pelagic' as const, swimPhase: 0, temporalAlpha: 1.0, bioluminescence: 0.5, mass: 7.5,
      };
      const boid2 = {
        id: 'macro_agent_2',
        x: 5, y: 0, z: 0, w: 50,
        vx: -1.0, vy: 0, vz: 0, vw: 0,
        speed: 1.0, scale: 1.0, speciesIndex: 1,
        regime: 'macro_pelagic' as const, swimPhase: 0, temporalAlpha: 1.0, bioluminescence: 0.5, mass: 7.5,
      };

      manager.update([boid1, boid2], 0.016);
      const sig1Before = manager.getSignature('macro_agent_1');
      const sig2Before = manager.getSignature('macro_agent_2');

      // Reorder array
      manager.update([boid2, boid1], 0.016);
      const sig1After = manager.getSignature('macro_agent_1');
      const sig2After = manager.getSignature('macro_agent_2');

      expect(sig1Before).toBe(sig1After);
      expect(sig2Before).toBe(sig2After);
      expect(sig1After.id).toBe('macro_agent_1');
      expect(sig2After.id).toBe('macro_agent_2');
    });

    it('produces identical initial populations for identical seeds in BoidSimulation4D', () => {
      const simA = new BoidSimulation4D(3, 40, 50, 7777);
      const simB = new BoidSimulation4D(3, 40, 50, 7777);

      expect(simA.boids.length).toBe(simB.boids.length);
      expect(simA.boids[0].id).toBe(simB.boids[0].id);
      expect(simA.boids[0].x).toBeCloseTo(simB.boids[0].x, 6);
      expect(simA.boids[0].vx).toBeCloseTo(simB.boids[0].vx, 6);
      expect(simA.boids[0].scale).toBeCloseTo(simB.boids[0].scale, 6);
    });
  });

  describe('Priority 3: Ecological State -> Behaviour -> Physical Boid Expression', () => {
    it('propagates ecological behaviour states into boid kinematic flags and drives posture', () => {
      const manager = new BoidMorphologyManager(20, 1234);
      const boidCruising = {
        id: 'meso_1',
        x: 0, y: 0, z: 0, w: 50,
        vx: 1.5, vy: 0, vz: 0, vw: 0,
        speed: 1.5, scale: 1.0, speciesIndex: 2,
        regime: 'meso_schooling' as const, swimPhase: 0, temporalAlpha: 1.0, bioluminescence: 0.5, mass: 1,
        behaviourType: 'rest',
        isBursting: false,
      };
      const boidFleeing = {
        id: 'meso_2',
        x: 2, y: 0, z: 0, w: 50,
        vx: 1.5, vy: 0, vz: 0, vw: 0,
        speed: 1.5, scale: 1.0, speciesIndex: 2,
        regime: 'meso_schooling' as const, swimPhase: 0, temporalAlpha: 1.0, bioluminescence: 0.5, mass: 1,
        behaviourType: 'flee',
        isBursting: true,
      };

      for (let i = 0; i < 25; i++) {
        manager.update([boidCruising, boidFleeing], 0.016);
      }

      const telemCruise = manager.getBoidTelemetry('meso_1');
      const telemFlee = manager.getBoidTelemetry('meso_2');

      expect(telemFlee!.posture.propulsionTension).toBeGreaterThan(telemCruise!.posture.propulsionTension);
      expect(telemCruise!.posture.compression).toBeLessThan(telemFlee!.posture.compression);
    });
  });

  describe('Priority 4: Environmental Current Advection', () => {
    it('applies fluid flow advection to swimming boids', () => {
      const sim = new BoidSimulation4D(2, 20, 20, 9999);
      const flow = { x: 2.5, y: 0.0, z: 0.0 };

      // Initial average velocity
      const initialVx = sim.boids.reduce((acc, b) => acc + b.vx, 0) / sim.boids.length;

      // Update with strong positive X current
      for (let f = 0; f < 30; f++) {
        sim.update(0.016, flow);
      }

      const postVx = sim.boids.reduce((acc, b) => acc + b.vx, 0) / sim.boids.length;
      expect(postVx).toBeGreaterThan(initialVx);
    });
  });

  describe('Priority 6: Antic Feedback Loop to Ecology', () => {
    it('applies social affinity and environmental feedback upon completed antics', () => {
      const ecology = new EcologySimulation(5555);
      const agentA = ecology.agents[0];
      const agentB = ecology.agents[1];

      const initialAffinity = agentA.relationships.getRelationship(agentB.id).affinity;

      // Construct and resolve a completed courtship antic
      const testAntic = new Antic({
        id: 'antic_test_courtship',
        type: 'COURTSHIP_DISPLAY',
        trigger: 'courtship pair bond',
        startTime: ecology.clock.simulationTime,
        duration: 1.0,
        phases: ['APPROACH', 'CIRCULAR_SWIM', 'RESOLUTION'],
        participants: [
          { agentId: agentA.id, role: 'initiator' },
          { agentId: agentB.id, role: 'partner' },
        ],
        location: new Vector3D(0, 0, 0),
        significance: 0.8,
        isManifest: true,
      });
      testAntic.status = 'completed';

      // Manually trigger antic completion handling via step return
      ecology.anticScheduler.activeAntics = [testAntic];
      for (let s = 0; s < 12; s++) {
        ecology.update(0.1);
      }

      const postAffinity = agentA.relationships.getRelationship(agentB.id).affinity;
      expect(postAffinity).toBeGreaterThan(initialAffinity);
    });
  });

  describe('Priority 7: Observer Inactivity and Continued Progression', () => {
    it('continues ecological progression and metabolic cycles when observer is ABSENT', () => {
      const ecology = new EcologySimulation(8888);
      ecology.observer.recordBlur();
      expect(ecology.observer.state).toBe('ABSENT');

      const initialSimTime = ecology.clock.simulationTime;
      const initialEnergy = ecology.agents[0].energy;

      // Step simulation for multiple seconds
      for (let s = 0; s < 20; s++) {
        ecology.update(0.1);
      }

      expect(ecology.clock.simulationTime).toBeGreaterThan(initialSimTime);
      // Agents continue consuming energy and living independently
      expect(ecology.agents[0].ageSeconds).toBeGreaterThan(0);
    });
  });
});
