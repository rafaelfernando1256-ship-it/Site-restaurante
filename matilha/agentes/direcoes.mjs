/**
 * AS DIREÇÕES DE ARTE — o que impede o site de sair com cara de IA.
 *
 * "Faça um site bonito de pizzaria" dá sempre o mesmo site: fundo
 * escuro, laranja forte, título em duas cores, etiqueta em caixa alta,
 * pizza desenhada, três cartões com ícone, faixa de estrelas. É o que o
 * modelo produz quando ninguém decide por ele.
 *
 * Aqui a decisão vem pronta: cada ramo tem algumas direções, e cada
 * direção fixa a paleta (com o ACENTO gasto quase nada), o par de
 * fontes, e como é o topo com foto e sem foto. Paletas e pares de
 * fontes foram tirados de sites reais de estúdio (via a biblioteca de
 * referência de design que montou este painel), não inventados.
 *
 * A escolha é por cliente, fixa (o mesmo cliente cai sempre na mesma
 * direção) e varia entre clientes do mesmo ramo: duas pizzarias da
 * mesma cidade não recebem o mesmo site.
 */

const fonte = (...familias) => `https://fonts.googleapis.com/css2?${familias.map((f) => `family=${f}`).join('&')}&display=swap`;

const D = {
  // ── comida ──────────────────────────────────────────────────────
  casa_de_massa: {
    nome: 'Casa de massa',
    paleta: { fundo: '#e9e4da', superficie: '#ddd6c8', tinta: '#1d1a16', suave: '#6a6258', acento: '#2f5d3a', tintaDoAcento: '#ffffff' },
    uso: 'Pedra quente clara com tinta quase preta. O verde-manjericão só no botão de pedir e nos preços, se houver. Nenhuma seção pintada de verde.',
    fontes: { titulo: 'Besley', texto: 'Libre Franklin', link: fonte('Besley:wght@700;800', 'Libre+Franklin:wght@400;500;600') },
    tipografia: 'Títulos em Besley 800 (um clarendon gordo de placa de cantina), grandes e apertados (letter-spacing -0.02em, line-height 0.95). Texto em Libre Franklin 400, 17px. Sem caixa alta, sem itálico.',
    topoComFoto: 'A foto mais apetitosa ocupa a largura toda e uns 60% da altura da tela, colada no topo, sem borda nem canto arredondado. Logo abaixo, na cor do fundo, o nome em Besley enorme alinhado à esquerda, e na mesma linha (à direita, no computador) o endereço curto e o botão de pedir.',
    topoSemFoto: 'O topo É o cardápio: o nome em Besley enorme e, logo abaixo, as categorias do cardápio como uma lista tipográfica grande, uma por linha, como placa de cantina pintada na parede. O botão de pedir ao lado. Nada de desenho de comida.',
  },
  forno_a_noite: {
    nome: 'Forno à noite',
    paleta: { fundo: '#15120f', superficie: '#211c17', tinta: '#f1ece4', suave: '#a89f93', acento: '#d9a441', tintaDoAcento: '#15120f' },
    uso: 'Quase preto quente, como um salão à luz baixa. O dourado só no botão principal e num detalhe pequeno. Fotos acesas contra o escuro. Sem brilho, sem glow, sem gradiente.',
    fontes: { titulo: 'Bebas Neue', texto: 'EB Garamond', link: fonte('Bebas+Neue', 'EB+Garamond:ital,wght@0,400;0,500;1,400') },
    tipografia: 'Títulos em Bebas Neue, maiúsculas condensadas, muito grandes (até 9vw), em uma cor só. Texto em EB Garamond 19px, com itálico só para nomes de pratos. O contraste é de tamanho, não de cor.',
    topoComFoto: 'Uma foto ocupa a tela inteira (100svh), escurecida com uma película preta uniforme (rgba(0,0,0,0.45), a única exceção ao "sem gradiente"); o nome em Bebas gigante encostado na borda de baixo, à esquerda; o botão pequeno e firme ao lado.',
    topoSemFoto: 'Fundo escuro liso. O nome em Bebas ocupando quase a largura toda, em duas linhas; abaixo, em Garamond, uma frase concreta (o que serve, onde, que noites abre) e o botão. Nenhuma ilustração.',
  },
  mesa_clara: {
    nome: 'Mesa clara',
    paleta: { fundo: '#ffffff', superficie: '#f2f2f0', tinta: '#111111', suave: '#666666', acento: '#b11226', tintaDoAcento: '#ffffff' },
    uso: 'Branco e preto fazem tudo; um cinza claro para áreas preenchidas. O vermelho-tomate só no botão de pedir. O rodapé pode inverter para preto.',
    fontes: { titulo: 'Schibsted Grotesk', texto: 'Schibsted Grotesk', link: fonte('Schibsted+Grotesk:wght@400;500;800') },
    tipografia: 'Uma família só. Títulos em 800 bem apertados (letter-spacing -0.04em, line-height 0.92), texto em 400 com 17px. Hierarquia por tamanho e peso, nunca por cor.',
    topoComFoto: 'Texto à esquerda em uma coluna estreita (nome grande, uma frase, o botão) e, à direita, uma fileira de 3 fotos altas lado a lado, retas, sem espaço entre elas, como uma vitrine.',
    topoSemFoto: 'O nome do negócio em 800 gigante, quebrado em duas ou três linhas, ocupando a primeira tela. Embaixo, numa linha só: o endereço, o horário de hoje e o botão de pedir.',
  },
  // ── beleza ──────────────────────────────────────────────────────
  navalha: {
    nome: 'Navalha',
    paleta: { fundo: '#161616', superficie: '#212121', tinta: '#f2f2f2', suave: '#a3a3a3', acento: '#a08672', tintaDoAcento: '#161616' },
    uso: 'Preto macio com painéis um tom acima. O bronze só no botão de agendar. Fotos em preto e branco ficam ótimas aqui (filter: grayscale(1) só se a foto for colorida demais).',
    fontes: { titulo: 'Big Shoulders', texto: 'Public Sans', link: fonte('Big+Shoulders:wght@700;800', 'Public+Sans:wght@400;500') },
    tipografia: 'Títulos em Big Shoulders 800 maiúsculo, alto e apertado, como letreiro de rua. Texto em Public Sans 16px. Os serviços numa lista com o nome à esquerda e "consulte" à direita, sem cartões.',
    topoComFoto: 'Tela dividida: à esquerda a foto do trabalho em altura total; à direita, no preto, o nome em Big Shoulders e o botão de agendar.',
    topoSemFoto: 'O nome em Big Shoulders gigante no preto, uma frase concreta embaixo, e logo a lista de serviços já na primeira tela.',
  },
  salao_claro: {
    nome: 'Salão claro',
    paleta: { fundo: '#ebe5e3', superficie: '#e1dad7', tinta: '#2b2622', suave: '#776d67', acento: '#351a2b', tintaDoAcento: '#ffffff' },
    uso: 'Um cinza rosado cobre a página com tinta marrom-escura. A berinjela escura só no botão. Sem rosa-chiclete, sem dourado.',
    fontes: { titulo: 'Bodoni Moda', texto: 'Jost', link: fonte('Bodoni+Moda:opsz,wght@6..96,500;6..96,600', 'Jost:wght@400;500') },
    tipografia: 'Títulos em Bodoni Moda 500, grandes, como capa de revista; texto em Jost 400 16px. Um só itálico permitido: nenhum.',
    topoComFoto: 'Uma foto vertical grande à direita, tocando o topo; o nome em Bodoni à esquerda, alinhado embaixo, com o botão.',
    topoSemFoto: 'Muito espaço vazio: o nome em Bodoni numa linha só, no meio da altura, alinhado à esquerda; embaixo, a lista dos serviços em Jost.',
  },
  // ── saúde ───────────────────────────────────────────────────────
  consultorio: {
    nome: 'Consultório',
    paleta: { fundo: '#f7f9fa', superficie: '#ecf0f2', tinta: '#1f3038', suave: '#5d6b72', acento: '#0d7480', tintaDoAcento: '#ffffff' },
    uso: 'Branco frio e um azul-acinzentado mais claro seguram tudo, tinta em ardósia. O verde-petróleo uma vez por tela, no botão de agendar.',
    fontes: { titulo: 'Albert Sans', texto: 'Albert Sans', link: fonte('Albert+Sans:wght@400;500;600') },
    tipografia: 'Albert Sans em tudo: títulos 600 com -0.02em, texto 400 17px. Calma e precisão.',
    topoComFoto: 'Foto do espaço real à direita, ocupando metade da tela; à esquerda o nome, a especialidade em uma frase e o botão de agendar.',
    topoSemFoto: 'O nome e a especialidade grandes à esquerda; à direita, numa área preenchida no tom da superfície, o horário e o endereço como informação útil, não como decoração.',
  },
  // ── hospedagem ──────────────────────────────────────────────────
  mata: {
    nome: 'Mata',
    paleta: { fundo: '#161c1a', superficie: '#1f2725', tinta: '#e3e2da', suave: '#9fa59d', acento: '#9fc7b8', tintaDoAcento: '#161c1a' },
    uso: 'Verde quase preto do começo ao fim, tinta cor de osso. O verde-água claro só no botão de reservar.',
    fontes: { titulo: 'Newsreader', texto: 'Newsreader', link: fonte('Newsreader:opsz,wght@6..72,300;6..72,400') },
    tipografia: 'Newsreader 300 muito grande e apertado nos títulos, 400 no texto. Ritmo lento, muito espaço.',
    topoComFoto: 'Foto em tela cheia, com o nome pequeno e elegante embaixo à esquerda e o botão de reservar à direita.',
    topoSemFoto: 'Uma frase longa e calma sobre o lugar, em Newsreader enorme, ocupando a primeira tela; o nome e o botão embaixo.',
  },
  // ── automotivo ──────────────────────────────────────────────────
  oficina: {
    nome: 'Oficina',
    paleta: { fundo: '#18191b', superficie: '#222427', tinta: '#eff0f1', suave: '#a0a4a8', acento: '#ff4a1f', tintaDoAcento: '#18191b' },
    uso: 'Grafite e cinza claro se alternam por seção. O laranja de segurança SÓ no botão de chamar: nunca em fundo de seção.',
    fontes: { titulo: 'Barlow Condensed', texto: 'Barlow', link: fonte('Barlow+Condensed:wght@700', 'Barlow:wght@400;500') },
    tipografia: 'Títulos em Barlow Condensed 700 maiúsculo; texto em Barlow 17px. Serviços em lista densa, como placa de oficina.',
    topoComFoto: 'Foto da oficina real em tela cheia com película escura; nome em Barlow Condensed grande, o que resolve em uma frase, botão de chamar.',
    topoSemFoto: 'O nome gigante em Barlow Condensed no grafite, e já embaixo a lista de serviços em duas colunas e o botão.',
  },
  // ── pet ─────────────────────────────────────────────────────────
  quintal: {
    nome: 'Quintal',
    paleta: { fundo: '#f7f7f7', superficie: '#ebebeb', tinta: '#0d2a1c', suave: '#4f6157', acento: '#0d2a1c', tintaDoAcento: '#f6e016' },
    uso: 'Branco-gelo com toda a tinta em verde-garrafa. O botão é verde-garrafa com texto amarelo; o amarelo não aparece em mais lugar nenhum.',
    fontes: { titulo: 'League Spartan', texto: 'Figtree', link: fonte('League+Spartan:wght@700', 'Figtree:wght@400;500') },
    tipografia: 'Títulos em League Spartan 700 em minúsculas, curtos e firmes; texto em Figtree 17px.',
    topoComFoto: 'Foto grande de bicho real ocupando a direita e passando da borda; o nome e o botão de agendar à esquerda.',
    topoSemFoto: 'Nome grande em League Spartan, e embaixo os serviços (banho, tosa…) como uma lista grande e direta.',
  },
  // ── academia ────────────────────────────────────────────────────
  treino: {
    nome: 'Treino',
    paleta: { fundo: '#0f0f0f', superficie: '#1a1a1a', tinta: '#ffffff', suave: '#a6a6a6', acento: '#dafa9c', tintaDoAcento: '#0f0f0f' },
    uso: 'Preto e branco. O verde-limão pálido só no botão da aula experimental.',
    fontes: { titulo: 'Anton', texto: 'Work Sans', link: fonte('Anton', 'Work+Sans:wght@400;500') },
    tipografia: 'Títulos em Anton maiúsculo empilhado e apertado; texto pequeno em Work Sans.',
    topoComFoto: 'Foto de movimento em tela cheia com película escura; o nome em Anton enorme por cima, embaixo à esquerda.',
    topoSemFoto: 'O nome em Anton ocupando a largura toda, e as modalidades numa lista grande logo abaixo.',
  },
  // ── os outros ramos ─────────────────────────────────────────────
  papel_e_tinta: {
    nome: 'Papel e tinta',
    paleta: { fundo: '#dfdedb', superficie: '#d3d2ce', tinta: '#26251e', suave: '#66645c', acento: '#2456d6', tintaDoAcento: '#ffffff' },
    uso: 'Papel cor de pedra com tinta quase preta. O azul só nos links e no botão.',
    fontes: { titulo: 'Archivo', texto: 'Archivo', link: fonte('Archivo:wght@400;500;800') },
    tipografia: 'Archivo 800 nos títulos, apertado; 400 no texto, 17px.',
    topoComFoto: 'Uma foto por vez, grande, à direita; o nome e a frase à esquerda.',
    topoSemFoto: 'O nome enorme em Archivo e, logo abaixo, o que o negócio faz em uma lista grande.',
  },
  folha_branca: {
    nome: 'Folha branca',
    paleta: { fundo: '#ffffff', superficie: '#f4f4f4', tinta: '#111111', suave: '#6b6b6b', acento: '#1a4be0', tintaDoAcento: '#ffffff' },
    uso: 'Branco, preto e um cinza. O azul só nos links e no único botão.',
    fontes: { titulo: 'Hanken Grotesk', texto: 'Hanken Grotesk', link: fonte('Hanken+Grotesk:wght@400;500;600') },
    tipografia: 'Hanken Grotesk 500 grande nos títulos, 400 no texto. Afirmações curtas em tamanho grande contra texto pequeno.',
    topoComFoto: 'Nome e frase em cima, e uma foto larga embaixo ocupando a largura.',
    topoSemFoto: 'Uma afirmação grande sobre o que o negócio faz, o nome menor acima, e o botão.',
  },
};

