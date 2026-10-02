/* ═══════════════════════════════════════════════════════════════
   TEXTOS DAS SEÇÕES
   Todo texto visível do site está aqui ou nos outros arquivos de
   conteudo/. Nenhuma palavra mora dentro de template.
   ═══════════════════════════════════════════════════════════════ */

export const HERO = {
  etiqueta: 'São Raimundo Nonato · Piauí',
  titulo: 'Duas unidades.<br>Uma Serra da Capivara.',
  texto:
    'Uma no centro, a pé de tudo. Outra no caminho do parque, com piscina e café da manhã. Escolha pela sua viagem, não pelo que sobrou.',
  ctaPrincipal: 'Ver as duas unidades',
  ctaSecundario: 'Reservar agora',
  foto: 'fachada-palmei',
};

/* ── Seção que escolhe a unidade ────────────────────────────────
   É a primeira pergunta de quem chega no site, e a página inteira
   gira em torno dela.                                             */
export const ESCOLHA = {
  etiqueta: 'As duas unidades',
  titulo: 'Qual delas é a sua?',
  texto:
    'As duas têm quarto novo, ar-condicionado, estacionamento próprio e Wi-Fi gratuito. O que muda é onde ficam e o que oferecem além disso.',
};

/* ── Reserva ────────────────────────────────────────────────────
   Não existe motor de reservas aqui e não existe pagamento: o
   formulário monta a mensagem e abre o WhatsApp da unidade
   escolhida, que é onde a casa já atende.                        */
export const RESERVA = {
  etiqueta: 'Reserva',
  titulo: 'Diga as datas que a gente confirma',
  texto:
    'Preencha e envie. A mensagem chega pronta no WhatsApp da unidade que você escolher, com as datas e o número de pessoas já escritos.',
  nota:
    'A disponibilidade e o valor da diária são confirmados na conversa. Não há pagamento por esta página.',
};

export const ESTRUTURA = {
  etiqueta: 'Estrutura',
  titulo: 'O que você encontra nas duas',
  texto:
    'Quarto novo, limpo e com ar que funciona. O resto muda de unidade para unidade — e está dito em cada uma, sem letra miúda.',
};

export const QUARTOS = {
  etiqueta: 'Acomodações',
  titulo: 'Quarto para dormir bem depois de um dia de trilha',
  texto:
    'Cama de verdade, chuveiro com pressão, frigobar gelado e ar-condicionado. Parte dos apartamentos da unidade do centro tem varanda — peça na hora de reservar.',
  galeria: [
    { foto: 'quarto-cama', alt: 'Apartamento com cama de casal e luminárias de cabeceira' },
    { foto: 'quarto-tv', alt: 'Apartamento com TV de tela plana e cabeceira de madeira' },
    { foto: 'quarto', alt: 'Apartamento com cama ampla e cortina blackout' },
    { foto: 'lobby', alt: 'Área de estar do hotel' },
  ],
};

export const AVALIACOES_SECAO = {
  etiqueta: 'Quem já ficou',
  titulo: 'O que os hóspedes escreveram',
  texto:
    'Avaliações publicadas no Google e no TripAdvisor, reproduzidas como foram escritas.',
};

export const PERGUNTAS = {
  etiqueta: 'Perguntas',
  titulo: 'O que mais perguntam antes de reservar',
  lista: [
    {
      p: 'Qual a diferença entre a unidade I e a II?',
      r: 'A I fica no centro, na praça, a pé de restaurante e loja — boa para quem vem a trabalho ou fica pouco tempo. A II fica no acesso ao Parque Nacional e tem piscina e café da manhã servido — boa para quem vem pela Serra da Capivara.',
    },
    {
      p: 'As duas servem café da manhã?',
      r: 'Não. O café da manhã é servido na unidade II. A unidade I não serve, mas fica numa praça cheia de opções para o café, a poucos passos da porta.',
    },
    {
      p: 'Tem estacionamento?',
      r: 'Tem, nas duas unidades, sem custo adicional.',
    },
    {
      p: 'O Wi-Fi é gratuito?',
      r: 'É, nas duas unidades, em todo o hotel.',
    },
    {
      p: 'Quanto custa a diária?',
      /* ⚠️ Eu não tenho o valor. Prefiro mandar perguntar a inventar
         um número — num hotel, preço errado no site vira discussão
         no balcão. */
      r: 'O valor varia com a data e com o tipo de apartamento. Mande as suas datas pelo WhatsApp da unidade e a gente confirma o valor junto com a disponibilidade.',
    },
    {
      p: 'Vocês ajudam a contratar guia para o parque?',
      r: 'A recepção orienta e ajuda a contratar. Os circuitos do Parque Nacional exigem guia credenciado, então vale resolver isso antes de chegar.',
    },
    {
      p: 'Qual a melhor época para visitar a Serra da Capivara?',
      r: 'De dezembro a março a caatinga fica verde e o mandacaru floresce. Fora desse período o céu é mais limpo e o calor mais seco — bom para trilha, desde que você saia cedo.',
    },
    {
      p: 'Dá para cancelar a reserva?',
      /* ⚠️ CONFERIR — política de cancelamento não está pública. */
      r: 'Combine na conversa do WhatsApp, no momento da reserva. A recepção explica o prazo antes de você confirmar.',
    },
  ],
};

export const FECHAMENTO = {
  titulo: 'A Serra da Capivara está esperando',
  texto:
    'Mande as suas datas. A gente confirma a disponibilidade, o valor e o que mais você precisar saber antes de pegar a estrada.',
  cta: 'Reservar pelo WhatsApp',
};

/* ── Aviso de demonstração ──────────────────────────────────────
   Fica visível em todas as páginas. É um site feito sobre um
   negócio real, sem a casa ter pedido: esconder isso no rodapé
   seria o mesmo que não avisar.                                   */
export const AVISO = {
  texto: 'Site demonstrativo, feito de fora como exemplo',
  detalhe:
    'Não é o site oficial do Mega Express Hotel. As fotos e as avaliações são do Instagram deles; horários, políticas e valores precisam ser confirmados com o hotel.',
};
