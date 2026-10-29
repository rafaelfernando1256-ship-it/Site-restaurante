/**
 * O PAINEL DA MATILHA — uma tela para cada coisa.
 *
 *   Hoje      a matilha está trabalhando? quanto falta para a meta?
 *             o que precisa de você?
 *   Caçada    onde caçar, quantos caçadores, os freios do dia.
 *   WhatsApp  a conexão, e o cartão "Conectar Claude para WhatsApp".
 *   Clientes  o funil, cliente por cliente.
 *   Ajustes   negócio e preços, horários, chaves, celular, dados.
 *
 * Cada tela tem um endereço (#hoje, #cacada…): o botão voltar do
 * navegador funciona, e dá para salvar o favorito direto numa tela.
 *
 * Onde moram os dados: num ARQUIVO no seu notebook (dados/dados.json),
 * servido pela Matilha. Limpar o navegador não apaga nada.
 */
import { montaOfertas } from './ofertas.js';
import { montaValor } from './valor.js';
import { montaFinanceiro, montaRede } from './rede.js';
import { montaCommandCenter } from './comando.js';
import { ligaControleDeTela } from './ui-controle.js';

const $ = (s, raiz = document) => raiz.querySelector(s);
const $$ = (s, raiz = document) => [...raiz.querySelectorAll(s)];

/**
 * Escreve num pedaço da tela, e não explode se ele não existir.
 *
 * Foi um bug de verdade: uma linha que escrevia num quadrinho que
 * tinha saído da tela estourou no meio do desenho, e TUDO o que vinha
 * depois parou de aparecer, sem erro visível.
 */
