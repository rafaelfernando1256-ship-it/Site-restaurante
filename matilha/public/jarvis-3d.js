/**
 * O 3D NA TELA DO JARVIS — desenha a cena que o servidor montou
 * (agentes/cena3d.mjs): sala, piso, paredes e as peças, com sombra, luz
 * de ambiente e espelho que reflete de verdade.
 *
 * Nível simples: formas básicas, mas com tamanho certo, para entender o
 * espaço. A parede que fica entre você e a sala some (casa de bonecas);
 * passando o mouse numa peça, aparece o nome. A câmera abre com uma
 * visita guiada e depois obedece à voz (cima, dentro, frente, volta,
 * parede) e ao mouse.
 *
 * O three.js vem da própria Matilha (public/vendor/three, MIT): funciona
 * sem internet.
 */
import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { Reflector } from './vendor/three/Reflector.js';
import { RoomEnvironment } from './vendor/three/RoomEnvironment.js';

const NOITE = 0x121826;
const MAX_ESPELHOS_DE_VERDADE = 2; // cada um desenha a sala de novo: mais que isso pesa no notebook

/* ── texturas feitas na hora (nada para baixar) ─────────────────── */
function textura(desenha, repeticao) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  desenha(c.getContext('2d'), 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeticao);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const ruido = (ctx, n, base, variacao, tam = 2) => {
  for (let i = 0; i < n; i += 1) {
    const v = base + (Math.random() - 0.5) * variacao;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, tam, tam);
  }
};
function piso(tipo, W, L) {
  const ladrilho = (fundo, linha, tam) => textura((ctx, s) => {
    ctx.fillStyle = fundo; ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = linha; ctx.lineWidth = 3; ctx.strokeRect(0, 0, s, s);
  }, [W / tam, L / tam]);
  switch (tipo) {
    case 'borracha': return { cor: 0xffffff, mapa: textura((ctx, s) => { ctx.fillStyle = '#2b2e33'; ctx.fillRect(0, 0, s, s); ruido(ctx, 1600, 70, 40); ctx.strokeStyle = '#1d1f23'; ctx.lineWidth = 3; ctx.strokeRect(0, 0, s, s); }, [W, L]), aspereza: 0.95 };
    case 'madeira': case 'vinilico': return { cor: 0xffffff, aspereza: tipo === 'madeira' ? 0.6 : 0.7, mapa: textura((ctx, s) => {
      const tons = tipo === 'madeira' ? ['#9a6a42', '#8a5d39', '#a87850', '#93633e'] : ['#b9a58a', '#a99478', '#c2af95', '#b09c80'];
      for (let i = 0; i < 8; i += 1) { ctx.fillStyle = tons[i % 4]; ctx.fillRect(0, i * 32, s, 32); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, i * 32, s, 1.5); ctx.fillRect(((i * 97) % 200) + 20, i * 32, 1.5, 32); }
    }, [W / 1.6, L / 1.6]) };
    case 'porcelanato': return { cor: 0xffffff, mapa: ladrilho('#d9d6cf', '#c4c0b8', 0.9), aspereza: 0.35 };
    case 'cimento': return { cor: 0xffffff, mapa: textura((ctx, s) => { ctx.fillStyle = '#8f8f8a'; ctx.fillRect(0, 0, s, s); ruido(ctx, 2600, 140, 30, 3); }, [W / 2, L / 2]), aspereza: 0.9 };
    case 'carpete': return { cor: 0xffffff, mapa: textura((ctx, s) => { ctx.fillStyle = '#4f5563'; ctx.fillRect(0, 0, s, s); ruido(ctx, 4000, 85, 30, 1.5); }, [W / 2, L / 2]), aspereza: 1 };
    case 'grama': return { cor: 0xffffff, mapa: textura((ctx, s) => { ctx.fillStyle = '#3f7d3a'; ctx.fillRect(0, 0, s, s); for (let i = 0; i < 3000; i += 1) { ctx.fillStyle = `hsl(${100 + Math.random() * 25},45%,${25 + Math.random() * 20}%)`; ctx.fillRect(Math.random() * s, Math.random() * s, 1.5, 4); } }, [W / 2, L / 2]), aspereza: 1 };
    default: return { cor: 0xd9d6cf, mapa: null, aspereza: 0.6 };
  }
}

