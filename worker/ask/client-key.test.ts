import { describe, expect, it } from 'vitest';
import { clientKey } from './client-key';

describe('clientKey', () => {
  it('uses the full IPv4 address', () => {
    expect(clientKey('203.0.113.7')).toBe('203.0.113.7');
  });

  it('reduces IPv6 to its /64 prefix', () => {
    expect(clientKey('2001:0db8:85a3:0042:1000:8a2e:0370:7334')).toBe('2001:db8:85a3:42::/64');
    expect(clientKey('2001:db8:85a3:42:ffff::1')).toBe('2001:db8:85a3:42::/64');
  });

  it('expands compressed IPv6 before taking the prefix', () => {
    expect(clientKey('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(clientKey('::1')).toBe('0:0:0:0::/64');
    expect(clientKey('FE80::1%eth0')).toBe('fe80:0:0:0::/64');
  });

  it('treats IPv4-mapped IPv6 as IPv4', () => {
    expect(clientKey('::ffff:198.51.100.4')).toBe('198.51.100.4');
  });

  it("returns 'local' without a header and 'invalid' for garbage", () => {
    expect(clientKey(null)).toBe('local');
    expect(clientKey('')).toBe('local');
    expect(clientKey('not-an-ip')).toBe('invalid');
    expect(clientKey('1:2:3:4:5:6:7:8:9')).toBe('invalid');
    expect(clientKey('1::2::3')).toBe('invalid');
  });
});
