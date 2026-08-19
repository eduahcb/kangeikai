<!--
Sync Impact Report
- Version change: 1.2.0 → 1.3.0
- Modified principles: V. Fixed Technology Stack (added repo-wide tooling: ESLint via
  @antfu/eslint-config with no Prettier, lint-staged + simple-git-hooks pre-commit hook,
  and AGENTS.md as the single AI-instructions source with CLAUDE.md as a thin importer)
- Added sections: none
- Removed sections: none
- Follow-up TODOs: none

Sync Impact Report (1.2.0, superseded above)
- Version change: 1.1.0 → 1.2.0
- Modified principles: V. Fixed Technology Stack (added SPA mode / adapter-static / SSR
  disabled globally as an explicit stack constraint, with rationale)
- Added sections: none
- Removed sections: none
- Follow-up TODOs: none

Sync Impact Report (1.1.0, superseded above)
- Version change: 1.0.0 → 1.1.0
- Modified principles: none
- Added sections: none (expanded "Technology & Infrastructure Constraints" with a local
  development environment requirement)
- Removed sections: none
- Follow-up TODOs: none

Sync Impact Report (1.0.0, superseded above)
- Version change: [TEMPLATE] → 1.0.0 (initial ratification)
- Modified principles: n/a (first version)
- Added sections: Core Principles (I–VI), Technology & Infrastructure Constraints, Development Workflow, Governance
- Removed sections: none
- Follow-up TODOs: none — all placeholders resolved from docs/mvp-plan.md
-->

# Kangeikai Constitution

## Core Principles

### I. Locked MVP Scope
The MVP delivers exactly: a 2D avatar that moves freely on a single fixed map, and
proximity-based voice/video chat. No feature is added to the MVP that is not explicitly
listed as in-scope in `docs/mvp-plan.md`. Explicitly excluded from the MVP: text chat,
multiple rooms/zones, avatar appearance customization beyond two fixed sprites, user
accounts, and persistent server-side storage.
**Rationale**: A single solo maintainer with no deadline is the highest risk of scope
creep killing the project before it ships. A hard-locked scope is what makes "done" a
reachable, checkable state.

### II. Simplest Proximity Architecture First
Voice/video proximity is implemented as: all participants join a single LiveKit room;
proximity is simulated purely on the client by adjusting per-participant volume based on
avatar distance. Dynamic subscribe/unsubscribe to peer media tracks, spatial audio zones,
or isolated-audio meeting rooms are NOT implemented in the MVP, regardless of perceived
scalability benefits.
**Rationale**: The all-in-one-room approach is trivial to build and reason about. It does
not scale to hundreds of concurrent users, but the MVP's job is to validate the core
experience, not to handle load it does not yet have.

### III. No Backend-Persisted Identity
Users join as guests. There is no login, no user accounts, and no server-side identity
store. Chosen name and avatar sprite are persisted only in the browser's `localStorage`
and do not survive a change of device or browser. Any feature that would require
identifying a returning user across sessions/devices is out of scope for the MVP.
**Rationale**: Accounts and auth are a well-known effort sink with no payoff for
validating whether the core "walk around and talk to nearby people" loop is worth
building further.

### IV. No Database in the MVP
Colyseus holds all room state in memory for the lifetime of the process. No relational or
document database (including Postgres) is introduced until a specific feature requires
data to survive a server restart or be queried outside the running room process.
**Rationale**: Without accounts, there is nothing relational to persist yet. Adding a
database ahead of a concrete need is speculative infrastructure that has to be maintained,
migrated, and deployed for no MVP-facing benefit.

### V. Fixed Technology Stack
The MVP is built exclusively on: SvelteKit (client UI), Phaser.js (2D rendering/game
engine), Tiled (map authoring/format), Colyseus (realtime multiplayer state sync), LiveKit
self-hosted (voice/video), and a pnpm-workspaces monorepo. Turborepo or other build
orchestration tooling is not introduced until build times demonstrably justify the added
complexity. Substituting or adding a technology to this list requires an explicit
amendment to this constitution, not an ad-hoc decision during implementation.

`apps/client` runs as a SvelteKit SPA: `adapter-static` with server-side rendering disabled
globally (`ssr = false`), producing a static build with no Node runtime required to serve
it. No route uses SSR or prerendering in the MVP, since none currently benefits from it.
Reintroducing SSR for a specific future route (e.g. a public marketing page) requires an
explicit amendment to this principle, not an ad-hoc per-route change.

