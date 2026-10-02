/** Comma-separated var to a list without blanks; a missing or blank var yields an empty list. */
export function parseEnvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}
