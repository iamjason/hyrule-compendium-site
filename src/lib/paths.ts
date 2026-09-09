/** Prefix a path with the configured Pages base (e.g. /hyrule-compendium-site/). */
export function href(path = ''): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}/${path}`.replace(/\/{2,}/g, '/');
}

/** "27 Aug 2026" — stable across locales, no hydration mismatch. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  }).format(d);
}
