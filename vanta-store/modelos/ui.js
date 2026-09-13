/**
 * VANTA STORE — componentes.
 * Cada função devolve HTML. Nenhuma sabe em que página está: quem chama
 * passa `raiz` ('' na home, '../' dentro de /produto e /categoria).
 */
import { LOJA } from '../conteudo/site.js';
import { desconto, imagensDe, marca, categoria } from '../conteudo/produtos.js';

export function esc(v = '') {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export const cls = (...xs) => xs.filter(Boolean).join(' ');
export const atraso = (i = 0, passo = 0.04) =>
  i ? ` style="--atraso:${(i * passo).toFixed(3)}s"` : '';

/** 89.9 → "R$ 89,90" */
export const moeda = (n) =>
  'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d),)/g, '.');

/** Parcelamento respeitando a parcela mínima da loja. */
export function parcelas(preco) {
  const n = Math.max(1, Math.min(LOJA.parcelas, Math.floor(preco / LOJA.parcelaMinima)));
  return n > 1 ? `${n}x de ${moeda(preco / n)} sem juros` : 'à vista';
}
export const pix = (preco) => moeda(preco * 0.95);

/* ── Ícones (inline: zero requisição) ─────────────────────── */
const svg = (d, extra = '') =>
  `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ` +
  `stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;

export const ICO = {
  busca:   svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7"/>'),
  conta:   svg('<circle cx="12" cy="8" r="4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>'),
  favorito: svg('<path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 1 1 19.3 13Z"/>'),
  sacola:  svg('<path d="M6 8h12l-1 12H7Z"/><path d="M9.2 8V6.4a2.8 2.8 0 0 1 5.6 0V8"/>'),
  fechar:  svg('<path d="m6 6 12 12M18 6 6 18"/>'),
  seta:    svg('<path d="M5 12h13"/><path d="m12 5 7 7-7 7"/>'),
  filtro:  svg('<path d="M3 6h18M7 12h10M10 18h4"/>'),
  zoom:    svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.7-3.7M11 8.5v5M8.5 11h5"/>'),
  caminhao: svg('<path d="M3 16V7h11v9M14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'),
  troca:   svg('<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'),
  escudo:  svg('<path d="M12 3 5 6v5c0 4.2 2.9 8.1 7 9 4.1-.9 7-4.8 7-9V6Z"/><path d="m9 12 2 2 4-4"/>'),
  check:   svg('<path d="m5 12 5 5L20 7"/>'),
  whats:   '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm5.84 14.06c-.25.7-1.45 1.33-2 1.41-.53.08-1.18.11-1.9-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5.01-4.36-5.16-4.56-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.53c.28-.3.6-.38.8-.38h.58c.19 0 .44-.07.69.53.25.6.86 2.09.94 2.24.08.15.13.33.02.53-.1.2-.16.33-.31.5-.15.18-.32.4-.46.53-.15.15-.31.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.37 2.45 1.52.3.15.48.13.66-.08.18-.2.76-.88.96-1.19.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.99.3.15.5.22.58.35.07.13.07.75-.18 1.46Z"/></svg>',
};

/* ── Botão ────────────────────────────────────────────────────
   variante: 'tinta' | 'linha' | 'claro' | 'whats' | 'texto'    */
export function botao({ texto, href, tipo, variante = 'tinta', tamanho, externo,
                        extra = '', rotulo, desativado }) {
  const classe = cls('btn', `btn--${variante}`, tamanho && `btn--${tamanho}`);
  const aria = rotulo ? ` aria-label="${esc(rotulo)}"` : '';
  if (tipo === 'button' || desativado) {
    return `<button type="${tipo === 'submit' ? 'submit' : 'button'}" class="${classe}"` +
           `${desativado ? ' disabled' : ''}${aria}${extra}>${texto}</button>`;
  }
  const alvo = externo ? ' target="_blank" rel="noopener"' : '';
  return `<a class="${classe}" href="${esc(href)}"${alvo}${aria}${extra}>${texto}</a>`;
}

/* ── Cabeça de seção ──────────────────────────────────────── */
export function cabeca({ etiqueta, titulo, texto, acao, centro }) {
  return `<header class="${cls('cabeca', centro && 'cabeca--centro')}">
    <div class="cabeca__texto">
      ${etiqueta ? `<p class="rotulo surge">${esc(etiqueta)}</p>` : ''}
      ${titulo ? `<h2 class="titulo surge"${atraso(1)}>${esc(titulo)}</h2>` : ''}
      ${texto ? `<p class="cabeca__apoio surge"${atraso(2)}>${esc(texto)}</p>` : ''}
    </div>
    ${acao ? `<div class="cabeca__acao surge"${atraso(2)}>${acao}</div>` : ''}
  </header>`;
}

export function secao({ id, classe = '', tom = '', conteudo, rotuloAria }) {
  return `<section class="${cls('secao', tom && `secao--${tom}`, classe)}"${
    id ? ` id="${id}"` : ''}${rotuloAria ? ` aria-label="${esc(rotuloAria)}"` : ''}>
    <div class="wrap">${conteudo}</div>
  </section>`;
}

/* ── Selos do produto ─────────────────────────────────────── */
const SELOS = {
  'mais-vendido': ['Mais vendido', 'selo--top'],
  'novo': ['Novo', 'selo--novo'],
  'oferta': ['Oferta', 'selo--off'],
};

export function selos(p) {
  const off = desconto(p);
  const tag = p.tags.find((t) => SELOS[t] && t !== 'oferta');
  const partes = [];
  if (tag) partes.push(`<span class="selo ${SELOS[tag][1]}">${SELOS[tag][0]}</span>`);
  if (off) partes.push(`<span class="selo selo--off">−${off}%</span>`);
  if (!p.estoque) partes.push('<span class="selo selo--fora">Esgotado</span>');
  return partes.length ? `<span class="card__selos">${partes.join('')}</span>` : '';
}

/* ── Cartão de produto ────────────────────────────────────────
   Os dados vão nos data-*: busca, filtros, ordenação e carrinho
   leem daqui, então não existe uma segunda lista no JavaScript. */
export function cartao(p, { raiz = '', i = 0 } = {}) {
  const url = `${raiz}produto/${p.slug}.html`;
  const fotos = imagensDe(p);
  const m = marca(p.marca);
  const cat = categoria(p.categoria);
  const off = desconto(p);
  const busca = [p.nome, p.tipo, m.nome, cat.nome, p.resumo, ...p.cores.map((c) => c.nome)]
    .join(' ').toLowerCase();

  return `<article class="card surge"${atraso(i)}
    data-slug="${p.slug}" data-nome="${esc(p.nome)}" data-cat="${p.categoria}"
    data-tipo="${esc(p.tipo)}" data-marca="${p.marca}" data-preco="${p.preco}"
    data-de="${p.precoDe || ''}" data-off="${off}" data-estoque="${p.estoque ? '1' : '0'}"
    data-tags="${p.tags.join(' ')}" data-tamanhos="${p.tamanhos.join('|')}"
    data-cores="${p.cores.map((c) => c.nome).join('|')}"
    data-img="${raiz}${fotos[0]}" data-url="${url}"
    data-busca="${esc(busca)}">
    <a class="card__foto" href="${url}" tabindex="-1" aria-hidden="true">
      <img src="${raiz}${fotos[0]}" alt="" width="1000" height="1000" loading="lazy" decoding="async">
      <img class="card__foto2" src="${raiz}${fotos[2]}" alt="" width="1000" height="1000" loading="lazy" decoding="async">
      ${selos(p)}
    </a>
    <div class="card__corpo">
      <p class="card__marca">${esc(m.nome)}</p>
      <h3 class="card__nome"><a href="${url}">${esc(p.nome)}</a></h3>
      <p class="card__resumo">${esc(p.resumo)}</p>
      ${p.cores.length ? `<span class="card__cores" aria-label="${p.cores.length} cores disponíveis">
        ${p.cores.map((c) => `<i style="--c:${c.hex}" title="${esc(c.nome)}"></i>`).join('')}
      </span>` : ''}
      <p class="card__preco">
        ${p.precoDe ? `<s>${moeda(p.precoDe)}</s>` : ''}
        <b>${moeda(p.preco)}</b>
        <small>${parcelas(p.preco)}</small>
      </p>
      <div class="card__acoes">
        ${p.estoque
          ? `<button type="button" class="btn btn--tinta btn--peq" data-add
               aria-label="Adicionar ${esc(p.nome)} ao carrinho">Adicionar</button>`
          : `<button type="button" class="btn btn--tinta btn--peq" disabled>Esgotado</button>`}
        <a class="btn btn--linha btn--peq" href="${url}">Ver produto</a>
      </div>
    </div>
  </article>`;
}

/** Grade ou trilho de cartões. */
export const grade = (cartoes, extra = '') => `<div class="grade ${extra}">${cartoes}</div>`;
export const trilho = (cartoes) => `<div class="trilho">${cartoes}</div>`;

/* ── Sanfona ──────────────────────────────────────────────── */
export const sanfona = (itens, base = 'faq') =>
  `<div class="sanfona">${itens.map(([q, a], i) => `
    <div class="sanfona__item surge"${atraso(i, 0.03)}>
      <h3><button type="button" aria-expanded="${i === 0}" aria-controls="${base}-${i}">
        <span>${esc(q)}</span><span class="sanfona__sinal" aria-hidden="true"></span>
      </button></h3>
      <div class="sanfona__resposta" id="${base}-${i}"><p>${esc(a)}</p></div>
    </div>`).join('')}</div>`;

/* ── Ferramentas de catálogo: busca, filtros e ordenação ──── */
export function ferramentas({ categorias, marcas, tipos, tamanhos, cores, faixas, ordenacoes,
                              catFixa }) {
  const bloco = (titulo, nome, itens) => `
    <fieldset class="filtro">
      <legend>${esc(titulo)}</legend>
      <div class="filtro__itens">
        ${itens.map(([v, t, extra]) => `<label class="opcao-filtro">
          <input type="checkbox" name="${nome}" value="${esc(v)}">
          <span>${esc(t)}${extra ? `<i>${esc(extra)}</i>` : ''}</span>
        </label>`).join('')}
      </div>
    </fieldset>`;

  return `<div class="ferramentas">
    <div class="ferramentas__linha">
      <div class="campo-busca">
        <label class="sr" for="lojaBusca">Buscar produtos</label>
        ${ICO.busca}
        <input type="search" id="lojaBusca" placeholder="Buscar por nome, tipo ou marca…"
          autocomplete="off" enterkeyhint="search">
        <button type="button" class="campo-busca__limpar" id="lojaLimpar"
          aria-label="Limpar busca" hidden>${ICO.fechar}</button>
      </div>
      <button type="button" class="btn btn--linha ferramentas__abrir" id="abrirFiltros"
        aria-expanded="false" aria-controls="painelFiltros">
        ${ICO.filtro}Filtros<span class="ferramentas__conta" id="filtrosAtivos" hidden>0</span>
      </button>
      <div class="campo-ordem">
        <label for="lojaOrdem">Ordenar por</label>
        <select id="lojaOrdem">
          ${ordenacoes.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}
        </select>
      </div>
    </div>

    <form class="painel-filtros" id="painelFiltros">
      ${catFixa ? '' : bloco('Categoria', 'categoria', categorias)}
      ${bloco('Tipo', 'tipo', tipos)}
      ${bloco('Marca', 'marca', marcas)}
      ${bloco('Preço', 'faixa', faixas)}
      ${bloco('Tamanho', 'tamanho', tamanhos)}
      ${cores.length ? bloco('Cor', 'cor', cores) : ''}
      ${bloco('Disponibilidade', 'estoque', [['1', 'Somente em estoque']])}
      <div class="painel-filtros__pe">
        <button type="reset" class="btn btn--texto" id="limparFiltros">Limpar tudo</button>
        <button type="button" class="btn btn--tinta" id="aplicarFiltros">Ver resultados</button>
      </div>
    </form>

    <div class="pilulas-ativas" id="pilulasAtivas" hidden></div>
  </div>`;
}

/** Grade do catálogo + estados de carregando, vazio e contagem. */
export const catalogo = (cartoes, titulo = '') => `
  ${titulo ? `<h2 class="so-leitor">${titulo}</h2>` : ''}
  <p class="loja__conta" id="lojaConta" role="status" aria-live="polite"></p>
  <div class="grade grade--loja" id="grade">${cartoes}</div>
  <div class="esqueleto" id="esqueleto" hidden aria-hidden="true">
    ${Array.from({ length: 8 }, () => '<div class="esqueleto__card"></div>').join('')}
  </div>
  <div class="vazio" id="lojaVazio" hidden>
    <p class="vazio__titulo">Nada encontrado</p>
    <p class="vazio__texto">Tente outro termo ou solte alguns filtros.</p>
    <button type="button" class="btn btn--linha" id="lojaReset">Limpar busca e filtros</button>
  </div>`;
