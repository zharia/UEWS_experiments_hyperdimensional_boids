/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Fundamental Golden Ratio constants
export const GOLDEN_RATIO = 1.618033988749895; // phi
export const GOLDEN_ANGLE = 2.399963229728653; // psi = 2 * PI * (1 - 1/phi) ~ 137.507764 degrees
export const GOLDEN_DIVERGENCE = Math.PI / (2 * GOLDEN_RATIO); // ~ 0.9708 rad (55.62 degrees)
export const GOLDEN_LENGTH_SCALE = 1.0 / GOLDEN_RATIO; // ~ 0.618034
export const GOLDEN_RADIUS_SCALE = Math.pow(GOLDEN_RATIO, -0.75); // ~ 0.7013

/**
 * Creates a 3D branching coral/plant tree governed by the Golden Ratio and Phyllotaxis.
 * Features:
 * - Golden angle azimuth divergence (137.5 degrees) around the parent axis
 * - Pitch divergence angle scaled by golden ratio powers
 * - Branch lengths and radii scaled by golden ratio and Leonardo da Vinci branching rules
 * - Spline curve tubes for organic, hydrodynamically curved stems
 * - Merged into a single BufferGeometry for maximum GPU performance (1 draw call)
 */
export function createGoldenBranchingCoralGeometry(
  origin: THREE.Vector3,
  initialHeight: number = 3.2,
  initialRadius: number = 0.42,
  maxDepth: number = 4
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  function addBranch(
    start: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
    radius: number,
    depth: number,
    phyllotaxisIndex: number
  ) {
    if (depth > maxDepth || radius < 0.05) return;

    // Build curved branch spline with golden spiral bend
    const midOffset = new THREE.Vector3(
      Math.sin(phyllotaxisIndex * GOLDEN_ANGLE) * (length * 0.18),
      length * 0.5,
      Math.cos(phyllotaxisIndex * GOLDEN_ANGLE) * (length * 0.18)
    );
    const midPoint = start.clone().add(midOffset);
    const end = start.clone().addScaledVector(dir, length);

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    // Radial segments 6, tubular segments 5 for lean vertex count
    const tubeGeo = new THREE.TubeGeometry(curve, 5, radius, 6, false);
    geometries.push(tubeGeo);

    // Terminal bulbous apical tip at branch tips
    if (depth >= maxDepth - 1 || radius < 0.1) {
      const tipGeo = new THREE.SphereGeometry(radius * 1.35, 6, 6);
      tipGeo.translate(end.x, end.y, end.z);
      geometries.push(tipGeo);
    }

    // Determine number of child branches:
    // Trunk bifurcates or trifurcates according to golden ratio sequence
    const numChildren = depth === 0 ? 3 : (depth % 2 === 1 ? 2 : 3);

    for (let c = 0; c < numChildren; c++) {
      const childIndex = phyllotaxisIndex * 3 + c + 1;

      // Azimuth rotation advances by Golden Angle (137.507 degrees) + subtle organic divergence
      const azimuth = childIndex * GOLDEN_ANGLE + (Math.sin(childIndex * 7.1) * 0.15);

      // Elevation pitch divergence from parent axis:
      // Uses golden divergence modified by depth and Fibonacci harmonic
      const pitch = (GOLDEN_DIVERGENCE * Math.pow(GOLDEN_RATIO, -depth * 0.22)) * (0.8 + 0.4 * Math.cos(c * GOLDEN_ANGLE));

      // Construct orthonormal frame around current branch direction
      let up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(dir.y) > 0.92) up = new THREE.Vector3(1, 0, 0);
      const tangent = new THREE.Vector3().crossVectors(dir, up).normalize();
      const bitangent = new THREE.Vector3().crossVectors(dir, tangent).normalize();

      // Golden ratio rotation
      const rotatedDir = dir.clone()
        .applyAxisAngle(tangent, pitch)
        .applyAxisAngle(dir, azimuth)
        .normalize();

      // Golden length and radius scaling
      const childLength = length * (GOLDEN_LENGTH_SCALE * (0.92 + 0.16 * Math.sin(childIndex)));
      const childRadius = radius * GOLDEN_RADIUS_SCALE;

      addBranch(end, rotatedDir, childLength, childRadius, depth + 1, childIndex);
    }
  }

  // Generate tree branches
  const initialDir = new THREE.Vector3(0, 1, 0);
  addBranch(new THREE.Vector3(0, 0, 0), initialDir, initialHeight, initialRadius, 0, 1);

  if (geometries.length === 0) {
    return new THREE.BufferGeometry();
  }

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.translate(origin.x, origin.y, origin.z);
  merged.computeVertexNormals();

  // Dispose individual branch geometries
  geometries.forEach(g => g.dispose());

  return merged;
}

/**
 * Creates Golden Spiral Ribbon Kelp / Vallisneria Sea Grass.
 * Long twisting ribbons that curl in a golden logarithmic spiral: r = a * e^(b * theta)
 * where b = ln(phi) / (PI / 2) ~ 0.30635
 */
