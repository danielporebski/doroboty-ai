# Add optional PostHog screen analytics

## Intent

Add PostHog to the deployed teaching prototype so the project owner can see aggregate screen usage. The initial checkout had no PostHog SDK, initialization or events, so selecting an installation route in PostHog alone could not produce events.

## Acceptance criteria

- Capture one custom screen-view event for known routes, using only a fixed screen category as the app-provided property. Never send full URLs, query strings, dynamic slugs, persona or record IDs, search terms, form values, CVs, notes, transcripts or recordings.
- Keep collection opt-in through build-time environment variables. Missing configuration or an explicit disabled flag must send no PostHog events.
- Disable automatic capture, replay, profile creation, persistent identifiers, surveys and other unused capture features.
- Use the EU ingestion host by default and allow the deployment owner to set the project token and host through environment variables.
- Update the in-product privacy copy, setup instructions and behavior register to describe the actual data flow.
- Document the PostHog project setting to discard client IP data before enabling deployed collection.

## Result

Implemented as optional screen-category events. The ignored `.env.local` has the local project token and EU host, and the owner confirmed that PostHog's client-IP discard setting is enabled. The owner also reported adding the enabled flag, public project token and EU host to Netlify. Deployment and real event ingestion still require separate verification; the PostHog dashboard is not authenticated here.

The event sanitizer preserves the required project token, temporary anonymous `distinct_id`, and explicit `$process_person_profile: false`, together with the fixed screen category. It reconstructs the event from an allowlist, removing URL, referrer and profile data. Captures wait for the SDK's `loaded` callback. Standard headless browsers are intentionally excluded by PostHog's bot filter; verify real ingestion in a regular browser session.

Wizard pull request [#1](https://github.com/danielporebski/doroboty-ai/pull/1) was merged into `main` while this implementation was being prepared. Its `VITE_POSTHOG_KEY` does not match the owner's Netlify configuration, and its separate initialization/identity calls do not satisfy this task's fixed-category data boundary. The follow-up consolidates tracking in `src/features/analytics/` using `VITE_POSTHOG_PROJECT_TOKEN`, removes the redundant wizard initialization/hooks and retains all original domain actions. No unrelated source changes arrived with that merge.

The lockfile retains the tested PostHog SDK 1.447.15. An attempt to adopt the wizard's 1.450.0 was rejected by the local npm minimum-release-age policy; that policy was not bypassed.

## Review

A separate source review found that dropping `distinct_id` would prevent valid ingestion and dropping `$process_person_profile` would lose the no-profile instruction. Both are now retained explicitly. Regression checks cover SDK readiness, route deduplication, disabled/missing configuration, event rejection and exclusion of page/person data. `.env.local` remains ignored and must not be committed.

The first Netlify preview failed during dependency installation because newly installed packages had corporate Artifactory tarball URLs. All 12 affected URLs now point to public npm tarballs; each downloaded artifact was checked against its existing lockfile integrity hash. The package versions and hashes are unchanged. Review new lockfile resolutions after local installs: successful cached builds do not prove that an external build service can fetch corporate registry URLs.

## Validation

`env VITE_POSTHOG_ENABLED=false PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` passed: formatting, design-system checks, lint, types, 40 unit tests, baseline packet verification, production build and 43 browser journeys. The default Playwright Chromium binary was unavailable, so the already-installed Google Chrome channel was used. An initial restricted run passed the static gate but could not bind the browser-test server; the full rerun with local-server access passed. The build still reports dependency annotation and large-chunk warnings.

A separate enabled-SDK transport check used a dummy project token and intercepted all PostHog requests locally. Visiting home and clicking the Offers navigation produced exactly two `prototype_screen_viewed` payloads (`home`, `job_list`). Each contained only the project token, temporary anonymous ID, false person-processing flag and screen category; no PostHog cookie or local/session-storage entry was written. The test browser's automation signals were overridden only in this intercepted check; production bot filtering remains enabled. This verifies payload generation and transport, not live ingestion or dashboard display.

The enabled production configuration also built successfully with a non-secret placeholder project token; the default disabled build was restored afterward and contains no placeholder token.

Installing `posthog-js` reported 12 vulnerabilities in the dependency tree (2 low, 10 moderate); no automatic audit fixes were applied. Live event ingestion remains unverified because the PostHog dashboard requires sign-in and the local transport check intentionally sent no events to PostHog.
