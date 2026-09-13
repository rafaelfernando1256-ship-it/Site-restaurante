/**
 * VOLT — casca da página: <head>, cabeçalho, busca, sacola, rodapé,
 * newsletter e botão de WhatsApp. Escritos uma vez, servem todas as
 * páginas.
 */
import { MARCA, TARJA, AVISO_DEMO, linkWhats, CONSULTA_GERAL } from '../conteudo/site.js';
import { CATEGORIAS } from '../conteudo/produtos.js';
import { esc, ICO, botao } from './ui.js';

const ANO = new Date().getFullYear();

/* Tarja rolante — repetida duas vezes porque a animação desliza 50%
   e precisa da segunda cópia para o laço não mostrar buraco. */
const tarja = () => `<div class="tarja" aria-label="Vantagens da loja">
  <div class="tarja__trilho">
    ${[0, 1].map(() => `<ul${0 ? '' : ''} aria-hidden="false">${TARJA.map((t) =>
      `<li>${esc(t)}</li>`).join('')}</ul>`).join('')}
  </div>
</div>`;

function cabecalho(raiz) {
  const ini = raiz ? `${raiz}index.html` : 'index.html';
  const itens = [
    ['#loja', 'Loja'],
    ...CATEGORIAS.slice(0, 4).map((c) => [`#loja`, c.nome, c.id]),
    ['#ofertas', 'Ofertas'],
    ['#faq', 'Ajuda'],
  ];
  return `<header class="topo" id="topo">
  <div class="wrap topo__linha">
    <a class="marca" href="${ini}" aria-label="VOLT — página inicial">
      ${ICO.raio}<span>${MARCA.nome}</span>
    </a>

    <nav class="nav" id="nav" aria-label="Navegação principal">
      ${itens.map(([h, t, cat]) =>
        `<a href="${raiz ? ini + h : h}"${cat ? ` data-ir="${cat}"` : ''}>${esc(t)}</a>`).join('\n      ')}
    </nav>

    <div class="topo__acoes">
      <button class="ico-btn" id="abrirBusca" aria-label="Buscar produtos">${ICO.busca}</button>
      <button class="ico-btn" id="abrirSacola" aria-label="Abrir sacola">
        ${ICO.sacola}<span class="contador" id="contador" aria-hidden="true">0</span>
      </button>
      <button class="ico-btn menu" id="abrirMenu" aria-label="Abrir menu"
        aria-expanded="false" aria-controls="nav"><span></span><span></span></button>
    </div>
  </div>
</header>`;
}

/* ── Busca em tela cheia ──────────────────────────────────── */
const busca = () => `<div class="busca" id="busca" role="dialog" aria-modal="true"
  aria-label="Buscar produtos" hidden>
  <div class="busca__caixa">
    <div class="wrap busca__linha">
      <label class="sr" for="buscaCampo">Buscar produtos</label>
      ${ICO.busca}
      <input type="search" id="buscaCampo" placeholder="Corrente, anel, kit…"
        autocomplete="off" spellcheck="false" enterkeyhint="search">
      <button class="ico-btn" id="fecharBusca" aria-label="Fechar busca">${ICO.fechar}</button>
    </div>
    <div class="wrap">
      <p class="busca__dicas" id="buscaDicas">
        <span>Buscas comuns:</span>
        ${['corrente', 'anel', 'kit', 'cruz', 'argola'].map((t) =>
          `<button type="button" class="chip" data-termo="${t}">${t}</button>`).join('')}
      </p>
      <p class="busca__status" id="buscaStatus" role="status" aria-live="polite"></p>
      <div class="busca__grade" id="buscaResultados"></div>
    </div>
  </div>
</div>`;

/* ── Sacola ───────────────────────────────────────────────── */
const sacola = () => `<div class="cortina" id="cortina" hidden></div>
<aside class="sacola" id="sacola" aria-labelledby="sacolaTitulo" aria-hidden="true">
  <header class="sacola__topo">
    <h2 id="sacolaTitulo">Sua sacola</h2>
    <button class="ico-btn" id="fecharSacola" aria-label="Fechar sacola">${ICO.fechar}</button>
  </header>
  <div class="sacola__frete">
    <p id="freteTexto">Faltam <b>R$ 199,00</b> para o frete grátis</p>
    <div class="barra"><span id="freteBarra" style="width:0%"></span></div>
  </div>
  <div class="sacola__itens" id="sacolaItens">
    <p class="sacola__vazia" id="sacolaVazia">
      Sua sacola está vazia.<span>Começa pelas correntes.</span>
    </p>
  </div>
  <footer class="sacola__pe">
    <p class="sacola__total"><span>Subtotal</span><b id="sacolaTotal">R$ 0,00</b></p>
    <a class="btn btn--volt btn--bloco" id="sacolaFechar"
       href="${linkWhats(CONSULTA_GERAL)}" target="_blank" rel="noopener">
       ${ICO.whats}Fechar pedido no WhatsApp</a>
    <p class="sacola__nota">Carrinho demonstrativo: nenhum pagamento é processado.</p>
  </footer>
</aside>`;

