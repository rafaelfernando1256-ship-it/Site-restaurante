/**
 * VANTA STORE — catálogo.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ É AQUI QUE VOCÊ MEXE NOS PRODUTOS.                           │
 * │ Nome, preço, desconto, cores, tamanhos, estoque e descrição   │
 * │ saem todos deste arquivo. Depois de editar, rode:             │
 * │     node construir.mjs                                        │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Uma alteração aqui se propaga sozinha para: os cartões da home, a
 * página de cada produto, as páginas de categoria, a busca, os filtros,
 * a ordenação, o carrinho, os relacionados, o sitemap e o JSON-LD.
 *
 * Loja e marcas são FICTÍCIAS, criadas para demonstração de portfólio.
 */

/* ── Categorias de topo (viram páginas próprias) ───────────── */
export const CATEGORIAS = [
  { id: 'roupas', nome: 'Roupas', banner: 'cat-roupas.svg',
    bannerAlto: 'cat-roupas-alto.svg',
    chamada: 'Peças de base para montar o guarda-roupa inteiro',
    texto: 'Camisetas, camisas, moletons, calças, bermudas e jaquetas. ' +
           'Modelagens que conversam entre si, para qualquer peça combinar ' +
           'com qualquer outra da loja.' },
  { id: 'tenis', nome: 'Tênis', banner: 'cat-tenis.svg',
    bannerAlto: 'cat-tenis-alto.svg',
    chamada: 'Sneakers do 38 ao 44, para o dia todo em pé',
    texto: 'Runner, court, chunky e cano alto. Todos com entressola ' +
           'amortecida e numeração brasileira conferida peça a peça.' },
  { id: 'perfumes', nome: 'Perfumes', banner: 'cat-perfumes.svg',
    bannerAlto: 'cat-perfumes-alto.svg',
    chamada: 'Fragrâncias com fixação de verdade',
    texto: 'Eau de parfum com 15% a 20% de concentração. Três famílias ' +
           'olfativas para três momentos diferentes do dia.' },
  { id: 'acessorios', nome: 'Acessórios', banner: 'cat-acessorios.svg',
    bannerAlto: 'cat-acessorios-alto.svg',
    chamada: 'O detalhe que fecha o look',
    texto: 'Bonés, correntes, pulseiras, relógios, óculos e bolsas. ' +
           'Aço inox e materiais que aguentam uso diário.' },
];

/* ── Marcas fictícias ──────────────────────────────────────── */
export const MARCAS = [
  { id: 'norte',     nome: 'NORTE',     linha: 'Básicos de malha pesada' },
  { id: 'grava',     nome: 'GRAVA',     linha: 'Alfaiataria urbana e denim' },
  { id: 'atrio',     nome: 'ATRIO',     linha: 'Calçados' },
  { id: 'meridian',  nome: 'MERIDIAN',  linha: 'Perfumaria' },
  { id: 'osso',      nome: 'OSSO',      linha: 'Acessórios em aço' },
  { id: 'vanta-lab', nome: 'VANTA LAB', linha: 'Linha própria da casa' },
];

/* ── Grades de tamanho reaproveitadas ──────────────────────── */
const T_ROUPA  = ['PP', 'P', 'M', 'G', 'GG'];
const T_NUM    = ['38', '40', '42', '44', '46'];
const T_CALCADO = ['38', '39', '40', '41', '42', '43', '44'];
const T_UNICO  = ['Único'];

/* ── Cores: o hex vira a bolinha do seletor ────────────────── */
const C = {
  preto:    ['Preto', '#17171A'],
  grafite:  ['Grafite', '#3B3B40'],
  cinza:    ['Cinza', '#9A9AA0'],
  mescla:   ['Mescla', '#B4B4B8'],
  offwhite: ['Off-white', '#F1EDE4'],
  branco:   ['Branco', '#FAFAF8'],
  areia:    ['Areia', '#CBB99A'],
  caqui:    ['Caqui', '#A8966F'],
  oliva:    ['Oliva', '#575E42'],
  indigo:   ['Índigo', '#2F3A4E'],
  marrom:   ['Marrom', '#6D5140'],
  vinho:    ['Vinho', '#6A2E33'],
  aco:      ['Aço', '#B9BEC4'],
};
const cores = (...ks) => ks.map((k) => ({ nome: C[k][0], hex: C[k][1] }));

