/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface PlantShaderParams {
  baseColor: THREE.Color;
  midColor: THREE.Color;
  tipColor: THREE.Color;
  minY: number;
  maxY: number;
  noiseScale?: number;
  swayStrength?: number;
  roughness?: number;
}

/**
 * Custom ShaderMaterial for aquatic plants and corals.
 * Features:
 * 1. World-space height-dependent color and texture gradient.
 * 2. Multi-frequency procedural noise (vascular channels, cellular chlorophyll, polyp pores).
 * 3. Water current sway deformation (stronger near tips).
 * 4. Sub-surface translucent rim glow and caustic highlights.
 */
export function createPlantShaderMaterial(params: PlantShaderParams): THREE.ShaderMaterial {
  const noiseScale = params.noiseScale ?? 1.2;
  const swayStrength = params.swayStrength ?? 0.35;
  const roughness = params.roughness ?? 0.65;

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBaseColor: { value: params.baseColor },
      uMidColor: { value: params.midColor },
      uTipColor: { value: params.tipColor },
      uHeightRange: { value: new THREE.Vector2(params.minY, params.maxY) },
      uNoiseScale: { value: noiseScale },
      uSwayStrength: { value: swayStrength },
      uRoughness: { value: roughness },
      uLightDir: { value: new THREE.Vector3(0.2, 1.0, 0.2).normalize() },
      uLightColor: { value: new THREE.Color(0xbbf0ff) },
      uAmbientColor: { value: new THREE.Color(0x184259) },
    },
    vertexShader: `
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying float vHeightNorm;

      uniform float uTime;
      uniform vec2 uHeightRange;
      uniform float uSwayStrength;

      void main() {
        vUv = uv;
        
        // Base world position
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        
        // Normalized height factor along plant axis (0.0 at base to 1.0 at tip)
        float h = clamp((worldPos.y - uHeightRange.x) / max(0.001, uHeightRange.y - uHeightRange.x), 0.0, 1.0);
        vHeightNorm = h;

        // Gentle hydrodynamic water current sway (increases quadratically with height)
        float swayAmt = h * h * uSwayStrength;
        float swayX = sin(uTime * 1.4 + worldPos.y * 0.4 + worldPos.z * 0.2) * swayAmt;
        float swayZ = cos(uTime * 1.1 + worldPos.y * 0.35 + worldPos.x * 0.2) * (swayAmt * 0.65);
        
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

      uniform vec3 uBaseColor;
      uniform vec3 uMidColor;
      uniform vec3 uTipColor;
      uniform float uNoiseScale;
      uniform float uRoughness;
      uniform vec3 uLightDir;
      uniform vec3 uLightColor;
      uniform vec3 uAmbientColor;
      uniform float uTime;

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

        // 1. Multi-frequency procedural noise calculation
        vec3 p = vWorldPos * uNoiseScale;
        
        // Low-frequency macro color variegation (photosynthetic zones)
        float nMacro = fbm(p * 1.2);
        
        // Mid-frequency longitudinal vascular bark channels (stretched vertically along Y)
        vec3 pVasc = vec3(p.x * 3.5, p.y * 0.8, p.z * 3.5);
        float nVascular = sin(pVasc.x * 2.5 + pVasc.z * 2.5 + noise(pVasc) * 4.0) * 0.5 + 0.5;
        
        // High-frequency cellular stippling and micro-porosity (chloroplasts / polyp buds)
        float nCellular = hash(floor(p * 14.0));

        // 2. Height-dependent color blending
        // Base -> Mid -> Tip gradient
        vec3 col;
        if (vHeightNorm < 0.45) {
          float t = vHeightNorm / 0.45;
          // Smooth Hermite blend
          t = t * t * (3.0 - 2.0 * t);
          col = mix(uBaseColor, uMidColor, t);
        } else {
          float t = (vHeightNorm - 0.45) / 0.55;
          t = t * t * (3.0 - 2.0 * t);
          col = mix(uMidColor, uTipColor, t);
        }

        // Modulate color by multi-frequency noise
        // Darker in vascular valleys, richer on cellular ridges
        float texturePattern = (nMacro * 0.5 + nVascular * 0.35 + nCellular * 0.15);
        col *= (0.78 + texturePattern * 0.42);

        // Sediment clinging to lower base (height < 0.15)
        if (vHeightNorm < 0.18) {
          float sedT = (0.18 - vHeightNorm) / 0.18;
          vec3 sedimentColor = vec3(0.28, 0.22, 0.16);
          col = mix(col, sedimentColor, sedT * 0.7);
        }

        // 3. Lighting Model
        // Diffuse lighting
        float NdotL = max(dot(norm, uLightDir), 0.0);
        vec3 diffuse = uLightColor * NdotL;

        // Subsurface translucency (light shining through thin leaves/tips)
        float backLight = max(dot(-norm, uLightDir), 0.0);
        float translucency = pow(backLight, 2.0) * (0.15 + vHeightNorm * 0.45);
        vec3 sss = uTipColor * translucency * 0.85;

        // Translucent Fresnel rim glow (stronger towards tip)
        float fresnel = pow(1.0 - max(dot(viewDir, norm), 0.0), 3.0);
        vec3 rim = uTipColor * fresnel * (0.3 + vHeightNorm * 0.7);

        // Subtle water caustics ripple over plant surface
        float caustics = sin(vWorldPos.x * 2.5 + uTime * 2.0) *
                         sin(vWorldPos.z * 2.5 - uTime * 1.5) * 0.5 + 0.5;
        caustics = pow(caustics, 3.0) * 0.25 * (0.4 + vHeightNorm * 0.6);

        // Final Composite
        vec3 ambient = uAmbientColor * col;
        vec3 finalColor = ambient + col * diffuse + sss + rim + vec3(caustics * 0.5);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
}
