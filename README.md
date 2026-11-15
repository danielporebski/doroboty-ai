# DoRoboty.ai — AIPH3 prototype

A frontend-only job marketplace for participants to extend and test. Built with React, TypeScript and Vite, using Base UI components. The required visual direction for new and changed screens is the accepted Poster People design system.

## Design system — start here for UI work

Read [project integration instructions](docs/design-system/README.md), [host implementation rules](docs/design-system/IMPLEMENTATION.md) and [application acceptance checklist](docs/design-system/VERIFICATION.md), then [design.md](docs/design-system/agent-kit/design.md), [component API](docs/design-system/agent-kit/components/API.md) and the relevant [human documentation](docs/design-system/agent-kit/reference/index.html). The complete 67-file kit is stored under docs/design-system/agent-kit, including reusable CSS/JS, component states, listing/offer examples, screenshots, Geist Serif with license and illustration. No other chat or global skill is required.

```sh
npm run design-system:check
npm run design-system:dev
```

With Node 24, the first command verifies the preserved kit and examples; the second serves a separate local preview at http://127.0.0.1:8952/. No kit installation is needed. The main app uses port 3001 as below.

Build UI from this system, adapting its anatomy and visual roles into the existing React/Base UI components and host tokens. Preserve application behavior and hash routing; do not replace product state with the standalone demo fixtures/controllers. The application has a host adaptation. For every UI task, compare the affected anatomy, type roles, state and keyboard behavior with the reference; passing kit checks alone does not establish visual acceptance. See the integration guide for exact reading order, assets, React mapping, responsive rules and verification. AGENTS.md and CLAUDE.md enforce the same direction.

## Run

Requirements: **Node.js 24 and npm**.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3001. No environment file, account, database or additional service is required. Package installation requires access to the npm registry.

## Optional PostHog analytics

The app's only event property is a fixed screen category in `prototype_screen_viewed` events. It does not send full URLs, query strings, search terms, form values, persona or record IDs, CVs, notes, transcripts or audio. Automatic click/input capture, session replay, person profiles and browser persistence are disabled. PostHog still attaches a temporary anonymous technical ID while the page is open. Analytics remains off unless `VITE_POSTHOG_ENABLED=true` and a project token are both configured.

For local testing, copy `.env.example` to `.env.local`, then set `VITE_POSTHOG_ENABLED=true` and `VITE_POSTHOG_PROJECT_TOKEN` from the PostHog project's settings. The host defaults to EU ingestion at `https://eu.i.posthog.com`. The project token is a public client token and is included in the built JavaScript when enabled.

For a deployed build, set those variables in the hosting provider's build environment and redeploy. Before enabling collection, turn on **Discard client IP data** in the PostHog project settings; PostHog otherwise receives the client IP with capture requests. See [PostHog's React setup](https://posthog.com/docs/libraries/react) and [IP data control](https://posthog.com/tutorials/web-redact-properties).

Select Anna or Marek as a candidate, Karolina or Tomasz as an employer, or the instructor. Publish a job, apply, switch person and record the employer decision. Changes survive reload in this browser; settings provide export, import and reset. AI and scores simulate prepared scenarios. Use example CVs only.

## Build and verify

```sh
npm run build
npm run preview
./scripts/verify
```

The static output is dist/. Browser checks require an already provisioned Playwright Chromium; starting the app never installs it. See [participant guide](docs/PARTICIPANT_GUIDE.md), [architecture](docs/architecture.md), [current features](FEATURES.md) and [case protocol](docs/case/CASE_PROTOCOL.md).

If Playwright Chromium is absent and Google Chrome is already installed, run `PLAYWRIGHT_CHANNEL=chrome ./scripts/verify` to explicitly use that browser. Report the actual channel used; this does not install browsers or system dependencies.

To distribute a baseline participant package, run npm run package:participant -- /absolute/output/directory. This excludes Git history and instructor source material. Never distribute this repository’s history as a stage-safe packet.

## Participant publishing

See [release and recovery procedure](docs/RELEASE.md) for creating a retained static artifact, checking its identity, smoke checks, rollback, privacy-safe support and the remaining provider/owner decisions. A successful local gate does not publish a participant URL.
