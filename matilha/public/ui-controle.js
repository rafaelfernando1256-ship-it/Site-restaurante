/**
 * O JARVIS UI CONTROL ENGINE, do lado da página.
 *
 * Fica numa espera longa no servidor (/api/jarvis/ui/espera). Quando o
 * Jarvis manda uma ação de tela ("abre a rede de agentes", "fecha a
 * ficha", "filtra os projetos em produção"), executa com as funções da
 * própria página — nada de clique simulado no que tem função própria —
 * e devolve o estado de DEPOIS. É esse estado que o servidor confere
 * antes de dizer "feito".
 *
 * A camada visual (ui.click, ui.fill, ui.select…) é o complemento, para o
 * que não tem ação própria: acha o elemento pelo NOME que aparece na tela
 * (rótulo, texto, aria-label), nunca por coordenada, e só dentro desta
 * página. Não escreve em senha nem em chave, não clica em "apagar", e o
 * botão que manda mensagem, publica, cobra ou aprova pede o seu sim.
 */
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// O que o Jarvis nunca faz pela tela, nem com sim: apagar e mexer em credencial (isso é com a sua mão).
const PROIBIDO = /\b(apag\w*|exclu\w*|delet\w*|esvazi\w*|esquec\w* tudo)\b/;
// O que ele faz só com o seu sim.
const SENSIVEL = [
  [/\b(envi\w*|mand\w*)\b/, 'manda mensagem'], [/\bpublic\w*\b/, 'publica'], [/\b(cobr\w*|pag\w*)\b/, 'mexe com dinheiro'],
  [/\b(liber\w*|solt\w*)\b/, 'começa contatos'], [/\baprov\w*\b/, 'aprova'], [/\b(desconect\w*|sair da conta|deslig\w* o whats)\b/, 'desconecta'],
  [/\b(gerar o site oficial|site oficial)\b/, 'faz o site oficial'], [/\brejeit\w*\b/, 'rejeita'],
];
const CREDENCIAL = /senha|chave|token|api[_ -]?key|secret|pix|password/i;

