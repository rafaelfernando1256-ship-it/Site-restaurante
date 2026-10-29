/**
 * O PALCO DO JARVIS — o que ele mostra: números de destaque, os gráficos
 * (Apache ECharts, em jarvis-graficos.js), tabela, slides, a página de um
 * projeto, um print e o 3D. Serve para a tela cheia e para as janelas soltas.
 *
 * Tudo que vem do modelo (rótulos, títulos, fontes) entra como texto
 * (textContent), nunca como HTML.
 */
import { desenhaGrafico, TIPOS_ECHARTS, valorComUnidade } from './jarvis-graficos.js';

/* ── pequenas ferramentas ───────────────────────────────────────── */
function el(tag, classe, filhos = [], atributos = {}) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  for (const [k, v] of Object.entries(atributos)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  for (const f of [].concat(filhos)) if (f !== null && f !== undefined && f !== false) e.append(f instanceof Node ? f : document.createTextNode(String(f)));
  return e;
}
/* ── a dica (tooltip): o valor manda, o rótulo acompanha ───────── */
function dica(palco) {
  const caixa = el('div', 'jv-dica', [], { role: 'status' });
  caixa.hidden = true;
  palco.append(caixa);
  const poe = (linhas, x, y) => {
    caixa.replaceChildren(...linhas.map(({ valor, nome, cor, linha }) => el('div', 'jv-dica-linha', [
      cor ? el('i', linha ? 'traco' : 'bloco', [], { style: `background:${cor}` }) : null,
      el('strong', '', valor), nome ? el('span', '', nome) : null,
    ])));
    caixa.hidden = false;
    const caixaPalco = palco.getBoundingClientRect();
    const w = caixa.offsetWidth; const h = caixa.offsetHeight;
    let left = x - caixaPalco.left + 14; let top = y - caixaPalco.top - h - 10;
    if (left + w > palco.clientWidth - 8) left = x - caixaPalco.left - w - 14;
    if (top < 8) top = y - caixaPalco.top + 16;
    caixa.style.left = `${Math.max(8, left)}px`; caixa.style.top = `${top + palco.scrollTop}px`;
  };
  return {
    em: (alvo, linhas) => {
      alvo.addEventListener('pointermove', (e) => poe(linhas, e.clientX, e.clientY));
      alvo.addEventListener('pointerleave', () => { caixa.hidden = true; });
      alvo.addEventListener('focus', () => { const r = alvo.getBoundingClientRect(); poe(linhas, r.right, r.top); });
      alvo.addEventListener('blur', () => { caixa.hidden = true; });
    },
    poe,
    some: () => { caixa.hidden = true; },
  };
}

/* ── números de destaque ────────────────────────────────────────── */
function numeros(g, destaque) {
  const pct = g.unidade === '%' && g.numeros.length >= 2 && g.numeros.every((n) => n.valor >= 0 && n.valor <= 100);
  const principal = destaque
    ? g.numeros.find((n) => n.rotulo.toLowerCase() === destaque.toLowerCase())
    : (pct ? g.numeros.reduce((a, b) => (b.valor > a.valor ? b : a)) : null);
  return el('div', `jv-numeros n${g.numeros.length}`, g.numeros.map((n) => el('div', `jv-numero${n === principal ? ' principal' : ''}`, [
    el('span', 'rotulo', n.rotulo),
    el('span', 'valor', valorComUnidade(n.valor, g.unidade)),
    pct ? el('span', 'medidor', [el('i', '', [], { style: `width:${n.valor}%` })], { 'aria-hidden': 'true' }) : null,
    n.detalhe ? el('span', 'detalhe', n.detalhe) : null,
  ])));
}

/* ── tabela (também é a versão acessível de todo gráfico) ───────── */
function tabela(g) {
  if (g.tipo === 'dispersao') {
    return el('table', 'jv-tabela', [
      el('thead', '', el('tr', '', [el('th', '', g.series.length > 1 ? 'Série' : ''), el('th', '', g.eixo_x, { scope: 'col' }), el('th', '', g.eixo_y, { scope: 'col' })])),
      el('tbody', '', g.series.flatMap((s) => s.pontos.map(([x, y]) => el('tr', '', [el('th', '', g.series.length > 1 ? s.nome : '', { scope: 'row' }),
        el('td', '', valorComUnidade(x)), el('td', '', valorComUnidade(y, g.unidade))])))),
    ]);
  }
  if (g.tipo === 'numeros' || g.tipo === 'medidor') {
    return el('table', 'jv-tabela', [el('tbody', '', g.numeros.map((n) => el('tr', '', [el('th', '', n.rotulo, { scope: 'row' }), el('td', '', valorComUnidade(n.valor, g.unidade)), el('td', 'nota', n.detalhe || '')])))]);
  }
  return el('table', 'jv-tabela', [
    el('thead', '', el('tr', '', [el('th', '', ''), ...g.series.map((s) => el('th', '', s.nome, { scope: 'col' }))])),
    el('tbody', '', g.rotulos.map((r, i) => el('tr', '', [el('th', '', r, { scope: 'row' }), ...g.series.map((s) => el('td', '', valorComUnidade(s.valores[i], g.unidade)))]))),
  ]);
}

