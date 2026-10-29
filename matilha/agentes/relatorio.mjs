/**
 * O RELATÓRIO DO MÊS — o que faz o dono sentir que a mensalidade vale.
 *
 * Todo começo de mês, uma mensagem curta: quantas pessoas clicaram em
 * "pedir pelo WhatsApp" no site dele no mês que passou, quantas mudanças
 * foram feitas e quando o cardápio foi atualizado. Só fatos: sem número,
 * a mensagem não fala de cliques.
 *
 * OS CLIQUES vêm do Netlify Forms, na sua própria conta: o site final leva
 * um formulário escondido e um ouvinte de clique que avisa a Netlify
 * quando alguém toca num link do WhatsApp. O aviso vai em segundo plano
 * (sendBeacon): o botão continua indo direto para o WhatsApp, e se a
 * contagem falhar, o cliente do seu cliente nem percebe. O plano grátis da
 * Netlify aceita 100 envios por mês por site; passou disso, o relatório
 * diz "mais de 100".
 */
import { mesDe, nomeDoMes } from './cobranca.mjs';

export const FORMULARIO = 'cliques';

/** O contador que vai no site final, antes do </body>. Não entra duas vezes. */
export function poeContador(html) {
  const s = String(html);
  if (s.includes(`name="${FORMULARIO}"`)) return s;
  const bloco = `
<form name="${FORMULARIO}" data-netlify="true" netlify-honeypot="campo-extra" hidden><input name="botao"><input name="campo-extra"></form>
<script>
/* Conta os cliques nos links do WhatsApp, para o relatório do mês. O botão continua indo direto. */
document.addEventListener('click', function (e) {
  var a = e.target.closest && e.target.closest('a[href*="wa.me"],a[href*="api.whatsapp.com"]');
  if (!a || !navigator.sendBeacon) return;
  try {
    var corpo = 'form-name=${FORMULARIO}&botao=' + encodeURIComponent((a.textContent || '').trim().slice(0, 60));
    navigator.sendBeacon('/', new Blob([corpo], { type: 'application/x-www-form-urlencoded' }));
  } catch (_) {}
}, true);
</script>`;
  return /<\/body>/i.test(s) ? s.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${bloco}\n</body>`) : s + bloco;
}

/**
 * Quantos cliques no mês ("2026-10"): um número, "mais de 100", ou null
 * quando não deu para contar (sem token, formulário ainda não detectado).
 */
export async function contaCliques(siteId, mes, { token = (process.env.NETLIFY_TOKEN || '').trim() } = {}) {
  if (!token || !siteId) return null;
  const pede = async (caminho) => {
    const r = await fetch(`https://api.netlify.com/api/v1${caminho}`, {
      headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000),
    });
    if (!r.ok) throw new Error(`Netlify ${r.status}`);
    return r.json();
  };
  try {
    const formularios = await pede(`/sites/${siteId}/forms`);
    const form = (formularios || []).find((f) => f.name === FORMULARIO);
    if (!form) return null;
    let total = 0;
    for (let pagina = 1; pagina <= 5; pagina += 1) {
      const lista = await pede(`/forms/${form.id}/submissions?per_page=100&page=${pagina}`);
      if (!Array.isArray(lista) || !lista.length) break;
      total += lista.filter((s) => mesDe(Date.parse(s.created_at)) === mes).length;
      // Em ordem do mais novo para o mais velho: passou do mês, acabou.
      if (lista.some((s) => mesDe(Date.parse(s.created_at)) < mes) || lista.length < 100) break;
    }
    return total >= 100 ? 'mais de 100' : total;
  } catch { return null; }
}

/** O mês que acabou de fechar, visto de `agora`: "2026-09" no começo de outubro. */
export function mesPassado(agora = Date.now()) {
  const d = new Date(agora);
  return mesDe(new Date(d.getFullYear(), d.getMonth() - 1, 15).getTime());
}

/**
 * Este cliente recebe o relatório deste mês? Só quem tem o site final no
 * ar há pelo menos duas semanas do mês passado, e uma vez por mês, nos
 * três primeiros dias.
 */
export function relatorioDevido(lead, agora = Date.now()) {
  const d = new Date(agora);
  if (d.getDate() > 3 || d.getHours() < 10) return null;
  if (!lead?.aprovado_em || !lead.sites?.oficial?.url || lead.estagio === 'perdido' || lead.nao_perturbe) return null;
  const mes = mesPassado(agora);
  const inicioDoMes = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  if (lead.aprovado_em > inicioDoMes - 14 * 24 * 60 * 60 * 1000) return null;
  if ((lead.relatorios || []).some((r) => r.mes === mes)) return null;
  return { mes, nome_do_mes: nomeDoMes(mes) };
}
