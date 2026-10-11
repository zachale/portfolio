// How the page frames the scene. Kept apart from tracker-scene.ts, which pulls in three.js, so the
// page can use these without loading the scene before it needs it.

/** Where the tracker should sit in the canvas, as fractions of its width and height. */
export interface Framing {
  x: number;
  y: number;
}

/** Between the numbers over the sky and the ones over the ground. */
export const DASHBOARD_FRAMING: Framing = { x: 0.5, y: 0.57 };
/** Clear of the sign-in card: above it on a phone, beside it on a wide screen. */
export const LOGIN_FRAMING_NARROW: Framing = { x: 0.5, y: 0.3 };
export const LOGIN_FRAMING_WIDE: Framing = { x: 0.68, y: 0.52 };
