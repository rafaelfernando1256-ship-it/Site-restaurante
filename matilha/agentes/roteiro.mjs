/**
 * O ROTEIRO DO VENDEDOR — o que dizer a cada ramo, e como responder
 * às objeções que aparecem sempre.
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE UM ÂNGULO POR RAMO
 * ─────────────────────────────────────────────────────────────────
 * "Vi que vocês não têm site" é o que todo vendedor de site diz, e o
 * dono já ouviu dez vezes. O que faz ele responder é ouvir a dor DELE:
 * a pizzaria perde o pedido para quem mostra o cardápio; a barbearia
 * perde o cliente novo que queria ver os cortes antes; a pousada paga
 * comissão para a plataforma de reserva. Cada ângulo aqui é verdade
 * para o ramo inteiro — não depende de inventar nada sobre o negócio.
 *
 * O modelo recebe o ângulo como IDEIA, não como texto pronto: copiar
 * a mesma frase para cem pizzarias é o retrato da mensagem em massa.
 */

const semAcento = (t) => String(t || '').normalize('NFD')
  .replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** O ramo contém alguma destas palavras, inteiras? */
function casa(tipo, palavras) {
  const alvo = semAcento(tipo);
  if (!alvo) return false;
  return palavras.some((p) => new RegExp(`(^|[^a-z0-9])${semAcento(p)}([^a-z0-9]|$)`).test(alvo));
}