export function createGoldenSpiralGrassGeometry(
  origin: THREE.Vector3,
  bladeCount: number = 24,
  bladeHeight: number = 7.5
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];
  const bSpiral = Math.log(GOLDEN_RATIO) / (Math.PI * 0.5);

  for (let i = 0; i < bladeCount; i++) {
    // Phyllotaxis distribution of blades around root center
    const rootAngle = i * GOLDEN_ANGLE;
    const rootDist = Math.sqrt(i / bladeCount) * 1.3;
    const rx = Math.cos(rootAngle) * rootDist;
    const rz = Math.sin(rootAngle) * rootDist;

    const segments = 12;
    const points: THREE.Vector3[] = [];
    const height = bladeHeight * (0.7 + 0.35 * Math.sin(i * 3.7));

    // Create spline curving along a golden spiral
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const theta = t * Math.PI * 1.5;
      const spiralR = 0.25 * Math.exp(bSpiral * (theta * 0.4));

      const px = rx + Math.cos(rootAngle + theta) * spiralR;
      const py = t * height;
      const pz = rz + Math.sin(rootAngle + theta) * spiralR;
      points.push(new THREE.Vector3(px, py, pz));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const bladeWidth = 0.22 * (1.0 - 0.7 * (i / bladeCount));
    // Tapering ribbon tube
    const ribbonGeo = new THREE.TubeGeometry(curve, 10, bladeWidth, 4, false);
    // Flatten tube into a thin ribbon
    ribbonGeo.scale(1.0, 1.0, 0.25);
    geometries.push(ribbonGeo);
  }

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.translate(origin.x, origin.y, origin.z);
  merged.computeVertexNormals();

  geometries.forEach(g => g.dispose());
  return merged;
}

/**
 * Creates Golden Phyllotaxis Whorled Plants (e.g. Cabomba / Rotala).
 * Stems with whorls of leaves placed at Fibonacci intervals along the height,
 * each whorl rotated around the stem by the Golden Angle (137.5 degrees).
 */
export function createGoldenWhorledPlantGeometry(
  origin: THREE.Vector3,
  height: number = 6.2,
  numWhorls: number = 9
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Central stem
  const stemCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(Math.sin(origin.x) * 0.4, height * 0.5, Math.cos(origin.z) * 0.4),
    new THREE.Vector3(Math.sin(origin.x * 2.0) * 0.3, height, Math.cos(origin.z * 2.0) * 0.3)
  );
  const stemGeo = new THREE.TubeGeometry(stemCurve, 12, 0.12, 6, false);
  geometries.push(stemGeo);

  // Whorls along the stem
  for (let w = 0; w < numWhorls; w++) {
    // Fibonacci exponential vertical distribution: denser near the top apical tip
    const t = Math.pow((w + 1) / (numWhorls + 1), 1.0 / GOLDEN_RATIO);
    const whorlCenter = stemCurve.getPoint(t);
    const whorlTangent = stemCurve.getTangent(t);

    // Each successive whorl rotated by the Golden Angle
    const whorlBaseAngle = w * GOLDEN_ANGLE;
    const leavesPerWhorl = 5; // Fibonacci number 5
    const leafRadius = 0.85 * (1.0 - t * 0.3);

    for (let l = 0; l < leavesPerWhorl; l++) {
      const leafAngle = whorlBaseAngle + (l / leavesPerWhorl) * Math.PI * 2;
      const leafDir = new THREE.Vector3(
        Math.cos(leafAngle),
        Math.sin(l * GOLDEN_ANGLE) * 0.2 + 0.1, // slight upward cupping
        Math.sin(leafAngle)
      ).normalize();

      const leafEnd = whorlCenter.clone().addScaledVector(leafDir, leafRadius);
      const leafCurve = new THREE.LineCurve3(whorlCenter, leafEnd);
      const leafGeo = new THREE.TubeGeometry(leafCurve, 4, 0.04 * (1.0 - t * 0.4), 4, false);
      geometries.push(leafGeo);

      // Feather pinnate needles sprouting from each leaf
      const numPinnae = 4;
      for (let p = 1; p <= numPinnae; p++) {
        const pt = p / (numPinnae + 1);
        const pinnaStart = whorlCenter.clone().lerp(leafEnd, pt);
        const sideDir = new THREE.Vector3(-leafDir.z, 0.2, leafDir.x).normalize();
        const pinnaEnd = pinnaStart.clone().addScaledVector(sideDir, 0.25 * (1.0 - pt));
        const pinnaGeo = new THREE.TubeGeometry(new THREE.LineCurve3(pinnaStart, pinnaEnd), 2, 0.02, 3, false);
        geometries.push(pinnaGeo);
      }
    }
  }

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.translate(origin.x, origin.y, origin.z);
  merged.computeVertexNormals();

  geometries.forEach(g => g.dispose());
  return merged;
}
