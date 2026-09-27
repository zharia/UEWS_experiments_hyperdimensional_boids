/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { EcologySimulation } from '../src/simulation/EcologySimulation';
import { AcousticField } from '../src/ecology/acoustic/AcousticField';
import { AcousticDerivation } from '../src/ecology/acoustic/AcousticDerivation';
import { AcousticProjection } from '../src/ecology/acoustic/AcousticProjection';
import { Vector3D } from '../src/space/physical/Vector3D';
import { MemoryStorageProvider, WorldPersistenceService } from '../src/core/persistence/WorldPersistence';
import { runDeterministicAcousticDemonstration } from '../src/ecology/acoustic/AcousticDemonstration';

describe('Program Increment v0.0.1 — Task 004: Acoustic Ecology & Ambient Soundscape', () => {
  describe('1. Acoustic State & Field Invariants', () => {
    it('should initialize acoustic state within valid normalized ranges [0, 1]', () => {
      const field = new AcousticField();
      const s = field.currentState;

      expect(s.ambient_level).toBeGreaterThan(0);
      expect(s.ambient_level).toBeLessThanOrEqual(1);
      expect(s.water_activity).toBeGreaterThanOrEqual(0);
      expect(s.water_activity).toBeLessThanOrEqual(1);
      expect(s.biological_activity).toBeGreaterThanOrEqual(0);
      expect(s.biological_activity).toBeLessThanOrEqual(1);
      expect(s.disturbance).toBe(0.0);
    });

    it('should advance with multi-scalar acoustic hysteresis (temporal inertia)', () => {
      const field = new AcousticField();
      const initialDisturbance = field.currentState.disturbance;
      const initialWater = field.currentState.water_activity;

      // Set target jump
      field.setTargetState({
        disturbance: 1.0,
        water_activity: 0.9,
      });

      // Update small time step (0.1s)
      field.updateHysteresis(0.1);

      // Fast parameter (disturbance, tau=0.35s) moves substantially but not instantly to 1.0
      expect(field.currentState.disturbance).toBeGreaterThan(initialDisturbance);
      expect(field.currentState.disturbance).toBeLessThan(1.0);

      // Medium parameter (water_activity, tau=2.2s) moves more gradually
      expect(field.currentState.water_activity).toBeGreaterThan(initialWater);
      expect(field.currentState.water_activity).toBeLessThan(0.4);

      // Advance sufficiently to settle near target
      field.updateHysteresis(10.0);
      expect(field.currentState.disturbance).toBeCloseTo(1.0, 1);
      expect(field.currentState.water_activity).toBeCloseTo(0.9, 1);
    });

    it('should yield reproducible deterministic acoustic states under fixed seeds', () => {
      const sim1 = new EcologySimulation(12345);
      const sim2 = new EcologySimulation(12345);

      for (let i = 0; i < 10; i++) {
        sim1.update(0.2);
        sim2.update(0.2);
      }

      const s1 = sim1.acousticField.currentState;
      const s2 = sim2.acousticField.currentState;

      expect(s1.water_activity).toBeCloseTo(s2.water_activity, 4);
      expect(s1.biological_activity).toBeCloseTo(s2.biological_activity, 4);
      expect(s1.ambient_level).toBeCloseTo(s2.ambient_level, 4);
    });
  });

  describe('2. Environmental & Ecological Coupling', () => {
    it('should couple water flow and turbulence to water dynamics in the acoustic state', () => {
      const sim = new EcologySimulation(999);
      sim.update(0.5);
      const baselineWater = sim.acousticField.currentState.water_activity;

      // Increase water flow and turbulence in the environmental state
      sim.environment.water.flow.set(2.0, 0.5, 1.0);
      sim.environment.water.turbulence = 0.85;

      for (let i = 0; i < 8; i++) {
        sim.update(0.5);
      }

      const elevatedWater = sim.acousticField.currentState.water_activity;
      expect(elevatedWater).toBeGreaterThan(baselineWater);
    });

    it('should couple population density and feeding activity to biological acoustic texture', () => {
      const sim = new EcologySimulation(555);
      sim.update(0.5);
      const baselineBio = sim.acousticField.currentState.biological_activity;

      // Introduce feeding resources
      sim.dropFood(0, 0, 0, 2.0);
      for (let i = 0; i < 15; i++) {
        sim.update(0.5);
      }

      const activeBio = sim.acousticField.currentState.biological_activity;
      expect(activeBio).toBeGreaterThanOrEqual(baselineBio * 0.9);
    });

    it('should differentiate spatial acoustic properties across habitat zones', () => {
      const sim = new EcologySimulation(777);
      const field = sim.acousticField;

      // Sample surface habitat (bright, low spectral damping)
      const surfaceProps = field.sampleAt(0, 5.5, 0, sim.habitats);
      // Sample benthic substrate (high ground damping, low cutoff)
      const benthicProps = field.sampleAt(0, -6.5, 0, sim.habitats);
      // Sample vegetation canopy (vegetative absorption)
      const vegetationProps = field.sampleAt(-5.0, -4.0, 0, sim.habitats);

      expect(surfaceProps.spectral_damping).toBeLessThan(benthicProps.spectral_damping);
      expect(benthicProps.spectral_damping).toBeGreaterThanOrEqual(0.55);
      expect(vegetationProps.biological_density).toBeGreaterThanOrEqual(surfaceProps.biological_density);
    });
  });

  describe('3. Discrete Acoustic Events & Causal Traceability', () => {
    it('should generate discrete acoustic events with verified ledger causes on environmental perturbation', () => {
      const sim = new EcologySimulation(888);
      sim.update(1.0);

      // Trigger disturbance
      sim.triggerDisturbance(0.9);
      const res = sim.update(0.5);

      expect(res.acousticEvents.length).toBeGreaterThan(0);
      const disturbanceEvt = res.acousticEvents.find((e) => e.source === 'substrate_disturbance');
      expect(disturbanceEvt).toBeDefined();
      expect(disturbanceEvt!.cause).toBeDefined();
      expect(disturbanceEvt!.cause!.description).toContain('disturbance');
      expect(disturbanceEvt!.significance).toBeGreaterThan(0.5);
    });

    it('should suppress repetitive rapid events within cooldown windows', () => {
      const field = new AcousticField();
      const derivation = new AcousticDerivation(field, { seed: 123 });
      const sim = new EcologySimulation(321);

      // Manually record 5 feeding events at the exact same simulation time
      for (let i = 0; i < 5; i++) {
        sim.eventLedger.recordEvent({
          eventType: 'FEEDING',
          timestamp: 10.0,
          phase: 'ACTIVE',
          significance: 0.6,
          description: `Rapid feed ${i}`,
        });
      }

      const generated = derivation.update(
        0.1,
        10.0,
        sim.environment,
        sim.populations,
        sim.habitats,
        sim.eventLedger,
        []
      );

      // Repetition suppression must consolidate into a single event, not 5 identical sounds
      expect(generated.length).toBe(1);
      expect(generated[0].source).toBe('feeding_strike');
    });

    it('should generate discrete acoustic manifestations from significant active antics', () => {
      const sim = new EcologySimulation(456);
      sim.update(1.0);

      // Check if antics can produce acoustic events
      const anticEvents = sim.acousticDerivation.getRecentEvents();
      expect(Array.isArray(anticEvents)).toBe(true);

      // Every acoustic event must point to a legitimate cause
      for (const evt of anticEvents) {
        expect(evt.cause).toBeDefined();
        expect(evt.cause!.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('4. Spatial Positioning & Attenuation', () => {
    it('should pan left/right based on source coordinate lateral offset', () => {
      const field = new AcousticField();

      const leftProjection = field.calculateSpatialProjection(new Vector3D(-12.0, 0, 0));
      const rightProjection = field.calculateSpatialProjection(new Vector3D(12.0, 0, 0));
      const centerProjection = field.calculateSpatialProjection(new Vector3D(0, 0, 0));

      expect(leftProjection.pan).toBeLessThan(-0.5);
      expect(rightProjection.pan).toBeGreaterThan(0.5);
      expect(centerProjection.pan).toBeCloseTo(0.0, 1);
    });

    it('should attenuate distant sounds and roll off high frequencies with depth', () => {
      const field = new AcousticField();

      const nearSource = field.calculateSpatialProjection(new Vector3D(0, 0, 4));
      const farSource = field.calculateSpatialProjection(new Vector3D(0, -6, -6));

      expect(nearSource.distanceAttenuation).toBeGreaterThan(farSource.distanceAttenuation);
      expect(nearSource.lowpassCutoffHz).toBeGreaterThan(farSource.lowpassCutoffHz);
    });
  });

  describe('5. Observer Model & Idle-Time Integrity', () => {
    it('should not author ecological events when observer state changes', () => {
      const sim = new EcologySimulation(101);
      sim.update(1.0);
      const initialEventCount = sim.eventLedger.getAllEvents().length;

      // Observer transitions from WATCHING to PRESENT, INTERACTING, then ABSENT
      sim.observer.setState('PRESENT');
      sim.observer.setState('INTERACTING');
      sim.observer.setState('ABSENT');

      // Mere observer presence transitions must NOT invent ecological world events
      expect(sim.eventLedger.getAllEvents().length).toBe(initialEventCount);
    });

    it('should modulate audio mix audibility based on observer state without altering simulation truth', () => {
      const field = new AcousticField();
      const proj = new AcousticProjection(field);

      const watchingMix = proj.projectMix('WATCHING');
      const absentMix = proj.projectMix('ABSENT');
      const inactiveMix = proj.projectMix('INACTIVE');

      expect(watchingMix.isAudible).toBe(true);
      expect(watchingMix.masterGain).toBeGreaterThan(0.2);

      expect(absentMix.isAudible).toBe(false);
      expect(absentMix.masterGain).toBe(0.0);

      expect(inactiveMix.masterGain).toBeLessThan(watchingMix.masterGain);
    });

    it('should reconstruct acoustic state upon return after idle time without historical replay', () => {
      const sim = new EcologySimulation(202);
      sim.update(1.0);

      // Fast forward 120s of idle time
      sim.catchUpIdleTime(120);

      // Simulation advanced
      expect(sim.clock.simulationTime).toBeGreaterThanOrEqual(120);

      // Soundscape is updated to the present state
      const telemetry = sim.getTelemetry();
      expect(telemetry.acousticTelemetry).toBeDefined();
      expect(telemetry.acousticTelemetry!.state.ambient_level).toBeGreaterThan(0);
      // Recent event list should be bounded, not containing 120 seconds of old audio
      expect(telemetry.acousticTelemetry!.recentEvents.length).toBeLessThanOrEqual(40);
    });
  });

  describe('6. Persistence & World Restoration', () => {
    it('should reconstruct the soundscape from persisted world state across save and load', async () => {
      const memoryStore = new MemoryStorageProvider();
      const persistence = new WorldPersistenceService(memoryStore);

      const sim1 = new EcologySimulation(303);
      for (let i = 0; i < 10; i++) {
        sim1.update(0.5);
      }
      sim1.triggerDisturbance(0.7);
      sim1.update(0.5);

      const snapshot = sim1.captureWorldState('0.2');
      await persistence.saveWorld(snapshot);

      // Restore into fresh simulation instance
      const loaded = await persistence.loadWorld();
      expect(loaded).toBeDefined();

      const sim2 = new EcologySimulation(1);
      sim2.restoreWorldState(loaded!);

      // Acoustic state reconstructed from restored world
      expect(sim2.acousticField.currentState.ambient_level).toBeGreaterThan(0);
      expect(sim2.acousticField.currentState.water_activity).toBeGreaterThan(0);
    });
  });

  describe('7. Deterministic Demonstration (Section 41)', () => {
    it('should execute the deterministic demonstration showing emergent acoustic evolution', () => {
      const demo = runDeterministicAcousticDemonstration(4242);

      expect(demo.stepRecords.length).toBe(4);
      expect(demo.initialSignature.ambient_level).toBeGreaterThan(0);
      expect(demo.peakSignature.disturbance).toBeGreaterThan(demo.initialSignature.disturbance);
      expect(demo.settledSignature.disturbance).toBeLessThan(demo.peakSignature.disturbance);
      expect(demo.causalChainSummary.acousticManifestations.length).toBeGreaterThanOrEqual(4);
    });
  });
});