function poe(seletor, html) {
  const alvo = $(seletor);
  if (!alvo) return false;
  alvo.innerHTML = html;
  return true;
}
function texto(seletor, valor) {
  const alvo = $(seletor);
  if (alvo) alvo.textContent = valor;
}
const esc = (v) => String(v ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hora = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const icone = (id, classe = '') => `<svg class="ic ${classe}"><use href="#i-${id}"/></svg>`;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

let estado = { leads: [], ajustes: {} };
// O que o servidor tinha da última vez que conversamos: é contra isto que
// se calcula o que VOCÊ mudou, para mandar só isso.
let base = { leads: [], ajustes: {} };
const copia = (v) => JSON.parse(JSON.stringify(v));
let filtro = '';
let ultimoFluxo = null;
let claude = null;

/* ── guardar e ler ─────────────────────────────────────────────── */
async function carrega() {
  try {
    const bruto = await (await fetch('/api/dados')).json();
    estado = { leads: Array.isArray(bruto.leads) ? bruto.leads : [],
               ajustes: bruto.ajustes && typeof bruto.ajustes === 'object' ? bruto.ajustes : {} };
    base = copia(estado);
  } catch {
    recado('Não consegui falar com a Matilha. A janela preta ainda está aberta?', 'ruim');
  }
}
let gravando = Promise.resolve();
/** Só o que mudou desde a última conversa com o servidor, cliente por cliente. */
function mudancas() {
  const antes = new Map(base.leads.map((l) => [l.id, l]));
  const novos = [];
  const lista = [];
  for (const l of estado.leads) {
    const b = antes.get(l.id);
    if (!b) { novos.push(l); continue; }
    const campos = {};
    for (const k of new Set([...Object.keys(l), ...Object.keys(b)])) {
      if (k === 'conversa') continue;
      if (JSON.stringify(l[k]) !== JSON.stringify(b[k])) campos[k] = l[k] === undefined ? null : l[k];
    }
    const mais = (l.conversa || []).slice((b.conversa || []).length);
    if (Object.keys(campos).length || mais.length) lista.push({ id: l.id, campos, conversa_mais: mais });
  }
  const ficam = new Set(estado.leads.map((l) => l.id));
  const apagados = base.leads.filter((l) => !ficam.has(l.id)).map((l) => l.id);
  const ajustes = JSON.stringify(estado.ajustes) !== JSON.stringify(base.ajustes) ? estado.ajustes : undefined;
  if (!novos.length && !lista.length && !apagados.length && !ajustes) return null;
  return { mudancas: lista, novos, apagados, ajustes };
}
function salva() {
  // A diferença é calculada AGORA, no clique, e não quando a fila andar:
  // uma atualização chegando no meio não pode engolir o que você mudou.
  const corpo = mudancas();
  if (!corpo) return gravando;
  base = copia(estado);
  // Em fila: dois cliques rápidos não podem gravar ao mesmo tempo.
  gravando = gravando.then(() => fetch('/api/dados/mudancas', {
    method: 'POST', headers: cabecalhos(), body: JSON.stringify(corpo),
  }).then((r) => { if (!r.ok) throw new Error(); }))
    .catch(() => recado('Não consegui gravar no notebook.', 'ruim'));
  return gravando;
}
function recado(mensagem, tom = '') {
  const caixa = $('#recado');
  caixa.textContent = mensagem;
  caixa.className = `recado ${tom}`;
  caixa.hidden = false;
  clearTimeout(recado._t);
  recado._t = setTimeout(() => { caixa.hidden = true; }, 6500);
}

/* ── falar com o servidor ──────────────────────────────────────── */
function cabecalhos() {
  // Rodando local, a senha é opcional: quem tranca a porta é o
  // servidor. Se você definiu PAINEL_SENHA, ela vai no cabeçalho.
  const senha = estado.ajustes.senha || '';
  return { 'content-type': 'application/json', ...(senha ? { 'x-orbita-senha': senha } : {}) };
}
async function pede(caminho, corpo, { metodo } = {}) {
  const resposta = await fetch(caminho, {
    method: metodo || (corpo === undefined ? 'GET' : 'POST'),
    headers: cabecalhos(),
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const saida = await resposta.json().catch(() => ({}));
  if (resposta.status === 401) {
    throw new Error('A Matilha está pedindo senha. Ponha a mesma do .env em Ajustes › Negócio e preços.');
  }
  if (!resposta.ok) throw new Error(saida.erro || `erro ${resposta.status}`);
  return saida;
}
const agente = (nome, dados) => pede(`/api/${nome}`, dados);
const fluxoPede = (rota, corpo) => pede(`/api/fluxo${rota}`, corpo);

/** Botão que trabalha: gira, não aceita segundo clique, e diz o erro. */
async function ocupado(botao, trabalho) {
  const antes = botao.innerHTML;
  botao.disabled = true;
  botao.innerHTML = `${icone('girando', 'girando')}um instante…`;
  try { return await trabalho(); } catch (e) { recado(e.message, 'ruim'); return undefined; } finally {
    botao.disabled = false;
    botao.innerHTML = antes;
  }
}
/** Clique num botão fixo da tela, já com o "ocupado". */
function aoClicar(seletor, trabalho, { semEspera = false } = {}) {
  const botao = $(seletor);
  if (!botao) return;
  botao.addEventListener('click', (ev) => (semEspera
    ? trabalho(ev.currentTarget, ev)
    : ocupado(ev.currentTarget, () => trabalho(ev.currentTarget, ev))));
}

/* ── o funil ───────────────────────────────────────────────────── */
const FUNIL = ['novo', 'aguardando_voce', 'abordado', 'conversando', 'fazendo_demo',
  'demo_no_ar', 'fechado', 'com_voce', 'entregue', 'perdido'];
const UM = {
  novo: 'achado', aguardando_voce: 'esperando você', abordado: 'abordado',
  conversando: 'conversando', fazendo_demo: 'fazendo a demo', demo_no_ar: 'demo no ar',
  fechado: 'fechado', com_voce: 'sua vez', entregue: 'entregue', perdido: 'perdido',
  // estágios do painel antigo, para clientes que vieram de lá
  previa: 'prévia pronta', contatado: 'abordado', respondeu: 'conversando',
};
const VARIOS = {
  novo: 'Achados', aguardando_voce: 'Esperando você', abordado: 'Abordados',
  conversando: 'Conversando', fazendo_demo: 'Fazendo a demo', demo_no_ar: 'Demo no ar',
  fechado: 'Fechados', com_voce: 'Sua vez', entregue: 'Entregues', perdido: 'Perdidos',
};
const TOM = { aguardando_voce: 'acento', com_voce: 'acento', fechado: 'bom', entregue: 'bom', perdido: 'ruim' };
const etiqueta = (estagio) => `<span class="pilula${TOM[estagio] ? ` pilula-${TOM[estagio]}` : ''}">${esc(UM[estagio] || estagio)}</span>`;
const acha = (id) => estado.leads.find((l) => l.id === id);

function novoLead(dados = {}) {
  return {
    id: (crypto.randomUUID?.() || String(Date.now() + Math.random())).slice(0, 8),
    estagio: 'novo', criado: Date.now(), conversa: [], sites: {},
    nome: '', tipo: '', cidade: '', endereco: '', telefone: '', whatsapp: '',
    horario: '', itens: [], observacao: '', presenca: 'sem_site_encontrado',
    ...dados,
  };
}

/* Os projetos dos clientes: em produção, finalizados e arquivados (o Jarvis filtra por aqui também).
   Arquivado sai de todas as listas, menos da dos arquivados. Nada é apagado. */
const PRODUCAO = ['fazendo_demo', 'demo_no_ar', 'fechado', 'com_voce'];
const FILTROS_DE_PROJETO = {
  producao: ['Em produção', (l) => PRODUCAO.includes(l.estagio) && !l.projeto_encerrado],
  finalizados: ['Finalizados', (l) => l.estagio === 'entregue' || Boolean(l.projeto_encerrado)],
  arquivados: ['Arquivados', () => true],
};
const passaNoFiltro = (l) => (filtro === 'arquivados' ? Boolean(l.arquivado_em)
  : !l.arquivado_em && (!filtro || (FILTROS_DE_PROJETO[filtro] ? FILTROS_DE_PROJETO[filtro][1](l) : l.estagio === filtro)));

function desenhaQuadro() {
  const conta = Object.fromEntries(FUNIL.map((e) => [e, 0]));
  const ativos = estado.leads.filter((l) => !l.arquivado_em);
  for (const l of ativos) conta[l.estagio] = (conta[l.estagio] || 0) + 1;
  // Aba de estágio vazio é ruído: só aparecem os que têm alguém, e o
  // que está aberto agora.
  const especiais = Object.entries(FILTROS_DE_PROJETO).map(([k, [nome, f]]) => [k, nome,
    k === 'arquivados' ? estado.leads.filter((l) => l.arquivado_em).length : ativos.filter(f).length])
    .filter(([k, , n]) => n || k === filtro);
  const abas = [['', 'Todos', ativos.length], ...especiais,
    ...FUNIL.filter((e) => conta[e] || e === filtro).map((e) => [e, VARIOS[e], conta[e]])];
  poe('#quadro', abas.map(([chave, nome, n]) => `<button class="aba-linha" role="tab"
      aria-selected="${filtro === chave}" data-estagio="${chave}">${esc(nome)}<span class="conta">${n}</span></button>`).join(''));
  const fechados = (conta.fechado || 0) + (conta.com_voce || 0) + (conta.entregue || 0);
  texto('#clientes-sub', estado.leads.length
    ? `${plural(estado.leads.length, 'cliente', 'clientes')} no funil · ${conta.conversando || 0} conversando · ${plural(fechados, 'fechado', 'fechados')}`
    : 'Quem a matilha acha entra aqui, e anda pelo funil sozinho.');
}

function desenhaLista() {
  const busca = ($('#busca').value || '').toLowerCase();
  const visiveis = estado.leads
    .filter((l) => passaNoFiltro(l)
      && (!busca || (l.nome || '').toLowerCase().includes(busca)))
    .sort((a, b) => (b.pontuacao || b.pontos || 0) - (a.pontuacao || a.pontos || 0) || (b.criado || 0) - (a.criado || 0));
  $('#vazio').hidden = estado.leads.length !== 0;
  texto('#clientes-total', estado.leads.length ? `${visiveis.length} na lista` : '');
  poe('#lista', visiveis.map((l) => {
    const pontos = l.pontuacao ?? l.pontos;
    return `<button class="cliente" role="listitem" data-id="${esc(l.id)}">
      <span class="cliente-texto"><b>${esc(l.nome || 'sem nome')}</b>
        <span>${esc([l.tipo, l.cidade, l.whatsapp ? `WhatsApp ${l.whatsapp}` : 'sem WhatsApp'].filter(Boolean).join(' · '))}</span></span>
      ${etiqueta(l.estagio)}${l.arquivado_em ? '<span class="pilula">arquivado</span>' : ''}${l.projeto_encerrado ? `<span class="pilula">${esc(l.projeto_encerrado.estado)}</span>` : ''}
      <span class="pontos num">${pontos ? `${pontos}/10` : ''}</span>
    </button>`;
  }).join(''));
}

function desenha() { desenhaQuadro(); desenhaLista(); desenhaFilas(); desenhaResultados(); }

/* ── o analista: resposta, demo e venda por ramo, cidade e abertura ── */
function contaFunil(leads) {
  const abordados = leads.filter((l) => l.abordado_em);
  const responderam = abordados.filter((l) => (l.conversa || []).some((m) => m.quem === 'dono'));
  const demo = abordados.filter((l) => l.sites?.demo || l.vendeu_em || ['fazendo_demo', 'demo_no_ar'].includes(l.estagio));
  const venda = abordados.filter((l) => l.vendeu_em);
  return { n: abordados.length, resp: responderam.length, demo: demo.length, venda: venda.length };
}
const pct = (a, n) => (n ? `${Math.round((a / n) * 100)}%` : '–');
const chaveDe = (t) => String(t || 'sem ramo').trim().toLowerCase();
function tabelaFunil(titulo, grupos) {
  return `<table class="tabela-funil"><caption>${esc(titulo)}</caption>
    <thead><tr><th scope="col"></th><th scope="col">Contatos</th><th scope="col">Responderam</th><th scope="col">Viram a demo</th><th scope="col">Fecharam</th></tr></thead>
    <tbody>${grupos.map(([nome, f]) => `<tr><th scope="row">${esc(nome)}</th><td>${f.n}</td><td>${pct(f.resp, f.n)}</td><td>${pct(f.demo, f.n)}</td><td>${pct(f.venda, f.n)}${f.venda ? ` <small>(${f.venda})</small>` : ''}</td></tr>`).join('')}</tbody></table>`;
}
function agrupa(leads, chave) {
  const g = new Map();
  for (const l of leads) { const k = chave(l); if (!g.has(k)) g.set(k, []); g.get(k).push(l); }
  return [...g].map(([k, ls]) => [k, contaFunil(ls)]).filter(([, f]) => f.n).sort((a, b) => b[1].n - a[1].n);
}
function desenhaResultados() {
  if (!$('#r-tabelas')) return;
  $('#r-teste-ab').checked = estado.ajustes.testeAB !== false;
  const leads = estado.leads.filter((l) => l.abordado_em);
  if (!leads.length) {
    poe('#r-tabelas', '<p class="vazio">Ainda ninguém foi abordado. Os números aparecem aqui a partir do primeiro contato.</p>');
    texto('#r-dica', '');
    return;
  }
  const abertura = agrupa(leads, (l) => (l.variante === 'B' ? 'B · pergunta' : l.variante === 'A' ? 'A · nota do Google' : 'antes do teste'));
  const ramos = agrupa(leads, (l) => chaveDe(l.tipo)).slice(0, 8);
  const cidades = agrupa(leads, (l) => chaveDe(l.cidade)).slice(0, 8);
  poe('#r-tabelas', [tabelaFunil('Abertura do primeiro contato', abertura), tabelaFunil('Por ramo', ramos), tabelaFunil('Por cidade', cidades)].join(''));
  // A dica: só com amostra que valha (10 contatos ou mais).
  const taxa = (f) => (f.venda ? f.venda / f.n : 0) * 100 + (f.resp / f.n);
  const melhor = (lista) => lista.filter(([, f]) => f.n >= 10).sort((a, b) => taxa(b[1]) - taxa(a[1]))[0];
  const partes = [];
  const r = melhor(ramos); const c = melhor(cidades);
  const ab = abertura.filter(([k, f]) => k !== 'antes do teste' && f.n >= 10);
  if (r) partes.push(`Ramo que mais rende: <b>${esc(r[0])}</b> (${pct(r[1].resp, r[1].n)} respondem, ${pct(r[1].venda, r[1].n)} fecham).`);
  if (c) partes.push(`Cidade: <b>${esc(c[0])}</b>.`);
  if (ab.length === 2) {
    const [x, y] = ab.sort((a, b) => taxa(b[1]) - taxa(a[1]));
    partes.push(`A abertura <b>${esc(x[0])}</b> está na frente da ${esc(y[0])} (${pct(x[1].resp, x[1].n)} contra ${pct(y[1].resp, y[1].n)} de resposta).`);
  }
  poe('#r-dica', partes.length ? partes.join(' ') : 'Ainda pouco contato para apontar um vencedor (o analista espera 10 por grupo).');
}

/* ── a ficha ───────────────────────────────────────────────────── */

function abreFicha(id) {
  const l = acha(id);
  if (!l) return;
  // Quem está aberto fica no próprio diálogo: os botões da ficha leem
  // daqui em vez de depender de uma variável solta.
  $('#ficha').dataset.id = id;
  const zap = (msg) => (l.whatsapp ? `https://wa.me/${l.whatsapp}?text=${encodeURIComponent(msg)}` : '');
  const bt = (faz, rotulo, extra = '', classe = 'bt-contorno') => `<button class="bt ${classe} bt-pequeno" data-faz="${faz}" ${extra}>${rotulo}</button>`;
  poe('#ficha-corpo', `
    <h2 id="ficha-titulo">${esc(l.nome)}</h2>
    <p class="nota">${esc([l.tipo, l.cidade].filter(Boolean).join(' · '))} ${etiqueta(l.estagio)}
      ${l.arquivado_em ? '<span class="pilula">arquivado</span>' : ''}${l.projeto_encerrado ? `<span class="pilula">projeto ${esc(l.projeto_encerrado.estado)}</span>` : ''}</p>
    <div class="acoes ficha-projeto">
      ${l.arquivado_em ? bt('projeto', 'Desarquivar', 'data-acao-projeto="project.unarchive"', 'bt-texto') : bt('projeto', 'Arquivar o projeto', 'data-acao-projeto="project.archive"', 'bt-texto')}
      ${l.projeto_encerrado ? '' : bt('projeto', 'Encerrar o projeto', 'data-acao-projeto="project.close"', 'bt-texto')}
    </div>
    ${l.briefing_marca ? `<section class="passo"><h3>Briefing de marca · Brand Strategist</h3>
      <p>${esc(l.briefing_marca.resumo)}</p>
      <p class="nota">Direção de arte: ${esc(l.briefing_marca.direcao_de_arte?.nome || '')} — ${esc(l.briefing_marca.direcao_de_arte?.uso || '')}. Seções: ${esc(l.briefing_marca.secoes || '')}</p></section>` : ''}

    <section class="passo">
      <h3>Dados do negócio</h3>
      <div class="campos dois">
        <label class="campo"><span>Nome</span><input data-campo="nome" value="${esc(l.nome)}"></label>
        <label class="campo"><span>Ramo</span><input data-campo="tipo" value="${esc(l.tipo)}" placeholder="pizzaria, pousada…"></label>
        <label class="campo"><span>Cidade</span><input data-campo="cidade" value="${esc(l.cidade)}"></label>
        <label class="campo"><span>WhatsApp (só números)</span><input data-campo="whatsapp" value="${esc(l.whatsapp)}" placeholder="5544988887777" inputmode="numeric"></label>
        <label class="campo"><span>Endereço</span><input data-campo="endereco" value="${esc(l.endereco)}"></label>
        <label class="campo"><span>Horário</span><input data-campo="horario" value="${esc(l.horario)}" placeholder="Ter a Dom, 11h às 15h"></label>
      </div>
      <label class="campo"><span>Três itens da vitrine, um por linha</span>
        <textarea data-campo="itens" rows="3">${esc((l.itens || []).join('\n'))}</textarea></label>
      <div class="acoes">${bt('salvar', 'Salvar dados')}</div>
      <p class="nota" id="pendencias"></p>
    </section>

    <section class="passo">
      <h3>O site · o estúdio monta</h3>
      <div class="acoes">
        ${bt('site', 'Gerar a prévia', 'data-versao="demo"')}
        ${bt('site', 'Gerar o site oficial', 'data-versao="oficial"')}
        ${l.sites?.demo?.html ? bt('baixar', 'Baixar o HTML', 'data-versao="demo"', 'bt-texto') : ''}
      </div>
      <iframe class="previa-site" id="previa-site" title="Prévia do site" ${l.sites?.demo?.html ? '' : 'hidden'}></iframe>
    </section>

    <section class="passo">
      <h3>Publicar · o publicador põe no ar</h3>
      <div class="acoes">
        ${bt('publicar', 'Publicar a prévia', 'data-versao="demo"')}
        ${bt('publicar', 'Publicar o oficial', 'data-versao="oficial"')}
      </div>
      ${['demo', 'oficial'].filter((v) => l.sites?.[v]?.url).map((v) => `
        <p class="nota">${v === 'demo' ? 'Prévia' : 'Oficial'}:
          <a href="${esc(l.sites[v].url)}" target="_blank" rel="noopener">${esc(l.sites[v].url)}</a></p>`).join('')}
    </section>

    <section class="passo">
      <h3>A conversa · o vendedor escreve</h3>
      <div class="conversa">${(l.conversa || []).map((m) => `
        <div class="fala ${m.quem === 'dono' ? 'dono' : 'voce'}">${esc(m.texto)}${m.motor ? `<span class="bolha-meta"><br>escrita pelo ${esc(m.motor)}</span>` : ''}</div>`).join('')
        || '<p class="nota">Nenhuma mensagem ainda.</p>'}</div>
      <div class="acoes">
        ${bt('escrever', 'Escrever a abordagem', 'data-tipo="abordagem"')}
        ${bt('escrever', 'Responder o que ele mandou', 'data-tipo="resposta"')}
        ${bt('escrever', 'Escrever um lembrete', 'data-tipo="seguimento"', 'bt-texto')}
      </div>
      ${l.revisar ? `<p class="aviso">Esta mensagem foi segurada pelo conferidor: ${esc((l.revisar.problemas || []).join(', '))}. Corrija antes de mandar.</p>` : ''}
      <label class="campo" style="margin-top:14px"><span>Rascunho (confira antes de mandar)</span>
        <textarea id="rascunho" rows="5">${esc(l.rascunho || l.revisar?.mensagem || '')}</textarea></label>
      <div class="acoes">
        ${bt('enviar', 'Enviar pelo WhatsApp Web', '', 'bt-primario')}
        <a class="bt bt-contorno bt-pequeno" id="mandar" href="#" target="_blank" rel="noopener">Abrir no WhatsApp</a>
        ${bt('enviei', 'Já mandei à mão', '', 'bt-texto')}
        ${bt('colar', 'Colar a resposta dele', '', 'bt-texto')}
      </div>
    </section>

    <section class="passo">
      <h3>Em que ponto do funil ele está</h3>
      <div class="passo-estagios">
        ${FUNIL.map((e) => `<button class="bt bt-contorno bt-pequeno" data-faz="estagio" data-estagio="${e}"
          aria-pressed="${l.estagio === e}">${esc(UM[e])}</button>`).join('')}
      </div>
      <div class="acoes">${bt('apagar', 'Apagar este cliente', '', 'bt-texto bt-perigo')}</div>
    </section>`);

  const atualizaZap = () => {
    const msg = $('#rascunho')?.value || '';
    const a = $('#mandar');
    const link = zap(msg);
    a.href = link || '#';
    a.setAttribute('aria-disabled', String(!(link && msg.trim())));
    a.title = link ? '' : 'Sem WhatsApp cadastrado neste cliente';
  };
  $('#mandar').addEventListener('click', (ev) => {
    if (ev.currentTarget.getAttribute('aria-disabled') === 'true') ev.preventDefault();
  });
  $('#rascunho')?.addEventListener('input', atualizaZap);
  atualizaZap();
  if (l.sites?.demo?.html) $('#previa-site').srcdoc = l.sites.demo.html;
  mostraPendencias(l);
  if (!$('#ficha').open) $('#ficha').showModal();
  controleDeTela?.reporta();
}

function mostraPendencias(l) {
  const falta = [];
  if (!l.endereco) falta.push('endereço');
  if (!l.whatsapp) falta.push('WhatsApp');
  if (!l.horario) falta.push('horário');
  if (!(l.itens || []).length) falta.push('itens da vitrine');
  poe('#pendencias', falta.length
    ? `Falta: <b>${falta.join(', ')}</b>. O site não inventa nada disso: ele deixa o lugar marcado e você pergunta ao dono.`
    : 'Dados completos.');
}

const idAberto = () => $('#ficha').dataset.id;
function marcaAbordado(l) {
  if (['novo', 'aguardando_voce', 'previa'].includes(l.estagio)) l.estagio = 'abordado';
  if (!l.abordado_em) l.abordado_em = Date.now();
}

document.addEventListener('click', async (ev) => {
  const cartao = ev.target.closest('#lista .cliente');
  if (cartao) { abreFicha(cartao.dataset.id); return; }

  const aba = ev.target.closest('#quadro [data-estagio]');
  if (aba) { filtro = aba.dataset.estagio; desenhaQuadro(); desenhaLista(); return; }

  const botao = ev.target.closest('#ficha-corpo [data-faz]');
  if (!botao || botao.tagName === 'SELECT') return;
  const l = acha(idAberto());
  if (!l) return;
  const faz = botao.dataset.faz;

  if (faz === 'salvar') {
    $$('#ficha-corpo [data-campo]').forEach((campo) => {
      const v = campo.value;
      l[campo.dataset.campo] = campo.dataset.campo === 'itens'
        ? v.split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 6) : v.trim();
    });
    l.whatsapp = (l.whatsapp || '').replace(/\D/g, '');
    salva(); desenha(); mostraPendencias(l);
    recado('Dados salvos.', 'bom');
  }

  if (faz === 'site') {
    const versao = botao.dataset.versao;
    await ocupado(botao, async () => {
      const r = await agente('estudio', { lead: l, versao, autor: estado.ajustes.autor || '' });
      l.sites = l.sites || {};
      l.sites[versao] = { ...(l.sites[versao] || {}), html: r.html, feito: Date.now() };
      salva(); desenha();
      const quadro = $('#previa-site');
      if (quadro) { quadro.hidden = false; quadro.srcdoc = r.html; }
      recado(r.descartados?.length
        ? `Site pronto. Tirei do texto: ${r.descartados.join(' · ')}`
        : 'Site pronto.', 'bom');
    });
  }

  if (faz === 'baixar') {
    const html = l.sites?.[botao.dataset.versao]?.html;
    if (!html) { recado('Gere o site primeiro.', 'ruim'); return; }
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    const a = Object.assign(document.createElement('a'),
      { href: url, download: `${(l.nome || 'site').toLowerCase().replace(/\W+/g, '-')}.html` });
    a.click(); URL.revokeObjectURL(url);
  }

  if (faz === 'publicar') {
    const versao = botao.dataset.versao;
    const html = l.sites?.[versao]?.html;
    if (!html) { recado(`Gere ${versao === 'demo' ? 'a prévia' : 'o site oficial'} primeiro.`, 'ruim'); return; }
    await ocupado(botao, async () => {
      const r = await agente('publicar', { lead: l, versao, html });
      l.sites[versao] = { ...l.sites[versao], url: r.url, site_id: r.site_id };
      salva(); desenha(); abreFicha(l.id);
      recado(`No ar: ${r.url}. Abra e confira antes de mandar.`, 'bom');
    });
  }

  if (faz === 'escrever') {
    await ocupado(botao, async () => {
      const r = await agente('escrever', {
        tipo: botao.dataset.tipo, lead: l, historico: l.conversa,
        autor: estado.ajustes.autor || '', preco: estado.ajustes.preco || '',
        link: l.sites?.demo?.url || '',
      });
      l.rascunho = r.mensagem;
      salva(); abreFicha(l.id);
      if (r.revisar?.length) recado(`Revise antes de mandar: ${r.revisar.join(', ')}.`, 'ruim');
      else if (r.motor) recado(`Rascunho escrito pelo ${r.motor}.`, 'bom');
    });
  }

  if (faz === 'enviar') {
    const msg = $('#rascunho').value.trim();
    if (!msg) { recado('Não há rascunho para enviar.', 'ruim'); return; }
    if (!l.whatsapp) { recado('Este cliente não tem WhatsApp cadastrado.', 'ruim'); return; }
    if (!confirm(`Enviar AGORA para ${l.nome}?\n\n${msg}`)) return;
    await ocupado(botao, async () => {
      const r = await pede('/api/zap/enviar', { numero: l.whatsapp, texto: msg });
      if (!r.enviada) {
        // Nada de registrar conversa que talvez não tenha saído: o
        // histórico é a memória do que o cliente já ouviu.
        throw new Error(r.motivo + (r.print ? ` (print em ${r.print})` : ''));
      }
      l.conversa.push({ quem: 'voce', texto: msg, quando: Date.now() });
      // Você respondeu: o vendedor não responde de novo a mesma coisa.
      l.respondido_ate = l.conversa.length;
      l.rascunho = '';
      l.revisar = null;
      marcaAbordado(l);
      salva(); desenha(); abreFicha(l.id);
      recado('Enviada, e conferida na conversa.', 'bom');
      zapEstado();
    });
  }

  if (faz === 'enviei') {
    const msg = $('#rascunho').value.trim();
    if (!msg) { recado('Não há rascunho para marcar.', 'ruim'); return; }
    l.conversa.push({ quem: 'voce', texto: msg, quando: Date.now() });
    l.respondido_ate = l.conversa.length;
    l.rascunho = '';
    l.revisar = null;
    marcaAbordado(l);
    salva(); desenha(); abreFicha(l.id);
  }

  if (faz === 'colar') {
    const msg = prompt('Cole aqui o que o dono respondeu:');
    if (!msg) return;
    l.conversa.push({ quem: 'dono', texto: msg.slice(0, 4000), quando: Date.now() });
    if (['novo', 'aguardando_voce', 'abordado', 'previa', 'contatado'].includes(l.estagio)) l.estagio = 'conversando';
    salva(); desenha(); abreFicha(l.id);
  }

  if (faz === 'estagio') { l.estagio = botao.dataset.estagio; salva(); desenha(); abreFicha(l.id); }

  // Arquivar e encerrar: o mesmo registro de ações do Jarvis (com a mesma regra e a mesma auditoria).
  if (faz === 'projeto') {
    await ocupado(botao, async () => {
      const acao = botao.dataset.acaoProjeto;
      let r = await pede('/api/acoes/executar', { acao, parametros: { projeto: l.nome }, cliente: controleDeTela?.cliente, comando: `${botao.textContent.trim()} (${l.nome})` });
      if (r.execucao.estado === 'esperando_confirmacao') {
        if (!confirm(`${r.execucao.pendente.descricao[0].toUpperCase()}${r.execucao.pendente.descricao.slice(1)}. Continuar?`)) return;
        r = await pede('/api/acoes/executar', { continua: r.execucao.id, confirmados: [r.execucao.pendente.passo], cliente: controleDeTela?.cliente });
      }
      const p = r.execucao.passos.at(-1);
      if (p.erro) throw new Error(p.erro);
      recado(p.resultado, 'bom');
      await carrega(); desenha(); abreFicha(l.id);
    });
    return;
  }

  if (faz === 'apagar') {
    if (!confirm(`Apagar ${l.nome}? Não tem volta.`)) return;
    estado.leads = estado.leads.filter((x) => x.id !== l.id);
    salva(); desenha(); $('#ficha').close();
  }
});

/* ══ HOJE ═══════════════════════════════════════════════════════ */
const NOME_SETOR = {
  cacador: 'Os caçadores', ofertas: 'O Offer Architect', vendedor: 'O vendedor', estudio: 'O estúdio', publicador: 'O publicador', dominio: 'O domínio',
};
const CURTO_SETOR = { cacador: 'Caçadores', ofertas: 'Ofertas', vendedor: 'Vendedor', estudio: 'Estúdio', publicador: 'Publicador', dominio: 'Domínio' };
/* As tarefas têm nome de código ("fazer_site · Açaí da Praça"). Na tela, verbo. */
const FAZENDO = {
  cacar: 'caçando', abordar: 'abordando', responder: 'respondendo', passar: 'passando para você',
  fazer_site: 'montando o site', publicar: 'publicando', avisar_demo: 'mandando a demo', avisar_entrega: 'avisando da entrega',
  sugerir: 'procurando nomes .com.br', escolha: 'conferindo o nome escolhido', conferir: 'conferindo se o domínio abre',
  pedir_dominio: 'perguntando o nome do endereço', cobrar: 'cobrando a mensalidade', relatorio: 'mandando o relatório do mês',
  'offer.generate': 'montando a oferta', ler_cardapio: 'lendo o cardápio', fazer_oficial: 'fazendo o oficial', alterar: 'alterando o site',
};
const humano = (s) => String(s || '').replace(/^([a-z_.]+)/, (t) => FAZENDO[t] || t.replace(/_/g, ' '));

/** "abre em 2h14" / "abre em 35min" — quanto falta para a janela abrir. */
function daquiA(ms) {
  if (!ms || ms <= 0) return '';
  const min = Math.round(ms / 60000);
  if (min < 60) return `abre em ${min}min`;
  return `abre em ${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`;
}

function estadoDoMotor(op, fluxo) {
  const trabalhando = (fluxo?.trabalhadores || []).filter((t) => t.fazendo);
  const dormindo = (fluxo?.trabalhadores || []).some((t) => t.dormindoAte);
  const ligada = Boolean(op?.ligada);
  return { trabalhando, codigo: ligada ? (trabalhando.length || !dormindo ? 'rodando' : 'espera') : 'parado' };
}

function desenhaFluxo(e) {
  ultimoFluxo = e;
  const op = e.operacao || {};
  const hoje = op.hoje || {};
  const meta = op.meta || { vendas: 1 };
  const { trabalhando, codigo } = estadoDoMotor(op, e);

  // O pulso, de qualquer tela.
  const pulso = $('#pulso');
  pulso.className = `pulso ${codigo}`;
  texto('#pulso-texto', { rodando: 'Matilha solta', espera: 'Fora do horário', parado: 'Matilha recolhida' }[codigo]);
  texto('#carimbo', `atualizado às ${new Date().toLocaleTimeString('pt-BR')}`);

  texto('#motor-linha', trabalhando.length
    ? trabalhando.map((t) => `${CURTO_SETOR[t.setor] || t.setor}: ${humano(t.fazendo)}`).join(' · ')
    : codigo === 'espera'
      ? 'Fora do horário de trabalho: nada sai agora, e a matilha volta sozinha.'
      : op.ligada
        ? 'A matilha está solta, esperando a próxima tarefa.'
        : op.batida
          ? 'Meta batida. Quem já está conversando continua sendo respondido.'
          : `A matilha está recolhida${op.parou_por ? `: ${op.parou_por}` : '. Solte para ela caçar e abordar sozinha.'}`);

  $('#o-comecar').hidden = Boolean(op.ligada);
  $('#o-parar').hidden = !op.ligada;
  const comecarCacada = $('#o-comecar-cacada');
  if (comecarCacada) comecarCacada.innerHTML = op.ligada
    ? `${icone('play')}Salvar e continuar caçando` : `${icone('play')}Salvar e soltar a matilha`;

  texto('#motor-vendas', hoje.vendas || 0);
  texto('#motor-de', ` de ${meta.vendas}`);
  $('#motor-barra').style.width = `${meta.vendas ? Math.min(1, (hoje.vendas || 0) / meta.vendas) * 100 : 0}%`;
  texto('#o-estado', op.batida ? 'Meta batida hoje.'
    : `${plural(op.faltam ?? meta.vendas, 'venda falta', 'vendas faltam')} para a meta.`);
  texto('#n-cacados', hoje.achados || 0);
  texto('#n-cacados-nota', meta.tetoAchados ? `de no máximo ${meta.tetoAchados}` : 'negócios sem site');
  texto('#n-abordados', hoje.contatos || 0);
  texto('#n-abordados-nota', meta.tetoContatos ? `de no máximo ${meta.tetoContatos}` : 'primeiros contatos');
  const funil = e.funil || {};
  texto('#n-conversando', (funil.conversando || 0) + (funil.abordado || 0) + (funil.demo_no_ar || 0));
  texto('#n-suavez', funil.com_voce || 0);

  // Os dois horários, e se estão abertos AGORA.
  const h = e.horarios || {};
  const linha = (nome, j) => (j ? `${nome}: ${j.aberta ? 'aberto agora' : `fechado, ${daquiA(j.abreEm)}`}` : '');
  texto('#f-horarios', [linha('Falar', h.falar), linha('Trabalhar', h.trabalhar)].filter(Boolean).join(' · '));

  // Avançado: ligar e desligar tudo.
  poe('#f-estado', e.ligado
    ? '<span class="pilula pilula-bom">ligados</span> Os agentes estão girando.'
    : '<span class="pilula">desligados</span> Nada acontece sozinho.');

  const u = e.ultimo || {};
  poe('#f-ultimo', u.quando
    ? `<p>O observador, às ${hora(u.quando)}:</p>`
      + [...(u.fez || []).map((x) => `<p>${esc(x)}</p>`), ...(u.erros || []).map((x) => `<p class="ruim">${esc(x)}</p>`)].slice(-8).join('')
    : '');

  desenhaTrilhas(e, op);
  mostraCampos(op);
  desenhaJanelasAgora(e.matilha);
}

/* A MATILHA AGORA: uma faixa por agente; na dos caçadores, uma casinha
   por janela de Chrome. */
function desenhaTrilhas(e, op) {
  const mural = e.mural || {};
  const porNome = Object.fromEntries((e.trabalhadores || []).map((t) => [t.setor, t]));
  const m = e.matilha || {};
  const ordem = ['cacador', 'ofertas', 'vendedor', 'estudio', 'publicador', 'dominio'];

  poe('#f-setores', ordem.filter((s) => (mural.setores || {})[s] || porNome[s]).map((setor) => {
    const c = (mural.setores || {})[setor] || {};
    const t = porNome[setor] || {};
    const classe = c.travada ? 'travada' : t.fazendo ? 'trabalhando' : t.dormindoAte ? 'dormindo' : '';
    let agora = !t.ligado ? 'parado'
      : t.dormindoAte ? `fora do horário, volta às ${hora(t.dormindoAte)}`
        : t.fazendo ? esc(humano(t.fazendo)) : 'esperando tarefa';
    if (setor === 'vendedor' && claude) {
      const quem = claude.ligado ? (claude.pausadoAte ? 'Claude em pausa' : 'escreve com o Claude') : 'escreve com o Groq';
      agora += ` <span class="pilula${claude.ligado && !claude.pausadoAte ? ' pilula-acento' : ''}">${quem}</span>`;
    }
    const conta = `${c.esperando || 0} na caixa · ${t.feitas || 0} feitas`
      + (c.travada ? ` · <span class="ruim">${c.travada} travada${c.travada > 1 ? 's' : ''}</span>` : '');

    let extra = '';
    if (setor === 'cacador') {
      const andando = Array.isArray(m.emAndamento) ? m.emAndamento : [];
      const quantas = Math.max(Number(op?.meta?.cacadores) || 0, andando.length, m.janelas || 0, 1);
      extra = `<ol class="janelas" aria-label="Janelas dos caçadores">${Array.from({ length: quantas }, (_, i) => {
        const busca = andando[i];
        const aberta = i < (m.janelas || 0);
        const tipo = busca ? 'ativa' : aberta ? '' : 'fechada';
        const diz = busca || (aberta ? 'parada' : 'fechada');
        return `<li class="janela ${tipo}" title="Caçador ${i + 1}: ${esc(diz)}"><span class="janela-n">${i + 1}</span><span class="janela-busca">${esc(diz)}</span></li>`;
      }).join('')}</ol>`;
      if (m.etapa === 'caçando') {
        extra += `<p class="leva num">Nesta leva: <b>${m.lidos || 0}</b> lidos · <b>${m.achados || 0}</b> sem site · ${m.descartados || 0} já tinham site · ${plural(m.total || 0, 'busca', 'buscas')}</p>`;
      } else if (m.etapa === 'parado_verificacao') {
        extra += '<p class="leva ruim-texto">O Google pediu verificação. Resolva na janela do caçador e a matilha segue.</p>';
      }
    }
    return `<div class="trilha ${classe}">
      <div class="trilha-cab"><span class="trilha-ponto" aria-hidden="true"></span>
        <b class="trilha-nome">${NOME_SETOR[setor]}</b>
        <span class="trilha-agora">${agora}</span>
        <span class="trilha-conta num">${conta}</span></div>${extra}</div>`;
  }).join('') || '<p class="vazio">Os agentes ainda não responderam.</p>');

  const recentes = mural.ultimas || [];
  texto('#f-ultimo-quando', recentes.length ? `última às ${hora(recentes[0].quando)}` : '');
  poe('#f-recentes', recentes.length
    ? recentes.map((t) => `<li class="feito"><span class="feito-hora num">${hora(t.quando)}</span>
        <span class="feito-quem">${esc(CURTO_SETOR[t.setor] || t.setor)}</span>
        <span class="feito-que">${esc(t.nome || '')}${t.nome ? ' ' : ''}<span>${esc(t.resultado || humano(t.tipo))}</span></span></li>`).join('')
    : '<li class="vazio">Nada feito ainda hoje.</li>');

  const travadas = mural.travadas || [];
  $('#cartao-travadas').hidden = !travadas.length;
  poe('#f-travadas', travadas.map((t) => `<div class="item">
      <span class="item-texto"><b>${esc(t.nome || t.tipo)}</b>
        <span>${esc(CURTO_SETOR[t.setor] || t.setor)} · ${esc(humano(t.tipo))} · ${plural(t.tentativas || 0, 'tentativa', 'tentativas')}</span>
        <span class="erro">${esc(t.erro || '')}</span></span>
      <button class="bt bt-contorno bt-pequeno item-acao" data-destrava="${t.id}">Tentar de novo</button>
    </div>`).join(''));

  const adiadas = mural.adiadas || [];
  $('#cartao-adiadas').hidden = !adiadas.length;
  poe('#f-adiadas', adiadas.map((t) => `<div class="item">
      <span class="item-texto"><b>${esc(t.nome || t.tipo)}</b>
        <span>${esc(CURTO_SETOR[t.setor] || t.setor)} · volta às ${hora(t.quando)}</span>
        <span>${esc(t.aviso || '')}</span></span></div>`).join(''));
  confereRail();
}

function desenhaFilas() {
  const fila = estado.leads.filter((l) => l.estagio === 'aguardando_voce');
  const suaVez = estado.leads.filter((l) => l.estagio === 'com_voce');
  $('#cartao-fila').hidden = !fila.length;
  $('#cartao-suavez').hidden = !suaVez.length;
  texto('#conta-fila', fila.length ? `${fila.length} esperando` : '');
  texto('#conta-suavez', suaVez.length ? `${suaVez.length} para fazer` : '');
  poe('#f-fila', fila.map((l) => `<label class="item item-marca">
      <input type="checkbox" class="f-marca" value="${esc(l.id)}">
      <span class="item-texto"><b>${esc(l.nome)}</b>
        <span>${esc([l.tipo, l.cidade, l.whatsapp ? `WhatsApp ${l.whatsapp}` : 'sem WhatsApp'].filter(Boolean).join(' · '))}</span></span>
    </label>`).join(''));
  poe('#f-suavez', suaVez.map((l) => {
    const rascunho = l.sites?.rascunho_oficial;
    return `<div class="item">
      <span class="item-texto"><b>${esc(l.nome)}</b>
        <span class="quebra">${l.entrega_espera_dominio
          ? `Publicado. A entrega sai sozinha quando ${esc(l.dominio?.escolhido || 'o domínio')} estiver no ar.`
          : rascunho
            ? `O estúdio fez o oficial. <a href="/api/fluxo/rascunho?id=${encodeURIComponent(l.id)}" target="_blank" rel="noopener">Conferir</a>`
            : 'O estúdio está fazendo o oficial a partir da demo.'}${(l.pedidos || []).length ? ` · ${l.pedidos.length} pedido(s) do cliente incluído(s)` : ''}</span></span>
      ${l.entrega_espera_dominio
        ? `<button class="bt bt-texto bt-pequeno item-acao" data-sem-dominio="${esc(l.id)}">Entregar com o link provisório</button>`
        : rascunho
          ? `<button class="bt bt-primario bt-pequeno item-acao" data-publicar-rascunho="${esc(l.id)}">Publicar e entregar</button>`
          : `<button class="bt bt-texto bt-pequeno item-acao" data-entregar="${esc(l.id)}">Colar HTML</button>`}
    </div>`;
  }).join(''));
  desenhaCardapios();
  desenhaMensalidades();
  // A pendência do cardápio é resolvida no cartão "Conferir cardápio".
  const pendentes = estado.leads.filter((l) => (l.pendencias || []).some((p) => !p.feito && p.tipo !== 'cardapio'));
  $('#cartao-pendencias').hidden = !pendentes.length;
  poe('#f-pendencias', pendentes.map((l) => (l.pendencias || []).map((p, i) => (p.feito || p.tipo === 'cardapio' ? '' : `<div class="item">
      <span class="item-texto"><b>${esc(l.nome)}</b><span class="quebra">${esc(p.texto)}</span>
        ${p.tipo === 'dominio' ? blocoDominio(l) : ''}
        ${p.tipo === 'qr' && l.sites?.oficial?.url ? `<span class="quebra"><a href="/api/fluxo/qr?id=${encodeURIComponent(l.id)}" target="_blank" rel="noopener">Abrir a plaquinha para imprimir</a></span>` : ''}
        ${p.tipo === 'google' ? `<span class="quebra">Mande ao cliente: "No Google, abra a ficha da ${esc(l.nome)} → Editar perfil → Contato → Site, e cole ${esc(l.sites?.oficial?.dominio ? `https://${l.sites.oficial.dominio}` : l.sites?.oficial?.url || 'o link do site')}. Se quiser, me adicione como administrador que eu cuido da ficha."</span>` : ''}</span>
      ${p.tipo === 'dominio' ? '' : `<button class="bt bt-texto bt-pequeno item-acao" data-pendencia="${esc(l.id)}:${i}">Feito</button>`}
    </div>`)).join('')).join(''));
  // Domínios comprados entrando no ar: o agente confere sozinho; aqui você vê em que pé está.
  const ligando = estado.leads.filter((l) => l.dominio?.estado === 'ligando');
  if (ligando.length) {
    $('#cartao-pendencias').hidden = false;
    $('#f-pendencias').insertAdjacentHTML('beforeend', ligando.map((l) => `<div class="item">
      <span class="item-texto"><b>${esc(l.nome)} · ${esc(l.dominio.escolhido)}</b>
        <span class="quebra">${l.dominio.ligado_em ? `Ligado na Netlify. O agente confere a cada 15 minutos${l.dominio.problema ? `: ${esc(l.dominio.problema)}` : ''}.` : 'Liga na Netlify assim que o site oficial for publicado.'}</span>
        ${(l.dominio.dns || []).map((d) => `<span class="quebra">${esc(d)}</span>`).join('')}</span>
    </div>`).join(''));
  }
  const chamados = estado.leads.filter((l) => l.precisa_voce);
  $('#cartao-chamados').hidden = !chamados.length;
  texto('#conta-chamados', chamados.length ? String(chamados.length) : '');
  poe('#f-chamados', chamados.map((l) => `<div class="item">
      <span class="item-texto"><b>${esc(l.nome)}</b>
        <span class="quebra">${esc(l.precisa_voce.motivo)} · ${hora(l.precisa_voce.quando)}${l.whatsapp ? ` · WhatsApp ${esc(l.whatsapp)}` : ''}</span></span>
      <button class="bt bt-contorno bt-pequeno item-acao" data-resolvido="${esc(l.id)}">Resolvido</button>
    </div>`).join(''));
  const retidas = estado.leads.filter((l) => l.revisar?.mensagem);
  $('#cartao-retidas').hidden = !retidas.length;
  texto('#conta-retidas', retidas.length ? String(retidas.length) : '');
  poe('#f-retidas', retidas.map((l) => `<div class="item">
      <span class="item-texto"><b>${esc(l.nome)}</b>
        <span class="erro">${esc((l.revisar.problemas || []).join(', '))}</span></span>
      <button class="bt bt-contorno bt-pequeno item-acao" data-abre-ficha="${esc(l.id)}">Abrir</button>
    </div>`).join(''));
  confereRail();
}

/* ── as mensalidades (a mesma conta do cobrador, em agentes/cobranca.mjs) ── */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mesDe = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
function mensalidadeEmAberto(l, agora = Date.now()) {
  if (!l.aprovado_em || l.estagio === 'perdido' || l.cancelado_em) return null;
  const dia = Math.min(28, new Date(l.aprovado_em).getDate());
  const hoje = new Date(agora);
  let vence = new Date(hoje.getFullYear(), hoje.getMonth(), dia, 9);
  if (vence.getTime() > agora) vence = new Date(hoje.getFullYear(), hoje.getMonth() - 1, dia, 9);
  const ap = new Date(l.aprovado_em);
  if (vence < new Date(ap.getFullYear(), ap.getMonth() + 1, dia, 9)) return null;
  const mes = mesDe(vence);
  if ((l.mensalidade?.pagos || []).includes(mes)) return null;
  const avisos = l.mensalidade?.avisos?.[mes] || {};
  return { mes, nome: MESES[vence.getMonth()], dias: Math.floor((agora - vence.getTime()) / 864e5), avisos };
}
function desenhaMensalidades() {
  const lista = estado.leads.map((l) => ({ l, m: mensalidadeEmAberto(l) })).filter((x) => x.m)
    .sort((a, b) => b.m.dias - a.m.dias);
  $('#cartao-mensalidades').hidden = !lista.length;
  texto('#conta-mensalidades', lista.length ? String(lista.length) : '');
  poe('#f-mensalidades', lista.map(({ l, m }) => `<div class="item">
      <span class="item-texto"><b>${esc(l.nome)}</b>
        <span class="quebra">${esc(m.nome)} · ${m.dias ? `venceu há ${m.dias} dia${m.dias > 1 ? 's' : ''}` : 'vence hoje'}${m.avisos.atraso ? ' · lembrete enviado' : m.avisos.vencimento ? ' · avisado' : ''}</span></span>
      <button class="bt bt-contorno bt-pequeno item-acao" data-pagou="${esc(l.id)}:${esc(m.mes)}">Pagou</button>
    </div>`).join(''));
}

/** A pendência do domínio: os nomes livres, o link de compra e o "Comprei". */
function blocoDominio(l) {
  const d = l.dominio || {};
  const sugestoes = (d.sugestoes || []).map((s) => `${esc(s.dominio)}${s.livre === true ? ' (livre)' : s.livre === null ? ' (confira)' : ''}`).join(' · ');
  const escolhido = d.escolhido || '';
  return `${sugestoes ? `<span class="quebra">Livres: ${sugestoes}${d.escolhido_pelo_cliente ? ` · o cliente escolheu <b>${esc(escolhido)}</b>` : d.estado === 'escolher' ? ' · o vendedor perguntou qual ele prefere' : ''}</span>` : ''}
    <span class="linha-dominio"><input value="${esc(escolhido)}" placeholder="nomedonegocio.com.br" data-dominio-de="${esc(l.id)}" aria-label="Domínio de ${esc(l.nome)}">
      <a class="bt bt-contorno bt-pequeno" data-compra-dominio="${esc(l.id)}" href="https://registro.br/busca-dominio/?fqdn=${encodeURIComponent(escolhido)}" target="_blank" rel="noopener">Comprar no Registro.br</a>
      <button class="bt bt-primario bt-pequeno" data-comprei-dominio="${esc(l.id)}">Comprei</button></span>`;
}

/**
 * O cartão "Conferir cardápio": restaurante que fechou e ainda não teve o
 * cardápio conferido. Com um editor aberto, o cartão não é redesenhado
 * (senão a atualização automática apagava o que você estava corrigindo).
 */
function desenhaCardapios() {
  const lista = estado.leads.filter((l) => l.vendeu_em && !l.cardapio?.conferido
    && (l.cardapio?.itens?.length || (l.pendencias || []).some((p) => p.tipo === 'cardapio' && !p.feito)));
  $('#cartao-cardapio').hidden = !lista.length;
  texto('#conta-cardapio', lista.length ? String(lista.length) : '');
  if ($('#f-cardapio .editor-cardapio:not([hidden])')) return;
  poe('#f-cardapio', lista.map((l) => {
    const n = l.cardapio?.itens?.length || 0;
    const de = l.cardapio?.fonte === 'whatsapp' ? 'da foto que ele mandou' : 'das fotos do Instagram e do Maps';
    return `<div class="item item-coluna">
      <div class="item-linha">
        <span class="item-texto"><b>${esc(l.nome)}</b>
          <span class="quebra">${n ? `${n} itens lidos ${de}` : 'Esperando a foto do cardápio pelo WhatsApp'} · escolheu ${l.produto === 'cardapio' ? 'só o cardápio digital' : 'o site completo'}</span></span>
        <button class="bt bt-contorno bt-pequeno item-acao" data-abre-cardapio="${esc(l.id)}">${n ? 'Conferir' : 'Digitar eu mesmo'}</button>
      </div>
      <div class="editor-cardapio" data-editor-de="${esc(l.id)}" hidden></div>
    </div>`;
  }).join(''));
}

async function abreCardapio(id) {
  const caixa = $(`[data-editor-de="${CSS.escape(id)}"]`);
  if (!caixa) return;
  if (!caixa.hidden) { caixa.hidden = true; return; }
  const r = await fluxoPede(`/cardapio?id=${encodeURIComponent(id)}`);
  const fotos = Array.from({ length: r.fotos || 0 }, (_, n) => {
    const src = `/api/fluxo/cardapio-foto?id=${encodeURIComponent(id)}&n=${n}`;
    return `<a href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="Foto ${n + 1} do cardápio" loading="lazy"></a>`;
  }).join('');
  caixa.innerHTML = `${fotos ? `<div class="fotos-cardapio">${fotos}</div>` : ''}
    <p class="ajuda">Uma linha por item: <code>nome | descrição | preço</code>. Categoria começa com <code>#</code>. Compare com a foto: o preço que ficar aqui é o que vai ao ar.${r.observacao ? ` Observação do estúdio: ${esc(r.observacao)}` : ''}</p>
    <textarea rows="12" data-cardapio-texto="${esc(id)}" aria-label="Cardápio" placeholder="# Pizzas&#10;Calabresa | molho, calabresa e cebola | R$ 42,00">${esc(r.texto || '')}</textarea>
    <div class="acoes"><button class="bt bt-primario bt-pequeno" data-confere-cardapio="${esc(id)}">Está certo, usar este cardápio</button></div>`;
  caixa.hidden = false;
}

document.addEventListener('click', (ev) => {
  const abreCard = ev.target.closest('[data-abre-cardapio]');
  if (abreCard) {
    ocupado(abreCard, () => abreCardapio(abreCard.dataset.abreCardapio));
    return;
  }
  const confere = ev.target.closest('[data-confere-cardapio]');
  if (confere) {
    const id = confere.dataset.confereCardapio;
    const lista = $(`[data-cardapio-texto="${CSS.escape(id)}"]`)?.value || '';
    ocupado(confere, async () => {
      const r = await fluxoPede('/cardapio', { id, texto: lista });
      $(`[data-editor-de="${CSS.escape(id)}"]`).hidden = true;
      recado(`Cardápio conferido (${r.itens} itens): ${r.proximo}.`, 'bom');
      await atualizaAgentes();
    });
    return;
  }
  const publicar = ev.target.closest('[data-publicar-rascunho]');
  if (publicar) {
    if (!confirm('Publicar o site oficial e mandar o link para o cliente aprovar?')) return;
    ocupado(publicar, async () => {
      await fluxoPede('/entregar', { id: publicar.dataset.publicarRascunho });
      recado('Na caixa do publicador. Ele põe no ar e o vendedor pede a aprovação do cliente.', 'bom');
      await atualizaAgentes();
    });
    return;
  }
  const compra = ev.target.closest('[data-compra-dominio]');
  if (compra) {
    // O link segue o nome que estiver no campo (você pode trocar o nome).
    const nome = $(`[data-dominio-de="${compra.dataset.compraDominio}"]`)?.value.trim() || '';
    compra.href = `https://registro.br/busca-dominio/?fqdn=${encodeURIComponent(nome)}`;
    return;
  }
  const comprei = ev.target.closest('[data-comprei-dominio]');
  if (comprei) {
    const id = comprei.dataset.compreiDominio;
    const dominio = $(`[data-dominio-de="${id}"]`)?.value || '';
    if (!confirm(`Você comprou ${dominio} no Registro.br, no seu nome?`)) return;
    ocupado(comprei, async () => {
      const r = await fluxoPede('/dominio-comprado', { id, dominio });
      alert(`${r.dominio}: ${r.proximo}.${r.dns.length ? `\n\n${r.dns.join('\n')}` : ''}`);
      await atualizaAgentes();
    });
    return;
  }
  const semDominio = ev.target.closest('[data-sem-dominio]');
  if (semDominio) {
    if (!confirm('Mandar ao cliente o link provisório da Netlify agora, sem esperar o .com.br?')) return;
    ocupado(semDominio, async () => {
      await fluxoPede('/entregar-sem-dominio', { id: semDominio.dataset.semDominio });
      recado('Na caixa do vendedor: ele manda o link provisório e pede a aprovação.', 'bom');
      await atualizaAgentes();
    });
    return;
  }
  const pagou = ev.target.closest('[data-pagou]');
  if (pagou) {
    const [id, mes] = pagou.dataset.pagou.split(':');
    const l = acha(id);
    if (l) {
      l.mensalidade = { ...(l.mensalidade || {}), pagos: [...new Set([...(l.mensalidade?.pagos || []), mes])] };
      salva(); desenhaFilas();
      recado(`${l.nome}: mensalidade de ${MESES[Number(mes.split('-')[1]) - 1]} marcada como paga.`, 'bom');
    }
    return;
  }
  const pend = ev.target.closest('[data-pendencia]');
  if (pend) {
    const [id, i] = pend.dataset.pendencia.split(':');
    const l = acha(id);
    if (l?.pendencias?.[i]) { l.pendencias[i].feito = true; salva(); desenhaFilas(); }
    return;
  }
  const resolvido = ev.target.closest('[data-resolvido]');
  if (resolvido) {
    const l = acha(resolvido.dataset.resolvido);
    if (l) { l.precisa_voce = null; salva(); desenhaFilas(); }
    return;
  }
  const abre = ev.target.closest('[data-abre-ficha]');
  if (abre) abreFicha(abre.dataset.abreFicha);
});

function confereRail() {
  const algum = ['#cartao-chamados', '#cartao-retidas', '#cartao-cardapio', '#cartao-mensalidades', '#cartao-pendencias', '#cartao-suavez', '#cartao-fila', '#cartao-adiadas', '#cartao-travadas']
    .some((c) => !$(c).hidden);
  $('#f-precisa-vazio').hidden = algum;
}

async function atualizaAgentes({ comDados = true } = {}) {
  try {
    // Com a ficha aberta, os dados não são trocados embaixo de você.
    if (comDados && !$('#ficha').open) { await carrega(); desenha(); }
    desenhaFluxo(await fluxoPede(''));
  } catch (e) { texto('#motor-linha', e.message); }
}

document.addEventListener('click', (ev) => {
  const botao = ev.target.closest('[data-destrava]');
  if (!botao) return;
  ocupado(botao, async () => {
    desenhaFluxo(await fluxoPede('/destravar', { id: Number(botao.dataset.destrava) }));
    recado('Tarefa de volta para a fila.', 'bom');
  });
});

aoClicar('#f-ligar', async () => {
  desenhaFluxo(await fluxoPede('/ligar', { segundos: 30 }));
  recado('Agentes ligados.', 'bom');
});
aoClicar('#f-desligar', async () => {
  if (!confirm('Desligar todos os agentes? Ninguém mais é respondido até você ligar de novo.')) return;
  desenhaFluxo(await fluxoPede('/desligar', {}));
});
aoClicar('#f-agora', () => atualizaAgentes());
aoClicar('#f-marcar-todos', () => {
  const marcas = $$('.f-marca');
  const ligar = marcas.some((m) => !m.checked);
  marcas.forEach((m) => { m.checked = ligar; });
}, { semEspera: true });
aoClicar('#f-liberar', async () => {
  const ids = $$('.f-marca').filter((m) => m.checked).map((m) => m.value);
  if (!ids.length) { recado('Marque pelo menos um.'); return; }
  if (!confirm(`Liberar o primeiro contato de ${ids.length} negócio(s)?\n\n`
    + 'O vendedor vai escrever e ENVIAR cada mensagem, com respiro entre elas.')) return;
  const saida = await fluxoPede('/liberar', { ids });
  recado(`${saida.postas} na caixa do vendedor.${(saida.erros || []).length ? ` ${saida.erros[0]}` : ''}`, 'bom');
  await atualizaAgentes();
});
$('#f-suavez').addEventListener('click', (ev) => {
  const botao = ev.target.closest('[data-entregar]');
  if (!botao) return;
  const html = prompt('Cole o HTML do site final:');
  if (!html || !html.trim()) return;
  ocupado(botao, async () => {
    await fluxoPede('/entregar', { id: botao.dataset.entregar, html });
    recado('Na caixa do publicador. Ele publica e o vendedor avisa o cliente.', 'bom');
    await atualizaAgentes();
  });
});

/* ══ CAÇADA ═════════════════════════════════════════════════════ */
/* O campo de caçadores é montado com o teto que o servidor informa:
   mudar o teto no código muda o painel junto. */
async function montaCacadores() {
  const campo = $('#o-cacadores');
  let limites = { maximo: 7, padrao: 7 };
  try { limites = await (await fetch('/api/matilha/limites')).json(); } catch { /* o servidor caído já é avisado */ }
  const guardado = Number(localStorage.getItem('orbita_cacadores'));
  const escolhido = guardado >= 1 && guardado <= limites.maximo ? guardado : limites.padrao;
  campo.innerHTML = Array.from({ length: limites.maximo }, (_, i) => {
    const n = i + 1;
    return `<option value="${n}"${n === escolhido ? ' selected' : ''}>${plural(n, 'caçador, 1 janela', `caçadores, ${n} janelas`)}</option>`;
  }).join('');
  campo.addEventListener('change', () => { localStorage.setItem('orbita_cacadores', campo.value); previaDasBuscas(); });
}

const lista = (seletor) => $(seletor).value.split(',').map((x) => x.trim()).filter(Boolean);
function previaDasBuscas() {
  const ramos = lista('#o-ramos');
  const cidades = lista('#o-cidades');
  const n = ramos.length * cidades.length;
  const cacadores = Number($('#o-cacadores').value) || 1;
  poe('#o-buscas-previa', n
    ? `<b>${plural(n, 'busca', 'buscas')}</b>: ${esc(ramos.slice(0, 2).join(', '))}${ramos.length > 2 ? '…' : ''} em ${esc(cidades.slice(0, 2).join(', '))}${cidades.length > 2 ? '…' : ''}. Com ${plural(cacadores, 'caçador', 'caçadores')}, ${Math.min(cacadores, n)} ${Math.min(cacadores, n) === 1 ? 'busca anda' : 'buscas andam'} ao mesmo tempo.`
    : 'Ponha ao menos um ramo e uma cidade.');
}
$('#o-ramos').addEventListener('input', previaDasBuscas);
$('#o-cidades').addEventListener('input', previaDasBuscas);

let camposPreenchidos = false;
function mostraCampos(op) {
  // Uma vez só: depois disso o campo é seu, e o giro de 5 segundos não
  // pode apagar o que você está digitando.
  if (camposPreenchidos || !op?.meta) return;
  camposPreenchidos = true;
  const meta = op.meta;
  $('#o-vendas').value = meta.vendas;
  $('#o-teto-contatos').value = meta.tetoContatos;
  $('#o-teto-achados').value = meta.tetoAchados;
  $('#o-espera').value = Math.round(meta.esperaEntreContatos / 1000);
  if (op.buscas?.length) {
    if (!$('#o-ramos').value) $('#o-ramos').value = [...new Set(op.buscas.map((b) => b.termo))].join(', ');
    if (!$('#o-cidades').value) $('#o-cidades').value = [...new Set(op.buscas.map((b) => b.cidade))].join(', ');
  }
  previaDasBuscas();
}

function desenhaJanelasAgora(m = {}) {
  const n = m.janelas || 0;
  texto('#o-janelas-agora', n ? `${plural(n, 'janela aberta', 'janelas abertas')} agora.` : 'Nenhuma janela aberta agora.');
}

async function soltaAMatilha() {
  const corpo = {
    vendas: Number($('#o-vendas').value) || 1,
    ramos: $('#o-ramos').value.trim(),
    cidades: $('#o-cidades').value.trim(),
    tetoContatos: Number($('#o-teto-contatos').value) || undefined,
    tetoAchados: Number($('#o-teto-achados').value) || undefined,
    esperaEntreContatos: (Number($('#o-espera').value) || 90) * 1000,
    cacadores: Number($('#o-cacadores').value) || undefined,
  };
  if (!corpo.ramos || !corpo.cidades) {
    recado('Diga ao menos um ramo e uma cidade para caçar.', 'ruim');
    location.hash = '#cacada';
    $('#o-ramos').focus();
    return;
  }
  const op = await pede('/api/operacao/comecar', corpo);
  recado('Matilha solta. Os caçadores estão abrindo as janelas.', 'bom');
  if (op) await atualizaAgentes({ comDados: false });
  location.hash = '#hoje';
}
aoClicar('#o-comecar', soltaAMatilha);
aoClicar('#o-comecar-cacada', soltaAMatilha);
aoClicar('#o-parar', async () => {
  await pede('/api/operacao/parar', {});
  recado('A matilha parou de caçar e de abordar. As conversas abertas continuam.');
  await atualizaAgentes({ comDados: false });
});

let matilhaRelogio = null;
aoClicar('#o-cacar', async () => {
  const ramos = $('#o-ramos').value.trim();
  const cidades = $('#o-cidades').value.trim();
  const fonte = $('#o-fonte').value;
  if (!ramos || !cidades) { recado('Informe ramos e cidades.', 'ruim'); return; }

  matilhaRelogio = setInterval(async () => {
    try {
      const a = await (await fetch('/api/matilha/andamento')).json();
      const andando = (a.emAndamento || []).map((b, i) => (b ? `${i + 1}: ${b}` : '')).filter(Boolean);
      poe('#m-andamento', `<b>${a.lidos || 0}</b> lidos · <b>${a.achados || 0}</b> sem site · ${a.descartados || 0} com site`
        + (andando.length ? `<small>Caçando agora · ${andando.map(esc).join(' · ')}</small>` : ''));
    } catch { /* o giro seguinte tenta de novo */ }
  }, 1200);

  try {
    // A fonte muda quem faz o trabalho, não o que aparece na tela.
    const saida = fonte === 'navegador'
      ? await pede('/api/matilha', {
        ramos, cidades,
        porBusca: Number($('#o-porbusca').value) || 20,
        cacadores: Number($('#o-cacadores').value) || undefined,
      })
      : await agente('cacar', {
        // Estas fontes fazem uma busca por vez: vale o primeiro ramo e
        // a primeira cidade da lista.
        termo: ramos.split(',')[0].trim(),
        cidade: cidades.split(',')[0].trim(),
        quantos: Number($('#o-porbusca').value) || 20,
        fonte,
      });
    if (saida.erro) throw new Error(saida.erro);

    poe('#m-andamento', `<b>${saida.leads.length}</b> negócios sem site`
      + (saida.segundos ? ` em ${saida.segundos} s` : '')
      + (saida.cacadores ? ` · ${plural(saida.cacadores, 'caçador', 'caçadores')}` : '')
      + (saida.buscas ? ` · ${plural(saida.buscas, 'busca', 'buscas')}` : '')
      + ` · ${saida.descartados_com_site || 0} já tinham site`
      + (saida.ja_conhecidos ? ` · ${saida.ja_conhecidos} pulados por já serem conhecidos` : '')
      + (saida.aviso ? `<small class="ruim-texto">${esc(saida.aviso)}</small>` : ''));

    poe('#m-achados', saida.leads.slice(0, 60).map((a) => `<div class="item">
      <span class="item-texto"><b>${esc(a.nome)}</b>
        <span>${esc([a.tipo, a.cidade, a.whatsapp ? 'tem WhatsApp' : 'sem WhatsApp', a.instagram ? 'tem Instagram' : ''].filter(Boolean).join(' · '))} · ${a.pontos ?? a.pontuacao ?? '—'}/10</span></span>
      <button class="bt bt-contorno bt-pequeno item-acao" data-adiciona="${esc(JSON.stringify(a))}">Pôr no funil</button>
    </div>`).join('') || '<p class="vazio">Nada encontrado.</p>');
  } finally {
    clearInterval(matilhaRelogio);
  }
});

aoClicar('#o-fechar-navegador', async () => {
  await fetch('/api/matilha/fechar', { method: 'POST' });
  desenhaJanelasAgora({ janelas: 0 });
  recado('Janelas dos caçadores fechadas.');
});

// Os achados entram no funil como "novo": o fluxo move para a fila de
// aprovação no giro seguinte.
$('#m-achados').addEventListener('click', (ev) => {
  const botao = ev.target.closest('[data-adiciona]');
  if (!botao) return;
  const achado = JSON.parse(botao.dataset.adiciona);
  estado.leads.push(novoLead({ ...achado, estagio: 'novo' }));
  salva(); desenha();
  botao.outerHTML = '<span class="pilula pilula-bom">no funil</span>';
});

/* ══ WHATSAPP ═══════════════════════════════════════════════════ */
const ROTULO_ZAP = { desligado: 'desligado', abrindo: 'abrindo…', qr: 'leia o QR Code',
  pronto: 'conectado', erro: 'com erro' };
const TOM_ZAP = { pronto: 'bom', qr: 'espera', abrindo: 'espera', erro: 'ruim' };

async function zapEstado(acao = 'estado') {
  try {
    const r = await (await fetch(`/api/zap/${acao}`, { method: acao === 'estado' ? 'GET' : 'POST' })).json();
    const rotulo = ROTULO_ZAP[r.situacao] || r.situacao;
    const selo = $('#selo-zap');
    selo.className = `pilula${TOM_ZAP[r.situacao] ? ` pilula-${TOM_ZAP[r.situacao]}` : ''}`;
    selo.textContent = rotulo;
    texto('#zap-estado', r.situacao === 'pronto'
      ? `Conectado. ${r.enviadas_hoje} de ${r.max_por_dia} mensagens hoje, restam ${r.restam_hoje}.`
      : `${rotulo[0].toUpperCase()}${rotulo.slice(1)}${r.detalhe ? `: ${r.detalhe}` : '.'}`);
    const conta = $('#topo-conta');
    conta.className = `topo-conta ${TOM_ZAP[r.situacao] || ''}`;
    conta.innerHTML = `<span class="ponto"></span>WhatsApp ${esc(rotulo)}`;
    $('#nav-sinal-zap').hidden = !['qr', 'erro'].includes(r.situacao);
    return r;
  } catch { return null; }
}

document.addEventListener('click', async (ev) => {
  const botao = ev.target.closest('[data-zap]');
  if (!botao) return;
  const acao = botao.dataset.zap;
  if (acao === 'novidades') {
    await ocupado(botao, async () => {
      const r = await (await fetch('/api/zap/novidades', { method: 'POST' })).json();
      poe('#zap-novidades', (r.conversas || []).length
        ? r.conversas.map((c) => `<div class="conversa-zap"><b>${esc(c.de)}</b>
            ${c.mensagens.map((m) => `<div class="fala dono">${esc(m)}</div>`).join('')}</div>`).join('')
          + '<p class="nota">Para pôr na conversa de um cliente: abra a ficha dele em Clientes e use "Colar a resposta dele".</p>'
        : `<p class="vazio">Nenhuma conversa não lida.${r.motivo ? ` (${esc(r.motivo)})` : ''}</p>`);
    });
    return;
  }
  await ocupado(botao, () => zapEstado(acao));
});

aoClicar('#zap-diagnostico', async () => {
  const caixa = $('#zap-relatorio');
  caixa.hidden = false;
  caixa.textContent = 'Abrindo o WhatsApp Web e olhando a tela…\n\n'
    + 'Na primeira vez isto demora: se aparecer o QR Code na janela que\n'
    + 'abriu, leia com o celular agora. Nada é enviado.';
  // Prazo longo de propósito: abrir o navegador e esperar o WhatsApp
  // carregar passa fácil dos 30 s.
  const relogio = new AbortController();
  const corta = setTimeout(() => relogio.abort(), 180_000);
  try {
    const resposta = await fetch('/api/zap/diagnostico', { method: 'POST', signal: relogio.signal });
    const saida = await resposta.json().catch(() => ({}));
    caixa.textContent = (saida.linhas || ['(sem resposta)']).join('\n')
      + (saida.print ? `\n\nPrint salvo em:\n${saida.print}` : '')
      + `\n\n${saida.ok ? '✓ RESULTADO: os caminhos batem. A ponte deve funcionar.'
        : '✗ RESULTADO: alguma coisa não bateu. Copie este relatório e me mande.'}`;
    $('#zap-copiar').hidden = false;
    recado(saida.ok ? 'A ponte do WhatsApp respondeu.' : 'Algo não bateu. Veja o relatório.', saida.ok ? 'bom' : 'ruim');
  } catch (e) {
    caixa.textContent = e.name === 'AbortError'
      ? 'Passou de 3 minutos sem resposta. A janela do WhatsApp abriu? '
        + 'Se o QR estiver na tela, leia com o celular e clique de novo.'
      : `Não consegui: ${e.message}`;
  } finally {
    clearTimeout(corta);
  }
});

aoClicar('#zap-copiar', async (botao) => {
  try {
    await navigator.clipboard.writeText($('#zap-relatorio').textContent);
    recado('Relatório copiado. Pode colar na conversa.', 'bom');
  } catch {
    const faixa = document.createRange();
    faixa.selectNodeContents($('#zap-relatorio'));
    getSelection().removeAllRanges();
    getSelection().addRange(faixa);
    recado('Selecionei o texto: use Ctrl+C.');
  }
  botao.blur();
}, { semEspera: true });

/* ── CONECTAR CLAUDE PARA WHATSAPP ─────────────────────────────── */
/* O Claude Code instalado neste computador, com a sua assinatura,
   escreve a primeira mensagem e as respostas. Três passos, nesta
   ordem, e o cartão sempre mostra qual é o próximo. */
const pedeClaude = (rota = '', corpo) => pede(`/api/claude-zap${rota}`, corpo);

function passo(nome, situacao, detalhe) {
  const li = $(`#cz-passos [data-passo="${nome}"]`);
  li.className = situacao || '';
  li.querySelector('.passo-detalhe').textContent = detalhe;
}

function claudeMostra(c) {
  if (!c) return;
  claude = c;
  // Um teste de antes de o login cair não vale: o passo volta a esperar.
  const t = c.pronto ? c.ultimoTeste : null;

  passo('instalado', c.instalado ? 'ok' : 'falha', c.instalado
    ? `Versão ${c.versao || 'instalada'}.`
    : 'Não achei o Claude Code neste computador. O botão abaixo instala.');
  passo('conectado', c.conectado ? 'ok' : c.instalado ? 'vez' : '', c.conectado
    ? 'Entra com a sua assinatura.'
    : c.instalado ? 'Falta entrar na sua conta: o login abre no navegador.' : 'Depois de instalar.');
  passo('testado', t?.ok ? 'ok' : t && !t.ok ? 'falha' : c.pronto ? 'vez' : '', t?.ok
    ? `Às ${hora(t.quando)}, em ${String(t.segundos).replace('.', ',')} s.`
    : t && !t.ok ? t.erro : c.pronto ? 'Teste para ver a mensagem antes de ligar.' : 'Depois de conectar.');

  // A prévia: a última mensagem de teste, como chega no WhatsApp.
  poe('#cz-teste', `<span class="previa-rotulo">Como a mensagem chega no WhatsApp do cliente</span>`
    + (t?.ok
      ? `<div class="bolha">${esc(t.mensagem)}</div>
         <span class="bolha-meta">Para ${esc(t.cliente)}${t.exemplo ? ' (um negócio de exemplo)' : ''} · escrita pelo ${esc(t.motor || 'Claude')} · não foi enviada</span>`
        + (t.revisar?.length ? `<span class="bolha-meta ruim-texto">Seria reescrita antes de sair: ${esc(t.revisar.join(', '))}</span>` : '')
      : '<div class="bolha bolha-vazia">Teste para ver uma abordagem escrita pelo Claude. Nada é enviado.</div>'));

  const selo = $('#cz-selo');
  const [tom, diz] = c.ligado
    ? c.pausadoAte ? ['espera', `limite do plano até ${hora(c.pausadoAte)}`] : ['bom', 'conectado, escrevendo']
    : c.pronto ? ['acento', 'pronto para conectar'] : ['', 'não conectado'];
  selo.className = `pilula${tom ? ` pilula-${tom}` : ''}`;
  selo.textContent = diz;

  const modelo = $('#cz-modelo');
  if (!modelo.options.length) {
    modelo.innerHTML = Object.entries(c.modelos || { '': 'O padrão do seu Claude Code' })
      .map(([v, nome]) => `<option value="${esc(v)}">${esc(nome)}</option>`).join('');
  }
  if (document.activeElement !== modelo) modelo.value = c.modelo || '';
  const reserva = $('#cz-reserva');
  reserva.checked = c.temGroq && c.reservaGroq;
  reserva.disabled = !c.temGroq;
  texto('#cz-reserva-nota', c.temGroq
    ? 'Desmarcado, o vendedor espera o plano voltar.'
    : 'Sem a chave do Groq (Ajustes › Chaves), o vendedor espera o plano voltar.');

  // Sem estar pronto, o botão de conectar some: o próximo passo é o
  // login (ou a instalação), e ele é que fica laranja.
  $('#cz-ligar').hidden = c.ligado || !c.pronto;
  $('#cz-desligar').hidden = !c.ligado;
  $('#cz-testar').disabled = !c.pronto;
  const login = $('#cz-login');
  login.hidden = c.conectado;
  login.dataset.acao = c.instalado ? 'login' : 'instalar';
  login.innerHTML = c.instalado
    ? `${icone('entrar')}Abrir o login do Claude`
    : `${icone('seta')}Instalar o Claude Code`;
  if (!c.pronto) login.className = 'bt bt-primario';
  else login.className = 'bt bt-contorno';

  const uso = [];
  if (c.ligado) {
    uso.push(c.escritasHoje
      ? `Hoje o Claude escreveu ${plural(c.escritasHoje, 'mensagem', 'mensagens')}, em média ${String(c.mediaSegundos).replace('.', ',')} s cada.`
      : 'Ligado. A próxima mensagem do vendedor sai escrita pelo Claude.');
  } else if (c.pronto) {
    uso.push('Enquanto não estiver conectado, quem escreve é o Groq, como antes.');
  } else if (c.conserto) {
    uso.push(c.conserto);
  }
  if (c.pausadoAte) uso.push(`O limite do plano acabou: volta às ${hora(c.pausadoAte)}.${c.reservaGroq && c.temGroq ? ' Até lá, o Groq escreve.' : ' Até lá, o vendedor espera.'}`);
  if (c.ultimoErro) uso.push(`Último erro: ${c.ultimoErro}`);
  texto('#cz-uso', uso.join(' '));
}

async function claudeCarrega(refaz = false) {
  try { claudeMostra(await pedeClaude(refaz ? '/conferir' : '')); } catch (e) { texto('#cz-uso', e.message); }
}

let esperaLogin = null;
function esperaConectar() {
  // Depois do login (ou da instalação), confere sozinho por uns minutos:
  // ninguém precisa voltar e lembrar de clicar.
  clearInterval(esperaLogin);
  let vezes = 0;
  esperaLogin = setInterval(async () => {
    vezes += 1;
    try {
      const c = await pedeClaude('/conferir');
      claudeMostra(c);
      if (c.conectado || vezes > 40) {
        clearInterval(esperaLogin);
        if (c.conectado) recado('O Claude Code está conectado à sua conta. Agora teste.', 'bom');
      }
    } catch { /* tenta de novo */ }
  }, 6000);
}

aoClicar('#cz-conferir', () => claudeCarrega(true));
aoClicar('#cz-login', async (botao) => {
  const instalar = botao.dataset.acao === 'instalar';
  const r = await pedeClaude(instalar ? '/instalar' : '/login', {});
  recado(r.aberto
    ? instalar
      ? 'Abri uma janela que instala o Claude Code e depois pede o login. Siga por lá; este cartão confere sozinho.'
      : 'Abri uma janela com o login. Entre na sua conta no navegador; este cartão confere sozinho.'
    : `Não consegui abrir a janela. Rode à mão, num terminal: ${r.comando}`, r.aberto ? 'bom' : 'ruim');
  esperaConectar();
});
aoClicar('#cz-testar', async () => {
  poe('#cz-teste', '<span class="previa-rotulo">Como a mensagem chega no WhatsApp do cliente</span>'
    + '<div class="bolha bolha-vazia">O Claude está escrevendo…</div>');
  const c = await pedeClaude('/testar', {});
  claudeMostra(c);
  recado(c.teste?.ok ? `Pronto: escrita em ${String(c.teste.segundos).replace('.', ',')} s. Nada foi enviado.`
    : `O teste falhou: ${c.teste?.erro || 'sem resposta'}`, c.teste?.ok ? 'bom' : 'ruim');
});
aoClicar('#cz-ligar', async () => {
  const c = await pedeClaude('/ligar', { modelo: $('#cz-modelo').value, reservaGroq: $('#cz-reserva').checked });
  claudeMostra(c);
  recado('Claude conectado ao WhatsApp. A primeira mensagem e as respostas agora saem escritas por ele.', 'bom');
  if (!c.ultimoTeste?.ok) $('#cz-testar').click();
});
aoClicar('#cz-desligar', async () => {
  claudeMostra(await pedeClaude('/desligar', {}));
  recado('Claude desligado. O Groq volta a escrever as mensagens.');
});
for (const campo of ['#cz-modelo', '#cz-reserva']) {
  $(campo).addEventListener('change', async () => {
    try {
      claudeMostra(await pedeClaude('/ajustar', { modelo: $('#cz-modelo').value, reservaGroq: $('#cz-reserva').checked }));
      recado('Guardado.', 'bom');
    } catch (e) { recado(e.message, 'ruim'); }
  });
}

/* ══ AJUSTES ════════════════════════════════════════════════════ */
function mostraNegocio() {
  const a = estado.ajustes;
  $('#a-senha').value = a.senha || '';
  $('#a-autor').value = a.autor || '';
  $('#a-preco').value = a.preco || '';
  $('#a-mensalidade').value = a.mensalidade || 'R$ 127 por mês';
  $('#a-prazo').value = a.prazo || '';
  $('#a-vagas').value = a.vagasSemana ?? 3;
  $('#a-pix').value = a.chavePix || '';
  $('#a-dias').value = a.diasDaPrevia || 7;
  texto('#a-conta', `${plural(estado.leads.length, 'cliente guardado', 'clientes guardados')} neste computador.`);
}
aoClicar('#a-salvar', async () => {
  estado.ajustes = {
    ...estado.ajustes,
    senha: $('#a-senha').value.trim(),
    autor: $('#a-autor').value.trim(),
    prazo: $('#a-prazo').value.trim(),
    vagasSemana: Math.max(0, Number($('#a-vagas').value) || 0),
    chavePix: $('#a-pix').value.trim(),
    diasDaPrevia: Number($('#a-dias').value) || 7,
  };
  await salva();
  recado('Salvo.', 'bom');
});

/* ── preços: a prévia usa o MESMO oferta.mjs que o vendedor ─────── */
const { montaOferta } = await import('/oferta.mjs');

function ajustesDePreco() {
  return {
    cobranca: $('#p-cobranca').value,
    nichosComida: $('#p-nichos').value,
    inclui: $('#p-inclui').value.trim(),
    pagamento: $('#p-pagamento').value.trim(),
    ofertas: {
      site: { setup: $('#p-site-setup').value, mensal: $('#p-site-mensal').value },
      cardapio: { setup: $('#p-card-setup').value, mensal: $('#p-card-mensal').value },
    },
  };
}
function frase(oferta) {
  if (!oferta.produtos.length) return { vazio: 'Nenhum valor preenchido: o vendedor não vai falar de preço.' };
  const linha = (p) => (oferta.cobranca === 'mensal'
    ? `${p.nome}: ${p.mensalidade || '(sem valor)'}, e fazer está incluído`
    : `${p.nome}: ${p.para_fazer || '(sem valor)'} para fazer${p.mensalidade ? ` + ${p.mensalidade}` : ''}`);
  return {
    texto: oferta.produtos.length > 1
      ? `Tenho dois jeitos de fazer:\n· ${linha(oferta.produtos[0])}\n· ${linha(oferta.produtos[1])}\nQual faz mais sentido para você?`
      : `${linha(oferta.produtos[0])}. Posso começar?`,
  };
}
function desenhaPreviaDePreco() {
  const ajustes = ajustesDePreco();
  for (const [onde, quem, lead] of [
    ['#p-previa-comida', 'Para uma pizzaria (vende comida)', { tipo: 'Pizzaria' }],
    ['#p-previa-outro', 'Para uma barbearia (não vende comida)', { tipo: 'Barbearia' }],
  ]) {
    const saida = frase(montaOferta(ajustes, lead));
    poe(onde, `<div class="caso"><div class="quem">${esc(quem)}</div>`
      + (saida.vazio ? `<div class="nada">${esc(saida.vazio)}</div>` : `<div class="fala">${esc(saida.texto)}</div>`)
      + '</div>');
  }
  $$('.so-setup').forEach((n) => { n.hidden = ajustes.cobranca !== 'mensal'; });
}
for (const campo of ['#p-cobranca', '#p-site-setup', '#p-site-mensal', '#p-card-setup', '#p-card-mensal', '#p-nichos']) {
  $(campo).addEventListener('input', desenhaPreviaDePreco);
  $(campo).addEventListener('change', desenhaPreviaDePreco);
}
aoClicar('#p-salvar', async () => {
  estado.ajustes = { ...estado.ajustes, ...ajustesDePreco() };
  // Os campos antigos seguem o site completo: quem lê `preco` e
  // `mensalidade` continua certo.
  estado.ajustes.preco = $('#p-site-setup').value.trim();
  estado.ajustes.mensalidade = $('#p-site-mensal').value.trim();
  await salva();
  recado('Preços salvos. É só isto que o vendedor pode dizer.', 'bom');
});
function carregaPrecos() {
  const a = estado.ajustes || {};
  const o = a.ofertas || {};
  $('#p-cobranca').value = a.cobranca || 'setup_mais_mensal';
  $('#p-site-setup').value = o.site?.setup ?? a.preco ?? '';
  $('#p-site-mensal').value = o.site?.mensal ?? a.mensalidade ?? '';
  $('#p-card-setup').value = o.cardapio?.setup ?? '';
  $('#p-card-mensal').value = o.cardapio?.mensal ?? '';
  $('#p-nichos').value = a.nichosComida || '';
  $('#p-inclui').value = a.inclui || '';
  $('#p-pagamento').value = a.pagamento || '';
  const lembretes = a.lembretes || {};
  $('#l-sem-resposta').checked = lembretes.semResposta !== false;
  $('#l-demo').checked = lembretes.demo !== false;
  $('#l-cobrador').checked = a.cobrador !== false;
  $('#l-relatorio').checked = a.relatorio !== false;
  desenhaPreviaDePreco();
}

document.addEventListener('change', async (ev) => {
  if (ev.target.id !== 'r-teste-ab') return;
  estado.ajustes = { ...estado.ajustes, testeAB: ev.target.checked };
  await salva();
  recado(ev.target.checked ? 'Teste A/B ligado: metade dos primeiros contatos abre com uma pergunta.' : 'Teste A/B desligado: todos abrem pela nota do Google.', 'bom');
});

aoClicar('#l-salvar', async () => {
  estado.ajustes = { ...estado.ajustes,
    lembretes: { semResposta: $('#l-sem-resposta').checked, demo: $('#l-demo').checked },
    cobrador: $('#l-cobrador').checked, relatorio: $('#l-relatorio').checked };
  await salva();
  recado('Lembretes salvos.', 'bom');
});

/* ── horários ──────────────────────────────────────────────────── */
const SIGLAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
const diasParaTexto = (l) => (Array.isArray(l) ? l : []).slice().sort().map((d) => SIGLAS[d]).filter(Boolean).join(', ');
const textoParaDias = (t) => String(t || '').toLowerCase().split(/[,\s]+/)
  .map((p) => SIGLAS.indexOf(p.normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3))).filter((i) => i >= 0);

function mostraHorarios() {
  const h = estado.ajustes.horarios || {};
  const f = h.falar || {}; const t = h.trabalhar || {};
  $('#h-falar-inicio').value = f.inicio || '09:00';
  $('#h-falar-fim').value = f.fim || '19:00';
  $('#h-falar-dias').value = diasParaTexto(f.dias) || 'seg, ter, qua, qui, sex, sab';
  $('#h-trab-inicio').value = t.inicio || '07:00';
  $('#h-trab-fim').value = t.fim || '23:00';
  $('#h-trab-dias').value = diasParaTexto(t.dias) || 'dom, seg, ter, qua, qui, sex, sab';
}
aoClicar('#h-salvar', async () => {
  estado.ajustes = {
    ...estado.ajustes,
    horarios: {
      falar: { inicio: $('#h-falar-inicio').value, fim: $('#h-falar-fim').value, dias: textoParaDias($('#h-falar-dias').value) },
      trabalhar: { inicio: $('#h-trab-inicio').value, fim: $('#h-trab-fim').value, dias: textoParaDias($('#h-trab-dias').value) },
    },
  };
  await salva();
  recado('Horários salvos. Os agentes percebem em até um minuto.', 'bom');
});

/* ── chaves: o painel nunca recebe o valor, só os quatro últimos ─── */
async function chavesMostra() {
  const campos = $('#k-campos');
  try {
    const resposta = await fetch('/api/chaves', { headers: cabecalhos() });
    if (resposta.status === 401) {
      campos.innerHTML = '<p class="vazio">Ponha a senha do painel em Negócio e preços e volte aqui.</p>';
      return;
    }
    const lidas = await resposta.json();
    campos.innerHTML = Object.entries(lidas).map(([chave, info]) => `
      <label class="campo"><span>${esc(info.nome)}</span>
        <input data-chave="${esc(chave)}" type="password" autocomplete="off"
               placeholder="${info.preenchida ? `•••• ${esc(info.fim)}` : 'em branco'}">
        <small>${info.preenchida ? '<b>Já gravada.</b> ' : ''}${esc(info.descricao)}</small>
      </label>`).join('');
  } catch {
    campos.innerHTML = '<p class="vazio">O servidor não respondeu. Ele está no ar?</p>';
  }
}
aoClicar('#k-salvar', async () => {
  const novas = {};
  for (const campo of $$('#k-campos input[data-chave]')) {
    if (campo.value.trim()) novas[campo.dataset.chave] = campo.value.trim();
  }
  if (!Object.keys(novas).length) { recado('Nenhum campo preenchido: nada a gravar.'); return; }
  const corpo = await pede('/api/chaves', novas);
  texto('#k-recado', `Gravadas no .env: ${corpo.gravadas.join(', ')}. Já valem agora.`);
  await chavesMostra();
  recado('Chaves gravadas.', 'bom');
});

/* ── celular: QRs, PIN e o caminho de fora de casa ─────────────── */
async function aoVivoQR() {
  const cartao = $('#cartao-ao-vivo');
  try {
    const resposta = await fetch('/api/ao-vivo/qr');
    if (resposta.status === 403) { cartao.hidden = true; return; }
    const info = await resposta.json();
    cartao.hidden = false;
    if (info.erro) { texto('#v-qr', info.erro); return; }
    poe('#v-qr', info.qr || '');
    texto('#v-url', info.url);
    texto('#v-onde', info.onde === 'internet'
      ? 'Pelo caminho de fora de casa: funciona de qualquer lugar.'
      : 'Pelo wi-fi: só funciona dentro de casa. Abra o caminho de fora de casa, mais abaixo, para ver da rua.');
  } catch { texto('#v-qr', 'o servidor não respondeu'); }
}

async function celularMostra() {
  const cartao = $('#cartao-celular');
  try {
    const resposta = await fetch('/api/celular');
    // Vendo isto PELO celular: o QR aqui não serviria de nada.
    if (resposta.status === 403) { cartao.hidden = true; return; }
    const info = await resposta.json();
    cartao.hidden = false;
    poe('#c-qr', info.qr || 'sem rede');
    const primeiro = info.enderecos?.[0];
    texto('#c-endereco', primeiro ? primeiro.url : 'o notebook não está em nenhuma rede agora');
    texto('#c-pin', info.pin || '······');
    texto('#c-aparelhos', info.aparelhos
      ? `${plural(info.aparelhos, 'aparelho', 'aparelhos')} com acesso guardado.` : 'Nenhum celular entrou ainda.');
  } catch { texto('#c-qr', 'o servidor não respondeu'); }
}
aoClicar('#c-novo-pin', async () => {
  if (!confirm('Trocar o PIN? Os celulares que já entraram vão precisar do PIN novo.')) return;
  await pede('/api/celular/novo-pin', {});
  await celularMostra();
  recado('PIN novo. Os celulares que já tinham entrado foram desconectados.', 'bom');
});

function tunelMostra(info) {
  const pronto = Boolean(info.url);
  $('#t-pronto').hidden = !pronto;
  $('#t-ligar').hidden = pronto;
  $('#t-desligar').hidden = !pronto;
  $('#t-sempre').checked = info.sempre === true;
  if (pronto) {
    poe('#t-qr', info.qr || '');
    texto('#t-url', info.url);
    texto('#t-pin', info.pin || '······');
    texto('#t-estado', 'Aberto. Enquanto a Matilha estiver ligada, este endereço responde de qualquer lugar.');
  } else {
    texto('#t-estado', info.erro ? `Não consegui abrir: ${info.erro}` : 'Fechado.');
  }
}
async function tunelCarrega() {
  const cartao = $('#cartao-tunel');
  try {
    const resposta = await fetch('/api/tunel');
    if (resposta.status === 403) { cartao.hidden = true; return; }
    const info = await resposta.json();
    cartao.hidden = false;
    if (!info.suportado) {
      $('#t-ligar').disabled = true;
      texto('#t-estado', 'Este computador não tem uma versão do cloudflared para baixar automaticamente.');
      return;
    }
    tunelMostra(info);
  } catch { /* o painel já avisa quando o servidor não responde */ }
}
aoClicar('#t-ligar', async () => {
  texto('#t-estado', 'Abrindo… na primeira vez ele baixa o programa da Cloudflare (uns 40 MB), então pode demorar.');
  tunelMostra(await pede('/api/tunel/ligar', { sempre: $('#t-sempre').checked }));
  recado('Aberto. Guarde o endereço no celular antes de sair.', 'bom');
});
aoClicar('#t-desligar', async () => {
  tunelMostra(await pede('/api/tunel/desligar', { sempre: $('#t-sempre').checked }).catch(() => ({})));
  recado('Fechado. De fora de casa, ninguém mais alcança.');
});
$('#t-sempre').addEventListener('change', async (ev) => {
  await fetch('/api/tunel/sempre', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sempre: ev.target.checked }),
  }).catch(() => {});
  recado(ev.target.checked
    ? 'Marcado. Da próxima vez que a Matilha abrir, o caminho sobe junto.'
    : 'Desmarcado. Ele só abre quando você clicar.');
});

