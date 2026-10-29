/**
 * A REDE DE AGENTES (Agent Network) e o FINANCEIRO (Revenue Guardian).
 *
 * A Rede mostra quem é quem, o que cada agente está fazendo agora, o que
 * está na caixa de cada um (o mural), e o Jarvis no centro, orquestrando:
 * cada comando seu vira uma execução com correlation id, os passos, o
 * agente acionado, a tarefa criada, o tempo, o resultado e o erro.
 */
const POS = {
  jarvis: [480, 70], operacao: [60, 230], cacador: [170, 230], valor: [285, 230], ofertas: [400, 230], vendedor: [515, 230],
  estudio: [645, 230], publicador: [775, 230], dominio: [900, 230], brand_strategist: [645, 360], cobrador: [515, 360],
};
const ESTADO_PASSO = { esperando: 'esperando', executando: 'executando', feito: 'feito', falhou: 'falhou', nao_executado: 'não executado',
  precisa_confirmar: 'esperando o seu sim', precisa_esclarecer: 'perguntou' };
const ESTADO_EXEC = { concluida: ['concluída', 'bom'], falhou: ['falhou', 'ruim'], executando: ['executando', 'acento'],
  esperando_confirmacao: ['esperando o seu sim', 'espera'], esperando_esclarecimento: ['perguntou', 'espera'], interrompida: ['interrompida', 'ruim'] };
const NOME_DO_AGENTE = { tela: 'o painel (a interface)', jarvis: 'o Jarvis', cacador: 'Prospecção', ofertas: 'Offer Architect', vendedor: 'Vendedor',
  estudio: 'Produção: estúdio', publicador: 'Produção: publicador', dominio: 'Domínio', cobrador: 'Revenue Guardian', operacao: 'Operations Commander',
  brand_strategist: 'Brand Strategist', valor: 'Value Intelligence' };
