/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { SPECIES_CONFIGS } from '../simulation/species';

export function createFishGeometry(): THREE.BufferGeometry {
  // Create a streamlined fish geometry with body, dorsal fin, caudal fin (tail), and pectoral fins
  const length = 1.6;
  const segmentsX = 14;
  const segmentsRadial = 12;

  // Build sleek spindle body
  const bodyGeo = new THREE.CylinderGeometry(0.24, 0.08, length, segmentsRadial, segmentsX);
  bodyGeo.rotateZ(Math.PI / 2); // Align head towards +X, tail towards -X

  // Shape the body: tapered nose at +X, thickest at X = +0.2, tapered at -X (tail peduncle)
  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Normalized progress along fish spine: 0 (tail -0.8) to 1 (head +0.8)
    const t = Math.max(0, Math.min(1, (x + length * 0.5) / length));

    // Body profile curve
    const sinVal = Math.max(0, Math.sin(t * Math.PI));
    let radiusFactor = sinVal;
    if (t > 0.7) {
      // Snout taper (strictly non-negative base avoids NaN in Math.pow)
      radiusFactor = Math.pow(sinVal, 0.7);
    }

    // Laterally compressed (fish are taller than they are wide)
    const scaleY = 1.35;
    const scaleZ = 0.68;

    pos.setXYZ(i, x, y * radiusFactor * scaleY, z * radiusFactor * scaleZ);
  }
  bodyGeo.computeVertexNormals();
  bodyGeo.computeBoundingSphere();

  return bodyGeo;
}

