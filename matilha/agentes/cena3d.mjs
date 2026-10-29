/**
 * O 3D NA HORA — uma sala montada com peças prontas, em segundos.
 *
 * O modelo (Groq) só diz O QUE quer: o tamanho da sala, o piso, a cor das
 * paredes e uma lista de peças ("6 esteiras na parede do fundo", "espelhos
 * em todas as paredes"). Quem decide ONDE cada peça fica é este arquivo:
 * porta e janela primeiro, espelho só no que sobrou da parede, aparelho
 * encostado virado para a sala, o resto em fileiras no meio, com espaço
 * para passar. O que não couber fica de fora, com aviso.
 *
 * Medidas em metros. A sala tem o centro em (0, 0); o fundo é z negativo,
 * a frente (onde fica a entrada) é z positivo, a esquerda é x negativo.
 * A tela (public/jarvis-3d.js) só desenha o que sai daqui.
 */
import { texto } from './comum.mjs';

/** As peças: tamanho (largura × profundidade × altura) e onde costumam ficar. */
export const CATALOGO = {
  // da parede (presas nela)
  porta: { l: 0.9, p: 0.12, a: 2.1, naParede: true, y: 0, nome: 'Porta', pl: 'Portas' },
  janela: { l: 1.5, p: 0.12, a: 1.2, naParede: true, y: 1.0, nome: 'Janela', pl: 'Janelas' },
  espelho: { l: 0, p: 0.04, a: 1.9, naParede: true, y: 0.3, nome: 'Espelho', pl: 'Espelhos' },
  quadro: { l: 0.8, p: 0.04, a: 0.6, naParede: true, y: 1.4, nome: 'Quadro', pl: 'Quadros' },
  tv: { l: 1.4, p: 0.08, a: 0.8, naParede: true, y: 1.7, nome: 'TV', pl: 'TVs' },
  prateleira: { l: 1.2, p: 0.3, a: 0.04, naParede: true, y: 1.5, nome: 'Prateleira', pl: 'Prateleiras' },
  // de academia
  esteira: { l: 0.85, p: 2.0, a: 1.4, nome: 'Esteira', pl: 'Esteiras', encosta: true },
  bicicleta: { l: 0.6, p: 1.2, a: 1.1, nome: 'Bicicleta ergométrica', pl: 'Bicicletas ergométricas', encosta: true },
  eliptico: { l: 0.7, p: 1.8, a: 1.6, nome: 'Elíptico', pl: 'Elípticos', encosta: true },
  remo: { l: 0.6, p: 2.3, a: 0.9, nome: 'Remo', pl: 'Remos' },
  banco: { l: 0.6, p: 1.3, a: 0.5, nome: 'Banco', pl: 'Bancos' },
  supino: { l: 1.6, p: 1.8, a: 1.5, nome: 'Supino', pl: 'Supinos' },
  gaiola: { l: 1.5, p: 1.5, a: 2.3, nome: 'Gaiola de agachamento', pl: 'Gaiolas de agachamento' },
  leg_press: { l: 1.3, p: 2.2, a: 1.5, nome: 'Leg press', pl: 'Leg press' },
  polia: { l: 3.0, p: 0.9, a: 2.3, nome: 'Crossover (polia)', pl: 'Crossovers (polia)', encosta: true },
  halteres: { l: 2.2, p: 0.6, a: 1.0, nome: 'Suporte de halteres', pl: 'Suportes de halteres', encosta: true },
  anilhas: { l: 0.7, p: 0.7, a: 1.3, nome: 'Suporte de anilhas', pl: 'Suportes de anilhas', encosta: true },
  colchonete: { l: 0.6, p: 1.8, a: 0.03, nome: 'Colchonete', pl: 'Colchonetes' },
  bola: { l: 0.65, p: 0.65, a: 0.65, nome: 'Bola de pilates', pl: 'Bolas de pilates' },
  kettlebell: { l: 0.25, p: 0.25, a: 0.3, nome: 'Kettlebell', pl: 'Kettlebells' },
  bebedouro: { l: 0.4, p: 0.4, a: 1.1, nome: 'Bebedouro', pl: 'Bebedouros', encosta: true },
  // de qualquer lugar
  balcao: { l: 2.0, p: 0.6, a: 1.1, nome: 'Balcão', pl: 'Balcões', encosta: true },
  mesa: { l: 1.2, p: 0.8, a: 0.75, nome: 'Mesa', pl: 'Mesas' },
  cadeira: { l: 0.5, p: 0.5, a: 0.9, nome: 'Cadeira', pl: 'Cadeiras' },
  sofa: { l: 2.0, p: 0.9, a: 0.85, nome: 'Sofá', pl: 'Sofás', encosta: true },
  cama: { l: 1.6, p: 2.0, a: 0.55, nome: 'Cama', pl: 'Camas', encosta: true },
  armario: { l: 1.0, p: 0.55, a: 2.0, nome: 'Armário', pl: 'Armários', encosta: true },
  estante: { l: 1.0, p: 0.35, a: 1.8, nome: 'Estante', pl: 'Estantes', encosta: true },
  pia: { l: 1.2, p: 0.6, a: 0.9, nome: 'Pia', pl: 'Pias', encosta: true },
  planta: { l: 0.5, p: 0.5, a: 1.3, nome: 'Planta', pl: 'Plantas' },
  tapete: { l: 2.0, p: 1.4, a: 0.01, nome: 'Tapete', pl: 'Tapetes' },
  luminaria: { l: 1.2, p: 0.3, a: 0.06, nome: 'Luminária', pl: 'Luminárias', noTeto: true },
  divisoria: { l: 3.0, p: 0.1, a: 2.4, nome: 'Divisória', pl: 'Divisórias' },
  caixa: { l: 1, p: 1, a: 1, nome: 'Caixa', pl: 'Caixas' },
  cilindro: { l: 0.6, p: 0.6, a: 1, nome: 'Cilindro', pl: 'Cilindros' },
  pessoa: { l: 0.45, p: 0.3, a: 1.75, nome: 'Pessoa (1,75 m, para ter noção do tamanho)', pl: 'Pessoas' },
};
export const PISOS = ['borracha', 'madeira', 'porcelanato', 'cimento', 'carpete', 'grama', 'vinilico'];
export const CORES = {
  branco: '#f2f0eb', 'cinza claro': '#c9c9c4', cinza: '#8e9196', grafite: '#3a3d43', preto: '#1c1d20', bege: '#d8c8ae',
  'azul escuro': '#1f3554', azul: '#2f6fd6', 'verde escuro': '#24452f', verde: '#3f8a4e', amarelo: '#f2c230',
  laranja: '#e8742c', vermelho: '#c8312f', rosa: '#e58fb0', roxo: '#6a4fc0', madeira: '#9a6a42', tijolo: '#a2543a',
};
const PAREDES = ['fundo', 'frente', 'esquerda', 'direita'];
const ONDE = ['parede-fundo', 'parede-frente', 'parede-esquerda', 'parede-direita', 'todas-as-paredes', 'centro', 'cantos', 'teto', 'livre'];

