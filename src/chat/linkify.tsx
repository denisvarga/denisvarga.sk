import type { ReactNode } from 'react';

// Emails, Slovak phone numbers and links to Denis's own sites and profiles. Anything else, an
// unknown host or another scheme included, stays plain text.
const EMAIL = String.raw`[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}`;
const PHONE = String.raw`\+421(?:[  ]?\d){9}`;
const KNOWN_LINK =
  String.raw`(?:https?:\/\/)?(?:www\.)?(?:denisvarga\.(?:sk|dev)|github\.com\/denisvarga|linkedin\.com\/in\/denisvarg)` +
  // Not followed by more host or name characters, so "denisvarga.sk.evil.com" and "denisvargax" never match.
  String.raw`(?![\w-]|\.[\w-])(?:\/[^\s<>"'()[\]{}\\„“”‘’«»]*)?`;
const TOKEN = new RegExp(`(${EMAIL})|(${PHONE})|(${KNOWN_LINK})`, 'g');

// A match glued to the end of another word ("evil.com/denisvarga.sk", "sub.denisvarga.sk") stays text.
const GLUED = /[\w@./+-]/;
const TRAILING_PUNCTUATION = /[.,;:!?]+$/;
const KNOWN_HOSTS = new Set(['denisvarga.sk', 'denisvarga.dev', 'github.com', 'linkedin.com']);

function linkHref(raw: string): string | null {
  try {
    const url = new URL(`https://${raw.replace(/^https?:\/\//, '')}`);
    return url.protocol === 'https:' && KNOWN_HOSTS.has(url.hostname.replace(/^www\./, '')) ? url.href : null;
  } catch {
    return null;
  }
}

/** Text nodes and anchors for a reply; never parses markup and only builds mailto:, tel: or https: hrefs. */
export function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(TOKEN)) {
    const start = match.index;
    if (start > 0 && GLUED.test(text.charAt(start - 1))) continue;
    const [whole, email, phone] = match;
    const value = email || phone ? whole : whole.replace(TRAILING_PUNCTUATION, '');
    const href = email ? `mailto:${email}` : phone ? `tel:+${phone.replace(/\D/g, '')}` : linkHref(value);
    if (href === null) continue;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      href.startsWith('https:') ? (
        <a key={start} href={href} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      ) : (
        <a key={start} href={href}>
          {value}
        </a>
      ),
    );
    cursor = start + value.length;
  }
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}