/** Uma frase que descreve o gráfico, para quem não enxerga a tela. */
function descricao(g) {
  if (g.tipo === 'medidor') return `${g.numeros[0].rotulo}: ${valorComUnidade(g.numeros[0].valor, g.unidade)} de ${valorComUnidade(g.maximo, g.unidade)}`;
  if (g.tipo === 'dispersao') return `Dispersão de ${g.eixo_y} por ${g.eixo_x}, ${g.series.map((s) => `${s.nome}: ${s.pontos.length} pontos`).join('; ')}`;
  return `Gráfico (${g.tipo}) de ${g.series.map((s) => s.nome).join(', ')} em ${g.rotulos.length} categorias. A tabela tem os valores.`;
}

function grafico(g, destaque) {
  if (!g) return null;
  if (g.tipo === 'numeros') return numeros(g, destaque);
  if (g.tipo === 'tabela') return tabela(g);
  if (TIPOS_ECHARTS.includes(g.tipo)) {
    const caixa = el('div', `jv-echart t-${g.tipo}`, [], { role: 'img', 'aria-label': descricao(g) });
    // Sem o ECharts (arquivo faltando), a tabela mostra os mesmos números.
    desenhaGrafico(caixa, g, destaque).catch(() => caixa.replaceChildren(tabela(g)));
    return caixa;
  }
  return null;
}

/** Desliga os gráficos de dentro de `raiz` (antes de trocar o que está na tela). */
export function soltaGraficos(raiz) {
  for (const c of raiz.querySelectorAll('.jv-echart')) c.jvSolta?.();
}

function fontes(lista) {
  if (!lista?.length) return null;
  return el('p', 'jv-fontes', [lista.length > 1 ? 'Fontes: ' : 'Fonte: ', ...lista.flatMap((f, i) => [
    i ? ', ' : '', f.url ? el('a', '', f.nome, { href: f.url, target: '_blank', rel: 'noopener noreferrer' }) : f.nome])]);
}

/**
 * Desenha `visual` dentro de `palco`. Devolve { proximo, anterior, slides }
 * para a voz e as setas passarem os slides.
 */
