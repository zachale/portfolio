import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";

/** Panel extension as a row of segments, with a tick where the array lies flat (50%). */
@Component({
  selector: "tracker-extension-gauge",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative flex h-6 items-stretch gap-[3px]" role="meter" aria-label="Panel extension"
      aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent()">
      @for (lit of segments(); track $index) {
        <span class="flex-1 rounded-full transition-colors duration-700"
          [style.background]="lit ? 'var(--accent)' : 'rgba(255,255,255,0.14)'"
          [style.opacity]="lit ? 0.45 + ($index / segments().length) * 0.55 : 1"></span>
      }
      <span class="pointer-events-none absolute -bottom-2 left-1/2 h-1.5 w-px bg-white/50"></span>
    </div>
    <div class="mt-2.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em]" style="color: var(--text-3)">
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
