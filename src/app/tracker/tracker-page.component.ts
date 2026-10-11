import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal,
} from "@angular/core";

import { AdminRequestsComponent } from "./admin/admin-requests.component";
import { HistoryCardComponent } from "./history/history-card.component";
import { LoginPanelComponent } from "./login/login-panel.component";
import { SceneViewComponent } from "./scene/scene-view.component";
import type { Atmosphere, Framing, SceneMoment } from "./scene/tracker-scene";
import {
  Reading, STATUS_META, Telemetry, kmh, relativeTime, siteDateTime, siteTime, statusSince, summarizeDay,
} from "./telemetry";
import { Session, TrackerApi } from "./tracker-api.service";
import { ExtensionGaugeComponent } from "./ui/extension-gauge.component";
import { IconComponent } from "./ui/icon.component";

const REFRESH_MS = 2 * 60 * 1000;
// The tracker uploads about every 15 minutes, so half an hour without one is worth a mention.
const DELAYED_MS = 30 * 60 * 1000;
const OFFLINE_MS = 3 * 60 * 60 * 1000;

@Component({
  selector: "app-tracker-page",
  standalone: true,
  imports: [
    SceneViewComponent, LoginPanelComponent, AdminRequestsComponent, HistoryCardComponent, ExtensionGaugeComponent,
    IconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./tracker-page.component.html",
  host: {
    class: "tracker-root",
    "[style.--horizon]": "atmosphere().horizon",
  },
})
export class TrackerPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(TrackerApi);

  protected readonly session = signal<Session | null | undefined>(undefined);
  protected readonly days = signal(1);
  private readonly cache = signal(new Map<number, Telemetry>());
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly now = signal(Date.now());
  protected readonly hovered = signal<Reading | null>(null);
  protected readonly atmosphere = signal<Atmosphere>({ horizon: "#0b1424", night: 1 });
  protected readonly menuOpen = signal(false);
  private readonly wideQuery = matchMedia("(min-width: 1024px)");
  private readonly wide = signal(this.wideQuery.matches);
  private readonly onWideChange = (event: MediaQueryListEvent) => this.wide.set(event.matches);

  /** Keep the tracker clear of the sign-in card, and between the numbers on the dashboard. */
  protected readonly loginFraming = computed<Framing>(() => (this.wide() ? { x: 0.68, y: 0.52 } : { x: 0.5, y: 0.3 }));
  protected readonly dashboardFraming: Framing = { x: 0.5, y: 0.57 };

  protected readonly statusMeta = STATUS_META;
  protected readonly kmh = kmh;
  protected readonly year = new Date().getFullYear();

  protected readonly telemetry = computed(() => this.cache().get(this.days()) ?? null);
  protected readonly readings = computed(() => this.telemetry()?.readings ?? []);
  protected readonly latest = computed(() => this.readings().at(-1) ?? null);
  /** What the hero shows: the moment being replayed from the chart, or the latest reading. */
  protected readonly shown = computed(() => this.hovered() ?? this.latest());
  protected readonly today = computed(() => summarizeDay(this.readings(), this.now()));
  protected readonly since = computed(() => {
    const since = statusSince(this.readings());
    return since === null ? null : siteTime.format(since);
  });
  protected readonly replayLabel = computed(() => {
    const hovered = this.hovered();
    return hovered ? siteDateTime.format(hovered.t) : null;
  });

  protected readonly moment = computed<SceneMoment>(() => {
    const shown = this.shown();
    const replaying = this.hovered() !== null;
    return {
      time: new Date(replaying && shown ? shown.t : this.now()),
      percent: shown?.percent ?? 62,
      windMs: shown?.windSensor ? shown.windMs : 1.2,
      status: shown?.status ?? null,
    };
  });

  protected readonly freshness = computed(() => {
    const last = this.telemetry()?.lastUploadAt ?? this.latest()?.t ?? null;
    if (last === null) return null;
    const age = this.now() - last;
    const tone = age < DELAYED_MS ? "fresh" : age < OFFLINE_MS ? "delayed" : "offline";
    const label = tone === "offline" ? `Offline · last report ${relativeTime(last, this.now())}` : `Updated ${relativeTime(last, this.now())}`;
    return { tone, label };
  });

  private clockTimer = 0;
  private refreshTimer = 0;
  private previousBackground = "";
  private hadMaterialTypography = false;

  async ngOnInit(): Promise<void> {
    // The page is dark edge to edge, including the overscroll area behind it, and sets its own type.
    this.previousBackground = document.body.style.background;
    document.documentElement.style.background = document.body.style.background = "#0a0f14";
    this.hadMaterialTypography = document.body.classList.contains("mat-typography");
    document.body.classList.remove("mat-typography");
    this.wideQuery.addEventListener("change", this.onWideChange);
    this.clockTimer = window.setInterval(() => this.now.set(Date.now()), 30_000);
    this.refreshTimer = window.setInterval(() => {
      if (this.session() && document.visibilityState === "visible") this.load(this.days(), true);
    }, REFRESH_MS);
    try {
      this.session.set(await this.api.session());
    } catch {
      this.session.set(null);
    }
    if (this.session()) this.load(this.days());
  }

  ngOnDestroy(): void {
    document.documentElement.style.background = document.body.style.background = this.previousBackground;
    if (this.hadMaterialTypography) document.body.classList.add("mat-typography");
    this.wideQuery.removeEventListener("change", this.onWideChange);
    clearInterval(this.clockTimer);
    clearInterval(this.refreshTimer);
  }

  protected onSignedIn(session: Session): void {
    this.session.set(session);
    this.load(this.days());
  }

  protected async signOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.api.logout().catch(() => undefined);
    this.cache.set(new Map());
    this.session.set(null);
  }

  protected selectDays(days: number): void {
    this.days.set(days);
    this.hovered.set(null);
    this.load(days, this.cache().has(days));
  }

  protected retry(): void {
    this.load(this.days());
  }

  private async load(days: number, quietly = false): Promise<void> {
    if (!quietly) this.loading.set(true);
    this.failed.set(false);
    try {
      const telemetry = await this.api.telemetry(days);
      this.cache.update((cache) => new Map(cache).set(days, telemetry));
      this.now.set(Date.now());
    } catch (error) {
      if ((error as { status?: number }).status === 401) {
        this.session.set(null);
      } else if (!this.cache().has(days)) {
        this.failed.set(true);
      }
    } finally {
      if (days === this.days()) this.loading.set(false);
    }
  }
}
