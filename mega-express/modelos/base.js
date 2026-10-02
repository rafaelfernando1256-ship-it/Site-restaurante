/* ═══════════════════════════════════════════════════════════════
   ESQUELETO DA PÁGINA
   ═══════════════════════════════════════════════════════════════ */
import { MARCA, UNIDADES, wa, insta, AVISO_GOLPE } from '../conteudo/marca.js';
import { AVISO } from '../conteudo/pagina.js';
import { esc, icone, botao } from './ui.js';

const NAV = [
  { href: 'index.html#unidades', rotulo: 'As unidades' },
  { href: 'index.html#quartos', rotulo: 'Quartos' },
  { href: 'serra-da-capivara.html', rotulo: 'Serra da Capivara' },
  { href: 'index.html#avaliacoes', rotulo: 'Avaliações' },
];

/* Dados estruturados: um `Hotel` por unidade.
   Nota e quantidade de avaliações ficam DE FORA de propósito —
   eu não tenho esse número, e marcar avaliação não verificada
   como aggregateRating é motivo de punição de buscador. */
function dadosEstruturados() {
  return JSON.stringify(
    UNIDADES.map((u) => ({
      '@context': 'https://schema.org',
      '@type': 'Hotel',
      name: `${MARCA.nome} — ${u.nome}`,
      description: u.resumo,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'São Raimundo Nonato',
        addressRegion: 'PI',
        addressCountry: 'BR',
      },
      telephone: `+${u.telefone}`,
      sameAs: [insta()],
      amenityFeature: u.comodidades.map((c) => ({
        '@type': 'LocationFeatureSpecification', name: c, value: true,
      })),
    }))
  );
}

export function cabecalho({ raiz = '', atual = '' } = {}) {
  const links = NAV.map((l) => {
    const ativo = l.href.split('#')[0] === atual ? ' aria-current="page"' : '';
    return `<a href="${esc(raiz + l.href)}"${ativo}>${esc(l.rotulo)}</a>`;
  }).join('');

  return `
<a class="pular" href="#conteudo">Pular para o conteúdo</a>

<header class="topo" data-topo>
  <div class="topo__linha">
    <a class="marca" href="${raiz}index.html">
      <span class="marca__sinal" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="currentColor"><path d="M6 4h13l-4.5 13H28L13 36l4.5-14H6L10 4H6Z" opacity=".92"/><path d="M22 4h12l-4 11H18l4-11Z" opacity=".55"/></svg>
      </span>
      <span class="marca__txt"><strong>Mega Express</strong><small>Hotel</small></span>
    </a>

    <nav class="nav" aria-label="Navegação principal">${links}</nav>

    <div class="topo__acoes">
      ${botao({ href: `${raiz}index.html#reservar`, texto: 'Reservar',
                variante: 'vermelho', classe: 'btn--sm topo__cta' })}
      <button type="button" class="hamburguer" data-menu-abre
              aria-expanded="false" aria-controls="menu-cel" aria-label="Abrir menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<!-- Fora do <header> de propósito: o topo tem backdrop-filter, e
     backdrop-filter cria bloco de contenção para descendente
     position:fixed — dentro dele o menu colapsaria para a altura
     da barra em vez de ocupar a tela. -->
<div class="menucel" id="menu-cel" data-menu hidden>
  <nav class="menucel__nav" aria-label="Navegação">
    ${NAV.map((l) => `<a href="${esc(raiz + l.href)}">${esc(l.rotulo)}</a>`).join('')}
  </nav>
  <div class="menucel__pe">
    ${UNIDADES.map((u) => botao({
      href: wa(u.telefone, `Oi! Vim pelo site e queria reservar no ${u.nome}.`),
      texto: u.nome, variante: 'whats', ico: icone.whats, externo: true,
      classe: 'btn--bloco',
    })).join('')}
    <a class="social" href="${insta()}" target="_blank" rel="noopener noreferrer">
      ${icone.insta}<span>@${esc(MARCA.instagram)}</span></a>
  </div>