/* ── os sites de referência do estúdio ─────────────────────────── */
const NOME_RAMO = { comida: 'Comida', beleza: 'Beleza (barbearia, salão, estética)', saude: 'Saúde', hospedagem: 'Hospedagem',
  automotivo: 'Automotivo', pet: 'Pet', academia: 'Academia e escolas', geral: 'Os outros ramos' };
async function referenciasMostra() {
  try {
    const r = await (await fetch('/api/referencias', { headers: cabecalhos() })).json();
    poe('#r-lista', Object.entries(r.listas).map(([ramo, urls]) => {
      const sit = r.situacao?.[ramo];
      const fotos = (sit?.ok || []).map((o) => `<img class="ref-mini" alt="Print de ${esc(o.url)}" loading="lazy"
        src="/api/referencias/imagem?ramo=${ramo}&arquivo=${encodeURIComponent(o.arquivo)}">`).join('');
      return `<label class="campo"><span>${esc(NOME_RAMO[ramo] || ramo)}</span>
        <textarea rows="2" data-ramo="${ramo}">${esc(urls.join('\n'))}</textarea>
        <small>${sit ? `${sit.ok.length} print(s) em ${new Date(sit.quando).toLocaleDateString('pt-BR')}${sit.falhas?.length ? ` · não abriram: ${esc(sit.falhas.map((f) => new URL(f.url).hostname).join(', '))}` : ''}` : 'Sem prints ainda: são tirados na primeira demonstração deste ramo.'}</small>
        ${fotos ? `<span class="ref-fotos">${fotos}</span>` : ''}</label>`;
    }).join(''));
  } catch { texto('#r-estado', 'O servidor não respondeu.'); }
}
aoClicar('#r-salvar', async () => {
  const listas = {};
  for (const campo of $$('#r-lista textarea[data-ramo]')) {
    listas[campo.dataset.ramo] = campo.value.split(/[\s,]+/).map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u));
  }
  estado.ajustes = { ...estado.ajustes, referencias: listas };
  await salva();
  recado('Listas salvas. Os prints novos saem na próxima demonstração, ou agora no botão ao lado.', 'bom');
});
aoClicar('#r-prints', async () => {
  texto('#r-estado', 'Tirando os prints num Chrome invisível. Uns 20 segundos por site…');
  const r = await pede('/api/referencias/prints', {});
  texto('#r-estado', `Prints: ${Object.entries(r).map(([k, v]) => `${NOME_RAMO[k] || k} ${v}`).join(' · ')}`);
  await referenciasMostra();
});

