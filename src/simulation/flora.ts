/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FloraColony {
  x: number;
  y: number;
  radius: number;
  filaments: { x: number; y: number; angle: number; length: number; width: number; depth: number }[];
  stipples: { dx: number; dy: number; r: number; alpha: number }[];
  type: 'chlorophyte' | 'diatom' | 'bryophyte';
  hue: number;
  growthRate: number;
}

/**
 * Procedural Glass Micro-Flora Simulation.
 * Models realistic, ultra-fine microscopic biofilm and diatom patina on aquarium glass.
 * - Crystal-clear clean glass by default (0% initial obstruction).
 * - Organic, non-spherical patina: zero spherical bases or clumping balls.
 * - Low-profile growth hugging gravel boundaries and subtle bottom corners.
 * - Gentle diatom patina veils and micro-capillary filaments with authentic transparency.
 */
export class ProceduralFloraSimulation {
  public width: number;
  public height: number;
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public coverage: number = 0; // Starts crystal clear at 0%
  public growthSpeed: number = 0.5;
  public isAutoCleaning: boolean = false;

  private colonies: FloraColony[] = [];
  private lastUpdate: number = performance.now();
  private lastGrowthTime: number = performance.now();
  private lastTextureUploadTime: number = 0;
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
    this.coverage = 0;
    this.dirty = false;
    this.textureNeedsUpload = true;
  }

  /**
   * Spawns a soft microscopic patina colony hugging the lower substrate line
   */
  private spawnBiofilmColony(targetX?: number, targetY?: number) {
    // Confine natural glass patina to the bottom gravel line (y > 85%) and lower corners
    const isCorner = Math.random() < 0.35;
    const x = targetX !== undefined
      ? targetX
      : isCorner
      ? (Math.random() < 0.5 ? Math.random() * 0.12 : (0.88 + Math.random() * 0.12)) * this.width
      : (0.05 + Math.random() * 0.9) * this.width;

    const y = targetY !== undefined
      ? targetY
      : (0.86 + Math.random() * 0.12) * this.height;

    const types: ('chlorophyte' | 'diatom' | 'bryophyte')[] = ['diatom', 'diatom', 'chlorophyte'];
    const type = types[Math.floor(Math.random() * types.length)];
    // Diatoms: golden-amber/olive 42-65 deg; Chlorophyte: soft pale green 105-135 deg
    const hue = type === 'diatom' ? 44 + Math.random() * 20 : 118 + Math.random() * 22;

    const colony: FloraColony = {
      x,
      y,
      radius: 8 + Math.random() * 14,
      filaments: [],
      stipples: [],
      type,
      hue,
      growthRate: 0.4 + Math.random() * 0.5,
    };

    // Generate soft, organic micro-stipples (no spherical solid discs)
    const stippleCount = 14 + Math.floor(Math.random() * 16);
    for (let s = 0; s < stippleCount; s++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.7) * colony.radius;
      colony.stipples.push({
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * (dist * 0.45), // flattened horizontally along gravel line
        r: 0.6 + Math.random() * 1.4,
        alpha: 0.12 + Math.random() * 0.22,
      });
    }

    // A few delicate, hair-thin upward micro-filaments (sub-pixel thickness, no base sphere)
    const filCount = 2 + Math.floor(Math.random() * 3);
    for (let f = 0; f < filCount; f++) {
      // Upward pointing angle (-PI/2 is straight up)
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 0.6;
      this.addMicroFilament(colony, x + (Math.random() - 0.5) * 6, y, angle, 6 + Math.random() * 8, 0.75, 0);
    }

    this.colonies.push(colony);
    this.dirty = true;
  }

  private addMicroFilament(
    colony: FloraColony,
    x: number,
    y: number,
    angle: number,
    length: number,
    width: number,
    depth: number
  ) {
    if (depth > 2 || width < 0.3) return;

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    colony.filaments.push({
      x: endX,
      y: endY,
      angle,
      length,
      width,
      depth,
    });

    if (depth < 2 && Math.random() < 0.6) {
      const spread = (Math.random() - 0.5) * 0.7;
      this.addMicroFilament(colony, endX, endY, angle + spread, length * 0.7, width * 0.65, depth + 1);
    }
  }

  public update(dt: number): boolean {
    const now = performance.now();
    const elapsed = Math.min((now - this.lastUpdate) / 1000, 0.1);
    this.lastUpdate = now;

    // Auto-cleaning snails
    if (this.isAutoCleaning) {
      this.cleanRadius(
        (0.15 + 0.7 * (0.5 + 0.5 * Math.sin(now * 0.0004))) * this.width,
        (0.85 + 0.12 * Math.cos(now * 0.0006)) * this.height,
        36
      );
    }

    // Micro-flora development: very slow and gradual, keeping glass mostly pristine
    const nowMs = performance.now();
    if (this.growthSpeed > 0 && nowMs - this.lastGrowthTime > 3500) {
      this.lastGrowthTime = nowMs;

      // Maximum 12 subtle colonies along the gravel border
      if (this.colonies.length < 12 && Math.random() < 0.2 * this.growthSpeed) {
        this.spawnBiofilmColony();
      }

      // Very subtle organic spread of existing stipples
      for (const col of this.colonies) {
        if (col.stipples.length < 35 && Math.random() < 0.3) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.pow(Math.random(), 0.6) * (col.radius * 1.1);
          col.stipples.push({
            dx: Math.cos(angle) * dist,
            dy: Math.sin(angle) * (dist * 0.45),
            r: 0.5 + Math.random() * 1.2,
            alpha: 0.08 + Math.random() * 0.16,
          });
          this.dirty = true;
        }
      }
    }

    if (this.dirty) {
      this.render();
      this.dirty = false;
      this.textureNeedsUpload = true;
      this.calculateCoverage();
    }

    // Throttle GPU texture upload to max 10Hz to prevent pipeline stalls
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
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.85)');
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
      if (dx * dx + dy * dy < rSq * 0.75) {
        this.colonies.splice(c, 1);
      }
    }

    this.calculateCoverage();
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
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (const col of this.colonies) {
      this.ctx.save();

      // 1. Soft, non-spherical diatom/chlorophyte patina stippling
      for (const stipple of col.stipples) {
        const sx = col.x + stipple.dx;
        const sy = col.y + stipple.dy;
        if (sx < 0 || sx >= this.width || sy < 0 || sy >= this.height) continue;

        this.ctx.fillStyle = `hsla(${col.hue}, 55%, 38%, ${stipple.alpha})`;
        this.ctx.beginPath();
        // Tiny microscopic ellipses/dots (no large circular discs or spheres)
        this.ctx.ellipse(sx, sy, stipple.r * 1.4, stipple.r * 0.8, 0.15, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // 2. Microscopic capillary filaments (ultra-fine hairlines, no spherical base)
      this.ctx.lineCap = 'round';
      for (const fil of col.filaments) {
        this.ctx.strokeStyle = `hsla(${col.hue + 8}, 48%, 32%, ${0.28 - fil.depth * 0.06})`;
        this.ctx.lineWidth = fil.width;
        this.ctx.beginPath();

        const startX = fil.x - Math.cos(fil.angle) * fil.length;
        const startY = fil.y - Math.sin(fil.angle) * fil.length;
        this.ctx.moveTo(startX, startY);

        const midX = (startX + fil.x) * 0.5 + (Math.sin(fil.x * 0.2) * 1.2);
        const midY = (startY + fil.y) * 0.5;
        this.ctx.quadraticCurveTo(midX, midY, fil.x, fil.y);
        this.ctx.stroke();
      }

      this.ctx.restore();
    }
  }

  private calculateCoverage() {
    if (this.colonies.length === 0) {
      this.coverage = 0;
      return;
    }
    let totalCoverArea = 0;
    for (let i = 0; i < this.colonies.length; i++) {
      const col = this.colonies[i];
      totalCoverArea += col.stipples.length * 9 + col.filaments.length * 6;
    }
    const canvasArea = this.width * this.height;
    this.coverage = Math.min(30, Math.max(0, Math.round((totalCoverArea / (canvasArea * 0.25)) * 100)));
  }
}
