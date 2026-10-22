import { describe, expect, it } from 'vitest';
import { contactFailure, failureReply } from './use-agent-chat';

const errors = { rateLimited: 'SLOW DOWN', dailyCap: 'DONE TODAY', fallback: 'FALLBACK' };

describe('failureReply', () => {
  it('names the rate limit and the daily cap, and offers a retry only for the rate limit', () => {
    expect(failureReply('rate_limited', errors)).toEqual({ type: 'fail', text: 'SLOW DOWN', retryable: true });
    expect(failureReply('daily_cap', errors)).toEqual({ type: 'fail', text: 'DONE TODAY', retryable: false });
  });

  it('uses the fallback with a retry for every other failure and a missing token', () => {
    for (const error of ['verification_failed', 'timeout', 'network', 'upstream_unavailable', 'bad_response', null] as const) {
      expect(failureReply(error, errors), String(error)).toEqual({ type: 'fail', text: 'FALLBACK', retryable: true });
    }
  });
});

describe('contactFailure', () => {
  it('ends the card after the caps, the limiter, the switch and a timeout', () => {
    expect(contactFailure('daily_cap')).toBe('dailyCap');
    expect(contactFailure('rate_limited')).toBe('rateLimited');
    expect(contactFailure('unavailable')).toBe('unavailable');
    expect(contactFailure('timeout')).toBe('timeout');
  });

  it('lets the visitor send again after anything that sent nothing', () => {
    for (const error of ['invalid_input', 'forbidden_origin', 'verification_failed', 'send_failed', 'internal', 'network', 'bad_response', null] as const) {
      expect(contactFailure(error), String(error)).toBe('failed');
    }
  });
});
