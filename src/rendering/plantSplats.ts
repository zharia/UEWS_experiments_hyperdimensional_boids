/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { GLSL_SMOOTH_MATH } from './smoothMath';

export type PlantLeafType =
  | 0 // Cabomba / Fanwort fine capillary feather fan
  | 1 // Kelp / Laminaria corrugated blade splat
  | 2 // Amazon Sword / Cryptocoryne broad lanceolate leaf with midrib
  | 3 // Coral polyp / tentacles disc splat
  | 4; // Fleshy gorgonian verruca bud

export interface SplatDescriptor {
  position: THREE.Vector3;
  direction: THREE.Vector3; // Tangent (leaf pointing direction)
  normal: THREE.Vector3;    // Upward / outward leaf normal
  width: number;
  length: number;
  leafType: PlantLeafType;
  curl: number;            // Curvature / arch factor
  phyllotaxisIndex: number;
  ageOffset: number;       // Staggered maturity [0, 1]
}

export interface PlantSplatSystemOptions {
  splats: SplatDescriptor[];
  baseColor: THREE.Color;
  midColor: THREE.Color;
  tipColor: THREE.Color;
  senescentColor?: THREE.Color;
  subsurfaceColor?: THREE.Color;
}

/**
 * Creates a high-performance Leaf / Polyp Splat System.
 * Splats use oriented quad geometry with analytical 3D normal curvature,
 * procedural micro-venation, smin petiole blending, hydrodynamic flutter,
 * and biological lifecycle states (growth, chlorophyll bloom, chlorosis withering).
 */
