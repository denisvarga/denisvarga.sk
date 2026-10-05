import { fileURLToPath } from 'node:url';
import { PROJECT_INFO } from '../../shared/projects.ts';

export interface ShotProject {
  readonly name: string;
  readonly url: string;
  readonly slug: string;
}

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const SHOTS_DIR = `${ROOT}spikes/project-shots`;
export const RAW_DIR = `${SHOTS_DIR}/raw`;
export const SAMPLES_DIR = `${SHOTS_DIR}/samples`;

export async function loadProjects(only: readonly string[] = []): Promise<ShotProject[]> {
  const all = PROJECT_INFO.map(({ name, url, slug }) => ({ name, url, slug }));
  if (only.length === 0) return all;
  const unknown = only.filter((slug) => !all.some((p) => p.slug === slug));
  if (unknown.length > 0) throw new Error(`Unknown slug(s): ${unknown.join(', ')}`);
  return all.filter((p) => only.includes(p.slug));
}

export function domainOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}

export function argList(flag: string): string[] {
  const i = process.argv.indexOf(flag);
  const value = i === -1 ? undefined : process.argv[i + 1];
  return value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
}
