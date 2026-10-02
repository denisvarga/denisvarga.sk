import avif1024 from './denis-cutout-1024.avif';
import avif640 from './denis-cutout-640.avif';
import webp1024 from './denis-cutout-1024.webp';
import webp640 from './denis-cutout-640.webp';

export const heroImage = {
  width: 1024,
  height: 1024,
  src: webp1024,
  avifSrcSet: `${avif640} 640w, ${avif1024} 1024w`,
  webpSrcSet: `${webp640} 640w, ${webp1024} 1024w`,
} as const;
