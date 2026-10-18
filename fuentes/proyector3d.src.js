/* UtilsLA · Proyector 3D (código fuente).
   Se empaqueta con three.js en assets/utilsla-proyector3d.js (ver fuentes/construir.sh).
   Si existe assets/proyector.glb se carga; si no, el proyector se construye por código:
   cuerpo cilíndrico negro, soporte en U y lente facetada multicolor con brillo emisivo. */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Shape,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
  Box3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const PALETAS = {
  multi: ['#ff4d5a', '#ffc778', '#5edc9f', '#5aa9ff', '#fff4e0'],
  calido: ['#ffc778', '#ffdda6', '#ff9e5e', '#fff4e0'],
  rojo: ['#ff3b4e', '#ff7a85', '#d4162f', '#ffd0d4'],
  verde: ['#2fdc86', '#8affc1', '#12a15a', '#d8ffe9'],
  azul: ['#4aa3ff', '#9ad0ff', '#2468d8', '#e0f0ff'],
};

const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function texturaBrillo() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.7)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.16)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function texturaSombra() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,0.7)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.25)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new CanvasTexture(c);
}

/* Soporte en U: perfil extruido con bisel suave. */
function geometriaU() {
  const re = 0.71;
  const ri = 0.58;
  const cy = -0.1;
  const forma = new Shape();
  forma.moveTo(-re, 0.34);
  forma.lineTo(-re, cy);
  forma.absarc(0, cy, re, Math.PI, Math.PI * 2, false);
  forma.lineTo(re, 0.34);
  forma.lineTo(ri, 0.34);
  forma.lineTo(ri, cy);
  forma.absarc(0, cy, ri, Math.PI * 2, Math.PI, true);
  forma.lineTo(-ri, 0.34);
  forma.closePath();
  const g = new ExtrudeGeometry(forma, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 56,
  });
  g.translate(0, 0, -0.09);
  return g;
}

function construirProcedural() {
  const negro = new MeshPhysicalMaterial({ color: 0x0b0c10, roughness: 0.3, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.14 });
  const mate = new MeshStandardMaterial({ color: 0x101217, roughness: 0.5, metalness: 0.4 });
  const metal = new MeshStandardMaterial({ color: 0x4a4f5c, roughness: 0.28, metalness: 0.92 });
  const goma = new MeshStandardMaterial({ color: 0x08090c, roughness: 0.9, metalness: 0 });

  const raiz = new Group();
  const modelo = new Group();
  raiz.add(modelo);

  /* Base y pie */
  const base = new Mesh(new CylinderGeometry(0.56, 0.6, 0.1, 72), mate);
  base.position.y = -0.95;
  const anillo = new Mesh(new TorusGeometry(0.585, 0.014, 12, 96), metal);
  anillo.rotation.x = Math.PI / 2;
  anillo.position.y = -0.9;
  const suela = new Mesh(new CylinderGeometry(0.5, 0.52, 0.03, 48), goma);
  suela.position.y = -1.0;
  const pie = new Mesh(new CylinderGeometry(0.11, 0.14, 0.3, 32), mate);
  pie.position.y = -0.78;
  modelo.add(base, anillo, suela, pie);

  /* Soporte en U */
  const u = new Mesh(geometriaU(), mate);
  modelo.add(u);
  for (const lado of [-1, 1]) {
    const perilla = new Mesh(new CylinderGeometry(0.1, 0.1, 0.07, 32), metal);
    perilla.rotation.z = Math.PI / 2;
    perilla.position.set(lado * 0.745, -0.1, 0);
    const tornillo = new Mesh(new CylinderGeometry(0.035, 0.035, 0.08, 12), goma);
    tornillo.rotation.z = Math.PI / 2;
    tornillo.position.set(lado * 0.77, -0.1, 0);
    modelo.add(perilla, tornillo);
  }

  /* Cuerpo que cabecea dentro de la U */
  const cuerpo = new Group();
  cuerpo.position.set(0, -0.1, 0);
  modelo.add(cuerpo);

  const tubo = new Mesh(new CylinderGeometry(0.5, 0.5, 1.2, 72, 1, true), negro);
  tubo.rotation.x = Math.PI / 2;
  tubo.material.side = DoubleSide;
  const tapaTrasera = new Mesh(new CylinderGeometry(0.5, 0.5, 0.04, 72), negro);
  tapaTrasera.rotation.x = Math.PI / 2;
  tapaTrasera.position.z = -0.6;
  const rejilla = new Group();
  for (let i = 0; i < 4; i++) {
    const r = new Mesh(new TorusGeometry(0.1 + i * 0.09, 0.012, 8, 56), goma);
    r.position.z = -0.625;
    rejilla.add(r);
  }
  const usb = new Mesh(new BoxGeometry(0.16, 0.06, 0.06), metal);
  usb.position.set(0, -0.3, -0.62);
  const nervio1 = new Mesh(new TorusGeometry(0.505, 0.012, 10, 96), mate);
  nervio1.position.z = -0.35;
  const nervio2 = nervio1.clone();
  nervio2.position.z = -0.12;
  const bisel = new Mesh(new TorusGeometry(0.5, 0.04, 16, 96), metal);
  bisel.position.z = 0.6;
  const nido = new Mesh(new CylinderGeometry(0.44, 0.44, 0.08, 64), goma);
  nido.rotation.x = Math.PI / 2;
  nido.position.z = 0.58;
  cuerpo.add(tubo, tapaTrasera, rejilla, usb, nervio1, nervio2, bisel, nido);

  /* Lente facetada multicolor con brillo emisivo */
  const lente = new Group();
  lente.position.z = 0.56;
  const geo = new IcosahedronGeometry(0.43, 2);
  geo.scale(1, 1, 0.62);
  geo.computeVertexNormals();
  geo.setAttribute('color', new Float32BufferAttribute(new Float32Array(geo.attributes.position.count * 3).fill(1), 3));
  const nucleo = new Mesh(geo, new MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  const cristal = new Mesh(
    geo,
    new MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      roughness: 0.04,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      flatShading: true,
      depthWrite: false,
      envMapIntensity: 1.6,
    })
  );
  cristal.scale.setScalar(1.015);
  lente.add(nucleo, cristal);
  cuerpo.add(lente);

  const ancla = new Object3D();
  ancla.position.set(0, 0, 0.88);
  cuerpo.add(ancla);
  const punta = new Object3D();
  punta.position.set(0, 0, 1.88);
  cuerpo.add(punta);

  /* Brillos aditivos y luz de color de la lente */
  const tex = texturaBrillo();
  const brilloA = new Sprite(new SpriteMaterial({ map: tex, blending: AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, opacity: 0.95 }));
  brilloA.scale.setScalar(1.5);
  brilloA.position.z = 0.78;
  const brilloB = new Sprite(new SpriteMaterial({ map: tex, blending: AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, opacity: 0.38 }));
  brilloB.scale.setScalar(3.6);
  brilloB.position.z = 0.8;
  cuerpo.add(brilloA, brilloB);
  const luz = new PointLight(0xffc778, 6, 4.5, 1.6);
  luz.position.z = 1.1;
  cuerpo.add(luz);

  /* Sombra de contacto */
  const sombra = new Mesh(
    new PlaneGeometry(2.4, 2.4),
    new MeshBasicMaterial({ map: texturaSombra(), transparent: true, depthWrite: false, opacity: 0.8 })
  );
  sombra.rotation.x = -Math.PI / 2;
  sombra.position.y = -1.02;
  modelo.add(sombra);

  modelo.position.y = 0.3;
  return { raiz, modelo, cuerpo, lente, nucleo, geo, ancla, punta, brilloA, brilloB, luz, cargado: false };
}

