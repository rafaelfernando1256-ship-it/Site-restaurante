/**
 * VALUE INTELLIGENCE AGENT (value_intelligence) — o especialista em valor
 * do que a Matilha vende.
 *
 *   caçador → VALUE INTELLIGENCE → Offer Architect → vendedor → produção → entrega → cobrador
 *
 * Ele não repete característica: liga cada FUNCIONALIDADE à VANTAGEM, ao
 * BENEFÍCIO, ao VALOR PARA O CLIENTE e à EVIDÊNCIA que prova (Feature-
 * Advantage-Benefit, com a evidência no fim), e escolhe, para cada
 * restaurante, os três que mais importam para ELE, pelo que se sabe de
 * verdade sobre ele (Value Proposition Canvas e Jobs to Be Done: a tarefa
 * do dono, a dor, o ganho). O vendedor recebe um Value Brief curto: o
 * argumento principal, a pergunta consultiva (SPIN), a demonstração, as
 * respostas para as objeções e o que NÃO prometer.
 *
 * A BASE DE PRODUTOS É A VERDADE. Uma funcionalidade só vira benefício se
 * estiver marcada como entregue pela Matilha hoje ("implementada") ou
 * feita por nós a pedido ("por_nos"). O que não existe (painel para o dono
 * editar sozinho, pedido online, pagamento) aparece como LIMITAÇÃO, nunca
 * como argumento. Preço e taxa vêm do catálogo do Offer Architect: o que
 * não está cadastrado é marcado como "falta cadastrar", não inventado.
 *
 * Observação verificada (veio de um fato com fonte) e hipótese (dedução
 * nossa) andam separadas em tudo: na análise, no brief e na fala.
 */
