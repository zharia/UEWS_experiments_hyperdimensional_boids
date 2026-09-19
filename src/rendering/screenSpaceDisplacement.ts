/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

export interface ScreenSpaceDisplacementConfig {
  enabled: boolean;
  displacementStrength: number; // 0.0 to 2.5
  chromaticAberration: number;   // 0.0 to 2.0
  waveFrequency: number;        // 0.2 to 3.0
  waveSpeed: number;            // 0.2 to 3.0
  wakeInfluence: boolean;       // fish school and bubbles perturb screen space
  debugMode: boolean;           // visualize displacement vector field
}

export const DEFAULT_SSD_CONFIG: ScreenSpaceDisplacementConfig = {
  enabled: true,
  displacementStrength: 0.85,
  chromaticAberration: 0.65,
  waveFrequency: 1.0,
  waveSpeed: 1.0,
  wakeInfluence: true,
  debugMode: false,
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform sampler2D tDiffuse;
  uniform float uTime;
  uniform float uDisplacementStrength;
  uniform float uChromaticAberration;
  uniform float uFrequency;
  uniform float uSpeed;
  uniform vec2 uResolution;
  uniform vec2 uSchoolScreenPos;
  uniform float uSchoolActivity;
  uniform float uSchoolEnabled;
  uniform vec2 uBubbleScreenPos;
  uniform float uBubbleActivity;
  uniform float uDebugMode;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / max(1.0, uResolution.y);

    // Multi-octave hydrodynamic fluid wave field
    float t = uTime * uSpeed;
    vec2 p = uv * vec2(aspect, 1.0) * uFrequency * 7.5;

    // Harmonic wave functions
    float w1 = sin(p.x * 1.15 + t * 1.1 + sin(p.y * 0.85 + t * 0.7));
    float w2 = cos(p.y * 1.35 - t * 0.95 + cos(p.x * 0.75 - t * 0.5));
    float w3 = sin((p.x + p.y) * 1.6 + t * 1.35);
    float w4 = cos((p.x - p.y) * 1.45 - t * 1.15);

    // Base fluid displacement vector
    vec2 waveDisp = vec2(
      (w1 * 0.62 + w3 * 0.38) * 0.0038,
      (w2 * 0.62 + w4 * 0.38) * 0.0038
    );

    // 4D Boid School Kinetic Wake Perturbation
    if (uSchoolEnabled > 0.5 && uSchoolActivity > 0.01) {
      vec2 dSchool = (uv - uSchoolScreenPos) * vec2(aspect, 1.0);
      float distSchool = length(dSchool);
      float radius = 0.32;
      if (distSchool < radius) {
        float f = 1.0 - distSchool / radius;
        f = smoothstep(0.0, 1.0, f);
        // Concentric hydrodynamic wake ripples
        float ripple = sin(distSchool * 42.0 - uTime * 7.0) * f;
        vec2 normDir = normalize(dSchool + vec2(0.0001));
        waveDisp += normDir * ripple * (0.0055 * uSchoolActivity);
      }
    }

    // Ascending Airstone Bubble Column Plume
    if (uBubbleActivity > 0.01) {
      vec2 dBubble = (uv - uBubbleScreenPos) * vec2(aspect, 1.0);
      float distBubbleX = abs(dBubble.x);
      // Vertical columnar shimmer
      if (distBubbleX < 0.16 && uv.y >= uBubbleScreenPos.y - 0.08 && uv.y <= 0.96) {
        float colFalloff = smoothstep(0.16, 0.0, distBubbleX);
        float shimmer = sin(uv.y * 55.0 - uTime * 13.0) * cos(uv.x * 45.0 + uTime * 8.5);
        waveDisp += vec2(shimmer * 0.0038 * colFalloff, sin(uv.y * 28.0 - uTime * 7.5) * 0.0022 * colFalloff);
      }
    }

    // Boundary Meniscus & Screen Edge Damping
    float edgeDistX = min(uv.x, 1.0 - uv.x);
    float edgeDistY = min(uv.y, 1.0 - uv.y);
    float edgeDist = min(edgeDistX, edgeDistY);
    float boundaryDamp = smoothstep(0.003, 0.05, edgeDist);

    // Glass boundary refractive bevel
    float bevel = (1.0 - smoothstep(0.0, 0.03, edgeDist)) * 0.0045;
    vec2 edgeNormal = vec2(
      (uv.x < 0.5 ? 1.0 : -1.0) * (edgeDistX < 0.03 ? 1.0 : 0.0),
      (uv.y < 0.5 ? 1.0 : -1.0) * (edgeDistY < 0.03 ? 1.0 : 0.0)
    );
    waveDisp += edgeNormal * bevel;

    // Apply global strength and boundary taper
    waveDisp *= boundaryDamp * uDisplacementStrength;

    // Debug flow field visualization mode
    if (uDebugMode > 0.5) {
      vec2 debugVec = waveDisp * 75.0 + 0.5;
      float mag = length(waveDisp) * 90.0;
      gl_FragColor = vec4(debugVec.x, debugVec.y, mag, 1.0);
      return;
    }

    // Spectral Dispersion / Physical Chromatic Aberration
    float caOffset = uChromaticAberration * 0.7;
    vec2 uvR = clamp(uv + waveDisp * (1.0 - caOffset * 0.45), 0.001, 0.999);
    vec2 uvG = clamp(uv + waveDisp, 0.001, 0.999);
    vec2 uvB = clamp(uv + waveDisp * (1.0 + caOffset * 0.45), 0.001, 0.999);

    float r = texture2D(tDiffuse, uvR).r;
    float g = texture2D(tDiffuse, uvG).g;
    float b = texture2D(tDiffuse, uvB).b;
    float a = texture2D(tDiffuse, uvG).a;

    // Subtle caustic refraction luminance boost on displacement ridges
    float curvature = length(waveDisp) * 3.5 * uDisplacementStrength;
    vec3 col = vec3(r, g, b) + vec3(0.012, 0.038, 0.048) * curvature;

    gl_FragColor = vec4(col, a);
  }
