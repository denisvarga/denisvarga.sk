import { html } from 'hono/html';
import type { HtmlEscapedString } from 'hono/utils/html';
import type { DayCount } from './query';
import { dayLabel } from './time';

const WIDTH = 600;
const HEIGHT = 212;
const TOP = 30;
const BASELINE = 172;
// Room for the centred date label under the first and last bar.
const PAD = 24;
const ACCENT = '#f2541b';
const INK = '#131416';

const round = (n: number) => Math.round(n * 10) / 10;

/** Bar chart in SVG attributes only: the CSP allows no inline style attributes. */
export function dailyChart(days: readonly DayCount[]): HtmlEscapedString | Promise<HtmlEscapedString> {
  const peak = Math.max(0, ...days.map((d) => d.count));
  const slot = WIDTH / Math.max(1, days.length);
  const bar = slot * 0.7;
  const bars = days.map((d, i) => {
    const h = round(((BASELINE - TOP) * d.count) / Math.max(1, peak));
    const x = round(i * slot + (slot - bar) / 2);
    // Labels every 7 days counted back from today stay readable on a phone.
    const label =
      (days.length - 1 - i) % 7 === 0
        ? html`<text x="${round(x + bar / 2)}" y="${HEIGHT - 10}" text-anchor="middle" font-size="13" fill="${INK}" fill-opacity="0.7">${dayLabel(d.date)}</text>`
        : '';
    return html`<rect x="${x}" y="${round(BASELINE - h)}" width="${round(bar)}" height="${h}" rx="2" fill="${ACCENT}"><title>${dayLabel(d.date)}: ${d.count}</title></rect>${label}`;
  });
  const total = days.reduce((sum, d) => sum + d.count, 0);
  return html`<svg class="chart" viewBox="-${PAD} 0 ${WIDTH + 2 * PAD} ${HEIGHT}" role="img" aria-label="Otázky za posledných ${days.length} dní, spolu ${total}">
<text x="0" y="18" font-size="13" fill="${INK}" fill-opacity="0.7">max ${peak}</text>
<line x1="0" y1="${TOP}" x2="${WIDTH}" y2="${TOP}" stroke="${INK}" stroke-opacity="0.12" stroke-dasharray="4 4"/>
<line x1="0" y1="${BASELINE}" x2="${WIDTH}" y2="${BASELINE}" stroke="${INK}" stroke-opacity="0.3"/>
${bars}
</svg>`;
}
