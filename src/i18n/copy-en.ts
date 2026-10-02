import type { Copy } from './types';

export const copyEn: Copy = {
  nav: { items: ['About', 'AI', 'Work'], contact: 'Contact' },
  hero: {
    sub: 'AI developer & WordPress specialist',
    title: "Hi, I'm *Denis.*",
    lead: 'I build custom websites and teach them to work on their own - with AI agents, MCP servers and automation.',
    cta1: 'My work',
    cta2: 'Ask my AI agent',
    badge: 'Open to projects and roles',
  },
  about: {
    label: 'About',
    title: "I've built websites since 2015. With AI since it started to *make sense.*",
    body: "I started with an agency internship, spent a year in graphic design and print, and since 2017 I've been building custom websites - my own themes, no page builders. Today I write most of my code in Claude Code and look for places where an agent can take over repetitive work from a person.",
    facts: [
      { label: 'I build', value: 'WordPress, WooCommerce, Vue.js, PHP' },
      { label: 'With AI', value: 'Claude Code, agents, MCP, n8n' },
      { label: 'Now', value: 'Open to projects and roles' },
    ],
  },
  exp: { label: 'Experience', title: "Where I've *worked*" },
  ai: {
    label: 'AI',
    title: 'How I work *with AI*',
    lead: 'My favourite thing is finding work someone does by hand every week. I map it, pick the tool and let it run. After that, a person only checks the result.',
    tools: [
      {
        name: 'Claude Code',
        desc: 'The main tool I develop in. PHPStan, ESLint and CodeRabbit make sure the code stays clean.',
      },
      {
        name: 'Agents',
        desc: 'I build single-purpose agents on the Claude Agent SDK and LangGraph and put them into teams.',
      },
      {
        name: 'MCP servers',
        desc: 'Custom servers and clients that give AI access to WordPress and website data.',
      },
      {
        name: 'Automation',
        desc: 'Make, n8n, Zapier, webhooks and API integrations. I map the process first, then let it run.',
      },
    ],
  },
  ask: {
    label: 'My AI agent',
    title1: 'Ask about me,',
    title2: 'my agent answers.',
    placeholder: 'What would you like to know?',
    send: 'Ask',
    thinking: 'Thinking…',
    you: 'You',
    agent: 'Agent',
    note: "The agent knows my CV. When it isn't sure, it says so and gives you my contact.",
    error: "I couldn't answer right now. Email Denis at hello@denisvarga.sk or call +421 902 074 830.",
    suggestions: [
      'Which AI tools does he use?',
      'Does he build WooCommerce stores?',
      'What is Denva Fleet?',
      'Is he available?',
    ],
  },
  work: {
    label: 'Work',
    title: "Websites I've *built*",
    body: 'Custom themes, no page builders or bought templates. Happy to also show team projects I worked on.',
  },
  stack: { label: 'Tools', title: 'What I *work with*' },
  contact: {
    title: 'Got a project or a place on your team? *Write to me.*',
    body: 'Happy to look at anything - from a single site to a long-term collaboration.',
    cv: 'Download CV',
    top: 'Back to top',
  },
};
