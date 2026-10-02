export interface TitleWord {
  readonly text: string;
  readonly bold: boolean;
}

// Design rule: words split on spaces; a word starting with '*' opens a bold run, a word
// containing '*' closes it (both can apply to one word, e.g. '*Denis.*').
export function parseTitleMarkup(source: string): TitleWord[] {
  const words: TitleWord[] = [];
  let open = false;
  for (const raw of source.split(' ')) {
    let text = raw;
    if (text.startsWith('*')) {
      open = true;
      text = text.slice(1);
    }
    const bold = open;
    if (text.includes('*')) {
      text = text.replace('*', '');
      open = false;
    }
    if (text) words.push({ text, bold });
  }
  return words;
}

export function plainTitle(source: string): string {
  return parseTitleMarkup(source)
    .map((word) => word.text)
    .join(' ');
}
