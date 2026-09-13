/**
 * Os três projetos da vitrine.
 *
 * As imagens são capturas REAIS das telas, tiradas dos próprios sites
 * que estão em publico/demos/. Para atualizar, rode as capturas de novo
 * (veja o README) — nada aqui é mockup desenhado à mão.
 */
export const PROJETOS = [
  {
    slug: 'prata-nobre',
    nome: 'PRATA NOBRE',
    tipo: 'Prata moderna',
    segmento: 'Loja de prata 925',
    resumo: 'Loja de prata para quem vende volume com preço acessível: ' +
            'catálogo claro, sacola que soma o frete grátis na frente do ' +
            'cliente e fechamento direto no WhatsApp.',
    estilo: ['Claro', 'Minimalista', 'Limpo', 'Direto ao produto'],
    corDeFundo: '#F2F3F6',
    corDeTexto: '#15171C',
    /* O que o visitante ganha se pedir algo assim. */
    destaques: [
      'Filtro por categoria em um toque',
      'Sacola que mostra quanto falta para o frete grátis',
      'Janela de produto com tamanho e medidas',
    ],
    link: 'demos/prata-nobre/index.html',
    alt: 'Tela inicial do site PRATA NOBRE, loja de prata 925 com fundo claro',
  },
  {
    slug: 'aurea',
    nome: 'AUREA',
    tipo: 'Joalheria premium',
    segmento: 'Alta joalheria',
    resumo: 'Joalheria de peça cara, onde a decisão é lenta e o atendimento é ' +
            'pessoal. O site não empurra carrinho: ele apresenta a peça e ' +
            'leva para a conversa com um consultor.',
    estilo: ['Escuro', 'Editorial', 'Sofisticado', 'Muito espaço'],
    corDeFundo: '#0E0E12',
    corDeTexto: '#F4F1EA',
    destaques: [
      'Uma página por peça, com ficha técnica completa',
      'WhatsApp como consulta, nunca como pagamento',
      'Preço apresentado como valor de referência',
    ],
    link: 'demos/aurea/index.html',
    alt: 'Tela inicial do site AUREA, joalheria premium com fundo escuro',
  },
  {
    slug: 'volt',
    nome: 'VOLT',
    tipo: 'Acessórios urbanos',
    segmento: 'Acessórios e streetwear',
    resumo: 'Acessórios para público jovem que chega do Instagram e do TikTok. ' +
            'Tudo desenhado para o polegar: busca, filtro, ordenação e ' +
            'carrinho funcionando na tela do celular.',
    estilo: ['Ousado', 'Tipografia grande', 'Cor forte', 'Rápido'],
    corDeFundo: '#0A0A0B',
    corDeTexto: '#D6FF2E',
    destaques: [
      'Busca que ignora acento e varre a descrição',
      'Seis critérios de ordenação e filtro por oferta',
      'Carrinho que monta o pedido no WhatsApp',
    ],
    link: 'demos/volt/index.html',
    alt: 'Tela inicial do site VOLT, acessórios urbanos com tipografia grande',
  },
];

export const imagensDe = (p) => ({
  desk: `assets/${p.slug}-desk.jpg`,
  cel: `assets/${p.slug}-cel.jpg`,
});
