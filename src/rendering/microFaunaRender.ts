/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { MicroFaunaEntity } from '../types';
import { MicroFaunaSimulation } from '../simulation/microFauna';
import { JellyfishSoftBody } from './jellyfishSoftBody';

interface EntityRenderNode {
  group: THREE.Group;
  category: string;
  // Rig components for procedural animation
  leftClaw?: THREE.Group;
  rightClaw?: THREE.Group;
  leftDactyl?: THREE.Mesh;
  rightDactyl?: THREE.Mesh;
  legs?: THREE.Group[];
  shell?: THREE.Mesh;
  foot?: THREE.Mesh;
  leftTentacle?: THREE.Mesh;
  rightTentacle?: THREE.Mesh;
  shrimpAbdomen?: THREE.Group;
  swimmerets?: THREE.Group[];
  shrimpAntennae?: THREE.Group;
  jellyBell?: THREE.Mesh;
  jellyCore?: THREE.Mesh;
  jellyTentacles?: THREE.LineSegments;
  jellySoftBody?: JellyfishSoftBody;
}

export class MicroFaunaRenderer {
  public group: THREE.Group;
  private sim: MicroFaunaSimulation;
  private nodes: Map<string, EntityRenderNode> = new Map();

  // Shared Geometries & Materials for high efficiency
  private materials: {
    hermitShell: THREE.MeshStandardMaterial;
    shoreCrabCarapace: THREE.MeshStandardMaterial;
    crabLeg: THREE.MeshStandardMaterial;
    crabEye: THREE.MeshStandardMaterial;
    neriteShell: THREE.MeshStandardMaterial;
    mysteryShell: THREE.MeshStandardMaterial;
    snailFoot: THREE.MeshStandardMaterial;
    snailTentacle: THREE.MeshStandardMaterial;
    ghostShrimpGlass: THREE.MeshStandardMaterial;
    ghostShrimpOrgan: THREE.MeshStandardMaterial;
    jellyBell: THREE.MeshStandardMaterial;
    jellyCore: THREE.MeshBasicMaterial;
    jellyTentacles: THREE.LineBasicMaterial;
  };

