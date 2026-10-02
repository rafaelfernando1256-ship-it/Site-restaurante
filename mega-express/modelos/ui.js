/* ═══════════════════════════════════════════════════════════════
   PEÇAS REUTILIZÁVEIS
   ═══════════════════════════════════════════════════════════════ */
import { COMODIDADES } from '../conteudo/marca.js';
import { FOTOS } from '../conteudo/fotos.js';

export const esc = (t = '') =>
  String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const icone = {
  whats:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07s.89 2.4 1.02 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/></svg>',
  insta:
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9a3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 2.12c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.21-.94.47-1.35.88-.41.41-.67.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.21.55.47.94.88 1.35.41.41.8.67 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.21.94-.47 1.35-.88.41-.41.67-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.6 3.6 0 0 0-.88-1.35 3.6 3.6 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.75-.07Zm0 3.6a6.12 6.12 0 1 1 0 12.24 6.12 6.12 0 0 1 0-12.24Zm0 10.1a3.98 3.98 0 1 0 0-7.96 3.98 3.98 0 0 0 0 7.96Zm7.79-10.34a1.43 1.43 0 1 1-2.86 0 1.43 1.43 0 0 1 2.86 0Z"/></svg>',
  pino: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  escudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.3 7.5 9.5 4.3-1.2 7.5-5 7.5-9.5V6L12 3Z" stroke-linejoin="round"/><path d="M9.3 12.2 11.2 14l3.6-3.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  aspas: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.6 6.5c-3 1.4-4.8 4-4.8 7.2 0 2.4 1.4 4 3.5 4 1.9 0 3.3-1.4 3.3-3.3 0-1.8-1.2-3.1-3-3.1-.3 0-.6 0-.8.1.4-1.6 1.6-2.9 3.3-3.7l-1.5-1.2Zm9 0c-3 1.4-4.8 4-4.8 7.2 0 2.4 1.4 4 3.5 4 1.9 0 3.3-1.4 3.3-3.3 0-1.8-1.2-3.1-3-3.1-.3 0-.6 0-.8.1.4-1.6 1.6-2.9 3.3-3.7l-1.5-1.2Z"/></svg>',
};

/* Ícones das comodidades. Um por chave de COMODIDADES. */
const svg = (d, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">${d}${extra}</svg>`;

export const iconeComodidade = {
  cafe: svg('<path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8Z"/><path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" stroke-linecap="round"/><path d="M7 5V3M11 5V3" stroke-linecap="round"/>'),
  piscina: svg('<path d="M3 17c1.5 0 1.5 1.4 3 1.4S7.5 17 9 17s1.5 1.4 3 1.4S13.5 17 15 17s1.5 1.4 3 1.4S19.5 17 21 17" stroke-linecap="round"/><path d="M8 15V6a2 2 0 0 1 4 0M16 15V6a2 2 0 0 0-4 0" stroke-linecap="round"/>'),
  estacionamento: svg('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M9.5 17V8h3a2.8 2.8 0 0 1 0 5.6h-3" stroke-linecap="round" stroke-linejoin="round"/>'),
  wifi: svg('<path d="M2.5 9a15 15 0 0 1 19 0M5.5 12.5a10 10 0 0 1 13 0M8.8 16a5 5 0 0 1 6.4 0" stroke-linecap="round"/><circle cx="12" cy="19.4" r="1.1" fill="currentColor" stroke="none"/>'),
  ar: svg('<rect x="3" y="4" width="18" height="8" rx="2.5"/><path d="M6.5 8.2h11" stroke-linecap="round"/><path d="M8 15c0 2-1.5 2-1.5 4M12 15c0 2.4-1.5 2.4-1.5 4.6M16 15c0 2-1.5 2-1.5 4" stroke-linecap="round"/>'),
  frigobar: svg('<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M5 10h14" stroke-linecap="round"/><path d="M8.5 6v2M8.5 13.5v2.5" stroke-linecap="round"/>'),
  tv: svg('<rect x="2.5" y="4" width="19" height="13" rx="2.5"/><path d="M8.5 21h7" stroke-linecap="round"/>'),
  varanda: svg('<path d="M3 21V10l9-6 9 6v11" stroke-linejoin="round"/><path d="M3 21h18M7 21v-6h10v6M7 17.5h10" stroke-linecap="round"/>'),
};

/* ── Imagem: prefere foto, cai no desenho ───────────────────────
   Este site é só foto, mas o ajudante é o mesmo dos outros
   projetos — se faltar um arquivo, a página não quebra. */
export function imagem(obj, { raiz = '', alt = '', classe = '', lazy = true } = {}) {
  const chave = typeof obj === 'string' ? obj : obj.foto;
  const f = chave && FOTOS[chave];
  if (!f) return `<span class="sem-foto" aria-hidden="true"></span>`;
  const [w, h] = f;
  return `<img src="${raiz}img/foto/${esc(chave)}.jpg" alt="${esc(alt)}" width="${w}" height="${h}"` +
    (classe ? ` class="${classe}"` : '') +
    (lazy ? ' loading="lazy"' : ' fetchpriority="high"') + ' decoding="async">';
}

export function botao({ href, texto, variante = 'vermelho', ico = '', externo = false, classe = '', attrs = '' }) {
  const alvo = externo ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a class="btn btn--${variante} ${classe}" href="${esc(href)}"${alvo}${attrs}>${
    ico ? `<span class="btn__ico">${ico}</span>` : ''}${esc(texto)}</a>`;
}

export function cabeca({ etiqueta, titulo, texto = '', nivel = 2, classe = '' }) {
  const T = `h${nivel}`;
  return `<header class="cabeca ${classe}">
    ${etiqueta ? `<p class="cabeca__etiqueta">${esc(etiqueta)}</p>` : ''}
    <${T} class="cabeca__titulo">${titulo}</${T}>
    ${texto ? `<p class="cabeca__texto">${esc(texto)}</p>` : ''}
  </header>`;
}

/* ── Lista de comodidades ───────────────────────────────────────── */
export const listaComodidades = (chaves, { compacta = false } = {}) =>
  `<ul class="comods${compacta ? ' comods--compacta' : ''}">
    ${chaves.map((c) => {
      const d = COMODIDADES[c];
      if (!d) return '';
      return `<li class="comod">
        <span class="comod__ico">${iconeComodidade[c] || ''}</span>
        <span class="comod__txt"><b>${esc(d.nome)}</b>${compacta ? '' : `<small>${esc(d.texto)}</small>`}</span>
      </li>`;
    }).join('')}
  </ul>`;

/* ── Cartão de avaliação ────────────────────────────────────────
   O nome de quem escreveu e a origem ficam SEMPRE visíveis: é o
   que separa avaliação real de frase inventada. */
export function cardAvaliacao(a, { unidadeNome = '' } = {}) {
  return `<figure class="aval">
    <span class="aval__aspas" aria-hidden="true">${icone.aspas}</span>
    <blockquote><p>${esc(a.texto)}</p></blockquote>
    <figcaption>
      <b>${esc(a.autor)}</b>
      <small>${esc(a.origem)}${unidadeNome ? ` · ${esc(unidadeNome)}` : ''}</small>
    </figcaption>
  </figure>`;
}