const RAMOS = [
  {
    chave: 'comida',
    acao: 'Pedir pelo WhatsApp',
    secoes: 'o topo (como a direção manda); o cardápio como lista tipográfica por categoria, nome à esquerda e preço à direita quando houver (nunca cartões com ícone); um parágrafo curto dizendo como pedir (delivery, retirada, mesa: só o que os fatos confirmam), em frase, sem passos numerados; a nota no Google dita em texto; endereço com o mapa do Google embutido e o horário numa tabela simples; o fim com o botão de pedir.',
    referencias: ['https://www.outback.com.br', 'https://www.madero.com.br', 'https://www.cocobambu.com', 'https://www.shakeshack.com', 'https://www.dominos.com.br'],
    palavras: ['restaurante', 'pizzaria', 'pizza', 'lanchonete', 'lanches', 'hamburgueria', 'burger',
      'hamburger', 'acai', 'sorveteria', 'padaria', 'confeitaria', 'doceria', 'cafeteria', 'cafe',
      'pastelaria', 'esfiharia', 'sushi', 'japones', 'churrascaria', 'espetinho', 'marmitaria',
      'marmitex', 'comida', 'food truck', 'bar', 'boteco', 'petiscaria', 'self service', 'buffet',
      'tapiocaria', 'creperia', 'temakeria', 'pastel', 'salgados', 'bolos'],
    angulo: 'Quem procura comida no celular quer ver o cardápio e os preços antes de pedir. Se não acha, '
      + 'pede de quem mostra. Um site com o cardápio e um botão de WhatsApp faz o cliente ver e já chamar '
      + 'para pedir, e o mesmo link serve no Instagram, no Google e no QR Code da mesa.',
    demo: 'o cardápio',
  },
  {
    chave: 'beleza',
    acao: 'Agendar pelo WhatsApp',
    secoes: 'o topo (como a direção manda); os serviços numa lista (nome à esquerda, "consulte" à direita), sem cartões; a galeria com as fotos reais, em grade reta sem bordas; a nota no Google dita em texto; endereço com o mapa do Google embutido e o horário numa tabela simples; o fim com o botão de agendar.',
    referencias: ['https://www.drybar.com', 'https://schorem.com', 'https://www.truefittandhill.com', 'https://www.jacquesjanine.com.br'],
    palavras: ['barbearia', 'barbeiro', 'salao', 'cabeleireiro', 'cabeleireira', 'estetica', 'manicure',
      'unhas', 'sobrancelha', 'cilios', 'depilacao', 'maquiagem', 'spa', 'tatuagem', 'tattoo'],
    angulo: 'Cliente novo quer ver fotos do trabalho, os serviços e os preços antes de marcar, e prefere '
      + 'marcar pelo WhatsApp sem ficar perguntando tudo. Um link com fotos, serviços e um botão para '
      + 'agendar faz quem achou vocês no Google virar horário marcado.',
    demo: 'a parte dos serviços e o botão de agendar',
  },
  {
    chave: 'saude',
    acao: 'Agendar pelo WhatsApp',
    secoes: 'o topo (como a direção manda); especialidades ou serviços numa lista clara (só os confirmados); o espaço, em foto, se houver; a nota no Google dita em texto; endereço com o mapa do Google embutido e o horário numa tabela simples; o fim com o botão de agendar. Nenhuma promessa de resultado ou cura.',
    referencias: ['https://www.onemedical.com', 'https://www.einstein.br', 'https://www.sorridents.com.br', 'https://www.tend.com'],
    palavras: ['clinica', 'consultorio', 'dentista', 'odontologia', 'odontologico', 'fisioterapia',
      'psicologo', 'psicologa', 'nutricionista', 'medico', 'pediatra', 'dermatologista', 'veterinario',
      'veterinaria', 'laboratorio', 'otica', 'farmacia', 'fonoaudiologa', 'quiropraxia', 'pilates'],
    angulo: 'Antes de marcar, as pessoas pesquisam: conferem especialidades, endereço e como agendar, e '
      + 'confiam mais em quem tem uma página séria. O site responde essas dúvidas e leva direto para o '
      + 'WhatsApp de agendamento. NÃO fale de resultado de tratamento nem de cura.',
    demo: 'a parte das especialidades e do agendamento',
  },
  {
    chave: 'hospedagem',
    acao: 'Reservar pelo WhatsApp',
    secoes: 'o topo (como a direção manda); o lugar, contado em duas ou três frases e nas fotos; quartos e estrutura (galeria reta, sem bordas); como chegar com o mapa do Google embutido; a nota no Google dita em texto; o fim com o botão de reservar direto.',
    referencias: ['https://www.fasano.com.br', 'https://www.txai.com.br', 'https://www.uxuahotel.com', 'https://www.aman.com'],
    palavras: ['pousada', 'hotel', 'hostel', 'chale', 'chales', 'camping', 'resort', 'motel', 'flat',
      'chacara', 'sitio', 'hospedagem', 'recanto'],
    angulo: 'Quem viaja quer ver os quartos, a localização e falar direto para reservar. Reserva que vem '
      + 'por plataforma paga comissão; um site próprio com fotos e um botão de WhatsApp leva o hóspede '
      + 'direto para vocês.',
    demo: 'as fotos dos quartos e o botão de reserva',
  },
  {
    chave: 'automotivo',
    acao: 'Chamar no WhatsApp',
    secoes: 'o topo (como a direção manda); os serviços numa lista densa em duas colunas, sem cartões; por que confiar: a nota e o número de avaliações, ditos em texto; endereço com o mapa do Google embutido e o horário numa tabela simples; o fim com o botão de chamar.',
    referencias: ['https://www.firestonecompleteautocare.com', 'https://www.midas.com', 'https://www.jiffylube.com'],
    palavras: ['oficina', 'mecanica', 'auto center', 'autocenter', 'borracharia', 'lava jato', 'lavajato',
      'lava rapido', 'funilaria', 'auto eletrica', 'autopecas', 'pneus', 'guincho', 'som automotivo',
      'estetica automotiva', 'insulfilm'],
    angulo: 'Carro com problema, a pessoa procura no celular quem está perto e chama quem mostra os '
      + 'serviços e o endereço. Um site com os serviços, o mapa e um botão de WhatsApp faz ela chamar '
      + 'vocês e não a oficina do lado.',
    demo: 'a lista de serviços e o botão de WhatsApp',
  },
  {
    chave: 'pet',
    acao: 'Agendar pelo WhatsApp',
    secoes: 'o topo (como a direção manda); os serviços numa lista grande (só os confirmados); galeria com fotos reais; a nota no Google dita em texto; endereço com o mapa e o horário; o fim com o botão de agendar.',
    referencias: ['https://www.petz.com.br', 'https://www.dogtopia.com', 'https://www.cobasi.com.br'],
    palavras: ['pet shop', 'petshop', 'banho e tosa', 'pet', 'agropecuaria', 'racao'],
    angulo: 'Dono de bicho quer ver os serviços, os preços do banho e tosa e marcar sem ligar. Um link '
      + 'com isso e um botão de WhatsApp vira agendamento.',
    demo: 'os serviços e o botão de agendar',
  },
  {
    chave: 'academia',
    acao: 'Agendar uma aula pelo WhatsApp',
    secoes: 'o topo (como a direção manda); as modalidades numa lista grande; a estrutura em fotos; horários só se confirmados, numa tabela simples; a nota no Google dita em texto; endereço com o mapa; o fim com o botão da aula experimental.',
    referencias: ['https://www.smartfit.com.br', 'https://www.bodytech.com.br', 'https://www.equinox.com', 'https://www.barrys.com'],
    palavras: ['academia', 'crossfit', 'funcional', 'escola de danca', 'danca', 'artes marciais', 'jiu jitsu',
      'muay thai', 'natacao', 'escola', 'curso', 'idiomas', 'reforco'],
    angulo: 'Quem pensa em se matricular quer ver modalidades, horários e a estrutura antes de ir. Um site '
      + 'com isso e um botão de WhatsApp para a aula experimental tira a dúvida e traz a pessoa.',
    demo: 'as modalidades e os horários',
  },
];

