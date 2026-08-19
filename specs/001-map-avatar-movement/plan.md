# Implementation Plan: Map, Avatar & Movement

**Branch**: `001-map-avatar-movement` | **Date**: 2026-08-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-map-avatar-movement/spec.md`

## Summary

Render the single shared office map and let the local user move a 2D avatar around it with the
keyboard, blocked by map-defined obstacles, with directional/idle animation and camera-follow on
a map that may exceed the viewport. This is a client-only feature: Phaser owns rendering and
input inside a SvelteKit page, using a Tiled-authored map. No network, persistence, or account
concerns are part of this feature.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+ (SvelteKit build/dev tooling)

**Primary Dependencies**: SvelteKit (host app/routing), Phaser.js (2D rendering, input, physics
for obstacle collision), Tiled JSON map export (consumed via Phaser's built-in Tiled loader).
Repo-wide tooling (not feature-specific, set up once here since this is the first feature):
`@antfu/eslint-config` (lint + format, no Prettier), `lint-staged` + `simple-git-hooks`
(pre-commit lint), a root `AGENTS.md` + thin `CLAUDE.md` for AI coding-agent instructions.

**Storage**: N/A — no persistence in this feature (per constitution Principle IV)

**Testing**: Vitest for unit tests of pure movement/collision logic (decoupled from Phaser's
render loop where possible); manual/quickstart validation for the rendered experience, since
canvas-rendering assertions provide little value relative to their cost at MVP stage

**Target Platform**: Desktop web browsers (evergreen Chrome/Firefox/Safari); `apps/client` runs
as a SvelteKit SPA (`adapter-static`, SSR disabled globally) built to static files — served as
plain static assets, no Node runtime required for the client

**Project Type**: Web application — client package within the monorepo

**Performance Goals**: Sustained ~60fps render loop; local input-to-render response with no
perceptible lag (target <50ms)

**Constraints**: Phaser's canvas/WebGL renderer needs a live `window`/`document`/canvas
context; instantiated inside `onMount` so it only runs once the DOM element exists (see
research.md — with SSR disabled at the adapter level, this is a lifecycle-timing concern, not
an SSR-avoidance guard)

**Scale/Scope**: Single fixed map, single shared room; local-avatar rendering only in this
feature (remote avatars arrive via the realtime sync feature and reuse the same Avatar
rendering unit)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Locked MVP Scope** — PASS. Feature implements only the map+avatar+movement slice listed
  in `docs/mvp-plan.md`; no zones, no map editor, no extra maps.
- **II. Simplest Proximity Architecture First** — N/A to this feature (owned by the proximity
  A/V feature); no conflict.
- **III. No Backend-Persisted Identity** — PASS. This feature holds no identity data; avatar
  visual type is passed in, not decided here.
- **IV. No Database in the MVP** — PASS. No storage of any kind is introduced.
- **V. Fixed Technology Stack** — PASS. Uses exactly SvelteKit + Phaser + Tiled; no new stack
  element introduced.
- **VI. Open Source, Self-Hostable, Packaging Deferred** — N/A to this feature; no packaging
  concerns here.

No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-map-avatar-movement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
AGENTS.md                             # Universal AI coding-agent instructions (source of truth)
CLAUDE.md                             # Thin file: imports AGENTS.md (@AGENTS.md) for Claude Code
eslint.config.js                      # @antfu/eslint-config, repo-wide, no Prettier
.lintstagedrc.json                    # lint-staged: runs eslint --fix on staged files
package.json                          # "simple-git-hooks" field wiring the pre-commit hook

apps/
└── client/                          # SvelteKit application (SPA mode: adapter-static)
    ├── svelte.config.js              # adapter-static + SPA fallback page
    ├── src/
    │   ├── routes/
    │   │   ├── +layout.ts            # export const ssr = false (disables SSR app-wide)
    │   │   └── +page.svelte         # Hosts the game canvas, mounts Phaser in onMount
    │   └── lib/
    │       ├── game/
    │       │   ├── scenes/
    │       │   │   └── office-scene.ts       # Loads map + tileset, spawns local Avatar
    │       │   ├── entities/
    │       │   │   └── avatar.ts            # Sprite, animation state machine (idle/walk × 4 dir)
    │       │   └── input/
    │       │       └── movement-controller.ts  # Keyboard → movement intent, focus-loss handling
    │       └── assets/
    │           ├── maps/
    │           │   ├── office.json          # Tiled map export (walkable area + obstacle layer)
    │           │   └── office-tileset.png
    │           └── sprites/
    │               ├── avatar-man.png
    │               └── avatar-woman.png
    └── tests/
        └── unit/
            └── movement-controller.spec.ts  # Vitest: input → movement intent, opposing-key
                                              #         resolution, focus-loss stop

packages/
└── shared/
    └── src/
        └── avatar.ts                 # AvatarState type (position, direction, motionState,
                                       # spriteType) — consumed by 002-realtime-multiplayer-sync
```

**Structure Decision**: Monorepo with an `apps/client` SvelteKit app owning all rendering/input
for this feature, and a `packages/shared` package holding the `AvatarState` type so the future
realtime-sync feature (002) can reuse the exact same shape over the network instead of
redefining it. No `apps/server` involvement in this feature. `apps/client` runs in SPA mode
(`adapter-static`, SSR disabled globally) per research.md — the build output is static files,
consistent with the constitution's local-dev and self-hostability goals. This feature also
establishes the repo-wide tooling baseline (ESLint via `@antfu/eslint-config`, `lint-staged` +
`simple-git-hooks`, `AGENTS.md`/`CLAUDE.md`) once, at the repository root, since it's the
first feature and every later feature's code is expected to already comply with it.

## Complexity Tracking

*No violations — table omitted.*
