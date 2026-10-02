// One style guide for every project so the 12 scenes read as a set; only the surface and the
// environment change. The screen is keyed magenta (not green) because stadium turf and plants
// are natural greens, and the real capture is warped onto it afterwards.

interface Scene {
  readonly surface: string;
  readonly environment: string;
  readonly props: string;
}

const STYLE = (s: Scene) =>
  [
    'Photorealistic editorial interior photograph, eye-level camera, 35mm lens, 16:9 frame.',
    `A single modern slim silver aluminium laptop without any logo stands open on ${s.surface} in the foreground.`,
    'The laptop is exactly centred horizontally and sits slightly below the vertical centre of the frame.',
    'It is turned 10 to 15 degrees: the camera is slightly to the front-left, so the left edge of the screen is a little closer to the camera.',
    'The whole laptop, including its base, is fully visible and spans only about 33 percent of the image width, with generous empty space all around it.',
    'The display is switched on and shows a perfectly flat, uniform, pure chroma-key magenta (#FF00FF) fill from edge to edge, with no notch, reflection, glare, UI or text.',
    `Background: ${s.environment}, softly out of focus with shallow depth of field.`,
    `On the surface at the sides, never in front of the screen: ${s.props}.`,
    'Soft natural daylight from a side window, warm-neutral colour grading, soft contrast, muted saturation, airy light tones that sit well on a light warm-grey (#ECECE9) web page.',
    'No people, no faces, no hands, no animals, no readable text, signage, logos or brand marks anywhere, no other screens or devices, no magenta or purple objects.',
  ].join(' ');

const SCENES: Record<string, Scene> = {
  narodnyfutbalovystadion: {
    surface: 'a matte light-grey concrete counter',
    environment: 'the bright hospitality lounge of a modern football stadium, floor-to-ceiling windows overlooking the green pitch and empty stands in daylight',
    props: 'a glass of water and a folded match programme with a plain cover',
  },
  pangeas: {
    surface: 'a light oak worktable',
    environment: 'a calm fashion and dressmaking studio with a dress form, a rail of handmade clothes and linen fabrics in beige and blush tones',
    props: 'folded linen fabric, a tailor measuring tape and wooden thread spools',
  },
  routie: {
    surface: 'a light wooden desk',
    environment: 'the bright home studio of a cycling enthusiast, framed printed cycling route map artworks on the wall and a road bike leaning against the wall',
    props: 'a rolled-up printed route map and a small 3D-printed terrain model',
  },
  dermateq: {
    surface: 'a clean white stone counter',
    environment: 'a modern dermatology and aesthetic clinic, a white treatment room with a treatment bed and a sleek aesthetic device',
    props: 'a small white skincare bottle and a neatly folded white towel',
  },
  cherries: {
    surface: 'a pale blush marble manicure table',
    environment: 'an elegant nail salon in soft blush and cream tones, shelves with rows of nude and pastel nail polish bottles',
    props: 'a few nude nail polish bottles and a small vase of dried flowers',
  },
  autoomnium: {
    surface: 'a glossy white showroom reception counter',
    environment: 'a bright premium car showroom with a silver car, large windows and a polished concrete floor',
    props: 'a car key on a small leather tray',
  },
  saunika: {
    surface: 'a clean light-grey workshop counter',
    environment: 'a bright, tidy car audio installation studio with a modern car with its doors open',
    props: 'a car loudspeaker and a compact car amplifier',
  },
  akbaltazarovic: {
    surface: 'a walnut desk with a leather desk pad',
    environment: 'a calm, light law office with bookshelves of leather-bound books and a tall window',
    props: 'a fountain pen and a closed leather notebook',
  },
  adrianastudio: {
    surface: 'a travertine table',
    environment: 'an interior design studio with a wall of material samples, fabric swatches and designer furniture',
    props: 'fabric swatches, small stone and wood samples',
  },
  schoolofarts: {
    surface: 'a clean light wooden art table',
    environment: 'a bright art school studio with easels, canvases and shelves of handmade ceramics',
    props: 'a jar of paintbrushes and a small handmade clay pot',
  },
  norahorvathova: {
    surface: 'a light wooden meeting table',
    environment: 'a bright municipal hall meeting room with tall windows looking onto a small-town square',
    props: 'a ceramic cup of coffee and a closed paper folder',
  },
  denva: {
    surface: 'a light oak desk',
    environment: 'a calm, minimal design and development studio with light walls, a shelf of books and a potted plant by a large window',
    props: 'a ceramic coffee cup and a closed notebook with a pencil',
  },
};

export function scenePrompt(slug: string): string {
  const scene = SCENES[slug];
  if (!scene) throw new Error(`${slug}: no scene defined in scene-prompts.ts`);
  return STYLE(scene);
}
