import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";

import { IconComponent, IconName } from "./icon.component";

export type TrackerTab = "home" | "graphs" | "profile";

const TABS: { id: TrackerTab; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "graphs", label: "Graphs", icon: "chart" },
  { id: "profile", label: "Profile", icon: "user" },
];

/** The phone's navigation: a floating glass bar at the bottom, with a lens that slides to the current tab. */
@Component({
  selector: "tracker-tab-bar",
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="tab-bar" aria-label="Sections" [style.--tab-index]="index()">
      <span class="tab-lens" aria-hidden="true"></span>
      @for (tab of tabs; track tab.id) {
        <button type="button" class="tab-item" [attr.aria-current]="tab.id === current() ? 'page' : null"
          (click)="select.emit(tab.id)">
          <tracker-icon [name]="tab.icon" [size]="22" />
          <span>{{ tab.label }}</span>
        </button>
      }
    </nav>
  `,
  host: { class: "contents" },
})
export class TabBarComponent {
  readonly current = input.required<TrackerTab>();
  readonly select = output<TrackerTab>();
  protected readonly tabs = TABS;
  protected readonly index = computed(() => TABS.findIndex((tab) => tab.id === this.current()));
}
