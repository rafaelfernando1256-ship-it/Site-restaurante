/**
 * VOLT — componentes.
 * Cada função devolve HTML. Ninguém aqui sabe em que página está:
 * quem chama passa `raiz` ('' na home, '../' dentro de /produtos).
 */
import { SELOS, desconto, nomeCategoria, imagensDe } from '../conteudo/produtos.js';

export function esc(v = '') {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** 189.9 → "R$ 189,90" */
export const moeda = (n) =>
  'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d),)/g, '.');

export const cls = (...xs) => xs.filter(Boolean).join(' ');
export const atraso = (i = 0, passo = 0.045) =>
  i ? ` style="--atraso:${(i * passo).toFixed(3)}s"` : '';

/** Parcelamento em até 6x, sem cair abaixo de R$ 20 a parcela. */
export function parcelas(preco, max = 6) {
  const n = Math.max(1, Math.min(max, Math.floor(preco / 20)));
  return n > 1 ? `${n}x de ${moeda(preco / n)} sem juros` : 'à vista';
}

/* ── Ícones ───────────────────────────────────────────────── */
export const ICO = {
  whats: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm5.84 14.06c-.25.7-1.45 1.33-2 1.41-.53.08-1.18.11-1.9-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5.01-4.36-5.16-4.56-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.53c.28-.3.6-.38.8-.38h.58c.19 0 .44-.07.69.53.25.6.86 2.09.94 2.24.08.15.13.33.02.53-.1.2-.16.33-.31.5-.15.18-.32.4-.46.53-.15.15-.31.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.37 2.45 1.52.3.15.48.13.66-.08.18-.2.76-.88.96-1.19.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.99.3.15.5.22.58.35.07.13.07.75-.18 1.46Z"/></svg>',
  busca: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg>',
  sacola: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 8h12l-1 12H7L6 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
  fechar: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  raio: '<svg class="raio" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2 5 14h6l-2 8 10-13h-6l1-7Z"/></svg>',
};

/* ── Botão ────────────────────────────────────────────────── */
export function botao({ texto, href, tipo, variante = 'volt', tamanho, externo, extra = '' }) {
  const classe = cls('btn', `btn--${variante}`, tamanho && `btn--${tamanho}`);
  if (tipo === 'button') return `<button type="button" class="${classe}"${extra}>${texto}</button>`;
  const alvo = externo ? ' target="_blank" rel="noopener"' : '';
  return `<a class="${classe}" href="${esc(href)}"${alvo}${extra}>${texto}</a>`;
}

/* ── Estrelas ─────────────────────────────────────────────── */
export function estrelas(nota, n) {
  const cheias = Math.round(nota);
  return `<span class="estrelas" title="Nota ${nota.toFixed(1)} de 5 — dado de demonstração">
    <span class="estrelas__glifos" aria-hidden="true">${'★'.repeat(cheias)}${'☆'.repeat(5 - cheias)}</span>
    <span class="estrelas__n">${nota.toFixed(1)}${n ? ` · ${n}` : ''}</span>
    <span class="sr">Nota ${nota.toFixed(1)} de 5${n ? `, ${n} avaliações` : ''} — dado de demonstração</span>
  </span>`;
}

/* ── Cabeça de seção ──────────────────────────────────────── */
export function cabeca({ n, etiqueta, titulo, texto, acao }) {
  return `<header class="cabeca">
    <div>
      ${etiqueta ? `<p class="rotulo surge">${n ? `<b>${esc(n)}</b>` : ''}${esc(etiqueta)}</p>` : ''}
      ${titulo ? `<h2 class="titulo surge"${atraso(1)}>${esc(titulo)}</h2>` : ''}
      ${texto ? `<p class="cabeca__texto surge"${atraso(2)}>${esc(texto)}</p>` : ''}
    </div>
    ${acao ? `<div class="cabeca__acao surge"${atraso(2)}>${acao}</div>` : ''}
  </header>`;
}

/* ── Seção ────────────────────────────────────────────────── */
export function secao({ id, classe = '', conteudo, tom = '', rotuloAria }) {
  return `<section class="${cls('secao', tom && `secao--${tom}`, classe)}"${id ? ` id="${id}"` : ''}${
    rotuloAria ? ` aria-label="${esc(rotuloAria)}"` : ''}>
    <div class="wrap">${conteudo}</div>
  </section>`;
}

/* ── Cartão de produto ────────────────────────────────────────
   Carrega os dados em data-* : a busca, os filtros, a ordenação e o
   carrinho leem daqui, então não existe uma segunda lista no JS. */
export function cartao(p, { raiz = '', i = 0, compacto } = {}) {
  const url = `${raiz}produtos/${p.slug}.html`;
  const off = desconto(p);
  const selo = p.tags.find((t) => SELOS[t]);
  const fotos = imagensDe(p);

  return `<article class="card surge${compacto ? ' card--peq' : ''}"${atraso(i)}
    data-slug="${p.slug}" data-nome="${esc(p.nome)}" data-cat="${p.categoria}"
    data-cat-nome="${esc(nomeCategoria(p.categoria))}"
    data-preco="${p.preco}" data-de="${p.precoDe || ''}" data-off="${off}"
    data-nota="${p.nota}" data-tags="${p.tags.join(' ')}"
    data-img="${raiz}${fotos[0]}" data-url="${url}"
    data-variante="${esc(p.variante.opcoes[p.variante.padrao])}"
    data-variante-rotulo="${esc(p.variante.rotulo)}"
    data-busca="${esc((p.nome + ' ' + p.resumo + ' ' + nomeCategoria(p.categoria) + ' ' + p.material).toLowerCase())}">
    <a class="card__foto" href="${url}" tabindex="-1" aria-hidden="true">
      <img src="${raiz}${fotos[0]}" alt="" width="1000" height="1000" loading="lazy" decoding="async">
      <span class="card__selos">
        ${selo ? `<span class="selo ${SELOS[selo].classe}">${SELOS[selo].nome}</span>` : ''}
        ${off ? `<span class="selo selo--off">−${off}%</span>` : ''}
      </span>
      <span class="card__rapido">Ver produto <span aria-hidden="true">→</span></span>
    </a>
    <div class="card__corpo">
      <p class="card__cat">${esc(nomeCategoria(p.categoria))}</p>
      <h3 class="card__nome"><a href="${url}">${esc(p.nome)}</a></h3>
      <p class="card__resumo">${esc(p.resumo)}</p>
      ${estrelas(p.nota, p.avaliacoes)}
      <p class="card__preco">
        ${p.precoDe ? `<s>${moeda(p.precoDe)}</s>` : ''}
        <b>${moeda(p.preco)}</b>
        <small>${parcelas(p.preco)}</small>
      </p>
      <div class="card__acoes">
        <a class="btn btn--volt btn--peq" href="${url}">Ver produto</a>
        <button type="button" class="btn btn--linha btn--peq" data-add
          aria-label="Adicionar ${esc(p.nome)} à sacola">${ICO.sacola}<span>Add</span></button>
      </div>
    </div>
  </article>`;
}

/* ── Trilho horizontal (scroll-snap no celular, grade no desktop) ── */
export const trilho = (cartoes, extra = '') =>
  `<div class="trilho ${extra}">${cartoes}</div>`;

/* ── Sanfona ──────────────────────────────────────────────── */
export const sanfona = (itens, base = 'faq') =>
  `<div class="sanfona">${itens.map(([q, a], i) => `
    <div class="sanfona__item surge"${atraso(i, 0.035)}>
      <h3><button type="button" aria-expanded="${i === 0}" aria-controls="${base}-${i}">
        <span>${esc(q)}</span><span class="sanfona__sinal" aria-hidden="true"></span>
      </button></h3>
      <div class="sanfona__resposta" id="${base}-${i}"><p>${esc(a)}</p></div>
    </div>`).join('')}</div>`;
