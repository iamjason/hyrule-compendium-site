import data from '../../data/tools.json';
import type { ChangelogEntry, Compendium, Release, ReleaseAsset, Tool } from '../types';

const compendium = data as unknown as Compendium;

export const tools: Tool[] = compendium.tools;
export const owner = compendium.owner;
export const topic = compendium.topic;

export function toolByCommand(command: string): Tool | undefined {
  return tools.find((t) => t.command === command);
}

/** Every language present, for the filter control. */
export function languages(): string[] {
  const set = new Set<string>();
  for (const t of tools) if (t.repo.language) set.add(t.repo.language);
  return [...set].sort();
}

/** Every release across every tool, newest first. */
export function changelog(): ChangelogEntry[] {
  return tools
    .flatMap((t) =>
      t.releases.map((r) => ({
        ...r,
        toolCommand: t.command,
        toolName: t.name,
      })),
    )
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
}

/** A release published in the last N days counts as "new". */
export function isRecent(iso: string | null, days = 30): boolean {
  if (!iso) return false;
  return Date.now() - Date.parse(iso) < days * 86_400_000;
}

/**
 * The asset a Download button should point at.
 *
 * Prefers a real distributable over checksums, signatures and source tarballs
 * — GitHub attaches its own `Source code` archives to every release, and those
 * are never what someone clicking "Download" wants.
 */
export function primaryAsset(release: Release | null): ReleaseAsset | null {
  if (!release?.assets?.length) return null;

  const distributable = /\.(dmg|pkg|zip|tar\.gz|tgz|app\.zip|exe|msi|deb|rpm|AppImage)$/i;
  const noise = /\.(sha256|sha512|md5|asc|sig|pem|txt)$/i;

  const candidates = release.assets.filter((a) => !noise.test(a.name));
  return candidates.find((a) => distributable.test(a.name)) ?? candidates[0] ?? null;
}

/** "25.6 MB" — one decimal, binary units, as Finder reports them. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
