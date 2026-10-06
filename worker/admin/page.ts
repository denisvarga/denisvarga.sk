import { html, raw } from 'hono/html';
import { dailyChart } from './chart';
import { CHART_DAYS, type Overview, type OverviewFilter, type Summary } from './query';
import { STYLES } from './styles';
import { filterForm, formatCount, logTable, matchedLine, outcomeBadge, pager } from './table';
import { formatTime, TIME_ZONE } from './time';

const usd = new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 });

export interface PageView {
  readonly overview: Overview;
  readonly filter: OverviewFilter;
  readonly nonce: string;
  readonly now: number;
}

const card = (label: string, value: string, note = '') =>
  html`<div class="card"><dt>${label}</dt><dd>${value}${note ? html`<small>${note}</small>` : ''}</dd></div>`;

function summarySection(s: Summary) {
  return html`<section aria-labelledby="summary-title">
<h2 id="summary-title">Súhrn</h2>
<dl class="cards">
${card('Otázky spolu', formatCount(s.total))}
${card('Posledných 7 dní', formatCount(s.last7))}
${card(`Posledných ${CHART_DAYS} dní`, formatCount(s.last30))}
${card('Slovensky / anglicky', `${formatCount(s.sk)} / ${formatCount(s.en)}`)}
${card('Priemerná latencia', s.avgLatencyMs === null ? '-' : `${formatCount(s.avgLatencyMs)} ms`)}
${card('Tokeny vstup / výstup', `${formatCount(s.inputTokens)} / ${formatCount(s.outputTokens)}`)}
${card('Odhad ceny', usd.format(s.costUsd), 'bez zľavy za cache')}
</dl>
<ul class="outcomes" aria-label="Výsledky">
${s.outcomes.map(({ outcome, count }) => html`<li>${outcomeBadge(outcome)}<span>${formatCount(count)}</span></li>`)}
</ul>
</section>`;
}

export function renderPage({ overview, filter, nonce, now }: PageView) {
  return html`<!doctype html>
<html lang="sk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Prehľad otázok z chatu</title>
<style nonce="${nonce}">${raw(STYLES)}</style>
</head>
<body>
<main>
<header>
<h1><span class="accent" aria-hidden="true"></span>Prehľad otázok z chatu</h1>
<p class="lead">Stav k ${formatTime(now)}, časy v pásme ${TIME_ZONE}.</p>
</header>
${summarySection(overview.summary)}
<section aria-labelledby="chart-title">
<h2 id="chart-title">Otázky za deň, posledných ${CHART_DAYS} dní</h2>
<div class="panel">${dailyChart(overview.summary.daily)}</div>
</section>
<section aria-labelledby="log-title">
<h2 id="log-title">Otázky</h2>
<div class="panel">${filterForm(filter)}</div>
${matchedLine(filter, overview.matched, overview.rows.length)}
${logTable(overview.rows)}
${pager(filter, overview.matched)}
</section>
</main>
</body>
</html>`;
}