/** Salas prontas, para "faz uma academia" sair bonita sem o modelo listar tudo. */
export const MODELOS = {
  academia: {
    ambiente: { largura: 12, comprimento: 18, altura: 3.2, piso: 'borracha', paredes: 'grafite' },
    objetos: [
      { tipo: 'porta', onde: 'parede-frente' }, { tipo: 'janela', quantidade: 3, onde: 'parede-esquerda' },
      { tipo: 'balcao', onde: 'parede-frente' }, { tipo: 'bebedouro', onde: 'parede-frente' },
      { tipo: 'esteira', quantidade: 6, onde: 'parede-fundo' }, { tipo: 'bicicleta', quantidade: 4, onde: 'parede-esquerda' },
      { tipo: 'halteres', quantidade: 2, onde: 'parede-direita' }, { tipo: 'polia', onde: 'parede-direita' },
      { tipo: 'gaiola', quantidade: 2, onde: 'centro' }, { tipo: 'supino', quantidade: 2, onde: 'centro' },
      { tipo: 'banco', quantidade: 4, onde: 'centro' }, { tipo: 'leg_press', onde: 'centro' },
      { tipo: 'luminaria', onde: 'teto' }, { tipo: 'planta', onde: 'cantos' },
    ],
  },
  quarto: {
    ambiente: { largura: 3.5, comprimento: 4, altura: 2.7, piso: 'madeira', paredes: 'branco' },
    objetos: [{ tipo: 'porta', onde: 'parede-frente' }, { tipo: 'janela', onde: 'parede-esquerda' }, { tipo: 'cama', onde: 'parede-fundo' },
      { tipo: 'armario', onde: 'parede-direita' }, { tipo: 'tapete', onde: 'centro' }, { tipo: 'luminaria', onde: 'teto' }],
  },
  sala: {
    ambiente: { largura: 5, comprimento: 6, altura: 2.7, piso: 'porcelanato', paredes: 'bege' },
    objetos: [{ tipo: 'porta', onde: 'parede-frente' }, { tipo: 'janela', quantidade: 2, onde: 'parede-esquerda' }, { tipo: 'sofa', onde: 'parede-fundo' },
      { tipo: 'tv', onde: 'parede-frente' }, { tipo: 'tapete', onde: 'centro' }, { tipo: 'mesa', onde: 'centro' }, { tipo: 'planta', onde: 'cantos' },
      { tipo: 'luminaria', onde: 'teto' }],
  },
  loja: {
    ambiente: { largura: 8, comprimento: 12, altura: 3.2, piso: 'porcelanato', paredes: 'branco' },
    objetos: [{ tipo: 'porta', l: 2, onde: 'parede-frente' }, { tipo: 'balcao', onde: 'parede-fundo' }, { tipo: 'estante', quantidade: 6, onde: 'parede-esquerda' },
      { tipo: 'estante', quantidade: 6, onde: 'parede-direita' }, { tipo: 'mesa', quantidade: 2, onde: 'centro' }, { tipo: 'luminaria', onde: 'teto' }],
  },
  restaurante: {
    ambiente: { largura: 10, comprimento: 14, altura: 3, piso: 'madeira', paredes: 'tijolo' },
    objetos: [{ tipo: 'porta', onde: 'parede-frente' }, { tipo: 'janela', quantidade: 3, onde: 'parede-esquerda' }, { tipo: 'balcao', quantidade: 2, onde: 'parede-fundo' },
      { tipo: 'mesa', quantidade: 12, onde: 'centro' }, { tipo: 'planta', onde: 'cantos' }, { tipo: 'luminaria', onde: 'teto' }],
  },
  escritorio: {
    ambiente: { largura: 8, comprimento: 10, altura: 2.8, piso: 'carpete', paredes: 'branco' },
    objetos: [{ tipo: 'porta', onde: 'parede-frente' }, { tipo: 'janela', quantidade: 3, onde: 'parede-esquerda' }, { tipo: 'mesa', quantidade: 8, onde: 'centro' },
      { tipo: 'armario', quantidade: 3, onde: 'parede-direita' }, { tipo: 'planta', onde: 'cantos' }, { tipo: 'luminaria', onde: 'teto' }],
  },
};

