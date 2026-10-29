/**
 * JARVIS COMMAND CENTER — o console do Jarvis em qualquer tela do painel.
 *
 * Você escreve (ou fala) um comando; o Jarvis interpreta, monta o plano e
 * executa passo a passo. Aqui aparece o plano, a etapa de agora, o
 * resultado de cada passo, os erros (sem esconder), o histórico e as
 * ações disponíveis. Quando uma ação pede o seu sim, os botões Sim/Não
 * aparecem aqui mesmo.
 *
 * Quem executa é o servidor, pelo mesmo caminho da tela do Jarvis
 * (/api/jarvis): o mesmo intérprete, o mesmo registro de ações, a mesma
 * auditoria. Este arquivo só mostra.
 */
const PASSO = { esperando: ['○', 'esperando'], executando: ['◐', 'fazendo agora'], feito: ['✓', 'feito'], falhou: ['✕', 'falhou'],
  nao_executado: ['–', 'não executado'], precisa_confirmar: ['?', 'esperando o seu sim'], precisa_esclarecer: ['?', 'perguntou'] };

export function montaCommandCenter({ pede, esc, cliente, aoAbrirExecucao = () => {}, aoTerminar = () => {} }) {
  const raiz = document.createElement('div');
  raiz.id = 'cc';
  raiz.className = 'cc';
  raiz.innerHTML = `
    <button class="cc-abre" type="button" id="cc-abre" aria-expanded="false" aria-controls="cc-painel" title="Jarvis Command Center (Alt+J)">
      <span class="cc-nucleo" aria-hidden="true"></span><span>Jarvis</span></button>
    <section class="cc-painel" id="cc-painel" hidden aria-labelledby="cc-titulo" data-estado="pronto">
      <header class="cc-cab">
        <h2 id="cc-titulo">Jarvis Command Center</h2>
        <span class="cc-indicador" id="cc-indicador" role="status">pronto</span>
        <button class="cc-x" type="button" id="cc-fecha" aria-label="Fechar o Command Center">×</button>
      </header>
      <form class="cc-form" id="cc-form">
        <label class="cc-rotulo" for="cc-campo">Comando</label>
        <div class="cc-linha">
          <input id="cc-campo" autocomplete="off" placeholder="Ex.: abre a rede de agentes e pausa o vendedor">
          <button class="cc-mic" type="button" id="cc-mic" aria-label="Falar o comando" title="Falar">🎙</button>
          <button class="cc-enviar" type="submit">Executar</button>
        </div>
      </form>
      <div class="cc-corpo" id="cc-corpo">
        <div id="cc-plano" class="cc-plano" aria-live="polite"></div>
        <div id="cc-resultado" class="cc-resultado" aria-live="polite"></div>
        <div id="cc-sinal" class="cc-sinal" hidden>
          <button type="button" class="cc-sim" data-cc-sinal="sim">Sim, pode</button>
          <button type="button" class="cc-nao" data-cc-sinal="não">Não</button>
        </div>
        <details class="cc-dobra" id="cc-historico-dobra"><summary>Histórico</summary><ol id="cc-historico" class="cc-historico"></ol></details>
        <details class="cc-dobra" id="cc-acoes-dobra"><summary>Ações disponíveis</summary><ul id="cc-acoes" class="cc-acoes"></ul></details>
      </div>
    </section>`;
  document.body.append(raiz);
  // Uma janela modal (a ficha do cliente) deixa o resto da página inerte: o console vai junto para dentro dela,
  // para você continuar falando com o Jarvis ("fecha isso") com a ficha aberta. Fechou, ele volta.
  const acompanhaModal = () => {
    const modal = [...document.querySelectorAll('dialog[open]')].filter((d) => { try { return d.matches(':modal'); } catch { return false; } }).at(-1);
    const alvo = modal || document.body;
    if (raiz.parentElement !== alvo) {
      const foco = raiz.contains(document.activeElement) ? document.activeElement : null;
      alvo.append(raiz);
      foco?.focus();
    }
  };
  new MutationObserver(acompanhaModal).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
  document.addEventListener('close', () => setTimeout(acompanhaModal, 0), true);
  const $ = (s) => raiz.querySelector(s);
  const painel = $('#cc-painel');
  let catalogo = null;

  const marca = (estado, texto) => { painel.dataset.estado = estado; $('#cc-indicador').textContent = texto; };
  const abre = (sim = painel.hidden) => {
    painel.hidden = !sim;
    $('#cc-abre').setAttribute('aria-expanded', String(sim));
    if (sim) { $('#cc-campo').focus(); historico(); }
  };
  $('#cc-abre').addEventListener('click', () => abre());
  $('#cc-fecha').addEventListener('click', () => abre(false));
  document.addEventListener('keydown', (e) => { if (e.altKey && e.code === 'KeyJ') { e.preventDefault(); abre(); } });

  function desenhaPlano(exec, { vivo = false } = {}) {
    if (!exec) { $('#cc-plano').innerHTML = ''; return; }
    const atual = exec.passos.find((p) => ['executando', 'precisa_confirmar', 'precisa_esclarecer'].includes(p.estado));
    $('#cc-plano').innerHTML = `<p class="cc-sub">Plano${exec.interpretacao ? '' : ''} · <code title="correlation id">${esc(exec.id.slice(-6))}</code>${vivo ? ' · executando' : ''}</p>
      <ol class="cc-passos">${exec.passos.map((p) => {
        const [ic, rot] = PASSO[p.estado] || ['·', p.estado];
        return `<li class="cc-p cc-p-${p.estado}${p === atual ? ' cc-atual' : ''}"><span class="cc-ic" aria-hidden="true">${ic}</span>
          <span class="cc-p-texto"><b>${esc(p.descricao || p.acao)}</b> <small>${esc(p.acao)} · ${rot}${p.ms ? ` · ${p.ms} ms` : ''}</small>
          ${p.resultado && p.estado !== 'precisa_confirmar' ? `<span class="cc-p-res">${esc(p.resultado)}</span>` : ''}
          ${p.erro ? `<span class="cc-p-erro">${esc(p.erro)}</span>` : ''}</span></li>`;
      }).join('')}</ol>`;
  }

  async function historico() {
    try {
      const { execucoes } = await pede('/api/jarvis/execucoes?n=12');
      $('#cc-historico').innerHTML = execucoes.length ? execucoes.map((e) => `<li><button type="button" class="cc-h" data-cc-exec="${esc(e.id)}">
        <span class="cc-h-estado cc-h-${e.estado}" aria-hidden="true"></span><span>${esc(e.comando)}</span>
        <small>${new Date(e.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · ${esc({ concluida: 'concluída', falhou: 'falhou', esperando_confirmacao: 'esperando sim', esperando_esclarecimento: 'perguntou' }[e.estado] || e.estado)}</small></button></li>`).join('')
        : '<li class="cc-vazio">Nenhum comando ainda.</li>';
    } catch { /* sem servidor agora */ }
  }
  $('#cc-historico').addEventListener('click', (e) => { const b = e.target.closest('[data-cc-exec]'); if (b) aoAbrirExecucao(b.dataset.ccExec); });

  $('#cc-acoes-dobra').addEventListener('toggle', async () => {
    if (!$('#cc-acoes-dobra').open || catalogo) return;
    try {
      catalogo = (await pede('/api/acoes')).acoes;
      $('#cc-acoes').innerHTML = catalogo.map((a) => `<li><b>${esc(a.nome)}</b> <small class="cc-perm cc-perm-${a.permissao}">${a.permissao === 'livre' ? 'direto' : a.permissao === 'confirmar' ? 'pede sim' : 'depende'}</small><br><small>${esc(a.descricao)}</small></li>`).join('');
    } catch (e) { $('#cc-acoes').innerHTML = `<li class="cc-erro">${esc(e.message)}</li>`; }
  });

  /* mandar um comando: o plano aparece enquanto ele executa */
  let rodando = false;
  async function envia(texto, { porVoz = false } = {}) {
    const t = String(texto || '').trim();
    if (!t || rodando) return;
    rodando = true;
    abre(true);
    marca('processando', 'processando…');
    $('#cc-resultado').innerHTML = `<p class="cc-voce">${esc(t)}</p>`;
    $('#cc-sinal').hidden = true;
    desenhaPlano(null);
    const comecou = Date.now();
    // Enquanto o servidor trabalha, a execução que começou agora aparece com o passo de agora.
    const vigia = setInterval(async () => {
      try {
        const { execucoes } = await pede('/api/jarvis/execucoes?n=1');
        const e = execucoes[0];
        if (e && e.inicio >= comecou - 500 && rodando) desenhaPlano(e, { vivo: true });
      } catch { /* a próxima volta tenta de novo */ }
    }, 400);
    try {
      const r = await pede('/api/jarvis', { mensagem: t, cliente, origem: 'painel' });
      clearInterval(vigia);
      desenhaPlano(r.execucao);
      const falhou = r.execucao?.estado === 'falhou';
      $('#cc-resultado').innerHTML = `<p class="cc-voce">${esc(t)}</p><p class="cc-resposta${falhou ? ' cc-erro' : ''}">${esc(r.resposta)}</p>`;
      $('#cc-sinal').hidden = !r.pendente;
      marca(falhou ? 'erro' : r.pendente ? 'esperando' : 'pronto', falhou ? 'falhou' : r.pendente ? 'esperando o seu sim' : 'pronto');
      if (porVoz && r.resposta) fala(r.resposta);
    } catch (e) {
      clearInterval(vigia);
      $('#cc-resultado').innerHTML = `<p class="cc-voce">${esc(t)}</p><p class="cc-resposta cc-erro">${esc(e.message)}</p>`;
      marca('erro', 'erro');
    } finally {
      rodando = false;
      historico();
      aoTerminar();
    }
  }
  $('#cc-form').addEventListener('submit', (e) => { e.preventDefault(); const c = $('#cc-campo'); envia(c.value); c.value = ''; });
  $('#cc-sinal').addEventListener('click', (e) => { const b = e.target.closest('[data-cc-sinal]'); if (b) envia(b.dataset.ccSinal === 'sim' ? 'sim' : 'não'); });

  /* a voz: grava até o silêncio, transcreve no servidor e manda */
  let gravando = null;
  async function ouve() {
    if (gravando) { gravando(); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { marca('erro', 'sem microfone neste navegador'); return; }
    let fluxo;
    try { fluxo = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { marca('erro', 'microfone bloqueado'); return; }
    const rec = new MediaRecorder(fluxo);
    const pedacos = [];
    rec.ondataavailable = (e) => { if (e.data.size) pedacos.push(e.data); };
    const ctx = new AudioContext();
    const an = ctx.createAnalyser();
    ctx.createMediaStreamSource(fluxo).connect(an);
    const buf = new Float32Array(an.fftSize);
    let falou = false; let silencio = 0; const ini = performance.now();
    const para = () => { if (rec.state !== 'inactive') rec.stop(); };
    gravando = para;
    marca('ouvindo', 'ouvindo…');
    $('#cc-mic').classList.add('ligado');
    const mede = () => {
      if (rec.state === 'inactive') return;
      an.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((a, v) => a + v * v, 0) / buf.length);
      const agora = performance.now();
      if (rms > 0.025) { falou = true; silencio = 0; } else if (falou && !silencio) silencio = agora;
      if ((falou && silencio && agora - silencio > 1200) || (!falou && agora - ini > 7000) || agora - ini > 20000) para(); else requestAnimationFrame(mede);
    };
    requestAnimationFrame(mede);
    rec.onstop = async () => {
      fluxo.getTracks().forEach((x) => x.stop()); ctx.close().catch(() => {});
      gravando = null;
      $('#cc-mic').classList.remove('ligado');
      if (!falou) { marca('pronto', 'pronto'); return; }
      marca('processando', 'entendendo a fala…');
      try {
        const blob = new Blob(pedacos, { type: rec.mimeType || 'audio/webm' });
        const r = await fetch('/api/jarvis/ouvir', { method: 'POST', headers: { 'content-type': blob.type }, body: blob });
        const c = await r.json();
        if (!r.ok) throw new Error(c.erro || 'não entendi o áudio');
        if (c.texto) envia(c.texto, { porVoz: true }); else marca('pronto', 'não ouvi nada');
      } catch (e) { marca('erro', e.message); }
    };
    rec.start(250);
  }
  $('#cc-mic').addEventListener('click', ouve);

  async function fala(texto) {
    try {
      const r = await fetch('/api/jarvis/falar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ texto }) });
      if (!r.ok || r.status === 204) return;
      const url = URL.createObjectURL(await r.blob());
      const a = new Audio(url);
      a.onended = () => URL.revokeObjectURL(url);
      await a.play();
    } catch { /* sem voz, fica o texto */ }
  }

  return {
    abre, envia, raiz,
    /** Mostrar ou esconder (na tela do próprio Jarvis ele some: lá o Jarvis já é a tela inteira). */
    visivel(sim) { raiz.hidden = !sim; },
    fecha() { if (painel.hidden) return false; abre(false); return true; },
    aberto: () => !painel.hidden,
  };
}
