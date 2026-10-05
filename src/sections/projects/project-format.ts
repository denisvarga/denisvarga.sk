export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function projectDomain(url: string): string {
  return url.replace('https://', '');
}
