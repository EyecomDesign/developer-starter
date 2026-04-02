import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFooterParallax(): void {
  document.querySelectorAll<HTMLElement>('[data-footer-parallax]').forEach((el) => {
    ScrollTrigger.getAll().forEach((st) => {
      if (st.trigger === el) st.kill();
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'clamp(top bottom)',
        end: 'clamp(top top)',
        scrub: true,
      },
    });

    const inner = el.querySelector<HTMLElement>('[data-footer-parallax-inner]');
    const dark = el.querySelector<HTMLElement>('[data-footer-parallax-dark]');

    if (inner) {
      console.log('inner', inner);
      tl.from(inner, {
        yPercent: -25,
        ease: 'linear',
      });
    }

    if (dark) {
      console.log('dark', dark);
      tl.from(
        dark,
        {
          opacity: 0.5,
          ease: 'linear',
        },
        '<'
      );
    }
  });
}
