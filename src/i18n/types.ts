import type { ProjectContext } from '../../shared/projects';

export type Lang = 'sk' | 'en';

export const LANGS: readonly Lang[] = ['sk', 'en'];

export type Localized<T> = Readonly<Record<Lang, T>>;

export interface Fact {
  readonly label: string;
  readonly value: string;
}

export interface AiTool {
  readonly name: string;
  readonly desc: string;
}

export interface CookieInfo {
  readonly name: string;
  readonly desc: string;
}

type Four<T> = readonly [T, T, T, T];
type Three<T> = readonly [T, T, T];

export interface Copy {
  readonly nav: { readonly items: Three<string>; readonly contact: string };
  readonly hero: {
    readonly sub: string;
    readonly title: string;
    readonly lead: string;
    readonly cta1: string;
    readonly cta2: string;
    readonly badge: string;
  };
  readonly about: {
    readonly label: string;
    readonly title: string;
    readonly body: string;
    readonly facts: Three<Fact>;
  };
  readonly exp: { readonly label: string; readonly title: string };
  readonly ai: {
    readonly label: string;
    readonly title: string;
    readonly lead: string;
    readonly tools: Four<AiTool>;
    readonly demoNote: string;
  };
  readonly ask: {
    readonly label: string;
    readonly title1: string;
    readonly title2: string;
    readonly placeholder: string;
    readonly send: string;
    readonly thinking: string;
    readonly you: string;
    readonly agent: string;
    readonly note: string;
    readonly error: string;
    readonly suggestions: Four<string>;
  };
  readonly work: {
    readonly label: string;
    readonly title: string;
    readonly body: string;
    readonly all: string;
    readonly hide: string;
    readonly contexts: Readonly<Record<ProjectContext, string>>;
  };
  readonly stack: { readonly label: string; readonly title: string };
  readonly contact: {
    readonly title: string;
    readonly body: string;
    readonly cv: string;
    readonly top: string;
  };
  readonly consent: {
    readonly label: string;
    readonly text: string;
    readonly accept: string;
    readonly reject: string;
    readonly granted: string;
    readonly denied: string;
    readonly details: string;
    readonly cookies: Three<CookieInfo>;
    readonly settings: string;
  };
}

export interface UiCopy {
  readonly more: string;
  readonly scope: string;
  readonly open: string;
  readonly privateProject: string;
  readonly close: string;
  readonly menu: string;
  readonly menuClose: string;
  readonly prev: string;
  readonly next: string;
}

export type DemoLineKind = 'cmd' | 'out' | 'sub' | 'ok';

export type DemoLine = readonly [kind: DemoLineKind, text: string];

export interface Demo {
  readonly title: string;
  readonly lines: readonly DemoLine[];
}
