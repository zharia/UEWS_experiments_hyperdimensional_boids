/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { BoidSimulation4D } from '../simulation/boids4D';
import { ProceduralFloraSimulation } from '../simulation/flora';
import { DayNightCycleConfig, InspectedOrganism, LightingConfig, LightingPreset } from '../types';
import { CoralSceneObjects, createCoralReef } from './coralGeometries';
import { createFishGeometry, createFishShaderMaterial } from './fishShaders';
import { createFireflyMesh, FireflyMeshSystem } from './fireflyShaders';
import { MicroFaunaSimulation } from '../simulation/microFauna';
import { MicroFaunaRenderer } from './microFaunaRender';
import { aquariumAudio } from '../audio/aquariumAudio';
import { benchmarkEngine } from '../utils/performanceBenchmark';
import { ScreenSpaceDisplacementPass } from './screenSpaceDisplacement';
import { SPECIES_CONFIGS } from '../simulation/species';

interface CircadianKeyframe {
  phase: number;
  ambientColor: number;
  ambientIntensity: number;
  topColor: number;
  topIntensity: number;
  clusterColor: number;
  clusterIntensity: number;
  rayWaterColor: number;
  rayIntensity: number;
  causticStrength: number;
  backColor: number;
}

const CIRCADIAN_KEYFRAMES: CircadianKeyframe[] = [
  {
    phase: 0.05, // Dawn (06:00)
    ambientColor: 0x2e3a52,
    ambientIntensity: 1.5,
    topColor: 0xffe0bc,
    topIntensity: 2.25,
    clusterColor: 0x38bdf8,
    clusterIntensity: 1.8,
    rayWaterColor: 0x38bdf8,
    rayIntensity: 1.0,
    causticStrength: 0.75,
    backColor: 0x0c1926,
  },
  {
    phase: 0.25, // Midday Daylight (12:00)
    ambientColor: 0x2a5c7e,
    ambientIntensity: 1.85,
    topColor: 0xd4f6ff,
    topIntensity: 2.8,
    clusterColor: 0x00ffea,
    clusterIntensity: 2.0,
    rayWaterColor: 0x38bdf8,
    rayIntensity: 1.2,
    causticStrength: 0.88,
    backColor: 0x05131f,
  },
  {
    phase: 0.50, // Golden Sunset (18:00)
    ambientColor: 0x543644,
    ambientIntensity: 1.6,
    topColor: 0xffa454,
    topIntensity: 2.35,
    clusterColor: 0xff77aa,
    clusterIntensity: 2.2,
    rayWaterColor: 0xf97316,
    rayIntensity: 1.25,
    causticStrength: 0.72,
    backColor: 0x1c0d16,
  },
  {
    phase: 0.72, // Bioluminescent Twilight (21:00)
    ambientColor: 0x182e4a,
    ambientIntensity: 1.3,
    topColor: 0x356e94,
    topIntensity: 1.35,
    clusterColor: 0x00ffcc,
    clusterIntensity: 4.2,
    rayWaterColor: 0x06b6d4,
    rayIntensity: 1.35,
    causticStrength: 0.95,
    backColor: 0x040b17,
  },
  {
    phase: 0.88, // Abyssal Midnight (00:00)
    ambientColor: 0x142238,
    ambientIntensity: 1.1,
    topColor: 0x254668,
    topIntensity: 0.95,
    clusterColor: 0xa855f7,
    clusterIntensity: 3.5,
    rayWaterColor: 0x818cf8,
    rayIntensity: 0.75,
    causticStrength: 0.5,
    backColor: 0x020409,
  },
];

export class AquariumSceneManager {
  public container: HTMLElement;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public boidSim: BoidSimulation4D;
  public floraSim: ProceduralFloraSimulation;

  // Circadian Day-Night Cycle
  public dayNightCycle: DayNightCycleConfig = {
    enabled: true,
    periodSeconds: 60.0, // 60 seconds per complete cycle
    currentPhase: 0.25, // Start at midday
  };
  private backMat!: THREE.MeshBasicMaterial;
  private tmpColorB = new THREE.Color();

  // 2.5D optical parallax offset
  private targetCameraOffset: THREE.Vector2 = new THREE.Vector2(0, 0);

  // Scene elements
  public coralObjects!: CoralSceneObjects;
  private fishMesh!: THREE.InstancedMesh;
  private fireflySystem!: FireflyMeshSystem;
  private fishMaterial!: THREE.ShaderMaterial;
  private floraTexture!: THREE.CanvasTexture;
  private frontGlassMesh!: THREE.Mesh;
  private waterSurfaceMesh!: THREE.Mesh;
  private foodMeshGroup: THREE.Group = new THREE.Group();

  // Dynamic Lighting System & Volumetric Light Scattering
  private ambientLight!: THREE.AmbientLight;
  private topAquariumLight!: THREE.DirectionalLight;
  private deskLampLight!: THREE.SpotLight;
  private boidClusterLight!: THREE.PointLight;
  private substrateFillLight!: THREE.DirectionalLight;
  private volumetricGodRaysMesh!: THREE.Mesh;
  private godRaysMaterial!: THREE.ShaderMaterial;
  private causticsProjectorMat!: THREE.ShaderMaterial;
  private deskMesh!: THREE.Mesh;

  // Animation & state
  private clock: THREE.Clock = new THREE.Clock();
  private animFrameId: number = 0;
  private isDestroyed: boolean = false;
  private currentPreset: LightingPreset = 'daylight';
  private deskLampEnabled: boolean = true;
  public currentFps: number = 60;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();

