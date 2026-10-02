import { useRef, type ReactNode } from 'react';
import pill from '../../components/pill-link.module.css';
import { SplitHeading } from '../../components/split-heading';
import { useLang } from '../../i18n/lang-context';
import { contact } from '../../i18n/ui-copy';
import { SiteFooter } from '../../layout/site-footer';
import { useMagnet } from '../../motion/use-magnet';
import { useReveal } from '../../motion/use-reveal';
import styles from './contact.module.css';

interface MagnetLinkProps {
  readonly href: string;
  readonly tone: 'dark' | 'outline';
  readonly external?: boolean;
  readonly children: ReactNode;
}

function MagnetLink({ href, tone, external = false, children }: MagnetLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnet(ref);
  return (
    <a
      ref={ref}
      href={href}
      className={`${pill.pill} ${pill[tone]} ${styles.link}`}
      {...(external ? { target: '_blank', rel: 'noopener' } : {})}
    >
      {children}
    </a>
  );
}

export function ContactSection() {
  const { t } = useLang();
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  useReveal(bodyRef);
  useReveal(linksRef);

  return (
    <section data-sec="" className={styles.contact}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <SplitHeading as="h2" text={t.contact.title} className={styles.title} />
          <p ref={bodyRef} className={styles.body} data-reveal="">
            {t.contact.body}
          </p>
          <div ref={linksRef} className={styles.links} data-reveal="">
            <MagnetLink href={contact.emailHref} tone="dark">
              {contact.email}
            </MagnetLink>
            <MagnetLink href={contact.phoneHref} tone="outline">
              {contact.phone}
            </MagnetLink>
            <MagnetLink href={contact.cvHref} tone="outline" external>
              <span>{t.contact.cv}</span>
              <span aria-hidden="true">↓</span>
            </MagnetLink>
          </div>
        </div>
        <SiteFooter />
      </div>
    </section>
  );
}
