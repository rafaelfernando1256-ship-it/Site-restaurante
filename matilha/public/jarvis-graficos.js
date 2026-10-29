/**
 * OS GRÁFICOS DO JARVIS — Apache ECharts (github.com/apache/echarts,
 * licença Apache 2.0), instalado em /vendor/echarts.
 *
 * O modelo só manda o tipo e os dados; aqui é que se decide como fica.
 * Todos os gráficos seguem as mesmas regras:
 *   · as 8 cores categóricas da paleta validada para o fundo do Jarvis
 *     (#121826), sempre na mesma ordem; a cor segue a série, nunca a posição;
 *   · marcas finas: barras de até 24 px com ponta arredondada de 4 px, linhas
 *     de 2 px, pontos de 8 px com anel da cor do fundo, 2 px de fundo entre
 *     fatias e segmentos;
 *   · grade e eixos em linha fina e quieta; texto nunca na cor da série;
 *   · legenda sempre que houver duas séries ou mais; rótulo de valor só onde
 *     ajuda (a ponta, o maior, o último), o resto fica na dica e na tabela;
 *   · um eixo só (nunca duas escalas no mesmo gráfico).
 */
const PALETA = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
// Etapas ordenadas (funil): um tom só, do claro para o escuro, sem passar do ponto que some no fundo.
const RAMPA = ['#86b6ef', '#5598e7', '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#184f95'];
const FUNDO = '#121826';
const TEXTO = '#e6eefc';
const SUAVE = '#9aa3b8';
const APAGADO = '#6b7489';
const GRADE = '#222b40';
const EIXO = '#39445e';
const CINZA_DADO = '#46506a';
const FONTE = '"Manrope", "DM Sans", system-ui, sans-serif';

let carregando = null;
/** O ECharts só carrega quando aparece o primeiro gráfico. */
export const carregaECharts = () => (carregando ??= import('/vendor/echarts/echarts.esm.min.js'));

const fmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const fmtCurto = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
/** 52,3% · R$ 1.234 · 1.234 votos · 12,9 mi (nos eixos). */
export function valorComUnidade(v, unidade = '', curto = false) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const n = curto && Math.abs(v) >= 10_000 ? fmtCurto.format(v) : fmt.format(v);
  const u = String(unidade || '').trim();
  if (!u) return n;
  if (u === '%') return `${n}%`;
  if (/^(R\$|US\$|\$|€)$/.test(u)) return `${u} ${n}`;
  return `${n} ${u}`;
}
/** No eixo, só a unidade curta (%, R$); palavra ("alunos") fica no rótulo. */
const doEixo = (u) => (/^(%|R\$|US\$|\$|€)$/.test(String(u || '').trim()) ? u : '');

const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ── a base comum ──────────────────────────────────────────────── */
function base(g) {
  return {
    backgroundColor: 'transparent',
    color: PALETA,
    animation: !quieto(),
    animationDuration: 600,
    textStyle: { fontFamily: FONTE, color: TEXTO, fontSize: 13 },
    aria: { enabled: true, decal: { show: false } },
    tooltip: {
      backgroundColor: '#0d1220', borderColor: '#28324c', borderWidth: 1, padding: [8, 12],
      textStyle: { color: TEXTO, fontFamily: FONTE, fontSize: 13 },
      extraCssText: 'border-radius:8px;box-shadow:none',
      valueFormatter: (v) => valorComUnidade(Array.isArray(v) ? v[1] : v, g.unidade),
    },
    legend: (g.series?.length || 0) >= 2 ? {
      top: 0, left: 0, itemGap: 18, itemWidth: 12, itemHeight: 8, icon: 'roundRect',
      textStyle: { color: SUAVE, fontFamily: FONTE, fontSize: 13 },
      inactiveColor: '#3a4256',
    } : { show: false },
  };
}
const eixoValor = (g, extra = {}) => ({
  type: 'value',
  axisLine: { show: false }, axisTick: { show: false },
  splitLine: { lineStyle: { color: GRADE, width: 1, type: 'solid' } },
  axisLabel: { color: APAGADO, fontFamily: FONTE, fontSize: 12, formatter: (v) => valorComUnidade(v, doEixo(g.unidade), true) },
  ...extra,
});
const eixoCategoria = (g, extra = {}) => ({
  type: 'category', data: g.rotulos,
  axisLine: { lineStyle: { color: EIXO, width: 1 } }, axisTick: { show: false },
  axisLabel: { color: SUAVE, fontFamily: FONTE, fontSize: 12, hideOverlap: true },
  ...extra,
});
const nomeDoEixo = (nome) => (nome ? { name: nome, nameTextStyle: { color: APAGADO, fontFamily: FONTE, fontSize: 12 } } : {});
const grade = (g) => ({ left: 4, right: 28, top: (g.series?.length || 0) >= 2 ? 40 : 16, bottom: 4, containLabel: true });

