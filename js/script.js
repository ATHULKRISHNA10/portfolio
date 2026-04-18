/* ================================================================
   ATHUL KRISHNA K S — PORTFOLIO JS
   Dependencies: Motion (framer-motion/dom)
   ================================================================ */

const { animate, inView, stagger, scroll } = Motion;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------
   1. STAR FIELD (Canvas)
   -------------------------------- */
const canvas = document.getElementById('cosmos');
const ctx = canvas.getContext('2d');
let stars = [];
let shootingStars = [];
let nebulaClouds = [];

function resizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}

function createStars(count) {
  const colors = ['200,215,240', '160,190,255', '255,210,160', '255,180,200', '180,255,200'];
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 1.5 + 0.2,
    alpha: Math.random() * 0.5 + 0.15,
    speed: Math.random() * 0.002 + 0.0008,
    offset: Math.random() * Math.PI * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

function createNebulae() {
  nebulaClouds = [
    { x: 0.15, y: 0.2, rx: 320, ry: 180, hue: 270, sat: 60, light: 50, alpha: 0.016 },
    { x: 0.85, y: 0.35, rx: 260, ry: 200, hue: 210, sat: 65, light: 45, alpha: 0.013 },
    { x: 0.5, y: 0.8, rx: 280, ry: 150, hue: 330, sat: 55, light: 50, alpha: 0.01 },
    { x: 0.3, y: 0.6, rx: 180, ry: 160, hue: 150, sat: 50, light: 40, alpha: 0.007 },
    { x: 0.7, y: 0.15, rx: 160, ry: 120, hue: 30, sat: 70, light: 50, alpha: 0.008 },
  ];
}

function drawFrame(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Nebula clouds
  nebulaClouds.forEach(cloud => {
    const cx = cloud.x * canvas.width + (reducedMotion ? 0 : Math.sin(time * 0.0001 + cloud.hue) * 15);
    const cy = cloud.y * canvas.height + (reducedMotion ? 0 : Math.cos(time * 0.00008 + cloud.hue) * 12);
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, cloud.rx);
    gradient.addColorStop(0, `hsla(${cloud.hue},${cloud.sat}%,${cloud.light}%,${cloud.alpha})`);
    gradient.addColorStop(1, `hsla(${cloud.hue},${cloud.sat}%,${cloud.light}%,0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cloud.rx, cloud.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // Stars
  stars.forEach(star => {
    const alpha = reducedMotion ? star.alpha : star.alpha + Math.sin(time * star.speed + star.offset) * 0.2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${star.color},${Math.max(0.04, Math.min(1, alpha))})`;
    ctx.fill();
  });

  // Shooting stars
  if (!reducedMotion && Math.random() < 0.003) {
    const colors = ['200,215,240', '160,190,255', '255,180,200', '180,255,200'];
    shootingStars.push({
      x: Math.random() * canvas.width * 0.7,
      y: Math.random() * canvas.height * 0.3,
      length: Math.random() * 70 + 35,
      speed: Math.random() * 7 + 4,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4,
      alpha: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  shootingStars = shootingStars.filter(star => {
    star.x += Math.cos(star.angle) * star.speed;
    star.y += Math.sin(star.angle) * star.speed;
    star.alpha -= 0.012;
    if (star.alpha <= 0) return false;

    const tailX = star.x - Math.cos(star.angle) * star.length;
    const tailY = star.y - Math.sin(star.angle) * star.length;
    const gradient = ctx.createLinearGradient(tailX, tailY, star.x, star.y);
    gradient.addColorStop(0, `rgba(${star.color},0)`);
    gradient.addColorStop(1, `rgba(${star.color},${star.alpha})`);
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(star.x, star.y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return true;
  });

  requestAnimationFrame(drawFrame);
}

resizeCanvas();
createStars(300);
createNebulae();
requestAnimationFrame(drawFrame);
addEventListener('resize', () => { resizeCanvas(); createStars(300); createNebulae(); });

/* --------------------------------
   2. THEME TOGGLE
   -------------------------------- */
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

root.dataset.theme = localStorage.getItem('theme') || 'dark';

themeToggle.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
  if (!reducedMotion) {
    animate(themeToggle, { rotate: [0, 360], scale: [1, 0.8, 1] }, { duration: 0.4 });
  }
});

/* --------------------------------
   3. NAVBAR
   -------------------------------- */
const navbar = document.getElementById('navbar');
addEventListener('scroll', () => navbar.classList.toggle('scrolled', scrollY > 30));

// Mobile menu
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// Active link highlighting
const sections = document.querySelectorAll('section[id]');

function updateActiveNav() {
  const scrollPos = scrollY + 120;
  sections.forEach(section => {
    const link = document.querySelector(`.nav-links a[href="#${section.id}"]`);
    if (link) {
      link.classList.toggle('active', scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight);
    }
  });
}

addEventListener('scroll', updateActiveNav);
updateActiveNav();

/* --------------------------------
   4. MOTION ANIMATIONS
   -------------------------------- */
if (!reducedMotion) {
  // Hero entrance sequence
  animate('.hero-hi', { opacity: [0, 1], y: [15, 0] }, { duration: 0.5, delay: 0.1, ease: 'ease-out' });
  animate('.hero-name', { opacity: [0, 1], y: [25, 0] }, { duration: 0.6, delay: 0.2, ease: 'ease-out' });
  animate('.hero-role', { opacity: [0, 1], y: [15, 0] }, { duration: 0.5, delay: 0.35, ease: 'ease-out' });
  animate('.hero-bio', { opacity: [0, 1], y: [15, 0] }, { duration: 0.5, delay: 0.45, ease: 'ease-out' });
  animate('.hero-btns', { opacity: [0, 1], y: [15, 0] }, { duration: 0.5, delay: 0.55, ease: 'ease-out' });
  animate('.hero-social', { opacity: [0, 1], y: [10, 0] }, { duration: 0.4, delay: 0.65, ease: 'ease-out' });
  animate('.photo-card', { opacity: [0, 1], scale: [0.92, 1] }, { duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] });

  // Scroll-triggered section reveals
  document.querySelectorAll('.sect').forEach(section => {
    const header = section.querySelector('.sh');
    if (header) {
      inView(header, () => {
        animate(header, { opacity: [0, 1], x: [-20, 0] }, { duration: 0.45, ease: 'ease-out' });
      }, { margin: '-8%' });
    }

    const animElements = section.querySelectorAll('.anim');
    if (animElements.length) {
      inView(section, () => {
        animate(animElements, { opacity: [0, 1], y: [25, 0] }, { duration: 0.45, delay: stagger(0.08), ease: 'ease-out' });
      }, { margin: '-8%' });
    }
  });

  // Hover: buttons
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => animate(btn, { scale: 1.04 }, { duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }));
    btn.addEventListener('mouseleave', () => animate(btn, { scale: 1 }, { duration: 0.2 }));
  });

  // Hover: social icons
  document.querySelectorAll('.hero-social a').forEach(icon => {
    icon.addEventListener('mouseenter', () => animate(icon, { scale: 1.1, y: -2 }, { duration: 0.15, ease: [0.34, 1.56, 0.64, 1] }));
    icon.addEventListener('mouseleave', () => animate(icon, { scale: 1, y: 0 }, { duration: 0.2 }));
  });

  // Hover: contact cards
  document.querySelectorAll('.c-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      animate(card, { x: 5 }, { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] });
      const arrow = card.querySelector('.c-arrow');
      if (arrow) animate(arrow, { opacity: 1, x: 0 }, { duration: 0.2 });
    });
    card.addEventListener('mouseleave', () => {
      animate(card, { x: 0 }, { duration: 0.2 });
      const arrow = card.querySelector('.c-arrow');
      if (arrow) animate(arrow, { opacity: 0, x: -6 }, { duration: 0.15 });
    });
  });
} else {
  // Reduced motion: show everything immediately
  document.querySelectorAll('.anim, .hero-hi, .hero-name, .hero-role, .hero-bio, .hero-btns, .hero-social, .photo-card, .sh')
    .forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
}

/* --------------------------------
   5. PORTFOLIO TABS
   -------------------------------- */
document.querySelectorAll('.port-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Update active tab
    document.querySelectorAll('.port-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Filter cards
    const filter = tab.dataset.filter;
    document.querySelectorAll('.port-card').forEach(card => {
      const show = filter === 'all' || card.dataset.company === filter;
      card.classList.toggle('hidden', !show);
      if (show && !reducedMotion) {
        animate(card, { opacity: [0, 1], y: [20, 0] }, { duration: 0.3, ease: 'ease-out' });
      }
    });
  });
});

/* --------------------------------
   6. STAT COUNTER
   -------------------------------- */
document.querySelectorAll('.stat-n[data-target]').forEach(el => {
  inView(el, () => {
    const target = +el.dataset.target;
    const duration = reducedMotion ? 1 : 1800;
    const startTime = performance.now();

    (function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    })(startTime);
  }, { margin: '-8%' });
});
