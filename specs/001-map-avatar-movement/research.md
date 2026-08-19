# Phase 0 Research: Map, Avatar & Movement

## Decision: Unit-test movement/collision logic with Vitest; do not attempt automated
rendering assertions for the MVP

- **Rationale**: SvelteKit's default toolchain (Vite) integrates Vitest with zero extra
  config. The valuable, deterministic logic to test is pure (given input state + obstacle
  geometry, what's the resulting position/direction) and can be extracted from Phaser's
  render loop so it doesn't require a canvas/WebGL context to test. Asserting on rendered
  pixels/animation frames has low value relative to setup cost at MVP stage.
- **Alternatives considered**: Playwright component/visual tests (rejected for now — real
  payoff only once there's more than one screen/flow to regress-test; revisit post-MVP).
  No tests at all (rejected — the obstacle-collision and opposing-key-resolution rules in
  FR-004/FR-008 are exactly the kind of easy-to-regress logic worth locking down).

## Decision: Load the Tiled map via Phaser's built-in Tiled JSON loader; obstacles expressed
as a dedicated collision layer in the Tiled map

- **Rationale**: Phaser has first-class support for Tiled's JSON export, including tile
  layers and object layers usable for collision. This avoids hand-rolling a map format or a
  custom collision-authoring tool, keeping map authoring entirely inside Tiled as already
  decided in the project constitution.
- **Alternatives considered**: Encoding collision via a separate hand-maintained JSON file
  (rejected — duplicates authoring effort and risks drifting out of sync with the visual
  map); pixel-based collision against the tileset image (rejected — far more expensive and
  unnecessary when Tiled already supports explicit collision layers/properties).

## Decision: Run `apps/client` in SPA mode (`adapter-static` + `ssr = false` globally); mount
Phaser inside `onMount` purely for DOM-readiness, not to guard against SSR

- **Rationale**: The MVP has no route that benefits from server-side rendering — it's an
  entry form plus a canvas-based shared space, both inherently client-rendered (the entry
  form reads `localStorage`, the game needs a live `window`/`document`/canvas context). Per
  constitution Principle I (locked scope, no speculative infrastructure) and Principle IV's
  same reasoning applied here, provisioning SSR support for a hypothetical future marketing
  page is exactly the kind of complexity to avoid until there's a concrete need for it.
  `adapter-static` also means the built client is plain static files — simpler to serve and
  self-host (one less Node process), which fits constitution Principle VI's self-hostability
  goal. `onMount` is still used to instantiate `Phaser.Game` (the canvas element needs to
  exist in the DOM first), but its purpose is now purely lifecycle timing, not an
  SSR-crash guard, since SSR is disabled entirely at the adapter level.
- **Alternatives considered**: `adapter-node` with per-route `ssr = false` only on the game
  route (originally chosen, since superseded — rejected on reflection as unjustified
  complexity: it keeps a Node server process running for zero routes that currently use SSR,
  and per-route SSR could be reintroduced later via a mechanical adapter swap if a real need
  ever appears, so the "flexibility" bought little in practice); disabling SSR without
  switching to `adapter-static` (rejected — would still require a Node server process to
  serve what is, in practice, entirely static output).

## Decision: `@antfu/eslint-config` as the sole lint/format tool; no Prettier

- **Rationale**: `@antfu/eslint-config` ships a flat ESLint config with built-in stylistic
  (formatting) rules, TypeScript- and Svelte-aware out of the box, so a single tool covers
  both linting and formatting. Running ESLint and Prettier side by side is a common source of
  conflicting rules and double configuration; picking one config that already does both
  avoids that entirely and gives new open-source contributors one tool to learn, not two.
- **Alternatives considered**: ESLint + Prettier together (rejected — the exact redundancy/
  conflict risk this decision avoids); Prettier alone with a minimal ESLint setup (rejected —
  loses ESLint's ability to catch actual bugs/anti-patterns, not just formatting).

## Decision: `lint-staged` + a `simple-git-hooks`-managed `pre-commit` hook, not Husky

- **Rationale**: `simple-git-hooks` is a zero-dependency, minimal-config package for wiring
  git hooks (a single JSON/`package.json` field), and is the pairing `@antfu/eslint-config`'s
  own ecosystem/examples commonly use alongside `lint-staged`. Husky is heavier/more
  opinionated for what's needed here: run `eslint --fix` on staged files before each commit.
- **Alternatives considered**: Husky (rejected — more moving parts and its own config file
  for the same outcome); no pre-commit hook, relying on CI only (rejected — the whole point
  of `lint-staged` here is to catch lint issues before they're committed, not just before
  they're merged).

## Decision: A single root `AGENTS.md` as the source of truth for AI coding-agent
instructions; `CLAUDE.md` is a thin file that imports it

- **Rationale**: `AGENTS.md` is the emerging tool-agnostic convention for project
  instructions aimed at AI coding agents. Since this is an open-source project other
  contributors may work on with tools other than Claude Code, a single universal file avoids
  the instructions drifting out of sync across multiple tool-specific files. Claude Code
  specifically reads `CLAUDE.md`, so a minimal `CLAUDE.md` containing an `@AGENTS.md` import
  keeps it working for Claude Code without duplicating content.
- **Alternatives considered**: `CLAUDE.md` as the only file (rejected — ties the only
  documented agent instructions to one specific tool, working against the project's
  open-source/external-contributor goal); maintaining separate near-duplicate files per tool
  (rejected — guaranteed drift over time as one gets updated and others don't).

## Decision: Enforce kebab-case file names via `unicorn/filename-case`, configured inside the
same `@antfu/eslint-config` root config; exempt SvelteKit's reserved route filenames

- **Rationale**: `@antfu/eslint-config` already composes `eslint-plugin-unicorn`, so enabling
  `unicorn/filename-case` (`{ case: 'kebabCase' }`) as a rule override in the same
  `eslint.config.js` is a few lines, not a new tool — consistent with the project's "one
  config file" tooling philosophy. It applies repo-wide (client, server, shared package)
  since the config is root-level (see the separate decision on repo-wide ESLint below).
  SvelteKit requires exact reserved filenames for its routing convention (`+page.svelte`,
  `+layout.ts`, `+layout.svelte`, `+server.ts`, `+error.svelte`, etc.) — these aren't a
  developer's naming choice, so the rule's `ignores` must exclude `src/routes/**/+*` or the
  lint would permanently conflict with the framework itself.
- **Alternatives considered**: Enforcing naming via code review/convention only, no lint rule
  (rejected — exactly the kind of easy-to-drift consistency rule a linter should own instead
  of relying on humans to catch in review, especially with external OSS contributors);
  PascalCase for component/class files (a common alternative convention, e.g. `Avatar.ts`,
  `EntryForm.svelte`) — rejected per explicit project decision in favor of kebab-case
  uniformly across all source files, regardless of what they export.

## Decision: A single root-level ESLint config (`eslint.config.js`) covers the whole pnpm
workspace, not one config per package

- **Rationale**: ESLint's flat config format (which `@antfu/eslint-config` uses) is
  glob-based and designed to span multiple directories from one root file — `apps/client`,
  `apps/server`, and `packages/shared` are linted by the same config, with per-directory
  behavior (if ever needed) expressed as `ignores`/overrides inside that one file rather than
  as separate `eslint.config.js` files per package. This avoids N copies of the same config
  drifting independently as the monorepo grows, and gives external contributors exactly one
  place to look for lint rules regardless of which package they're touching.
- **Alternatives considered**: A per-package `eslint.config.js` in each of `apps/client`,
  `apps/server`, `packages/shared` (rejected — duplicates configuration for no behavioral
  benefit here, since all packages share the same TypeScript/lint conventions; would only be
  justified if packages needed genuinely different rule sets, which none currently do).

## Decision: Camera-follow via Phaser's built-in camera bounds + follow API, clamped to map
size

- **Rationale**: Phaser's `Camera.startFollow()` combined with `Camera.setBounds()` (set to
  the Tiled map's pixel dimensions) directly satisfies FR-006 (avatar stays visible, never
  reveals area outside the map) without custom viewport math.
- **Alternatives considered**: Hand-written camera clamping logic (rejected — reimplements
  what the engine already provides correctly).
