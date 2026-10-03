import type { Copy } from './types';

export const copyEn: Copy = {
  nav: { items: ['About', 'AI', 'Work'], contact: 'Contact' },
  hero: {
    sub: 'AI developer with a product mindset',
    title: "Hi, I'm *Denis.*",
    lead: 'Almost every problem has a solution you can build. Web apps, AI agents and internal tools - fast with AI, and with a sensible approach so they make business sense too.',
    cta1: 'My work',
    cta2: 'Ask my AI agent',
    badge: 'Open to projects and roles',
  },
  about: {
    label: 'About',
    title: 'Over ten years of development. Now with AI in *every step.*',
    body: "I started in 2015 with an agency internship, went through graphic design and print, and since 2017 I've been building custom software - websites, stores, apps and internal tools. Today I work AI-first: I write code with Claude Code and Codex, and on every project I first ask what it should bring to users and the business. Whatever I don't know yet, I learn fast. I have yet to meet a reasonable problem that couldn't be solved with the right build.",
    facts: [
      { label: 'AI', value: 'Agents, MCP, Claude Code, Codex' },
      { label: 'I build', value: 'Full-stack, from idea to production' },
      { label: 'Now', value: 'Open to projects and roles' },
    ],
  },
  exp: { label: 'Experience', title: 'My *path*', present: 'present' },
  ai: {
    label: 'AI',
    title: 'AI writes, I *decide.*',
    lead: 'I hand agents what they do faster: code, tests, research and repetitive work. I decide what the product should do, how to build it and whether it makes business sense. I always check the result myself.',
    tools: [
      {
        name: 'Claude Code & Codex',
        desc: 'My main development environment. Agents write and test the code; I set the direction and guard the quality.',
      },
      {
        name: 'Agents',
        desc: 'On the Claude Agent SDK, OpenAI Agents SDK and LangGraph I build single-purpose agents and put them into teams that hand work to each other.',
      },
      {
        name: 'MCP servers',
        desc: 'Custom servers and clients through which AI works safely with WordPress, data and company tools.',
      },
      {
        name: 'Automation',
        desc: 'Make, n8n, Zapier, webhooks and APIs. I map the process and cut the useless steps first, then automate it.',
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
    error: "I couldn't answer right now. Email Denis at hello@denisvarga.dev or call +421 902 074 830.",
    suggestions: [
      'Which AI tools does he use?',
      'How was this site built?',
      'What projects has he worked on?',
      'Is he open to a new role?',
    ],
  },
  work: {
    label: 'Work',
    title: "What I've *built*",
    body: 'Custom websites, stores and apps, no page builders or bought templates. Today I build and run them with AI agents at my side.',
  },
  stack: { label: 'Tools', title: 'What I *work with*' },
  contact: {
    title: 'Interested? *Get in touch.*',
    body: "Would you like me on your team or to work together on a project? Write to me, I'd be glad to talk.",
    cv: 'Download CV',
    top: 'Back to top',
  },
};
