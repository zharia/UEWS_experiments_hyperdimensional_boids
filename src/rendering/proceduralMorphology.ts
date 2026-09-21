/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

// ============================================================================
// MATHEMATICAL SMOOTH MINIMUM & MAXIMUM UTILITIES (INIGO QUILEZ FORMULATIONS)
// ============================================================================

/**
 * Polynomial smooth minimum (smoothly blends between two values / distance fields)
 */
export function smin(a: number, b: number, k: number = 0.1): number {
  const h = Math.max(k - Math.abs(a - b), 0.0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/**
 * Polynomial smooth maximum (smoothly intersects two values / distance fields)
 */
export function smax(a: number, b: number, k: number = 0.1): number {
  return -smin(-a, -b, k);
}

/**
 * Cubic smooth minimum with continuous first derivative (C1 continuity)
 */
export function sminCubic(a: number, b: number, k: number = 0.1): number {
  const h = Math.max(k - Math.abs(a - b), 0.0) / k;
  return Math.min(a, b) - h * h * h * k * (1.0 / 6.0);
}

/**
 * Exponential smooth minimum for wide multi-scale blending
 */
export function sminExp(a: number, b: number, k: number = 16): number {
  const res = Math.exp(-k * a) + Math.exp(-k * b);
  return -Math.log(Math.max(0.00001, res)) / k;
}

// ============================================================================
// HIGH-FIDELITY BRACHYURAN CRAB CARAPACE (SEAMLESS WATERTIGHT MANIFOLD)
// ============================================================================

/**
 * Generates an anatomically authentic Brachyuran Shore Crab Carapace.
 * Constructed as a seamless watertight manifold disc with upper dorsal shield
 * and ventral sternum containing integrated coxal leg sockets.
 *
 * Sculpted with smooth-min and smooth-max distance blending:
 * - Mesogastric, protogastric, and cardiac vaults
 * - Cervical and epibranchial grooves
 * - 5 forward-curving anterolateral denticles (spines) per side
 * - Deep orbital notches for eyestalks and rostral frontal lobes
 * - Ventral coxal sockets for legs to insert seamlessly
 */
export function createHighDetailCrabCarapaceGeometry(): THREE.BufferGeometry {
  const radialRings = 24;
  const angularSectors = 48;

  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Crab carapace width & length proportions (wider than long)
  const halfWidth = 0.52;
  const halfLength = 0.38;

  // Function to compute boundary perimeter radius and tooth profile at angle theta
  // theta = 0 (right lateral), PI/2 (anterior front), PI (left lateral), 3PI/2 (posterior rear)
  function getCarapaceProfile(theta: number) {
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    // Base fan-hexagonal contour
    let rBase = (halfWidth * halfLength) / Math.sqrt(
      Math.pow(halfLength * cosT, 2.0) + Math.pow(halfWidth * sinT, 2.0)
    );

    // Flatten posterior margin (rear)
    if (sinT < -0.2) {
      const rearFlatten = Math.pow(Math.max(0, -sinT - 0.2) / 0.8, 1.8) * 0.12;
      rBase -= rearFlatten;
    }

    // Anterolateral teeth: 5 triangular serrations on each side
    // Right side: theta between ~0.12*PI and 0.42*PI
    // Left side: theta between ~0.58*PI and 0.88*PI
    let toothSpine = 0.0;
    const isRightLateral = theta >= 0.10 * Math.PI && theta <= 0.44 * Math.PI;
    const isLeftLateral = theta >= 0.56 * Math.PI && theta <= 0.90 * Math.PI;

    if (isRightLateral || isLeftLateral) {
      const toothPhase = isRightLateral
        ? ((theta - 0.10 * Math.PI) / (0.34 * Math.PI)) * 5.0 * Math.PI * 2
        : ((theta - 0.56 * Math.PI) / (0.34 * Math.PI)) * 5.0 * Math.PI * 2;

      // Asymmetric forward-pointing saw-tooth wave
      const saw = (Math.sin(toothPhase) + 0.4 * Math.sin(toothPhase * 2.0));
      toothSpine = Math.max(0, saw) * 0.038;
    }

    // Frontal margin & orbital recesses for eyestalks (theta near PI/2)
    let orbitRecess = 0.0;
    if (sinT > 0.6) {
      const distOrbitR = Math.hypot(cosT - 0.36, sinT - 0.92);
      const distOrbitL = Math.hypot(cosT + 0.36, sinT - 0.92);
      const orbitDepthR = Math.exp(-distOrbitR * distOrbitR * 30.0) * 0.045;
      const orbitDepthL = Math.exp(-distOrbitL * distOrbitL * 30.0) * 0.045;
      orbitRecess = smax(orbitDepthR, orbitDepthL, 0.02);
    }

    return rBase + toothSpine - orbitRecess;
  }

  // --- 1. DORSAL SHIELD (UPPER CARAPACE) ---
  // Center apex vertex
  const dorsalCenterIdx = 0;
  vertices.push(0, 0.18, 0.02);
  uvs.push(0.5, 0.5);

  for (let ir = 1; ir <= radialRings; ir++) {
    const rFrac = ir / radialRings; // 0 to 1

    for (let is = 0; is < angularSectors; is++) {
      const theta = (is / angularSectors) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const maxR = getCarapaceProfile(theta);
      const curR = maxR * rFrac;

      const px = cosT * curR;
      const pz = sinT * curR;

      // Base parabolic dorsal dome
      let y = 0.18 * (1.0 - Math.pow(rFrac, 1.8));

      // Sculpted anatomical lobes via smooth-max and smooth-min:
      // A. Gastric vault (anterior central dome)
      const dGastric = Math.hypot(px, pz - 0.09);
      const gastricDome = Math.exp(-dGastric * dGastric * 22.0) * 0.065;

      // B. Cardiac dome (central posterior vault)
      const dCardiac = Math.hypot(px, pz + 0.10);
      const cardiacDome = Math.exp(-dCardiac * dCardiac * 25.0) * 0.055;

      // C. Branchial vaults (left and right lateral gill chambers)
      const dBranchL = Math.hypot(px + 0.22, pz + 0.02);
      const dBranchR = Math.hypot(px - 0.22, pz + 0.02);
      const branchL = Math.exp(-dBranchL * dBranchL * 24.0) * 0.052;
      const branchR = Math.exp(-dBranchR * dBranchR * 24.0) * 0.052;

      // Smooth-max blend of dorsal lobes
      let lobes = smax(gastricDome, cardiacDome, 0.035);
      lobes = smax(lobes, branchL, 0.035);
      lobes = smax(lobes, branchR, 0.035);

      // D. Cervical & Epibranchial grooves (creases carved with smin)
      const cervicalGrooveDist = Math.abs(pz - (0.02 - 0.15 * Math.pow(px / halfWidth, 2.0)));
      const cervicalGroove = Math.exp(-cervicalGrooveDist * cervicalGrooveDist * 90.0) * 0.028 * (1.0 - rFrac * 0.4);

      y = (y + lobes) - cervicalGroove;

      // Outer margin rim lip
      if (rFrac > 0.85) {
        const rimT = (rFrac - 0.85) / 0.15;
        y = smin(y, 0.015 + (1.0 - rimT) * 0.03, 0.02);
      }

      vertices.push(px, y, pz);
      uvs.push(0.5 + 0.5 * (px / halfWidth), 0.5 + 0.5 * (pz / halfLength));
    }
  }

  // Dorsal face indices: center fan
  for (let is = 0; is < angularSectors; is++) {
    const nextS = (is + 1) % angularSectors;
    indices.push(dorsalCenterIdx, 1 + is, 1 + nextS);
  }

  // Dorsal face indices: concentric rings
  for (let ir = 1; ir < radialRings; ir++) {
    const ringStart = 1 + (ir - 1) * angularSectors;
    const nextRingStart = 1 + ir * angularSectors;

    for (let is = 0; is < angularSectors; is++) {
      const nextS = (is + 1) % angularSectors;
      const a = ringStart + is;
      const b = ringStart + nextS;
      const c = nextRingStart + is;
      const d = nextRingStart + nextS;

      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  // --- 2. VENTRAL STERNUM (UNDERBELLY WITH INTEGRATED COXAL LEG SOCKETS) ---
  const ventralOffset = vertices.length / 3;
  // Ventral center vertex
  vertices.push(0, -0.04, 0.0);
  uvs.push(0.5, 0.5);

  for (let ir = 1; ir <= radialRings; ir++) {
    const rFrac = ir / radialRings;

    for (let is = 0; is < angularSectors; is++) {
      const theta = (is / angularSectors) * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const maxR = getCarapaceProfile(theta);
      const curR = maxR * rFrac;

      const px = cosT * curR;
      const pz = sinT * curR;

      // Base flattened sternum underbelly
      let y = -0.04 - (0.045 * (1.0 - Math.pow(rFrac, 1.5)));

      // At the perimeter (rFrac = 1), seamlessly match the dorsal shell rim!
      if (rFrac > 0.88) {
        const rimT = (rFrac - 0.88) / 0.12;
        y = y * (1.0 - rimT) + 0.015 * rimT;
      }

      // Sternal thoracic grooves and abdominal flap depression
      const isAbdomen = Math.abs(px) < 0.18 && pz < 0.12;
      if (isAbdomen) {
        y += 0.015; // Inset abdominal plastron
      }

      // Integrated coxal leg sockets: 4 walking legs + 1 claw socket on left and right
      // These are smooth spherical socket hollows carved into the sternum
      const side = px < 0 ? -1 : 1;
      const absX = Math.abs(px);
      for (let legI = 0; legI < 5; legI++) {
        const sockZ = -0.20 + legI * 0.11;
        const sockX = 0.32 - Math.abs(sockZ) * 0.15;
        const dSocket = Math.hypot(absX - sockX, pz - sockZ);
        if (dSocket < 0.09) {
          const socketHollow = Math.cos((dSocket / 0.09) * Math.PI * 0.5) * 0.035;
          y = smin(y, y + socketHollow, 0.015);
        }
      }

      vertices.push(px, y, pz);
      uvs.push(0.5 + 0.5 * (px / halfWidth), 0.5 + 0.5 * (pz / halfLength));
    }
  }

  // Ventral face indices: center fan (facing downward)
  for (let is = 0; is < angularSectors; is++) {
    const nextS = (is + 1) % angularSectors;
    indices.push(ventralOffset, ventralOffset + 1 + nextS, ventralOffset + 1 + is);
  }

  // Ventral face indices: concentric rings (facing downward)
  for (let ir = 1; ir < radialRings; ir++) {
    const ringStart = ventralOffset + 1 + (ir - 1) * angularSectors;
    const nextRingStart = ventralOffset + 1 + ir * angularSectors;

    for (let is = 0; is < angularSectors; is++) {
      const nextS = (is + 1) % angularSectors;
      const a = ringStart + is;
      const b = ringStart + nextS;
      const c = nextRingStart + is;
      const d = nextRingStart + nextS;

      indices.push(a, b, c);
      indices.push(b, d, c);
    }
  }

  // --- 3. WATERTIGHT PERIMETER RIM CONNECTION ---
  // Connect outermost dorsal ring to outermost ventral ring
  const dorsalOutRing = 1 + (radialRings - 1) * angularSectors;
  const ventralOutRing = ventralOffset + 1 + (radialRings - 1) * angularSectors;

  for (let is = 0; is < angularSectors; is++) {
    const nextS = (is + 1) % angularSectors;
    const d1 = dorsalOutRing + is;
    const d2 = dorsalOutRing + nextS;
    const v1 = ventralOutRing + is;
    const v2 = ventralOutRing + nextS;

    indices.push(d1, d2, v1);
    indices.push(d2, v2, v1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// ============================================================================
// CONTINUOUS ARTICULATED CRAB LEGS WITH SMOOTH CONDYLE JOINTS
// ============================================================================

/**
 * Creates anatomically articulated limb segments with smooth ball-and-socket condyles:
 * 1. Coxa: Basal socket joint with smooth articular collar that fits into the sternal socket
 * 2. Merus (Thigh): Long muscular segment with rounded proximal condyle and distal hinge socket
 * 3. Carpus/Propodus (Knee/Shin): Curved articular knee with smooth hinge fitting into merus
 * 4. Dactylus (Walking Claw): Tapered sharp curved chitin claw tip
 */
export function createHighDetailCrabLegGeometries(): {
  coxa: THREE.BufferGeometry;
  merus: THREE.BufferGeometry;
  carpusPropodus: THREE.BufferGeometry;
  dactylus: THREE.BufferGeometry;
} {
  const segs = 20;

  // 1. Coxa (Basal Socket Pivot): Rounded articular bulb with flared distal socket collar
  const coxaRings = 10;
  const coxaVerts: number[] = [];
  const coxaUvs: number[] = [];
  const coxaIndices: number[] = [];
  const coxaLength = 0.14;

  for (let ir = 0; ir <= coxaRings; ir++) {
    const t = ir / coxaRings;
    const y = t * coxaLength;
    // Proximal bulb (t=0) fits into carapace socket; flares to distal articular collar (t=1)
    const swell = Math.sin(t * Math.PI);
    const rx = smax(0.048, 0.065 * swell, 0.015);
    const rz = smax(0.042, 0.058 * swell, 0.015);

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      coxaVerts.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz);
      coxaUvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < coxaRings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      coxaIndices.push(a, b, a + 1);
      coxaIndices.push(b, b + 1, a + 1);
    }
  }

  const coxa = new THREE.BufferGeometry();
  coxa.setAttribute('position', new THREE.Float32BufferAttribute(coxaVerts, 3));
  coxa.setAttribute('uv', new THREE.Float32BufferAttribute(coxaUvs, 2));
  coxa.setIndex(coxaIndices);
  coxa.computeVertexNormals();

  // 2. Merus (Muscular Upper Thigh): Rounded proximal ball condyle, muscular belly, distal knee socket
  const merusRings = 14;
  const merusVerts: number[] = [];
  const merusUvs: number[] = [];
  const merusIndices: number[] = [];
  const merusLength = 0.32;

  for (let ir = 0; ir <= merusRings; ir++) {
    const t = ir / merusRings;
    const y = t * merusLength;

    // Muscular swelling profile smoothly blended
    const swell = Math.sin(t * Math.PI);
    const rx = smax(0.038, 0.055 * swell, 0.015);
    const rz = smax(0.030, 0.044 * swell, 0.015);

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      // Longitudinal dorsal ridge characteristic of brachyuran crab legs
      const ridge = Math.max(0, Math.cos(angle)) * 0.012 * swell;
      merusVerts.push(Math.cos(angle) * rx, y, Math.sin(angle) * (rz + ridge));
      merusUvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < merusRings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      merusIndices.push(a, b, a + 1);
      merusIndices.push(b, b + 1, a + 1);
    }
  }

  const merus = new THREE.BufferGeometry();
  merus.setAttribute('position', new THREE.Float32BufferAttribute(merusVerts, 3));
  merus.setAttribute('uv', new THREE.Float32BufferAttribute(merusUvs, 2));
  merus.setIndex(merusIndices);
  merus.computeVertexNormals();

  // 3. Carpus & Propodus (Knee + Shin): Articular rounded knee condyle, tapers downward
  const cpRings = 14;
  const cpVerts: number[] = [];
  const cpUvs: number[] = [];
  const cpIndices: number[] = [];
  const cpLength = 0.28;

  for (let ir = 0; ir <= cpRings; ir++) {
    const t = ir / cpRings;
    const y = t * cpLength;
    // Rounded knee ball condyle at t=0, tapering toward ankle
    const kneeBulb = (1.0 - t) * 0.022;
    const rx = smin(0.040 + kneeBulb, 0.042 * (1.0 - t * 0.5) + 0.018, 0.012);
    const rz = rx * 0.85;

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      cpVerts.push(Math.cos(angle) * rx, y, Math.sin(angle) * rz);
      cpUvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < cpRings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      cpIndices.push(a, b, a + 1);
      cpIndices.push(b, b + 1, a + 1);
    }
  }

  const carpusPropodus = new THREE.BufferGeometry();
  carpusPropodus.setAttribute('position', new THREE.Float32BufferAttribute(cpVerts, 3));
  carpusPropodus.setAttribute('uv', new THREE.Float32BufferAttribute(cpUvs, 2));
  carpusPropodus.setIndex(cpIndices);
  carpusPropodus.computeVertexNormals();

  // 4. Dactylus (Curved Pointed Chitin Claw Tip)
  const dactylRings = 12;
  const dactylVerts: number[] = [];
  const dactylUvs: number[] = [];
  const dactylIndices: number[] = [];
  const dactylLength = 0.20;

  for (let ir = 0; ir <= dactylRings; ir++) {
    const t = ir / dactylRings;
    const y = t * dactylLength;
    // Graceful curved claw arc
    const curveOffset = Math.pow(t, 2.0) * 0.045;
    // Taper to sharp tip
    const r = (1.0 - t) * 0.024 + 0.0035;

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      const x = Math.cos(angle) * r - curveOffset;
      const z = Math.sin(angle) * r * 0.8;
      dactylVerts.push(x, y, z);
      dactylUvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < dactylRings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      dactylIndices.push(a, b, a + 1);
      dactylIndices.push(b, b + 1, a + 1);
    }
  }

  const dactylus = new THREE.BufferGeometry();
  dactylus.setAttribute('position', new THREE.Float32BufferAttribute(dactylVerts, 3));
  dactylus.setAttribute('uv', new THREE.Float32BufferAttribute(dactylUvs, 2));
  dactylus.setIndex(dactylIndices);
  dactylus.computeVertexNormals();

  return { coxa, merus, carpusPropodus, dactylus };
}

// ============================================================================
// HIGH-FIDELITY CRAB CHELIPEDS (CLAW PALM & SERRATED MOVABLE PINCER)
// ============================================================================

/**
 * Creates anatomically sculpted Crab Chelipeds (Claws):
 * 1. Propodus: Swollen muscular palm with seamless fixed lower finger (pollex)
 * 2. Movable Dactylus: Upper arched pincer with interlocking crushing teeth
 */
export function createHighDetailClawGeometries(): {
  propodus: THREE.BufferGeometry;
  dactylus: THREE.BufferGeometry;
} {
  const rings = 20;
  const segs = 20;
  const pVerts: number[] = [];
  const pUvs: number[] = [];
  const pIndices: number[] = [];

  for (let ir = 0; ir <= rings; ir++) {
    const t = ir / rings;
    const z = t * 0.36; // Along claw longitudinal length

    let rx: number;
    let ry: number;
    let offsetX = 0.0;
    let offsetY = 0.0;

    if (t < 0.52) {
      // Bulbous muscular palm (adductor muscle chamber)
      const swell = Math.sin((t / 0.52) * Math.PI);
      rx = smax(0.065, 0.105 * swell, 0.025);
      ry = smax(0.055, 0.095 * swell, 0.025);
    } else {
      // Fixed finger (pollex) curves smoothly inward with gripping tooth ledge
      const fT = (t - 0.52) / 0.48;
      rx = (1.0 - fT) * 0.055 + 0.009;
      ry = (1.0 - fT) * 0.048 + 0.007;
      offsetY = -fT * 0.035; // Curves downward
      offsetX = -fT * 0.022; // Inward curve
    }

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      // Crushing molar teeth along the inner cutting edge of pollex
      let toothBump = 0.0;
      if (t > 0.55 && sinA > 0.4 && cosA > 0.4) {
        toothBump = Math.max(0, Math.sin(t * 28.0)) * 0.008;
      }

      const x = cosA * (rx + toothBump) + offsetX;
      const y = sinA * (ry + toothBump) + offsetY;
      pVerts.push(x, y, z);
      pUvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < rings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      pIndices.push(a, b, a + 1);
      pIndices.push(b, b + 1, a + 1);
    }
  }

  const propodus = new THREE.BufferGeometry();
  propodus.setAttribute('position', new THREE.Float32BufferAttribute(pVerts, 3));
  propodus.setAttribute('uv', new THREE.Float32BufferAttribute(pUvs, 2));
  propodus.setIndex(pIndices);
  propodus.computeVertexNormals();

  // Movable Upper Dactylus (Curved clamping pincer with interlocking teeth)
  const dRings = 16;
  const dVerts: number[] = [];
  const dUvs: number[] = [];
  const dIndices: number[] = [];

  for (let ir = 0; ir <= dRings; ir++) {
    const t = ir / dRings;
    const z = t * 0.22;
    const archY = -Math.pow(t, 1.7) * 0.055; // Arches down to meet lower pollex
    const archX = -t * 0.024;
    const r = (1.0 - t) * 0.042 + 0.008;

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      // Serrated gripping teeth along the bottom clamping edge
      const isTeethEdge = Math.cos(angle) > 0.5 && Math.sin(angle) < -0.3;
      const tooth = isTeethEdge ? Math.max(0, Math.sin(t * 32.0)) * 0.007 : 0.0;

      const x = Math.cos(angle) * (r + tooth) + archX;
      const y = Math.sin(angle) * (r + tooth) + archY;
      dVerts.push(x, y, z);
      dUvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < dRings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      dIndices.push(a, b, a + 1);
      dIndices.push(b, b + 1, a + 1);
    }
  }

  const dactylus = new THREE.BufferGeometry();
  dactylus.setAttribute('position', new THREE.Float32BufferAttribute(dVerts, 3));
  dactylus.setAttribute('uv', new THREE.Float32BufferAttribute(dUvs, 2));
  dactylus.setIndex(dIndices);
  dactylus.computeVertexNormals();

  return { propodus, dactylus };
}

