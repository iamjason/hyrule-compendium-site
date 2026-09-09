# Conventions

Rules for keeping the Compendium coherent as it grows. These are conventions,
not schema constraints — the validator will not catch a violation of most of
them, but a future me will.

## Naming a tool

Tools are named after **Zelda flora, fauna, and small folk** — things that
help, hide, or grow. Not places, not weapons, not bosses.

Good: `korok`, `deku`, `sheikah`, `bokoblin`
Avoid: `hyrule`, `masterSword`, `ganon`

Constraints that matter:

- **`command` is lowercase, hyphen-separated, and unique across all tools.**
  It becomes the URL (`/tools/<command>/`) and the binary name. Two tools
  claiming the same `command` means the second one silently loses its detail
  page — the fetch script emits a warning when it detects this.
- **`name` is the display form** — capitalize it properly (`Korok`, not `korok`).
- **The repo name should equal the `command`.** Not enforced, but the fallback
  slug is derived from the repo name, so a mismatch only shows up when the
  manifest is broken.

## Writing a tagline

One sentence. Present tense, third person, describes what the tool *does for
you* — not what it is.

> ✅ `Finds what is hidden in your repo.`
> ✅ `Grows a reproducible dev environment from one seed file.`
> ❌ `A CLI tool for searching repositories.`  (describes the category, not the value)
> ❌ `Blazingly fast repo search 🚀`  (adjectives instead of behaviour)

Max 120 characters — it has to fit on a card at mobile width without wrapping
to four lines. End with a period.

## Choosing a category

Every tool goes on exactly one shelf. Pick by **what the user is trying to do**,
not by implementation.

| Category | For tools that… |
|---|---|
| `build` | compile, bundle, package, or release artifacts |
| `time` | schedule, watch, time, or track duration |
| `search` | find, index, or surface things that already exist |
| `move` | copy, sync, migrate, or transform data between places |
| `guard` | lint, validate, audit, or block bad states |
| `environment` | provision, configure, or manage dev environments |
| `knowledge` | document, explain, or generate reference material |

If a tool genuinely fits two, pick the one matching the *primary* command.
`knowledge` is the fallback the pipeline assigns when a category is missing or
unrecognized — do not use it as a dumping ground.

## Choosing a status

| Status | Means |
|---|---|
| `stable` | Semver is real. Breaking changes get a major bump. Safe to depend on. |
| `beta` | Works, but the interface may still move. Pin a version. |
| `experimental` | A sketch. May be abandoned. No compatibility promise. |
| `archived` | No longer maintained. Kept listed for the record. |

`archived` is for tools I have stopped maintaining but want visible. To remove
a tool from the Compendium entirely, **drop the `hyrule-tool` topic** from the
repo — the next run will drop it from the catalogue.

## Versioning and releases

- Tags are `vMAJOR.MINOR.PATCH` — leading `v`, semver.
- **The Compendium reads GitHub Releases, not tags.** A pushed tag with no
  release attached is invisible to the catalogue.
- Release notes are the changelog. They are rendered verbatim on the tool's
  detail page and merged into `/changelog/`, so write them for a reader who
  does not have the repo open. `### Added` / `### Changed` / `### Fixed`
  headings, and mark breaking changes **Breaking:**.
- Draft releases are ignored. Prereleases are listed but flagged.

## Changing the Compendium itself

- `data/tools.json` is **generated**. Never hand-edit it; your change will be
  reverted by the next scheduled run. Change the manifest in the tool repo
  instead, or the pipeline in `scripts/`.
- Adding a category or status means editing three places in step:
  `schema/hyrule.schema.json`, `scripts/lib/normalize.mjs`, and `src/types.ts`.
  A category with no styling defined will render, but unstyled.
- Keep dependencies minimal. The current set is `astro` at runtime and
  `ajv` + `typescript` for tooling. Adding one should need a reason beyond
  convenience.
