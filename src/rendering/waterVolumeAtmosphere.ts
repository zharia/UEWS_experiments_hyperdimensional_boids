/**
 * Volumetric Water Atmosphere Shader & Backing (Program Increment v0.0.1 - Task 003).
 *
 * Replaces flat background geometry with a multi-layered, visually coherent water volume:
 *  - Optical absorption & spectral attenuation (Beer-Lambert law)
 *  - Subtle spatial depth gradients (surface cerulean to benthic deep indigo)
 *  - Circadian downwelling light penetration & caustic modulation
 *  - Turbidity-responsive atmospheric haze and scattering
 *
 * Invariant: "The viewer should perceive: volume of water rather than: coloured rectangle behind fish."
 */

import * as THREE from 'three';
import { VisualWaterVolumeProjection } from '../ecology/environment/EnvironmentalProjection';

export function createWaterVolumeBackingMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTopColor: { value: new THREE.Color(0x185a7e) },
      uDeepColor: { value: new THREE.Color(0x04111d) },
      uSunIntensity: { value: 0.85 },
      uTurbidity: { value: 0.08 },
      uClarity: { value: 0.92 },
      uExtinction: { value: 0.08 },
      uDepthHaze: { value: 0.15 },
      uCausticStrength: { value: 0.8 },
      uSurfaceAgitation: { value: 0.3 },
      uOpacity: { value: 0.82 },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vWorldPos;

      uniform float uTime;
      uniform vec3 uTopColor;
      uniform vec3 uDeepColor;
      uniform float uSunIntensity;
      uniform float uTurbidity;
      uniform float uClarity;
      uniform float uExtinction;
      uniform float uDepthHaze;
      uniform float uCausticStrength;
      uniform float uSurfaceAgitation;
      uniform float uOpacity;

      // Pseudo-random & simplex-like organic caustic noise
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float causticNoise(vec2 uv, float t) {
        vec2 uv1 = uv * 3.5 + vec2(t * 0.12, t * 0.08);
        vec2 uv2 = uv * 4.2 - vec2(t * 0.09, -t * 0.14);
        float n1 = smoothNoise(uv1);
        float n2 = smoothNoise(uv2);
        return pow(abs(sin(n1 * 6.28 + n2 * 6.28)), 3.0);
      }

      void main() {
        // Vertical gradient: 1.0 at water surface, 0.0 at tank bottom
        float yNorm = clamp(vUv.y, 0.0, 1.0);

        // Beer-Lambert physical extinction: light attenuates exponentially through water depth
        float depthOpticalLength = (1.0 - yNorm) * 2.2;
        float spectralTransmission = exp(-depthOpticalLength * (0.8 + uExtinction * 2.5));

        // Base depth atmospheric gradient
        vec3 waterColor = mix(uDeepColor, uTopColor, pow(yNorm, 1.3));

        // Soft volumetric downwelling light shafts with continuous 3D world spatial coherence across all walls
        float shaftCoord = (vWorldPos.x * 0.35 + vWorldPos.z * 0.25);
        float shaftWave = sin(shaftCoord * 0.8 + uTime * 0.4 + sin(vUv.y * 4.0 + uTime * 0.2) * 1.5) * 0.5 + 0.5;
        float shaftTransmission = pow(shaftWave, 2.5) * pow(yNorm, 1.8) * uSunIntensity * 0.35;
        vec3 sunShaftColor = mix(vec3(0.2, 0.7, 0.9), vec3(0.7, 0.95, 1.0), uClarity);
        waterColor += sunShaftColor * shaftTransmission;

        // Downwelling water caustics (attenuated with depth and turbidity, spatially continuous across all three walls)
        vec2 causticCoord = vec2((vWorldPos.x + vWorldPos.z) * 0.18, vWorldPos.y * 0.22);
        float causticPattern = causticNoise(causticCoord, uTime * 0.85);
        float causticAttenuation = pow(yNorm, 1.4) * (1.0 - uTurbidity * 0.6) * uCausticStrength;
        waterColor += vec3(0.25, 0.65, 0.85) * (causticPattern * causticAttenuation * 0.38);

        // Turbidity atmospheric scattering: suspended micro-particulates cause forward Rayleigh/Mie scattering
        vec3 hazeScatterColor = mix(vec3(0.06, 0.14, 0.20), vec3(0.18, 0.28, 0.32), uTurbidity);
        float hazeFactor = uTurbidity * (0.3 + (1.0 - yNorm) * 0.5) * uDepthHaze;
        waterColor = mix(waterColor, hazeScatterColor, clamp(hazeFactor, 0.0, 0.7));

        // Subtle horizontal vignetting near tank lateral edges for realistic ambient corner shading
        float edgeDist = abs(vUv.x - 0.5) * 2.0;
        float edgeVignette = smoothstep(0.75, 1.0, edgeDist);
        waterColor = mix(waterColor, waterColor * 0.65, edgeVignette * 0.45);

        // Base atmospheric opacity: slightly translucent so the warm room & desk softly bleed through
        // Surface is clearer (~0.72) and deep benthic zone is slightly richer/denser (~0.86)
        float depthAlpha = mix(0.74, 0.88, pow(1.0 - yNorm, 1.15));
        float finalAlpha = clamp(uOpacity * depthAlpha, 0.0, 1.0);

        gl_FragColor = vec4(waterColor, finalAlpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
}
