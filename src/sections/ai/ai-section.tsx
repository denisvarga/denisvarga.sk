import { useRef } from 'react';
import { useLang } from '../../i18n/lang-context';
import { plainTitle } from '../../lib/title-markup';
import { useReveal } from '../../motion/use-reveal';
import { AskAgent } from './ask-agent';

export function AiSection() {
  const { t } = useLang();
  const ref = useRef<HTMLHeadingElement>(null);
  useReveal(ref);
  return (
    <section data-sec>
      <h2 ref={ref} data-reveal>
        {plainTitle(t.ai.title)}
      </h2>
      <AskAgent />
    </section>
  );
}
