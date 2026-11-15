# Participant guide

## Start

Use the prepared baseline package and Node.js 24 with npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. If Node or registry access is blocked by your organization, ask your instructor/IT rather than bypassing the policy.

## Try a complete flow

1. Choose Anna Kowalska and browse offers.
2. Save an offer, edit the profile and submit an approved application. Source notes and the editable proposal are separate.
3. Choose Karolina Wiśniewska for BrightLabs and review its candidates.
4. Record review, invitation, conversation and the next decision.
5. Return to Anna and inspect the application history.

Karolina and Tomasz see their respective companies in the interface; this is role simulation. Scenario data is synthetic. CVs are prepared text examples, not real uploads. In optional E01, you may record only your own voice; do not record another person or include names, contact details or confidential information in the audio or transcript. Anyone who can use this browser can read its locally saved scenario and recordings. AI proposals and scores simulate the scenario.

## Save, share and recover

Changes survive reload in this browser. An E01 pre-interview containing a personal recording, all its answers/transcripts and its derived report expire seven days after recording. The app deletes it on startup, import/export, while open (checked every minute) and on return to the window. A closed browser cannot run deletion; cleanup happens on the next launch. Undated legacy recordings expire immediately. Use your own device or a separate browser profile. Settings can export a JSON file, import a scenario or reset to fixtures. Import/reset asks before replacing state. Reset replaces participant changes with baseline fixtures; clear this site's browser data to remove the local copy. If a save is incompatible, download the original before resetting. Storage failure is shown explicitly; export before closing the tab. Only one editing tab is allowed per origin. Other tabs cannot edit/import/reset until the owner closes and the other tab reloads. Unsupported browsers cannot edit; use a current browser over HTTPS or localhost.

A URL shares the interface, not your local changes. To transfer a scenario, share the exported file and import it in the other browser. Exports include all personas, applications, notes, recordings and transcripts. Anyone with the file can read its contents. Exported files are not automatically deleted; delete them after the exercise. Importing an old file removes expired interviews without extending the seven-day window. Delete exported and recovery files separately from the browser copy, for example from your downloads folder.

## Static build

Run npm run build. Serve dist/ through any static HTTP host. No provider account is needed for local development. Do not open index.html via file://; ES modules need HTTP. Hash links work without route rewrite configuration.

## Verification

Run ./scripts/verify or npm run check. Browser tests require provisioned Playwright Chromium; a missing test browser does not prevent npm run dev. Do not let an agent install system dependencies automatically.
