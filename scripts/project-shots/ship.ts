import { access } from 'node:fs/promises';
import { writeOverview, writeShipWebp } from './outputs.ts';
import { loadProjects, ROOT, SHOTS_DIR } from './project-list.ts';

// Usage: tsx scripts/project-shots/ship.ts
// Exports every final/<slug>.png master (from ai-scene.ts) to src/assets/projects/<slug>.webp at
// 1280x800 and writes final/overview-4x3.jpg from the shipped files. All projects or nothing, so the
// rail never mixes old screenshots with new scenes.

const FINAL_DIR = `${SHOTS_DIR}/final`;
const ASSETS_DIR = `${ROOT}src/assets/projects`;

const projects = await loadProjects();
const missing: string[] = [];
for (const { slug } of projects) await access(`${FINAL_DIR}/${slug}.png`).catch(() => missing.push(slug));
if (missing.length > 0) throw new Error(`Masters missing in ${FINAL_DIR}: ${missing.join(', ')}`);

let total = 0;
const shipped: { label: string; file: string }[] = [];
for (const project of projects) {
  const file = `${ASSETS_DIR}/${project.slug}.webp`;
  const bytes = await writeShipWebp(`${FINAL_DIR}/${project.slug}.png`, file);
  total += bytes;
  shipped.push({ label: project.name, file });
  console.log(`${project.slug}.webp: ${(bytes / 1024).toFixed(1)} KB`);
}
console.log(`total: ${(total / 1024).toFixed(1)} KB for ${projects.length} images`);
await writeOverview(shipped, `${FINAL_DIR}/overview-4x3.jpg`);
console.log(`${FINAL_DIR}/overview-4x3.jpg`);
