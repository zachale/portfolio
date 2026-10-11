import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

/** Why a personal link didn't sign the device in: the API refused it, or couldn't be reached. */
export type LinkProblem = "dead" | "unreachable";

/**
 * What a device without a session sees. There is no sign-in form: Zach sends each person a
 * personal link, and opening it signs in that device for good.
 */
@Component({
  selector: "tracker-access-panel",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card p-6 sm:p-8" style="background: rgba(27, 35, 54, 0.92)">
      <p class="eyebrow">Private dashboard</p>
      <h1 class="stat mt-3 text-[32px] leading-[1.1] tracking-[-0.025em] sm:text-[40px]">The lakeside<br />solar tracker</h1>
      @switch (problem()) {
        @case ("dead") {
          <p class="mt-4 text-[15px] font-medium leading-relaxed" style="color: var(--danger-text)" role="alert">
            That link doesn't work any more.
          </p>
          <p class="mt-1 text-[15px] leading-relaxed text-2">Ask Zach for a new one.</p>
        }
        @case ("unreachable") {
          <p class="mt-4 text-[15px] font-medium leading-relaxed" role="alert">Couldn't reach the tracker.</p>
          <p class="mt-1 text-[15px] leading-relaxed text-2">Check your connection and try again.</p>
          <button type="button" class="btn-secondary mt-4 w-full" (click)="retry.emit()">Try again</button>
        }
        @default {
          <p class="mt-4 text-[15px] leading-relaxed text-2">
            Ask Zach for your personal link. Open it once on any phone or computer and that device stays signed in.
          </p>
        }
      }
    </div>
  `,
  host: { class: "block" },
})
export class AccessPanelComponent {
  readonly problem = input<LinkProblem | null>(null);
  readonly retry = output<void>();
}
