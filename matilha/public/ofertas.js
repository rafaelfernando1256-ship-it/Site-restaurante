/**
 * A ABA "OFERTAS INTELIGENTES" — o AGENTE 4, Offer Architect.
 *
 *   Propostas         o que cada cliente vai receber: versões, nota,
 *                     objeções; Aprovar, Editar, Rejeitar, Enviar ao vendedor
 *   Pacotes e preços  o catálogo que você aprova, os bônus autorizados, as regras
 *   Resultados        o que funcionou, e as sugestões (que nunca se aplicam sozinhas)
 */
const ESTADOS = {
  gerando: ['gerando…', ''], rascunho: ['pronta para aprovar', 'acento'], revisao: ['revisar', 'espera'],
  aprovada: ['aprovada', 'bom'], enviada: ['com o vendedor', 'bom'], rejeitada: ['rejeitada', 'ruim'],
  substituida: ['substituída', ''], erro: ['falhou', 'ruim'], sem_catalogo: ['falta preço no catálogo', 'ruim'],
};
const FILTROS = [
  ['pendentes', 'Esperando você', (o) => ['rascunho', 'revisao', 'aprovada', 'gerando'].includes(o.estado)],
  ['enviadas', 'Com o vendedor', (o) => o.estado === 'enviada'],
  ['outras', 'Rejeitadas e falhas', (o) => ['rejeitada', 'substituida', 'erro', 'sem_catalogo'].includes(o.estado)],
  ['todas', 'Todas', () => true],
];
const PRODUTO = { cardapio: 'Cardápio digital', site: 'Site completo' };
const OBJ = { preco: 'preço', tempo: '"agora não"', status_quo: '"já tenho"', autoridade: 'ver com outra pessoa', confianca: 'desconfiança' };
const BONUS_EXTRA = { percentual: ['Desconto', '%'], meses: ['Por quantos meses', 'meses'], dias: ['Quantos dias', 'dias'] };

