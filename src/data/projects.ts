import gold123 from '../assets/projects/123gold.webp';
import adrianastudio from '../assets/projects/adrianastudio.webp';
import akbaltazarovic from '../assets/projects/akbaltazarovic.webp';
import autoomnium from '../assets/projects/autoomnium.webp';
import brixx from '../assets/projects/brixx.webp';
import cherries from '../assets/projects/cherries.webp';
import chiptech from '../assets/projects/chiptech.webp';
import denva from '../assets/projects/denva.webp';
import dermateq from '../assets/projects/dermateq.webp';
import elektrarnapiestany from '../assets/projects/elektrarnapiestany.webp';
import jaroslavkostial from '../assets/projects/jaroslavkostial.webp';
import jurajmikus from '../assets/projects/jurajmikus.webp';
import ledpixel from '../assets/projects/ledpixel.webp';
import limoprestige from '../assets/projects/limoprestige.webp';
import lekar from '../assets/projects/lekar.webp';
import madad from '../assets/projects/madad.webp';
import monkeystudios from '../assets/projects/monkeystudios.webp';
import najkoberce from '../assets/projects/najkoberce.webp';
import narodnyfutbalovystadion from '../assets/projects/narodnyfutbalovystadion.webp';
import norahorvathova from '../assets/projects/norahorvathova.webp';
import novatrnita from '../assets/projects/novatrnita.webp';
import onlineziak from '../assets/projects/onlineziak.webp';
import pangeas from '../assets/projects/pangeas.webp';
import redcross from '../assets/projects/redcross.webp';
import rkovacovsky from '../assets/projects/rkovacovsky.webp';
import routie from '../assets/projects/routie.webp';
import sadimebuducnost from '../assets/projects/sadimebuducnost.webp';
import saunika from '../assets/projects/saunika.webp';
import schoolofarts from '../assets/projects/schoolofarts.webp';
import secondBrain from '../assets/projects/second-brain.webp';
import tatranskyprofil from '../assets/projects/tatranskyprofil.webp';
import tomaflora from '../assets/projects/tomaflora.webp';
import vibration from '../assets/projects/vibration.webp';
import vonavydomov from '../assets/projects/vonavydomov.webp';
import zanzara from '../assets/projects/zanzara.webp';
import zlatnictvohorvath from '../assets/projects/zlatnictvohorvath.webp';
import { PROJECT_INFO, type ProjectInfo } from '../../shared/projects';

export type { ProjectContext } from '../../shared/projects';

export interface Project extends ProjectInfo {
  readonly image: string;
}

export const PROJECT_IMAGE_SIZE = { width: 1280, height: 800 } as const;

const IMAGES: Readonly<Record<string, string>> = {
  '123gold': gold123,
  adrianastudio,
  akbaltazarovic,
  autoomnium,
  brixx,
  cherries,
  chiptech,
  denva,
  dermateq,
  elektrarnapiestany,
  jaroslavkostial,
  jurajmikus,
  ledpixel,
  limoprestige,
  lekar,
  madad,
  monkeystudios,
  najkoberce,
  narodnyfutbalovystadion,
  norahorvathova,
  novatrnita,
  onlineziak,
  pangeas,
  redcross,
  rkovacovsky,
  routie,
  sadimebuducnost,
  saunika,
  schoolofarts,
  'second-brain': secondBrain,
  tatranskyprofil,
  tomaflora,
  vibration,
  vonavydomov,
  zanzara,
  zlatnictvohorvath,
};

export const PROJECTS: readonly Project[] = PROJECT_INFO.map((info) => {
  const image = IMAGES[info.slug];
  if (!image) throw new Error(`No screenshot imported for project ${info.slug}`);
  return { ...info, image };
});
