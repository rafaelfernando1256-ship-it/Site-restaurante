/**
 * O JARVIS NA TELA — núcleo vivo, conversa por voz e por texto.
 *
 * A voz: o microfone grava enquanto você fala e para sozinho quando você
 * fica em silêncio; o áudio vai para o Whisper do Groq (pelo servidor) e
 * vira texto. A resposta volta falada na voz que você escolheu (o servidor
 * transforma o texto em MP3; sem internet, a voz do navegador).
 * Um sim falado ou digitado ("sim", "pode", "manda ver"…) ou o botão Sim executa o que estava pendente.
 *
 * A IMERSÃO: "Jarvis, imersão total" (ou o botão) põe a tela cheia com o
 * núcleo no centro. Quando a resposta traz um gráfico, uma apresentação ou
 * um projeto pronto, ela entra sozinha e o palco abre ao lado do núcleo.
 * Esc ou "sai da imersão" volta.
 */
import { desenhaVisual, soltaGraficos } from './jarvis-visual.js';

const ESTADOS = {
  parado: { cor: [77, 163, 255], texto: 'Diga alguma coisa ou toque no microfone' },
  ouvindo: { cor: [77, 163, 255], texto: 'Ouvindo…' },
  pensando: { cor: [143, 156, 255], texto: 'Pensando…' },
  falando: { cor: [124, 200, 255], texto: '' },
  executando: { cor: [79, 214, 232], texto: 'Trabalhando…' },
  confirmar: { cor: [195, 228, 255], texto: 'Esperando o seu sim' },
};
const AQUI = /^(127\.0\.0\.1|localhost|\[::1\])$/.test(location.hostname);
// Comandos curtos que a tela resolve sozinha, sem ir ao servidor.
const PROXIMO = /^(pr[óo]xim[oa]|avan[çc]a|seguinte|passa)\b/i;
const ANTERIOR = /^(volt[ae]|anterior|retorna)\b/i;
// A câmera do 3D, por voz: resolvida na tela, na hora.
const CAMERA = [
  [/\b(de cima|vista de cima|planta baixa|visto de cima)\b/i, 'cima'],
  [/\b(d[áa] uma volta|volta completa|gir[ae]|passeio|tour)\b/i, 'volta'],
  [/\b(entr[ae]|por dentro|l[áa] dentro)\b/i, 'dentro'],
  [/\b(de frente|de fora|vista geral|de longe)\b/i, 'inicio'],
];
const PAREDE = /\b(?:olh[ae]|mostr[ae]|v[êe]|ver|vai)\b.*\b(?:parede\s+(?:d[oa]\s+)?(fundo|frente|esquerda|direita)|(espelhos?))\b/i;
const APRESENTA = /^(apresent[ae](?:\s+(?:pra|para)\s+mim)?|come[çc]a\s+a\s+apresenta[çc][ãa]o|ensaia(?:\s+comigo)?)[.!]?$/i;
// "Fecha o projeto" com um projeto na tela fecha a janela dele (o projeto continua como estava; arquivar e encerrar são outra coisa).
const FECHA = /^(fech[ae]r?|tir[ae])\b.{0,25}\b(gr[áa]fico|slides?|apresenta\w*|tabela|isso|tela|projeto|janela|3d)\b/i;
// "Solta o gráfico", "destaca isso": o que está na tela cheia vira uma janela solta.
const SOLTA = /^(solt[ae]|destac[ae])\b(.{0,25}\b(gr[áa]fico|isso|ele|tabela|slides?)\b)?[.!]?$/i;
// "Fecha os gráficos", "fecha as janelas": fecha todas as janelas soltas.
const FECHA_SOLTOS = /^(fech[ae]r?|tir[ae])\b.{0,20}\b(gr[áa]ficos|janelas|todos|todas)\b/i;
const SETORES = { cacador: 'Caçadores', vendedor: 'Vendedor', estudio: 'Estúdio', publicador: 'Publicador', dominio: 'Domínio' };
const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const guarda = { le: (k, p) => { try { const v = localStorage.getItem(k); return v === null ? p : JSON.parse(v); } catch { return p; } },
  poe: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento */ } } };

