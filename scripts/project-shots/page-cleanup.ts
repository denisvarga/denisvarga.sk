// In-page scripts are plain strings: tsx (esbuild keepNames) injects __name() helpers into
// serialized functions, which do not exist inside the page and break page.evaluate.

export const VENDOR_HIDE_CSS = `
#CybotCookiebotDialog, #CybotCookiebotDialogBodyUnderlay, .cmplz-cookiebanner, #cmplz-cookiebanner-container,
.cmplz-manage-consent, #cookie-law-info-bar, #cookie-law-info-again, .cli-modal-backdrop, .cky-consent-container,
.cky-overlay, .cky-btn-revisit-wrapper, #onetrust-banner-sdk, #onetrust-consent-sdk, .onetrust-pc-dark-filter,
#cookie-notice, #moove_gdpr_cookie_info_bar, #moove_gdpr_save_popup_settings_button, .cc-window, .cc-revoke,
#cookiescript_injected, #usercentrics-root, #iubenda-cs-banner, #BorlabsCookieBox, #borlabs-cookie,
#tidio-chat, #tidio-chat-iframe, .crisp-client, #crisp-chatbox, .fb_dialog, .fb-customerchat, #fb-root iframe,
#chat-application, #smartsupp-widget-container, #chat-widget-container, #hubspot-messages-iframe-container,
#intercom-container, .intercom-lightweight-app, #tawkchat-container, iframe[src*="tawk.to"], iframe[src*="tidio"],
iframe[src*="smartsupp"], iframe[title*="chat" i], .grecaptcha-badge
{ display: none !important; }
`;

export const CLICK_CONSENT = `(() => {
  const ACCEPT = /accept|súhlas|souhlas|prijať|přijmout|rozumiem|rozumím|agree|allow all|povoliť|povolit|\\bok\\b|got it/i;
  const AVOID = /nesúhlas|nesouhlas|odmietnuť|odmítnout|reject|decline|nastaven|settings|prispôsob|přizpůsob|customi[sz]e/i;
  const isFloating = (el) => {
    for (let n = el; n && n !== document.body; n = n.parentElement) {
      const p = getComputedStyle(n).position;
      if (p === 'fixed' || p === 'sticky') return true;
    }
    return false;
  };
  const candidates = document.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
  for (const el of candidates) {
    const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim();
    if (!text || text.length > 40 || !ACCEPT.test(text) || AVOID.test(text)) continue;
    if (!el.getClientRects().length || !isFloating(el)) continue;
    const href = el.tagName === 'A' ? el.getAttribute('href') || '' : '';
    if (href && !href.startsWith('#') && !href.startsWith('javascript')) continue;
    el.click();
    return text;
  }
  return null;
})()`;

// Hides big floating overlays (z-index >= 1000, > 30% of the viewport), floating elements that
// talk about cookies (banners, revisit buttons) and parked off-canvas panels whose shadow still
// bleeds into the viewport; returns short descriptors for the log.
export const HIDE_OVERLAYS = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const COOKIE = /cookie|súhlas so|souhlas s|gdpr|zásady ochrany|consent/i;
  const MARKER = /cookie|consent|gdpr|cmplz|cky-|cli-/i;
  const describe = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
    (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : '');
  const hidden = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
    if (el.matches('header, nav') || el.querySelector('nav')) continue;
    const r = el.getBoundingClientRect();
    const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    const offscreen = cs.position === 'fixed' && r.width * r.height > 0 &&
      (r.left >= vw || r.right <= 0 || r.top >= vh || r.bottom <= 0);
    const big = Number.parseInt(cs.zIndex, 10) >= 1000 && w * h > vw * vh * 0.3;
    const marked = w * h > 0 && MARKER.test(el.id + ' ' + el.className + ' ' + (el.getAttribute('aria-label') || ''));
    const talks = w * h > 0 && COOKIE.test((el.innerText || '').slice(0, 1500));
    if (offscreen || big || marked || talks) {
      el.style.setProperty('display', 'none', 'important');
      if (!offscreen) hidden.push(describe(el));
    }
  }
  return hidden;
})()`;

export const FIND_LEFTOVERS = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const out = [];
  for (const el of document.body.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width * r.height === 0 || r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue;
    if (el.tagName === 'IFRAME' || /cookie|consent|chat|popup|modal|newsletter/i.test(el.id + ' ' + el.className)) {
      out.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    }
  }
  return out;
})()`;

export const SCROLL_NUDGE = `(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  scrollTo({ top: innerHeight * 0.8, behavior: 'instant' });
  await wait(700);
  scrollTo({ top: 0, behavior: 'instant' });
  await wait(1200);
  const pending = [...document.images].filter((img) => {
    const r = img.getBoundingClientRect();
    return !img.complete && r.top < innerHeight && r.bottom > 0;
  });
  await Promise.race([
    Promise.all(pending.map((img) => new Promise((r) => { img.onload = img.onerror = r; }))),
    wait(5000),
  ]);
  await document.fonts.ready;
})()`;
