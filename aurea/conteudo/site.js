/**
 * AUREA — textos e configuração do site.
 * Marca fictícia, criada para demonstração de portfólio.
 */

export const MARCA = {
  nome: 'AUREA',
  descricao: 'Alta joalheria autoral. Ouro 18k, pedras certificadas e ' +
             'atendimento com hora marcada.',
  dominio: 'https://aurea.joias',        // fictício
  whatsapp: '5511987654321',             // troque pelo número real
  whatsappVisivel: '+55 11 98765-4321',
  email: 'atelie@aurea.joias',
  instagram: '@aurea.joias',
  endereco: 'Ateliê em São Paulo · visitas com hora marcada',
  horario: 'Segunda a sexta, 10h às 19h · sábado, 10h às 14h',
  fundacao: '2009',
};

/** Monta o link de consulta. O WhatsApp aqui é canal de atendimento — 
 *  em nenhum ponto do site ele aparece como forma de pagamento. */
export function linkWhats(texto) {
  return `https://wa.me/${MARCA.whatsapp}?text=${encodeURIComponent(texto)}`;
}

export function consultaPeca(peca) {
  return linkWhats(
    `Olá! Gostaria de consultar disponibilidade e condições da peça ` +
    `${peca.nome} (ref. ${peca.ref}), vista no site da AUREA.`);
}

export const CONSULTA_GERAL =
  'Olá! Vim pelo site da AUREA e gostaria de falar com um consultor.';

export const HERO = {
  sobretitulo: 'Ateliê de alta joalheria',
  titulo: 'Elegância que permanece.',
  texto: 'Peças autorais em ouro 18k, desenhadas e acabadas à mão no nosso ' +
         'ateliê. Produção curta, pedras certificadas e uma conversa antes ' +
         'de cada compra.',
  cta: 'Descobrir coleção',
  ctaSecundario: 'Falar com um consultor',
  selos: [
    ['18k', 'ouro maciço'],
    ['Com laudo', 'todas as pedras'],
    ['15 anos', 'de bancada'],
  ],
};

export const SECOES = {
  destaque: {
    indice: '01', etiqueta: 'Coleção em destaque',
    titulo: 'As peças da temporada',
    texto: 'Uma seleção curta do que está no ateliê agora. Todas disponíveis ' +
           'para prova com hora marcada.',
  },
  colecoes: {
    indice: '06', etiqueta: 'Coleções especiais',
    titulo: 'Séries com começo e fim',
    texto: 'Três linhas com produção limitada. Quando encerram, encerram — ' +
           'não refazemos tiragem.',
  },
  historia: {
    indice: '07', etiqueta: 'A marca',
    titulo: 'Quinze anos na mesma bancada',
    paragrafos: [
      'A AUREA começou em 2009 como uma bancada de ourives e dois pares de mãos. ' +
      'Não abrimos loja de rua: preferimos receber com hora marcada, com a peça ' +
      'em cima da mesa e tempo para conversar.',
      'Desenhamos, fundimos, cravamos e acabamos tudo no mesmo lugar. É mais lento ' +
      'e é mais caro de operar — em troca, quem assina a peça é quem a fez.',
    ],
    marcos: [
      ['2009', 'Primeira bancada, dois ourives e um torno de segunda mão.'],
      ['2014', 'Ateliê próprio e o começo do acervo de croquis.'],
      ['2019', 'Cravação em grão passa a ser feita integralmente na casa.'],
      ['2024', 'Coleção Primeira Luz, a primeira totalmente autoral.'],
    ],
  },
  qualidade: {
    indice: '08', etiqueta: 'Qualidade e autenticidade',
    titulo: 'O que acompanha cada peça',
    texto: 'Joia cara sem procedência é só metal caro. O que garantimos, ' +
           'garantimos por escrito.',
    itens: [
      ['Laudo gemológico', 'Emitido por laboratório independente, com peso, cor, ' +
        'pureza e lapidação de cada pedra central.'],
      ['Certificado de origem', 'Cadeia de fornecimento declarada, com nota de ' +
        'compra das pedras rastreável.'],
      ['Punção e numeração', 'Toda peça sai marcada com o teor do ouro, a punção ' +
        'do ateliê e um número de série único.'],
      ['Garantia vitalícia de fabricação', 'Defeito de solda, engaste ou acabamento ' +
        'é nosso, sem prazo. Polimento e banho de manutenção, uma vez por ano.'],
    ],
  },
  atendimento: {
    indice: '09', etiqueta: 'Atendimento personalizado',
    titulo: 'Ninguém compra joia por impulso',
    paragrafos: [
      'O atendimento começa por uma conversa, não por um carrinho. Você chama no ' +
      'WhatsApp, conta o que procura e um consultor responde — normalmente no ' +
      'mesmo dia útil.',
      'Se fizer sentido, marcamos uma visita ao ateliê para provar as peças. ' +
      'Também atendemos por vídeo, com a joia na mão e luz de bancada, para quem ' +
      'está fora de São Paulo.',
    ],
    etapas: [
      ['01', 'Conversa', 'Você diz a ocasião, a faixa de investimento e o estilo. ' +
        'Sem formulário e sem cadastro.'],
      ['02', 'Seleção', 'Separamos de três a cinco peças que cabem no que você ' +
        'descreveu — incluindo o que ainda não está no site.'],
      ['03', 'Prova', 'No ateliê ou por vídeo, com tempo. Ajuste de aro e gravação ' +
        'entram aqui.'],
      ['04', 'Entrega', 'Entrega em mãos em São Paulo ou envio assegurado para ' +
        'todo o Brasil, com laudo e certificado.'],
    ],
    nota: 'O WhatsApp é o nosso canal de atendimento e consulta. Nenhum pagamento ' +
          'é processado por ali nem por este site.',
  },
  instagram: {
    indice: '10', etiqueta: 'Instagram',
    titulo: MARCA.instagram,
    texto: 'Bastidores da bancada, peças recém-acabadas e croquis do acervo.',
    cta: 'Seguir no Instagram',
  },
  faq: {
    indice: '11', etiqueta: 'Perguntas frequentes',
    titulo: 'O que costumam perguntar',
  },
  final: {
    etiqueta: 'Vamos conversar',
    titulo: 'A próxima peça começa com uma conversa.',
    texto: 'Conte o que você procura. Um consultor responde no mesmo dia útil, ' +
           'sem compromisso e sem cadastro.',
    cta: 'Falar com um consultor',
  },
};

