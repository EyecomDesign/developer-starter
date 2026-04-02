import { getLenis } from './PageTransition';

function setNavActive(active: boolean): void {
  const navStatusEl = document.querySelector('[data-navigation-status]');
  if (!navStatusEl) return;

  navStatusEl.setAttribute('data-navigation-status', active ? 'active' : 'not-active');

  const l = getLenis();
  if (!l) return;
  if (active) {
    l.stop();
  } else {
    l.resize();
    l.start();
  }
}

export function initBoldFullScreenNavigation(): void {
  document.querySelectorAll('[data-navigation-toggle="toggle"]').forEach((toggleBtn) => {
    toggleBtn.addEventListener('click', () => {
      const navStatusEl = document.querySelector('[data-navigation-status]');
      if (!navStatusEl) return;
      const isActive = navStatusEl.getAttribute('data-navigation-status') === 'active';
      setNavActive(!isActive);
    });
  });

  document.querySelectorAll('[data-navigation-toggle="close"]').forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => {
      setNavActive(false);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const navStatusEl = document.querySelector('[data-navigation-status]');
    if (!navStatusEl) return;
    if (navStatusEl.getAttribute('data-navigation-status') === 'active') {
      setNavActive(false);
    }
  });
}
