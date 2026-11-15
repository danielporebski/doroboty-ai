# Track the homepage View jobs action

## Intent

Send an explicit `view_jobs_clicked` PostHog event whenever the homepage's `Zobacz oferty` link is activated. This gives the owner a direct click signal in addition to the existing screen-view events.

## Acceptance criteria

- Mouse/touch activation and native keyboard Enter activation each send one `view_jobs_clicked` event with the fixed `screen: home` property when analytics is configured.
- The click event uses immediate sending after SDK readiness, independently of route-view deduplication. Navigation to `/#/oferty` remains responsive even if analytics is disabled or unavailable.
- Retain the existing token, temporary anonymous ID and false person-processing flag; exclude URLs, queries, persona/record IDs and free text. Keep automatic capture, replay and browser persistence disabled.
- Preserve the existing Poster People link markup, label, appearance, hash target and keyboard semantics. The relevant reference is C01 Actions; no styling or layout changes are needed.
- Update SYS-12, setup documentation and the Polish privacy disclosure in the same change.
- Run `./scripts/verify`, exercise the enabled SDK with intercepted requests, and perform a separate source review before preparing a pull request.

## Validation

`env VITE_POSTHOG_ENABLED=false PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` passed: formatting, design-system integrity/examples, lint, types, 41 unit tests, baseline packet checks, production build and 43 browser journeys. The installed Chrome channel was used without downloading browsers. Existing dependency-annotation and chunk-size warnings remain.

An enabled-SDK browser check used a dummy token and intercepted all PostHog requests locally. Mouse at 1280px, touch at 390px and native keyboard Enter at 320px each produced exactly one `view_jobs_clicked` event, retained the fixed `home` category and required anonymous transport fields, and navigated to `/#/oferty`. Existing screen-view events were also preserved. An additional check aborted analytics requests and confirmed that navigation still succeeded. No test events were sent to PostHog. Production deployment and dashboard ingestion require separate evidence.

## Separate review

Reviewed the final diff after implementation and checks. The single homepage link handler preserves its existing native anchor, hash target and classes. The sanitizer accepts the new event only with `screen: home`, and keeps the transport allowlist and no-profile instruction. Clicks do not use screen-view deduplication and do not await analytics before navigation. Disabled configuration is covered by regression checks. SYS-12, README and privacy disclosure describe the added behavior; the design kit and package dependencies were not changed. No unresolved source findings were identified in this pass.
