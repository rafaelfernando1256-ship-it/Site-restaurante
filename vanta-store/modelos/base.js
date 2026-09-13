/**
 * VANTA STORE — casca das páginas.
 * Header, busca, favoritos, carrinho, menu mobile, rodapé, WhatsApp e
 * <head> com SEO. Escritos uma vez, servem as 32 páginas.
 */
import { LOJA, TARJA, AVISO_DEMO, linkWhats, MSG, ENTREGA, TROCA, PAGAMENTOS }
  from '../conteudo/site.js';
import { CATEGORIAS, PRODUTOS, imagensDe, marca as marcaDe, categoria as categoriaDe }
  from '../conteudo/produtos.js';
import { esc, ICO, botao, moeda } from './ui.js';

const ANO = new Date().getFullYear();

const marca = (raiz, tag = 'span') => `<${tag} class="logo">
  <span class="logo__v" aria-hidden="true">V</span>
  <span class="logo__texto"><b>${esc(LOJA.nome)}</b><i>${esc(LOJA.sobrenome)}</i></span>
</${tag}>`;

/* ── Tarja rolante ────────────────────────────────────────── */
/* Sem ticker infinito: no desktop as quatro promessas cabem paradas, e
   no celular uma de cada vez, trocando devagar. Letreiro rolando e
   cortado no meio da palavra é cara de loja improvisada. */
const tarja = () => `<div class="tarja">
  <div class="wrap tarja__linha" role="status" aria-label="Condições da loja">
    ${TARJA.map((t, i) => `<p class="tarja__item${i === 0 ? ' ativo' : ''}">${esc(t)}</p>`).join('')}
  </div>
</div>`;

/* ── Cabeçalho ────────────────────────────────────────────── */
function topo(raiz, atual) {
  const ini = `${raiz}index.html`;
  const itens = [
    ...CATEGORIAS.map((c) => [`${raiz}categoria/${c.id}.html`, c.nome.toUpperCase(), c.id]),
    [`${raiz}categoria/ofertas.html`, 'OFERTAS', 'ofertas'],
  ];
  // O catálogo completo entra no menu, não na home.
  const itensMenu = [[`${raiz}produtos.html`, 'TODOS OS PRODUTOS', 'produtos'], ...itens];
  return `<header class="topo" id="topo">
  <div class="wrap topo__linha">
    <button class="ico-btn topo__menu" id="abrirMenu" aria-label="Abrir menu"
      aria-expanded="false" aria-controls="menuMobile"><span></span><span></span><span></span></button>

    <a class="topo__marca" href="${ini}" aria-label="${esc(LOJA.nome)} ${esc(LOJA.sobrenome)} — início">
      ${marca(raiz)}
    </a>

    <nav class="nav" aria-label="Categorias">
      ${itens.map(([h, t, id]) => `<a href="${h}"${
        atual === id ? ' aria-current="page"' : ''}${
        id === 'ofertas' ? ' class="nav__oferta"' : ''}>${t}</a>`).join('\n      ')}
    </nav>

    <div class="topo__acoes">
      <button class="ico-btn" id="abrirBusca" aria-label="Buscar produtos">${ICO.busca}</button>
      <a class="ico-btn topo__conta" href="${raiz}conta.html" aria-label="Minha conta">${ICO.conta}</a>
      <button class="ico-btn" id="abrirFavoritos" aria-label="Ver favoritos">
        ${ICO.favorito}<span class="contador" id="contFav" aria-hidden="true">0</span>
      </button>
      <button class="ico-btn" id="abrirCarrinho" aria-label="Abrir carrinho">
        ${ICO.sacola}<span class="contador" id="contCar" aria-hidden="true">0</span>
      </button>
    </div>
  </div>

</header>

<!-- O menu mobile fica FORA do <header>: o backdrop-filter do topo cria
     bloco de contenção e um position:fixed lá dentro colapsa para a
     altura do cabeçalho em vez de ocupar a tela. -->
<div class="menu-mobile" id="menuMobile">
  <nav aria-label="Menu">
    <p class="menu-mobile__titulo">Categorias</p>
    ${itensMenu.map(([h, t]) => `<a href="${h}">${t}${ICO.seta}</a>`).join('')}
    <p class="menu-mobile__titulo">Atendimento</p>
    <a href="${ini}#faq">Dúvidas frequentes${ICO.seta}</a>
    <a href="${raiz}conta.html">Minha conta${ICO.seta}</a>
    <a href="${linkWhats(MSG.geral)}" target="_blank" rel="noopener">WhatsApp${ICO.seta}</a>
  </nav>
</div>`;
}

