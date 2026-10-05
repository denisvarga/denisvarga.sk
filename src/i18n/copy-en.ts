import type { Copy } from './types';

export const copyEn: Copy = {
  nav: { items: ['About', 'AI', 'Work'], contact: 'Contact' },
  hero: {
    sub: 'AI & full-stack developer, from idea to production',
    title: "Hi, I'm *Denis.*",
    lead: "I don't see a problem as an obstacle but as a chance to make something better. First I make sure I understand it, then I design and build the right solution, whether that's a web app, an AI agent or an internal tool.",
    cta1: 'My work',
    cta2: 'Ask my AI agent',
    badge: 'Open to projects and roles',
  },
  about: {
    label: 'About',
    title: 'Building software since 2017. Now with AI at *every step.*',
    body: "I started in 2015 with an agency internship, moved through graphic design and print, and since 2017 I've been building custom websites, online stores, apps and internal tools. Today I work AI-first: AI gives me speed, versatility and more control; I set the direction. I write code with Claude Code and Codex, and on every project I first ask what it should bring to users and the business. What I don't know yet, I learn fast. And sometimes the best solution is to simplify the process, not automate it.",
    facts: [
      { label: 'AI', value: 'Agents, MCP, Claude Code, Codex' },
      { label: 'I build', value: 'Websites, apps, automation' },
      { label: 'Based in', value: 'Bratislava or remote' },
    ],
  },
  exp: { label: 'Experience', title: 'My *path*', present: 'present' },
  ai: {
    label: 'AI',
    title: 'AI writes, I *decide.*',
    lead: "I hand agents the work they do faster than I do: code, tests, research and repetitive tasks. I decide what the product should do, how to build it and whether it's worth building. I always review the result myself.",
    tools: [
      {
        name: 'Claude Code & Codex',
        desc: 'My main development environment. Agents write and test the code; I set the direction and guard the quality.',
      },
      {
        name: 'Agents',
        desc: 'I build single-purpose agents on the Claude Agent SDK, OpenAI Agents SDK and LangGraph, and combine them into teams that hand work off to each other.',
      },
      {
        name: 'MCP servers',
        desc: 'Custom servers and clients that let AI work safely with WordPress, data and company tools.',
      },
      {
        name: 'Automation',
        desc: 'Make, n8n, Zapier, webhooks and APIs. First I map the process and cut the unnecessary steps. Only then do I automate it.',
      },
    ],
    demoNote: 'Illustrative workflow, not a recorded run.',
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
    note: "The agent knows my CV. When it isn't sure, it says so and gives you my contact details.",
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
    body: 'Custom websites, online stores and apps. No page builders, no off-the-shelf templates. Today I build and run them with AI agents at my side.',
    all: 'All projects',
    hide: 'Hide list',
    contexts: { denva: 'Denva.studio', grandpano: 'At GrandPano', vibration: 'At Vibration', own: 'Own project' },
  },
  stack: { label: 'Tools', title: 'What I *work with*' },
  contact: {
    title: 'Interested? *Get in touch.*',
    body: "Looking for someone to join your team or work on a project with you? Email me, I'd be glad to talk.",
    cv: 'Download CV',
    top: 'Back to top',
  },
  consent: {
    label: 'Cookie consent',
    text: 'Analytics cookies (Google Analytics) help me see how this site is used. They only load with your consent.',
    accept: 'Accept',
    reject: 'Reject',
    granted: 'Current choice: accepted',
    denied: 'Current choice: rejected',
    details: 'Which cookies?',
    cookies: [
      { name: 'dv-consent', desc: 'localStorage, stores your choice, necessary' },
      { name: '_ga', desc: 'Google Analytics, distinguishes visitors, 2 years' },
      { name: '_ga_XMK9J72476', desc: 'Google Analytics, session state, 2 years' },
    ],
    settings: 'Cookie settings',
  },
};
