/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { smin, smax, calculateBranchCollarRadius } from './smoothMath';
import { SplatDescriptor, PlantLeafType } from './plantSplats';

// Fundamental Golden Ratio constants for botanical phyllotaxis
export const PHI = 1.618033988749895;
export const GOLDEN_ANGLE = 2.399963229728653; // ~ 137.507764 degrees
export const GOLDEN_DIVERGENCE = Math.PI / (2 * PHI);

export interface PlantGeometryResult {
  stemGeometry: THREE.BufferGeometry;
  splats: SplatDescriptor[];
  bounds: { minY: number; maxY: number };
}

/**
 * Helper to build an organic flared holdfast (rhizome / root foot)
 * that anchors plants to the substrate and rock mounds with smooth low-profile tapers.
 */
function createHoldfastGeometry(
  origin: THREE.Vector3,
  trunkRadius: number,
  lobeCount: number = 6,
  spreadRadius: number = 0.95
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  // Low-profile organic basal hub blending seamlessly with substrate
  const baseSegments = 12;
  const cylinderGeo = new THREE.CylinderGeometry(trunkRadius * 0.75, trunkRadius * 1.25, 0.18, baseSegments, 1);
  cylinderGeo.translate(0, 0.09, 0);
  geometries.push(cylinderGeo);

  // Spreading anchoring rootlets / haptera radiating naturally into rock crevices
  for (let i = 0; i < lobeCount; i++) {
    const angle = (i / lobeCount) * Math.PI * 2 + (Math.sin(i * 3.1) * 0.22);
    const reach = spreadRadius * (0.7 + 0.35 * Math.sin(i * 2.7));

    const p0 = new THREE.Vector3(Math.cos(angle) * (trunkRadius * 0.6), 0.15, Math.sin(angle) * (trunkRadius * 0.6));
    const p1 = new THREE.Vector3(Math.cos(angle) * (reach * 0.5), 0.05, Math.sin(angle) * (reach * 0.5));
    const p2 = new THREE.Vector3(Math.cos(angle) * reach, -0.05, Math.sin(angle) * reach);

    const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const rRoot = trunkRadius * 0.28;
    const rootGeo = new THREE.TubeGeometry(curve, 5, rRoot, 4, false);
    geometries.push(rootGeo);
  }

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.translate(origin.x, origin.y, origin.z);
  geometries.forEach(g => g.dispose());
  return merged;
}

/**
 * 1. ACROPORA / TREE CORAL (Branching Coral Tree)
 * Features:
 * - Smooth-minimum (smin) flared branch collars at every bifurcation.
 * - Multi-lobed rock holdfast base.
 * - Leonardo da Vinci area-preserving branch radii: r_parent^2.2 ~ sum(r_child^2.2).
 * - Polyp disc splats radiating along all branch tips and nodes.
 */
