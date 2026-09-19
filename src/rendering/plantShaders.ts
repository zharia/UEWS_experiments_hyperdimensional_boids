/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { GLSL_SMOOTH_MATH } from './smoothMath';

export interface PlantShaderParams {
  baseColor: THREE.Color;
  midColor: THREE.Color;
  tipColor: THREE.Color;
  senescentColor?: THREE.Color;
  minY: number;
  maxY: number;
  noiseScale?: number;
  swayStrength?: number;
  roughness?: number;
}

/**
 * Custom ShaderMaterial for aquatic plants, corals, and holdfasts.
 * Features:
 * 1. Mathematical smin / smax for organic junction fillets and crevice ambient occlusion.
 * 2. Multi-frequency procedural micro-relief (vascular channels, cellular chloroplasts, polyp verrucae).
 * 3. Botanical Lifecycle uniforms: uGrowthScale, uWiltAmount, uChlorosis, and uSporeEmit.
 * 4. Gravitational senescence wilting and chlorosis necrosis.
 * 5. Sub-surface translucent rim glow, water caustics, and chlorophyll fluorescence.
 */
export function createPlantShaderMaterial(params: PlantShaderParams): THREE.ShaderMaterial {
  const noiseScale = params.noiseScale ?? 1.25;
  const swayStrength = params.swayStrength ?? 0.35;
  const roughness = params.roughness ?? 0.65;
  const senescentColor = params.senescentColor ?? new THREE.Color(0xb5782a);

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uGrowthScale: { value: 1.0 },   // 0.05 (sprout) to 1.0 (flourishing)
      uWiltAmount: { value: 0.0 },     // 0.0 (turgid) to 1.0 (drooping senescent)
      uChlorosis: { value: 0.0 },       // 0.0 (vibrant green) to 1.0 (decayed yellow/brown)
      uSporeEmit: { value: 0.0 },       // 0.0 to 1.0 gamete/spore release glow
      uBaseColor: { value: params.baseColor },
      uMidColor: { value: params.midColor },
      uTipColor: { value: params.tipColor },
      uSenescentColor: { value: senescentColor },
      uHeightRange: { value: new THREE.Vector2(params.minY, params.maxY) },
      uNoiseScale: { value: noiseScale },
      uSwayStrength: { value: swayStrength },
      uRoughness: { value: roughness },
      uLightDir: { value: new THREE.Vector3(0.2, 1.0, 0.2).normalize() },
      uLightColor: { value: new THREE.Color(0xd6f4ff) },
      uAmbientColor: { value: new THREE.Color(0x13303d) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vHeightNorm;
      varying float vWiltSag;

      uniform float uTime;
      uniform vec2 uHeightRange;
      uniform float uSwayStrength;
      uniform float uGrowthScale;
      uniform float uWiltAmount;

      ${GLSL_SMOOTH_MATH}

      void main() {
        vUv = uv;
        
        // Base vertex in local space
        vec3 localPos = position;

        // Normalized height factor along plant axis (0.0 at base to 1.0 at tip)
        float totalH = max(0.001, uHeightRange.y - uHeightRange.x);
        float h = clamp((localPos.y - uHeightRange.x) / totalH, 0.0, 1.0);
        vHeightNorm = h;

        // Dynamic Growth Scale: plants elongate upward and expand outward from holdfast base
        localPos.y = uHeightRange.x + (localPos.y - uHeightRange.x) * uGrowthScale;
        localPos.x *= mix(0.35, 1.0, uGrowthScale);
        localPos.z *= mix(0.35, 1.0, uGrowthScale);

        // Gravitational Senescence Wilt: loss of turgor pressure causes stems to droop
        float wiltSag = pow(h, 2.2) * uWiltAmount * 1.4;
        vWiltSag = wiltSag;
        localPos.y -= wiltSag;
        localPos.x += sin(localPos.z * 1.5 + 0.8) * pow(h, 2.0) * uWiltAmount * 0.6;

        // Base world position
        vec4 worldPos = modelMatrix * vec4(localPos, 1.0);

        // Hydrodynamic water current sway (increases quadratically with height)
        float swayAmt = h * h * uSwayStrength * uGrowthScale;
        float swayX = sin(uTime * 1.4 + worldPos.y * 0.35 + worldPos.z * 0.2) * swayAmt;
        float swayZ = cos(uTime * 1.1 + worldPos.y * 0.3 + worldPos.x * 0.2) * (swayAmt * 0.7);
        
        worldPos.x += swayX;
        worldPos.z += swayZ;

        vWorldPos = worldPos.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vHeightNorm;
      varying float vWiltSag;

      uniform vec3 uBaseColor;
      uniform vec3 uMidColor;
      uniform vec3 uTipColor;
      uniform vec3 uSenescentColor;
      uniform float uNoiseScale;
      uniform float uRoughness;
      uniform vec3 uLightDir;
      uniform vec3 uLightColor;
      uniform vec3 uAmbientColor;
      uniform float uTime;
      uniform float uGrowthScale;
      uniform float uWiltAmount;
      uniform float uChlorosis;
      uniform float uSporeEmit;

      ${GLSL_SMOOTH_MATH}

      // 3D Multi-frequency hash and noise functions
      float hash(vec3 p) {
        p = fract(p * 0.3183099 + 0.1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }

      float noise(vec3 x) {
        vec3 i = floor(x);
        vec3 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);

        return mix(
          mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
              mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
          mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
              mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }

      // Multi-frequency Fractal Brownian Motion (FBM)
      float fbm(vec3 p) {
        float total = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        for (int i = 0; i < 3; i++) {
          total += noise(p * freq) * amp;
          freq *= 2.15;
          amp *= 0.48;
        }
        return total;
      }

      void main() {
        vec3 norm = normalize(vNormal);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);

        // 1. Multi-frequency procedural micro-details using smin & smax
        vec3 p = vWorldPos * uNoiseScale;
        
        // Low-frequency macro color variegation (photosynthetic zones)
        float nMacro = fbm(p * 1.2);
        
        // Mid-frequency longitudinal vascular channels (stretched along Y)
        vec3 pVasc = vec3(p.x * 3.8, p.y * 0.7, p.z * 3.8);
        float nVascRaw = sin(pVasc.x * 2.5 + pVasc.z * 2.5 + noise(pVasc) * 4.0) * 0.5 + 0.5;
        // Shape vascular ribs with smin & smax
        float nVascular = smin(nVascRaw, smax(nVascRaw, 0.25, 0.15), 0.2);
        
        // High-frequency cellular stippling & polyp pore micro-porosity
        float nCellular = hash(floor(p * 16.0));

        // 2. Height-dependent biological color blending with sminFactor
        float h = vHeightNorm;
        float blendFactor = sminFactor(h, 0.48, 0.25);
        vec3 col = mix(uTipColor, mix(uBaseColor, uMidColor, smoothstep(0.0, 0.45, h)), blendFactor);

        // Modulate color by vascular ridges and cellular grain
        float texturePattern = (nMacro * 0.45 + nVascular * 0.38 + nCellular * 0.17);
        col *= (0.75 + texturePattern * 0.45);

        // Sediment / biofilm clinging to lower holdfast foot (h < 0.16)
        if (h < 0.18) {
          float sedT = sminFactor(h, 0.18, 0.08);
          vec3 sedimentColor = vec3(0.26, 0.20, 0.14);
          col = mix(sedimentColor, col, sedT);
        }

        // 3. Biological Lifecycle: Senescence & Chlorosis necrosis
        // Chlorosis spreads from oldest lower tissues upward
        float senescentSpread = clamp(uChlorosis * 1.35 + (1.0 - h) * 0.5 * uChlorosis, 0.0, 1.0);
        vec3 necroticBrown = vec3(0.28, 0.18, 0.09);
        vec3 senescentCol = mix(uSenescentColor, necroticBrown, smoothstep(0.5, 1.0, senescentSpread));
        col = mix(col, senescentCol, smoothstep(0.12, 0.9, senescentSpread));

        // 4. Lighting & Subsurface Translucency
        float NdotL = max(dot(norm, uLightDir), 0.0);
        vec3 diffuse = uLightColor * NdotL * 0.8;

        // Subsurface translucency (backlight transmission through chlorophyll/coral tissue)
        float backLight = max(dot(-norm, uLightDir), 0.0);
        float translucency = pow(backLight, 2.2) * (0.12 + h * 0.48) * (1.0 - uChlorosis * 0.5);
        vec3 sss = uTipColor * translucency * 0.9;

        // Translucent Fresnel rim glow
        float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 3.0);
        vec3 rim = uTipColor * fresnel * (0.25 + h * 0.7);

        // Water caustics rippling across surface
        float caustics = sin(vWorldPos.x * 2.8 + uTime * 2.2) *
                         sin(vWorldPos.z * 2.8 - uTime * 1.6) * 0.5 + 0.5;
        caustics = pow(caustics, 3.0) * 0.28 * (0.4 + h * 0.6);

        // 5. Spore Emission & Nocturnal Chlorophyll Fluorescence
        vec3 sporeGlow = uTipColor * uSporeEmit * 0.6 * (0.5 + 0.5 * sin(uTime * 3.0 + h * 6.28));

        // Final Composite
        vec3 ambient = uAmbientColor * col;
        vec3 finalColor = ambient + col * diffuse + sss + rim + vec3(caustics * 0.5) + sporeGlow;

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
}

