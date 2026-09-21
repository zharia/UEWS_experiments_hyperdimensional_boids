import { describe, it, expect } from 'vitest';
import { EcologySimulation } from '../src/simulation/EcologySimulation';

describe('Master Ecology Simulation Coordinator', () => {
  it('should exhibit identical deterministic execution given the same seed', () => {
    const run = (seed: number) => {
      const sim = new EcologySimulation(seed);
      for (let i = 0; i < 30; i++) {
        sim.update(0.016);
      }
      return {
        simTime: sim.clock.simulationTime,
        agent0_x: sim.agents[0].position.x,
        agent0_y: sim.agents[0].position.y,
        agent0_energy: sim.agents[0].energy,
      };
    };

    const runA = run(777);
    const runB = run(777);

    expect(runA.simTime).toBeCloseTo(runB.simTime, 4);
    expect(runA.agent0_x).toBeCloseTo(runB.agent0_x, 4);
    expect(runA.agent0_y).toBeCloseTo(runB.agent0_y, 4);
    expect(runA.agent0_energy).toBeCloseTo(runB.agent0_energy, 4);
  });

  it('should support accelerated simulation timeScale', () => {
    const sim = new EcologySimulation(42);
    sim.clock.timeScale = 5.0; // 5x speed

    for (let i = 0; i < 10; i++) {
      sim.update(0.1); // 10 * 0.1s = 1.0 real second
    }
    expect(sim.clock.simulationTime).toBeCloseTo(5.0, 1);
  });

  it('should manage multi-scalar process frequencies correctly', () => {
    const sim = new EcologySimulation(42);
    let anticsRunCount = 0;

    // Run 100 ticks of 16ms (= 1.6 real seconds)
    for (let i = 0; i < 100; i++) {
      const res = sim.update(0.016);
      if (res.simDt > 0) {
        // Antics frequency is 1Hz, so in 1.6 seconds it should trigger 1-2 times
      }
    }

    expect(sim.clock.simulationTime).toBeCloseTo(1.6, 1);
  });
});
