/**
 * Minimal GitHub REST client. No SDK — just fetch, retries, and pagination.
 */

const API = 'https://api.github.com';

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? '';

function headers(accept = 'application/vnd.github+json') {
  const h = {
    Accept: accept,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'hyrule-compendium',
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/**
 * GET a path. Returns `null` on 404 instead of throwing, so callers can treat
 * "no release yet" / "no manifest" as an ordinary, expected state.
 */
export async function get(path, { accept, raw = false } = {}) {
  const url = path.startsWith('http') ? path : `${API}${path}`;

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: headers(accept) });

    if (res.status === 404) return null;

    // Secondary rate limit / abuse detection — back off and retry.
    if (res.status === 403 || res.status === 429) {
      const remaining = res.headers.get('x-ratelimit-remaining');
      const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0);
      if (remaining === '0' && reset) {
        const waitMs = Math.max(0, reset * 1000 - Date.now()) + 1000;
        if (waitMs > 5 * 60_000) {
          throw new Error(
            `GitHub rate limit exhausted; resets in ${Math.round(waitMs / 60000)}m. ` +
              `Set GITHUB_TOKEN to raise the limit.`,
          );
        }
        console.warn(`  ! rate limited, waiting ${Math.round(waitMs / 1000)}s`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
    }

    if (res.status >= 500) {
      const backoff = 500 * 2 ** attempt;
      console.warn(`  ! ${res.status} from ${url}, retrying in ${backoff}ms`);
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }

    if (!res.ok) {
      throw new Error(`GitHub ${res.status} ${res.statusText} for ${url}`);
    }

    return raw ? await res.text() : await res.json();
  }

  throw new Error(`GitHub request failed after 3 attempts: ${url}`);
}

/** Walk every page of a paginated collection endpoint. */
export async function getAll(path, { max = 300 } = {}) {
  const out = [];
  const sep = path.includes('?') ? '&' : '?';
  for (let page = 1; out.length < max; page++) {
    const batch = await get(`${path}${sep}per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    out.push(...batch);
    if (batch.length < 100) break;
  }
  return out.slice(0, max);
}

/** Render Markdown to HTML through GitHub, so it matches how GitHub shows it. */
export async function renderMarkdown(text, context) {
  if (!text || !text.trim()) return '';
  const res = await fetch(`${API}/markdown`, {
    method: 'POST',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode: 'gfm', context }),
  });
  if (!res.ok) {
    console.warn(`  ! markdown render failed (${res.status}); falling back to plain text`);
    return '';
  }
  return await res.text();
}

export const isAuthenticated = Boolean(token);
