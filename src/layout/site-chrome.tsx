import { useCallback, useEffect, useRef, useState } from 'react';
import { goTo, type ScrollTarget } from '../motion/scroll-to';
import { useScrollLock } from '../motion/use-scroll-lock';
import { MenuOverlay } from './menu-overlay';
import { SiteHeader } from './site-header';

const MENU_ID = 'site-menu';
// Lets the overlay start closing and the scroll lock release before the scroll begins.
const CLOSE_GO_DELAY_MS = 380;

export function SiteChrome() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const goTimer = useRef<number | undefined>(undefined);

  useScrollLock(open);

  const close = useCallback(() => {
    // Focus inside the overlay would be lost once it turns inert, so hand it back to the toggle.
    if (overlayRef.current?.contains(document.activeElement)) toggleRef.current?.focus({ preventScroll: true });
    setOpen(false);
  }, []);

  const closeMenuGo = useCallback(
    (target: ScrollTarget) => {
      window.clearTimeout(goTimer.current);
      if (!open) {
        goTo(target);
        return;
      }
      close();
      goTimer.current = window.setTimeout(() => goTo(target), CLOSE_GO_DELAY_MS);
    },
    [open, close],
  );

  useEffect(() => () => window.clearTimeout(goTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const main = document.getElementById('top');
    main?.setAttribute('inert', '');
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      toggleRef.current?.focus({ preventScroll: true });
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      main?.removeAttribute('inert');
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <SiteHeader
        open={open}
        menuId={MENU_ID}
        toggleRef={toggleRef}
        onToggle={() => (open ? close() : setOpen(true))}
        onGo={closeMenuGo}
      />
      <MenuOverlay id={MENU_ID} ref={overlayRef} open={open} onGo={closeMenuGo} />
    </>
  );
}