/* ── Os 24 produtos ────────────────────────────────────────── */
export const PRODUTOS = [
  {
    slug: 'camiseta-essential', sku: 'VS-CAM-001', nome: 'Camiseta Essential',
    marca: 'norte', categoria: 'roupas', tipo: 'Camisetas',
    preco: 89.90, precoDe: 129.90, tags: ['mais-vendido', 'oferta'], estoque: true,
    tamanhos: T_ROUPA, cores: cores('preto', 'offwhite', 'oliva'),
    resumo: 'Malha pesada de 220 g, gola canelada que não abre.',
    descricao: [
      'A camiseta que serve de base para tudo o mais na loja. Malha 100% ' +
      'algodão penteado de 220 g — grossa o bastante para não marcar o corpo ' +
      'e não ficar transparente depois de algumas lavagens.',
      'A gola é canelada em 2×1 e costurada com elástico interno, que é o que ' +
      'impede aquele efeito de gola caída. Modelagem reta, com caimento no ' +
      'corpo sem ficar justa.',
    ],
    ficha: [['Composição', '100% algodão penteado'], ['Gramatura', '220 g/m²'],
            ['Modelagem', 'Reta'], ['Gola', 'Canelada 2×1 com elástico'],
            ['Lavagem', 'Máquina, água fria, avesso']],
  },
  {
    slug: 'camiseta-oversized', sku: 'VS-CAM-014', nome: 'Camiseta Oversized',
    marca: 'norte', categoria: 'roupas', tipo: 'Camisetas',
    preco: 149.90, precoDe: null, tags: ['novo'], estoque: true,
    tamanhos: T_ROUPA, cores: cores('offwhite', 'areia', 'preto'),
    resumo: 'Ombro caído e barra alongada, em malha de 240 g.',
    descricao: [
      'Modelagem oversized de verdade: o ombro cai dois dedos abaixo da linha ' +
      'natural e a barra é 4 cm mais longa. Não é uma camiseta comum dois ' +
      'números maior.',
      'Malha de 240 g com toque encorpado, que é o que faz a peça manter o ' +
      'caimento reto em vez de grudar no corpo.',
    ],
    ficha: [['Composição', '100% algodão'], ['Gramatura', '240 g/m²'],
            ['Modelagem', 'Oversized'], ['Ombro', 'Caído'],
            ['Lavagem', 'Máquina, água fria, avesso']],
  },
  {
    slug: 'camisa-slim', sku: 'VS-CMS-007', nome: 'Camisa Manga Longa',
    marca: 'grava', categoria: 'roupas', tipo: 'Camisas',
    preco: 169.90, precoDe: 219.90, tags: ['oferta'], estoque: true,
    tamanhos: T_ROUPA, cores: cores('branco', 'indigo', 'preto'),
    resumo: 'Tricoline com elastano, colarinho com entretela firme.',
    descricao: [
      'Tricoline de algodão com 3% de elastano — o suficiente para a camisa ' +
      'acompanhar o movimento sem perder o corpo. Colarinho com entretela ' +
      'firme, que fica em pé mesmo sem gravata.',
      'Modelagem slim com pences nas costas. Serve para trabalhar e para sair ' +
      'depois, sem parecer uniforme.',
    ],
    ficha: [['Composição', '97% algodão, 3% elastano'], ['Modelagem', 'Slim'],
            ['Colarinho', 'Italiano com entretela'], ['Punho', 'Simples com botão'],
            ['Lavagem', 'Máquina, água fria']],
  },
  {
    slug: 'camisa-overshirt', sku: 'VS-CMS-021', nome: 'Overshirt de Sarja',
    marca: 'grava', categoria: 'roupas', tipo: 'Camisas',
    preco: 289.90, precoDe: null, tags: ['novo'], estoque: true,
    tamanhos: T_ROUPA, cores: cores('caqui', 'oliva', 'preto'),
    resumo: 'Camisa-jaqueta em sarja pesada, com dois bolsos de peito.',
    descricao: [
      'Fica entre a camisa e a jaqueta: sarja de 280 g, dois bolsos de peito ' +
      'com lapela e botões de resina fosca. Usa sobre a camiseta o ano inteiro ' +
      'e por baixo de um casaco no frio.',
      'A modelagem é um pouco mais ampla para caber uma camada por baixo sem ' +
      'repuxar no ombro.',
    ],
    ficha: [['Composição', '100% algodão sarjado'], ['Gramatura', '280 g/m²'],
            ['Bolsos', 'Dois no peito, com lapela'], ['Modelagem', 'Ampla'],
            ['Lavagem', 'Máquina, água fria']],
  },
  {
    slug: 'calca-cargo', sku: 'VS-CAL-003', nome: 'Calça Cargo',
    marca: 'grava', categoria: 'roupas', tipo: 'Calças',
    preco: 229.90, precoDe: 299.90, tags: ['mais-vendido', 'oferta'], estoque: true,
    tamanhos: T_NUM, cores: cores('preto', 'oliva', 'areia'),
    resumo: 'Sarja com elastano e bolsos laterais que cabem o celular.',
    descricao: [
      'Cargo de verdade: os bolsos laterais são fundos e com fole, então cabe ' +
      'celular grande sem estufar a perna. Sarja com 2% de elastano para não ' +
      'travar ao sentar.',
      'Barra reta, sem punho elástico. Cai sobre o tênis em vez de subir.',
    ],
    ficha: [['Composição', '98% algodão, 2% elastano'], ['Modelagem', 'Reta'],
            ['Bolsos', 'Dois frontais, dois laterais com fole, dois traseiros'],
            ['Barra', 'Reta'], ['Lavagem', 'Máquina, água fria, avesso']],
  },
  {
    slug: 'calca-jeans', sku: 'VS-CAL-018', nome: 'Calça Jeans Reta',
    marca: 'grava', categoria: 'roupas', tipo: 'Calças',
    preco: 279.90, precoDe: null, tags: [], estoque: true,
    tamanhos: T_NUM, cores: cores('indigo', 'preto', 'cinza'),
    resumo: 'Denim de 13 oz, lavagem escura sem puído.',
    descricao: [
      'Denim de 13 onças, peso médio-alto: segura a forma desde a primeira ' +
      'vestida e amacia com o uso em vez de estufar no joelho.',
      'Lavagem índigo escura e uniforme, sem rasgo e sem puído. É a jeans que ' +
      'funciona com camisa e com camiseta.',
    ],
    ficha: [['Composição', '99% algodão, 1% elastano'], ['Peso do denim', '13 oz'],
            ['Modelagem', 'Reta'], ['Lavagem do tecido', 'Índigo escura'],
            ['Cuidado', 'Máquina, água fria, avesso']],
  },
  {
    slug: 'bermuda-sarja', sku: 'VS-BER-005', nome: 'Bermuda de Sarja',
    marca: 'grava', categoria: 'roupas', tipo: 'Bermudas',
    preco: 129.90, precoDe: 179.90, tags: ['oferta'], estoque: true,
    tamanhos: T_NUM, cores: cores('areia', 'preto', 'oliva'),
    resumo: 'Comprimento no joelho, cós com elástico discreto atrás.',
    descricao: [
      'Bermuda de sarja com comprimento no joelho — nem curta demais nem ' +
      'passando dele. O cós tem elástico só na parte de trás, que ajusta ' +
      'sem aparecer.',
      'Quatro bolsos, todos com fundo reforçado.',
    ],
    ficha: [['Composição', '100% algodão sarjado'], ['Comprimento', 'No joelho'],
            ['Cós', 'Com elástico traseiro'], ['Bolsos', 'Dois frontais, dois traseiros'],
            ['Lavagem', 'Máquina, água fria']],
  },
  {
    slug: 'moletom-capuz', sku: 'VS-MOL-002', nome: 'Moletom com Capuz',
    marca: 'norte', categoria: 'roupas', tipo: 'Moletons',
    preco: 249.90, precoDe: 329.90, tags: ['mais-vendido', 'oferta'], estoque: true,
    tamanhos: T_ROUPA, cores: cores('mescla', 'preto', 'oliva'),
    resumo: 'Moletom flanelado de 340 g, capuz forrado em duas camadas.',
    descricao: [
      'Moletom flanelado por dentro, 340 g. O capuz é forrado em duas camadas ' +
      'e tem cordão com ponteira de metal — não é o cordão de nylon que sai na ' +
      'primeira lavagem.',
      'Punho e barra em ribana grossa, com elastano, que é o que segura a ' +
      'manga no lugar.',
    ],
    ficha: [['Composição', '80% algodão, 20% poliéster'], ['Gramatura', '340 g/m²'],
            ['Interior', 'Flanelado'], ['Capuz', 'Forrado, cordão com ponteira'],
            ['Bolso', 'Canguru frontal'], ['Lavagem', 'Máquina, água fria, avesso']],
  },
  {
    slug: 'moletom-crew', sku: 'VS-MOL-019', nome: 'Moletom Gola Careca',
    marca: 'norte', categoria: 'roupas', tipo: 'Moletons',
    preco: 279.90, precoDe: null, tags: [], estoque: true,
    tamanhos: T_ROUPA, cores: cores('preto', 'areia', 'vinho'),
    resumo: 'Gola careca com ribana reforçada, sem bolso.',
    descricao: [
      'Versão sem capuz e sem bolso, para quem usa por baixo de jaqueta. A ' +
      'gola tem ribana dupla, que é onde moletom costuma ceder primeiro.',
      'Mesmo tecido flanelado de 340 g do modelo com capuz.',
    ],
    ficha: [['Composição', '80% algodão, 20% poliéster'], ['Gramatura', '340 g/m²'],
            ['Gola', 'Careca, ribana dupla'], ['Interior', 'Flanelado'],
            ['Lavagem', 'Máquina, água fria, avesso']],
  },
  {
    slug: 'jaqueta-bomber', sku: 'VS-JAQ-004', nome: 'Jaqueta Bomber',
    marca: 'vanta-lab', categoria: 'roupas', tipo: 'Jaquetas',
    preco: 399.90, precoDe: 499.90, tags: ['mais-vendido', 'oferta'], estoque: true,
    tamanhos: T_ROUPA, cores: cores('oliva', 'preto', 'marrom'),
    resumo: 'Nylon encorpado com forro, zíper de metal e punho canelado.',
    descricao: [
      'Bomber em nylon encorpado com forro interno leve. Zíper de metal com ' +
      'puxador chapado — não é o zíper de plástico que trava no meio.',
      'Gola, punho e barra em canelado com elastano. Dois bolsos embutidos nas ' +
      'laterais e um bolso interno com zíper.',
    ],
    ficha: [['Material', 'Nylon encorpado, forro em poliéster'],
            ['Zíper', 'Metal, puxador chapado'], ['Acabamento', 'Gola, punho e barra canelados'],
            ['Bolsos', 'Dois externos embutidos, um interno com zíper'],
            ['Lavagem', 'Lavagem a seco']],
  },
  {
    slug: 'tenis-runner', sku: 'VS-TEN-001', nome: 'Tênis Runner',
    marca: 'atrio', categoria: 'tenis', tipo: 'Tênis',
    preco: 449.90, precoDe: 599.90, tags: ['mais-vendido', 'oferta'], estoque: true,
    tamanhos: T_CALCADO, cores: cores('branco', 'cinza', 'preto'),
    resumo: 'Entressola em EVA de alta densidade, cabedal em mesh respirável.',
    descricao: [
      'Corrida leve e uso diário. A entressola é EVA de alta densidade com ' +
      '30 mm no calcanhar e 22 mm no antepé — amortece sem afundar depois de ' +
      'dois meses.',
      'Cabedal em mesh de trama aberta com reforços soldados, sem costura no ' +
      'meio do pé. Palmilha removível, se você usa palmilha própria.',
    ],
    ficha: [['Cabedal', 'Mesh respirável com reforços soldados'],
            ['Entressola', 'EVA de alta densidade, drop 8 mm'],
            ['Solado', 'Borracha com ranhuras'], ['Palmilha', 'Removível'],
            ['Peso', '285 g no tamanho 41'], ['Numeração', 'Brasileira, 38 ao 44']],
  },
  {
    slug: 'tenis-court', sku: 'VS-TEN-012', nome: 'Tênis Court',
    marca: 'atrio', categoria: 'tenis', tipo: 'Tênis',
    preco: 529.90, precoDe: null, tags: ['mais-vendido'], estoque: true,
    tamanhos: T_CALCADO, cores: cores('preto', 'branco', 'indigo'),
    resumo: 'Couro sintético com perfil baixo e solado de borracha lisa.',
    descricao: [
      'Silhueta de quadra, perfil baixo: é o tênis que combina com calça de ' +
      'alfaiataria sem parecer esportivo demais.',
      'Couro sintético com toque encorpado e solado de borracha lisa com ' +
      'desenho discreto. Forro acolchoado no colarinho.',
    ],
    ficha: [['Cabedal', 'Couro sintético'], ['Perfil', 'Baixo'],
            ['Solado', 'Borracha lisa'], ['Forro', 'Acolchoado no colarinho'],
            ['Peso', '340 g no tamanho 41'], ['Numeração', 'Brasileira, 38 ao 44']],
  },
  {
    slug: 'tenis-chunky', sku: 'VS-TEN-023', nome: 'Tênis Chunky',
    marca: 'atrio', categoria: 'tenis', tipo: 'Tênis',
    preco: 559.90, precoDe: 679.90, tags: ['novo', 'oferta'], estoque: true,
    tamanhos: T_CALCADO, cores: cores('areia', 'branco', 'grafite'),
    resumo: 'Entressola alta de 42 mm com camadas em contraste.',
    descricao: [
      'Entressola de 42 mm montada em três camadas visíveis, que é o que dá o ' +
      'volume sem o peso de um solado maciço.',
      'Cabedal em camurça sintética com sobreposições em mesh. Fecho com ' +
      'cadarço plano e ilhoses metálicos.',
    ],
    ficha: [['Cabedal', 'Camurça sintética com mesh'],
            ['Entressola', '42 mm, três camadas'], ['Solado', 'Borracha com tração'],
            ['Ilhoses', 'Metálicos'], ['Peso', '410 g no tamanho 41'],
            ['Numeração', 'Brasileira, 38 ao 44']],
  },
  {
    slug: 'tenis-skate', sku: 'VS-TEN-030', nome: 'Tênis Cano Alto',
    marca: 'atrio', categoria: 'tenis', tipo: 'Tênis',
    preco: 489.90, precoDe: null, tags: ['novo'], estoque: false,
    tamanhos: T_CALCADO, cores: cores('cinza', 'preto', 'oliva'),
    resumo: 'Cano alto com reforço duplo na lateral e colarinho acolchoado.',
    descricao: [
      'Cano alto com reforço duplo na lateral, que é a região que o skate come ' +
      'primeiro. Colarinho acolchoado sustenta o tornozelo sem travar.',
      'Solado vulcanizado com desenho de espinha de peixe, para aderência na ' +
      'lixa.',
    ],
    ficha: [['Cabedal', 'Lona encorpada com reforço lateral'],
            ['Cano', 'Alto, colarinho acolchoado'],
            ['Solado', 'Vulcanizado, espinha de peixe'],
            ['Peso', '395 g no tamanho 41'], ['Numeração', 'Brasileira, 38 ao 44']],
  },
  {
    slug: 'perfume-noir', sku: 'VS-PER-001', nome: 'Perfume Noir 100 ml',
    marca: 'meridian', categoria: 'perfumes', tipo: 'Perfumes',
    preco: 319.90, precoDe: 389.90, tags: ['mais-vendido', 'oferta'], estoque: true,
    tamanhos: T_UNICO, cores: [],
    resumo: 'Amadeirado com couro e baunilha. Fixação de 8 a 10 horas.',
    descricao: [
      'Eau de parfum amadeirado. Abre com pimenta-preta e bergamota, assenta ' +
      'em couro e patchouli, e termina em baunilha e âmbar.',
      'Concentração de 18%, que é o que dá as 8 a 10 horas de fixação. Para ' +
      'noite e para dias frios — em calor forte ele fica pesado.',
    ],
    ficha: [['Tipo', 'Eau de parfum'], ['Concentração', '18%'], ['Volume', '100 ml'],
            ['Família', 'Amadeirado especiado'],
            ['Notas de topo', 'Pimenta-preta, bergamota'],
            ['Notas de fundo', 'Couro, patchouli, baunilha, âmbar'],
            ['Fixação', '8 a 10 horas']],
  },
  {
    slug: 'perfume-ambar', sku: 'VS-PER-008', nome: 'Perfume Âmbar 100 ml',
    marca: 'meridian', categoria: 'perfumes', tipo: 'Perfumes',
    preco: 359.90, precoDe: null, tags: [], estoque: true,
    tamanhos: T_UNICO, cores: [],
    resumo: 'Âmbar quente com incenso e sândalo. Fixação de 10 a 12 horas.',
    descricao: [
      'O mais encorpado dos três. Âmbar com incenso, sândalo e um fundo de ' +
      'fava tonka. Deixa rastro — duas borrifadas resolvem o dia.',
      'Concentração de 20%. Unissex, mas pesa mais para o lado quente e ' +
      'resinoso.',
    ],
    ficha: [['Tipo', 'Eau de parfum'], ['Concentração', '20%'], ['Volume', '100 ml'],
            ['Família', 'Âmbar oriental'], ['Notas de topo', 'Cardamomo, incenso'],
            ['Notas de fundo', 'Âmbar, sândalo, fava tonka'],
            ['Fixação', '10 a 12 horas']],
  },
  {
    slug: 'perfume-citrus', sku: 'VS-PER-015', nome: 'Perfume Citrus 50 ml',
    marca: 'meridian', categoria: 'perfumes', tipo: 'Perfumes',
    preco: 229.90, precoDe: null, tags: ['novo'], estoque: true,
    tamanhos: T_UNICO, cores: [],
    resumo: 'Cítrico seco com vetiver. O do dia a dia e do calor.',
    descricao: [
      'Cítrico seco: limão siciliano e petitgrain na abertura, vetiver e ' +
      'musgo no fundo. Leve o bastante para usar no escritório e no calor.',
      'Concentração de 15% e frasco de 50 ml, que é o tamanho que cabe na ' +
      'mochila sem pesar.',
    ],
    ficha: [['Tipo', 'Eau de parfum'], ['Concentração', '15%'], ['Volume', '50 ml'],
            ['Família', 'Cítrico amadeirado'],
            ['Notas de topo', 'Limão siciliano, petitgrain'],
            ['Notas de fundo', 'Vetiver, musgo branco'], ['Fixação', '5 a 7 horas']],
  },
  {
    slug: 'bone-aba-curva', sku: 'VS-BON-002', nome: 'Boné Aba Curva',
    marca: 'vanta-lab', categoria: 'acessorios', tipo: 'Bonés',
    preco: 139.90, precoDe: null, tags: ['mais-vendido'], estoque: true,
    tamanhos: T_UNICO, cores: cores('preto', 'areia', 'oliva'),
    resumo: 'Sarja com aba pré-curvada e fecho de fivela metálica.',
    descricao: [
      'Aba já vem curvada de fábrica, então não precisa daquele mês dobrando ' +
      'na mão. Sarja de algodão com estrutura média, que segura a forma sem ' +
      'ficar duro.',
      'Fecho de fivela metálica com passador — ajusta fino e não solta sozinho.',
    ],
    ficha: [['Material', '100% algodão sarjado'], ['Aba', 'Pré-curvada'],
            ['Fecho', 'Fivela metálica com passador'],
            ['Estrutura', 'Média, seis gomos'], ['Tamanho', 'Único, ajustável']],
  },
  {
    slug: 'bone-trucker', sku: 'VS-BON-011', nome: 'Boné Trucker',
    marca: 'vanta-lab', categoria: 'acessorios', tipo: 'Bonés',
    preco: 99.90, precoDe: 129.90, tags: ['oferta'], estoque: true,
    tamanhos: T_UNICO, cores: cores('areia', 'preto', 'indigo'),
    resumo: 'Frente estruturada e traseira em tela, para calor.',
    descricao: [
      'Frente em sarja estruturada e traseira em tela de poliéster: ventila e ' +
      'não fica encharcado de suor no verão.',
      'Fecho de plástico com regulagem em oito posições.',
    ],
    ficha: [['Material', 'Sarja na frente, tela atrás'], ['Aba', 'Levemente curvada'],
            ['Fecho', 'Regulagem em oito posições'], ['Estrutura', 'Alta na frente'],
            ['Tamanho', 'Único, ajustável']],
  },
  {
    slug: 'corrente-cubana', sku: 'VS-ACE-004', nome: 'Corrente Cubana',
    marca: 'osso', categoria: 'acessorios', tipo: 'Correntes',
    preco: 199.90, precoDe: null, tags: [], estoque: true,
    tamanhos: ['50 cm', '60 cm', '70 cm'], cores: cores('aco', 'preto'),
    resumo: 'Elo cubano de 8 mm em aço 316L, antialérgico.',
    descricao: [
      'Aço inox 316L — o mesmo de instrumento cirúrgico. Não enferruja no ' +
      'suor, não escurece e não dá a alergia clássica de bijuteria.',
      'Elos soldados um a um, com fecho de gaveta e trava dupla. Cai reta em ' +
      'vez de torcer.',
    ],
    ficha: [['Material', 'Aço inox 316L'], ['Espessura', '8 mm'],
            ['Fecho', 'Gaveta com trava dupla'], ['Peso', '72 g na versão 60 cm'],
            ['Antialérgico', 'Sim, sem níquel livre']],
  },
  {
    slug: 'pulseira-elos', sku: 'VS-ACE-017', nome: 'Pulseira de Elos',
    marca: 'osso', categoria: 'acessorios', tipo: 'Pulseiras',
    preco: 119.90, precoDe: 159.90, tags: ['oferta'], estoque: true,
    tamanhos: ['19 cm', '21 cm', '23 cm'], cores: cores('aco', 'preto'),
    resumo: 'Mesmo elo da corrente, em 6 mm, com dois elos extras.',
    descricao: [
      'Feita para fechar conjunto com a corrente de 8 mm sem competir com ' +
      'ela. Mesmo aço 316L e mesmo acabamento.',
      'Vem com dois elos extras soltos na caixa: dá para ajustar em casa com ' +
      'um alicate de bico.',
    ],
    ficha: [['Material', 'Aço inox 316L'], ['Espessura', '6 mm'],
            ['Fecho', 'Gaveta com trava dupla'], ['Ajuste', 'Dois elos extras inclusos'],
            ['Antialérgico', 'Sim, sem níquel livre']],
  },
  {
    slug: 'relogio-aco', sku: 'VS-ACE-022', nome: 'Relógio de Aço',
    marca: 'osso', categoria: 'acessorios', tipo: 'Relógios',
    preco: 599.90, precoDe: 749.90, tags: ['mais-vendido', 'oferta'], estoque: true,
    tamanhos: T_UNICO, cores: [{ nome: 'Mostrador preto', hex: '#17171A' },
                               { nome: 'Mostrador azul', hex: '#22303F' },
                               { nome: 'Mostrador verde', hex: '#2E3A30' }],
    resumo: 'Caixa de 40 mm, vidro mineral e resistência a 5 ATM.',
    descricao: [
      'Caixa de 40 mm em aço inox escovado, espessura de 11 mm — cabe sob a ' +
      'manga da camisa sem enroscar.',
      'Movimento de quartzo japonês, vidro mineral endurecido e resistência ' +
      'de 5 ATM: aguenta chuva e lavar a mão, não aguenta mergulho.',
    ],
    ficha: [['Caixa', 'Aço inox escovado, 40 mm'], ['Espessura', '11 mm'],
            ['Movimento', 'Quartzo japonês'], ['Vidro', 'Mineral endurecido'],
            ['Resistência', '5 ATM'], ['Pulseira', 'Aço com fecho dobrável'],
            ['Garantia', '1 ano para o movimento']],
  },
  {
    slug: 'oculos-retangular', sku: 'VS-ACE-026', nome: 'Óculos Retangular',
    marca: 'osso', categoria: 'acessorios', tipo: 'Óculos',
    preco: 249.90, precoDe: null, tags: ['novo'], estoque: true,
    tamanhos: T_UNICO, cores: cores('preto', 'marrom', 'grafite'),
    resumo: 'Acetato com lente polarizada e proteção UV400.',
    descricao: [
      'Armação de acetato injetado com dobradiça de metal embutida. Formato ' +
      'retangular, que funciona em rosto redondo e em rosto quadrado.',
      'Lente polarizada com proteção UV400 — corta reflexo de asfalto e de ' +
      'água, que é onde óculos barato falha.',
    ],
    ficha: [['Armação', 'Acetato injetado'], ['Lente', 'Polarizada, UV400'],
            ['Dobradiça', 'Metal embutido'], ['Formato', 'Retangular'],
            ['Inclui', 'Case rígido e flanela']],
  },
  {
    slug: 'bolsa-crossbody', sku: 'VS-ACE-031', nome: 'Bolsa Transversal',
    marca: 'osso', categoria: 'acessorios', tipo: 'Bolsas',
    preco: 269.90, precoDe: 329.90, tags: ['oferta'], estoque: true,
    tamanhos: T_UNICO, cores: cores('preto', 'marrom', 'oliva'),
    resumo: 'Nylon impermeável com alça regulável e fecho magnético.',
    descricao: [
      'Nylon revestido, impermeável de verdade: garoa e respingo escorrem. ' +
      'Cabe tablet de 11 polegadas, carteira, chave e garrafa pequena.',
      'Alça regulável de 70 a 130 cm, com fivela metálica. Fecho magnético na ' +
      'lapela e zíper interno para o que não pode cair.',
    ],
    ficha: [['Material', 'Nylon revestido impermeável'],
            ['Medidas', '28 × 20 × 8 cm'], ['Alça', 'Regulável de 70 a 130 cm'],
            ['Fecho', 'Magnético na lapela, zíper interno'],
            ['Compartimentos', 'Um principal, um interno com zíper, um traseiro']],
  },
];

