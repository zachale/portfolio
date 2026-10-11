import { ChangeDetectionStrategy, Component, input } from "@angular/core";

export type IconName =
  | "sun" | "moon" | "wind" | "pause" | "thermometer" | "sunrise" | "arrows" | "expand" | "close" | "bell"
  | "clock" | "message" | "copy" | "table" | "chart" | "logout" | "refresh";

// Stroke icons drawn on a 24-unit grid; they inherit currentColor.
const PATHS: Record<IconName, string> = {
  sun: "M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z",
  wind: "M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h7",
  pause: "M9 5v14M15 5v14",
  thermometer: "M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z",
  sunrise: "M12 3v5M5.6 9.6 4.2 8.2M19.8 8.2l-1.4 1.4M2 16h20M7 16a5 5 0 0 1 10 0M5 20h14",
  arrows: "M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4",
  expand: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7",
  close: "M6 6l12 12M18 6 6 18",
  bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6.5 2 6.5H4S6 14 6 9ZM10 19.5a2 2 0 0 0 4 0",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  message: "M4 5h16v11H8l-4 4V5Z",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  table: "M3 5h18v14H3zM3 10h18M3 15h18M9 5v14",
  chart: "M3 3v18h18M7 15l4-5 3 3 5-7",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11",
  refresh: "M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7",
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
