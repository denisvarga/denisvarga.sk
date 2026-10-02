export interface ScopeItem {
  readonly n: string;
  readonly text: string;
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** The drawer's "what I did" list: the description split on commas and colons, numbered 01.. */
export function projectScope(description: string): ScopeItem[] {
  return description
    .split(/,\s*|:\s*/)
    .filter(Boolean)
    .map((part, i) => ({ n: pad2(i + 1), text: part.charAt(0).toUpperCase() + part.slice(1) }));
}

export function projectDomain(url: string): string {
  return url.replace('https://', '');
}