/* ── avançado e dados ──────────────────────────────────────────── */
aoClicar('#cc-conferir', async () => {
  const c = await (await fetch('/api/claude-code')).json();
  poe('#cc-estado', c.pronto
    ? `<span class="pilula pilula-bom">pronto</span> ${esc(c.versao || '')}`
    : `<span class="pilula pilula-ruim">não está pronto</span> ${esc(c.motivo)} ${esc(c.conserto || '')}`);
});
aoClicar('#a-exportar', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'),
    { href: url, download: `matilha-${new Date().toISOString().slice(0, 10)}.json` });
  a.click(); URL.revokeObjectURL(url);
}, { semEspera: true });
$('#a-importar').addEventListener('change', async (ev) => {
  const arquivo = ev.target.files?.[0];
  if (!arquivo) return;
  try {
    const lido = JSON.parse(await arquivo.text());
    if (!Array.isArray(lido.leads)) throw new Error('arquivo sem clientes');
    // Junta em vez de substituir: importar não pode apagar o que você
    // cadastrou depois do último backup.
    const existentes = new Set(estado.leads.map((l) => l.id));
    const novos = lido.leads.filter((l) => l?.id && !existentes.has(l.id));
    estado.leads.push(...novos);
    estado.ajustes = { ...lido.ajustes, ...estado.ajustes };
    salva(); desenha(); mostraNegocio();
    recado(`${plural(novos.length, 'cliente importado', 'clientes importados')}.`, 'bom');
  } catch (e) { recado(`Não consegui importar: ${e.message}`, 'ruim'); }
  ev.target.value = '';
});
aoClicar('#a-limpar', async () => {
  if (!confirm('Apagar TODOS os clientes? Exporte antes: não tem volta.')) return;
  estado = { leads: [], ajustes: estado.ajustes };
  await salva(); desenha(); mostraNegocio();
}, { semEspera: false });