const PADRAO = {
  chave: 'geral',
  acao: 'Chamar no WhatsApp',
  secoes: 'o topo (como a direção manda); o que o negócio faz, numa lista clara (só o confirmado); fotos reais, se houver; a nota no Google dita em texto; endereço com o mapa do Google embutido e o horário numa tabela simples; o fim com o botão de chamar.',
  referencias: ['https://www.nubank.com.br', 'https://stripe.com', 'https://www.apple.com/br/'],
  angulo: 'Quem procura no Google acha primeiro quem tem uma página com o que faz, o endereço e um jeito '
    + 'fácil de chamar. Um site simples com isso e um botão de WhatsApp transforma quem pesquisou em '
    + 'conversa com vocês.',
  demo: 'o que vocês fazem e o botão de WhatsApp',
};

/** Os ramos que o painel mostra na lista de referências. */
export const RAMOS_COM_REFERENCIA = [...RAMOS.map((r) => ({ chave: r.chave, referencias: r.referencias })),
  { chave: PADRAO.chave, referencias: PADRAO.referencias }];

/** O ângulo deste ramo, ou o geral. */
/**
 * O que o caçador lê como "categoria" e não é categoria. No painel do Maps,
 * o seletor da categoria às vezes pega o botão "Ver mais" ou o "Fechado ·
 * Abre às 18:00", e o ramo do cliente virava "Ver mais" — no funil, na
 * mensagem e no pedido do estúdio.
 */
const NAO_E_CATEGORIA = /^(ver mais|ver menos|see more|see less|mais|more|menos|\+?\d.*|fechad[oa]\b.*|abert[oa]\b.*|abre\b.*|fecha\b.*|closed\b.*|open\b.*)$/i;
export function categoriaValida(tipo) {
  const v = String(tipo || '').trim();
  return v && !NAO_E_CATEGORIA.test(v) ? v : '';
}

// As palavras sem acento das listas, escritas de volta com acento.
const COM_ACENTO = { estetica: 'estética', salao: 'salão', japones: 'japonês', cafe: 'café', acai: 'açaí',
  depilacao: 'depilação', cilios: 'cílios', odontologia: 'odontologia', clinica: 'clínica' };

/** Sem categoria: o ramo tirado do nome ("Pizzaria Baggio" → "Pizzaria"). Vazio se o nome não diz. */
export function tipoPeloNome(nome) {
  for (const r of RAMOS) {
    const p = r.palavras.find((x) => casa(nome, [x]));
    if (p) {
      const t = COM_ACENTO[p] || p;
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
  }
  return '';
}

/** As palavras de ramo ("pizzaria", "estetica"...): não identificam um negócio, só o ramo. */
export const PALAVRAS_DE_RAMO = RAMOS.flatMap((r) => r.palavras);

/** O ramo de um cliente, consertado: categoria lida, ou o que o nome diz. */
export function tipoDoLead(lead) {
  return categoriaValida(lead?.tipo) || tipoPeloNome(lead?.nome);
}

export function ramoDe(tipo) {
  return RAMOS.find((r) => casa(tipo, r.palavras)) || PADRAO;
}

/**
 * As objeções que aparecem sempre, e o caminho HONESTO para cada uma.
 * Vão para o modelo como orientação, não como texto pronto.
 */
export const OBJECOES = `- "quem é?", "é golpe?", "como conseguiu meu número?": diga seu nome, que faz sites, \
que achou o negócio no Google Maps e o número estava na ficha pública de lá. Você não pede nada e \
não manda link antes de ele aceitar. A demonstração é grátis, ele só olha. Ofereça parar se ele preferir.
- "já tenho Instagram" / "já tenho Facebook": concorde que é bom para quem já segue. Quem procura no \
Google por um ramo na cidade não acha o perfil fácil; o site aparece, tem tudo num link só e leva para \
o Instagram e para o WhatsApp. Um não substitui o outro.
- "não preciso" / "já tenho bastante cliente": respeite. O site é para quem ainda não conhece achar e \
chamar sem precisar ligar. Ofereça só ver a demonstração, sem compromisso.
- "quanto custa?" antes de ver a demonstração: diga o valor com franqueza (fatos.oferta) e lembre que \
ele vê o site dele pronto, de graça, antes de decidir.
- "tá caro": não baixe o preço e não invente desconto. Diga em uma frase o que está incluído \
(fatos.inclui). Se houver uma opção mais barata em fatos.oferta, mostre. Pergunte se o que pesa é o valor \
para fazer ou a mensalidade.
- "vou pensar": respeite. Pergunte qual é a dúvida que falta (uma). Se a demonstração tiver data para \
sair do ar, diga a data real.
- "como funciona?" / "manda mais informações": em 2 ou 3 frases: você monta, ele vê e aprova, o site \
vai ao ar, e a mensalidade cobre o que está em fatos.inclui.
- "meu sobrinho/conhecido faz": tudo bem; ofereça só que ele veja a demonstração para comparar.
- "me liga" / "quero falar com alguém": pergunte o melhor horário. intencao = quer_ligacao.
- "não quero", "para de mandar", "não tenho interesse": agradeça e encerre na hora, sem oferecer mais nada.`;
