/* ═══════════════════════════════════════════════════════════════
   A REGIÃO

   Hotel de cidade pequena não vende cama: vende o motivo da
   viagem. Quase toda avaliação do Mega Express cita a Serra da
   Capivara — quem reserva aqui já decidiu vir ao parque, ou está
   decidindo. Por isso o destino tem página própria no site, e não
   um parágrafo no rodapé.

   ⚠️ CONFERIR — distâncias, horários e preços do parque mudam.
   Os campos marcados precisam ser confirmados com o ICMBio, com a
   Fundham ou com a própria recepção antes de publicar.
   ═══════════════════════════════════════════════════════════════ */

export const REGIAO = {
  etiqueta: 'Onde você está',
  titulo: 'São Raimundo Nonato é a porta da Serra da Capivara',
  texto:
    'O Parque Nacional Serra da Capivara guarda a maior concentração de sítios com pintura rupestre do mundo e é Patrimônio Mundial da UNESCO. A cidade é a base de quem vem ver — e o hotel fica nos dois pontos que importam: no centro e no caminho do parque.',
  foto: 'rupestre',
};

export const ATRACOES = [
  {
    slug: 'parque-nacional',
    nome: 'Parque Nacional Serra da Capivara',
    resumo:
      'Mais de mil sítios arqueológicos catalogados e pinturas rupestres com milhares de anos. Patrimônio Mundial da UNESCO desde 1991.',
    /* ⚠️ CONFERIR — distância e tempo aproximados. */
    detalhe: 'Entrada principal a cerca de 30 minutos do centro',
    dica: 'Guia credenciado é obrigatório nos circuitos. A recepção ajuda a contratar.',
    foto: 'rupestre',
  },
  {
    slug: 'pedra-furada',
    nome: 'Pedra Furada',
    resumo:
      'O arco de pedra que virou símbolo do parque. É o sítio mais conhecido e um dos mais fotografados do Brasil.',
    detalhe: 'No circuito do Boqueirão da Pedra Furada',
    dica: 'Vá no fim da tarde: a luz entra pelo arco e a temperatura cai.',
    foto: 'pedra-furada',
  },
  {
    slug: 'boqueiroes',
    nome: 'Boqueirões e paredões',
    resumo:
      'Cânions de arenito esculpidos pelo tempo, com mirantes abertos sobre a caatinga. Trilha de todos os níveis.',
    detalhe: 'Vários circuitos dentro do parque',
    dica: 'Leve mais água do que acha que precisa. A caatinga engana.',
    foto: 'canion',
  },
  {
    slug: 'museu',
    nome: 'Museu do Homem Americano',
    resumo:
      'O acervo que explica o que você viu no parque: peças, datações e a história de quem morou aqui antes de todo mundo.',
    /* ⚠️ CONFERIR — horário de funcionamento. */
    detalhe: 'Na cidade, perto da unidade do centro',
    dica: 'Vá antes do parque. A visita rende muito mais depois.',
    foto: 'paredao',
  },
  {
    slug: 'caatinga',
    nome: 'A caatinga em flor',
    resumo:
      'Entre dezembro e março a chuva vira verde e o mandacaru floresce. É outra paisagem, no mesmo lugar.',
    detalhe: 'Melhor período: de dezembro a março',
    dica: 'Fora da chuva, o céu limpo rende um pôr do sol que compensa.',
    foto: 'por-do-sol',
  },
  {
    slug: 'opera',
    nome: 'Ópera Serra da Capivara',
    resumo:
      'Espetáculo a céu aberto que a região recebe, com elenco e cenário na própria paisagem. Em 2026, o Ato Cleópatra — Rainha Caatingueira.',
    /* ⚠️ CONFERIR — datas da temporada. */
    detalhe: 'Temporada 2026',
    dica: 'Reserve hospedagem cedo: a cidade enche na semana do espetáculo.',
    foto: 'opera',
  },
];

/* Galeria da página do destino. */
export const PAISAGENS = [
  { foto: 'rupestre', alt: 'Painel de pinturas rupestres em paredão de arenito' },
  { foto: 'pedra-furada', alt: 'O arco da Pedra Furada contra o céu' },
  { foto: 'canion', alt: 'Paredão de arenito no parque' },
  { foto: 'canion-2', alt: 'Cânion da Serra da Capivara visto de cima' },
  { foto: 'serra', alt: 'Vista aberta da serra sobre a caatinga' },
  { foto: 'serra-cactos', alt: 'Caatinga com mandacarus e a serra ao fundo' },
  { foto: 'paredao', alt: 'Paredão de pedra e céu azul' },
  { foto: 'por-do-sol', alt: 'Pôr do sol na caatinga' },
];
