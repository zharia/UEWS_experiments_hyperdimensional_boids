import { describe, it, expect } from 'vitest';
import { BoidSimulation4D, DEFAULT_TANK_OBSTACLES, Obstacle3D } from '../src/simulation/boids4D';
import { Boid4D } from '../src/types';

describe('Boid Obstacle & Rock Avoidance', () => {
  it('initializes with default tank obstacles matching natural reef rocks and brain corals', () => {
    const sim = new BoidSimulation4D(1, 10, 10, 1234);
    expect(sim.obstacles).toBeDefined();
    expect(sim.obstacles.length).toBe(DEFAULT_TANK_OBSTACLES.length);
    expect(sim.obstacles.some((o) => o.id === 'rock_center_bed')).toBe(true);
  });

  it('exerts outward repulsion and deflects velocity when fish approach rock obstacles', () => {
    const sim = new BoidSimulation4D(0, 0, 0, 4242);
    const rock = sim.obstacles.find((o) => o.id === 'rock_center_bed')!;
    expect(rock).toBeDefined();

    // Place a test boid directly above the rock heading downward toward it
    const testBoid: Boid4D = {
      id: 'test_swimmer',
      x: rock.x,
      y: rock.y + rock.ry * 1.25, // Inside awareness zone (1.25 < 1.35)
      z: rock.z,
      w: 50.0,
      vx: 0.0,
      vy: -1.5, // Heading straight down into the rock
      vz: 0.0,
      vw: 0.0,
      speed: 1.5,
      scale: 1.0,
      speciesIndex: 2,
      regime: 'meso_schooling',
      swimPhase: 0,
      temporalAlpha: 1.0,
      bioluminescence: 0.5,
      mass: 1.0,
    };

    sim.boids = [testBoid];
    sim.update(0.016);

    // Obstacle avoidance must have exerted upward repulsion (vy became less negative / deflected upward)
    expect(testBoid.vy).toBeGreaterThan(-1.5);
  });

  it('physically clamps boid position outside rock volume if propelled inside', () => {
    const sim = new BoidSimulation4D(0, 0, 0, 5555);
    const rock = sim.obstacles[0]; // rock_left_deep

    // Place a boid artificially inside the rock interior
    const trappedBoid: Boid4D = {
      id: 'trapped_boid',
      x: rock.x + rock.rx * 0.2,
      y: rock.y + rock.ry * 0.2,
      z: rock.z + rock.rz * 0.2,
      w: 50.0,
      vx: 0.0,
      vy: -0.5,
      vz: 0.0,
      vw: 0.0,
      speed: 0.5,
      scale: 1.0,
      speciesIndex: 2,
      regime: 'meso_schooling',
      swimPhase: 0,
      temporalAlpha: 1.0,
      bioluminescence: 0.5,
      mass: 1.0,
    };

    sim.boids = [trappedBoid];
    sim.update(0.016);

    // Compute normalized distance to rock after update
    const nx = (trappedBoid.x - rock.x) / rock.rx;
    const ny = (trappedBoid.y - rock.y) / rock.ry;
    const nz = (trappedBoid.z - rock.z) / rock.rz;
    const normDistSq = nx * nx + ny * ny + nz * nz;

    // Must be pushed on or outside the rock boundary
    expect(normDistSq).toBeGreaterThanOrEqual(1.0);
  });

  it('allows dynamic updating of custom obstacle geometries', () => {
    const sim = new BoidSimulation4D(0, 0, 0, 8888);
    const customObstacle: Obstacle3D = {
      id: 'custom_boulder',
      x: 0,
      y: 0,
      z: 0,
      rx: 2.0,
      ry: 2.0,
      rz: 2.0,
      repelStrength: 2.0,
    };

    sim.setObstacles([customObstacle]);
    expect(sim.obstacles.length).toBe(1);
    expect(sim.obstacles[0].id).toBe('custom_boulder');
  });

  it('anticipatorily steers swimming fish around obstacles via lookahead before contact', () => {
    const sim = new BoidSimulation4D(0, 0, 0, 9999);
    const rock = sim.obstacles.find((o) => o.id === 'rock_center_bed')!;

    // Place fish 2.2 units upstream of rock heading directly toward it
    const approachingBoid: Boid4D = {
      id: 'approaching_fish',
      x: rock.x,
      y: rock.y + rock.ry * 0.5,
      z: rock.z + rock.rz + 2.2, // Heading -Z towards rock center
      w: 50.0,
      vx: 0.0,
      vy: 0.0,
      vz: -2.0,
      vw: 0.0,
      speed: 2.0,
      scale: 1.0,
      speciesIndex: 1,
      regime: 'meso_schooling',
      swimPhase: 0,
      temporalAlpha: 1.0,
      bioluminescence: 0.5,
      mass: 1.0,
    };

    sim.boids = [approachingBoid];

    // Simulate 30 frames (~0.5 seconds of approach)
    for (let f = 0; f < 30; f++) {
      sim.update(0.016);
      const nx = (approachingBoid.x - rock.x) / rock.rx;
      const ny = (approachingBoid.y - rock.y) / rock.ry;
      const nz = (approachingBoid.z - rock.z) / rock.rz;
      const distSq = nx * nx + ny * ny + nz * nz;
      // Fish must never penetrate inside the rock interior
      expect(distSq).toBeGreaterThanOrEqual(1.0);
    }

    // Fish should have deflected horizontally or vertically around the rock face
    const hasDeflected = Math.abs(approachingBoid.vx) > 0.05 || approachingBoid.vy > 0.05;
    expect(hasDeflected).toBe(true);
  });

  it('ensures heavy macro pelagic boids steer around rock obstacles without clipping', () => {
    const sim = new BoidSimulation4D(0, 0, 0, 1111);
    const rock = sim.obstacles.find((o) => o.id === 'rock_right_deep')!;

    // Heavy macro leviathan heading towards rock with high momentum
    const macroBoid: Boid4D = {
      id: 'macro_leviathan',
      x: rock.x,
      y: rock.y + rock.ry * 0.4,
      z: rock.z - rock.rz - 1.5, // Heading +Z into rock
      w: 50.0,
      vx: 0.0,
      vy: 0.0,
      vz: 2.2,
      vw: 0.0,
      speed: 2.2,
      scale: 2.5,
      speciesIndex: 0,
      regime: 'macro_pelagic',
      swimPhase: 0,
      temporalAlpha: 1.0,
      bioluminescence: 0.8,
      mass: 7.5, // High inertia
    };

    sim.boids = [macroBoid];

    // Simulate 45 frames (~0.75 seconds)
    for (let f = 0; f < 45; f++) {
      sim.update(0.016);
      const nx = (macroBoid.x - rock.x) / rock.rx;
      const ny = (macroBoid.y - rock.y) / rock.ry;
      const nz = (macroBoid.z - rock.z) / rock.rz;
      const distSq = nx * nx + ny * ny + nz * nz;
      expect(distSq).toBeGreaterThanOrEqual(1.0);
    }
  });

  it('settles sinking food pellets on top of rock obstacle surfaces rather than passing through', () => {
    const sim = new BoidSimulation4D(0, 0, 0, 2222);
    const rock = sim.obstacles.find((o) => o.id === 'rock_center_bed')!;

    // Spawn food directly above rock center
    sim.foodPellets = [
      {
        id: 'food_over_rock',
        x: rock.x,
        y: rock.y + rock.ry + 1.0,
        z: rock.z,
        w: 50.0,
        radius: 0.15,
        nutrition: 1.0,
        vx: 0,
        vy: -1.0,
        vz: 0,
        createdAt: performance.now(),
      },
    ];

    // Run simulation until pellet settles
    for (let f = 0; f < 80; f++) {
      sim.update(0.016);
    }

    const pellet = sim.foodPellets[0];
    expect(pellet).toBeDefined();
    // Pellet must settle on the top surface of the rock (near rock.y + rock.ry), well above tank floor
    expect(pellet.y).toBeGreaterThan(rock.y + rock.ry * 0.8);
    expect(pellet.vy).toBe(0);
  });
});
