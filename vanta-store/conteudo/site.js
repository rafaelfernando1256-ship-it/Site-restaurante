/**
 * VANTA STORE — identidade, textos e configuração.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │ TROCAR NOME DA LOJA, WHATSAPP E CONTATO: é tudo no bloco      │
 * │ LOJA logo abaixo. Depois rode: node construir.mjs             │
 * └──────────────────────────────────────────────────────────────┘
 */
export const LOJA = {
  nome: 'VANTA',
  sobrenome: 'STORE',                    // a segunda palavra do logotipo
  assinatura: 'Moda · Sneakers · Fragrâncias',
  descricao: 'Loja multimarcas de moda e lifestyle: roupas, tênis, perfumes e ' +
             'acessórios em um só lugar.',

  whatsapp: '5511900000000',             // ← TROQUE: só dígitos, com 55
  whatsappVisivel: '(11) 90000-0000',    // ← TROQUE
  email: 'atendimento@vantastore.com.br',
  instagram: '@vantastore',
  // ← TROQUE pelas URLs dos seus perfis. Deixe '' e o link some do rodapé.
  redes: {
    Instagram: 'https://www.instagram.com/',
    TikTok: 'https://www.tiktok.com/',
    YouTube: 'https://www.youtube.com/',
  },
  dominio: 'https://vantastore.com.br',

  freteGratis: 299,                      // piso do frete grátis, em reais
  parcelas: 10,                          // parcelamento máximo sem juros
  parcelaMinima: 30,                     // valor mínimo de cada parcela
};

export const linkWhats = (texto) =>
  `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(texto)}`;

export const MSG = {
  geral: 'Olá! Vim pelo site da VANTA STORE e queria tirar uma dúvida.',
  produto: (p) => `Olá! Tenho uma dúvida sobre o produto ${p.nome} ` +
                  `(ref. ${p.sku}) do site da VANTA STORE.`,
  pedido: 'Olá! Quero finalizar um pedido do site da VANTA STORE.',
};

/** Aviso que aparece em todo lugar onde alguém poderia se confundir. */
export const AVISO_DEMO =
  'VANTA STORE é uma loja fictícia, criada para demonstração de portfólio. ' +
  'Produtos, marcas, preços e prazos são inventados. Nenhum pagamento é ' +
  'processado e nenhum pedido é enviado.';

export const TARJA = [
  `Frete grátis acima de R$ ${LOJA.freteGratis}`,
  `Até ${LOJA.parcelas}x sem juros`,
  'Troca em 30 dias',
  'Envio para todo o Brasil',
];

export const HERO = {
  sobretitulo: 'Nova coleção',
  titulo: 'SEU ESTILO COMEÇA AQUI.',
  subtitulo: 'Moda, sneakers, fragrâncias e acessórios em um só lugar.',
  cta: 'COMPRAR AGORA',
  ctaSecundario: 'VER NOVIDADES',
  /* Promessa de serviço, não tamanho de catálogo: "24 produtos" conta
     para o cliente que a loja é pequena — é exatamente o oposto do que
     esta faixa tem de fazer. */
  numeros: [
    [`Frete grátis`, `acima de R$ ${LOJA.freteGratis}`],
    [`${LOJA.parcelas}x sem juros`, 'no cartão · 5% no Pix'],
    ['30 dias', 'para trocar ou devolver'],
  ],
};

export const SECOES = {
  categorias: { etiqueta: 'Categorias', titulo: 'POR ONDE COMEÇAR',
    texto: 'Quatro frentes, um só carrinho e um só frete.' },
  vendidos: { etiqueta: 'Destaques', titulo: 'OS MAIS DESEJADOS',
    texto: 'O que mais sai do estoque nas últimas semanas.' },
  novidades: { etiqueta: 'Lançamentos', titulo: 'ACABOU DE CHEGAR',
    texto: 'Última leva a entrar no catálogo.' },
  ofertas: { etiqueta: 'Promoção', titulo: 'OFERTAS DA SEMANA',
    texto: 'Desconto direto no preço, sem cupom e sem pegadinha.' },
  beneficios: { etiqueta: 'A loja', titulo: 'POR QUE COMPRAR NA VANTA?' },
  instagram: { etiqueta: 'Instagram', titulo: '@VANTASTORE',
    texto: 'Marque a gente nas suas fotos — repostamos as melhores.' },
  faq: { etiqueta: 'Ajuda', titulo: 'PERGUNTAS FREQUENTES' },
};

export const BENEFICIOS = [
  ['Compra segura',
   'A loja roda em conexão criptografada e os dados do pagamento são tratados ' +
   'pela operadora, não por nós. Nesta demonstração, nenhum dado é enviado ou ' +
   'guardado.'],
  ['Envio para todo o Brasil',
   'Frete grátis acima de R$ 299. Postagem em até 2 dias úteis, com código de ' +
   'rastreio no e-mail e no WhatsApp.'],
  ['Atendimento rápido',
   'WhatsApp de segunda a sábado, das 9h às 19h. Dúvida de tamanho e de peça ' +
   'costuma sair no mesmo dia.'],
  ['Troca facilitada',
   'Trinta dias para trocar ou devolver, sem justificar. A primeira troca de ' +
   'tamanho é por nossa conta.'],
  ['Produtos selecionados',
   'Seis marcas escolhidas uma a uma, com grade de tamanho conferida. Se não ' +
   'usaríamos, não entra no catálogo.'],
];