</div>`;
}

/* Aviso de golpe publicado pela própria casa. Num site de hotel
   isso não é recado de rodapé: protege o hóspede antes de ele
   mandar dinheiro para o lugar errado. */
export const faixaGolpe = () => `
<aside class="golpe" aria-label="Aviso de segurança">
  <div class="wrap golpe__corpo">
    <span class="golpe__ico" aria-hidden="true">${icone.escudo}</span>
    <div>
      <h2>${esc(AVISO_GOLPE.titulo)}</h2>
      <p>${esc(AVISO_GOLPE.texto)}</p>
      <p class="golpe__acao">${esc(AVISO_GOLPE.acao)}</p>
    </div>
  </div>
</aside>`;

export function rodape({ raiz = '' } = {}) {
  return `
<footer class="rodape">
  <div class="wrap rodape__grade">
    <div>
      <a class="marca marca--rod" href="${raiz}index.html">
        <span class="marca__sinal" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="currentColor"><path d="M6 4h13l-4.5 13H28L13 36l4.5-14H6L10 4H6Z" opacity=".92"/><path d="M22 4h12l-4 11H18l4-11Z" opacity=".55"/></svg>
        </span>
        <span class="marca__txt"><strong>Mega Express</strong><small>Hotel</small></span>
      </a>
      <p class="rodape__lema">${esc(MARCA.lema)}</p>
      <a class="social" href="${insta()}" target="_blank" rel="noopener noreferrer">
        ${icone.insta}<span>@${esc(MARCA.instagram)}</span></a>
    </div>

    ${UNIDADES.map((u) => `
    <div>
      <h2 class="rodape__tit">${esc(u.nome)}</h2>
      <p>${esc(u.chamada)}</p>
      <p class="rodape__fone">${esc(u.telefoneVisivel)}</p>
      ${botao({
        href: wa(u.telefone, `Oi! Vim pelo site e queria reservar no ${u.nome}.`),
        texto: 'Reservar', variante: 'whats', ico: icone.whats, externo: true,
        classe: 'btn--sm',
      })}
      <a class="rodape__link" href="${raiz}unidade/${esc(u.slug)}.html">Ver a unidade</a>
    </div>`).join('')}

    <div>
      <h2 class="rodape__tit">A região</h2>
      <nav class="rodape__nav" aria-label="Páginas">
        <a href="${raiz}serra-da-capivara.html">Serra da Capivara</a>
        <a href="${raiz}index.html#quartos">Quartos</a>
        <a href="${raiz}index.html#avaliacoes">Avaliações</a>
        <a href="${raiz}index.html#perguntas">Perguntas</a>
      </nav>
      <p class="rodape__nota">${esc(MARCA.cidade)}</p>
    </div>
  </div>

  <div class="wrap rodape__base">
    <p><strong>${esc(AVISO.texto)}.</strong> ${esc(AVISO.detalhe)}</p>
    <p>Feito como exemplo, a partir do que está público no Instagram do hotel.</p>
  </div>
</footer>`;
}

export function pagina({ titulo, descricao, corpo, atual = '', raiz = '', classe = '' }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta name="theme-color" content="#b02820">
<link rel="icon" href="${raiz}img/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(MARCA.nome)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta name="robots" content="noindex,follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${raiz}css/mega.css">
<script type="application/ld+json">${dadosEstruturados()}</script>
</head>
<body class="${classe}">
${cabecalho({ raiz, atual })}
<main id="conteudo">
${corpo}
</main>
${rodape({ raiz })}

<aside class="demo" role="note">
  <strong>${esc(AVISO.texto)}</strong>
  <span>${esc(AVISO.detalhe)}</span>
</aside>

<!-- Dados que o comportamento precisa: as unidades, para o
     formulário saber para qual WhatsApp mandar. -->
<script>window.MEGA=${JSON.stringify({
  unidades: UNIDADES.map((u) => ({
    slug: u.slug, nome: u.nome, telefone: u.telefone, visivel: u.telefoneVisivel,
  })),
})};</script>
<script src="${raiz}js/mega.js" defer></script>
</body>
</html>`;
}

export { NAV };
