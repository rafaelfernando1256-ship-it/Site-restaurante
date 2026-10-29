/**
 * O QUE O VENDEDOR VENDE, E POR QUANTO.
 *
 * Duas decisões suas, que até agora estavam chumbadas no código:
 *
 * 1. COMO COBRAR
 *    · "mensal"            — o cliente paga só a mensalidade. Fazer o
 *                            site está incluído, não se cobra nada
 *                            para começar.
 *    · "setup_mais_mensal" — paga uma vez para fazer, e uma
 *                            mensalidade para manter no ar.
 *
 * 2. O QUE OFERECER
 *    Para a maioria dos negócios: o site completo.
 *    Para quem vende comida (restaurante, pizzaria, lanchonete…): o
 *    vendedor apresenta DUAS opções — o site completo com cardápio
 *    dentro, e o cardápio digital sozinho, mais barato. Quem decide é
 *    o dono do negócio, não o agente.
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE ISTO É UM ARQUIVO SEPARADO, COM VALIDADOR
 * ─────────────────────────────────────────────────────────────────
 * Preço é a única coisa na conversa que vira dinheiro na sua conta ou
 * processo no seu nome. Um modelo de linguagem inventa número com a
 * mesma naturalidade com que inventa elogio.
 *
 * Então aqui não basta mandar os valores no prompt: o que volta é
 * CONFERIDO. Valor em reais que não esteja configurado por você faz a
 * mensagem ser rejeitada e reescrita. O agente pode escolher as
 * palavras; os números são seus.
 */

export const COBRANCAS = ['mensal', 'setup_mais_mensal'];

/** Os ramos em que faz sentido oferecer cardápio digital. É só um
 *  padrão — a lista é editável no painel. */
export const NICHOS_DE_COMIDA = [
  'restaurante', 'pizzaria', 'pizza', 'lanchonete', 'lanches', 'hamburgueria',
  'burger', 'hamburger', 'açaí', 'acai', 'sorveteria', 'gelateria',
  'padaria', 'confeitaria', 'doceria', 'cafeteria', 'café', 'cafe',
  'pastelaria', 'esfiha', 'esfirra', 'sushi', 'japonês', 'japones',
  'churrascaria', 'espetinho', 'marmita', 'marmitex', 'comida caseira',
  'food truck', 'bar', 'boteco', 'petiscaria', 'pizzaiolo', 'delivery de comida',
  'self service', 'buffet', 'quentinha', 'tapiocaria', 'creperia', 'crepe',
];

const semAcento = (t) => String(t || '').normalize('NFD')
  .replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Este ramo vende comida?
 *
 * Compara sem acento e por PALAVRA INTEIRA. O "por pedaço" ingênuo
 * tinha um defeito caro: "bar" casava dentro de "barbearia", e toda
 * barbearia do funil ia receber oferta de cardápio digital.
 */
