# Production readiness gate follow-up

## Intent

Keep the generated offline readiness report in `docs/` without making the project formatter reject it, and make the E01 ordinary-submission browser journey verify its consent state before continuing.

## Acceptance criteria

- Prettier ignores only the generated `docs/production-readiness.html`; the readiness renderer remains its sole writer.
- The E01 journey waits for asynchronous question regeneration to finish, then asserts that application consent is checked before submitting an ordinary application.
- `./scripts/verify` passes with the readiness report present, including all browser journeys.
- The participant package command and baseline manifest verifier pass on the updated source.
- `FEATURES.md` was reviewed; it needs no update because these changes affect formatting and test diagnostics, not product behavior.

## Scope

No product flow, privacy rule, data boundary, provider setting, or deployment is changed by this follow-up.

## Validation

- `PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` passed with `docs/production-readiness.html` present: Prettier, design-system integrity (67 files / 333 references and 6 example tests), lint, TypeScript, 33 unit tests, baseline packet verification (120 journeys), production build, and 40 Playwright journeys.
- The first full rerun after adding only the checked-state assertion still failed 1/40 journeys: the test tried to submit while asynchronous question regeneration was still resetting consent. An explicit wait for the “Pytania przygotowane, szkic zapisany.” completion status fixed the test synchronization; the isolated journey then passed in 6.1 seconds.
- A subsequent full `PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` passed, including all 40 browser journeys. Prettier, design-system integrity (67 files / 333 references and 6 example tests), lint, TypeScript, 33 unit tests, baseline packet verification (120 journeys) and production build also passed.
- `npm run package:participant -- /private/tmp/doroboty-readiness-package-after-fix-20261114` passed and verified the baseline-only package and manifest. The temporary package was removed after inspection.
- `FEATURES.md` was reviewed and did not need an update because the changes affect generated-file formatting and test diagnostics only.
- The build still reports dependency annotation notices and a JavaScript chunk above 500 kB; the build and gate exited successfully.
