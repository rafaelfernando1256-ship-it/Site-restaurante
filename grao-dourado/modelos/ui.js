/* ═══════════════════════════════════════════════════════════════
   PEÇAS REUTILIZÁVEIS
   Tudo que aparece em mais de um lugar vive aqui. Se um card muda,
   muda em todas as páginas de uma vez.
   ═══════════════════════════════════════════════════════════════ */
import { MARCA, wa } from '../conteudo/marca.js';
import { MARCAS, dinheiro } from '../conteudo/cardapio.js';
import { FOTOS } from '../conteudo/fotos.js';

/**
 * Imagem de um item ou seção.
 *
 * Prefere a FOTO quando existe; cai no desenho em SVG quando não.
 * As fotos vêm do Instagram da própria casa e ganham do desenho em
 * qualquer dia — mas nem todo item tem foto, e card misturando os dois
 * continua tendo que funcionar.
 */
export function imagem(obj, { raiz = '', alt = '', classe = '', lazy = true } = {}) {
  const f = obj.foto && FOTOS[obj.foto];
  const src = f ? `${raiz}img/foto/${obj.foto}.jpg` : `${raiz}img/${obj.arte}`;
  const [w, h] = f || [720, 720];
  return `<img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}"` +
    (classe ? ` class="${classe}"` : '') +
    (lazy ? ' loading="lazy"' : ' fetchpriority="high"') +
    ' decoding="async">';
}

/** Escapa texto que vai para dentro de atributo ou corpo de HTML. */
export const esc = (t = '') =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const icone = {
  whats:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.89 2.4 1.02 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>',
  insta:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9a3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 2.12c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.75-.07Zm0 3.6a6.12 6.12 0 1 1 0 12.24 6.12 6.12 0 0 1 0-12.24Zm0 10.1a3.98 3.98 0 1 0 0-7.96 3.98 3.98 0 0 0 0 7.96Zm7.79-10.34a1.43 1.43 0 1 1-2.86 0 1.43 1.43 0 0 1 2.86 0Z"/></svg>',
  relogio:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.9" stroke-linecap="round"/></svg>',
  pino:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  seta:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mais:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>',
  sacola:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke-linecap="round"/></svg>',
};

/* ── Botão ───────────────────────────────────────────────────────
   Três variantes e nada mais. A quarta sempre vira ruído. */
export function botao({ href, texto, variante = 'ouro', ico = '', externo = false, classe = '', attrs = '' }) {
  const alvo = externo ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a class="btn btn--${variante} ${classe}" href="${esc(href)}"${alvo}${attrs}>${
    ico ? `<span class="btn__ico">${ico}</span>` : ''
  }${esc(texto)}</a>`;
}

/* ── Cabeçalho de seção ──────────────────────────────────────────
   `nivel` existe porque a página de cardápio usa o mesmo bloco como
   h1. Sem isso a hierarquia de títulos quebra e o leitor de tela
   anuncia a página sem título. */
export function cabeca({ etiqueta, titulo, texto = '', nivel = 2, classe = '' }) {
  const T = `h${nivel}`;
  return `<header class="cabeca ${classe}">
    ${etiqueta ? `<p class="cabeca__etiqueta">${esc(etiqueta)}</p>` : ''}
    <${T} class="cabeca__titulo">${titulo}</${T}>
    ${texto ? `<p class="cabeca__texto">${esc(texto)}</p>` : ''}
  </header>`;
}

/* ── Selo do item ───────────────────────────────────────────────── */
export const selo = (id) =>
  MARCAS[id]
    ? `<span class="selo selo--${id}" title="${esc(MARCAS[id].titulo)}">${esc(MARCAS[id].nome)}</span>`
    : '';

/* ── Card de item do cardápio ────────────────────────────────────
   O botão é um <button>, não <a>: ele adiciona ao pedido, e um link
   que não navega confunde quem usa teclado ou leitor de tela. */
export function cardItem(item, { raiz = '' } = {}) {
  return `<article class="item" data-cat="${esc(item.cat)}" data-slug="${esc(item.slug)}">
    <div class="item__arte">
      ${imagem(item, { raiz })}
      ${item.marcas?.length ? `<div class="item__selos">${item.marcas.map(selo).join('')}</div>` : ''}
    </div>
    <div class="item__corpo">
      <h3 class="item__nome">${esc(item.nome)}</h3>
      <p class="item__desc">${esc(item.desc)}</p>
      <div class="item__pe">
        <span class="item__preco">${dinheiro(item.preco)}</span>
        <button type="button" class="item__add" data-add="${esc(item.slug)}"
                aria-label="Adicionar ${esc(item.nome)} ao pedido">
          ${icone.mais}<span>Adicionar</span>
        </button>
      </div>
    </div>
  </article>`;
}

/* ── Selo de aberto/fechado ──────────────────────────────────────
   Sai do servidor já preenchido para não piscar, e o JS corrige no
   cliente — é o fuso de quem visita que vale, não o do build. */
export function seloAberto() {
  return `<span class="aberto" data-aberto hidden>
    <span class="aberto__ponto" aria-hidden="true"></span>
    <span class="aberto__texto">Verificando…</span>
  </span>`;
}

/* ── Linha de contato do rodapé ──────────────────────────────────── */
export const linhaWhats = (mensagem, texto = 'Chamar no WhatsApp') =>
  botao({ href: wa(mensagem), texto, variante: 'whats', ico: icone.whats, externo: true });

export const linkInsta = () =>
  `<a class="social" href="https://instagram.com/${MARCA.instagram}" target="_blank" rel="noopener noreferrer">
     ${icone.insta}<span>@${esc(MARCA.instagram)}</span></a>`;
