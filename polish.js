'use strict';
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set();
  function reveal(element, delay = 0) {
    if (reduceMotion.matches || typeof element.animate !== 'function') return;
    const animation = element.animate([
      { opacity: .15, transform: 'translateY(22px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 620, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
  }
  // No hidden CSS state: the complete page works if animation or JS is unavailable.
  const hero = document.querySelector('.hero-content');
  if (hero && !location.hash) [...hero.children].forEach((element, i) => reveal(element, i * 75));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      let order = 0;
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target, Math.min(order++ * 55, 165));
        observer.unobserve(entry.target);
      });
    }, { threshold: .08 });
    document.querySelectorAll('.section-head, .catalogue-card, .service-card, .about-panel, .lead-form, .project-intro, .fact-grid > div, .document-gallery figure').forEach(element => observer.observe(element));
  }
  function finishMotion() { animations.forEach(animation => animation.finish()); }
  reduceMotion.addEventListener('change', () => { if (reduceMotion.matches) finishMotion(); });
  document.addEventListener('focusin', finishMotion);
  document.querySelectorAll('.faq-section details').forEach(details => {
    details.addEventListener('toggle', () => {
      const answer = details.querySelector('div');
      if (details.open && answer) reveal(answer);
    });
  });
  const header = document.querySelector('.site-header');
  let ticking = false;
  const links = [...document.querySelectorAll('.nav a[href^="#"]')];
  const sections = links.map(link => ({ link, section: document.querySelector(link.getAttribute('href')) })).filter(item => item.section);
  function updateNavigation() {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    let active;
    for (const item of sections) if (item.section.getBoundingClientRect().top <= (header?.offsetHeight || 100) + 100) active = item;
    sections.forEach(item => {
      if (item === active) item.link.setAttribute('aria-current', 'location');
      else item.link.removeAttribute('aria-current');
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  updateNavigation();
})();
