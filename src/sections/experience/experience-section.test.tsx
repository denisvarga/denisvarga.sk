import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { JOBS } from '../../data/jobs';
import { LangProvider } from '../../i18n/lang-context';
import { LANGS } from '../../i18n/types';
import { ExperienceSection } from './experience-section';

describe.each(LANGS)('ExperienceSection (%s)', (lang) => {
  it('gives every job an h3 with the company and the role, under the section h2', () => {
    const html = renderToString(
      <LangProvider lang={lang}>
        <ExperienceSection />
      </LangProvider>,
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect(doc.querySelectorAll('h2')).toHaveLength(1);
    expect([...doc.querySelectorAll('h3')].map((h) => h.textContent)).toEqual(JOBS.map((job) => `${job.company} ${job.role[lang]}`));
  });
});
