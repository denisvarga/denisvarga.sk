import { useLang } from '../../i18n/lang-context';
import { plainTitle } from '../../lib/title-markup';

export function HeroSection() {
  const { t } = useLang();
  return (
    <section data-sec>
      <h1>{plainTitle(t.hero.title)}</h1>
    </section>
  );
}
