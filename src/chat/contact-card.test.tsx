import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { copyEn } from '../i18n/copy-en';
import { LangProvider } from '../i18n/lang-context';
import { AskAgent } from '../sections/ai/ask-agent';
import type { TurnstileRenderOptions } from '../types/turnstile';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = copyEn.ask;
const DRAFT_TEXT = 'Draft message for Denis:\n\nI need a WooCommerce shop for my coffee roastery.';
const PROPOSAL = { message: 'I need a WooCommerce shop for my coffee roastery.', name: null, email: 'jana@firma.sk' };

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
let contactResponse: () => Response;

// One callback per widget container, so the chat and the card each get tokens for their own action.
function installTurnstile() {
  const widgets = new Map<HTMLElement | string, TurnstileRenderOptions>();
  window.turnstile = {
    render: vi.fn((el: HTMLElement | string, options: TurnstileRenderOptions) => {
      widgets.set(el, options);
      return `w${widgets.size}`;
    }),
    execute: vi.fn((el: HTMLElement | string) => {
      const options = widgets.get(el);
      options?.callback?.(`token-${options.action ?? ''}`);
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };
}

const bodies = (path: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url) === path).map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>);
const input = () => container.querySelector('input') as HTMLInputElement;
const card = () => container.querySelector('[role="group"]');
const button = (label: string) => [...container.querySelectorAll('button')].find((b) => b.textContent === label);
const field = (label: string) => [...container.querySelectorAll('label')].find((l) => l.textContent?.startsWith(label))?.querySelector('input') as HTMLInputElement;

function type(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function ask(question: string) {
  type(input(), question);
  await act(async () => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  });
}

async function click(label: string) {
  await act(async () => button(label)?.click());
}

beforeEach(async () => {
  vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '1x00000000000000000000AA');
  installTurnstile();
  contactResponse = () => Response.json({ reply: 'Message sent. Denis has it by email and will get back to you.', sig: 'sig-sent' });
  fetchMock = vi.fn<typeof fetch>((url) =>
    Promise.resolve(
      String(url) === '/api/contact'
        ? contactResponse()
        : Response.json({ reply: DRAFT_TEXT, kind: 'handoff_draft', sig: 'sig-draft', draft: PROPOSAL }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <LangProvider lang="en">
        <AskAgent />
      </LangProvider>,
    ),
  );
  await ask('Yes, please.');
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  delete window.turnstile;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('ContactCard', () => {
  it('shows the proposal with prefilled fields, focuses the first empty one and announces the card', () => {
    expect(card()?.textContent).toContain(t.contact.title);
    expect(card()?.textContent).toContain(PROPOSAL.message);
    expect(card()?.textContent).toContain(t.contact.consent);
    expect(card()?.textContent).not.toContain('Draft message for Denis:');
    expect(field(t.contact.name).value).toBe('');
    expect(field(t.contact.email).value).toBe('jana@firma.sk');
    expect(document.activeElement).toBe(field(t.contact.name));
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(`${t.contact.title}. ${t.contact.lead} ${PROPOSAL.message}`);
    expect(window.turnstile?.render).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ action: 'contact' }));
    expect(bodies('/api/contact')).toHaveLength(0);
  });

  it('sends the edited message with its own token and the transcript, then confirms and keeps the confirmation as history', async () => {
    type(field(t.contact.name), ' Jana ');
    await click(t.contact.edit);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    expect(document.activeElement).toBe(textarea);
    type(textarea, 'I need a shop, ideally before spring.');
    await click(t.contact.send);

    expect(bodies('/api/contact')).toEqual([
      {
        lang: 'en',
        turnstileToken: 'token-contact',
        name: 'Jana',
        email: 'jana@firma.sk',
        message: 'I need a shop, ideally before spring.',
        messages: [
          { role: 'user', content: 'Yes, please.' },
          { role: 'assistant', content: DRAFT_TEXT, sig: 'sig-draft' },
        ],
      },
    ]);
    const status = card()?.querySelector('p');
    expect(status?.textContent).toBe('Done, Denis has your message and will reply to jana@firma.sk.');
    expect(document.activeElement).toBe(status);
    expect(card()?.querySelector('form')).toBeNull();

    await ask('Thanks!');
    expect(bodies('/api/ask').at(-1)?.messages).toEqual([
      { role: 'user', content: 'Yes, please.' },
      { role: 'assistant', content: DRAFT_TEXT, sig: 'sig-draft' },
      { role: 'assistant', content: 'Message sent. Denis has it by email and will get back to you.', sig: 'sig-sent' },
      { role: 'user', content: 'Thanks!' },
    ]);
  });

  it('cancels without sending anything', async () => {
    await click(t.contact.cancel);
    expect(card()?.textContent).toContain(t.contact.cancelled);
    expect(document.activeElement).toBe(card()?.querySelector('p'));
    expect(bodies('/api/contact')).toHaveLength(0);
  });

  it('shows the failed copy with the address as a link and lets the visitor send again', async () => {
    contactResponse = () => Response.json({ error: 'send_failed' }, { status: 502 });
    type(field(t.contact.name), 'Jana');
    await click(t.contact.send);
    expect(card()?.textContent).toContain(t.contact.failed);
    expect(card()?.querySelector('a[href="mailto:hello@denisvarga.dev"]')).not.toBeNull();
    expect(card()?.querySelector('[aria-live="polite"]')?.textContent).toBe(t.contact.failed);
    expect(field(t.contact.name).value).toBe('Jana');

    contactResponse = () => Response.json({ reply: 'Message sent.', sig: 'sig-sent' });
    await click(t.contact.send);
    expect(bodies('/api/contact')).toHaveLength(2);
    expect(card()?.textContent).toContain('Done, Denis has your message');
  });

  it('keeps a name of spaces from being sent and marks the field', async () => {
    type(field(t.contact.name), '   ');
    await click(t.contact.send);
    expect(bodies('/api/contact')).toHaveLength(0);
    expect(field(t.contact.name).getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(field(t.contact.name));
  });
});