Repository-wide tooling is also fixed: ESLint using `@antfu/eslint-config` is the sole
linter/formatter — Prettier is explicitly NOT used, since the antfu config's stylistic rules
already cover formatting through ESLint. Staged files are linted at commit time via
`lint-staged`, wired to a `simple-git-hooks`-managed `pre-commit` git hook. AI coding-agent
instructions live in a single root `AGENTS.md` (the tool-agnostic convention, appropriate for
an open-source project other contributors may work on with tools other than Claude Code);
`CLAUDE.md` exists only as a thin pointer that imports `AGENTS.md` for Claude Code
compatibility, and is never a second, diverging source of instructions.
**Rationale**: The stack was deliberately chosen and grilled through alternatives already;
re-litigating it mid-implementation wastes the solo maintainer's limited time and
fragments an open-source codebase new contributors need to understand quickly. SPA mode
follows the same reasoning as Principle IV (no database): don't provision infrastructure
for a need that doesn't exist yet — an `adapter-node` server kept running for zero SSR
routes would be exactly that. A static build is also simpler to self-host. One linter
instead of a linter-plus-formatter pair, and a single universal agent-instructions file
instead of one per tool, both reduce the number of things a new contributor has to learn
before their first PR — directly serving this project's open-source, external-contribution
goal.

### VI. Open Source, Self-Hostable by Design, Packaging Deferred
The project is licensed AGPL-3.0 specifically so that anyone running it as a public
service must also share their source. Every architectural decision should keep
"a third party can eventually run this on their own server" plausible, but building and
documenting a generic, turnkey self-hosting experience (e.g. a polished `docker-compose`
setup for third parties) is explicitly deferred to post-MVP and must not block or delay
MVP delivery.
**Rationale**: Optimizing for other people's deployments before the architecture has
stabilized on the maintainer's own deployment leads to repeated, wasted rework.

## Technology & Infrastructure Constraints

- Stack is exactly as listed in Principle V; see `docs/mvp-plan.md` for the full
  per-layer table.
- MVP deployment target: a single Hetzner VPS managed via Coolify.
- Known infrastructure risk to resolve during implementation (not a product decision):
  LiveKit self-hosted requires a directly exposed UDP media port range plus TURN/STUN
  configuration, since Coolify's default reverse proxy (Traefik) only handles HTTP/TCP
  traffic well.
- Repository is a single pnpm-workspaces monorepo; no polyrepo split during the MVP.
- Local development MUST be self-sufficient without manual third-party setup: a
  `docker-compose` file at the repository root runs a LiveKit dev server locally (the one
  piece of the stack that is impractical to run natively). `apps/server` (Colyseus) and
  `apps/client` (SvelteKit) run via native `pnpm dev` processes, not containers, to keep
  hot-reload fast. This is a developer-experience requirement, distinct from — and does not
  reopen — Principle VI's deferral of a turnkey self-hosting package for third-party
  production deployments.

## Development Workflow

- Solo-maintained, open to external open-source contributions, with no fixed deadline.
- Work is broken down using Spec Kit (`/speckit-specify` → `/speckit-plan` →
  `/speckit-tasks` → `/speckit-implement`), organized as one spec per subsystem
  (e.g. map/avatar/movement, realtime sync, proximity audio/video, guest entry flow)
  rather than one monolithic MVP spec.
- Tasks produced by `/speckit-tasks` must be atomic and self-sufficient: each task is
  independently understandable and implementable without requiring simultaneous
  knowledge of unfinished sibling tasks.
- Repository push, issue registration, and deployment work are sequenced deliberately
  after specs/plans/tasks exist for a subsystem — they are not started opportunistically
  mid-planning.

## Governance

This constitution supersedes ad-hoc technical or scope decisions made during
implementation. Any change to a Core Principle, the fixed technology stack, or the
locked MVP scope requires an explicit amendment to this file before implementation
proceeds on that basis.

Amendment procedure: propose the change, update this file via the constitution workflow,
bump the version per the policy below, and record the change in the Sync Impact Report
comment at the top of this file.

Versioning policy (semantic versioning applied to governance):
- MAJOR: Backward-incompatible removal or redefinition of a principle (e.g. unlocking the
  MVP scope, changing the licensing model, dropping a stack constraint).
- MINOR: A new principle or materially expanded section is added.
- PATCH: Wording clarifications and non-semantic refinements.

Compliance review: before starting a new subsystem spec, verify its scope and technical
approach against this constitution; deviations must be justified in that spec's
Complexity Tracking section or trigger a constitution amendment first.

**Version**: 1.3.0 | **Ratified**: 2026-08-18 | **Last Amended**: 2026-08-18
