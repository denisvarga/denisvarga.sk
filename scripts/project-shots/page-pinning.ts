// Pins live states so every capture is reproducible: sliders on their first slide, no typing
// carets or cursor followers, and nothing moving between the last check and the screenshot.
// Plain strings for the same reason as page-cleanup.ts (tsx __name helpers break evaluate).

export const PIN_SLIDERS = `(() => {
  const done = [];
  const near = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight * 1.5; };
  for (const el of document.querySelectorAll('.swiper, .swiper-container')) {
    const s = el.swiper;
    if (!s) continue;
    try { if (s.autoplay) s.autoplay.stop(); s.params.loop ? s.slideToLoop(0, 0) : s.slideTo(0, 0); done.push('swiper'); } catch (e) {}
  }
  const $ = window.jQuery;
  if ($ && $.fn && $.fn.slick) $('.slick-initialized').each(function () {
    try { $(this).slick('slickPause').slick('slickGoTo', 0, true); done.push('slick'); } catch (e) {}
  });
  if ($ && $.fn && $.fn.owlCarousel) $('.owl-carousel').each(function () {
    try { $(this).trigger('stop.owl.autoplay').trigger('to.owl.carousel', [0, 0, true]); done.push('owl'); } catch (e) {}
  });
  if (window.Flickity) for (const el of document.querySelectorAll('.flickity-enabled')) {
    const f = window.Flickity.data(el);
    if (f) { f.stopPlayer(); f.select(0, false, true); done.push('flickity'); }
  }
  // API-less and custom sliders: click the first dot of every dot group near the fold.
  const groups = document.querySelectorAll('.slick-dots, .swiper-pagination, .splide__pagination, .flickity-page-dots, .owl-dots, [class*="dots" i], [class*="bullets" i]');
  for (const g of groups) {
    if (!near(g)) continue;
    const items = g.querySelectorAll('button, [role="button"], [role="tab"], .swiper-pagination-bullet, .flickity-page-dot, .owl-dot');
    if (items.length < 2) continue;
    items[0].click();
    done.push('dot:' + String(g.className).trim().split(/\\s+/)[0]);
  }
  return done;
})()`;

export const HIDE_CARETS = `(() => {
  const hidden = [];
  const style = document.createElement('style');
  style.textContent = '.typed-cursor, .typewriter-cursor, .Typewriter__cursor, [data-shot-caret-after]::after, [data-shot-caret-before]::before { visibility: hidden !important; } [data-shot-hidden] { display: none !important; }';
  document.head.appendChild(style);
  const scope = document.querySelectorAll('h1, h1 *, h2, h2 *, [class*="rotator" i], [class*="typed" i], [class*="typewriter" i], [class*="typing" i], [data-component*="rotator" i], [data-component*="type" i]');
  for (const el of scope) {
    for (const pseudo of ['before', 'after']) {
      const cs = getComputedStyle(el, '::' + pseudo);
      const bar = ['""', '"|"', '"_"'].includes(cs.content) && Number.parseFloat(cs.width) > 0 && Number.parseFloat(cs.width) <= 4;
      if (bar || /blink|caret|cursor/i.test(cs.animationName)) {
        el.setAttribute('data-shot-caret-' + pseudo, '');
        hidden.push(String(el.className).split(' ')[0] + '::' + pseudo);
      }
    }
    if (el.children.length === 0 && /^[|_]$/.test((el.textContent || '').trim())) {
      el.setAttribute('data-shot-hidden', '');
      hidden.push(String(el.className).split(' ')[0] + ' text caret');
    }
  }
  for (const el of document.querySelectorAll('[class*="cursor" i]')) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' && cs.pointerEvents === 'none') {
      el.setAttribute('data-shot-hidden', '');
      hidden.push(String(el.className).split(' ')[0] + ' cursor follower');
    }
  }
  return hidden;
})()`;

// Last step before the screenshot: no timer, frame loop or CSS animation can advance a slide.
export const FREEZE_PAGE = `(() => {
  const last = setTimeout(() => {}, 0);
  for (let id = 0; id <= last; id++) { clearTimeout(id); clearInterval(id); }
  window.requestAnimationFrame = () => 0;
  const style = document.createElement('style');
  style.textContent = '*, *::before, *::after { animation-play-state: paused !important; transition: none !important; }';
  document.head.appendChild(style);
  return last;
})()`;

// Run after FREEZE_PAGE: custom crossfade sliders (no API, no dots) that toggle a plain active
// class get it moved back to the first slide; library classes (slick-active etc.) are not touched.
export const PIN_CLASS_SLIDERS = `(() => {
  const ACTIVE = ['is-active', 'active', 'is-selected', 'is-current', 'current'];
  const done = [];
  for (const track of document.querySelectorAll('[class*="slider" i], [class*="slides" i], [class*="carousel" i]')) {
    if (track.getBoundingClientRect().top > innerHeight) continue;
    const slides = [...track.children].filter((c) => /slide|item/i.test(String(c.className)));
    if (slides.length < 2) continue;
    const cls = ACTIVE.find((name) => slides.some((s) => s.classList.contains(name)));
    if (!cls || slides[0].classList.contains(cls)) continue;
    slides.forEach((s, i) => s.classList.toggle(cls, i === 0));
    done.push('class:' + String(track.className).trim().split(/\\s+/)[0]);
  }
  return done;
})()`;
