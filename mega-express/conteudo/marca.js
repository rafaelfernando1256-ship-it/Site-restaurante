/* ═══════════════════════════════════════════════════════════════
   MEGA EXPRESS HOTEL — DADOS DA CASA

   ⚠️ PROJETO DEMONSTRATIVO
   Montado de fora, a partir do que está público no Instagram
   @megaexpresshotel. Não é o site oficial.

   O que eu CONSEGUI confirmar no perfil deles está sem marcação.
   O que eu NÃO consegui está marcado com `CONFERIR` logo acima.

   SOBRE OS TELEFONES: são os números reais, publicados por eles nos
   posts fixados do próprio perfil. Mantive porque um site de hotel
   sem caminho de reserva não serve para mostrar a ninguém — e porque
   são os números certos deste negócio. O site inteiro está em
   `noindex` e carrega o aviso de demonstração justamente por isso.
   Se preferir, troque pelos campos abaixo e nada mais quebra.
   ═══════════════════════════════════════════════════════════════ */

export const MARCA = {
  nome: 'Mega Express Hotel',
  nomeCurto: 'Mega Express',
  lema: 'Duas unidades em São Raimundo Nonato, a porta de entrada da Serra da Capivara',
  cidade: 'São Raimundo Nonato, PI',
  instagram: 'megaexpresshotel',

  /* ⚠️ CONFERIR — e-mail não está público no perfil. */
  email: 'reservas@megaexpresshotel.com.br',
};

/* ── As duas unidades ───────────────────────────────────────────
   É a decisão mais importante do site inteiro. Quem chega não quer
   saber do "hotel": quer saber em QUAL das duas se hospedar. Os
   diferenciais abaixo vieram dos posts fixados deles e aparecem
   confirmados nas avaliações do Google.                           */
export const UNIDADES = [
  {
    slug: 'mega-express-i',
    nome: 'Mega Express I',
    apelido: 'Centro',
    telefone: '5589981091555',
    telefoneVisivel: '(89) 98109-1555',
    chamada: 'No centro, a pé de tudo',
    resumo:
      'Fica na praça, no meio da cidade. Você sai do hotel e já está em restaurante, loja e farmácia — e à noite as mesas tomam a praça.',
    paraQuem: 'Para quem vem a trabalho, fica pouco tempo ou quer resolver tudo a pé.',
    foto: 'fachada-palmei',
    destaques: [
      { titulo: 'Centro da cidade', texto: 'Na praça, com tudo à volta' },
      { titulo: 'Bares e restaurantes', texto: 'A pé, sem precisar de carro' },
      { titulo: 'Apartamentos com varanda', texto: 'Alguns quartos têm; peça na reserva' },
    ],
    /* A unidade I NÃO serve café da manhã. Está dito por hóspede na
       avaliação do Google, e omitir isso seria enganar quem reserva. */
    cafeDaManha: false,
    piscina: false,
    comodidades: ['estacionamento', 'wifi', 'ar', 'frigobar', 'tv', 'varanda'],
    galeria: ['fachada-palmei', 'quarto-tv', 'recepcao-vasos', 'fachada-ceu'],
  },
  {
    slug: 'mega-express-ii',
    nome: 'Mega Express II',
    apelido: 'Piscina',
    telefone: '5589981111555',
    telefoneVisivel: '(89) 98111-1555',
    chamada: 'Piscina, café da manhã e o caminho do parque',
    resumo:
      'Fica no acesso ao Parque Nacional Serra da Capivara. Tem café da manhã servido e área de lazer com piscina — que é o que todo mundo procura depois de um dia de trilha.',
    paraQuem: 'Para quem vem pela Serra da Capivara e quer voltar do parque e cair na água.',
    foto: 'piscina-cascata',
    destaques: [
      { titulo: 'Acesso ao Parque Nacional', texto: 'No caminho da Serra da Capivara' },
      { titulo: 'Café da manhã', texto: 'Servido todos os dias' },
      { titulo: 'Área de lazer com piscina', texto: 'Para refrescar depois da trilha' },
    ],
    cafeDaManha: true,
    piscina: true,
    comodidades: ['cafe', 'piscina', 'estacionamento', 'wifi', 'ar', 'frigobar', 'tv'],
    galeria: ['piscina-cascata', 'quarto-cama', 'cafe-frutas', 'lazer'],
  },
];

export const unidadePor = (slug) => UNIDADES.find((u) => u.slug === slug);

/* ── Comodidades ────────────────────────────────────────────────
   O texto de cada uma sai daqui, para a mesma comodidade não ser
   descrita de três jeitos diferentes em três páginas.             */
export const COMODIDADES = {
  cafe: { nome: 'Café da manhã', texto: 'Fruta, bolo, pão e café, servidos todas as manhãs' },
  piscina: { nome: 'Piscina', texto: 'Área de lazer com espreguiçadeiras' },
  estacionamento: { nome: 'Estacionamento próprio', texto: 'Na frente do hotel, sem custo' },
  wifi: { nome: 'Wi-Fi gratuito', texto: 'Em todo o hotel, sem senha avulsa' },
  ar: { nome: 'Ar-condicionado', texto: 'Em todos os apartamentos' },
  frigobar: { nome: 'Frigobar', texto: 'No quarto, já gelado' },
  tv: { nome: 'TV', texto: 'Tela plana em todos os quartos' },
  varanda: { nome: 'Varanda', texto: 'Em parte dos apartamentos — peça na reserva' },
};

/* ── Mensagens prontas ──────────────────────────────────────────
   Toda reserva sai pelo WhatsApp da UNIDADE escolhida: mandar para
   a central errada é o jeito mais rápido de perder a reserva.     */
export const wa = (telefone, mensagem = '') =>
  `https://wa.me/${telefone}` + (mensagem ? `?text=${encodeURIComponent(mensagem)}` : '');

export const insta = () => `https://instagram.com/${MARCA.instagram}`;

/* ── Aviso que a própria casa publicou ──────────────────────────
   Está num post fixado do perfil deles. Num site de hotel isso não
   é recado de rodapé: é a primeira coisa que protege o hóspede.   */
export const AVISO_GOLPE = {
  titulo: 'Cuidado com golpes em nome do hotel',
  texto:
    'Estão usando o nome do Mega Express Hotel para aplicar golpes no Telegram, oferecendo supostas vagas de trabalho ou recompensas em troca de avaliações. Essa prática é falsa e não tem nenhuma relação com o hotel.',
  acao: 'Se receber mensagem desse tipo, desconsidere e denuncie. Reserva só pelos números desta página.',
};
