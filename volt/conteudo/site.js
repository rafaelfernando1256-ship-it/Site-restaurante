/** VOLT — textos e configuração. Marca fictícia, projeto de portfólio. */

export const MARCA = {
  nome: 'VOLT',
  slogan: 'Acessórios de rua',
  descricao: 'Correntes, anéis, pulseiras e brincos em aço inox 316L. ' +
             'Peças unissex, antialérgicas, com garantia de 1 ano.',
  dominio: 'https://volt.acessorios',   // fictício
  whatsapp: '5511999990000',            // troque pelo número real
  whatsappVisivel: '(11) 99999-0000',
  email: 'oi@volt.acessorios',
  instagram: '@volt.acessorios',
  tiktok: '@volt.acessorios',
  freteGratis: 199,
};

export const linkWhats = (texto) =>
  `https://wa.me/${MARCA.whatsapp}?text=${encodeURIComponent(texto)}`;

export const CONSULTA_GERAL =
  'Fala! Vim pelo site da VOLT e queria tirar uma dúvida.';

export const AVISO_DEMO =
  'Projeto demonstrativo. VOLT é uma marca fictícia: produtos, preços, ' +
  'avaliações e selos foram inventados para mostrar o funcionamento da loja.';

export const TARJA = [
  'Frete grátis acima de R$ 199',
  'Até 6x sem juros',
  'Troca em 30 dias',
  'Aço 316L antialérgico',
  'Garantia de 1 ano',
];

export const HERO = {
  sobretitulo: 'Coleção rua · 2026',
  titulo: ['SEU ESTILO.', 'SUA MARCA.'],
  texto: 'Peças para quem não passa despercebido.',
  cta: 'Comprar agora',
  ctaSecundario: 'Ver categorias',
  numeros: [
    ['316L', 'aço cirúrgico'],
    ['30 dias', 'para trocar'],
    ['1 ano', 'de garantia'],
  ],
};

export const SECOES = {
  vendidos: { n: '02', etiqueta: 'Mais vendidos', titulo: 'O QUE MAIS SAI',
    texto: 'As peças que mais giram no estoque.' },
  novidades: { n: '03', etiqueta: 'Novidades', titulo: 'ACABOU DE CHEGAR',
    texto: 'Lançamentos da última leva.' },
  categorias: { n: '04', etiqueta: 'Categorias', titulo: 'ESCOLHE A TUA',
    texto: 'Toque numa categoria para filtrar a loja abaixo.' },
  loja: { etiqueta: 'A loja inteira', titulo: 'TODOS OS PRODUTOS' },
  ofertas: { n: '05', etiqueta: 'Ofertas', titulo: 'TÁ MAIS BARATO',
    texto: 'Desconto direto no preço, sem cupom e sem pegadinha.' },
  kits: { n: '06', etiqueta: 'Kits', titulo: 'COMBINA E ECONOMIZA',
    texto: 'Combinações prontas por menos que as peças avulsas.' },
  avaliacoes: { n: '07', etiqueta: 'Avaliações', titulo: 'O QUE DIZEM',
    texto: 'Conteúdo de demonstração.' },
  instagram: { n: '08', etiqueta: 'Instagram', titulo: 'MARCA A GENTE',
    texto: 'Poste usando e marque o perfil — a gente reposta.' },
  faq: { n: '09', etiqueta: 'Dúvidas', titulo: 'PERGUNTAS FREQUENTES' },
  final: { etiqueta: 'Bora', titulo: 'MONTA O TEU LOOK',
    texto: 'Frete grátis acima de R$ 199 e troca em 30 dias. ' +
           'Qualquer dúvida, chama no WhatsApp.' },
};

export const ORDENACOES = [
  ['relevancia', 'Mais relevantes'],
  ['menor-preco', 'Menor preço'],
  ['maior-preco', 'Maior preço'],
  ['desconto',    'Maior desconto'],
  ['nota',        'Melhor avaliados'],
  ['nome',        'Nome A–Z'],
];

/**
 * Avaliações INVENTADAS para demonstração.
 * Nomes, textos e notas não vieram de pessoa nenhuma: são texto de
 * exemplo para mostrar como o bloco se comporta. Estão marcados como
 * demonstração na interface, um a um e no cabeçalho da seção.
 */
export const AVALIACOES = [
  { autor: 'Perfil de exemplo 01', nota: 5, produto: 'Corrente Cubana 8 mm',
    texto: 'Texto de demonstração: aqui apareceria o comentário de quem comprou, ' +
           'com o produto avaliado e a nota dada.' },
  { autor: 'Perfil de exemplo 02', nota: 5, produto: 'Anel Signet Raio',
    texto: 'Texto de demonstração: este bloco existe para mostrar o formato do ' +
           'depoimento na página, não para simular uma pessoa real.' },
  { autor: 'Perfil de exemplo 03', nota: 4, produto: 'Kit Rua',
    texto: 'Texto de demonstração: numa loja publicada, este espaço seria ' +
           'preenchido por avaliações verificadas de compras reais.' },
];

export const FAQ = [
  ['Em quanto tempo chega?',
   'Postamos em até 1 dia útil. Depois disso, de 3 a 6 dias úteis no Sudeste e ' +
   'de 6 a 12 nas demais regiões. O código de rastreio cai no seu WhatsApp ' +
   'assim que a etiqueta é emitida.'],
  ['O aço escurece ou dá alergia?',
   'O 316L é o mesmo aço de instrumento cirúrgico: não tem níquel livre, então ' +
   'não dá aquela alergia clássica de bijuteria, e não enferruja com suor nem ' +
   'com água do mar. Pode tomar banho e treinar de peça.'],
  ['Como escolho o tamanho?',
   'Cada produto tem a tabela de medidas na própria página. Para anel, meça um ' +
   'que já sirva com uma régua por dentro. Na dúvida, manda uma mensagem: a ' +
   'primeira troca de tamanho é por nossa conta.'],
  ['E se eu não gostar?',
   'Você tem 30 dias para devolver, sem precisar explicar. A peça volta sem uso ' +
   'e na caixa; o estorno sai em até 7 dias úteis depois que a gente recebe.'],
  ['Dá para pagar como?',
   'Pix, boleto ou cartão em até 6x sem juros. Este site é uma demonstração, ' +
   'então nenhum pagamento é processado aqui — o carrinho monta o pedido e ' +
   'manda para o WhatsApp.'],
  ['Frete grátis a partir de quanto?',
   'R$ 199 para todo o Brasil. O carrinho mostra quanto falta para bater o ' +
   'valor enquanto você vai colocando as peças.'],
];

export const INSTAGRAM = [
  ['corrente-cubana-8.svg',  'Corrente cubana de 8 mm'],
  ['anel-signet-2.svg',      'Detalhe do anel signet com o raio da marca'],
  ['brinco-cruz.svg',        'Par de brincos de cruz'],
  ['kit-rua-3.svg',          'Kit com corrente e pulseira cubana'],
  ['bracelete-fosco-2.svg',  'Bracelete rígido preto fosco'],
  ['corrente-cruz-3.svg',    'Corrente com pingente de cruz'],
];