export function createAcroporaTreeGeometry(
  origin: THREE.Vector3,
  height: number = 3.6,
  trunkRadius: number = 0.42,
  maxDepth: number = 4
): PlantGeometryResult {
  const geometries: THREE.BufferGeometry[] = [];
  const splats: SplatDescriptor[] = [];
  let minY = origin.y;
  let maxY = origin.y + height;

  // Add holdfast footing
  const holdfast = createHoldfastGeometry(origin, trunkRadius, 6, 1.2);
  geometries.push(holdfast);

  function addBranch(
    start: THREE.Vector3,
    dir: THREE.Vector3,
    length: number,
    radius: number,
    parentRadius: number,
    depth: number,
    nodeIndex: number
  ) {
    if (depth > maxDepth || radius < 0.04) return;

    // Organic golden spiral curve for the branch
    const midOffset = new THREE.Vector3(
      Math.sin(nodeIndex * GOLDEN_ANGLE) * (length * 0.16),
      length * 0.5,
      Math.cos(nodeIndex * GOLDEN_ANGLE) * (length * 0.16)
    );
    const midPoint = start.clone().add(midOffset);
    const end = start.clone().addScaledVector(dir, length);

    maxY = Math.max(maxY, end.y);
    minY = Math.min(minY, end.y);

    const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
    const segments = 6;
    const radialSegments = 6;

    // Build custom tube with smooth-minimum flared branch collar at the junction
    const tubeGeo = new THREE.BufferGeometry();
    const posArr: number[] = [];
    const normArr: number[] = [];
    const uvArr: number[] = [];
    const idxArr: number[] = [];

    // Orthonormal basis along curve
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t);

      let up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(tangent.y) > 0.9) up = new THREE.Vector3(1, 0, 0);
      const binorm = new THREE.Vector3().crossVectors(tangent, up).normalize();
      const norm = new THREE.Vector3().crossVectors(binorm, tangent).normalize();

      // Apply smin collar flare near base (t close to 0)
      const distFromBase = t * length;
      const r = depth > 0 
        ? calculateBranchCollarRadius(parentRadius, radius, distFromBase, length * 0.4, 0.12)
        : radius * (1.0 - t * 0.35); // trunk tapering

      for (let rIdx = 0; rIdx <= radialSegments; rIdx++) {
        const theta = (rIdx / radialSegments) * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const surfaceNorm = norm.clone().multiplyScalar(cosT).addScaledVector(binorm, sinT);
        const vertex = pt.clone().addScaledVector(surfaceNorm, r);

        posArr.push(vertex.x, vertex.y, vertex.z);
        normArr.push(surfaceNorm.x, surfaceNorm.y, surfaceNorm.z);
        uvArr.push(rIdx / radialSegments, t);
      }
    }

    // Connect segment rings with triangle indices
    for (let s = 0; s < segments; s++) {
      for (let rIdx = 0; rIdx < radialSegments; rIdx++) {
        const a = s * (radialSegments + 1) + rIdx;
        const b = (s + 1) * (radialSegments + 1) + rIdx;
        const c = (s + 1) * (radialSegments + 1) + (rIdx + 1);
        const d = s * (radialSegments + 1) + (rIdx + 1);

        idxArr.push(a, b, d);
        idxArr.push(b, c, d);
      }
    }

    tubeGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
    tubeGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normArr, 3));
    tubeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
    tubeGeo.setIndex(idxArr);
    geometries.push(tubeGeo);

    // Terminal apical growth tip
    if (depth >= maxDepth - 1 || radius < 0.1) {
      const tipGeo = new THREE.CylinderGeometry(0.01, radius, radius * 1.4, 5, 1);
      tipGeo.translate(end.x, end.y + radius * 0.7, end.z);
      geometries.push(tipGeo);

      // Add polyp splats at the tips
      splats.push({
        position: end.clone(),
        direction: dir.clone(),
        normal: new THREE.Vector3(0, 1, 0),
        width: radius * 3.2,
        length: radius * 3.5,
        leafType: 3 as PlantLeafType, // Coral polyp disc splat
        curl: 0.1,
        phyllotaxisIndex: nodeIndex,
        ageOffset: depth / maxDepth,
      });
    }

    // Branching logic: Golden angle phyllotaxis
    const numChildren = depth === 0 ? 3 : (depth % 2 === 1 ? 2 : 3);
    for (let c = 0; c < numChildren; c++) {
      const childIndex = nodeIndex * 3 + c + 1;
      const azimuth = childIndex * GOLDEN_ANGLE + (Math.sin(childIndex * 5.7) * 0.12);
      const pitch = (GOLDEN_DIVERGENCE * Math.pow(PHI, -depth * 0.22)) * (0.8 + 0.35 * Math.cos(c * GOLDEN_ANGLE));

      let up = new THREE.Vector3(0, 1, 0);
      if (Math.abs(dir.y) > 0.92) up = new THREE.Vector3(1, 0, 0);
      const tangent = new THREE.Vector3().crossVectors(dir, up).normalize();

      const rotatedDir = dir.clone()
        .applyAxisAngle(tangent, pitch)
        .applyAxisAngle(dir, azimuth)
        .normalize();

      const childLength = length * (1.0 / PHI) * (0.9 + 0.18 * Math.sin(childIndex));
      const childRadius = radius * Math.pow(PHI, -0.65);

      addBranch(end, rotatedDir, childLength, childRadius, radius, depth + 1, childIndex);
    }
  }

  // Generate branches from origin
  addBranch(origin, new THREE.Vector3(0, 1, 0), height * 0.45, trunkRadius, trunkRadius, 0, 1);

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.computeVertexNormals();
  geometries.forEach(g => g.dispose());

  return { stemGeometry: merged, splats, bounds: { minY, maxY } };
}