$('#busca').addEventListener('input', desenhaLista);
aoClicar('#novo', () => {
  const nome = prompt('Nome do negócio:');
  if (!nome) return;
  const l = novoLead({ nome: nome.trim() });
  estado.leads.push(l); salva(); desenha(); abreFicha(l.id);
}, { semEspera: true });

/* ══ ESCRITÓRIO ══════════════════════════════════════════════════ */
let escritorio = null;
async function abreEscritorio() {
  if (escritorio) { escritorio.atualiza(); return; }
  const { montaEscritorio } = await import('/escritorio.js');
  escritorio = montaEscritorio($('#escritorio-raiz'), {
    pede: (caminho, corpo) => pede(caminho, corpo),
    irPara: (tela) => { location.hash = `#${tela}`; },
    ativo: () => telaAtual === 'escritorio',
  });
}

/* ══ JARVIS ══════════════════════════════════════════════════════ */
let jarvis = null;
let jarvisCarregando = null;
async function abreJarvis() {
  if (jarvis) { jarvis.atualiza(); return jarvis; }
  jarvisCarregando ||= import('/jarvis.js').then(({ montaJarvis }) => {
    jarvis = montaJarvis($('#jarvis-raiz'), { pede: (caminho, corpo) => pede(caminho, corpo), ativo: () => telaAtual === 'jarvis', cabecalhos, cliente: () => controleDeTela?.cliente || '' });
    return jarvis;
  });
  return jarvisCarregando;
}