/* ── Consultas ─────────────────────────────────────────────── */
export const imagensDe = (p) => [1, 2, 3].map((i) =>
  `assets/${p.slug}${i === 1 ? '' : `-${i}`}.svg`);

export const achar = (slug) => PRODUTOS.find((p) => p.slug === slug);
export const daCategoria = (id) => PRODUTOS.filter((p) => p.categoria === id);
export const comTag = (t) => PRODUTOS.filter((p) => p.tags.includes(t));
export const categoria = (id) => CATEGORIAS.find((c) => c.id === id) || {};
export const marca = (id) => MARCAS.find((m) => m.id === id) || {};

/** Desconto em pontos percentuais inteiros, ou 0. */
export const desconto = (p) =>
  p.precoDe ? Math.round((1 - p.preco / p.precoDe) * 100) : 0;

/** Relacionados: mesmo tipo primeiro, depois mesma categoria, por preço próximo. */
export function relacionados(p, n = 4) {
  return PRODUTOS.filter((o) => o.slug !== p.slug && o.estoque)
    .sort((a, b) =>
      (b.tipo === p.tipo) - (a.tipo === p.tipo) ||
      (b.categoria === p.categoria) - (a.categoria === p.categoria) ||
      Math.abs(a.preco - p.preco) - Math.abs(b.preco - p.preco))
    .slice(0, n);
}

/** Faixas de preço para o filtro. */
export const FAIXAS = [
  { id: 'ate-150',   nome: 'Até R$ 150',        min: 0,   max: 150 },
  { id: '150-300',   nome: 'R$ 150 a R$ 300',   min: 150, max: 300 },
  { id: '300-500',   nome: 'R$ 300 a R$ 500',   min: 300, max: 500 },
  { id: 'acima-500', nome: 'Acima de R$ 500',   min: 500, max: Infinity },
];
