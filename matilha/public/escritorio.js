/**
 * O ESCRITÓRIO — a Matilha vista de cima, como uma sala.
 *
 * Cada agente que existe de verdade tem uma mesa: os caçadores (uma
 * mesa por janela de Chrome), o vendedor, o observador, o estúdio, o
 * publicador, e o chefe, na sala de vidro, com quem você conversa
 * embaixo. A mesa acende quando o agente está trabalhando AGORA, lido
 * de /api/fluxo a cada 3 segundos. Nada aqui é enfeite: boneco
 * trabalhando é tarefa rodando.
 *
 * Desenho isométrico em SVG puro, sem biblioteca: abre rápido em
 * qualquer notebook e funciona sem internet.
 */
const NS = 'http://www.w3.org/2000/svg';
const esc = (v) => String(v ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hora = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/* ── a projeção ────────────────────────────────────────────────── */
const L = 34;   // meia largura de uma casa
const A = 17;   // meia altura de uma casa
const Z = 26;   // um metro de altura
const ORIGEM = { x: 640, y: 110 };
// A sala inteira cabe nesta caixa: de p(0,18) a p(26,0) na largura, das
// paredes ao canto da frente na altura.
const CAIXA_DA_SALA = '0 0 1560 900';
const p = (x, y, z = 0) => [ORIGEM.x + (x - y) * L, ORIGEM.y + (x + y) * A - z * Z];
const pts = (lista) => lista.map(([x, y, z]) => p(x, y, z).map((n) => n.toFixed(1)).join(',')).join(' ');

function el(nome, atributos = {}, filhos = []) {
  const e = document.createElementNS(NS, nome);
  for (const [k, v] of Object.entries(atributos)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  for (const f of filhos) e.append(f);
  return e;
}
const poligono = (lista, cor, extra = {}) => el('polygon', { points: pts(lista), fill: cor, ...extra });

/** Uma caixa: as três faces que se veem (topo, frente-esquerda, frente-direita). */
function caixa(x, y, z, w, d, h, cores, extra = {}) {
  const g = el('g', extra);
  g.append(
    poligono([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], cores.esq),
    poligono([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], cores.dir),
    poligono([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], cores.topo),
  );
  return g;
}

/* ── a sala ────────────────────────────────────────────────────── */
const SALA = { w: 26, d: 18 };
const SETORES = [
  { nome: 'CAÇADA', x: 0.6, y: 8.6, w: 13.4, d: 8.8, chao: '#5a4632', faixa: '#c98b4a' },
  { nome: 'VENDAS', x: 14.6, y: 8.6, w: 10.8, d: 8.8, chao: '#2f4a39', faixa: '#5fbf7f' },
  { nome: 'ESTÚDIO', x: 0.6, y: 0.6, w: 13.4, d: 7.4, chao: '#2f3d52', faixa: '#6fa3e8' },
  { nome: 'SALA DO CHEFE', x: 14.6, y: 0.6, w: 10.8, d: 7.4, chao: '#3d3550', faixa: '#b48cf0' },
];

/** As mesas: posição na sala e quem senta nela. */
function mesas() {
  const lista = [];
  for (let i = 0; i < 7; i += 1) {
    lista.push({ id: `cacador-${i}`, nome: `Caçador ${i + 1}`, setor: 'cacador', indice: i,
      x: 1.8 + (i % 4) * 3.1, y: 10.2 + Math.floor(i / 4) * 3.8, cor: '#f2a34a' });
  }
  lista.push(
    { id: 'vendedor', nome: 'Vendedor', setor: 'vendedor', x: 16.4, y: 11.2, cor: '#5fd38a' },
    { id: 'observador', nome: 'Observador', setor: 'observador', x: 20.6, y: 11.2, cor: '#7fd6c9' },
    { id: 'estudio', nome: 'Estúdio', setor: 'estudio', x: 2.4, y: 2.4, cor: '#7cb2ff' },
    { id: 'publicador', nome: 'Publicador', setor: 'publicador', x: 7.6, y: 2.4, cor: '#a9c7ff' },
    { id: 'dominio', nome: 'Domínio', setor: 'dominio', x: 11.4, y: 2.4, cor: '#9be0ff' },
    { id: 'chefe', nome: 'Chefe', setor: 'chefe', x: 18.6, y: 2.6, cor: '#c7a6ff' },
  );
  return lista;
}

const MADEIRA = { topo: '#b98a5e', esq: '#8a6440', dir: '#6f5034' };
const METAL = { topo: '#3a4150', esq: '#262b35', dir: '#1d212a' };

/** Uma estação de trabalho: mesa, monitor, cadeira e quem trabalha nela. */
function estacao(m) {
  const g = el('g', { class: 'estacao', 'data-id': m.id, tabindex: '0', role: 'button', 'aria-label': m.nome });
  // a cadeira, atrás da mesa
  g.append(caixa(m.x + 0.55, m.y - 0.95, 0, 0.8, 0.7, 0.45, { topo: '#2b2f3a', esq: '#1f222b', dir: '#181a21' }));
  g.append(caixa(m.x + 0.55, m.y - 1.05, 0.45, 0.8, 0.12, 0.7, { topo: '#2b2f3a', esq: '#1f222b', dir: '#181a21' }));
  // a pessoa
  const [cx, cy] = p(m.x + 0.95, m.y - 0.6, 0.95);
  const pessoa = el('g', { class: 'pessoa' });
  pessoa.append(
    el('ellipse', { cx, cy: cy + 4, rx: 11, ry: 15, fill: m.cor, class: 'corpo' }),
    el('circle', { cx, cy: cy - 17, r: 8.5, fill: '#f1c7a0', class: 'cabeca' }),
    el('path', { d: `M${cx - 8.5} ${cy - 19} a8.5 8.5 0 0 1 17 0 q-8 -5 -17 0z`, fill: '#3a2a20' }),
  );
  g.append(pessoa);
  // a mesa
  g.append(caixa(m.x, m.y, 0, 1.9, 1.05, 0.72, MADEIRA));
  // o monitor (a tela acende quando o agente trabalha)
  g.append(caixa(m.x + 0.55, m.y + 0.2, 0.72, 0.08, 0.1, 0.35, METAL));
  const telaPts = [[m.x + 0.25, m.y + 0.15, 1.0], [m.x + 1.55, m.y + 0.15, 1.0], [m.x + 1.55, m.y + 0.15, 1.62], [m.x + 0.25, m.y + 0.15, 1.62]];
  g.append(poligono(telaPts, '#11151c', { class: 'tela', stroke: '#2a3040', 'stroke-width': 1 }));
  const [lx, ly] = p(m.x + 0.6, m.y + 0.15, 1.45);
  const linhas = el('g', { class: 'linhas' });
  for (let i = 0; i < 3; i += 1) {
    linhas.append(el('rect', { x: lx + i * 3, y: ly + 6 + i * 6, width: 26 - i * 6, height: 2.4, rx: 1.2, fill: '#cfe9ff', style: `animation-delay:${i * 0.35}s` }));
  }
  g.append(linhas);
  // o crachá: nome e o que está fazendo
  const [tx, ty] = p(m.x + 0.95, m.y - 0.6, 2.75);
  const cracha = el('g', { class: 'cracha' });
  cracha.append(
    el('rect', { x: tx - 66, y: ty - 20, width: 132, height: 30, rx: 15, class: 'cracha-fundo' }),
    el('circle', { cx: tx - 50, cy: ty - 5, r: 5.5, class: 'cracha-ponto' }),
  );
  const nome = el('text', { x: tx - 39, y: ty + 0.5, class: 'cracha-nome' });
  nome.textContent = m.nome;
  cracha.append(nome);
  g.append(cracha);
  return g;
}

/** Uma planta num vaso: a sala precisa respirar. */
function planta(x, y) {
  const g = el('g', { class: 'planta' });
  g.append(caixa(x, y, 0, 0.5, 0.5, 0.45, { topo: '#7a5236', esq: '#5c3d28', dir: '#4a311f' }));
  const [cx, cy] = p(x + 0.25, y + 0.25, 0.9);
  g.append(el('circle', { cx, cy, r: 14, fill: '#3f8f55' }), el('circle', { cx: cx - 8, cy: cy + 4, r: 9, fill: '#4fa865' }),
    el('circle', { cx: cx + 9, cy: cy + 2, r: 10, fill: '#367a49' }));
  return g;
}

function desenhaSala(svg) {
  const cena = el('g', { class: 'cena' });
  // o chão e as paredes do fundo
  cena.append(poligono([[0, 0, 0], [SALA.w, 0, 0], [SALA.w, SALA.d, 0], [0, SALA.d, 0]], '#4a3f36'));
  cena.append(poligono([[0, 0, 0], [SALA.w, 0, 0], [SALA.w, 0, 3.4], [0, 0, 3.4]], '#3b3f4a'));
  cena.append(poligono([[0, 0, 0], [0, SALA.d, 0], [0, SALA.d, 3.4], [0, 0, 3.4]], '#323641'));
  // as janelas, com a luz do dia lá fora
  for (let i = 0; i < 5; i += 1) {
    const x = 1.8 + i * 4.8;
    cena.append(poligono([[x, 0, 1.4], [x + 3.2, 0, 1.4], [x + 3.2, 0, 2.9], [x, 0, 2.9]], '#7fb6d9', { opacity: 0.55 }));
    cena.append(poligono([[x + 1.55, 0, 1.4], [x + 1.65, 0, 1.4], [x + 1.65, 0, 2.9], [x + 1.55, 0, 2.9]], '#3b3f4a'));
  }
  // os setores, cada um com o seu chão e o nome pintado
  for (const s of SETORES) {
    cena.append(poligono([[s.x, s.y, 0.01], [s.x + s.w, s.y, 0.01], [s.x + s.w, s.y + s.d, 0.01], [s.x, s.y + s.d, 0.01]], s.chao,
      { stroke: s.faixa, 'stroke-width': 2, 'stroke-opacity': 0.55 }));
  }
  // o vidro da sala do chefe
  cena.append(poligono([[14.6, 8.0, 0], [25.4, 8.0, 0], [25.4, 8.0, 2.4], [14.6, 8.0, 2.4]], '#b48cf0', { opacity: 0.12, stroke: '#b48cf0', 'stroke-opacity': 0.5 }));
  cena.append(poligono([[14.6, 0.6, 0], [14.6, 8.0, 0], [14.6, 8.0, 2.4], [14.6, 0.6, 2.4]], '#b48cf0', { opacity: 0.1, stroke: '#b48cf0', 'stroke-opacity': 0.5 }));
  // um sofá e o bebedouro, para a sala ser sala
  cena.append(caixa(10.6, 16.4, 0, 2.6, 0.9, 0.45, { topo: '#475066', esq: '#343b4c', dir: '#2a3040' }));
  cena.append(caixa(24.2, 16.6, 0, 0.6, 0.6, 1.2, { topo: '#dfe7ee', esq: '#b5c0ca', dir: '#9aa6b1' }));

  // as mesas, de trás para a frente (quem está na frente cobre quem está atrás)
  const lista = mesas();
  const objetos = [...lista.map((m) => ({ ordem: m.x + m.y, no: estacao(m) })),
    ...[[0.9, 7.2], [13.2, 7.2], [25, 7.6], [0.9, 17.2], [14.2, 17.2]].map(([x, y]) => ({ ordem: x + y, no: planta(x, y) }))];
  for (const o of objetos.sort((a, b) => a.ordem - b.ordem)) cena.append(o.no);
  // Os nomes dos setores por cima de tudo: atrás do vidro e das mesas eles sumiam.
  for (const st of SETORES) {
    const [tx, ty] = p(st.x + st.w / 2, st.y + st.d / 2, 0);
    const t = el('text', { x: tx, y: ty + 4, class: 'setor-nome', fill: st.faixa });
    t.textContent = st.nome;
    cena.append(t);
  }
  svg.append(cena);
  svg.append(el('g', { class: 'voos' }));
  return lista;
}

/* ── o estado de cada um, lido do fluxo ────────────────────────── */
const FAZENDO = {
  cacar: 'caçando', abordar: 'abordando', responder: 'respondendo', passar: 'passando para você',
  lembrar: 'mandando um lembrete', fazer_site: 'montando a demo', fazer_oficial: 'montando o oficial',
  alterar: 'alterando um site', publicar: 'publicando', avisar_demo: 'mandando a demo',
  avisar_entrega: 'entregando o site', avisar_alteracao: 'avisando a alteração',
};
const humano = (s) => String(s || '').replace(/^([a-z_]+)/, (t) => FAZENDO[t] || t.replace(/_/g, ' '));

function situacao(m, e, extra) {
  const op = e.operacao || {};
  const t = (e.trabalhadores || []).find((x) => x.setor === m.setor) || {};
  const caixaDoSetor = e.mural?.setores?.[m.setor] || {};
  if (m.setor === 'cacador') {
    const busca = e.matilha?.emAndamento?.[m.indice];
    const configurados = Number(op.meta?.cacadores) || 0;
    if (busca) return { classe: 'trabalhando', texto: busca, detalhe: `Caçando ${busca} no Google Maps, na janela ${m.indice + 1}.` };
    if (m.indice < (e.matilha?.janelas || 0)) return { classe: 'esperando', texto: 'janela aberta', detalhe: 'A janela está aberta, esperando a próxima busca.' };
    if (m.indice < configurados) return { classe: 'esperando', texto: 'esperando', detalhe: 'Pronto para caçar quando a matilha for solta.' };
    return { classe: 'vazia', texto: 'mesa livre', detalhe: `Mesa livre: em Caçada você escolhe até 7 caçadores.` };
  }
  if (m.setor === 'observador') {
    const recente = e.ultimo?.quando && Date.now() - e.ultimo.quando < 20_000;
    if (!e.ligado) return { classe: 'parado', texto: 'desligado', detalhe: 'O observador lê o WhatsApp quando os agentes estão ligados.' };
    return { classe: recente ? 'trabalhando' : 'esperando', texto: recente ? 'lendo o WhatsApp' : 'de olho',
      detalhe: `Lê as respostas no WhatsApp a cada 15 segundos e põe tarefa na caixa de quem precisa.${e.ultimo?.quando ? ` Última volta às ${hora(e.ultimo.quando)}.` : ''}` };
  }
  if (m.setor === 'chefe') {
    return extra.pensando ? { classe: 'trabalhando', texto: 'pensando', detalhe: 'Lendo o seu pedido.' }
      : { classe: 'esperando', texto: 'às ordens', detalhe: 'Fale com ele aí embaixo: "como foi hoje?", "solta a matilha em pizzaria Maringá".' };
  }
  const fila = `${caixaDoSetor.esperando || 0} na caixa · ${t.feitas || 0} feitas${caixaDoSetor.travada ? ` · ${caixaDoSetor.travada} travada(s)` : ''}`;
  if (!t.ligado) return { classe: 'parado', texto: 'desligado', detalhe: fila };
  if (t.dormindoAte) return { classe: 'dormindo', texto: 'fora do horário', detalhe: `Volta às ${hora(t.dormindoAte)}. ${fila}` };
  if (t.fazendo) return { classe: 'trabalhando', texto: humano(t.fazendo), detalhe: `${humano(t.fazendo)}. ${fila}` };
  return { classe: 'esperando', texto: 'esperando tarefa', detalhe: fila };
}

/* ── os voos: o papel indo de uma mesa para a outra ─────────────── */
const DESTINO = { cacador: 'vendedor', estudio: 'publicador', publicador: 'vendedor', dominio: 'vendedor' };
function voa(svg, de, para, cor) {
  const camada = svg.querySelector('.voos');
  const a = p(de.x + 0.95, de.y + 0.4, 1.2);
  const b = p(para.x + 0.95, para.y + 0.4, 1.2);
  const papel = el('rect', { width: 12, height: 9, rx: 1.5, fill: '#fff', stroke: cor, 'stroke-width': 2 });
  camada.append(papel);
  const inicio = performance.now();
  const dura = 1400;
  const passo = (t) => {
    const k = Math.min(1, (t - inicio) / dura);
    const x = a[0] + (b[0] - a[0]) * k;
    const y = a[1] + (b[1] - a[1]) * k - Math.sin(k * Math.PI) * 70;
    papel.setAttribute('x', x - 6); papel.setAttribute('y', y - 4);
    if (k < 1) requestAnimationFrame(passo); else papel.remove();
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { papel.remove(); return; }
  requestAnimationFrame(passo);
}

/* ── montar ────────────────────────────────────────────────────── */
/**
 * Monta o escritório dentro de `raiz` e devolve `{ atualiza, para }`.
 * `pede(caminho, corpo)` é a função do painel que fala com o servidor
 * (com a senha, se houver).
 */
export function montaEscritorio(raiz, { pede, irPara, ativo = () => true } = {}) {
  raiz.innerHTML = `
    <div class="esc">
      <aside class="esc-lado esc-agentes" aria-label="Agentes">
        <header><b>Agentes</b><span class="esc-conta" data-conta></span></header>
        <ol data-lista></ol>
      </aside>
      <div class="esc-palco">
        <svg class="esc-svg" viewBox="${CAIXA_DA_SALA}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="O escritório da Matilha, visto de cima"></svg>
        <div class="esc-detalhe" data-detalhe hidden></div>
      </div>
      <aside class="esc-lado esc-resumo" aria-label="Resumo do dia">
        <header><b>Escritório · hoje</b></header>
        <div data-resumo></div>
      </aside>
      <form class="esc-chefe" data-chefe>
        <div class="esc-falas" data-falas aria-live="polite"></div>
        <div class="esc-entrada">
          <span class="esc-quem">CHEFE</span>
          <input data-pergunta placeholder="Fale com o chefe: “como foi hoje?”, “solta a matilha em pizzaria Maringá”, “libera os contatos”" autocomplete="off" aria-label="Mensagem para o chefe">
          <button class="bt bt-primario bt-pequeno" type="submit">Enviar</button>
        </div>
      </form>
    </div>`;
  const svg = raiz.querySelector('svg');
  const lista = desenhaSala(svg);
  const porId = Object.fromEntries(lista.map((m) => [m.id, m]));
  let selecionado = null;
  let ultimo = null;
  let ultimaTarefa = null;
  const extra = { pensando: false };

  const mostraDetalhe = () => {
    const caixa = raiz.querySelector('[data-detalhe]');
    if (!selecionado || !ultimo) { caixa.hidden = true; return; }
    const m = porId[selecionado];
    const s = situacao(m, ultimo, extra);
    const feitas = (ultimo.mural?.ultimas || []).filter((t) => t.setor === m.setor).slice(0, 4);
    caixa.hidden = false;
    caixa.innerHTML = `<button class="esc-fecha" data-fecha aria-label="Fechar">×</button>
      <b>${esc(m.nome)}</b><span class="esc-pill ${s.classe}">${esc(s.texto)}</span>
      <p>${esc(s.detalhe)}</p>
      ${feitas.length ? `<ul>${feitas.map((t) => `<li><span>${hora(t.quando)}</span> ${esc(t.nome || '')} ${esc(t.resultado || '')}</li>`).join('')}</ul>` : ''}`;
  };

  const seleciona = (id) => { selecionado = selecionado === id ? null : id; desenha(); };
  svg.addEventListener('click', (ev) => { const g = ev.target.closest('.estacao'); if (g) seleciona(g.dataset.id); });
  svg.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { const g = ev.target.closest('.estacao'); if (g) seleciona(g.dataset.id); } });
  raiz.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-fecha]')) { selecionado = null; desenha(); }
    const item = ev.target.closest('[data-agente]');
    if (item) seleciona(item.dataset.agente);
  });

  function desenha() {
    if (!ultimo) return;
    const e = ultimo;
    let trabalhando = 0;
    const itens = [];
    for (const m of lista) {
      const s = situacao(m, e, extra);
      if (s.classe === 'trabalhando') trabalhando += 1;
      const g = svg.querySelector(`.estacao[data-id="${m.id}"]`);
      g.setAttribute('class', `estacao ${s.classe}${selecionado === m.id ? ' selecionada' : ''}`);
      itens.push(`<li class="esc-item ${s.classe}${selecionado === m.id ? ' selecionado' : ''}" data-agente="${m.id}">
        <i class="esc-ponto"></i><span><b>${esc(m.nome)}</b><small>${esc(s.texto)}</small></span></li>`);
    }
    raiz.querySelector('[data-lista]').innerHTML = itens.join('');
    raiz.querySelector('[data-conta]').textContent = `${trabalhando} trabalhando`;

    const op = e.operacao || {};
    const hoje = op.hoje || {};
    const funil = e.funil || {};
    raiz.querySelector('[data-resumo]').innerHTML = `
      <div class="esc-meta"><span>Vendas hoje</span><b>${hoje.vendas || 0}<small> de ${op.meta?.vendas || 1}</small></b>
        <i><em style="width:${Math.min(100, ((hoje.vendas || 0) / (op.meta?.vendas || 1)) * 100)}%"></em></i></div>
      <dl>
        <div><dt>Matilha</dt><dd>${op.ligada ? 'solta' : 'recolhida'}</dd></div>
        <div><dt>Caçados hoje</dt><dd>${hoje.achados || 0}</dd></div>
        <div><dt>Abordados hoje</dt><dd>${hoje.contatos || 0}</dd></div>
        <div><dt>Conversando</dt><dd>${(funil.conversando || 0) + (funil.abordado || 0) + (funil.demo_no_ar || 0)}</dd></div>
        <div><dt>Esperando você</dt><dd>${(funil.aguardando_voce || 0) + (funil.com_voce || 0)}</dd></div>
        <div><dt>Falar com cliente</dt><dd>${e.horarios?.falar?.aberta ? 'aberto' : 'fechado'}</dd></div>
      </dl>
      <p class="esc-ult">${(e.mural?.ultimas || []).slice(0, 5).map((t) => `<span>${hora(t.quando)} · ${esc(t.nome || '')} ${esc(t.resultado || humano(t.tipo))}</span>`).join('')}</p>`;
    mostraDetalhe();

    // Uma tarefa terminou: o papel voa da mesa de quem fez para quem pega.
    const nova = e.mural?.ultimas?.[0];
    const chave = nova ? `${nova.quando}:${nova.setor}:${nova.tipo}` : null;
    if (chave && ultimaTarefa && chave !== ultimaTarefa) {
      const de = nova.setor === 'cacador' ? lista.find((m) => m.setor === 'cacador') : lista.find((m) => m.setor === nova.setor);
      const destino = nova.setor === 'vendedor' && /est[úu]dio/i.test(nova.resultado || '') ? 'estudio' : DESTINO[nova.setor];
      const para = destino && lista.find((m) => m.setor === destino);
      if (de && para) voa(svg, de, para, de.cor);
    }
    ultimaTarefa = chave;
  }

  async function atualiza() {
    try { ultimo = await pede('/api/fluxo'); desenha(); } catch { /* a próxima volta tenta de novo */ }
  }

  /* ── o chefe ─────────────────────────────────────────────────── */
  const falas = raiz.querySelector('[data-falas]');
  const historico = [];
  const fala = (quem, html) => {
    const d = document.createElement('div');
    d.className = `esc-fala ${quem}`;
    d.innerHTML = html;
    falas.append(d);
    while (falas.children.length > 8) falas.firstElementChild.remove();
    falas.scrollTop = falas.scrollHeight;
    return d;
  };
  async function executa(acao, parametros, caixa) {
    caixa.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    try {
      const r = await pede('/api/chefe/executar', { acao, parametros });
      fala('chefe', esc(r.feito || 'Feito.'));
      historico.push({ quem: 'chefe', texto: r.feito || 'Feito.' });
      atualiza();
    } catch (e) { fala('chefe erro', esc(e.message)); }
  }
  raiz.querySelector('[data-chefe]').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const campo = raiz.querySelector('[data-pergunta]');
    const mensagem = campo.value.trim();
    if (!mensagem) return;
    campo.value = '';
    fala('voce', esc(mensagem));
    historico.push({ quem: 'voce', texto: mensagem });
    extra.pensando = true; desenha();
    const espera = fala('chefe pensando', 'pensando…');
    try {
      const r = await pede('/api/chefe', { mensagem, historico: historico.slice(-10) });
      espera.remove();
      historico.push({ quem: 'chefe', texto: r.resposta });
      const caixa = fala('chefe', esc(r.resposta));
      if (r.acao === 'abrir_tela' && r.parametros?.tela && irPara) irPara(r.parametros.tela);
      else if (r.acao && r.acao !== 'nenhuma') {
        if (r.confirmar) {
          const botoes = document.createElement('div');
          botoes.className = 'esc-botoes';
          botoes.innerHTML = `<button type="button" class="bt bt-primario bt-pequeno" data-sim>Confirmar</button>
            <button type="button" class="bt bt-texto bt-pequeno" data-nao>Cancelar</button>`;
          caixa.append(botoes);
          botoes.querySelector('[data-sim]').addEventListener('click', () => executa(r.acao, r.parametros, botoes));
          botoes.querySelector('[data-nao]').addEventListener('click', () => { botoes.remove(); fala('chefe', 'Tudo bem, não fiz nada.'); });
        } else {
          await executa(r.acao, r.parametros, caixa);
        }
      }
    } catch (e) {
      espera.remove();
      fala('chefe erro', esc(e.message));
    } finally { extra.pensando = false; desenha(); }
  });

  // No celular a sala se arrasta para o lado: começa no meio.
  const palco = raiz.querySelector('.esc-palco');
  requestAnimationFrame(() => { palco.scrollLeft = (palco.scrollWidth - palco.clientWidth) / 2; });
  atualiza();
  const relogio = setInterval(() => { if (!document.hidden && ativo()) atualiza(); }, 3000);
  return { atualiza, para: () => clearInterval(relogio) };
}
