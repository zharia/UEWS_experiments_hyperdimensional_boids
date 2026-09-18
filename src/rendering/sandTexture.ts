/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Procedural Multi-Frequency Sand Texture Generator.
 * Synthesizes a realistic aquarium substrate using 4 octaves of noise:
 * - Low frequency: broad sediment dunes and current drifts.
 * - Mid frequency: current-formed sand ripples and ripple crests.
 * - High frequency: silica quartz granules, mineral specks, and crushed seashell flakes.
 * - Ultra-high frequency: micro-crystalline sparkle and tactile roughness.
 */
export function createProceduralSandTextures(): {
  sandTexture: THREE.CanvasTexture;
  sandBumpTexture: THREE.CanvasTexture;
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

  // Simple pseudo-random permutation table for fast noise
  const p = new Uint8Array(512);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.sin(i * 12.9898 + 78.233) * 43758.5453) & 255;
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

    // Fade curves
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

      // 1. Low Frequency Octave: Broad dunes & undulating sand drifts
      const f1 = perlin(nx * 4.0, ny * 4.0);

      // 2. Mid Frequency Octave: Directional ripple crests (formed by water currents)
      const rippleU = nx * 18.0 + f1 * 1.5;
      const rippleV = ny * 12.0;
      const f2 = Math.sin(rippleU * 2.5 + rippleV * 1.2) * 0.5 + 0.5;

      // 3. High Frequency Octave: Quartz granules and crushed shell sediment
      const f3 = perlin(nx * 64.0, ny * 64.0);

      // 4. Ultra-high Frequency Octave: Grain speckles and mineral micro-glints
      const f4 = Math.sin(nx * 180.0) * Math.cos(ny * 180.0);

      // Combined multi-frequency height / elevation
      const height = (f1 * 0.4 + f2 * 0.35 + f3 * 0.18 + f4 * 0.07) * 0.5 + 0.5;

      // Color Palette: Natural warm silica reef sand
      // Base warm ivory/champagne sand: (224, 206, 178)
      // Shadow / wet furrow valleys: (175, 154, 130)
      // Bright quartz ridge highlights: (245, 235, 215)
      let r = 185 + height * 55;
      let g = 165 + height * 52;
      let b = 138 + height * 48;

      // Occasional mineral specks (dark volcanic basalt grains and pearl shell flecks)
      const speck = Math.sin(x * 123.4 + y * 567.8);
      if (speck > 0.94) {
        // Dark basalt pebble speck
        r *= 0.65;
        g *= 0.62;
        b *= 0.60;
      } else if (speck < -0.96) {
        // Glistening crushed mother-of-pearl / calcium carbonate flake
        r = Math.min(255, r + 45);
        g = Math.min(255, g + 48);
        b = Math.min(255, b + 52);
      }

      cBuf[idx] = Math.max(0, Math.min(255, r));
      cBuf[idx + 1] = Math.max(0, Math.min(255, g));
      cBuf[idx + 2] = Math.max(0, Math.min(255, b));
      cBuf[idx + 3] = 255;

      // Bump/Height map value (0-255)
      const bumpVal = Math.max(0, Math.min(255, height * 255));
      bBuf[idx] = bumpVal;
      bBuf[idx + 1] = bumpVal;
      bBuf[idx + 2] = bumpVal;
      bBuf[idx + 3] = 255;
    }
  }

  cCtx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bumpData, 0, 0);

  const sandTexture = new THREE.CanvasTexture(colorCanvas);
  sandTexture.wrapS = THREE.RepeatWrapping;
  sandTexture.wrapT = THREE.RepeatWrapping;
  sandTexture.repeat.set(4, 2);

  const sandBumpTexture = new THREE.CanvasTexture(bumpCanvas);
  sandBumpTexture.wrapS = THREE.RepeatWrapping;
  sandBumpTexture.wrapT = THREE.RepeatWrapping;
  sandBumpTexture.repeat.set(4, 2);

  return { sandTexture, sandBumpTexture };
}

/**
 * Creates the sea floor mesh with multi-frequency vertex height displacement.
 */
export function createSandMesh(): THREE.Mesh {
  const sandGeo = new THREE.PlaneGeometry(32, 16, 64, 32);
  const posAttr = sandGeo.attributes.position;

  // Natural undulating dunes, hollows, and ripple crests
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);

    // Multi-frequency wave superposition for natural seabed topography
    const macroDunes = Math.sin(x * 0.25) * 0.35 + Math.cos(y * 0.4) * 0.25;
    const currentRipples = Math.sin(x * 1.6 + y * 0.8) * 0.12 + Math.cos(x * 2.4 - y * 1.2) * 0.06;
    const microHollows = Math.sin(x * 4.0 + y * 3.0) * 0.03;

    posAttr.setZ(i, macroDunes + currentRipples + microHollows);
  }
  sandGeo.computeVertexNormals();

  const { sandTexture, sandBumpTexture } = createProceduralSandTextures();

  const sandMat = new THREE.MeshStandardMaterial({
    map: sandTexture,
    bumpMap: sandBumpTexture,
    bumpScale: 0.08,
    roughness: 0.88,
    metalness: 0.04,
  });

  const sandMesh = new THREE.Mesh(sandGeo, sandMat);
  sandMesh.rotation.x = -Math.PI / 2;
  sandMesh.position.y = -6.8;
  sandMesh.position.z = 0;
  sandMesh.receiveShadow = true;

  return sandMesh;
}
