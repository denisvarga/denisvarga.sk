// Canvas is 1600x1000 (16:10, drawer). The rail crops it to the central 1334x1000 (4:3), so every
// device stays inside x 133..1467 with breathing room.
export const CANVAS = { width: 1600, height: 1000 } as const;

export const VARIANTS = ['a', 'b', 'b-name'] as const;
export type Variant = (typeof VARIANTS)[number];

export interface TemplateInput {
  readonly variant: Variant;
  readonly desktopUrl: string;
  readonly mobileUrl: string;
  readonly domain: string;
  readonly name: string;
  readonly tint: string;
  readonly fontsUrl: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const BASE_CSS = (fontsUrl: string) => `
@import url('${fontsUrl}/manrope/index.css');
@import url('${fontsUrl}/jetbrains-mono/index.css');
* { box-sizing: border-box; margin: 0; }
html, body { width: ${CANVAS.width}px; height: ${CANVAS.height}px; overflow: hidden; }
body { position: relative; font-family: 'Manrope Variable', sans-serif; color: #131416; -webkit-font-smoothing: antialiased; }
.stage { position: absolute; inset: 0; }
.browser { position: absolute; overflow: hidden; border-radius: 14px; background: #fff; }
.bar { position: relative; display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 18px;
  background: #f7f7f5; border-bottom: 1px solid rgb(19 20 22 / 0.07); }
.bar i { width: 11px; height: 11px; border-radius: 50%; background: #d6d6d3; }
.url { position: absolute; left: 50%; transform: translateX(-50%); padding: 7px 16px; border-radius: 999px;
  background: #ececea; font: 500 13px/1 'JetBrains Mono Variable', monospace; letter-spacing: 0.01em; color: #5a5c60; }
.browser img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; object-position: top; }
.phone { position: absolute; padding: 9px; border-radius: 48px; background: #131416;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12); }
.phone img { display: block; width: 100%; aspect-ratio: 390 / 844; border-radius: 39px; object-fit: cover; object-position: top; }
`;

const EDITORIAL_CSS = `
body { background: radial-gradient(80% 70% at 40% 40%, #ececea 0%, #e4e4e0 70%); }
.stage { perspective: 2200px; perspective-origin: 30% 45%; }
.browser { left: 200px; top: 168px; width: 1040px; transform-origin: 0 50%;
  transform: rotateY(14deg) rotateX(4deg);
  box-shadow: 0 2px 6px rgb(19 20 22 / 0.05), 0 40px 80px -30px rgb(19 20 22 / 0.35), 0 90px 140px -60px rgb(19 20 22 / 0.3); }
.phone { left: 1118px; top: 330px; width: 256px;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12), 0 40px 60px -20px rgb(19 20 22 / 0.45), 0 90px 140px -40px rgb(19 20 22 / 0.35); }
.rule { position: absolute; left: 200px; right: 200px; top: 112px; height: 1px; background: rgb(19 20 22 / 0.14); }
.rule::before { content: ''; position: absolute; left: 0; top: -1px; width: 56px; height: 3px; background: #f2541b; }
.label { position: absolute; left: 200px; bottom: 904px; font-size: 30px; font-weight: 300; letter-spacing: -0.035em; line-height: 1; }
.domain { position: absolute; right: 200px; bottom: 906px; font: 500 14px/1 'JetBrains Mono Variable', monospace; color: #5a5c60; }
/* Without the name the rule becomes a baseline under the devices instead of an empty header. */
.v-b .browser { top: 120px; }
.v-b .phone { top: 286px; }
.v-b .rule { top: 892px; }
`;

const VARIANT_CSS: Record<Variant, (tint: string) => string> = {
  a: (tint) => `
body { background: radial-gradient(85% 75% at 42% 34%, color-mix(in srgb, ${tint} 55%, #fff) 0%, ${tint} 72%); }
.browser { left: 213px; top: 122px; width: 1010px;
  box-shadow: 0 2px 6px rgb(19 20 22 / 0.05), 0 28px 56px -16px rgb(19 20 22 / 0.2), 0 70px 130px -40px rgb(19 20 22 / 0.32); }
.phone { left: 1139px; top: 372px; width: 248px;
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12), 0 30px 60px -12px rgb(19 20 22 / 0.38), 0 80px 140px -30px rgb(19 20 22 / 0.4); }
`,
  b: () => EDITORIAL_CSS,
  'b-name': () => EDITORIAL_CSS,
};

export function renderHtml(input: TemplateInput): string {
  const editorial = input.variant !== 'a';
  const extras = editorial
    ? `<div class="rule"></div>${input.variant === 'b-name' ? `<div class="label">${esc(input.name)}</div><div class="domain">${esc(input.domain)}</div>` : ''}`
    : '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS(input.fontsUrl)}${VARIANT_CSS[input.variant](input.tint)}</style></head>
<body class="v-${input.variant}"><div class="stage">
<div class="browser"><div class="bar"><i></i><i></i><i></i><span class="url">${esc(input.domain)}</span></div><img src="${input.desktopUrl}" alt=""></div>
<div class="phone"><img src="${input.mobileUrl}" alt=""></div>
</div>${extras}</body></html>`;
}
