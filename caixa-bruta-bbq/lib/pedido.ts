/**
 * A ENCOMENDA: soma, taxa de entrega e a mensagem do WhatsApp.
 *
 * Funções puras, testadas em tests/pedido.test.ts. A tela só chama.
 */
import { produtos } from '@/content/cardapio';
import { negocio } from '@/content/negocio';
import { dataPorExtenso, horaFalada } from '@/lib/agenda';

export type Linha = { id: string; quantidade: number };

export type Regiao = 'sarandi' | 'maringa' | 'outra';
export type Pagamento = 'pix' | 'dinheiro' | 'cartao';

export type Dados = {
  nome: string;
  whatsapp: string;
  endereco: string;
  bairro: string;
  regiao: Regiao;
  cidade: string;
  referencia?: string;
  data: string;
  hora: string;
  observacoes?: string;
  pagamento: Pagamento;
  troco?: string;
};

const real = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
/** 12500 → 'R$ 125,00' (com espaço comum, que o WhatsApp não quebra). */
export const reais = (centavos: number) => real.format(centavos / 100).replace(/ /g, ' ');

export const MAX_POR_ITEM = 20;

/** Só o que existe no cardápio, em quantidade inteira entre 1 e 20. */
export function limpaCarrinho(linhas: unknown): Linha[] {
  if (!Array.isArray(linhas)) return [];
  const saida: Linha[] = [];
  for (const l of linhas) {
    const id = String((l as Linha)?.id ?? '');
    const q = Math.floor(Number((l as Linha)?.quantidade));
    if (!produtos[id] || !(q >= 1)) continue;
    if (saida.some((s) => s.id === id)) continue;
    saida.push({ id, quantidade: Math.min(q, MAX_POR_ITEM) });
  }
  return saida;
}

export function subtotal(linhas: Linha[]) {
  return linhas.reduce((soma, l) => soma + (produtos[l.id]?.preco ?? 0) * l.quantidade, 0);
}

export function quantasPecas(linhas: Linha[]) {
  return linhas.reduce((soma, l) => soma + l.quantidade, 0);
}

export const NOME_DA_REGIAO: Record<Regiao, string> = {
  sarandi: 'Sarandi',
  maringa: 'Maringá',
  outra: 'Outra cidade',
};

export type Taxa = {
  /** Em centavos; null quando depende de confirmação. */
  valor: number | null;
  /** Como aparece na revisão e na mensagem. */
  texto: string;
  /** Uma linha explicando, quando há o que explicar. */
  aviso?: string;
};

/**
 * A taxa de entrega do cardápio: grátis em Sarandi, grátis em Maringá
 * até 10 km, R$ 15,00 nas demais regiões.
 *
 * Maringá não vira "grátis" automaticamente: sem calcular a rota, não
 * dá para saber se o endereço está a menos de 10 km. Então a taxa fica
 * a confirmar, e o total mostra as duas possibilidades.
 */
export function taxaDeEntrega(regiao: Regiao): Taxa {
  const taxa = negocio.entrega.taxaDemaisRegioes;
  if (regiao === 'sarandi') return { valor: 0, texto: 'Grátis' };
  if (regiao === 'maringa') {
    return {
      valor: null,
      texto: `Grátis até ${negocio.entrega.raioGratisMaringaKm} km, a confirmar`,
      aviso: `Em Maringá a entrega é grátis até ${negocio.entrega.raioGratisMaringaKm} km. `
        + `Acima disso, ${reais(taxa)}. O atendimento confirma pelo endereço.`,
    };
  }
  return {
    valor: taxa,
    texto: reais(taxa),
    aviso: 'O atendimento confirma se a entrega alcança o seu endereço.',
  };
}

/** O total que pode ser dito sem enganar ninguém. */
export function totalEstimado(linhas: Linha[], regiao: Regiao) {
  const sub = subtotal(linhas);
  const taxa = taxaDeEntrega(regiao);
  if (taxa.valor === null) {
    return `${reais(sub)} (ou ${reais(sub + negocio.entrega.taxaDemaisRegioes)} se passar de `
      + `${negocio.entrega.raioGratisMaringaKm} km)`;
  }
  return reais(sub + taxa.valor);
}

export const NOME_DO_PAGAMENTO: Record<Pagamento, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  cartao: 'Cartão',
};

function linhaDePagamento(d: Dados) {
  if (d.pagamento === 'dinheiro') {
    const troco = (d.troco || '').trim();
    return troco ? `Dinheiro (troco para ${troco})` : 'Dinheiro (sem troco)';
  }
  if (d.pagamento === 'pix') return 'Pix (aguardo os dados para pagamento)';
  return NOME_DO_PAGAMENTO[d.pagamento];
}

/** A mensagem que vai para o WhatsApp da loja. */
export function mensagemDoPedido(linhas: Linha[], d: Dados) {
  const cidade = d.regiao === 'outra' ? d.cidade.trim() : NOME_DA_REGIAO[d.regiao];
  const itens = linhas.map((l) => {
    const p = produtos[l.id];
    return `• ${l.quantidade}x ${p.nome} — ${reais(p.preco * l.quantidade)}`;
  });
  const taxa = taxaDeEntrega(d.regiao);
  const endereco = [d.endereco.trim(), d.bairro.trim(), cidade].filter(Boolean).join(', ');

  return [
    `Olá, ${negocio.nome.toUpperCase()}! Gostaria de solicitar uma encomenda.`,
    '',
    `Nome: ${d.nome.trim()}`,
    `Telefone: ${d.whatsapp.trim()}`,
    '',
    'ITENS:',
    ...itens,
    '',
    `Subtotal: ${reais(subtotal(linhas))}`,
    `Entrega: ${taxa.texto}`,
    `Total estimado: ${totalEstimado(linhas, d.regiao)}`,
    '',
    `DATA SOLICITADA: ${dataPorExtenso(d.data)}`,
    `HORÁRIO SOLICITADO: ${horaFalada(d.hora)}`,
    '',
    `ENDEREÇO: ${endereco}`,
    ...(d.referencia?.trim() ? [`Referência: ${d.referencia.trim()}`] : []),
    '',
    `FORMA DE PAGAMENTO: ${linhaDePagamento(d)}`,
    '',
    `OBSERVAÇÕES: ${d.observacoes?.trim() || 'Nenhuma'}`,
    '',
    'Estou ciente de que as encomendas precisam ser feitas com pelo menos 8 horas de antecedência.',
    '',
    'Aguardo confirmação da disponibilidade e do pedido.',
  ].join('\n');
}

export function linkDoWhatsapp(mensagem: string) {
  return `https://wa.me/${negocio.whatsapp.numero}?text=${encodeURIComponent(mensagem)}`;
}