/** Os parâmetros da ferramenta montar_3d, como o modelo vê. */
export const PARAMETROS_DO_3D = {
  titulo: { type: 'string', description: 'o nome do que foi montado (ex.: "Academia do Rafael")' },
  modelo: { type: 'string', enum: Object.keys(MODELOS), description: 'opcional: uma sala pronta. Só vale quando objetos vier vazio.' },
  ambiente: { type: 'object', description: 'a sala', properties: {
    largura: { type: 'number', description: 'metros, de parede esquerda a parede direita' },
    comprimento: { type: 'number', description: 'metros, da frente (entrada) ao fundo' },
    altura: { type: 'number', description: 'pé-direito, em metros' },
    piso: { type: 'string', enum: PISOS },
    paredes: { type: 'string', description: `cor: ${Object.keys(CORES).join(', ')}, ou #rrggbb` },
  } },
  objetos: { type: 'array', description: 'as peças. Na mudança ("põe espelhos"), mande a lista INTEIRA de novo, com a mudança.', items: { type: 'object', properties: {
    tipo: { type: 'string', enum: Object.keys(CATALOGO) },
    quantidade: { type: 'integer' },
    onde: { type: 'string', enum: ONDE, description: 'parede-fundo, parede-frente (onde fica a entrada), parede-esquerda, parede-direita, todas-as-paredes, centro, cantos, teto, ou livre (com x e z)' },
    x: { type: 'number', description: 'só com onde=livre: metros a partir da parede esquerda' },
    z: { type: 'number', description: 'só com onde=livre: metros a partir da parede do fundo' },
    l: { type: 'number', description: 'opcional: largura em metros (espelho, divisória, caixa)' },
    a: { type: 'number', description: 'opcional: altura em metros' },
    p: { type: 'number', description: 'opcional: profundidade em metros (caixa)' },
    girar: { type: 'number', description: 'opcional: graus' },
    cor: { type: 'string' },
  }, required: ['tipo'] } },
};