/** Qual rótulo é o destaque (só com uma série: o resto fica cinza). */
const indiceDoDestaque = (g, destaque) => (g.series?.length === 1 && destaque
  ? g.rotulos.findIndex((r) => r.toLowerCase() === String(destaque).toLowerCase()) : -1);

/** Rótulo de valor: em todas quando são poucas; senão, só no maior e no último de cada série. */
function quaisRotular(g) {
  if (g.rotulos.length * g.series.length <= 8) return () => true;
  return (s, i) => {
    const vals = s.valores;
    const iMax = vals.indexOf(Math.max(...vals.filter((v) => v !== null)));
    let iUlt = vals.length - 1; while (iUlt > 0 && vals[iUlt] === null) iUlt -= 1;
    return i === iMax || i === iUlt;
  };
}

/* ── os tipos ──────────────────────────────────────────────────── */
function barrasOuColunas(g, destaque, { deitado, empilhado }) {
  const realce = indiceDoDestaque(g, destaque);
  const rotular = quaisRotular(g);
  const ultima = g.series.length - 1;
  const raio = (k) => {
    if (empilhado && k !== ultima) return 0;
    return deitado ? [0, 4, 4, 0] : [4, 4, 0, 0];
  };
  return {
    ...base(g),
    tooltip: { ...base(g).tooltip, trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(154,163,184,.08)' } } },
    grid: grade(g),
    [deitado ? 'yAxis' : 'xAxis']: eixoCategoria(g, { inverse: deitado, ...nomeDoEixo(deitado ? g.eixo_y : g.eixo_x) }),
    [deitado ? 'xAxis' : 'yAxis']: eixoValor(g, nomeDoEixo(deitado ? g.eixo_x : g.eixo_y)),
    series: g.series.map((s, k) => ({
      type: 'bar', name: s.nome, stack: empilhado ? 'total' : undefined,
      barMaxWidth: 24, barGap: '12%', barCategoryGap: '36%',
      // 2 px de fundo entre os segmentos empilhados (1 px de cada lado).
      itemStyle: { borderRadius: raio(k), ...(empilhado ? { borderColor: FUNDO, borderWidth: 1 } : {}) },
      data: s.valores.map((v, i) => ({
        value: v,
        itemStyle: realce >= 0 && i !== realce ? { color: CINZA_DADO } : undefined,
        label: {
          show: !empilhado && v !== null && rotular(s, i),
          position: deitado ? 'right' : 'top', distance: 6,
          color: TEXTO, fontFamily: FONTE, fontSize: 12.5, fontWeight: 500,
          formatter: () => valorComUnidade(v, g.unidade, true),
        },
      })),
      emphasis: { focus: 'series' },
    })),
  };
}

function linhaOuArea(g, destaque, { area }) {
  const todos = g.series.flatMap((s) => s.valores.filter((v) => v !== null));
  const minimo = Math.min(...todos); const maximo = Math.max(...todos);
  // Começa no zero, a não ser que tudo esteja longe dele (aí o zero achataria a curva). Área sempre no zero.
  const longeDoZero = !area && minimo > 0 && minimo > maximo * 0.6;
  return {
    ...base(g),
    tooltip: { ...base(g).tooltip, trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: SUAVE, width: 1, type: 'solid' } } },
    grid: { ...grade(g), right: 72 },
    xAxis: eixoCategoria(g, { boundaryGap: false, ...nomeDoEixo(g.eixo_x) }),
    yAxis: eixoValor(g, { scale: longeDoZero, ...nomeDoEixo(g.eixo_y) }),
    series: g.series.map((s, k) => ({
      type: 'line', name: s.nome, data: s.valores, connectNulls: false,
      lineStyle: { width: 2, cap: 'round', join: 'round' },
      showSymbol: false, symbol: 'circle', symbolSize: 8,
      itemStyle: { borderColor: FUNDO, borderWidth: 2 },
      areaStyle: area ? { opacity: 0.1 } : undefined,
      // O valor no fim da linha (o dado mais recente).
      endLabel: { show: true, color: TEXTO, fontFamily: FONTE, fontSize: 12.5, fontWeight: 500, distance: 8,
        formatter: (p) => valorComUnidade(p.value, g.unidade, true) },
      labelLayout: { moveOverlap: 'shiftY' },
      emphasis: { focus: 'series' },
      z: g.series.length - k,
    })),
  };
}