/**
 * 2. MACROCYSTIS / GIANT RIBBON KELP
 * Features:
 * - Claw-like low-profile holdfast haptera wrapping rocks without spherical swelling.
 * - Graceful, sinuous flexible primary and secondary stipes.
 * - Smooth hydrodynamic leaf petioles (free of spherical bladders).
 * - Large undulating ribbon blade splats with micro-corrugated margins.
 */
export function createGiantKelpGeometry(
  origin: THREE.Vector3,
  bladeCount: number = 8,
  kelpHeight: number = 7.8
): PlantGeometryResult {
  const geometries: THREE.BufferGeometry[] = [];
  const splats: SplatDescriptor[] = [];

  // Low-profile organic holdfast footing
  const holdfast = createHoldfastGeometry(origin, 0.28, 6, 1.2);
  geometries.push(holdfast);

  const bSpiral = Math.log(PHI) / (Math.PI * 0.5);

  for (let i = 0; i < bladeCount; i++) {
    const rootAngle = i * GOLDEN_ANGLE;
    const rootDist = Math.sqrt((i + 0.3) / bladeCount) * 0.85;
    const rx = origin.x + Math.cos(rootAngle) * rootDist;
    const rz = origin.z + Math.sin(rootAngle) * rootDist;

    const segments = 16;
    const points: THREE.Vector3[] = [];
    const height = kelpHeight * (0.8 + 0.28 * Math.sin(i * 3.7));

    // Stipe curve along a gentle natural golden spiral with organic sway drift
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const theta = t * Math.PI * 1.2;
      const spiralR = 0.22 * Math.exp(bSpiral * (theta * 0.25));

      const px = rx + Math.cos(rootAngle + theta) * spiralR + Math.sin(t * Math.PI * 2.5 + i) * 0.18;
      const py = origin.y + t * height;
      const pz = rz + Math.sin(rootAngle + theta) * spiralR + Math.cos(t * Math.PI * 2.0 + i) * 0.15;
      points.push(new THREE.Vector3(px, py, pz));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const stipeRadius = 0.07 * (1.0 - 0.45 * (i / bladeCount));
    const stipeGeo = new THREE.TubeGeometry(curve, 16, stipeRadius, 5, false);
    geometries.push(stipeGeo);

    // Add corrugated ribbon blade splats along upper 75% of stipe with streamlined organic petioles
    const numNodes = 7;
    for (let n = 1; n <= numNodes; n++) {
      const t = 0.22 + (n / (numNodes + 1)) * 0.76;
      const nodePos = curve.getPoint(t);
      const tangent = curve.getTangent(t);

      // Tangent outward vector for leaf blade
      const leafAngle = rootAngle + n * GOLDEN_ANGLE;
      const outwardDir = new THREE.Vector3(
        Math.cos(leafAngle),
        0.42, // upward buoyant inclination
        Math.sin(leafAngle)
      ).normalize();

      // Slender hydrodynamic petiole junction joining stipe smoothly to blade (no spherical bladders!)
      const petioleLength = 0.22 * (1.0 - t * 0.3);
      const petioleEnd = nodePos.clone().addScaledVector(outwardDir, petioleLength);
      const petioleCurve = new THREE.LineCurve3(nodePos, petioleEnd);
      const petioleGeo = new THREE.TubeGeometry(petioleCurve, 3, stipeRadius * 0.48, 4, false);
      geometries.push(petioleGeo);

      const leafNormal = new THREE.Vector3(-outwardDir.z, 0.35, outwardDir.x).normalize();

      // Blade splat
      splats.push({
        position: petioleEnd,
        direction: outwardDir,
        normal: leafNormal,
        width: 0.72 * (1.0 - t * 0.28),
        length: 2.4 * (1.0 - t * 0.22),
        leafType: 1 as PlantLeafType, // Kelp corrugated blade
        curl: 0.28,
        phyllotaxisIndex: i * 10 + n,
        ageOffset: 1.0 - t, // lower blades are older
      });
    }
  }

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.computeVertexNormals();
  geometries.forEach(g => g.dispose());

  return {
    stemGeometry: merged,
    splats,
    bounds: { minY: origin.y, maxY: origin.y + kelpHeight },
  };
}