export const ENTREGA = {
  titulo: 'Entrega e prazos',
  itens: [
    ['Sudeste', '3 a 6 dias úteis'],
    ['Sul e Centro-Oeste', '5 a 9 dias úteis'],
    ['Norte e Nordeste', '7 a 14 dias úteis'],
    ['Frete grátis', `Em compras acima de R$ ${LOJA.freteGratis}`],
  ],
  nota: 'Prazos contados depois da postagem, que sai em até 2 dias úteis.',
};

export const TROCA = {
  titulo: 'Trocas e devoluções',
  itens: [
    ['Prazo', '30 dias corridos a partir do recebimento'],
    ['Condição', 'Peça sem uso, com etiqueta e embalagem'],
    ['Primeira troca de tamanho', 'Por nossa conta'],
    ['Estorno', 'Em até 7 dias úteis depois de recebermos a peça'],
  ],
  nota: 'Perfume lacrado tem troca; perfume aberto, só em caso de defeito.',
};

export const FAQ = [
  ['Qual o prazo de entrega?',
   'Postamos em até 2 dias úteis. Depois disso: de 3 a 6 dias úteis no ' +
   'Sudeste, de 5 a 9 no Sul e Centro-Oeste e de 7 a 14 no Norte e Nordeste. ' +
   'O rastreio chega no e-mail e no WhatsApp assim que a etiqueta é emitida.'],
  ['Quais são as formas de pagamento?',
   'Pix com 5% de desconto, cartão de crédito em até 10x sem juros (parcela ' +
   'mínima de R$ 30) e boleto bancário. Esta é uma loja de demonstração: o ' +
   'checkout mostra a interface, mas nenhum pagamento é processado.'],
  ['Como funciona a troca?',
   'Você tem 30 dias para trocar ou devolver, sem precisar justificar. A peça ' +
   'volta sem uso, com etiqueta e na embalagem. A primeira troca de tamanho é ' +
   'por nossa conta; o estorno sai em até 7 dias úteis depois que recebemos.'],
  ['Como escolho o tamanho certo?',
   'Cada produto tem a ficha técnica com modelagem e medidas na própria ' +
   'página. Roupa segue a grade PP ao GG, calça e bermuda vão do 38 ao 46 e ' +
   'tênis do 38 ao 44, em numeração brasileira. Na dúvida entre dois, chame no ' +
   'WhatsApp com sua altura e peso.'],
  ['Como falo com o atendimento?',
   'Pelo WhatsApp, de segunda a sábado das 9h às 19h, ou por e-mail. O botão ' +
   'verde fica fixo no canto da tela em qualquer página.'],
  ['Como acompanho meu pedido?',
   'Você recebe um código de rastreio por e-mail e por WhatsApp assim que o ' +
   'pedido é postado. Numa loja publicada, haveria também uma área de conta ' +
   'com o histórico — aqui ela é demonstrativa.'],
];

/** Feed: reaproveita vistas do próprio catálogo. */
/** [arquivo, texto alternativo, slug do produto que a foto mostra].
 *  A foto leva ao produto — é o que uma vitrine do Instagram faz, e
 *  evita oito links mortos apontando para "#". */
export const INSTAGRAM = [
  ['tenis-runner-2.svg', 'Detalhe do tênis runner branco', 'tenis-runner'],
  ['jaqueta-bomber.svg', 'Jaqueta bomber oliva', 'jaqueta-bomber'],
  ['perfume-noir.svg', 'Frasco do perfume Noir', 'perfume-noir'],
  ['moletom-capuz-3.svg', 'Moletom com capuz', 'moletom-capuz'],
  ['relogio-aco-2.svg', 'Detalhe do relógio de aço', 'relogio-aco'],
  ['tenis-chunky.svg', 'Tênis chunky areia', 'tenis-chunky'],
  ['bolsa-crossbody.svg', 'Bolsa transversal preta', 'bolsa-crossbody'],
  ['camiseta-oversized.svg', 'Camiseta oversized off-white', 'camiseta-oversized'],
];

/** Cupons de demonstração, conferidos no carrinho. */
export const CUPONS = [
  { codigo: 'VANTA10', tipo: 'percentual', valor: 10, minimo: 0,
    texto: '10% de desconto no subtotal' },
  { codigo: 'BEMVINDO', tipo: 'percentual', valor: 15, minimo: 400,
    texto: '15% em compras acima de R$ 400' },
  { codigo: 'FRETEVANTA', tipo: 'frete', valor: 0, minimo: 0,
    texto: 'frete grátis em qualquer valor' },
];

export const ORDENACOES = [
  ['relevancia',  'Mais relevantes'],
  ['recentes',    'Mais recentes'],
  ['menor-preco', 'Menor preço'],
  ['maior-preco', 'Maior preço'],
  ['desconto',    'Maior desconto'],
];

export const ESTADOS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG',
  'MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'];

export const PAGAMENTOS = [
  { id: 'pix', nome: 'Pix', linha: '5% de desconto · aprovação na hora' },
  { id: 'cartao', nome: 'Cartão de crédito', linha: `Até ${LOJA.parcelas}x sem juros` },
  { id: 'boleto', nome: 'Boleto bancário', linha: 'Compensa em até 3 dias úteis' },
];
