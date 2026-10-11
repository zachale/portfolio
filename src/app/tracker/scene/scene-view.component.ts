import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, NgZone, OnDestroy, effect, input, output, signal, viewChild,
} from "@angular/core";

import type { Atmosphere, Framing, SceneMoment, TrackerScene } from "./tracker-scene";

@Component({
  selector: "tracker-scene-view",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #host class="absolute inset-0" [class.opacity-0]="!ready()"
      style="transition: opacity 900ms ease"></div>
    @if (failed()) {
      <p class="absolute inset-x-0 bottom-1/3 text-center text-sm" style="color: var(--text-3)">
        The 3D view needs WebGL, which this browser has turned off.
      </p>
    }
  `,
  host: { class: "block overflow-hidden" },
})
export class SceneViewComponent implements AfterViewInit, OnDestroy {
  readonly moment = input.required<SceneMoment>();
  readonly framing = input<Framing>({ x: 0.5, y: 0.5 });
  readonly atmosphere = output<Atmosphere>();

  protected readonly ready = signal(false);
  protected readonly failed = signal(false);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>("host");
  private scene: TrackerScene | null = null;
  private destroyed = false;

  constructor(private readonly zone: NgZone) {
    effect(() => {
      const moment = this.moment();
      this.scene?.setMoment(moment);
    });
    effect(() => {
      const framing = this.framing();
      this.scene?.setFraming(framing);
    });
  }

  async ngAfterViewInit(): Promise<void> {
    // three.js lives in its own chunk so the numbers can paint before the scene has loaded.
    const { TrackerScene } = await import("./tracker-scene");
    if (this.destroyed) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      // The render loop runs outside Angular so 60 frames a second don't trigger change detection.
      this.scene = this.zone.runOutsideAngular(() => new TrackerScene(this.host().nativeElement, {
        highDetail: matchMedia("(pointer: fine)").matches,
        reducedMotion,
        onAtmosphere: (a) => this.zone.run(() => this.atmosphere.emit(a)),
      }));
    } catch (error) {
      console.error(error);
      this.failed.set(true);
      return;
    }
    this.scene.setMoment(this.moment());
    this.scene.setFraming(this.framing());
    requestAnimationFrame(() => this.ready.set(true));
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.scene?.dispose();
  }
}
