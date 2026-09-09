/**
 * Merge a repo's API metadata with its `hyrule.json` manifest.
 *
 * Rule: the manifest is the source of truth. Anything it does not specify
 * falls back to the API. A missing or malformed manifest is a WARNING, never
 * a build failure — the entry still renders from API metadata alone.
 */

export const CATEGORIES = [
  'build',
  'time',
  'search',
  'move',
  'guard',
  'environment',
  'knowledge',
];

export const STATUSES = ['stable', 'beta', 'experimental', 'archived'];

/** Fallback slug when there is no manifest: derive it from the repo name. */
function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * @param {object} args
 * @param {object} args.repo      - GitHub repo object
 * @param {object|null} args.manifest - parsed hyrule.json, or null
 * @param {string[]} args.warnings - mutable list; problems get pushed here
 */
export function normalizeTool({ repo, manifest, releases, readmeHtml, warnings }) {
  const m = manifest ?? {};

  const command = m.command ?? slugify(repo.name);
  const category = CATEGORIES.includes(m.category) ? m.category : 'knowledge';
  const status = STATUSES.includes(m.status) ? m.status : 'experimental';

  if (!manifest) {
    warnings.push(`${repo.full_name}: no hyrule.json — using API metadata only.`);
  } else {
    if (!m.command) warnings.push(`${repo.full_name}: manifest has no "command"; slug derived as "${command}".`);
    if (m.category && !CATEGORIES.includes(m.category)) {
      warnings.push(`${repo.full_name}: unknown category "${m.category}"; filed under "knowledge".`);
    }
    if (m.status && !STATUSES.includes(m.status)) {
      warnings.push(`${repo.full_name}: unknown status "${m.status}"; treated as "experimental".`);
    }
  }

  const latest = releases[0] ?? null;

  return {
    // identity
    command,
    name: m.name ?? repo.name,
    tagline: m.tagline ?? repo.description ?? '',
    category,
    status,

    // install
    install: m.install ?? null,
    platforms: Array.isArray(m.platforms) ? m.platforms : [],
    docs: m.docs ?? null,

    // repo metadata
    repo: {
      full_name: repo.full_name,
      html_url: repo.html_url,
      issues_url: `${repo.html_url}/issues`,
      description: repo.description ?? '',
      stars: repo.stargazers_count ?? 0,
      language: repo.language ?? null,
      topics: repo.topics ?? [],
      archived: Boolean(repo.archived),
    },

    // content
    readmeHtml: readmeHtml ?? '',

    // releases, newest first
    latestRelease: latest,
    releases,

    // convenience fields the UI sorts and filters on
    version: latest?.tag ?? null,
    updatedAt: latest?.published_at ?? repo.pushed_at ?? null,

    // set when the manifest exists but failed validation
    manifestOk: manifest !== null,
  };
}

/** Stable key order so the committed JSON diffs cleanly. */
export function stableStringify(value) {
  return JSON.stringify(value, (_key, val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.fromEntries(Object.entries(val).sort(([a], [b]) => a.localeCompare(b)));
    }
    return val;
  }, 2) + '\n';
}
