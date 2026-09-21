/**
 * Locomotion and Steering Substrate.
 *
 * Implements Reynolds boid locomotion primitives (separation, alignment, cohesion,
 * target seeking, boundary avoidance, hydrodynamics drag) as steering forces
 * guided by the high-level Behaviour System.
 */

import { Vector3D } from '../../space/physical/Vector3D';
import { ActiveBehaviour } from '../behaviour/BehaviourSystem';

export interface TankBounds3D {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export class SteeringSubstrate {
  public maxSpeed: number = 3.5;
  public maxForce: number = 6.0;
  public dragCoefficient: number = 0.96;

  constructor(maxSpeed: number = 3.5, maxForce: number = 6.0) {
    this.maxSpeed = maxSpeed;
    this.maxForce = maxForce;
  }

  /**
   * Computes steering force towards a target position
   */
  public seek(pos: Vector3D, vel: Vector3D, target: Vector3D, speedMultiplier: number = 1.0): Vector3D {
    const desired = target.clone().sub(pos);
    const dist = desired.length();
    if (dist < 0.001) return new Vector3D(0, 0, 0);

    desired.normalize();
    const targetSpeed = this.maxSpeed * speedMultiplier;
    
    // Arrival deceleration within 1.5 units
    if (dist < 1.5) {
      desired.multiplyScalar(targetSpeed * (dist / 1.5));
    } else {
      desired.multiplyScalar(targetSpeed);
    }

    const steer = desired.sub(vel);
    steer.clampLength(this.maxForce);
    return steer;
  }

  /**
   * Computes steering force away from a threat position
   */
  public flee(pos: Vector3D, vel: Vector3D, threatPos: Vector3D): Vector3D {
    const desired = pos.clone().sub(threatPos);
    const dist = desired.length();
    if (dist > 12.0 || dist < 0.001) return new Vector3D(0, 0, 0);

    desired.normalize();
    desired.multiplyScalar(this.maxSpeed * 1.8);
    const steer = desired.sub(vel);
    steer.clampLength(this.maxForce * 1.5);
    return steer;
  }

  /**
   * Boundary containment steering force (soft barrier repulsion)
   */
  public boundaryRepulsion(pos: Vector3D, bounds: TankBounds3D, margin: number = 2.0): Vector3D {
    const force = new Vector3D(0, 0, 0);

    if (pos.x < bounds.minX + margin) {
      const d = (bounds.minX + margin - pos.x) / margin;
      force.x += d * d * this.maxForce;
    } else if (pos.x > bounds.maxX - margin) {
      const d = (pos.x - (bounds.maxX - margin)) / margin;
      force.x -= d * d * this.maxForce;
    }

    if (pos.y < bounds.minY + margin) {
      const d = (bounds.minY + margin - pos.y) / margin;
      force.y += d * d * this.maxForce * 1.2;
    } else if (pos.y > bounds.maxY - margin) {
      const d = (pos.y - (bounds.maxY - margin)) / margin;
      force.y -= d * d * this.maxForce;
    }

    if (pos.z < bounds.minZ + margin) {
      const d = (bounds.minZ + margin - pos.z) / margin;
      force.z += d * d * this.maxForce;
    } else if (pos.z > bounds.maxZ - margin) {
      const d = (pos.z - (bounds.maxZ - margin)) / margin;
      force.z -= d * d * this.maxForce;
    }

    return force;
  }

  /**
   * Wandering steering force
   */
  public wander(vel: Vector3D, wanderAngle: number, randomDelta?: number): { force: Vector3D; nextAngle: number } {
    const circleRadius = 1.2;
    const circleDist = 2.0;
    const change = 0.4;
    const jitter = randomDelta !== undefined ? (randomDelta - 0.5) * change : (Math.random() - 0.5) * change;
    const nextAngle = wanderAngle + jitter;

    const heading = vel.clone().normalize();
    if (heading.lengthSq() < 0.001) heading.set(1, 0, 0);

    const circleCenter = heading.clone().multiplyScalar(circleDist);
    const displacement = new Vector3D(
      Math.cos(nextAngle) * circleRadius,
      Math.sin(nextAngle * 0.7) * circleRadius * 0.4,
      Math.sin(nextAngle) * circleRadius
    );

    const force = circleCenter.add(displacement);
    force.clampLength(this.maxForce * 0.5);
    return { force, nextAngle };
  }
}
