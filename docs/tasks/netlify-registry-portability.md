# Portable package downloads for Netlify

## Intent and acceptance

The automatic deployment of 3a0b0b9 started successfully, but failed installing dependencies because the lockfile contains corporate Artifactory tarball URLs unreachable from Netlify. Restore portable URLs for those public npm packages without changing the dependency graph.

- Replace only the corporate registry prefix in resolved tarball URLs with the public npm registry prefix, matching the existing majority of the lockfile.
- Preserve every package version, integrity hash and dependency edge.
- Keep the developer's npm registry configuration unchanged; add no corporate credentials to hosting or source.
- Run ./scripts/verify, review the resulting diff, commit and push the fix under the user's authorization to publish the local changes to GitHub/main.
- Confirm that the next Netlify build uses the fix and report its actual outcome.
- FEATURES.md reviewed: no product behavior changes; this fixes dependency download portability only.

## Evidence

Initial failure: Netlify deploy 6af9e57ccb2cd269cc63de47 reported ECONNRESET fetching @typescript-eslint/typescript-estree 8.72.2 from artifactory.allegrogroup.com during dependency installation. The lockfile had 18 corporate tarball URLs and 469 public registry URLs.

- Replaced exactly 18 resolved URL prefixes; a deep comparison verified that all other lockfile fields, including versions, integrity hashes and dependency edges, remain identical.
- Downloaded all 18 tarballs from the public registry and independently verified their bytes against the existing integrity hashes; all matched. No downloaded code was executed during this check.
- PLAYWRIGHT_CHANNEL=chrome ./scripts/verify exited 0: formatting, kit integrity/examples, lint, types, 36 unit tests, baseline verification, build and all 43 browser journeys passed.
- Separate review confirmed only public package download addresses changed; no registry config, credentials, product behavior or package versions changed. FEATURES.md needs no update.