  constructor(scene: THREE.Scene, sim: MicroFaunaSimulation) {
    this.sim = sim;
    this.group = new THREE.Group();
    this.group.name = 'microFaunaGroup';
    scene.add(this.group);

    // Initialize materials
    this.materials = {
      hermitShell: new THREE.MeshStandardMaterial({
        color: 0xc48c68, // Warm mottled terracotta/cream seashell
        roughness: 0.65,
        metalness: 0.05,
      }),
      shoreCrabCarapace: new THREE.MeshStandardMaterial({
        color: 0x993d28, // Rustic rust-crimson shell
        roughness: 0.55,
        metalness: 0.1,
      }),
      crabLeg: new THREE.MeshStandardMaterial({
        color: 0xba5d3a,
        roughness: 0.6,
      }),
      crabEye: new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.1,
        metalness: 0.8,
      }),
      neriteShell: new THREE.MeshStandardMaterial({
        color: 0x3d352e, // Espresso olive with zebra banding sheen
        roughness: 0.35,
        metalness: 0.15,
      }),
      mysteryShell: new THREE.MeshStandardMaterial({
        color: 0xd99b26, // Golden amber translucent shell
        roughness: 0.3,
        metalness: 0.1,
      }),
      snailFoot: new THREE.MeshStandardMaterial({
        color: 0xe6e0d8,
        roughness: 0.4,
        transparent: true,
        opacity: 0.85,
      }),
      snailTentacle: new THREE.MeshStandardMaterial({
        color: 0xd8d0c5,
        roughness: 0.5,
      }),
      ghostShrimpGlass: new THREE.MeshStandardMaterial({
        color: 0xdbf4f9, // Crystal translucent glass
        roughness: 0.12,
        metalness: 0.1,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
      ghostShrimpOrgan: new THREE.MeshStandardMaterial({
        color: 0xf59e0b, // Amber glowing internal hepatopancreas
        emissive: 0xd97706,
        emissiveIntensity: 0.65,
        roughness: 0.3,
      }),
      jellyBell: new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        roughness: 0.1,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
      jellyCore: new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.9,
      }),
      jellyTentacles: new THREE.LineBasicMaterial({
        color: 0x67e8f9,
        transparent: true,
        opacity: 0.55,
      }),
    };

    this.rebuildMeshes();
  }

  public rebuildMeshes() {
    // Clear old nodes and dispose soft-body resources
    for (const node of this.nodes.values()) {
      node.jellySoftBody?.dispose();
    }
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
    this.nodes.clear();

    for (const entity of this.sim.entities) {
      let node: EntityRenderNode | null = null;
      switch (entity.category) {
        case 'crab':
          node = this.buildCrabMesh(entity);
          break;
        case 'snail':
          node = this.buildSnailMesh(entity);
          break;
        case 'shrimp':
          node = this.buildShrimpMesh(entity);
          break;
        case 'medusa':
          node = this.buildMedusaMesh(entity);
          break;
      }

      if (node) {
        this.nodes.set(entity.id, node);
        this.group.add(node.group);
      }
    }
  }

  // ==================== CRAB 3D MESH BUILDER ====================
  private buildCrabMesh(entity: MicroFaunaEntity): EntityRenderNode {
    const root = new THREE.Group();
    const isHermit = entity.species === 'hermit_crab';

    // 1. Shell / Carapace
    let shellMesh: THREE.Mesh;
    if (isHermit) {
      // Coiled spiral seashell for Hermit Crab
      const shellGeo = new THREE.ConeGeometry(0.38, 0.72, 12);
      shellGeo.rotateZ(Math.PI * 0.4);
      shellGeo.translate(-0.15, 0.15, -0.2);
      shellMesh = new THREE.Mesh(shellGeo, this.materials.hermitShell);
      root.add(shellMesh);

      // Cephalothorax emerging from shell aperture
      const bodyGeo = new THREE.SphereGeometry(0.24, 12, 10);
      bodyGeo.scale(1.2, 0.65, 1.0);
      const bodyMesh = new THREE.Mesh(bodyGeo, this.materials.shoreCrabCarapace);
      bodyMesh.position.set(0.05, 0.08, 0.05);
      root.add(bodyMesh);
    } else {
      // Broad flattened shore crab carapace with lateral spines
      const carapaceGeo = new THREE.CylinderGeometry(0.42, 0.36, 0.22, 14);
      carapaceGeo.scale(1.35, 0.8, 1.0);
      shellMesh = new THREE.Mesh(carapaceGeo, this.materials.shoreCrabCarapace);
      shellMesh.position.y = 0.12;
      root.add(shellMesh);
    }

    // 2. Eyestalks with black cornea spheres
    const eyeStemGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 8);
    const corneaGeo = new THREE.SphereGeometry(0.045, 8, 8);

    [-0.09, 0.09].forEach(xOffset => {
      const eyeStem = new THREE.Mesh(eyeStemGeo, this.materials.crabLeg);
      eyeStem.position.set(xOffset, 0.22, 0.22);
      eyeStem.rotation.x = 0.3;
      root.add(eyeStem);

      const cornea = new THREE.Mesh(corneaGeo, this.materials.crabEye);
      cornea.position.set(xOffset, 0.31, 0.26);
      root.add(cornea);
    });

    // 3. Chelipeds (Left & Right Claws with opening dactyls)
    const buildClaw = (isLeft: boolean) => {
      const clawGroup = new THREE.Group();
      const side = isLeft ? -1 : 1;
      const armScale = isHermit && !isLeft ? 1.4 : 1.0; // Hermit crab major claw

      // Upper arm
      const armGeo = new THREE.CylinderGeometry(0.045 * armScale, 0.055 * armScale, 0.26 * armScale, 8);
      armGeo.rotateZ(side * 0.6);
      const arm = new THREE.Mesh(armGeo, this.materials.crabLeg);
      clawGroup.add(arm);

      // Palm (propodus)
      const propodusGeo = new THREE.ConeGeometry(0.08 * armScale, 0.22 * armScale, 8);
      propodusGeo.rotateX(Math.PI * 0.5);
      const propodus = new THREE.Mesh(propodusGeo, this.materials.shoreCrabCarapace);
      propodus.position.set(side * 0.18 * armScale, 0.05, 0.2 * armScale);
      clawGroup.add(propodus);

      // Movable dactyl (pincer finger)
      const dactylGeo = new THREE.ConeGeometry(0.035 * armScale, 0.15 * armScale, 6);
      dactylGeo.rotateX(Math.PI * 0.5);
      const dactyl = new THREE.Mesh(dactylGeo, this.materials.crabLeg);
      dactyl.position.set(side * 0.22 * armScale, 0.09, 0.28 * armScale);
      clawGroup.add(dactyl);

      clawGroup.position.set(side * 0.2, 0.08, 0.12);
      root.add(clawGroup);

      return { clawGroup, dactyl };
    };

    const left = buildClaw(true);
    const right = buildClaw(false);

    // 4. Six jointed walking legs (3 pairs)
    const legGroups: THREE.Group[] = [];
    const legGeo = new THREE.CylinderGeometry(0.03, 0.02, 0.36, 6);
    legGeo.rotateZ(Math.PI * 0.35);

    for (let side = -1; side <= 1; side += 2) {
      for (let p = 0; p < 3; p++) {
        const legGrp = new THREE.Group();
        const legMesh = new THREE.Mesh(legGeo, this.materials.crabLeg);
        legMesh.position.set(side * 0.18, 0, 0);
        if (side < 0) legMesh.rotation.z = Math.PI;
        legGrp.add(legMesh);

        legGrp.position.set(side * 0.22, 0.08, -0.1 + p * 0.14);
        legGrp.rotation.y = (p - 1) * 0.3;
        root.add(legGrp);
        legGroups.push(legGrp);
      }
    }

    const scale = entity.sizeScale * 1.5;
    root.scale.set(scale, scale, scale);

    return {
      group: root,
      category: 'crab',
      leftClaw: left.clawGroup,
      rightClaw: right.clawGroup,
      leftDactyl: left.dactyl,
      rightDactyl: right.dactyl,
      legs: legGroups,
      shell: shellMesh,
    };
  }

  // ==================== SNAIL 3D MESH BUILDER ====================
  private buildSnailMesh(entity: MicroFaunaEntity): EntityRenderNode {
    const root = new THREE.Group();
    const isNerite = entity.species === 'nerite_snail';

    // 1. Spiral Shell (Conical helical shell)
    const shellGeo = new THREE.ConeGeometry(0.32, 0.58, 16);
    shellGeo.rotateX(Math.PI * 0.3);
    shellGeo.rotateY(0.2);
    const shellMat = isNerite ? this.materials.neriteShell : this.materials.mysteryShell;
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);
    shellMesh.position.set(0, 0.22, -0.08);
    root.add(shellMesh);

    // 2. Fleshy creeping foot
    const footGeo = new THREE.CylinderGeometry(0.18, 0.26, 0.1, 16);
    footGeo.scale(0.8, 1.0, 1.8);
    const footMesh = new THREE.Mesh(footGeo, this.materials.snailFoot);
    footMesh.position.y = 0.05;
    root.add(footMesh);

    // 3. Eyestalk tentacles (Cephalic tentacles)
    const tentacleGeo = new THREE.ConeGeometry(0.02, 0.32, 8);
    tentacleGeo.rotateX(Math.PI * 0.35);

    const leftTentacle = new THREE.Mesh(tentacleGeo, this.materials.snailTentacle);
    leftTentacle.position.set(-0.08, 0.1, 0.26);
    leftTentacle.rotation.y = -0.25;
    root.add(leftTentacle);

    const rightTentacle = new THREE.Mesh(tentacleGeo, this.materials.snailTentacle);
    rightTentacle.position.set(0.08, 0.1, 0.26);
    rightTentacle.rotation.y = 0.25;
    root.add(rightTentacle);

    const scale = entity.sizeScale * 1.4;
    root.scale.set(scale, scale, scale);

    return {
      group: root,
      category: 'snail',
      shell: shellMesh,
      foot: footMesh,
      leftTentacle,
      rightTentacle,
    };
  }

  // ==================== GHOST SHRIMP 3D MESH BUILDER ====================
  private buildShrimpMesh(entity: MicroFaunaEntity): EntityRenderNode {
    const root = new THREE.Group();

    // 1. Cephalothorax (Translucent glass carapace)
    const thoraxGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.52, 10);
    thoraxGeo.rotateX(Math.PI * 0.5);
    const thorax = new THREE.Mesh(thoraxGeo, this.materials.ghostShrimpGlass);
    thorax.position.set(0, 0.16, 0.1);
    root.add(thorax);

    // Internal glowing amber/cyan organ (hepatopancreas)
    const organGeo = new THREE.SphereGeometry(0.08, 10, 10);
    const organ = new THREE.Mesh(organGeo, this.materials.ghostShrimpOrgan);
    organ.position.set(0, 0.16, 0.12);
    root.add(organ);

    // Pointed rostrum spear
    const rostrumGeo = new THREE.ConeGeometry(0.025, 0.26, 6);
    rostrumGeo.rotateX(Math.PI * 0.5);
    const rostrum = new THREE.Mesh(rostrumGeo, this.materials.ghostShrimpGlass);
    rostrum.position.set(0, 0.22, 0.46);
    root.add(rostrum);

    // Black stalked eyes
    const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
    [-0.08, 0.08].forEach(xOff => {
      const eye = new THREE.Mesh(eyeGeo, this.materials.crabEye);
      eye.position.set(xOff, 0.22, 0.32);
      root.add(eye);
    });

    // 2. Articulated Abdomen & Tail Fan
    const abdomenGroup = new THREE.Group();
    abdomenGroup.position.set(0, 0.15, -0.15);

    const segCount = 4;
    const segGeo = new THREE.CylinderGeometry(0.11, 0.08, 0.18, 8);
    segGeo.rotateX(Math.PI * 0.5);

    for (let s = 0; s < segCount; s++) {
      const seg = new THREE.Mesh(segGeo, this.materials.ghostShrimpGlass);
      seg.position.set(0, -s * 0.05, -s * 0.14);
      seg.scale.set(1 - s * 0.12, 1 - s * 0.12, 1);
      abdomenGroup.add(seg);
    }

    // Fan Tail (Uropods & Telson)
    const fanGeo = new THREE.PlaneGeometry(0.26, 0.22);
    const fan = new THREE.Mesh(fanGeo, this.materials.ghostShrimpGlass);
    fan.position.set(0, -0.22, -0.62);
    fan.rotation.x = Math.PI * 0.35;
    abdomenGroup.add(fan);
    root.add(abdomenGroup);

    // 3. Pleopods (Fluttering swimmerets under abdomen)
    const swimmerets: THREE.Group[] = [];
    const swimPaddleGeo = new THREE.PlaneGeometry(0.08, 0.14);

    for (let p = 0; p < 3; p++) {
      const pGrp = new THREE.Group();
      const pMesh = new THREE.Mesh(swimPaddleGeo, this.materials.ghostShrimpGlass);
      pMesh.rotation.x = Math.PI * 0.2;
      pGrp.add(pMesh);
      pGrp.position.set(0, 0.06, -0.05 - p * 0.12);
      root.add(pGrp);
      swimmerets.push(pGrp);
    }

    // 4. Sweeping Antennae filaments
    const antennaeGroup = new THREE.Group();
    const antGeo = new THREE.CylinderGeometry(0.01, 0.005, 0.85, 6);
    antGeo.rotateX(Math.PI * 0.45);

    const leftAnt = new THREE.Mesh(antGeo, this.materials.ghostShrimpGlass);
    leftAnt.position.set(-0.06, 0.24, 0.45);
    leftAnt.rotation.y = -0.3;
    antennaeGroup.add(leftAnt);

    const rightAnt = new THREE.Mesh(antGeo, this.materials.ghostShrimpGlass);
    rightAnt.position.set(0.06, 0.24, 0.45);
    rightAnt.rotation.y = 0.3;
    antennaeGroup.add(rightAnt);

    root.add(antennaeGroup);

    const scale = entity.sizeScale * 1.5;
    root.scale.set(scale, scale, scale);

    return {
      group: root,
      category: 'shrimp',
      shrimpAbdomen: abdomenGroup,
      swimmerets,
      shrimpAntennae: antennaeGroup,
    };
  }

  // ==================== HYDROMEDUSA 3D MESH BUILDER ====================
  private buildMedusaMesh(entity: MicroFaunaEntity): EntityRenderNode {
    const softBody = new JellyfishSoftBody(entity);

    return {
      group: softBody.root,
      category: 'medusa',
      jellySoftBody: softBody,
    };
  }

  // ==================== PER-FRAME RIG ANIMATION ====================
  public update(dt: number = 0.016) {
    for (const entity of this.sim.entities) {
      const node = this.nodes.get(entity.id);
      if (!node) continue;

      // Position node
      node.group.position.set(entity.x, entity.y, entity.z);
      node.group.rotation.set(entity.pitch, entity.rotationY, entity.roll);

      switch (node.category) {
        case 'crab':
          this.animateCrab(node, entity);
          break;
        case 'snail':
          this.animateSnail(node, entity);
          break;
        case 'shrimp':
          this.animateShrimp(node, entity);
          break;
        case 'medusa':
          this.animateMedusa(node, entity, dt);
          break;
      }
    }
  }

  private animateCrab(node: EntityRenderNode, entity: MicroFaunaEntity) {
    const cycle = entity.animCycle;
    const isMoving = Math.abs(entity.vx) > 0.05 || Math.abs(entity.vz) > 0.05;

    // 1. Walking leg kinematics (alternating tripod gait)
    if (node.legs) {
      for (let i = 0; i < node.legs.length; i++) {
        const leg = node.legs[i];
        const phaseOffset = (i % 3) * 1.1 + (i >= 3 ? Math.PI : 0);
        if (isMoving) {
          leg.rotation.y = Math.sin(cycle * 3.0 + phaseOffset) * 0.35;
          leg.rotation.x = Math.cos(cycle * 3.0 + phaseOffset) * 0.2;
        } else {
          leg.rotation.y *= 0.9;
          leg.rotation.x *= 0.9;
        }
      }
    }

    // 2. Claws & Pincers posture
    if (node.leftClaw && node.rightClaw) {
      if (entity.state === 'defensive') {
        // High defensive threat display: claws elevated high and wide!
        node.leftClaw.rotation.z = -0.9;
        node.leftClaw.rotation.x = -0.5 + Math.sin(cycle * 6.0) * 0.15;
        node.rightClaw.rotation.z = 0.9;
        node.rightClaw.rotation.x = -0.5 + Math.cos(cycle * 6.0) * 0.15;

        // Pincers open wide!
        if (node.leftDactyl) node.leftDactyl.rotation.z = -0.7;
        if (node.rightDactyl) node.rightDactyl.rotation.z = 0.7;
      } else if (entity.state === 'eating') {
        // Alternating pincers bringing food to mouth
        node.leftClaw.rotation.z = -0.2 + Math.sin(cycle * 4.0) * 0.25;
        node.rightClaw.rotation.z = 0.2 - Math.cos(cycle * 4.0) * 0.25;
        node.leftClaw.rotation.x = -0.2;
        node.rightClaw.rotation.x = -0.2;

        if (node.leftDactyl) node.leftDactyl.rotation.z = Math.sin(cycle * 8.0) * 0.3;
        if (node.rightDactyl) node.rightDactyl.rotation.z = Math.cos(cycle * 8.0) * 0.3;
      } else {
        // Normal foraging posture
        node.leftClaw.rotation.z = -0.3 + Math.sin(cycle * 1.5) * 0.08;
        node.rightClaw.rotation.z = 0.3 - Math.sin(cycle * 1.5) * 0.08;
        node.leftClaw.rotation.x = 0.1;
        node.rightClaw.rotation.x = 0.1;

        if (node.leftDactyl) node.leftDactyl.rotation.z = 0;
        if (node.rightDactyl) node.rightDactyl.rotation.z = 0;
      }
    }
  }

  private animateSnail(node: EntityRenderNode, entity: MicroFaunaEntity) {
    const cycle = entity.animCycle;

    // Eyestalk tentacles twitching
    if (node.leftTentacle && node.rightTentacle) {
      if (entity.state === 'retracted') {
        node.leftTentacle.scale.set(0.2, 0.2, 0.2);
        node.rightTentacle.scale.set(0.2, 0.2, 0.2);
        if (node.foot) node.foot.scale.set(0.6, 0.6, 0.6);
      } else {
        node.leftTentacle.scale.set(1, 1, 1);
        node.rightTentacle.scale.set(1, 1, 1);
        if (node.foot) node.foot.scale.set(1, 1, 1);

        node.leftTentacle.rotation.z = Math.sin(cycle * 1.2) * 0.18;
        node.rightTentacle.rotation.z = -Math.cos(cycle * 1.4) * 0.18;
      }
    }
  }

  private animateShrimp(node: EntityRenderNode, entity: MicroFaunaEntity) {
    const cycle = entity.animCycle;

    // Pleopods (swimmerets) fluttering when hovering
    if (node.swimmerets) {
      const isSwimming = entity.state === 'hovering' || entity.state === 'escape_dart';
      for (let i = 0; i < node.swimmerets.length; i++) {
        const sw = node.swimmerets[i];
        if (isSwimming) {
          sw.rotation.x = Math.sin(cycle * 7.0 + i * 0.8) * 0.55;
        } else {
          sw.rotation.x *= 0.9;
        }
      }
    }

    // Abdomen curl during escape reflex
    if (node.shrimpAbdomen) {
      if (entity.state === 'escape_dart') {
        node.shrimpAbdomen.rotation.x = 0.85; // Sharp tail-flip tuck!
      } else {
        node.shrimpAbdomen.rotation.x = Math.sin(cycle * 1.5) * 0.12;
      }
    }

    // Antennae sweeping in the current
    if (node.shrimpAntennae) {
      node.shrimpAntennae.rotation.z = Math.sin(cycle * 1.8) * 0.15;
    }
  }

  private animateMedusa(node: EntityRenderNode, entity: MicroFaunaEntity, dt: number) {
    if (node.jellySoftBody) {
      let currentX = 0;
      let currentZ = 0;

      // React to fluid currents or water disturbances (e.g. user stirring)
      if (this.sim.boidSim?.disturbance) {
        const d = this.sim.boidSim.disturbance;
        const dx = entity.x - d.x;
        const dy = entity.y - d.y;
        const dz = entity.z - d.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < 36) {
          const dist = Math.sqrt(distSq) + 0.1;
          const factor = (1 - dist / 6) * d.strength;
          currentX = (dx / dist) * factor * 1.5;
          currentZ = (dz / dist) * factor * 1.5;
        }
      }

      node.jellySoftBody.update(entity, dt, currentX, currentZ);
    }
  }

  public destroy() {
    for (const node of this.nodes.values()) {
      node.jellySoftBody?.dispose();
    }
    if (this.group.parent) {
      this.group.parent.remove(this.group);
    }
  }
}