// ============================================================================
// HIGH-RESOLUTION HERMIT CRAB CONCH SHELL
// ============================================================================

/**
 * Generates an authentic high-resolution logarithmic spiral conch shell.
 * 64 axial steps and 32 radial segments for completely smooth curvature,
 * smooth-min whorl sutures, and flared peristome aperture.
 */
export function createHighResolutionHermitShellGeometry(): THREE.BufferGeometry {
  const steps = 72;
  const radialSegments = 28;
  const turns = 3.3;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const a = 0.042;
  const b = 0.165;
  const pitch = 0.088;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = t * turns * Math.PI * 2;

    const spiralR = a * Math.exp(b * theta);
    const spineX = Math.cos(theta) * spiralR;
    const spineZ = Math.sin(theta) * spiralR;
    const spineY = t * pitch * theta;

    const tubeRadius = spiralR * 0.44;

    const tangent = new THREE.Vector3(
      -Math.sin(theta) * spiralR + Math.cos(theta) * spiralR * b,
      pitch * (1.0 + b * theta),
      Math.cos(theta) * spiralR + Math.sin(theta) * spiralR * b
    ).normalize();

    const normal = new THREE.Vector3(Math.cos(theta), 0.22, Math.sin(theta)).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    // Flared aperture peristome at entrance
    const apertureFlare = 1.0 + Math.pow(Math.max(0, (t - 0.82) / 0.18), 2.0) * 0.72;

    for (let j = 0; j <= radialSegments; j++) {
      const uRad = (j / radialSegments) * Math.PI * 2;
      const cosR = Math.cos(uRad);
      const sinR = Math.sin(uRad);

      let rMod = tubeRadius * apertureFlare;
      // Smooth-min contact with adjacent inner whorl
      if (sinR < -0.05) {
        rMod = smin(rMod, rMod * 0.72, 0.04);
      }

      const offset = new THREE.Vector3()
        .addScaledVector(normal, cosR * rMod)
        .addScaledVector(binormal, sinR * rMod * 0.9);

      vertices.push(spineX + offset.x, spineY + offset.y, spineZ + offset.z);
      uvs.push(t, j / radialSegments);
    }
  }

  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const aIdx = i * (radialSegments + 1) + j;
      const bIdx = aIdx + radialSegments + 1;

      indices.push(aIdx, bIdx, aIdx + 1);
      indices.push(bIdx, bIdx + 1, aIdx + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  geometry.rotateZ(Math.PI * 0.42);
  geometry.rotateX(Math.PI * 0.15);
  geometry.scale(1.22, 1.22, 1.22);
  geometry.translate(-0.16, 0.18, -0.18);

  return geometry;
}

