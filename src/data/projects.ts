import adrianastudio from '../assets/projects/adrianastudio.webp';
import akbaltazarovic from '../assets/projects/akbaltazarovic.webp';
import autoomnium from '../assets/projects/autoomnium.webp';
import brixx from '../assets/projects/brixx.webp';
import cherries from '../assets/projects/cherries.webp';
import denva from '../assets/projects/denva.webp';
import dermateq from '../assets/projects/dermateq.webp';
import jaroslavkostial from '../assets/projects/jaroslavkostial.webp';
import jurajmikus from '../assets/projects/jurajmikus.webp';
import ledpixel from '../assets/projects/ledpixel.webp';
import monkeystudios from '../assets/projects/monkeystudios.webp';
import narodnyfutbalovystadion from '../assets/projects/narodnyfutbalovystadion.webp';
import norahorvathova from '../assets/projects/norahorvathova.webp';
import novatrnita from '../assets/projects/novatrnita.webp';
import pangeas from '../assets/projects/pangeas.webp';
import rkovacovsky from '../assets/projects/rkovacovsky.webp';
import routie from '../assets/projects/routie.webp';
import saunika from '../assets/projects/saunika.webp';
import schoolofarts from '../assets/projects/schoolofarts.webp';
import secondBrain from '../assets/projects/second-brain.webp';
import zanzara from '../assets/projects/zanzara.webp';
import { PROJECT_INFO, type ProjectInfo } from '../../shared/projects';

export type { ProjectContext } from '../../shared/projects';

export interface Project extends ProjectInfo {
  readonly image: string;
}

export const PROJECT_IMAGE_SIZE = { width: 1280, height: 800 } as const;

const IMAGES: Readonly<Record<string, string>> = {
  adrianastudio,
  akbaltazarovic,
  autoomnium,
  brixx,
  cherries,
  denva,
  dermateq,
  jaroslavkostial,
  jurajmikus,
  ledpixel,
  monkeystudios,
  narodnyfutbalovystadion,
  norahorvathova,
  novatrnita,
  pangeas,
  rkovacovsky,
  routie,
  saunika,
  schoolofarts,
  'second-brain': secondBrain,
  zanzara,
};

export const PROJECTS: readonly Project[] = PROJECT_INFO.map((info) => {
  const image = IMAGES[info.slug];
  if (!image) throw new Error(`No screenshot imported for project ${info.slug}`);
  return { ...info, image };
});
