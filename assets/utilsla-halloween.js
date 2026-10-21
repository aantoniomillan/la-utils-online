(function () {
  if (window.UtilsHalloween) return;

  const script = document.currentScript;
  const urls = {
    gsap: script && script.dataset.gsap,
    scrollTrigger: script && script.dataset.scrolltrigger,
  };
  const estado = (window.UtilsHalloween = { listo: false });
  const html = document.documentElement;
  const reducida = window.matchMedia('(prefers-reduced-motion: reduce)');
  const limpiezas = new WeakMap();

  function cargarScript(src) {
    return new Promise((resolve, reject) => {
      if (!src) {
        reject(new Error('Falta la ruta del script'));
        return;
      }
      const el = document.createElement('script');
      el.src = src;
      el.async = false;
      el.onload = () => resolve();
      el.onerror = () => reject(new Error('No se ha podido cargar ' + src));
      document.head.appendChild(el);
    });
  }

  function asegurarGsap() {
    if (window.gsap && window.ScrollTrigger) return Promise.resolve();
    const primero = window.gsap ? Promise.resolve() : cargarScript(urls.gsap);
    return primero.then(() => (window.ScrollTrigger ? null : cargarScript(urls.scrollTrigger)));
  }

  function alturaCabecera() {
    const valor = parseFloat(document.body.style.getPropertyValue('--header-height'));
    return Number.isFinite(valor) ? valor : 0;
  }

  function dividir(el) {
    const texto = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', texto);
    const recorrer = (nodo) => {
      Array.from(nodo.childNodes).forEach((hijo) => {
        if (hijo.nodeType === 3) {
          const fragmento = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach((trozo) => {
            if (!trozo) return;
            if (/^\s+$/.test(trozo)) {
              fragmento.appendChild(document.createTextNode(' '));
              return;
            }
            const palabra = document.createElement('span');
            palabra.className = 'uh-pal';
            palabra.setAttribute('aria-hidden', 'true');
            Array.from(trozo).forEach((letra) => {
              const car = document.createElement('span');
              car.className = 'uh-car';
              car.textContent = letra;
              palabra.appendChild(car);
            });
            fragmento.appendChild(palabra);
          });
          nodo.replaceChild(fragmento, hijo);
        } else if (hijo.nodeType === 1) {
          recorrer(hijo);
        }
      });
    };
    recorrer(el);
    return Array.from(el.querySelectorAll('.uh-car'));
  }

  function crearSprite(color) {
    const lienzo = document.createElement('canvas');
    lienzo.width = lienzo.height = 32;
    const c = lienzo.getContext('2d');
    const g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(' + color + ',1)');
    g.addColorStop(0.35, 'rgba(' + color + ',0.45)');
    g.addColorStop(1, 'rgba(' + color + ',0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 32, 32);
    return lienzo;
  }

  function particulas(lienzo, limpiar) {
    const c = lienzo.getContext('2d');
    if (!c) return;
    const densidad = parseFloat(lienzo.dataset.densidad) || 1;
    const sprites = ['255,138,42', '255,178,102', '239,230,212', '170,120,235'].map(crearSprite);
    let ancho = 0;
    let alto = 0;
    let items = [];
    let raf = 0;
    let visible = true;
    let ultimo = 0;
    let tiempo = 0;

    function nueva(inicial) {
      return {
        x: Math.random() * ancho,
        y: inicial ? Math.random() * alto : alto + 20,
        r: 3 + Math.random() * 9,
        vy: 8 + Math.random() * 26,
        amp: 6 + Math.random() * 26,
        fase: Math.random() * Math.PI * 2,
        vel: 0.3 + Math.random() * 0.9,
        alfa: 0.25 + Math.random() * 0.65,
        sprite: sprites[Math.floor(Math.random() * (Math.random() < 0.6 ? 2 : sprites.length))],
      };
    }

    function medir() {
      const caja = lienzo.getBoundingClientRect();
      if (!caja.width || !caja.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = caja.width;
      alto = caja.height;
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cantidad = Math.round(Math.min(64, Math.max(12, (ancho * alto) / 20000)) * densidad);
      items = Array.from({ length: cantidad }, () => nueva(true));
      dibujar(0);
    }

    function dibujar(dt) {
      tiempo += dt;
      c.clearRect(0, 0, ancho, alto);
      items.forEach((p) => {
        p.y -= p.vy * dt;
        if (p.y < -20) Object.assign(p, nueva(false));
        const x = p.x + Math.sin(tiempo * p.vel + p.fase) * p.amp;
        const parpadeo = 0.65 + 0.35 * Math.sin(tiempo * 2 * p.vel + p.fase);
        c.globalAlpha = p.alfa * parpadeo;
        c.drawImage(p.sprite, x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      });
      c.globalAlpha = 1;
    }

    function cuadro(ahora) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min((ahora - ultimo) / 1000, 0.05);
      ultimo = ahora;
      dibujar(dt);
      raf = requestAnimationFrame(cuadro);
    }

    function arrancar() {
      if (raf || reducida.matches || !visible || document.hidden) return;
      ultimo = performance.now();
      raf = requestAnimationFrame(cuadro);
    }

    medir();
    const ro = 'ResizeObserver' in window ? new ResizeObserver(medir) : null;
    if (ro) ro.observe(lienzo);
    const io =
      'IntersectionObserver' in window
        ? new IntersectionObserver((entradas) => {
            visible = entradas[0].isIntersecting;
            if (visible) arrancar();
          })
        : null;
    if (io) io.observe(lienzo);
    const alVisibilidad = () => arrancar();
    document.addEventListener('visibilitychange', alVisibilidad);
    arrancar();

    limpiar.push(() => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (ro) ro.disconnect();
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', alVisibilidad);
    });
  }

  function revelar(raiz, usaGsap) {
    const items = Array.from(raiz.querySelectorAll('[data-uh-reveal]'));
    if (!items.length) return;
    if (!usaGsap) {
      items.forEach((el) => el.classList.add('is-visto'));
      return;
    }
    const gsap = window.gsap;
    window.ScrollTrigger.batch(items, {
      start: 'top 90%',
      once: true,
      onEnter: (lote) => {
        gsap.fromTo(
          lote,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.95,
            ease: 'power3.out',
            stagger: 0.09,
            overwrite: true,
            clearProps: 'opacity,transform',
          }
        );
        lote.forEach((el) => el.classList.add('is-visto'));
      },
    });
  }

  function anclas(raiz, limpiar) {
    raiz.querySelectorAll('[data-uh-ancla]').forEach((enlace) => {
      const alClic = (ev) => {
        const destino = document.querySelector(enlace.getAttribute('href'));
        if (!destino) return;
        ev.preventDefault();
        const y = destino.getBoundingClientRect().top + window.scrollY - alturaCabecera();
        window.scrollTo({ top: y, behavior: reducida.matches ? 'auto' : 'smooth' });
      };
      enlace.addEventListener('click', alClic);
      limpiar.push(() => enlace.removeEventListener('click', alClic));
    });
  }

  function hero(raiz, limpiar, usaGsap) {
    const lienzo = raiz.querySelector('[data-uh-particulas]');
    if (lienzo) particulas(lienzo, limpiar);
    anclas(raiz, limpiar);
    if (!usaGsap) return;

    const gsap = window.gsap;
    const titulo = raiz.querySelector('[data-uh-titulo]');
    const letras = titulo ? dividir(titulo) : [];
    const capa = (nombre) => raiz.querySelector('[data-uh-capa="' + nombre + '"]');
    const luna = capa('luna');
    const nieblaLejos = capa('niebla-lejos');
    const nieblaCerca = capa('niebla-cerca');
    const paisaje = capa('paisaje');
    const entradas = raiz.querySelectorAll('[data-uh-entrada]');

    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (luna) tl.fromTo(luna, { opacity: 0, scale: 0.82 }, { opacity: 1, scale: 1, duration: 2.4, ease: 'power2.out', clearProps: 'opacity' }, 0);
    if (nieblaLejos) tl.fromTo(nieblaLejos, { opacity: 0 }, { opacity: 0.75, duration: 2.4, ease: 'power1.out' }, 0.2);
    if (nieblaCerca) tl.fromTo(nieblaCerca, { opacity: 0 }, { opacity: 0.95, duration: 2.4, ease: 'power1.out' }, 0.4);
    if (paisaje) tl.fromTo(paisaje, { opacity: 0, y: 70 }, { opacity: 1, y: 0, duration: 1.8, clearProps: 'opacity' }, 0.2);
    if (letras.length) {
      tl.fromTo(letras, { yPercent: 118, rotate: 7, opacity: 0 }, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.3, stagger: 0.045, clearProps: 'opacity' }, 0.45);
      gsap.set(titulo, { visibility: 'visible' });
    } else if (titulo) {
      gsap.set(titulo, { visibility: 'visible' });
    }
    if (entradas.length) tl.fromTo(entradas, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.14, clearProps: 'transform' }, 1.05);

    const parallax = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: raiz, start: 'top top', end: 'bottom top', scrub: 0.7 },
    });
    if (luna) parallax.to(luna, { yPercent: 38 }, 0);
    if (nieblaLejos) parallax.to(nieblaLejos, { yPercent: 22 }, 0);
    if (paisaje) parallax.to(paisaje, { yPercent: 6, scale: 1.04, transformOrigin: '50% 100%' }, 0);
    if (nieblaCerca) parallax.to(nieblaCerca, { yPercent: -26 }, 0);
    const contenido = raiz.querySelector('[data-uh-contenido]');
    if (contenido) parallax.to(contenido, { yPercent: -16, opacity: 0.1 }, 0);

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      const movibles = Array.from(raiz.querySelectorAll('[data-uh-mueve]')).map((el) => ({
        k: parseFloat(el.dataset.uhMueve) || 0,
        x: gsap.quickTo(el, 'x', { duration: 1.4, ease: 'power3.out' }),
      }));
      const alMover = (ev) => {
        const caja = raiz.getBoundingClientRect();
        const nx = (ev.clientX - caja.left) / caja.width - 0.5;
        movibles.forEach((m) => m.x(nx * m.k * 2));
      };
      raiz.addEventListener('pointermove', alMover);
      limpiar.push(() => raiz.removeEventListener('pointermove', alMover));
    }
  }

  function cabecera(raiz, limpiar, usaGsap) {
    const lienzo = raiz.querySelector('[data-uh-particulas]');
    if (lienzo) particulas(lienzo, limpiar);
    const luna = raiz.querySelector('[data-uh-capa="luna"]');
    if (usaGsap && luna) {
      window.gsap.to(luna, {
        yPercent: 30,
        ease: 'none',
        scrollTrigger: { trigger: raiz, start: 'top top', end: 'bottom top', scrub: 0.7 },
      });
    }
  }

  function tarjetas(raiz, limpiar) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let pendiente = null;
    const alMover = (ev) => {
      const caja = ev.target.closest && ev.target.closest('.uh-tarjeta__caja');
      if (!caja) return;
      if (pendiente) cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(() => {
        const r = caja.getBoundingClientRect();
        caja.style.setProperty('--uh-x', ev.clientX - r.left + 'px');
        caja.style.setProperty('--uh-y', ev.clientY - r.top + 'px');
      });
    };
    raiz.addEventListener('pointermove', alMover);
    limpiar.push(() => {
      raiz.removeEventListener('pointermove', alMover);
      if (pendiente) cancelAnimationFrame(pendiente);
    });
  }

  const intl = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Madrid',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  function desfaseMadrid(ms) {
    const p = {};
    intl.formatToParts(new Date(ms)).forEach((parte) => {
      p[parte.type] = parte.value;
    });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - Math.floor(ms / 1000) * 1000;
  }

  function finEnMs(texto) {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec((texto || '').trim());
    if (!m) return null;
    const hora = m[4] === undefined ? 23 : +m[4];
    const minuto = m[5] === undefined ? 59 : +m[5];
    const pared = Date.UTC(+m[1], +m[2] - 1, +m[3], hora, minuto, 59);
    if (Number.isNaN(pared)) return null;
    let ms = pared - desfaseMadrid(pared);
    ms = pared - desfaseMadrid(ms);
    return ms;
  }

  function urgencia(raiz, limpiar) {
    const activa = raiz.querySelector('[data-uh-activa]');
    const final = raiz.querySelector('[data-uh-final]');
    const temporizador = raiz.querySelector('[data-uh-timer]');
    const celdas = {
      dias: raiz.querySelector('[data-uh-dias]'),
      horas: raiz.querySelector('[data-uh-horas]'),
      minutos: raiz.querySelector('[data-uh-minutos]'),
      segundos: raiz.querySelector('[data-uh-segundos]'),
    };
    const fin = finEnMs(raiz.dataset.fin);
    let ultimaEtiqueta = '';
    let timer = 0;

    const mostrarFinal = () => {
      if (activa) activa.hidden = true;
      if (final) final.hidden = false;
    };

    if (fin === null) {
      mostrarFinal();
      return;
    }

    const poner = (celda, valor, animar) => {
      if (!celda) return;
      const texto = String(valor).padStart(2, '0');
      if (celda.textContent === texto) return;
      celda.textContent = texto;
      if (animar && !reducida.matches) {
        celda.classList.remove('is-cambia');
        void celda.offsetWidth;
        celda.classList.add('is-cambia');
      }
    };

    const pasar = () => {
      const resto = fin - Date.now();
      if (resto <= 0) {
        mostrarFinal();
        window.clearInterval(timer);
        return;
      }
      if (activa) activa.hidden = false;
      if (final) final.hidden = true;
      const total = Math.floor(resto / 1000);
      const dias = Math.floor(total / 86400);
      const horas = Math.floor((total % 86400) / 3600);
      const minutos = Math.floor((total % 3600) / 60);
      const segundos = total % 60;
      poner(celdas.dias, dias, false);
      poner(celdas.horas, horas, false);
      poner(celdas.minutos, minutos, false);
      poner(celdas.segundos, segundos, true);
      if (temporizador) {
        const etiqueta =
          'Quedan ' + dias + (dias === 1 ? ' día, ' : ' días, ') + horas + (horas === 1 ? ' hora y ' : ' horas y ') + minutos + (minutos === 1 ? ' minuto' : ' minutos');
        if (etiqueta !== ultimaEtiqueta) {
          temporizador.setAttribute('aria-label', etiqueta);
          ultimaEtiqueta = etiqueta;
        }
      }
    };

    pasar();
    timer = window.setInterval(pasar, 1000);
    const alVisibilidad = () => {
      if (!document.hidden) pasar();
    };
    document.addEventListener('visibilitychange', alVisibilidad);
    limpiar.push(() => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', alVisibilidad);
    });
  }

  function montar(raiz) {
    if (raiz.dataset.uhListo) return;
    raiz.dataset.uhListo = '1';
    const tipo = raiz.dataset.uh;
    const limpiar = [];
    const usaGsap = !reducida.matches && !!(window.gsap && window.ScrollTrigger);

    const ejecutar = () => {
      if (usaGsap) window.gsap.registerPlugin(window.ScrollTrigger);
      if (tipo === 'hero') hero(raiz, limpiar, usaGsap);
      else if (tipo === 'cabecera') cabecera(raiz, limpiar, usaGsap);
      else if (tipo === 'urgencia') urgencia(raiz, limpiar);
      else if (tipo === 'rejilla') tarjetas(raiz, limpiar);
      revelar(raiz, usaGsap);
    };

    const ctx = usaGsap ? window.gsap.context(ejecutar, raiz) : null;
    if (!ctx) ejecutar();

    limpiezas.set(raiz, () => {
      if (ctx) ctx.revert();
      limpiar.forEach((f) => f());
      delete raiz.dataset.uhListo;
    });
  }

  function desmontar(raiz) {
    const limpiar = limpiezas.get(raiz);
    if (limpiar) {
      limpiar();
      limpiezas.delete(raiz);
    }
  }

  function mostrarAviso(raiz, mensaje, conEnlace) {
    const aviso = raiz.querySelector('[data-uh-aviso]');
    if (!aviso) return;
    const texto = aviso.querySelector('[data-uh-aviso-texto]');
    const enlace = aviso.querySelector('[data-uh-aviso-enlace]');
    if (enlace) enlace.hidden = !conEnlace;
    if (texto) texto.textContent = '';
    aviso.classList.add('is-visible');
    window.setTimeout(() => {
      if (texto) texto.textContent = mensaje;
    }, 60);
    window.clearTimeout(aviso._uhTemporizador);
    aviso._uhTemporizador = window.setTimeout(() => aviso.classList.remove('is-visible'), 5000);
  }

  function actualizarContador(ruta) {
    const url = ruta.replace(/\/cart\/add$/, '/cart.js');
    fetch(url, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((carrito) => {
        if (!carrito || typeof carrito.item_count !== 'number') return;
        document.querySelectorAll('[data-ucx-cuenta]').forEach((el) => {
          el.textContent = carrito.item_count;
          el.hidden = carrito.item_count === 0;
        });
      })
      .catch(() => {});
  }

  document.addEventListener('submit', (ev) => {
    const form = ev.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('.uh-tarjeta__form')) return;
    ev.preventDefault();
    const boton = form.querySelector('[data-uh-anadir]');
    const etiqueta = form.querySelector('[data-uh-anadir-texto]');
    const raiz = form.closest('[data-uh]');
    if (!boton || boton.getAttribute('aria-busy') === 'true') return;
    const original = etiqueta ? etiqueta.textContent : '';
    const ruta = (form.getAttribute('action') || '/cart/add').split('?')[0];
    boton.setAttribute('aria-busy', 'true');
    if (etiqueta) etiqueta.textContent = 'Añadiendo…';

    fetch(ruta + '.js', { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) })
      .then((r) =>
        r.json().then((datos) => {
          if (!r.ok) throw new Error(datos.description || datos.message || 'No se ha podido añadir al carrito.');
          return datos;
        })
      )
      .then(() => {
        boton.classList.add('is-ok');
        if (etiqueta) etiqueta.textContent = 'Añadido';
        if (raiz) mostrarAviso(raiz, 'Producto añadido al carrito.', true);
        actualizarContador(ruta);
        window.setTimeout(() => {
          boton.classList.remove('is-ok');
          if (etiqueta) etiqueta.textContent = original;
        }, 2200);
      })
      .catch((err) => {
        if (etiqueta) etiqueta.textContent = original;
        if (raiz) mostrarAviso(raiz, err.message + ' Inténtalo de nuevo.', false);
      })
      .then(() => boton.removeAttribute('aria-busy'));
  });

  function arrancar() {
    const raices = Array.from(document.querySelectorAll('[data-uh]'));
    if (!raices.length) {
      estado.listo = true;
      return;
    }
    const carga = reducida.matches ? Promise.resolve() : asegurarGsap();
    carga
      .catch(() => {
        html.classList.remove('uh-anim');
      })
      .then(() => {
        raices.forEach(montar);
        estado.listo = true;
        if (window.ScrollTrigger) {
          const refrescar = () => window.ScrollTrigger.refresh();
          if (document.readyState === 'complete') refrescar();
          else window.addEventListener('load', refrescar, { once: true });
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(refrescar);
        }
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar);
  else arrancar();

  document.addEventListener('shopify:section:load', (ev) => {
    const raices = ev.target.querySelectorAll ? ev.target.querySelectorAll('[data-uh]') : [];
    const carga = reducida.matches ? Promise.resolve() : asegurarGsap();
    carga.catch(() => {}).then(() => raices.forEach(montar));
  });
  document.addEventListener('shopify:section:unload', (ev) => {
    if (ev.target.querySelectorAll) ev.target.querySelectorAll('[data-uh]').forEach(desmontar);
  });
})();