export function ehDeComida(tipo, lista = NICHOS_DE_COMIDA) {
  const alvo = semAcento(tipo);
  if (!alvo) return false;
  return lista.some((nicho) => {
    const n = semAcento(nicho);
    if (!n) return false;
    const escapado = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escapado}([^a-z0-9]|$)`).test(alvo);
  });
}

/** Texto do painel ("pizzaria, lanches") → lista. Vazio volta ao padrão. */
export function listaDeNichos(texto) {
  const partes = String(texto || '').split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);
  return partes.length ? partes : NICHOS_DE_COMIDA;
}

/** Só os dígitos de um valor: "R$ 1.350,00" → 135000 … não. Aqui o que
 *  interessa é o NÚMERO em reais: 1350. Centavos entram como parte. */
export function numerosDe(texto) {
  const achados = [];
  const bruto = String(texto || '');
  // "R$ 350", "350 reais", "R$ 1.299,90", "R$ 1500". O milhar com ponto
  // vem primeiro, e nenhum número pode parar no meio: antes "R$ 1500"
  // era lido como 150, e um "R$ 150" inventado passava.
  const valor = '(\\d{1,3}(?:\\.\\d{3})+(?:,\\d{1,2})?|\\d+(?:,\\d{1,2})?)(?![\\d.,]\\d)';
  const padrao = new RegExp(`r\\$\\s*${valor}|${valor}\\s*reais\\b`, 'gi');
  let achado = padrao.exec(bruto);
  while (achado) {
    const cru = (achado[1] || achado[2] || '').replace(/\./g, '').replace(',', '.');
    const n = Number(cru);
    if (Number.isFinite(n) && n > 0) achados.push(n);
    achado = padrao.exec(bruto);
  }
  return achados;
}

/**
 * Monta a oferta para ESTE cliente.
 *
 * Devolve o que o vendedor pode dizer — nada além disso.
 */
export function montaOferta(ajustes = {}, lead = {}) {
  const cobranca = COBRANCAS.includes(ajustes.cobranca) ? ajustes.cobranca : 'setup_mais_mensal';
  const nichos = listaDeNichos(ajustes.nichosComida);
  const comida = ehDeComida(lead?.tipo, nichos);

  // Com uma proposta aprovada pelo Offer Architect, é ela que vale para
  // este cliente: o pacote aprovado, pelo preço aprovado. O catálogo
  // pode mudar depois; o que foi aprovado para ele, não.
  const aprovada = lead?.oferta_aprovada;
  if (aprovada?.pacote) {
    const p = aprovada.pacote;
    const rs = (v) => (v === null || v === undefined || v === '' ? ''
      : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(Number(v)) ? 0 : 2, maximumFractionDigits: 2 })}`);
    const mensal = p.mensal !== null && p.mensal !== undefined ? `${rs(p.mensal)} por mês` : '';
    return {
      cobranca,
      explicacao: 'O que vale é a proposta aprovada para este cliente (pacote e preço do catálogo das ofertas).',
      de_comida: comida,
      apresentar_os_dois: false,
      proposta_aprovada: true,
      produtos: [{
        chave: aprovada.product_type === 'cardapio' ? 'cardapio' : 'site',
        nome: p.nome,
        descricao: (p.recursos || []).join(', '),
        para_fazer: p.implantacao ? rs(p.implantacao) : 'sem custo de implantação',
        mensalidade: mensal,
      }],
    };
  }

  const guardadas = ajustes.ofertas || {};
  const limpa = (valor) => String(valor || '').trim();

  const site = {
    chave: 'site',
    nome: 'Site completo',
    // Compatível com os ajustes antigos: quem já tinha preço e
    // mensalidade continua funcionando sem mexer em nada.
    setup: limpa(guardadas.site?.setup ?? ajustes.preco),
    mensal: limpa(guardadas.site?.mensal ?? ajustes.mensalidade),
    descricao: comida
      ? 'site completo com o cardápio dentro, fotos, contato e localização'
      : 'site completo com fotos, contato e localização',
  };
  const cardapio = {
    chave: 'cardapio',
    nome: 'Cardápio digital',
    setup: limpa(guardadas.cardapio?.setup),
    mensal: limpa(guardadas.cardapio?.mensal),
    descricao: 'só o cardápio, com link e QR Code para a mesa e para o WhatsApp',
  };

  const vale = (p) => (cobranca === 'mensal' ? Boolean(p.mensal) : Boolean(p.setup || p.mensal));

  const produtos = [];
  if (vale(site)) produtos.push(site);
  // O cardápio só é oferecido onde faz sentido E se você pôs preço.
  if (comida && vale(cardapio)) produtos.push(cardapio);

  return {
    cobranca,
    explicacao: cobranca === 'mensal'
      ? 'Não se cobra nada para fazer: o cliente paga só a mensalidade, e fazer o site está incluído.'
      : 'Cobra-se uma vez para fazer, mais uma mensalidade para manter no ar.',
    de_comida: comida,
    apresentar_os_dois: produtos.length > 1,
    produtos: produtos.map((p) => ({
      chave: p.chave,
      nome: p.nome,
      descricao: p.descricao,
      ...(cobranca === 'mensal'
        ? { mensalidade: p.mensal, para_fazer: 'incluído na mensalidade' }
        : { para_fazer: p.setup, mensalidade: p.mensal }),
    })),
  };
}

/** Todos os números que o vendedor TEM permissão de citar. */
export function valoresPermitidos(oferta = {}) {
  const todos = [];
  for (const produto of oferta.produtos || []) {
    todos.push(...numerosDe(produto.para_fazer), ...numerosDe(produto.mensalidade));
  }
  return [...new Set(todos)];
}

/**
 * Algum valor na mensagem que você não autorizou?
 *
 * Só olha números em reais ("R$ 90", "90 reais"). Número solto
 * ("abrimos às 9", "10 fotos") não é preço e não é acusado.
 */
export function problemasDeValor(mensagem, oferta = {}, extras = []) {
  const permitidos = [...valoresPermitidos(oferta), ...(extras || [])];
  const ditos = numerosDe(mensagem);
  const invadiu = ditos.filter((n) => !permitidos.includes(n));
  if (!invadiu.length) return [];
  return [`valor não configurado: R$ ${invadiu.join(', R$ ')}`];
}
