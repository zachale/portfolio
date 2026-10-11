import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChild,
} from "@angular/core";

import { AdminRequestsComponent } from "./admin/admin-requests.component";
import { HistoryCardComponent } from "./history/history-card.component";
import { LoginPanelComponent } from "./login/login-panel.component";
import { SceneViewComponent } from "./scene/scene-view.component";
import { DASHBOARD_FRAMING, Framing, LOGIN_FRAMING_NARROW, LOGIN_FRAMING_WIDE } from "./scene/framing";
import type { Atmosphere, SceneMoment } from "./scene/tracker-scene";
import {
  STATUS_META, Telemetry, kmh, relativeTime, siteTime, statusSince, summarizeDay,
} from "./telemetry";
import { Session, TrackerApi } from "./tracker-api.service";
import { ExtensionGaugeComponent } from "./ui/extension-gauge.component";
import { IconComponent } from "./ui/icon.component";

const REFRESH_MS = 2 * 60 * 1000;
const fetchDays = (hours: number) => Math.max(1, Math.ceil(hours / 24));
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
    "(document:keydown.escape)": "menuOpen.set(false)",
    "(document:click)": "closeMenuOutside($event)",
  },
})
export class TrackerPageComponent implements OnInit, OnDestroy {
  private readonly api = inject(TrackerApi);

  protected readonly session = signal<Session | null | undefined>(undefined);
  /** The history range; one hour by default. */
  protected readonly hours = signal(1);
  private readonly cache = signal(new Map<number, Telemetry>());
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly now = signal(Date.now());
  protected readonly atmosphere = signal<Atmosphere>({ horizon: "#283d68", night: 1 });
  protected readonly menuOpen = signal(false);
  private readonly accountMenu = viewChild<ElementRef<HTMLElement>>("accountMenu");
  private readonly wideQuery = matchMedia("(min-width: 1024px)");
  private readonly wide = signal(this.wideQuery.matches);
  private readonly onWideChange = (event: MediaQueryListEvent) => this.wide.set(event.matches);

  /** Keep the tracker clear of the sign-in card, and between the numbers on the dashboard. */
  protected readonly loginFraming = computed<Framing>(() => (this.wide() ? LOGIN_FRAMING_WIDE : LOGIN_FRAMING_NARROW));
  protected readonly dashboardFraming = DASHBOARD_FRAMING;

  protected readonly statusMeta = STATUS_META;
  protected readonly kmh = kmh;

  protected readonly telemetry = computed(() => this.cache().get(fetchDays(this.hours())) ?? null);
  protected readonly readings = computed(() => this.telemetry()?.readings ?? []);
  /** The fetch covers whole days (that is what the API serves); the chart shows just the range. */
  protected readonly rangeReadings = computed(() => {
    const since = this.now() - this.hours() * 3_600_000;
    return this.readings().filter((r) => r.t >= since);
  });
  protected readonly latest = computed(() => this.readings().at(-1) ?? null);
  protected readonly today = computed(() => summarizeDay(this.readings(), this.now()));
  protected readonly since = computed(() => {
    const since = statusSince(this.readings());
    return since === null ? null : siteTime.format(since);
  });

  protected readonly moment = computed<SceneMoment>(() => {
    const latest = this.latest();
    return {
      time: new Date(this.now()),
      percent: latest?.percent ?? 62,
      windMs: latest?.windSensor ? latest.windMs : 1.2,
      status: latest?.status ?? null,
    };
  });

  protected readonly freshness = computed(() => {
    const last = this.telemetry()?.lastUploadAt ?? this.latest()?.t ?? null;
    if (last === null) return null;
    const age = this.now() - last;
    const tone = age < DELAYED_MS ? "fresh" : age < OFFLINE_MS ? "delayed" : "offline";
    const ago = relativeTime(last, this.now());
    const label = tone === "fresh" ? `Updated ${ago}` : tone === "delayed" ? `Delayed · ${ago}` : `Offline · ${ago}`;
    return { tone, label };
  });

  private clockTimer = 0;
  private refreshTimer = 0;
  private previousBackground = "";
  private hadMaterialTypography = false;

  async ngOnInit(): Promise<void> {
    // The page is dark edge to edge, including the overscroll area behind it, and sets its own type.
    this.previousBackground = document.body.style.background;
    document.documentElement.style.background = document.body.style.background = "#0f172a";
    this.hadMaterialTypography = document.body.classList.contains("mat-typography");
    document.body.classList.remove("mat-typography");
    this.wideQuery.addEventListener("change", this.onWideChange);
    this.clockTimer = window.setInterval(() => this.now.set(Date.now()), 30_000);
    this.refreshTimer = window.setInterval(() => {
      if (this.session() && document.visibilityState === "visible") this.load(fetchDays(this.hours()), true);
    }, REFRESH_MS);
    try {
      this.session.set(await this.api.session());
    } catch {
      this.session.set(null);
    }
    if (this.session()) this.load(fetchDays(this.hours()));
  }

  ngOnDestroy(): void {
    document.documentElement.style.background = document.body.style.background = this.previousBackground;
    if (this.hadMaterialTypography) document.body.classList.add("mat-typography");
    this.wideQuery.removeEventListener("change", this.onWideChange);
    clearInterval(this.clockTimer);
    clearInterval(this.refreshTimer);
  }

  protected closeMenuOutside(event: MouseEvent): void {
    if (this.menuOpen() && !this.accountMenu()?.nativeElement.contains(event.target as Node)) this.menuOpen.set(false);
  }

  protected onSignedIn(session: Session): void {
    this.session.set(session);
    this.load(fetchDays(this.hours()));
  }

  protected async signOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.api.logout().catch(() => undefined);
    this.cache.set(new Map());
    this.session.set(null);
  }

  protected selectHours(hours: number): void {
    this.hours.set(hours);
    const days = fetchDays(hours);
    this.load(days, this.cache().has(days));
  }

  protected retry(): void {
    this.load(fetchDays(this.hours()));
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
      if (days === fetchDays(this.hours())) this.loading.set(false);
    }
  }
}
