// C0 controls except tab and newline, DEL, C1 controls, and the bidi embedding, override and
// isolate controls, which would let a visitor reorder how their question reads in /prehlad and the CSV.
function isControl(code: number): boolean {
  return (
    (code < 0x20 && code !== 0x09 && code !== 0x0a) ||
    (code >= 0x7f && code <= 0x9f) ||
    (code >= 0x202a && code <= 0x202e) ||
    (code >= 0x2066 && code <= 0x2069)
  );
}

/** Normalises CRLF, drops control and bidi control characters (escape sequences included) and trims. Idempotent. */
export function cleanContent(value: string): string {
  const normalized = value.replace(/\r\n?/g, '\n');
  let out = '';
  for (const ch of normalized) if (!isControl(ch.codePointAt(0) ?? 0)) out += ch;
  return out.trim();
}

const DASHES = /\s*[\u2013\u2014]\s*/g;
const BOLD = /\*\*(.+?)\*\*/g;

/**
 * The chat shows plain text and the site never uses en or em dashes. The model still slips into
 * both, so dashes become a spaced hyphen and **bold** loses its markers.
 */
export function plainReply(value: string): string {
  return value.replace(DASHES, ' - ').replace(BOLD, '$1');
}
