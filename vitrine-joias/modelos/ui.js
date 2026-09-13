/** Componentes da página. Cada função devolve HTML. */
export function esc(v = '') {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export const cls = (...xs) => xs.filter(Boolean).join(' ');
export const atraso = (i = 0, passo = 0.06) =>
  i ? ` style="--atraso:${(i * passo).toFixed(2)}s"` : '';

export const ICO = {
  whats: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm5.84 14.06c-.25.7-1.45 1.33-2 1.41-.53.08-1.18.11-1.9-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5.01-4.36-5.16-4.56-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.53c.28-.3.6-.38.8-.38h.58c.19 0 .44-.07.69.53.25.6.86 2.09.94 2.24.08.15.13.33.02.53-.1.2-.16.33-.31.5-.15.18-.32.4-.46.53-.15.15-.31.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.37 2.45 1.52.3.15.48.13.66-.08.18-.2.76-.88.96-1.19.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.99.3.15.5.22.58.35.07.13.07.75-.18 1.46Z"/></svg>',
  fora: '<svg class="ico-fora" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
};

/* variante: 'tinta' | 'whats' | 'linha' | 'claro' */
export function botao({ texto, href, variante = 'tinta', tamanho, externo, extra = '', rotulo }) {
  const classe = cls('btn', `btn--${variante}`, tamanho && `btn--${tamanho}`);
  const alvo = externo ? ' target="_blank" rel="noopener"' : '';
  const aria = rotulo ? ` aria-label="${esc(rotulo)}"` : '';
  return `<a class="${classe}" href="${esc(href)}"${alvo}${aria}${extra}>${texto}</a>`;
}

export const ctaWhats = (href, texto, tamanho, variante = 'whats') =>
  botao({ texto: `${ICO.whats}${esc(texto)}`, href, variante, tamanho, externo: true });

export function cabeca({ n, etiqueta, titulo, texto, centro, acao }) {
  return `<header class="${cls('cabeca', centro && 'cabeca--centro')}">
    <div class="cabeca__texto">
      ${etiqueta ? `<p class="rotulo surge">${n ? `<b>${esc(n)}</b>` : ''}${esc(etiqueta)}</p>` : ''}
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

export const sanfona = (itens, base = 'duv') =>
  `<div class="sanfona">${itens.map(([q, a], i) => `
    <div class="sanfona__item surge"${atraso(i, 0.04)}>
      <h3><button type="button" aria-expanded="${i === 0}" aria-controls="${base}-${i}">
        <span>${esc(q)}</span><span class="sanfona__sinal" aria-hidden="true"></span>
      </button></h3>
      <div class="sanfona__resposta" id="${base}-${i}"><p>${esc(a)}</p></div>
    </div>`).join('')}</div>`;
