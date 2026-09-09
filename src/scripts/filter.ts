/**
 * Client-side search and filtering for the tool grid.
 *
 * Everything it needs is already in the DOM as data attributes, so there is no
 * data fetch and no framework — the page works with JS disabled, it just shows
 * every tool. State is mirrored into the query string so a filtered view is
 * a shareable link.
 */

interface Controls {
  search: HTMLInputElement | null;
  category: HTMLSelectElement | null;
  status: HTMLSelectElement | null;
  language: HTMLSelectElement | null;
  reset: HTMLButtonElement | null;
  count: HTMLElement | null;
}

const el: Controls = {
  search: document.querySelector('#f-search'),
  category: document.querySelector('#f-category'),
  status: document.querySelector('#f-status'),
  language: document.querySelector('#f-language'),
  reset: document.querySelector('#f-reset'),
  count: document.querySelector('#f-count'),
};

const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-tool]'));
const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-category-section]'));
const empty = document.querySelector<HTMLElement>('#no-results');

const total = cards.length;

function readQuery(): void {
  const params = new URLSearchParams(location.search);
  if (el.search) el.search.value = params.get('q') ?? '';
  if (el.category) el.category.value = params.get('category') ?? '';
  if (el.status) el.status.value = params.get('status') ?? '';
  if (el.language) el.language.value = params.get('language') ?? '';
}

function writeQuery(): void {
  const params = new URLSearchParams();
  const q = el.search?.value.trim();
  if (q) params.set('q', q);
  if (el.category?.value) params.set('category', el.category.value);
  if (el.status?.value) params.set('status', el.status.value);
  if (el.language?.value) params.set('language', el.language.value);

  const qs = params.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

function apply(): void {
  const q = (el.search?.value ?? '').trim().toLowerCase();
  const category = el.category?.value ?? '';
  const status = el.status?.value ?? '';
  const language = el.language?.value ?? '';

  // Multi-word search: every term must appear somewhere in the card's haystack.
  const terms = q ? q.split(/\s+/) : [];

  let shown = 0;
  for (const card of cards) {
    const hay = card.dataset.search ?? '';
    const match =
      terms.every((t) => hay.includes(t)) &&
      (!category || card.dataset.category === category) &&
      (!status || card.dataset.status === status) &&
      (!language || card.dataset.language === language);

    card.dataset.hidden = match ? 'false' : 'true';
    if (match) shown++;
  }

  // Collapse a category heading once all of its cards are filtered out.
  for (const section of sections) {
    const visible = section.querySelectorAll('[data-tool][data-hidden="false"]').length;
    section.dataset.hidden = visible === 0 ? 'true' : 'false';
    const n = section.querySelector<HTMLElement>('[data-section-count]');
    if (n) n.textContent = String(visible);
  }

  const filtering = Boolean(q || category || status || language);
  if (empty) empty.hidden = shown !== 0;
  if (el.reset) el.reset.hidden = !filtering;
  if (el.count) {
    el.count.textContent = filtering ? `${shown} of ${total}` : `${total} tool${total === 1 ? '' : 's'}`;
  }

  writeQuery();
}

function clear(): void {
  if (el.search) el.search.value = '';
  if (el.category) el.category.value = '';
  if (el.status) el.status.value = '';
  if (el.language) el.language.value = '';
  apply();
  el.search?.focus();
}

el.search?.addEventListener('input', apply);
el.category?.addEventListener('change', apply);
el.status?.addEventListener('change', apply);
el.language?.addEventListener('change', apply);
el.reset?.addEventListener('click', clear);

// "/" focuses search, Escape clears it — the two shortcuts worth having.
document.addEventListener('keydown', (event) => {
  const target = event.target as HTMLElement | null;
  const typing = target?.tagName === 'INPUT' || target?.tagName === 'SELECT' || target?.isContentEditable;

  if (event.key === '/' && !typing) {
    event.preventDefault();
    el.search?.focus();
    el.search?.select();
  } else if (event.key === 'Escape' && target === el.search) {
    clear();
  }
});

readQuery();
apply();
