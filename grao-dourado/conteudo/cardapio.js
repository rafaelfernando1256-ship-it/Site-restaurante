/* ═══════════════════════════════════════════════════════════════
   CARDÁPIO

   É a peça mais importante do site inteiro. Quem abre o site de um
   café quer ver o que tem e quanto custa — nessa ordem, em três
   segundos, sem dar zoom e sem baixar PDF.

   ⚠️ OS PREÇOS SÃO DE DEMONSTRAÇÃO.
   Foram estimados para a praça de Natal; nenhum veio da casa.
   Confira item por item antes de publicar. Mexa só no campo
   `preco` — o resto do site se ajusta sozinho.

   Os itens saíram do que está público no Instagram deles. Onde o
   perfil mostrava o produto mas não o detalhe, eu descrevi pelo que
   dá para ver na foto e marquei com `CONFERIR`.

   CAMPOS
     slug      id curto, usado na URL e no carrinho
     nome      como aparece no cardápio
     desc      uma linha. Duas já é longo demais no celular.
     preco     número, em reais
     cat       id da categoria
     arte      desenho em publico/img/ (reserva)
     foto      foto real em publico/img/foto/<nome>.jpg, sem extensão.
               Quando existe, é ela que aparece. Só entra onde dá para
               ter certeza do que é o prato — onde não dá, fica o desenho.
     marcas    selos: 'casa' | 'novo' | 'queridinho' | 'vegetariano'
     destaque  entra na vitrine da home
   ═══════════════════════════════════════════════════════════════ */

export const CATEGORIAS = [
  {
    id: 'cafes',
    nome: 'Cafés',
    resumo: 'Grão moído na hora, extraído na sua frente',
    arte: 'cat-cafes.svg',
    foto: 'graos',
  },
  {
    id: 'salgados',
    nome: 'Salgados',
    resumo: 'Sai do forno, não da estufa',
    arte: 'cat-salgados.svg',
    foto: 'esfiha',
  },
  {
    id: 'doces',
    nome: 'Doces e bolos',
    resumo: 'Receita de família, feita aqui',
    arte: 'cat-doces.svg',
    foto: 'pudim',
  },
  {
    id: 'geladas',
    nome: 'Geladas',
    resumo: 'Para o calor de Natal',
    arte: 'cat-geladas.svg',
    foto: 'mocha',
  },
];

