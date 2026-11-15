# Static participant release

## Current release decision

The target is an AIPH3 participant link. Provider, domain, hosting incident owner, cohort size and budget have not been supplied. Do not mark publishing, provider logging, alerts, capacity or operator access verified from a local build. Participants use individual devices/browser profiles. Personal E01 recordings expire after seven days; downloaded files require separate deletion after the exercise.

## Prepare a retained artifact

1. Use Node 24 and `npm ci`. Run `./scripts/verify` (or `PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` when explicitly using an installed Chrome).
2. The build creates `dist/release.json`: a content-derived release ID and SHA-256/byte count for every static file. It contains no user state or source history. Verify it with `npm run verify:release`.
3. Run `npm run package:release -- /absolute/outside/repo/release-directory`. The destination must not exist. Keep this directory unchanged for version checking and rollback. Record its release ID alongside the source revision and actual gate result in the release record.
4. Source distributions use the separate `npm run package:participant` command. Never upload the repository, Git history, docs/source, test artifacts or local exports to the static host.

## Hosting handoff and admission gate

The host must serve the retained static directory over HTTPS, including at a subdirectory if desired. Hash routes need no rewrites. HTML and release.json need revalidation/no-cache; hashed assets may use immutable caching. Disable HTML injection, automatic analytics and asset rewriting unless the privacy boundary and smoke checks are reassessed. Keep personal recordings out of URLs, logs, support attachments and release records. No environment secret or backend is needed.

Before publishing, the owner must record the provider, exact base URL, retained artifact/ID, previous safe artifact/ID (or first-release recovery artifact), named operator and backup contact, incident communication channel, budget, cohort size, provider limits, log access and retention. Confirm the operator can replace/restore the directory. Consult that provider's current documentation once selected.

Do not admit participants until all of these pass:

1. Run `npm run smoke:release -- https://chosen-address/ /absolute/retained/artifact`. It checks HTTPS (except loopback rehearsals), deployed release identity and all static file hashes; requests have ten-second timeouts and reject redirects. It makes GET requests only and sends no scenario data.
2. In a fresh, disposable browser profile with synthetic data, open `/#/oferty`, select Anna, save an offer, submit an application, switch to the employer and record a decision. Reload and confirm it persists. Check a copied hash URL, local PDFs and the synthetic audio sample. Delete the test profile afterwards.
3. Check E01 own-voice disclosure, microphone-denial/text fallback, explicit approval, import/export/reset and a second tab being blocked. Use the synthetic audio sample for deployment smoke; never upload a participant recording.
4. Confirm no third-party requests or scenario/audio uploads. Check HTTPS, browser console, and provider logs for status/asset failures without copying local content. Validate desktop and mobile, keyboard/focus, privacy copy and no horizontal clipping.
5. Any identity/hash failure, broken main flow, failed save/recovery, unexpected data transfer or missing HTTPS blocks admission and triggers restoration of the retained safe version. If no compatible version exists, stop sharing the link and show a static outage message; preserve browser data.

## Rollback and recovery

1. Pause new participant admissions through the course's agreed channel. Record time and release ID only; do not request exported scenarios or recordings.
2. Confirm the previous artifact passes `node scripts/release.mjs verify /absolute/previous-artifact`. Retain the failed artifact for investigation.
3. Restore the entire verified directory using the chosen host's atomic deployment/replacement mechanism. Preserve the same origin/path so browser-local saves remain addressable. Do not replace individual hashed files or mix release versions.
4. Re-run the static smoke against that exact artifact, then the synthetic browser journey. Record the outcome and tell participants when the link is usable.
5. Every rollback version must retain the writer lock, seven-day voice cleanup and version-1 import compatibility. Do not restore an older build that would silently retain expired recordings. Prefer the first verified version with these safeguards as the initial recovery artifact.

A local rehearsal restores a retained artifact after deliberately corrupting a disposable copy, checks that verification detects corruption, then verifies the restored copy and serves it for static smoke. This rehearses artifact restoration; the selected host's replacement controls and access still require verification.

Browser data remains on participant devices during an outage. Advise keeping the same browser profile, copying unsaved text privately, then using Settings export/import if required. Exports contain recordings and recruiter notes; delete them after the exercise. Do not ask participants to clear site data as the first troubleshooting step. A corrupt original can be downloaded privately before reset. No cloud recovery exists without a participant-held export.

## Diagnosis, monitoring and communication

Monitor the site base URL, release.json and one required hashed asset from the retained manifest. A safe static failure check is a GET for a nonexistent static filename; verify the operator can find its status without logging query strings, request bodies or browser-local content. Never log private free text. Check that the provider does not silently turn missing assets into successful HTML responses.

The host owner must configure a status/content mismatch signal and deliver a test alert to the named operator before admission. Record receipt time, release ID and recipient, without notification credentials. If the host lacks the required feature, choose an approved monitor only after the owner agrees to that service. Log access is limited to the operator; provider retention and default IP/request metadata require review.

Participants report problems to their course instructor through the course channel, giving the visible action, approximate time, browser version, release ID from release.json and the error message. Do not send exports, names, CVs, free text, audio or transcripts. An instructor escalates to the named hosting owner. The actual contact/channel remains a release prerequisite.

For capacity, sum the byte counts in release.json. Conservative uncached transfer is `artifact bytes × participant sessions`, plus the synthetic audio/PDF downloads and verification/monitoring requests. Compare with the chosen provider's traffic/request/storage limits, safety margin, spending cap and classroom concurrency; inspect real usage after release. Do not infer a supported cohort or cost from bundle size alone.