export function createFishShaderMaterial(): THREE.ShaderMaterial {
  // Pass species colors as uniform arrays
  const speciesBodyColors: THREE.Vector3[] = [];
  const speciesStripeColors: THREE.Vector3[] = [];
  const speciesBiolumColors: THREE.Vector3[] = [];

  SPECIES_CONFIGS.forEach(s => {
    speciesBodyColors.push(new THREE.Vector3(s.bodyColor[0], s.bodyColor[1], s.bodyColor[2]));
    speciesStripeColors.push(new THREE.Vector3(s.stripeColor[0], s.stripeColor[1], s.stripeColor[2]));
    speciesBiolumColors.push(new THREE.Vector3(s.bioluminescentColor[0], s.bioluminescentColor[1], s.bioluminescentColor[2]));
  });

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeskLampPos: { value: new THREE.Vector3(-15.0, 10.0, 4.0) },
      uDeskLampColor: { value: new THREE.Color(0xffe8bd) },
      uDeskLampIntensity: { value: 1.2 },
      uWaterColor: { value: new THREE.Color(0x0c3b52) },
      uCausticStrength: { value: 0.8 },
      uSchoolCenter: { value: new THREE.Vector3(0, 0, 0) },
      uSpeciesBodyColors: { value: speciesBodyColors },
      uSpeciesStripeColors: { value: speciesStripeColors },
      uSpeciesBiolumColors: { value: speciesBiolumColors },
    },
    vertexShader: `
      attribute float aSwimPhase;
      attribute float aSpeed;
      attribute float aTemporalAlpha;
      attribute float aSpeciesIndex;
      attribute float aBioluminescence;

      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;
      varying float vTemporalAlpha;
      varying float vSpeciesIndex;
      varying float vBioluminescence;
      varying vec3 vLocalPos;

      uniform float uTime;

      void main() {
        vSpeciesIndex = aSpeciesIndex;
        vTemporalAlpha = aTemporalAlpha;
        vBioluminescence = aBioluminescence;
        vLocalPos = position;

        // Realistic undulatory spine wave on GPU!
        // Head is at +X, tail is at -X. Waves propagate from head to tail.
        vec3 deformedPos = position;

        // Tail factor: 0 at head (+0.8), up to 1.0 at tail (-0.8)
        float tailFactor = clamp((-position.x + 0.5) / 1.3, 0.0, 1.0);
        tailFactor = pow(tailFactor, 1.6);

        // Sinusoidal lateral displacement (Z-axis of fish local coordinate)
        float wave = sin(aSwimPhase - position.x * 3.8);
        float amplitude = 0.28 * clamp(aSpeed * 0.28, 0.5, 1.4);
        deformedPos.z += wave * tailFactor * amplitude;

        // Slight yaw/head counter-wag
        deformedPos.z += sin(aSwimPhase * 0.5) * (1.0 - tailFactor) * 0.04;

        // Transform normal
        vec3 deformedNormal = normal;
        deformedNormal.z += cos(aSwimPhase - position.x * 3.8) * tailFactor * 0.5;
        deformedNormal = normalize(deformedNormal);

        // Apply instance transform
        vec4 worldPos = instanceMatrix * vec4(deformedPos, 1.0);
        vWorldPosition = worldPos.xyz;

        // Transform normal to world space
        vNormal = normalize((instanceMatrix * vec4(deformedNormal, 0.0)).xyz);

        vec4 mvPosition = modelViewMatrix * worldPos;
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;
      varying float vTemporalAlpha;
      varying float vSpeciesIndex;
      varying float vBioluminescence;
      varying vec3 vLocalPos;

      uniform float uTime;
      uniform vec3 uDeskLampPos;
      uniform vec3 uDeskLampColor;
      uniform float uDeskLampIntensity;
      uniform vec3 uWaterColor;
      uniform float uCausticStrength;
      uniform vec3 uSchoolCenter;

      uniform vec3 uSpeciesBodyColors[6];
      uniform vec3 uSpeciesStripeColors[6];
      uniform vec3 uSpeciesBiolumColors[6];

      void main() {
        // Discard completely out-of-phase boids
        if (vTemporalAlpha < 0.01) {
          discard;
        }

        int spIdx = int(clamp(vSpeciesIndex, 0.0, 5.0));
        vec3 baseColor = uSpeciesBodyColors[spIdx];
        vec3 stripeColor = uSpeciesStripeColors[spIdx];
        vec3 biolumColor = uSpeciesBiolumColors[spIdx];

        // Lateral iridescent stripe pattern
        float stripeMask = smoothstep(0.18, 0.02, abs(vLocalPos.y));
        // Dorsal darker gradient
        float dorsal = smoothstep(-0.2, 0.3, vLocalPos.y);

        vec3 fishColor = mix(baseColor, stripeColor, stripeMask);
        fishColor = mix(fishColor, baseColor * 0.45, dorsal * 0.5);

        // Eye dots near snout (X > 0.45, abs(Z) > 0.08, Y near 0.05)
        if (vLocalPos.x > 0.42 && abs(vLocalPos.z) > 0.07 && abs(vLocalPos.y - 0.04) < 0.08) {
          fishColor = vec3(0.08, 0.08, 0.1); // pupil
        }

        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Ambient aquatic lighting
        vec3 ambient = uWaterColor * 0.8 + vec3(0.08, 0.12, 0.15);

        // Overhead water sunlight / God ray illumination
        vec3 sunDir = normalize(vec3(0.2, 1.0, 0.3));
        float NdotL = max(dot(normal, sunDir), 0.0);
        vec3 diffuse = NdotL * vec3(0.65, 0.85, 0.95);

        // Caustic ripple highlight projected from water surface
        float caustic = sin(vWorldPosition.x * 2.0 + uTime * 2.5) *
                        sin(vWorldPosition.z * 2.2 + uTime * 2.0) *
                        sin((vWorldPosition.x + vWorldPosition.z) * 1.5 - uTime * 1.8);
        caustic = pow(max(caustic, 0.0), 3.0) * uCausticStrength * 0.6;
        diffuse += vec3(0.3, 0.7, 0.9) * caustic;

        // Desk lamp directional light
        vec3 lampDir = normalize(uDeskLampPos - vWorldPosition);
        float lampDist = length(uDeskLampPos - vWorldPosition);
        float lampAtten = 1.0 / (1.0 + lampDist * 0.05);
        float lampNdotL = max(dot(normal, lampDir), 0.0);
        vec3 lampDiffuse = lampNdotL * uDeskLampColor * uDeskLampIntensity * lampAtten * 0.8;

        // Fresnel edge glow & iridescent scale sheen
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.5);
        vec3 rim = fresnel * (baseColor * 0.8 + vec3(0.2, 0.4, 0.6));

        // Dynamic Bioluminescence
        float biolumFactor = vBioluminescence * (0.4 + 0.6 * sin(uTime * 4.0 + vWorldPosition.x));
        vec3 emission = biolumColor * biolumFactor * (stripeMask * 1.4 + fresnel * 0.6);

        // Combine lit color
        vec3 finalColor = fishColor * (ambient + diffuse + lampDiffuse) + rim + emission;

        // 4D TEMPORAL TRANSITION SHIMMER & CHROMATIC ABERRATION:
        // When fading across the 4th dimension temporal hyperplane (vTemporalAlpha < 0.9)
        if (vTemporalAlpha < 0.95) {
          float phaseFactor = 1.0 - vTemporalAlpha;
          // Quantum temporal dispersion: cyan & magenta split
          finalColor.r += phaseFactor * 0.35 * sin(uTime * 8.0 + vWorldPosition.y * 3.0);
          finalColor.b += phaseFactor * 0.45 * cos(uTime * 8.0 + vWorldPosition.x * 3.0);
          finalColor += vec3(0.1, 0.25, 0.35) * fresnel * phaseFactor * 2.0;
        }

        // Temporal alpha fade
        gl_FragColor = vec4(finalColor, vTemporalAlpha);
      }
    `,
    transparent: true,
    depthWrite: false, // Prevents temporal fade sort artifacts
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });

  return material;
}
