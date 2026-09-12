/**
 * AUREA — componentes de interface.
 *
 * Cada função devolve uma string de HTML. Nada aqui sabe em que página
 * está: quem chama passa `raiz` ('' na home, '../' dentro de /pecas),
 * e é assim que os mesmos componentes servem as duas.
 */

/** Escapa texto que vai para dentro do HTML. */
export function esc(v = '') {
  return String(v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** 18900 → "R$ 18.900" */
export const moeda = (n) =>
  'R$ ' + n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

/** Junta classes ignorando o que for falso. */
export const cls = (...xs) => xs.filter(Boolean).join(' ');

/** Atributo de atraso da revelação, em segundos. */
export const atraso = (i = 0, passo = 0.06) =>
  i ? ` style="--atraso:${(i * passo).toFixed(2)}s"` : '';

/* ── Botão ────────────────────────────────────────────────────
   variante: 'ouro' | 'linha' | 'claro' | 'texto'
   Links externos já saem com rel="noopener" e aviso para leitor de tela. */
export function botao({ texto, href, variante = 'ouro', tamanho, externo, extra = '', rotulo }) {
  const classe = cls('btn', `btn--${variante}`, tamanho && `btn--${tamanho}`);
  const alvo = externo ? ' target="_blank" rel="noopener"' : '';
  const aria = rotulo ? ` aria-label="${esc(rotulo)}"` : '';
  return `<a class="${classe}" href="${esc(href)}"${alvo}${aria}${extra}>${texto}</a>`;
}

/** Ícone do WhatsApp — inline, para não pesar uma requisição. */
export const icoWhats = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm5.84 14.06c-.25.7-1.45 1.33-2 1.41-.53.08-1.18.11-1.9-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5.01-4.36-5.16-4.56-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.53c.28-.3.6-.38.8-.38h.58c.19 0 .44-.07.69.53.25.6.86 2.09.94 2.24.08.15.13.33.02.53-.1.2-.16.33-.31.5-.15.18-.32.4-.46.53-.15.15-.31.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.37 2.45 1.52.3.15.48.13.66-.08.18-.2.76-.88.96-1.19.2-.3.4-.25.68-.15.28.1 1.77.83 2.07.99.3.15.5.22.58.35.07.13.07.75-.18 1.46Z"/></svg>`;

/** Botão de consulta — o WhatsApp da AUREA é atendimento, nunca pagamento. */
export const botaoConsulta = (href, texto = 'Consultar pelo WhatsApp', variante = 'ouro', tamanho) =>
  botao({ texto: `${icoWhats}${texto}`, href, variante, tamanho, externo: true });

/* ── Filete metálico ──────────────────────────────────────── */
export const filete = (classe = '') => `<span class="filete ${classe}" aria-hidden="true"></span>`;

/* ── Cabeça de seção ──────────────────────────────────────── */
export function cabecaSecao({ indice, etiqueta, titulo, texto, centro }) {
  return `<header class="${cls('cabeca', centro && 'cabeca--centro')}">
    ${indice || etiqueta ? `<p class="rotulo revelar">
      ${indice ? `<span class="rotulo__n">${esc(indice)}</span>` : ''}
      ${etiqueta ? esc(etiqueta) : ''}
    </p>` : ''}
    ${titulo ? `<h2 class="titulo revelar"${atraso(1)}>${titulo}</h2>` : ''}
    ${texto ? `<p class="cabeca__texto revelar"${atraso(2)}>${esc(texto)}</p>` : ''}
  </header>`;
}

/* ── Seção ────────────────────────────────────────────────────
   tom: 'breu' (padrão) | 'noite' (um degrau acima) */
export function secao({ id, tom = 'breu', classe = '', conteudo, rotuloAria }) {
  return `<section class="${cls('secao', `secao--${tom}`, classe)}"${id ? ` id="${id}"` : ''}${
    rotuloAria ? ` aria-label="${esc(rotuloAria)}"` : ''}>
    <div class="wrap">${conteudo}</div>
  </section>`;
}

/* ── Cartão de peça ───────────────────────────────────────── */
export function cartaoPeca(peca, { raiz = '', consulta, colecao, i = 0, compacto } = {}) {
  const url = `${raiz}pecas/${peca.slug}.html`;
  return `<article class="${cls('peca', compacto && 'peca--compacta')} revelar"${atraso(i, 0.05)}>
    <a class="peca__foto" href="${url}" tabindex="-1" aria-hidden="true">
      <img src="${raiz}assets/${peca.slug}.svg" alt="" width="1000" height="1000" loading="lazy" decoding="async">
      ${colecao ? `<span class="peca__selo">${esc(colecao)}</span>` : ''}
    </a>
    <div class="peca__corpo">
      <h3 class="peca__nome"><a href="${url}">${esc(peca.nome)}</a></h3>
      <p class="peca__resumo">${esc(peca.resumo)}</p>
      <p class="peca__material">${esc(peca.material)}</p>
      <p class="peca__preco">${moeda(peca.preco)}<span>valor de referência</span></p>
      <div class="peca__acoes">
        ${botaoConsulta(consulta, 'Consultar', 'ouro', 'peq')}
        <a class="link-seta" href="${url}">Ver a peça<span aria-hidden="true">→</span></a>
      </div>
    </div>
  </article>`;
}

/* ── Sanfona ──────────────────────────────────────────────── */
export function sanfona(itens, idBase = 'faq') {
  return `<div class="sanfona">${itens.map(([pergunta, resposta], i) => `
    <div class="sanfona__item revelar"${atraso(i, 0.04)}>
      <h3><button type="button" aria-expanded="${i === 0}" aria-controls="${idBase}-${i}">
        <span>${esc(pergunta)}</span>
        <span class="sanfona__sinal" aria-hidden="true"></span>
      </button></h3>
      <div class="sanfona__resposta" id="${idBase}-${i}"><p>${esc(resposta)}</p></div>
    </div>`).join('')}</div>`;
}

/* ── Figura editorial ─────────────────────────────────────── */
export function figura({ src, alt, raiz = '', classe = '', lado, largura = 1000, altura = 1200, prioridade }) {
  const carga = prioridade
    ? ' fetchpriority="high" decoding="async"'
    : ' loading="lazy" decoding="async"';
  return `<figure class="${cls('figura', classe)} revelar"${lado ? ` data-revelar="${lado}"` : ''}>
    <img src="${raiz}assets/${src}" alt="${esc(alt)}" width="${largura}" height="${altura}"${carga}>
  </figure>`;
}
