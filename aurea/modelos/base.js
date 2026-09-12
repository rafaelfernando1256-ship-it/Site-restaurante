/**
 * AUREA — casca da página.
 * Cabeçalho, rodapé, botão flutuante e <head> são escritos uma vez só
 * aqui e servem tanto a home quanto as páginas de peça.
 */
import { MARCA, linkWhats, CONSULTA_GERAL } from '../conteudo/site.js';
import { CATEGORIAS } from '../conteudo/produtos.js';
import { esc, botao, icoWhats } from './ui.js';

const ANO = new Date().getFullYear();

/* ── Cabeçalho ────────────────────────────────────────────── */
function cabecalho(raiz, atual) {
  const itens = [
    ['#destaque', 'Destaques'],
    ...CATEGORIAS.map((c) => [`#${c.id}`, c.nome]),
    ['#colecoes', 'Coleções'],
    ['#marca', 'A marca'],
  ];
  const href = (h) => (raiz ? `${raiz}index.html${h}` : h);
  return `<header class="topo" id="topo">
  <div class="wrap topo__linha">
    <a class="marca" href="${raiz || ''}index.html" aria-label="AUREA — página inicial"${
      atual === 'home' ? ' aria-current="page"' : ''}>
      <span class="marca__nome">${MARCA.nome}</span>
      <span class="marca__sub">Alta joalheria</span>
    </a>

    <nav class="nav" id="nav" aria-label="Navegação principal">
      ${itens.map(([h, t]) => `<a href="${href(h)}">${t}</a>`).join('\n      ')}
    </nav>

    <div class="topo__acoes">
      ${botao({ texto: `${icoWhats}<span>Consultar</span>`, href: linkWhats(CONSULTA_GERAL),
                variante: 'linha', tamanho: 'peq', externo: true, extra: ' data-topo-whats' })}
      <button class="menu" id="abrirMenu" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav">
        <span></span><span></span>
      </button>
    </div>
  </div>
</header>`;
}

/* ── Rodapé ───────────────────────────────────────────────── */
function rodape(raiz) {
  const col = (titulo, linhas) => `<nav class="rodape__col" aria-label="${esc(titulo)}">
      <h2>${esc(titulo)}</h2>
      <ul>${linhas.map(([h, t, ext]) => `<li><a href="${esc(h)}"${
        ext ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a></li>`).join('')}</ul>
    </nav>`;
  const ini = raiz ? `${raiz}index.html` : 'index.html';
  return `<footer class="rodape">
  <div class="wrap rodape__grade">
    <div class="rodape__marca">
      <p class="marca__nome">${MARCA.nome}</p>
      <p class="rodape__frase">${esc(MARCA.descricao)}</p>
      <p class="rodape__frase">${esc(MARCA.endereco)}</p>
    </div>
    ${col('Coleção', CATEGORIAS.map((c) => [`${ini}#${c.id}`, c.nome]))}
    ${col('A marca', [
      [`${ini}#marca`, 'Nossa história'],
      [`${ini}#qualidade`, 'Qualidade e autenticidade'],
      [`${ini}#atendimento`, 'Atendimento'],
      [`${ini}#faq`, 'Perguntas frequentes'],
    ])}
    ${col('Contato', [
      [linkWhats(CONSULTA_GERAL), `WhatsApp ${MARCA.whatsappVisivel}`, true],
      [`mailto:${MARCA.email}`, MARCA.email],
      ['#', MARCA.instagram],
    ])}
  </div>
  <div class="rodape__base">
    <div class="wrap rodape__base-linha">
      <p>© ${ANO} ${MARCA.nome}. Joalheria fictícia, criada para demonstração de portfólio.</p>
      <p>${esc(MARCA.horario)}</p>
    </div>
  </div>
</footer>`;
}

/* ── Página ───────────────────────────────────────────────── */
export function pagina({ titulo, descricao, caminho = '', raiz = '', corpo, jsonLd = [],
                         classe = '', atual, imagemSocial = 'assets/hero.svg' }) {
  const canonico = `${MARCA.dominio}/${caminho}`;
  const dados = jsonLd.map((d) =>
    `<script type="application/ld+json">${JSON.stringify(d, null, 0)}</script>`).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR"${classe ? ` class="${classe}"` : ''}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta name="theme-color" content="#08080A">
<link rel="canonical" href="${esc(canonico)}">

<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${MARCA.nome}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(canonico)}">
<meta property="og:image" content="${MARCA.dominio}/${imagemSocial}">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="${raiz}assets/favicon.svg" type="image/svg+xml">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Jost:wght@200;300;400;500&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Jost:wght@200;300;400;500&display=swap">

<link rel="stylesheet" href="${raiz}css/aurea.css">
<script>document.documentElement.className += " js";</script>
${dados}
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${cabecalho(raiz, atual)}
<main id="conteudo">
${corpo}
</main>
${rodape(raiz)}

<a class="flutuante" href="${linkWhats(CONSULTA_GERAL)}" target="_blank" rel="noopener"
   aria-label="Falar com um consultor no WhatsApp">${icoWhats}</a>

<script src="${raiz}js/aurea.js" defer></script>
</body>
</html>
`;
}

/** Dados estruturados da joalheria — entram em todas as páginas. */
export const jsonLdMarca = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: MARCA.nome,
  description: MARCA.descricao,
  url: MARCA.dominio + '/',
  telephone: MARCA.whatsappVisivel,
  email: MARCA.email,
  areaServed: 'BR',
  currenciesAccepted: 'BRL',
  foundingDate: MARCA.fundacao,
  address: { '@type': 'PostalAddress', addressLocality: 'São Paulo', addressRegion: 'SP', addressCountry: 'BR' },
};