// ============================================================================
// HIGH-RESOLUTION GASTROPOD SNAIL SHELL & ORGANIC FOOT
// ============================================================================

export function createSpiralSnailShellGeometry(isNerite: boolean): THREE.BufferGeometry {
  const steps = isNerite ? 68 : 80;
  const radialSegments = 24;
  const turns = isNerite ? 2.4 : 3.5;

  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const a = 0.038;
  const b = isNerite ? 0.21 : 0.16;
  const pitch = isNerite ? 0.048 : 0.082;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const theta = t * turns * Math.PI * 2;

    const rSpiral = a * Math.exp(b * theta);
    const sx = Math.cos(theta) * rSpiral;
    const sz = Math.sin(theta) * rSpiral;
    const sy = t * pitch * theta;

    const tubeRadius = rSpiral * (isNerite ? 0.64 : 0.48);

    const tangent = new THREE.Vector3(
      -Math.sin(theta) * rSpiral + Math.cos(theta) * rSpiral * b,
      pitch * (1.0 + b * theta),
      Math.cos(theta) * rSpiral + Math.sin(theta) * rSpiral * b
    ).normalize();

    const normal = new THREE.Vector3(Math.cos(theta), 0.25, Math.sin(theta)).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();

    const flare = 1.0 + Math.pow(Math.max(0, (t - 0.82) / 0.18), 2.2) * 0.75;

    for (let j = 0; j <= radialSegments; j++) {
      const uRad = (j / radialSegments) * Math.PI * 2;
      const cosR = Math.cos(uRad);
      const sinR = Math.sin(uRad);

      let rMod = tubeRadius * flare;
      if (sinR < -0.1) {
        rMod = smin(rMod, rMod * 0.68, 0.035);
      }

      const offset = new THREE.Vector3()
        .addScaledVector(normal, cosR * rMod)
        .addScaledVector(binormal, sinR * rMod * (isNerite ? 1.05 : 0.92));

      vertices.push(sx + offset.x, sy + offset.y, sz + offset.z);
      uvs.push(t, j / radialSegments);
    }
  }

  for (let i = 0; i < steps; i++) {
    for (let j = 0; j < radialSegments; j++) {
      const aIdx = i * (radialSegments + 1) + j;
      const bIdx = aIdx + radialSegments + 1;
      indices.push(aIdx, bIdx, aIdx + 1);
      indices.push(bIdx, bIdx + 1, aIdx + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  geometry.rotateZ(Math.PI * 0.38);
  geometry.rotateX(Math.PI * 0.2);
  geometry.scale(1.2, 1.2, 1.2);
  geometry.translate(0, 0.22, -0.06);

  return geometry;
}

export function createOrganicSnailFootGeometry(): THREE.BufferGeometry {
  const zSegments = 24;
  const xSegments = 18;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iz = 0; iz <= zSegments; iz++) {
    const tz = iz / zSegments;
    const z = -0.32 + tz * 0.68;
    const soleWidth = Math.sin(tz * Math.PI * 0.85 + 0.15) * 0.22;

    for (let ix = 0; ix <= xSegments; ix++) {
      const tx = ix / xSegments;
      const xNorm = (tx - 0.5) * 2.0;
      const x = xNorm * soleWidth;

      let y = 0.015;

      if (tz > 0.25 && tz < 0.85) {
        const humpT = Math.sin(((tz - 0.25) / 0.6) * Math.PI);
        const lateralFalloff = 1.0 - xNorm * xNorm;
        const humpHeight = humpT * lateralFalloff * 0.18;
        y = smax(y, y + humpHeight, 0.04);
      }

      if (tz > 0.85) {
        const headT = (tz - 0.85) / 0.15;
        y += headT * 0.05 * (1.0 - Math.abs(xNorm));
      }

      const edgeRoll = (1.0 - xNorm * xNorm) * 0.02;
      y += edgeRoll;

      verts.push(x, y, z);
      uvs.push(tx, tz);
    }
  }

  for (let iz = 0; iz < zSegments; iz++) {
    for (let ix = 0; ix < xSegments; ix++) {
      const a = iz * (xSegments + 1) + ix;
      const b = a + xSegments + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createSnailTentacleGeometry(): THREE.BufferGeometry {
  const rings = 14;
  const segs = 12;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const length = 0.32;

  for (let ir = 0; ir <= rings; ir++) {
    const t = ir / rings;
    const y = t * length;

    const curveX = Math.sin(t * Math.PI * 0.5) * 0.035;
    const curveZ = Math.pow(t, 1.5) * 0.05;

    let r: number;
    if (t < 0.85) {
      r = (1.0 - t * 0.6) * 0.018;
    } else {
      const bulbT = Math.sin(((t - 0.85) / 0.15) * Math.PI);
      r = 0.012 + bulbT * 0.014;
    }

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      const x = Math.cos(angle) * r + curveX;
      const z = Math.sin(angle) * r + curveZ;
      verts.push(x, y, z);
      uvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < rings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

// ============================================================================
// STREAMLINED GHOST SHRIMP (CALM, REALISTIC EPIBENTHIC DECAPOD)
// ============================================================================

export function createShrimpCarapaceGeometry(): THREE.BufferGeometry {
  const zRings = 24;
  const radialSegs = 20;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const length = 0.56;

  for (let iz = 0; iz <= zRings; iz++) {
    const t = iz / zRings;
    const z = -0.22 + t * length;

    let rx: number;
    let ry: number;
    let offsetY = 0.0;

    if (t < 0.72) {
      const bodyT = t / 0.72;
      const swell = Math.sin(bodyT * Math.PI * 0.85 + 0.15);
      rx = smax(0.08, 0.135 * swell, 0.02);
      ry = smax(0.09, 0.145 * swell, 0.02);
      offsetY = 0.015;
    } else {
      const rostT = (t - 0.72) / 0.28;
      rx = (1.0 - rostT) * 0.065 + 0.008;
      ry = (1.0 - rostT) * 0.075 + 0.008;
      offsetY = 0.015 + rostT * 0.045;
    }

    for (let is = 0; is <= radialSegs; is++) {
      const angle = (is / radialSegs) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let toothR = 0.0;
      if (sinA > 0.75 && t > 0.3) {
        toothR = Math.max(0, Math.sin(t * 36.0)) * 0.012;
      }

      let lateralExp = 0.0;
      if (t < 0.65 && Math.abs(cosA) > 0.6) {
        lateralExp = 0.016 * Math.sin((t / 0.65) * Math.PI);
      }

      const x = cosA * (rx + lateralExp);
      const y = sinA * (ry + toothR) + offsetY;
      verts.push(x, y, z);
      uvs.push(is / radialSegs, t);
    }
  }

  for (let iz = 0; iz < zRings; iz++) {
    for (let is = 0; is < radialSegs; is++) {
      const a = iz * (radialSegs + 1) + is;
      const b = a + radialSegs + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createShrimpSomiteGeometry(index: number): THREE.BufferGeometry {
  const zRings = 10;
  const radialSegs = 16;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const length = 0.16;

  const taper = 1.0 - index * 0.085;
  const isHump = index === 2;

  for (let iz = 0; iz <= zRings; iz++) {
    const t = iz / zRings;
    const z = -length * 0.5 + t * length;

    let rx = 0.105 * taper;
    let ry = 0.115 * taper;
    if (isHump) {
      ry *= 1.18;
    }

    for (let is = 0; is <= radialSegs; is++) {
      const angle = (is / radialSegs) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      let pleuraExtend = 0.0;
      if (sinA < 0.0 && Math.abs(cosA) > 0.3) {
        pleuraExtend = 0.024 * taper * Math.abs(cosA);
      }

      const x = cosA * rx;
      const y = sinA * ry - pleuraExtend;
      verts.push(x, y, z);
      uvs.push(is / radialSegs, t);
    }
  }

  for (let iz = 0; iz < zRings; iz++) {
    for (let is = 0; is < radialSegs; is++) {
      const a = iz * (radialSegs + 1) + is;
      const b = a + radialSegs + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createShrimpTelsonGeometry(): THREE.BufferGeometry {
  const zRings = 12;
  const segs = 12;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const length = 0.22;

  for (let iz = 0; iz <= zRings; iz++) {
    const t = iz / zRings;
    const z = -t * length;
    const rx = (1.0 - t * 0.85) * 0.038;
    const ry = (1.0 - t * 0.85) * 0.022;

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      const x = Math.cos(angle) * rx;
      const y = Math.sin(angle) * ry;
      verts.push(x, y, z);
      uvs.push(is / segs, t);
    }
  }

  for (let iz = 0; iz < zRings; iz++) {
    for (let is = 0; is < segs; is++) {
      const a = iz * (segs + 1) + is;
      const b = a + segs + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createShrimpUropodGeometry(isExopod: boolean): THREE.BufferGeometry {
  const rings = 10;
  const segs = 10;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const length = isExopod ? 0.24 : 0.20;

  for (let ir = 0; ir <= rings; ir++) {
    const t = ir / rings;
    const z = -t * length;
    const width = Math.sin(t * Math.PI * 0.75 + 0.25) * (isExopod ? 0.075 : 0.06);

    for (let is = 0; is <= segs; is++) {
      const tx = (is / segs - 0.5) * 2.0;
      const x = tx * width;
      const y = -Math.pow(tx, 2.0) * 0.01;
      verts.push(x, y, z);
      uvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < rings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createShrimpPereiopodGeometry(hasChela: boolean): THREE.BufferGeometry {
  const rings = 12;
  const segs = 8;
  const verts: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const length = 0.26;

  for (let ir = 0; ir <= rings; ir++) {
    const t = ir / rings;
    const y = -t * length;
    const curveZ = Math.sin(t * Math.PI * 0.6) * 0.04;
    const r = (1.0 - t * 0.5) * 0.012;

    for (let is = 0; is <= segs; is++) {
      const angle = (is / segs) * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r + curveZ;
      verts.push(x, y, z);
      uvs.push(is / segs, t);
    }
  }

  for (let ir = 0; ir < rings; ir++) {
    for (let is = 0; is < segs; is++) {
      const a = ir * (segs + 1) + is;
      const b = a + segs + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}
