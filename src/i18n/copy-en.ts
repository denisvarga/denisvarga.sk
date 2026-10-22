import type { Copy } from './types';

export const copyEn: Copy = {
  nav: { items: ['About', 'AI', 'Work'], contact: 'Contact' },
  hero: {
    sub: 'AI & full-stack developer, from idea to production',
    title: "Hi, I'm *Denis Varga.*",
    lead: "I don't see a problem as an obstacle but as a chance to make something better. First I make sure I understand it, then I design and build the right solution, whether that's a web app, an AI agent or an internal tool.",
    cta1: 'My work',
    cta2: 'Ask my AI agent',
    badge: 'Open to projects and roles',
  },
  about: {
    label: 'About',
    title: 'Building software since 2017. Now with AI at *every step.*',
    body: "I started in 2015 with an agency internship, moved through graphic design and print, and since 2017 I've been building custom websites, online stores, apps and internal tools. Today I work AI-first: AI gives me speed, versatility and more control; I set the direction. I write code with Claude Code and Codex, and on every project I first ask what it should bring to users and the business. What I don't know yet, I learn fast. I build AI agents on the Claude Agent SDK, OpenAI Agents SDK and LangGraph, and custom MCP servers that let AI work safely with WordPress, data and company tools. I automate processes with Make and n8n. And sometimes the best solution is to simplify the process, not automate it.",
    facts: [
      { label: 'AI', value: 'Agents, MCP, Claude Code, Codex' },
      { label: 'I build', value: 'Websites, online stores (WordPress, WooCommerce), apps, automation' },
      { label: 'Based in', value: 'Bratislava, Slovakia or remote' },
    ],
  },
  exp: { label: 'Experience', title: 'My *path*' },
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
    privacyNote: 'Questions and answers are kept for 365 days without your IP address or any other identifier, and the answers come from OpenAI.',
    privacyLink: 'More on privacy',
    errors: {
      rateLimited: 'Too many questions at once, try again in a minute.',
      dailyCap: 'The agent is done for today. Email Denis at hello@denisvarga.dev.',
      fallback: "I couldn't answer right now. Email Denis at hello@denisvarga.dev or call +421 902 074 830.",
    },
    retry: 'Try again',
    suggestions: [
      'Which AI tools does he use?',
      'How was this site built?',
      'What projects has he worked on?',
    ],
    contact: {
      title: 'Message for Denis',
      lead: 'I will send Denis this message:',
      name: 'Name',
      email: 'Email',
      consent: 'By sending, you agree that Denis receives your name, email, this message and this conversation so he can reply.',
      send: 'Send to Denis',
      edit: 'Edit',
      cancel: 'Cancel',
      sent: 'Done, Denis has your message and will reply to {email}.',
      failed: 'The message did not go through. Email Denis at hello@denisvarga.dev.',
      cancelled: 'No problem, nothing was sent.',
    },
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
  privacy: {
    title: 'Privacy',
    sections: [
      {
        title: 'Who',
        text: 'The controller is Denis Varga. Send privacy questions to hello@denisvarga.dev.',
      },
      {
        title: 'What the AI chat stores',
        text: 'For each question to the agent I store the time, the language, the question and the answer, the model used, the response time, the token counts and the outcome, such as whether an answer came back. No IP address, browser details or other identifier is stored with the questions. Please do not type personal data into the chat.',
      },
      {
        title: 'Why',
        text: 'To answer your questions, protect the chat from abuse and improve the answers. The legal basis is my legitimate interest under Art. 6(1)(f) GDPR.',
      },
      {
        title: 'How long',
        text: 'Questions and answers are deleted automatically after 365 days. Database backups (Cloudflare D1 Time Travel) can keep them restorable for up to 30 more days. CSV exports I download from my private overview of the questions stay with me for the same purposes.',
      },
      {
        title: 'OpenAI',
        text: "The answers come from OpenAI, acting as my processor. Data from the EU is handled by OpenAI Ireland Limited, which also passes it to the USA under the EU standard contractual clauses in OpenAI's data processing addendum. OpenAI receives your question and the earlier questions and answers of the same conversation. My settings tell it not to store the conversation, and it does not use it to train models. It keeps abuse monitoring logs for up to 30 days, and longer only where the law requires it or to prevent harm.",
      },
      {
        title: 'Pseudonymous identifiers',
        text: 'From your IP address I derive keyed hashes that cannot be turned back into the address without the secret key. One goes to OpenAI for abuse detection. The other changes every day, counts your questions (at most 20 a day) and is deleted within three days.',
      },
      {
        title: 'Cloudflare',
        text: 'The site runs on Cloudflare, and the question log sits in a Cloudflare D1 database in the EU jurisdiction. Before a question is sent, Cloudflare Turnstile checks browser signals and your IP address to tell people from bots. Your IP address also drives the limit of 5 questions a minute, and I do not store it.',
      },
      {
        title: 'Messages to me from the chat',
        text: 'When the agent drafts a message to me and you send it, I receive your name, email, the message and your conversation with the agent by email so I can reply. Cloudflare Email Routing delivers it. The site stores none of it; the message stays in my mailbox. OpenAI does not receive the name and email from the form. Email addresses and phone numbers you type into the chat itself are replaced with placeholders in the question log.',
      },
      {
        title: 'Analytics',
        text: 'Google Analytics loads only after you accept it in the cookie bar. You can change your choice any time under Cookie settings in the footer.',
      },
      {
        title: 'Your rights',
        text: 'You can ask for access, correction, erasure or restriction, and you can object. Email hello@denisvarga.dev. Since no identifier is stored with the questions, tell me roughly when you asked and what. You can also complain to a data protection authority, in Slovakia the Úrad na ochranu osobných údajov SR.',
      },
    ],
  },
};
