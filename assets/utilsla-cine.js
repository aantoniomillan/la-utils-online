/* UtilsLA · Portada cinematográfica del proyector.
   GSAP + ScrollTrigger + SplitText + Lenis (CDN). Lenis va conducido por gsap.ticker y avisa a ScrollTrigger.
   En el diseño "squeeze" de Horizon (≥990px) el scroll vive en .page-wrapper; en móvil, en la ventana. */
(() => {
  'use strict';

  const html = document.documentElement;
  const consultaReducida = window.matchMedia('(prefers-reduced-motion: reduce)');
  const COLORES = ['#FFF4E0', '#FFC778', '#FF6B6B', '#5EDC9F', '#93D5FF'];
  const MOTIVOS = ['copos', 'santa', 'arbol', 'regalo'];

  const q = (raiz, sel) => raiz.querySelector(sel);
  const qa = (raiz, sel) => Array.from(raiz.querySelectorAll(sel));
  const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = (a, b, v) => {
    const t = limitar((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const altoCabecera = () => parseFloat(getComputedStyle(document.body).getPropertyValue('--header-height')) || 0;

  function scrollerActual() {
    const envoltorio = document.querySelector('.page-wrapper');
    if (envoltorio && window.matchMedia('(min-width: 990px)').matches) {
      const oy = getComputedStyle(envoltorio).overflowY;
      if (oy === 'auto' || oy === 'scroll') return envoltorio;
    }
    return window;
  }

  /* Formatea céntimos con el mismo aspecto que el filtro money de la tienda ("€10,00" o "10,00 €"). */
  function formatearComo(plantilla, centimos) {
    const m = plantilla.match(/\d[\d.,\s]*\d|\d/);
    if (!m) return plantilla;
    const cifra = m[0];
    const sepDecimal = /[.,]\d{2}$/.test(cifra) ? cifra.charAt(cifra.length - 3) : null;
    const texto = sepDecimal ? (centimos / 100).toFixed(2).replace('.', sepDecimal) : String(Math.round(centimos / 100));
    return plantilla.replace(cifra, texto);
  }
  function centimosDe(texto) {
    const m = texto.match(/\d[\d.,\s]*\d|\d/);
    if (!m) return 0;
    const limpio = m[0].replace(/\s/g, '');
    const dec = /[.,]\d{2}$/.test(limpio);
    const digitos = limpio.replace(/[.,]/g, '');
    return dec ? parseInt(digitos, 10) : parseInt(digitos, 10) * 100;
  }

  /* ---------------------------------------------------------------- Pared proyectada (canvas) */

  function dibujarMotivo(ctx, tipo) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tipo === 'copos') {
      ctx.lineWidth = 0.1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        const c = Math.cos(a);
        const s = Math.sin(a);
        const p = (x, y) => [x * c - y * s, x * s + y * c];
        const seg = (x1, y1, x2, y2) => {
          const [a1, b1] = p(x1, y1);
          const [a2, b2] = p(x2, y2);
          ctx.moveTo(a1, b1);
          ctx.lineTo(a2, b2);
        };
        seg(0, 0, 0, -0.95);
        seg(0, -0.55, -0.22, -0.75);
        seg(0, -0.55, 0.22, -0.75);
        seg(0, -0.3, -0.14, -0.43);
        seg(0, -0.3, 0.14, -0.43);
      }
      ctx.stroke();
      return;
    }
    if (tipo === 'santa') {
      ctx.beginPath();
      ctx.moveTo(-0.6, -0.12);
      ctx.quadraticCurveTo(-0.2, -1.0, 0.55, -0.8);
      ctx.quadraticCurveTo(0.34, -0.46, 0.6, -0.12);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0.6, -0.78, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-0.74, -0.2, 1.48, 0.24, 0.12);
      else ctx.rect(-0.74, -0.2, 1.48, 0.24);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-0.58, 0.1);
      ctx.quadraticCurveTo(-0.66, 0.96, 0, 1.0);
      ctx.quadraticCurveTo(0.66, 0.96, 0.58, 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(-0.22, 0.26, 0.07, 0, Math.PI * 2);
      ctx.moveTo(0.29, 0.26);
      ctx.arc(0.22, 0.26, 0.07, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 0.07;
      ctx.beginPath();
      ctx.moveTo(-0.3, 0.52);
      ctx.quadraticCurveTo(0, 0.4, 0.3, 0.52);
      ctx.stroke();
      ctx.fillRect(-0.74, 0.04, 1.48, 0.05);
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    if (tipo === 'arbol') {
      ctx.beginPath();
      ctx.moveTo(0, -0.95);
      ctx.lineTo(0.42, -0.4);
      ctx.lineTo(0.22, -0.4);
      ctx.lineTo(0.62, 0.12);
      ctx.lineTo(0.36, 0.12);
      ctx.lineTo(0.8, 0.68);
      ctx.lineTo(-0.8, 0.68);
      ctx.lineTo(-0.36, 0.12);
      ctx.lineTo(-0.62, 0.12);
      ctx.lineTo(-0.22, -0.4);
      ctx.lineTo(-0.42, -0.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-0.12, 0.68, 0.24, 0.28);
      return;
    }
    // regalo
    ctx.fillRect(-0.72, -0.16, 1.44, 1.06);
    ctx.fillRect(-0.84, -0.44, 1.68, 0.3);
    ctx.lineWidth = 0.12;
    ctx.beginPath();
    ctx.ellipse(-0.26, -0.64, 0.26, 0.15, -0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0.26, -0.64, 0.26, 0.15, 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(-0.17, -0.44, 0.045, 1.34);
    ctx.fillRect(0.125, -0.44, 0.045, 1.34);
    ctx.fillRect(-0.84, -0.16, 1.68, 0.045);
    ctx.globalCompositeOperation = 'source-over';
  }

  function crearSprites() {
    const T = 128;
    const R = 40;
    return MOTIVOS.map((motivo) =>
      COLORES.map((color) => {
        const forma = document.createElement('canvas');
        forma.width = forma.height = T;
        const fc = forma.getContext('2d');
        fc.translate(T / 2, T / 2);
        fc.scale(R, R);
        fc.fillStyle = fc.strokeStyle = color;
        dibujarMotivo(fc, motivo);
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = T;
        const sc = sprite.getContext('2d');
        sc.shadowColor = color;
        sc.shadowBlur = 18;
        sc.drawImage(forma, 0, 0);
        sc.shadowBlur = 0;
        sc.globalAlpha = 0.9;
        sc.drawImage(forma, 0, 0);
        return sprite;
      })
    );
  }

  class Pared {
    constructor(canvas, lente) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.lente = lente;
      this.pesos = [1, 0, 0, 0];
      this.intensidad = 0;
      this.estatico = false;
      this.visible = true;
      this.t = 0;
      this.ultimo = 0;
      this.particulas = [];
      this.sprites = crearSprites();
      this.cuadro = this.cuadro.bind(this);
      this.ro = new ResizeObserver(() => this.medir());
      this.ro.observe(canvas);
      this.io = new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
      });
      this.io.observe(canvas);
      this.medir();
    }

    medir() {
      const r = this.c.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const movil = r.width < 750;
      this.movil = movil;
      this.dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
      this.w = r.width;
      this.h = r.height;
      this.c.width = Math.round(r.width * this.dpr);
      this.c.height = Math.round(r.height * this.dpr);
      this.situarOrigen();
      this.sembrar();
      if (this.estatico) this.dibujar(0);
    }

    situarOrigen() {
      const rc = this.c.getBoundingClientRect();
      let ox = this.w / 2;
      let oy = this.h * 0.9;
      if (this.lente) {
        const rl = this.lente.getBoundingClientRect();
        if (rl.width) {
          ox = rl.left + rl.width / 2 - rc.left;
          oy = rl.top + rl.height / 2 - rc.top;
        }
      }
      if (!(oy > this.h * 0.4) || oy > this.h * 1.2) oy = this.h * 0.9;
      this.ox = ox;
      this.oy = oy;
    }

    sembrar() {
      const area = this.w * this.h;
      const n = Math.round(limitar(area / (this.movil ? 9000 : 15000), 26, 90));
      const dMin = Math.sqrt(area / n) * 0.62;
      const yMax = this.oy - this.h * 0.14;
      const puntos = [];
      for (let i = 0, intentos = 0; puntos.length < n && intentos < n * 40; intentos++) {
        const x = this.w * (0.04 + Math.random() * 0.92);
        const y = this.h * 0.04 + Math.random() * Math.max(10, yMax - this.h * 0.04);
        if (puntos.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 > dMin * dMin)) puntos.push({ x, y });
        i++;
      }
      const tMin = this.movil ? 12 : 14;
      const tMax = this.movil ? 26 : 34;
      this.rMax = Math.hypot(Math.max(this.ox, this.w - this.ox), this.oy);
      this.particulas = puntos.map((pt) => ({
        a: Math.atan2(pt.y - this.oy, pt.x - this.ox),
        r: Math.hypot(pt.x - this.ox, pt.y - this.oy),
        s: tMin + Math.random() * (tMax - tMin),
        col: Math.floor(Math.random() * COLORES.length),
        fase: Math.random() * Math.PI * 2,
        tw: 0.6 + Math.random() * 0.8,
        giro: (Math.random() - 0.5) * 0.6,
      }));
    }

    cuadro() {
      if (this.estatico || !this.visible || document.hidden) {
        this.ultimo = 0;
        return;
      }
      const ahora = performance.now();
      const dt = this.ultimo ? Math.min((ahora - this.ultimo) / 1000, 0.05) : 0;
      this.ultimo = ahora;
      this.dibujar(dt);
    }

    dibujar(dt) {
      const { ctx, dpr } = this;
      this.t += dt;
      const t = this.t;
      const omega = 0.018;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.c.width, this.c.height);
      if (this.intensidad <= 0.001) return;
      ctx.globalCompositeOperation = 'lighter';
      const escala = 128 / 80;
      const limiteY = this.oy - this.h * 0.05;
      for (const p of this.particulas) {
        p.a += omega * dt;
        let x = this.ox + Math.cos(p.a) * p.r;
        let y = this.oy + Math.sin(p.a) * p.r;
        if (x > this.w + 60 || (x > this.ox && y > limiteY)) {
          p.a = -Math.PI - p.a;
          x = this.ox + Math.cos(p.a) * p.r;
          y = this.oy + Math.sin(p.a) * p.r;
        }
        const k = 0.65 + 0.7 * (p.r / this.rMax);
        const tam = p.s * k * escala;
        const brillo = 0.72 + 0.28 * Math.sin(t * p.tw + p.fase);
        const fondo = limitar((this.oy - y) / (this.h * 0.16));
        const alfa = this.intensidad * brillo * fondo * 0.92;
        if (alfa <= 0.01) continue;
        for (let m = 0; m < 4; m++) {
          const w = this.pesos[m];
          if (w <= 0.01) continue;
          const rot = m === 0 ? p.fase + t * p.giro : Math.sin(t * 0.4 + p.fase) * 0.12;
          const c = Math.cos(rot) * dpr;
          const s = Math.sin(rot) * dpr;
          ctx.setTransform(c, s, -s, c, x * dpr, y * dpr);
          ctx.globalAlpha = alfa * w;
          ctx.drawImage(this.sprites[m][p.col], -tam / 2, -tam / 2, tam, tam);
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    destruir() {
      this.ro.disconnect();
      this.io.disconnect();
    }
  }

  /* ---------------------------------------------------------------- Medios de las escenas */

  function prepararMedios(raiz, base, alCargar) {
    const escenas = qa(raiz, '[data-uc-uso]');
    const anchoPantalla = () => window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);

    function cargarImagen(escena) {
      const archivo = escena.dataset.posterAsset;
      if (!archivo || escena.dataset.posterIntentado) return;
      escena.dataset.posterIntentado = '1';
      const url = base + archivo;
      const img = new Image();
      img.decoding = 'async';
      img.alt = '';
      img.className = 'uc-uso__img';
      img.sizes = '100vw';
      img.srcset = [750, 1100, 1500, 1920, 2400].map((w) => `${url}?width=${w} ${w}w`).join(', ');
      img.onload = () => {
        q(escena, '[data-uc-media]').insertBefore(img, q(escena, '.uc-uso__velo'));
        requestAnimationFrame(() => img.classList.add('is-cargada'));
        alCargar();
      };
      img.src = url + '?width=' + (anchoPantalla() > 1500 ? 1920 : 1100);
    }

    function activarVideo(escena) {
      if (consultaReducida.matches) return;
      let video = q(escena, '[data-uc-video]');
      if (video && !video.src) {
        const sd = window.innerWidth < 750;
        if (video.dataset.poster) video.poster = video.dataset.poster;
        video.preload = 'metadata';
        video.src = (sd ? video.dataset.srcSd : video.dataset.srcHd) || video.dataset.srcHd;
        video.addEventListener('loadeddata', () => video.classList.add('is-cargada'), { once: true });
      } else if (!video && escena.dataset.videoAsset && !escena.dataset.videoIntentado) {
        escena.dataset.videoIntentado = '1';
        video = document.createElement('video');
        Object.assign(video, { muted: true, loop: true, playsInline: true, preload: 'metadata' });
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('aria-hidden', 'true');
        video.className = 'uc-uso__video';
        video.dataset.ucVideo = '';
        video.addEventListener(
          'loadeddata',
          () => {
            video.classList.add('is-cargada');
            if (escena.dataset.activa === '1') video.play().catch(() => {});
          },
          { once: true }
        );
        video.addEventListener('error', () => video.remove(), { once: true });
        video.src = base + escena.dataset.videoAsset;
        q(escena, '[data-uc-media]').insertBefore(video, q(escena, '.uc-uso__velo'));
      }
      return video;
    }

    function fijarActiva(indice) {
      escenas.forEach((escena, i) => {
        const activa = i === indice;
        escena.dataset.activa = activa ? '1' : '0';
        if (activa || i === indice + 1) activarVideo(escena);
        const video = q(escena, '[data-uc-video]');
        if (!video || !video.src) return;
        if (activa && !consultaReducida.matches) video.play().catch(() => {});
        else video.pause();
      });
    }

    const io = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          cargarImagen(e.target);
          io.unobserve(e.target);
        });
      },
      { rootMargin: '100% 0px' }
    );
    escenas.forEach((e) => io.observe(e));

    // Sin escena fijada (movimiento reducido): cada escena se activa al verse.
    const ioVisible = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.4) fijarActiva(escenas.indexOf(e.target));
        });
      },
      { threshold: [0, 0.4] }
    );

    return {
      fijarActiva,
      modoLibre(activo) {
        escenas.forEach((e) => (activo ? ioVisible.observe(e) : ioVisible.unobserve(e)));
      },
      destruir() {
        io.disconnect();
        ioVisible.disconnect();
      },
    };
  }

  /* ---------------------------------------------------------------- Packs, carrito y botón fijo */

  function prepararCompra(raiz) {
    const form = q(raiz, '[data-uc-form]');
    const fijo = q(raiz, '[data-uc-fijo]');
    const estado = form && q(form, '[data-uc-estado]');
    const carrito = raiz.dataset.carrito || '/cart';
    const carritoAdd = raiz.dataset.carritoAdd || '/cart/add';

    const seleccionado = () => form && q(form, 'input[name="id"]:checked');

    function sincronizar() {
      const sel = seleccionado();
      if (!sel) return;
      const total = form && q(form, '[data-uc-total]');
      if (total) total.textContent = sel.dataset.precio;
      if (fijo) {
        q(fijo, '[data-uc-fijo-nombre]').textContent = sel.dataset.nombre;
        q(fijo, '[data-uc-fijo-precio]').textContent = sel.dataset.precio;
      }
    }

    async function anadir(boton) {
      const sel = seleccionado();
      if (!sel || boton.dataset.ocupado) return;
      boton.dataset.ocupado = '1';
      boton.setAttribute('aria-busy', 'true');
      if (estado) estado.textContent = 'Añadiendo al carrito…';
      try {
        const r = await fetch(carritoAdd + '.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: [{ id: Number(sel.value), quantity: 1 }] }),
        });
        if (!r.ok) {
          const datos = await r.json().catch(() => ({}));
          throw new Error(datos.description || 'No se ha podido añadir al carrito.');
        }
        if (estado) estado.textContent = 'Añadido. Abriendo el carrito…';
        window.location.href = carrito;
      } catch (err) {
        if (estado) estado.textContent = `${err.message} Inténtalo de nuevo.`;
        delete boton.dataset.ocupado;
        boton.removeAttribute('aria-busy');
      }
    }

    if (form) {
      form.addEventListener('change', sincronizar);
      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        anadir(q(form, '[data-uc-comprar]') || form);
      });
    }
    if (fijo) {
      const boton = q(fijo, '[data-uc-fijo-boton]');
      boton.addEventListener('click', () => anadir(boton));
    }
    sincronizar();

    // Visibilidad del botón fijo: tras el hero, salvo con los packs o el pie a la vista.
    const escenario = q(raiz, '[data-uc-escenario]');
    const packs = q(raiz, '[data-uc-packs]');
    let pendiente = false;
    function actualizarFijo() {
      pendiente = false;
      if (!fijo || !escenario) return;
      const vh = window.innerHeight;
      const pie = document.querySelector('.ucx-pie, footer');
      const tras = escenario.getBoundingClientRect().top < -vh * 0.5;
      const rp = packs && packs.getBoundingClientRect();
      const conPacks = rp && rp.top < vh && rp.bottom > 0;
      const rf = pie && pie.getBoundingClientRect();
      const conPie = rf && rf.top < vh - 40;
      const visible = tras && !conPacks && !conPie;
      fijo.classList.toggle('is-visible', visible);
      q(fijo, '[data-uc-fijo-boton]').tabIndex = visible ? 0 : -1;
    }
    const programar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(actualizarFijo);
    };
    document.addEventListener('scroll', programar, { passive: true, capture: true });
    window.addEventListener('resize', programar);
    actualizarFijo();

    return {
      actualizarFijo: programar,
      destruir() {
        document.removeEventListener('scroll', programar, { capture: true });
        window.removeEventListener('resize', programar);
      },
    };
  }

  /* ---------------------------------------------------------------- Carga con porcentaje */

  function pantallaCarga(raiz) {
    const carga = q(raiz, '[data-uc-carga]');
    if (!carga) return Promise.resolve(null);
    const cifra = q(carga, '[data-uc-carga-cifra]');
    const barra = q(carga, '[data-uc-carga-barra]');
    const inicio = performance.now();
    const MIN = 900;
    const MAX = 3200;
    const tareas = [
      document.fonts ? document.fonts.ready : Promise.resolve(),
      document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true })),
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    ];
    let hechas = 0;
    tareas.forEach((t) => t.then(() => hechas++));
    let mostrado = 0;
    return new Promise((resolver) => {
      function paso() {
        const pasado = performance.now() - inicio;
        const objetivo = Math.min((hechas / tareas.length) * 100, (pasado / MIN) * 100);
        mostrado += (Math.max(objetivo, pasado > MAX ? 100 : 0) - mostrado) * 0.14;
        const v = Math.min(100, Math.round(mostrado + 0.4));
        cifra.textContent = v;
        barra.style.transform = `scaleX(${v / 100})`;
        if (v >= 100) resolver(carga);
        else requestAnimationFrame(paso);
      }
      requestAnimationFrame(paso);
    });
  }

  /* ---------------------------------------------------------------- Montaje */

  function iniciar(raiz) {
    if (!raiz || raiz.dataset.ucListo) return null;
    raiz.dataset.ucListo = '1';
    window.UtilsCine = true;

    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    const Split = window.SplitText;
    const editor = raiz.hasAttribute('data-editor');
    const base = raiz.dataset.assets || '';

    const pared = q(raiz, '[data-uc-pared]') ? new Pared(q(raiz, '[data-uc-pared]'), q(raiz, '[data-uc-lente]')) : null;
    const compra = prepararCompra(raiz);
    const limpiezas = [() => compra.destruir()];
    if (pared) limpiezas.push(() => pared.destruir());

    // Imagen real del proyector, si se ha subido a assets/proyector.png
    const svgProyector = q(raiz, '[data-uc-proyector-svg]');
    if (svgProyector) {
      const img = new Image();
      img.alt = svgProyector.getAttribute('aria-label') || '';
      img.className = 'uc-proyector__img';
      img.onload = () => {
        svgProyector.replaceWith(img);
        if (pared) pared.situarOrigen();
      };
      img.src = base + 'proyector.png';
    }

    let refrescoPendiente = 0;
    const refrescar = () => {
      if (!ST) return;
      clearTimeout(refrescoPendiente);
      refrescoPendiente = setTimeout(() => ST.refresh(), 150);
    };
    const medios = prepararMedios(raiz, base, refrescar);
    limpiezas.push(() => medios.destruir());

    // Contadores de ahorro
    const contadores = qa(raiz, '[data-uc-contador]');

    // Sin GSAP (CDN caído): todo visible y funcional.
    if (!gsap || !ST) {
      html.classList.remove('uc-motion');
      const carga = q(raiz, '[data-uc-carga]');
      if (carga) carga.remove();
      if (pared) {
        pared.estatico = true;
        pared.intensidad = 1;
        pared.medir();
      }
      medios.modoLibre(true);
      prepararProgresoNativo(raiz, limpiezas);
      return { destruir: () => limpiezas.forEach((f) => f()) };
    }

    gsap.registerPlugin(ST);
    if (Split) gsap.registerPlugin(Split);
    ST.config({ ignoreMobileResize: true });

    const mm = gsap.matchMedia();
    mm.add(
      { escritorio: '(min-width: 990px)', movil: '(max-width: 989px)', reducida: '(prefers-reduced-motion: reduce)' },
      (contexto) => {
        const { reducida, movil } = contexto.conditions;
        html.classList.toggle('uc-motion', !reducida);
        const scroller = scrollerActual();
        const S = { scroller };
        const limpiar = [];

        /* Lenis conducido por gsap.ticker */
        let lenis = null;
        if (!reducida && !editor && window.Lenis) {
          lenis = new window.Lenis({
            wrapper: scroller === window ? window : scroller,
            content: scroller === window ? document.documentElement : scroller,
            autoRaf: false,
            lerp: 0.1,
            smoothWheel: true,
            syncTouch: false,
            prevent: (nodo) => !!(nodo.closest && nodo.closest('dialog, [data-lenis-prevent], .ucx-menu, cart-drawer-component')),
          });
          lenis.on('scroll', ST.update);
          const conducir = (tiempo) => lenis.raf(tiempo * 1000);
          gsap.ticker.add(conducir);
          gsap.ticker.lagSmoothing(0);
          const alRefrescar = () => lenis.resize();
          ST.addEventListener('refresh', alRefrescar);
          const ro = new ResizeObserver(() => lenis.resize());
          ro.observe(document.querySelector('main') || document.body);
          const bloqueo = new MutationObserver(() => (html.hasAttribute('scroll-lock') ? lenis.stop() : lenis.start()));
          bloqueo.observe(html, { attributes: true, attributeFilter: ['scroll-lock'] });
          limpiar.push(() => {
            gsap.ticker.remove(conducir);
            ST.removeEventListener('refresh', alRefrescar);
            ro.disconnect();
            bloqueo.disconnect();
            lenis.destroy();
          });
        }

        /* Anclas internas */
        const alAncla = (ev) => {
          const destino = document.querySelector(ev.currentTarget.getAttribute('href'));
          if (!destino) return;
          ev.preventDefault();
          if (lenis) lenis.scrollTo(destino, { offset: -altoCabecera(), duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
          else destino.scrollIntoView({ behavior: reducida ? 'auto' : 'smooth' });
        };
        qa(raiz, '[data-uc-ancla]').forEach((a) => a.addEventListener('click', alAncla));
        limpiar.push(() => qa(raiz, '[data-uc-ancla]').forEach((a) => a.removeEventListener('click', alAncla)));

        /* Barra de progreso */
        const barra = q(raiz, '[data-uc-progreso]');
        if (barra) {
          const fijarX = gsap.quickSetter(barra, 'scaleX');
          ST.create({ ...S, start: 0, end: 'max', onUpdate: (s) => fijarX(s.progress) });
        }

        /* Pared: estática con movimiento reducido */
        if (pared) {
          pared.estatico = !!reducida;
          if (!reducida) gsap.ticker.add(pared.cuadro);
          limpiar.push(() => gsap.ticker.remove(pared.cuadro));
        }

        if (reducida) {
          if (pared) {
            pared.intensidad = 1;
            pared.pesos = [1, 0, 0, 0];
            pared.medir();
          }
          medios.modoLibre(true);
          const carga = q(raiz, '[data-uc-carga]');
          if (carga) carga.remove();
          return () => {
            medios.modoLibre(false);
            limpiar.forEach((f) => f());
          };
        }
        medios.modoLibre(false);

        /* ---------- Escenario fijado: hero → copos → Papá Noel → árboles → regalos ---------- */
        const marco = q(raiz, '[data-uc-marco]');
        const hero = q(raiz, '.uc-hero');
        const proyector = q(raiz, '[data-uc-proyector]');
        const halo = q(raiz, '[data-uc-halo]');
        const eyebrowMotivos = q(raiz, '.uc-motivos__eyebrow');
        const cabeceraMotivos = q(raiz, '.uc-motivos__cabecera');
        const motivos = qa(raiz, '[data-uc-motivo]');
        const disco = q(raiz, '[data-uc-disco]');
        const iconos = qa(raiz, '[data-uc-disco-icono]');
        const cuenta = q(raiz, '[data-uc-cuenta]');
        const P_HERO = 0.14;

        const setHeroY = gsap.quickSetter(hero, 'y', 'px');
        const setHeroA = gsap.quickSetter(hero, 'opacity');
        const setDisco = gsap.quickSetter(disco, 'rotation', 'deg');
        const setHaloY = gsap.quickSetter(halo, 'y', 'px');
        const motivoY = motivos.map((m) => gsap.quickSetter(m, 'y', 'px'));
        const motivoA = motivos.map((m) => gsap.quickSetter(m, 'opacity'));
        let ultimaCuenta = '';

        function escenario(p) {
          const h = limitar(p / P_HERO);
          setHeroY(-70 * h);
          setHeroA(1 - h);
          hero.style.pointerEvents = h > 0.5 ? 'none' : '';
          const a = suave(P_HERO * 0.55, P_HERO * 1.15, p);
          eyebrowMotivos.style.opacity = a;
          cabeceraMotivos.style.opacity = a;
          const bruto = limitar((p - P_HERO) / (1 - P_HERO - 0.05)) * (MOTIVOS.length - 1);
          const ent = Math.min(Math.floor(bruto), MOTIVOS.length - 2);
          const frac = bruto - ent;
          const m = ent + suave(0.3, 0.7, frac);
          const pesos = MOTIVOS.map((_, k) => Math.max(0, 1 - Math.abs(m - k)));
          if (pared) pared.pesos = pesos;
          motivos.forEach((_, k) => {
            motivoA[k](pesos[k] * a);
            motivoY[k]((k - m) * 34);
          });
          setDisco(-m * 90);
          iconos.forEach((ic, k) => {
            ic.style.opacity = 0.3 + 0.7 * pesos[k];
            ic.style.stroke = pesos[k] > 0.5 ? 'var(--uc-vela)' : '';
          });
          const c = '0' + (Math.round(m) + 1);
          if (c !== ultimaCuenta) {
            cuenta.textContent = c;
            ultimaCuenta = c;
          }
          setHaloY(-50 * p);
        }

        ST.create({
          ...S,
          trigger: marco,
          start: () => `top top+=${altoCabecera()}`,
          end: () => '+=' + window.innerHeight * (movil ? 3.2 : 4.2),
          pin: true,
          pinType: 'fixed',
          onUpdate: (s) => escenario(s.progress),
          onRefresh: (s) => escenario(s.progress),
        });
        gsap.to(proyector, {
          scale: 0.9,
          ease: 'none',
          scrollTrigger: { ...S, trigger: marco, start: () => `top top+=${altoCabecera()}`, end: () => '+=' + window.innerHeight * 0.7, scrub: 0.6 },
        });

        /* ---------- Escenas de uso encadenadas (cortina con máscara y contramáscara) ---------- */
        const usosMarco = q(raiz, '[data-uc-usos-marco]');
        const escenas = qa(raiz, '[data-uc-uso]');
        if (usosMarco && escenas.length) {
          const lineas = escenas.map((e) => qa(e, '[data-uc-uso-linea]'));
          const media = escenas.map((e) => q(e, '[data-uc-media]'));
          const PASO = 1.6;
          const tl = gsap.timeline({ defaults: { ease: 'none' } });
          tl.fromTo(lineas[0], { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, 0);
          tl.fromTo(media[0], { scale: 1.12 }, { scale: 1, duration: 1, ease: 'power1.out' }, 0);
          for (let i = 1; i < escenas.length; i++) {
            const pos = i * PASO - 0.6;
            tl.to(lineas[i - 1], { yPercent: -110, duration: 0.4, stagger: 0.05, ease: 'power2.in' }, pos);
            tl.fromTo(q(escenas[i], '[data-uc-mascara]'), { yPercent: 100 }, { yPercent: 0, duration: 1, ease: 'power3.inOut' }, pos);
            tl.fromTo(q(escenas[i], '[data-uc-contra]'), { yPercent: -100 }, { yPercent: 0, duration: 1, ease: 'power3.inOut' }, pos);
            tl.fromTo(media[i], { scale: 1.25 }, { scale: 1, duration: 1.3, ease: 'power2.out' }, pos);
            tl.to(media[i - 1], { scale: 1.08, yPercent: -6, duration: 1, ease: 'power2.inOut' }, pos);
            tl.fromTo(lineas[i], { yPercent: 110 }, { yPercent: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' }, pos + 0.6);
          }
          // Parallax ligero por capas dentro de cada fondo provisional
          escenas.forEach((e, i) => {
            const desde = Math.max(0, i * PASO - 0.6);
            qa(e, '[data-uc-capa]').forEach((capa) => {
              const v = parseFloat(capa.dataset.ucCapa) || 1;
              tl.fromTo(capa, { y: 26 * v }, { y: -26 * v, duration: PASO + 0.6, ease: 'none' }, desde);
            });
          });
          tl.to({}, { duration: 0.5 });

          let activa = -1;
          ST.create({
            ...S,
            trigger: usosMarco,
            start: () => `top top+=${altoCabecera()}`,
            end: () => '+=' + window.innerHeight * (escenas.length - 1) * (movil ? 1.1 : 1.3),
            pin: true,
            pinType: 'fixed',
            scrub: 0.5,
            animation: tl,
            onUpdate: () => {
              const t = tl.time();
              let indice = 0;
              for (let i = 1; i < escenas.length; i++) if (t > i * PASO - 0.1) indice = i;
              if (indice !== activa) {
                activa = indice;
                medios.fijarActiva(indice);
              }
            },
            onToggle: (s) => {
              if (!s.isActive) qa(raiz, '[data-uc-video]').forEach((v) => v.pause());
              else if (activa >= 0) medios.fijarActiva(activa);
            },
          });
        }

        /* ---------- Titulares con revelado por líneas ---------- */
        const splits = [];
        if (Split) {
          qa(raiz, '[data-uc-lineas]').forEach((el) => {
            splits.push(
              Split.create(el, {
                type: 'lines',
                mask: 'lines',
                linesClass: 'uc-linea',
                autoSplit: true,
                onSplit: (self) =>
                  gsap.from(self.lines, {
                    yPercent: 110,
                    duration: 1.1,
                    ease: 'power4.out',
                    stagger: 0.09,
                    scrollTrigger: { ...S, trigger: el, start: 'top 86%', once: true },
                  }),
              })
            );
          });
        }

        /* ---------- Pasos ---------- */
        qa(raiz, '[data-uc-paso]').forEach((paso, i) => {
          const tl = gsap.timeline({ scrollTrigger: { ...S, trigger: paso, start: 'top 85%', once: true }, delay: i * 0.08 });
          tl.from(paso.children, { y: 28, autoAlpha: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07 });
          const anim = q(paso, '[data-uc-anim]');
          if (!anim) return;
          const tipo = anim.dataset.ucAnim;
          if (tipo === 'enchufe') tl.from(anim, { x: -18, duration: 1, ease: 'power3.inOut' }, 0.3);
          if (tipo === 'orienta') tl.from(anim, { rotation: -24, svgOrigin: '48 52', duration: 1.2, ease: 'back.out(1.6)' }, 0.3);
          if (tipo === 'rayos') tl.from(anim, { scale: 0.4, autoAlpha: 0, svgOrigin: '48 34', duration: 1, ease: 'power3.out' }, 0.4);
        });

        /* ---------- Packs y contadores ---------- */
        const tarjetas = qa(raiz, '[data-uc-pack]');
        if (tarjetas.length) {
          gsap.from(tarjetas, {
            y: 30,
            autoAlpha: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { ...S, trigger: tarjetas[0], start: 'top 88%', once: true },
          });
        }
        contadores.forEach((el) => {
          const final = el.textContent;
          const centimos = centimosDe(final);
          const estado = { v: 0 };
          el.textContent = formatearComo(final, 0);
          gsap.to(estado, {
            v: centimos,
            duration: 1.4,
            ease: 'power2.out',
            scrollTrigger: { ...S, trigger: el, start: 'top 92%', once: true },
            onUpdate: () => (el.textContent = formatearComo(final, Math.round(estado.v))),
            onComplete: () => (el.textContent = final),
          });
          limpiar.push(() => (el.textContent = final));
        });

        /* ---------- Cierre ---------- */
        const final = q(raiz, '[data-uc-final]');
        if (final) {
          gsap.from(qa(final, '.uc-btn'), {
            y: 24,
            autoAlpha: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { ...S, trigger: final, start: 'top 70%', once: true },
          });
        }

        /* ---------- Entrada: carga → encendido del proyector → título ---------- */
        const intro = qa(raiz, '.uc-hero [data-uc-intro]');
        const titulo = q(raiz, '[data-uc-titulo]');
        const lente = q(raiz, '[data-uc-lente]');
        const haz = q(raiz, '[data-uc-haz]');
        const parpadeo = (v) => [
          { opacity: v * 0.7, duration: 0.08 },
          { opacity: v * 0.15, duration: 0.07 },
          { opacity: v, duration: 0.1 },
          { opacity: v * 0.45, duration: 0.06 },
          { opacity: v, duration: 0.5 },
        ];
        function entrada() {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          tl.fromTo(proyector, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 0);
          tl.to(lente, { keyframes: parpadeo(1) }, 0.5);
          tl.to(haz, { keyframes: parpadeo(1) }, 0.62);
          tl.fromTo(halo, { opacity: 0 }, { opacity: 1, duration: 1.8, ease: 'power2.out' }, 0.6);
          if (pared) tl.to(pared, { keyframes: [{ intensidad: 0.6, duration: 0.08 }, { intensidad: 0.1, duration: 0.07 }, { intensidad: 1, duration: 0.9 }] }, 0.66);
          if (Split) {
            tl.add(() => {
              gsap.set(titulo, { opacity: 1 });
              splits.push(
                Split.create(titulo, {
                  type: 'lines',
                  mask: 'lines',
                  linesClass: 'uc-linea',
                  autoSplit: true,
                  onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: 0.1 }),
                })
              );
            }, 0.7);
          } else {
            tl.fromTo(titulo, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 0.7);
          }
          tl.fromTo(intro, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 1.0);
          tl.add(() => ST.refresh(), '>');
        }

        if (lenis) lenis.stop();
        pantallaCarga(raiz).then((carga) => {
          if (carga) {
            const centro = q(carga, '.uc-carga__centro');
            gsap
              .timeline({ onComplete: () => carga.remove() })
              .to(centro, { y: -30, autoAlpha: 0, duration: 0.5, ease: 'power3.in' })
              .to(carga, { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, 0.25)
              .add(() => {
                if (lenis) lenis.start();
                entrada();
              }, 0.65);
          } else {
            if (lenis) lenis.start();
            entrada();
          }
        });

        if (document.fonts) document.fonts.ready.then(refrescar);
        window.addEventListener('load', refrescar, { once: true });
        compra.actualizarFijo();

        return () => {
          splits.forEach((s) => s.revert());
          limpiar.forEach((f) => f());
        };
      }
    );

    limpiezas.push(() => mm.revert());
    return { destruir: () => limpiezas.forEach((f) => f()) };
  }

  function prepararProgresoNativo(raiz, limpiezas) {
    const barra = q(raiz, '[data-uc-progreso]');
    if (!barra) return;
    const alScroll = () => {
      const s = scrollerActual();
      const el = s === window ? document.documentElement : s;
      const max = el.scrollHeight - el.clientHeight;
      barra.style.transform = `scaleX(${max > 0 ? el.scrollTop / max : 0})`;
    };
    document.addEventListener('scroll', alScroll, { passive: true, capture: true });
    limpiezas.push(() => document.removeEventListener('scroll', alScroll, { capture: true }));
  }

  /* ---------------------------------------------------------------- Arranque y editor de temas */

  const instancias = new Map();
  function arrancar(contenedor = document) {
    qa(contenedor, '[data-uc]').forEach((raiz) => {
      const inst = iniciar(raiz);
      if (inst) instancias.set(raiz, inst);
    });
  }
  document.addEventListener('shopify:section:load', (e) => arrancar(e.target));
  document.addEventListener('shopify:section:unload', (e) => {
    qa(e.target, '[data-uc]').forEach((raiz) => {
      const inst = instancias.get(raiz);
      if (inst) inst.destruir();
      instancias.delete(raiz);
    });
  });
  arrancar();
})();