/* ── Busca em tela cheia ──────────────────────────────────── */
const busca = (raiz) => `<div class="busca" id="busca" role="dialog" aria-modal="true"
  aria-label="Buscar produtos" hidden>
  <div class="wrap busca__linha">
    <label class="sr" for="buscaCampo">Buscar produtos</label>
    ${ICO.busca}
    <input type="search" id="buscaCampo" placeholder="O que você procura?"
      autocomplete="off" spellcheck="false" enterkeyhint="search" data-raiz="${raiz}">
    <button class="ico-btn" id="fecharBusca" aria-label="Fechar busca">${ICO.fechar}</button>
  </div>
  <div class="wrap busca__corpo">
    <p class="busca__dicas" id="buscaDicas"><span>Buscas comuns:</span>
      ${['camiseta', 'tênis', 'perfume', 'moletom', 'relógio'].map((t) =>
        `<button type="button" class="pilula" data-termo="${t}">${t}</button>`).join('')}
    </p>
    <p class="busca__status" id="buscaStatus" role="status" aria-live="polite"></p>
    <div class="busca__grade" id="buscaResultados"></div>
  </div>
</div>`;

/* ── Gaveta: carrinho e favoritos ─────────────────────────── */
const gavetas = (raiz) => `<div class="cortina" id="cortina" hidden></div>

<aside class="gaveta" id="gavetaCarrinho" aria-labelledby="tituloCarrinho" aria-hidden="true">
  <header class="gaveta__topo">
    <h2 id="tituloCarrinho">Seu carrinho</h2>
    <button class="ico-btn" id="fecharCarrinho" aria-label="Fechar carrinho">${ICO.fechar}</button>
  </header>
  <div class="gaveta__frete">
    <p id="freteTexto">Faltam <b>${moeda(LOJA.freteGratis)}</b> para o frete grátis</p>
    <div class="barra"><span id="freteBarra" style="width:0%"></span></div>
  </div>
  <div class="gaveta__itens" id="carrinhoItens">
    <div class="vazio vazio--gaveta" id="carrinhoVazio">
      <p class="vazio__titulo">Seu carrinho está vazio</p>
      <p class="vazio__texto">Comece pelos mais vendidos.</p>
      <a class="btn btn--linha" href="${raiz}index.html#vendidos">Ver produtos</a>
    </div>
  </div>
  <footer class="gaveta__pe">
    <p class="gaveta__linha"><span>Subtotal</span><b id="carrinhoSubtotal">R$ 0,00</b></p>
    <p class="gaveta__linha gaveta__linha--desc" id="linhaDesconto" hidden>
      <span>Desconto</span><b id="carrinhoDesconto">− R$ 0,00</b></p>
    <p class="gaveta__linha"><span>Frete</span><b id="carrinhoFrete">A calcular</b></p>
    <p class="gaveta__linha gaveta__linha--total"><span>Total</span><b id="carrinhoTotal">R$ 0,00</b></p>
    <a class="btn btn--tinta btn--bloco" href="${raiz}checkout.html" id="irCheckout">Ir para o checkout</a>
    <button type="button" class="btn btn--texto btn--bloco" id="continuarComprando">Continuar comprando</button>
    <p class="gaveta__nota">${esc(AVISO_DEMO)}</p>
  </footer>
</aside>

<aside class="gaveta" id="gavetaFavoritos" aria-labelledby="tituloFav" aria-hidden="true">
  <header class="gaveta__topo">
    <h2 id="tituloFav">Favoritos</h2>
    <button class="ico-btn" id="fecharFavoritos" aria-label="Fechar favoritos">${ICO.fechar}</button>
  </header>
  <div class="gaveta__itens" id="favoritosItens">
    <div class="vazio vazio--gaveta" id="favoritosVazio">
      <p class="vazio__titulo">Nenhum favorito ainda</p>
      <p class="vazio__texto">Toque no coração de um produto para guardar aqui.</p>
    </div>
  </div>
</aside>`;

