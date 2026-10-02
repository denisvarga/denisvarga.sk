import type { Copy } from './types';

export const copyEn: Copy = {
  nav: { items: ['About', 'AI', 'Work'], contact: 'Contact' },
  hero: {
    sub: 'AI developer, agents & automation',
    title: "Hi, I'm *Denis.*",
    lead: "Anything reasonable can be automated. I build AI agents, automations and custom software that takes the routine off people's hands.",
    cta1: 'My work',
    cta2: 'Ask my AI agent',
    badge: 'Open to projects and roles',
  },
  about: {
    label: 'About',
    title: 'Over ten years of development. Now with AI in *every step.*',
    body: "I started in 2015 with an agency internship, went through graphic design and print, and since 2017 I've been building custom software - websites, stores, apps and internal tools. Today I work AI-first: I write code with Claude Code and Codex, put agents wherever work repeats, and whatever I don't know yet, I learn fast. I have yet to meet a reasonable problem that can't be solved.",
    facts: [
      { label: 'AI', value: 'Agents, MCP, Claude Code, Codex' },
      { label: 'I build', value: 'React, Next.js, WordPress, Vue.js' },
      { label: 'Now', value: 'Open to projects and roles' },
    ],
  },
  exp: { label: 'Experience', title: 'My *path*' },
  ai: {
    label: 'AI',
    title: 'I leave the routine *to agents.*',
    lead: "I look for work someone does by hand every week. If it makes sense, I automate it. If it doesn't, I suggest simplifying or dropping it - that saves time too. After that, a person only checks the result.",
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
    error: "I couldn't answer right now. Email Denis at hello@denisvarga.sk or call +421 902 074 830.",
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