/* ── os materiais de sempre ─────────────────────────────────────── */
const M = () => ({
  preto: new THREE.MeshStandardMaterial({ color: 0x1d1f23, roughness: 0.6, metalness: 0.2 }),
  grafite: new THREE.MeshStandardMaterial({ color: 0x3a3e46, roughness: 0.45, metalness: 0.5 }),
  metal: new THREE.MeshStandardMaterial({ color: 0xc3c8cf, roughness: 0.25, metalness: 0.95 }),
  estofado: new THREE.MeshStandardMaterial({ color: 0x23272e, roughness: 0.85 }),
  madeira: new THREE.MeshStandardMaterial({ color: 0x9a6a42, roughness: 0.6 }),
  branco: new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: 0.5 }),
  vidro: new THREE.MeshPhysicalMaterial({ color: 0xbfd8ec, roughness: 0.05, metalness: 0, transmission: 0.6, transparent: true, opacity: 0.45 }),
  folha: new THREE.MeshStandardMaterial({ color: 0x3f7d3a, roughness: 0.8, flatShading: true }),
  vaso: new THREE.MeshStandardMaterial({ color: 0xb8a48a, roughness: 0.8 }),
  pessoa: new THREE.MeshStandardMaterial({ color: 0x8c93a3, roughness: 0.7 }),
  luz: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff4e0, emissiveIntensity: 2 }),
  tela: new THREE.MeshStandardMaterial({ color: 0x0a0c10, roughness: 0.2, metalness: 0.3 }),
});