const hora = (ms) => new Date(ms).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function montaRede({ $, poe, esc, pede, recado, ocupado }) {
  let dadosRede = null;
  let filtro = 'todos';
  let noAberto = null;

  const estadoDoNo = (n) => {
    const t = n.trabalhador || {};
    if (n.erros?.length || n.caixa?.travada) return 'erro';
    if (t.pausado) return 'pausado';
    if (t.fazendo) return 'trabalhando';
    if (t.sob_pedido) return 'sob-pedido';
    if (n.id !== 'jarvis' && !t.ligado && !dadosRede.ligado) return 'parado';
    if (!t.ligado && n.id !== 'jarvis') return 'parado';
    return 'esperando';
  };
  const ROTULO = { erro: 'com erro', pausado: 'pausado', trabalhando: 'trabalhando', parado: 'parado', esperando: 'esperando tarefa', 'sob-pedido': 'sob pedido' };

  function grafo() {
    const nos = Object.fromEntries(dadosRede.nos.map((n) => [n.id, n]));
    const recente = (n) => n?.tocado_pelo_jarvis && Date.now() - n.tocado_pelo_jarvis < 15 * 60_000;
    const linhas = dadosRede.ligacoes.filter((l) => POS[l.de] && POS[l.para]).map((l) => {
      const [x1, y1] = POS[l.de]; const [x2, y2] = POS[l.para];
      const doJarvis = l.de === 'jarvis';
      const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
      // Quem não é vizinho na linha passa por baixo, num arco, para não cruzar os nomes.
      const arco = !doJarvis && y1 === y2 && Math.abs(x2 - x1) > 140;
      const curva = arco ? `M${x1},${y1 + 62} Q${mx},${y1 + 122} ${x2},${y2 + 62}` : `M${x1},${y1} L${x2},${y2}`;
      return `<path class="rd-liga${doJarvis ? ' rd-liga-jarvis' : ''}${doJarvis && recente(nos[l.para]) ? ' rd-acesa' : ''}${arco ? ' rd-arco' : ''}" d="${curva}"/>
        ${!doJarvis && l.na_caixa ? `<text class="rd-conta" x="${mx}" y="${arco ? y1 + 106 : my - 8}">${l.na_caixa}</text>` : ''}`;
    }).join('');
    const circulos = dadosRede.nos.filter((n) => POS[n.id]).map((n) => {
      const [x, y] = POS[n.id];
      const st = estadoDoNo(n);
      const jarvis = n.id === 'jarvis';
      const esconde = (filtro === 'erros' && st !== 'erro' && !jarvis) || (filtro === 'jarvis' && !jarvis && !recente(n));
      return `<g class="rd-no rd-${st}${jarvis ? ' rd-orquestrador' : ''}${esconde ? ' rd-apagado' : ''}" data-no="${n.id}" tabindex="0" role="button"
          aria-label="${esc(n.nome)}: ${ROTULO[st]}" transform="translate(${x},${y})">
        <circle r="${jarvis ? 30 : 22}"/>${st === 'trabalhando' ? `<circle class="rd-pulso" r="${jarvis ? 30 : 22}"/>` : ''}
        <text class="rd-nome" y="${jarvis ? 48 : 40}">${esc(n.nome)}</text>
        <text class="rd-estado" y="${jarvis ? 64 : 56}">${esc(ROTULO[st])}${n.caixa?.esperando ? ` · ${n.caixa.esperando} na caixa` : ''}</text>
      </g>`;
    }).join('');
    return `<svg class="rd-svg" viewBox="0 0 960 430" role="img" aria-label="Rede de agentes: quem passa tarefa para quem">${linhas}${circulos}</svg>`;
  }

  function detalheDoNo() {
    if (!noAberto) return '<p class="vazio">Clique num agente para ver o que ele está fazendo, as tarefas e os erros.</p>';
    const n = dadosRede.nos.find((x) => x.id === noAberto);
    if (!n) return '';
    const t = n.trabalhador || {};
    const st = estadoDoNo(n);
    const tarefas = dadosRede.tarefas.filter((x) => x.setor === n.id);
    const pausavel = ['cacador', 'valor', 'ofertas', 'vendedor', 'estudio', 'publicador', 'dominio', 'cobrador', 'operacao'].includes(n.id);
    return `<h3>${esc(n.nome)} <span class="pilula ${st === 'erro' ? 'pilula-ruim' : st === 'trabalhando' ? 'pilula-acento' : st === 'pausado' ? 'pilula-espera' : ''}">${ROTULO[st]}</span></h3>
      <p class="ajuda">${esc(n.papel)}</p>
      ${t.fazendo ? `<p>Fazendo agora: <b>${esc(t.fazendo)}</b></p>` : ''}
      ${n.erros?.length ? `<ul class="rd-erros">${n.erros.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
      ${n.id === 'valor' ? rastroDeValor() : ''}
      ${tarefas.length ? `<p class="ajuda">${tarefas.length} tarefa(s) em aberto: ${tarefas.slice(0, 6).map((x) => `#${x.id} ${esc(x.tipo)}${x.nome ? ` · ${esc(x.nome)}` : ''} (${esc(x.estado)})`).join('; ')}</p>` : ''}
      ${pausavel ? `<div class="acoes">${t.pausado || (n.id === 'operacao' && !t.ligado)
        ? `<button class="bt bt-contorno bt-pequeno" data-rede-acao="agent.resume" data-agente="${n.id}">Retomar</button>`
        : `<button class="bt bt-contorno bt-pequeno" data-rede-acao="agent.pause" data-agente="${n.id}">Pausar</button>`}</div>` : ''}`;
  }

  // Do Value Intelligence até a negociação: o que ele analisou, o que achou, para quem foi.
  function rastroDeValor() {
    const bs = dadosRede.valor || [];
    if (!bs.length) return '<p class="ajuda">Nenhuma análise ainda.</p>';
    return `<ol class="rd-rastro">${bs.slice(0, 6).map((b) => `<li><b>${esc(b.restaurante)}</b> · ${b.produto === 'cardapio' ? 'cardápio' : 'site'} v${b.product_version}
      <br><small>${esc(b.beneficios.join(' · '))}</small>
      <br><small>Brief v${b.versao} ${esc(b.estado)}${b.oferta_id ? ` → oferta ${esc(b.oferta_id)}` : ''}${b.para ? ` → ${esc(b.para)}` : ''}${b.tarefa ? ` (tarefa #${b.tarefa})` : ''}${b.negociacao?.com_o_vendedor ? ' → com o vendedor' : ''}${b.ms != null ? ` · ${b.ms} ms` : ''}</small>
      ${b.problemas.length ? `<br><small class="ruim-texto">${esc(b.problemas.join('; '))}</small>` : ''}
      ${b.correlacao ? `<br><button class="bt bt-texto bt-pequeno" data-execucao="${esc(b.correlacao)}">ver a execução</button>` : ''}</li>`).join('')}</ol>`;
  }

  function tabelaExecucoes() {
    const ex = dadosRede.execucoes.filter((e) => filtro !== 'erros' || e.estado === 'falhou');
    if (!ex.length) return '<p class="vazio">Nenhum comando ainda. Fale com o Jarvis (no botão azul, embaixo à direita) e cada comando aparece aqui, passo a passo.</p>';
    return `<table class="tabela-funil rd-tabela"><thead><tr><th scope="col">Hora</th><th scope="col">Comando</th><th scope="col">Ações</th><th scope="col">Agentes</th><th scope="col">Estado</th><th scope="col">Tempo</th></tr></thead>
      <tbody>${ex.slice(0, 30).map((e) => {
        const [rot, tom] = ESTADO_EXEC[e.estado] || [e.estado, ''];
        const agentes = [...new Set(e.passos.map((p) => p.agente).filter((a) => a && a !== 'tela' && a !== 'jarvis'))];
        return `<tr data-execucao="${esc(e.id)}" tabindex="0"><th scope="row">${hora(e.inicio)}</th><td class="rd-comando">${esc(e.comando)}</td>
          <td><small>${esc(e.passos.map((p) => p.acao).join(' → '))}</small></td><td>${esc(agentes.join(', ') || '—')}</td>
          <td><span class="pilula${tom ? ` pilula-${tom}` : ''}">${rot}</span>${e.erro ? `<br><small class="ruim-texto">${esc(e.erro)}</small>` : ''}</td>
          <td>${e.ms != null ? `${(e.ms / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} s` : '…'}</td></tr>`;
      }).join('')}</tbody></table>`;
  }

  function tabelaTarefas() {
    const ts = dadosRede.tarefas.filter((t) => (filtro === 'erros' ? t.estado === 'travada' || t.aviso : filtro === 'pendentes' ? ['esperando', 'fazendo'].includes(t.estado) : true));
    if (!ts.length) return `<p class="vazio">${filtro === 'erros' ? 'Nenhuma tarefa travada.' : 'Nenhuma tarefa na fila.'}</p>`;
    return `<table class="tabela-funil rd-tabela"><thead><tr><th scope="col">#</th><th scope="col">Agente</th><th scope="col">Tarefa</th><th scope="col">Estado</th><th scope="col">Comando</th></tr></thead>
      <tbody>${ts.slice(0, 40).map((t) => `<tr><th scope="row">${t.id}</th><td>${esc(t.setor)}</td><td>${esc(t.tipo)}${t.nome ? ` · ${esc(t.nome)}` : ''}</td>
        <td>${esc(t.estado)}${t.tentativas ? ` (${t.tentativas}×)` : ''}${t.erro ? `<br><small class="ruim-texto">${esc(t.erro)}</small>` : t.aviso ? `<br><small>${esc(t.aviso)}</small>` : ''}</td>
        <td>${t.correlacao ? `<button class="bt bt-texto bt-pequeno" data-execucao="${esc(t.correlacao)}">${esc(t.correlacao.slice(-6))}</button>` : '—'}</td></tr>`).join('')}</tbody></table>`;
  }

  function desenha() {
    if (!dadosRede) return;
    const contaErros = dadosRede.nos.filter((n) => estadoDoNo(n) === 'erro').length;
    poe('#rd-filtros', [['todos', 'Tudo'], ['erros', `Com erro${contaErros ? ` (${contaErros})` : ''}`], ['pendentes', `Tarefas pendentes (${dadosRede.tarefas.filter((t) => ['esperando', 'fazendo'].includes(t.estado)).length})`], ['jarvis', 'O que o Jarvis acionou']]
      .map(([k, n]) => `<button class="aba-linha" role="tab" data-rede-filtro="${k}" aria-selected="${filtro === k}">${n}</button>`).join(''));
    poe('#rd-grafo', grafo());
    poe('#rd-no', detalheDoNo());
    poe('#rd-execucoes', tabelaExecucoes());
    poe('#rd-tarefas', tabelaTarefas());
    $('#rd-sec-tarefas').hidden = filtro === 'jarvis';
    $('#rd-sub').textContent = `${dadosRede.ligado ? 'Agentes ligados' : 'Matilha recolhida: os agentes não pegam tarefa agora'} · operação ${dadosRede.operacao ? 'solta' : 'parada'}`;
  }

  async function abreExecucao(id) {
    const r = await pede(`/api/jarvis/execucoes/${encodeURIComponent(id)}`);
    const e = r.execucao;
    poe('#rd-exec-corpo', `<h2 id="rd-exec-titulo">${esc(e.comando)}</h2>
      <p class="nota">Correlation id <code>${esc(e.id)}</code> · ${esc(e.quem === 'painel' ? 'pelo painel' : 'pelo Jarvis')} · ${hora(e.inicio)}${e.ms != null ? ` · ${(e.ms / 1000).toLocaleString('pt-BR')} s` : ''}</p>
      ${e.interpretacao ? `<p class="ajuda">Interpretado como: ${esc(e.interpretacao)}</p>` : ''}
      <ol class="rd-passos">${e.passos.map((p) => `<li class="rd-passo rd-p-${p.estado}">
        <b>${esc(p.acao)}</b> <span class="pilula">${ESTADO_PASSO[p.estado] || p.estado}</span>${p.ms ? ` <small>${p.ms} ms</small>` : ''}${p.repetida ? ' <small>(já estava assim)</small>' : ''}
        ${Object.keys(p.parametros || {}).length ? `<br><small><code>${esc(JSON.stringify(p.parametros))}</code></small>` : ''}
        ${p.agente ? `<br><small>Agente: ${esc(NOME_DO_AGENTE[p.agente] || p.agente)}</small>` : ''}
        ${p.resultado ? `<p>${esc(p.resultado)}</p>` : ''}${p.erro ? `<p class="ruim-texto">${esc(p.erro)}</p>` : ''}
        ${p.tarefa ? `<p><small>Tarefa #${p.tarefa.id} no mural (${esc(p.tarefa.setor)}): ${esc((r.tarefas.find((t) => t.id === p.tarefa.id) || {}).estado || '?')}</small></p>` : ''}
        ${p.evidencia ? `<details><summary><small>Evidência da tela</small></summary><pre>${esc(JSON.stringify(p.evidencia, null, 1))}</pre></details>` : ''}</li>`).join('')}</ol>`);
    if (!$('#rd-exec').open) $('#rd-exec').showModal();
  }

  $('#tela-rede').addEventListener('click', async (ev) => {
    const f = ev.target.closest('[data-rede-filtro]');
    if (f) { filtro = f.dataset.redeFiltro; desenha(); return; }
    const no = ev.target.closest('[data-no]');
    if (no) { noAberto = no.dataset.no; desenha(); return; }
    const ex = ev.target.closest('[data-execucao]');
    if (ex) { abreExecucao(ex.dataset.execucao).catch((e) => recado(e.message, 'ruim')); return; }
    const ac = ev.target.closest('[data-rede-acao]');
    if (ac) {
      ocupado(ac, async () => {
        let r = await pede('/api/acoes/executar', { acao: ac.dataset.redeAcao, parametros: { agente: ac.dataset.agente } });
        if (r.execucao.estado === 'esperando_confirmacao') {
          if (!confirm(`Posso ${r.execucao.pendente.descricao}?`)) return;
          r = await pede('/api/acoes/executar', { continua: r.execucao.id, confirmados: [r.execucao.pendente.passo] });
        }
        const p = r.execucao.passos.at(-1);
        recado(p.erro || p.resultado, p.erro ? 'ruim' : 'bom');
        await carrega(); desenha();
      });
    }
  });
  $('#tela-rede').addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const alvo = ev.target.closest('[data-no], tr[data-execucao]');
    if (alvo) { ev.preventDefault(); alvo.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });

  async function carrega() { dadosRede = await pede('/api/rede'); return dadosRede; }
  return {
    async abre() { await carrega(); desenha(); },
    async atualiza() { if ($('#rd-exec').open) return; await carrega(); desenha(); },
    filtra(f) { filtro = f; desenha(); return filtro; },
    filtro: () => filtro,
    abreExecucao,
  };
}

export function montaFinanceiro({ $, poe, esc, pede, recado, ocupado, abreFicha }) {
  let fin = null;
  let filtro = 'todos';
  const reais = (n) => `R$ ${Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  function desenha() {
    if (!fin) return;
    poe('#fn-numeros', `<div class="fn-numero"><b class="num">${fin.clientes.length}</b><span>clientes pagando</span></div>
      <div class="fn-numero"><b class="num">${reais(fin.mensal)}</b><span>por mês, somando as mensalidades</span></div>
      <div class="fn-numero${fin.pendentes.length ? ' fn-alerta' : ''}"><b class="num">${fin.pendentes.length}</b><span>mensalidades pendentes</span></div>`);
    poe('#fn-filtros', [['todos', 'Todos'], ['pendentes', `Pendentes (${fin.pendentes.length})`], ['em_dia', 'Em dia']]
      .map(([k, n]) => `<button class="aba-linha" role="tab" data-fin-filtro="${k}" aria-selected="${filtro === k}">${n}</button>`).join(''));
    const vistos = fin.clientes.filter((c) => (filtro === 'pendentes' ? c.pendente : filtro === 'em_dia' ? !c.pendente : true));
    poe('#fn-lista', vistos.length ? `<table class="tabela-funil"><thead><tr><th scope="col">Cliente</th><th scope="col">Mensalidade</th><th scope="col">Situação</th><th scope="col"></th></tr></thead>
      <tbody>${vistos.map((c) => `<tr><th scope="row">${esc(c.nome)}${c.arquivado ? ' <small>(arquivado)</small>' : ''}</th><td>${esc(c.valor || '—')}</td>
        <td>${c.pendente ? `<span class="pilula pilula-${c.dias_de_atraso > 0 ? 'ruim' : 'espera'}">${esc(c.nome_do_mes)}${c.dias_de_atraso > 0 ? `, ${c.dias_de_atraso} dias de atraso` : ', vence agora'}</span>${c.avisado ? ' <small>avisado</small>' : ''}` : '<span class="pilula pilula-bom">em dia</span>'}</td>
        <td><button class="bt bt-texto bt-pequeno" data-fin-ficha="${esc(c.id)}">Abrir ficha</button></td></tr>`).join('')}</tbody></table>`
      : `<p class="vazio">${filtro === 'pendentes' ? 'Nenhuma mensalidade pendente.' : 'Ainda nenhum cliente pagando mensalidade. Quem aprova o site oficial entra aqui.'}</p>`);
    poe('#fn-cobrador', `O cobrador está <b>${fin.cobrador ? 'ligado' : 'pausado'}</b>: ${fin.cobrador ? 'avisa no vencimento, lembra com 3 dias de atraso e chama você com 7.' : 'não manda aviso nenhum até você retomar.'}
      <button class="bt bt-contorno bt-pequeno" data-fin-cobrador="${fin.cobrador ? 'agent.pause' : 'agent.resume'}">${fin.cobrador ? 'Pausar o cobrador' : 'Retomar o cobrador'}</button>`);
  }
  $('#tela-financeiro').addEventListener('click', (ev) => {
    const f = ev.target.closest('[data-fin-filtro]');
    if (f) { filtro = f.dataset.finFiltro; desenha(); return; }
    const ficha = ev.target.closest('[data-fin-ficha]');
    if (ficha) { abreFicha(ficha.dataset.finFicha); return; }
    const c = ev.target.closest('[data-fin-cobrador]');
    if (c) {
      ocupado(c, async () => {
        let r = await pede('/api/acoes/executar', { acao: c.dataset.finCobrador, parametros: { agente: 'cobrador' } });
        if (r.execucao.estado === 'esperando_confirmacao') {
          if (!confirm(`Posso ${r.execucao.pendente.descricao}?`)) return;
          r = await pede('/api/acoes/executar', { continua: r.execucao.id, confirmados: [r.execucao.pendente.passo] });
        }
        const p = r.execucao.passos.at(-1);
        recado(p.erro || p.resultado, p.erro ? 'ruim' : 'bom');
        fin = await pede('/api/financeiro'); desenha();
      });
    }
  });
  return {
    async abre() { fin = await pede('/api/financeiro'); desenha(); },
    filtra(f) { filtro = f; desenha(); return filtro; },
    filtro: () => filtro,
    quantos: () => (fin ? fin.clientes.filter((c) => (filtro === 'pendentes' ? c.pendente : filtro === 'em_dia' ? !c.pendente : true)).length : 0),
  };
}