/* ══ COMEÇAR ════════════════════════════════════════════════════
   Tudo o que falta para a Matilha e o Jarvis funcionarem, numa lista
   só, na ordem certa, com o botão que resolve cada passo. Os quatro
   primeiros são indispensáveis; o resto melhora, mas não trava nada. */
let comecar = null;
const vozTestada = () => { try { return localStorage.getItem('comecar-voz') === 'ok'; } catch { return false; } };
const CHAVE_ESTADO = {
  ok: ['ok', 'Pronto'], preenchida: ['ok', 'Pronto'], falta: ['falta', 'Falta'],
  recusada: ['erro', 'Chave recusada'], sem_resposta: ['erro', 'Sem resposta'],
};
function passosDoComecar(c) {
  const claudeOk = c.claude.conectado;
  return [
    { id: 'negocio', precisa: true, titulo: 'O seu nome e os preços', ok: c.negocio,
      porque: 'O vendedor só diz o que está aqui: o seu nome, o prazo, os preços e a chave Pix.',
      acao: '<a class="bt bt-primario" href="#ajustes/negocio">Preencher</a>' },
    { id: 'groq', precisa: true, titulo: 'A chave do Groq (grátis)', estado: CHAVE_ESTADO[c.groq],
      porque: 'É com ela que o Jarvis entende a sua voz, e pensa quando o Claude não está disponível. O vendedor usa de reserva quando o plano do Claude acaba.',
      aviso: { recusada: 'O Groq recusou essa chave. Confira se colou ela inteira.', sem_resposta: 'O Groq não respondeu. Confira a internet e teste de novo.' }[c.groq],
      acao: `<a class="bt bt-contorno" href="https://console.groq.com/keys" target="_blank" rel="noopener">Pegar a chave</a>
        <input class="campo-chave" data-chave="GROQ_API_KEY" type="password" autocomplete="off" placeholder="Cole aqui (começa com gsk_)" aria-label="Chave do Groq">
        <button class="bt bt-primario" data-salva="GROQ_API_KEY">Salvar e testar</button>` },
    { id: 'claude', precisa: true, titulo: 'O Claude Code, com a sua assinatura', ok: claudeOk,
      porque: 'É o cérebro do Jarvis, e também faz os sites, as conversas do vendedor e os projetos. Usa o seu plano do Claude, sem chave nenhuma.',
      aviso: !c.local ? 'Isto se faz no próprio notebook.' : !c.claude.instalado
        ? 'Vai abrir uma janela preta: espere ela terminar e, quando pedir, entre com a sua conta do Claude no navegador.'
        : 'Vai abrir uma janela: entre com a sua conta do Claude no navegador que ela abrir.',
      acao: c.local ? `${!c.claude.instalado ? '<button class="bt bt-primario" data-claude="instalar">Instalar e entrar</button>'
        : '<button class="bt bt-primario" data-claude="login">Entrar com a minha conta</button>'}
        <button class="bt bt-contorno" data-claude="conferir">Já fiz, conferir</button>` : '' },
    { id: 'whatsapp', precisa: true, titulo: 'O WhatsApp do vendedor', ok: c.whatsapp === 'pronto',
      porque: 'É por ele que a Matilha conversa com os clientes. Você lê um QR code com o celular, uma vez.',
      acao: '<a class="bt bt-primario" href="#whatsapp">Abrir o WhatsApp</a>' },
    { id: 'netlify', recomendado: true, titulo: 'A chave da Netlify', estado: CHAVE_ESTADO[c.netlify],
      porque: 'Publica os sites dos clientes e deixa o celular achar o Jarvis de qualquer lugar.',
      aviso: { recusada: 'A Netlify recusou essa chave. Gere uma nova e cole de novo.', sem_resposta: 'A Netlify não respondeu. Teste de novo.' }[c.netlify],
      acao: `<a class="bt bt-contorno" href="https://app.netlify.com/user/applications#personal-access-tokens" target="_blank" rel="noopener">Pegar a chave</a>
        <input class="campo-chave" data-chave="NETLIFY_TOKEN" type="password" autocomplete="off" placeholder="Cole aqui" aria-label="Chave da Netlify">
        <button class="bt bt-primario" data-salva="NETLIFY_TOKEN">Salvar e testar</button>` },
    { id: 'skills', recomendado: true, titulo: 'O pacote de skills do Jarvis', ok: c.skills.total > 0 && c.skills.instaladas === c.skills.total,
      porque: `Os manuais que deixam os projetos de nível profissional: PowerPoint, Word, gráficos, 3D, apresentações. ${c.skills.instaladas} de ${c.skills.total} instalados.`,
      aviso: !claudeOk ? 'Primeiro o Claude Code (passo 3).' : c.skills.instalando ? 'Instalando… leva alguns minutos.' : '',
      acao: c.local && claudeOk && !c.skills.instalando ? '<button class="bt bt-primario" data-skills>Instalar</button>' : '' },
    { id: 'voz', recomendado: true, titulo: 'A voz e o microfone', ok: vozTestada(),
      porque: 'Para falar com o Jarvis e ouvir a resposta. O navegador vai pedir para usar o microfone: clique em Permitir.',
      acao: '<button class="bt bt-primario" data-voz>Testar</button>' },
    { id: 'celular', opcional: true, titulo: 'O Jarvis no celular', ok: c.celular,
      porque: 'Escaneie um QR code uma vez e fale com o Jarvis de qualquer lugar. Quando o endereço do notebook mudar, o celular acompanha.',
      aviso: c.local ? '' : 'Isto se faz no próprio notebook.',
      acao: c.local ? '<button class="bt bt-primario" data-celular>Mostrar o QR code</button>' : '' },
  ];
}
function desenhaComecar(c) {
  comecar = c;
  const passos = passosDoComecar(c);
  const feito = (p) => (p.estado ? p.estado[0] === 'ok' : p.ok);
  const prontos = passos.filter(feito).length;
  const faltamPrecisos = passos.filter((p) => p.precisa && !feito(p)).length;
  texto('#c-sub', faltamPrecisos
    ? `${plural(prontos, 'passo pronto', 'passos prontos')} de ${passos.length}. Os quatro primeiros são indispensáveis.`
    : prontos === passos.length ? 'Tudo pronto. A Matilha e o Jarvis estão completos.' : 'O indispensável está pronto. O resto deixa tudo melhor.');
  $('#c-barra').style.width = `${(prontos / passos.length) * 100}%`;
  const conta = $('#nav-comecar-conta');
  conta.hidden = !faltamPrecisos; conta.textContent = faltamPrecisos;
  poe('#c-passos', passos.map((p, i) => {
    const [estado, rotulo] = p.estado || (p.ok ? ['ok', 'Pronto'] : ['falta', p.precisa ? 'Falta' : p.recomendado ? 'Recomendado' : 'Opcional']);
    return `<li class="passo" data-estado="${estado}" data-passo="${p.id}">
      <span class="passo-marca" aria-hidden="true">${estado === 'ok' ? '✓' : i + 1}</span>
      <div class="passo-corpo"><h2>${esc(p.titulo)}</h2><p>${esc(p.porque)}</p>
        ${p.acao ? `<div class="passo-acao">${p.acao}</div>` : ''}
        ${p.aviso && estado !== 'ok' ? `<p class="passo-aviso${estado === 'erro' ? ' ruim' : ''}">${esc(p.aviso)}</p>` : ''}
        <div class="passo-extra"></div></div>
      <span class="passo-estado">${esc(rotulo)}</span></li>`;
  }).join(''));
  return faltamPrecisos;
}
async function carregaComecar({ testar = true, claude = false } = {}) {
  const c = await pede(`/api/comecar?${testar ? 'testar=1&' : ''}${claude ? 'claude=1' : ''}`);
  return desenhaComecar(c);
}
$('#c-passos').addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const passo = b.closest('[data-passo]');
  const extra = passo.querySelector('.passo-extra');
  if (b.dataset.salva) {
    const campo = passo.querySelector(`input[data-chave="${b.dataset.salva}"]`);
    if (!campo.value.trim()) { campo.focus(); return; }
    await ocupado(b, async () => { await pede('/api/chaves', { [b.dataset.salva]: campo.value.trim() }); await carregaComecar(); });
  } else if (b.dataset.claude === 'conferir') {
    await ocupado(b, () => carregaComecar({ testar: false, claude: true }));
  } else if (b.dataset.claude) {
    await ocupado(b, () => pede(`/api/claude-zap/${b.dataset.claude}`, {}));
    extra.innerHTML = '<p class="passo-aviso">Quando terminar na janela que abriu, clique em “Já fiz, conferir”.</p>';
  } else if ('skills' in b.dataset) {
    b.disabled = true; b.textContent = 'Instalando… (alguns minutos)';
    try { const r = await pede('/api/jarvis/skills', {}); recado(r.feitos.every((f) => f.ok) ? 'Pacote de skills instalado.' : 'Parte do pacote não instalou; tente de novo.'); } catch (err) { recado(err.message, 'ruim'); }
    await carregaComecar({ testar: false });
  } else if ('voz' in b.dataset) {
    // A voz: ele fala uma frase. O microfone: o navegador pede licença, e a gente solta na hora.
    let falou = false; let ouviu = false;
    try {
      const u = new SpeechSynthesisUtterance('Olá. Eu sou o Jarvis, e estou pronto.');
      const br = speechSynthesis.getVoices().find((v) => /pt[-_]BR/i.test(v.lang));
      if (br) u.voice = br; u.lang = 'pt-BR'; speechSynthesis.speak(u); falou = true;
    } catch { falou = false; }
    try { const f = await navigator.mediaDevices.getUserMedia({ audio: true }); f.getTracks().forEach((t) => t.stop()); ouviu = true; } catch { ouviu = false; }
    if (falou && ouviu) { try { localStorage.setItem('comecar-voz', 'ok'); } catch { /* sem armazenamento */ } await carregaComecar({ testar: false }); }
    else extra.innerHTML = `<p class="passo-aviso ruim">${!ouviu ? 'O microfone não liberou. Clique no cadeado ao lado do endereço e permita o microfone.' : 'Este navegador não fala. Use o Chrome ou o Edge.'}</p>`;
  } else if ('celular' in b.dataset) {
    await ocupado(b, async () => {
      const r = await pede('/api/jarvis/celular', {});
      extra.innerHTML = `<div class="passo-qr">${r.qr}</div><p class="passo-aviso">${r.fixo
        ? 'Aponte a câmera do celular, abra o link e toque em “Adicionar à tela inicial”. É uma vez só.'
        : esc(r.aviso)}</p>`;
    });
  }
});
aoClicar('#c-conferir', () => carregaComecar({ claude: true }));
aoClicar('#c-depois', async () => {
  try { localStorage.setItem('comecar-adiado', String(Date.now())); } catch { /* sem armazenamento */ }
  location.hash = '#hoje';
}, { semEspera: true });