function pintarLente(p, paleta) {
  const pos = p.geo.attributes.position;
  const col = p.geo.attributes.color;
  const c = new Color();
  const n = paleta.length;
  for (let i = 0; i < pos.count; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    const ang = (Math.atan2(cy, cx) + Math.PI) / (Math.PI * 2);
    const anillo = Math.floor(Math.hypot(cx, cy) / 0.14);
    const k = (Math.floor(ang * 10) + anillo * 3 + (Math.sin(i * 12.9898) > 0.55 ? 1 : 0)) % n;
    c.set(paleta[k]);
    const brillo = (0.78 + 0.5 * ((Math.sin(i * 78.233) + 1) / 2)) * (0.9 + 0.5 * limitar(cz / 0.3));
    for (let j = 0; j < 3; j++) col.setXYZ(i + j, c.r * brillo, c.g * brillo, c.b * brillo);
  }
  col.needsUpdate = true;
}

export async function crear({ canvas, glb, movil }) {
  const renderizador = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !movil,
    powerPreference: 'high-performance',
  });
  renderizador.setClearColor(0x000000, 0);
  renderizador.toneMapping = ACESFilmicToneMapping;
  renderizador.toneMappingExposure = 1.05;

  const escena = new Scene();
  const FOV = 26;
  const DIST = 7;
  const camara = new PerspectiveCamera(FOV, 1, 0.5, 30);
  camara.position.set(0, 0, DIST);

  const pmrem = new PMREMGenerator(renderizador);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.5;

  escena.add(new HemisphereLight(0x8aa0d0, 0x0a0c14, 0.35));
  const principal = new DirectionalLight(0xffd9a8, 2.4);
  principal.position.set(-3, 4, 4);
  const relleno = new DirectionalLight(0x8fb8ff, 0.9);
  relleno.position.set(4, 1, 2);
  const contra = new DirectionalLight(0xffd8c8, 1.2);
  contra.position.set(1, 3, -4);
  escena.add(principal, relleno, contra);

  const p = construirProcedural();
  escena.add(p.raiz);

  let usaGlb = false;
  if (glb) {
    try {
      const cab = await fetch(glb, { method: 'HEAD' });
      if (cab.ok) {
        const gltf = await new GLTFLoader().loadAsync(glb);
        const obj = gltf.scene;
        const caja = new Box3().setFromObject(obj);
        const tam = caja.getSize(new Vector3());
        const centro = caja.getCenter(new Vector3());
        const k = 1.9 / Math.max(tam.y, 0.0001);
        obj.scale.setScalar(k);
        obj.position.copy(centro).multiplyScalar(-k);
        p.modelo.visible = false;
        const envuelto = new Group();
        envuelto.add(obj);
        p.raiz.add(envuelto);
        const lenteNodo = obj.getObjectByName('lente') || obj.getObjectByName('lens');
        if (lenteNodo) lenteNodo.getWorldPosition(p.ancla.position);
        else p.ancla.position.set(0, 0.1, (tam.z * k) / 2 + 0.1);
        p.cuerpo = envuelto;
        p.raiz.add(p.ancla, p.punta);
        p.punta.position.copy(p.ancla.position).add(new Vector3(0, 0, 1));
        usaGlb = true;
      }
    } catch (e) {
      /* sin .glb: se queda el proyector construido por código */
    }
  }
  p.cargado = usaGlb;

  let ancho = 1;
  let alto = 1;
  let sucio = true;
  let t = 0;
  let giro = true;
  let velocidad = 1;
  let paleta = PALETAS.multi;
  let balYaw = 0;
  let estado = { x: 0, y: 0, altura: 200, yaw: 0, pitch: 0, cabeceo: 0 };
  const v1 = new Vector3();
  const v2 = new Vector3();

  function pintar(nombre) {
    paleta = PALETAS[nombre] || PALETAS.multi;
    if (!usaGlb) pintarLente(p, paleta);
    const c0 = new Color(paleta[0]);
    p.luz.color.copy(c0);
    p.brilloA.material.color.copy(c0).lerp(new Color(0xffffff), 0.45);
    p.brilloB.material.color.copy(c0);
    sucio = true;
  }
  pintar('multi');

  function medir() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 2);
    ancho = r.width;
    alto = r.height;
    renderizador.setPixelRatio(dpr);
    renderizador.setSize(ancho, alto, false);
    camara.aspect = ancho / alto;
    camara.updateProjectionMatrix();
    sucio = true;
  }

  function aplicar() {
    const pxPorUnidad = alto / (2 * Math.tan((FOV * Math.PI) / 360) * DIST);
    const escala = estado.altura / (pxPorUnidad * 1.55);
    p.raiz.scale.setScalar(escala);
    p.raiz.position.set((estado.x - ancho / 2) / pxPorUnidad, (alto / 2 - estado.y) / pxPorUnidad, 0);
    p.raiz.rotation.set(0, estado.yaw + balYaw, 0);
    p.cuerpo.rotation.x = estado.pitch + estado.cabeceo;
  }

  function dibujar(dt) {
    if (!ancho) return;
    if (giro) t += dt * velocidad;
    const bal = giro ? Math.sin(t * 0.55) : 0;
    estado.cabeceo = bal * 0.03;
    if (!usaGlb) {
      p.lente.rotation.z = t * 0.5;
      const pulso = 1.08 + Math.sin(t * 1.6) * 0.1;
      p.nucleo.material.color.setScalar(pulso);
      p.brilloA.material.opacity = 0.8 + Math.sin(t * 1.6) * 0.12;
    }
    const k = (Math.floor(t * 0.6) % paleta.length + paleta.length) % paleta.length;
    const k2 = (k + 1) % paleta.length;
    const f = (t * 0.6) % 1;
    p.luz.color.set(paleta[k]).lerp(new Color(paleta[k2]), f);
    p.brilloB.material.color.copy(p.luz.color);
    balYaw = bal * 0.04;
    aplicar();
    renderizador.render(escena, camara);
    sucio = false;
  }

  /* Posición de la lente en píxeles del lienzo y dirección del haz en pantalla (radianes). */
  function lente() {
    p.raiz.updateMatrixWorld(true);
    p.ancla.getWorldPosition(v1);
    p.punta.getWorldPosition(v2);
    v1.project(camara);
    v2.project(camara);
    const x1 = ((v1.x + 1) / 2) * ancho;
    const y1 = ((1 - v1.y) / 2) * alto;
    const x2 = ((v2.x + 1) / 2) * ancho;
    const y2 = ((1 - v2.y) / 2) * alto;
    return { x: x1, y: y1, angulo: Math.atan2(y2 - y1, x2 - x1) };
  }

  medir();

  return {
    glb: usaGlb,
    medir,
    fijar(e) {
      estado = { ...estado, ...e };
      aplicar();
      sucio = true;
    },
    paleta: pintar,
    girar(v) {
      giro = !!v;
    },
    velocidad(v) {
      velocidad = v;
    },
    dibujar,
    lente,
    destruir() {
      renderizador.dispose();
      pmrem.dispose();
      escena.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
    },
  };
}