export const ITENS = [
  /* ── Cafés ─────────────────────────────────────────────────── */
  {
    slug: 'espresso',
    nome: 'Espresso',
    desc: 'Curto, encorpado, com creme de verdade em cima',
    preco: 6.5,
    cat: 'cafes',
    arte: 'espresso.svg',
    foto: 'graos',
    marcas: [],
    destaque: true,
  },
  {
    slug: 'capuccino',
    nome: 'Capuccino',
    /* A casa chama de "sabor inconfundível" num post. Mantive o espírito. */
    desc: 'Espresso, leite vaporizado e aquele chapéu de espuma',
    preco: 12,
    cat: 'cafes',
    arte: 'capuccino.svg',
    foto: 'capuccino',
    marcas: ['queridinho'],
    destaque: true,
  },
  {
    slug: 'coado',
    nome: 'Coado na hora',
    desc: 'No coador de pano, do jeito que a avó fazia',
    preco: 7,
    cat: 'cafes',
    arte: 'coado.svg',
    marcas: ['casa'],
  },
  {
    slug: 'latte',
    nome: 'Latte',
    desc: 'Mais leite, menos amargor, desenho na espuma',
    preco: 13,
    cat: 'cafes',
    arte: 'latte.svg',
    marcas: [],
  },
  {
    slug: 'mocha',
    nome: 'Mocha',
    desc: 'Café com chocolate meio amargo e chantilly',
    preco: 15,
    cat: 'cafes',
    arte: 'mocha.svg',
    foto: 'mocha',
    marcas: [],
  },
  {
    slug: 'pingado',
    nome: 'Pingado',
    desc: 'Café coado com um dedo de leite quente',
    preco: 8,
    cat: 'cafes',
    arte: 'pingado.svg',
    marcas: [],
  },

  /* ── Salgados ──────────────────────────────────────────────── */
  {
    slug: 'empada-frango',
    nome: 'Empada de frango defumado',
    /* Os dois recheios estão num post deles, com essas palavras. */
    desc: 'Frango defumado com queijo do reino, massa que desmancha',
    preco: 13,
    cat: 'salgados',
    arte: 'empada-frango.svg',
    foto: 'empada-arte',
    marcas: ['casa', 'queridinho'],
  },
  {
    slug: 'empada-carne-de-sol',
    nome: 'Empada de carne de sol',
    desc: 'Carne de sol na nata, do jeito que se faz no Nordeste',
    preco: 14,
    cat: 'salgados',
    arte: 'empada-carne.svg',
    marcas: ['casa'],
  },
  {
    slug: 'quiche-queijo',
    nome: 'Quiche de queijo',
    desc: 'Massa crocante por fora, recheio cremoso por dentro',
    preco: 15,
    cat: 'salgados',
    arte: 'quiche.svg',
    foto: 'quiche',
    marcas: ['vegetariano'],
    destaque: true,
  },
  {
    slug: 'esfiha-caseira',
    nome: 'Esfiha da casa',
    /* "Vem quentinho e feito na hora" é texto do post deles. */
    desc: 'Receita de família, assada na hora e servida quentinha',
    preco: 11,
    cat: 'salgados',
    arte: 'esfiha.svg',
    foto: 'esfiha',
    marcas: ['casa'],
    destaque: true,
  },
  {
    slug: 'croissant',
    nome: 'Croissant',
    desc: 'Folhado amanteigado, aquecido antes de ir pra mesa',
    preco: 12,
    cat: 'salgados',
    arte: 'croissant.svg',
    marcas: ['vegetariano'],
  },
  {
    slug: 'croissant-queijo',
    nome: 'Croissant de queijo e presunto',
    desc: 'O mesmo folhado, agora com recheio e gratinado',
    preco: 16,
    cat: 'salgados',
    arte: 'croissant-queijo.svg',
    marcas: [],
  },
  {
    slug: 'tapioca',
    /* ⚠️ CONFERIR — não vi tapioca no perfil. Está aqui porque é
       item óbvio de café em Natal; tire se a casa não fizer. */
    nome: 'Tapioca de queijo coalho',
    desc: 'Goma peneirada na hora, queijo coalho derretendo',
    preco: 14,
    cat: 'salgados',
    arte: 'tapioca.svg',
    marcas: ['vegetariano'],
  },

  /* ── Doces e bolos ─────────────────────────────────────────── */
  {
    slug: 'bolo-da-moca',
    /* Eles revelaram a receita num post — virou marca da casa. */
    nome: 'Bolo da moça',
    desc: 'O da receita que a gente já mostrou no Instagram. Leite moça de verdade',
    preco: 11,
    cat: 'doces',
    arte: 'bolo-moca.svg',
    marcas: ['casa', 'queridinho'],
  },
  {
    slug: 'pudim',
    nome: 'Pudim',
    desc: 'Calda escura, textura lisa, sem furinho nenhum',
    preco: 12,
    cat: 'doces',
    arte: 'pudim.svg',
    foto: 'pudim',
    marcas: ['casa'],
    destaque: true,
  },
  {
    slug: 'bolo-de-milho',
    nome: 'Bolo de milho cremoso',
    desc: 'Aquele de tabuleiro, úmido, que pede café preto',
    preco: 10,
    cat: 'doces',
    arte: 'bolo-milho.svg',
    foto: 'bolo-milho',
    marcas: ['casa', 'vegetariano'],
    destaque: true,
  },
  {
    slug: 'torta-limao',
    nome: 'Torta de limão',
    desc: 'Massa de biscoito, creme azedinho e merengue maçaricado',
    preco: 14,
    cat: 'doces',
    arte: 'torta-limao.svg',
    marcas: ['vegetariano'],
  },
  {
    slug: 'brownie',
    nome: 'Brownie',
    desc: 'Casquinha por cima, molhadinho por dentro',
    preco: 12,
    cat: 'doces',
    arte: 'brownie.svg',
    marcas: ['vegetariano'],
  },
  {
    slug: 'cookie',
    nome: 'Cookie de chocolate',
    desc: 'Grande, com gotas que ainda derretem',
    preco: 9,
    cat: 'doces',
    arte: 'cookie.svg',
    marcas: ['vegetariano'],
  },

  /* ── Geladas ───────────────────────────────────────────────── */
  {
    slug: 'cafe-gelado',
    nome: 'Café gelado',
    desc: 'Espresso sobre gelo, sem aguar o sabor',
    preco: 13,
    cat: 'geladas',
    arte: 'cafe-gelado.svg',
    marcas: [],
  },
  {
    slug: 'frappe',
    nome: 'Frappê de café',
    desc: 'Batido, cremoso, com chantilly por cima',
    preco: 18,
    cat: 'geladas',
    arte: 'frappe.svg',
    marcas: ['novo'],
  },
  {
    slug: 'suco',
    nome: 'Suco da fruta',
    desc: 'Fruta da estação, batida na hora. Pergunte qual tem hoje',
    preco: 11,
    cat: 'geladas',
    arte: 'suco.svg',
    marcas: ['vegetariano'],
  },
  {
    slug: 'agua',
    nome: 'Água',
    desc: 'Com ou sem gás, bem gelada',
    preco: 5,
    cat: 'geladas',
    arte: 'agua.svg',
    marcas: [],
  },
];

/* ── Combos ────────────────────────────────────────────────────── */
/* Combo é a forma mais barata de subir ticket médio num café: a
   pessoa já ia pedir o cafezinho, e o salgado entra junto. */
export const COMBOS = [
  {
    slug: 'combo-manha',
    nome: 'Começo de dia',
    desc: 'Café coado + empada de frango',
    itens: ['coado', 'empada-frango'],
    preco: 17,
    arte: 'combo-manha.svg',
  },
  {
    slug: 'combo-tarde',
    nome: 'Tarde boa',
    desc: 'Capuccino + fatia de bolo da moça',
    itens: ['capuccino', 'bolo-da-moca'],
    preco: 20,
    arte: 'combo-tarde.svg',
  },
  {
    slug: 'combo-dois',
    nome: 'Pra dois',
    desc: 'Dois cafés + dois salgados, à sua escolha',
    itens: ['coado', 'coado', 'esfiha-caseira', 'esfiha-caseira'],
    preco: 34,
    arte: 'combo-dois.svg',
  },
];

/* ── Selos ─────────────────────────────────────────────────────── */
export const MARCAS = {
  casa: { nome: 'Da casa', titulo: 'Feito aqui dentro, receita nossa' },
  novo: { nome: 'Novo', titulo: 'Entrou no cardápio agora' },
  queridinho: { nome: 'Mais pedido', titulo: 'O que mais sai' },
  vegetariano: { nome: 'Vegetariano', titulo: 'Sem carne' },
};

/* ── Consultas ─────────────────────────────────────────────────── */
export const itensDe = (cat) => ITENS.filter((i) => i.cat === cat);
export const porSlug = (slug) => ITENS.find((i) => i.slug === slug);
export const destaques = () => ITENS.filter((i) => i.destaque);
export const dinheiro = (v) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