const NOME_DA_PAREDE = { fundo: 'parede do fundo', frente: 'parede da frente', esquerda: 'parede da esquerda', direita: 'parede da direita' };
/** "1 esteira", "6 esteiras". */
export const quantos = (q, cat) => `${q} ${(q === 1 ? cat.nome : cat.pl).replace(/^(?!TV)./, (c) => c.toLowerCase())}`;
const num = (v, min, max, padrao) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : padrao);
const corDe = (c, padrao) => (/^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c).toLowerCase() : CORES[String(c || '').toLowerCase().trim()] || padrao);
const MAX_PECAS = 300;

/** Intervalos livres de [0, comprimento] tirando os ocupados (com folga). */
function livres(comprimento, ocupados, folga = 0) {
  const ord = ocupados.map(([a, b]) => [a - folga, b + folga]).sort((x, y) => x[0] - y[0]);
  const saida = [];
  let cursor = 0;
  for (const [a, b] of ord) {
    if (a > cursor) saida.push([cursor, Math.min(a, comprimento)]);
    cursor = Math.max(cursor, b);
  }
  if (cursor < comprimento) saida.push([cursor, comprimento]);
  return saida.filter(([a, b]) => b - a > 0.05);
}

/**
 * O que o modelo pediu → a cena pronta para desenhar, com cada peça no
 * lugar. Devolve { cena, pedido } (o pedido limpo é o que volta para o
 * modelo nas mudanças) ou { erro }.
 */
