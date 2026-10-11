import { Injectable } from "@angular/core";

import { Telemetry, TelemetryResponse, parseTelemetry } from "./telemetry";

// Netlify proxies this path to the portal API on Cloud Run (see src/_redirects), so the
// session cookie is first-party on every host the site is served from.
const API = "/api/tracker";

export interface Session {
  name: string;
}

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string | null) {
    super(`HTTP ${status}${code ? `: ${code}` : ""}`);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(response.status, body?.error ?? null);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

const post = <T>(path: string, body: object = {}) => call<T>(path, { method: "POST", body: JSON.stringify(body) });

@Injectable({ providedIn: "root" })
export class TrackerApi {
  /** The signed-in person, or null when this device has no valid session. */
  async session(): Promise<Session | null> {
    try {
      return await call<Session>("/session");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  }

  /** Signs this device in with the key from someone's personal link. */
  link(key: string): Promise<Session> {
    return post("/auth/link", { key });
  }

  logout(): Promise<void> {
    return post("/auth/logout");
  }

  async telemetry(days: number): Promise<Telemetry> {
    return parseTelemetry(await call<TelemetryResponse>(`/telemetry?days=${days}`));
  }
}
