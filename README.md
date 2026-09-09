# Hyrule Compendium

A self-updating directory of my developer tools. Every tool lives in its own
public repo; the Compendium discovers them, catalogues them, and rebuilds
itself whenever one cuts a release.

**Nothing in the directory is hand-edited.** `data/tools.json` is generated.

---

## How it works

```
repo tagged `hyrule-tool`
        │
        ├── release published ──> notify-compendium.yml ──> repository_dispatch
        │                                                            │
        │   (also: daily cron, manual dispatch) ─────────────────────┤
        │                                                            ▼
        └──────────────── GitHub REST API <──── update-compendium.yml
                                                         │
                                    data/tools.json (committed) ──> Astro ──> Pages
```

The site builds **only** from the committed `data/tools.json`. No API calls
happen at build time, so a GitHub API outage cannot break a deploy.

---

## Adding a new tool

1. **Tag the repo with the topic `hyrule-tool`.**
   Repo → About (gear icon) → Topics → add `hyrule-tool`.
   This is the entire discovery mechanism. No list to edit here.

2. **Add `hyrule.json` to the repo root.** See below.

3. **Drop in the release notifier** (optional but recommended) — copy
   [`.github/workflows/notify-compendium.yml`](.github/workflows/notify-compendium.yml)
   into the tool repo at the same path, then set up the PAT.

Without step 3 the tool still appears — just on the next daily run rather than
within a minute of the release.

---

## The manifest: `hyrule.json`

Lives at the tool repo's root. **It is the source of truth** — every field here
overrides whatever the GitHub API says.

```json
{
  "$schema": "https://iamjason.github.io/hyrule-compendium-site/schema/hyrule.schema.json",
  "name": "Korok",
  "command": "korok",
  "tagline": "Finds what is hidden in your repo.",
  "category": "search",
  "status": "stable",
  "install": "brew install jason/tap/korok",
  "platforms": ["macos", "linux"],
  "docs": "https://iamjason.github.io/korok/"
}
```

### Required fields

| Field | Type | Notes |
|---|---|---|
| `name` | string | Display name. Falls back to the repo name. |
| `command` | string | The binary name. **Becomes the URL: `/tools/<command>/`.** Must be unique across the Compendium; `^[a-z0-9][a-z0-9-]*$`. |
| `tagline` | string | One sentence, shown on the card. Max 120 chars. Falls back to the repo description. |
| `category` | enum | `build` · `time` · `search` · `move` · `guard` · `environment` · `knowledge` |
| `status` | enum | `stable` · `beta` · `experimental` · `archived` |

### Optional fields

| Field | Type | Notes |
|---|---|---|
| `install` | string | One copy-pasteable command. Rendered with a copy button. Omit it and the install block is hidden. |
| `platforms` | array | Any of `macos`, `linux`, `windows`. |
| `docs` | string | Absolute `https://` URL to external docs. |

Unknown keys are rejected, so a typo like `"platfroms"` fails validation
instead of silently doing nothing.

### Validating a manifest

```bash
npm run validate                    # validates ./hyrule.json
npm run validate path/to/hyrule.json
```

The schema lives at [`schema/hyrule.schema.json`](schema/hyrule.schema.json)
and is published with the site, so tool repos can reference it by URL for
editor autocomplete and validate it in their own CI.

### When a manifest is missing or broken

The build **never fails** on a bad manifest. It falls back to API metadata
(repo name, description, language) and defaults to `category: knowledge`,
`status: experimental`. Every fallback is emitted as a `::warning::` annotation
in the workflow run, so problems show up in the Actions summary rather than
taking the site down.

---

## PAT setup

`repository_dispatch` writes to *this* repo from *another* repo, which the
default `GITHUB_TOKEN` cannot do. Each tool repo needs a PAT.

**Create the token** (either kind works):

<table>
<tr><th>Fine-grained PAT (recommended)</th><th>Classic PAT</th></tr>
<tr valign="top"><td>

- Resource owner: **`iamjason`**
- Repository access: **Only select repositories** → `hyrule-compendium-site`
- Repository permissions → **Contents: Read and write**

That is the only permission needed. `repository_dispatch` is gated on
`contents:write` for the *target* repo.

</td><td>

- Scope: **`public_repo`**

(Use full `repo` only if the Compendium repo is private.)

</td></tr>
</table>

**Install the token** in every tool repo:

> Settings → Secrets and variables → Actions → New repository secret
> **Name:** `COMPENDIUM_DISPATCH_TOKEN`
> **Value:** the token

The notifier workflow fails loudly with a clear message if the secret is absent.

**Repo settings this repo needs:** Settings → Pages → Source: **GitHub Actions**.
Settings → Actions → General → Workflow permissions: **Read and write**.

---

## Local development

```bash
npm install

npm run dev        # dev server at localhost:4321
npm run build      # static output to dist/
npm run preview    # serve the built site
npm run check      # astro + TypeScript check
```

Ships with sample data for **Korok** and **Deku** in `data/tools.json`, so
`npm run dev` works immediately with no token and no network.

### Refreshing the data locally

```bash
export GITHUB_TOKEN=ghp_...     # strongly recommended: 60 req/hr without it
npm run fetch:dry               # show what would change, write nothing
npm run fetch                   # rewrite data/tools.json
```

**Empty-discovery guard.** If discovery returns zero repos while
`data/tools.json` still holds entries, the fetch keeps the existing data and
logs a warning instead of emptying the catalogue — a drop from N to 0 is far
more often a transient API or auth failure than every tool being untagged at
once. When you really do mean it, run
`node scripts/fetch-tools.mjs --allow-empty`.

| Variable | Default | Purpose |
|---|---|---|
| `GITHUB_TOKEN` | — | Raises the API rate limit. Read-only; public data only. |
| `GITHUB_OWNER` | `iamjason` | Whose repos to scan. |
| `HYRULE_TOPIC` | `hyrule-tool` | The discovery topic. |
| `SITE` / `BASE` | `https://iamjason.github.io` / `/hyrule-compendium-site` | Pages URL. Set `BASE=/` for a custom domain. |

---

## Repo layout

```
.github/workflows/
  update-compendium.yml   fetch → commit → build → deploy
  notify-compendium.yml   snippet to copy into each tool repo
data/tools.json           generated, committed
schema/hyrule.schema.json the manifest contract
scripts/                  the data pipeline (plain Node, no build step)
src/                      the Astro site
examples/                 a reference hyrule.json
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for naming conventions.
