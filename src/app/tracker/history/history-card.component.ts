import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy, Component, ElementRef, computed, input, output, signal, viewChild,
} from "@angular/core";

import { Reading, STATUS_META, kmh, siteDateTime } from "../telemetry";
import { IconComponent } from "../ui/icon.component";
import { HistoryChartComponent } from "./history-chart.component";

export const RANGES = [
  { hours: 1, label: "1H" },
  { hours: 24, label: "24H" },
  { hours: 24 * 7, label: "7D" },
  { hours: 24 * 30, label: "30D" },
] as const;
// The card keeps to the short ranges; the expanded view offers all of them.
const CARD_RANGES = RANGES.slice(0, 3);

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
  readonly hours = input.required<number>();
  readonly loading = input(false);
  readonly hoursChange = output<number>();

  protected readonly ranges = RANGES;
  /** The card's ranges, plus a longer one picked in the expanded view so it still shows as selected. */
  protected readonly cardRanges = computed(() =>
    CARD_RANGES.some((r) => r.hours === this.hours()) ? CARD_RANGES : RANGES.filter((r) => CARD_RANGES.includes(r) || r.hours === this.hours()),
  );
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
