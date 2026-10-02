import type { Lang } from '../i18n/types';
import { CV_TITLE } from './cv-copy';
import blocksCss from './cv-blocks.css?raw';
import printCss from './cv-print.css?raw';

export interface CvAssets {
  /** URL of a copy of src/cv/fonts, relative to the CV page (or file://). */
  readonly fontDir: string;
  readonly portrait: string;
}

// src/cv/fonts holds static instances of the site's Manrope, cut from @fontsource-variable/manrope
// 5.3.0 with fontTools (varLib.instancer, wght pinned, names set to Manrope <Style>). Chromium
// embeds a variable font into a PDF as Type 3 glyph procedures, about 230 KB more than the subset
// TrueType fonts it embeds for static faces. Two family names instead of unicode-range lists: the
// browser falls back per glyph, so Slovak letters missing from latin come from latin-ext.
const FONT_FAMILIES = [
  ['CV Manrope', 'latin'],
  ['CV Manrope Ext', 'latin-ext'],
] as const;
const FONT_WEIGHTS = [300, 400, 500, 600] as const;
const UNSAFE_URL = /["'()<>\\\s]/;

function fontFaces(fontDir: string): string[] {
  if (!fontDir || UNSAFE_URL.test(fontDir)) throw new Error(`Unsafe CV font directory: ${JSON.stringify(fontDir)}`);
  return FONT_FAMILIES.flatMap(([family, subset]) =>
    FONT_WEIGHTS.map(
      (weight) =>
        `@font-face { font-family: '${family}'; font-style: normal; font-weight: ${weight}; ` +
        `src: url('${fontDir}/manrope-${subset}-${weight}.woff2') format('woff2'); }`,
    ),
  );
}

/** Wraps the prerendered CV body in a standalone print document. */
export function cvHtmlDocument(lang: Lang, assets: CvAssets, body: string): string {
  return [
    '<!doctype html>',
    `<html lang="${lang}">`,
    '<head>',
    '<meta charset="utf-8">',
    `<title>${CV_TITLE}</title>`,
    '<style>',
    ...fontFaces(assets.fontDir),
    printCss,
    blocksCss,
    '</style>',
    '</head>',
    `<body>${body}</body>`,
    '</html>',
    '',
  ].join('\n');
}