/* ══ NAVEGAÇÃO ══════════════════════════════════════════════════ */
const TELAS = { comecar: 'Começar', hoje: 'Hoje', jarvis: 'Jarvis', escritorio: 'Escritório', cacada: 'Caçada', whatsapp: 'WhatsApp', clientes: 'Clientes', ofertas: 'Ofertas', valor: 'Value Intelligence', rede: 'Rede de agentes', financeiro: 'Financeiro', ajustes: 'Ajustes' };
const telaRede = montaRede({ $, poe, esc, pede, recado, ocupado });
const telaFinanceiro = montaFinanceiro({ $, poe, esc, pede, recado, ocupado, abreFicha: (id) => carrega().then(() => abreFicha(id)) });
// O caminho das telas (para o "volta" do Jarvis voltar para onde você estava, e não para fora do painel).
const caminhoDasTelas = [];
let commandCenter = null;
let controleDeTela = null;
const telaOfertas = montaOfertas({ $, $$, poe, esc, pede, recado, ocupado, leads: () => estado.leads });
const telaValor = montaValor({ $, $$, poe, esc, pede, recado, ocupado, cliente: () => controleDeTela?.cliente || '' });
const SUBS = ['negocio', 'horarios', 'chaves', 'celular', 'avancado', 'dados'];
let telaAtual = '';

