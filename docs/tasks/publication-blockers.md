# Participant publication blockers

## Intent and acceptance

Fix the locally actionable preparation blockers in the readiness report. Preserve existing uncommitted E01 work and the frontend-only teaching boundary.

- Prevent simultaneous editing tabs from overwriting the same scenario, including import/reset; preserve recovery and unavailable-storage behavior.
- Reuse the existing Notice/Button host recipes for Polish lock/recovery feedback, with keyboard and narrow-screen checks.
- Produce an immutable static release directory with a content-derived ID, file hashes and byte sizes; verify the same identity locally or at an explicitly supplied address.
- Document publishing, smoke checks, rollback, privacy-safe diagnosis and participant communication; rehearse integrity failure and restoring a retained artifact locally.
- Implement the approved seven-day personal-audio expiry, removing the entire containing interview/transcripts/report on startup/import/export and minute/focus checks while open. Preserve original recording dates; undated legacy audio expires immediately. Downloaded files require separate manual deletion.
- Review dependency advisories if the configured registry is reachable and metadata disclosure is authorized. Record unavailable evidence honestly.
- Update FEATURES.md, participant/security guidance and the readiness report. Keep host/account, retention, cohort/budget and named owner decisions open until supplied.
- Run ./scripts/verify, meaningful two-tab regression journeys and participant packaging. Perform a separate review pass. Do not publish or change external state.

## Design and boundaries

Read the required Poster People project guide, implementation rules, verification checklist, agent entry point, component API and relevant status/empty-state reference. The lock notice is a host adaptation using existing Notice and Button recipes; it does not change theme tokens, routes, fixtures, roles or the immutable kit.

## Execution evidence

- `PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` exited 0: formatting, immutable design-system check (67 files / 333 references and six example tests), lint, types, 36 unit tests, baseline packet (120 journeys), build and all 43 browser journeys.
- New browser checks cover a blocked second writer, keyboard reload after the owner closes, preservation of the newer profile, rejection of out-of-band changes on save/reset, startup expiry and expiry while the app stays open. The existing copied-link journey exposed overbroad blocking; public reading was restored before the successful gate.
- Examined 1280 px and 320 px captures; the lock view also passed 390 px overflow, keyboard activation and an Axe scan. The kit remains byte-identical. This is a scoped host composition check, not complete manual accessibility acceptance.
- `npm audit fix --ignore-scripts` applied compatible lockfile updates (13 packages), without force or install hooks. Final `npm audit --json` returned 12 development-tool findings (two low / ten moderate; no high/critical). `npm audit --omit=dev --json` returned zero findings for runtime dependencies. These registry lookups were explicitly authorized by the user.
- Remaining advisory roots: deepmerge object prototype poisoning (GHSA-gcqx-w48m-w2h4) through shadcn registry/CLI, and minimatch pattern amplification (GHSA-g3hv-75wg-m249) through ts-morph/shadcn and TypeScript ESLint. The static site runs neither tool: shadcn contributes only a local CSS import; lint/build use trusted local source/configuration. Do not run the registry generator or toolchain on untrusted registry inputs/configuration. Do not force the suggested downgrade to shadcn 1.0.0. Review these advisories again when the toolchain or registry-generation workflow changes; no claim of zero development vulnerabilities is made.
- `npm run package:participant -- /private/tmp/doroboty-participant-publication-final-20261114` passed its baseline/pristine manifest checks; it includes the release helper and procedure and excludes source history/instructor material.
- `npm run package:release` retained the final static artifact outside the repository. Deliberate index corruption in a disposable copy failed integrity verification; restoring the retained directory passed. `npm run smoke:release` against `http://127.0.0.1:55228/` verified all 37 static files. Server stopped after rehearsal.
- Final static release: `c8c6654402976e205c94ea5844512654e268d86f7df754e080a41e34d4612e4e`, 37 files / 16,259,143 bytes excluding release.json. ZIP retained in the task artifact directory. This is local artifact recovery evidence; selected-host publishing, logs, alerts and operator permissions are unverified.
- Separate review checked writer ownership before all mutations, stored-value conflict checks, lock release, import/reset return values, expiry of drafts/submitted interviews and derived report copies, preserved recording timestamps, deterministic file inventory and unchanged source-package exclusions. Fixed misleading reset success feedback when a conflicting write is rejected. Review found no further local blocker in this scope.
- Provider/domain, operator/contact, cohort/budget and actual deployment remain open. The user confirmed individual devices/browser profiles and seven-day personal-audio retention. The app cannot delete files outside browser storage or execute cleanup while the browser is closed.

## References and limits

The cross-tab exclusion follows the [Web Locks specification](https://www.w3.org/TR/web-locks/). Dependency evidence comes from the configured corporate npm advisory endpoint, following the [npm audit contract](https://docs.npmjs.com/cli/audit.html/). No repository or participant data was uploaded to a scanner. No commit, push or deployment was performed.