import { createHash, randomBytes } from 'node:crypto';
import { readFile, rename, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { texto } from './comum.mjs';
import { ehDeComida, listaDeNichos } from '../oferta.mjs';
import { fatosDoLead, normalizaCatalogo, objecoesDe, problemasDeTexto, produtoPara, reais } from './ofertas.mjs';

export const NOME_INTERNO = 'value_intelligence';
export const NOME_NA_TELA = 'VALUE INTELLIGENCE — Especialista em Valor';
export const SETOR = 'valor';
export const TAREFAS = {
  produto: 'value.analyze_product', lead: 'value.analyze_lead', brief: 'value.generate_brief', atualiza: 'value.refresh_brief', assistencia: 'value.assist',
};
export const EVENTOS = ['value.analysis.requested', 'value.analysis.started', 'value.analysis.completed', 'value.brief.created', 'value.brief.updated',
  'value.brief.approved', 'value.brief.sent_to_sales', 'value.analysis.failed'];
export const PESOS = { relevancia: 30, intensidade: 25, evidencia: 20, diferenciacao: 15, clareza: 10 };
export const NOMES_DOS_CRITERIOS = { relevancia: 'Relevância para o cliente', intensidade: 'Intensidade do problema', evidencia: 'Evidência disponível',
  diferenciacao: 'Diferenciação real', clareza: 'Clareza de comunicação' };
const agora = () => Date.now();
const LIMITE_MS = 30_000;

/* ══ AS EVIDÊNCIAS: o que dá para mostrar, e onde ═════════════════ */
export const EVIDENCIAS = {
  ev_demo: { tipo: 'demonstração', descricao: 'A demonstração com o nome, as fotos e o cardápio do restaurante, montada antes de qualquer pagamento', onde: 'o link da prévia (Clientes › ficha › site)' },
  ev_celular: { tipo: 'teste', descricao: 'O estúdio confere o site num print de celular (390 px de largura) antes de entregar', onde: 'a revisão visual do estúdio' },
  ev_qr: { tipo: 'demonstração', descricao: 'A placa com o QR Code do cardápio, pronta para imprimir, gerada para cada cliente com o cardápio no ar', onde: 'Clientes › ficha › QR Code (/api/fluxo/qr)' },
  ev_relatorio: { tipo: 'dado', descricao: 'O relatório do mês com os cliques reais no botão do WhatsApp (contador do site)', onde: 'o relatório mensal que o cobrador manda' },
  ev_dominio: { tipo: 'processo', descricao: 'O agente do domínio procura nomes .com.br livres e liga o escolhido ao site', onde: 'o agente do domínio' },
  ev_atualiza: { tipo: 'processo', descricao: 'O dono manda a foto ou a mensagem com o preço novo pelo WhatsApp; a Matilha atualiza o cardápio depois que você confere', onde: 'o cardápio pelo WhatsApp (Hoje › conferir cardápio)' },
  ev_alteracao: { tipo: 'processo', descricao: 'Pedido de mudança no site pelo WhatsApp vira alteração feita pelo estúdio', onde: 'o pós-venda (alterações)' },
};

/* ══ A BASE DE PRODUTOS ════════════════════════════════════════════
   estado: 'implementada' (a Matilha entrega hoje), 'por_nos' (feito por
   nós, a pedido, não é automático) ou 'nao_implementada' (não existe:
   vira limitação). `necessidades` diz para que dor do dono ela serve. */
const F = (id, nome, estado, vantagem, beneficio, valor, evidencia, necessidades, { diferenciacao = 0.4, clareza = 0.8, condicao = '', so_comida = false } = {}) =>
  ({ id, nome, estado, vantagem, beneficio, valor, evidencia, necessidades, diferenciacao, clareza, condicao, so_comida });

const FUNC_SITE = [
  F('responsivo', 'Site que se adapta ao celular', 'implementada', 'a página se ajusta a qualquer tamanho de tela',
    'quem procura no celular lê tudo sem dar zoom', 'uma apresentação do restaurante fácil de ver no aparelho que os clientes usam', 'ev_celular', ['leitura_celular', 'presenca_propria'], { diferenciacao: 0.3 }),
  F('demo_antes', 'Demonstração pronta antes de pagar', 'implementada', 'o dono vê o site do próprio restaurante antes de decidir',
    'decide vendo o resultado, não uma promessa', 'menos risco na decisão de contratar', 'ev_demo', ['confianca', 'risco'], { diferenciacao: 0.9, clareza: 1 }),
  F('botao_whatsapp', 'Botão do WhatsApp fixo na tela', 'implementada', 'um toque abre a conversa com o restaurante',
    'quem está vendo o site chama na hora, sem copiar número', 'o caminho do interesse até a conversa fica mais curto', 'ev_demo', ['contato_rapido'], { diferenciacao: 0.4, clareza: 1 }),
  F('mapa_horario', 'Mapa e horário de funcionamento', 'implementada', 'endereço com mapa e horário num lugar só',
    'quem quer ir encontra o caminho e sabe se está aberto', 'menos pergunta repetida de "onde fica" e "que horas abre"', 'ev_demo', ['ser_encontrado', 'informacao_espalhada'], { diferenciacao: 0.3, condicao: 'precisa do endereço e do horário cadastrados' }),
  F('fotos', 'Fotos do próprio restaurante', 'implementada', 'usa as fotos públicas da ficha do Google Maps',
    'o site mostra o lugar e os pratos de verdade', 'a apresentação parece com o restaurante, não com um modelo pronto', 'ev_demo', ['presenca_propria', 'confianca'], { diferenciacao: 0.5, condicao: 'precisa ter fotos na ficha do Maps' }),
  F('cardapio_no_site', 'Cardápio dentro do site, por categoria', 'implementada', 'o cardápio vira texto organizado por categoria dentro do site',
    'o cliente acha o prato e o preço sem baixar arquivo', 'consultar o cardápio fica mais simples no celular', 'ev_demo', ['leitura_celular', 'cardapio_organizado'], { diferenciacao: 0.6, so_comida: true }),
  F('instagram', 'Link para o Instagram', 'implementada', 'o site leva ao Instagram e o Instagram leva ao site',
    'quem chega por um canal acha o outro', 'informação reunida num link só', 'ev_demo', ['informacao_espalhada'], { diferenciacao: 0.2, condicao: 'precisa do Instagram cadastrado' }),
  F('dominio', 'Endereço .com.br próprio', 'implementada', 'um endereço com o nome do restaurante',
    'um link fácil de passar e de lembrar', 'presença própria, que não depende de rede social', 'ev_dominio', ['presenca_propria', 'ser_encontrado'], { diferenciacao: 0.5, condicao: 'o registro do .com.br é pago à parte (Registro.br)' }),
  F('relatorio', 'Relatório do mês com os cliques', 'implementada', 'conta os cliques no botão do WhatsApp',
    'o dono vê quantas pessoas chamaram pelo site', 'decide com número real, não com impressão', 'ev_relatorio', ['acompanhar_resultado'], { diferenciacao: 0.7 }),
  F('alteracoes', 'Alterações pelo WhatsApp', 'por_nos', 'o dono pede a mudança por mensagem e o estúdio faz',
    'não precisa aprender a mexer em site', 'menos trabalho para manter o site certo', 'ev_alteracao', ['atualizar_precos', 'sem_trabalho'], { diferenciacao: 0.6, condicao: 'feito por nós, não é instantâneo' }),
  F('painel_dono', 'Painel para o dono editar sozinho', 'nao_implementada', '', '', '', null, ['atualizar_precos']),
  F('pedido_online', 'Pedido e pagamento online', 'nao_implementada', '', '', '', null, ['vender_online']),
  F('reservas', 'Reserva de mesa online', 'nao_implementada', '', '', '', null, ['reservas']),
];
const FUNC_CARDAPIO = [
  F('categorias', 'Cardápio por categorias', 'implementada', 'os pratos ficam separados por categoria, com uma barra para pular entre elas',
    'quem está no celular acha o sabor, a descrição e o preço sem dar zoom', 'consultar o cardápio fica mais fácil', 'ev_demo', ['leitura_celular', 'cardapio_organizado'], { diferenciacao: 0.6, clareza: 1 }),
  F('responsivo', 'Feito para a tela do celular', 'implementada', 'a página é pensada para ser lida com uma mão',
    'abre leve e legível no celular, no balcão ou na mesa', 'menos atrito para ver o que tem', 'ev_celular', ['leitura_celular'], { diferenciacao: 0.4 }),
  F('qr_code', 'QR Code para as mesas', 'implementada', 'a placa com o QR Code sai pronta para imprimir',
    'o cliente na mesa abre o cardápio apontando a câmera', 'acesso mais simples ao cardápio dentro do restaurante', 'ev_qr', ['cardapio_na_mesa', 'leitura_celular'], { diferenciacao: 0.4, clareza: 1, condicao: 'a placa sai quando o cardápio está no ar' }),
  F('link', 'Link para compartilhar', 'implementada', 'um endereço só para o cardápio',
    'o mesmo link serve no WhatsApp, no Instagram e no Google', 'um cardápio só, em todo canal', 'ev_demo', ['informacao_espalhada'], { diferenciacao: 0.3 }),
  F('atualizacao', 'Preço atualizado pelo WhatsApp (feito por nós)', 'por_nos', 'o dono manda a foto ou a mensagem com o preço novo, e a gente atualiza',
    'não precisa refazer o PDF nem a arte a cada mudança de preço', 'o cardápio fica com o preço certo sem trabalho de edição para o dono', 'ev_atualiza', ['atualizar_precos', 'sem_trabalho'], { diferenciacao: 0.7, condicao: 'quem atualiza somos nós, depois de você conferir; não é instantâneo' }),
  F('demo_antes', 'Demonstração pronta antes de pagar', 'implementada', 'o dono vê o cardápio dele pronto antes de decidir',
    'decide vendo o resultado', 'menos risco na decisão', 'ev_demo', ['confianca', 'risco'], { diferenciacao: 0.9, clareza: 1 }),
  F('botao_whatsapp', 'Botão do WhatsApp', 'implementada', 'um toque abre a conversa para pedir',
    'quem viu o prato chama na hora', 'o caminho do cardápio até o pedido fica mais curto', 'ev_demo', ['contato_rapido'], { diferenciacao: 0.4, condicao: 'no Cardápio Profissional' }),
  F('painel_dono', 'Painel para o dono editar sozinho', 'nao_implementada', '', '', '', null, ['atualizar_precos']),
  F('pedido_online', 'Pedido e pagamento pelo cardápio', 'nao_implementada', '', '', '', null, ['vender_online']),
];

export const NECESSIDADES = {
  leitura_celular: 'ler o cardápio e as informações no celular sem esforço',
  cardapio_organizado: 'ter o cardápio organizado (categorias, descrição, preço)',
  atualizar_precos: 'manter os preços certos sem refazer arquivo',
  ser_encontrado: 'ser encontrado por quem procura no Google',
  presenca_propria: 'ter uma presença própria, que não depende só de rede social',
  contato_rapido: 'facilitar o contato pelo WhatsApp',
  informacao_espalhada: 'reunir num link só o que hoje está espalhado',
  confianca: 'passar confiança para quem ainda não conhece',
  cardapio_na_mesa: 'facilitar o acesso ao cardápio na mesa',
  acompanhar_resultado: 'saber se o canal digital está trazendo contato',
  risco: 'decidir sem risco',
  sem_trabalho: 'não ganhar mais trabalho para manter',
};

/** A base padrão, ligada ao catálogo do Offer Architect (preço, taxa, garantia). */
export function baseDosProdutos(catalogo = null, ajustes = {}) {
  const pacotes = (tipo) => (catalogo?.produtos?.[tipo]?.pacotes || []).map((p) => ({
    chave: p.chave, nome: p.nome, mensalidade: p.mensal !== null && p.mensal !== undefined ? reais(p.mensal) : null,
    implantacao: p.implantacao ? reais(p.implantacao) : (p.implantacao === 0 ? 'sem custo de implantação' : null), aprovado: Boolean(p.aprovado),
  }));
  const comuns = {
    custos_adicionais: catalogo?.taxas ? [catalogo.taxas] : [],
    condicoes_comerciais: [texto(ajustes.pagamento, 300), ajustes.cobranca === 'mensal' ? 'só mensalidade (fazer está incluído)' : 'para fazer + mensalidade'].filter(Boolean),
    garantias_autorizadas: catalogo?.garantia ? [catalogo.garantia] : [],
    restricoes_de_comunicacao: [
      'não prometer aumento de vendas, de pedidos ou de faturamento (não há dado que sustente)',
      'não dizer que o dono edita sozinho: não existe painel para isso; o preço novo ele manda pelo WhatsApp',
      'não citar pedido online, pagamento online nem reserva: não existem',
      'não inventar depoimento, número de clientes nem comparação com concorrente',
      'separar o que foi verificado (fato com fonte) do que é hipótese (pergunte antes de afirmar)',
    ],
  };
  return {
    site: {
      id: 'site', nome: 'Site completo para restaurantes',
      descricao: 'Um site de uma página com a cara do restaurante: fotos, cardápio (para quem vende comida), botão do WhatsApp, mapa, horário e endereço próprio.',
      funcionalidades: FUNC_SITE,
      diferenciais: ['a demonstração do site dele fica pronta antes de qualquer pagamento', 'feito com as fotos e o cardápio do próprio restaurante', 'mudança pedida pelo WhatsApp, sem ele precisar mexer em nada', 'relatório do mês com os cliques reais'],
      preco: pacotes('site'),
      publico_alvo: 'restaurantes e negócios locais sem site próprio, ou com site difícil de ler no celular',
      casos_de_uso: ['quem procura o restaurante no Google cai num site com tudo', 'o mesmo link vai no Instagram e no WhatsApp', 'o dono acompanha quantos chamaram pelo site'],
      ...comuns,
    },
    cardapio: {
      id: 'cardapio', nome: 'Cardápio digital por assinatura',
      descricao: 'O cardápio do restaurante numa página feita para o celular, por categorias, com QR Code para as mesas e link para compartilhar.',
      funcionalidades: FUNC_CARDAPIO,
      diferenciais: ['a demonstração com o cardápio dele fica pronta antes de pagar', 'o preço novo ele manda pelo WhatsApp e a gente atualiza: não precisa refazer PDF', 'a placa do QR Code sai pronta para imprimir'],
      preco: pacotes('cardapio'),
      publico_alvo: 'restaurantes com cardápio em PDF, em foto ou só no balcão',
      casos_de_uso: ['o cliente na mesa abre pelo QR Code', 'o link vai na bio do Instagram e no WhatsApp', 'mudou o preço: manda a foto e o cardápio é atualizado'],
      ...comuns,
    },
  };
}

/** A versão de um produto: um número que só sobe quando o conteúdo (funcionalidade, preço, condição) muda. */
export const impressao = (produto) => createHash('sha256').update(JSON.stringify({ ...produto, versao: undefined })).digest('hex').slice(0, 16);

/* ══ O CONTEXTO DO RESTAURANTE: fatos verificados × hipóteses ═══════ */
export function necessidadesDo(lead = {}, ajustes = {}) {
  const fatos = fatosDoLead(lead);
  const tem = (id) => fatos.find((f) => f.id === id);
  const comida = ehDeComida(lead.tipo, listaDeNichos(ajustes.nichosComida));
  const lista = [];
  const poe = (chave, tipo, intensidade, evidencias, observacao) => {
    if (lista.some((n) => n.chave === chave && n.tipo === 'verificada')) return;
    lista.push({ chave, descricao: NECESSIDADES[chave], tipo, intensidade, evidencias, observacao });
  };
  const cardapio = tem('cardapio')?.texto || '';
  if (/PDF/.test(cardapio)) {
    poe('leitura_celular', 'verificada', 0.85, ['cardapio'], 'O cardápio atual é um PDF: no celular, exige baixar e dar zoom para ler.');
    poe('cardapio_organizado', 'verificada', 0.6, ['cardapio'], 'Em PDF, não há como pular direto para uma categoria.');
    poe('atualizar_precos', 'hipotese', 0.6, ['cardapio'], 'Hipótese: mudar um preço num PDF costuma exigir refazer e reenviar o arquivo. Pergunte como fazem hoje.');
  } else if (/só em fotos/.test(cardapio)) {
    poe('leitura_celular', 'verificada', 0.75, ['cardapio'], 'O cardápio aparece só em fotos: no celular, é preciso ampliar a imagem.');
    poe('atualizar_precos', 'hipotese', 0.55, ['cardapio'], 'Hipótese: foto de cardápio fica velha quando o preço muda. Pergunte como atualizam.');
  } else if (comida && !lead.site_proprio) {
    poe('cardapio_organizado', 'hipotese', 0.5, [], 'Hipótese: sem site, o cardápio deve estar só no balcão, no Instagram ou no iFood. Pergunte onde o cliente vê o cardápio.');
  }
  if (/Não encontrei site/.test(tem('site')?.texto || '')) {
    poe('ser_encontrado', 'verificada', 0.7, ['site'], 'Não encontrei site próprio na ficha do Google Maps.');
    poe('presenca_propria', 'verificada', 0.55, ['site'], 'Sem site, o que aparece dele depende do Google e das redes.');
  }
  if (tem('whatsapp')) poe('contato_rapido', 'verificada', 0.45, ['whatsapp'], 'Ele atende pelo WhatsApp.');
  if (tem('instagram') && !lead.site_proprio) poe('informacao_espalhada', 'hipotese', 0.4, ['instagram', 'site'], 'Hipótese: as informações ficam divididas entre Instagram e Google.');
  if (tem('nota')) poe('confianca', 'verificada', 0.35, ['nota'], `${tem('nota').texto}: um ativo para mostrar a quem não conhece.`);
  if (comida) poe('cardapio_na_mesa', 'hipotese', 0.35, [], 'Hipótese: se atendem no salão, o cliente na mesa pode abrir o cardápio pelo QR Code.');
  for (const f of fatos.filter((x) => x.id.startsWith('verificado_'))) {
    if (/pdf|zoom|celular/i.test(f.texto)) poe('leitura_celular', 'verificada', 0.8, [f.id], f.texto);
  }
  // O que o dono já disse conta mais que tudo: a objeção dele é a necessidade dele.
  const doDono = (lead.conversa || []).filter((m) => m?.quem === 'dono').map((m) => m.texto).join(' ');
  if (/\bpre[çc]o|atualiz|mud(a|ou) o pre/i.test(doDono)) poe('atualizar_precos', 'verificada', 0.8, ['historico'], 'Ele falou de preço/atualização na conversa.');
  return { fatos, necessidades: lista, comida };
}

/* ══ A PONTUAÇÃO (0 a 100) ══════════════════════════════════════════
   Heurística de prioridade, não previsão de venda. Sem evidência, a
   confiança cai; sem necessidade do cliente, o benefício vira secundário. */
export const classe = (n) => (n >= 85 ? 'prioritario' : n >= 70 ? 'relevante' : n >= 50 ? 'complementar' : 'secundario');
export const NOMES_DAS_CLASSES = { prioritario: 'prioritário', relevante: 'relevante', complementar: 'complementar', secundario: 'secundário ou pouco fundamentado' };

export function pontuaBeneficio(f, { necessidades = [], lead = {}, generico = false }) {
  const casa = necessidades.filter((n) => f.necessidades.includes(n.chave));
  const melhor = casa.sort((a, b) => (b.tipo === 'verificada') - (a.tipo === 'verificada') || b.intensidade - a.intensidade)[0];
  const relevancia = generico ? 0.6 : melhor ? (melhor.tipo === 'verificada' ? 1 : 0.55) : 0.2;
  const intensidade = generico ? 0.5 : melhor ? melhor.intensidade : 0;
  const evidencia = !f.evidencia ? 0 : f.estado === 'implementada' ? (f.condicao ? 0.8 : 1) : 0.6;
  let diferenciacao = f.diferenciacao;
  // Ele já tem o equivalente? A diferença cai: não se vende o que ele já tem.
  if (lead.site_proprio && ['responsivo', 'dominio', 'mapa_horario'].includes(f.id)) diferenciacao *= 0.3;
  if (lead.cardapio_atual?.formato === 'link' && ['categorias', 'link', 'responsivo'].includes(f.id)) diferenciacao *= 0.3;
  const s = { relevancia, intensidade, evidencia, diferenciacao, clareza: f.clareza };
  const score = Math.round(Object.entries(PESOS).reduce((a, [k, p]) => a + p * Math.min(1, s[k] || 0), 0));
  const confianca = evidencia >= 0.8 && melhor?.tipo === 'verificada' ? 'alta' : evidencia >= 0.6 && (melhor || generico) ? 'media' : 'baixa';
  return { score, criterios: Object.fromEntries(Object.keys(PESOS).map((k) => [k, Math.round(Math.min(1, s[k] || 0) * 100)])), classe: classe(score),
    confidence_level: confianca, necessidade: melhor || null };
}

/** Funcionalidade → vantagem → benefício → valor → evidência, só para o que existe. */
export function cadeia(f) {
  return { feature: f.nome, feature_id: f.id, advantage: f.vantagem, benefit: f.beneficio, customer_value: f.valor,
    evidence_reference: f.evidencia, evidencia: f.evidencia ? EVIDENCIAS[f.evidencia] : null, estado: f.estado, condicao: f.condicao || null };
}

/* ══ A ASSISTÊNCIA AO VENDEDOR (no meio da negociação) ═════════════ */
const PERGUNTAS = [
  ['instagram', /\binstagram\b|\bjá tenho (rede|insta)|\bredes? sociais?\b/i],
  ['ja_usa_cardapio', /\bj[áa] (uso|tenho|temos|usamos)\b.*\b(card[áa]pio|ifood|goomer|anota|aiq)\b|\b(card[áa]pio digital|ifood|goomer)\b.*\bj[áa]\b/i],
  ['ja_tem_site', /\bj[áa] (tenho|temos) (um )?site\b/i],
  ['aumenta_vendas', /\b(aument|vend[ae]r? mais|mais vendas|mais pedidos|vale a pena|d[áa] retorno|traz cliente)\w*/i],
  ['concorrente', /\bconcorr|\bmais barat|\bpor menos\b|\boutro (cara|lugar|sistema) (cobra|faz)/i],
  ['preco', /\bcar[oa]\b|\bpre[çc]o\b|\bvalor\b|\bmensalidade\b|\bR\$|\bcaro\b/i],
];
export function categoriaDaPergunta(t) {
  return PERGUNTAS.find(([, re]) => re.test(String(t || '')))?.[0] || (objecoesDe(t)[0] === 'status_quo' ? 'instagram' : null);
}

export class ValueIntelligence {
  /**
   * @param {object} o
   * @param {string} o.arquivo        dados/valor.json
   * @param {Function} o.catalogo     () => o catálogo do Offer Architect (preço, taxa, garantia)
   */
  constructor({ arquivo, catalogo = () => null, diz = () => {} }) {
    this.arquivo = arquivo;
    this.catalogo = catalogo;
    this.diz = diz;
    this.mem = { ajustesDaBase: {}, versoes: {}, briefs: [], analises: [], eventos: [], assistencias: [], ligado: true };
    this.fila = Promise.resolve();
  }

  async carrega() {
    try {
      const l = JSON.parse(await readFile(this.arquivo, 'utf8'));
      this.mem = { ...this.mem, ...l };
    } catch { /* primeira vez */ }
    // Análise que estava rodando quando a Matilha caiu fica marcada; o mural refaz a tarefa.
    for (const b of this.mem.briefs) if (b.estado === 'gerando') { b.estado = 'falhou'; b.erro = 'a Matilha fechou no meio'; }
    await this._grava();
    return this;
  }

  _grava() {
    const corpo = JSON.stringify({ ...this.mem, briefs: this.mem.briefs.slice(-400), analises: this.mem.analises.slice(-200),
      eventos: this.mem.eventos.slice(-800), assistencias: this.mem.assistencias.slice(-300) });
    this.fila = this.fila.then(async () => {
      await mkdir(dirname(this.arquivo), { recursive: true });
      const tmp = `${this.arquivo}.escrevendo`;
      await writeFile(tmp, corpo, 'utf8');
      await rename(tmp, this.arquivo);
    }).catch((e) => this.diz(`  ⚠ não consegui gravar o Value Intelligence: ${e.message}`));
    return this.fila;
  }

  ligado() { return this.mem.ligado !== false; }
  async liga(sim) { this.mem.ligado = Boolean(sim); await this._grava(); return this.mem.ligado; }

  /** Um evento no registro (com o correlation id), para a Rede de agentes e o histórico. */
  evento(tipo, { tipo: _ignorado, ...dados } = {}) {
    if (!EVENTOS.includes(tipo)) throw new Error(`evento desconhecido: ${tipo}`);
    const e = { id: `ev${agora().toString(36)}${randomBytes(2).toString('hex')}`, tipo, quando: agora(), ...dados };
    this.mem.eventos.push(e);
    return e;
  }

  /* ── a base de produtos, com versão ─────────────────────────── */
  produtos(ajustes = {}) {
    const base = baseDosProdutos(this.catalogo(), ajustes);
    for (const [id, p] of Object.entries(base)) {
      // O que você marcou na tela (ex.: "essa funcionalidade não está pronta") vale por cima do padrão.
      const meus = this.mem.ajustesDaBase[id]?.funcionalidades || {};
      p.funcionalidades = p.funcionalidades.map((f) => (meus[f.id] ? { ...f, estado: meus[f.id] } : f));
      const imp = impressao(p);
      const v = this.mem.versoes[id] || { n: 0, impressao: '' };
      if (v.impressao !== imp) { v.n += 1; v.impressao = imp; v.quando = agora(); this.mem.versoes[id] = v; this._mudouProduto = true; }
      p.versao = v.n;
      p.impressao = imp;
    }
    return base;
  }

  /** Muda o estado de uma funcionalidade (implementada / por_nos / nao_implementada): a versão do produto sobe. */
  async marcaFuncionalidade(produtoId, funcId, estado, ajustes = {}) {
    if (!['implementada', 'por_nos', 'nao_implementada'].includes(estado)) throw new Error('estado inválido');
    const p = this.produtos(ajustes)[produtoId];
    if (!p) throw new Error(`produto desconhecido: ${produtoId}`);
    if (!p.funcionalidades.some((f) => f.id === funcId)) throw new Error(`funcionalidade desconhecida: ${funcId}`);
    const f = p.funcionalidades.find((x) => x.id === funcId);
    if (estado !== 'nao_implementada' && !f.evidencia) throw new Error('essa funcionalidade não tem evidência cadastrada: não dá para marcar como entregue');
    (this.mem.ajustesDaBase[produtoId] ||= { funcionalidades: {} }).funcionalidades[funcId] = estado;
    const novo = this.produtos(ajustes)[produtoId];
    await this._grava();
    return { versao: novo.versao, desatualizados: this.desatualizados(ajustes).map((b) => b.brief_id) };
  }

  /** Os briefs feitos com uma versão antiga do produto: precisam ser refeitos. */
  desatualizados(ajustes = {}) {
    const ps = this.produtos(ajustes);
    return this.mem.briefs.filter((b) => ['gerado', 'aprovado'].includes(b.estado) && ps[b.product_id] && b.product_version !== ps[b.product_id].versao);
  }

  /* ── análise de produto (sem cliente) ───────────────────────── */
  analisaProduto(produtoId, ajustes = {}) {
    const p = this.produtos(ajustes)[produtoId];
    if (!p) throw new Error(`produto desconhecido: ${produtoId}`);
    const existentes = p.funcionalidades.filter((f) => f.estado !== 'nao_implementada');
    const mapa = existentes.map((f) => ({ ...cadeia(f), ...pontuaBeneficio(f, { generico: true }) })).sort((a, b) => b.score - a.score);
    const faltaPreco = !p.preco.some((x) => (x.mensalidade || x.implantacao) && x.aprovado);
    return {
      product_id: p.id, product_version: p.versao, nome: p.nome, descricao: p.descricao,
      mapa_de_valor: mapa,
      principais: mapa.slice(0, 3),
      diferenciais: p.diferenciais,
      limitacoes: [...p.funcionalidades.filter((f) => f.estado === 'nao_implementada').map((f) => `não tem: ${f.nome.toLowerCase()}`),
        ...existentes.filter((f) => f.condicao).map((f) => `${f.nome}: ${f.condicao}`)],
      nao_verificado: faltaPreco ? ['preço: nenhum pacote com preço aprovado em Ofertas › Pacotes e preços'] : [],
      preco: p.preco, custos_adicionais: p.custos_adicionais, condicoes_comerciais: p.condicoes_comerciais,
      garantias_autorizadas: p.garantias_autorizadas, restricoes_de_comunicacao: p.restricoes_de_comunicacao,
      publico_alvo: p.publico_alvo, casos_de_uso: p.casos_de_uso,
    };
  }

  /** Site completo × cardápio: o que cada um entrega, lado a lado, sem inventar vencedor. */
  compara(ajustes = {}, lead = null) {
    const ps = ['site', 'cardapio'].map((id) => (lead ? this.analisaLead(lead, id, ajustes) : this.analisaProduto(id, ajustes)));
    const nomes = (a) => new Set(a.mapa_de_valor.map((x) => x.feature_id));
    const [s, c] = ps.map(nomes);
    return {
      produtos: ps.map((a) => ({ product_id: a.product_id, nome: a.nome, principais: a.principais.map((x) => ({ benefit: x.benefit, score: x.score, classe: x.classe })), preco: a.preco, limitacoes: a.limitacoes })),
      so_no_site: [...s].filter((x) => !c.has(x)).map((id) => ps[0].mapa_de_valor.find((x) => x.feature_id === id).feature),
      so_no_cardapio: [...c].filter((x) => !s.has(x)).map((id) => ps[1].mapa_de_valor.find((x) => x.feature_id === id).feature),
      nos_dois: [...s].filter((x) => c.has(x)).map((id) => ps[0].mapa_de_valor.find((x) => x.feature_id === id).feature),
      leitura: lead
        ? (ps[0].confidence_score >= ps[1].confidence_score ? `Para ${lead.nome}, o site completo tem mais benefícios ligados ao que se sabe dele.` : `Para ${lead.nome}, o cardápio digital tem mais benefícios ligados ao que se sabe dele.`)
        : 'O site completo cobre presença e contato (ser encontrado, mapa, domínio, relatório); o cardápio cobre a consulta do cardápio (categorias, QR Code). Quem decide é a necessidade do restaurante.',
    };
  }

  /* ── análise de um restaurante ──────────────────────────────── */
  analisaLead(lead, produtoId = '', ajustes = {}) {
    if (!lead?.id) throw new Error('sem restaurante para analisar');
    const id = produtoId || produtoPara(lead, this.catalogo() || normalizaCatalogo({}, ajustes), ajustes);
    const p = this.produtos(ajustes)[id];
    if (!p) throw new Error(`produto desconhecido: ${id}`);
    const { fatos, necessidades, comida } = necessidadesDo(lead, ajustes);
    const existentes = p.funcionalidades.filter((f) => f.estado !== 'nao_implementada' && (!f.so_comida || comida));
    const mapa = existentes.map((f) => ({ ...cadeia(f), ...pontuaBeneficio(f, { necessidades, lead }) })).sort((a, b) => b.score - a.score);
    // Os três que mais importam: o vendedor não precisa de dez.
    const principais = mapa.slice(0, 3);
    const quePede = necessidades.filter((n) => p.funcionalidades.some((f) => f.estado === 'nao_implementada' && f.necessidades.includes(n.chave)));
    const limitacoes = [
      ...p.funcionalidades.filter((f) => f.estado === 'nao_implementada').map((f) => `não temos ${f.nome.toLowerCase()}: não ofereça`),
      ...principais.filter((f) => f.condicao).map((f) => `${f.feature}: ${f.condicao}`),
      'não prometer aumento de vendas, pedidos ou faturamento: não há dado que sustente',
      ...(quePede.length ? [`ele pode precisar de "${quePede[0].descricao}", e a parte de editar sozinho/pedir online nós não temos`] : []),
    ];
    const nao_verificado = [];
    if (!p.preco.some((x) => (x.mensalidade || x.implantacao) && x.aprovado)) nao_verificado.push('preço do produto não aprovado: cadastre e aprove em Ofertas › Pacotes e preços antes de falar de valor');
    if (!necessidades.some((n) => n.tipo === 'verificada')) nao_verificado.push('nenhuma necessidade verificada: os argumentos são genéricos; faça as perguntas antes');
    const verificadas = principais.filter((b) => b.necessidade?.tipo === 'verificada').length;
    const confidence_score = Math.round(principais.reduce((a, b) => a + b.score, 0) / Math.max(1, principais.length) * (0.6 + 0.4 * verificadas / Math.max(1, principais.length)));
    return {
      lead_id: lead.id, restaurant_name: texto(lead.nome, 140), product_id: p.id, product_version: p.versao, nome: p.nome,
      verified_context: fatos, identified_needs: necessidades.map((n) => ({ ...n })),
      mapa_de_valor: mapa, principais, limitacoes, nao_verificado, confidence_score,
      diferenciais: p.diferenciais, preco: p.preco, custos_adicionais: p.custos_adicionais,
      restricoes_de_comunicacao: p.restricoes_de_comunicacao,
    };
  }

  /* ── as frases para o vendedor, a partir do que é verdade ─────── */
  _argumentos(a, lead) {
    const top = a.principais;
    const fato = (chave) => a.identified_needs.find((n) => n.chave === chave && n.tipo === 'verificada');
    // Só o primeiro argumento abre com o fato ("Vi que…"); repetir em todos soa a roteiro.
    const frase = (b, i) => {
      const n = b.necessidade;
      const abre = i === 0 && n?.tipo === 'verificada' ? (fato('leitura_celular') && n.chave === 'leitura_celular'
        ? `Vi que vocês já disponibilizam o cardápio ${/PDF/.test(n.observacao) ? 'em PDF' : 'em fotos'}.`
        : n.chave === 'ser_encontrado' ? `Procurei ${lead.nome} no Google e não encontrei um site de vocês.` : '') : '';
      return `${abre} ${b.benefit[0].toUpperCase()}${b.benefit.slice(1)}: ${b.customer_value}.`.trim();
    };
    const sales_arguments = top.map((b, i) => ({ beneficio: b.benefit, argumento: frase(b, i), base: b.necessidade ? `${b.necessidade.tipo}: ${b.necessidade.observacao}` : 'benefício geral do produto', evidencia: b.evidence_reference }));
    // As perguntas consultivas (SPIN): situação, problema, implicação, necessidade de solução.
    const n1 = top[0]?.necessidade;
    const suggested_questions = [
      fato('leitura_celular') || a.identified_needs.some((n) => n.chave === 'atualizar_precos')
        ? { tipo: 'situação', pergunta: 'Hoje, quando vocês precisam alterar o preço de um item, como fazem essa atualização?' }
        : { tipo: 'situação', pergunta: 'Hoje, quem quer ver o cardápio ou falar com vocês encontra onde?' },
      { tipo: 'problema', pergunta: n1?.chave === 'leitura_celular' ? 'O pessoal costuma reclamar de ler o cardápio no celular, ou pedir por mensagem o que tem?' : 'O que mais toma tempo no atendimento pelo WhatsApp hoje?' },
      { tipo: 'implicação', pergunta: 'Quando o preço muda e o cardápio publicado fica antigo, o que acontece no atendimento?' },
      { tipo: 'necessidade', pergunta: `Se ${a.product_id === 'cardapio' ? 'o cardápio' : 'o site'} já estivesse pronto com os dados de vocês, ajudaria ver como fica antes de decidir?` },
    ];
    const demonstration_suggestions = [...new Set(top.map((b) => b.evidence_reference).filter(Boolean))].map((ev) => ({
      evidencia: ev, como: ev === 'ev_demo' ? 'mandar o link da demonstração e pedir para ele abrir no celular dele'
        : ev === 'ev_qr' ? 'mostrar a placa do QR Code e abrir o cardápio apontando a câmera'
          : ev === 'ev_celular' ? (fato('leitura_celular') ? 'comparar no celular: o cardápio atual (PDF/foto) × a demonstração por categorias' : 'abrir a demonstração no celular')
            : ev === 'ev_atualiza' ? 'mostrar como funciona: ele manda a foto com o preço novo e o cardápio é atualizado (feito por nós)'
              : ev === 'ev_relatorio' ? 'mostrar um relatório do mês (o formato), sem prometer número'
                : EVIDENCIAS[ev]?.descricao || ev,
    }));
    return { sales_arguments, suggested_questions, demonstration_suggestions };
  }

  /** Responde a uma pergunta do vendedor (ou sua), com o que é verdade e dizendo quando não há vantagem. */
  responde(pergunta, lead = {}, ajustes = {}) {
    const cat = categoriaDaPergunta(pergunta);
    const a = lead?.id ? this.analisaLead(lead, this.briefDe(lead.id)?.product_id || '', ajustes) : this.analisaProduto('cardapio', ajustes);
    const temSite = Boolean(lead?.site_proprio);
    // Só se cita preço de pacote aprovado no catálogo; o de exemplo não vale.
    const preco = a.preco.find((x) => x.mensalidade && x.aprovado);
    const soExemplo = !preco && a.preco.some((x) => x.mensalidade);
    const r = (resposta, { vantagem = true, apoio = [] } = {}) => ({ categoria: cat || 'geral', pergunta: texto(pergunta, 300), resposta, vantagem_suficiente: vantagem,
      apoio, nao_dizer: a.restricoes_de_comunicacao.slice(0, 3), quando: agora() });
    if (cat === 'instagram') {
      return r('O Instagram continua: não é para trocar. A diferença real é que o site é um endereço próprio, com o cardápio organizado, o mapa e o botão do WhatsApp num link só, que aparece para quem procura no Google; o Instagram mostra para quem já segue. Dá para pôr o link do site na bio.'
        + (temSite ? ' Mas ele já tem site: aí a vantagem é pequena; se o site dele já faz isso, diga.' : ''), { vantagem: !temSite, apoio: ['instagram', 'dominio', 'botao_whatsapp'] });
    }
    if (cat === 'ja_usa_cardapio') {
      const f = lead?.cardapio_atual?.formato;
      if (f === 'link' || f === 'site') {
        return r('Se o cardápio digital que ele já usa é organizado por categoria, abre bem no celular e está com o preço certo, não há vantagem real em trocar: diga isso. Só vale se ele sente falta de algo que nós temos e o dele não: a placa do QR Code pronta, a atualização feita por nós pelo WhatsApp, ou o botão do WhatsApp. Pergunte o que incomoda no atual.', { vantagem: false, apoio: ['qr_code', 'atualizacao'] });
      }
      return r('Pergunte como é o cardápio que ele usa hoje. Se for PDF ou foto, a vantagem real é a leitura por categoria no celular e o preço atualizado por nós pelo WhatsApp, sem refazer arquivo. Se for um cardápio digital bom, talvez não valha a troca, e dá para dizer isso.', { vantagem: true, apoio: ['categorias', 'atualizacao'] });
    }
    if (cat === 'ja_tem_site') {
      return r('Se o site dele já abre bem no celular e tem o cardápio, o site completo não acrescenta muito: ofereça só o cardápio digital (QR Code para as mesas, atualização pelo WhatsApp) ou diga que não precisa.', { vantagem: false, apoio: ['qr_code', 'atualizacao'] });
    }
    if (cat === 'aumenta_vendas') {
      return r('Não prometa: não temos dado para dizer que aumenta vendas. O que dá para afirmar: fica mais fácil achar o cardápio e chamar no WhatsApp, e o relatório do mês mostra quantos clicaram no botão do WhatsApp; com esse número ele mesmo avalia se vale. A demonstração pronta antes de pagar tira o risco de decidir no escuro.', { vantagem: true, apoio: ['relatorio', 'demo_antes'] });
    }
    if (cat === 'concorrente') {
      return r('Reconheça: pode existir solução parecida por menos, e não fale mal de ninguém. Diferenças reais que temos: a demonstração do dele pronta antes de pagar, feita com as fotos e o cardápio dele; o preço novo atualizado por nós pelo WhatsApp; o relatório de cliques. Pergunte o que está incluído no preço do outro. Se o outro entrega o mesmo e ele está satisfeito, não há vantagem suficiente: diga isso.', { vantagem: false, apoio: ['demo_antes', 'atualizacao', 'relatorio'] });
    }
    if (cat === 'preco') {
      const p = a.principais.slice(0, 2).map((b) => b.benefit).join('; ');
      return r(`${preco ? `A mensalidade é ${preco.mensalidade}. ` : soExemplo ? 'O preço ainda não foi aprovado no catálogo: não cite valor. ' : 'O preço ainda não está cadastrado: não cite valor. '}Não baixe o preço nem invente desconto. Ligue ao que pesa para ele: ${p}. Ele vê a demonstração pronta antes de decidir. Pergunte se o que pesa é a mensalidade ou o valor para fazer; se houver pacote menor aprovado, mostre.`, { vantagem: true, apoio: a.principais.map((b) => b.feature_id) });
    }
    const top = a.principais.map((b) => b.benefit).join('; ');
    return r(`Os benefícios que mais pesam${lead?.nome ? ` para ${lead.nome}` : ''}: ${top}. Só cite o que está na base do produto.`, { vantagem: true, apoio: a.principais.map((b) => b.feature_id) });
  }

  /* ── o Value Brief: gerar, guardar, versionar ───────────────── */
  briefDe(leadId) {
    return this.mem.briefs.filter((b) => b.lead_id === leadId && !['substituido', 'rejeitado', 'falhou'].includes(b.estado)).sort((a, b) => b.generated_at - a.generated_at)[0] || null;
  }
  acha(id) { return this.mem.briefs.find((b) => b.brief_id === id) || null; }
  lista({ leadId } = {}) { return this.mem.briefs.filter((b) => !leadId || b.lead_id === leadId).sort((a, b) => b.generated_at - a.generated_at); }

  /** Confere o brief: nada de funcionalidade que não existe, evidência inventada ou promessa proibida. */
  confere(b, ajustes = {}) {
    const p = this.produtos(ajustes)[b.product_id];
    const problemas = [];
    for (const x of b.prioritized_benefits) {
      const f = p.funcionalidades.find((y) => y.nome === x.feature || y.id === x.feature_id);
      if (!f) problemas.push(`benefício de uma funcionalidade que não está na base: ${x.feature}`);
      else if (f.estado === 'nao_implementada') problemas.push(`benefício de uma funcionalidade que não existe: ${f.nome}`);
      if (x.evidence_reference && !EVIDENCIAS[x.evidence_reference]) problemas.push(`evidência que não existe: ${x.evidence_reference}`);
    }
    const recursos = p.funcionalidades.filter((f) => f.estado !== 'nao_implementada').map((f) => f.nome).join(' | ');
    const textos = [b.resumo?.argumento_principal, ...b.sales_arguments.map((s) => s.argumento)].filter(Boolean).join('\n');
    problemas.push(...problemasDeTexto(textos, { recursos, garantia: p.garantias_autorizadas.join(' ') }));
    return [...new Set(problemas)];
  }

  /**
   * value.generate_brief — gera (ou devolve o mesmo, se nada mudou: idempotente) o brief de um restaurante.
   * Salvo em disco ANTES de qualquer tarefa para o próximo agente.
   */
  async geraBrief(lead, { produto = '', campanha = '', correlacao = '', ajustes = {}, forca = false, motivo = 'novo' } = {}) {
    const t0 = agora();
    this.evento('value.analysis.started', { lead_id: lead?.id, correlacao });
    const a = await comTempo(Promise.resolve().then(() => this.analisaLead(lead, produto, ajustes)), LIMITE_MS, 'a análise passou do tempo');
    const chave = createHash('sha256').update(JSON.stringify({ lead: lead.id, p: a.product_id, v: a.product_version, ctx: a.verified_context, n: a.identified_needs })).digest('hex').slice(0, 20);
    const anterior = this.briefDe(lead.id);
    if (anterior && anterior.chave === chave && !forca) {
      this.evento('value.analysis.completed', { lead_id: lead.id, brief_id: anterior.brief_id, correlacao, repetido: true, ms: agora() - t0 });
      await this._grava();
      return { brief: anterior, novo: false };
    }
    const { sales_arguments, suggested_questions, demonstration_suggestions } = this._argumentos(a, lead);
    const objecoes = ['preco', 'instagram', 'aumenta_vendas', 'concorrente'].map((c) => {
      const exemplo = { preco: 'tá caro', instagram: 'já tenho Instagram', aumenta_vendas: 'isso aumenta as vendas?', concorrente: 'outro faz mais barato' }[c];
      const r = this.responde(exemplo, lead, ajustes);
      return { objecao: exemplo, resposta: r.resposta, vantagem_suficiente: r.vantagem_suficiente };
    });
    const versao = (anterior?.versao || 0) + 1;
    const b = {
      brief_id: `vb-${lead.id}-${versao}-${randomBytes(2).toString('hex')}`,
      versao, chave,
      lead_id: lead.id,
      campaign_id: texto(campanha, 60) || `campanha-${new Date().toISOString().slice(0, 7)}`,
      product_id: a.product_id, product_version: a.product_version,
      restaurant_name: a.restaurant_name,
      verified_context: a.verified_context,
      identified_needs: a.identified_needs,
      prioritized_benefits: a.principais.map((x) => ({ feature: x.feature, feature_id: x.feature_id, advantage: x.advantage, benefit: x.benefit,
        customer_value: x.customer_value, evidence_reference: x.evidence_reference, relevance_score: x.score, classe: x.classe,
        confidence_level: x.confidence_level, criterios: x.criterios, base: x.necessidade ? { tipo: x.necessidade.tipo, observacao: x.necessidade.observacao } : null })),
      todos_os_beneficios: a.mapa_de_valor.map((x) => ({ feature: x.feature, benefit: x.benefit, relevance_score: x.score, classe: x.classe, confidence_level: x.confidence_level })),
      evidence: [...new Set(a.principais.map((x) => x.evidence_reference).filter(Boolean))].map((id) => ({ id, ...EVIDENCIAS[id] })),
      differentiators: a.diferenciais,
      suggested_questions, sales_arguments, objection_support: objecoes, demonstration_suggestions,
      limitations: [...a.limitacoes, ...a.nao_verificado],
      confidence_score: a.confidence_score,
      generated_at: agora(),
      resumo: {
        principal_valor: a.principais[0] ? `${a.principais[0].benefit}` : 'sem benefício verificado',
        argumento_principal: sales_arguments[0]?.argumento || '',
        beneficio_secundario: a.principais[1]?.benefit || '',
        pergunta_consultiva: suggested_questions[0].pergunta,
        demonstracao: demonstration_suggestions[0]?.como || '',
        limitacao: 'Não prometer aumento de faturamento sem dados que sustentem a afirmação.',
      },
      estado: 'gerado',
      motivo,
      correlacao,
      ms: agora() - t0,
      oferta_id: null,
      // A "caixa de saída": a tarefa para o próximo agente só é criada depois deste registro estar em disco.
      saida: { pendente: true, para: 'ofertas' },
      historico: [{ quando: agora(), o: `gerado (${motivo})` }],
    };
    const problemas = this.confere(b, ajustes);
    if (problemas.length) {
      b.estado = 'bloqueado';
      b.problemas = problemas;
    }
    if (anterior && anterior.estado !== 'enviado') { anterior.estado = 'substituido'; anterior.historico.push({ quando: agora(), o: `substituído pela versão ${versao}` }); }
    this.mem.briefs.push(b);
    this.evento(anterior ? 'value.brief.updated' : 'value.brief.created', { lead_id: lead.id, brief_id: b.brief_id, versao, correlacao });
    this.evento('value.analysis.completed', { lead_id: lead.id, brief_id: b.brief_id, correlacao, ms: b.ms });
    await this._grava();
    return { brief: b, novo: true };
  }

  async marcaSaida(briefId, extra = {}) {
    const b = this.acha(briefId);
    if (!b) return;
    b.saida = { pendente: false, ...b.saida, ...extra, quando: agora() };
    b.saida.pendente = false;
    await this._grava();
  }

  /** Briefs salvos cuja tarefa para o próximo agente não chegou a ser criada (a Matilha caiu no meio). */
  saidasPendentes() { return this.mem.briefs.filter((b) => b.saida?.pendente && ['gerado', 'aprovado'].includes(b.estado)); }

  async vinculaOferta(briefId, ofertaId) {
    const b = this.acha(briefId);
    if (!b) return;
    b.oferta_id = ofertaId;
    b.historico.push({ quando: agora(), o: `usado na oferta ${ofertaId}` });
    await this._grava();
  }

  async aprova(briefId, quem = 'você', correlacao = '') {
    const b = this.acha(briefId);
    if (!b) throw new Error('Value Brief não encontrado.');
    if (b.estado === 'bloqueado') throw new Error(`este brief tem problema: ${b.problemas.join('; ')}. Revise antes.`);
    if (['aprovado', 'enviado'].includes(b.estado)) return { brief: b, mudou: false };
    if (b.estado !== 'gerado') throw new Error(`este brief está "${b.estado}"`);
    b.estado = 'aprovado';
    b.aprovado_em = agora();
    b.aprovado_por = quem;
    b.historico.push({ quando: agora(), o: `aprovado (${quem})` });
    this.evento('value.brief.approved', { lead_id: b.lead_id, brief_id: b.brief_id, correlacao });
    await this._grava();
    return { brief: b, mudou: true };
  }

  /** Revisar: troca o argumento principal (ou a pergunta), confere de novo, e volta a precisar de aprovação. */
  async revisa(briefId, campos = {}, ajustes = {}) {
    const b = this.acha(briefId);
    if (!b) throw new Error('Value Brief não encontrado.');
    if (b.estado === 'enviado') throw new Error('este brief já foi para o vendedor: gere uma versão nova.');
    if (campos.argumento_principal !== undefined) { b.resumo.argumento_principal = texto(campos.argumento_principal, 500); if (b.sales_arguments[0]) b.sales_arguments[0].argumento = b.resumo.argumento_principal; }
    if (campos.pergunta_consultiva !== undefined) { b.resumo.pergunta_consultiva = texto(campos.pergunta_consultiva, 300); b.suggested_questions[0].pergunta = b.resumo.pergunta_consultiva; }
    const problemas = this.confere(b, ajustes);
    b.problemas = problemas;
    b.estado = problemas.length ? 'bloqueado' : 'gerado';
    b.historico.push({ quando: agora(), o: `revisado${problemas.length ? ` (bloqueado: ${problemas.join('; ')})` : ''}` });
    this.evento('value.brief.updated', { lead_id: b.lead_id, brief_id: b.brief_id, revisado: true });
    await this._grava();
    return b;
  }

  /** O retrato que fica no cliente e o vendedor lê (lead.value_brief). Só aprovado. */
  async enviaAoVendedor(briefId, correlacao = '') {
    const b = this.acha(briefId);
    if (!b) throw new Error('Value Brief não encontrado.');
    if (!['aprovado', 'enviado'].includes(b.estado)) throw new Error('o Value Brief precisa ser aprovado antes de ir para o vendedor');
    b.estado = 'enviado';
    b.enviado_em = agora();
    b.historico.push({ quando: agora(), o: 'enviado ao vendedor' });
    this.evento('value.brief.sent_to_sales', { lead_id: b.lead_id, brief_id: b.brief_id, correlacao });
    await this._grava();
    return retratoParaOVendedor(b);
  }

  async guardaAssistencia(r) { this.mem.assistencias.push(r); await this._grava(); }

  async falhou(leadId, erro, correlacao = '') {
    this.evento('value.analysis.failed', { lead_id: leadId, erro: texto(erro, 300), correlacao });
    await this._grava();
  }

  painel(ajustes = {}) {
    const ps = this.produtos(ajustes);
    return {
      nome: NOME_NA_TELA, ligado: this.ligado(), pesos: PESOS, criterios: NOMES_DOS_CRITERIOS, classes: NOMES_DAS_CLASSES, evidencias: EVIDENCIAS,
      produtos: Object.fromEntries(Object.keys(ps).map((id) => [id, { ...this.analisaProduto(id, ajustes),
        funcionalidades: ps[id].funcionalidades.map((f) => ({ id: f.id, nome: f.nome, estado: f.estado, evidencia: f.evidencia, condicao: f.condicao })) }])),
      briefs: this.lista().slice(0, 120),
      desatualizados: this.desatualizados(ajustes).map((b) => b.brief_id),
      eventos: this.mem.eventos.slice(-60).reverse(),
      assistencias: this.mem.assistencias.slice(-30).reverse(),
    };
  }
}

/** O que o vendedor lê: curto, utilizável, com o que não prometer. */
export function retratoParaOVendedor(b) {
  return {
    brief_id: b.brief_id, versao: b.versao, product_id: b.product_id, product_version: b.product_version,
    principal_valor: b.resumo.principal_valor,
    argumento_principal: b.resumo.argumento_principal,
    beneficios: b.prioritized_benefits.map((x) => ({ beneficio: x.benefit, valor: x.customer_value, evidencia: x.evidence_reference, base: x.base?.tipo || 'geral' })),
    pergunta_consultiva: b.resumo.pergunta_consultiva,
    perguntas: b.suggested_questions.map((q) => q.pergunta),
    demonstracao: b.resumo.demonstracao,
    objecoes: b.objection_support.map((o) => ({ objecao: o.objecao, resposta: o.resposta })),
    limitacoes: b.limitations.slice(0, 6),
    enviado_em: Date.now(),
  };
}

/** Uma promessa com prazo: passou, vira erro (e o mural tenta de novo). */
export function comTempo(promessa, ms, msg) {
  let relogio;
  return Promise.race([promessa, new Promise((_, rej) => { relogio = setTimeout(() => rej(new Error(msg)), ms); })]).finally(() => clearTimeout(relogio));
}
