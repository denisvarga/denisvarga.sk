import { PROJECTS, type Project } from '../data/projects';
import type { Lang } from '../i18n/types';
import { ui } from '../i18n/ui-copy';
import { cvLabels, displayUrl, typeset } from './cv-copy';

// Vibration work is one run of names: with descriptions or domains the CV runs past three pages.
const DETAILED = PROJECTS.filter((project) => project.context !== 'vibration');
const COMPACT = PROJECTS.filter((project) => project.context === 'vibration');

// Plain text, not a link: a PDF viewer may pass this CV on as the referrer, and the portfolio
// sites must not see where a visit came from.
function Domain({ project, lang }: { project: Project; lang: Lang }) {
  return <span className="domain">{project.url ? displayUrl(project.url) : ui[lang].privateProject}</span>;
}

export function CvProjects({ lang }: { lang: Lang }) {
  const text = (value: string) => typeset(value, lang);
  return (
    <>
      <ul className="project-list">
        {DETAILED.map((project) => (
          <li key={project.slug} className="project">
            <span className="project-name">{project.name}</span> <Domain project={project} lang={lang} />
            <span className="project-desc">{text(project.desc[lang])}</span>
            {project.credit && <span className="project-credit">{text(project.credit[lang])}</span>}
          </li>
        ))}
      </ul>
      <h3 className="project-group">{cvLabels[lang].employerProjects}</h3>
      <ul className="project-list-inline">
        {COMPACT.map((project, index) => (
          <li key={project.slug} className="project">
            <span className="project-name">{project.name}</span>
            {index < COMPACT.length - 1 && ', '}
          </li>
        ))}
      </ul>
    </>
  );
}