function vaiPara() {
  const [pedida, subPedida] = location.hash.slice(1).split('/');
  const tela = TELAS[pedida] ? pedida : 'hoje';
  const mudou = tela !== telaAtual;
  telaAtual = tela;
  for (const t of Object.keys(TELAS)) $(`#tela-${t}`).hidden = t !== tela;
  $$('[data-tela]').forEach((a) => {
    if (a.dataset.tela === tela) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  document.title = tela === 'hoje' ? 'Matilha' : `${TELAS[tela]} · Matilha`;

  if (tela === 'hoje') atualizaAgentes();
  if (tela === 'comecar') carregaComecar().catch((e) => recado(e.message, 'ruim'));
  if (tela === 'escritorio') abreEscritorio();
  if (tela === 'jarvis') abreJarvis();
  if (tela === 'whatsapp') { zapEstado(); claudeCarrega(); }
  if (tela === 'clientes') desenha();
  if (tela === 'ofertas') carrega().then(() => telaOfertas.abre(subPedida)).catch((e) => recado(e.message, 'ruim'));
  if (tela === 'rede') telaRede.abre().catch((e) => recado(e.message, 'ruim'));
  if (tela === 'valor') telaValor.abre().catch((e) => recado(e.message, 'ruim'));
  if (tela === 'financeiro') telaFinanceiro.abre().catch((e) => recado(e.message, 'ruim'));
  commandCenter?.visivel(tela !== 'jarvis');
  if (caminhoDasTelas.at(-1) !== location.hash) caminhoDasTelas.push(location.hash || '#hoje');
  if (caminhoDasTelas.length > 40) caminhoDasTelas.shift();
  if (tela === 'cacada') previaDasBuscas();
  if (tela === 'ajustes') {
    const sub = SUBS.includes(subPedida) ? subPedida : 'negocio';
    $$('#tela-ajustes .sub').forEach((s) => { s.hidden = s.dataset.sub !== sub; });
    $$('#tela-ajustes [data-sub].aba-linha').forEach((a) => {
      if (a.dataset.sub === sub) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    if (sub === 'negocio') { mostraNegocio(); carregaPrecos(); }
    if (sub === 'horarios') mostraHorarios();
    if (sub === 'chaves') chavesMostra();
    if (sub === 'celular') { aoVivoQR(); celularMostra(); tunelCarrega(); }
    if (sub === 'dados') mostraNegocio();
    if (sub === 'avancado') referenciasMostra();
  }
  if (mudou) window.scrollTo(0, 0);
}
window.addEventListener('hashchange', vaiPara);

/* ══ O JARVIS CONTROLA ESTE PAINEL (JARVIS UI CONTROL ENGINE) ════
   Cada ação de tela usa a função da própria página (abrir tela, abrir
   ficha, filtrar), não um clique simulado, e devolve o estado de depois:
   é ele que o servidor confere antes de dizer "feito". */
const esperaAte = async (cond, ms = 2500) => {
  const ate = Date.now() + ms;
  while (Date.now() < ate) { if (cond()) return true; await new Promise((r) => setTimeout(r, 40)); }
  return cond();
};
async function vaiParaTela(tela, sub) {
  const alvo = `#${tela}${sub ? `/${sub}` : ''}`;
  const antes = telaAtual;
  // A ficha é janela modal: ficaria por cima da tela que o Jarvis acabou de abrir.
  if (tela !== 'clientes' && $('#ficha').open) $('#ficha').close();
  if (location.hash !== alvo) location.hash = alvo; else vaiPara();
  await esperaAte(() => telaAtual === tela && !$(`#tela-${tela}`).hidden);
  return antes !== tela;
}
const tituloDaTela = () => $(`#tela-${telaAtual} h1`)?.textContent.trim() || TELAS[telaAtual] || '';
const filtroDosClientes = () => filtro || 'todos';

function estadoDaTela() {
  const ficha = $('#ficha').open ? acha(idAberto()) : null;
  const jv = jarvis && telaAtual === 'jarvis' ? jarvis : null;
  const palco = jv?.palco();
  return {
    tela: telaAtual, sub: location.hash.split('/')[1] || '', titulo: tituloDaTela(),
    ficha: ficha ? { id: ficha.id, nome: ficha.nome } : null,
    dialogos: $$('dialog[open]').map((d) => d.id).filter(Boolean),
    palco: palco?.tipo ? palco : null, gaveta: jv?.gaveta() || null, soltos: jarvis?.soltos() || 0,
    valor: telaAtual === 'valor' ? telaValor.estado() : null,
    filtros: { clientes: filtroDosClientes(), rede: telaRede.filtro(), financeiro: telaFinanceiro.filtro(), ofertas: telaOfertas.filtro() },
  };
}

const acoesDaTela = {
  'navigation.open': async ({ tela, sub }) => {
    if (!TELAS[tela]) return { ok: false, erro: `não existe a tela "${tela}"` };
    const mudou = await vaiParaTela(tela, sub);
    return { ok: telaAtual === tela, mudou, evidencia: { tela: telaAtual, titulo: tituloDaTela(), hash: location.hash } };
  },
  'navigation.back': async () => {
    caminhoDasTelas.pop();
    const anterior = caminhoDasTelas.pop() || '#hoje';
    const [t, s] = anterior.slice(1).split('/');
    await vaiParaTela(TELAS[t] ? t : 'hoje', s);
    return { ok: true, evidencia: { tela: telaAtual, hash: location.hash } };
  },
  'panel.close': async ({ qual = 'auto' }) => {
    const fecha = {
      dialogo: () => {
        const d = $$('dialog[open]').filter((x) => x.id !== 'ficha').at(-1);
        if (!d) return null;
        d.close();
        return d.open ? null : 'a janela';
      },
      ficha: () => {
        if (!$('#ficha').open) return null;
        const nome = acha(idAberto())?.nome;
        $('#ficha').close();
        return $('#ficha').open ? null : `a ficha${nome ? ` de ${nome}` : ''}`;
      },
      palco: () => {
        const p = telaAtual === 'jarvis' ? jarvis?.palco() : null;
        if (!p?.tipo) return null;
        jarvis.fechaVisual();
        return jarvis.palco()?.tipo ? null : p.tipo === 'projeto' ? `o projeto ${p.titulo || ''} que estava na tela` : `${p.titulo || 'o que estava na tela'}`;
      },
      janelas: () => {
        const n = jarvis?.soltos() || 0;
        if (!n) return null;
        jarvis.fechaSoltos();
        return `${n === 1 ? 'a janela solta' : `as ${n} janelas soltas`}`;
      },
      gaveta: () => {
        if (telaAtual !== 'jarvis' || !jarvis?.gaveta()) return null;
        jarvis.fechaGaveta();
        return 'a gaveta';
      },
    };
    const ordem = qual === 'auto' ? ['dialogo', 'ficha', 'palco', 'janelas', 'gaveta'] : [qual];
    for (const k of ordem) {
      const fechou = fecha[k]?.();
      if (fechou) { await new Promise((r) => setTimeout(r, 30)); return { ok: true, fechou, evidencia: { fechou: k, tela: telaAtual, dialogos: $$('dialog[open]').map((d) => d.id) } }; }
    }
    return { ok: false, erro: qual === 'auto' ? 'não há nenhuma janela aberta para fechar' : `não há ${{ ficha: 'ficha', palco: 'nada na tela do Jarvis', gaveta: 'gaveta', janelas: 'janela solta', dialogo: 'janela' }[qual] || 'isso'} aberta` };
  },
  'dashboard.filter': async ({ tela, filtro: f }) => {
    await vaiParaTela(tela);
    if (tela === 'clientes') {
      filtro = f === 'todos' ? '' : f;
      desenhaQuadro(); desenhaLista();
      return { ok: filtroDosClientes() === f, quantos: $$('#lista .cliente').length };
    }
    if (tela === 'rede') { await telaRede.abre(); telaRede.filtra(f); return { ok: telaRede.filtro() === f }; }
    if (tela === 'financeiro') { await telaFinanceiro.abre(); telaFinanceiro.filtra(f); return { ok: telaFinanceiro.filtro() === f, quantos: telaFinanceiro.quantos() }; }
    if (tela === 'ofertas') { const quantos = await telaOfertas.filtra(f); return { ok: telaOfertas.filtro() === f, quantos }; }
    return { ok: false, erro: `a tela ${tela} não tem filtro` };
  },
  'project.open': async ({ id }) => {
    await carrega();
    const l = acha(id);
    if (!l) return { ok: false, erro: 'esse cliente não está na lista' };
    await vaiParaTela('clientes');
    if (l.arquivado_em) { filtro = 'arquivados'; desenha(); }
    abreFicha(id);
    return { ok: $('#ficha').open && idAberto() === id, evidencia: { ficha: l.nome } };
  },
  'jarvis.projeto': async ({ id, titulo, url }) => {
    await vaiParaTela('jarvis');
    const j = await abreJarvis();
    await j.mostraVisual({ tipo: 'projeto', titulo, url, id });
    return { ok: j.palco()?.id === id, evidencia: { palco: j.palco() } };
  },
  'valor.mostra': async ({ lead_id: id }) => {
    await vaiParaTela('valor');
    const escolhido = await telaValor.seleciona(id);
    return { ok: telaAtual === 'valor' && (!id || escolhido === id), evidencia: { tela: telaAtual, valor: telaValor.estado() } };
  },
  'dados.recarrega': async () => {
    await carrega();
    if (telaAtual === 'clientes') desenha();
    if ($('#ficha').open && acha(idAberto())) abreFicha(idAberto());
    return { ok: true };
  },
};
controleDeTela = ligaControleDeTela({ pede, estado: estadoDaTela, acoes: acoesDaTela });
commandCenter = montaCommandCenter({
  pede, esc, cliente: controleDeTela.cliente,
  aoAbrirExecucao: async (id) => { await vaiParaTela('rede'); telaRede.abreExecucao(id).catch((e) => recado(e.message, 'ruim')); },
  // Depois de um comando, a tela que está aberta mostra o estado novo na hora (não no próximo giro de 5 s).
  aoTerminar: () => {
    if (telaAtual === 'rede') telaRede.atualiza().catch(() => {});
    if (telaAtual === 'valor') telaValor.atualiza().catch(() => {});
    if (telaAtual === 'financeiro') telaFinanceiro.abre().catch(() => {});
    if (telaAtual === 'clientes' && !$('#ficha').open) carrega().then(desenha).catch(() => {});
    if (telaAtual === 'hoje') atualizaAgentes().catch(() => {});
  },
});

/* ── começo ────────────────────────────────────────────────────── */
await carrega();
await montaCacadores();
mostraNegocio();
carregaPrecos();
vaiPara();
zapEstado();
claudeCarrega();
telaOfertas.contas();
if (telaAtual !== 'hoje') fluxoPede('').then(desenhaFluxo).catch(() => {});
// Primeira vez (ou faltando o indispensável): a tela Começar abre sozinha, a menos que você tenha
// dito "depois eu termino" nas últimas 24 horas. Quem entrou por um endereço com # vai para onde pediu.
if (telaAtual !== 'comecar') {
  carregaComecar({ testar: false }).then((faltam) => {
    let adiado = 0;
    try { adiado = Number(localStorage.getItem('comecar-adiado')) || 0; } catch { adiado = 0; }
    if (faltam && !location.hash && telaAtual === 'hoje' && Date.now() - adiado > 24 * 3600_000) location.hash = '#comecar';
  }).catch(() => {});
}

/* O painel se atualiza sozinho enquanto Hoje está aberta. Ter que
   apertar "Atualizar" para saber se os agentes estão vivos é o que
   fazia parecer que nada estava acontecendo. */
let voltas = 0;
setInterval(() => {
  if (document.hidden) return;
  voltas += 1;
  if (telaAtual === 'hoje') atualizaAgentes().catch(() => {});
  // Nas outras telas, o estado do topo também se mexe, só que mais devagar.
  else if (voltas % 3 === 0) fluxoPede('').then(desenhaFluxo).catch(() => {});
  else if (telaAtual === 'clientes' && !$('#ficha').open) carrega().then(desenha).catch(() => {});
  else if (telaAtual === 'ofertas') telaOfertas.atualiza().catch(() => {});
  else if (telaAtual === 'rede') telaRede.atualiza().catch(() => {});
  else if (telaAtual === 'valor') telaValor.atualiza().catch(() => {});
  if (voltas % 6 === 0 && telaAtual !== 'ofertas') telaOfertas.contas();
}, 5000);
setInterval(() => { if (!document.hidden) zapEstado(); }, 30_000);