/* ── as peças, feitas de formas simples ─────────────────────────── */
// Origem no chão, no meio da peça. A frente (+z) olha para a sala.
function peca(p, mat, cor) {
  const g = new THREE.Group();
  const caixa = (l, a, pr, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(l, a, pr), m); o.position.set(x, y, z); g.add(o); return o; };
  const cil = (r, a, m, x, y, z, deitado) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, a, 20), m); o.position.set(x, y, z); if (deitado === 'x') o.rotation.z = Math.PI / 2; if (deitado === 'z') o.rotation.x = Math.PI / 2; g.add(o); return o; };
  const { l, p: pr, a } = p;
  const destaque = cor ? new THREE.MeshStandardMaterial({ color: cor, roughness: 0.7 }) : mat.estofado;
  switch (p.tipo) {
    case 'esteira':
      caixa(l, 0.2, pr, mat.grafite, 0, 0.1, 0);
      caixa(l * 0.78, 0.02, pr * 0.82, mat.preto, 0, 0.21, 0.05);
      for (const s of [-1, 1]) { cil(0.035, a - 0.25, mat.grafite, s * l * 0.42, (a - 0.25) / 2 + 0.2, -pr / 2 + 0.12); caixa(0.04, 0.04, 0.6, mat.metal, s * l * 0.42, 1.0, -pr / 2 + 0.4); }
      caixa(l * 0.95, 0.3, 0.22, mat.preto, 0, a - 0.12, -pr / 2 + 0.12).rotation.x = -0.4;
      break;
    case 'bicicleta':
      caixa(0.12, 0.1, pr, mat.grafite, 0, 0.05, 0);
      cil(0.28, 0.06, cor ? destaque : mat.metal, 0, 0.35, -pr / 2 + 0.25, 'x');
      cil(0.04, 0.75, mat.grafite, 0, 0.55, pr / 2 - 0.35).rotation.x = -0.25;
      caixa(0.28, 0.07, 0.32, destaque, 0, 0.95, pr / 2 - 0.3);
      cil(0.035, 0.8, mat.grafite, 0, 0.6, -pr / 2 + 0.3).rotation.x = 0.3;
      caixa(0.5, 0.04, 0.12, mat.preto, 0, a - 0.05, -pr / 2 + 0.2);
      break;
    case 'eliptico':
      caixa(0.4, 0.12, pr, mat.grafite, 0, 0.06, 0);
      cil(0.25, 0.1, mat.preto, 0, 0.35, -pr / 2 + 0.2, 'x');
      for (const s of [-1, 1]) { caixa(0.14, 0.04, 0.45, mat.preto, s * 0.18, 0.35, 0.1); cil(0.025, a - 0.3, mat.metal, s * 0.25, (a - 0.3) / 2 + 0.3, -pr / 2 + 0.45).rotation.x = 0.2; }
      caixa(0.4, 0.25, 0.15, mat.preto, 0, a - 0.2, -pr / 2 + 0.2);
      break;
    case 'remo':
      caixa(0.15, 0.08, pr, mat.metal, 0, 0.3, 0);
      caixa(0.35, 0.06, 0.35, destaque, 0, 0.38, 0.2);
      cil(0.3, 0.12, mat.preto, 0, 0.35, -pr / 2 + 0.25, 'x');
      break;
    case 'banco':
      caixa(l, 0.1, pr, destaque, 0, a - 0.05, 0);
      for (const z of [-pr / 2 + 0.15, pr / 2 - 0.15]) caixa(0.08, a - 0.1, 0.08, mat.grafite, 0, (a - 0.1) / 2, z);
      caixa(l * 0.8, 0.04, 0.08, mat.grafite, 0, 0.02, -pr / 2 + 0.15);
      break;
    case 'supino':
      caixa(0.32, 0.1, pr * 0.7, destaque, 0, 0.45, pr * 0.12);
      for (const s of [-1, 1]) caixa(0.08, a, 0.08, mat.grafite, s * 0.45, a / 2, -pr / 2 + 0.3);
      cil(0.015, l, mat.metal, 0, a - 0.35, -pr / 2 + 0.3, 'x');
      for (const s of [-1, 1]) cil(0.22, 0.05, mat.preto, s * (l / 2 - 0.12), a - 0.35, -pr / 2 + 0.3, 'x');
      break;
    case 'gaiola':
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) caixa(0.08, a, 0.08, mat.grafite, sx * (l / 2 - 0.05), a / 2, sz * (pr / 2 - 0.05));
      for (const sz of [-1, 1]) caixa(l, 0.08, 0.08, mat.grafite, 0, a - 0.04, sz * (pr / 2 - 0.05));
      for (const sx of [-1, 1]) caixa(0.08, 0.08, pr, mat.grafite, sx * (l / 2 - 0.05), a - 0.04, 0);
      cil(0.015, l + 0.4, mat.metal, 0, 1.4, -pr / 2 + 0.12, 'x');
      break;
    case 'leg_press':
      caixa(l * 0.8, 0.12, pr, mat.grafite, 0, 0.06, 0);
      caixa(0.6, 0.08, 0.8, destaque, 0, 0.55, pr / 2 - 0.5).rotation.x = -0.6;
      caixa(0.7, 0.7, 0.06, mat.metal, 0, 0.9, -pr / 2 + 0.4).rotation.x = 0.7;
      for (const s of [-1, 1]) caixa(0.08, 1.2, 0.08, mat.grafite, s * (l * 0.4), 0.7, -pr / 2 + 0.3).rotation.x = 0.6;
      break;
    case 'polia':
      for (const s of [-1, 1]) { caixa(0.4, a, 0.4, mat.grafite, s * (l / 2 - 0.2), a / 2, 0); caixa(0.25, 0.9, 0.12, mat.preto, s * (l / 2 - 0.2), 0.5, 0.2); }
      caixa(l, 0.12, 0.12, mat.grafite, 0, a - 0.06, 0);
      break;
    case 'halteres':
      for (const [y, z] of [[0.5, 0.05], [0.85, -0.12]]) {
        caixa(l, 0.04, 0.3, mat.grafite, 0, y, z);
        const n = Math.max(3, Math.floor(l / 0.24));
        for (let i = 0; i < n; i += 1) { const x = -l / 2 + 0.15 + (i * (l - 0.3)) / (n - 1); for (const s of [-1, 1]) cil(0.05 + i * 0.003, 0.05, mat.preto, x, y + 0.07, z + s * 0.09, 'z'); cil(0.015, 0.2, mat.metal, x, y + 0.07, z, 'z'); }
      }
      for (const s of [-1, 1]) caixa(0.06, 0.9, 0.06, mat.grafite, s * (l / 2 - 0.05), 0.45, 0);
      break;
    case 'anilhas':
      caixa(0.6, 0.06, 0.6, mat.grafite, 0, 0.03, 0); cil(0.03, a, mat.metal, 0, a / 2, 0);
      for (let i = 0; i < 4; i += 1) cil(0.22 - i * 0.03, 0.04, mat.preto, 0, 0.3 + i * 0.25, 0.08, 'z');
      break;
    case 'colchonete': caixa(l, Math.max(0.02, a), pr, cor ? destaque : new THREE.MeshStandardMaterial({ color: 0x2f6fd6, roughness: 0.9 }), 0, a / 2, 0); break;
    case 'bola': { const o = new THREE.Mesh(new THREE.SphereGeometry(l / 2, 24, 16), cor ? destaque : new THREE.MeshStandardMaterial({ color: 0x6a4fc0, roughness: 0.5 })); o.position.y = l / 2; g.add(o); break; }
    case 'kettlebell': { const o = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mat.preto); o.position.y = 0.11; g.add(o); const t = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.015, 8, 16, Math.PI), mat.preto); t.position.y = 0.2; g.add(t); break; }
    case 'bebedouro': caixa(l, a - 0.1, pr, mat.branco, 0, (a - 0.1) / 2, 0); caixa(l * 0.9, 0.08, pr * 0.9, mat.metal, 0, a - 0.05, 0); break;
    case 'balcao': caixa(l, a - 0.05, pr, cor ? destaque : mat.madeira, 0, (a - 0.05) / 2, 0); caixa(l + 0.05, 0.05, pr + 0.08, mat.branco, 0, a - 0.025, 0); break;
    case 'mesa': caixa(l, 0.04, pr, cor ? destaque : mat.madeira, 0, a - 0.02, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) caixa(0.05, a - 0.04, 0.05, mat.grafite, sx * (l / 2 - 0.06), (a - 0.04) / 2, sz * (pr / 2 - 0.06)); break;
    case 'cadeira': caixa(l, 0.05, pr, cor ? destaque : mat.grafite, 0, 0.45, 0); caixa(l, 0.45, 0.04, cor ? destaque : mat.grafite, 0, 0.7, -pr / 2 + 0.02); for (const sx of [-1, 1]) for (const sz of [-1, 1]) caixa(0.03, 0.45, 0.03, mat.metal, sx * (l / 2 - 0.04), 0.225, sz * (pr / 2 - 0.04)); break;
    case 'sofa': caixa(l, 0.4, pr, destaque, 0, 0.25, 0); caixa(l, 0.45, 0.2, destaque, 0, 0.6, -pr / 2 + 0.1); for (const s of [-1, 1]) caixa(0.18, 0.55, pr, destaque, s * (l / 2 - 0.09), 0.3, 0); break;
    case 'cama': caixa(l, 0.3, pr, mat.madeira, 0, 0.15, 0); caixa(l - 0.06, 0.22, pr - 0.1, mat.branco, 0, 0.4, 0.04); caixa(l, 0.9, 0.06, mat.madeira, 0, 0.45, -pr / 2 + 0.03); break;
    case 'armario': caixa(l, a, pr, cor ? destaque : mat.madeira, 0, a / 2, 0); caixa(0.01, a - 0.1, 0.01, mat.preto, 0, a / 2, pr / 2 + 0.002); break;
    case 'estante': for (const s of [-1, 1]) caixa(0.03, a, pr, mat.madeira, s * (l / 2 - 0.015), a / 2, 0); for (let i = 0; i < 5; i += 1) caixa(l, 0.03, pr, mat.madeira, 0, 0.05 + (i * (a - 0.1)) / 4, 0); break;
    case 'pia': caixa(l, a - 0.04, pr, mat.branco, 0, (a - 0.04) / 2, 0); caixa(l, 0.04, pr, mat.grafite, 0, a - 0.02, 0); caixa(0.45, 0.02, 0.35, mat.metal, 0, a + 0.001, 0.05); break;
    case 'planta': { cil(0.18, 0.4, mat.vaso, 0, 0.2, 0); for (let i = 0; i < 5; i += 1) { const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22 + Math.random() * 0.08, 0), mat.folha); f.position.set((Math.random() - 0.5) * 0.3, 0.6 + i * ((a - 0.7) / 5), (Math.random() - 0.5) * 0.3); g.add(f); } break; }
    case 'tapete': caixa(l, 0.01, pr, cor ? destaque : new THREE.MeshStandardMaterial({ color: 0x7a6a58, roughness: 1 }), 0, 0.005, 0); break;
    case 'luminaria': caixa(l, a, pr, mat.luz, 0, 0, 0); break;
    case 'divisoria': caixa(l, a, pr, cor ? destaque : mat.branco, 0, a / 2, 0); break;
    case 'cilindro': cil(l / 2, a, cor ? destaque : mat.grafite, 0, a / 2, 0); break;
    case 'pessoa': {
      const corpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, a - 0.62, 6, 12), mat.pessoa); corpo.position.y = (a - 0.62) / 2 + 0.17 + 0.05; g.add(corpo);
      const cabeca = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), mat.pessoa); cabeca.position.y = a - 0.11; g.add(cabeca);
      break;
    }
    // ── da parede (a frente +z olha para dentro da sala; o fundo encosta na parede)
    case 'porta': caixa(l + 0.1, a + 0.05, 0.06, mat.branco, 0, (a + 0.05) / 2, 0.03); caixa(l - 0.04, a - 0.03, 0.05, cor ? destaque : mat.madeira, 0, a / 2, 0.05); cil(0.02, 0.14, mat.metal, l / 2 - 0.12, 1.0, 0.09, 'x'); break;
    case 'janela': caixa(l + 0.08, a + 0.08, 0.06, mat.branco, 0, a / 2, 0.03); caixa(l - 0.04, a - 0.04, 0.02, mat.vidro, 0, a / 2, 0.065); caixa(0.04, a, 0.03, mat.branco, 0, a / 2, 0.07); break;
    case 'quadro': caixa(l, a, 0.03, mat.preto, 0, a / 2, 0.015); caixa(l - 0.06, a - 0.06, 0.01, cor ? destaque : new THREE.MeshStandardMaterial({ color: 0xc8a46a, roughness: 0.8 }), 0, a / 2, 0.035); break;
    case 'tv': caixa(l, a, 0.05, mat.preto, 0, a / 2, 0.025); caixa(l - 0.04, a - 0.04, 0.005, mat.tela, 0, a / 2, 0.052); break;
    case 'prateleira': caixa(l, 0.04, pr, mat.madeira, 0, 0, pr / 2); break;
    default: caixa(l, a, pr, cor ? destaque : mat.grafite, 0, a / 2, 0);
  }
  return g;
}

