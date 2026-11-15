# Netlify readiness follow-up

## Intent and acceptance

Reassess readiness for the selected Netlify project and implement small local delivery fixes, preserving the distinction between the published source and the current candidate.

- Inspect the supplied deploy and public access without changing hosted settings.
- Keep build/output/Node version and static quality checks in repository configuration.
- Revalidate HTML/release metadata while caching hashed assets; preserve microphone recording and same-origin PDF previews.
- Document Netlify publication, privacy-safe diagnosis and rollback with current primary documentation.
- Record the approved audience (public participant link), owner/contact (daniel.porebski@allegro.com), maximum cohort (10) and monthly budget (USD 10). Do not infer a Netlify plan or operator permissions.
- Make support contact available in the existing Settings screen, using existing typography/link treatment. No new layout or styling recipe.
- Run ./scripts/verify, participant packaging and a separate review; refresh the single readiness report. Do not commit, push, deploy, alter access protection or send email.

## Initial observations (2026-11-15)

- Netlify project: precious-starship-7cc1a2. The supplied deploy 6af9e16d20bdf30039c44742 and public deploy list both show published main at 81682a81c186e9065ec8fab4d7bd368556fdfe6a. Local HEAD is 747e6964c4ae5cf4296685969d68b89a776fbe8b (includes E01/publication safeguards).
- The deploy log reports no configuration file, npm run build (tsc + Vite only), and publish directory dist. No current-source release manifest is established for that old deploy.
- Anonymous requests to the canonical address and supplied immutable-deploy address returned HTTP 401. Browser navigation shows Netlify Team protection: an invited Netlify account is required. The user selected a public participant link; protection and current-source publishing need account access.
- Public panel access is read-only without a signed-in account. User says GitHub is connected; the public overview also says the last deployment was from Netlify Drop. Inspect actual repository/branch/build settings when signed in rather than assuming auto-publish is established.

## Execution evidence

- User confirmed public access, contact daniel.porebski@allegro.com, maximum 10 participants and USD 10 monthly budget. These are recorded decisions; account billing controls and successful alert delivery are not inferred.
- Added netlify.toml: Node 24, npm run check:static, dist-only publishing, explicit HTML/manifest cache rules and immutable hashed-asset caching. Headers retain same-origin PDF framing and microphone recording. No catch-all rewrite or external service added.
- Extracted the existing non-browser gate into check:static; full check/verify still adds all browser journeys. Added the Netlify config to the allowlisted participant package. Added a native support email link/privacy-safe reporting text to the existing Settings composition; viewed the resulting narrow-screen capture with complete email wrapping.
- Bundled TOML parser accepted netlify.toml and confirmed build command, output directory, Node version and no catch-all rewrite.
- PLAYWRIGHT_CHANNEL=chrome ./scripts/verify exited 0: formatting, design-system integrity/examples, lint, types, 36 unit tests, baseline verification, build and all 43 browser journeys. No browser/system installation.
- npm audit returned 12 development-tool findings (2 low / 10 moderate, no high/critical). npm audit --omit=dev returned 0 runtime findings. The previously documented development-tool impact assessment still applies; no dependencies changed in this task.
- npm run package:participant -- /private/tmp/doroboty-netlify-participant-20261115 passed; inspection confirmed netlify.toml and the Netlify procedure are included and .git/docs/source are excluded.
- npm run verify:release and npm run package:release passed. Final artifact 78744088e4413adf67d9723b7928965515d0e22bdb1854cb871e214585ba5cea contains 37 static files / 16,259,457 bytes excluding release.json.
- A disposable corrupt artifact failed integrity verification; restoring the retained directory and running static smoke at http://127.0.0.1:52053/ passed for all 37 files. The temporary server stopped after rehearsal.
- Remote npm run smoke:release at the canonical Netlify address exited 1 on HTTP 401 for release.json. Browser independently showed private Team protection. No application journey or current-candidate asset identity could be verified on Netlify.
- Separate review checked static/full gate equivalence, no source/instructor publishing, header scope and no effect on browser-data origins, compatibility with local audio/PDF flows, contact link semantics, and the distinction between prepared source config and observed old deployment. All project checks passed; Netlify settings, current-source publication, account plan/spend cap, request logs and notification delivery remain external checks.
- No commit, push, deployment, protection change or email was performed. Public configuration pages were available, but authenticated settings were not; the runbook provides the exact owner actions and current Netlify references.