  // Organism Inspection & Cinematic Camera Modes
  public isZenTour: boolean = false;
  public trackedOrganism: InspectedOrganism | null = null;
  public isTrackingCamera: boolean = true;
  public onOrganismSelect?: (organism: InspectedOrganism | null) => void;
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, -0.2, 0);
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, -0.2, 0);

  // Screen Space Displacement (SSD) Post-Processing Pipeline
  public ssdPass!: ScreenSpaceDisplacementPass;
  private tmpSchoolVec: THREE.Vector3 = new THREE.Vector3();
  private schoolScreenUv: THREE.Vector2 = new THREE.Vector2(0.5, 0.5);
  private tmpBubbleVec: THREE.Vector3 = new THREE.Vector3();
  private bubbleScreenUv: THREE.Vector2 = new THREE.Vector2(0.3, 0.2);

  // Temporary vectors for matrix computation (reused to eliminate per-frame GC allocations)
  private dummyObj: THREE.Object3D = new THREE.Object3D();
  private targetQuat: THREE.Quaternion = new THREE.Quaternion();
  private tmpHeading: THREE.Vector3 = new THREE.Vector3();
  private xAxis: THREE.Vector3 = new THREE.Vector3(1, 0, 0);
  private tmpBankQuat: THREE.Quaternion = new THREE.Quaternion();
  private upVec: THREE.Vector3 = new THREE.Vector3(0, 1, 0);

  // Instanced buffer attributes for GPU fish shader
  private attrSwimPhase!: THREE.InstancedBufferAttribute;
  private attrSpeed!: THREE.InstancedBufferAttribute;
  private attrTemporalAlpha!: THREE.InstancedBufferAttribute;
  private attrSpeciesIndex!: THREE.InstancedBufferAttribute;
  private attrBioluminescence!: THREE.InstancedBufferAttribute;

  // Cached food flake geometry, material, and zero-allocation object pool
  private foodGeo: THREE.DodecahedronGeometry = new THREE.DodecahedronGeometry(0.22, 1);
  private foodMat: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Amber gold food flake
    roughness: 0.8,
    metalness: 0.1,
  });
  private foodMeshPool: THREE.Mesh[] = [];
  private readonly maxFoodPellets: number = 32;

  // Micro-fauna simulation and 3D procedural rig renderer
  public microFaunaSim: MicroFaunaSimulation;
  public microFaunaRenderer: MicroFaunaRenderer;

  constructor(
    container: HTMLElement,
    boidSim: BoidSimulation4D,
    floraSim: ProceduralFloraSimulation
  ) {
    this.container = container;
    this.boidSim = boidSim;
    this.floraSim = floraSim;

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x070b12);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 2. Camera setup for 2.5D desk perspective
    // Positioned slightly above desk level looking at the aquarium with beautiful depth
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 150);
    this.camera.position.set(0, 1.8, 26.5);
    this.camera.lookAt(0, -0.2, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(width, height);
    const pixelRatio = Math.min(window.devicePixelRatio, 1.25);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Initialize Screen Space Displacement Pass
    this.ssdPass = new ScreenSpaceDisplacementPass(width, height, pixelRatio);

    // 3. Build scene components
    this.initDeskAndEnvironment();
    this.initAquariumGlass();
    this.coralObjects = createCoralReef(this.scene);
    this.initFishInstancing();
    this.initFireflyInstancing();
    this.initDynamicLighting();
    this.initVolumetricScattering();

    // Initialize micro-fauna system (crabs, snails, ghost shrimp, hydromedusae)
    this.microFaunaSim = new MicroFaunaSimulation(this.boidSim, this.floraSim);
    this.microFaunaSim.onSpawnBubble = (x, y, z) => {
      this.spawnMicroBubblesAt(x, y, z);
    };
    this.microFaunaRenderer = new MicroFaunaRenderer(this.scene, this.microFaunaSim);

    // Initialize food mesh pool
    for (let i = 0; i < this.maxFoodPellets; i++) {
      const pMesh = new THREE.Mesh(this.foodGeo, this.foodMat);
      pMesh.visible = false;
      this.foodMeshPool.push(pMesh);
      this.foodMeshGroup.add(pMesh);
    }
    this.scene.add(this.foodMeshGroup);

    // 4. Hook food eaten event to audio and micro-bubble generation
    this.boidSim.onFoodEaten = (x: number, y: number, z: number) => {
      aquariumAudio.playNibble();
      this.spawnMicroBubblesAt(x, y, z);
    };

    // 5. Event listeners for 2.5D optical parallax and resize
    window.addEventListener('resize', this.onResize);
    window.addEventListener('pointermove', this.onPointerMove);

    // 6. Start render loop
    this.render = this.render.bind(this);
    this.render();
  }

  private initDeskAndEnvironment() {
    // 1. Warm wood grain desk surface
    const deskGeo = new THREE.BoxGeometry(48, 1.8, 28);
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x422a1d, // Rich walnut / mahogany
      roughness: 0.45,
      metalness: 0.1,
    });
    this.deskMesh = new THREE.Mesh(deskGeo, deskMat);
    this.deskMesh.position.set(0, -7.9, 0);
    this.deskMesh.receiveShadow = true;
    this.scene.add(this.deskMesh);

    // 2. Desk shadow pad under tank
    const shadowPadGeo = new THREE.PlaneGeometry(31, 15);
    const shadowPadMat = new THREE.MeshBasicMaterial({
      color: 0x120c08,
      transparent: true,
      opacity: 0.65,
    });
    const shadowPad = new THREE.Mesh(shadowPadGeo, shadowPadMat);
    shadowPad.rotation.x = -Math.PI / 2;
    shadowPad.position.set(0, -6.99, 0);
    this.scene.add(shadowPad);

    // 3. Desk Lamp structure on the left side
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-16.5, -6.8, 3.5);

    // Lamp base
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.4, 24);
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc8a463, // Brushed brass
      metalness: 0.85,
      roughness: 0.28,
    });
    const baseMesh = new THREE.Mesh(baseGeo, brassMat);
    lampGroup.add(baseMesh);

    // Articulated lamp neck
    const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, 10.5, 12);
    const stemMesh = new THREE.Mesh(stemGeo, brassMat);
    stemMesh.position.set(0, 5.2, 0);
    stemMesh.rotation.z = -0.15;
    lampGroup.add(stemMesh);

    // Lamp shade angled toward aquarium
    const shadeGeo = new THREE.ConeGeometry(1.5, 2.2, 24, 1, true);
    const shadeMesh = new THREE.Mesh(shadeGeo, brassMat);
    shadeMesh.position.set(1.4, 9.8, 0);
    shadeMesh.rotation.z = -Math.PI * 0.42;
    shadeMesh.rotation.y = 0.25;
    lampGroup.add(shadeMesh);

    // Glowing warm bulb
    const bulbGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffefc6 });
    const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.set(1.6, 9.6, 0);
    lampGroup.add(bulbMesh);

    this.scene.add(lampGroup);

    // 4. Desk accessory: Aquarium field guide / notepad on desk right
    const bookGeo = new THREE.BoxGeometry(4.2, 0.35, 3.2);
    const bookMat = new THREE.MeshStandardMaterial({
      color: 0x213a48,
      roughness: 0.6,
    });
    const book = new THREE.Mesh(bookGeo, bookMat);
    book.position.set(17.2, -6.8, 2.5);
    book.rotation.y = -0.22;
    book.receiveShadow = true;
    this.scene.add(book);
  }

  private initAquariumGlass() {
    const tankWidth = 28.4;
    const tankHeight = 14.4;
    const tankDepth = 12.4;

    // 1. Tank Glass Frame / Beveled Rim
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x1a242f, // Matte anodized aluminum trim
      roughness: 0.3,
      metalness: 0.8,
    });

    const bottomRimGeo = new THREE.BoxGeometry(tankWidth + 0.6, 0.4, tankDepth + 0.6);
    const bottomRim = new THREE.Mesh(bottomRimGeo, rimMat);
    bottomRim.position.y = -7.0;
    this.scene.add(bottomRim);

    const topCanopyGeo = new THREE.BoxGeometry(tankWidth + 0.6, 0.5, tankDepth + 0.6);
    const topCanopy = new THREE.Mesh(topCanopyGeo, rimMat);
    topCanopy.position.y = 7.2;
    this.scene.add(topCanopy);

    // 2. Rear Dark Frosted Glass Backing
    const backGeo = new THREE.PlaneGeometry(tankWidth, tankHeight);
    this.backMat = new THREE.MeshBasicMaterial({
      color: 0x05131f,
    });
    const backMesh = new THREE.Mesh(backGeo, this.backMat);
    backMesh.position.z = -tankDepth * 0.5;
    this.scene.add(backMesh);

    // 3. Left and Right Glass Side Panels (Fast translucent standard material)
    const sideGeo = new THREE.PlaneGeometry(tankDepth, tankHeight);
    const sideMat = new THREE.MeshStandardMaterial({
      color: 0xd0f0fd,
      transparent: true,
      opacity: 0.18,
      roughness: 0.1,
      metalness: 0.1,
      depthWrite: false,
    });

    const leftSide = new THREE.Mesh(sideGeo, sideMat);
    leftSide.rotation.y = Math.PI / 2;
    leftSide.position.x = -tankWidth * 0.5;
    this.scene.add(leftSide);

    const rightSide = new THREE.Mesh(sideGeo, sideMat);
    rightSide.rotation.y = -Math.PI / 2;
    rightSide.position.x = tankWidth * 0.5;
    this.scene.add(rightSide);

    // 4. Front Glass Pane (Hosts the procedural micro-flora canvas texture!)
    this.floraTexture = new THREE.CanvasTexture(this.floraSim.canvas);
    this.floraTexture.minFilter = THREE.LinearFilter;
    this.floraTexture.magFilter = THREE.LinearFilter;

    const frontGeo = new THREE.PlaneGeometry(tankWidth, tankHeight);
    const frontMat = new THREE.MeshStandardMaterial({
      map: this.floraTexture,
      transparent: true,
      opacity: 0.95,
      roughness: 0.15,
      metalness: 0.05,
      depthWrite: false,
    });
    this.frontGlassMesh = new THREE.Mesh(frontGeo, frontMat);
    this.frontGlassMesh.position.z = tankDepth * 0.5 + 0.05;
    this.scene.add(this.frontGlassMesh);

    // 5. Water Surface Meniscus with animated wave displacement
    const waterGeo = new THREE.PlaneGeometry(tankWidth, tankDepth, 32, 16);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x3ac5ea,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.2,
    });
    this.waterSurfaceMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterSurfaceMesh.rotation.x = -Math.PI / 2;
    this.waterSurfaceMesh.position.y = 6.8;
    this.scene.add(this.waterSurfaceMesh);
  }

  private initFishInstancing() {
    const maxBoids = 1000;
    const fishGeo = createFishGeometry();
    this.fishMaterial = createFishShaderMaterial();

    this.fishMesh = new THREE.InstancedMesh(fishGeo, this.fishMaterial, maxBoids);
    this.fishMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Custom Instanced Buffer Attributes for GPU spine undulation & 4D temporal fade
    const swimPhases = new Float32Array(maxBoids);
    const speeds = new Float32Array(maxBoids);
    const temporalAlphas = new Float32Array(maxBoids);
    const speciesIndices = new Float32Array(maxBoids);
    const biolumVals = new Float32Array(maxBoids);

    this.attrSwimPhase = new THREE.InstancedBufferAttribute(swimPhases, 1);
    this.attrSpeed = new THREE.InstancedBufferAttribute(speeds, 1);
    this.attrTemporalAlpha = new THREE.InstancedBufferAttribute(temporalAlphas, 1);
    this.attrSpeciesIndex = new THREE.InstancedBufferAttribute(speciesIndices, 1);
    this.attrBioluminescence = new THREE.InstancedBufferAttribute(biolumVals, 1);

    fishGeo.setAttribute('aSwimPhase', this.attrSwimPhase);
    fishGeo.setAttribute('aSpeed', this.attrSpeed);
    fishGeo.setAttribute('aTemporalAlpha', this.attrTemporalAlpha);
    fishGeo.setAttribute('aSpeciesIndex', this.attrSpeciesIndex);
    fishGeo.setAttribute('aBioluminescence', this.attrBioluminescence);

    this.fishMesh.count = this.boidSim.boids.length;
    this.scene.add(this.fishMesh);
  }

  private initFireflyInstancing() {
    this.fireflySystem = createFireflyMesh(650);
    this.fireflySystem.mesh.count = this.boidSim.fireflies.length;
    this.scene.add(this.fireflySystem.mesh);
  }

  private initDynamicLighting() {
    // 1. Ambient water glow
    this.ambientLight = new THREE.AmbientLight(0x184259, 1.4);
    this.scene.add(this.ambientLight);

    // 2. Overhead Aquarium Canopy LED Light (Casts crisp shadows & caustics)
    this.topAquariumLight = new THREE.DirectionalLight(0xbbf0ff, 2.2);
    this.topAquariumLight.position.set(2.0, 16.0, 2.0);
    this.topAquariumLight.castShadow = true;
    this.topAquariumLight.shadow.mapSize.width = 512;
    this.topAquariumLight.shadow.mapSize.height = 512;
    this.topAquariumLight.shadow.camera.near = 1;
    this.topAquariumLight.shadow.camera.far = 30;
    this.topAquariumLight.shadow.camera.left = -16;
    this.topAquariumLight.shadow.camera.right = 16;
    this.topAquariumLight.shadow.camera.top = 10;
    this.topAquariumLight.shadow.camera.bottom = -10;
    this.scene.add(this.topAquariumLight);

    // 3. Warm Desk Lamp Spotlight (Shines warm light from the left onto desk & tank)
    this.deskLampLight = new THREE.SpotLight(0xffdf99, 3.5, 38, Math.PI * 0.35, 0.45, 1.2);
    this.deskLampLight.position.set(-14.9, 2.8, 3.5);
    this.deskLampLight.target.position.set(-2.0, -3.0, 0);
    this.deskLampLight.castShadow = false;
    this.scene.add(this.deskLampLight);
    this.scene.add(this.deskLampLight.target);

    // 4. Dynamic Bioluminescent Cluster Light (Tracks the center of the fish flock!)
    this.boidClusterLight = new THREE.PointLight(0x00ffea, 2.4, 18, 1.8);
    this.boidClusterLight.position.set(0, 0, 0);
    this.scene.add(this.boidClusterLight);

    // 5. Reef Substrate & Rock Fill Light (Ensures rocks, corals, and substrate features are clearly visible)
    this.substrateFillLight = new THREE.DirectionalLight(0x90d4ed, 1.35);
    this.substrateFillLight.position.set(0, -1.5, 12.0);
    this.substrateFillLight.target.position.set(0, -6.0, 0);
    this.scene.add(this.substrateFillLight);
    this.scene.add(this.substrateFillLight.target);
  }

  private initVolumetricScattering() {
    // Volumetric God Rays Light Shafts inside the water column
    // Multiple downward angled planes with procedural raymarching/scattering shader
    const raysGeo = new THREE.ConeGeometry(13.0, 14.5, 24, 1, true);
    raysGeo.translate(0, -7.25, 0); // apex at water surface

    this.godRaysMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSchoolCenter: { value: new THREE.Vector3(0, 0, 0) },
        uSchoolActivity: { value: 1.0 },
        uRayIntensity: { value: 1.0 },
        uWaterColor: { value: new THREE.Color(0x38bdf8) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        varying vec2 vUv;
        uniform float uTime;
        uniform vec3 uSchoolCenter;
        uniform float uSchoolActivity;
        uniform float uRayIntensity;
        uniform vec3 uWaterColor;

        void main() {
          // Downward ray progression (apex at Y=7 to base at Y=-7)
          float depth = clamp((7.0 - vWorldPos.y) / 14.0, 0.0, 1.0);

          // Procedural animated light shafts
          float angle = atan(vWorldPos.z, vWorldPos.x);
          float rays = sin(angle * 7.0 + uTime * 0.6) *
                       sin(angle * 13.0 - uTime * 0.4) *
                       cos(angle * 19.0 + uTime * 0.8);
          rays = pow(max(rays * 0.5 + 0.5, 0.0), 3.0);

          // Dynamic light scattering response to boid school!
          // When fish school is near this ray, scattering intensity surges due to particulate water agitation
          float distToSchool = length(vWorldPos - uSchoolCenter);
          float scatterBoost = 1.0 + clamp((10.0 - distToSchool) * 0.15 * uSchoolActivity, 0.0, 2.5);

          // Top water entry is bright, fades near sand floor
          float verticalFade = sin(depth * 3.14159) * (1.0 - depth * 0.4);

          float alpha = rays * verticalFade * 0.28 * uRayIntensity * scatterBoost;
          vec3 rayColor = mix(uWaterColor, vec3(0.9, 0.98, 1.0), rays * 0.4);

          gl_FragColor = vec4(rayColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });

    this.volumetricGodRaysMesh = new THREE.Mesh(raysGeo, this.godRaysMaterial);
    this.volumetricGodRaysMesh.position.set(1.0, 7.0, 0);
    this.scene.add(this.volumetricGodRaysMesh);
  }

  public applyCircadianLighting(rawPhase: number) {
    const p = ((rawPhase % 1.0) + 1.0) % 1.0;
    const kfs = CIRCADIAN_KEYFRAMES;
    const n = kfs.length;

    let kfA = kfs[n - 1];
    let kfB = kfs[0];
    let span = 1.0 - kfA.phase + kfB.phase;
    let t = 0;

    if (p < kfs[0].phase) {
      // Between last keyframe (0.88) and first keyframe (0.05)
      kfA = kfs[n - 1];
      kfB = kfs[0];
      span = 1.0 - kfA.phase + kfB.phase;
      t = (p + (1.0 - kfA.phase)) / span;
    } else if (p >= kfs[n - 1].phase) {
      // Between last keyframe (0.88) and first keyframe (1.05 wrapped)
      kfA = kfs[n - 1];
      kfB = kfs[0];
      span = 1.0 - kfA.phase + kfB.phase;
      t = (p - kfA.phase) / span;
    } else {
      for (let i = 0; i < n - 1; i++) {
        if (p >= kfs[i].phase && p < kfs[i + 1].phase) {
          kfA = kfs[i];
          kfB = kfs[i + 1];
          span = kfs[i + 1].phase - kfs[i].phase;
          t = (p - kfs[i].phase) / span;
          break;
        }
      }
    }

    t = Math.max(0, Math.min(1, t));
    // Smooth Hermite ease (smoothstep)
    const s = t * t * (3.0 - 2.0 * t);

    // 1. Ambient Light
    if (this.ambientLight) {
      this.ambientLight.color.setHex(kfA.ambientColor).lerp(this.tmpColorB.setHex(kfB.ambientColor), s);
      this.ambientLight.intensity = kfA.ambientIntensity + (kfB.ambientIntensity - kfA.ambientIntensity) * s;
    }

    // 2. Top Aquarium Light
    if (this.topAquariumLight) {
      this.topAquariumLight.color.setHex(kfA.topColor).lerp(this.tmpColorB.setHex(kfB.topColor), s);
      this.topAquariumLight.intensity = kfA.topIntensity + (kfB.topIntensity - kfA.topIntensity) * s;
    }

    // 3. Dynamic Boid Cluster Light
    if (this.boidClusterLight) {
      this.boidClusterLight.color.setHex(kfA.clusterColor).lerp(this.tmpColorB.setHex(kfB.clusterColor), s);
      this.boidClusterLight.intensity = kfA.clusterIntensity + (kfB.clusterIntensity - kfA.clusterIntensity) * s;
    }

    // Substrate & Rock Fill Light
    if (this.substrateFillLight) {
      const ambientMix = kfA.ambientIntensity + (kfB.ambientIntensity - kfA.ambientIntensity) * s;
      this.substrateFillLight.intensity = Math.max(0.85, ambientMix * 0.85);
    }

    // 4. Volumetric God Rays
    if (this.godRaysMaterial?.uniforms) {
      this.godRaysMaterial.uniforms.uWaterColor.value
        .setHex(kfA.rayWaterColor)
        .lerp(this.tmpColorB.setHex(kfB.rayWaterColor), s);
      this.godRaysMaterial.uniforms.uRayIntensity.value =
        kfA.rayIntensity + (kfB.rayIntensity - kfA.rayIntensity) * s;
    }

    // 5. Caustics
    if (this.fishMaterial?.uniforms) {
      this.fishMaterial.uniforms.uCausticStrength.value =
        kfA.causticStrength + (kfB.causticStrength - kfA.causticStrength) * s;
    }

    // 6. Rear frosted glass
    if (this.backMat) {
      this.backMat.color.setHex(kfA.backColor).lerp(this.tmpColorB.setHex(kfB.backColor), s);
    }
  }

  public setDayNightPhase(phase: number) {
    this.dayNightCycle.currentPhase = ((phase % 1.0) + 1.0) % 1.0;
    this.applyCircadianLighting(this.dayNightCycle.currentPhase);
    this.renderer.shadowMap.needsUpdate = true;
  }

  public setDayNightCycleEnabled(enabled: boolean) {
    this.dayNightCycle.enabled = enabled;
  }

  public setDayNightCyclePeriod(periodSeconds: number) {
    this.dayNightCycle.periodSeconds = Math.max(10.0, Math.min(periodSeconds, 600.0));
  }

  public setLightingPreset(preset: LightingPreset) {
    this.currentPreset = preset;
    this.renderer.shadowMap.needsUpdate = true;
    switch (preset) {
      case 'daylight':
        this.setDayNightPhase(0.25);
        break;
      case 'sunset':
        this.setDayNightPhase(0.50);
        break;
      case 'bioluminescent':
        this.setDayNightPhase(0.72);
        break;
      case 'midnight':
        this.setDayNightPhase(0.88);
        break;
    }
  }

  public toggleDeskLamp(): boolean {
    this.deskLampEnabled = !this.deskLampEnabled;
    this.deskLampLight.intensity = this.deskLampEnabled ? 3.5 : 0.0;
    this.fishMaterial.uniforms.uDeskLampIntensity.value = this.deskLampEnabled ? 1.2 : 0.0;
    this.renderer.shadowMap.needsUpdate = true;
    if (this.deskLampEnabled) {
      this.boidSim.lightTarget = { x: -14.0, y: 3.5, z: 3.5, intensity: 1.4 };
    } else {
      this.boidSim.lightTarget = { x: 0, y: 5.5, z: 0, intensity: 0.9 };
    }
    return this.deskLampEnabled;
  }

  public render() {
    if (this.isDestroyed) return;
    this.animFrameId = requestAnimationFrame(this.render);

    try {
      benchmarkEngine.beginFrame();
      const dt = Math.min(this.clock.getDelta(), 0.05);
      const elapsedTime = this.clock.getElapsedTime();

      // 1. Camera Viewport Motion (Parallax, Zen Cinematic Tour, or Organism Tracking)
      if (this.isZenTour) {
        // Smooth continuous 3D Lissajous orbit across the desk aquarium
        const angle = elapsedTime * 0.09;
        const targetCamX = Math.sin(angle) * 7.5;
        const targetCamY = 1.8 + Math.sin(elapsedTime * 0.14) * 2.2;
        const targetCamZ = 26.5 + Math.cos(angle) * 3.8;
        this.camera.position.x += (targetCamX - this.camera.position.x) * 0.035;
        this.camera.position.y += (targetCamY - this.camera.position.y) * 0.035;
        this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.035;
        this.targetLookAt.set(Math.sin(angle * 0.7) * 3.5, -0.5 + Math.sin(angle * 1.1) * 1.5, 0);
      } else if (this.trackedOrganism && this.isTrackingCamera) {
        // Track live coordinates of inspected creature
        const live = this.getInspectedOrganismLiveData(this.trackedOrganism.id);
        if (live) {
          this.trackedOrganism = live;
          const targetCamX = THREE.MathUtils.clamp(live.x * 0.65, -9, 9) + this.targetCameraOffset.x;
          const targetCamY = THREE.MathUtils.clamp(live.y * 0.65 + 1.8, -2, 5) + this.targetCameraOffset.y;
          const targetCamZ = 24.5;
          this.camera.position.x += (targetCamX - this.camera.position.x) * 0.05;
          this.camera.position.y += (targetCamY - this.camera.position.y) * 0.05;
          this.camera.position.z += (targetCamZ - this.camera.position.z) * 0.05;
          this.targetLookAt.set(live.x, live.y, live.z);
        } else {
          this.targetLookAt.set(0, -0.2, 0);
        }
      } else {
        // Default 2.5D optical parallax
        const targetCamX = this.targetCameraOffset.x;
        const targetCamY = 1.8 + this.targetCameraOffset.y;
        this.camera.position.x += (targetCamX - this.camera.position.x) * 0.04;
        this.camera.position.y += (targetCamY - this.camera.position.y) * 0.04;
        this.camera.position.z += (26.5 - this.camera.position.z) * 0.04;
        this.targetLookAt.set(0, -0.2, 0);
      }
      this.currentLookAt.lerp(this.targetLookAt, 0.05);
      this.camera.lookAt(this.currentLookAt);

      // 2. Update 4D Boids simulation
      this.boidSim.update(dt);

      // 2b. Advance Gentle Circadian Day-Night Cycle if auto-cycle is enabled
      if (this.dayNightCycle.enabled && this.dayNightCycle.periodSeconds > 0) {
        this.dayNightCycle.currentPhase =
          (this.dayNightCycle.currentPhase + dt / this.dayNightCycle.periodSeconds) % 1.0;
        this.applyCircadianLighting(this.dayNightCycle.currentPhase);
      }
      benchmarkEngine.markStage('boidsPhysics');

      // 3. Update Procedural Micro-Flora canvas (only upload to GPU texture when canvas is redrawn!)
      if (this.floraSim.update(dt) && this.floraTexture) {
        this.floraTexture.needsUpdate = true;
      }
      benchmarkEngine.markStage('floraSim');

    // 4. Update Fish Instanced Attributes & Transforms
    const boids = this.boidSim.boids;
    const boidCount = boids.length;
    this.fishMesh.count = boidCount;

    const swimArr = this.attrSwimPhase.array as Float32Array;
    const speedArr = this.attrSpeed.array as Float32Array;
    const alphaArr = this.attrTemporalAlpha.array as Float32Array;
    const spArr = this.attrSpeciesIndex.array as Float32Array;
    const bioArr = this.attrBioluminescence.array as Float32Array;

    for (let i = 0; i < boidCount; i++) {
      const b = boids[i];

      // Position
      this.dummyObj.position.set(b.x, b.y, b.z);

      // Orientation aligned with 3D velocity vector
      const speed = b.speed || 0.01;
      const dirX = b.vx / speed;
      const dirY = b.vy / speed;
      const dirZ = b.vz / speed;

      // Fish geometry is aligned along +X axis (zero per-frame allocation)
      this.tmpHeading.set(dirX, dirY, dirZ);
      if (this.tmpHeading.lengthSq() > 0.0001) {
        this.tmpHeading.normalize();
        this.targetQuat.setFromUnitVectors(this.xAxis, this.tmpHeading);

        // Gentle banking during turns
        const bank = -b.vx * dirZ * 0.15;
        this.tmpBankQuat.setFromAxisAngle(this.tmpHeading, bank);
        this.targetQuat.multiply(this.tmpBankQuat);
      } else {
        this.targetQuat.identity();
      }

      this.dummyObj.quaternion.copy(this.targetQuat);
      this.dummyObj.scale.set(b.scale, b.scale, b.scale);
      this.dummyObj.updateMatrix();

      this.fishMesh.setMatrixAt(i, this.dummyObj.matrix);

      // Custom attributes for GPU shader
      swimArr[i] = b.swimPhase;
      speedArr[i] = b.speed;
      alphaArr[i] = b.temporalAlpha;
      spArr[i] = b.speciesIndex;
      bioArr[i] = b.bioluminescence;
    }

    this.fishMesh.instanceMatrix.needsUpdate = true;
    this.attrSwimPhase.needsUpdate = true;
    this.attrSpeed.needsUpdate = true;
    this.attrTemporalAlpha.needsUpdate = true;
    this.attrSpeciesIndex.needsUpdate = true;
    this.attrBioluminescence.needsUpdate = true;
    benchmarkEngine.markStage('instancedFish');

    // 3b. Update Micro-Firefly Swarm (Bioluminescent plankton instances)
    const fireflies = this.boidSim.fireflies;
    const ffCount = Math.min(fireflies.length, 650);
    this.fireflySystem.mesh.count = ffCount;

    const ffFlashArr = this.fireflySystem.attrFlashIntensity.array as Float32Array;
    const ffAlphaArr = this.fireflySystem.attrTemporalAlpha.array as Float32Array;
    const ffColorArr = this.fireflySystem.attrColorType.array as Float32Array;

    for (let i = 0; i < ffCount; i++) {
      const ff = fireflies[i];
      this.dummyObj.position.set(ff.x, ff.y, ff.z);
      this.dummyObj.quaternion.identity();
      this.dummyObj.scale.set(ff.scale, ff.scale, ff.scale);
      this.dummyObj.updateMatrix();

      this.fireflySystem.mesh.setMatrixAt(i, this.dummyObj.matrix);
      ffFlashArr[i] = ff.flashIntensity;
      ffAlphaArr[i] = ff.temporalAlpha;
      ffColorArr[i] = ff.colorType;
    }

    this.fireflySystem.mesh.instanceMatrix.needsUpdate = true;
    this.fireflySystem.attrFlashIntensity.needsUpdate = true;
    this.fireflySystem.attrTemporalAlpha.needsUpdate = true;
    this.fireflySystem.attrColorType.needsUpdate = true;
    this.fireflySystem.material.uniforms.uTime.value = elapsedTime;
    benchmarkEngine.markStage('instancedFireflies');

    // 4. Update Dynamic Lighting responding to boid flocking movement
    const sc = this.boidSim.schoolCenter;
    this.boidClusterLight.position.set(sc.x, sc.y, sc.z);
    this.fishMaterial.uniforms.uTime.value = elapsedTime;
    this.fishMaterial.uniforms.uSchoolCenter.value.set(sc.x, sc.y, sc.z);

    // Update Volumetric God Rays scattering responding to school position & kinetic activity
    this.godRaysMaterial.uniforms.uTime.value = elapsedTime;
    this.godRaysMaterial.uniforms.uSchoolCenter.value.set(sc.x, sc.y, sc.z);
    this.godRaysMaterial.uniforms.uSchoolActivity.value = this.boidSim.schoolActivity;

    // 5. Animate Plant Shader Materials (hydrodynamic current sway & caustics)
    if (this.coralObjects && this.coralObjects.plantMaterials) {
      for (let i = 0; i < this.coralObjects.plantMaterials.length; i++) {
        this.coralObjects.plantMaterials[i].uniforms.uTime.value = elapsedTime;
      }
    }

    // 5b. Update Botanical Plant Lifecycle (Organic Growth, Maturation, Senescence Wilting, Chlorosis, Detritus, Spores & Rebirth)
    if (this.coralObjects && this.coralObjects.plantLifecycleSim) {
      this.coralObjects.plantLifecycleSim.update(dt, this.boidSim.timeSpeed);
      benchmarkEngine.markStage('plantLifecycle');
    }

    // 6. Animate sea anemone waving tentacles
    if (this.coralObjects && this.coralObjects.anemoneMesh) {
      const mesh = this.coralObjects.anemoneMesh;
      const bases = this.coralObjects.anemoneBasePositions;
      const dummy = this.dummyObj;

      for (let i = 0; i < bases.length; i++) {
        const base = bases[i];
        const waveX = Math.sin(elapsedTime * 1.8 + base.x * 0.8) * 0.22;
        const waveZ = Math.cos(elapsedTime * 1.6 + base.z * 0.8) * 0.22;

        dummy.position.copy(base);
        dummy.rotation.set(waveX, base.x + elapsedTime * 0.1, waveZ);
        dummy.scale.set(1.0, 1.0 + Math.sin(elapsedTime * 2.0 + i) * 0.15, 1.0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // 7. Update Rising Micro-Bubbles
    if (this.coralObjects && this.coralObjects.bubblePositions) {
      const pos = this.coralObjects.bubblePositions;
      const vel = this.coralObjects.bubbleVelocities;
      const count = pos.length / 3;

      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += vel[i * 3 + 1] * dt;
        pos[i * 3] += Math.sin(elapsedTime * 5.0 + i) * 0.02;

        // Bubble pops at water surface
        if (pos[i * 3 + 1] > 6.7) {
          pos[i * 3 + 1] = -6.5;
          pos[i * 3] = -8.0 + (Math.random() - 0.5) * 0.8;
          pos[i * 3 + 2] = -2.5 + (Math.random() - 0.5) * 0.8;
        }
      }
      this.coralObjects.bubbleSystem.geometry.attributes.position.needsUpdate = true;
    }

    // 8. Update Food Pellet Meshes
    this.updateFoodPellets();
    benchmarkEngine.markStage('ambientObjects');

    // 9. Update Micro-Fauna (Crabs, Snails, Ghost Shrimp, Hydromedusae)
    this.microFaunaSim.update(dt, this.dayNightCycle.currentPhase);
    benchmarkEngine.markStage('microFaunaSim');

    this.microFaunaRenderer.update(dt);
    benchmarkEngine.markStage('microFaunaRender');

    // 10. Render Scene & Screen Space Displacement (SSD) Post-Processing Pipeline
    if (this.ssdPass && this.ssdPass.config.enabled) {
      this.renderer.setRenderTarget(this.ssdPass.renderTarget);
      this.renderer.clear();
      this.renderer.render(this.scene, this.camera);
      benchmarkEngine.markStage('webglRender');

      // Compute screen space projection coordinates for school center and airstone bubble generator
      const sc = this.boidSim.schoolCenter;
      this.tmpSchoolVec.set(sc.x, sc.y, sc.z);
      this.tmpSchoolVec.project(this.camera);
      this.schoolScreenUv.set(
        (this.tmpSchoolVec.x + 1.0) * 0.5,
        (this.tmpSchoolVec.y + 1.0) * 0.5
      );

      this.tmpBubbleVec.set(-8.0, -6.5, -2.5);
      this.tmpBubbleVec.project(this.camera);
      this.bubbleScreenUv.set(
        (this.tmpBubbleVec.x + 1.0) * 0.5,
        (this.tmpBubbleVec.y + 1.0) * 0.5
      );

      this.ssdPass.update(
        elapsedTime,
        this.schoolScreenUv,
        this.boidSim.schoolActivity,
        this.bubbleScreenUv
      );

      this.renderer.setRenderTarget(null);
      this.ssdPass.render(this.renderer);
      benchmarkEngine.markStage('screenSpaceDisplacement');
    } else {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
      benchmarkEngine.markStage('webglRender');
    }

    benchmarkEngine.endFrame(this.renderer.info.render.calls, this.renderer.info.render.triangles);

    // 11. Compute accurate FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 500) {
      this.currentFps = Math.max(1, Math.round((this.frameCount * 1000) / (now - this.lastFpsTime)));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }
  } catch (err) {
    console.error('Render loop error:', err);
  }
}

  private updateFoodPellets() {
    // Zero-allocation update of pooled food meshes
    const pellets = this.boidSim.foodPellets;
    const count = Math.min(pellets.length, this.maxFoodPellets);

    for (let i = 0; i < this.maxFoodPellets; i++) {
      const mesh = this.foodMeshPool[i];
      if (i < count) {
        mesh.position.set(pellets[i].x, pellets[i].y, pellets[i].z);
        mesh.visible = true;
      } else if (mesh.visible) {
        mesh.visible = false;
      }
    }
  }

  public dropFoodAtScreen(screenX: number, screenY: number) {
    const rect = this.container.getBoundingClientRect();
    const mouseX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((screenY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

    // Plane inside aquarium at middle depth (Z = 0)
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    if (target) {
      aquariumAudio.playFoodDrop();

      // Clamp inside tank bounds
      const clampedX = Math.max(-13, Math.min(13, target.x));
      const clampedY = Math.max(-5.5, Math.min(6.5, target.y));
      const clampedZ = (Math.random() - 0.5) * 4.0;

      // Spawn food pellet cluster
      for (let i = 0; i < 3; i++) {
        this.boidSim.addFood(
          clampedX + (Math.random() - 0.5) * 0.8,
          clampedY + (Math.random() - 0.5) * 0.8,
          clampedZ + (Math.random() - 0.5) * 0.8
        );
      }
    }
  }

  public stirWaterAtScreen(screenX: number, screenY: number) {
    const rect = this.container.getBoundingClientRect();
    const mouseX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((screenY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    if (target) {
      aquariumAudio.playGlassTap();
      this.boidSim.disturbance = {
        x: target.x,
        y: target.y,
        z: target.z,
        strength: 1.0,
      };
      // Micro-fauna reaction (crabs threaten, snails retract, shrimp caridoid dart!)
      this.microFaunaSim.startleNearby(target.x, target.y, target.z, 5.5);
    }
  }

  public dropSubstrateWafer(screenX?: number, screenY?: number) {
    if (screenX !== undefined && screenY !== undefined) {
      const rect = this.container.getBoundingClientRect();
      const mouseX = ((screenX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((screenY - rect.top) / rect.height) * 2 + 1;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      const target = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, target);
      if (target) {
        this.microFaunaSim.dropSubstrateWafer(target.x, target.z);
        return;
      }
    }
    this.microFaunaSim.dropSubstrateWafer();
  }

  public startleMicroFauna() {
    aquariumAudio.playGlassTap();
    this.microFaunaSim.startleNearby(0, -6.0, 0, 20.0);
  }

  public spawnMicroBubblesAt(x: number, y: number, z: number) {
    if (!this.coralObjects || !this.coralObjects.bubblePositions) return;
    const pos = this.coralObjects.bubblePositions;
    const count = pos.length / 3;
    for (let k = 0; k < 3; k++) {
      const idx = Math.floor(Math.random() * count) * 3;
      pos[idx] = x + (Math.random() - 0.5) * 0.3;
      pos[idx + 1] = y + (Math.random() - 0.5) * 0.3;
      pos[idx + 2] = z + (Math.random() - 0.5) * 0.3;
    }
    this.coralObjects.bubbleSystem.geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Raycast into the 3D water volume to find and select the closest organism (fish or micro-fauna).
   */
  public raycastOrganism(screenX: number, screenY: number): InspectedOrganism | null {
    const rect = this.container.getBoundingClientRect();
    const mouseX = ((screenX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((screenY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), this.camera);
    const ray = raycaster.ray;

    let closestDist = Infinity;
    let selected: InspectedOrganism | null = null;
    const tmpPt = new THREE.Vector3();

    // 1. Check Boid School & Pelagic Leviathans
    const boids = this.boidSim.boids;
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      if (b.temporalAlpha < 0.15) continue;
      tmpPt.set(b.x, b.y, b.z);
      const distToRay = ray.distanceToPoint(tmpPt);
      const maxDist = Math.max(1.5, b.scale * 1.6);
      if (distToRay < maxDist) {
        const depthDist = ray.origin.distanceTo(tmpPt);
        const score = distToRay * 2.0 + depthDist * 0.5;
        if (score < closestDist) {
          closestDist = score;
          const cfg = SPECIES_CONFIGS[b.speciesIndex] || SPECIES_CONFIGS[0];
          const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz);
          let state = 'Cruising';
          if (b.isBursting) state = 'Burst Propulsion';
          else if (b.speed < 1.0) state = 'Gliding / Coasting';
          else if (b.curiosityTimer && b.curiosityTimer > 0) state = 'Investigating Reef';

          selected = {
            id: `boid_${i}`,
            type: 'boid',
            speciesIndex: b.speciesIndex,
            name: cfg.name,
            scientificName: this.getScientificName(cfg.name),
            category: cfg.regime === 'macro_pelagic' ? 'Macro Pelagic Leviathan' : 'Meso Schooling Teleost',
            description: cfg.description,
            x: b.x,
            y: b.y,
            z: b.z,
            vx: b.vx,
            vy: b.vy,
            vz: b.vz,
            speed: parseFloat(speed.toFixed(2)),
            w: parseFloat(b.w.toFixed(1)),
            scale: parseFloat(b.scale.toFixed(2)),
            state,
            energy: Math.min(100, Math.round(65 + Math.sin(b.swimPhase) * 20)),
            alertness: b.isBursting ? 0.8 : 0.2,
            colorHex: cfg.regime === 'macro_pelagic' ? '#c084fc' : '#38bdf8',
          };
        }
      }
    }

    // 2. Check Benthic & Epibenthic Micro-Fauna (Crabs, Snails, Shrimp, Medusae)
    const entities = this.microFaunaSim.entities;
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      tmpPt.set(e.x, e.y, e.z);
      const distToRay = ray.distanceToPoint(tmpPt);
      const maxDist = Math.max(1.4, e.sizeScale * 1.5);
      if (distToRay < maxDist) {
        const depthDist = ray.origin.distanceTo(tmpPt);
        const score = distToRay * 2.0 + depthDist * 0.5;
        if (score < closestDist) {
          closestDist = score;
          const speed = Math.sqrt(e.vx * e.vx + e.vy * e.vy + e.vz * e.vz);
          const stateFormatted = e.state
            .split('_')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          selected = {
            id: e.id,
            type: 'microfauna',
            name: e.name,
            scientificName: this.getScientificName(e.species),
            category: this.getCategoryLabel(e.category),
            description: `Benthic micro-fauna attached to ${e.attachedSurface.replace('_', ' ')}.`,
            x: e.x,
            y: e.y,
            z: e.z,
            vx: e.vx,
            vy: e.vy,
            vz: e.vz,
            speed: parseFloat(speed.toFixed(2)),
            scale: parseFloat(e.sizeScale.toFixed(2)),
            state: stateFormatted,
            energy: Math.round(e.energy),
            alertness: parseFloat(e.alertness.toFixed(2)),
            colorHex: '#2dd4bf',
          };
        }
      }
    }

    if (selected) {
      this.trackedOrganism = selected;
      aquariumAudio.playTemporalChime(1.15);
      this.onOrganismSelect?.(selected);
    }
    return selected;
  }

  /**
   * Retrieves live coordinate, velocity, and state for the currently inspected organism.
   */
  public getInspectedOrganismLiveData(id: string): InspectedOrganism | null {
    if (!id) return null;
    if (id.startsWith('boid_')) {
      const idx = parseInt(id.replace('boid_', ''), 10);
      const b = this.boidSim.boids[idx];
      if (!b) return null;
      const cfg = SPECIES_CONFIGS[b.speciesIndex] || SPECIES_CONFIGS[0];
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy + b.vz * b.vz);
      let state = 'Cruising';
      if (b.isBursting) state = 'Burst Propulsion';
      else if (b.speed < 1.0) state = 'Gliding / Coasting';
      else if (b.curiosityTimer && b.curiosityTimer > 0) state = 'Investigating Reef';

      return {
        id,
        type: 'boid',
        speciesIndex: b.speciesIndex,
        name: cfg.name,
        scientificName: this.getScientificName(cfg.name),
        category: cfg.regime === 'macro_pelagic' ? 'Macro Pelagic Leviathan' : 'Meso Schooling Teleost',
        description: cfg.description,
        x: b.x,
        y: b.y,
        z: b.z,
        vx: b.vx,
        vy: b.vy,
        vz: b.vz,
        speed: parseFloat(speed.toFixed(2)),
        w: parseFloat(b.w.toFixed(1)),
        scale: parseFloat(b.scale.toFixed(2)),
        state,
        energy: Math.min(100, Math.round(65 + Math.sin(b.swimPhase) * 20)),
        alertness: b.isBursting ? 0.8 : 0.2,
        colorHex: cfg.regime === 'macro_pelagic' ? '#c084fc' : '#38bdf8',
      };
    } else {
      const entity = this.microFaunaSim.entities.find((e) => e.id === id);
      if (!entity) return null;
      const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy + entity.vz * entity.vz);
      const stateFormatted = entity.state
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      return {
        id: entity.id,
        type: 'microfauna',
        name: entity.name,
        scientificName: this.getScientificName(entity.species),
        category: this.getCategoryLabel(entity.category),
        description: `Benthic micro-fauna attached to ${entity.attachedSurface.replace('_', ' ')}.`,
        x: entity.x,
        y: entity.y,
        z: entity.z,
        vx: entity.vx,
        vy: entity.vy,
        vz: entity.vz,
        speed: parseFloat(speed.toFixed(2)),
        scale: parseFloat(entity.sizeScale.toFixed(2)),
        state: stateFormatted,
        energy: Math.round(entity.energy),
        alertness: parseFloat(entity.alertness.toFixed(2)),
        colorHex: '#2dd4bf',
      };
    }
  }

  private getScientificName(key: string): string {
    const map: Record<string, string> = {
      'Titan Leviathan': 'Symphysodon aequifasciatus gigantea',
      'Celestial Ray': 'Potamotrygon astraea',
      'Neon Tetra': 'Paracheirodon innesi',
      'Golden Guppy': 'Poecilia reticulata aurum',
      'Azure Discus': 'Symphysodon haraldi caeruleus',
      'Bioluminescent Tang': 'Paracanthurus lucens',
      shore_crab: 'Pachygrapsus crassipes',
      hermit_crab: 'Pagurus samuelis',
      nerite_snail: 'Neritina natalensis',
      mystery_snail: 'Pomacea bridgesii',
      ghost_shrimp: 'Palaemonetes paludosus',
      hydromedusa: 'Craspedacusta sowerbii',
    };
    return map[key] || 'Aquatica spec.';
  }

  private getCategoryLabel(cat: string): string {
    const map: Record<string, string> = {
      crab: 'Benthic Decapod Scavenger',
      snail: 'Epibenthic Gastropod Grazer',
      shrimp: 'Demersal Decapod Scavenger',
      medusa: 'Pelagic Hydrozoan Medusa',
    };
    return map[cat] || 'Marine Invertebrate';
  }

  public selectOrganism(org: InspectedOrganism | null) {
    this.trackedOrganism = org;
    this.onOrganismSelect?.(org);
  }

  public clearInspectedOrganism() {
    this.trackedOrganism = null;
    this.onOrganismSelect?.(null);
  }

  public toggleZenTour(): boolean {
    this.isZenTour = !this.isZenTour;
    if (this.isZenTour) {
      this.clearInspectedOrganism();
    }
    return this.isZenTour;
  }

  public setTrackingCamera(enabled: boolean) {
    this.isTrackingCamera = enabled;
  }

  /**
   * Captures a high-resolution lossless snapshot of the current 3D viewport and triggers download.
   */
  public captureSnapshot(): string {
    // Render current frame directly
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    aquariumAudio.playCameraShutter();

    // Trigger instant browser download
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `chronos-aquarium-${timestamp}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return dataUrl;
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.isDestroyed) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    const nx = (e.clientX / w) * 2 - 1;
    const ny = -(e.clientY / h) * 2 + 1;
    this.targetCameraOffset.x = nx * 2.2;
    this.targetCameraOffset.y = ny * 1.3;
  };

  private onResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    const pixelRatio = Math.min(window.devicePixelRatio, 1.25);
    this.renderer.setPixelRatio(pixelRatio);
    if (this.ssdPass) {
      this.ssdPass.setSize(width, height, pixelRatio);
    }
  };

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    this.microFaunaRenderer.destroy();
    if (this.ssdPass) {
      this.ssdPass.dispose();
    }
    this.foodGeo.dispose();
    this.foodMat.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