/* ── Newsletter ───────────────────────────────────────────── */
export const newsletter = () => `<div class="news">
  <div>
    <h2 class="news__titulo">ENTRA NA LISTA</h2>
    <p class="news__texto">Lançamento e promoção chegam primeiro por e-mail.
      Sem spam, e dá para sair com um clique.</p>
  </div>
  <form class="news__form" id="newsForm" novalidate>
    <label class="sr" for="newsEmail">Seu e-mail</label>
    <input type="email" id="newsEmail" name="email" required
      placeholder="seu@email.com" autocomplete="email" enterkeyhint="send">
    <button type="submit" class="btn btn--volt">Quero entrar</button>
    <p class="news__aviso" id="newsAviso" role="status" aria-live="polite"></p>
    <p class="news__legal">Formulário de demonstração: nada é enviado nem armazenado.</p>
  </form>
</div>`;

/* ── Rodapé ───────────────────────────────────────────────── */
function rodape(raiz) {
  const ini = raiz ? `${raiz}index.html` : 'index.html';
  const col = (t, linhas) => `<nav class="rodape__col" aria-label="${esc(t)}">
    <h2>${esc(t)}</h2>
    <ul>${linhas.map(([h, txt, ext]) => `<li><a href="${esc(h)}"${
      ext ? ' target="_blank" rel="noopener"' : ''}>${esc(txt)}</a></li>`).join('')}</ul>
  </nav>`;
  return `<footer class="rodape">
  <div class="wrap">
    ${newsletter()}
    <div class="rodape__grade">
      <div class="rodape__marca">
        <p class="marca">${ICO.raio}<span>${MARCA.nome}</span></p>
        <p class="rodape__frase">${esc(MARCA.descricao)}</p>
      </div>
      ${col('Comprar', CATEGORIAS.map((c) => [`${ini}#loja`, c.nome]))}
      ${col('Ajuda', [
        [`${ini}#faq`, 'Prazo de entrega'],
        [`${ini}#faq`, 'Trocas e devoluções'],
        [`${ini}#faq`, 'Tabela de medidas'],
        [`${ini}#faq`, 'Garantia'],
      ])}
      ${col('Contato', [
        [linkWhats(CONSULTA_GERAL), `WhatsApp ${MARCA.whatsappVisivel}`, true],
        [`mailto:${MARCA.email}`, MARCA.email],
        ['#', `Instagram ${MARCA.instagram}`],
        ['#', `TikTok ${MARCA.tiktok}`],
      ])}
    </div>
    <p class="rodape__demo">${esc(AVISO_DEMO)}</p>
    <div class="rodape__base">
      <p>© ${ANO} ${MARCA.nome}. Loja fictícia, criada para demonstração de portfólio.</p>
      <p>Aço inox 316L · CNPJ 00.000.000/0001-00</p>
    </div>
  </div>
</footer>`;
}

export function pagina({ titulo, descricao, caminho = '', raiz = '', corpo,
                         jsonLd = [], imagemSocial = 'assets/hero.svg' }) {
  const canonico = `${MARCA.dominio}/${caminho}`;
  const dados = jsonLd.map((d) =>
    `<script type="application/ld+json">${JSON.stringify(d)}</script>`).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta name="theme-color" content="#0A0A0B">
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Grotesk:wght@300;400;500;700&display=swap">

<link rel="stylesheet" href="${raiz}css/volt.css">
<script>document.documentElement.className += " js";</script>
${dados}
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${tarja()}
${cabecalho(raiz)}
<main id="conteudo">
${corpo}
</main>
${rodape(raiz)}
${busca()}
${sacola()}

<div class="aviso" id="aviso" role="status" aria-live="polite"></div>

<a class="flutuante" href="${linkWhats(CONSULTA_GERAL)}" target="_blank" rel="noopener"
   aria-label="Falar no WhatsApp">${ICO.whats}</a>

<script src="${raiz}js/volt.js" defer></script>
</body>
</html>
`;
}

export const jsonLdMarca = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: MARCA.nome,
  description: MARCA.descricao,
  url: MARCA.dominio + '/',
  telephone: MARCA.whatsappVisivel,
  email: MARCA.email,
  areaServed: 'BR',
  currenciesAccepted: 'BRL',
  paymentAccepted: 'Pix, boleto, cartão de crédito',
};