/**
 * 3. CABOMBA CAROLINIANA / FINE-FEATHER MILFOIL
 * Features:
 * - Slender flexuous stem with smooth continuous tapering.
 * - Radiating 5-parted palmately dissected feather fan splats at every node.
 * - Tapered apical vegetative bud.
 */
export function createCabombaMilfoilGeometry(
  origin: THREE.Vector3,
  height: number = 6.2,
  numWhorls: number = 10
): PlantGeometryResult {
  const geometries: THREE.BufferGeometry[] = [];
  const splats: SplatDescriptor[] = [];

  // Holdfast base
  const holdfast = createHoldfastGeometry(origin, 0.14, 4, 0.55);
  geometries.push(holdfast);

  // Central flexuous stem
  const stemCurve = new THREE.QuadraticBezierCurve3(
    origin.clone(),
    new THREE.Vector3(origin.x + Math.sin(origin.x) * 0.35, origin.y + height * 0.5, origin.z + Math.cos(origin.z) * 0.35),
    new THREE.Vector3(origin.x + Math.sin(origin.x * 2.0) * 0.25, origin.y + height, origin.z + Math.cos(origin.z * 2.0) * 0.25)
  );
  const stemGeo = new THREE.TubeGeometry(stemCurve, 18, 0.08, 5, false);
  geometries.push(stemGeo);

  // Whorls along the stem
  for (let w = 0; w < numWhorls; w++) {
    const t = Math.pow((w + 1) / (numWhorls + 1), 1.0 / PHI);
    const whorlCenter = stemCurve.getPoint(t);

    const whorlBaseAngle = w * GOLDEN_ANGLE;
    const leavesPerWhorl = 5; // Fibonacci 5-parted fan

    for (let l = 0; l < leavesPerWhorl; l++) {
      const leafAngle = whorlBaseAngle + (l / leavesPerWhorl) * Math.PI * 2;
      const leafDir = new THREE.Vector3(
        Math.cos(leafAngle),
        Math.sin(l * GOLDEN_ANGLE) * 0.18 + 0.12, // slight upward cup
        Math.sin(leafAngle)
      ).normalize();

      const leafNormal = new THREE.Vector3(0, 1, 0);

      // Cabomba capillary feather fan splat
      splats.push({
        position: whorlCenter.clone(),
        direction: leafDir,
        normal: leafNormal,
        width: 0.95 * (1.0 - t * 0.28),
        length: 1.15 * (1.0 - t * 0.25),
        leafType: 0 as PlantLeafType, // Cabomba feather fan splat
        curl: 0.2,
        phyllotaxisIndex: w * 5 + l,
        ageOffset: 1.0 - t,
      });
    }
  }

  // Apical growth tip (slender tapered bud, no sphere)
  const tipPoint = stemCurve.getPoint(1.0);
  const tipGeo = new THREE.CylinderGeometry(0.01, 0.06, 0.22, 5, 1);
  tipGeo.translate(tipPoint.x, tipPoint.y + 0.11, tipPoint.z);
  geometries.push(tipGeo);

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.computeVertexNormals();
  geometries.forEach(g => g.dispose());

  return {
    stemGeometry: merged,
    splats,
    bounds: { minY: origin.y, maxY: origin.y + height },
  };
}

