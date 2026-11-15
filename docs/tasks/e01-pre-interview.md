# E01 — candidate project pre-interview

## Intent and approved scope

On 2026-11-08 the user approved the proposed E01 screens: an optional pre-interview within the application form, candidate review/approval, a read-only submitted record, recruiter enrichment indicators/filter and a source-linked recruiter report. This prepares the usability path for O01/I02; it does not execute the original experiment with a real model. The Supersprint source remains separate from prototype state.

## Acceptance criteria

- Keep Poster People v1.0.0, existing Base UI primitives/render composition, hash routes, prepared personas and local workflows. Keep the immutable kit unchanged.
- Analyze a project using an explicitly simulated three-question script about contribution, decisions and results. Never invent project-specific claims.
- Candidates can save, edit and delete text/audio answers before approval. Real recording stays in the browser, has a bounded duration/size, releases microphone tracks and requires a candidate-written transcript. A labelled synthetic voice example supplies matching audio/transcript.
- Persist explicit drafts, recordings and transcript edits across reload and scenario export/import. Old version-1 scenarios remain compatible. Report unavailable microphone/storage and quota failures without claiming successful saving/approval.
- Approval validates all three answers and freezes the project/questions/answers. Submission is a separate consent/action; only approved, submitted material reaches the employer. Ordinary applications can omit the optional pre-interview.
- Reject attempts to rewrite approved material or attach an unapproved/mismatched interview. Keep submitted identity/CV/material snapshots immutable and role/company/person projections intact.
- Recruiter list shows completed pre-interviews and supports filtering. The detail shows source-linked extractive demo summaries, full approved text/transcript/audio, interview question suggestions and a separately labelled fixed illustrative credibility percentage, with no real assessment claim.
- Candidate submitted detail exposes only their approved materials, never employer notes or the employer-only report.
- Check desktop/mobile/320px, long content, keyboard/focus, error and recovery paths; run ./scripts/verify and a separate review. Update FEATURES.md and current behavior documentation in this change.

## Implementation decisions

- Use optional additive version-1 fields and shared Zod schemas. Store bounded audio data URLs with the existing scenario JSON, so reset/export/import include recordings without a backend or separate database.
- A new approval operation reads the saved draft, rather than trusting caller-supplied approval flags. Submission attaches the approved saved snapshot, never a caller-supplied report. Description changes require explicitly restarting the draft interview before approval.
- Simulated reports quote/excerpt actual approved answers with stable source IDs. The illustrative 78% is fixed and explicitly not computed from the candidate's responses.
- Use durable-save operations for interview drafts, approval and enriched submission; preserve the existing recovery behavior for other local operations.

## Validation and review

### Executed checks

- `PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` passed on the final implementation: formatting, immutable kit integrity (67 files / 333 references / six kit tests), ESLint, TypeScript, 33 unit tests, baseline packet verification (120 journeys), static build and 40 browser journeys, including six E01 journeys. Full output is in ignored `artifacts/e01-verify.log`.
- Default `./scripts/verify` initially reached browser startup and failed because local listening was restricted. After granting local execution, default Playwright startup found no provisioned Chromium binary. No browser or OS dependency was installed. The final gate explicitly used already installed Google Chrome through the optional `PLAYWRIGHT_CHANNEL` setting; the Playwright project name remains `chromium`.
- Earlier browser failures identified an accessible-name duplication in application consent and stale keyboard expectations after inserting the optional CTA. The duplicate label was fixed and keyboard journeys now assert the new control order. Chrome's bundled PDF viewer resources are excluded from web-egress assertions; external web requests are still rejected. All these journeys passed in the final gate.
- E01 journeys exercised text/audio demo approval and separate submission; draft save/edit/delete/restart; normal submission without an approved interview; candidate report omission; company boundaries; source-link keyboard focus and copied/reloaded URLs; actual MediaRecorder with a synthetic test microphone; track release on stop and route departure; audio/transcript reload and import; denied microphone and failed durable saves/approval/submission; long Polish project/title/answer content and 320/390/1280px candidate layout. Recruiter reflow was checked at 320/390/700/850/950/1280px. Axe found no violations in the checked enriched recruiter and approved candidate screens.

### Separate review pass

- Re-read the completed schemas, transitions, persistence boundary, recording lifecycle, role projections and changed integration code independently of implementation. Corrected the synthetic-audio URL to use Vite's base path, and made sans summary labels body labels rather than overriding the required Serif heading family.
- Compared the running application in the in-app browser and recruiter desktop/mobile captures with the local source roles and preserved S01/S03 references: local Geist Serif 400, paper/white/ink/pink, source contours, shared controls and a single reading sheet. Started the source catalog on port 8952; its source-kit verification passed unchanged. E01 recording/report states are explicitly documented host extensions, not a new immutable kit version.
- The application already running on port 3001 was reused; a second dev process was not started because that port was occupied. Left a visible candidate pre-interview draft open for user review. Screenshots: ignored `artifacts/e01-recruiter-preview.png`, `e01-recruiter-{1280,390,320}.png` and `e01-candidate-approved-{1280,390,320}.png`.
- Updated FEATURES.md (CAN-09/10/11/13/15/17/19/20, EMP-07/08/11, OPS-06), the brief/protocol, export/privacy copy, host component/record/verification guides and explicit Chrome fallback instructions. Historical case data and the immutable kit were not changed.

### Scope and remaining limits

This is a local usability prototype on `codex/e01-pre-interview`, not an executed customer experiment or validation of model quality, credibility, hiring outcomes or Supersprint thresholds. No real AI, automatic transcription, backend, database connection or telemetry was added. Physical microphone hardware, non-Chrome browsers, CI and deployment were not verified. Own audio requires manual transcript text and explicit save; the existing 2 MB whole-scenario budget still applies, with retained editable text on quota failure. Existing unrelated company-page findings remain open. No merge or deployment was performed.
