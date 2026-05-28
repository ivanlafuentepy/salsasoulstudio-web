/* ═══════════════════════════════════════════
   salsasoulstudio.com — Script (Premium)
   GSAP + ScrollTrigger + Vanilla JS
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  gsap.registerPlugin(ScrollTrigger);

  /* ══════════════════════════════════════════
     NAV STICKY
     ══════════════════════════════════════════ */
  const nav = document.getElementById('mainNav');
  const hero = document.getElementById('hero');
  if (nav && hero) {
    const navObserver = new IntersectionObserver(([entry]) => {
      nav.classList.toggle('visible', !entry.isIntersecting);
    }, { threshold: 0.1 });
    navObserver.observe(hero);
  }

  /* ══════════════════════════════════════════
     SMOOTH SCROLL
     ══════════════════════════════════════════ */
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ══════════════════════════════════════════
     GSAP REVEALS (learned: gsap.set in JS, never CSS opacity:0)
     ══════════════════════════════════════════ */
  const revealSelectors = '.level-card, .afiche-card, .pensum-card, .price-card, .comunidad-foto, .comunidad-content, .promo-banner, .classes-note, .festival-poster, .festival-info, .contact-info, .illustration, .buttons';

  gsap.set(revealSelectors, { opacity: 0, y: 24 });
  gsap.set('.hero-overlay', { opacity: 0, y: 30 });

  // Hero entrance
  gsap.to('.hero-overlay', {
    opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.3,
  });

  // Batch reveals for card groups
  ['.levels', '.afiches-grid', '.pensum-cards', '.pricing-grid'].forEach(grid => {
    const cards = document.querySelectorAll(grid + ' > *');
    if (cards.length === 0) return;
    ScrollTrigger.batch(cards, {
      start: 'top 85%',
      once: true,
      onEnter: batch => gsap.to(batch, { opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out' }),
    });
  });

  // Individual reveals
  document.querySelectorAll(revealSelectors).forEach(el => {
    if (el.closest('.levels, .afiches-grid, .pensum-cards, .pricing-grid')) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }),
    });
  });

  // Promo banner
  const promo = document.querySelector('.promo-banner');
  if (promo) {
    ScrollTrigger.create({
      trigger: promo,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(promo, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }),
    });
  }

  /* ══════════════════════════════════════════
     HERO SHADER (WebGL — gold rings)
     ══════════════════════════════════════════ */
  const shaderCanvas = document.getElementById('hero-shader');
  if (shaderCanvas) {
    const gl = shaderCanvas.getContext('webgl');
    if (gl) {
      const vsSource = `
        attribute vec4 aVertexPosition;
        void main() { gl_Position = aVertexPosition; }
      `;

      const fsSource = `
        precision highp float;
        uniform vec2 resolution;
        uniform float time;

        void main(void) {
          vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
          float t = time * 0.05;
          float lineWidth = 0.002;

          vec3 color = vec3(0.0);
          for(int j = 0; j < 3; j++){
            for(int i = 0; i < 5; i++){
              color[j] += lineWidth * float(i*i) / abs(fract(t - 0.01*float(j) + float(i)*0.01) * 5.0 - length(uv) + mod(uv.x+uv.y, 0.2));
            }
          }

          // Tint gold: boost red/green, reduce blue
          color = vec3(color.r * 1.2, color.g * 0.85, color.b * 0.3);

          gl_FragColor = vec4(color, 1.0);
        }
      `;

      function loadShader(type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          console.error('Shader error:', gl.getShaderInfoLog(shader));
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      }

      const vs = loadShader(gl.VERTEX_SHADER, vsSource);
      const fs = loadShader(gl.FRAGMENT_SHADER, fsSource);
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const posBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'aVertexPosition');
        const resLoc = gl.getUniformLocation(program, 'resolution');
        const timeLoc = gl.getUniformLocation(program, 'time');

        function resizeShader() {
          const rect = shaderCanvas.parentElement.getBoundingClientRect();
          const dpr = Math.min(window.devicePixelRatio, 2);
          shaderCanvas.width = rect.width * dpr;
          shaderCanvas.height = rect.height * dpr;
          gl.viewport(0, 0, shaderCanvas.width, shaderCanvas.height);
        }

        window.addEventListener('resize', resizeShader);
        resizeShader();

        let shaderActive = true;
        const startTime = Date.now();

        function renderShader() {
          if (!shaderActive) return;
          const t = (Date.now() - startTime) / 1000;
          gl.clearColor(0, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.useProgram(program);
          gl.uniform2f(resLoc, shaderCanvas.width, shaderCanvas.height);
          gl.uniform1f(timeLoc, t);
          gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
          gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(posLoc);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          requestAnimationFrame(renderShader);
        }

        // Pause when not visible
        const shaderObserver = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !shaderActive) {
            shaderActive = true;
            requestAnimationFrame(renderShader);
          } else if (!entry.isIntersecting) {
            shaderActive = false;
          }
        }, { threshold: 0 });
        shaderObserver.observe(shaderCanvas);

        requestAnimationFrame(renderShader);
      }
    }
  }

  /* ══════════════════════════════════════════
     SPOTLIGHT GLOW CARDS (desktop only)
     ══════════════════════════════════════════ */
  if (!('ontouchstart' in window)) {
    const glowCards = document.querySelectorAll('.level-card, .price-card, .pensum-card, .comunidad-card');
    glowCards.forEach(card => card.classList.add('glow-card'));

    document.addEventListener('pointermove', e => {
      glowCards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--glow-x', x + 'px');
        card.style.setProperty('--glow-y', y + 'px');
      });
    });
  }

  /* ══════════════════════════════════════════
     SCROLL PROGRESS BAR
     ══════════════════════════════════════════ */
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
    }, { passive: true });
  }

  /* ══════════════════════════════════════════
     ACTIVE NAV LINK
     ══════════════════════════════════════════ */
  const sections = document.querySelectorAll('[id]');
  const navLinksAll = document.querySelectorAll('.nav-links a[href^="#"]');

  sections.forEach(section => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 40%',
      end: 'bottom 40%',
      onToggle: self => {
        if (self.isActive) {
          navLinksAll.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + section.id);
          });
        }
      }
    });
  });

  /* ══════════════════════════════════════════
     MAGNETIC BUTTONS (desktop only)
     ══════════════════════════════════════════ */
  if (!('ontouchstart' in window)) {
    document.querySelectorAll('.btn-gold, .btn-whatsapp, .btn-festival, .btn-instagram').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(btn, { x: x * 0.15, y: y * 0.15, duration: 0.3, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, { x: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' });
      });
    });
  }

  /* ══════════════════════════════════════════
     LIGHTBOX
     ══════════════════════════════════════════ */
  window.openLightbox = function(card) {
    const img = card.querySelector('img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.closeLightbox = function() {
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
  });

  /* ══════════════════════════════════════════
     COMUNIDAD: cargar profesionales desde API
     ══════════════════════════════════════════ */
  (async function loadComunidad() {
    const carousel = document.getElementById('comunidad-carousel');
    if (!carousel) return;
    try {
      const res = await fetch('/api/comunidad');
      if (!res.ok) throw new Error('Error ' + res.status);
      const data = await res.json();
      const servicios = data.servicios || [];
      if (!servicios.length) {
        carousel.innerHTML = '<div class="comunidad-loading">Próximamente</div>';
        return;
      }
      carousel.innerHTML = servicios.map(s => {
        const waNum = s.whatsapp ? s.whatsapp.replace(/[^0-9]/g, '') : '';
        const waMsg = encodeURIComponent('Hola ' + s.nombre + ', vi tu servicio en la web de Salsa Soul.');
        const waLink = waNum ? 'https://wa.me/' + waNum + '?text=' + waMsg : '';
        const esc = t => { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; };
        return '<div class="comunidad-card">' +
          (s.foto ? '<img class="comunidad-card-foto" src="' + esc(s.foto) + '" alt="' + esc(s.nombre) + '" loading="lazy">' : '') +
          '<div class="comunidad-card-name">' + esc(s.nombre) + '</div>' +
          '<span class="comunidad-card-cat">' + esc(s.categoria) + '</span>' +
          '<div class="comunidad-card-servicio">' + esc(s.servicio) + '</div>' +
          (waLink ? '<a class="comunidad-card-wa" href="' + waLink + '" target="_blank">WhatsApp</a>' : '') +
        '</div>';
      }).join('');
    } catch (e) {
      carousel.innerHTML = '<div class="comunidad-loading">No se pudieron cargar los servicios</div>';
    }
  })();

});
