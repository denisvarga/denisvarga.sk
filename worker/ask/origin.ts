export function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// An empty allow-list rejects everything: a missing var must not open the endpoint.
export function isAllowedRequest(headers: Headers, allowedOrigins: string | undefined): boolean {
  const origin = headers.get('Origin');
  const contentType = headers.get('Content-Type')?.toLowerCase() ?? '';
  if (!origin || !contentType.startsWith('application/json')) return false;
  return parseAllowedOrigins(allowedOrigins).includes(origin);
}
