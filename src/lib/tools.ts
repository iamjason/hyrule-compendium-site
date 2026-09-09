import data from '../../data/tools.json';
import type { ChangelogEntry, Compendium, Tool } from '../types';

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
