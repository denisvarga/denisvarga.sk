import { JOBS } from '../data/jobs';
import { PROJECTS, type ProjectContext } from '../data/projects';
import { SKILLS, skillLabel } from '../data/skills';
import { copyEn } from '../i18n/copy-en';
import { headCopy, LINKEDIN_URL, SOURCE_URL } from '../i18n/head-copy';
import { contact } from '../i18n/ui-copy';

const EN = headCopy.en;
const SK = headCopy.sk;
const plain = (markup: string): string => markup.replaceAll('*', '');

const PROJECT_CONTEXT: Readonly<Record<ProjectContext, string>> = {
  denva: 'freelance under Denva (denva.studio)',
  grandpano: 'built as an employee of GrandPano',
  own: 'his own project',
};

function contactLines(): string[] {
  return [
    `- Email (English): ${EN.email}`,
    `- Email (Slovak): ${SK.email}`,
    `- Phone: ${contact.en.phone}`,
    `- LinkedIn: ${LINKEDIN_URL}`,
    `- Source code of this site: ${SOURCE_URL}`,
  ];
}

/** llmstxt.org index: what the site is and where the plain-text CV lives. */
export function buildLlmsTxt(): string {
  return [
    '# Denis Varga',
    '',
    `> ${EN.jobTitle}. ${EN.description}`,
    '',
    `Personal CV site, in English at ${EN.origin}/ and in Slovak at ${SK.origin}/. Both pages carry the same content.`,
    '',
    '## CV',
    `- [Full CV as plain text](${SK.origin}/llms-full.txt): profile, experience, approach to AI, skills, projects and contact`,
    `- [CV in English](${EN.origin}/): the full site`,
    `- [CV v slovenčine](${SK.origin}/): the full site in Slovak`,
    '',
    '## Contact',
    ...contactLines(),
    '',
    '## Optional',
    ...PROJECTS.map((p) => `- [${p.name}](${p.url}): ${p.desc.en}`),
    '',
  ].join('\n');
}

/** The whole CV as plain text in English, built from the same data as the pages. */
export function buildLlmsFullTxt(): string {
  const t = copyEn;
  return [
    '# Denis Varga',
    '',
    `> ${EN.jobTitle}. ${EN.description}`,
    '',
    '## Profile',
    plain(t.hero.lead),
    '',
    plain(t.about.title),
    '',
    t.about.body,
    '',
    ...t.about.facts.map((f) => `- ${f.label}: ${f.value}`),
    '- Location: Bratislava, Slovakia; remote preferred.',
    '- Languages: Slovak (native), English (professional working proficiency).',
    '- Education: Secondary School of Printing (Stredná odborná škola polygrafická), digital media graphic designer, 2012 - 2016.',
    '',
    '## Experience',
    ...JOBS.flatMap((job) => [
      `### ${job.company}, ${job.role.en} (${job.period.start} - ${job.period.end ?? t.exp.present})`,
      job.text.en,
      '',
    ]),
    '## How I work with AI',
    plain(t.ai.title),
    '',
    t.ai.lead,
    '',
    ...t.ai.tools.map((tool) => `- ${tool.name}: ${tool.desc}`),
    '',
    '## Skills',
    ...SKILLS.map((group) => `- ${group.name.en}: ${group.items.map((item) => skillLabel(item, 'en')).join(', ')}`),
    '',
    '## Projects',
    ...PROJECTS.map((p) => `- ${p.name} (${p.url}): ${p.kind.en}, ${PROJECT_CONTEXT[p.context]}. ${p.desc.en}.`),
    '',
    '## Contact',
    ...contactLines(),
    '',
  ].join('\n');
}
