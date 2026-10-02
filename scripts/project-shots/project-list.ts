import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export interface ShotProject {
  readonly name: string;
  readonly url: string;
  readonly slug: string;
}

export const ROOT = fileURLToPath(new URL('../..', import.meta.url));
export const SHOTS_DIR = `${ROOT}spikes/project-shots`;
export const RAW_DIR = `${SHOTS_DIR}/raw`;
export const SAMPLES_DIR = `${SHOTS_DIR}/samples`;

const SOURCE = `${ROOT}src/data/projects.ts`;
const ENTRY = /name:\s*'([^']+)',\s*url:\s*'([^']+)',\s*slug:\s*'([a-z0-9-]+)'/g;

// Parsed as text because the module imports .webp assets that tsx cannot load.
export function parseProjects(source: string): ShotProject[] {
  const projects = [...source.matchAll(ENTRY)].map(([, name = '', url = '', slug = '']) => ({ name, url, slug }));
  for (const p of projects) {
    if (!/^https:\/\/[a-z0-9.-]+\/?$/i.test(p.url)) throw new Error(`Unexpected project URL for ${p.slug}: ${p.url}`);
  }
  return projects;
}

export async function loadProjects(only: readonly string[] = []): Promise<ShotProject[]> {
  const all = parseProjects(await readFile(SOURCE, 'utf8'));
  if (all.length === 0) throw new Error(`No projects parsed from ${SOURCE}; did its shape change?`);
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
