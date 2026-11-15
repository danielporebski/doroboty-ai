# Static participant release

## Current release decision

The target is a public AIPH3 participant link on Netlify: https://precious-starship-7cc1a2.netlify.app/. The owner and incident contact is Daniel Porebski (daniel.porebski@allegro.com). The agreed limit is 10 participants and USD 10 per month. Participants use individual devices/browser profiles. Personal E01 recordings expire after seven days; downloaded files require separate deletion after the exercise. Account permissions, actual plan, spending controls, diagnostics and alert delivery still require verification.

## Netlify procedure for this project

Observed on 2026-11-15: the [published deploy](https://app.netlify.com/projects/precious-starship-7cc1a2/deploys/6af9e16d20bdf30039c44742) serves commit 81682a81c186e9065ec8fab4d7bd368556fdfe6a. The current local source starts from 747e6964c4ae5cf4296685969d68b89a776fbe8b and includes newer safeguards. The Netlify edge currently requires an invited account (anonymous HTTP 401); current-source deployment is not verified.

1. The account owner signs in to the project and checks the linked repository is danielporebski/doroboty-ai, production branch main. Public metadata also labels the latest deploy as Netlify Drop; confirm the actual Git connection. After review/approval, publish the candidate source through that connection. netlify.toml specifies Node 24, npm run check:static and dist. GitHub CI separately runs the full browser gate; Netlify's static gate does not establish a successful GitHub check. Verify both results and the deployed commit. Repository configuration overrides conflicting UI build settings. [Build configuration](https://docs.netlify.com/build/configure-builds/file-based-configuration/).
2. For the approved public audience, the owner changes **Project configuration → General → Visitor access → Project visibility → Edit visibility** to **Public** for production. Older accounts may label this Password Protection. Leave Netlify admin/account authentication in place. Confirm the production URL in a signed-out browser; it must show the app without a Netlify account. No protection setting has been changed by this local task. [Visibility guidance](https://docs.netlify.com/manage/security/secure-access-to-sites/password-protection/).
3. Build/retain the same candidate locally, compare release.json and all assets using the smoke command below, then run the disposable synthetic browser journey. Check HTML/release caching, same-origin PDF frames and self-origin microphone permissions at the deployed address. The header configuration is prepared locally; it is not deployed evidence. [Header configuration](https://docs.netlify.com/manage/routing/headers/).
4. Record the new deploy ID/commit, artifact ID and results before admitting participants. Do not treat a successful old deployment as evidence for the candidate. For this configuration, use the repository build: uploading raw dist through Netlify Drop does not carry the root netlify.toml build/header settings.

To restore service, Daniel opens a retained successful deploy and uses **Publish Deploy**, then checks its artifact ID and repeats the smoke. Pause automatic publishing while investigating, so a subsequent Git build does not replace the restored release. Retain an offline safe artifact too; never roll back to 81682a8 for participant audio because it predates the recording-retention and writer-lock safeguards. [Netlify rollback behavior](https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/).

For diagnostics, inspect the project's deploy log first; it is available in the supplied public detail page. For request failures, the operator checks **Observability**, including a harmless missing static filename and its time/status. Use only synthetic data; retain no scenario exports, audio, transcripts or private free text in tickets. Confirm the account's available retention/access controls before relying on this for incidents. [Observability](https://docs.netlify.com/manage/monitoring/observability/overview/).

Under **Project configuration → Notifications → Deploy notifications**, configure an available failure signal and verify a test reaches Daniel. Availability depends on the account plan; email deploy notifications require Pro/Enterprise. A deploy-failure notification alone does not detect a broken published app. Keep the alert item open until a runtime/site failure signal and test delivery are evidenced; do not buy an add-on or subscribe another service as part of this task. [Deploy notifications](https://docs.netlify.com/deploy/deploy-notifications/).

For budget planning, one complete artifact download by each of 10 participants is about 163 MB before caching/compression; 10 such sessions each is about 1.63 GB. These are conservative artifact-transfer scenarios, not measured traffic. Current credit-plan rates are 20 credits/GB, 2 credits/10,000 requests and 15 credits/published production deploy. Free includes 300 monthly credits with a hard limit. Confirm the actual account is on a suitable plan, account-wide usage and recharge/add-on settings; a cohort limit does not cap public/bot traffic. The USD 10 limit is an agreed budget, not an installed spending cap. [Current plan/credit rules](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/).

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

Participants report problems to their course instructor through the course channel, giving the visible action, approximate time, browser version, release ID from release.json and the error message. Do not send exports, names, CVs, free text, audio or transcripts. An instructor escalates to the named hosting owner. The incident contact for this project is daniel.porebski@allegro.com; the operator must still confirm usable hosting access and notification receipt.

For capacity, sum the byte counts in release.json. Conservative uncached transfer is `artifact bytes × participant sessions`, plus the synthetic audio/PDF downloads and verification/monitoring requests. Compare with the chosen provider's traffic/request/storage limits, safety margin, spending cap and classroom concurrency; inspect real usage after release. Do not infer a supported cohort or cost from bundle size alone.
