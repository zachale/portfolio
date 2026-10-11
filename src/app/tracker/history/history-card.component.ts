import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild,
} from "@angular/core";

import { Reading, STATUS_META, kmh, siteDateTime } from "../telemetry";
import { IconComponent } from "../ui/icon.component";
import { HistoryChartComponent } from "./history-chart.component";

export const RANGES = [
  { days: 1, label: "24H" },
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 60, label: "60D" },
] as const;

const TABLE_LIMIT = 400;

@Component({
  selector: "tracker-history-card",
  standalone: true,
  imports: [HistoryChartComponent, IconComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./history-card.component.html",
  host: { class: "block" },
})
export class HistoryCardComponent {
  readonly readings = input.required<Reading[]>();
  readonly days = input.required<number>();
  readonly loading = input(false);
  readonly daysChange = output<number>();

  protected readonly ranges = RANGES;
  protected readonly statusMeta = STATUS_META;
  protected readonly kmh = kmh;
  protected readonly format = (t: number) => siteDateTime.format(t);
  protected readonly view = signal<"chart" | "table">("chart");
  protected readonly expanded = signal(false);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>("dialog");

  /** Newest first, capped: a table of 17,000 rows helps nobody. */
  protected readonly tableRows = computed(() => this.readings().slice(-TABLE_LIMIT).reverse());
  protected readonly tableLimit = TABLE_LIMIT;

  protected open(): void {
    this.expanded.set(true);
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }

  protected onClosed(): void {
    this.expanded.set(false);
    this.view.set("chart");
  }

  protected onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.close();
  }
}
