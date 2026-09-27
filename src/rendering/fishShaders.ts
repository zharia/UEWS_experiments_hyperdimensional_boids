/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { SPECIES_CONFIGS } from '../simulation/species';
import { MorphologicalGrammar } from '../morphology/MorphologicalGrammar';

/**
 * Organismic Base Spindle Geometry (Task 005).
 *
 * Replaces anatomical fish geometry with a smooth, neutral organismic spindle
 * that serves as a canvas for the procedural morphological grammar.
 *
 * Invariant:
 *   "Fishiness without fish; organismic expression without anatomical simulation."
 *   Zero eyes, zero scales, zero explicit fin meshes.
 */
export function createFishGeometry(): THREE.BufferGeometry {
  const length = 1.6;
  const segmentsX = 24;
  const segmentsRadial = 16;

  // Base neutral spindle cylinder along X axis (+X anterior, -X posterior)
  const bodyGeo = new THREE.CylinderGeometry(0.24, 0.06, length, segmentsRadial, segmentsX);
  bodyGeo.rotateZ(Math.PI / 2);

  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    // Spine parameter: 0 at posterior (-0.8), 1 at anterior (+0.8)
    const t = Math.max(0, Math.min(1, (x + length * 0.5) / length));

    // Smooth baseline spindle envelope
    const envelope = Math.max(0.12, Math.sin(t * Math.PI));
    pos.setXYZ(i, x, y * envelope, z * envelope);
  }

  bodyGeo.computeVertexNormals();
  bodyGeo.computeBoundingSphere();

  return bodyGeo;
}

