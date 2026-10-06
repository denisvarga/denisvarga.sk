import { html } from 'hono/html';
import { CHAT_OUTCOMES, type LogRow, MAX_SEARCH, type OverviewFilter, PAGE_SIZE } from './query';
import { formatTime } from './time';

const OVERVIEW_PATH = '/prehlad';
const EXPORT_PATH = '/prehlad/export.csv';

const ALERT_OUTCOMES = new Set(['error', 'refused', 'capped', 'unavailable_quota']);
const LANGS = ['sk', 'en'] as const;
const integer = new Intl.NumberFormat('sk-SK');

export const formatCount = (n: number): string => integer.format(n);

/** Query string that keeps the active filters; `page` 1 is the default and is left out. */
export function filterQuery(filter: OverviewFilter, page = 1): string {
  const params = new URLSearchParams();
  if (filter.q) params.set('q', filter.q);
  if (filter.lang) params.set('lang', filter.lang);
  if (filter.outcome) params.set('outcome', filter.outcome);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `?${query}` : '';
}

export const outcomeBadge = (outcome: string) =>
  html`<span class="badge${ALERT_OUTCOMES.has(outcome) ? ' alert' : ''}">${outcome}</span>`;

export function filterForm(filter: OverviewFilter) {
  const active = Boolean(filter.q || filter.lang || filter.outcome);
  return html`<form class="filters" method="get" action="${OVERVIEW_PATH}">
<label class="grow">Hľadať v otázke a odpovedi<input type="search" name="q" value="${filter.q}" maxlength="${MAX_SEARCH}"></label>
<label>Jazyk<select name="lang"><option value="">Všetky</option>${LANGS.map(
    (lang) => html`<option value="${lang}"${filter.lang === lang ? ' selected' : ''}>${lang.toUpperCase()}</option>`,
  )}</select></label>
<label>Výsledok<select name="outcome"><option value="">Všetky</option>${CHAT_OUTCOMES.map(
    (outcome) => html`<option value="${outcome}"${filter.outcome === outcome ? ' selected' : ''}>${outcome}</option>`,
  )}</select></label>
<button type="submit">Filtrovať</button>
${active ? html`<a href="${OVERVIEW_PATH}">Zrušiť filter</a>` : ''}
</form>`;
}

function row(entry: LogRow) {
  const answer =
    entry.answer === null
      ? html`<span class="muted">-</span>`
      : html`<details><summary>Zobraziť odpoveď</summary><div class="answer">${entry.answer}</div></details>`;
  return html`<tr>
<td class="time nowrap">${formatTime(entry.createdAt)}</td>
<td class="lang">${entry.lang.toUpperCase()}</td>
<td class="text">${entry.question}</td>
<td class="wide">${answer}</td>
<td>${outcomeBadge(entry.outcome)}</td>
<td class="latency nowrap">${entry.latencyMs === null ? '-' : `${formatCount(entry.latencyMs)} ms`}</td>
</tr>`;
}

export function logTable(rows: readonly LogRow[]) {
  const body = rows.length > 0 ? rows.map(row) : html`<tr><td class="empty" colspan="6">Žiadne otázky pre tento filter.</td></tr>`;
  return html`<table>
<thead><tr><th scope="col">Čas</th><th scope="col">Jazyk</th><th scope="col">Otázka</th><th scope="col">Odpoveď</th><th scope="col">Výsledok</th><th scope="col">Latencia</th></tr></thead>
<tbody>${body}</tbody>
</table>`;
}

export function matchedLine(filter: OverviewFilter, matched: number, shown: number) {
  const from = (filter.page - 1) * PAGE_SIZE + 1;
  const label =
    shown === 0
      ? `Nájdené otázky: ${formatCount(matched)}`
      : `Zobrazené ${formatCount(from)}-${formatCount(from + shown - 1)} z ${formatCount(matched)}`;
  return html`<p class="meta"><span>${label}</span><a href="${EXPORT_PATH}${filterQuery(filter)}">Export CSV</a></p>`;
}

export function pager(filter: OverviewFilter, matched: number) {
  const pages = Math.max(1, Math.ceil(matched / PAGE_SIZE));
  const page = filter.page;
  const newer = page > 1 ? html`<a href="${OVERVIEW_PATH}${filterQuery(filter, Math.min(page - 1, pages))}">Novšie</a>` : html`<span></span>`;
  const older = page < pages ? html`<a href="${OVERVIEW_PATH}${filterQuery(filter, page + 1)}">Staršie</a>` : html`<span></span>`;
  return html`<nav class="pager" aria-label="Stránkovanie">${newer}<span class="muted">Strana ${page} z ${pages}</span>${older}</nav>`;
}