const POR_RAMO = {
  comida: ['casa_de_massa', 'forno_a_noite', 'mesa_clara'],
  beleza: ['navalha', 'salao_claro'],
  saude: ['consultorio', 'folha_branca'],
  hospedagem: ['mata', 'papel_e_tinta'],
  automotivo: ['oficina', 'papel_e_tinta'],
  pet: ['quintal', 'folha_branca'],
  academia: ['treino', 'oficina'],
  geral: ['papel_e_tinta', 'folha_branca', 'mesa_clara'],
};

/** Um número fixo para o mesmo cliente: a escolha não muda a cada vez. */
function semente(texto) {
  let h = 2166136261;
  for (const c of String(texto)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h);
}

/** A direção deste cliente, dentro das do ramo dele. */
export function direcaoDe(lead, chaveDoRamo) {
  const lista = POR_RAMO[chaveDoRamo] || POR_RAMO.geral;
  const id = lista[semente(lead?.id || lead?.nome || '') % lista.length];
  return { id, ...D[id] };
}

/** O que denuncia um site feito por IA, para o briefing e para a revisão. */
export const MARCAS_DE_IA = `- etiqueta pequena em caixa alta com letras espaçadas em cima dos títulos ("CARDÁPIO", "COMO PEDIR");
- título com um pedaço em outra cor ou em itálico;
- gradiente de qualquer tipo, brilho (glow), sombra em cartão ou em texto (a única exceção é uma película preta lisa sobre uma foto);
- ilustração desenhada do produto (pizza, tesoura, dente, carro) em SVG, ícone dentro de quadradinho, emoji;
- três cartões iguais lado a lado com ícone; seção "como funciona em 3 passos"; números 01, 02, 03;
- faixa inteira pintada na cor de destaque; estrelas desenhadas; pílula/selo em cima do título;
- linhas finas separando tudo e caixas com borda de 1px (linha só em tabela de horário);
- tudo centralizado; todas as seções com a mesma forma (título, frase, grade);
- cor fora da paleta, ou a cor de destaque gasta em área grande;
- frases de efeito: "bateu a fome", "sabor inesquecível", "feito com amor", "experiência única", "qualidade e excelência", "venha conferir", "o melhor da região", "seja bem-vindo", "tradição e sabor", "não perca".`;
