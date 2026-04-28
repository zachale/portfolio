import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from "@angular/core";

type Tier = "m" | "s" | "xs";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tier: Tier;
  r: number;
  color: string;
  history: number[];
}

const TRAIL_LEN = 18;
const BG_RGB: [number, number, number] = [244, 245, 255];

function blend(alpha: number): string {
  const r = Math.round(BG_RGB[0] * (1 - alpha));
  const g = Math.round(BG_RGB[1] * (1 - alpha));
  const b = Math.round(BG_RGB[2] * (1 - alpha));
  return `rgb(${r},${g},${b})`;
}

const TIER_RADIUS: Record<Tier, number> = { m: 6, s: 4, xs: 2.5 };
const TIER_ALPHA: Record<Tier, number> = { m: 0.1, s: 0.07, xs: 0.05 };
const TIER_SPEED_MULT: Record<Tier, number> = { m: 1.0, s: 0.6, xs: 0.35 };
const TIER_COUNT: Record<Tier, number> = { m: 8, s: 16, xs: 28 };
const BASE_SPEED = 40;

const RANGE_REM = 8;
const WARP_RANGE_MULT = 1.5;
const G = 500000;
const MIN_DIST = 24;
const MAX_ACC = 2000;
const TETHER_ALPHA = 0.18;

@Component({
  selector: "app-background-teardrops",
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [
    `
      :host {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }
      canvas {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class BackgroundTeardropsComponent implements AfterViewInit, OnDestroy {
  @ViewChild("canvas", { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private ctx!: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private rafId = 0;
  private lastTs = 0;

  private cssW = 0;
  private cssH = 0;
  private dpr = 1;
  private rangePx = 64;

  private mouseX = -9999;
  private mouseY = -9999;
  private mouseSeen = false;

  private reducedMotion = false;

  private onResize = () => this.resize();
  private onPointerMove = (e: PointerEvent) => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    this.mouseSeen = true;
  };

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    this.ctx = ctx;

    this.reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    this.resize();
    this.seed();

    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointermove", this.onPointerMove);

    this.zone.runOutsideAngular(() => {
      if (this.reducedMotion) {
        this.draw();
      } else {
        this.lastTs = performance.now();
        this.rafId = requestAnimationFrame(this.tick);
      }
    });
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointermove", this.onPointerMove);
  }

  private resize() {
    const canvas = this.canvasRef.nativeElement;
    this.cssW = window.innerWidth;
    this.cssH = window.innerHeight;
    this.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(this.cssW * this.dpr);
    canvas.height = Math.floor(this.cssH * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const fontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    this.rangePx = (isFinite(fontSize) ? fontSize : 16) * RANGE_REM;
  }

  private seed() {
    this.particles = [];
    (Object.keys(TIER_COUNT) as Tier[]).forEach((tier) => {
      for (let i = 0; i < TIER_COUNT[tier]; i++) {
        this.particles.push(this.spawn(tier, true));
      }
    });
  }

  private spawn(tier: Tier, anywhere = false): Particle {
    const r = TIER_RADIUS[tier];
    const speed = BASE_SPEED * TIER_SPEED_MULT[tier] * (0.7 + Math.random() * 0.6);
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    let x: number;
    let y: number;
    if (anywhere) {
      x = Math.random() * this.cssW;
      y = Math.random() * this.cssH;
    } else {
      const edge = Math.floor(Math.random() * 4);
      const pad = r + 20;
      if (edge === 0) {
        x = Math.random() * this.cssW;
        y = -pad;
      } else if (edge === 1) {
        x = this.cssW + pad;
        y = Math.random() * this.cssH;
      } else if (edge === 2) {
        x = Math.random() * this.cssW;
        y = this.cssH + pad;
      } else {
        x = -pad;
        y = Math.random() * this.cssH;
      }
    }

    return { x, y, vx, vy, tier, r, color: blend(TIER_ALPHA[tier]), history: [] };
  }

  private tick = (ts: number) => {
    const dt = Math.min((ts - this.lastTs) / 1000, 1 / 30);
    this.lastTs = ts;
    this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private update(dt: number) {
    const warpRange = this.rangePx * WARP_RANGE_MULT;

    for (const p of this.particles) {
      if (this.mouseSeen) {
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < warpRange && dist > 0) {
          const d = Math.max(dist, MIN_DIST);
          let a = G / (d * d);
          if (a > MAX_ACC) a = MAX_ACC;
          p.vx += (dx / dist) * a * dt;
          p.vy += (dy / dist) * a * dt;
        }
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      p.history.push(p.x, p.y);
      if (p.history.length > TRAIL_LEN * 2) {
        p.history.splice(0, p.history.length - TRAIL_LEN * 2);
      }

      const margin = p.r * 2 + 20;
      if (
        p.x < -margin ||
        p.x > this.cssW + margin ||
        p.y < -margin ||
        p.y > this.cssH + margin
      ) {
        Object.assign(p, this.spawn(p.tier));
      }
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cssW, this.cssH);

    for (const p of this.particles) {
      const h = p.history;
      const n = h.length / 2;
      ctx.fillStyle = p.color;

      if (n < 3) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const left: number[] = [];
        const right: number[] = [];
        for (let i = 0; i < n; i++) {
          const x = h[i * 2];
          const y = h[i * 2 + 1];
          const ai = Math.max(0, i - 1);
          const bi = Math.min(n - 1, i + 1);
          let tx = h[bi * 2] - h[ai * 2];
          let ty = h[bi * 2 + 1] - h[ai * 2 + 1];
          const tl = Math.hypot(tx, ty) || 1;
          tx /= tl;
          ty /= tl;
          const t = i / (n - 1);
          const w = p.r * Math.pow(t, 0.5);
          const px = -ty * w;
          const py = tx * w;
          left.push(x + px, y + py);
          right.push(x - px, y - py);
        }

        ctx.beginPath();
        ctx.moveTo(left[0], left[1]);
        for (let i = 1; i < n; i++) {
          ctx.lineTo(left[i * 2], left[i * 2 + 1]);
        }
        const headX = h[(n - 1) * 2];
        const headY = h[(n - 1) * 2 + 1];
        const lastTx = headX - h[(n - 2) * 2];
        const lastTy = headY - h[(n - 2) * 2 + 1];
        const ltl = Math.hypot(lastTx, lastTy) || 1;
        const fx = lastTx / ltl;
        const fy = lastTy / ltl;
        ctx.quadraticCurveTo(
          headX + fx * p.r,
          headY + fy * p.r,
          right[(n - 1) * 2],
          right[(n - 1) * 2 + 1],
        );
        for (let i = n - 2; i >= 0; i--) {
          ctx.lineTo(right[i * 2], right[i * 2 + 1]);
        }
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(headX, headY, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (this.mouseSeen) {
        const dx = this.mouseX - p.x;
        const dy = this.mouseY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < this.rangePx) {
          const a = (1 - dist / this.rangePx) * TETHER_ALPHA;
          ctx.strokeStyle = blend(a);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(this.mouseX, this.mouseY);
          ctx.stroke();
        }
      }
    }
  }
}