/** Visível de verdade: na tela, sem nenhum ancestral escondido. */
export const visivel = (el) => Boolean(el && el.isConnected && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden');

/** O nome de um elemento, como uma pessoa leria. */
function nomeDe(el) {
  const rotulo = el.getAttribute('aria-label') || (el.labels?.[0]?.textContent) || el.getAttribute('title') || '';
  const textoProprio = el.matches('input, select, textarea') ? (el.getAttribute('placeholder') || '') : el.textContent;
  return String(rotulo || textoProprio || el.value || '').replace(/\s+/g, ' ').trim().slice(0, 120);
}

/** Acha o elemento visível cujo nome mais combina com o pedido. */
export function achaElemento(alvo, { papel = 'qualquer', campos = false, raiz = document, fora = '#cc' } = {}) {
  const n = norm(alvo).replace(/^(o|a|no|na|em|botao|aba|link|campo)\s+/, '').replace(/^"|"$/g, '');
  if (!n) return null;
  const seletor = campos ? 'input:not([type=hidden]), select, textarea'
    : papel === 'botao' ? 'button, [role=button], input[type=submit]' : papel === 'link' ? 'a[href]' : papel === 'aba' ? '[role=tab], .aba-linha, .nav-item'
      : 'button, a[href], [role=tab], [role=button], summary, .aba-linha, .nav-item, input[type=checkbox], input[type=radio]';
  const cands = [...raiz.querySelectorAll(seletor)].filter((el) => visivel(el) && !(fora && el.closest(fora)) && !el.disabled);
  let melhor = null; let nota = 0;
  for (const el of cands) {
    const nome = norm(campos ? `${el.labels?.[0]?.textContent || ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('placeholder') || ''} ${el.name || ''}` : nomeDe(el));
    if (!nome) continue;
    const p = nome === n ? 4 : nome.startsWith(n) ? 3 : nome.includes(n) ? 2 : n.split(' ').filter((w) => w.length > 2).every((w) => nome.includes(w)) ? 1 : 0;
    if (p > nota) { melhor = el; nota = p; }
  }
  return melhor;
}

/** Sensível? Devolve { proibido } , { motivo } ou null. */
export function classifica(el) {
  const n = norm(`${nomeDe(el)} ${el.dataset?.faz || ''} ${el.dataset?.acao || ''}`);
  if (PROIBIDO.test(n) || el.classList.contains('bt-perigo')) return { proibido: true, motivo: 'apaga dados' };
  if (el.dataset?.perigo) return { motivo: el.dataset.perigo };
  for (const [re, motivo] of SENSIVEL) if (re.test(n)) return { motivo };
  return null;
}

const retrato = (el) => (el ? { nome: nomeDe(el), tag: el.tagName.toLowerCase(), valor: el.value ?? null, marcado: el.checked ?? null,
  expandido: el.getAttribute('aria-expanded'), selecionado: el.getAttribute('aria-selected') || el.getAttribute('aria-current') } : null);

/** As ações da camada visual, iguais em qualquer página da Matilha. */
export function acoesVisuais({ raiz = document } = {}) {
  return {
    'ui.inspect': async ({ alvo, papel }) => {
      const el = achaElemento(alvo, { papel, raiz });
      if (!el) return { ok: false, erro: `não achei "${alvo}" na tela` };
      const c = classifica(el);
      // Proibido não pede sim: é recusado direto, no clique.
      return { ok: true, rotulo: nomeDe(el), sensivel: Boolean(c) && !c.proibido, proibido: Boolean(c?.proibido), motivo: c?.motivo || '' };
    },
    'ui.click': async ({ alvo, papel, confirmado }) => {
      const el = achaElemento(alvo, { papel, raiz });
      if (!el) return { ok: false, erro: `não achei "${alvo}" na tela (só clico no que está visível)` };
      const c = classifica(el);
      if (c?.proibido) return { ok: false, erro: `"${nomeDe(el)}" apaga dados: isso só pela sua mão, no botão` };
      if (c && !confirmado) return { ok: false, precisa_confirmar: `clicar em "${nomeDe(el)}" (${c.motivo})`, erro: 'precisa do seu sim' };
      const antes = retrato(el);
      el.scrollIntoView({ block: 'center' });
      el.click();
      await espera(350);
      return { ok: true, rotulo: antes.nome, evidencia: { antes, depois: retrato(el.isConnected ? el : null), hash: location.hash } };
    },
    'ui.fill': async ({ campo, valor }) => {
      const el = achaElemento(campo, { campos: true, raiz });
      if (!el) return { ok: false, erro: `não achei o campo "${campo}"` };
      if (el.type === 'password' || CREDENCIAL.test(`${el.name} ${el.id} ${nomeDe(el)} ${el.closest('[data-sub]')?.dataset.sub || ''}`)) {
        return { ok: false, erro: 'campo de senha, chave ou Pix: isso o Jarvis não preenche' };
      }
      const antes = el.value;
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, valor);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      if (el.value !== String(valor)) return { ok: false, erro: 'o campo não aceitou o valor' };
      return { ok: true, rotulo: nomeDe(el), evidencia: { antes, depois: el.value } };
    },
    'ui.select': async ({ campo, opcao }) => {
      const el = achaElemento(campo, { campos: true, raiz });
      if (!el || el.tagName !== 'SELECT') return { ok: false, erro: `não achei a lista "${campo}"` };
      const o = [...el.options].find((x) => norm(x.textContent) === norm(opcao)) || [...el.options].find((x) => norm(x.textContent).includes(norm(opcao)) || norm(x.value) === norm(opcao));
      if (!o) return { ok: false, erro: `"${campo}" não tem a opção "${opcao}"` };
      const antes = el.value;
      el.value = o.value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: el.value === o.value, rotulo: nomeDe(el), opcao: o.textContent.trim(), evidencia: { antes, depois: el.value } };
    },
    'ui.scroll': async ({ alvo, direcao }) => {
      if (alvo) {
        const el = achaElemento(alvo, { raiz }) || [...raiz.querySelectorAll('h1, h2, h3')].find((h) => visivel(h) && norm(h.textContent).includes(norm(alvo)));
        if (!el) return { ok: false, erro: `não achei "${alvo}" para rolar até lá` };
        el.scrollIntoView({ block: 'start' });
        return { ok: true, rotulo: nomeDe(el) };
      }
      const y = { cima: -innerHeight * 0.8, baixo: innerHeight * 0.8, topo: -1e7, fim: 1e7 }[direcao || 'baixo'];
      window.scrollBy(0, y);
      return { ok: true, evidencia: { scrollY: Math.round(scrollY) } };
    },
    'ui.wait': async ({ alvo, estado = 'visivel', segundos = 5 }) => {
      const ate = Date.now() + Math.min(20, segundos) * 1000;
      while (Date.now() < ate) {
        const el = achaElemento(alvo, { raiz }) || achaElemento(alvo, { campos: true, raiz });
        if ((estado === 'visivel') === Boolean(el)) return { ok: true, rotulo: el ? nomeDe(el) : alvo };
        await espera(200);
      }
      return { ok: false, erro: `"${alvo}" não ficou ${estado === 'visivel' ? 'visível' : 'oculto'} em ${segundos} s` };
    },
  };
}

