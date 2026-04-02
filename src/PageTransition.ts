import barba from '@barba/core';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { initFooterParallax } from './FooterParallax';
import { destroyHeroAnimation, initHeroAnimation } from './HeroAnimation';

let lenis: Lenis | null = null;

export function getLenis(): Lenis | null {
  return lenis;
}

// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

/** Barba hook payload (minimal fields used here). */
interface BarbaHookData {
  current: { container: HTMLElement };
  next: { container: HTMLElement; html: string };
}

export function initPageTransition(): void {
  gsap.registerPlugin(CustomEase, ScrollTrigger);

  history.scrollRestoration = 'manual';

  let onceFunctionsInitialized = false;

  const rmMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = rmMQ.matches;
  rmMQ.addEventListener?.('change', (e) => {
    reducedMotion = e.matches;
  });
  rmMQ.addListener?.((e) => {
    reducedMotion = e.matches;
  });

  const durationDefault = 0.6;

  CustomEase.create('osmo', '0.625, 0.05, 0, 1');
  CustomEase.create('parallax', '0.7, 0.05, 0.13, 1');
  gsap.defaults({ ease: 'osmo', duration: durationDefault });

  // -----------------------------------------
  // FUNCTION REGISTRY
  // -----------------------------------------

  function initOnceFunctions() {
    initLenis();
    if (onceFunctionsInitialized) return;
    onceFunctionsInitialized = true;

    // Runs once on first load
    // if (document.querySelector('[data-something]')) initSomething();
  }

  function initBeforeEnterFunctions() {
    // Runs before the enter animation (use `data.next.container` from hooks when adding inits)
    // if (container.querySelector('[data-something]')) initSomething();
  }

  function initAfterEnterFunctions() {
    // Runs after enter animation completes
    // if (container.querySelector('[data-something]')) initSomething();

    if (lenis) {
      lenis.resize();
    }

    initFooterParallax();
  }

  // -----------------------------------------
  // PAGE TRANSITIONS
  // -----------------------------------------

  function runPageOnceAnimation(next: HTMLElement) {
    const tl = gsap.timeline();

    tl.call(
      () => {
        resetPage(next);
      },
      undefined,
      0
    );

    return tl;
  }

  function runPageLeaveAnimation(current: HTMLElement) {
    const transitionWrap = document.querySelector('[data-transition-wrap]');
    if (!transitionWrap) {
      const tl = gsap.timeline({
        onComplete: () => {
          current.remove();
        },
      });
      return tl.set(current, { autoAlpha: 0 });
    }

    const transitionDark = transitionWrap.querySelector('[data-transition-dark]');
    if (!transitionDark) {
      const tl = gsap.timeline({
        onComplete: () => {
          current.remove();
        },
      });
      return tl.set(current, { autoAlpha: 0 });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        current.remove();
      },
    });

    if (reducedMotion) {
      // Immediate swap behavior if user prefers reduced motion
      return tl.set(current, { autoAlpha: 0 });
    }

    tl.set(transitionWrap, {
      zIndex: 2,
    });

    tl.fromTo(
      transitionDark,
      {
        autoAlpha: 0,
      },
      {
        autoAlpha: 0.8,
        duration: 1.2,
        ease: 'parallax',
      },
      0
    );

    tl.fromTo(
      current,
      {
        y: '0vh',
      },
      {
        y: '-25vh',
        duration: 1.2,
        ease: 'parallax',
      },
      0
    );

    tl.set(transitionDark, {
      autoAlpha: 0,
    });

    return tl;
  }

  function runPageEnterAnimation(next: HTMLElement) {
    const tl = gsap.timeline();

    if (reducedMotion) {
      // Immediate swap behavior if user prefers reduced motion
      tl.set(next, { autoAlpha: 1 });
      tl.add('pageReady');
      tl.call(resetPage, [next], 'pageReady');
      return new Promise<void>((resolve) => {
        tl.call(resolve, undefined, 'pageReady');
      });
    }

    tl.add('startEnter', 0);

    tl.set(next, {
      zIndex: 3,
    });

    tl.fromTo(
      next,
      {
        y: '100vh',
      },
      {
        y: '0vh',
        duration: 1.2,
        clearProps: 'all',
        ease: 'parallax',
      },
      'startEnter'
    );

    tl.add('pageReady');
    tl.call(resetPage, [next], 'pageReady');

    return new Promise<void>((resolve) => {
      tl.call(resolve, undefined, 'pageReady');
    });
  }

  // -----------------------------------------
  // BARBA HOOKS + INIT
  // -----------------------------------------

  barba.hooks.beforeEnter((data: BarbaHookData) => {
    // Position new container on top
    gsap.set(data.next.container, {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
    });

    if (lenis) {
      lenis.stop();
    }

    initBeforeEnterFunctions();
    applyThemeFrom(data.next.container);

    // With sync: true, beforeEnter runs before leave & enter run in parallel — start
    // the hero canvas here so beams animate during the transition, not after (avoids flicker).
    initHeroAnimation(data.next.container);
  });

  barba.hooks.beforeLeave((data: BarbaHookData) => {
    destroyHeroAnimation(data.current.container);
  });

  barba.hooks.afterLeave(() => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  });

  barba.hooks.enter((data: BarbaHookData) => {
    initBarbaNavUpdate(data);
  });

  barba.hooks.afterEnter(() => {
    // Run page functions
    initAfterEnterFunctions();

    // Settle
    if (lenis) {
      lenis.resize();
      lenis.start();
    }

    ScrollTrigger.refresh();
  });

  barba.init({
    debug: true, // Set to 'false' in production
    timeout: 7000,
    preventRunning: true,
    transitions: [
      {
        name: 'default',
        sync: true,

        // First load
        async once(data: BarbaHookData) {
          initOnceFunctions();

          return runPageOnceAnimation(data.next.container);
        },

        // Current page leaves
        async leave(data: BarbaHookData) {
          return runPageLeaveAnimation(data.current.container);
        },

        // New page enters
        async enter(data: BarbaHookData) {
          return runPageEnterAnimation(data.next.container);
        },
      },
    ],
  });

  // -----------------------------------------
  // GENERIC + HELPERS
  // -----------------------------------------

  const themeConfig = {
    light: {
      nav: 'dark',
      transition: 'light',
    },
    dark: {
      nav: 'light',
      transition: 'dark',
    },
  } as const;

  function applyThemeFrom(container: HTMLElement) {
    const raw = container?.dataset?.pageTheme;
    const pageTheme = raw && raw in themeConfig ? (raw as keyof typeof themeConfig) : 'light';
    const config = themeConfig[pageTheme];

    document.body.dataset.pageTheme = pageTheme;
    const transitionEl = document.querySelector('[data-theme-transition]');
    if (transitionEl instanceof HTMLElement) {
      transitionEl.dataset.themeTransition = config.transition;
    }

    const nav = document.querySelector('[data-theme-nav]');
    if (nav instanceof HTMLElement) {
      nav.dataset.themeNav = config.nav;
    }
  }

  function initLenis() {
    if (lenis) return; // already created

    lenis = new Lenis({
      lerp: 0.165,
      wheelMultiplier: 1.25,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis!.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
  }

  function resetPage(container: HTMLElement) {
    window.scrollTo(0, 0);
    gsap.set(container, { clearProps: 'position,top,left,right' });

    if (lenis) {
      lenis.resize();
      lenis.start();
    }
  }

  function initBarbaNavUpdate(data: BarbaHookData) {
    const tpl = document.createElement('template');
    tpl.innerHTML = data.next.html.trim();
    const nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
    const currentNodes = document.querySelectorAll('nav [data-barba-update]');

    currentNodes.forEach(function (curr, index) {
      const next = nextNodes[index];
      if (!next) return;

      // Aria-current sync
      const newStatus = next.getAttribute('aria-current');
      if (newStatus !== null) {
        curr.setAttribute('aria-current', newStatus);
      } else {
        curr.removeAttribute('aria-current');
      }

      // Class list sync
      const newClassList = next.getAttribute('class') || '';
      curr.setAttribute('class', newClassList);
    });
  }
}