export function createFishShaderMaterial(): THREE.ShaderMaterial {
  const speciesBodyColors: THREE.Vector3[] = [];
  const speciesStripeColors: THREE.Vector3[] = [];
  const speciesBiolumColors: THREE.Vector3[] = [];

  SPECIES_CONFIGS.forEach((s) => {
    speciesBodyColors.push(new THREE.Vector3(s.bodyColor[0], s.bodyColor[1], s.bodyColor[2]));
    speciesStripeColors.push(new THREE.Vector3(s.stripeColor[0], s.stripeColor[1], s.stripeColor[2]));
    speciesBiolumColors.push(new THREE.Vector3(s.bioluminescentColor[0], s.bioluminescentColor[1], s.bioluminescentColor[2]));
  });

  const grammarGLSL = MorphologicalGrammar.getGLSLGrammarFunction();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeskLampPos: { value: new THREE.Vector3(-17.85, 2.8, 1.65) },
      uDeskLampColor: { value: new THREE.Color(0xffecd0) },
      uDeskLampIntensity: { value: 0.5 },
      uWaterColor: { value: new THREE.Color(0x0c3b52) },
      uCausticStrength: { value: 0.8 },
      uSchoolCenter: { value: new THREE.Vector3(0, 0, 0) },
      uSpeciesBodyColors: { value: speciesBodyColors },
      uSpeciesStripeColors: { value: speciesStripeColors },
      uSpeciesBiolumColors: { value: speciesBiolumColors },
    },
    vertexShader: `
      attribute vec4 aMorphology; // aspect, bodyDepth, taper, massDistribution
      attribute vec4 aSignature;  // flexibility, posteriorExpression, surfaceComplexity, asymmetryBias
      attribute vec4 aPosture;    // curvature, compression, twist, propulsionTension
      attribute float aWavePhase;
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
      varying float vSpineT;
      varying float vTension;

      uniform float uTime;

      ${grammarGLSL}

      void main() {
        vSpeciesIndex = aSpeciesIndex;
        vTemporalAlpha = aTemporalAlpha;
        vBioluminescence = aBioluminescence;
        vTension = aPosture.w;

        float baseLength = 1.6;
        vSpineT = clamp((position.x + baseLength * 0.5) / baseLength, 0.0, 1.0);

        // Execute procedural morphological grammar on vertex
        vec3 deformedPos = applyMorphologicalGrammar(position, aMorphology, aSignature, aPosture, aWavePhase);
        vLocalPos = deformedPos;

        // Accurate numerical normal evaluation along deformed surface
        float eps = 0.025;
        vec3 dX = applyMorphologicalGrammar(position + vec3(eps, 0.0, 0.0), aMorphology, aSignature, aPosture, aWavePhase) -
                  applyMorphologicalGrammar(position - vec3(eps, 0.0, 0.0), aMorphology, aSignature, aPosture, aWavePhase);
        vec3 dY = applyMorphologicalGrammar(position + vec3(0.0, eps, 0.0), aMorphology, aSignature, aPosture, aWavePhase) -
                  applyMorphologicalGrammar(position - vec3(0.0, eps, 0.0), aMorphology, aSignature, aPosture, aWavePhase);
        
        vec3 deformedNormal = normalize(cross(dX, dY));
        if (dot(deformedNormal, normal) < 0.0) {
          deformedNormal = -deformedNormal;
        }

        // Apply instance transform matrix
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
      varying float vSpineT;
      varying float vTension;

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
        if (vTemporalAlpha < 0.01) {
          discard;
        }

        int spIdx = int(clamp(vSpeciesIndex, 0.0, 5.0));
        vec3 baseColor = uSpeciesBodyColors[spIdx];
        vec3 stripeColor = uSpeciesStripeColors[spIdx];
        vec3 biolumColor = uSpeciesBiolumColors[spIdx];

        // ---------------------------------------------------------------------
        // ORGANISMIC MATERIAL & COUNTER-SHADING (Zero eyes, zero scales)
        // ---------------------------------------------------------------------
        // Natural counter-shading: dorsal (upper) surface is deeper/darker,
        // ventral (lower) surface is slightly paler.
        float dorsal = smoothstep(-0.15, 0.25, vLocalPos.y);
        float ventral = smoothstep(0.15, -0.25, vLocalPos.y);

        // Longitudinal lateral line canal (fluid sensory pore channel)
        float lateralCanal = smoothstep(0.12, 0.02, abs(vLocalPos.y));

        vec3 organismColor = mix(baseColor, stripeColor, lateralCanal * 0.75);
        organismColor = mix(organismColor, baseColor * 0.50, dorsal * 0.45);
        organismColor = mix(organismColor, baseColor * 1.25, ventral * 0.30);

        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Ambient aquatic lighting
        vec3 ambient = uWaterColor * 0.85 + vec3(0.08, 0.12, 0.16);

        // Directional overhead sun rays
        vec3 sunDir = normalize(vec3(0.25, 1.0, 0.25));
        float NdotL = max(dot(normal, sunDir), 0.0);
        vec3 diffuse = NdotL * vec3(0.65, 0.85, 0.95);

        // Dynamic surface caustic ripples
        float caustic = sin(vWorldPosition.x * 2.1 + uTime * 2.4) *
                        sin(vWorldPosition.z * 2.3 + uTime * 2.0) *
                        sin((vWorldPosition.x + vWorldPosition.z) * 1.6 - uTime * 1.7);
        caustic = pow(max(caustic, 0.0), 3.0) * uCausticStrength * 0.55;
        diffuse += vec3(0.35, 0.75, 0.95) * caustic;

        // Desk lamp soft diffuse lighting
        vec3 lampDir = normalize(uDeskLampPos - vWorldPosition);
        float lampDist = length(uDeskLampPos - vWorldPosition);
        float lampAtten = 1.0 / (1.0 + lampDist * 0.05);
        float lampWrap = max((dot(normal, lampDir) + 0.4) / 1.4, 0.0);
        vec3 lampDiffuse = pow(lampWrap, 1.3) * uDeskLampColor * uDeskLampIntensity * lampAtten * 0.6;

        // Organic translucent edge / Fresnel rim glow
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);
        vec3 rim = fresnel * (baseColor * 0.85 + vec3(0.2, 0.45, 0.65));

        // Lateral canal bioluminescent glow (pulsing gently with tension and time)
        float biolumPulse = vBioluminescence * (0.45 + 0.55 * sin(uTime * 3.5 + vWorldPosition.x * 0.8));
        vec3 emission = biolumColor * biolumPulse * (lateralCanal * 1.5 + fresnel * 0.5);

        // Final lit color
        vec3 finalColor = organismColor * (ambient + diffuse + lampDiffuse) + rim + emission;

        // 4D Temporal phase dispersion shimmer
        if (vTemporalAlpha < 0.95) {
          float phaseFactor = 1.0 - vTemporalAlpha;
          finalColor.r += phaseFactor * 0.30 * sin(uTime * 7.0 + vWorldPosition.y * 3.0);
          finalColor.b += phaseFactor * 0.40 * cos(uTime * 7.0 + vWorldPosition.x * 3.0);
          finalColor += vec3(0.12, 0.28, 0.38) * fresnel * phaseFactor * 2.0;
        }

        gl_FragColor = vec4(finalColor, vTemporalAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
  });

  return material;
}
