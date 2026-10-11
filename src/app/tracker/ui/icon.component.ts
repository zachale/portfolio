import { ChangeDetectionStrategy, Component, input } from "@angular/core";

export type IconName =
  | "sun" | "moon" | "wind" | "pause" | "thermometer" | "expand" | "close" | "table" | "chart" | "logout"
  | "refresh" | "home" | "user";

// Stroke icons drawn on a 24-unit grid; they inherit currentColor.
const PATHS: Record<IconName, string> = {
  sun: "M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z",
  wind: "M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7",
  pause: "M9 5v14M15 5v14",
  thermometer: "M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  close: "M6 6l12 12M18 6 6 18",
  table: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14",
  chart: "M3 3v18h18M7 15l4-5 3 3 5-7",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
  home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5",
};

@Component({
  selector: "tracker-icon",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" fill="none" stroke="currentColor"
    stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path()" /></svg>`,
  host: { class: "inline-flex shrink-0" },
})
export class IconComponent {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  protected path = () => PATHS[this.name()];
}
