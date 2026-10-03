import type { ReactNode } from 'react';
import { JOBS } from '../data/jobs';
import { PROJECTS } from '../data/projects';
import { SKILLS, skillLabel } from '../data/skills';
import { GITHUB_URL, headCopy, LINKEDIN_URL } from '../i18n/head-copy';
import type { Lang } from '../i18n/types';
import { contact } from '../i18n/ui-copy';
import { parseTitleMarkup, plainTitle } from '../lib/title-markup';
import { CV_NAME, cvCopy, cvDate, cvFacts, cvLabels, displayUrl, typeset } from './cv-copy';

export interface CvDocumentProps {
  readonly lang: Lang;
  readonly portraitSrc: string;
  /** The footer shows this date in Europe/Bratislava. */
  readonly generatedAt: Date;
}

function Section({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return (
    <section className={`sec ${className}`}>
      <h2 className="sec-label">{label}</h2>
      <div className="sec-body">{children}</div>
    </section>
  );
}

// Same light/bold contrast as the site's headings, without the '*' markup characters.
function Emphasis({ markup }: { markup: string }) {
  return parseTitleMarkup(markup).map((word, i) => (
    <span key={`${i}-${word.text}`} className={word.bold ? 'strong' : undefined}>
      {i > 0 ? ` ${word.text}` : word.text}
    </span>
  ));
}

function Header({ lang, portraitSrc }: { lang: Lang; portraitSrc: string }) {
  const { email, emailHref, phone, phoneHref } = contact[lang];
  const { origin, jobTitle } = headCopy[lang];
  const links: ReadonlyArray<readonly [href: string, text: string]> = [
    [emailHref, email],
    [phoneHref, phone],
    [origin, displayUrl(origin)],
    [GITHUB_URL, displayUrl(GITHUB_URL)],
    [LINKEDIN_URL, displayUrl(LINKEDIN_URL)],
  ];
  return (
    <header className="head">
      <img className="portrait" src={portraitSrc} alt={CV_NAME} width={640} height={640} />
      <div className="identity">
        <h1 className="name">{CV_NAME}</h1>
        <p className="job-title">{jobTitle}</p>
      </div>
      <section className="contact">
        <h2 className="sec-label">{cvLabels[lang].contact}</h2>
        <ul className="contact-list">
          <li>{cvFacts[lang].location}</li>
          {links.map(([href, text]) => (
            <li key={href}>
              <a href={href}>{text}</a>
            </li>
          ))}
        </ul>
      </section>
    </header>
  );
}

export function CvDocument({ lang, portraitSrc, generatedAt }: CvDocumentProps) {
  const t = cvCopy[lang];
  const label = cvLabels[lang];
  const facts = cvFacts[lang];
  const text = (source: string) => typeset(plainTitle(source), lang);

  return (
    <article className="cv">
      <Header lang={lang} portraitSrc={portraitSrc} />

      <Section label={label.profile} className="profile">
        <p className="lead">{text(t.hero.lead)}</p>
        <p>{text(t.about.body)}</p>
      </Section>

      <Section label={label.experience} className="experience">
        <ol className="jobs">
          {JOBS.map((job) => (
            <li key={job.company} className="job">
              <span className="period">{`${job.period.start} - ${job.period.end ?? t.exp.present}`}</span>
              <div>
                <h3 className="job-head">
                  {job.company}
                  <span className="role">{`, ${job.role[lang]}`}</span>
                </h3>
                <p>{text(job.text[lang])}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section label={label.ai} className="ai">
        <p className="ai-title">
          <Emphasis markup={t.ai.title} />
        </p>
        <p>{text(t.ai.lead)}</p>
        <dl className="tools">
          {t.ai.tools.map((tool) => (
            <div key={tool.name} className="tool">
              <dt>{tool.name}</dt>
              <dd>{text(tool.desc)}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section label={label.skills} className="skills">
        <dl className="skill-list">
          {SKILLS.map((group) => (
            <div key={group.name.en} className="skill">
              <dt>{group.name[lang]}</dt>
              <dd>{text(group.items.map((item) => skillLabel(item, lang)).join(', '))}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section label={label.languages} className="languages">
        <p>{text(facts.languages)}</p>
      </Section>

      <Section label={label.education} className="education">
        <p>{text(facts.education)}</p>
      </Section>

      <Section label={label.projects} className="projects">
        <ul className="project-list">
          {PROJECTS.map((project) => (
            <li key={project.slug} className="project">
              <span className="project-name">{project.name}</span>{' '}
              <a className="domain" href={project.url}>
                {displayUrl(project.url)}
              </a>
              <span className="project-desc">{text(project.desc[lang])}</span>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="foot">{label.generated(cvDate(generatedAt, lang))}</footer>
    </article>
  );
}
