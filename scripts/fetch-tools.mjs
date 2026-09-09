#!/usr/bin/env node
/**
 * Build data/tools.json by discovering every repo tagged `hyrule-tool`.
 *
 * Usage:
 *   node scripts/fetch-tools.mjs            # write data/tools.json
 *   node scripts/fetch-tools.mjs --dry-run  # print a summary, write nothing
 *
 * Env:
 *   GITHUB_TOKEN  strongly recommended (60 req/hr unauthenticated)
 *   GITHUB_OWNER  defaults to "iamjason"
 *   HYRULE_TOPIC  defaults to "hyrule-tool"
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { get, getAll, renderMarkdown, isAuthenticated } from './lib/github.mjs';
import { normalizeTool, stableStringify } from './lib/normalize.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'data/tools.json');

const OWNER = process.env.GITHUB_OWNER ?? 'iamjason';
const TOPIC = process.env.HYRULE_TOPIC ?? 'hyrule-tool';
const DRY_RUN = process.argv.includes('--dry-run');

const warnings = [];

async function discoverRepos() {
  // Search API: public repos owned by OWNER carrying the topic.
  const q = encodeURIComponent(`user:${OWNER} topic:${TOPIC} fork:false`);
  const result = await get(`/search/repositories?q=${q}&per_page=100&sort=updated`);
  return result?.items ?? [];
}

async function fetchManifest(repo) {
  const res = await get(`/repos/${repo.full_name}/contents/hyrule.json`, {
    accept: 'application/vnd.github.raw+json',
    raw: true,
  });
  if (res === null) return null;

  try {
    const parsed = JSON.parse(res);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      warnings.push(`${repo.full_name}: hyrule.json is not a JSON object — ignoring it.`);
      return null;
    }
    return parsed;
  } catch (err) {
    warnings.push(`${repo.full_name}: hyrule.json is malformed JSON (${err.message}) — ignoring it.`);
    return null;
  }
}

async function fetchReadmeHtml(repo) {
  const html = await get(`/repos/${repo.full_name}/readme`, {
    accept: 'application/vnd.github.html+json',
    raw: true,
  });
  if (html === null) {
    warnings.push(`${repo.full_name}: no README found.`);
    return '';
  }
  return html;
}

async function fetchReleases(repo) {
  const raw = await getAll(`/repos/${repo.full_name}/releases`, { max: 100 });
  const published = raw.filter((r) => !r.draft);

  const out = [];
  for (const r of published) {
    out.push({
      tag: r.tag_name,
      name: r.name || r.tag_name,
      published_at: r.published_at,
      prerelease: Boolean(r.prerelease),
      html_url: r.html_url,
      body: r.body ?? '',
      bodyHtml: await renderMarkdown(r.body, repo.full_name),
    });
  }

  out.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
  return out;
}

async function main() {
  if (!isAuthenticated) {
    console.warn('! No GITHUB_TOKEN set — using the 60 requests/hour anonymous limit.\n');
  }

  console.log(`Discovering repos: user:${OWNER} topic:${TOPIC}`);
  const repos = await discoverRepos();
  console.log(`Found ${repos.length} repo(s).\n`);

  const tools = [];
  for (const repo of repos) {
    console.log(`- ${repo.full_name}`);
    const [manifest, readmeHtml, releases] = await Promise.all([
      fetchManifest(repo),
      fetchReadmeHtml(repo),
      fetchReleases(repo),
    ]);
    tools.push(normalizeTool({ repo, manifest, releases, readmeHtml, warnings }));
  }

  // Deterministic ordering: category, then command.
  tools.sort((a, b) => a.category.localeCompare(b.category) || a.command.localeCompare(b.command));

  // Guard against two repos claiming the same URL slug.
  const seen = new Map();
  for (const t of tools) {
    if (seen.has(t.command)) {
      warnings.push(
        `Duplicate command "${t.command}" claimed by ${seen.get(t.command)} and ${t.repo.full_name}. ` +
          `The second one will not get a detail page.`,
      );
    } else {
      seen.set(t.command, t.repo.full_name);
    }
  }

  // NOTE: intentionally no `generated_at` field. A timestamp would make the
  // file differ on every run and produce a commit every single day.
  const payload = { schemaVersion: 1, owner: OWNER, topic: TOPIC, tools };
  const json = stableStringify(payload);

  if (warnings.length) {
    console.log(`\n::group::Compendium warnings (${warnings.length})`);
    for (const w of warnings) console.log(`::warning::${w}`);
    console.log('::endgroup::');
  }

  if (DRY_RUN) {
    console.log(`\n[dry run] ${tools.length} tool(s); would write ${json.length} bytes to data/tools.json`);
    return;
  }

  const previous = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (previous === json) {
    console.log('\nNo change to data/tools.json.');
  } else {
    writeFileSync(OUT, json);
    console.log(`\nWrote data/tools.json (${tools.length} tools).`);
  }
}

main().catch((err) => {
  console.error(`::error::${err.message}`);
  process.exit(1);
});