export function desenhaVisual(palco, visual, { compacto = false } = {}) {
  soltaGraficos(palco);
  palco.replaceChildren();
  palco.classList.toggle('compacto', compacto);
  palco.dataset.tipo = visual.tipo;
  const d = dica(palco);
  // Na janela solta o título já está na barra de cima: aqui só o subtítulo.
  const topo = compacto
    ? (visual.subtitulo ? el('header', 'jv-palco-topo', el('p', '', visual.subtitulo)) : null)
    : el('header', 'jv-palco-topo', [el('h2', '', visual.titulo), visual.subtitulo ? el('p', '', visual.subtitulo) : null]);

  if (visual.tipo === 'cena3d') {
    // O 3D só carrega (three.js) quando aparece um: o painel continua leve.
    const tela = el('div', 'jv-3d', [], { role: 'img', 'aria-label': `Modelo 3D: ${visual.subtitulo || visual.titulo}` });
    palco.append(
      el('header', 'jv-palco-topo', [el('h2', '', visual.titulo), visual.subtitulo ? el('p', '', visual.subtitulo) : null]),
      tela,
      el('footer', 'jv-palco-pe jv-3d-pe', [
        el('p', 'jv-3d-conta', visual.contagem || ''),
        visual.avisos?.length ? el('p', 'jv-3d-aviso', `${visual.avisos.join('. ')}.`) : null,
        el('p', 'jv-3d-dica', 'Diga: “mostra de cima”, “entra”, “dá uma volta”, “olha a parede do fundo”. Ou arraste com o mouse.'),
      ]),
    );
    const cena = import('./jarvis-3d.js')
      .then(({ montaCena3D }) => montaCena3D(tela, visual.cena, {
        aoApontar: (nome, x, y) => (nome ? d.poe([{ valor: nome, nome: '' }], x, y) : d.some()) }))
      .catch((e) => { tela.replaceChildren(el('p', 'jv-3d-erro', `Este navegador não abriu o 3D (${e.message}). Confira se a aceleração de hardware do Chrome está ligada.`)); return null; });
    return { slides: 0, cena };
  }

  if (visual.tipo === 'imagem') {
    palco.append(
      el('header', 'jv-palco-topo', [el('h2', '', visual.titulo), visual.subtitulo ? el('p', '', visual.subtitulo) : null]),
      el('div', 'jv-imagem', el('img', '', [], { src: visual.url, alt: visual.titulo })),
      visual.legenda ? el('p', 'jv-imagem-legenda', visual.legenda) : null,
    );
    return { slides: 0 };
  }

  if (visual.tipo === 'projeto') {
    const quadro = el('iframe', 'jv-projeto', [], { src: visual.url, title: visual.titulo,
      sandbox: 'allow-scripts allow-popups allow-popups-to-escape-sandbox', referrerpolicy: 'no-referrer' });
    palco.append(el('header', 'jv-palco-topo linha', [el('h2', '', visual.titulo),
      el('a', 'jv-link', 'Abrir em outra aba', { href: visual.url, target: '_blank', rel: 'noopener' })]), quadro);
    return { slides: 0 };
  }

  if (visual.tipo === 'slides') {
    const corpo = el('div', 'jv-slide');
    const conta = el('span', 'jv-slide-conta', '', { 'aria-live': 'polite' });
    const antes = el('button', 'jv-bt', 'Anterior', { type: 'button' });
    const depois = el('button', 'jv-bt', 'Próximo', { type: 'button' });
    let atual = 0;
    const vai = (i) => {
      atual = Math.max(0, Math.min(visual.slides.length - 1, i));
      const s = visual.slides[atual];
      d.some();
      // O layout sai do conteúdo: capa (só título), gráfico grande, números em destaque,
      // texto ao lado do gráfico, ou só os pontos.
      corpo.dataset.layout = !s.grafico && s.pontos.length <= 1 ? 'capa'
        : s.grafico && s.grafico.tipo === 'numeros' ? 'numeros'
          : s.grafico && s.pontos.length ? 'lado-a-lado'
            : s.grafico ? 'grafico' : 'pontos';
      const titulo = el('h3', '', s.titulo);
      const pontos = s.pontos.length ? el('ul', '', s.pontos.map((p) => el('li', '', p))) : null;
      const g = s.grafico ? el('div', 'jv-slide-grafico', grafico(s.grafico, visual.destaque)) : null;
      soltaGraficos(corpo);
      corpo.replaceChildren(...(corpo.dataset.layout === 'lado-a-lado'
        ? [titulo, el('div', 'jv-slide-lado', [pontos, g])]
        : [titulo, pontos, g]).filter(Boolean));
      corpo.classList.remove('entra'); void corpo.offsetWidth; corpo.classList.add('entra');
      conta.textContent = `${atual + 1} de ${visual.slides.length}`;
      antes.disabled = atual === 0; depois.disabled = atual === visual.slides.length - 1;
    };
    antes.addEventListener('click', () => vai(atual - 1));
    depois.addEventListener('click', () => vai(atual + 1));
    palco.append(el('header', 'jv-palco-topo', [el('p', 'jv-slide-deck', visual.titulo)]), corpo,
      el('footer', 'jv-palco-pe', [fontes(visual.fontes), el('div', 'jv-slide-nav', [antes, conta, depois])]));
    vai(0);
    return { slides: visual.slides.length, proximo: () => vai(atual + 1), anterior: () => vai(atual - 1), vai, atual: () => atual };
  }

  const g = grafico(visual, visual.destaque);
  const mostraTabela = visual.tipo !== 'tabela' && visual.tipo !== 'numeros';
  const vista = el('div', 'jv-tabela-caixa'); vista.hidden = true;
  const botao = mostraTabela ? el('button', 'jv-bt', 'Ver como tabela', { type: 'button', 'aria-expanded': 'false' }) : null;
  botao?.addEventListener('click', () => {
    vista.hidden = !vista.hidden;
    if (!vista.hidden && !vista.firstChild) vista.append(tabela(visual));
    botao.textContent = vista.hidden ? 'Ver como tabela' : 'Esconder a tabela';
    botao.setAttribute('aria-expanded', String(!vista.hidden));
  });
  // O "bom dia" traz a previsão do tempo numa linha, em cima dos números.
  const tempo = visual.tempo ? el('p', 'jv-tempo', visual.tempo) : null;
  palco.append(...[topo, tempo, el('div', 'jv-palco-corpo', [g, vista]), el('footer', 'jv-palco-pe', [fontes(visual.fontes), botao])].filter(Boolean));
  return { slides: 0 };
}
