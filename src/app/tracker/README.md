# Solar tracker portal

A private dashboard for the lakeside solar tracker, served at `/tracker` on this site. The
centrepiece is a three.js model of the real tracker on its boardwalk: the array tilts to the latest reported position, the sky follows the real sun at the
site, and the anemometer spins with the last gust. The camera is fixed and the canvas takes no
input, so it never gets in the way of scrolling on a phone. Status and panel extension sit above
the scene, temperature and wind below it, and the history charts underneath.

The tracker's firmware, the API this page reads, and its deploy and user-management scripts live
in [zachale/solar-tracker](https://github.com/zachale/solar-tracker) under `portal/` and
`tools/portal/`.

## How it fits together

```
tracker ──POST /data──▶ Cloud Run test-image ──▶ gs://…-telemetry/raw/<day>/*.ndjson
                                                          │ read-only
browser ──/api/tracker/*──▶ Netlify proxy ──▶ Cloud Run tracker-api ──▶ gs://…-portal (users)
```

`src/_redirects` proxies `/api/tracker/*` to the API, so the session cookie is first-party on
zachlegesse.ca and every Netlify deploy preview alike. Nothing in this
repo holds a secret.

## Signing in

There is no sign-in screen. Zach gives each person a personal link
(`https://zachlegesse.ca/tracker#key=…`, made with `tools/portal/users.sh` in the solar-tracker
repo). Opening it signs in that device for good: the page takes the key off the address bar at
once, trades it for a session cookie, and the cookie renews itself while it is used. The key is
in the URL fragment, which browsers never send to a server, so it stays out of logs. A device
without a session sees a note to ask Zach for a link.

A link is a bearer credential: whoever has it is that person. That is fine for this data.
Re-issuing someone's link signs out every device that used the old one; removing them signs
them out everywhere.

## Layout

On a phone the page is three sections behind a floating glass tab bar: Home (the scene and
today's numbers), Graphs (the history) and Profile (who is signed in, and sign out). The open
section is in the URL (`?view=graphs`), so back and reload behave. On desktop everything is on
one screen, with an account button for signing out.

## Code map

| Path | What it is |
|---|---|
| `tracker-page.component.*` | The page: session, data loading, the hero overlays, today's numbers |
| `scene/tracker-scene.ts` | The three.js scene (plain TypeScript, lazy-loaded in its own chunk) |
| `scene/sun.ts` | Sun position at the site (SunCalc), which drives sky, light and shadows |
| `scene/scene-view.component.ts` | Angular wrapper; runs the render loop outside the zone |
| `history/` | ECharts small multiples (status, panel %, temperature, wind) and the expanded view with a table |
| `access/` | What a device without a session sees |
| `ui/tab-bar.component.ts` | The phone's glass tab bar |
| `telemetry.ts` | Types, status labels and colours, and the derived numbers (today, status since, spans) |
| `tracker.scss` | Portal styles and design tokens, imported globally and scoped under `.tracker-root` |
| `/design-system/solar-tracker-portal/` | The design system behind those tokens: `MASTER.md`, overridden by `pages/dashboard.md` |

Notes on the model: 50% extension is flat and each percent is about 1.1° of tilt (SPEC.md in the
solar-tracker repo), so 0% faces east and 100% faces west. The torque tube runs north-south and
the lake lies to the west, so the array faces the water when it parks at 100% for the night; the
camera stands on the boardwalk to the north. The array is 3 × 3 modules. After sunset the scene
is lit day-for-night (a cool moon and a blue sky fill) so it stays readable. Row times are
converted from the site's wall clock to real instants by the API.

## Local development

```bash
npm start
```

`ng serve` proxies `/api/tracker` to `http://localhost:8080` (`proxy.conf.json`). Run the API
locally from the solar-tracker repo (`portal/README.md`), or change the proxy target to the
deployed service URL to use live data; the session cookie works on `localhost`.
