# AGENTS.md

- All trace data access goes through `src/lib/traces.ts`; components never query the backend directly — one place to secure and change.
- Trace grouping uses Mapbox GeoJSON clustering; HTML markers render its clusters and individual points — keeps grouping tied to map zoom without moving trace GPS coordinates.
- Trace details render in React cards, never in Mapbox HTML popups — avoids injecting user text as HTML and fixes overlay stacking on mobile.
- Audio uses the custom `AudioPlayer` (no native `controls`) — native players render inconsistently in iOS/Android WebViews.
- Capacitor config has no `server.url` — the native app must bundle local files, otherwise it opens the browser.
- Native-only features (notifications) are guarded by `Capacitor.isNativePlatform()` — the same code runs on web.
- RLS policies on `user_roles` must never query `user_roles` itself — a self-referencing policy caused infinite recursion that broke every delete; role checks go through the SECURITY DEFINER `has_role` function.
- Recorded audio must pair a container with a codec the same platform can play back (AAC in `.mp4` on iOS, Opus in `.webm` elsewhere) — Chromium muxes Opus into `.mp4`, which Safari silently refuses to play.
