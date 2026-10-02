const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const HEXTET = /^[0-9a-f]{1,4}$/;

function expandIpv6(address: string): string[] | null {
  const halves = address.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array<string>(halves.length === 2 ? missing : 0).fill('0'), ...tail];
  return groups.every((g) => HEXTET.test(g)) ? groups : null;
}

/**
 * Rate-limit key: the full IPv4 address, or the /64 prefix for IPv6 because one subscriber
 * usually owns a whole /64. `'local'` when the header is absent (local dev).
 */
export function clientKey(ip: string | null | undefined): string {
  const raw = ip?.trim().toLowerCase();
  if (!raw) return 'local';
  if (IPV4.test(raw)) return raw;

  const address = raw.split('%')[0] ?? '';
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(address);
  if (mapped?.[1] && IPV4.test(mapped[1])) return mapped[1];

  const groups = expandIpv6(address);
  if (!groups) return 'invalid';
  const prefix = groups.slice(0, 4).map((g) => g.replace(/^0+(?=.)/, ''));
  return `${prefix.join(':')}::/64`;
}
