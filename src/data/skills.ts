import type { Lang, Localized } from '../i18n/types';

export type SkillItem = string | Localized<string>;

export interface SkillGroup {
  readonly name: Localized<string>;
  readonly items: readonly SkillItem[];
}

export const SKILLS: readonly SkillGroup[] = [
  {
    name: { sk: 'AI', en: 'AI' },
    items: [
      'Claude Code',
      'Claude Agent SDK',
      'LangGraph',
      { sk: 'Multi-agent orchestrácia', en: 'Multi-agent orchestration' },
      { sk: 'MCP servery a klienti', en: 'MCP servers & clients' },
      'Tool calling',
      { sk: 'Prompt a context engineering', en: 'Prompt & context engineering' },
    ],
  },
  {
    name: { sk: 'Automatizácia', en: 'Automation' },
    items: ['Make', 'n8n', 'Zapier', { sk: 'Webhooky a API', en: 'Webhooks & APIs' }, 'Cron'],
  },
  {
    name: { sk: 'Frontend', en: 'Frontend' },
    items: ['JavaScript ES6+', 'Vue.js', 'SCSS / BEM', 'GSAP', 'Lenis', 'Vite', 'webpack'],
  },
  {
    name: { sk: 'Backend', en: 'Backend' },
    items: ['PHP', 'Python', 'WordPress', 'WooCommerce', 'ACF Pro', 'WP REST API', 'WP-CLI', 'Yii', 'MySQL'],
  },
  {
    name: { sk: 'Kvalita kódu', en: 'Code quality' },
    items: ['PHPStan', 'ESLint', 'Stylelint', 'Prettier', 'Git', 'CodeRabbit'],
  },
  {
    name: { sk: 'Servery', en: 'Servers' },
    items: ['Docker', 'GitLab CI', 'Cloudflare', 'Caddy', 'Traefik', 'MainWP', 'Restic', 'GlitchTip', 'Uptime Kuma'],
  },
];

export function skillLabel(item: SkillItem, lang: Lang): string {
  return typeof item === 'string' ? item : item[lang];
}