export const FAQ = [
  ['Como funciona a compra?',
   'Não há checkout automático neste site. Você consulta a peça pelo WhatsApp, ' +
   'um consultor confirma disponibilidade, condições e prazo, e o pagamento é ' +
   'combinado diretamente com o ateliê — por transferência, cartão em maquininha ' +
   'no atendimento presencial ou link seguro emitido pelo nosso financeiro.'],
  ['Os preços do site estão atualizados?',
   'Os valores são de referência e acompanham a cotação do ouro e das pedras, ' +
   'que muda. O preço firme para a sua peça é confirmado na consulta e vale por ' +
   'sete dias.'],
  ['Dá para encomendar uma peça sob medida?',
   'Sim, e é boa parte do que fazemos. A partir de um desenho seu, de uma ' +
   'referência ou de uma peça da família para remontar. O processo leva de seis ' +
   'a dez semanas e começa com um croqui aprovado por você antes de qualquer ' +
   'fundição.'],
  ['Vocês têm loja física?',
   'Não temos loja de rua nem quiosque em shopping. Recebemos no ateliê, em São ' +
   'Paulo, com hora marcada — assim a peça está separada e há tempo para provar ' +
   'com calma. Quem está em outra cidade é atendido por vídeo.'],
  ['E se o tamanho não servir?',
   'O primeiro ajuste de aro ou de comprimento é por nossa conta, em qualquer ' +
   'peça. Depois disso, cobramos apenas o material quando houver acréscimo de ouro.'],
  ['Como é o envio para fora de São Paulo?',
   'Transporte assegurado pelo valor integral, com rastreio e entrega em mãos ' +
   'mediante documento. O seguro é por nossa conta e o prazo típico é de dois a ' +
   'cinco dias úteis depois da confirmação.'],
  ['Como cuido da peça no dia a dia?',
   'Joia é a última coisa a colocar e a primeira a tirar. Evite contato com ' +
   'perfume, cloro e produto de limpeza. Uma vez por ano, traga para polimento e ' +
   'rebanho de ródio — esse serviço é gratuito para sempre.'],
];

/** Fotos do feed: reaproveitam vistas do catálogo. */
export const INSTAGRAM = [
  ['anel-solsticio.svg',      'Anel Solstício em ouro amarelo com diamante central'],
  ['colar-constelacao-2.svg', 'Detalhe do Colar Constelação em ouro branco'],
  ['brinco-cascata.svg',      'Brincos Cascata com diamantes em degradê'],
  ['anel-heranca-3.svg',      'Anel Herança com esmeralda em lapidação degrau'],
  ['pulseira-riviera-2.svg',  'Detalhe da Pulseira Riviera'],
  ['colar-aurora.svg',        'Colar Aurora com safira em lapidação gota'],
];
