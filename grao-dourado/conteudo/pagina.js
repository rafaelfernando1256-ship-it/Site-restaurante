/* ═══════════════════════════════════════════════════════════════
   TEXTOS DA PÁGINA

   Todo texto que aparece no site está aqui. Para mudar uma palavra
   você não precisa abrir nenhum template.

   O tom segue o do Instagram deles: caloroso, caseiro, sem
   firula de agência. Onde eu usei frase que é deles, está marcado.
   ═══════════════════════════════════════════════════════════════ */

export const HERO = {
  etiqueta: 'Café, salgado e bolo feitos aqui',
  titulo: 'Unindo o café aos<br>melhores sentimentos',
  texto:
    'Um café dentro do lounge da Evidance, em Natal. A empada sai do forno, o bolo é receita de família e o grão é moído na hora — na sua frente.',
  ctaPrincipal: 'Ver o cardápio',
  ctaSecundario: 'Pedir no WhatsApp',
  foto: 'capuccino',
  mensagemWhats:
    'Oi! Vim pelo site e queria fazer um pedido.\n\nItem: \nQuantidade: \nRetirada ou entrega: ',
};

/* ── Seção de encomendas ───────────────────────────────────────── */
/* É onde mora o ticket alto de um café: bolo de aniversário,
   quiche para reunião, cento de empada para festa. No Instagram
   isso aparece solto nos stories; num site vira seção com preço. */
export const ENCOMENDAS = {
  etiqueta: 'Encomendas',
  titulo: 'Para a sua festa, reunião ou aquele domingo em casa',
  texto:
    'A gente faz por encomenda com antecedência de 48 horas. Peça pelo WhatsApp dizendo o que você quer, para quantas pessoas e para quando.',
  /* ⚠️ CONFERIR — quantidades e preços são de demonstração. */
  pacotes: [
    {
      slug: 'cento-salgados',
      nome: 'Cento de salgados',
      desc: 'Empada, esfiha e croissant mini, na proporção que você quiser',
      detalhe: '100 unidades · serve de 20 a 25 pessoas',
      preco: 280,
      foto: 'empada-arte',
      arte: 'enc-salgados.svg',
    },
    {
      slug: 'bolo-festa',
      nome: 'Bolo de festa',
      desc: 'Bolo da moça, de milho ou chocolate. Recheio e cobertura à escolha',
      detalhe: 'A partir de 1,5 kg · serve de 15 a 20 pessoas',
      preco: 160,
      foto: 'doces-natal',
      arte: 'enc-bolo.svg',
    },
    {
      slug: 'quiche-inteira',
      nome: 'Quiche inteira',
      desc: 'De queijo, de alho-poró ou de frango. Vai pronta para assar ou já assada',
      detalhe: '24 cm · serve de 6 a 8 pessoas',
      preco: 95,
      foto: 'quiche',
      arte: 'enc-quiche.svg',
    },
    {
      slug: 'kit-cafe',
      nome: 'Coffee break',
      desc: 'Café em garrafa térmica, salgados, bolo fatiado e suco. A gente leva e monta',
      detalhe: 'A partir de 15 pessoas · consulte o cardápio do dia',
      preco: 0, // 0 = "sob consulta"
      foto: 'familia',
      arte: 'enc-coffee.svg',
    },
  ],
  mensagemWhats:
    'Oi! Queria fazer uma encomenda.\n\nO que: \nPara quantas pessoas: \nPara quando: \nRetirada ou entrega: ',
};

/* ── Agenda ────────────────────────────────────────────────────── */
/* O que separa este café de uma padaria: a casa fica dentro de uma
   academia de dança e vira palco à noite. Isso é diferencial de
   verdade e merecia estar no site, não só em story que some em 24h.

   ⚠️ CONFERIR — o Café com Tango é evento real do Instagram deles.
   As datas abaixo são exemplo de como a agenda apareceria; confirme
   a programação antes de publicar. */
export const AGENDA = {
  etiqueta: 'Na nossa casa',
  titulo: 'Tem noite que o café vira palco',
  texto:
    'A gente fica dentro do lounge da Evidance, e isso rende. Música ao vivo, roda de dança, aula aberta — e sempre com café na mão.',
  eventos: [
    {
      slug: 'cafe-com-tango',
      nome: 'Café com Tango',
      artista: 'Vagner Victor, ao vivo',
      /* Frase do cartaz deles. */
      chamada: 'Desperte sua alma com café e bons tangos',
      quando: 'Primeiro domingo do mês',
      hora: '18h30',
      entrada: 'Entrada franca',
      foto: 'ev-lounge',
      arte: 'ev-tango.svg',
    },
    {
      slug: 'noite-arabe',
      nome: 'Noite árabe',
      artista: 'Com as turmas de dança do ventre da Evidance',
      chamada: 'Apresentação, chá, café e doce árabe',
      quando: 'Última sexta do mês',
      hora: '20h',
      entrada: 'Entrada franca',
      foto: 'ev-arabe',
      arte: 'ev-arabe.svg',
    },
    {
      slug: 'sabado-no-lounge',
      nome: 'Sábado no lounge',
      artista: 'Playlist da casa',
      chamada: 'O dia inteiro de portas abertas, com o cardápio completo',
      quando: 'Todo sábado',
      hora: '9h às 22h',
      entrada: 'Entrada franca',
      foto: 'ev-brinde',
      arte: 'ev-sabado.svg',
    },
  ],
  rodape:
    'A programação muda. O jeito mais rápido de saber o que tem essa semana é o Instagram.',
};

