/** Casca da página: <head>, topo, rodapé, barra fixa e WhatsApp. */
import { EU, linkWhats, CONTATO, AVISO_DEMO } from '../conteudo/site.js';
import { esc, ICO, botao, ctaWhats } from './ui.js';

const ANO = new Date().getFullYear();

const topo = () => `<header class="topo" id="topo">
  <div class="wrap topo__linha">
    <a class="marca" href="#topo" aria-label="${esc(EU.nome)} — início">
      <span class="marca__nome">${esc(EU.nome)}</span>
      <span class="marca__sub">Sites para joias e acessórios</span>
    </a>
    <nav class="nav" aria-label="Seções da página">
      <a href="#projetos">Projetos</a>
      <a href="#porque">Por que investir</a>
      <a href="#processo">Como funciona</a>
      <a href="#duvidas">Dúvidas</a>
    </nav>
    ${ctaWhats(linkWhats(CONTATO.orcamento), 'Quero meu site', 'peq')}
  </div>
</header>`;

const rodape = () => `<footer class="rodape">
  <div class="wrap">
    <div class="rodape__grade">
      <div>
        <p class="marca__nome">${esc(EU.nome)}</p>
        <p class="rodape__frase">${esc(EU.papel)} para lojas de prata, joalherias,
          semijoias, acessórios e marcas de moda. ${esc(EU.cidade)} e todo o Brasil.</p>
      </div>
      <nav class="rodape__col" aria-label="Contato">
        <h2>Falar comigo</h2>
        <ul>
          <li><a href="${linkWhats(CONTATO.geral)}" target="_blank" rel="noopener">WhatsApp ${esc(EU.whatsappVisivel)}</a></li>
          <li><a href="mailto:${esc(EU.email)}">${esc(EU.email)}</a></li>
          <li><a href="${esc(EU.instagramUrl)}" target="_blank" rel="noopener">${esc(EU.instagram)}</a></li>
        </ul>
      </nav>
      <nav class="rodape__col" aria-label="Projetos">
        <h2>Ver os projetos</h2>
        <ul>
          <li><a href="demos/prata-nobre/index.html" target="_blank" rel="noopener">PRATA NOBRE</a></li>
          <li><a href="demos/aurea/index.html" target="_blank" rel="noopener">AUREA</a></li>
          <li><a href="demos/volt/index.html" target="_blank" rel="noopener">VOLT</a></li>
        </ul>
      </nav>
    </div>
    <p class="rodape__demo">${esc(AVISO_DEMO)}</p>
    <p class="rodape__base">© ${ANO} ${esc(EU.nome)}. Todos os projetos desta página foram
      criados por mim.</p>
  </div>
</footer>`;

/* Barra fixa no pé do celular: o CTA nunca sai da tela. */
const barra = () => `<div class="barra-fixa" id="barraFixa">
  <div class="barra-fixa__texto">
    <b>Quer um site assim?</b>
    <span>Orçamento sem compromisso</span>
  </div>
  ${ctaWhats(linkWhats(CONTATO.orcamento), 'Quero meu site', 'peq')}
</div>`;

export function pagina({ titulo, descricao, corpo, jsonLd = [] }) {
  const dados = jsonLd.map((d) =>
    `<script type="application/ld+json">${JSON.stringify(d)}</script>`).join('\n');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
<meta name="theme-color" content="#FBFAF7">
<link rel="canonical" href="${esc(EU.dominio)}/">

<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
<meta property="og:url" content="${esc(EU.dominio)}/">
<meta property="og:image" content="${esc(EU.dominio)}/assets/aurea-desk.jpg">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@300;400;500;600&display=swap">

<link rel="stylesheet" href="css/vitrine.css">
<script>document.documentElement.className += " js";</script>
${dados}
</head>
<body>
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${topo()}
<main id="conteudo">
${corpo}
</main>
${rodape()}
${barra()}
<a class="flutuante" href="${linkWhats(CONTATO.geral)}" target="_blank" rel="noopener"
   aria-label="Falar comigo no WhatsApp">${ICO.whats}</a>
<script src="js/vitrine.js" defer></script>
</body>
</html>
`;
}