export function createPlantSplatMesh(options: PlantSplatSystemOptions): {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
} {
  const { splats, baseColor, midColor, tipColor } = options;
  const count = splats.length;

  if (count === 0) {
    const emptyGeo = new THREE.BufferGeometry();
    const emptyMat = new THREE.ShaderMaterial();
    return { mesh: new THREE.Mesh(emptyGeo, emptyMat), material: emptyMat };
  }

  // 4 vertices per splat quad, 6 indices (2 triangles)
  const vertexCount = count * 4;
  const indexCount = count * 6;

  const positions = new Float32Array(vertexCount * 3);
  const uvs = new Float32Array(vertexCount * 2);
  const aOrigins = new Float32Array(vertexCount * 3);
  const aTangents = new Float32Array(vertexCount * 3);
  const aNormals = new Float32Array(vertexCount * 3);
  const aSizes = new Float32Array(vertexCount * 2);
  const aParams = new Float32Array(vertexCount * 4); // [leafType, curl, phyllotaxisIndex, ageOffset]
  const indices = new Uint32Array(indexCount);

  // Standard quad quad UV coords: [-1, 1] for x, [0, 1] for y (0 = petiole base, 1 = apical tip)
  const quadUVs = [
    [-1.0, 0.0],
    [1.0, 0.0],
    [1.0, 1.0],
    [-1.0, 1.0],
  ];

  for (let i = 0; i < count; i++) {
    const s = splats[i];
    const vOffset = i * 4;
    const iOffset = i * 6;

    // Build orthonormal frame: tangent = leaf direction, normal = leaf surface normal, bitangent = width axis
    const tangent = s.direction.clone().normalize();
    const normal = s.normal.clone().normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    // Re-orthogonalize normal
    normal.crossVectors(tangent, bitangent).normalize();

    for (let v = 0; v < 4; v++) {
      const idx = vOffset + v;
      const idx3 = idx * 3;
      const idx2 = idx * 2;
      const idx4 = idx * 4;

      const qU = quadUVs[v][0];
      const qV = quadUVs[v][1];

      // Initial local vertex offset around origin
      const halfW = s.width * 0.5;
      const len = s.length;

      const lx = bitangent.x * (qU * halfW) + tangent.x * (qV * len);
      const ly = bitangent.y * (qU * halfW) + tangent.y * (qV * len);
      const lz = bitangent.z * (qU * halfW) + tangent.z * (qV * len);

      positions[idx3] = s.position.x + lx;
      positions[idx3 + 1] = s.position.y + ly;
      positions[idx3 + 2] = s.position.z + lz;

      uvs[idx2] = qU;
      uvs[idx2 + 1] = qV;

      aOrigins[idx3] = s.position.x;
      aOrigins[idx3 + 1] = s.position.y;
      aOrigins[idx3 + 2] = s.position.z;

      aTangents[idx3] = tangent.x;
      aTangents[idx3 + 1] = tangent.y;
      aTangents[idx3 + 2] = tangent.z;

      aNormals[idx3] = normal.x;
      aNormals[idx3 + 1] = normal.y;
      aNormals[idx3 + 2] = normal.z;

      aSizes[idx2] = s.width;
      aSizes[idx2 + 1] = s.length;

      aParams[idx4] = s.leafType;
      aParams[idx4 + 1] = s.curl;
      aParams[idx4 + 2] = s.phyllotaxisIndex;
      aParams[idx4 + 3] = s.ageOffset;
    }

    // Two triangles per quad
    indices[iOffset] = vOffset;
    indices[iOffset + 1] = vOffset + 1;
    indices[iOffset + 2] = vOffset + 2;
    indices[iOffset + 3] = vOffset;
    indices[iOffset + 4] = vOffset + 2;
    indices[iOffset + 5] = vOffset + 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute('aOrigin', new THREE.BufferAttribute(aOrigins, 3));
  geometry.setAttribute('aTangent', new THREE.BufferAttribute(aTangents, 3));
  geometry.setAttribute('aNormal', new THREE.BufferAttribute(aNormals, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(aSizes, 2));
  geometry.setAttribute('aParams', new THREE.BufferAttribute(aParams, 4));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeBoundingSphere();

  const senescentColor = options.senescentColor ?? new THREE.Color(0xb5782a); // golden-brown xanthophyll
  const subsurfaceColor = options.subsurfaceColor ?? new THREE.Color(0xa3e635); // luminous chartreuse

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uGrowthScale: { value: 1.0 },   // 0.0 to 1.0 biological growth factor
      uWiltAmount: { value: 0.0 },     // 0.0 (turgid upright) to 1.0 (drooping under senescence)
      uChlorosis: { value: 0.0 },       // 0.0 (vibrant green) to 1.0 (yellowed senescent)
      uBaseColor: { value: baseColor },
      uMidColor: { value: midColor },
      uTipColor: { value: tipColor },
      uSenescentColor: { value: senescentColor },
      uSubsurfaceColor: { value: subsurfaceColor },
      uLightDir: { value: new THREE.Vector3(0.2, 1.0, 0.2).normalize() },
      uLightColor: { value: new THREE.Color(0xd6f4ff) },
      uAmbientColor: { value: new THREE.Color(0x13303d) },
    },
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false, // Clean depth sorting for translucent aquatic splats
    vertexShader: `
      attribute vec3 aOrigin;
      attribute vec3 aTangent;
      attribute vec3 aNormal;
      attribute vec2 aSize;
      attribute vec4 aParams; // x: leafType, y: curl, z: phyllotaxisIndex, w: ageOffset

      uniform float uTime;
      uniform float uGrowthScale;
      uniform float uWiltAmount;
      uniform float uChlorosis;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vWorldTangent;
      varying vec3 vWorldBitangent;
      varying vec4 vParams;
      varying float vLeafMaturity;

      ${GLSL_SMOOTH_MATH}

      void main() {
        vUv = uv;
        vParams = aParams;

        float leafType = aParams.x;
        float curl = aParams.y;
        float phyllo = aParams.z;
        float ageOffset = aParams.w;

        // Biological leaf growth curve: younger leaves near apical tips sprout later
        float localGrowth = clamp((uGrowthScale - ageOffset * 0.3) / 0.7, 0.05, 1.0);
        vLeafMaturity = localGrowth;

        // Build basis vectors
        vec3 tangent = normalize(aTangent);
        vec3 normal = normalize(aNormal);
        vec3 bitangent = normalize(cross(normal, tangent));

        float qU = uv.x;
        float qV = uv.y; // 0 at base, 1 at tip

        // Smooth-minimum petiole flare at base (qV close to 0) to avoid abrupt edge
        float petioleWidth = smin(abs(qU), qV * 1.6, 0.25);
        float widthFactor = mix(petioleWidth, 1.0, smoothstep(0.0, 0.3, qV));

        // Growth expansion
        float leafWidth = aSize.x * localGrowth * (1.0 - smoothstep(0.85, 1.0, qV) * 0.6); // slight tip taper
        float leafLength = aSize.y * localGrowth;

        // Longitudinal arch curl
        float arch = pow(qV, 1.8) * curl * localGrowth;
        // Senescence drooping: gravitational sag downward along world Y
        float sag = pow(qV, 2.0) * uWiltAmount * 0.45;

        // Hydrodynamic water flutter
        float flutterPhase = uTime * 2.2 + phyllo * 1.618 + aOrigin.x * 0.4 + aOrigin.y * 0.3;
        float flutter = sin(flutterPhase) * (qV * 0.08 * (1.0 + uWiltAmount * 0.5));
        float twist = cos(flutterPhase * 0.8) * (qU * qV * 0.06);

        // Displace along tangent, bitangent, and normal
        vec3 displaced = aOrigin 
          + bitangent * (qU * leafWidth * 0.5 * widthFactor + twist)
          + tangent * (qV * leafLength)
          + normal * (arch + flutter)
          + vec3(0.0, -sag, 0.0);

        vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
        vWorldPos = worldPos.xyz;

        mat3 normalMatrix3 = mat3(modelMatrix);
        vWorldNormal = normalize(normalMatrix3 * normal);
        vWorldTangent = normalize(normalMatrix3 * tangent);
        vWorldBitangent = normalize(normalMatrix3 * bitangent);

        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uGrowthScale;
      uniform float uWiltAmount;
      uniform float uChlorosis;
      uniform vec3 uBaseColor;
      uniform vec3 uMidColor;
      uniform vec3 uTipColor;
      uniform vec3 uSenescentColor;
      uniform vec3 uSubsurfaceColor;
      uniform vec3 uLightDir;
      uniform vec3 uLightColor;
      uniform vec3 uAmbientColor;

      varying vec2 vUv;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vWorldTangent;
      varying vec3 vWorldBitangent;
      varying vec4 vParams;
      varying float vLeafMaturity;

      ${GLSL_SMOOTH_MATH}

      // Hash function for cellular stippling
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      void main() {
        float qU = vUv.x; // [-1.0, 1.0]
        float qV = vUv.y; // [0.0, 1.0]
        float leafType = vParams.x;
        float phyllo = vParams.z;

        float alpha = 1.0;
        float venation = 0.0;
        float microRelief = 0.0;

        // 1. Morphological Boundary & Micro-details by leaf type
        if (leafType < 0.5) {
          // --- Type 0: Cabomba / Fanwort Capillary Feather Fan ---
          // Radiating dissected needle lobes
          float angle = atan(qU, max(0.05, qV));
          float dist = length(vec2(qU * 0.8, qV));
          float fanRays = abs(sin(angle * 7.5 + phyllo * 0.5));
          // Fine capillary filaments
          float needleMask = smoothstep(0.45, 0.15, fanRays);
          alpha = needleMask * smoothstep(1.0, 0.75, dist) * smoothstep(0.0, 0.08, qV);
          venation = smoothstep(0.05, 0.0, abs(qU * 2.0));

        } else if (leafType < 1.5) {
          // --- Type 1: Kelp / Laminaria Corrugated Blade ---
          // Wavy ruffled margins
          float marginWave = sin(qV * 18.0 + phyllo) * 0.12;
          float bladeBorder = 1.0 - pow(abs(qU) + marginWave, 2.0);
          alpha = smoothstep(0.0, 0.25, bladeBorder) * smoothstep(1.0, 0.85, qV) * smoothstep(0.0, 0.06, qV);
          // Longitudinal vascular corrugated ridges
          float ridges = sin(qU * 16.0) * 0.5 + 0.5;
          microRelief = ridges * 0.35;
          venation = ridges * 0.25;

        } else if (leafType < 2.5) {
          // --- Type 2: Amazon Sword / Cryptocoryne Broad Lanceolate Leaf ---
          // Elliptic lanceolate profile with sharp apical tip
          float leafShape = (1.0 - abs(qU)) * sin(qV * 3.14159);
          alpha = smoothstep(0.0, 0.22, leafShape);

          // Prominent central midrib vein
          float midrib = 1.0 - smoothstep(0.0, 0.08, abs(qU));
          // Arching secondary lateral venation
          float lateralVeins = abs(sin((qV * 12.0 - abs(qU) * 4.0) * 3.14159));
          lateralVeins = smoothstep(0.65, 0.1, lateralVeins) * (1.0 - abs(qU) * 0.7);
          venation = midrib * 0.6 + lateralVeins * 0.3;
          microRelief = midrib * 0.4 + lateralVeins * 0.2;

        } else {
          // --- Type 3 & 4: Coral Polyp / Disc Splat ---
          float dist = length(vec2(qU, qV * 2.0 - 1.0));
          // Radiating tentacles/verrucae
          float tentacleAngle = atan(qU, qV * 2.0 - 1.0);
          float tentacles = sin(tentacleAngle * 8.0) * 0.15;
          alpha = smoothstep(1.0, 0.7, dist + tentacles);
          microRelief = (1.0 - dist) * 0.5;
        }

        // Clip near-transparent pixels
        if (alpha < 0.02) discard;

        // Cellular chloroplast grain
        vec2 cellP = vUv * vec2(28.0, 36.0);
        float cellularGrain = hash(floor(cellP)) * 0.14;

        // 2. Analytical 3D Curved Normal Reconstruction
        // Reconstruct a curved convex 3D normal across the flat quad
        float curveX = -qU * 1.1; // convex roll across width
        float curveY = -(qV - 0.5) * 0.5;
        vec3 analyticalNormal = normalize(
          vWorldNormal + vWorldBitangent * curveX + vWorldTangent * curveY
        );

        // Add micro-relief perturbation
        analyticalNormal = normalize(analyticalNormal + vWorldNormal * (microRelief * 0.3));

        // 3. Color & Biological Lifecycle Blending
        // Height/age gradient along leaf
        vec3 leafColor = mix(uBaseColor, uMidColor, smoothstep(0.0, 0.5, qV));
        leafColor = mix(leafColor, uTipColor, smoothstep(0.5, 1.0, qV));

        // Enhance venation: translucent lighter midrib and darker cell walls
        leafColor += vec3(venation * 0.22);
        leafColor *= (0.9 + cellularGrain);

        // Senescence / Chlorosis (yellowing & browning)
        // Progresses from leaf edges and tips inward
        float senescentSpread = clamp(uChlorosis * 1.3 + (1.0 - vLeafMaturity) * 0.2 + abs(qU) * 0.4 * uChlorosis, 0.0, 1.0);
        vec3 necroticCol = mix(uSenescentColor, vec3(0.24, 0.16, 0.08), smoothstep(0.6, 1.0, senescentSpread));
        leafColor = mix(leafColor, necroticCol, smoothstep(0.15, 0.85, senescentSpread));

        // Reduce opacity at senescent leaf margins (decay holes / rotting tatter)
        if (uChlorosis > 0.4) {
          float decayNoise = hash(vUv * 12.0);
          if (decayNoise < (uChlorosis - 0.3) * 0.4 && abs(qU) > 0.5) {
            alpha *= 0.3;
          }
        }

        // 4. Lighting & Subsurface Translucency
        vec3 lightDir = normalize(uLightDir);
        vec3 viewDir = normalize(cameraPosition - vWorldPos);

        // Front diffuse
        float NdotL = max(0.0, dot(analyticalNormal, lightDir));
        vec3 diffuse = uLightColor * NdotL * 0.75;

        // Subsurface Translucency (backlight shining through thin chlorophyll membrane)
        float backLight = max(0.0, dot(-analyticalNormal, lightDir));
        float thickness = clamp(1.0 - abs(qU) * 0.5, 0.2, 1.0); // thinner at edges
        vec3 sss = uSubsurfaceColor * pow(backLight, 2.0) * (1.2 - thickness * 0.5) * 0.8;

        // Translucent rim Fresnel
        float fresnel = pow(1.0 - max(0.0, dot(viewDir, analyticalNormal)), 2.5);
        vec3 rim = uTipColor * fresnel * 0.45;

        // Specular cuticle sheen
        vec3 halfVec = normalize(lightDir + viewDir);
        float spec = pow(max(0.0, dot(analyticalNormal, halfVec)), 28.0) * 0.25;

        vec3 finalColor = uAmbientColor * leafColor + leafColor * diffuse + sss + rim + vec3(spec);

        // Young sprout glow / Chlorophyll fluorescence
        if (vLeafMaturity < 0.6) {
          finalColor += uSubsurfaceColor * (1.0 - vLeafMaturity) * 0.2;
        }

        gl_FragColor = vec4(finalColor, alpha * smoothstep(0.02, 0.12, vLeafMaturity));
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return { mesh, material };
}
