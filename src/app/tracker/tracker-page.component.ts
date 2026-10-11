import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChild,
} from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter, map } from "rxjs";

import { AccessPanelComponent, LinkProblem } from "./access/access-panel.component";
import { HistoryCardComponent } from "./history/history-card.component";
import { SceneViewComponent } from "./scene/scene-view.component";
import { DASHBOARD_FRAMING, Framing, LOGIN_FRAMING_NARROW, LOGIN_FRAMING_WIDE } from "./scene/framing";
import type { Atmosphere, SceneMoment } from "./scene/tracker-scene";
import {
  STATUS_META, Telemetry, kmh, relativeTime, siteTime, statusSince, summarizeDay,
} from "./telemetry";
import { ApiError, Session, TrackerApi } from "./tracker-api.service";
import { captureLinkKey, takeLinkKey } from "./link-key";
import { ExtensionGaugeComponent } from "./ui/extension-gauge.component";
import { IconComponent } from "./ui/icon.component";
import { TabBarComponent, TrackerTab } from "./ui/tab-bar.component";

const REFRESH_MS = 2 * 60 * 1000;
// Only this page uses it, so it is loaded here rather than on every page of the portfolio.
const FONT_URL = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400..800&display=swap";
const fetchDays = (hours: number) => Math.max(1, Math.ceil(hours / 24));
// The tracker uploads about every 15 minutes, so half an hour without one is worth a mention.
const DELAYED_MS = 30 * 60 * 1000;
const OFFLINE_MS = 3 * 60 * 60 * 1000;

@Component({
  selector: "app-tracker-page",
  standalone: true,
  imports: [
    SceneViewComponent, AccessPanelComponent, HistoryCardComponent, ExtensionGaugeComponent, IconComponent,
    TabBarComponent,
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
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly session = signal<Session | null | undefined>(undefined);
  /** Why the last personal link didn't sign this device in, if it didn't. */
  protected readonly linkProblem = signal<LinkProblem | null>(null);
  /** A key whose exchange failed for want of a connection, kept so Retry needs no new link. */
  private unsentKey: string | null = null;
  /**
   * The phone's current section, kept in the URL (?view=graphs) so the back button and a reload
   * behave. On desktop every section is on screen at once and this is ignored.
   */
  protected readonly tab = toSignal(
    this.route.queryParamMap.pipe(map((params) => parseTab(params.get("view")))),
    { initialValue: parseTab(new URLSearchParams(location.search).get("view")) },
  );
  /** The history range; the last day by default. */
  protected readonly hours = signal(24);
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
  /**
   * The history window ends at the newest reading the tracker has synced, not at the clock: it
   * uploads in batches, so "the last hour" counted back from now would often be half empty.
   */
  protected readonly rangeEnd = computed(() => this.latest()?.t ?? this.now());
  /** The fetch covers whole days (that is what the API serves); the chart shows just the range. */
  protected readonly rangeReadings = computed(() => {
    const since = this.rangeEnd() - this.hours() * 3_600_000;
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

  /** Hides a section on phones unless its tab is open; desktop always shows it. */
  protected onlyOn(tab: TrackerTab): string {
    return this.tab() === tab ? "" : "max-lg:hidden";
  }

  protected selectTab(tab: TrackerTab): void {
    if (tab === this.tab()) return;
    this.router.navigate([], { relativeTo: this.route, queryParams: { view: tab === "home" ? null : tab } });
    window.scrollTo({ top: 0 });
  }

  async ngOnInit(): Promise<void> {
    // The page is dark edge to edge, including the overscroll area behind it, and sets its own type.
    this.previousBackground = document.body.style.background;
    document.documentElement.style.background = document.body.style.background = "#0f172a";
    this.hadMaterialTypography = document.body.classList.contains("mat-typography");
    document.body.classList.remove("mat-typography");
    if (!document.querySelector(`link[href="${FONT_URL}"]`)) {
      document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: FONT_URL }));
    }
    this.wideQuery.addEventListener("change", this.onWideChange);
    this.clockTimer = window.setInterval(() => this.now.set(Date.now()), 30_000);
    this.refreshTimer = window.setInterval(() => {
      if (this.session() && document.visibilityState === "visible") this.load(fetchDays(this.hours()), true);
    }, REFRESH_MS);
    await this.signIn(takeLinkKey());
  }

  // A link opened in a tab already on this page only changes the fragment, so the page doesn't
  // reload. main.ts takes the key off the address bar as the hash changes, but the router then
  // replays the change as a navigation and writes the fragment back; so once that navigation
  // ends, take it off again and sign in with it.
  private readonly linksOpenedInPlace = this.router.events
    .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed())
    .subscribe(() => {
      // The first sign-in (ngOnInit) handles a link the page was opened with.
      if (this.session() === undefined) return;
      captureLinkKey();
      const key = takeLinkKey();
      if (key) this.signIn(key);
    });

  protected retryLink(): void {
    this.signIn(this.unsentKey);
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

  /**
   * Trades a personal link's key (see link-key.ts) for a session, or else finds out whether this
   * device already has one. Only a key the API rejects is reported as a dead link; a failure to
   * reach it keeps the key for Retry.
   */
  private async signIn(key: string | null): Promise<void> {
    let session: Session | null = null;
    if (key) {
      this.linkProblem.set(null);
      try {
        session = await this.api.link(key);
        this.unsentKey = null;
      } catch (error) {
        const rejected = error instanceof ApiError && (error.status === 400 || error.status === 401);
        this.unsentKey = rejected ? null : key;
        this.linkProblem.set(rejected ? "dead" : "unreachable");
      }
    }
    if (!session) session = await this.api.session().catch(() => null);
    this.session.set(session);
    if (session) {
      this.linkProblem.set(null);
      this.load(fetchDays(this.hours()));
    }
  }

  protected async signOut(): Promise<void> {
    this.menuOpen.set(false);
    await this.api.logout().catch(() => undefined);
    this.cache.set(new Map());
    this.session.set(null);
    this.selectTab("home");
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

function parseTab(value: string | null): TrackerTab {
  return value === "graphs" || value === "profile" ? value : "home";
}
