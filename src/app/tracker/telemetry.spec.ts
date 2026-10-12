import { tiltDegrees } from "./scene/tracker-scene";
import { Reading, TrackerStatus, safeTrips, statusSince, statusSpans, summarizeDay } from "./telemetry";

const MIN = 60_000;
// 2026-10-10 08:00 at the site (EDT, UTC-4).
const MORNING = Date.parse("2026-10-10T12:00:00Z");

function reading(t: number, status: TrackerStatus, extra: Partial<Reading> = {}): Reading {
  return { t, percent: 50, temperature: 10, windMs: 1, status, windSensor: true, ...extra };
}

describe("tracker telemetry", () => {
  it("merges consecutive statuses into spans and marks gaps in the data", () => {
    const rows = [
      reading(MORNING, "NIGHT"),
      reading(MORNING + 5 * MIN, "ACTIVE"),
      reading(MORNING + 10 * MIN, "ACTIVE"),
      reading(MORNING + 60 * MIN, "ACTIVE"),
    ];
    const spans = statusSpans(rows);
    expect(spans.map((s) => s.status)).toEqual(["NIGHT", "ACTIVE", null, "ACTIVE"]);
    expect(spans[1]).toEqual({ status: "ACTIVE", start: MORNING + 5 * MIN, end: MORNING + 15 * MIN });
  });

  it("marks each move into wind safe mode once", () => {
    const rows = [
      reading(MORNING, "ACTIVE"),
      reading(MORNING + 5 * MIN, "SAFE"),
      reading(MORNING + 10 * MIN, "SAFE"),
      reading(MORNING + 15 * MIN, "ACTIVE"),
      reading(MORNING + 20 * MIN, "SAFE"),
    ];
    expect(safeTrips(rows).map((r) => r.t)).toEqual([MORNING + 5 * MIN, MORNING + 20 * MIN]);
    expect(safeTrips([reading(MORNING, "SAFE")]).length).toBe(1);
  });

  it("finds when the current status began", () => {
    const rows = [reading(MORNING, "NIGHT"), reading(MORNING + 5 * MIN, "ACTIVE"), reading(MORNING + 10 * MIN, "ACTIVE")];
    expect(statusSince(rows)).toBe(MORNING + 5 * MIN);
    expect(statusSince([])).toBeNull();
  });

  it("summarises the site's calendar day, not the viewer's or UTC's", () => {
    const yesterdayEvening = Date.parse("2026-10-10T03:30:00Z"); // 23:30 on the 9th at the site
    const rows = [
      reading(yesterdayEvening, "ACTIVE", { temperature: -5, percent: 99 }),
      reading(MORNING, "ACTIVE", { percent: 20, temperature: 4 }),
      reading(MORNING + 5 * MIN, "ACTIVE", { percent: 30, temperature: 6, windMs: 3 }),
      reading(MORNING + 10 * MIN, "NIGHT", { percent: 90, temperature: 5, windSensor: false, windMs: 9 }),
    ];
    const today = summarizeDay(rows, MORNING + 20 * MIN);
    expect([today.minTemperature, today.maxTemperature]).toEqual([4, 6]);
    expect(today.peakWindMs).toBe(3);
  });

  it("maps extension to tilt: flat at 50%, about 21° past flat at 69%", () => {
    expect(tiltDegrees(50)).toBe(0);
    expect(tiltDegrees(69)).toBeCloseTo(20.9);
    expect(tiltDegrees(0)).toBeCloseTo(-55);
    expect(tiltDegrees(140)).toBeCloseTo(55);
  });
});
