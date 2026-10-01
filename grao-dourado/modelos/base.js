/* ═══════════════════════════════════════════════════════════════
   ESQUELETO DA PÁGINA
   <head>, topo, menu de celular, rodapé e os scripts. Toda página
   passa por aqui, então o que muda aqui muda no site inteiro.
   ═══════════════════════════════════════════════════════════════ */
import { MARCA, wa, horariosAgrupados } from '../conteudo/marca.js';
import { AVISO, FECHAMENTO } from '../conteudo/pagina.js';
import { CATEGORIAS, ITENS, COMBOS } from '../conteudo/cardapio.js';
import { esc, icone, seloAberto, botao } from './ui.js';

const NAV = [
  { href: 'cardapio.html', rotulo: 'Cardápio' },
  { href: 'index.html#encomendas', rotulo: 'Encomendas' },
  { href: 'index.html#agenda', rotulo: 'Agenda' },
  { href: 'index.html#espaco', rotulo: 'O espaço' },
  { href: 'index.html#chegar', rotulo: 'Como chegar' },
];

/* Dados estruturados. As notas de avaliação ficam DE FORA de
   propósito: são um site demonstrativo e marcar ficção como dado
   estruturado é o tipo de coisa que rende punição de buscador. */
function dadosEstruturados() {
  const dias = {
    0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
    4: 'Thursday', 5: 'Friday', 6: 'Saturday',
  };
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CafeOrCoffeeShop',
    name: MARCA.nomeCompleto,
    description: MARCA.lema,
    servesCuisine: ['Café', 'Padaria', 'Lanches'],
    priceRange: 'R$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: MARCA.endereco.linha1,
      addressLocality: 'Natal',
      addressRegion: 'RN',
      addressCountry: 'BR',
    },
    telephone: `+${MARCA.whatsapp}`,
    sameAs: [`https://instagram.com/${MARCA.instagram}`],
    openingHoursSpecification: MARCA.horarios
      .filter((h) => h.abre !== null)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${dias[h.n]}`,
        opens: hhmm(h.abre),
        closes: hhmm(h.fecha),
      })),
  });
}

export function cabecalho({ raiz = '', atual = '' } = {}) {
  const links = NAV.map((l) => {
    const href = raiz + l.href;
    const ativo = l.href.split('#')[0] === atual ? ' aria-current="page"' : '';
    return `<a href="${esc(href)}"${ativo}>${esc(l.rotulo)}</a>`;
  }).join('');

  return `
<a class="pular" href="#conteudo">Pular para o conteúdo</a>

<header class="topo" data-topo>
  <div class="topo__linha">
    <a class="marca" href="${raiz}index.html">
      <img src="${raiz}img/logo.svg" alt="" width="240" height="240">
      <span class="marca__txt">
        <strong>${esc(MARCA.nome)}</strong>
        <small>${esc(MARCA.descritor)}</small>
      </span>
    </a>

    <nav class="nav" aria-label="Navegação principal">${links}</nav>

    <div class="topo__acoes">
      ${seloAberto()}
      ${botao({
        href: wa(FECHAMENTO.mensagemWhats),
        texto: 'Pedir',
        variante: 'whats',
        ico: icone.whats,
        externo: true,
        classe: 'btn--sm topo__pedir',
      })}
      <button type="button" class="hamburguer" data-menu-abre
              aria-expanded="false" aria-controls="menu-cel" aria-label="Abrir menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</header>

<!-- O menu fica FORA do <header> de propósito: o header tem
     backdrop-filter, e backdrop-filter cria bloco de contenção para
     descendente position:fixed — o menu colapsaria para a altura da
     barra em vez de ocupar a tela. -->
<div class="menucel" id="menu-cel" data-menu hidden>
  <nav class="menucel__nav" aria-label="Navegação">
    ${NAV.map((l) => `<a href="${esc(raiz + l.href)}">${esc(l.rotulo)}</a>`).join('')}
  </nav>
  <div class="menucel__pe">
    ${botao({
      href: wa(FECHAMENTO.mensagemWhats),
      texto: 'Chamar no WhatsApp',
      variante: 'whats',
      ico: icone.whats,
      externo: true,
    })}
    <a class="social" href="https://instagram.com/${MARCA.instagram}"
       target="_blank" rel="noopener noreferrer">${icone.insta}<span>@${esc(MARCA.instagram)}</span></a>
  </div>
</div>`;
}

export function rodape({ raiz = '' } = {}) {
  const horas = horariosAgrupados()
    .map((h) => `<div class="hr__linha${h.fechado ? ' hr__linha--off' : ''}" data-dias="${h.ns.join(',')}">
        <span>${esc(h.dias)}</span><span>${esc(h.horas)}</span></div>`)
    .join('');

  return `
