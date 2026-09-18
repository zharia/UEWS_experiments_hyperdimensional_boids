/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface FireflyMeshSystem {
  mesh: THREE.InstancedMesh;
  attrFlashIntensity: THREE.InstancedBufferAttribute;
  attrTemporalAlpha: THREE.InstancedBufferAttribute;
  attrColorType: THREE.InstancedBufferAttribute;
  material: THREE.ShaderMaterial;
}

/**
 * Creates an ultra-high performance instanced billboard micro-firefly particle system.
 * Renders glowing bioluminescent plankton/firefly organisms that pulse, swarm,
 * and synchronize with Kuramoto phase coupling.
 */
export function createFireflyMesh(maxCount: number = 600): FireflyMeshSystem {
  // Billboard quad geometry
  const planeGeo = new THREE.PlaneGeometry(0.38, 0.38);

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aFlashIntensity;
      attribute float aTemporalAlpha;
      attribute float aColorType;

      varying vec2 vUv;
      varying float vFlashIntensity;
      varying float vTemporalAlpha;
      varying float vColorType;

      void main() {
        vUv = uv;
        vFlashIntensity = aFlashIntensity;
        vTemporalAlpha = aTemporalAlpha;
        vColorType = aColorType;

        if (aTemporalAlpha < 0.01) {
          gl_Position = vec2(-9999.0, -9999.0).xyxy;
          return;
        }

        // Extract instance world position from instanceMatrix column 3
        vec4 worldPos = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);

        // Billboard transform: align quad towards camera in view space
        vec4 mvPosition = modelViewMatrix * worldPos;

        // Dynamic pulse scaling when flashing
        float pulseScale = 0.85 + aFlashIntensity * 1.5;

        // Extract scale from instanceMatrix
        float instScale = length(vec3(instanceMatrix[0][0], instanceMatrix[0][1], instanceMatrix[0][2]));
        float finalSize = instScale * pulseScale;

        mvPosition.xy += position.xy * finalSize;

        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vFlashIntensity;
      varying float vTemporalAlpha;
      varying float vColorType;

      void main() {
        if (vTemporalAlpha < 0.01) {
          discard;
        }

        vec2 centered = vUv - vec2(0.5);
        float dist = length(centered);
        if (dist > 0.5) {
          discard;
        }

        // Soft double-Gaussian radial glow kernel
        float core = exp(-dist * dist * 42.0);
        float halo = exp(-dist * 6.5) * 0.45;
        float glow = core + halo;

        // Base bioluminescent palette by colorType
        vec3 color = vec3(0.52, 1.0, 0.22); // 0: Firefly phosphor lime-green
        if (vColorType > 0.5 && vColorType < 1.5) {
          color = vec3(0.15, 0.92, 1.0);  // 1: Radiant oceanic cyan
        } else if (vColorType >= 1.5) {
          color = vec3(1.0, 0.76, 0.18);  // 2: Golden amber twilight spark
        }

        // Flash ignition: core flares to energetic white-hot center
        float flashPeak = clamp(vFlashIntensity, 0.0, 1.0);
        vec3 flareColor = mix(color, vec3(1.0, 1.0, 0.95), flashPeak * flashPeak * 0.85);

        // Overall emission intensity
        float brightness = (0.28 + flashPeak * 2.6) * glow;
        vec3 finalColor = flareColor * brightness;

        // Temporal fade across 4th dimension
        gl_FragColor = vec4(finalColor, vTemporalAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.InstancedMesh(planeGeo, material, maxCount);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const flashArr = new Float32Array(maxCount);
  const alphaArr = new Float32Array(maxCount);
  const colorArr = new Float32Array(maxCount);

  const attrFlashIntensity = new THREE.InstancedBufferAttribute(flashArr, 1);
  const attrTemporalAlpha = new THREE.InstancedBufferAttribute(alphaArr, 1);
  const attrColorType = new THREE.InstancedBufferAttribute(colorArr, 1);

  planeGeo.setAttribute('aFlashIntensity', attrFlashIntensity);
  planeGeo.setAttribute('aTemporalAlpha', attrTemporalAlpha);
  planeGeo.setAttribute('aColorType', attrColorType);

  return {
    mesh,
    attrFlashIntensity,
    attrTemporalAlpha,
    attrColorType,
    material,
  };
}
