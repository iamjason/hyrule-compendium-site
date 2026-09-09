# Conventions

Rules for keeping the Compendium coherent as it grows. These are conventions,
not schema constraints — the validator will not catch a violation of most of
them, but a future me will.

## Naming a tool

Names are short, pronounceable, and unrelated to what the tool does — a name
to say out loud, not a description to parse. `korok` and `deku` set the tone.

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

> ✅ `Keeps every repo in a GitLab group cloned and synced from your menu bar.`
> ✅ `Makes a tangled Git history readable and staging commits quick.`
> ❌ `A CLI tool for searching repositories.`  (describes the category, not the value)
> ❌ `Blazingly fast repo search 🚀`  (adjectives instead of behaviour)

Max 120 characters — it has to fit on a card at mobile width without wrapping
to four lines. End with a period.

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
- Adding a status means editing three places in step:
  `schema/hyrule.schema.json`, `scripts/lib/normalize.mjs`, and `src/types.ts`,
  plus a `.badge-<status>` rule in `src/styles/global.css`.
- There is deliberately no category taxonomy, and no search or filter controls.
  The catalogue is one flat grid: with a handful of tools, every entry is on
  screen at once and a filter bar is furniture that filters nothing. Both are
  worth adding back when the grid grows past roughly a dozen tools and stops
  fitting on one screen — the removed filter bar and its client script are in
  git history if you want them back rather than rewritten.
- Keep dependencies minimal. The current set is `astro` at runtime and
  `ajv` + `typescript` for tooling. Adding one should need a reason beyond
  convenience.
