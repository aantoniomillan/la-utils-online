/* UtilsLA · Portada cinematográfica del proyector.
   GSAP + ScrollTrigger (servidos desde assets/) y three.js (assets/utilsla-proyector3d.js). Scroll nativo: la ventana es el único contenedor de scroll (el CSS lo fuerza en escritorio).
   En el diseño "squeeze" de Horizon (≥990px) el scroll vive en .page-wrapper; en móvil, en la ventana. */
(() => {
  'use strict';

  const html = document.documentElement;
  const consultaReducida = window.matchMedia('(prefers-reduced-motion: reduce)');
  
  const q = (raiz, sel) => raiz.querySelector(sel);
  const qa = (raiz, sel) => Array.from(raiz.querySelectorAll(sel));
  const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const suave = (a, b, v) => {
    const t = limitar((v - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const altoCabecera = () => parseFloat(getComputedStyle(document.body).getPropertyValue('--header-height')) || 0;

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

  /* ---------------------------------------------------------------- Proyección (canvas 2D) */

  const NOMBRES = ['Copos de nieve', 'Papá Noel', 'Árboles', 'Regalos', 'Estrellas', 'Bastones'];
  const BASE_MOTIVO = ['#9fd4ff', '#ff3a44', '#2fe08a', '#ffb02e', '#ffe27a', '#ff4d4d'];
  const PALETAS = {
    multi: ['#ff5a5f', '#ffc778', '#5edc9f', '#93d5ff', '#fff4e0'],
    calido: ['#ffc778', '#ffdda6', '#ff9e5e', '#fff4e0'],
    rojo: ['#ff3b4e', '#ff7a85', '#ff5a5f', '#ffd0d4'],
    verde: ['#2fdc86', '#8affc1', '#5edc9f', '#d8ffe9'],
    azul: ['#4aa3ff', '#9ad0ff', '#6cb6ff', '#e0f0ff'],
  };

  function dibujarMotivo(ctx, tipo) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (tipo === 'copos') {
      ctx.lineWidth = 0.075;
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
      // gorro con pompón y ribete
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
      // barba con la cara recortada
      ctx.beginPath();
      ctx.moveTo(-0.62, 0.02);
      ctx.bezierCurveTo(-0.8, 0.7, -0.4, 1.02, 0, 1.0);
      ctx.bezierCurveTo(0.4, 1.02, 0.8, 0.7, 0.62, 0.02);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.ellipse(0, 0.27, 0.35, 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-0.74, 0.04, 1.48, 0.045);
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(-0.14, 0.23, 0.045, 0, Math.PI * 2);
      ctx.arc(0.14, 0.23, 0.045, 0, Math.PI * 2);
      ctx.moveTo(0.06, 0.32);
      ctx.arc(0, 0.32, 0.06, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-0.15, 0.5, 0.17, 0.08, 0.25, 0, Math.PI * 2);
      ctx.ellipse(0.15, 0.5, 0.17, 0.08, -0.25, 0, Math.PI * 2);
      ctx.fill();
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
    if (tipo === 'estrella') {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 0.44 : 1;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 0.035;
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * 0.9, Math.sin(a) * 0.9);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      return;
    }
    if (tipo === 'baston') {
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(0.18, 0.95);
      ctx.lineTo(0.18, -0.4);
      ctx.arc(-0.2, -0.4, 0.38, 0, -Math.PI, true);
      ctx.lineTo(-0.58, -0.18);
      ctx.stroke();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 0.11;
      ctx.beginPath();
      for (let i = -7; i <= 7; i++) {
        ctx.moveTo(-1.2, i * 0.26 - 0.5);
        ctx.lineTo(1.2, i * 0.26 + 0.7);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
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

  const TIPOS = ['copos', 'santa', 'arbol', 'regalo', 'estrella', 'baston'];
  const ARCHIVOS = ['copo', 'santa', 'arbol', 'regalo', 'estrella', 'baston'];
  const MOTIVOS = TIPOS;

  /* Imágenes opcionales assets/motivo-*.png (blanco sobre transparente). Si la primera no existe, se dibujan en canvas. */
  function cargarMotivosPng(base) {
    const imagenes = {};
    const cargar = (i) =>
      new Promise((resolver) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          imagenes[TIPOS[i]] = img;
          resolver(true);
        };
        img.onerror = () => resolver(false);
        img.src = `${base}motivo-${ARCHIVOS[i]}.png`;
      });
    cargar(0).then((hay) => hay && Promise.all(TIPOS.slice(1).map((_, i) => cargar(i + 1))));
    return imagenes;
  }

  /* Sprite luminoso de un motivo: núcleo casi blanco con halo de color (se pinta con 'lighter'). */
  function crearSprite(tipo, color, png, grande) {
    const T = grande ? 576 : 192;
    const k = T / 192;
    const R = T * 0.31;
    const forma = document.createElement('canvas');
    forma.width = forma.height = T;
    const fc = forma.getContext('2d');
    if (png) {
      const lado = R * 2;
      fc.drawImage(png, T / 2 - lado / 2, T / 2 - lado / 2, lado, lado);
      fc.globalCompositeOperation = 'source-in';
      fc.fillStyle = color;
      fc.fillRect(0, 0, T, T);
    } else {
      fc.translate(T / 2, T / 2);
      fc.scale(R, R);
      fc.fillStyle = fc.strokeStyle = color;
      dibujarMotivo(fc, tipo);
    }
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = T;
    const sc = sprite.getContext('2d');
    // halo de color alrededor y forma nítida encima, como una proyección real
    sc.shadowColor = color;
    sc.shadowBlur = 20 * k * (grande ? 0.6 : 1);
    sc.globalAlpha = 0.6;
    sc.drawImage(forma, 0, 0);
    sc.shadowBlur = 0;
    sc.globalAlpha = 1;
    sc.drawImage(forma, 0, 0);
    sc.globalCompositeOperation = 'source-atop';
    sc.fillStyle = 'rgba(255,255,255,0.1)';
    sc.fillRect(T * 0.19, T * 0.19, T * 0.62, T * 0.62);
    return { lienzo: sprite, caja: (T / (2 * R)) };
  }

  /* Luz proyectada: disco con borde difuso, un motivo grande y seis pequeños iguales, polvo de luz. */
  class Proyeccion {
    constructor(lienzo, imagenes) {
      this.c = lienzo;
      this.ctx = lienzo.getContext('2d');
      this.imagenes = imagenes;
      this.pesos = [1, 0, 0, 0, 0, 0];
      this.paleta = 'multi';
      this.giro = true;
      this.velocidad = 1;
      this.intensidad = 1;
      this.t = 0;
      this.orbita = 0;
      this.D = 0;
      this.dpr = 1;
      this.sprites = new Map();
      this.motas = Array.from({ length: 18 }, (_, i) => ({
        a: (i * 2.399) % (Math.PI * 2),
        r: 0.12 + ((i * 0.137) % 0.78),
        s: 1 + ((i * 0.61) % 2.2),
        f: i * 1.7,
      }));
    }

    medir(D, dpr) {
      this.D = D;
      this.dpr = dpr;
      this.c.width = this.c.height = Math.max(2, Math.round(D * dpr));
    }

    colores() {
      return PALETAS[this.paleta] || PALETAS.multi;
    }

    fijarPaleta(nombre) {
      this.paleta = PALETAS[nombre] ? nombre : 'multi';
      this.sprites.clear();
    }

    color(m, i) {
      const pal = this.colores();
      if (this.paleta === 'multi') return i < 0 ? BASE_MOTIVO[m] : pal[(i + m) % pal.length];
      return i < 0 ? pal[0] : pal[(i + 1) % pal.length];
    }

    sprite(m, i) {
      const clave = m * 10 + (i + 1) + this.paleta;
      let s = this.sprites.get(clave);
      if (!s) {
        s = crearSprite(TIPOS[m], this.color(m, i), this.imagenes[TIPOS[m]], i < 0);
        this.sprites.set(clave, s);
      }
      return s;
    }

    dibujar(dt) {
      const { ctx, dpr, D } = this;
      if (!D) return;
      if (this.giro) {
        this.t += dt * this.velocidad;
        this.orbita += dt * this.velocidad * 0.075;
      }
      const t = this.t;
      const px = D * dpr;
      const c = px / 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, px, px);
      if (this.intensidad <= 0.002) return;
      const pal = this.colores();

      // Disco de luz con el borde difuso
      const disco = ctx.createRadialGradient(c, c, 0, c, c, c);
      disco.addColorStop(0, 'rgba(255,244,224,0.17)');
      disco.addColorStop(0.55, 'rgba(255,230,190,0.11)');
      disco.addColorStop(0.86, 'rgba(255,214,160,0.04)');
      disco.addColorStop(1, 'rgba(255,214,160,0)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = disco;
      ctx.fillRect(0, 0, px, px);

      // Manchas de color que se desplazan despacio
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const bx = c + Math.cos(t * 0.09 + i * 2.1) * c * 0.34;
        const by = c + Math.sin(t * 0.07 + i * 1.7) * c * 0.34;
        const r = c * 0.62;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
        g.addColorStop(0, hexA(pal[i % pal.length], 0.1 * this.intensidad));
        g.addColorStop(1, hexA(pal[i % pal.length], 0));
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, px, px);
      }

      // Motivos: uno muy grande y seis pequeños, todos los pequeños del mismo tamaño
      const GRANDE = 0.6;
      const PEQ = 0.155;
      const anillo = 0.405;
      for (let m = 0; m < MOTIVOS.length; m++) {
        const w = this.pesos[m];
        if (w <= 0.01) continue;
        const giraSolo = m === 0 || m === 4;
        const ease = 0.86 + 0.14 * w;
        const alfa = w * this.intensidad;
        const dibuja = (s, x, y, rot, i) => {
          const sp = this.sprite(m, i);
          const tam = s * px * sp.caja * ease;
          ctx.setTransform(Math.cos(rot), Math.sin(rot), -Math.sin(rot), Math.cos(rot), x, y);
          ctx.globalAlpha = alfa;
          ctx.drawImage(sp.lienzo, -tam / 2, -tam / 2, tam, tam);
        };
        const sacudida = (1 - w) * 0.6;
        dibuja(GRANDE, c, c, (giraSolo ? t * 0.16 : Math.sin(t * 0.35) * 0.05) + sacudida, -1);
        for (let k = 0; k < 6; k++) {
          const a = this.orbita + (k * Math.PI * 2) / 6 + m * 0.5;
          const x = c + Math.cos(a) * anillo * px;
          const y = c + Math.sin(a) * anillo * px;
          dibuja(PEQ, x, y, giraSolo ? t * 0.3 + k : Math.sin(t * 0.5 + k) * 0.08, k);
        }
      }

      // Polvo de luz
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      for (const mt of this.motas) {
        const a = mt.a + t * 0.02;
        const x = c + Math.cos(a) * mt.r * c;
        const y = c + Math.sin(a) * mt.r * c;
        ctx.globalAlpha = (0.25 + 0.25 * Math.sin(t * 0.9 + mt.f)) * this.intensidad;
        ctx.fillStyle = '#fff4e0';
        ctx.beginPath();
        ctx.arc(x, y, mt.s * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /* ---------------------------------------------------------------- Fotos de la secuencia (precargadas) */

  /* Usa la imagen elegida en el editor o assets/escena-N.jpg. Devuelve una promesa que se resuelve cuando todas han intentado cargar. */
  function prepararFotos(raiz, base) {
    const fotos = qa(raiz, '[data-uc-foto]');
    const ancho = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2) > 1500 ? 1920 : 1200;
    const cargas = fotos.map(
      (foto) =>
        new Promise((resolver) => {
          const media = q(foto, '[data-uc-foto-media]');
          const marcada = q(foto, 'img');
          const listo = (img) => {
            img.classList.add('is-cargada');
            foto.classList.add('tiene-foto');
            resolver(true);
          };
          if (marcada) {
            if (marcada.complete && marcada.naturalWidth) listo(marcada);
            else {
              marcada.addEventListener('load', () => listo(marcada), { once: true });
              marcada.addEventListener('error', () => resolver(false), { once: true });
            }
            return;
          }
          if (!foto.dataset.asset) return resolver(false);
          const url = base + foto.dataset.asset;
          const img = new Image();
          img.decoding = 'async';
          img.alt = '';
          img.className = 'uc-foto__img';
          img.sizes = '100vw';
          img.srcset = [750, 1200, 1920].map((w) => `${url}?width=${w} ${w}w`).join(', ');
          img.onload = () => {
            media.appendChild(img);
            requestAnimationFrame(() => listo(img));
          };
          img.onerror = () => resolver(false);
          img.src = `${url}?width=${ancho}`;
        })
    );
    return Promise.all(cargas);
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
      const ref = escenario.parentElement && escenario.parentElement.classList.contains('pin-spacer') ? escenario.parentElement : escenario;
      const tras = ref.getBoundingClientRect().bottom < vh * 0.6;
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

  /* ---------------------------------------------------------------- Proyector 3D (carga bajo demanda) */

  function cargarScript(src) {
    return new Promise((resolver, rechazar) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolver;
      s.onerror = rechazar;
      document.head.appendChild(s);
    });
  }

  /* Devuelve la API 3D o null si el dispositivo no debe usarla (sin WebGL, ahorro de datos, equipo modesto). */
  async function iniciar3D(raiz, base, movil) {
    const lienzo = q(raiz, '[data-uc-3d]');
    if (!lienzo || !lienzo.dataset.three) return null;
    const param = new URLSearchParams(location.search).get('uc3d');
    if (param === '0') return null;
    if (param !== '1') {
      const cx = navigator.connection;
      if (cx && (cx.saveData || /(^|-)2g$/.test(cx.effectiveType || ''))) return null;
      if ((navigator.hardwareConcurrency || 8) <= 3 || (navigator.deviceMemory || 8) <= 2) return null;
    }
    try {
      const prueba = document.createElement('canvas');
      if (!(prueba.getContext('webgl2') || prueba.getContext('webgl'))) return null;
      if (!window.UtilsProyector3D) await cargarScript(lienzo.dataset.three);
      return await window.UtilsProyector3D.crear({ canvas: lienzo, glb: base + 'proyector.glb', movil });
    } catch (e) {
      if (window.console) console.warn('[UtilsLA] Proyector 3D no disponible, se usa la imagen:', e && e.message);
      return null;
    }
  }

  /* ---------------------------------------------------------------- Carga con porcentaje */

  function pantallaCarga(raiz, extras = []) {
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
      ...extras.map((p) => p.catch(() => null)),
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

  /* ---------------------------------------------------------------- Disposición, poses y recorrido del scroll */

  const lerp = (a, b, k) => a + (b - a) * k;
  const sua = (v) => {
    const t = limitar(v);
    return t * t * (3 - 2 * t);
  };
  const salida = (v) => 1 - Math.pow(1 - limitar(v), 3);
  const lerpAng = (a, b, k) => a + ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI) * k;
  const N = MOTIVOS.length;
  // Pequeño cambio de postura del proyector con cada efecto (guiño, cabeceo)
  const POSES = [
    [0, 0],
    [0.1, -0.05],
    [-0.08, 0.05],
    [0.14, 0.02],
    [-0.11, -0.06],
    [0.07, 0.07],
  ];
  const RAYOS = {
    multi: ['rgba(255, 236, 200, 0.55)', 'rgba(255, 199, 120, 0.16)'],
    calido: ['rgba(255, 236, 200, 0.55)', 'rgba(255, 199, 120, 0.16)'],
    rojo: ['rgba(255, 120, 132, 0.5)', 'rgba(255, 59, 78, 0.15)'],
    verde: ['rgba(140, 255, 196, 0.45)', 'rgba(47, 220, 134, 0.14)'],
    azul: ['rgba(154, 208, 255, 0.5)', 'rgba(74, 163, 255, 0.15)'],
  };

  function medidas(W, H) {
    const horizontal = W >= 900 && W > H * 1.05;
    if (horizontal) {
      const h0 = limitar(H * 0.21, 130, 230);
      const h1 = limitar(H * 0.37, 200, 350);
      const D = Math.min(H * 0.82, W * 0.5);
      return {
        horizontal,
        hero: { x: W * 0.5, y: H - H * 0.05 - h0 * 0.5, h: h0, yaw: 0.35, pitch: -0.85 },
        fin: { x: W * 0.215, y: H * 0.52, h: h1, yaw: 1.14, pitch: -0.22 },
        proy: { cx: W * 0.675, cy: H * 0.5, D },
      };
    }
    const h0 = limitar(H * 0.2, 120, 210);
    const h1 = limitar(H * 0.16, 100, 160);
    const D = Math.min(W * 0.92, H * 0.5);
    return {
      horizontal,
      hero: { x: W * 0.5, y: H - H * 0.04 - h0 * 0.5, h: h0, yaw: 0.35, pitch: -0.85 },
      fin: { x: W * 0.2, y: H * 0.87, h: h1 * 0.92, yaw: 1.1, pitch: -0.3 },
      proy: { cx: W * 0.52, cy: H * 0.06 + D / 2, D },
    };
  }

  /* ---------------------------------------------------------------- Montaje */

  function iniciar(raiz) {
    if (!raiz || raiz.dataset.ucListo) return null;
    raiz.dataset.ucListo = '1';
    window.UtilsCine = true;

    const gsap = window.gsap;
    const ST = window.ScrollTrigger;
    const base = raiz.dataset.assets || '';

    let pedirDistribucion = () => {};
    let geometriaImg = { dx: 0, dy: -0.14, ang: -Math.PI / 2 };
    const lienzoProy = q(raiz, '[data-uc-proy-lienzo]');
    const imagenesMotivos = cargarMotivosPng(base);
    const proyeccion = lienzoProy ? new Proyeccion(lienzoProy, imagenesMotivos) : null;
    const compra = prepararCompra(raiz);
    const limpiezas = [() => compra.destruir()];

    const escenario = q(raiz, '[data-uc-escenario]');
    const marco = q(raiz, '[data-uc-marco]');
    const hero = q(raiz, '.uc-hero');
    const proyectorEl = q(raiz, '[data-uc-proyector]');
    const lienzo3d = q(raiz, '[data-uc-3d]');
    const proyEl = q(raiz, '[data-uc-proy]');
    const rayo = q(raiz, '[data-uc-rayo]');
    const halo = q(raiz, '[data-uc-halo]');
    const ctl = q(raiz, '[data-uc-ctl]');
    const eyebrowMotivos = q(raiz, '.uc-motivos__eyebrow');
    const motivos = qa(raiz, '[data-uc-motivo]');
    const nombreEl = q(raiz, '[data-uc-nombre]');
    const cuentaEl = q(raiz, '[data-uc-cuenta]');
    const btnPrev = q(raiz, '[data-uc-prev]');
    const btnNext = q(raiz, '[data-uc-next]');
    const lenteEl = q(raiz, '[data-uc-lente]');

    // Imagen real del proyector, si se ha subido a assets/proyector.png
    const svgProyector = q(raiz, '[data-uc-proyector-svg]');
    if (svgProyector) {
      const img = new Image();
      img.alt = svgProyector.getAttribute('aria-label') || '';
      img.className = 'uc-proyector__img';
      img.onload = () => {
        svgProyector.replaceWith(img);
        // La lente de assets/proyector.png (render del modelo 3D) queda a un 57,8 % / 18,4 %
        geometriaImg = { dx: 0.0775, dy: -0.316, ang: -1.28 };
        if (lenteEl) Object.assign(lenteEl.style, { left: '57.8%', top: '18.4%', width: '34%' });
        pedirDistribucion();
      };
      img.src = base + 'proyector.png';
    }

    let refrescoPendiente = 0;
    const refrescar = () => {
      if (!ST) return;
      clearTimeout(refrescoPendiente);
      refrescoPendiente = setTimeout(() => ST.refresh(), 150);
    };
    const fotosListas = prepararFotos(raiz, base).then((r) => {
      refrescar();
      return r;
    });

    // Contadores de ahorro
    const contadores = qa(raiz, '[data-uc-contador]');

    /* Estado de los controles de la proyección (comparte tanto el modo animado como el estático) */
    const control = { color: 'multi', velocidad: 1, giro: true };
    let api3d = null;
    let alCambiarEfecto = null;
    function aplicarControles() {
      if (proyeccion) {
        proyeccion.giro = control.giro;
        proyeccion.velocidad = control.velocidad;
        proyeccion.fijarPaleta(control.color);
      }
      if (api3d) {
        api3d.girar(control.giro);
        api3d.velocidad(control.velocidad);
        api3d.paleta(control.color);
      }
      const [a, b] = RAYOS[control.color] || RAYOS.multi;
      raiz.style.setProperty('--uc-rayo-a', a);
      raiz.style.setProperty('--uc-rayo-b', b);
      const g = q(raiz, '[data-uc-giro]');
      if (g) {
        g.setAttribute('aria-pressed', String(control.giro));
        g.setAttribute('aria-label', control.giro ? 'Parar el giro de la proyección' : 'Reanudar el giro de la proyección');
      }
      qa(raiz, '[data-uc-vel]').forEach((b2) => b2.setAttribute('aria-pressed', String(parseFloat(b2.dataset.ucVel) === control.velocidad)));
      qa(raiz, '[data-uc-color]').forEach((b2) => b2.setAttribute('aria-pressed', String(b2.dataset.ucColor === control.color)));
      if (alCambiarEfecto) alCambiarEfecto.estatico();
    }
    const alControl = (ev) => {
      const b = ev.target.closest('button');
      if (!b || !ctl.contains(b)) return;
      if (b.hasAttribute('data-uc-giro')) control.giro = !control.giro;
      else if (b.dataset.ucVel) control.velocidad = parseFloat(b.dataset.ucVel);
      else if (b.dataset.ucColor) control.color = b.dataset.ucColor;
      else return;
      aplicarControles();
    };
    if (ctl) ctl.addEventListener('click', alControl);
    limpiezas.push(() => ctl && ctl.removeEventListener('click', alControl));

    // Sin GSAP (no ha cargado): todo visible y funcional, con la proyección estática.
    const modoEstatico = () => {
      html.classList.remove('uc-motion');
      const carga = q(raiz, '[data-uc-carga]');
      if (carga) carga.remove();
      if (!proyeccion) return () => {};
      let indice = 0;
      control.giro = false;
      const dibujar = () => {
        proyeccion.pesos = MOTIVOS.map((_, k) => (k === indice ? 1 : 0));
        const r = lienzoProy.getBoundingClientRect();
        if (r.width && Math.round(r.width * proyeccion.dpr) !== lienzoProy.width) proyeccion.medir(r.width, Math.min(window.devicePixelRatio || 1, 2));
        proyeccion.dibujar(0);
        if (nombreEl) nombreEl.textContent = NOMBRES[indice];
        if (cuentaEl) cuentaEl.textContent = '0' + (indice + 1);
        if (btnPrev) btnPrev.disabled = indice === 0;
        if (btnNext) btnNext.disabled = indice === N - 1;
      };
      alCambiarEfecto = { estatico: dibujar };
      const ir = (d) => {
        indice = limitar(indice + d, 0, N - 1);
        dibujar();
      };
      const p = () => ir(-1);
      const n = () => ir(1);
      if (btnPrev) btnPrev.addEventListener('click', p);
      if (btnNext) btnNext.addEventListener('click', n);
      const ro = new ResizeObserver(dibujar);
      ro.observe(lienzoProy);
      aplicarControles();
      return () => {
        ro.disconnect();
        if (btnPrev) btnPrev.removeEventListener('click', p);
        if (btnNext) btnNext.removeEventListener('click', n);
        alCambiarEfecto = null;
      };
    };

    if (!gsap || !ST) {
      const fin = modoEstatico();
      prepararProgresoNativo(raiz, limpiezas);
      limpiezas.push(fin);
      return { destruir: () => limpiezas.forEach((f) => f()) };
    }

    gsap.registerPlugin(ST);
    ST.config({ ignoreMobileResize: true });

    const mm = gsap.matchMedia();
    mm.add(
      { escritorio: '(min-width: 990px)', movil: '(max-width: 989px)', reducida: '(prefers-reduced-motion: reduce)' },
      (contexto) => {
        const { reducida, movil } = contexto.conditions;
        html.classList.toggle('uc-motion', !reducida);
        const S = { scroller: window };
        const limpiar = [];

        /* Anclas internas */
        const alAncla = (ev) => {
          const destino = document.querySelector(ev.currentTarget.getAttribute('href'));
          if (!destino) return;
          ev.preventDefault();
          window.scrollTo({ top: destino.getBoundingClientRect().top + window.scrollY - altoCabecera(), behavior: reducida ? 'auto' : 'smooth' });
        };
        qa(raiz, '[data-uc-ancla]').forEach((a) => a.addEventListener('click', alAncla));
        limpiar.push(() => qa(raiz, '[data-uc-ancla]').forEach((a) => a.removeEventListener('click', alAncla)));

        /* Barra de progreso */
        const barra = q(raiz, '[data-uc-progreso]');
        if (barra) {
          const fijarX = gsap.quickSetter(barra, 'scaleX');
          ST.create({ ...S, start: 0, end: 'max', onUpdate: (s) => fijarX(s.progress) });
        }

        if (reducida) {
          const fin = modoEstatico();
          return () => {
            fin();
            limpiar.forEach((f) => f());
          };
        }
        if (!marco || !escenario) return () => limpiar.forEach((f) => f());

        /* ---------- Un solo marco fijado: hero → proyector a un lado + proyección → fotos ---------- */
        const fotos = qa(raiz, '[data-uc-foto]');
        const velo = q(raiz, '[data-uc-velo]');
        const frases = fotos.map((f) => q(f, '[data-uc-frase]'));
        const media = fotos.map((f) => q(f, '[data-uc-foto-media]'));
        const mascara0 = fotos[0] && q(fotos[0], '[data-uc-mascara]');
        const contra0 = fotos[0] && q(fotos[0], '[data-uc-contra]');

        // Calendario del recorrido, en "unidades" de scroll. Las fotos pasan rápido: cortes y fundidos cortos.
        const U0 = 2.3; // primer efecto centrado
        const TS = U0 + (N - 1) + 0.3; // empieza el zoom con máscara hacia la primera foto
        const T_ZOOM = 1.5;
        const RETENER = 0.55;
        const ESTILOS = ['fundido', 'corte', 'atras', 'corte', 'fundido']; // cómo entra cada foto a partir de la 2.ª
        const DURACION = [0.3, 0.1, 0.4, 0.1, 0.3];
        const dur = fotos.map((_, i) => (i === 0 ? T_ZOOM : DURACION[(i - 1) % DURACION.length]));
        const inicio = [];
        const fin = [];
        fotos.forEach((_, i) => {
          inicio[i] = i === 0 ? TS : fin[i - 1] + RETENER;
          fin[i] = inicio[i] + dur[i];
        });
        const TV = (fotos.length ? fin[fotos.length - 1] : TS) + RETENER + 0.25; // velo hacia "cómo se usa"
        const D_VELO = 0.9;
        const UT = TV + D_VELO + 0.15;
        const UNIDAD = movil ? 0.5 : 0.52; // alturas de pantalla por unidad

        const setHeroY = gsap.quickSetter(hero, 'y', 'px');
        const setHeroA = gsap.quickSetter(hero, 'opacity');
        const motivoY = motivos.map((m) => gsap.quickSetter(m, 'y', 'px'));
        const motivoA = motivos.map((m) => gsap.quickSetter(m, 'opacity'));

        const intro = { y: 0, halo: 0, haz: 0 };
        let M = null;
        let uActual = 0;
        let etapaActiva = true;
        let ap = 0;
        let indiceEfecto = 0;
        let stPin = null;

        /* --- Distribución según el tamaño del marco --- */
        function distribuir() {
          const W = marco.clientWidth;
          const H = marco.clientHeight;
          if (!W || !H) return;
          M = medidas(W, H);
          const { proy: pr, hero: h0 } = M;
          proyEl.style.width = proyEl.style.height = pr.D + 'px';
          proyeccion.medir(pr.D, Math.min(window.devicePixelRatio || 1, movil ? 1.25 : 1.75));
          const radio = Math.hypot(Math.max(pr.cx, W - pr.cx), Math.max(pr.cy, H - pr.cy)) + 4;
          const Sd = radio * 2;
          M.s0 = pr.D / Sd;
          escenario.style.setProperty('--uc-cx', pr.cx + 'px');
          escenario.style.setProperty('--uc-cy', pr.cy + 'px');
          escenario.style.setProperty('--uc-S', Sd + 'px');
          escenario.style.setProperty('--uc-W', W + 'px');
          escenario.style.setProperty('--uc-H', H + 'px');
          if (!api3d) {
            const ratio = proyectorEl.querySelector('img') ? proyectorEl.querySelector('img').naturalWidth / proyectorEl.querySelector('img').naturalHeight || 1.16 : 1.16;
            M.ratioImg = ratio;
            proyectorEl.style.width = Math.max(M.hero.h, M.fin.h) * ratio + 'px';
          }
          if (api3d) api3d.medir();
          render(uActual);
          // Proyección: sin hueco si aún no se ha dibujado nada
          if (!etapaActiva) return;
          proyeccion.dibujar(0);
        }
        pedirDistribucion = distribuir;
        let roMarco = new ResizeObserver(() => distribuir());
        roMarco.observe(marco);
        limpiar.push(() => roMarco.disconnect());

        /* --- Etapa 1: hero → proyector a un lado → efectos --- */
        function etapa(u) {
          if (!M) return;
          const { hero: h0, fin, proy: pr } = M;
          const W = marco.clientWidth;
          const H = marco.clientHeight;
          const mv = sua(u / 1.6);
          ap = sua((u - 0.7) / 1.5);
          const ui = sua((u - 1.5) / 0.9);
          const he = limitar(u / 1.0);
          setHeroY(-70 * he);
          setHeroA(1 - he);
          hero.style.pointerEvents = he > 0.5 ? 'none' : '';

          const bruto = limitar(u - U0, 0, N - 1);
          const ent = Math.min(Math.floor(bruto), N - 2);
          const m = ent + sua((bruto - ent - 0.3) / 0.4);
          const pesos = MOTIVOS.map((_, k) => Math.max(0, 1 - Math.abs(m - k)));
          proyeccion.pesos = pesos;
          eyebrowMotivos.style.opacity = ui;
          motivos.forEach((_, k) => {
            motivoA[k](sua((pesos[k] - 0.55) / 0.4) * ui);
            motivoY[k]((k - m) * 44);
          });
          const idx = Math.round(m);
          if (idx !== indiceEfecto || !etapa.listo) {
            indiceEfecto = idx;
            etapa.listo = true;
            nombreEl.textContent = NOMBRES[idx];
            cuentaEl.textContent = '0' + (idx + 1);
            btnPrev.disabled = idx === 0;
            btnNext.disabled = idx === N - 1;
          }
          ctl.style.opacity = ui;
          ctl.style.transform = `translate3d(0, ${(1 - ui) * 18}px, 0)`;
          ctl.inert = ui < 0.6;

          // Postura: se desplaza, gira hacia la proyección y cambia un poco con cada efecto
          let py = 0;
          let pp = 0;
          pesos.forEach((w, k) => {
            py += POSES[k][0] * w;
            pp += POSES[k][1] * w;
          });
          const x = lerp(h0.x, fin.x, mv);
          const y = lerp(h0.y, fin.y, mv) + (1 - intro.y) * 40;
          const alto = lerp(h0.h, fin.h, mv);
          let lx;
          let ly;
          let ang;
          if (api3d) {
            api3d.fijar({ x, y, altura: alto, yaw: lerp(h0.yaw, fin.yaw, mv) + py * mv, pitch: lerp(h0.pitch, fin.pitch, mv) + pp * mv });
            const l = api3d.lente();
            lx = l.x;
            ly = l.y;
            ang = l.angulo;
          } else {
            const rot = lerp(0, 0.6, mv) + py * 0.5 * mv;
            const Hm = Math.max(h0.h, fin.h);
            const w = Hm * (M.ratioImg || 1.16);
            proyectorEl.style.transform = `translate3d(${x - w / 2}px, ${y - Hm / 2}px, 0) rotate(${rot}rad) scale(${alto / Hm})`;
            const ox = geometriaImg.dx * (M.ratioImg || 1.16) * alto;
            const oy = geometriaImg.dy * alto;
            lx = x + ox * Math.cos(rot) - oy * Math.sin(rot);
            ly = y + ox * Math.sin(rot) + oy * Math.cos(rot);
            ang = geometriaImg.ang + rot;
          }

          // Proyección: aparece y crece desde el lado del proyector
          const R = pr.D / 2;
          const dx = fin.x - pr.cx;
          const dy = fin.y - pr.cy;
          const dl = Math.hypot(dx, dy) || 1;
          const ax = pr.cx + (dx / dl) * R;
          const ay = pr.cy + (dy / dl) * R;
          const s = 0.16 + 0.84 * ap;
          const tx = ax + (pr.cx - R - ax) * s;
          const ty = ay + (pr.cy - R - ay) * s;
          proyEl.style.opacity = ap;
          proyEl.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;

          // Haz de luz: del proyector a la proyección
          const aCentro = Math.atan2(pr.cy - ly, pr.cx - lx);
          const dist = Math.hypot(pr.cx - lx, pr.cy - ly);
          const angulo = lerpAng(ang, aCentro, ap);
          const largo = lerp(H * 0.66, Math.max(dist - R * 0.12, 40), ap);
          const semi = lerp(0.13, Math.atan(R / Math.max(dist, 1)), ap);
          rayo.style.opacity = intro.haz * (0.5 + 0.2 * ap);
          rayo.style.transform = `translate3d(${lx}px, ${ly - 50}px, 0) rotate(${angulo}rad) scale(${largo / 100}, ${(2 * Math.tan(semi) * largo) / 100})`;

          halo.style.opacity = intro.halo;
          halo.style.transform = `translate3d(${lerp(h0.x, pr.cx, ap)}px, ${lerp(h0.y - 40, pr.cy, ap)}px, 0)`;
        }

        /* --- Etapa 2: zoom con máscara hacia la foto 1, cortes y fundidos cortos entre fotos, velo hacia "cómo se usa" --- */
        function fotosEn(u) {
          if (!M || !fotos.length) return;
          const z1 = limitar((u - TS) / T_ZOOM);
          const ze = sua(z1);
          const prog = fotos.map((_, i) => (i === 0 ? z1 : limitar((u - inicio[i]) / dur[i])));
          const zv = limitar((u - TV) / D_VELO);
          fotos.forEach((f, i) => {
            const siguiente = i + 1 < fotos.length ? prog[i + 1] : 0;
            const visible = prog[i] > 0 && siguiente < 1;
            f.style.visibility = visible ? 'visible' : 'hidden';
            if (!visible) return;
            let esc;
            let aparece;
            if (i === 0) {
              const s = M.s0 + (1 - M.s0) * ze;
              mascara0.style.transform = `scale(${s})`;
              mascara0.style.opacity = sua(z1 / 0.22);
              contra0.style.transform = `scale(${1 / s})`;
              esc = 1.3 - 0.3 * ze;
              aparece = sua((u - (TS + T_ZOOM * 0.7)) / 0.45);
            } else {
              const p = prog[i];
              const estilo = ESTILOS[(i - 1) % ESTILOS.length];
              if (estilo === 'corte') {
                f.style.opacity = sua(p / 0.25);
                esc = 1.45 - 0.45 * salida(p);
              } else if (estilo === 'atras') {
                f.style.opacity = sua(p / 0.7);
                esc = 0.88 + 0.12 * salida(p);
              } else {
                f.style.opacity = sua(p);
                esc = 1.18 - 0.18 * salida(p);
              }
              aparece = sua((u - (fin[i] - 0.05)) / 0.3);
            }
            // La foto siguiente la tapa; la última se funde en el velo
            const sale = i + 1 < fotos.length ? limitar((u - inicio[i + 1]) / Math.max(dur[i + 1] * 0.7, 0.08)) : sua(zv / 0.5);
            const hasta = i + 1 < fotos.length ? inicio[i + 1] : TV;
            const deriva = 1 + 0.06 * limitar((u - inicio[i]) / Math.max(hasta - inicio[i], 0.1));
            const extra = i + 1 < fotos.length ? 1 + 0.1 * sua(siguiente) : 1 + 0.1 * zv;
            media[i].style.transform = `scale(${esc * deriva * extra})`;
            frases[i].style.opacity = aparece * (1 - sale);
            frases[i].style.transform = `translate3d(0, ${(1 - aparece) * 28 - sale * 18}px, 0)`;
          });
          if (velo) velo.style.opacity = sua(zv);

          // La etapa del proyector deja de pintarse cuando la foto 1 ya la tapa por completo
          const tapada = z1 >= 1;
          marco.style.visibility = tapada ? 'hidden' : '';
          marco.style.opacity = 1 - sua(z1 / 0.55);
          if (z1 > 0.05) ctl.inert = true;
          etapaActiva = !tapada;
        }

        function render(u) {
          uActual = u;
          if (u < TS + T_ZOOM) etapa(u);
          fotosEn(u);
        }
        etapa.listo = false;

        const proxy = { u: 0 };
        const recorrido = gsap.to(proxy, { u: UT, ease: 'none', onUpdate: () => render(proxy.u) });
        stPin = ST.create({
          ...S,
          trigger: escenario,
          start: () => `top top+=${altoCabecera()}`,
          end: () => '+=' + Math.round(UT * UNIDAD * window.innerHeight),
          pin: true,
          pinType: 'fixed',
          scrub: 0.6,
          animation: recorrido,
          onRefresh: () => distribuir(),
        });
        limpiar.push(() => marco && ((marco.style.visibility = ''), (marco.style.opacity = '')));

        /* --- Efecto anterior/siguiente: llevan el scroll al efecto pedido (el scroll sigue mandando) --- */
        function irAEfecto(k) {
          k = limitar(k, 0, N - 1);
          const pos = stPin.start + ((U0 + k) / UT) * (stPin.end - stPin.start);
          window.scrollTo({ top: pos, behavior: 'smooth' });
        }
        const alPrev = () => irAEfecto(indiceEfecto - 1);
        const alNext = () => irAEfecto(indiceEfecto + 1);
        btnPrev.addEventListener('click', alPrev);
        btnNext.addEventListener('click', alNext);
        limpiar.push(() => {
          btnPrev.removeEventListener('click', alPrev);
          btnNext.removeEventListener('click', alNext);
        });

        /* --- Bucle de dibujo: proyección 2D y proyector 3D, con vigilancia del rendimiento --- */
        const forzado3d = new URLSearchParams(location.search).get('uc3d') === '1';
        let cuadros = 0;
        let acumulado = 0;
        let alterna = false;
        function usar3D(api) {
          api3d = api;
          raiz.classList.toggle('uc-3d-on', !!api);
        }
        function abandonar3D() {
          if (!api3d) return;
          const a = api3d;
          usar3D(null);
          a.destruir();
          proyectorEl.style.opacity = 1;
          distribuir();
        }
        const tick = (_t, deltaMs) => {
          if (!etapaActiva || document.hidden) return;
          const dt = Math.min(deltaMs / 1000, 0.05);
          if (ap > 0.01) {
            alterna = !alterna;
            if (!movil || alterna) proyeccion.dibujar(movil ? dt * 2 : dt);
          }
          if (api3d) {
            api3d.dibujar(dt);
            if (cuadros < 90) {
              cuadros++;
              acumulado += deltaMs;
              if (cuadros === 90 && acumulado / 90 > 38 && !forzado3d) abandonar3D();
            }
          }
        };
        gsap.ticker.add(tick);
        limpiar.push(() => {
          gsap.ticker.remove(tick);
          if (api3d) api3d.destruir();
          raiz.classList.remove('uc-3d-on');
        });

        alCambiarEfecto = { estatico: () => {} };
        aplicarControles();

        /* ---------- Titulares: aparecen con un desplazamiento corto (sin máscaras que recorten el texto) ---------- */
        qa(raiz, '[data-uc-lineas]').forEach((el) => {
          gsap.from(el, { y: 36, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { ...S, trigger: el, start: 'top 88%', once: true } });
        });

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
            clearProps: 'transform',
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

        /* ---------- Cierre: el fondo oscuro crece como un círculo (zoom con máscara) desde el pack ---------- */
        const final = q(raiz, '[data-uc-final]');
        if (final) {
          const fondo = q(final, '[data-uc-final-fondo]');
          const copos = q(final, '.uc-final__copos');
          if (fondo) {
            gsap.fromTo(
              fondo,
              { scale: 0.02 },
              {
                scale: 1,
                ease: 'power2.in',
                scrollTrigger: { ...S, trigger: final, start: 'top 98%', end: 'top 12%', scrub: 0.5 },
              }
            );
          }
          if (copos) gsap.fromTo(copos, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { ...S, trigger: final, start: 'top 45%', end: 'top 10%', scrub: true } });
          gsap.from(qa(final, '.uc-btn'), {
            y: 24,
            autoAlpha: 0,
            duration: 1,
            ease: 'power3.out',
            clearProps: 'transform',
            scrollTrigger: { ...S, trigger: final, start: 'top 45%', once: true },
          });
        }

        /* ---------- Entrada: carga → encendido del proyector → título ---------- */
        const intros = qa(raiz, '.uc-hero [data-uc-intro]');
        const titulo = q(raiz, '[data-uc-titulo]');
        const parpadeo = (v) => [
          { opacity: v * 0.7, duration: 0.08 },
          { opacity: v * 0.15, duration: 0.07 },
          { opacity: v, duration: 0.1 },
          { opacity: v * 0.45, duration: 0.06 },
          { opacity: v, duration: 0.5 },
        ];
        function entrada() {
          const objetivo = api3d ? lienzo3d : proyectorEl;
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onUpdate: () => render(uActual) });
          tl.to(intro, { y: 1, duration: 1.2 }, 0);
          tl.to(objetivo, { keyframes: [{ opacity: 0.55, duration: 0.5 }, ...parpadeo(1)] }, 0);
          tl.to(intro, { haz: 1, duration: 0.9, ease: 'power2.out' }, 0.62);
          tl.to(intro, { halo: 1, duration: 1.8, ease: 'power2.out' }, 0.6);
          if (lenteEl) tl.to(lenteEl, { keyframes: parpadeo(1) }, 0.5);
          tl.fromTo(titulo, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, 0.7);
          tl.fromTo(intros, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.08 }, 1.0);
          tl.add(() => ST.refresh(), '>');
        }

        // Si el dispositivo lo aguanta, se carga el proyector 3D mientras se muestra la pantalla de carga.
        const promesa3d = iniciar3D(raiz, base, movil);
        let tarde = false;
        const con3d = Promise.race([promesa3d, new Promise((r) => setTimeout(() => r('tarde'), 3500))]).then((api) => {
          if (api === 'tarde') {
            tarde = true;
            return null;
          }
          return api;
        });
        promesa3d.then((api) => {
          if (tarde && api) api.destruir();
        });
        limpiar.push(() => {
          tarde = true;
        });

        Promise.all([pantallaCarga(raiz, [promesa3d, fotosListas]), con3d]).then(([carga, api]) => {
          if (api) {
            usar3D(api);
            api.medir();
            aplicarControles();
          }
          distribuir();
          const empezar = () => {
            entrada();
          };
          if (carga) {
            const centro = q(carga, '.uc-carga__centro');
            gsap
              .timeline({ onComplete: () => carga.remove() })
              .to(centro, { y: -30, autoAlpha: 0, duration: 0.5, ease: 'power3.in' })
              .to(carga, { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, 0.25)
              .add(empezar, 0.65);
          } else {
            empezar();
          }
        });

        if (document.fonts) document.fonts.ready.then(refrescar);
        window.addEventListener('load', refrescar, { once: true });
        compra.actualizarFijo();
        distribuir();

        return () => {
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
      const el = document.documentElement;
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
