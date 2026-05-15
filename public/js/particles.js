/**
 * Particle System — connecting dots, mouse parallax, gentle drift
 * Inspired by tsParticles / particles.js but written from scratch,
 * tuned for digitalizujem.cz aesthetic.
 */
(() => {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0, dpr = window.devicePixelRatio || 1;
  let particles = [];
  let mouse = { x: -9999, y: -9999, lastMove: 0 };
  let parallax = { x: 0, y: 0, tx: 0, ty: 0 };

  const CONFIG = {
    count: () => Math.min(90, Math.floor((W * H) / 18000)),
    maxDistance: 140,
    mouseRadius: 180,
    speed: 0.18,
    color: [46, 232, 200],
    bgFade: 0.04
  };

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);
    initParticles();
  }

  function initParticles() {
    const target = CONFIG.count();
    particles = [];
    for (let i = 0; i < target; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * CONFIG.speed,
        vy: (Math.random() - 0.5) * CONFIG.speed,
        r: Math.random() * 1.4 + 0.4,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  function step(t) {
    // Smooth parallax
    parallax.x += (parallax.tx - parallax.x) * 0.08;
    parallax.y += (parallax.ty - parallax.y) * 0.08;

    // Trailing fade — gentle motion blur
    ctx.fillStyle = `rgba(5, 8, 7, ${CONFIG.bgFade})`;
    ctx.fillRect(0, 0, W, H);
    ctx.clearRect(0, 0, W, H); // crisp dots, no smear

    const [cr, cg, cb] = CONFIG.color;

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.phase += 0.01;

      // Wrap around edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      // Mouse repulsion / attraction (light)
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.mouseRadius) {
        const force = (1 - dist / CONFIG.mouseRadius) * 0.6;
        p.vx += (dx / dist) * force * 0.05;
        p.vy += (dy / dist) * force * 0.05;
      }

      // Speed cap
      const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const cap = CONFIG.speed * 2.5;
      if (sp > cap) {
        p.vx = (p.vx / sp) * cap;
        p.vy = (p.vy / sp) * cap;
      }

      // Gentle drift back to base speed
      p.vx *= 0.995;
      p.vy *= 0.995;

      // Twinkle alpha
      const alpha = 0.35 + Math.sin(p.phase) * 0.25;

      // Render with parallax offset
      const px = p.x + parallax.x;
      const py = p.y + parallax.y;

      ctx.beginPath();
      ctx.arc(px, py, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
      ctx.fill();
    }

    // Connecting lines
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.maxDistance) {
          const alpha = (1 - dist / CONFIG.maxDistance) * 0.18;
          ctx.beginPath();
          ctx.moveTo(a.x + parallax.x, a.y + parallax.y);
          ctx.lineTo(b.x + parallax.x, b.y + parallax.y);
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    // Lines from mouse to nearby particles
    if (Date.now() - mouse.lastMove < 1500) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.mouseRadius) {
          const alpha = (1 - dist / CONFIG.mouseRadius) * 0.4;
          ctx.beginPath();
          ctx.moveTo(p.x + parallax.x, p.y + parallax.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(step);
  }

  // Mouse tracking + parallax for ambient orbs
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.lastMove = Date.now();
    parallax.tx = (e.clientX / W - 0.5) * 30;
    parallax.ty = (e.clientY / H - 0.5) * 30;

    // Parallax for orbs
    document.querySelectorAll('.orb').forEach((orb, i) => {
      const factor = (i + 1) * 0.5;
      const tx = (e.clientX / W - 0.5) * 40 * factor;
      const ty = (e.clientY / H - 0.5) * 30 * factor;
      orb.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999; mouse.y = -9999;
    parallax.tx = 0; parallax.ty = 0;
  });

  window.addEventListener('resize', resize, { passive: true });
  resize();
  requestAnimationFrame(step);
})();
