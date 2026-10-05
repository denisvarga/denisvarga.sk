import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { PROJECT_IMAGE_SIZE, PROJECTS } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import { matchesMedia, REDUCED_MOTION_QUERY } from '../../motion/use-media-query';
import styles from './drawer.module.css';
import { pad2, projectDomain, projectScope } from './project-scope';
import type { ProjectDrawer as DrawerApi } from './use-project-drawer';

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Makes everything outside `el` inert by walking up to <body>; leaves already-inert elements alone
// (the menu owns main#top's inert) and only clears what it set itself.
function inertOutside(el: HTMLElement): () => void {
  const changed: Element[] = [];
  for (let node: HTMLElement = el; node.parentElement && node !== document.body; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling === node || sibling.hasAttribute('inert') || sibling.tagName === 'SCRIPT') continue;
      sibling.setAttribute('inert', '');
      changed.push(sibling);
    }
  }
  return () => changed.forEach((sibling) => sibling.removeAttribute('inert'));
}

function trapTab(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== 'Tab') return;
  const items = [...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)];
  const first = items[0];
  const last = items.at(-1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function ProjectDrawer({ drawer }: { readonly drawer: DrawerApi }) {
  const { lang, t, ui } = useLang();
  const { open, last, close, step, openerRef } = drawer;
  const rootRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const shownRef = useRef({ open, last });
  const titleId = useId();

  useEffect(() => {
    const root = rootRef.current;
    if (!open || !root) return;
    const restore = inertOutside(root);
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      restore();
      openerRef.current?.focus({ preventScroll: true });
    };
  }, [open, openerRef]);

  // Stepping while open fades the new project in: transition off, hidden, then two frames later
  // the transition back on so the browser has committed the hidden state first.
  useEffect(() => {
    const before = shownRef.current;
    shownRef.current = { open, last };
    const body = bodyRef.current;
    if (!body || !open || !before.open || before.last === last) return;
    if (asideRef.current) asideRef.current.scrollTop = 0;
    if (matchesMedia(REDUCED_MOTION_QUERY)) return;
    body.style.transition = 'none';
    body.style.opacity = '0';
    body.style.transform = 'translateY(16px)';
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        body.style.transition = 'opacity .6s ease, transform .9s var(--ease)';
        body.style.opacity = '1';
        body.style.transform = 'none';
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      // Closing mid-step must not leave the hidden state behind for the next open.
      body.style.transition = '';
      body.style.opacity = '';
      body.style.transform = '';
    };
  }, [open, last]);

  const project = PROJECTS[last] ?? PROJECTS[0];
  if (!project) return null;

  return (
    <div ref={rootRef} className={styles.root} data-open={open ? '' : undefined} inert={!open}>
      <div className={styles.backdrop} onClick={close} aria-hidden="true" />
      <aside
        ref={asideRef}
        className={styles.aside}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-lenis-prevent=""
        onKeyDown={trapTab}
      >
        <div className={styles.bar}>
          <span className={styles.counter}>
            {pad2(last + 1)} / {pad2(PROJECTS.length)}
          </span>
          <div className={styles.controls}>
            <button type="button" className={styles.step} aria-label={ui.prev} onClick={() => step(-1)}>
              ←
            </button>
            <button type="button" className={styles.step} aria-label={ui.next} onClick={() => step(1)}>
              →
            </button>
            <button ref={closeRef} type="button" className={styles.close} aria-label={ui.close} onClick={close}>
              ×
            </button>
          </div>
        </div>
        <div ref={bodyRef} className={styles.body}>
          <div className={styles.media}>
            <img
              className={styles.img}
              src={project.image}
              alt={project.name}
              width={PROJECT_IMAGE_SIZE.width}
              height={PROJECT_IMAGE_SIZE.height}
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className={styles.head}>
            <h2 id={titleId} className={styles.name}>
              {project.name}
            </h2>
            <p className={styles.kind}>
              {project.kind[lang]} · {t.work.contexts[project.context]}
            </p>
            <a className={styles.domain} href={project.url} target="_blank" rel="noopener">
              {projectDomain(project.url)} <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className={styles.scope}>
            <span className={styles.scopeLabel}>{ui.scope}</span>
            {projectScope(project.desc[lang]).map((item) => (
              <div key={item.n} className={styles.scopeRow}>
                <span className={styles.scopeNum} aria-hidden="true">
                  {item.n}
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <a className={styles.cta} href={project.url} target="_blank" rel="noopener">
            {ui.open} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </aside>
    </div>
  );
}
