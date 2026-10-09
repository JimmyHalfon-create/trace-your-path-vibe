# AGENTS.md

- All trace data access goes through `src/lib/traces.ts`; components never query the backend directly — one place to secure and change.
- Trace details render in React cards, never in Mapbox HTML popups — avoids injecting user text as HTML and fixes overlay stacking on mobile.
- Audio uses the custom `AudioPlayer` (no native `controls`) — native players render inconsistently in iOS/Android WebViews.
- Capacitor config has no `server.url` — the native app must bundle local files, otherwise it opens the browser.
- Native-only features (notifications) are guarded by `Capacitor.isNativePlatform()` — the same code runs on web.
