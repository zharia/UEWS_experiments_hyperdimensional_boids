/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FloraColony {
  x: number;
  y: number;
  radius: number;
  branches: { x: number; y: number; angle: number; length: number; width: number; depth: number }[];
  type: 'chlorophyte' | 'diatom' | 'bryophyte';
  hue: number;
  growthRate: number;
}

export class ProceduralFloraSimulation {
  public width: number;
  public height: number;
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public coverage: number = 18; // Percentage 0-100
  public growthSpeed: number = 1.0;
  public isAutoCleaning: boolean = false;

  private colonies: FloraColony[] = [];
  private lastUpdate: number = performance.now();
  private lastGrowthTime: number = performance.now();
  private lastTextureUploadTime: number = 0;
  private lastCoverageCalc: number = 0;
  private dirty: boolean = true;
  private textureNeedsUpload: boolean = true;

  constructor(width: number = 512, height: number = 256) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d')!;

    this.initFlora();
  }

  public initFlora() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.colonies = [];

    // Seed 14 initial algal colonies, mostly clustering along the lower glass edge, corners, and glass boundaries
    const seedCount = 14;
    for (let i = 0; i < seedCount; i++) {
      const isBottom = Math.random() < 0.65;
      const x = (0.05 + Math.random() * 0.9) * this.width;
      const y = isBottom
        ? (0.7 + Math.random() * 0.28) * this.height
        : (0.15 + Math.random() * 0.7) * this.height;

      const types: ('chlorophyte' | 'diatom' | 'bryophyte')[] = ['chlorophyte', 'diatom', 'bryophyte'];
      const type = types[Math.floor(Math.random() * types.length)];
      const hue = type === 'chlorophyte' ? 120 + Math.random() * 30 : type === 'diatom' ? 42 + Math.random() * 25 : 155 + Math.random() * 20;

      const colony: FloraColony = {
        x,
        y,
        radius: 12 + Math.random() * 25,
        branches: [],
        type,
        hue,
        growthRate: 0.6 + Math.random() * 0.8,
      };

      // Generate fractal dendritic branches
      const branchCount = 6 + Math.floor(Math.random() * 8);
      for (let b = 0; b < branchCount; b++) {
        const angle = (b / branchCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        this.addBranch(colony, x, y, angle, 12 + Math.random() * 18, 3.5, 0);
      }

      this.colonies.push(colony);
    }

    this.render();
    this.calculateCoverage();
  }

  private addBranch(
    colony: FloraColony,
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    depth: number
  ) {
    if (depth > 4 || width < 0.7) return;

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    colony.branches.push({
      x: endX,
      y: endY,
      angle,
      length,
      width,
      depth,
    });

    // Sub-branches (dendritic arborization)
    const subCount = Math.random() < 0.75 ? 2 : 1;
    for (let s = 0; s < subCount; s++) {
      const spread = (Math.random() - 0.5) * 1.1;
      const newLength = length * (0.65 + Math.random() * 0.25);
      this.addBranch(colony, endX, endY, angle + spread, newLength, width * 0.7, depth + 1);
    }
  }

  public update(dt: number): boolean {
    const now = performance.now();
    const elapsed = Math.min((now - this.lastUpdate) / 1000, 0.1);
    this.lastUpdate = now;

    // Auto-cleaning snails / shrimp
    if (this.isAutoCleaning) {
      this.cleanRadius(
        (0.2 + 0.6 * Math.sin(now * 0.0006)) * this.width,
        (0.4 + 0.4 * Math.cos(now * 0.0008)) * this.height,
        32
      );
    }

    // Procedural growth step - throttled to periodic interval to avoid unnecessary redraws
    const nowMs = performance.now();
    if (this.growthSpeed > 0 && nowMs - this.lastGrowthTime > 2500) {
      this.lastGrowthTime = nowMs;
      if (this.colonies.length < 24 && Math.random() < 0.25) {
        // Spawn microscopic new spore
        const x = Math.random() * this.width;
        const y = (0.3 + Math.random() * 0.68) * this.height;
        const colony: FloraColony = {
          x,
          y,
          radius: 6,
          branches: [],
          type: Math.random() > 0.4 ? 'chlorophyte' : 'diatom',
          hue: 130 + (Math.random() - 0.5) * 40,
          growthRate: 0.8,
        };
        this.addBranch(colony, x, y, Math.random() * Math.PI * 2, 7, 2.0, 0);
        this.colonies.push(colony);
        this.dirty = true;
      }

      // Grow existing colonies
      for (const col of this.colonies) {
        if (col.branches.length < 60 && Math.random() < 0.5 * this.growthSpeed) {
          const randBranch = col.branches[Math.floor(Math.random() * col.branches.length)];
          if (randBranch && randBranch.depth < 4) {
            const spread = (Math.random() - 0.5) * 1.2;
            this.addBranch(
              col,
              randBranch.x,
              randBranch.y,
              randBranch.angle + spread,
              7 * (0.8 + Math.random() * 0.4),
              Math.max(0.6, randBranch.width * 0.75),
              randBranch.depth + 1
            );
            this.dirty = true;
          }
        }
      }
    }

    // Only re-render full canvas if new colonies/branches sprouted
    if (this.dirty) {
      this.render();
      this.dirty = false;
      this.textureNeedsUpload = true;
      this.calculateCoverage();
    }

    // Throttle GPU texture upload to max 10Hz (every 100ms) to prevent pipeline stalls
    if (this.textureNeedsUpload && nowMs - this.lastTextureUploadTime > 100) {
      this.lastTextureUploadTime = nowMs;
      this.textureNeedsUpload = false;
      return true;
    }

    return false;
  }

  public cleanRadius(centerX: number, centerY: number, radius: number) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'destination-out';
    const grad = this.ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
    grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Prune wiped colonies
    const rSq = radius * radius;
    for (let c = this.colonies.length - 1; c >= 0; c--) {
      const col = this.colonies[c];
      const dx = col.x - centerX;
      const dy = col.y - centerY;
      if (dx * dx + dy * dy < rSq * 0.6) {
        this.colonies.splice(c, 1);
      }
    }

    // Direct canvas modification already executed above; flag texture upload without expensive re-render
    this.textureNeedsUpload = true;
  }

  public clearAll() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.colonies = [];
    this.coverage = 0;
    this.dirty = false;
    this.textureNeedsUpload = true;
  }

  private render() {
    // Render organic micro-flora
    for (const col of this.colonies) {
      this.ctx.save();
      const alpha = col.type === 'chlorophyte' ? 0.72 : col.type === 'diatom' ? 0.65 : 0.58;

      // Render colony core cluster
      const coreGrad = this.ctx.createRadialGradient(col.x, col.y, 1, col.x, col.y, col.radius);
      coreGrad.addColorStop(0, `hsla(${col.hue}, 80%, 45%, ${alpha})`);
      coreGrad.addColorStop(0.6, `hsla(${col.hue}, 70%, 35%, ${alpha * 0.7})`);
      coreGrad.addColorStop(1, `hsla(${col.hue}, 60%, 25%, 0)`);
      this.ctx.fillStyle = coreGrad;
      this.ctx.beginPath();
      this.ctx.arc(col.x, col.y, col.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Render branching filamentous structures
      this.ctx.lineCap = 'round';
      for (const branch of col.branches) {
        this.ctx.strokeStyle = `hsla(${col.hue + (Math.random() - 0.5) * 15}, 75%, ${40 + branch.depth * 5}%, ${alpha * 0.85})`;
        this.ctx.lineWidth = branch.width;
        this.ctx.beginPath();
        const startX = branch.x - Math.cos(branch.angle) * branch.length;
        const startY = branch.y - Math.sin(branch.angle) * branch.length;
        this.ctx.moveTo(startX, startY);
        // Slightly wavy filament
        const midX = (startX + branch.x) * 0.5 + (Math.random() - 0.5) * 2;
        const midY = (startY + branch.y) * 0.5 + (Math.random() - 0.5) * 2;
        this.ctx.quadraticCurveTo(midX, midY, branch.x, branch.y);
        this.ctx.stroke();

        // Tiny diatom or chloroplast dots on tips
        if (branch.depth > 2) {
          this.ctx.fillStyle = `hsla(${col.hue + 20}, 90%, 55%, ${alpha * 0.9})`;
          this.ctx.beginPath();
          this.ctx.arc(branch.x, branch.y, branch.width * 0.8, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
      this.ctx.restore();
    }
  }

  private calculateCoverage() {
    // Fast analytical area estimate - zero GPU readback stalls
    let totalCoverArea = 0;
    for (let i = 0; i < this.colonies.length; i++) {
      const col = this.colonies[i];
      totalCoverArea += col.radius * col.radius * 2.8 + col.branches.length * 28;
    }
    const canvasArea = this.width * this.height;
    this.coverage = Math.min(85, Math.max(0, Math.round((totalCoverArea / (canvasArea * 0.38)) * 100)));
  }
}
