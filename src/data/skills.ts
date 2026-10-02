import type { Lang, Localized } from '../i18n/types';

export type SkillItem = string | Localized<string>;

export interface SkillGroup {
  readonly name: Localized<string>;
  readonly items: readonly SkillItem[];
}

export const SKILLS: readonly SkillGroup[] = [
  {
    name: { sk: 'AI a agenti', en: 'AI & agents' },
    items: [
      'Claude Code',
      'Codex',
      'Claude Agent SDK',
      'OpenAI Agents SDK',
      'LangGraph',
      { sk: 'Multi-agent orchestrácia', en: 'Multi-agent orchestration' },
      { sk: 'MCP servery a klienti', en: 'MCP servers & clients' },
      'Tool calling',
      { sk: 'Prompt a context engineering', en: 'Prompt & context engineering' },
    ],
  },
  {
    name: { sk: 'LLM a dáta', en: 'LLMs & data' },
    items: [
      'OpenAI API',
      'Anthropic API',
      'Gemini API',
      { sk: 'Lokálne modely (Ollama)', en: 'Local models (Ollama)' },
      'RAG',
      'Embeddings',
      'pgvector',
      'Structured outputs',
      { sk: 'LLM evaly', en: 'LLM evals' },
      { sk: 'AI generovanie obrázkov a videa', en: 'AI image & video generation' },
    ],
  },
  {
    name: { sk: 'Automatizácia', en: 'Automation' },
    items: [
      { sk: 'Mapovanie procesov', en: 'Process mapping' },
      'n8n',
      'Make',
      'Zapier',
      { sk: 'Webhooky a API', en: 'Webhooks & APIs' },
      'Cron',
    ],
  },
  {
    name: { sk: 'Frontend', en: 'Frontend' },
    items: ['React', 'Next.js', 'TypeScript', 'Vue.js', 'JavaScript ES6+', 'Three.js', 'GSAP', 'Lenis', 'SCSS / BEM', 'Vite', 'webpack'],
  },
  {
    name: { sk: 'Backend', en: 'Backend' },
    items: [
      'PHP',
      'Python',
      'Node.js',
      'Hono',
      'WordPress',
      'WooCommerce',
      'ACF Pro',
      'WP REST API',
      'WP-CLI',
      'Yii',
      'MySQL',
      'PostgreSQL',
      'SQLite',
    ],
  },
  {
    name: { sk: 'Infra a kvalita', en: 'Infra & quality' },
    items: [
      'Cloudflare Workers',
      'Cloudflare D1',
      'Docker',
      'Git',
      'GitHub Actions',
      'GitLab CI',
      'Caddy',
      'Traefik',
      'Vitest',
      'Playwright',
      'PHPStan',
      'ESLint',
      'Stylelint',
      'Prettier',
      'CodeRabbit',
      'MainWP',
      'Restic',
      'GlitchTip',
      'Uptime Kuma',
    ],
  },
];

export function skillLabel(item: SkillItem, lang: Lang): string {
  return typeof item === 'string' ? item : item[lang];
}
