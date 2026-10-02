import type { ReactNode } from 'react';
import { prerender } from 'react-dom/static';
import { App } from './app';
import { CvDocument } from './cv/cv-document';
import { cvHtmlDocument, type CvAssets } from './cv/cv-html';
import type { Lang } from './i18n/types';
import { NotFoundPage } from './not-found/not-found-page';

export { buildLlmsFullTxt, buildLlmsTxt } from './seo/llms';

async function renderToHtml(node: ReactNode): Promise<string> {
  const { prelude } = await prerender(node);
  return new Response(prelude).text();
}

export function renderApp(lang: Lang): Promise<string> {
  return renderToHtml(<App lang={lang} />);
}

export function renderNotFound(): Promise<string> {
  return renderToHtml(<NotFoundPage />);
}

/** Standalone print document that scripts/build-cv-pdf.ts turns into the PDF CV. */
export async function renderCvHtml(lang: Lang, assets: CvAssets, generatedAt: Date): Promise<string> {
  const body = await renderToHtml(<CvDocument lang={lang} portraitSrc={assets.portrait} generatedAt={generatedAt} />);
  return cvHtmlDocument(lang, assets, body);
}
