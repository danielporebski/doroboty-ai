# GitHub project synchronization

## Intent

Publish the current local project to the user's existing GitHub repository,
`danielporebski/doroboty-ai`, as requested on 2026-11-15. Preserve the current
`codex/e01-pre-interview` branch and the existing repository visibility.

## Acceptance criteria

- Review the pending files and exclude generated output, dependencies, local
  environment files and credentials from the commit.
- Preserve the existing E01, participant guidance and publication preparation
  work without changing product behavior during synchronization.
- Run `./scripts/verify` with the documented installed Chrome channel and record
  actual results and any limitations.
- Complete a separate review pass before committing. No merge is required.
- Push the current branch and confirm that its remote revision matches the local
  commit. Keep the existing `main` branch unchanged.
- Review `FEATURES.md`; this synchronization requires no additional behavior
  entries.

## Validation and outcome

- `PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` passed: formatting, immutable
  design-system integrity (67 files / 333 references and six example tests),
  lint, TypeScript, 36 unit tests, the 120-journey baseline packet, production
  build and all 43 browser journeys. The installed Google Chrome was used;
  no browser binaries or system dependencies were installed.
- The first restricted run passed through the build but could not start the
  local browser-test server (`listen EPERM` on 127.0.0.1:3106). Re-running the
  same gate with local server execution allowed exited successfully. The
  successful log is outside the repository at
  `/private/tmp/doroboty-github-sync-verify-unrestricted-20261115.log`.
- Existing build notices concern dependency comment annotations and a
  JavaScript chunk above 500 kB; they did not fail the gate.
- Reviewed 287 repository files before publication. Common credential/private
  key patterns produced no findings; no file reaches 50 MB. Confirmed that
  dependencies, build output, test artifacts and environment files are ignored.
  The bundled WAV is documented synthetic speech, not a participant recording.
- Completed a separate review of pending task evidence, data boundaries,
  interview approval/persistence, audio lifecycle, retention, writer-lock
  integration, release tooling and repository exclusions. No additional source
  changes were required. The immutable design kit remains unchanged.
- `FEATURES.md` was reviewed; the existing feature changes describe the pending
  implementation, and synchronization itself adds no behavior.
- GitHub confirms the repository belongs to `danielporebski`, is public and is
  writable by the active account. Commit attribution uses that verified login
  and its GitHub noreply address without changing global Git configuration.
- Delivery targets only `codex/e01-pre-interview`. The remote revision is checked
  after pushing and reported in the chat; no merge, site deployment or CI result
  is claimed.