/* ── Rodapé ───────────────────────────────────────────────── */
function rodape(raiz) {
  const ini = `${raiz}index.html`;
  const col = (titulo, linhas) => `<nav class="rodape__col" aria-label="${esc(titulo)}">
    <h2>${esc(titulo)}</h2>
    <ul>${linhas.map(([h, t, ext]) => `<li><a href="${esc(h)}"${
      ext ? ' target="_blank" rel="noopener"' : ''}>${esc(t)}</a></li>`).join('')}</ul>
  </nav>`;

  return `<footer class="rodape">
  <div class="wrap">
    <div class="news">
      <div>
        <h2 class="news__titulo">Receba novidades e ofertas em primeira mão.</h2>
        <p class="news__texto">Lançamento e promoção chegam antes por e-mail. Dá para sair com um clique.</p>
      </div>
      <form class="news__form" id="newsForm" novalidate>
        <label class="sr" for="newsEmail">Seu e-mail</label>
        <input type="email" id="newsEmail" name="email" required placeholder="seu@email.com"
          autocomplete="email" enterkeyhint="send">
        <button type="submit" class="btn btn--claro">Quero receber</button>
        <p class="news__aviso" id="newsAviso" role="status" aria-live="polite"></p>
        <p class="news__legal">Formulário de demonstração: nada é enviado nem armazenado.</p>
      </form>
    </div>

    <div class="rodape__grade">
      <div class="rodape__marca">
        ${marca(raiz, 'p')}
        <p class="rodape__frase">${esc(LOJA.descricao)}</p>
        <ul class="redes">
          ${Object.entries(LOJA.redes).filter(([, url]) => url).map(([nome, url]) =>
            `<li><a href="${url}" target="_blank" rel="noopener"
               aria-label="${esc(nome)} da loja">${esc(nome)}</a></li>`).join('')}
        </ul>
      </div>
      ${col('Categorias', [...CATEGORIAS.map((c) => [`${raiz}categoria/${c.id}.html`, c.nome]),
                           [`${raiz}categoria/ofertas.html`, 'Ofertas']])}
      ${col('Atendimento', [
        [linkWhats(MSG.geral), `WhatsApp ${LOJA.whatsappVisivel}`, true],
        [`mailto:${LOJA.email}`, LOJA.email],
        [`${ini}#faq`, 'Perguntas frequentes'],
        [`${raiz}conta.html`, 'Meus pedidos'],
      ])}
      ${col('Políticas', [
        [`${ini}#faq`, 'Trocas e devoluções'],
        [`${ini}#faq`, 'Prazo de entrega'],
        [`${ini}#faq`, 'Formas de pagamento'],
        [`${ini}#faq`, 'Privacidade'],
      ])}
    </div>

    <div class="rodape__pagamento">
      <p>Formas de pagamento</p>
      <!-- Sem bandeiras reais: a loja é fictícia e não tem contrato com
           nenhuma delas. Se for usar de verdade, troque por selos próprios. -->
      <ul>${PAGAMENTOS.map((f) => `<li>${esc(f.nome)}</li>`).join('')}
        <li>Cartão de débito</li><li>Parcelamento em até ${LOJA.parcelas}x</li></ul>
    </div>

    <p class="rodape__demo">${esc(AVISO_DEMO)}</p>
    <div class="rodape__base">
      <p>© ${ANO} ${esc(LOJA.nome)} ${esc(LOJA.sobrenome)}. Loja fictícia de demonstração.</p>
      <p>CNPJ 00.000.000/0001-00 · ${esc(LOJA.assinatura)}</p>
    </div>
  </div>
</footer>`;
}

/** Catálogo mínimo para a busca e para o carrinho, em toda página. */
const indiceProdutos = (raiz) => PRODUTOS.map((p) => ({
  s: p.slug,
  n: p.nome,
  t: p.tipo,
  p: p.preco,
  d: p.precoDe || 0,
  e: p.estoque ? 1 : 0,
  i: `${raiz}${imagensDe(p)[0]}`,
  u: `${raiz}produto/${p.slug}.html`,
  // só o que a busca precisa casar; a filtragem fina é feita nos cartões
  b: [p.nome, p.tipo, marcaDe(p.marca).nome, categoriaDe(p.categoria).nome,
      p.cores.map((c) => c.nome).join(' ')].join(' ').toLowerCase(),
}));

export function pagina({ titulo, descricao, caminho = '', raiz = '', corpo, jsonLd = [],
                         atual, imagemSocial = 'assets/hero.svg', classe = '' }) {
  const canonico = `${LOJA.dominio}/${caminho}`;
  const dados = jsonLd.map((d) =>
    `<script type="application/ld+json">${JSON.stringify(d)}</script>`).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta name="theme-color" content="#131316">
<link rel="canonical" href="${esc(canonico)}">

<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(LOJA.nome)} ${esc(LOJA.sobrenome)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(canonico)}">
<meta property="og:image" content="${LOJA.dominio}/${imagemSocial}">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="${raiz}assets/favicon.svg" type="image/svg+xml">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@87..112,400..700&family=Instrument+Sans:wght@400;500;600&display=swap">

<link rel="stylesheet" href="${raiz}css/vanta.css">
<script>document.documentElement.className += " js";</script>
${dados}
</head>
<body${classe ? ` class="${classe}"` : ''} data-raiz="${raiz}">
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${tarja()}
${topo(raiz, atual)}
<main id="conteudo">
${corpo}
</main>
${rodape(raiz)}
${busca(raiz)}
${gavetas(raiz)}

<div class="aviso" id="aviso" role="status" aria-live="polite"></div>

<a class="flutuante" href="${linkWhats(MSG.geral)}" target="_blank" rel="noopener"
   aria-label="Falar com o atendimento no WhatsApp">${ICO.whats}</a>

<!-- Índice do catálogo: a busca de topo vale em qualquer página, então
     não pode depender dos cartões que a página desenhou. ~4 KB. -->
<script type="application/json" id="indiceCatalogo">${JSON.stringify(indiceProdutos(raiz))}</script>
<script src="${raiz}js/vanta.js" defer></script>
</body>
</html>
`;
}

export const jsonLdLoja = {
  '@context': 'https://schema.org', '@type': 'OnlineStore',
  name: `${LOJA.nome} ${LOJA.sobrenome}`,
  description: LOJA.descricao,
  url: LOJA.dominio + '/',
  telephone: LOJA.whatsappVisivel,
  email: LOJA.email,
  areaServed: 'BR',
  currenciesAccepted: 'BRL',
  paymentAccepted: 'Pix, cartão de crédito, boleto bancário',
};

export { ENTREGA, TROCA };
