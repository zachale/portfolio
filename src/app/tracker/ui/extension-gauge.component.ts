import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

/** Panel extension as a row of segments, with a tick where the array lies flat (50%). */
@Component({
  selector: "tracker-extension-gauge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex h-5 items-stretch gap-[3px]" role="meter" aria-label="Panel extension"
      aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent()">
      @for (lit of segments(); track $index) {
        <span class="flex-1 rounded-full transition-[background-color,opacity] duration-500"
          [style.background]="lit ? 'var(--accent)' : 'rgba(226,232,240,0.22)'"
          [style.opacity]="lit ? 0.55 + ($index / segments().length) * 0.45 : 1"></span>
      }
      <span class="pointer-events-none absolute -bottom-2 left-1/2 h-1.5 w-0.5 -translate-x-1/2 rounded-full bg-white/80"></span>
    </div>
    <div class="mt-3 flex justify-between text-[12px] font-semibold uppercase tracking-[0.06em]" style="color: var(--on-scene-2)">
      <span>East</span><span>Flat</span><span>West</span>
    </div>
  `,
  host: { class: "block" },
})
export class ExtensionGaugeComponent {
  readonly percent = input.required<number>();
  protected readonly segments = computed(() => {
    const lit = Math.round((this.percent() / 100) * 16);
    return Array.from({ length: 16 }, (_, i) => i < lit);
  });
}
