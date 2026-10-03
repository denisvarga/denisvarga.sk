import { useRef, type ReactNode } from 'react';
import pill from '../../components/pill-link.module.css';
import { SplitHeading } from '../../components/split-heading';
import { LINKEDIN_URL } from '../../i18n/head-copy';
import { useLang } from '../../i18n/lang-context';
import { contact } from '../../i18n/ui-copy';
import { SiteFooter } from '../../layout/site-footer';
import { useMagnet } from '../../motion/use-magnet';
import { useReveal } from '../../motion/use-reveal';
import styles from './contact.module.css';

interface MagnetLinkProps {
  readonly href: string;
  readonly tone: 'dark' | 'outline';
  /** Opens the link in a new tab with this rel; cross-origin links also drop the referrer. */
  readonly newTabRel?: 'noopener' | 'noopener noreferrer';
  readonly children: ReactNode;
}

function MagnetLink({ href, tone, newTabRel, children }: MagnetLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnet(ref);
  return (
    <a
      ref={ref}
      href={href}
      className={`${pill.pill} ${pill[tone]} ${styles.link}`}
      {...(newTabRel ? { target: '_blank', rel: newTabRel } : {})}
    >
      {children}
    </a>
  );
}

export function ContactSection() {
  const { lang, t } = useLang();
  const links = contact[lang];
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
            <MagnetLink href={links.emailHref} tone="dark">
              {links.email}
            </MagnetLink>
            <MagnetLink href={links.phoneHref} tone="outline">
              {links.phone}
            </MagnetLink>
            <MagnetLink href={links.cvHref} tone="outline" newTabRel="noopener">
              <span>{t.contact.cv}</span>
              <span aria-hidden="true">↓</span>
            </MagnetLink>
            <MagnetLink href={LINKEDIN_URL} tone="outline" newTabRel="noopener noreferrer">
              LinkedIn
            </MagnetLink>
          </div>
        </div>
        <SiteFooter />
      </div>
    </section>
  );
}