function pizza(g) {
  const s = g.series[0];
  return {
    ...base({ ...g, series: g.rotulos }),
    tooltip: { ...base(g).tooltip, trigger: 'item', formatter: (p) => `${p.marker}${p.name}<br><b>${valorComUnidade(p.value, g.unidade)}</b> · ${fmt.format(p.percent)}%` },
    legend: { ...base({ series: [1, 2] }).legend, top: 'auto', bottom: 0, left: 'center' },
    series: [{
      type: 'pie', radius: ['48%', '70%'], center: ['50%', '46%'], avoidLabelOverlap: true,
      itemStyle: { borderColor: FUNDO, borderWidth: 2, borderRadius: 4 },
      label: { color: TEXTO, fontFamily: FONTE, fontSize: 12.5, formatter: (p) => `${p.name}\n${fmt.format(p.percent)}%` },
      labelLine: { lineStyle: { color: EIXO }, length: 10, length2: 12 },
      data: g.rotulos.map((r, i) => ({ name: r, value: s.valores[i] })).filter((d) => d.value !== null),
    }],
  };
}

function funil(g) {
  const s = g.series[0];
  return {
    ...base(g),
    tooltip: { ...base(g).tooltip, trigger: 'item', formatter: (p) => `${p.name}<br><b>${valorComUnidade(p.value, g.unidade)}</b>` },
    series: [{
      type: 'funnel', sort: 'none', gap: 2, left: '8%', right: '28%', top: 8, bottom: 8, minSize: '12%',
      itemStyle: { borderWidth: 0 },
      label: { position: 'right', color: TEXTO, fontFamily: FONTE, fontSize: 13, formatter: (p) => `${p.name}  ${valorComUnidade(p.value, g.unidade, true)}` },
      labelLine: { lineStyle: { color: EIXO } },
      data: g.rotulos.map((r, i) => ({ name: r, value: s.valores[i], itemStyle: { color: RAMPA[Math.min(RAMPA.length - 1, i)] } })),
    }],
  };
}

function medidor(g) {
  const n = g.numeros[0];
  const fracao = Math.max(0, Math.min(1, n.valor / g.maximo));
  return {
    ...base(g),
    tooltip: { show: false },
    series: [{
      type: 'gauge', startAngle: 210, endAngle: -30, min: 0, max: g.maximo, radius: '92%', center: ['50%', '58%'],
      progress: { show: true, width: 14, roundCap: true, itemStyle: { color: PALETA[0] } },
      // O trilho é um tom do mesmo azul, mais escuro: a parte que falta continua lendo como "o resto da meta".
      axisLine: { roundCap: true, lineStyle: { width: 14, color: [[1, '#1c2a44']] } },
      pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      anchor: { show: false },
      title: { offsetCenter: [0, '34%'], color: SUAVE, fontFamily: FONTE, fontSize: 14 },
      detail: { offsetCenter: [0, '0%'], valueAnimation: !quieto(), color: TEXTO, fontFamily: FONTE, fontSize: 40, fontWeight: 600,
        formatter: () => valorComUnidade(n.valor, g.unidade) },
      data: [{ value: n.valor, name: `${n.rotulo} · ${fmt.format(fracao * 100)}% de ${valorComUnidade(g.maximo, g.unidade)}` }],
    }],
  };
}

