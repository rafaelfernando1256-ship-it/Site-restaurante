/* Peças de tela reaproveitadas pelos oito agentes. */

export function esc(t) {
  return String(t ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function el(html) {
  const d = document.createElement('div');
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

export function on(raiz, seletor, evento, fn) {
  raiz.addEventListener(evento, e => {
    const alvo = e.target.closest(seletor);
    if (alvo && raiz.contains(alvo)) fn(e, alvo);
  });
}

export function campo(rotulo, nome, valor, extra = {}) {
  const { tipo = 'text', dica = '', passo = '', largura = '' } = extra;
  return `<div style="${largura ? 'grid-column:' + largura : ''}">
    <label for="c-${nome}">${esc(rotulo)}</label>
    <input id="c-${nome}" name="${nome}" type="${tipo}" ${passo ? `step="${passo}"` : ''}
           value="${esc(valor ?? '')}" placeholder="${esc(dica)}">
  </div>`;
}

export function area(rotulo, nome, valor, dica = '') {
  return `<div>
    <label for="c-${nome}">${esc(rotulo)}</label>
    <textarea id="c-${nome}" name="${nome}" placeholder="${esc(dica)}">${esc(valor ?? '')}</textarea>
  </div>`;
}

export function numero(valor, rotulo) {
  return `<div class="numero"><b>${esc(valor)}</b><span>${esc(rotulo)}</span></div>`;
}

export function aviso(texto, tipo = '') {
  return `<div class="aviso ${tipo}">${texto}</div>`;
}

/* Um recado curto que some sozinho. Para confirmar ação sem roubar a
   tela de quem está trabalhando. */
let caixaRecado;
export function recado(texto, tipo = 'bom') {
  if (!caixaRecado) {
    caixaRecado = el(`<div style="position:fixed;left:50%;bottom:22px;
      transform:translateX(-50%);z-index:50;display:grid;gap:8px;
      justify-items:center;pointer-events:none"></div>`);
    document.body.appendChild(caixaRecado);
  }
  const cor = tipo === 'ruim' ? 'var(--erro)' : 'var(--acento)';
  const n = el(`<div style="background:var(--painel);border:1px solid var(--borda);
    border-left:3px solid ${cor};border-radius:8px;padding:10px 14px;
    box-shadow:0 6px 20px rgb(0 0 0 / .18);font-size:.875rem;max-width:min(92vw,420px)">
    ${esc(texto)}</div>`);
  caixaRecado.appendChild(n);
  setTimeout(() => { n.style.opacity = '0'; n.style.transition = 'opacity .4s'; }, 3200);
  setTimeout(() => n.remove(), 3700);
}

export async function copia(texto, oque = 'copiado') {
  try {
    await navigator.clipboard.writeText(texto);
    recado(oque);
    return true;
  } catch {
    // Navegador sem permissão de área de transferência: seleciona para
    // o Ctrl+C funcionar, em vez de só falhar.
    const t = document.createElement('textarea');
    t.value = texto;
    t.style.cssText = 'position:fixed;top:-9999px';
    document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); recado(oque); } catch { recado('copie à mão', 'ruim'); }
    t.remove();
    return false;
  }
}

export function espera(botao, texto = 'trabalhando...') {
  const antes = botao.innerHTML;
  botao.disabled = true;
  botao.innerHTML = texto;
  return () => { botao.disabled = false; botao.innerHTML = antes; };
}

export async function carregaScript(url) {
  if (document.querySelector(`script[src="${url}"]`)) return true;
  return new Promise(resolve => {
    const s = document.createElement('script');
    s.src = url;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}
