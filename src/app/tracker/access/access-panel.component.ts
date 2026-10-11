import { ChangeDetectionStrategy, Component, input } from "@angular/core";

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
      @if (linkFailed()) {
        <p class="mt-4 text-[15px] font-medium leading-relaxed" style="color: var(--danger-text)" role="alert">
          That link doesn't work any more.
        </p>
        <p class="mt-1 text-[15px] leading-relaxed text-2">Ask Zach for a new one.</p>
      } @else {
        <p class="mt-4 text-[15px] leading-relaxed text-2">
          Ask Zach for your personal link. Open it once on any phone or computer and that device stays signed in.
        </p>
      }
    </div>
  `,
  host: { class: "block" },
})
export class AccessPanelComponent {
  /** The device arrived with a link, but the link was not valid. */
  readonly linkFailed = input(false);
}