function radar(g) {
  const maximo = Math.max(...g.series.flatMap((s) => s.valores.filter((v) => v !== null)), 0);
  return {
    ...base(g),
    tooltip: { ...base(g).tooltip, trigger: 'item' },
    radar: {
      indicator: g.rotulos.map((r) => ({ name: r, max: maximo * 1.1 || 1 })),
      radius: '66%', center: ['50%', '56%'], splitNumber: 4,
      axisName: { color: SUAVE, fontFamily: FONTE, fontSize: 12.5 },
      splitLine: { lineStyle: { color: GRADE } }, splitArea: { show: false }, axisLine: { lineStyle: { color: GRADE } },
    },
    series: [{
      type: 'radar', symbol: 'circle', symbolSize: 8,
      data: g.series.map((s) => ({ name: s.nome, value: s.valores.map((v) => v ?? 0),
        lineStyle: { width: 2 }, areaStyle: { opacity: 0.1 }, itemStyle: { borderColor: FUNDO, borderWidth: 2 } })),
    }],
  };
}

function dispersao(g) {
  return {
    ...base(g),
    tooltip: { ...base(g).tooltip, trigger: 'item',
      formatter: (p) => `${p.marker}${g.series.length > 1 ? `${p.seriesName}<br>` : ''}${g.eixo_x}: <b>${fmt.format(p.value[0])}</b><br>${g.eixo_y}: <b>${valorComUnidade(p.value[1], g.unidade)}</b>` },
    grid: { ...grade(g), bottom: 28 },
    xAxis: eixoValor({ unidade: '' }, { scale: true, ...nomeDoEixo(g.eixo_x), nameLocation: 'middle', nameGap: 28 }),
    yAxis: eixoValor(g, { scale: true, ...nomeDoEixo(g.eixo_y) }),
    series: g.series.map((s) => ({
      type: 'scatter', name: s.nome, data: s.pontos, symbolSize: 10,
      itemStyle: { borderColor: FUNDO, borderWidth: 2, opacity: 0.9 },
      emphasis: { focus: 'series', scale: 1.4 },
    })),
  };
}

/** As opções do ECharts para um gráfico do Jarvis. */
export function opcoesDoGrafico(g, destaque) {
  switch (g.tipo) {
    case 'barras': return barrasOuColunas(g, destaque, { deitado: true });
    case 'colunas': return barrasOuColunas(g, destaque, {});
    case 'empilhado': return barrasOuColunas(g, destaque, { empilhado: true });
    case 'linha': return linhaOuArea(g, destaque, {});
    case 'area': return linhaOuArea(g, destaque, { area: true });
    case 'pizza': return pizza(g);
    case 'funil': return funil(g);
    case 'medidor': return medidor(g);
    case 'radar': return radar(g);
    case 'dispersao': return dispersao(g);
    default: return null;
  }
}
export const TIPOS_ECHARTS = ['barras', 'colunas', 'empilhado', 'linha', 'area', 'pizza', 'funil', 'medidor', 'radar', 'dispersao'];

/**
 * Desenha o gráfico dentro de `caixa` e acompanha o tamanho dela (a janela
 * solta muda de tamanho, a tela gira). Devolve { solta } para desligar.
 */
export async function desenhaGrafico(caixa, g, destaque) {
  const echarts = await carregaECharts();
  if (!caixa.isConnected) return { solta() {} };
  const grafico = echarts.init(caixa, null, { renderer: 'svg', locale: 'EN' });
  grafico.setOption(opcoesDoGrafico(g, destaque));
  const observa = new ResizeObserver(() => grafico.resize());
  observa.observe(caixa);
  caixa.jvSolta = () => { observa.disconnect(); grafico.dispose(); };
  return { solta: caixa.jvSolta };
}
