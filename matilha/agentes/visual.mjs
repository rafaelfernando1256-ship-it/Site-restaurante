/**
 * O QUE O JARVIS MOSTRA NA TELA — gráficos, números, tabelas e slides.
 *
 * O modelo descreve o que quer mostrar (a ferramenta "mostrar"); a tela
 * desenha. Antes de ir para a tela, cada número é conferido: ele precisa
 * aparecer no que foi lido nesta conversa (a pesquisa, a página, a sua
 * fala, os números da Matilha). Número que o modelo "lembrou" ou inventou
 * volta para ele com a lista do que não bateu, e não aparece.
 *
 * Quem desenha os gráficos é o Apache ECharts (github.com/apache/echarts),
 * que vem instalado no Jarvis (public/vendor/echarts). O modelo só diz o
 * tipo e os dados; o visual é sempre o mesmo, o do Jarvis.
 */
import { texto } from './comum.mjs';

export const TIPOS_DE_GRAFICO = ['barras', 'colunas', 'linha', 'area', 'empilhado', 'pizza', 'funil', 'medidor', 'radar', 'dispersao', 'numeros', 'tabela'];
export const TIPOS_DE_VISUAL = [...TIPOS_DE_GRAFICO, 'slides'];
const MAX_SERIES = 8; // as 8 cores da paleta; mais que isso não se distingue
// Quantas séries cada tipo aguenta: pizza/funil/medidor são de uma série só; radar e dispersão, até 3.
const LIMITE_DE_SERIES = { pizza: 1, funil: 1, radar: 3, dispersao: 3, linha: 6, area: 4 };
const MAX_ROTULOS = 24;
const MAX_SLIDES = 10;

const serie = {
  type: 'object',
  properties: {
    nome: { type: 'string' },
    valores: { type: 'array', items: { type: 'number' }, description: 'um valor por rótulo' },
    pontos: { type: 'array', items: { type: 'array', items: { type: 'number' } }, description: 'dispersao: [x, y]' },
  },
  required: ['nome'],
};
const grafico = {
  type: 'object',
  description: 'um gráfico dentro do slide (mesmo formato do gráfico principal)',
  properties: {
    tipo: { type: 'string', enum: TIPOS_DE_GRAFICO.filter((t) => t !== 'tabela') },
    rotulos: { type: 'array', items: { type: 'string' } },
    series: { type: 'array', items: serie },
    numeros: { type: 'array', items: { type: 'object', properties: { rotulo: { type: 'string' }, valor: { type: 'number' }, detalhe: { type: 'string' } } } },
    unidade: { type: 'string' },
  },
};

/** Os parâmetros da ferramenta "mostrar", como o modelo vê. */
export const PARAMETROS_DO_MOSTRAR = {
  tipo: { type: 'string', enum: TIPOS_DE_VISUAL, description: 'numeros: 1 a 4 destaques. barras: comparar categorias. colunas: categorias em ordem (meses). linha: evolução. area: evolução de uma coisa só. empilhado: partes de um todo por categoria. pizza: partes de um todo (até 6). funil: etapas que diminuem. medidor: 1 valor contra um maximo. radar: 1 a 3 coisas em vários quesitos. dispersao: x contra y (pontos). tabela. slides. Nunca dois eixos: dois gráficos.' },
  titulo: { type: 'string', description: 'a conclusão em uma frase curta (ex.: "Lula lidera com 52% dos votos válidos")' },
  subtitulo: { type: 'string', description: 'o que é, de onde e de quando (ex.: "Pesquisa Quaest de 20 de outubro, votos válidos"). Se for pesquisa e não resultado, diga.' },
  unidade: { type: 'string', description: 'unidade dos valores: "%", "R$", "votos", "mil", "" ' },
  rotulos: { type: 'array', items: { type: 'string' }, description: 'barras/colunas/linha/tabela: as categorias ou datas, na ordem' },
  series: { type: 'array', items: serie, description: 'barras/colunas/linha/tabela: uma série por coisa comparada (até 4), cada uma com um valor por rótulo' },
  numeros: { type: 'array', items: { type: 'object', properties: { rotulo: { type: 'string' }, valor: { type: 'number' }, detalhe: { type: 'string' } }, required: ['rotulo', 'valor'] }, description: 'numeros: cada número com o seu rótulo' },
  destaque: { type: 'string', description: 'opcional: o rótulo (ou número) que é o ponto principal, para ficar em destaque' },
  maximo: { type: 'number', description: 'medidor: o máximo (100 ou a meta)' },
  eixo_x: { type: 'string', description: 'nome do eixo horizontal (obrigatório na dispersao)' },
  eixo_y: { type: 'string', description: 'nome do eixo vertical (obrigatório na dispersao)' },
  solto: { type: 'boolean', description: 'true: janela solta que ele arrasta (pedido "solto", "numa janela", vários gráficos juntos)' },
  slides: { type: 'array', items: { type: 'object', properties: { titulo: { type: 'string' }, pontos: { type: 'array', items: { type: 'string' } }, grafico,
    fala: { type: 'string', description: 'o que o Jarvis fala neste slide quando apresenta: 2 a 4 frases naturais, sem ler os pontos palavra por palavra' } }, required: ['titulo'] },
  description: 'slides: até 10, cada um com título, até 5 pontos curtos, se ajudar um gráfico, e a fala de quem apresenta' },
  fontes: { type: 'array', items: { type: 'object', properties: { nome: { type: 'string' }, url: { type: 'string' } }, required: ['nome'] }, description: 'de onde vieram os números (nome e endereço)' },
};

