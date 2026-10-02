import { prerender } from 'react-dom/static';
import { App } from './app';
import type { Lang } from './i18n/types';

export async function renderApp(lang: Lang): Promise<string> {
  const { prelude } = await prerender(<App lang={lang} />);
  return new Response(prelude).text();
}

export async function renderNotFound(): Promise<string> {
  const { prelude } = await prerender(<main>404</main>);
  return new Response(prelude).text();
}