/* ── o núcleo: pontos numa esfera, com luz que soma ─────────────── */
function nucleo(canvas) {
  const ctx = canvas.getContext('2d');
  const N = 1100;
  const pontos = [];
  for (let i = 0; i < N; i += 1) {
    const y = 1 - (i / (N - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const fi = i * Math.PI * (3 - Math.sqrt(5));
    pontos.push({ x: Math.cos(fi) * r, y, z: Math.sin(fi) * r, semente: Math.random() * 6.283 });
  }
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let estado = 'parado';
  let cor = [...ESTADOS.parado.cor];
  let nivel = 0;      // 0..1, o volume da voz (sua ou dele)
  let alvoNivel = 0;
  let giro = 0;
  let t = 0;
  let largura = 0; let altura = 0; let dpr = 1;
  const mede = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    largura = canvas.clientWidth; altura = canvas.clientHeight;
    canvas.width = Math.round(largura * dpr); canvas.height = Math.round(altura * dpr);
  };
  new ResizeObserver(mede).observe(canvas);
  mede();

  const desenha = () => {
    t += 1 / 60;
    nivel += (alvoNivel - nivel) * 0.18;
    const alvo = ESTADOS[estado].cor;
    for (let k = 0; k < 3; k += 1) cor[k] += (alvo[k] - cor[k]) * 0.06;
    const velocidade = { parado: 0.0022, ouvindo: 0.003, pensando: 0.011, falando: 0.004, executando: 0.007, confirmar: 0.0015 }[estado];
    giro += quieto ? 0 : velocidade;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, largura, altura);
    const cx = largura / 2; const cy = altura / 2;
    const R = Math.min(largura, altura) * 0.3;
    const respira = quieto ? 0 : Math.sin(t * 1.1) * 0.015;
    // o brilho de fundo: a luz que o núcleo emite
    const halo = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * (1.9 + nivel * 0.6));
    halo.addColorStop(0, `rgba(${cor.map(Math.round).join(',')},${0.16 + nivel * 0.2})`);
    halo.addColorStop(1, 'rgba(18,24,38,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, largura, altura);
    ctx.globalCompositeOperation = 'lighter';
    const cs = Math.cos(giro); const sn = Math.sin(giro);
    const inclina = 0.38; const ci = Math.cos(inclina); const si = Math.sin(inclina);
    for (const p of pontos) {
      // a superfície ondula com a voz; pensando, ela tremula em faixas
      const onda = estado === 'pensando'
        ? Math.sin(p.y * 9 + t * 5) * 0.035
        : Math.sin(p.semente + t * (1.5 + nivel * 6)) * (0.02 + nivel * 0.16);
      const raio = R * (1 + respira + onda + (estado === 'executando' ? Math.max(0, Math.sin(p.y * 4 - t * 4)) * 0.05 : 0));
      let x = p.x * cs - p.z * sn; let z = p.x * sn + p.z * cs; let y = p.y;
      const y2 = y * ci - z * si; z = y * si + z * ci; y = y2;
      const perto = (z + 1) / 2; // 0 longe, 1 perto
      const tam = 0.6 + perto * 1.5;
      ctx.fillStyle = `rgba(${cor.map(Math.round).join(',')},${0.12 + perto * 0.7})`;
      ctx.beginPath();
      ctx.arc(cx + x * raio, cy + y * raio, tam, 0, 6.283);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    if (!quieto) requestAnimationFrame(desenha);
  };
  desenha();
  return {
    estado: (e) => { estado = ESTADOS[e] ? e : 'parado'; if (quieto) requestAnimationFrame(desenha); },
    nivel: (n) => { alvoNivel = Math.max(0, Math.min(1, n)); },
  };
}

/* ── a voz dele: a voz do sistema, em português ─────────────────── */
function vozes() {
  const lista = speechSynthesis?.getVoices?.() || [];
  const br = lista.filter((v) => /pt[-_]BR/i.test(v.lang));
  return br.find((v) => /antonio|daniel|thiago|ricardo|male|masculin/i.test(v.name)) || br.find((v) => /google/i.test(v.name)) || br[0] || lista.find((v) => /^pt/i.test(v.lang)) || null;
}

/* ── a tela ─────────────────────────────────────────────────────── */
export function montaJarvis(raiz, { pede, cheio = false, ativo = () => true, cabecalhos = () => ({}), cliente = '' } = {}) {
  raiz.innerHTML = `
  <div class="jv${cheio ? ' cheio' : ''}" data-estado="parado">
    <aside class="jv-lado jv-esq" id="jv-esq" aria-label="Agentes e sistema">
      <button type="button" class="jv-fecha-folha" data-folha="" aria-label="Fechar">Fechar</button>
      <div class="jv-marca"><b>Jarvis</b><span id="jv-relogio"></span></div>
      <section class="jv-bloco" aria-labelledby="jv-h-agentes"><h3 id="jv-h-agentes">Seus agentes</h3><ul class="jv-lista" id="jv-agentes"></ul></section>
      <section class="jv-bloco" aria-labelledby="jv-h-sistema"><h3 id="jv-h-sistema">Ligações</h3><ul class="jv-lista" id="jv-sistema"></ul>
        <div class="jv-acoes"><button class="jv-bt" id="jv-instalar">Instalar o pacote de skills</button>
          ${AQUI ? '<button class="jv-bt" id="jv-celular" type="button">Ligar o celular</button>' : ''}</div></section>
    </aside>
    <main class="jv-centro">
      <nav class="jv-topo-celular" aria-label="Seções">
        <button type="button" class="jv-bt" data-folha="esq" aria-controls="jv-esq">Agentes</button>
        <span class="jv-topo-nome">Jarvis</span>
        <span class="jv-topo-dir"><button type="button" class="jv-bt" data-folha="conversa" aria-controls="jv-historico">Conversa</button>
        <button type="button" class="jv-bt" data-folha="dir" aria-controls="jv-dir">Projetos</button></span>
      </nav>
      <div class="jv-nucleo"><canvas id="jv-canvas" aria-hidden="true"></canvas><p class="jv-estado" id="jv-estado" aria-live="polite"></p></div>
      <div class="jv-fala" aria-live="polite"><p class="voce" id="jv-voce"></p><p id="jv-resposta">Às suas ordens.</p></div>
      <div class="jv-historico" id="jv-historico" role="region" aria-label="Conversa"></div>
      <div class="jv-baixo">
        <div class="jv-sinal" id="jv-sinal" role="group" aria-label="O Jarvis está pedindo a sua permissão" hidden>
          <span class="jv-sinal-texto"></span>
          <button type="button" class="jv-bt jv-bt-forte" data-sinal="sim">Sim</button>
          <button type="button" class="jv-bt" data-sinal="nao">Não</button>
        </div>
        <form class="jv-barra" id="jv-form">
          <button type="button" class="jv-mic" id="jv-mic" aria-label="Falar com o Jarvis (Ctrl+Espaço)" title="Falar (Ctrl+Espaço)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></button>
          <input class="jv-campo" id="jv-campo" autocomplete="off" placeholder="Peça qualquer coisa: abrir o Chrome, montar uma apresentação…" aria-label="Pedido para o Jarvis">
          <button class="jv-enviar" type="submit">Enviar</button>
        </form>
        <div class="jv-opcoes">
          <label><input type="checkbox" id="jv-falar"> Responder em voz alta</label>
          <label><input type="checkbox" id="jv-continuo"> Conversa contínua</label>
          <label><input type="checkbox" id="jv-legendas"> Legendas</label>
          <button type="button" class="jv-link" id="jv-voz">Voz e cérebro</button>
          <button type="button" class="jv-link jv-entrar" id="jv-entrar">Imersão total</button>
          ${cheio ? '<a class="jv-link" href="/#hoje">Voltar ao painel</a>' : '<a class="jv-link" href="/jarvis.html" target="_blank" rel="noopener">Abrir em tela cheia</a>'}
        </div>
      </div>
    </main>
    <section class="jv-palco" id="jv-palco" aria-label="O que o Jarvis está mostrando"></section>
    <div class="jv-soltos" id="jv-soltos"></div>
    <button type="button" class="jv-sair" id="jv-sair">Sair da imersão <kbd>Esc</kbd></button>
    <dialog class="jv-dialogo" id="jv-dialogo-celular" aria-labelledby="jv-h-celular">
      <h3 id="jv-h-celular">O Jarvis no seu celular</h3>
      <div id="jv-celular-corpo"><p class="jv-texto-suave">Abrindo o caminho de fora de casa…</p></div>
      <div class="jv-acoes"><button class="jv-bt" type="button" id="jv-celular-fecha">Fechar</button></div>
    </dialog>
    <dialog class="jv-dialogo jv-dialogo-voz" id="jv-dialogo-voz" aria-labelledby="jv-h-voz">
      <h3 id="jv-h-voz">A voz e o cérebro do Jarvis</h3>
      <div id="jv-voz-corpo"><p class="jv-texto-suave">Buscando as vozes…</p></div>
      <div class="jv-acoes"><button class="jv-bt" type="button" id="jv-voz-fecha">Fechar</button></div>
    </dialog>
    <aside class="jv-lado jv-dir" id="jv-dir" aria-label="Projetos">
      <button type="button" class="jv-fecha-folha" data-folha="" aria-label="Fechar">Fechar</button>
      <div id="jv-pede-caixa"></div>
      <section class="jv-bloco" aria-labelledby="jv-h-projetos"><h3 id="jv-h-projetos">Projetos</h3>
        <ul class="jv-lista" id="jv-projetos"></ul>
        <p class="jv-texto-suave" id="jv-sem-projetos">Peça uma apresentação, uma planilha com gráficos ou um resumo. O Claude Code faz em segundo plano, numa pasta em Documentos › Jarvis.</p></section>
    </aside>
  </div>`;
  const $ = (s) => raiz.querySelector(s);
  const casca = $('.jv');
  const luz = nucleo($('#jv-canvas'));
  const falarLigado = guarda.le('jarvis-falar', true);
  $('#jv-falar').checked = falarLigado;
  $('#jv-continuo').checked = guarda.le('jarvis-continuo', false);
  $('#jv-legendas').checked = guarda.le('jarvis-legendas', false);
  // Sem legendas, a tela é só o núcleo: o que você falou e o que ele respondeu não aparecem escritos
  // (continuam na gaveta Conversa). Com a voz desligada, as legendas voltam: senão a resposta não chegaria.
  const legendas = () => casca.classList.toggle('sem-legenda', !$('#jv-legendas').checked && $('#jv-falar').checked);
  $('#jv-falar').addEventListener('change', (e) => { guarda.poe('jarvis-falar', e.target.checked); legendas(); });
  $('#jv-continuo').addEventListener('change', (e) => guarda.poe('jarvis-continuo', e.target.checked));
  $('#jv-legendas').addEventListener('change', (e) => { guarda.poe('jarvis-legendas', e.target.checked); legendas(); });
  legendas();

  let estadoAtual = 'parado';
  let pendente = null;
  const muda = (e) => {
    estadoAtual = e;
    casca.dataset.estado = e;
    luz.estado(e);
    $('#jv-estado').textContent = ESTADOS[e]?.texto || '';
  };
  const voltaAoNormal = () => muda(pendente ? 'confirmar' : 'parado');

  /* o relógio */
  const relogio = () => { $('#jv-relogio').textContent = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
  relogio(); setInterval(relogio, 20_000);

  /* a conversa */
  const historico = $('#jv-historico');
  const poeHistorico = (lista) => {
    // A última troca (sua fala e a resposta) já está em destaque, em cima.
    const fim = lista.length >= 2 && lista[lista.length - 1].quem === 'jarvis' && lista[lista.length - 2].quem === 'voce' ? -2 : -1;
    historico.innerHTML = lista.slice(0, fim).map((m) => `<div class="jv-msg ${m.quem === 'voce' ? 'voce' : 'jarvis'}">${esc(m.texto)}${
      (m.feitas || []).map((f) => `<span class="feito">${esc(f.descricao || f.ferramenta.replace(/_/g, ' '))}</span>`).join('')}${
      m.pede ? `<span class="pede">pediu confirmação: ${esc(m.pede)}</span>` : ''}</div>`).join('');
    historico.scrollTop = historico.scrollHeight;
  };
  const mostraPede = () => {
    $('#jv-pede-caixa').innerHTML = pendente ? `<div class="jv-pede" role="status"><p><strong>Esperando você</strong></p><p>${esc(pendente.descricao)}</p>
      <p class="jv-texto-suave">Diga “sim” (ou “pode”, “manda ver”…) ou toque em Sim. “Não” cancela.</p></div>` : '';
    // O sinal na tela, junto da barra: Sim ou Não, sem precisar falar.
    const sinal = $('#jv-sinal');
    sinal.hidden = !pendente;
    if (pendente) sinal.querySelector('.jv-sinal-texto').textContent = pendente.descricao;
  };

  /* falar: na voz escolhida (MP3 do servidor); sem ela, a voz do navegador */
  const tocador = new Audio();
  tocador.preload = 'auto';
  let ctxAudio = null; let medidor = null;
  const medida = new Uint8Array(512);
  let vozDoNavegador = false; // a escolhida é a do navegador, ou o servidor não tem voz
  let vezDaFala = 0;          // cada fala nova cala a anterior
  let terminaAtual = null;
  // O medidor (para o núcleo pulsar com a voz) só liga com o áudio do navegador já acordado:
  // ligado antes, o som sairia mudo.
  const ligaMedidor = () => {
    if (medidor || !ctxAudio || ctxAudio.state !== 'running') return;
    try {
      const fonte = ctxAudio.createMediaElementSource(tocador);
      medidor = ctxAudio.createAnalyser(); medidor.fftSize = 512;
      fonte.connect(medidor); medidor.connect(ctxAudio.destination);
    } catch { medidor = null; }
  };
  const buscaAudio = async (t, outra) => {
    const r = await fetch('/api/jarvis/falar', { method: 'POST', headers: { 'content-type': 'application/json', ...cabecalhos() },
      body: JSON.stringify({ texto: t, ...(outra || {}) }) });
    if (r.status === 204) return null;
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.erro || `erro ${r.status}`); }
    return URL.createObjectURL(await r.blob());
  };
  const tocaUrl = (url) => new Promise((ok) => {
    ligaMedidor();
    tocador.src = url;
    muda('falando');
    const anima = setInterval(() => {
      if (medidor) {
        medidor.getByteTimeDomainData(medida);
        let pico = 0;
        for (const v of medida) pico = Math.max(pico, Math.abs(v - 128));
        luz.nivel(Math.min(1, pico / 60));
      } else if (!tocador.paused) luz.nivel(0.25 + Math.random() * 0.3);
    }, 50);
    let feito = false;
    const fim = (tocou = true) => {
      if (feito) return; feito = true;
      clearInterval(anima); luz.nivel(0);
      tocador.onended = tocador.onerror = null;
      if (terminaAtual === fim) terminaAtual = null;
      URL.revokeObjectURL(url);
      ok(tocou);
    };
    terminaAtual = fim;
    tocador.onended = () => fim(true);
    tocador.onerror = () => fim(false);
    tocador.play().catch(() => fim(false)); // o navegador não deixou tocar (sem toque na página ainda)
  });
  const paraDeFalar = () => {
    vezDaFala += 1;
    speechSynthesis?.cancel?.();
    tocador.pause();
    terminaAtual?.();
  };
  const pausaVoz = (pausar) => {
    if (pausar) { tocador.pause(); speechSynthesis?.pause?.(); } else { if (tocador.src && !tocador.ended) tocador.play().catch(() => {}); speechSynthesis?.resume?.(); }
  };
  // A primeira frase vai sozinha (começa a falar mais cedo); o resto, em pedaços maiores.
  const emPedacos = (t, primeiro, depois) => {
    const frases = String(t || '').replace(/https?:\/\/\S+/g, 'o link').match(/[^.!?]+[.!?]*\s*/g) || [];
    const grupos = [];
    for (const f of frases) {
      const limite = grupos.length <= 1 ? primeiro : depois;
      if (grupos.length && (grupos[grupos.length - 1] + f).length < limite) grupos[grupos.length - 1] += f; else grupos.push(f);
    }
    return grupos.map((g) => g.trim()).filter(Boolean);
  };
  const fala = async (textoFala, { sempre = false } = {}) => {
    paraDeFalar();
    const minha = vezDaFala;
    if (!sempre && !$('#jv-falar').checked) return;
    const vale = () => minha === vezDaFala && !(narrando?.parar && sempre);
    if (!vozDoNavegador) {
      const grupos = emPedacos(textoFala, 160, 450);
      const busca = [];
      const pega = (i) => (busca[i] ??= buscaAudio(grupos[i]).catch(() => undefined));
      for (let i = 0; i < grupos.length; i += 1) {
        const url = await pega(i);
        if (i + 1 < grupos.length) pega(i + 1); // a próxima já vai sendo feita enquanto esta toca
        if (!vale()) { if (url) URL.revokeObjectURL(url); return; }
        if (url === null) { vozDoNavegador = true; return falaNoNavegador(grupos.slice(i).join(' '), { sempre, minha }); }
        if (url === undefined || !(await tocaUrl(url))) { if (vale()) await falaNoNavegador(grupos[i], { sempre, minha }); }
      }
      return;
    }
    return falaNoNavegador(textoFala, { sempre, minha });
  };
  // A voz do navegador: texto longo vai em pedaços de frase (algumas vozes do Chrome param depois de uns 15 segundos).
  const falaNoNavegador = async (textoFala, { sempre, minha }) => {
    for (const g of emPedacos(textoFala, 220, 220)) {
      if (minha !== vezDaFala || (narrando?.parar && sempre)) break;
      await falaUm(g, { sempre });
    }
  };
  const falaUm = (textoFala, { sempre = false } = {}) => new Promise((ok) => {
    if ((!sempre && !$('#jv-falar').checked) || !window.speechSynthesis || !textoFala) { ok(); return; }
    const u = new SpeechSynthesisUtterance(textoFala);
    const v = vozes();
    if (v) u.voice = v;
    u.lang = v?.lang || 'pt-BR';
    u.rate = 1.04;
    let pulso = 0;
    const anima = setInterval(() => { pulso *= 0.8; luz.nivel(0.25 + pulso + Math.random() * 0.15); }, 60);
    u.onboundary = () => { pulso = 0.45; };
    u.onstart = () => muda('falando');
    // Algumas vozes nunca avisam que terminaram: um limite pelo tamanho da frase segura a fila.
    let feito = false;
    const fim = () => { if (feito) return; feito = true; clearInterval(anima); clearTimeout(limite); luz.nivel(0); ok(); };
    const limite = setTimeout(() => { if (!speechSynthesis.paused) fim(); }, 4000 + textoFala.length * 110);
    u.onend = u.onerror = fim;
    speechSynthesis.speak(u);
  });

  // O navegador só deixa a página tocar som depois de um toque ou tecla: o primeiro destrava a voz.
  const SILENCIO = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  const destrava = () => {
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch { /* sem voz */ }
    try {
      ctxAudio ??= new (window.AudioContext || window.webkitAudioContext)();
      ctxAudio.resume?.().then(ligaMedidor).catch(() => {});
    } catch { ctxAudio = null; }
    if (!tocador.src || tocador.ended || tocador.paused) { tocador.src = SILENCIO; tocador.play().catch(() => {}); }
    document.removeEventListener('pointerup', destrava);
    document.removeEventListener('keydown', destrava);
  };
  document.addEventListener('pointerup', destrava);
  document.addEventListener('keydown', destrava);

  /* escolher a voz (e quem pensa) */
  const dialogoVoz = $('#jv-dialogo-voz');
  let listaDeVozes = null;
  const ouvindoAmostra = { id: null };
  const desenhaVozes = (d, cerebro) => {
    const e = d.escolha || {};
    const atual = (v) => v.id === e.id || (!e.id && v.id === 'ko:bm_george');
    const cartao = (v) => `<li class="jv-voz${atual(v) ? ' escolhida' : ''}" data-id="${esc(v.id)}">
      <div><b>${esc(v.nome)}</b><small>${esc(v.descricao || '')}</small></div>
      <div class="jv-voz-bts"><button type="button" class="jv-bt" data-ouvir="${esc(v.id)}">Ouvir</button>
      ${atual(v) ? '<span class="jv-voz-marca">Em uso</span>' : `<button type="button" class="jv-bt" data-usar="${esc(v.id)}">Usar esta</button>`}</div></li>`;
    const idAtual = e.id || 'ko:bm_george';
    const doKokoro = idAtual.startsWith('ko:');
    const ajustavel = !idAtual.startsWith('el:') && idAtual !== 'navegador';
    const base = [...(d.kokoro?.vozes || []), ...d.modelos, ...d.outras].find(atual);
    const k = d.kokoro || {};
    const cartaoKokoro = (v) => (k.instalado ? cartao(v) : `<li class="jv-voz${atual(v) ? ' escolhida' : ''}" data-id="${esc(v.id)}">
      <div><b>${esc(v.nome)}</b><small>${esc(v.descricao || '')}</small></div>
      <div class="jv-voz-bts">${atual(v) ? '<span class="jv-voz-marca">Em uso quando instalar</span>' : `<button type="button" class="jv-bt" data-usar="${esc(v.id)}">Usar esta</button>`}</div></li>`);
    const estadoKokoro = k.instalado ? ''
      : k.instalando ? `<p class="jv-kokoro-anda" role="status">Instalando: ${esc(k.etapa || '')}… ${Math.round((k.progresso || 0) * 100)}%. Enquanto isso, ele fala com a voz da Microsoft.</p>`
        : `<p class="jv-texto-suave">${k.erro ? `A instalação parou: ${esc(k.erro)}. ` : ''}Roda no seu notebook, sem internet. Na primeira vez baixa o motor e as vozes (uns 200 MB).</p>
          <button type="button" class="jv-bt jv-bt-forte" data-kokoro="instalar">${k.erro ? 'Tentar de novo' : 'Instalar as vozes do Kokoro'}</button>`;
    const tom = e.tom ?? base?.tom ?? 0; const vel = e.velocidade ?? base?.velocidade ?? 0;
    $('#jv-voz-corpo').innerHTML = `
      <fieldset class="jv-cerebro"><legend>Quem pensa</legend>
        <label><input type="radio" name="jv-cerebro" value="claude" ${cerebro?.escolhido !== 'groq' ? 'checked' : ''}> <span><b>Claude</b><small>Pela sua assinatura. Pensa melhor, pesquisa na web e lembra a conversa toda. Leva uns segundos a mais.</small></span></label>
        ${cerebro?.modelos ? `<div class="jv-modo"${cerebro.escolhido === 'groq' ? ' hidden' : ''}>
          <div class="jv-modo-grupo" role="radiogroup" aria-label="Modelo do Claude"><span>Modelo</span>${Object.entries(cerebro.modelos).map(([k, m]) => `<label title="${esc(m.descricao)}"><input type="radio" name="jv-modelo" value="${k}" ${cerebro.modo.modelo === k ? 'checked' : ''}><span>${esc(m.nome)}</span></label>`).join('')}</div>
          <div class="jv-modo-grupo" role="radiogroup" aria-label="Esforço do Claude"><span>Esforço</span>${Object.entries(cerebro.esforcos).map(([k, e]) => `<label title="${esc(e.descricao)}"><input type="radio" name="jv-esforco" value="${k}" ${cerebro.modo.esforco === k ? 'checked' : ''}><span>${esc(e.nome)}</span></label>`).join('')}</div>
          <small class="jv-modo-dica">${esc(cerebro.modelos[cerebro.modo.modelo].nome)}: ${esc(cerebro.modelos[cerebro.modo.modelo].descricao.replace(/^./, (l) => l.toLowerCase()))} Esforço ${esc(cerebro.esforcos[cerebro.modo.esforco].nome.toLowerCase())}: ${esc(cerebro.esforcos[cerebro.modo.esforco].descricao.toLowerCase())}</small>
        </div>` : ''}
        <label><input type="radio" name="jv-cerebro" value="groq" ${cerebro?.escolhido === 'groq' ? 'checked' : ''}> <span><b>Groq</b><small>Mais rápido, mas mais limitado. É também a reserva quando o Claude não responde.</small></span></label>
      </fieldset>
      ${ajustavel ? `<h4>Ajuste da voz em uso <small>${esc(base?.nome || '')}</small></h4><div class="jv-ajuste">${doKokoro ? '' : `<label>Tom <input type="range" min="-25" max="25" step="1" id="jv-tom" value="${tom}"><output id="jv-tom-v">${tom > 0 ? '+' : ''}${tom}</output></label>`}
        <label>Velocidade <input type="range" min="-30" max="40" step="2" id="jv-vel" value="${vel}"><output id="jv-vel-v">${vel > 0 ? '+' : ''}${vel}%</output></label></div>` : ''}
      <h4>Kokoro <small>no seu notebook, sem internet</small></h4>
      ${estadoKokoro}
      <ul class="jv-vozes">${(k.vozes || []).map(cartaoKokoro).join('')}</ul>
      <h4>Vozes da Microsoft <small>grátis, sem chave</small></h4>
      ${d.microsoft_erro ? '<p class="jv-texto-suave">O serviço da Microsoft não respondeu agora (sem internet?). Ouça para testar: sem ele, o Jarvis fala com a voz do navegador.</p>' : ''}
      <ul class="jv-vozes">${d.modelos.map(cartao).join('')}</ul>
      <h4>ElevenLabs <small>as mais naturais</small></h4>
      ${d.eleven.ligado ? (d.eleven.erro ? `<p class="jv-texto-suave">${esc(d.eleven.erro)}</p>` : `<ul class="jv-vozes">${d.eleven.vozes.map(cartao).join('')}</ul>`)
        : '<p class="jv-texto-suave">Ponha a chave da ElevenLabs em Ajustes › Chaves (o plano grátis dá uns 10 minutos de fala por mês) e as vozes da sua conta aparecem aqui.</p>'}
      ${d.outras.length ? `<details><summary>Mais vozes da Microsoft (${d.outras.length})</summary><ul class="jv-vozes">${d.outras.map(cartao).join('')}</ul></details>` : ''}
      <ul class="jv-vozes">${cartao(d.navegador)}</ul>`;
  };
  // Enquanto o Kokoro instala, a janela acompanha o andamento.
  let acompanha = null;
  const acompanhaKokoro = () => {
    clearTimeout(acompanha);
    if (!dialogoVoz.open || !listaDeVozes?.kokoro?.instalando) return;
    acompanha = setTimeout(async () => {
      try {
        const [d, est] = await Promise.all([pede('/api/jarvis/vozes'), pede('/api/jarvis/estado')]);
        listaDeVozes = d; desenhaVozes(d, est.cerebro);
      } catch { /* tenta de novo */ }
      acompanhaKokoro();
    }, 2000);
  };
  const abreVozes = async () => {
    dialogoVoz.showModal();
    try {
      const [d, est] = await Promise.all([pede('/api/jarvis/vozes'), pede('/api/jarvis/estado')]);
      listaDeVozes = d;
      desenhaVozes(d, est.cerebro);
      acompanhaKokoro();
    } catch (err) { $('#jv-voz-corpo').innerHTML = `<p class="jv-texto-suave">${esc(err.message)}</p>`; }
  };
  const ajusteAtual = () => ({ ...($('#jv-tom') ? { tom: Number($('#jv-tom').value) } : {}), velocidade: Number($('#jv-vel')?.value ?? 0) });
  const ouveAmostra = async (id) => {
    paraDeFalar();
    const minha = vezDaFala;
    const escolhida = (listaDeVozes?.escolha?.id || 'ko:bm_george') === id;
    const ajuste = escolhida ? ajusteAtual() : {};
    if (id === 'navegador') { await falaNoNavegador(listaDeVozes.frase, { sempre: true, minha }); return; }
    const b = $(`[data-ouvir="${CSS.escape(id)}"]`);
    if (b) { b.disabled = true; b.textContent = 'Gerando…'; }
    try {
      const url = await buscaAudio(listaDeVozes.frase, { id, ...ajuste });
      if (b) { b.disabled = false; b.textContent = 'Ouvir'; }
      if (url && minha === vezDaFala) await tocaUrl(url);
    } catch (err) {
      if (b) { b.disabled = false; b.textContent = 'Ouvir'; b.closest('li')?.insertAdjacentHTML('beforeend', `<p class="jv-texto-suave jv-voz-erro">Não tocou: ${esc(err.message)}</p>`); }
    }
    voltaAoNormal();
  };
  const usaVoz = async (id, ajuste = {}) => {
    const r = await pede('/api/jarvis/voz/escolher', { id, ...ajuste });
    vozDoNavegador = id === 'navegador';
    const [d, est] = await Promise.all([pede('/api/jarvis/vozes'), pede('/api/jarvis/estado').catch(() => ({}))]);
    listaDeVozes = { ...d, escolha: r.escolha };
    desenhaVozes(listaDeVozes, est.cerebro);
    acompanhaKokoro();
  };
  $('#jv-voz').addEventListener('click', abreVozes);
  $('#jv-voz-fecha').addEventListener('click', () => { paraDeFalar(); clearTimeout(acompanha); dialogoVoz.close(); });
  dialogoVoz.addEventListener('click', async (e) => {
    const ouvir = e.target.closest('[data-ouvir]');
    const usar = e.target.closest('[data-usar]');
    if (ouvir) ouveAmostra(ouvir.dataset.ouvir);
    if (usar) {
      await usaVoz(usar.dataset.usar);
      // Voz do Kokoro ainda instalando: não tem o que ouvir ainda.
      if (!(usar.dataset.usar.startsWith('ko:') && !listaDeVozes.kokoro?.instalado)) ouveAmostra(usar.dataset.usar);
    }
    if (e.target.closest('[data-kokoro="instalar"]')) {
      listaDeVozes.kokoro = await pede('/api/jarvis/voz/instalar', {}).then((k) => ({ ...listaDeVozes.kokoro, ...k }));
      const est = await pede('/api/jarvis/estado').catch(() => ({}));
      desenhaVozes(listaDeVozes, est.cerebro);
      acompanhaKokoro();
    }
  });
  dialogoVoz.addEventListener('input', (e) => {
    if (e.target.id === 'jv-tom') $('#jv-tom-v').textContent = `${e.target.value > 0 ? '+' : ''}${e.target.value}`;
    if (e.target.id === 'jv-vel') $('#jv-vel-v').textContent = `${e.target.value > 0 ? '+' : ''}${e.target.value}%`;
  });
  dialogoVoz.addEventListener('change', async (e) => {
    if (e.target.name === 'jv-cerebro' || e.target.name === 'jv-modelo' || e.target.name === 'jv-esforco') {
      const corpo = e.target.name === 'jv-cerebro' ? { cerebro: e.target.value } : { [e.target.name === 'jv-modelo' ? 'modelo' : 'esforco']: e.target.value };
      await pede('/api/jarvis/cerebro', corpo).catch(() => {});
      const est = await pede('/api/jarvis/estado').catch(() => null);
      if (est && listaDeVozes) desenhaVozes(listaDeVozes, est.cerebro);
      sistema();
      return;
    }
    if (e.target.id === 'jv-tom' || e.target.id === 'jv-vel') {
      const id = listaDeVozes?.escolha?.id || 'ko:bm_george';
      await usaVoz(id, ajusteAtual());
      ouveAmostra(id);
    }
  });

  /* fora da imersão, só o núcleo: agentes, projetos e a conversa abrem numa gaveta (e fecham no mesmo botão, ou no Esc) */
  casca.addEventListener('click', (e) => {
    const b = e.target.closest('[data-folha]');
    if (!b) {
      // Clicou fora da gaveta aberta: ela fecha.
      if (casca.dataset.folha && !e.target.closest('.jv-lado, .jv-historico, dialog, .jv-solto')) delete casca.dataset.folha;
      return;
    }
    if (b.dataset.folha && casca.dataset.folha !== b.dataset.folha) casca.dataset.folha = b.dataset.folha; else delete casca.dataset.folha;
    for (const x of casca.querySelectorAll('.jv-topo-celular [data-folha]')) x.setAttribute('aria-expanded', String(x.dataset.folha === casca.dataset.folha));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && casca.dataset.folha) delete casca.dataset.folha; });

  /* ligar o celular: o QR code que você escaneia uma vez */
  const dialogo = $('#jv-dialogo-celular');
  $('#jv-celular')?.addEventListener('click', async () => {
    dialogo.showModal();
    const corpo = $('#jv-celular-corpo');
    corpo.innerHTML = '<p class="jv-texto-suave">Abrindo o caminho de fora de casa… na primeira vez pode levar um minuto.</p>';
    try {
      const r = await pede('/api/jarvis/celular', {});
      corpo.innerHTML = `<div class="jv-qr">${r.qr}</div>
        <ol class="jv-passos"><li>Aponte a câmera do celular para o QR code e abra o link.</li>
        <li>No menu do navegador, toque em <b>Adicionar à tela inicial</b>: o Jarvis vira um ícone.</li>
        <li>${r.fixo ? 'Pronto. Quando o endereço do notebook mudar, o celular acompanha sozinho: não precisa escanear de novo.' : esc(r.aviso)}</li></ol>
        ${r.fixo ? `<p class="jv-texto-suave">Endereço fixo do celular: ${esc(r.link)}. Ele só funciona com a chave que está no QR.</p>
        <button class="jv-bt" type="button" id="jv-celular-novo">Gerar um QR novo (desliga os celulares antigos)</button>` : ''}`;
      $('#jv-celular-novo')?.addEventListener('click', async () => {
        try { const n = await pede('/api/jarvis/celular', { novo: true }); corpo.querySelector('.jv-qr').innerHTML = n.qr; } catch (err) { corpo.insertAdjacentHTML('beforeend', `<p class="jv-texto-suave">${esc(err.message)}</p>`); }
      });
    } catch (err) {
      corpo.innerHTML = `<p class="jv-texto-suave">${esc(err.message)}</p>`;
    }
  });
  $('#jv-celular-fecha').addEventListener('click', () => dialogo.close());

  /* o palestrante: o Jarvis apresenta sozinho, falando cada slide */
  let narrando = null; // { parar, pausado }
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const falasDaApresentacao = async () => {
    const v = visualAtual;
    if (v?.tipo === 'slides') return v.slides.map((x) => x.fala || [x.titulo, ...x.pontos].join('. '));
    if (v?.tipo === 'projeto') {
      const base = v.url.replace(/[^/]*$/, '');
      const r = await fetch(`${base}falas.json`, { cache: 'no-store' }).catch(() => null);
      const lista = r?.ok ? await r.json().catch(() => null) : null;
      return Array.isArray(lista) ? lista.map((x) => (typeof x === 'string' ? x : x?.fala || '')).filter(Boolean) : null;
    }
    return null;
  };
  const apresenta = async () => {
    if (narrando) return;
    const falas = await falasDaApresentacao();
    if (!falas?.length) {
      $('#jv-resposta').textContent = visualAtual?.tipo === 'projeto'
        ? 'Este projeto não tem as falas dos slides. Peça: “escreve as falas da apresentação”.'
        : 'Não há apresentação na tela para eu apresentar.';
      return;
    }
    narrando = { parar: false, pausado: false };
    casca.classList.add('narrando');
    mostraControle();
    const quadro = palco.querySelector('iframe.jv-projeto')?.contentWindow;
    const inicio = slides?.atual ? slides.atual() : 0;
    for (let i = inicio; i < falas.length && !narrando.parar; i += 1) {
      if (slides?.vai) slides.vai(i); else quadro?.postMessage({ jarvis: 'slide', acao: 'ir', slide: i }, '*');
      $('#jv-voce').textContent = `Slide ${i + 1} de ${falas.length}`;
      $('#jv-resposta').textContent = falas[i];
      muda('falando');
      await fala(falas[i], { sempre: true });
      while (narrando.pausado && !narrando.parar) await espera(200);
      if (!narrando.parar) await espera(700);
    }
    const terminou = !narrando.parar;
    narrando = null;
    casca.classList.remove('narrando');
    mostraControle();
    voltaAoNormal();
    if (terminou) { $('#jv-resposta').textContent = 'Fim da apresentação.'; fala('Fim da apresentação.'); }
  };
  const pausa = () => {
    if (!narrando) return;
    narrando.pausado = !narrando.pausado;
    pausaVoz(narrando.pausado);
    mostraControle();
  };
  const paraDeApresentar = () => { if (!narrando) return; narrando.parar = true; narrando.pausado = false; paraDeFalar(); };
  // Os botões do palestrante, no canto do palco.
  const mostraControle = () => {
    let c = casca.querySelector('.jv-narrador');
    const podeApresentar = ['slides', 'projeto'].includes(casca.dataset.visual);
    if (!podeApresentar && !narrando) { c?.remove(); return; }
    if (!c) { c = document.createElement('div'); c.className = 'jv-narrador'; casca.append(c); }
    c.innerHTML = narrando
      ? `<button type="button" class="jv-bt" data-narra="pausa">${narrando.pausado ? 'Continuar' : 'Pausar'}</button><button type="button" class="jv-bt" data-narra="para">Parar</button>`
      : '<button type="button" class="jv-bt jv-bt-forte" data-narra="apresenta">Apresentar para mim</button>';
  };
  casca.addEventListener('click', (e) => {
    const b = e.target.closest('[data-narra]');
    if (!b) return;
    ({ apresenta, pausa, para: paraDeApresentar })[b.dataset.narra]?.();
  });

  /* a imersão */
  const palco = $('#jv-palco');
  let slides = null;   // { proximo, anterior } quando o palco mostra slides
  let cena3d = null;   // promessa do 3D na tela ({ vista, para })
  let visualAtual = null;
  let apertouF11 = false;
  const imerso = () => casca.classList.contains('imersao');
  const telaCheiaDeVerdade = () => Boolean(document.fullscreenElement) || matchMedia('(display-mode: fullscreen)').matches
    || (innerHeight >= screen.height - 2 && innerWidth >= screen.width - 2);
  const entraImersao = async () => {
    if (!imerso()) {
      casca.classList.add('imersao');
      document.documentElement.classList.add('jv-imerso');
    }
    if (telaCheiaDeVerdade()) return;
    // Logo depois de um clique, o Chrome deixa a página pedir tela cheia.
    // Depois de uma fala não deixa; aí o servidor aperta F11 no notebook.
    try { await document.documentElement.requestFullscreen({ navigationUI: 'hide' }); return; } catch { /* sem clique recente */ }
    if (AQUI && document.hasFocus()) {
      try { apertouF11 = (await pede('/api/jarvis/tela-cheia', {})).ok; } catch { /* fica a tela da janela */ }
    }
  };
  const fechaVisual = () => {
    paraDeApresentar();
    casca.querySelector('.jv-narrador')?.remove();
    cena3d?.then((c) => c?.para());
    cena3d = null; visualAtual = null; visualAtualId = null;
    casca.classList.remove('com-visual');
    delete casca.dataset.visual;
    soltaGraficos(palco);
    palco.replaceChildren();
    slides = null;
  };
  const saiImersao = async () => {
    fechaVisual();
    casca.classList.remove('imersao');
    document.documentElement.classList.remove('jv-imerso');
    if (document.fullscreenElement) { await document.exitFullscreen().catch(() => {}); return; }
    if (apertouF11) {
      apertouF11 = false;
      if (AQUI && document.hasFocus() && telaCheiaDeVerdade()) await pede('/api/jarvis/tela-cheia', {}).catch(() => {});
    }
  };
  const mostraVisual = async (visual, id = null) => {
    // Pedido solto: vai para uma janela que se arrasta, sem tela cheia.
    if (visual.solto) { abreSolto(visual, id); return; }
    await entraImersao();
    casca.classList.add('com-visual');
    casca.dataset.visual = visual.tipo;
    cena3d?.then((c) => c?.para());
    const r = desenhaVisual(palco, visual);
    slides = r.slides ? r : null;
    cena3d = r.cena || null;
    visualAtual = visual;
    visualAtualId = id;
    // Um gráfico na tela cheia também pode virar janela solta.
    if (!['projeto', 'cena3d'].includes(visual.tipo)) {
      const soltar = document.createElement('button');
      soltar.type = 'button'; soltar.className = 'jv-bt'; soltar.textContent = 'Soltar na tela';
      soltar.title = 'Vira uma janela que você arrasta e muda de tamanho';
      soltar.addEventListener('click', () => soltaOdaTela());
      (palco.querySelector('.jv-palco-pe') || palco).append(soltar);
    }
    palco.classList.remove('entra'); void palco.offsetWidth; palco.classList.add('entra');
    mostraControle();
  };
  /* ── as janelas soltas: gráficos que você arrasta, muda de tamanho e destaca ── */
  const camada = $('#jv-soltos');
  const soltos = new Map(); // chave → { card, visual, id }
  let visualAtualId = null;
  let zSolto = 10; let cascata = 0;
  const LEMBRA_SOLTOS = 'jarvis-soltos';
  const guardaSoltos = () => guarda.poe(LEMBRA_SOLTOS, [...soltos.values()].filter((x) => x.id).map((x) => ({
    id: x.id, left: x.card.style.left, top: x.card.style.top, width: x.card.style.width, height: x.card.style.height })));
  const dentroDaTela = (card) => {
    const r = card.getBoundingClientRect();
    card.style.left = `${Math.round(Math.max(-r.width + 120, Math.min(innerWidth - 80, r.left)))}px`;
    card.style.top = `${Math.round(Math.max(0, Math.min(innerHeight - 44, r.top)))}px`;
  };
  // Arrastar pela barra de cima; mudar de tamanho pelo canto de baixo. Dedo e mouse.
  const arrasta = (card, alca, mexe) => {
    alca.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || e.target.closest('button')) return;
      e.preventDefault();
      alca.setPointerCapture(e.pointerId);
      const inicio = { x: e.clientX, y: e.clientY, r: card.getBoundingClientRect() };
      card.classList.add('mexendo');
      const move = (ev) => mexe(inicio, ev.clientX - inicio.x, ev.clientY - inicio.y);
      const solta = () => {
        alca.removeEventListener('pointermove', move); alca.removeEventListener('pointerup', solta); alca.removeEventListener('pointercancel', solta);
        card.classList.remove('mexendo'); dentroDaTela(card); guardaSoltos();
      };
      alca.addEventListener('pointermove', move); alca.addEventListener('pointerup', solta); alca.addEventListener('pointercancel', solta);
    });
  };
  const fechaSolto = (chave) => {
    const x = soltos.get(chave);
    if (!x) return;
    soltaGraficos(x.card);
    x.card.remove();
    soltos.delete(chave);
    guardaSoltos();
  };
  const fechaSoltos = () => { for (const k of [...soltos.keys()]) fechaSolto(k); };
  const abreSolto = (visual, id = null, lugar = null) => {
    if (id && soltos.has(id)) { soltos.get(id).card.style.zIndex = ++zSolto; return; }
    while (soltos.size >= 6) fechaSolto(soltos.keys().next().value);
    const chave = id || `aqui-${Date.now()}`;
    const card = document.createElement('section');
    card.className = 'jv-solto';
    card.setAttribute('aria-label', visual.titulo);
    card.innerHTML = `<header class="jv-solto-barra" title="Arraste para mover"><h3></h3><div class="jv-solto-bts">
        ${AQUI && id ? '<button type="button" class="jv-bt" data-solto="janela" title="Abre numa janela própria, que vai para qualquer lugar da tela (até outro monitor)">Destacar</button>' : ''}
        <button type="button" class="jv-bt" data-solto="cheia">Tela cheia</button>
        <button type="button" class="jv-bt" data-solto="fecha">Fechar</button></div></header>
      <div class="jv-solto-corpo"></div>
      <span class="jv-solto-canto" aria-hidden="true" title="Arraste para mudar o tamanho"></span>`;
    card.querySelector('h3').textContent = visual.titulo;
    const largura = Math.min(['medidor', 'pizza', 'numeros'].includes(visual.tipo) ? 440 : 600, innerWidth - 24);
    const altura = Math.min(visual.tipo === 'numeros' ? 280 : 420, innerHeight - 100);
    Object.assign(card.style, lugar || {
      left: `${Math.max(12, innerWidth - largura - 32 - cascata * 36)}px`, top: `${72 + cascata * 36}px`,
      width: `${largura}px`, height: `${altura}px`,
    });
    cascata = (cascata + 1) % 5;
    card.style.zIndex = ++zSolto;
    camada.append(card);
    desenhaVisual(card.querySelector('.jv-solto-corpo'), visual, { compacto: true });
    soltos.set(chave, { card, visual, id });
    guardaSoltos();
    card.addEventListener('pointerdown', () => { card.style.zIndex = ++zSolto; });
    arrasta(card, card.querySelector('.jv-solto-barra'), (i, dx, dy) => {
      card.style.left = `${Math.round(i.r.left + dx)}px`; card.style.top = `${Math.round(Math.max(0, i.r.top + dy))}px`;
    });
    arrasta(card, card.querySelector('.jv-solto-canto'), (i, dx, dy) => {
      card.style.width = `${Math.round(Math.max(280, Math.min(innerWidth - 8, i.r.width + dx)))}px`;
      card.style.height = `${Math.round(Math.max(200, Math.min(innerHeight - 8, i.r.height + dy)))}px`;
    });
    card.addEventListener('click', (e) => {
      const b = e.target.closest('[data-solto]');
      if (!b) return;
      if (b.dataset.solto === 'fecha') fechaSolto(chave);
      if (b.dataset.solto === 'cheia') { fechaSolto(chave); mostraVisual({ ...visual, solto: false }, id); }
      if (b.dataset.solto === 'janela') {
        // Uma janela do próprio navegador: sai de dentro do Jarvis e vai para onde você quiser.
        const r = card.getBoundingClientRect();
        const aberta = window.open(`/jarvis-grafico.html?id=${encodeURIComponent(id)}`, `jarvis-${id}`,
          `popup=yes,width=${Math.round(r.width)},height=${Math.round(r.height)},left=${Math.round(screenX + r.left)},top=${Math.round(screenY + r.top + 60)}`);
        if (aberta) fechaSolto(chave);
      }
    });
  };
  // O que está na tela cheia vira janela solta, e a tela cheia fecha.
  const soltaOdaTela = () => {
    if (!visualAtual || ['projeto', 'cena3d'].includes(visualAtual.tipo)) return false;
    const v = visualAtual; const id = visualAtualId;
    fechaVisual();
    abreSolto(v, id);
    return true;
  };
  // As janelas que estavam abertas voltam quando a página recarrega (enquanto a Matilha guarda o gráfico).
  (async () => {
    for (const x of guarda.le(LEMBRA_SOLTOS, [])) {
      try {
        const v = await pede(`/api/jarvis/visual?id=${encodeURIComponent(x.id)}`);
        if (v?.visual) abreSolto({ ...v.visual, solto: true }, x.id, { left: x.left, top: x.top, width: x.width, height: x.height });
      } catch { /* a Matilha reiniciou: esse gráfico já não existe */ }
    }
  })();
  addEventListener('resize', () => { for (const x of soltos.values()) dentroDaTela(x.card); });

  /** "Mostra de cima", "entra", "olha a parede do fundo": só quando há um 3D na tela. */
  const cameraPorVoz = (t) => {
    if (!['cena3d', 'projeto'].includes(casca.dataset.visual) || /imers|tela cheia/i.test(t)) return null;
    const p = t.match(PAREDE);
    if (p) {
      if (p[1]) return { vista: 'parede', parede: p[1].toLowerCase() };
      const espelho = (visualAtual?.cena?.pecas || []).filter((x) => x.tipo === 'espelho').sort((a, b) => b.l - a.l)[0];
      return { vista: 'parede', parede: espelho?.parede || 'fundo' };
    }
    const achou = CAMERA.find(([re]) => re.test(t));
    return achou ? { vista: achou[1] } : null;
  };
  $('#jv-entrar').addEventListener('click', () => { entraImersao(); });
  $('#jv-sair').addEventListener('click', () => { saiImersao(); });
  document.addEventListener('fullscreenchange', () => {
    // Esc numa tela cheia pedida pela página: o navegador sai dela, e a imersão vai junto.
    if (!document.fullscreenElement && imerso() && !apertouF11) saiImersao();
  });
  document.addEventListener('keydown', (e) => {
    if (!imerso() || !ativo()) return;
    const digitando = e.target.closest?.('input, textarea, select, [contenteditable]');
    if (e.key === 'Escape') { e.preventDefault(); if (narrando) paraDeApresentar(); else saiImersao(); return; }
    if (narrando && e.key === ' ' && !digitando) { e.preventDefault(); pausa(); return; }
    if (digitando || !slides) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); slides.proximo(); }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); slides.anterior(); }
  });

  /* mandar um pedido */
  const envia = async (mensagem) => {
    const t = String(mensagem || '').trim();
    if (!t) return;
    // "Próximo", "volta", "fecha o gráfico": a tela resolve na hora.
    const curto = t.replace(/^jarvis[,.!]?\s*/i, '');
    if (curto.split(/\s+/).length <= 5) {
      // Num projeto (a página do Claude Code), "próximo" vai como mensagem para ela.
      const quadro = casca.dataset.visual === 'projeto' ? palco.querySelector('iframe.jv-projeto')?.contentWindow : null;
      const paraOQuadro = (acaoSlide) => () => quadro.postMessage({ jarvis: 'slide', acao: acaoSlide }, '*');
      const acao = slides && PROXIMO.test(curto) ? slides.proximo : slides && ANTERIOR.test(curto) ? slides.anterior
        : quadro && PROXIMO.test(curto) ? paraOQuadro('proximo') : quadro && ANTERIOR.test(curto) ? paraOQuadro('anterior')
          : soltos.size && FECHA_SOLTOS.test(curto) ? fechaSoltos
            : visualAtual && SOLTA.test(curto) ? soltaOdaTela
              : casca.classList.contains('com-visual') && FECHA.test(curto) ? fechaVisual
                : !casca.classList.contains('com-visual') && soltos.size && FECHA.test(curto) ? fechaSoltos : null;
      const camera = cameraPorVoz(curto);
      if (APRESENTA.test(curto) && ['slides', 'projeto'].includes(casca.dataset.visual)) {
        $('#jv-voce').textContent = t;
        apresenta();
        return;
      }
      if (camera || acao) $('#jv-voce').textContent = t;
      if (camera) {
        if (cena3d) cena3d.then((c) => c?.vista(camera.vista, camera.parede));
        else palco.querySelector('iframe.jv-projeto')?.contentWindow?.postMessage({ jarvis: 'camera', ...camera }, '*');
        voltaAoNormal();
        if ($('#jv-continuo').checked && ativo()) setTimeout(() => ouve(), 350);
        return;
      }
      if (acao) {
        acao();
        voltaAoNormal();
        if ($('#jv-continuo').checked && ativo()) setTimeout(() => ouve(), 350);
        return;
      }
    }
    $('#jv-voce').textContent = t;
    $('#jv-resposta').textContent = '…';
    muda('pensando');
    let r;
    pedindo += 1;
    try { r = await pede('/api/jarvis', { mensagem: t, ...(cliente ? { cliente: typeof cliente === 'function' ? cliente() : cliente } : {}) }); } catch (e) {
      pedindo -= 1;
      $('#jv-resposta').textContent = e.message;
      voltaAoNormal();
      return;
    }
    pendente = r.pendente;
    mostraPede();
    if ((r.feitas || []).length && !pendente) muda('executando');
    $('#jv-resposta').textContent = r.resposta;
    pedindo -= 1;
    if (r.visual_id) visualVisto = r.visual_id;
    if (r.tela === 'normal') await saiImersao();
    else if (r.visual) await mostraVisual(r.visual, r.visual_id);
    else if (r.tela === 'imersao') await entraImersao();
    await atualiza();
    await fala(r.resposta);
    voltaAoNormal();
    if (r.apresentar) { apresenta(); return; }
    if ($('#jv-continuo').checked && ativo()) setTimeout(() => ouve(), 350);
  };
  $('#jv-form').addEventListener('submit', (e) => { e.preventDefault(); const c = $('#jv-campo'); envia(c.value); c.value = ''; });
  $('#jv-sinal').addEventListener('click', (e) => {
    const b = e.target.closest('[data-sinal]');
    if (!b) return;
    $('#jv-sinal').hidden = true;
    envia(b.dataset.sinal === 'sim' ? 'sim' : 'não');
  });

  /* ouvir: grava enquanto você fala, para no silêncio */
  let gravando = null;
  const ouve = async () => {
    if (gravando) { gravando.para(); return; }
    if (!navigator.mediaDevices?.getUserMedia) {
      $('#jv-resposta').textContent = 'O microfone só funciona no próprio notebook ou pelo link seguro (https) da Matilha.';
      return;
    }
    paraDeFalar();
    let fluxo;
    try { fluxo = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch {
      $('#jv-resposta').textContent = 'Sem acesso ao microfone. Libere no cadeado da barra de endereço.';
      return;
    }
    const tipo = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((x) => window.MediaRecorder?.isTypeSupported?.(x)) || '';
    const gravador = new MediaRecorder(fluxo, tipo ? { mimeType: tipo } : undefined);
    const pedacos = [];
    gravador.ondataavailable = (e) => { if (e.data.size) pedacos.push(e.data); };
    const modoSegurar = segurando;
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    // No iPhone o medidor nasce "dormindo" até um toque: acorda agora e de novo quando o dedo sai.
    audio.resume?.().catch(() => {});
    const analisador = audio.createAnalyser();
    analisador.fftSize = 1024;
    audio.createMediaStreamSource(fluxo).connect(analisador);
    const amostra = new Float32Array(analisador.fftSize);
    let falou = false; let silencioDesde = 0; const comecou = performance.now(); let acabou = false;
    const para = () => { if (acabou) return; acabou = true; if (gravador.state !== 'inactive') gravador.stop(); };
    gravando = { para, acorda: () => audio.resume?.().catch(() => {}) };
    $('#jv-mic').classList.add('ligado');
    muda('ouvindo');
    const mede = () => {
      if (acabou) return;
      analisador.getFloatTimeDomainData(amostra);
      let soma = 0; for (const v of amostra) soma += v * v;
      const rms = Math.sqrt(soma / amostra.length);
      luz.nivel(Math.min(1, rms * 9));
      const agora = performance.now();
      if (rms > 0.025) { falou = true; silencioDesde = 0; } else if (falou && !silencioDesde) silencioDesde = agora;
      // Segurando o botão, quem decide o fim é você (soltar); senão, o silêncio.
      const silencio = !segurando && ((falou && silencioDesde && agora - silencioDesde > 1300) || (!falou && agora - comecou > 7000));
      if (silencio || agora - comecou > (segurando ? 60_000 : 20_000)) para();
      else requestAnimationFrame(mede);
    };
    requestAnimationFrame(mede);
    gravador.onstop = async () => {
      fluxo.getTracks().forEach((tr) => tr.stop());
      audio.close().catch(() => {});
      gravando = null;
      $('#jv-mic').classList.remove('ligado');
      luz.nivel(0);
      // Segurando o botão por mais de meio segundo, é fala sua mesmo que o medidor não tenha ouvido.
      if (!falou && !(modoSegurar && performance.now() - comecou > 700)) { voltaAoNormal(); return; }
      muda('pensando');
      try {
        const blob = new Blob(pedacos, { type: gravador.mimeType || 'audio/webm' });
        const resposta = await fetch('/api/jarvis/ouvir', { method: 'POST', headers: { 'content-type': blob.type }, body: blob });
        const corpo = await resposta.json();
        if (!resposta.ok) throw new Error(corpo.erro || 'não entendi o áudio');
        if (corpo.texto) await envia(corpo.texto); else voltaAoNormal();
      } catch (e) { $('#jv-resposta').textContent = e.message; voltaAoNormal(); }
    };
    gravador.start(250);
  };
  // Toque: grava e para no silêncio. Segurar: grava enquanto o dedo estiver no botão (como áudio de WhatsApp).
  let segurando = false; let apertouEm = 0;
  const mic = $('#jv-mic');
  mic.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    apertouEm = performance.now();
    if (gravando) { gravando.para(); return; }
    segurando = true;
    ouve();
  });
  const solta = () => {
    gravando?.acorda?.();
    if (!segurando) return;
    segurando = false;
    if (performance.now() - apertouEm > 450) gravando?.para();
  };
  mic.addEventListener('pointerup', solta);
  mic.addEventListener('pointercancel', solta);
  mic.addEventListener('contextmenu', (e) => e.preventDefault());
  // Pelo teclado (Enter no botão) continua sendo um toque.
  mic.addEventListener('click', (e) => { if (e.detail === 0) ouve(); });
  document.addEventListener('keydown', (e) => { if (e.ctrlKey && e.code === 'Space' && ativo()) { e.preventDefault(); ouve(); } });

  /* o skills */
  $('#jv-instalar').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    b.disabled = true; b.textContent = 'Instalando, leva alguns minutos…';
    try {
      const r = await pede('/api/jarvis/skills', {});
      b.textContent = r.feitos.every((f) => f.ok) ? 'Pacote instalado' : 'Parte falhou; tente de novo';
    } catch (err) { b.textContent = err.message; }
    b.disabled = false;
    sistema();
  });

  /* o que está ao redor: agentes, ligações, projetos */
  let projetosAntes = null;
  let visualVisto = undefined; // o último visual que esta tela já mostrou (ou já sabia que existia)
  let pedindo = 0; // pedidos desta tela em andamento: o visual deles chega pela resposta, não pela olhada
  let ultimosProjetos = [];
  let primeiraVez = true;
  let ligacoes = {};
  const atualiza = async () => {
    let e;
    try { e = await pede('/api/jarvis/estado'); } catch { return; }
    poeHistorico(e.historico || []);
    if (primeiraVez) {
      // Ao abrir, a última troca aparece em destaque, como se ele tivesse acabado de falar.
      primeiraVez = false;
      const h = e.historico || [];
      const ultima = [...h].reverse().find((m) => m.quem === 'jarvis');
      const doVoce = ultima ? [...h.slice(0, h.lastIndexOf(ultima))].reverse().find((m) => m.quem === 'voce') : null;
      if (ultima) { $('#jv-resposta').textContent = ultima.texto; $('#jv-voce').textContent = doVoce?.texto || ''; }
    }
    pendente = e.pendente;
    mostraPede();
    // Um visual novo que veio de outro lugar (o celular, o atalho): aparece aqui também.
    if (visualVisto === undefined) visualVisto = e.visual_id || null;
    else if (e.visual_id && e.visual_id !== visualVisto && !pedindo) {
      visualVisto = e.visual_id;
      try {
        const v = await pede(`/api/jarvis/visual?id=${encodeURIComponent(e.visual_id)}`);
        if (v?.visual) {
          // A fala que acompanhou esse visual (pedida no outro aparelho) vem junto.
          const h = e.historico || [];
          const ultima = [...h].reverse().find((m) => m.quem === 'jarvis');
          const doVoce = ultima ? [...h.slice(0, h.lastIndexOf(ultima))].reverse().find((m) => m.quem === 'voce') : null;
          if (ultima && !narrando) { $('#jv-resposta').textContent = ultima.texto; $('#jv-voce').textContent = doVoce?.texto || ''; }
          mostraVisual(v.visual, e.visual_id);
        }
      } catch { /* sumiu */ }
    }
    if (pendente && estadoAtual === 'parado') muda('confirmar');
    if (!pendente && estadoAtual === 'confirmar') muda('parado');
    const lig = e.ligacoes || {};
    ligacoes = { ...lig, cerebro: e.cerebro };
    // Arquivado sai da lista (continua na pasta, e "desarquiva" traz de volta).
    const projetos = (e.projetos || []).filter((p) => !p.arquivado);
    $('#jv-sem-projetos').hidden = projetos.length > 0;
    $('#jv-projetos').innerHTML = projetos.map((p) => `<li><span class="jv-ponto ${p.estado === 'pronto' ? 'ok' : p.estado === 'rodando' ? 'anda' : 'ruim'}"></span>
      <span><b>${esc(p.nome)}</b><small>${p.estado === 'rodando' ? 'O Claude Code está fazendo…' : p.estado === 'pronto' ? `${(p.arquivos || []).length} arquivo(s)${p.link ? ` · <a class="jv-link" href="${esc(p.link)}" target="_blank" rel="noopener">no ar</a>` : ''}` : esc(p.erro || p.estado)}</small>
      ${p.estado === 'pronto' ? `<span class="jv-acoes">${p.ver ? `<button class="jv-bt" data-ver="${esc(p.id)}">Mostrar na tela</button>` : ''}<button class="jv-bt" data-abrir="${esc(p.id)}">Abrir a pasta</button></span>` : ''}</span></li>`).join('');
    ultimosProjetos = projetos;
    // Projeto que terminou desde a última olhada: ele avisa.
    if (projetosAntes) {
      for (const p of projetos) {
        const antes = projetosAntes.find((x) => x.id === p.id);
        if (antes?.estado === 'rodando' && p.estado !== 'rodando') {
          const aviso = p.estado === 'pronto' ? `Terminei o projeto ${p.nome}.${p.ver ? ' Está na tela.' : ''}` : `O projeto ${p.nome} parou: ${p.erro || 'deu erro'}.`;
          $('#jv-resposta').textContent = aviso;
          // Projeto com página (uma apresentação): vai direto para a tela, em imersão.
          if (p.estado === 'pronto' && p.ver && document.visibilityState === 'visible' && ativo()) {
            mostraVisual({ tipo: 'projeto', titulo: p.nome, url: p.ver, id: p.id });
          }
          if (estadoAtual === 'parado') fala(aviso).then(voltaAoNormal);
        }
      }
    }
    projetosAntes = projetos;
    if (estadoAtual === 'executando' && !projetos.some((p) => p.estado === 'rodando')) voltaAoNormal();
  };
  raiz.addEventListener('click', async (e) => {
    const ver = e.target.closest('[data-ver]');
    if (ver) {
      const p = ultimosProjetos.find((x) => x.id === ver.dataset.ver);
      if (p?.ver) {
        $('#jv-voce').textContent = '';
        $('#jv-resposta').textContent = `${p.nome}, na tela.`;
        mostraVisual({ tipo: 'projeto', titulo: p.nome, url: p.ver, id: p.id });
      }
      return;
    }
    const b = e.target.closest('[data-abrir]');
    if (b) { try { await pede('/api/jarvis/abrir', { id: b.dataset.abrir }); } catch (err) { $('#jv-resposta').textContent = err.message; } }
  });

  const agentes = async () => {
    let f;
    try { f = await pede('/api/fluxo'); } catch { return; }
    $('#jv-agentes').innerHTML = (f.trabalhadores || []).filter((t) => SETORES[t.setor]).map((t) => `<li>
      <span class="jv-ponto ${t.fazendo ? 'anda' : t.ligado ? 'ok' : ''}"></span>
      <span><b>${SETORES[t.setor]}</b><small>${t.fazendo ? esc(String(t.fazendo).replace(/_/g, ' ')) : t.ligado ? (t.dormindoAte ? 'fora do horário' : 'esperando tarefa') : 'parado'}</small></span></li>`).join('')
      || '<li><span class="jv-ponto"></span><span><b>Matilha</b><small>parada</small></span></li>';
  };
  const sistema = async () => {
    let s;
    try { s = await pede('/api/jarvis/skills'); } catch { s = null; }
    const linhas = [
      ['Quem pensa', ligacoes.cerebro?.escolhido === 'groq' ? 'o Groq (você escolheu em Voz e cérebro)'
        : ligacoes.cerebro?.claude_disponivel ? `o Claude (${ligacoes.cerebro.modelos?.[ligacoes.cerebro.modo?.modelo]?.nome || 'Sonnet 5.5'}, esforço ${(ligacoes.cerebro.esforcos?.[ligacoes.cerebro.modo?.esforco]?.nome || 'baixo').toLowerCase()}), pela sua assinatura: pesquisa na web e lembra a conversa`
          : 'o Groq, por enquanto: o Claude não está disponível', ligacoes.cerebro?.escolhido === 'groq' || Boolean(ligacoes.cerebro?.claude_disponivel)],
      ['Groq', ligacoes.groq === false ? 'falta a chave em Ajustes › Chaves' : 'ouve a sua voz (e pensa quando o Claude não dá)', ligacoes.groq !== false],
      ['Claude Code', ligacoes.claude === false ? 'não conectado: rode claude auth login' : 'faz os projetos, com a sua assinatura', ligacoes.claude !== false],
      ...(ligacoes.atalhos && ligacoes.atalhos.erro !== 'só no Windows' ? [['Atalhos', ligacoes.atalhos.ligado
        ? `segure ${ligacoes.atalhos.teclas.jarvis} para falar de qualquer tela, ${ligacoes.atalhos.teclas.ditado} para ditar${ligacoes.atalhos.erro ? ` (${ligacoes.atalhos.erro})` : ''}`
        : `desligados${ligacoes.atalhos.erro ? `: ${ligacoes.atalhos.erro}` : ''}`, ligacoes.atalhos.ligado && !ligacoes.atalhos.erro]] : []),
      ...((s?.pacote || []).map((p) => [p.nome, p.instalado ? p.faz : `${p.faz} · não instalado`, p.instalado])),
    ];
    $('#jv-sistema').innerHTML = linhas.map(([n, d, ok]) => `<li><span class="jv-ponto ${ok ? 'ok' : ''}"></span><span><b>${esc(n)}</b><small>${esc(d)}</small></span></li>`).join('');
    $('#jv-instalar').hidden = Boolean(s?.pacote?.length && s.pacote.every((p) => p.instalado));
  };

  atualiza().then(sistema); agentes();
  setInterval(() => { if (ativo()) atualiza(); }, 3000);
  setInterval(() => { if (ativo()) agentes(); }, 5000);
  if (window.speechSynthesis) speechSynthesis.onvoiceschanged = () => vozes();
  return {
    atualiza, mostraVisual, entraImersao, saiImersao, fechaVisual,
    fechaSoltos, fechaGaveta: () => { delete casca.dataset.folha; },
    // O que está na tela agora: o Jarvis (servidor) usa para saber o que "isso" e "este projeto" querem dizer.
    palco: () => (visualAtual ? { tipo: visualAtual.tipo, titulo: visualAtual.titulo || '', id: visualAtual.id || null } : null),
    gaveta: () => casca.dataset.folha || null,
    soltos: () => soltos.size,
  };
}