/**
 * Liga a página ao Jarvis.
 * @param {object} o
 * @param {Function} o.pede      o fetch da página (já com a senha, se houver)
 * @param {Function} o.estado    () => o estado da tela agora (tela, ficha, palco, filtros…)
 * @param {object}   o.acoes     { 'navigation.open': async (params) => ({ ok, ... }), ... }
 * @param {string}   [o.tipo]    'painel' ou 'jarvis' (a página do Jarvis sozinha)
 */
export function ligaControleDeTela({ pede, estado, acoes, tipo = 'painel', aoComando = () => {} }) {
  let cliente = '';
  try { cliente = sessionStorage.getItem('jarvis-cliente') || ''; } catch { /* sem armazenamento */ }
  if (!cliente) {
    cliente = `${tipo}-${Math.random().toString(36).slice(2, 10)}`;
    try { sessionStorage.setItem('jarvis-cliente', cliente); } catch { /* fica só nesta página */ }
  }
  const todas = { ...acoesVisuais(), ...acoes };
  const estadoAgora = () => ({ ...estado(), foco: document.hasFocus(), visivel: document.visibilityState === 'visible' });
  let relogio = null;
  const reporta = () => {
    clearTimeout(relogio);
    relogio = setTimeout(() => pede('/api/jarvis/ui/estado', { cliente, tipo, estado: estadoAgora() }).catch(() => {}), 120);
  };
  for (const ev of ['hashchange', 'focus', 'visibilitychange']) addEventListener(ev, reporta);
  document.addEventListener('toggle', reporta, true);
  document.addEventListener('close', reporta, true);

  (async () => {
    let falhas = 0;
    for (;;) {
      let cmd;
      try {
        cmd = await pede(`/api/jarvis/ui/espera?cliente=${encodeURIComponent(cliente)}&tipo=${tipo}`);
        falhas = 0;
      } catch {
        falhas += 1;
        await espera(Math.min(15_000, 1000 * falhas));
        continue;
      }
      if (!cmd?.acao) { reporta(); continue; }
      aoComando(cmd);
      let r;
      const f = todas[cmd.acao];
      try { r = f ? await f(cmd.parametros || {}, cmd) : { ok: false, erro: `esta página não sabe fazer "${cmd.acao}"` }; } catch (e) { r = { ok: false, erro: e.message }; }
      await espera(60);
      await pede('/api/jarvis/ui/resultado', { cliente, comando: cmd.id, ...r, estado: estadoAgora() }).catch(() => {});
    }
  })();
  reporta();
  return { cliente, reporta };
}
