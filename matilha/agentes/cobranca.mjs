/**
 * O COBRADOR — a mensalidade, todo mês, sem você lembrar.
 *
 * O combinado do vendedor é "a mensalidade começa quando o site entra no
 * ar". Então o vencimento é todo mês no mesmo dia em que o cliente
 * aprovou o site (dia 29, 30 ou 31 vira 28, que todo mês tem).
 *
 *   · no dia: uma mensagem com o valor e a chave Pix;
 *   · 3 dias depois, sem pagamento: um lembrete educado;
 *   · 7 dias depois: nenhuma mensagem a mais — chama você. Cobrança
 *     insistente pelo WhatsApp vira denúncia e derruba o número.
 *
 * Quem marca "pagou" é você, no painel: só você vê o extrato.
 */
import { montaOferta } from '../oferta.mjs';

const DIA = 24 * 60 * 60 * 1000;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "2026-10" */
export const mesDe = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
/** "outubro" */
export const nomeDoMes = (mes) => MESES[Number(String(mes).split('-')[1]) - 1] || '';

/** O dia do vencimento: o da aprovação, no máximo 28. */
export const diaDoVencimento = (lead) => Math.min(28, new Date(lead.aprovado_em).getDate());

/** O vencimento mais recente que já chegou (ou null, antes do primeiro). */
export function ultimoVencimento(lead, agora = Date.now()) {
  if (!lead?.aprovado_em) return null;
  const dia = diaDoVencimento(lead);
  const hoje = new Date(agora);
  let vence = new Date(hoje.getFullYear(), hoje.getMonth(), dia, 9, 0, 0);
  if (vence.getTime() > agora) vence = new Date(hoje.getFullYear(), hoje.getMonth() - 1, dia, 9, 0, 0);
  // O primeiro vence um mês depois da aprovação: o primeiro mês já foi
  // acertado junto com o valor de fazer.
  const aprovado = new Date(lead.aprovado_em);
  const primeiro = new Date(aprovado.getFullYear(), aprovado.getMonth() + 1, dia, 9, 0, 0);
  if (vence.getTime() < primeiro.getTime()) return null;
  return vence.getTime();
}

/** Quanto é, em texto, do jeito que está no painel ("R$ 127 por mês"). */
export function valorDaMensalidade(lead, ajustes = {}) {
  const oferta = montaOferta(ajustes, lead);
  const produto = oferta.produtos.find((p) => p.chave === (lead.produto || 'site')) || oferta.produtos[0];
  return produto?.mensalidade || '';
}

/**
 * O que fazer agora com a mensalidade deste cliente:
 * `{ mes, vence, qual: 'vencimento' | 'atraso' | 'chamar' }`, ou null.
 */
export function cobrancaDevida(lead, agora = Date.now()) {
  if (!lead?.aprovado_em || lead.estagio === 'perdido' || lead.cancelado_em) return null;
  const vence = ultimoVencimento(lead, agora);
  if (!vence) return null;
  const mes = mesDe(vence);
  const m = lead.mensalidade || {};
  if ((m.pagos || []).includes(mes)) return null;
  const avisos = (m.avisos || {})[mes] || {};
  if (!avisos.vencimento) return { mes, vence, qual: 'vencimento' };
  if (agora >= vence + 3 * DIA && !avisos.atraso) return { mes, vence, qual: 'atraso' };
  if (agora >= vence + 7 * DIA && !avisos.chamou) return { mes, vence, qual: 'chamar' };
  return null;
}

/** Em que pé está, para o painel: `{ mes, vence, dias_de_atraso, avisado }` ou null se está em dia. */
export function situacaoDaMensalidade(lead, agora = Date.now()) {
  const vence = ultimoVencimento(lead, agora);
  if (!vence) return null;
  const mes = mesDe(vence);
  const m = lead.mensalidade || {};
  if ((m.pagos || []).includes(mes)) return null;
  const avisos = (m.avisos || {})[mes] || {};
  return { mes, nome_do_mes: nomeDoMes(mes), vence, dias_de_atraso: Math.floor((agora - vence) / DIA),
    avisado: Boolean(avisos.vencimento), lembrado: Boolean(avisos.atraso) };
}
