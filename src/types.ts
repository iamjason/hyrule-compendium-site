/** Shapes stored in data/tools.json. Kept in sync with scripts/lib/normalize.mjs. */

export const STATUSES = ['stable', 'beta', 'experimental', 'archived'] as const;

export type Status = (typeof STATUSES)[number];
export type Platform = 'macos' | 'linux' | 'windows';

export interface Release {
  tag: string;
  name: string;
  published_at: string;
  prerelease: boolean;
  html_url: string;
  body: string;
  bodyHtml: string;
}

export interface RepoMeta {
  full_name: string;
  html_url: string;
  issues_url: string;
  description: string;
  stars: number;
  language: string | null;
  topics: string[];
  archived: boolean;
}

export interface Tool {
  command: string;
  name: string;
  tagline: string;
  status: Status;
  install: string | null;
  platforms: Platform[];
  docs: string | null;
  repo: RepoMeta;
  readmeHtml: string;
  latestRelease: Release | null;
  releases: Release[];
  version: string | null;
  updatedAt: string | null;
  manifestOk: boolean;
}

export interface Compendium {
  schemaVersion: number;
  owner: string;
  topic: string;
  tools: Tool[];
}

/** A release flattened with its tool, for the merged /changelog/ feed. */
export interface ChangelogEntry extends Release {
  toolCommand: string;
  toolName: string;
}