export function montaOfertas({ $, $$, poe, esc, pede, recado, ocupado, leads }) {
  let painel = null;
  let filtro = 'pendentes';
  const versaoVista = {};
  const comparando = new Set();
  const editando = new Set();

  const reais = (v) => (v === null || v === undefined || v === '' ? '—'
    : `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(Number(v)) ? 0 : 2, maximumFractionDigits: 2 })}`);
  const numero = (t) => {
    const limpo = String(t ?? '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    return limpo === '' ? null : Number(limpo);
  };
  const faixa = (n) => (n >= 85 ? 'alta' : n >= 75 ? 'media' : 'baixa');
  const pilula = (estado) => { const [t, tom] = ESTADOS[estado] || [estado, '']; return `<span class="pilula${tom ? ` pilula-${tom}` : ''}">${esc(t)}</span>`; };
  const pacoteDe = (tipo, chave) => (painel?.catalogo?.produtos?.[tipo]?.pacotes || []).find((p) => p.chave === chave);

  async function carrega() {
    painel = await pede('/api/ofertas');
    desenhaContas();
    return painel;
  }

  function desenhaContas() {
    const pend = painel.ofertas.filter((o) => ['rascunho', 'revisao'].includes(o.estado)).length;
    const conta = $('#nav-ofertas-conta');
    if (conta) { conta.textContent = pend; conta.hidden = !pend; }
    poe('#of-conta-propostas', pend ? String(pend) : '');
    const naoAprovados = Object.values(painel.catalogo.produtos).flatMap((p) => p.pacotes).filter((p) => !p.aprovado).length;
    poe('#of-conta-catalogo', naoAprovados ? `${naoAprovados} sem aprovar` : '');
    const t = painel.trabalhador;
    const c = painel.caixa || {};
    poe('#of-trabalhador', t?.fazendo ? `trabalhando: ${esc(t.fazendo)}` : t?.ligado ? `${c.esperando || 0} na caixa` : (c.esperando ? `${c.esperando} na caixa, agente parado` : ''));
  }

  /* ── propostas ─────────────────────────────────────────────── */
  function desenhaPropostas() {
    const lista = leads();
    const atual = $('#of-lead').value;
    poe('#of-lead', lista.length
      ? lista.filter((l) => l.estagio !== 'perdido').map((l) => `<option value="${esc(l.id)}">${esc(l.nome || l.id)}${l.tipo ? ` · ${esc(l.tipo)}` : ''}${l.cidade ? ` · ${esc(l.cidade)}` : ''}</option>`).join('')
      : '<option value="">Nenhum cliente ainda</option>');
    if (atual) $('#of-lead').value = atual;

    poe('#of-filtros', FILTROS.map(([k, nome, f]) => `<button class="aba-linha" role="tab" data-filtro="${k}" aria-selected="${k === filtro}">${nome}
      <span class="conta">${painel.ofertas.filter(f).length}</span></button>`).join(''));
    const vistas = painel.ofertas.filter(FILTROS.find(([k]) => k === filtro)[2]);
    $('#of-vazio').hidden = vistas.length > 0;
    poe('#of-lista', vistas.map(cartao).join(''));
  }

  function cartao(o) {
    const cab = `<header class="of-cab">
        <div class="of-quem"><h3>${esc(o.nome || o.lead_id)}</h3>
          <p class="of-meta">${[o.nicho, o.cidade, PRODUTO[o.product_type], `oferta ${o.offer_version}`, o.campaign_id].filter(Boolean).map(esc).join(' · ')}</p></div>
        <div class="of-cab-dir">${pilula(o.estado)}${o.versoes.length ? `<span class="of-nota" data-faixa="${faixa(o.versoes[o.escolhida]?.score || 0)}" title="Nota da versão escolhida (heurística, não previsão de venda)">${o.versoes[o.escolhida]?.score ?? '—'}</span>` : ''}</div>
      </header>`;
    if (!o.versoes.length) {
      return `<article class="of-cartao" data-oferta="${esc(o.id)}">${cab}
        <p class="of-erro">${esc(o.erro || 'Gerando…')}</p>
        <footer class="of-acoes"><button class="bt bt-contorno bt-pequeno" data-acao="regerar">Gerar de novo</button></footer></article>`;
    }
    const i = versaoVista[o.id] ?? o.escolhida;
    const v = o.versoes[i];
    const abas = `<div class="of-versoes" role="tablist" aria-label="Versões da oferta">${o.versoes.map((x, k) => `<button class="of-versao" role="tab" data-versao="${k}" aria-selected="${k === i}">
        Versão ${esc(x.rotulo || k + 1)} <span class="of-mini" data-faixa="${faixa(x.score)}">${x.score}</span>${k === o.escolhida ? ' <small>(a melhor)</small>' : ''}</button>`).join('')}
      ${o.versoes.length > 1 ? `<button class="bt bt-texto bt-pequeno" data-acao="comparar">${comparando.has(o.id) ? 'Fechar comparação' : 'Comparar versões'}</button>` : ''}</div>`;
    const aberta = ['rascunho', 'revisao', 'aprovada'].includes(o.estado);
    return `<article class="of-cartao" data-oferta="${esc(o.id)}">${cab}${abas}
      ${comparando.has(o.id) ? comparacao(o) : ''}
      <details class="of-detalhe" ${aberta ? 'open' : ''}><summary>Ver a proposta</summary>
        ${editando.has(o.id) ? edicao(o, i, v) : corpo(o, v)}
      </details>
      ${o.resultado ? resultado(o.resultado) : ''}
      ${acoes(o, i, v)}
    </article>`;
  }

  function corpo(o, v) {
    const pac = pacoteDe(o.product_type, v.recommended_package) || o.pacote;
    const alts = (v.alternative_packages || []).map((c) => pacoteDe(o.product_type, c)).filter(Boolean);
    const bonus = (v.permitted_bonus || []).map((c) => painel.catalogo.bonus.find((b) => b.chave === c)?.texto || c);
    const evid = (v.evidence_ids || []).map((id) => o.fatos.find((f) => f.id === id)).filter(Boolean);
    const linhaPacote = (p) => `<b>${esc(p.nome)}</b>: ${reais(p.mensal)} por mês${p.implantacao ? ` + ${reais(p.implantacao)} de implantação` : ''}
      ${p.aprovado ? '<span class="pilula pilula-bom">aprovado</span>' : '<span class="pilula pilula-espera">não aprovado no catálogo</span>'}`;
    return `${v.problemas.length ? `<div class="of-alerta ruim"><b>Bloqueada até editar:</b><ul>${v.problemas.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
      ${v.avisos.length ? `<div class="of-alerta"><b>Atenção:</b> ${v.avisos.map(esc).join('; ')}.</div>` : ''}
      <dl class="of-dl">
        <dt>Problema verificado</dt><dd>${esc(v.verified_problem)}
          ${evid.length ? `<ul class="of-evid">${evid.map((f) => `<li>${esc(f.texto)} <small>fonte: ${esc(f.fonte)}</small></li>`).join('')}</ul>` : ''}</dd>
        <dt>Solução proposta</dt><dd>${esc(v.proposed_solution)}</dd>
        <dt>Proposta de valor</dt><dd>${esc(v.value_proposition)}</dd>
        <dt>Pacote recomendado</dt><dd>${pac ? linhaPacote(pac) : `<span class="ruim">${esc(v.recommended_package)} (não está no catálogo)</span>`}
          ${alts.length ? `<p class="of-alt">Alternativa: ${alts.map(linhaPacote).join('<br>')}</p>` : ''}</dd>
        <dt>Como apresentar o preço</dt><dd>${esc(v.price_presentation)}</dd>
        ${bonus.length ? `<dt>Bônus</dt><dd>${bonus.map(esc).join(' · ')}</dd>` : ''}
        ${v.diferenciais?.length ? `<dt>Diferenciais</dt><dd><ul>${v.diferenciais.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></dd>` : ''}
        <dt>Mensagem de abertura</dt><dd><p class="of-zap">${esc(v.suggested_opening_message)}</p></dd>
        <dt>Próximo passo</dt><dd>${esc(v.suggested_next_step)}</dd>
      </dl>
      <details class="of-mais"><summary>Objeções previstas (${v.objection_responses.length})</summary>
        <ul class="of-objecoes">${v.objection_responses.map((r) => `<li><b>"${esc(r.objecao)}"</b>${r.preocupacao ? ` <small>por trás: ${esc(r.preocupacao)}</small>` : ''}
          <p>${esc(r.resposta)}${r.pergunta ? ` <i>${esc(r.pergunta)}</i>` : ''}</p></li>`).join('')}</ul></details>
      <details class="of-mais"><summary>A nota, critério por critério</summary>
        <ul class="of-criterios">${Object.entries(painel.criterios).map(([k, nome]) => `<li><span>${esc(nome)} <small>peso ${painel.catalogo.pesos[k]}</small></span>
          <span class="of-barra" aria-hidden="true"><i style="width:${v.criterios?.[k] ?? 0}%"></i></span><b class="num">${v.criterios?.[k] ?? 0}</b></li>`).join('')}</ul>
        <p class="ajuda">Confiança: ${esc(v.confidence_level)}. A nota conta o que dá para conferir; quem diz se funciona é a aba Resultados.</p></details>
      ${v.diagnostico || v.objetivo_comercial ? `<details class="of-mais"><summary>Diagnóstico e objetivo</summary>
        <p>${esc(v.diagnostico)}</p><p>${esc(v.objetivo_comercial)}</p>${v.prazo ? `<p>Prazo: ${esc(v.prazo)}</p>` : ''}${v.condicoes_pagamento ? `<p>Pagamento: ${esc(v.condicoes_pagamento)}</p>` : ''}</details>` : ''}`;
  }

  function edicao(o, i, v) {
    const campo = (nome, rotulo, valor, linhas = 3) => `<label class="campo"><span>${rotulo}</span><textarea data-campo="${nome}" rows="${linhas}">${esc(valor)}</textarea></label>`;
    const pacotes = painel.catalogo.produtos[o.product_type].pacotes;
    return `<div class="of-edicao">
      <label class="campo"><span>Pacote recomendado</span><select data-campo="recommended_package">${pacotes.map((p) => `<option value="${esc(p.chave)}" ${p.chave === v.recommended_package ? 'selected' : ''}>${esc(p.nome)} (${reais(p.mensal)})</option>`).join('')}</select></label>
      ${campo('suggested_opening_message', 'Mensagem de abertura', v.suggested_opening_message, 4)}
      ${campo('value_proposition', 'Proposta de valor', v.value_proposition)}
      ${campo('price_presentation', 'Como apresentar o preço', v.price_presentation)}
      ${campo('suggested_next_step', 'Próximo passo', v.suggested_next_step, 2)}
      <p class="ajuda">Ao salvar, a versão é conferida e ganha nota de novo, e volta a precisar da sua aprovação.</p>
      <div class="acoes"><button class="bt bt-primario bt-pequeno" data-acao="salvar-edicao" data-versao="${i}">Salvar edição</button>
        <button class="bt bt-texto bt-pequeno" data-acao="cancelar-edicao">Cancelar</button></div></div>`;
  }

  function comparacao(o) {
    const linha = (rotulo, f) => `<tr><th scope="row">${rotulo}</th>${o.versoes.map((v) => `<td>${f(v)}</td>`).join('')}</tr>`;
    return `<div class="of-compara"><table class="tabela-funil">
      <thead><tr><th></th>${o.versoes.map((v, k) => `<th>Versão ${esc(v.rotulo || k + 1)}</th>`).join('')}</tr></thead>
      <tbody>
        ${linha('Ângulo', (v) => esc(painel.angulos[v.angulo] || v.angulo))}
        ${linha('Nota', (v) => `<b>${v.score}</b>`)}
        ${Object.entries(painel.criterios).map(([k, nome]) => linha(esc(nome), (v) => v.criterios?.[k] ?? 0)).join('')}
        ${linha('Pacote', (v) => esc(pacoteDe(o.product_type, v.recommended_package)?.nome || v.recommended_package))}
        ${linha('Abertura', (v) => `<small>${esc(v.suggested_opening_message)}</small>`)}
        ${linha('Problemas', (v) => (v.problemas.length ? `<span class="ruim">${v.problemas.map(esc).join('; ')}</span>` : 'nenhum'))}
      </tbody></table></div>`;
  }

  function resultado(r) {
    const partes = [r.contato ? 'contatado' : 'ainda sem contato', r.resposta ? 'respondeu' : '', r.conversao ? `fechou (${reais(r.valor_contratado)} por mês)` : '',
      r.perda ? `perdido: ${r.perda}` : '', r.objecoes?.length ? `objeções: ${r.objecoes.map((x) => OBJ[x] || x).join(', ')}` : ''].filter(Boolean);
    return `<p class="of-resultado">${partes.map(esc).join(' · ')}${r.primeira_resposta ? `<br><small>Primeira resposta: "${esc(r.primeira_resposta)}"</small>` : ''}</p>`;
  }

  function acoes(o, i, v) {
    const b = (acao, texto, classe = 'bt-contorno', extra = '') => `<button class="bt ${classe} bt-pequeno" data-acao="${acao}" ${extra}>${texto}</button>`;
    const lista = [];
    if (['rascunho', 'revisao'].includes(o.estado)) {
      lista.push(b('aprovar', `Aprovar a versão ${esc(v.rotulo || i + 1)}`, 'bt-primario', v.problemas.length ? 'disabled title="Edite os problemas antes de aprovar"' : ''));
      lista.push(b('editar', 'Editar'), b('rejeitar', 'Rejeitar', 'bt-texto bt-perigo'));
    }
    if (o.estado === 'aprovada') lista.push(b('enviar', 'Enviar ao vendedor', 'bt-primario'), b('rejeitar', 'Rejeitar', 'bt-texto bt-perigo'));
    if (o.estado !== 'gerando') lista.push(b('regerar', 'Gerar de novo', 'bt-texto'));
    return `<footer class="of-acoes">${lista.join('')}</footer>`;
  }

  /* ── catálogo ──────────────────────────────────────────────── */
  function desenhaCatalogo() {
    const c = painel.catalogo;
    const prob = painel.problemas_do_catalogo;
    $('#of-ligado').checked = c.ligado !== false;
    $('#of-aprovacao').value = c.aprovacao;
    $('#of-limite').value = c.limite_revisao;
    $('#of-versoes').value = String(c.versoes);
    $('#of-taxas').value = c.taxas || '';
    $('#of-garantia').value = c.garantia || '';
    poe('#of-pesos', Object.entries(painel.criterios).map(([k, nome]) => `<label class="campo"><span>${esc(nome)}</span>
      <input type="number" min="0" max="100" inputmode="numeric" data-peso="${k}" value="${c.pesos[k]}"></label>`).join(''));
    const num = (v) => (v === null || v === undefined ? ''
      : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(Number(v)) ? 0 : 2, maximumFractionDigits: 2, useGrouping: false }));
    poe('#of-pacotes', Object.entries(c.produtos).map(([tipo, produto]) => `<h3 class="subtitulo">${esc(produto.nome)}</h3>
      ${produto.pacotes.map((p) => {
        const problemas = prob.pacotes[p.chave]?.problemas || [];
        const margem = p.custo !== null && p.mensal !== null ? p.mensal - p.custo : null;
        return `<fieldset class="of-pacote" data-tipo="${tipo}" data-chave="${esc(p.chave)}">
          <legend><span>${esc(p.nome)}</span> ${p.aprovado ? '<span class="pilula pilula-bom">aprovado</span>' : '<span class="pilula pilula-espera">não aprovado</span>'}</legend>
          <div class="campos tres">
            <label class="campo"><span>Nome</span><input data-p="nome" value="${esc(p.nome)}"></label>
            <label class="campo"><span>Mensalidade</span><input data-p="mensal" inputmode="decimal" placeholder="sem preço" value="${num(p.mensal)}"></label>
            <label class="campo"><span>Implantação (uma vez)</span><input data-p="implantacao" inputmode="decimal" placeholder="sem custo" value="${num(p.implantacao)}"></label>
            <label class="campo"><span>Preço mínimo</span><input data-p="minimo" inputmode="decimal" value="${num(p.minimo)}">
              <small>Nenhuma oferta, nem com desconto, fica abaixo.</small></label>
            <label class="campo"><span>Seu custo por mês</span><input data-p="custo" inputmode="decimal" placeholder="opcional" value="${num(p.custo)}">
              <small>${margem === null ? 'Com o custo, a margem aparece aqui.' : `Margem: ${reais(margem)} por mês.`}</small></label>
            <label class="campo"><span>Prazo</span><input data-p="prazo" value="${esc(p.prazo || '')}" placeholder="até 5 dias úteis"></label>
          </div>
          <label class="campo"><span>Funcionalidades (uma por linha)</span><textarea data-p="recursos" rows="4">${esc(p.recursos.join('\n'))}</textarea>
            <small>O agente só pode prometer o que estiver aqui.</small></label>
          ${problemas.length ? `<p class="ruim-texto">${problemas.map(esc).join(' · ')}</p>` : ''}
          <div class="acoes">${p.aprovado
            ? `<button class="bt bt-texto bt-pequeno" data-aprovar="${esc(p.chave)}" data-sim="0">Retirar a aprovação</button>`
            : `<button class="bt bt-contorno bt-pequeno" data-aprovar="${esc(p.chave)}" data-sim="1" ${problemas.length ? 'disabled' : ''}>Aprovar preço e funcionalidades</button>`}</div>
        </fieldset>`;
      }).join('')}`).join(''));
    poe('#of-bonus', c.bonus.map((b) => `<div class="of-bonus" data-bonus="${esc(b.chave)}">
      <label class="troca"><input type="checkbox" data-b="autorizado" ${b.autorizado ? 'checked' : ''}>
        <span><b>${esc(b.texto)}</b>${(prob.bonus[b.chave] || []).length ? `<small class="ruim-texto">${prob.bonus[b.chave].map(esc).join(' · ')}</small>` : ''}</span></label>
      <div class="campos tres">
        <label class="campo"><span>Como o agente chama</span><input data-b="texto" value="${esc(b.texto)}"></label>
        ${Object.entries(BONUS_EXTRA).filter(([k]) => k in b).map(([k, [rot, un]]) => `<label class="campo"><span>${rot}</span>
          <span class="com-unidade"><input data-b="${k}" type="number" min="0" inputmode="numeric" value="${b[k]}"><span>${un}</span></span></label>`).join('')}
      </div></div>`).join(''));
  }

  function catalogoDaTela() {
    const c = structuredClone(painel.catalogo);
    c.ligado = $('#of-ligado').checked;
    c.aprovacao = $('#of-aprovacao').value;
    c.limite_revisao = Number($('#of-limite').value) || 75;
    c.versoes = Number($('#of-versoes').value) || 2;
    c.taxas = $('#of-taxas').value.trim();
    c.garantia = $('#of-garantia').value.trim();
    $$('[data-peso]').forEach((i) => { c.pesos[i.dataset.peso] = Number(i.value) || 0; });
    $$('.of-pacote').forEach((f) => {
      const p = c.produtos[f.dataset.tipo].pacotes.find((x) => x.chave === f.dataset.chave);
      const v = (k) => $(`[data-p="${k}"]`, f).value;
      Object.assign(p, { nome: v('nome').trim() || p.nome, mensal: numero(v('mensal')), implantacao: numero(v('implantacao')), minimo: numero(v('minimo')),
        custo: numero(v('custo')), prazo: v('prazo').trim(), recursos: v('recursos').split('\n').map((r) => r.trim()).filter(Boolean) });
    });
    $$('.of-bonus').forEach((d) => {
      const b = c.bonus.find((x) => x.chave === d.dataset.bonus);
      b.autorizado = $('[data-b="autorizado"]', d).checked;
      b.texto = $('[data-b="texto"]', d).value.trim() || b.texto;
      for (const k of Object.keys(BONUS_EXTRA)) { const i = $(`[data-b="${k}"]`, d); if (i) b[k] = Number(i.value) || 0; }
    });
    return c;
  }

  async function salvaCatalogo() {
    const r = await pede('/api/ofertas/catalogo', { catalogo: catalogoDaTela() });
    painel.catalogo = r.catalogo;
    painel.problemas_do_catalogo = r.problemas;
    desenhaCatalogo();
    desenhaContas();
  }

  /* ── resultados ────────────────────────────────────────────── */
  function desenhaResultados() {
    const r = painel.relatorio;
    poe('#of-res-aviso', esc(r.aviso));
    poe('#of-comparacao', r.total ? esc(r.comparacao.texto) : 'Ainda nenhuma oferta aprovada chegou a um cliente.');
    const tabela = (titulo, grupos) => `<table class="tabela-funil"><caption>${titulo}</caption>
      <thead><tr><th scope="col">Oferta</th><th scope="col">Contatos</th><th scope="col">Responderam</th><th scope="col">Fecharam</th><th scope="col">Fechamento</th><th scope="col">Por mês</th></tr></thead>
      <tbody>${grupos.map((g) => `<tr><th scope="row">${esc(g.nome)}${Object.keys(g.objecoes).length ? `<br><small>objeções: ${Object.entries(g.objecoes).map(([k, n]) => `${OBJ[k] || k} ${n}`).join(', ')}</small>` : ''}</th>
        <td>${g.contatos}</td><td>${g.respostas}</td><td>${g.conversoes}</td><td>${g.contatos ? Math.round(g.conversoes / g.contatos * 100) : 0}%</td><td>${reais(g.valor)}</td></tr>`).join('')
        || '<tr><td colspan="6"><small>Nada ainda.</small></td></tr>'}</tbody></table>`;
    poe('#of-tabelas', tabela('Por ângulo da oferta', r.por_angulo) + tabela('Por pacote recomendado', r.por_pacote));
    const sug = painel.sugestoes.filter((s) => s.estado === 'pendente');
    poe('#of-sugestoes', sug.length ? sug.map((s) => `<div class="of-sugestao"><p>${esc(s.texto)}</p>
      <div class="acoes"><button class="bt bt-contorno bt-pequeno" data-sugestao="${esc(s.id)}" data-estado="aceita">Vou aplicar</button>
      <button class="bt bt-texto bt-pequeno" data-sugestao="${esc(s.id)}" data-estado="descartada">Descartar</button></div></div>`).join('')
      : '<p class="vazio">Nenhuma sugestão agora. Elas aparecem quando houver contatos suficientes para dizer alguma coisa.</p>');
  }

  /* ── cliques ───────────────────────────────────────────────── */
  async function age(botao, trabalho) {
    await ocupado(botao, async () => { await trabalho(); await carrega(); desenhaTudo(); });
  }

  $('#tela-ofertas').addEventListener('click', (ev) => {
    const filtroB = ev.target.closest('[data-filtro]');
    if (filtroB) { filtro = filtroB.dataset.filtro; desenhaPropostas(); return; }
    const cartaoEl = ev.target.closest('[data-oferta]');
    const id = cartaoEl?.dataset.oferta;
    const versaoB = ev.target.closest('[data-versao]:not([data-acao])');
    if (versaoB && id) { versaoVista[id] = Number(versaoB.dataset.versao); desenhaPropostas(); return; }
    const aprovarP = ev.target.closest('[data-aprovar]');
    if (aprovarP) {
      age(aprovarP, async () => { await salvaCatalogo(); await pede('/api/ofertas/pacote', { chave: aprovarP.dataset.aprovar, aprovado: aprovarP.dataset.sim === '1' }); });
      return;
    }
    const sugB = ev.target.closest('[data-sugestao]');
    if (sugB) { age(sugB, () => pede('/api/ofertas/sugestao', { id: sugB.dataset.sugestao, estado: sugB.dataset.estado })); return; }
    const acao = ev.target.closest('[data-acao]');
    if (!acao || !id) return;
    const o = painel.ofertas.find((x) => x.id === id);
    const i = versaoVista[id] ?? o.escolhida;
    switch (acao.dataset.acao) {
      case 'comparar': if (comparando.has(id)) comparando.delete(id); else comparando.add(id); desenhaPropostas(); break;
      case 'editar': editando.add(id); desenhaPropostas(); break;
      case 'cancelar-edicao': editando.delete(id); desenhaPropostas(); break;
      case 'salvar-edicao': {
        const campos = Object.fromEntries($$('[data-campo]', cartaoEl).map((c) => [c.dataset.campo, c.value]));
        age(acao, async () => { await pede('/api/ofertas/editar', { id, versao: Number(acao.dataset.versao), campos }); editando.delete(id); });
        break;
      }
      case 'aprovar': age(acao, async () => { await pede('/api/ofertas/aprovar', { id, versao: i }); recado('Oferta aprovada. Agora é só enviar ao vendedor.', 'bom'); }); break;
      case 'rejeitar': {
        const motivo = prompt('Por que rejeitar? (opcional, ajuda a melhorar as próximas)') ?? null;
        if (motivo === null) return;
        age(acao, () => pede('/api/ofertas/rejeitar', { id, motivo }));
        break;
      }
      case 'enviar': age(acao, async () => { const r = await pede('/api/ofertas/enviar', { id }); recado(r.aviso || 'Enviada ao vendedor: o primeiro contato entrou na fila.', 'bom'); }); break;
      case 'regerar': age(acao, async () => { const r = await pede('/api/ofertas/gerar', { leadId: o.lead_id, produto: o.product_type }); recado(r.recado, 'bom'); }); break;
      default:
    }
  });
  $('#of-gerar').addEventListener('click', (ev) => age(ev.currentTarget, async () => {
    const leadId = $('#of-lead').value;
    if (!leadId) throw new Error('Escolha um cliente.');
    const r = await pede('/api/ofertas/gerar', { leadId, produto: $('#of-produto').value });
    filtro = 'pendentes';
    recado(r.recado, 'bom');
  }));
  $('#of-esperando').addEventListener('click', (ev) => age(ev.currentTarget, async () => {
    const r = await pede('/api/ofertas/esperando', {});
    recado(r.postas ? `${r.postas} oferta(s) na caixa do Offer Architect.` : 'Todo mundo que espera o primeiro contato já tem oferta.', 'bom');
  }));
  $('#of-salvar').addEventListener('click', (ev) => ocupado(ev.currentTarget, async () => { await salvaCatalogo(); recado('Pacotes e regras salvos.', 'bom'); }));

  let subAtual = 'propostas';
  function desenhaTudo() {
    if (subAtual === 'propostas') desenhaPropostas();
    if (subAtual === 'catalogo') desenhaCatalogo();
    if (subAtual === 'resultados') desenhaResultados();
  }

  return {
    async abre(sub) {
      subAtual = ['propostas', 'catalogo', 'resultados'].includes(sub) ? sub : 'propostas';
      $$('#tela-ofertas .ofsub').forEach((s) => { s.hidden = s.dataset.ofsub !== subAtual; });
      $$('#tela-ofertas [data-ofsub].aba-linha').forEach((a) => {
        if (a.dataset.ofsub === subAtual) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      await carrega();
      desenhaTudo();
    },
    // Enquanto a aba está aberta, as propostas que o agente termina aparecem sozinhas (sem atrapalhar uma edição).
    async atualiza() {
      if (subAtual !== 'propostas' || editando.size || document.activeElement?.closest?.('#tela-ofertas textarea, #tela-ofertas input, #tela-ofertas select')) return;
      await carrega();
      desenhaPropostas();
    },
    contas: () => carrega().catch(() => {}),
    /** O filtro das propostas (o Jarvis usa: "mostra as ofertas enviadas"). */
    async filtra(f) {
      if (!FILTROS.some(([k]) => k === f)) throw new Error(`não existe o filtro "${f}"`);
      filtro = f;
      if (subAtual !== 'propostas') await this.abre('propostas');
      desenhaPropostas();
      return painel.ofertas.filter(FILTROS.find(([k]) => k === f)[2]).length;
    },
    filtro: () => filtro,
  };
}
