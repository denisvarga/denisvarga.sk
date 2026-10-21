import { useEffect } from 'react';
import { ConsentBar } from './consent/consent-bar';
import { LangProvider } from './i18n/lang-context';
import type { Lang } from './i18n/types';
import { ProgressBar } from './layout/progress-bar';
import { SiteChrome } from './layout/site-chrome';
import { retainLayoutCache } from './motion/layout-cache';
import { MotionLayer } from './motion/motion-layer';
import { AboutSection } from './sections/about/about-section';
import { AiSection } from './sections/ai/ai-section';
import { ContactSection } from './sections/contact/contact-section';
import { ExperienceSection } from './sections/experience/experience-section';
import { HeroSection } from './sections/hero/hero-section';
import { ProjectsSection } from './sections/projects/projects-section';
import { SHOW_AI } from './sections/section-order';
import { StackSection } from './sections/stack/stack-section';

// The rendered order must match SECTIONS in sections/section-order.ts.
export function App({ lang }: { lang: Lang }) {
  useEffect(() => retainLayoutCache(), []);

  return (
    <LangProvider lang={lang}>
      <ProgressBar />
      <SiteChrome />
      <MotionLayer />
      <main id="top">
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        {SHOW_AI && <AiSection />}
        <ProjectsSection />
        <StackSection />
        <ContactSection />
      </main>
      <ConsentBar />
    </LangProvider>
  );
}