<footer class="rodape">
  <div class="wrap rodape__grade">
    <div>
      <a class="marca marca--rod" href="${raiz}index.html">
        <img src="${raiz}img/logo.svg" alt="" width="240" height="240">
        <span class="marca__txt"><strong>${esc(MARCA.nome)}</strong><small>${esc(MARCA.descritor)}</small></span>
      </a>
      <p class="rodape__lema">${esc(MARCA.lema)}</p>
      <a class="social" href="https://instagram.com/${MARCA.instagram}"
         target="_blank" rel="noopener noreferrer">${icone.insta}<span>@${esc(MARCA.instagram)}</span></a>
    </div>

    <div>
      <h2 class="rodape__tit">Onde fica</h2>
      <p>${esc(MARCA.endereco.linha1)}<br>${esc(MARCA.endereco.linha2)}</p>
      <p class="rodape__nota">${esc(MARCA.endereco.referencia)}</p>
      <a class="rodape__link" href="${esc(MARCA.endereco.mapa)}"
         target="_blank" rel="noopener noreferrer">Abrir no mapa</a>
    </div>

    <div>
      <h2 class="rodape__tit">Horário</h2>
      <div class="hr">${horas}</div>
    </div>

    <div>
      <h2 class="rodape__tit">Falar com a gente</h2>
      <p class="rodape__whats">${esc(MARCA.whatsappVisivel)}</p>
      ${botao({
        href: wa(FECHAMENTO.mensagemWhats),
        texto: 'Chamar no WhatsApp',
        variante: 'whats',
        ico: icone.whats,
        externo: true,
      })}
      <nav class="rodape__nav" aria-label="Páginas">
        ${CATEGORIAS.map((c) => `<a href="${raiz}cardapio.html#${esc(c.id)}">${esc(c.nome)}</a>`).join('')}
      </nav>
    </div>
  </div>

  <div class="wrap rodape__base">
    <p><strong>${esc(AVISO.texto)}.</strong> ${esc(AVISO.detalhe)}</p>
    <p>Feito como exemplo, a partir do que está público no Instagram da casa.</p>
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
<meta name="theme-color" content="#241510">
<link rel="icon" href="${raiz}img/favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${esc(MARCA.nomeCompleto)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta name="robots" content="noindex,follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Karla:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${raiz}css/grao.css">
<script type="application/ld+json">${dadosEstruturados()}</script>
</head>
<body class="${classe}">
${cabecalho({ raiz, atual })}
<main id="conteudo">
${corpo}
</main>
${rodape({ raiz })}

<!-- Barra de demonstração. Fica visível porque o site é sobre um
     negócio real que não pediu por ele: esconder isso no rodapé
     seria o mesmo que não avisar. -->
<aside class="demo" role="note">
  <strong>${esc(AVISO.texto)}</strong>
  <span>${esc(AVISO.detalhe)}</span>
</aside>

<!-- Pedido montado no cliente, enviado pelo WhatsApp. Não há
     pagamento aqui e não existe servidor: é interface. -->
<div class="pedido" data-pedido hidden>
  <button type="button" class="pedido__fechar" data-pedido-fecha aria-label="Fechar o pedido">&times;</button>
  <h2 class="pedido__tit">Seu pedido</h2>
  <ul class="pedido__lista" data-pedido-lista></ul>
  <p class="pedido__total"><span>Total</span><strong data-pedido-total>R$ 0,00</strong></p>
  <p class="pedido__nota">O envio abre o WhatsApp com a lista escrita. A confirmação e o pagamento acontecem na conversa.</p>
  <a class="btn btn--whats btn--bloco" data-pedido-enviar href="${wa()}"
     target="_blank" rel="noopener noreferrer">${icone.whats}Enviar pelo WhatsApp</a>
</div>
<button type="button" class="pedido__bolha" data-pedido-abre hidden>
  ${icone.sacola}<span data-pedido-contagem>0</span>
</button>

<!-- Dados que o comportamento precisa. Vão enxutos de propósito:
     só o que o carrinho e o selo de horário consultam. -->
<script>window.GRAO=${JSON.stringify({
  whatsapp: MARCA.whatsapp,
  horarios: MARCA.horarios.map((h) => ({ n: h.n, curto: h.curto, abre: h.abre, fecha: h.fecha })),
  itens: ITENS.map((i) => ({ slug: i.slug, nome: i.nome, preco: i.preco })),
  combos: COMBOS.map((c) => ({ slug: c.slug, itens: c.itens })),
})};</script>
<script src="${raiz}js/grao.js" defer></script>
</body>
</html>`;
}

export { NAV };
