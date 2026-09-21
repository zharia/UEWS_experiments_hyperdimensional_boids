/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Procedural Multi-Frequency Rock & Mineral Texture Generator.
 * Synthesizes natural aquarium river rock / seiryu slate stone:
 * - Stratified sedimentary layers and mineral fractures.
 * - Quartz vein inclusions and micro-crystalline highlights.
 * - Weathered stone base with high visibility and natural contrast.
 */
export function createProceduralRockTextures(): {
  rockTexture: THREE.CanvasTexture;
  rockBumpTexture: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const imgData = cCtx.createImageData(size, size);
  const bumpData = bCtx.createImageData(size, size);
  const cBuf = imgData.data;
  const bBuf = bumpData.data;

  // Pseudo-random permutation table for 2D noise
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.sin(i * 17.135 + 43.197) * 43758.5453) & 255;
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  for (let i = 0; i < 256; i++) p[256 + i] = p[i];

  function grad(hash: number, x: number, y: number) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  function perlin(x: number, y: number) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

    const a = p[X] + Y;
    const b = p[X + 1] + Y;

    const g00 = grad(p[a], xf, yf);
    const g10 = grad(p[b], xf - 1, yf);
    const g01 = grad(p[a + 1], xf, yf - 1);
    const g11 = grad(p[b + 1], xf - 1, yf - 1);

    const x1 = g00 + u * (g10 - g00);
    const x2 = g01 + u * (g11 - g01);
    return x1 + v * (x2 - x1);
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const nx = x / size;
      const ny = y / size;

      // 1. Broad undulating stone terrain
      const n1 = perlin(nx * 4.0, ny * 4.0);

      // 2. Sedimentary stratification / angled mineral bedding planes
      const angleU = nx * 14.0 + ny * 6.0 + n1 * 1.8;
      const strata = Math.sin(angleU * 3.14159) * 0.5 + 0.5;

      // 3. Crisp quartz / calcite fracture veins
      const veinNoise = perlin(nx * 12.0 + 5.2, ny * 12.0 + 8.1);
      const veinDist = Math.abs(Math.sin((nx * 8.0 + ny * 14.0 + veinNoise * 2.2) * Math.PI));
      const isVein = veinDist < 0.08 ? (1.0 - veinDist / 0.08) : 0.0;

      // 4. Fine stone grain / micro-fissures
      const nFine = perlin(nx * 48.0, ny * 48.0);

      // Height composite for bump
      const bumpHeight = strata * 0.45 + n1 * 0.35 + nFine * 0.20 + isVein * 0.35;

      // Base bright natural stone color: warm slate grey / seiryu limestone
      // Base: rgb(155, 148, 142) to rgb(195, 188, 180) - clearly visible and crisp!
      let r = 160 + n1 * 35 + strata * 25;
      let g = 152 + n1 * 32 + strata * 22;
      let b = 144 + n1 * 30 + strata * 20;

      // Quartz vein: bright crystalline highlight
      if (isVein > 0) {
        r = r * (1.0 - isVein) + 235 * isVein;
        g = g * (1.0 - isVein) + 230 * isVein;
        b = b * (1.0 - isVein) + 225 * isVein;
      }

      // Micro-mineral flecks
      const fleck = Math.sin(x * 89.1 + y * 231.7);
      if (fleck > 0.96) {
        // Mica mineral glint
        r = Math.min(255, r + 45);
        g = Math.min(255, g + 45);
        b = Math.min(255, b + 50);
      } else if (fleck < -0.97) {
        // Dark iron oxide sediment line
        r *= 0.78;
        g *= 0.74;
        b *= 0.70;
      }

      cBuf[idx] = Math.max(0, Math.min(255, Math.round(r)));
      cBuf[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      cBuf[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      cBuf[idx + 3] = 255;

      // Bump map
      const bVal = Math.max(0, Math.min(255, Math.round(bumpHeight * 255)));
      bBuf[idx] = bVal;
      bBuf[idx + 1] = bVal;
      bBuf[idx + 2] = bVal;
      bBuf[idx + 3] = 255;
    }
  }

  cCtx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const rockTexture = new THREE.CanvasTexture(colorCanvas);
  rockTexture.wrapS = THREE.RepeatWrapping;
  rockTexture.wrapT = THREE.RepeatWrapping;
  rockTexture.repeat.set(1.8, 1.8);

  const rockBumpTexture = new THREE.CanvasTexture(bumpCanvas);
  rockBumpTexture.wrapS = THREE.RepeatWrapping;
  rockBumpTexture.wrapT = THREE.RepeatWrapping;
  rockBumpTexture.repeat.set(1.8, 1.8);

  return { rockTexture, rockBumpTexture };
}

/**
 * Creates an organically sculpted, faceted river rock / reef stone geometry.
 * Applies multi-octave 3D noise displacement to create natural crags, ledges,
 * and a flatter bottom for organic embedding in the substrate sand bed.
 */
export function createSculptedRockGeometry(radius: number, detail = 2): THREE.BufferGeometry {
  const geo = new THREE.DodecahedronGeometry(radius, detail);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    // Natural rock noise: shearing planes, craggy fissures, and stratified terraces
    const theta = Math.atan2(v.z, v.x);
    const phi = Math.acos(Math.max(-1, Math.min(1, v.y / (v.length() || 1))));

    // Layered noise displacement
    const n1 = Math.sin(theta * 3.0 + phi * 2.0) * Math.cos(v.y * 1.2);
    const n2 = Math.sin(theta * 7.0 - v.y * 2.5) * 0.35;
    const strata = Math.sin(v.y * 4.0) * 0.15; // horizontal stone layers

    let displacement = (n1 * 0.22 + n2 * 0.12 + strata) * radius;

    // Flatten bottom so the rock anchors naturally onto the sand bed
    if (v.y < -radius * 0.4) {
      const bottomT = Math.min(1.0, (-radius * 0.4 - v.y) / (radius * 0.6));
      v.y += bottomT * 0.3 * radius;
      displacement *= (1.0 - bottomT * 0.4);
    }

    const norm = v.clone().normalize();
    v.addScaledVector(norm, displacement);
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}