const lista = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);
const numero = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : (typeof v === 'string' && v.trim() && Number.isFinite(Number(v.replace(',', '.'))) ? Number(v.replace(',', '.')) : null));

/** O gráfico em si (sem título e fontes): só o que a tela sabe desenhar. Devolve { g } ou { erro }. */
function limpaGrafico(g = {}) {
  const tipo = TIPOS_DE_GRAFICO.includes(g.tipo) ? g.tipo : null;
  if (!tipo) return { erro: `tipo de gráfico desconhecido (use: ${TIPOS_DE_GRAFICO.join(', ')})` };
  const unidade = texto(g.unidade, 12);
  const eixos = { eixo_x: texto(g.eixo_x, 40), eixo_y: texto(g.eixo_y, 40) };
  if (tipo === 'numeros' || tipo === 'medidor') {
    const numeros = lista(g.numeros, tipo === 'medidor' ? 1 : 4).map((n) => ({ rotulo: texto(n?.rotulo, 80), valor: numero(n?.valor), detalhe: texto(n?.detalhe, 120) }))
      .filter((n) => n.rotulo && n.valor !== null);
    if (!numeros.length) return { erro: 'faltam os números: mande numeros com rotulo e valor' };
    if (tipo === 'medidor') {
      const maximo = numero(g.maximo) ?? (unidade === '%' ? 100 : null);
      if (!(maximo > 0)) return { erro: 'o medidor precisa do maximo (a meta, ou 100 para porcentagem)' };
      return { g: { tipo, numeros, unidade, maximo } };
    }
    return { g: { tipo, numeros, unidade } };
  }
  const limite = Math.min(MAX_SERIES, LIMITE_DE_SERIES[tipo] || MAX_SERIES);
  if (tipo === 'dispersao') {
    const series = lista(g.series, limite).map((s) => ({
      nome: texto(s?.nome, 60) || 'Valores',
      pontos: lista(s?.pontos, 300).map((p) => [numero(p?.[0]), numero(p?.[1])]).filter(([x, y]) => x !== null && y !== null),
    })).filter((s) => s.pontos.length);
    if (!series.length) return { erro: 'faltam os pontos: na dispersao, cada série traz pontos [x, y]' };
    if (!eixos.eixo_x || !eixos.eixo_y) return { erro: 'na dispersao, diga o que é cada eixo (eixo_x e eixo_y)' };
    return { g: { tipo, series, unidade, ...eixos } };
  }
  if (Array.isArray(g.series) && g.series.length > limite) {
    return { erro: `${tipo} aguenta até ${limite} série${limite > 1 ? 's' : ''}; ${tipo === 'pizza' || tipo === 'funil' ? 'mande uma série só' : 'divida em dois gráficos ou use barras'}` };
  }
  const rotulos = lista(g.rotulos, MAX_ROTULOS).map((r) => texto(r, 60));
  const series = lista(g.series, limite).map((s) => ({
    nome: texto(s?.nome, 60) || 'Valor',
    valores: rotulos.map((_, i) => numero(s?.valores?.[i])),
  })).filter((s) => s.valores.some((v) => v !== null));
  if (!rotulos.length || !series.length) return { erro: 'faltam dados: mande rotulos e series (cada série com um valor por rótulo)' };
  if (tipo === 'pizza') {
    if (rotulos.length > 6) return { erro: 'pizza com mais de 6 fatias não se lê: use barras' };
    if (series[0].valores.some((v) => v !== null && v < 0)) return { erro: 'pizza não aceita valor negativo: use barras' };
  }
  if (tipo === 'radar' && rotulos.length < 3) return { erro: 'radar precisa de pelo menos 3 quesitos (rotulos): com menos, use barras' };
  return { g: { tipo, rotulos, series, unidade, ...eixos } };
}

