import SunCalc from "suncalc";

// Approximate. Close enough for the sky to match the site's sunrise and sunset to within a
// few minutes; the exact location is deliberately not published.
export const SITE_LATITUDE = 45.0;
export const SITE_LONGITUDE = -78.5;
export const SITE_TIME_ZONE = "America/Toronto";

export interface SunPosition {
  /** Radians above the horizon; negative below it. */
  altitude: number;
  /** Radians from south, positive toward west (SunCalc's convention). */
  azimuth: number;
}

export function sunAt(time: Date): SunPosition {
  const { altitude, azimuth } = SunCalc.getPosition(time, SITE_LATITUDE, SITE_LONGITUDE);
  return { altitude, azimuth };
}

/**
 * Unit vector toward the sun in scene space: +x east, +y up, +z south.
 */
export function sunDirection(sun: SunPosition): [number, number, number] {
  const flat = Math.cos(sun.altitude);
  return [-Math.sin(sun.azimuth) * flat, Math.sin(sun.altitude), Math.cos(sun.azimuth) * flat];
}
