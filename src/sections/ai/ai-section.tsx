import { useCallback, useId, useRef, useState } from 'react';
import heading from '../../components/split-heading.module.css';
import { SplitHeading } from '../../components/split-heading';
import { demosEn } from '../../data/demos-en';
import { demosSk } from '../../data/demos-sk';
import { useLang } from '../../i18n/lang-context';
import { useReveal } from '../../motion/use-reveal';
import { AiToolList } from './ai-tool-list';
import { AskAgent } from './ask-agent';
import styles from './ai.module.css';
import { TerminalDemo } from './terminal-demo';

const DEMOS = { sk: demosSk, en: demosEn } as const;

interface ToolRun {
  readonly tool: number;
  /** Bumped on every pick so clicking the active tool restarts its demo, as in the design. */
  readonly run: number;
}

export function AiSection() {
  const { lang, t } = useLang();
  const [{ tool, run }, setRun] = useState<ToolRun>({ tool: 0, run: 0 });
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const terminalId = useId();
  const labelRef = useRef<HTMLSpanElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  useReveal(labelRef);
  useReveal(leadRef);
  useReveal(rowRef);

  const demos = DEMOS[lang];
  const demo = demos[tool] ?? demos[0];
  const pick = useCallback((next: number) => setRun((s) => ({ tool: next, run: s.run + 1 })), []);
  const advance = useCallback(() => setRun((s) => ({ tool: (s.tool + 1) % demos.length, run: s.run + 1 })), [demos.length]);

  return (
    <section data-sec className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <span ref={labelRef} data-reveal className={styles.label}>
              {t.ai.label}
            </span>
            <SplitHeading as="h2" text={t.ai.title} className={`${heading.sectionTitle} ${styles.title}`} />
          </div>
          <p ref={leadRef} data-reveal className={styles.lead}>
            {t.ai.lead}
          </p>
        </div>
        <div ref={rowRef} data-reveal className={styles.row}>
          <AiToolList tools={t.ai.tools} active={tool} terminalId={terminalId} barRefs={barRefs} onPick={pick} />
          {demo && (
            <TerminalDemo
              id={terminalId}
              demo={demo}
              tool={tool}
              runKey={`${lang}:${tool}:${run}`}
              barRefs={barRefs}
              onDone={advance}
            />
          )}
        </div>
        <AskAgent />
      </div>
    </section>
  );
}