export function montaCena(args = {}) {
  const base = args.modelo && MODELOS[args.modelo] && !(Array.isArray(args.objetos) && args.objetos.length) ? MODELOS[args.modelo] : null;
  const amb = { ...(base?.ambiente || {}), ...(args.ambiente || {}) };
  const W = num(amb.largura, 2, 120, 8);
  const L = num(amb.comprimento, 2, 120, 10);
  const H = num(amb.altura, 2.2, 15, 3);
  const piso = PISOS.includes(amb.piso) ? amb.piso : 'porcelanato';
  const paredes = corDe(amb.paredes, CORES.branco);
  const brutos = (Array.isArray(args.objetos) && args.objetos.length ? args.objetos : base?.objetos || [])
    .filter((o) => o && CATALOGO[o.tipo]).slice(0, 80);
  if (!brutos.length) return { erro: 'a lista de objetos veio vazia: mande objetos ou um modelo pronto' };

  const pedido = {
    titulo: texto(args.titulo, 80) || 'Projeto 3D',
    ambiente: { largura: W, comprimento: L, altura: H, piso, paredes: amb.paredes || 'branco' },
    objetos: brutos.map((o) => Object.fromEntries(Object.entries({
      tipo: o.tipo, quantidade: Number.isInteger(o.quantidade) && o.quantidade > 1 ? Math.min(o.quantidade, 60) : undefined,
      onde: ONDE.includes(o.onde) ? o.onde : undefined, x: typeof o.x === 'number' ? o.x : undefined, z: typeof o.z === 'number' ? o.z : undefined,
      l: typeof o.l === 'number' ? o.l : undefined, a: typeof o.a === 'number' ? o.a : undefined, p: typeof o.p === 'number' ? o.p : undefined,
      girar: typeof o.girar === 'number' ? o.girar : undefined, cor: o.cor || undefined,
    }).filter(([, v]) => v !== undefined))),
  };
  // Toda sala tem por onde entrar.
  if (!pedido.objetos.some((o) => o.tipo === 'porta')) pedido.objetos.unshift({ tipo: 'porta', onde: 'parede-frente' });

  const pecas = [];
  const avisos = [];
  const comprimentoDa = (parede) => (parede === 'fundo' || parede === 'frente' ? W : L);
  // Cada parede: o que está preso nela (porta, janela, espelho…) e o que está encostado no chão.
  const naParede = Object.fromEntries(PAREDES.map((p) => [p, []]));
  const encostado = Object.fromEntries(PAREDES.map((p) => [p, []]));
  const profundidadeEncostada = Object.fromEntries(PAREDES.map((p) => [p, 0]));
  const paredesDe = (o, padrao) => {
    const onde = o.onde || padrao;
    if (onde === 'todas-as-paredes') return PAREDES;
    return onde.startsWith('parede-') ? [onde.slice(7)] : null;
  };
  /** Do sistema "da parede" (s ao longo dela, d para dentro da sala) para x, z e o giro que olha para o meio. */
  const posicao = (parede, s, d) => {
    if (parede === 'fundo') return { x: -W / 2 + s, z: -L / 2 + d, giro: 0 };
    if (parede === 'frente') return { x: W / 2 - s, z: L / 2 - d, giro: Math.PI };
    if (parede === 'esquerda') return { x: -W / 2 + d, z: L / 2 - s, giro: Math.PI / 2 };
    return { x: W / 2 - d, z: -L / 2 + s, giro: -Math.PI / 2 };
  };
  const poe = (o, cat, dados) => {
    if (pecas.length >= MAX_PECAS) return false;
    pecas.push({ tipo: o.tipo, nome: cat.nome, cor: o.cor ? corDe(o.cor, null) : null, ...dados });
    return true;
  };
  const ordem = ['porta', 'janela'];
  const ordenados = [...pedido.objetos].sort((a, b) => (ordem.indexOf(b.tipo) + 1 || 0) - (ordem.indexOf(a.tipo) + 1 || 0));

  // 1) presas na parede: porta e janela primeiro, depois espelho no que sobrou, depois o resto
  for (const fase of ['abertura', 'espelho', 'resto']) {
    for (const o of ordenados) {
      const cat = CATALOGO[o.tipo];
      if (!cat.naParede) continue;
      const deFase = o.tipo === 'porta' || o.tipo === 'janela' ? 'abertura' : o.tipo === 'espelho' ? 'espelho' : 'resto';
      if (deFase !== fase) continue;
      const lista = paredesDe(o, o.tipo === 'espelho' || o.tipo === 'janela' ? 'parede-fundo' : 'parede-frente') || ['fundo'];
      for (const parede of lista) {
        const C = comprimentoDa(parede);
        const a = num(o.a, 0.2, H, cat.a);
        const y = cat.y;
        // O que já ocupa essa faixa de altura nesta parede.
        const ocupa = naParede[parede].filter((p) => p.y < y + a && y < p.y + p.a).map((p) => [p.s0, p.s1]);
        const vagas = livres(C, ocupa, o.tipo === 'espelho' ? 0.15 : 0.3).map(([i, f]) => [Math.max(i, 0.25), Math.min(f, C - 0.25)]).filter(([i, f]) => f - i > 0.3);
        const qtd = o.tipo === 'espelho' && !o.quantidade ? vagas.length : (o.quantidade || 1);
        let feitos = 0;
        if (o.tipo === 'espelho' && !o.l && !o.quantidade) {
          // Espelho sem medida: cobre cada trecho livre da parede (é o "parede de espelho" de academia).
          for (const [i, f] of vagas) {
            if (f - i < 0.6) continue;
            const s = (i + f) / 2;
            const pos = posicao(parede, s, 0.02);
            if (poe(o, cat, { ...pos, y, l: f - i, a, p: cat.p, parede })) { naParede[parede].push({ tipo: o.tipo, s0: i, s1: f, y, a }); feitos += 1; }
          }
        } else {
          const l = num(o.l, 0.2, C, cat.l || 1.2);
          // Espalha as unidades por igual nas vagas que cabem.
          const cabem = vagas.flatMap(([i, f]) => {
            const n = Math.floor((f - i + 0.3) / (l + 0.3));
            const sobra = (f - i) - n * l;
            return Array.from({ length: n }, (_, k) => i + (sobra / (n + 1)) * (k + 1) + l * k + l / 2);
          });
          const passo = cabem.length / Math.max(1, qtd);
          for (let k = 0; k < Math.min(qtd, cabem.length); k += 1) {
            const s = cabem[Math.floor(passo * k + passo / 2 - 0.5)] ?? cabem[k];
            const pos = posicao(parede, s, 0.02);
            if (poe(o, cat, { ...pos, y, l, a, p: cat.p, parede })) { naParede[parede].push({ tipo: o.tipo, s0: s - l / 2, s1: s + l / 2, y, a }); feitos += 1; }
          }
          if (feitos < qtd) avisos.push(`${quantos(qtd - feitos, cat)} não couberam na ${NOME_DA_PAREDE[parede]}`);
        }
      }
    }
  }

  // 2) encostados no chão, ao longo da parede (sem tapar a porta)
  for (const o of pedido.objetos) {
    const cat = CATALOGO[o.tipo];
    if (cat.naParede || cat.noTeto) continue;
    const lista = paredesDe(o, null);
    if (!lista) continue;
    const qtdTotal = o.quantidade || 1;
    const porParede = lista.length > 1 ? Math.ceil(qtdTotal / lista.length) : qtdTotal;
    let restante = qtdTotal;
    for (const parede of lista) {
      const C = comprimentoDa(parede);
      const l = num(o.l, 0.2, C, cat.l);
      const p = num(o.p, 0.1, 10, cat.p);
      // Espelho atrás da esteira pode (é como toda academia é); na frente da porta, nada.
      const portas = naParede[parede].filter((x) => x.tipo === 'porta').map((x) => [x.s0, x.s1]);
      const usados = encostado[parede].map((x) => [x.s0, x.s1]);
      const vagas = livres(C, [...portas.map(([a, b]) => [a - 0.5, b + 0.5]), ...usados], 0).map(([i, f]) => [Math.max(i, 0.1), Math.min(f, C - 0.1)]);
      const gap = o.tipo === 'esteira' || o.tipo === 'bicicleta' || o.tipo === 'eliptico' ? 0.35 : 0.15;
      // Enche as vagas maiores primeiro, e o grupo fica centralizado na vaga.
      let quero = Math.min(restante, porParede);
      const escolhidas = [];
      for (const [i, f] of [...vagas].sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))) {
        const cabe = Math.floor((f - i + gap) / (l + gap));
        const n = Math.min(cabe, quero);
        if (n <= 0) continue;
        const grupo = n * l + (n - 1) * gap;
        const inicio = i + (f - i - grupo) / 2 + l / 2;
        for (let k = 0; k < n; k += 1) escolhidas.push(inicio + k * (l + gap));
        quero -= n;
        if (!quero) break;
      }
      for (const s of escolhidas) {
        const pos = posicao(parede, s, p / 2 + 0.05);
        if (poe(o, cat, { ...pos, y: 0, l, a: num(o.a, 0.01, H, cat.a), p, parede, giro: pos.giro + ((o.girar || 0) * Math.PI) / 180 })) {
          encostado[parede].push({ s0: s - l / 2, s1: s + l / 2 });
          profundidadeEncostada[parede] = Math.max(profundidadeEncostada[parede], p + 0.05);
        }
      }
      restante -= escolhidas.length;
    }
    if (restante > 0) avisos.push(`${quantos(restante, cat)} não couberam encostados na parede`);
  }

  // 3) no meio: fileiras no espaço que sobrou, com 1 m para passar (e 3,2 m livres na frente de cada porta)
  const margem = 1.0;
  const folga = (parede) => Math.max(profundidadeEncostada[parede] + margem, naParede[parede].some((x) => x.tipo === 'porta') ? 3.2 : 0);
  const area = {
    x0: -W / 2 + folga('esquerda'), x1: W / 2 - folga('direita'),
    z0: -L / 2 + folga('fundo'), z1: L / 2 - folga('frente'),
  };
  let cursorZ = area.z0;
  for (const o of pedido.objetos) {
    const cat = CATALOGO[o.tipo];
    if (cat.naParede || cat.noTeto || (o.onde && o.onde !== 'centro')) continue;
    if (o.tipo === 'tapete' && (o.quantidade || 1) === 1) {
      poe(o, cat, { x: 0, z: 0, y: 0, l: num(o.l, 0.5, W, Math.min(cat.l * 1.4, W * 0.5)), p: num(o.p, 0.5, L, Math.min(cat.p * 1.4, L * 0.4)), a: cat.a, giro: 0 });
      continue;
    }
    const l = num(o.l, 0.1, W, cat.l); const p = num(o.p, 0.1, L, cat.p);
    const qtd = o.quantidade || 1;
    const gapX = o.tipo === 'mesa' ? 1.2 : 0.9; const gapZ = o.tipo === 'mesa' ? 1.2 : 1.0;
    const porLinha = Math.max(1, Math.floor((area.x1 - area.x0 + gapX) / (l + gapX)));
    let feitos = 0;
    while (feitos < qtd && cursorZ + p <= area.z1 + 1e-6) {
      const nesta = Math.min(porLinha, qtd - feitos);
      const larguraLinha = nesta * l + (nesta - 1) * gapX;
      let x = -larguraLinha / 2 + l / 2 + (area.x0 + area.x1) / 2;
      for (let k = 0; k < nesta; k += 1) {
        poe(o, cat, { x, z: cursorZ + p / 2, y: 0, l, p, a: num(o.a, 0.01, H, cat.a), giro: ((o.girar || 0) * Math.PI) / 180 });
        // Mesa vem com cadeiras.
        if (o.tipo === 'mesa') {
          const c = CATALOGO.cadeira;
          poe({ tipo: 'cadeira' }, c, { x, z: cursorZ - 0.35, y: 0, l: c.l, p: c.p, a: c.a, giro: 0 });
          poe({ tipo: 'cadeira' }, c, { x, z: cursorZ + p + 0.35, y: 0, l: c.l, p: c.p, a: c.a, giro: Math.PI });
        }
        x += l + gapX; feitos += 1;
      }
      cursorZ += p + gapZ;
    }
    if (feitos < qtd) avisos.push(`${quantos(qtd - feitos, cat)} não couberam no meio da sala`);
  }

  // 4) cantos, teto e livres
  for (const o of pedido.objetos) {
    const cat = CATALOGO[o.tipo];
    if (o.onde === 'cantos') {
      const d = 0.5;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].slice(0, o.quantidade || 4).forEach(([sx, sz]) => poe(o, cat, {
        x: sx * (W / 2 - d), z: sz * (L / 2 - d), y: 0, l: cat.l, p: cat.p, a: num(o.a, 0.1, H, cat.a), giro: 0 }));
    } else if (cat.noTeto || o.onde === 'teto') {
      const nx = Math.max(1, Math.round(W / 3)); const nz = Math.max(1, Math.round(L / 3));
      const qtd = o.quantidade || nx * nz;
      let k = 0;
      for (let i = 0; i < nx && k < qtd; i += 1) {
        for (let j = 0; j < nz && k < qtd; j += 1, k += 1) {
          poe(o, cat, { x: -W / 2 + (W / nx) * (i + 0.5), z: -L / 2 + (L / nz) * (j + 0.5), y: H - 0.08, l: cat.l, p: cat.p, a: cat.a, giro: 0 });
        }
      }
    } else if (o.onde === 'livre') {
      const l = num(o.l, 0.1, W, cat.l); const p = num(o.p, 0.1, L, cat.p);
      poe(o, cat, { x: -W / 2 + num(o.x, 0, W, W / 2), z: -L / 2 + num(o.z, 0, L, L / 2), y: 0, l, p, a: num(o.a, 0.01, H, cat.a), giro: ((o.girar || 0) * Math.PI) / 180 });
    }
  }

  // Uma pessoa na entrada, para dar a noção de tamanho (se ninguém pôs).
  if (!pecas.some((p) => p.tipo === 'pessoa')) {
    const porta = pecas.find((p) => p.tipo === 'porta');
    const c = CATALOGO.pessoa;
    if (porta) {
      // Um passo para dentro e um pouco ao lado da porta (sem tapar a vista de quem entra), olhando para a sala.
      const g = porta.giro;
      poe({ tipo: 'pessoa' }, c, { x: porta.x + Math.sin(g) * 1.0 + Math.cos(g) * 1.4, z: porta.z + Math.cos(g) * 1.0 - Math.sin(g) * 1.4, y: 0, l: c.l, p: c.p, a: c.a, giro: g });
    }
  }

  const conta = {};
  for (const p of pecas) if (p.tipo !== 'pessoa' && p.tipo !== 'luminaria') conta[p.tipo] = (conta[p.tipo] || 0) + 1;
  return {
    pedido,
    cena: { titulo: pedido.titulo, sala: { largura: W, comprimento: L, altura: H, piso, paredes }, pecas, conta, avisos: [...new Set(avisos)].slice(0, 6) },
  };
}

/** A cena descrita em uma linha, para a fala e para o modelo. */
export function resumoDaCena(cena) {
  const itens = Object.entries(cena.conta).map(([t, q]) => quantos(q, CATALOGO[t])).join(', ');
  const fmt = (v) => String(Math.round(v * 10) / 10).replace('.', ',');
  return `${cena.titulo}: sala de ${fmt(cena.sala.largura)} por ${fmt(cena.sala.comprimento)} metros, pé-direito de ${fmt(cena.sala.altura)} m, com ${itens}.${cena.avisos.length ? ` Atenção: ${cena.avisos.join('; ')}.` : ''}`;
}
