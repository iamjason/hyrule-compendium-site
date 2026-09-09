import data from '../../data/tools.json';
import type { Category, ChangelogEntry, Compendium, Tool } from '../types';
import { CATEGORIES } from '../types';

const compendium = data as unknown as Compendium;

export const tools: Tool[] = compendium.tools;
export const owner = compendium.owner;
export const topic = compendium.topic;

/** Human-facing labels and blurbs for each shelf of the Compendium. */
export const CATEGORY_LABELS: Record<Category, string> = {
  build: 'Build',
  time: 'Time',
  search: 'Search',
  move: 'Move',
  guard: 'Guard',
  environment: 'Environment',
  knowledge: 'Knowledge',
};

/** Categories that actually have tools, in canonical order. */
export function populatedCategories(): Category[] {
  return CATEGORIES.filter((c) => tools.some((t) => t.category === c));
}

export function toolsIn(category: Category): Tool[] {
  return tools.filter((t) => t.category === category);
}

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
        toolCategory: t.category,
      })),
    )
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
}

/** A release published in the last N days counts as "new". */
export function isRecent(iso: string | null, days = 30): boolean {
  if (!iso) return false;
  return Date.now() - Date.parse(iso) < days * 86_400_000;
}
