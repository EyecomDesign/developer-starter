const MINIMUM_BEAMS = 20;

type Intensity = 'subtle' | 'medium' | 'strong';

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
  pulse: number;
  pulseSpeed: number;
}

const opacityMap: Record<Intensity, number> = {
  subtle: 0.7,
  medium: 0.85,
  strong: 1,
};

function createBeam(width: number, height: number): Beam {
  const angle = -35 + Math.random() * 10;
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.12 + Math.random() * 0.16,
    hue: 190 + Math.random() * 70,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  };
}

function parseIntensity(value: string | null): Intensity {
  if (value === 'subtle' || value === 'medium' || value === 'strong') {
    return value;
  }
  return 'strong';
}

const cleanups = new WeakMap<HTMLElement, () => void>();

function setupBeams(root: HTMLElement): () => void {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-hero-beams-canvas]');
  if (!canvas) return () => {};

  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  const intensity = parseIntensity(root.getAttribute('data-hero-beams-intensity'));

  let beams: Beam[] = [];
  let raf = 0;

  const updateCanvasSize = (): void => {
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const totalBeams = MINIMUM_BEAMS * 1.5;
    beams = Array.from({ length: totalBeams }, () => createBeam(w, h));
  };

  const resetBeam = (beam: Beam, index: number, totalBeams: number): Beam => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const column = index % 3;
    const spacing = w / 3;
    beam.y = h + 100;
    beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5;
    beam.width = 100 + Math.random() * 100;
    beam.speed = 0.5 + Math.random() * 0.4;
    beam.hue = 190 + (index * 70) / totalBeams;
    beam.opacity = 0.2 + Math.random() * 0.1;
    return beam;
  };

  const drawBeam = (beam: Beam): void => {
    ctx.save();
    ctx.translate(beam.x, beam.y);
    ctx.rotate((beam.angle * Math.PI) / 180);

    const pulsingOpacity =
      beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * opacityMap[intensity];

    const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
    gradient.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, 0)`);
    gradient.addColorStop(0.1, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`);
    gradient.addColorStop(0.4, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`);
    gradient.addColorStop(0.6, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`);
    gradient.addColorStop(0.9, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`);
    gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
    ctx.restore();
  };

  const animate = (): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = 'blur(35px)';

    const totalBeams = beams.length;
    beams.forEach((beam, index) => {
      beam.y -= beam.speed;
      beam.pulse += beam.pulseSpeed;

      if (beam.y + beam.length < -100) {
        resetBeam(beam, index, totalBeams);
      }

      drawBeam(beam);
    });

    raf = requestAnimationFrame(animate);
  };

  updateCanvasSize();
  window.addEventListener('resize', updateCanvasSize);
  animate();

  return () => {
    window.removeEventListener('resize', updateCanvasSize);
    if (raf) cancelAnimationFrame(raf);
  };
}

/**
 * Initializes canvas beam backgrounds for every `[data-hero-beams]` in `root`
 * that is not already running. With Barba, prefer calling from `beforeEnter` on
 * `data.next.container` so animation runs during the transition (see PageTransition).
 */
export function initHeroAnimation(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-hero-beams]').forEach((el) => {
    if (cleanups.has(el)) return;
    const teardown = setupBeams(el);
    cleanups.set(el, teardown);
  });
}

/** Stops animation and listeners for hero beam roots under `root` (e.g. before Barba leave). */
export function destroyHeroAnimation(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-hero-beams]').forEach((el) => {
    const teardown = cleanups.get(el);
    if (teardown) {
      teardown();
      cleanups.delete(el);
    }
  });
}
