import { SITE_TIME_ZONE } from "./scene/sun";

export type TrackerStatus = "ACTIVE" | "NIGHT" | "SAFE" | "AWAY";

export interface Reading {
  /** Epoch ms. */
  t: number;
  percent: number;
  temperature: number;
  /** Peak wind over the row's interval, m/s. */
  windMs: number;
  status: TrackerStatus;
  windSensor: boolean;
}

export interface Telemetry {
  readings: Reading[];
  lastUploadAt: number | null;
}

/** The wire format from the portal API's GET /telemetry. */
export interface TelemetryResponse {
  lastUploadAt: string | null;
  statuses: TrackerStatus[];
  rows: [number, number, number, number, number, number][];
}

export function parseTelemetry(body: TelemetryResponse): Telemetry {
  return {
    lastUploadAt: body.lastUploadAt ? Date.parse(body.lastUploadAt) : null,
    readings: body.rows.map(([t, percent, temperature, windMs, status, windSensor]) => ({
      t, percent, temperature, windMs, status: body.statuses[status], windSensor: windSensor === 1,
    })),
  };
}

// Status colours are reserved for state and always ship with an icon and a label.
export const STATUS_META: Record<TrackerStatus, { label: string; detail: string; color: string; icon: string }> = {
  ACTIVE: { label: "Tracking", detail: "Following the sun on its hourly schedule", color: "#2fbf5b", icon: "sun" },
  NIGHT: { label: "Night hold", detail: "Outside active hours, holding position", color: "#8c9bd6", icon: "moon" },
  SAFE: { label: "Wind safe", detail: "Parked flat until the wind drops", color: "#ec835a", icon: "wind" },
  AWAY: { label: "Away", detail: "Parked by hand from the dashboard", color: "#b8c0c8", icon: "pause" },
};

export const kmh = (ms: number) => ms * 3.6;

// A row lands every five minutes; a gap longer than this is missing data, not a quiet spell.
const GAP_MS = 20 * 60 * 1000;

export interface StatusSpan {
  status: TrackerStatus | null;
  start: number;
  end: number;
}

/** Consecutive rows with one status, with gaps in the data as their own spans. */
export function statusSpans(readings: Reading[]): StatusSpan[] {
  const spans: StatusSpan[] = [];
  for (let i = 0; i < readings.length; i++) {
    const r = readings[i];
    const previous = spans[spans.length - 1];
    const next = readings[i + 1];
    const end = next && next.t - r.t <= GAP_MS ? next.t : r.t + 5 * 60 * 1000;
    if (previous && previous.status === r.status && r.t - previous.end <= GAP_MS) {
      previous.end = end;
    } else {
      if (previous && r.t - previous.end > GAP_MS) spans.push({ status: null, start: previous.end, end: r.t });
      spans.push({ status: r.status, start: r.t, end });
    }
  }
  return spans;
}

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

export interface DaySummary {
  minTemperature: number | null;
  maxTemperature: number | null;
  peakWindMs: number | null;
}

/** Today's numbers, where "today" is the calendar day at the site. */
export function summarizeDay(readings: Reading[], now: number): DaySummary {
  const today = dayKey.format(now);
  const rows = readings.filter((r) => dayKey.format(r.t) === today);
  const temps = rows.map((r) => r.temperature);
  const winds = rows.filter((r) => r.windSensor).map((r) => r.windMs);
  const min = (xs: number[]) => (xs.length ? Math.min(...xs) : null);
  const max = (xs: number[]) => (xs.length ? Math.max(...xs) : null);
  return {
    minTemperature: min(temps),
    maxTemperature: max(temps),
    peakWindMs: max(winds),
  };
}

/** When the tracker entered its current status. */
export function statusSince(readings: Reading[]): number | null {
  const last = readings[readings.length - 1];
  if (!last) return null;
  for (let i = readings.length - 2; i >= 0; i--) {
    if (readings[i].status !== last.status || readings[i + 1].t - readings[i].t > GAP_MS) return readings[i + 1].t;
  }
  return readings[0].t;
}

export const siteTime = new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIME_ZONE, hour: "numeric", minute: "2-digit" });
export const siteDateTime = new Intl.DateTimeFormat("en-CA", {
  timeZone: SITE_TIME_ZONE, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});

export function relativeTime(then: number, now: number): string {
  const minutes = Math.round((now - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} days ago`;
}