/* ── O espaço ──────────────────────────────────────────────────── */
export const ESPACO = {
  etiqueta: 'O espaço',
  titulo: 'Mesa para ficar, não só para passar',
  texto:
    'Tijolo aparente, luz morna e cadeira que não apressa ninguém. Dá para trabalhar de manhã, conversar à tarde e assistir a uma apresentação à noite — tudo na mesma mesa.',
  itens: [
    { titulo: 'Wi-Fi liberado', texto: 'Senha no balcão, sem consumo mínimo' },
    { titulo: 'Tomada na parede', texto: 'Dá para trabalhar sem ficar de olho na bateria' },
    { titulo: 'Ar-condicionado', texto: 'Natal é quente; aqui dentro não' },
    { titulo: 'Mesa grande', texto: 'Cabe reunião de seis sem apertar' },
  ],
  galeria: [
    { foto: 'salao', arte: 'esp-salao.svg', alt: 'O salão: mesas de madeira e parede de tijolo' },
    { foto: 'balcao-neon', arte: 'esp-balcao.svg', alt: 'O balcão, com o letreiro de café aceso' },
    { foto: 'balcao', arte: 'esp-vitrine.svg', alt: 'Atendimento no balcão' },
    { foto: 'mesa', arte: 'esp-mesa.svg', alt: 'Mesa do salão, com café servido' },
  ],
};

/* ── Sobre ─────────────────────────────────────────────────────── */
export const SOBRE = {
  etiqueta: 'Quem faz',
  titulo: 'Café é desculpa. O que a gente quer é a conversa que vem junto',
  paragrafos: [
    'O Grão Dourado nasceu de uma ideia simples: um lugar onde o café fosse bom o bastante para a pessoa querer ficar, e o atendimento bom o bastante para ela voltar.',
    'A gente faz quase tudo aqui dentro. A massa da empada, o recheio, o bolo da moça — aquele cuja receita a gente já mostrou no Instagram, porque segredo bom é segredo dividido. O que não dá para fazer em casa, a gente escolhe com cuidado.',
    'Estamos no lounge da Evidance, e isso não é acaso: café e dança combinam mais do que parece. Tem gente que chega para a aula e fica para o café, e tem gente que chega para o café e acaba dançando.',
  ],
  assinatura: 'A casa',
  foto: 'cafe-mao',
  arte: 'sobre-balcao.svg',
};

/* ── Perguntas ─────────────────────────────────────────────────── */
/* Cada uma aqui é uma objeção que trava a visita. A pergunta sobre
   precisar ser aluno da academia é a mais importante da lista:
   estar dentro de outro negócio faz muita gente achar que não pode
   entrar. */
export const PERGUNTAS = {
  etiqueta: 'Perguntas',
  titulo: 'O que a gente mais responde',
  lista: [
    {
      p: 'Preciso ser aluno da Evidance para entrar?',
      r: 'Não. O café é aberto a qualquer pessoa, aluno ou não. A gente fica no lounge, logo na entrada — é só entrar e sentar.',
    },
    {
      p: 'Vocês entregam?',
      r: 'Entregamos na região. Chame no WhatsApp com o endereço que a gente confirma a taxa e o tempo antes de você fechar o pedido.',
    },
    {
      p: 'Dá para encomendar bolo ou salgado para festa?',
      r: 'Dá, com 48 horas de antecedência. Bolo de festa, cento de salgado, quiche inteira e coffee break completo — tem uma seção só disso aqui no site.',
    },
    {
      p: 'Tem opção vegetariana?',
      r: 'Tem. No cardápio, os itens sem carne estão marcados com o selo "Vegetariano". A quiche de queijo, a tapioca e todos os doces entram nessa lista.',
    },
    {
      p: 'Posso trabalhar aí?',
      r: 'Pode, e muita gente faz. Wi-Fi liberado, tomada na parede e ar-condicionado. Não tem consumo mínimo nem tempo máximo de mesa.',
    },
    {
      p: 'Aceitam cartão e Pix?',
      r: 'Aceitamos. Cartão de crédito, débito, Pix e dinheiro.',
    },
    {
      p: 'Tem estacionamento?',
      r: 'Tem vaga na frente. Em noite de evento costuma encher — se puder, chegue um pouco antes.',
    },
  ],
};

/* ── Fechamento ────────────────────────────────────────────────── */
export const FECHAMENTO = {
  titulo: 'A água já está quente',
  texto:
    'Chame no WhatsApp para pedir, encomendar ou só perguntar o que tem de bolo hoje. A gente responde.',
  cta: 'Chamar no WhatsApp',
  mensagemWhats: 'Oi! Vim pelo site do Grão Dourado.',
};

/* ── Aviso de demonstração ─────────────────────────────────────── */
/* Fica no topo de todas as páginas. É um site feito sobre um negócio
   real, sem a casa ter pedido: o aviso precisa estar visível, não
   escondido no rodapé. */
export const AVISO = {
  texto: 'Site demonstrativo, feito de fora como exemplo',
  detalhe:
    'Não é o site oficial do Grão Dourado. Preços, horários e telefone são exemplos e precisam ser confirmados com a casa.',
};
