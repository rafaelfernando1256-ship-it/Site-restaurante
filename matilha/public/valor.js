/**
 * A PÁGINA VALUE INTELLIGENCE.
 *
 *   A. Produto       o que vendemos, os benefícios mais fortes, preço e limitações
 *   B. Mapa de valor funcionalidade → vantagem → benefício → valor → evidência
 *   C. Restaurante   a análise de um restaurante: fatos verificados × hipóteses
 *   D. Pontuação     os cinco critérios de cada benefício (heurística, não previsão)
 *   E. Value Brief   exatamente o que o vendedor recebe
 *   F. Histórico     as versões, a oferta ligada e o que aconteceu na negociação
 *
 * Todo botão chama uma ação do registro (/api/acoes/executar): o mesmo
 * caminho do Jarvis, com a mesma permissão e o mesmo registro.
 */
const PROD = { site: 'Site completo', cardapio: 'Cardápio digital' };
const ESTADO_F = { implementada: ['entregue', 'ok'], por_nos: ['feito por nós', 'meio'], nao_implementada: ['não existe', 'nao'] };
const ESTADO_B = { gerado: 'esperando aprovação', aprovado: 'aprovado', enviado: 'com o vendedor', bloqueado: 'bloqueado', substituido: 'substituído', falhou: 'falhou', rejeitado: 'rejeitado' };
const CLASSE = { prioritario: 'prioritário', relevante: 'relevante', complementar: 'complementar', secundario: 'secundário' };

