import { heroImage } from '../../assets/hero';
import styles from './hero.module.css';

// Same srcset and sizes in both placements, so the browser fetches one file for whichever shows.
const SIZES = '(max-width: 899.98px) min(100vw, 560px), min(50vw, 86vh, 860px)';

export function HeroImage() {
  return (
    <picture className={styles.picture}>
      <source type="image/avif" srcSet={heroImage.avifSrcSet} sizes={SIZES} />
      <img
        data-heroimg=""
        className={styles.img}
        src={heroImage.src}
        srcSet={heroImage.webpSrcSet}
        sizes={SIZES}
        width={heroImage.width}
        height={heroImage.height}
        alt="Denis Varga"
        fetchPriority="high"
      />
    </picture>
  );
}
