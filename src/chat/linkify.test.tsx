import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { linkify } from './linkify';

const html = (text: string) => renderToStaticMarkup(<>{linkify(text)}</>);

function anchors(text: string) {
  const host = document.createElement('div');
  host.innerHTML = html(text);
  return [...host.querySelectorAll('a')].map((a) => ({ href: a.getAttribute('href'), text: a.textContent, target: a.getAttribute('target') }));
}

describe('linkify', () => {
  it('links emails and Slovak phone numbers without a new tab', () => {
    expect(anchors('Napíšte na hello@denisvarga.sk alebo zavolajte na +421 902 074 830.')).toEqual([
      { href: 'mailto:hello@denisvarga.sk', text: 'hello@denisvarga.sk', target: null },
      { href: 'tel:+421902074830', text: '+421 902 074 830', target: null },
    ]);
  });

  it('links the known sites and profiles, bare or with https, leaving trailing punctuation as text', () => {
    const text =
      'Code: github.com/denisvarga/denisvarga.sk, CV: https://denisvarga.dev/cv/denis-varga-cv-en.pdf. Profile: linkedin.com/in/denisvarg! Site: denisvarga.sk.';
    expect(anchors(text)).toEqual([
      { href: 'https://github.com/denisvarga/denisvarga.sk', text: 'github.com/denisvarga/denisvarga.sk', target: '_blank' },
      { href: 'https://denisvarga.dev/cv/denis-varga-cv-en.pdf', text: 'https://denisvarga.dev/cv/denis-varga-cv-en.pdf', target: '_blank' },
      { href: 'https://linkedin.com/in/denisvarg', text: 'linkedin.com/in/denisvarg', target: '_blank' },
      { href: 'https://denisvarga.sk/', text: 'denisvarga.sk', target: '_blank' },
    ]);
    expect(html(text)).toContain('rel="noopener noreferrer"');
  });

  it('keeps every character of the text, in order', () => {
    const text = 'Mail hello@denisvarga.dev, call +421 902 074 830 or open denisvarga.sk/cv/denis-varga-cv.pdf.';
    const host = document.createElement('div');
    host.innerHTML = html(text);
    expect(host.textContent).toBe(text);
  });

  it('leaves unknown hosts, other schemes and look-alike hosts as plain text', () => {
    for (const text of [
      'See https://evil.example.com/denisvarga for more.',
      'Click javascript:alert(1) now.',
      '[x](javascript:alert(1))',
      'Try denisvarga.sk.evil.com today.',
      'Or evil.com/denisvarga.sk and sub.denisvarga.dev.',
      'Profiles github.com/denisvargax and linkedin.com/in/denisvarga.',
      'data:text/html,<script>alert(1)</script>',
    ]) {
      expect(anchors(text), text).toEqual([]);
    }
  });

  it('keeps a profile link inside the profile once dot segments are resolved', () => {
    for (const text of [
      'github.com/denisvarga/../attacker',
      'github.com/denisvarga/%2e%2e/attacker',
      'https://github.com/denisvarga/./../../attacker/repo',
      'linkedin.com/in/denisvarg/../../company/evil',
    ]) {
      expect(anchors(text), text).toEqual([]);
    }
    expect(anchors('github.com/denisvarga/./denisvarga.sk')).toEqual([
      { href: 'https://github.com/denisvarga/denisvarga.sk', text: 'github.com/denisvarga/./denisvarga.sk', target: '_blank' },
    ]);
    expect(anchors('linkedin.com/in/denisvarg/')[0]?.href).toBe('https://linkedin.com/in/denisvarg/');
  });

  it('never turns markup in the text into elements', () => {
    const host = document.createElement('div');
    host.innerHTML = html('<img src=x onerror="alert(1)"> hello@denisvarga.sk');
    expect(host.querySelector('img, script')).toBeNull();
    expect(host.querySelectorAll('a')).toHaveLength(1);
  });
});
