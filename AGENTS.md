# AGENTS.md

- All trace data access goes through `src/lib/traces.ts`; components never query the backend directly — one place to secure and change.
- The public only gets marker data (`get_trace_markers` RPC); trace content and signed audio URLs come only from the `trace-content` edge function after a 50 m check, and new traces only through `create-trace` (validation, audio duration parsing, IP-hash rate limit) — direct table/bucket access is admin-only so the client cannot bypass the rules.
- Trace grouping uses Mapbox GeoJSON clustering with a cutoff below the map's maximum zoom; close-zoom overlapping HTML markers use display offsets only — all traces become selectable without changing their GPS coordinates.
- Trace details render in React cards, never in Mapbox HTML popups — avoids injecting user text as HTML and fixes overlay stacking on mobile.
- TraceDetail uses two accessible flip faces for content and safety actions; audio controls and close never trigger flipping — keeps touch actions separate from playback.
- Audio uses the custom `AudioPlayer` (no native `controls`) — native players render inconsistently in iOS/Android WebViews.
- Capacitor config has no `server.url` — the native app must bundle local files, otherwise it opens the browser.
- Native-only features (notifications) are guarded by `Capacitor.isNativePlatform()` — the same code runs on web.
- RLS policies on `user_roles` must never query `user_roles` itself — a self-referencing policy caused infinite recursion that broke every delete; role checks go through the SECURITY DEFINER `has_role` function.
- Recorded audio must pair a container with a codec the same platform can play back (AAC in `.mp4` on iOS, Opus in `.webm` elsewhere) — Chromium muxes Opus into `.mp4`, which Safari silently refuses to play.
- The opening splash lives in `Index` only and shows once per JS load (module flag) — keeps it off /admin and /auth and off background resumes; GPS/notification requests wait until it ends.
- AI moderation runs only in the admin-only `moderate-traces` edge function (verdict stored on `traces`, `moderated_at` marks analysed rows); the admin page triggers it on load and sorts flagged traces first — no AI key or prompt in the client.
- Tag traces store the drawing as validated integer stroke JSON (`drawing` column) rendered as SVG, never as an uploaded image — nothing executable or unscanned reaches storage.
- The map app (`Index`) renders only on native, localhost, or the private Lovable editor preview host; the published site and custom domain show `Landing` — the app must not be usable from the public website.
- UGC safety (Apple 1.2): terms gate before map use; text is AI-filtered in `create-trace` (flagged → `hidden`); reports go through `report-trace` (auto-hide at 2); per-device hide/block lists are local; admins can restore or ban an author (`banned_authors`, keyed by salted device hash) — keep all four in place for App Store review.
- AppDelegate adopts the UIScene lifecycle (UIApplicationSceneManifest in Info.plist, scene delegate implemented on AppDelegate) — iOS 27 kills any app at launch without scene adoption, which crashed the App Store review.
