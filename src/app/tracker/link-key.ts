// A personal link carries its sign-in key in the URL fragment (#key=…), which browsers never send
// to a server. It still sits in the address bar, where analytics and the history can read it, so
// main.ts calls captureLinkKey before anything else runs (and again on every hash change), and the
// tracker page picks the key up from memory when it is ready.

let pending: string | null = null;

/** Moves a #key=… off the address bar into memory. Does nothing when there is none. */
export function captureLinkKey(): void {
  const key = new URLSearchParams(location.hash.slice(1)).get("key");
  if (!key) return;
  pending = key;
  history.replaceState(history.state, "", location.pathname + location.search);
}

/** The captured key, handed over once. */
export function takeLinkKey(): string | null {
  const key = pending;
  pending = null;
  return key;
}

/** Drops any #key=… from a URL, for analytics that record page addresses. */
export function withoutLinkKey(url: string): string {
  return url.replace(/#.*\bkey=[^&]*.*$/, "");
}
