import { PROJECT_DETAILS_EN } from './project-details-en';
import { PROJECT_DETAILS_SK } from './project-details-sk';
import { PROJECT_INFO, type ProjectDetailsBySlug, type ProjectInfo, type ProjectLang } from './projects';

export interface ProjectWithDetails extends ProjectInfo {
  readonly summary: Readonly<Record<ProjectLang, string>>;
  readonly scope: Readonly<Record<ProjectLang, readonly string[]>>;
}

const DETAILS: Readonly<Record<ProjectLang, ProjectDetailsBySlug>> = { sk: PROJECT_DETAILS_SK, en: PROJECT_DETAILS_EN };

function detailsOf(slug: string, lang: ProjectLang) {
  const details = DETAILS[lang][slug];
  if (!details) throw new Error(`No ${lang} details for project ${slug}`);
  return details;
}

// Both languages at once, for the Worker's facts and the prerendered llms.txt. Client code must
// not import this module: the entry would carry every drawer text again.
export const PROJECTS_WITH_DETAILS: readonly ProjectWithDetails[] = PROJECT_INFO.map((info) => {
  const sk = detailsOf(info.slug, 'sk'), en = detailsOf(info.slug, 'en');
  return { ...info, summary: { sk: sk.summary, en: en.summary }, scope: { sk: sk.scope, en: en.scope } };
});