`;

export class ScreenSpaceDisplacementPass {
  public config: ScreenSpaceDisplacementConfig;
  public renderTarget: THREE.WebGLRenderTarget;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private material: THREE.ShaderMaterial;
  private quad: THREE.Mesh;
  private width: number = 1;
  private height: number = 1;

  constructor(width: number, height: number, pixelRatio: number) {
    this.config = { ...DEFAULT_SSD_CONFIG };
    this.width = Math.max(1, Math.floor(width * pixelRatio));
    this.height = Math.max(1, Math.floor(height * pixelRatio));

    // High precision color buffer with linear filtering for smooth displacement
    this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType,
      stencilBuffer: false,
      depthBuffer: true,
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        tDiffuse: { value: this.renderTarget.texture },
        uTime: { value: 0 },
        uDisplacementStrength: { value: this.config.displacementStrength },
        uChromaticAberration: { value: this.config.chromaticAberration },
        uFrequency: { value: this.config.waveFrequency },
        uSpeed: { value: this.config.waveSpeed },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uSchoolScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
        uSchoolActivity: { value: 0.0 },
        uSchoolEnabled: { value: this.config.wakeInfluence ? 1.0 : 0.0 },
        uBubbleScreenPos: { value: new THREE.Vector2(0.3, 0.2) },
        uBubbleActivity: { value: 1.0 },
        uDebugMode: { value: this.config.debugMode ? 1.0 : 0.0 },
      },
      depthTest: false,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.quad);
  }

  public setSize(width: number, height: number, pixelRatio: number) {
    this.width = Math.max(1, Math.floor(width * pixelRatio));
    this.height = Math.max(1, Math.floor(height * pixelRatio));
    this.renderTarget.setSize(this.width, this.height);
    this.material.uniforms.uResolution.value.set(this.width, this.height);
  }

  public update(
    elapsedTime: number,
    schoolScreenUv: THREE.Vector2,
    schoolActivity: number,
    bubbleScreenUv: THREE.Vector2
  ) {
    const u = this.material.uniforms;
    u.uTime.value = elapsedTime;
    u.uDisplacementStrength.value = this.config.displacementStrength;
    u.uChromaticAberration.value = this.config.chromaticAberration;
    u.uFrequency.value = this.config.waveFrequency;
    u.uSpeed.value = this.config.waveSpeed;
    u.uSchoolScreenPos.value.copy(schoolScreenUv);
    u.uSchoolActivity.value = schoolActivity;
    u.uSchoolEnabled.value = this.config.wakeInfluence ? 1.0 : 0.0;
    u.uBubbleScreenPos.value.copy(bubbleScreenUv);
    u.uDebugMode.value = this.config.debugMode ? 1.0 : 0.0;
  }

  public render(renderer: THREE.WebGLRenderer) {
    renderer.render(this.scene, this.camera);
  }

  public setConfig(partial: Partial<ScreenSpaceDisplacementConfig>) {
    Object.assign(this.config, partial);
  }

  public dispose() {
    this.renderTarget.dispose();
    this.material.dispose();
    this.quad.geometry.dispose();
  }
}
