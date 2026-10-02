import { parseEnvList } from './env-list';

// An empty allow-list rejects everything: a missing var must not open the endpoint.
export function isAllowedRequest(headers: Headers, allowedOrigins: string | undefined): boolean {
  const origin = headers.get('Origin');
  const contentType = headers.get('Content-Type')?.toLowerCase() ?? '';
  if (!origin || !contentType.startsWith('application/json')) return false;
  return parseEnvList(allowedOrigins).includes(origin);
}