/**
 * 4. ECHINODORUS / AMAZON SWORD (Broad-leaf Rosette)
 * Features:
 * - Basal rosette crown emerging directly from sand substrate.
 * - Arched lanceolate broad leaves with thick structural central midribs.
 * - Secondary parallel arching veins on translucent lamina splats.
 */
export function createAmazonSwordGeometry(
  origin: THREE.Vector3,
  leafCount: number = 18,
  maxHeight: number = 4.8
): PlantGeometryResult {
  const geometries: THREE.BufferGeometry[] = [];
  const splats: SplatDescriptor[] = [];

  // Basal crown
  const crownGeo = new THREE.CylinderGeometry(0.24, 0.42, 0.35, 8, 1);
  crownGeo.translate(origin.x, origin.y + 0.18, origin.z);
  geometries.push(crownGeo);

  for (let i = 0; i < leafCount; i++) {
    // Spiral phyllotaxis from central crown
    const angle = i * GOLDEN_ANGLE;
    // Inner leaves are taller and more vertical; outer leaves are older and arch outward
    const ageFactor = i / leafCount; // 0 = newest inner heart, 1 = oldest outer leaf
    const archFactor = 0.35 + ageFactor * 0.55;
    const leafH = maxHeight * (1.0 - ageFactor * 0.35);

    const basePos = origin.clone().add(new THREE.Vector3(
      Math.cos(angle) * (0.15 + ageFactor * 0.2),
      0.2,
      Math.sin(angle) * (0.15 + ageFactor * 0.2)
    ));

    // Midrib petiole stem curve
    const midPoint = basePos.clone().add(new THREE.Vector3(
      Math.cos(angle) * (archFactor * 1.2),
      leafH * 0.5,
      Math.sin(angle) * (archFactor * 1.2)
    ));

    const endPoint = basePos.clone().add(new THREE.Vector3(
      Math.cos(angle) * (archFactor * 2.2),
      leafH * 0.9,
      Math.sin(angle) * (archFactor * 2.2)
    ));

    const petioleCurve = new THREE.QuadraticBezierCurve3(basePos, midPoint, endPoint);
    const petioleGeo = new THREE.TubeGeometry(petioleCurve, 8, 0.05 * (1.0 - ageFactor * 0.25), 4, false);
    geometries.push(petioleGeo);

    // Large broad lanceolate leaf splat attached along petiole
    const leafTangent = endPoint.clone().sub(basePos).normalize();
    const leafNormal = new THREE.Vector3(0, 1, 0);

    splats.push({
      position: basePos.clone().addScaledVector(leafTangent, 0.2),
      direction: leafTangent,
      normal: leafNormal,
      width: 0.75 * (0.8 + 0.4 * (1.0 - ageFactor)),
      length: leafH * 0.95,
      leafType: 2 as PlantLeafType, // Amazon Sword broad leaf
      curl: 0.25 + ageFactor * 0.2,
      phyllotaxisIndex: i,
      ageOffset: ageFactor,
    });
  }

  const merged = BufferGeometryUtils.mergeGeometries(geometries, false);
  merged.computeVertexNormals();
  geometries.forEach(g => g.dispose());

  return {
    stemGeometry: merged,
    splats,
    bounds: { minY: origin.y, maxY: origin.y + maxHeight },
  };
}