export function montaValor({ $, $$, poe, esc, pede, recado, ocupado, cliente = () => '' }) {
  let d = null;
  let produto = 'cardapio';
  let leadId = '';
  let produtoDoLead = '';
  let mostraComparacao = false;
  let revisando = false;

  const barra = (n) => `<span class="vi-barra" aria-hidden="true"><i style="width:${Math.max(0, Math.min(100, n))}%"></i></span>`;
  const nota = (n, c) => `<span class="vi-nota vi-${c}">${n}</span>`;

  async function executa(passos, botao) {
    let r = await pede('/api/acoes/executar', { passos, cliente: cliente(), comando: passos.map((p) => p.acao).join(' → ') });
    if (r.execucao.estado === 'esperando_confirmacao') {
      if (!confirm(`Posso ${r.execucao.pendente.descricao}?`)) return null;
      r = await pede('/api/acoes/executar', { continua: r.execucao.id, confirmados: [r.execucao.pendente.passo], cliente: cliente() });
    }
    const falhou = r.execucao.passos.find((p) => p.estado === 'falhou');
    if (falhou) throw new Error(falhou.erro);
    const ultimo = r.execucao.passos.filter((p) => p.estado === 'feito').at(-1);
    if (ultimo && botao) recado(String(ultimo.resultado).slice(0, 260), 'bom');
    return r.execucao;
  }

  async function carrega() {
    const q = leadId ? `?lead=${encodeURIComponent(leadId)}${produtoDoLead ? `&produto=${produtoDoLead}` : ''}` : '';
    d = await pede(`/api/valor${q}`);
    return d;
  }

  /* A. produto */
  function desenhaProduto() {
    const p = d.produtos[produto];
    poe('#vi-produto', `
      <div class="vi-seg" role="tablist" aria-label="Produto">${Object.entries(PROD).map(([k, n]) => `<button role="tab" data-vi-produto="${k}" aria-selected="${k === produto}">${n}</button>`).join('')}</div>
      <div class="vi-prod-cab"><div><h3>${esc(p.nome)}</h3><p class="vi-suave">${esc(p.descricao)}</p></div>
        <span class="vi-versao" title="A versão sobe quando muda funcionalidade, preço ou condição">versão ${p.product_version}</span></div>
      <div class="vi-cartoes">${p.principais.map((b, i) => `<article class="vi-cartao"><span class="vi-ordem">${i + 1}</span>
        <h4>${esc(b.benefit)}</h4><p>${esc(b.customer_value)}</p>
        <p class="vi-evid">Evidência: ${esc(b.evidencia?.tipo || '—')} · ${esc(b.evidencia?.onde || '')}</p></article>`).join('')}</div>
      <div class="vi-colunas">
        <div><h4>Preço (do catálogo do Offer Architect)</h4>${p.preco.length ? `<ul>${p.preco.map((x) => `<li>${esc(x.nome)}: ${esc(x.mensalidade || 'sem preço cadastrado')}${x.implantacao ? ` · ${esc(x.implantacao)}` : ''}${x.aprovado ? '' : ' <small>(não aprovado)</small>'}</li>`).join('')}</ul>` : '<p class="vi-suave">Nenhum pacote.</p>'}
          ${p.custos_adicionais.length ? `<p class="vi-suave">Custos adicionais: ${esc(p.custos_adicionais.join('; '))}</p>` : ''}
          <p class="vi-suave">Garantia autorizada: ${esc(p.garantias_autorizadas.join('; ') || 'nenhuma (não se fala em garantia)')}</p></div>
        <div><h4>Limitações (não se promete)</h4><ul>${p.limitacoes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          ${p.nao_verificado.length ? `<p class="vi-alerta">Não verificado: ${esc(p.nao_verificado.join('; '))}</p>` : ''}</div>
      </div>
      <div class="vi-acoes"><button class="vi-bt" data-vi-acao="produto">Analisar produto</button></div>`);
  }

  /* B. mapa de valor */
  function desenhaMapa() {
    const p = d.produtos[produto];
    const linhas = p.funcionalidades.map((f) => {
      const m = p.mapa_de_valor.find((x) => x.feature_id === f.id);
      const [rot, cls] = ESTADO_F[f.estado];
      return `<tr class="vi-f-${cls}"><th scope="row">${esc(f.nome)}<br><span class="vi-chip vi-chip-${cls}">${rot}</span></th>
        ${m ? `<td>${esc(m.advantage)}</td><td>${esc(m.benefit)}</td><td>${esc(m.customer_value)}</td><td>${esc(m.evidencia?.descricao || '—')}${f.condicao ? `<br><small>${esc(f.condicao)}</small>` : ''}</td>`
    : '<td colspan="4" class="vi-suave">Não existe no produto: é limitação, nunca argumento.</td>'}
        <td><label class="vi-oculto" for="vi-est-${f.id}">Estado de ${esc(f.nome)}</label>
          <select id="vi-est-${f.id}" data-vi-func="${f.id}">${Object.entries(ESTADO_F).map(([k, [r]]) => `<option value="${k}" ${k === f.estado ? 'selected' : ''}>${r}</option>`).join('')}</select></td></tr>`;
    }).join('');
    poe('#vi-mapa', `<div class="vi-tabela-rola"><table class="vi-tabela"><thead><tr><th scope="col">Funcionalidade</th><th scope="col">Vantagem</th><th scope="col">Benefício</th>
      <th scope="col">Valor para o cliente</th><th scope="col">Evidência</th><th scope="col">Estado</th></tr></thead><tbody>${linhas}</tbody></table></div>
      <p class="vi-suave">A base de produtos é a fonte da verdade: mudar um estado sobe a versão do produto e refaz os briefs antigos (pede o seu sim).</p>`);
  }

  /* C. restaurante */
  function desenhaRestaurante() {
    const a = d.analise;
    poe('#vi-lead-campos', `<label class="vi-campo"><span>Restaurante</span><select id="vi-lead"><option value="">Escolha…</option>${d.leads.map((l) => `<option value="${esc(l.id)}" ${l.id === leadId ? 'selected' : ''}>${esc(l.nome)}${l.tipo ? ` · ${esc(l.tipo)}` : ''}</option>`).join('')}</select></label>
      <label class="vi-campo"><span>Produto</span><select id="vi-lead-produto"><option value="">O agente escolhe</option>${Object.entries(PROD).map(([k, n]) => `<option value="${k}" ${k === produtoDoLead ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <div class="vi-acoes"><button class="vi-bt vi-bt-contorno" data-vi-acao="analisar">Analisar restaurante</button><button class="vi-bt" data-vi-acao="gerar">Gerar Value Brief</button></div>`);
    if (!a) { poe('#vi-lead-corpo', '<p class="vi-suave">Escolha um restaurante para ver o que se sabe dele e o que vale para ele.</p>'); return; }
    poe('#vi-lead-corpo', `<div class="vi-colunas">
      <div><h4>Contexto verificado</h4><ul class="vi-fatos">${a.verified_context.map((f) => `<li>${esc(f.texto)} <small>fonte: ${esc(f.fonte)}</small></li>`).join('')}</ul></div>
      <div><h4>Necessidades</h4><ul class="vi-necessidades">${a.identified_needs.map((n) => `<li><span class="vi-chip vi-chip-${n.tipo === 'verificada' ? 'ok' : 'meio'}">${n.tipo === 'verificada' ? 'verificada' : 'hipótese'}</span>
        <b>${esc(n.descricao)}</b><br><small>${esc(n.observacao)}</small></li>`).join('') || '<li class="vi-suave">Nenhuma necessidade identificada: faça as perguntas antes.</li>'}</ul></div></div>
      <p class="vi-suave">Produto analisado: ${esc(a.nome)} (versão ${a.product_version}) · confiança ${a.confidence_score}/100</p>`);
  }

  /* D. pontuação */
  function desenhaPontuacao() {
    const a = d.analise || d.produtos[produto];
    poe('#vi-pontos', `<p class="vi-suave">Pesos: ${Object.entries(d.pesos).map(([k, p]) => `${esc(d.criterios[k])} ${p}`).join(' · ')}. Faixas: 85+ prioritário, 70+ relevante, 50+ complementar. É heurística de prioridade, não previsão de venda.</p>
      <ol class="vi-score">${a.mapa_de_valor.map((b) => `<li><div class="vi-score-cab">${nota(b.score, b.classe)}<b>${esc(b.feature)}</b><span class="vi-chip">${CLASSE[b.classe]}</span><small>confiança ${esc(b.confidence_level)}</small></div>
        <div class="vi-criterios">${Object.entries(b.criterios).map(([k, v]) => `<span><small>${esc(d.criterios[k])}</small>${barra(v)}<b>${v}</b></span>`).join('')}</div></li>`).join('')}</ol>`);
  }

  /* E. o que o vendedor recebe */
  function desenhaBrief() {
    const b = d.brief;
    if (!b) { poe('#vi-brief', '<p class="vi-suave">Nenhum Value Brief deste restaurante ainda. Escolha um e clique em "Gerar Value Brief".</p>'); return; }
    const r = b.resumo;
    poe('#vi-brief', `<article class="vi-brief">
      <header><h3>Value Brief — ${esc(b.restaurant_name)}</h3><span class="vi-chip vi-chip-${b.estado === 'bloqueado' ? 'nao' : b.estado === 'enviado' ? 'ok' : 'meio'}">${ESTADO_B[b.estado] || b.estado}</span></header>
      <dl>
        <dt>Produto</dt><dd>${esc(PROD[b.product_id])} · versão ${b.product_version} · brief v${b.versao}</dd>
        <dt>Principal valor</dt><dd>${esc(r.principal_valor)}</dd>
        <dt>Argumento principal</dt><dd>${revisando ? `<textarea id="vi-arg" rows="3">${esc(r.argumento_principal)}</textarea>` : `<q>${esc(r.argumento_principal)}</q>`}</dd>
        <dt>Benefício secundário</dt><dd>${esc(r.beneficio_secundario || '—')}</dd>
        <dt>Pergunta consultiva</dt><dd>${revisando ? `<textarea id="vi-perg" rows="2">${esc(r.pergunta_consultiva)}</textarea>` : `<q>${esc(r.pergunta_consultiva)}</q>`}</dd>
        <dt>Demonstração sugerida</dt><dd>${esc(r.demonstracao)}</dd>
        <dt>Limitação</dt><dd>${esc(r.limitacao)}</dd>
      </dl>
      ${b.problemas?.length ? `<p class="vi-alerta">Bloqueado: ${esc(b.problemas.join('; '))}</p>` : ''}
      <details><summary>Os três benefícios, com evidência</summary><ol>${b.prioritized_benefits.map((x) => `<li><b>${esc(x.benefit)}</b> (${x.relevance_score}, ${CLASSE[x.classe]}, confiança ${esc(x.confidence_level)})<br><small>${esc(x.feature)} → ${esc(x.advantage)} → ${esc(x.customer_value)} · evidência ${esc(x.evidence_reference)}${x.base ? ` · ${esc(x.base.tipo)}: ${esc(x.base.observacao)}` : ''}</small></li>`).join('')}</ol></details>
      <details><summary>Perguntas (SPIN)</summary><ul>${b.suggested_questions.map((q) => `<li><small>${esc(q.tipo)}</small> ${esc(q.pergunta)}</li>`).join('')}</ul></details>
      <details><summary>Objeções</summary><ul>${b.objection_support.map((o) => `<li><b>"${esc(o.objecao)}"</b>${o.vantagem_suficiente ? '' : ' <span class="vi-chip vi-chip-nao">sem vantagem suficiente</span>'}<br>${esc(o.resposta)}</li>`).join('')}</ul></details>
      <details><summary>Limitações e o que não está verificado</summary><ul>${b.limitations.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></details>
    </article>
    <div class="vi-acoes">
      ${revisando ? '<button class="vi-bt" data-vi-acao="salvar-revisao">Salvar revisão</button><button class="vi-bt vi-bt-texto" data-vi-acao="cancelar-revisao">Cancelar</button>'
    : `<button class="vi-bt vi-bt-contorno" data-vi-acao="revisar" ${b.estado === 'enviado' ? 'disabled' : ''}>Revisar análise</button>
      <button class="vi-bt" data-vi-acao="aprovar" ${['gerado'].includes(b.estado) ? '' : 'disabled'}>Aprovar briefing</button>
      <button class="vi-bt" data-vi-acao="enviar" ${b.estado === 'aprovado' ? '' : 'disabled'}>Enviar ao vendedor</button>`}
      <button class="vi-bt vi-bt-contorno" data-vi-acao="comparar">Comparar benefícios</button>
    </div>
    ${mostraComparacao && d.comparacao ? comparacao(d.comparacao) : ''}`);
  }
  function comparacao(c) {
    return `<div class="vi-compara" id="vi-compara"><h4>Site completo × cardápio digital</h4>
      <div class="vi-colunas">${c.produtos.map((p) => `<div><b>${esc(p.nome)}</b><ol>${p.principais.map((b) => `<li>${esc(b.benefit)} <small>${b.score} · ${CLASSE[b.classe]}</small></li>`).join('')}</ol></div>`).join('')}</div>
      <p><small>Só no site: ${esc(c.so_no_site.join(', ') || '—')}. Só no cardápio: ${esc(c.so_no_cardapio.join(', ') || '—')}. Nos dois: ${esc(c.nos_dois.join(', ') || '—')}.</small></p>
      <p>${esc(c.leitura)}</p></div>`;
  }

  /* F. histórico */
  function desenhaHistorico() {
    const bs = d.briefs;
    const leadDe = (id) => d.leads.find((l) => l.id === id);
    poe('#vi-historico', bs.length ? `<div class="vi-tabela-rola"><table class="vi-tabela"><thead><tr><th scope="col">Restaurante</th><th scope="col">Brief</th><th scope="col">Produto</th><th scope="col">Estado</th><th scope="col">Oferta</th><th scope="col">Negociação</th><th scope="col"></th></tr></thead>
      <tbody>${bs.slice(0, 40).map((b) => { const l = leadDe(b.lead_id); return `<tr><th scope="row">${esc(b.restaurant_name)}</th><td>v${b.versao} <small>${new Date(b.generated_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</small></td>
        <td>${esc(PROD[b.product_id])} v${b.product_version}${d.desatualizados.includes(b.brief_id) ? ' <span class="vi-chip vi-chip-nao">produto mudou</span>' : ''}</td>
        <td>${esc(ESTADO_B[b.estado] || b.estado)}</td><td>${esc(b.oferta_id || '—')}</td><td>${l ? `${esc(l.estagio.replace(/_/g, ' '))}${l.vendeu_em ? ' · fechou' : ''}` : '—'}</td>
        <td><button class="vi-bt vi-bt-texto" data-vi-hist="${esc(b.brief_id)}">Abrir histórico</button></td></tr>`; }).join('')}</tbody></table></div>`
      : '<p class="vi-suave">Nenhuma análise ainda.</p>');
    poe('#vi-eventos', d.eventos.slice(0, 12).map((e) => `<li><code>${esc(e.tipo)}</code> <small>${new Date(e.quando).toLocaleTimeString('pt-BR')}${e.brief_id ? ` · ${esc(e.brief_id)}` : ''}${e.erro ? ` · ${esc(e.erro)}` : ''}</small></li>`).join(''));
  }
  function abreHistorico(id) {
    const b = d.briefs.find((x) => x.brief_id === id) || d.brief;
    if (!b) { recado('Nenhum histórico ainda.', ''); return; }
    const evs = d.eventos.filter((e) => e.brief_id === b.brief_id);
    poe('#vi-hist-corpo', `<h2 id="vi-hist-titulo">${esc(b.restaurant_name)} · brief v${b.versao}</h2>
      <p class="nota">${esc(b.brief_id)}${b.correlacao ? ` · correlation id ${esc(b.correlacao)}` : ''} · ${esc(PROD[b.product_id])} v${b.product_version}</p>
      <ol class="rd-passos">${b.historico.map((h) => `<li>${new Date(h.quando).toLocaleString('pt-BR')}: ${esc(h.o)}</li>`).join('')}</ol>
      ${evs.length ? `<h3>Eventos</h3><ul>${evs.map((e) => `<li><code>${esc(e.tipo)}</code> ${new Date(e.quando).toLocaleTimeString('pt-BR')}</li>`).join('')}</ul>` : ''}
      <p>Saída: ${esc(b.saida?.para || 'pendente')}${b.saida?.tarefa ? ` (tarefa #${b.saida.tarefa})` : ''}${b.oferta_id ? ` · oferta ${esc(b.oferta_id)}` : ''}</p>`);
    if (!$('#vi-hist').open) $('#vi-hist').showModal();
  }

  function desenhaTudo() {
    const t = d.trabalhador;
    poe('#vi-trabalhador', t?.fazendo ? `trabalhando: ${esc(t.fazendo)}` : t?.pausado ? 'pausado' : t?.ligado ? 'esperando tarefa' : 'parado');
    desenhaProduto(); desenhaMapa(); desenhaRestaurante(); desenhaPontuacao(); desenhaBrief(); desenhaHistorico();
  }

  const tela = $('#tela-valor');
  tela.addEventListener('click', async (ev) => {
    const prod = ev.target.closest('[data-vi-produto]');
    if (prod) { produto = prod.dataset.viProduto; desenhaProduto(); desenhaMapa(); if (!d.analise) desenhaPontuacao(); return; }
    const hist = ev.target.closest('[data-vi-hist]');
    if (hist) { abreHistorico(hist.dataset.viHist); return; }
    const b = ev.target.closest('[data-vi-acao]');
    if (!b) return;
    const acao = b.dataset.viAcao;
    if (acao === 'revisar') { revisando = true; desenhaBrief(); return; }
    if (acao === 'cancelar-revisao') { revisando = false; desenhaBrief(); return; }
    if (acao === 'comparar') { mostraComparacao = !mostraComparacao; desenhaBrief(); return; }
    const nome = d.leads.find((l) => l.id === leadId)?.nome || '';
    await ocupado(b, async () => {
      if (acao === 'produto') await executa([{ acao: 'value.product', parametros: { produto } }], b);
      if (['analisar', 'gerar', 'aprovar', 'enviar', 'salvar-revisao'].includes(acao) && !leadId) throw new Error('Escolha um restaurante.');
      if (acao === 'analisar') { await carrega(); desenhaTudo(); recado(`Análise de ${nome} na tela (sem salvar). "Gerar Value Brief" grava e manda ao Offer Architect.`, 'bom'); return; }
      if (acao === 'gerar') await executa([{ acao: 'value.analyze', parametros: { projeto: nome, ...(produtoDoLead ? { produto: produtoDoLead } : {}) } }], b);
      if (acao === 'aprovar') await executa([{ acao: 'value.approve', parametros: { projeto: nome } }], b);
      if (acao === 'enviar') await executa([{ acao: 'value.send', parametros: { projeto: nome } }], b);
      if (acao === 'salvar-revisao') {
        // Bloqueada ou não, a revisão fica gravada; a tela mostra o motivo do bloqueio no brief.
        try { await executa([{ acao: 'value.revise', parametros: { projeto: nome, argumento_principal: $('#vi-arg').value, pergunta_consultiva: $('#vi-perg').value } }], b); } finally { revisando = false; await carrega(); desenhaTudo(); }
        return;
      }
      await carrega(); desenhaTudo();
    });
  });
  tela.addEventListener('change', async (ev) => {
    if (ev.target.id === 'vi-lead') { leadId = ev.target.value; mostraComparacao = false; await carrega(); desenhaTudo(); return; }
    if (ev.target.id === 'vi-lead-produto') { produtoDoLead = ev.target.value; await carrega(); desenhaTudo(); return; }
    const f = ev.target.closest('[data-vi-func]');
    if (f) {
      try { await executa([{ acao: 'value.feature', parametros: { produto, funcionalidade: f.dataset.viFunc, estado: f.value } }], f); } catch (e) { recado(e.message, 'ruim'); }
      await carrega(); desenhaTudo();
    }
  });
  $$('#tela-valor .vi-nav a').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); $(a.getAttribute('href').replace('#', '#vi-sec-'))?.scrollIntoView({ behavior: 'smooth' }); }));

  return {
    async abre() { await carrega(); desenhaTudo(); },
    async atualiza() { if (revisando || document.activeElement?.closest?.('#tela-valor select, #tela-valor textarea')) return; await carrega(); desenhaTudo(); },
    /** Para o Jarvis: abrir com um restaurante escolhido. */
    async seleciona(id) { leadId = id || leadId; await carrega(); desenhaTudo(); return leadId; },
    estado: () => ({ lead: leadId || null, produto }),
  };
}