/**
 * O que o modelo pediu para mostrar, no formato que a tela desenha.
 * Devolve { visual } ou { erro } (o erro volta para o modelo corrigir).
 */
export function montaVisual(args = {}) {
  const tipo = TIPOS_DE_VISUAL.includes(args.tipo) ? args.tipo : null;
  if (!tipo) return { erro: `tipo precisa ser um destes: ${TIPOS_DE_VISUAL.join(', ')}` };
  const base = {
    tipo,
    ...(args.solto && tipo === 'slides' ? { solto: true } : {}),
    titulo: texto(args.titulo, 140),
    subtitulo: texto(args.subtitulo, 200),
    destaque: texto(args.destaque, 60),
    fontes: lista(args.fontes, 5).map((f) => ({ nome: texto(f?.nome, 80), url: /^https?:\/\//i.test(String(f?.url || '')) ? texto(f.url, 400) : '' })).filter((f) => f.nome),
  };
  if (!base.titulo) return { erro: 'falta o título (a conclusão em uma frase)' };
  if (tipo === 'slides') {
    const slides = lista(args.slides, MAX_SLIDES).map((s) => ({
      titulo: texto(s?.titulo, 120),
      pontos: lista(s?.pontos, 5).map((p) => texto(p, 160)).filter(Boolean),
      grafico: s?.grafico ? (limpaGrafico(s.grafico).g || null) : null,
      fala: texto(s?.fala, 700),
    })).filter((s) => s.titulo);
    if (!slides.length) return { erro: 'slides vazios: mande ao menos um slide com título' };
    return { visual: { ...base, slides } };
  }
  const { g, erro } = limpaGrafico({ ...args, tipo });
  if (erro) return { erro };
  return { visual: { ...base, ...g, ...(args.solto ? { solto: true } : {}) } };
}

/** Todos os números que um visual põe na tela. */
export function numerosDoVisual(v) {
  const saida = [];
  const doGrafico = (g) => {
    if (!g) return;
    // O máximo do medidor é uma meta: também precisa ter vindo de algum lugar (100% não).
    if (g.tipo === 'medidor' && !(g.unidade === '%' && g.maximo === 100)) saida.push(g.maximo);
    for (const n of g.numeros || []) saida.push(n.valor);
    for (const s of g.series || []) {
      for (const x of s.valores || []) if (x !== null) saida.push(x);
      for (const [x, y] of s.pontos || []) saida.push(x, y);
    }
  };
  doGrafico(v);
  for (const s of v.slides || []) doGrafico(s.grafico);
  return saida;
}

/**
 * Os números que aparecem num texto. "1.234.567", "52,3", "52.3" e
 * "1,234" são ambíguos entre o jeito brasileiro e o americano: entram os
 * dois jeitos.
 */
export function numerosDe(t) {
  const achados = new Set();
  for (const [bruto] of String(t || '').matchAll(/\d+(?:[.,]\d+)*/g)) {
    const br = Number(bruto.replace(/\./g, '').replace(',', '.'));
    const us = Number(bruto.replace(/,/g, ''));
    if (Number.isFinite(br)) achados.add(br);
    if (Number.isFinite(us)) achados.add(us);
    // "52.300" no jeito brasileiro também pode ser 52,3 escrito à americana
    if (/^\d+\.\d+$/.test(bruto)) achados.add(Number(bruto));
  }
  return [...achados];
}

/** Os números do visual que NÃO aparecem no que foi lido. Arredondar pode; inventar não. */
export function numerosSemFonte(visual, lido) {
  const conhecidos = numerosDe(lido);
  const bate = (v) => conhecidos.some((c) => {
    if (Math.abs(c - v) <= Math.max(0.051, Math.abs(v) * 0.001)) return true;
    // "58,3 milhões" escrito como 58.300.000 na página (ou o contrário)
    return [1e3, 1e6, 1e9].some((m) => Math.abs(c - v * m) <= Math.abs(v * m) * 0.006 || Math.abs(c * m - v) <= Math.abs(v) * 0.006);
  });
  return [...new Set(numerosDoVisual(visual))].filter((v) => !bate(v));
}