/**
 * Desenha a cena em `caixa`. Devolve { vista(nome, alvo), para() }.
 * `aoApontar(nome|null, x, y)` mostra o nome da peça debaixo do mouse.
 */
export function montaCena3D(caixa, cena, { aoApontar = () => {} } = {}) {
  const { largura: W, comprimento: L, altura: H } = cena.sala;
  const maior = Math.max(W, L);
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  caixa.append(renderer.domElement);

  const cenaGL = new THREE.Scene();
  cenaGL.background = new THREE.Color(NOITE);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const ambiente = new RoomEnvironment();
  cenaGL.environment = pmrem.fromScene(ambiente, 0.04).texture;
  cenaGL.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, maior * 10);
  const controles = new OrbitControls(camera, renderer.domElement);
  controles.enableDamping = true;
  controles.maxPolarAngle = Math.PI / 2 - 0.03;
  controles.minDistance = 0.8;
  controles.maxDistance = maior * 3;
  // Só desenha quando algo mexe (câmera andando, mouse arrastando, tamanho
  // mudando). Parado, o 3D não gasta nada do notebook.
  let pendentes = 0;
  const pede = () => { pendentes = Math.max(pendentes, 3); };
  controles.addEventListener('change', pede);

  // luz
  cenaGL.add(new THREE.HemisphereLight(0xffffff, 0x3a3f4a, 0.7));
  const sol = new THREE.DirectionalLight(0xfff3e2, 1.8);
  sol.position.set(W * 0.35, H * 5 + maior * 0.5, L * 0.25);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -W / 2 - 1, right: W / 2 + 1, top: L / 2 + 1, bottom: -L / 2 - 1, near: 0.5, far: H * 5 + maior * 2 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  cenaGL.add(sol);

  // chão e paredes
  const mat = M();
  const p = piso(cena.sala.piso, W, L);
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ color: p.cor, map: p.mapa, roughness: p.aspereza }));
  chao.rotation.x = -Math.PI / 2;
  chao.receiveShadow = true;
  chao.userData.nome = `Piso de ${cena.sala.piso}`;
  cenaGL.add(chao);
  const matParede = new THREE.MeshStandardMaterial({ color: cena.sala.paredes, roughness: 0.92 });
  const E = 0.15;
  const paredes = {};
  const defs = {
    fundo: { pos: [0, H / 2, -L / 2 - E / 2], tam: [W + 2 * E, H, E], fora: new THREE.Vector3(0, 0, -1) },
    frente: { pos: [0, H / 2, L / 2 + E / 2], tam: [W + 2 * E, H, E], fora: new THREE.Vector3(0, 0, 1) },
    esquerda: { pos: [-W / 2 - E / 2, H / 2, 0], tam: [E, H, L], fora: new THREE.Vector3(-1, 0, 0) },
    direita: { pos: [W / 2 + E / 2, H / 2, 0], tam: [E, H, L], fora: new THREE.Vector3(1, 0, 0) },
  };
  for (const [nome, d] of Object.entries(defs)) {
    const grupo = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(...d.tam), matParede);
    m.position.set(...d.pos); m.receiveShadow = true; m.castShadow = true;
    m.userData.nome = `Parede ${nome === 'frente' ? 'da frente' : nome === 'fundo' ? 'do fundo' : `da ${nome}`}`;
    grupo.add(m);
    cenaGL.add(grupo);
    paredes[nome] = { grupo, ...d, ponto: new THREE.Vector3(d.pos[0], 0, d.pos[2]) };
  }
  // rodapé de luz: uma linha clara no alto das paredes ajuda a ler a altura
  const linha = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, 0.001, L)), new THREE.LineBasicMaterial({ color: 0x5a6378 }));
  linha.position.y = 0.001; cenaGL.add(linha);

  // as peças
  const espelhos = cena.pecas.filter((x) => x.tipo === 'espelho').sort((a, b) => b.l * b.a - a.l * a.a);
  const deVerdade = new Set(espelhos.slice(0, MAX_ESPELHOS_DE_VERDADE));
  const refletores = [];
  const apontaveis = [chao];
  for (const x of cena.pecas) {
    let obj;
    if (x.tipo === 'espelho') {
      obj = new THREE.Group();
      const moldura = new THREE.Mesh(new THREE.BoxGeometry(x.l + 0.04, x.a + 0.04, 0.02), mat.metal);
      moldura.position.set(0, x.a / 2, 0.01); obj.add(moldura);
      if (deVerdade.has(x)) {
        const dpr = Math.min(2, devicePixelRatio || 1);
        const r = new Reflector(new THREE.PlaneGeometry(x.l, x.a), {
          color: 0xb9c0c8, clipBias: 0.003,
          textureWidth: Math.min(768, Math.round(x.l * 110 * dpr)), textureHeight: Math.min(512, Math.round(x.a * 110 * dpr)) });
        r.position.set(0, x.a / 2, 0.022); obj.add(r); refletores.push(r);
      } else {
        const vidro = new THREE.Mesh(new THREE.PlaneGeometry(x.l, x.a), new THREE.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 1, roughness: 0.04 }));
        vidro.position.set(0, x.a / 2, 0.022); obj.add(vidro);
      }
    } else {
      obj = peca(x, mat, x.cor);
    }
    obj.position.set(x.x, x.y || 0, x.z);
    obj.rotation.y = x.giro || 0;
    obj.traverse((o) => { if (o.isMesh) { o.castShadow = x.tipo !== 'luminaria' && x.tipo !== 'tapete'; o.receiveShadow = true; o.userData.nome = x.nome; } });
    obj.userData.nome = x.nome;
    // O que é da parede some junto com ela na vista de casa de bonecas.
    if (x.parede && paredes[x.parede] && x.y !== undefined && ['porta', 'janela', 'espelho', 'quadro', 'tv', 'prateleira'].includes(x.tipo)) paredes[x.parede].grupo.add(obj);
    else cenaGL.add(obj);
    apontaveis.push(obj);
  }

  /* ── a câmera: vistas, visita guiada ─────────────────────────── */
  const porta = cena.pecas.find((x) => x.tipo === 'porta');
  const centro = new THREE.Vector3(0, 0.8, 0);
  const VISTAS = {
    inicio: () => [new THREE.Vector3(W * 0.62, maior * 0.75 + H, L * 0.95), new THREE.Vector3(0, 0.4, 0)],
    cima: () => [new THREE.Vector3(0, maior * 1.45, 0.001), new THREE.Vector3(0, 0, 0)],
    frente: () => [new THREE.Vector3(0, H * 0.9, L / 2 + maior * 0.75), new THREE.Vector3(0, 1, 0)],
    dentro: () => {
      const ang = porta ? porta.giro : Math.PI;
      const base = porta ? new THREE.Vector3(porta.x, 0, porta.z) : new THREE.Vector3(0, 0, L / 2);
      const pos = base.clone().add(new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang)).multiplyScalar(0.7)); pos.y = 1.7;
      return [pos, new THREE.Vector3(0, 1.2, 0)];
    },
    parede: (qual) => {
      const d = paredes[qual] ? qual : 'fundo';
      const oposto = { fundo: [0, 1.65, L / 2 - 1.2], frente: [0, 1.65, -L / 2 + 1.2], esquerda: [W / 2 - 1.2, 1.65, 0], direita: [-W / 2 + 1.2, 1.65, 0] }[d];
      const alvo = { fundo: [0, 1.3, -L / 2], frente: [0, 1.3, L / 2], esquerda: [-W / 2, 1.3, 0], direita: [W / 2, 1.3, 0] }[d];
      return [new THREE.Vector3(...oposto), new THREE.Vector3(...alvo)];
    },
  };
  let anima = null; // { de, para, alvoDe, alvoPara, t0, dur } ou { volta }
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const vai = (pos, alvo, dur = 1600) => {
    pede();
    if (quieto) { camera.position.copy(pos); controles.target.copy(alvo); controles.update(); anima = null; return; }
    anima = { de: camera.position.clone(), para: pos, alvoDe: controles.target.clone(), alvoPara: alvo, t0: performance.now(), dur };
  };
  const fila = [];
  const segue = () => { const f = fila.shift(); if (f) f(); };
  const volta = (dur = 12000) => {
    if (quieto) { segue(); return; }
    pede();
    const r = Math.max(W, L) * 0.85 + 2;
    anima = { volta: true, t0: performance.now(), dur, r, h: H + maior * 0.35, ang0: Math.atan2(camera.position.x, camera.position.z) };
  };
  const vista = (nome, qual) => {
    fila.length = 0;
    caixa.dataset.vista = qual ? `${nome}:${qual}` : nome;
    if (nome === 'volta') { volta(); fila.push(() => vai(...VISTAS.inicio())); return true; }
    const v = VISTAS[nome];
    if (!v) return false;
    vai(...v(qual));
    return true;
  };
  // Visita guiada: de fora, uma volta, e entra pela porta.
  camera.position.copy(VISTAS.inicio()[0]).multiplyScalar(1.25);
  controles.target.copy(centro);
  vai(...VISTAS.inicio(), 1800);
  fila.push(() => volta(11000), () => vai(...VISTAS.dentro(), 2200));
  const interrompe = () => { fila.length = 0; anima = null; };
  renderer.domElement.addEventListener('pointerdown', interrompe);
  renderer.domElement.addEventListener('wheel', interrompe, { passive: true });

  /* ── o nome da peça debaixo do mouse ─────────────────────────── */
  const raio = new THREE.Raycaster();
  const ponteiro = new THREE.Vector2();
  let ultimoApontar = 0;
  renderer.domElement.addEventListener('pointermove', (e) => {
    const agora = performance.now();
    if (agora - ultimoApontar < 60) return;
    ultimoApontar = agora;
    const r = renderer.domElement.getBoundingClientRect();
    ponteiro.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raio.setFromCamera(ponteiro, camera);
    const acerto = raio.intersectObjects(apontaveis, true).find((h) => h.object.visible && h.object.userData.nome && isVisivel(h.object));
    aoApontar(acerto ? acerto.object.userData.nome : null, e.clientX, e.clientY);
  });
  renderer.domElement.addEventListener('pointerleave', () => aoApontar(null));
  const isVisivel = (o) => { for (let x = o; x; x = x.parent) if (!x.visible) return false; return true; };

  /* ── o laço ──────────────────────────────────────────────────── */
  const mede = () => {
    const w = caixa.clientWidth || 600; const h = caixa.clientHeight || 400;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    pede();
  };
  const observa = new ResizeObserver(mede); observa.observe(caixa); mede();
  const daCamera = new THREE.Vector3();
  let quadro = 0;
  const desenha = () => {
    quadro = requestAnimationFrame(desenha);
    if (anima) {
      pendentes = 3;
      const t = Math.min(1, (performance.now() - anima.t0) / anima.dur);
      if (anima.volta) {
        const ang = anima.ang0 + t * Math.PI * 2;
        camera.position.set(Math.sin(ang) * anima.r, anima.h, Math.cos(ang) * anima.r);
        controles.target.lerp(centro, 0.08);
      } else {
        const k = suave(t);
        camera.position.lerpVectors(anima.de, anima.para, k);
        controles.target.lerpVectors(anima.alvoDe, anima.alvoPara, k);
      }
      if (t >= 1) { anima = null; segue(); }
    }
    controles.enabled = !anima;
    if (controles.update()) pendentes = 3;
    if (pendentes <= 0) return;
    pendentes -= 1;
    // Casa de bonecas: a parede entre você e a sala some (com o que está nela).
    camera.getWorldPosition(daCamera);
    for (const pw of Object.values(paredes)) {
      const fora = daCamera.clone().sub(pw.ponto).dot(pw.fora) > 0;
      pw.grupo.visible = !fora || daCamera.y > H * 3.2;
    }
    renderer.render(cenaGL, camera);
  };
  desenha();

  return {
    vista,
    para: () => {
      cancelAnimationFrame(quadro);
      observa.disconnect();
      controles.dispose();
      cenaGL.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
      for (const r of refletores) r.dispose?.();
      cenaGL.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
