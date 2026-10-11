# Solar tracker portal

A private dashboard for the lakeside solar tracker, served at `/tracker` on this site and at the
root of `tracker.zachlegesse.ca`. The centrepiece is a three.js model of the real tracker on its
boardwalk: the array tilts to the latest reported position, the sky follows the real sun at the
site, and the anemometer spins with the last gust. Status and panel extension sit above the scene,
temperature and wind below it, and the history charts underneath replay any moment back into the
scene when you hover or tap them.

The tracker's firmware, the API this page reads, and its deploy and user-management scripts live
in [zachale/solar-tracker](https://github.com/zachale/solar-tracker) under `portal/` and
`tools/portal/`.

## How it fits together

```
tracker ──POST /data──▶ Cloud Run test-image ──▶ gs://…-telemetry/raw/<day>/*.ndjson
                                                          │ read-only
browser ──/api/tracker/*──▶ Netlify proxy ──▶ Cloud Run tracker-api ──▶ gs://…-portal (users, requests)
```

`src/_redirects` proxies `/api/tracker/*` to the API, so the session cookie is first-party on
zachlegesse.ca, tracker.zachlegesse.ca and every Netlify deploy preview alike. Nothing in this
repo holds a secret.

## Signing in

There are no passwords and no texted codes. Someone on the allowlist enters their phone number
and the page shows "Waiting for Zach". Zach sees the request under the bell icon (or with
`tools/portal/requests.sh` in the solar-tracker repo) and taps Approve, and the waiting browser
signs itself in. The request is tied to that browser by an HttpOnly cookie and stays open for
24 hours, so the visitor can close the tab and come back. "Keep me signed in" holds the session
for 90 days, renewed while it is in use; removing a number from the allowlist signs that person
out on their next request.

## Code map

| Path | What it is |
|---|---|
| `tracker-page.component.*` | The page: session, data loading, the hero overlays, today's numbers |
| `scene/tracker-scene.ts` | The three.js scene (plain TypeScript, lazy-loaded in its own chunk) |
| `scene/sun.ts` | Sun position at the site (SunCalc), which drives sky, light and shadows |
| `scene/scene-view.component.ts` | Angular wrapper; runs the render loop outside the zone |
| `history/` | ECharts small multiples (status, panel %, temperature, wind) and the expanded view with a table |
| `login/` | Ask for access, then wait for approval (polls every 4 s) |
| `admin/` | Sign-in requests for Zach to approve or deny |
| `telemetry.ts` | Types, status labels and colours, and the derived numbers (today, status since, spans) |
| `tracker.scss` | Portal styles and design tokens, imported globally and scoped under `.tracker-root` |
| `/design-system/solar-tracker-portal/` | The design system behind those tokens: `MASTER.md`, overridden by `pages/dashboard.md` |

Notes on the model: 50% extension is flat and each percent is about 1.1° of tilt (SPEC.md in the
solar-tracker repo), so 0% faces east and 100% faces west. Row times are converted from the
site's wall clock to real instants by the API.

## Local development

```bash
npm start
```

`ng serve` proxies `/api/tracker` to `http://localhost:8080` (`proxy.conf.json`). Run the API
locally from the solar-tracker repo (`portal/README.md`), or change the proxy target to the
deployed service URL to use live data; the session cookie works on `localhost`.

## Hosting `tracker.zachlegesse.ca`

The site already routes the bare subdomain to this page (`onTrackerHost` in `app.routes.ts`).
To turn it on: add `tracker.zachlegesse.ca` as a domain alias on the `zachlegesse` Netlify site,
then add a `CNAME tracker → zachlegesse.netlify.app` record in Cloudflare, set up the same way
as the apex record.
