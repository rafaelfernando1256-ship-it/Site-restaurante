/**
 * O RASCUNHO DA FICHA — o vendedor escreve, quem envia é você.
 *
 * Três pedidos, vindos dos botões da ficha do cliente:
 *   abordagem  — o primeiro contato
 *   resposta   — o que responder ao que o dono escreveu, no momento
 *                em que a conversa está
 *   seguimento — um lembrete curto para quem não respondeu
 *
 * Nada sai daqui para o WhatsApp: o texto volta para o rascunho, e
 * você lê antes de mandar.
 */
import { corpo, destranca, erro, responde } from './comum.mjs';
import { conversa, momentoDo } from './vendedor.mjs';

const FEITIOS = { abordagem: true, resposta: true, seguimento: true };

/**
 * A ficha do cliente pede um rascunho, e quem escreve é o MESMO
 * vendedor da conversa automática — mesmas regras, mesmo roteiro,
 * mesmo conferidor. Antes eram dois redatores com regras diferentes,
 * e o rascunho da ficha não sabia nada de preço nem de momento.
 */
export default async (req) => {
  if (req.method !== 'POST') return erro('Use POST.', 405);
  const trancado = destranca(req);
  if (trancado) return trancado;

  let dados;
  try { dados = await corpo(req); } catch (e) { return erro(e.message); }

  const feitio = FEITIOS[dados.tipo] ? dados.tipo : 'abordagem';
  const lead = dados.lead || {};
  const demo = lead.sites?.demo;
  const estagio = feitio === 'abordagem' ? 'abordagem'
    : feitio === 'seguimento' ? (demo?.url ? 'lembrete_demo' : 'lembrete_sem_resposta')
      : momentoDo(lead);
  try {
    const r = await conversa({
      estagio, lead,
      historico: Array.isArray(dados.historico) ? dados.historico : lead.conversa || [],
      ajustes: dados.ajustes || {},
      autor: dados.autor,
      link: demo?.url || dados.link || '',
      linkFinal: lead.sites?.oficial?.url || '',
      expira: demo?.expira_texto || '',
    });
    return responde({ mensagem: r.mensagem, tipo: feitio, revisar: r.revisar, motor: r.motor, intencao: r.intencao });
  } catch (e) {
    return erro(`O vendedor não conseguiu escrever agora. (${e.message})`, 502);
  }
};
