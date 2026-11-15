# E01 own-voice data guidance

## Intent

Document the approved participant exception that allows a participant to record their own voice in E01, while keeping synthetic case data and prepared CVs as the default. Make browser storage, full-scenario exports, persistence and deletion steps clear in participant guidance and the product privacy/settings/audio copy.

## Acceptance criteria

- The boundary permits only the participant's own voice; it prohibits recording others and including identifying or confidential details.
- Guidance explains that recordings/transcripts stay in browser storage, have no automatic expiry, and are included in full-scenario exports.
- Participants are told that anyone with access to the same browser can view its locally stored scenario and recordings.
- Reset, clearing this site's browser data and separate deletion of downloaded exports/recovery files are described accurately.
- `FEATURES.md` retains stable IDs and reflects the clarified privacy/audio/participant guidance behavior.
- No storage, export, recording or reset behavior changes; this task updates guidance and UI copy only.
- Run `./scripts/verify` and `npm run package:participant -- /absolute/output`; record actual results.

## Scope and review

- Reviewed `BRIEF.md`, `docs/case/CASE_PROTOCOL.md`, `docs/case/REAL_PERSON_TEST.md`, `TODO.md`, `FEATURES.md`, `docs/SECURITY.md`, `docs/PARTICIPANT_GUIDE.md`, `src/features/prototype/settings.tsx`, the E01 recorder and the required Poster People host/design-system references.
- Affected guidance: root `AGENTS.md`, participant/security/case protocol/real-person test guide and `FEATURES.md`.
- Affected UI copy: `/#/polityka-prywatnosci`, `/#/app/settings` and the E01 recording caption. No layout, styling or persistence code changes.
- Keep hosting-provider logging and any external retention policy unresolved; provider/domain has not been selected.

## Validation

- `PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` passed: Prettier, design-system integrity (67 files / 333 references and 6 example tests), lint, TypeScript, 33 unit tests, baseline packet verification (120 journeys), production build and all 40 browser journeys.
- `PLAYWRIGHT_CHANNEL=chrome npx playwright test tests/e2e/pre-interview.spec.ts --grep 'editing, deleting and restarting drafts preserve explicit saving and never enrich an ordinary submission' --workers=1` passed (1/1).
- `npm run package:participant -- /private/tmp/doroboty-readiness-own-voice-final2-20261114` passed. Inspection confirmed the package includes the own-voice, same-browser access, persistence and deletion instructions in the participant/security/real-person test guides; its manifest/baseline check succeeded and the temporary output was removed.
- The build still reports Zod/Rollup annotation notices and a JavaScript chunk above 500 kB; the full gate exited successfully.
- No deployment or hosted-link check was performed; hosting provider/domain remain unselected. A fixed retention duration remains undecided, and the product documents that local data has no automatic expiry.
