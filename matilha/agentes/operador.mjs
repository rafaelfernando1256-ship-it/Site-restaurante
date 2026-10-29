/**
 * O OPERADOR — as ações de verdade do Jarvis sobre a Matilha, registradas
 * no Action Registry (agentes/acoes.mjs).
 *
 * Os agentes são os mesmos de sempre, falando pelo mesmo mural (o Simple
 * Agent Bus). Os nomes da especificação apontam para eles:
 *
 *   Prospecção ............ o caçador (setor "cacador")
 *   Offer Architect ....... setor "ofertas"
 *   Vendedor .............. setor "vendedor"
 *   Produção .............. estúdio + publicador (+ domínio)
 *   Brand Strategist ...... o briefing de marca do estúdio (direção de arte por ramo)
 *   Revenue Guardian ...... o cobrador da mensalidade (tela Financeiro)
 *   Operations Commander .. a operação: meta do dia, soltar e recolher a matilha
 *
 * As ações de tela (abrir página, fechar ficha, filtrar, clicar num botão)
 * vão pela ponte (agentes/ui-ponte.mjs) e só contam como feitas quando o
 * painel devolve o estado novo.
 */
import { ehDeComida, listaDeNichos, numerosDe } from '../oferta.mjs';
import { situacaoDaMensalidade, valorDaMensalidade } from './cobranca.mjs';
import { ramoDe } from './roteiro.mjs';
import { direcaoDe } from './direcoes.mjs';
import { texto } from './comum.mjs';
import { SETORES_PAUSAVEIS } from '../fluxo.mjs';

export const TELAS = {
  hoje: 'o painel principal (Restaurant Sales)', comecar: 'Começar', jarvis: 'o Jarvis', escritorio: 'o Escritório',
  cacada: 'a Caçada (prospecção e operação)', whatsapp: 'o WhatsApp', clientes: 'os Clientes (projetos)', ofertas: 'as Ofertas',
  rede: 'a Rede de agentes', financeiro: 'o Financeiro (Revenue Guardian)', ajustes: 'os Ajustes', valor: 'o Value Intelligence',
};
export const AGENTES = {
  cacador: 'a prospecção (caçador)', ofertas: 'o Offer Architect', vendedor: 'o vendedor', estudio: 'o estúdio',
  publicador: 'o publicador', dominio: 'o agente do domínio', producao: 'a produção (estúdio e publicador)',
  cobrador: 'o Revenue Guardian (cobrador)', operacao: 'o Operations Commander (a operação)', brand_strategist: 'o Brand Strategist',
  valor: 'o Value Intelligence', todos: 'todos os agentes',
};
const FILTROS = {
  clientes: ['ativos', 'producao', 'finalizados', 'arquivados', 'todos', 'novo', 'aguardando_voce', 'abordado', 'conversando',
    'fazendo_demo', 'demo_no_ar', 'fechado', 'com_voce', 'entregue', 'perdido'],
  rede: ['todos', 'erros', 'pendentes', 'jarvis'],
  financeiro: ['todos', 'pendentes', 'em_dia'],
  ofertas: ['pendentes', 'enviadas', 'outras', 'todas'],
};
const PRODUCAO = ['fazendo_demo', 'demo_no_ar', 'fechado', 'com_voce'];
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const REFERENTE = /^(este|esse|esta|essa|isto|isso|ele|ela|aqui|atual|aberto|o aberto|deste|desse|dele|dela|neste|nesse)( (projeto|restaurante|cliente|negocio|pizzaria|lanchonete|hamburgueria|loja))?$/;
const lista = (xs, n = 6) => (xs.length > n ? `${xs.slice(0, n).join(', ')} e mais ${xs.length - n}` : xs.join(', '));
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/** A situação de um projeto de cliente, em uma palavra. */
export function situacaoDoProjeto(l) {
  if (l.arquivado_em) return 'arquivado';
  if (l.projeto_encerrado) return l.projeto_encerrado.estado;
  if (l.estagio === 'entregue') return 'finalizado';
  if (PRODUCAO.includes(l.estagio)) return 'producao';
  return 'ativo';
}

export function montaOperador({ registro, ponte, fluxo, dados, trabalhos, ajustes = () => ({}), chefe, zap = () => ({}), claude = () => ({}), abrePasta = null }) {
  const leads = () => dados.tudo().leads || [];
  const memoria = { ultimoProjeto: null };
  // A página do Jarvis sozinha (jarvis.html) também obedece: fechar o que está na tela dela e a camada visual.
  const DO_JARVIS = ['panel.close', 'jarvis.projeto', 'ui.inspect', 'ui.click', 'ui.fill', 'ui.select', 'ui.scroll', 'ui.wait'];
  const tela = async (acao, parametros, ctx) => {
    const quem = ponte.escolhe(ctx.cliente, null);
    const tipo = DO_JARVIS.includes(acao) && quem?.tipo === 'jarvis' && (quem.id === ctx.cliente || !ponte.escolhe(null, 'painel')) ? 'jarvis' : 'painel';
    const r = await ponte.envia(acao, parametros, { cliente: ctx.cliente, correlacao: ctx.correlacao, tipo });
    if (!r.ok) {
      if (r.precisa_confirmar) { const e = new Error(r.erro || 'precisa do seu sim'); e.precisaConfirmar = r.precisa_confirmar; throw e; }
      throw new Error(r.erro || `a tela não conseguiu ${acao}`);
    }
    return r;
  };
  const uiDe = (ctx) => ctx.ui || ponte.estadoAtual(ctx.cliente) || {};

  /** Acha o projeto pelo nome ("Pizzaria Bella") ou pelo que está aberto na tela ("este projeto"). */
  function resolveProjeto(nome, ctx = {}, { tipo = 'todos' } = {}) {
    const ui = uiDe(ctx);
    const n = norm(nome).replace(/^(o |a |do |da |de |no |na )?(projeto|cliente|restaurante|negocio) (do |da |de |dos |das )?/, '').trim();
    if (!n || REFERENTE.test(n)) {
      if (ui.ficha?.id && tipo !== 'jarvis') { const l = leads().find((x) => x.id === ui.ficha.id); if (l) return (memoria.ultimoProjeto = { tipo: 'cliente', id: l.id, nome: l.nome }); }
      if (ui.palco?.tipo === 'projeto' && ui.palco.id && tipo !== 'clientes') {
        const t = trabalhos.acha(ui.palco.id);
        if (t) return (memoria.ultimoProjeto = { tipo: 'jarvis', id: t.id, nome: t.nome });
      }
      if (memoria.ultimoProjeto && Date.now() - (memoria.ultimoProjeto.quando || Date.now()) < 30 * 60_000) return memoria.ultimoProjeto;
      return { erro: 'qual projeto? Não há nenhum aberto na tela; diga o nome' };
    }
    const cands = [];
    const pesa = (nomeDele) => {
      const m = norm(nomeDele);
      if (!m) return 0;
      if (m === n) return 3;
      if (m.startsWith(n) || n.startsWith(m)) return 2;
      if (m.includes(n) || n.includes(m)) return 1;
      return n.split(' ').filter((w) => w.length > 3).every((w) => m.includes(w)) ? 1 : 0;
    };
    if (tipo !== 'jarvis') for (const l of leads()) { const p = pesa(l.nome); if (p) cands.push({ tipo: 'cliente', id: l.id, nome: l.nome, p }); }
    if (tipo !== 'clientes') for (const t of trabalhos.lista || []) { const p = pesa(t.nome); if (p) cands.push({ tipo: 'jarvis', id: t.id, nome: t.nome, p }); }
    if (!cands.length) return { erro: `não achei nenhum projeto chamado "${texto(nome, 60)}"` };
    const melhor = Math.max(...cands.map((c) => c.p));
    const top = cands.filter((c) => c.p === melhor);
    if (top.length > 1 && new Set(top.map((c) => norm(c.nome))).size > 1) {
      return { pergunta: `Achei mais de um: ${lista(top.map((c) => c.nome))}. Qual deles?` };
    }
    const r = { tipo: top[0].tipo, id: top[0].id, nome: top[0].nome, quando: Date.now() };
    memoria.ultimoProjeto = r;
    return r;
  }
  const precisaProjeto = (v, ctx, opcoes) => {
    const p = resolveProjeto(v.projeto, ctx, opcoes);
    if (p.erro) throw new Error(p.erro);
    // Mais de um com esse nome: não escolhe sozinho, pergunta (a execução para e espera a resposta).
    if (p.pergunta) { const e = new Error(p.pergunta); e.pergunta = p.pergunta; throw e; }
    return p;
  };

  /* ══ TELA (a interface do próprio aplicativo) ═══════════════════ */
  registro.registra({
    nome: 'navigation.open', agente: 'tela',
    descricao: 'Abre uma página do painel: hoje (painel principal, Restaurant Sales), clientes (projetos), ofertas, rede (Rede de agentes / Agent Network), financeiro (Revenue Guardian, mensalidades), cacada (prospecção, Operations Commander), whatsapp, escritorio, ajustes, comecar, jarvis.',
    parametros: { tela: { tipo: 'string', obrigatorio: true, enum: Object.keys(TELAS) }, sub: { tipo: 'string', descricao: 'sub-aba (ex.: ajustes: negocio, horarios, chaves; ofertas: propostas, catalogo, resultados)' } },
    executa: async (v, ctx) => {
      const r = await tela('navigation.open', v, ctx);
      if (r.estado?.tela !== v.tela) throw new Error(`pedi ${TELAS[v.tela]}, mas a tela ficou em "${r.estado?.tela || '?'}"`);
      return { mensagem: `Abri ${TELAS[v.tela]}.`, evidencia: r.evidencia, mudou: r.mudou };
    },
  });
  registro.registra({
    nome: 'navigation.back', agente: 'tela',
    descricao: 'Volta para a página anterior do painel.',
    executa: async (v, ctx) => {
      const r = await tela('navigation.back', {}, ctx);
      return { mensagem: `Voltei para ${TELAS[r.estado?.tela] || 'a página anterior'}.`, evidencia: r.evidencia };
    },
  });
  const fechaPainel = async (v, ctx) => {
    const r = await tela('panel.close', { qual: v.qual || 'auto' }, ctx);
    return { mensagem: `Fechei ${r.fechou || 'a janela'}.`, evidencia: r.evidencia };
  };
  const PARAM_QUAL = { qual: { tipo: 'string', enum: ['auto', 'ficha', 'palco', 'gaveta', 'dialogo', 'janelas'], padrao: 'auto', descricao: 'auto: a janela de cima (a ficha, o projeto na tela, uma gaveta)' } };
  registro.registra({
    nome: 'panel.close', agente: 'tela',
    descricao: 'Fecha a janela, o painel de detalhes (a ficha do cliente), o projeto mostrado na tela ou a gaveta aberta. Não muda nada no projeto.',
    parametros: PARAM_QUAL, executa: fechaPainel,
  });
  registro.registra({ nome: 'modal.close', agente: 'tela', descricao: 'O mesmo que panel.close: fecha a janela (modal) que está aberta.', parametros: PARAM_QUAL, executa: fechaPainel });
  registro.registra({
    nome: 'dashboard.filter', agente: 'tela',
    descricao: `Abre a página e aplica um filtro. clientes: ${FILTROS.clientes.join(', ')}; rede: ${FILTROS.rede.join(', ')}; financeiro: ${FILTROS.financeiro.join(', ')}; ofertas: ${FILTROS.ofertas.join(', ')}.`,
    parametros: { tela: { tipo: 'string', obrigatorio: true, enum: Object.keys(FILTROS) }, filtro: { tipo: 'string', obrigatorio: true } },
    valida: (v) => (FILTROS[v.tela].includes(v.filtro) ? null : `o filtro "${v.filtro}" não existe em ${v.tela} (existem: ${FILTROS[v.tela].join(', ')})`),
    executa: async (v, ctx) => {
      const r = await tela('dashboard.filter', v, ctx);
      if (r.estado?.filtros?.[v.tela] !== v.filtro) throw new Error('o filtro não ficou aplicado na tela');
      return { mensagem: `Filtrei ${TELAS[v.tela]} por "${v.filtro.replace(/_/g, ' ')}"${Number.isInteger(r.quantos) ? `: ${r.quantos} na lista` : ''}.`, evidencia: r.evidencia };
    },
  });

  // A camada visual: para o que não tem ação própria. Acha o elemento pelo nome (rótulo, texto, aria-label), nunca por coordenada.
  const confereSensivel = async (v, ctx) => {
    try {
      const r = await tela('ui.inspect', v, ctx);
      return r.sensivel ? `clicar em "${r.rotulo}" (${r.motivo})` : null;
    } catch { return null; }
  };
  registro.registra({
    nome: 'ui.click', agente: 'tela',
    descricao: 'Clica num botão, aba ou link do painel pelo nome que aparece na tela (ou aria-label). Botão que manda mensagem, publica, cobra, aprova, apaga ou libera pede o seu sim.',
    parametros: { alvo: { tipo: 'string', obrigatorio: true }, papel: { tipo: 'string', enum: ['botao', 'link', 'aba', 'qualquer'], padrao: 'qualquer' } },
    permissao: confereSensivel,
    executa: async (v, ctx) => {
      const r = await tela('ui.click', { ...v, confirmado: ctx.confirmados?.has(ctx.passo) }, ctx);
      return { mensagem: `Cliquei em "${r.rotulo || v.alvo}".`, evidencia: r.evidencia };
    },
  });
  registro.registra({
    nome: 'ui.fill', agente: 'tela',
    descricao: 'Preenche um campo do painel pelo rótulo. Não escreve em senha nem em chave.',
    parametros: { campo: { tipo: 'string', obrigatorio: true }, valor: { tipo: 'string', obrigatorio: true, max: 2000 } },
    executa: async (v, ctx) => {
      const r = await tela('ui.fill', v, ctx);
      return { mensagem: `Preenchi "${r.rotulo || v.campo}".`, evidencia: r.evidencia };
    },
  });
  registro.registra({
    nome: 'ui.select', agente: 'tela',
    descricao: 'Escolhe uma opção numa lista (select) do painel, pelo rótulo do campo e o texto da opção.',
    parametros: { campo: { tipo: 'string', obrigatorio: true }, opcao: { tipo: 'string', obrigatorio: true } },
    executa: async (v, ctx) => {
      const r = await tela('ui.select', v, ctx);
      return { mensagem: `Escolhi "${r.opcao || v.opcao}" em "${r.rotulo || v.campo}".`, evidencia: r.evidencia };
    },
  });
  registro.registra({
    nome: 'ui.scroll', agente: 'tela',
    descricao: 'Rola a página até um elemento (pelo nome) ou para cima/baixo.',
    parametros: { alvo: { tipo: 'string' }, direcao: { tipo: 'string', enum: ['cima', 'baixo', 'topo', 'fim'], padrao: 'baixo' } },
    executa: async (v, ctx) => { const r = await tela('ui.scroll', v, ctx); return { mensagem: r.rotulo ? `Rolei até "${r.rotulo}".` : 'Rolei a página.', evidencia: r.evidencia }; },
  });
  registro.registra({
    nome: 'ui.wait', agente: 'tela',
    descricao: 'Espera um elemento aparecer (ou sumir) na tela, até alguns segundos.',
    parametros: { alvo: { tipo: 'string', obrigatorio: true }, estado: { tipo: 'string', enum: ['visivel', 'oculto'], padrao: 'visivel' }, segundos: { tipo: 'number', padrao: 5 } },
    executa: async (v, ctx) => { const r = await tela('ui.wait', v, ctx); return { mensagem: `"${r.rotulo || v.alvo}" está ${v.estado === 'oculto' ? 'fechado' : 'na tela'}.`, evidencia: r.evidencia }; },
  });

  /* ══ PROJETOS ════════════════════════════════════════════════ */
  const PARAM_PROJETO = { projeto: { tipo: 'string', descricao: 'o nome (ex.: "Pizzaria Bella"), ou vazio/"este" para o que está aberto na tela' } };
  registro.registra({
    nome: 'project.list', agente: 'tela',
    descricao: 'Lista os projetos: os dos clientes (o site de cada restaurante) e os do Jarvis (Claude Code). Filtros: ativos, producao, finalizados, arquivados, todos.',
    parametros: { filtro: { tipo: 'string', enum: ['ativos', 'producao', 'finalizados', 'arquivados', 'todos'], padrao: 'ativos' } },
    executa: async (v) => {
      const sit = (l) => situacaoDoProjeto(l);
      const cl = leads().filter((l) => (v.filtro === 'todos' ? true : v.filtro === 'arquivados' ? sit(l) === 'arquivado'
        : v.filtro === 'producao' ? sit(l) === 'producao' : v.filtro === 'finalizados' ? ['finalizado', 'concluido'].includes(sit(l))
          : !['arquivado', 'perdido'].includes(sit(l)) && l.estagio !== 'perdido' && !l.projeto_encerrado));
      const tr = (trabalhos.lista || []).filter((t) => (v.filtro === 'todos' ? true : v.filtro === 'arquivados' ? t.arquivado_em
        : v.filtro === 'producao' ? t.estado === 'rodando' && !t.arquivado_em : v.filtro === 'finalizados' ? (t.estado === 'pronto' || t.encerrado) && !t.arquivado_em
          : !t.arquivado_em && !t.encerrado));
      const nomes = [...cl.map((l) => l.nome), ...tr.map((t) => `${t.nome} (Jarvis)`)];
      const [um, varios] = { ativos: ['ativo', 'ativos'], producao: ['em produção', 'em produção'], finalizados: ['finalizado', 'finalizados'],
        arquivados: ['arquivado', 'arquivados'], todos: ['no total', 'no total'] }[v.filtro];
      return {
        mensagem: nomes.length ? `${plural(nomes.length, `projeto ${um}`, `projetos ${varios}`)}: ${lista(nomes)}.` : `Nenhum projeto ${um}.`,
        dados: { clientes: cl.map((l) => ({ id: l.id, nome: l.nome, estagio: l.estagio, situacao: sit(l) })), jarvis: tr.map((t) => ({ id: t.id, nome: t.nome, estado: t.estado })) },
      };
    },
  });
  registro.registra({
    nome: 'project.open', agente: 'tela',
    descricao: 'Abre um projeto: o de um cliente abre a ficha dele (os detalhes) em Clientes; o do Jarvis aparece na tela do Jarvis (ou abre a pasta).',
    parametros: PARAM_PROJETO,
    executa: async (v, ctx) => {
      const p = precisaProjeto(v, ctx);
      if (p.tipo === 'cliente') {
        const r = await tela('project.open', { id: p.id }, ctx);
        if (r.estado?.ficha?.id !== p.id) throw new Error('a ficha não abriu na tela');
        return { mensagem: `Abri o projeto ${p.nome}.`, evidencia: r.evidencia };
      }
      const t = trabalhos.acha(p.id);
      const ver = trabalhos.ver?.(t.id);
      if (ver) {
        const r = await tela('jarvis.projeto', { id: t.id, titulo: t.nome, url: ver }, ctx);
        if (r.estado?.palco?.id !== t.id) throw new Error('o projeto não apareceu na tela do Jarvis');
        return { mensagem: `Abri o projeto ${t.nome} na tela do Jarvis.`, evidencia: r.evidencia };
      }
      if (!abrePasta) throw new Error('esse projeto não tem página, e abrir pasta só funciona no notebook');
      const r = await abrePasta(t.pasta);
      return { mensagem: `O projeto ${t.nome} não tem página; abri a pasta dele. ${texto(r, 120)}` };
    },
  });
  registro.registra({
    nome: 'project.fechar', agente: 'tela',
    descricao: 'Para "fecha o projeto" quando não está claro o que é fechar: se o projeto está aberto na tela, fecha a janela dele; se não, pergunta se é para arquivar ou encerrar. Nunca apaga.',
    parametros: PARAM_PROJETO,
    executa: async (v, ctx) => {
      const ui = uiDe(ctx);
      const p = v.projeto && !REFERENTE.test(norm(v.projeto)) ? resolveProjeto(v.projeto, ctx) : null;
      if (p?.erro) throw new Error(p.erro);
      if (p?.pergunta) return { pergunta: p.pergunta };
      const fichaDele = ui.ficha?.id && (!p || (p.tipo === 'cliente' && p.id === ui.ficha.id));
      const palcoDele = ui.palco?.tipo === 'projeto' && (!p || (p.tipo === 'jarvis' && p.id === ui.palco.id));
      if (fichaDele || palcoDele) {
        const r = await tela('panel.close', { qual: fichaDele ? 'ficha' : 'palco' }, ctx);
        return { mensagem: `Fechei a janela do projeto${p ? ` ${p.nome}` : ui.ficha?.nome ? ` ${ui.ficha.nome}` : ''}. O projeto continua como estava.`, evidencia: r.evidencia };
      }
      const alvo = p || resolveProjeto('', ctx);
      if (alvo.erro) return { pergunta: 'Fechar qual projeto? Não há nenhum aberto na tela.' };
      return { pergunta: `O projeto ${alvo.nome} não está aberto na tela. Quer que eu arquive (sai da lista dos ativos, sem apagar nada) ou encerre (marca o trabalho como encerrado)?` };
    },
  });
  const arquiva = (sim) => async (v, ctx) => {
    const p = precisaProjeto(v, ctx);
    const r = p.tipo === 'cliente' ? await fluxo.arquivaProjeto(p.id, sim) : await trabalhos.arquiva(p.id, sim);
    // Confere no próprio dado, depois de gravar.
    const agora = p.tipo === 'cliente' ? Boolean(leads().find((l) => l.id === p.id)?.arquivado_em) : Boolean(trabalhos.acha(p.id)?.arquivado_em);
    if (agora !== sim) throw new Error('o projeto não mudou de situação');
    ponte.envia('dados.recarrega', {}, { cliente: ctx.cliente }).catch(() => {});
    if (!r.mudou) return { mensagem: `O projeto ${p.nome} já estava ${sim ? 'arquivado' : 'na lista dos ativos'}.`, mudou: false };
    return { mensagem: sim ? `Arquivei o projeto ${p.nome}: saiu da lista dos ativos, e nada foi apagado.` : `Desarquivei o projeto ${p.nome}: voltou para a lista dos ativos.` };
  };
  registro.registra({ nome: 'project.archive', agente: 'tela', descricao: 'Arquiva um projeto: sai da lista dos ativos, sem apagar dados. Volta com project.unarchive.', parametros: PARAM_PROJETO, executa: arquiva(true) });
  registro.registra({ nome: 'project.unarchive', agente: 'tela', descricao: 'Tira um projeto do arquivo (volta para os ativos).', parametros: PARAM_PROJETO, executa: arquiva(false) });

  const encerra = (cancelar) => ({
    parametros: { ...PARAM_PROJETO, motivo: { tipo: 'string', max: 200 } },
    permissao: (v, ctx) => {
      const p = resolveProjeto(v.projeto, ctx);
      if (p.erro || p.pergunta) return null; // a execução diz o erro
      if (p.tipo === 'jarvis') {
        const t = trabalhos.acha(p.id);
        return t?.estado === 'rodando' ? `${cancelar ? 'cancelar' : 'encerrar'} o projeto ${p.nome}, que ainda está rodando no Claude Code (o trabalho para; o que já foi feito fica na pasta)` : null;
      }
      const lead = leads().find((l) => l.id === p.id);
      if (!lead || lead.projeto_encerrado) return null;
      const pend = fluxo.pendenciasDoProjeto(lead);
      return pend.lista.length ? `${cancelar ? 'cancelar' : 'encerrar'} o projeto ${p.nome}: ${pend.lista.join('; ')}` : null;
    },
    executa: async (v, ctx) => {
      const p = precisaProjeto(v, ctx);
      if (p.tipo === 'jarvis') {
        const r = await trabalhos.encerra(p.id, { cancelar });
        if (!r.mudou) return { mensagem: `O projeto ${p.nome} já estava encerrado.`, mudou: false };
        return { mensagem: `${cancelar ? 'Cancelei' : 'Encerrei'} o projeto ${p.nome} (${r.projeto.encerrado.estado}). A pasta continua lá.` };
      }
      const r = await fluxo.encerraProjeto(p.id, { motivo: v.motivo, cancelar });
      const lead = leads().find((l) => l.id === p.id);
      if (!lead?.projeto_encerrado) throw new Error('o projeto não ficou encerrado');
      ponte.envia('dados.recarrega', {}, { cliente: ctx.cliente }).catch(() => {});
      if (!r.mudou) return { mensagem: `O projeto ${p.nome} já estava ${lead.projeto_encerrado.estado}.`, mudou: false };
      const est = lead.projeto_encerrado.estado;
      return {
        mensagem: `${est === 'concluido' ? 'Marquei como concluído' : cancelar ? 'Cancelei' : 'Encerrei'} o projeto ${p.nome}.`
          + `${r.canceladas.length ? ` ${plural(r.canceladas.length, 'tarefa da fila foi cancelada', 'tarefas da fila foram canceladas')}.` : ''}`
          + `${r.andando.length ? ` ${plural(r.andando.length, 'tarefa já estava sendo feita e termina', 'tarefas já estavam sendo feitas e terminam')}.` : ''}`
          + `${lead.aprovado_em && !lead.cancelado_em ? ' A mensalidade dele continua; cancelar a cobrança é outra decisão.' : ''} Nada foi apagado.`,
        dados: { projeto_encerrado: lead.projeto_encerrado, canceladas: r.canceladas },
      };
    },
  });
  registro.registra({ nome: 'project.close', agente: 'tela', descricao: 'ENCERRA um projeto (o trabalho acaba: entregue vira concluído; antes da entrega, os agentes param de trabalhar nele). Pede o seu sim quando há pendência. Não é para fechar janela (isso é panel.close). Nunca apaga.', ...encerra(false) });
  registro.registra({ nome: 'project.cancel', agente: 'tela', descricao: 'Cancela um projeto (encerra como cancelado). Pede o seu sim quando há pendência. Nunca apaga.', ...encerra(true) });

  /* ══ AGENTES (pelo mural, o Simple Agent Bus) ═════════════════ */
  const setoresDe = (agente) => (agente === 'producao' ? ['estudio', 'publicador'] : agente === 'todos' ? SETORES_PAUSAVEIS : [agente]);
  const PARAM_AGENTE = { agente: { tipo: 'string', obrigatorio: true, enum: Object.keys(AGENTES) } };

  function errosDosAgentes() {
    const e = fluxo.estado();
    const porSetor = {};
    const poe = (s, t) => { (porSetor[s] ||= []).push(t); };
    for (const t of e.mural?.travadas || []) poe(t.setor, `tarefa #${t.id} (${t.tipo}${t.nome ? ` · ${t.nome}` : ''}) desistiu: ${t.erro}`);
    // Esperar o Value Intelligence responder não é erro: é a fila andando.
    for (const t of e.mural?.adiadas || []) if (!/^esperando o Value Intelligence/.test(t.aviso)) poe(t.setor, `tarefa #${t.id} adiada: ${t.aviso}`);
    const falhasDeValor = (fluxo.valor?.mem?.eventos || []).filter((x) => x.tipo === 'value.analysis.failed' && Date.now() - x.quando < 3600_000);
    if (falhasDeValor.length) poe('valor', `${plural(falhasDeValor.length, 'análise falhou', 'análises falharam')} na última hora (a última: ${falhasDeValor.at(-1).erro})`);
    const z = zap() || {};
    if (z.situacao && !['conectado', 'pronto'].includes(z.situacao) && (e.ligado || (e.mural?.setores?.vendedor?.esperando || 0))) poe('vendedor', `o WhatsApp está ${z.situacao}`);
    const c = claude() || {};
    if (c.pausadoAte && c.pausadoAte > Date.now()) poe('vendedor', `o limite do plano do Claude acabou (volta às ${new Date(c.pausadoAte).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`);
    // Comando seu que não deu certo (não havia janela para fechar) não é erro de agente; a ponte com a tela parada é.
    const ponteParada = registro.ultimas(10).find((x) => x.estado === 'falhou' && Date.now() - x.inicio < 3600_000 && /não confirmou|nenhum painel/.test(x.erro || ''));
    if (ponteParada) poe('jarvis', `a tela não respondeu a um comando (${ponteParada.erro})`);
    return porSetor;
  }
  const nomeDoSetor = (s) => ({ ...AGENTES, jarvis: 'o Jarvis' }[s] || s);

  registro.registra({
    nome: 'agent.status', agente: 'jarvis',
    descricao: 'O estado real dos agentes: ligado, pausado, o que está fazendo, quantas tarefas na caixa, travadas.',
    parametros: { agente: { tipo: 'string', enum: Object.keys(AGENTES) } },
    executa: async (v) => {
      const e = fluxo.estado();
      const ts = (e.trabalhadores || []).filter((t) => !v.agente || v.agente === 'todos' || setoresDe(v.agente).includes(t.setor));
      const caixa = e.mural?.setores || {};
      const linhas = ts.map((t) => `${nomeDoSetor(t.setor)}: ${t.pausado ? 'pausado' : !e.ligado ? 'parado (matilha recolhida)' : t.fazendo ? `fazendo ${t.fazendo}` : 'esperando tarefa'}, ${caixa[t.setor]?.esperando || 0} na caixa${caixa[t.setor]?.travada ? `, ${caixa[t.setor].travada} travada(s)` : ''}`);
      if (!v.agente || ['cobrador', 'todos'].includes(v.agente)) linhas.push(`o Revenue Guardian (cobrador): ${ajustes().cobrador === false ? 'pausado' : 'ligado'}`);
      if (!v.agente || ['operacao', 'todos'].includes(v.agente)) linhas.push(`a operação: ${e.operacao?.ligada ? 'solta' : 'recolhida'}`);
      return { mensagem: `${linhas.join('; ')}.`, dados: { ligado: e.ligado, trabalhadores: ts, caixa, operacao: e.operacao?.ligada || false } };
    },
  });
  registro.registra({
    nome: 'agent.errors', agente: 'jarvis',
    descricao: 'Quais agentes estão com erro agora (tarefas que desistiram, adiadas, WhatsApp desconectado, limite do Claude, comandos do Jarvis que falharam).',
    executa: async () => {
      const porSetor = errosDosAgentes();
      const nomes = Object.keys(porSetor);
      if (!nomes.length) return { mensagem: 'Nenhum agente com erro agora.', dados: {} };
      return { mensagem: `Com erro: ${nomes.map((s) => `${nomeDoSetor(s)}: ${porSetor[s][0]}${porSetor[s].length > 1 ? ` (e mais ${plural(porSetor[s].length - 1, 'problema', 'problemas')})` : ''}`).join('; ')}.`, dados: porSetor };
    },
  });
  registro.registra({
    nome: 'agent.pause', agente: 'jarvis',
    descricao: 'Pausa um agente: ele termina o que está fazendo e não pega tarefa nova (as tarefas ficam na caixa). Volta com agent.resume. operacao = recolher a matilha; cobrador = parar os avisos de mensalidade.',
    parametros: PARAM_AGENTE,
    valida: (v) => (v.agente === 'brand_strategist' ? 'o Brand Strategist não tem fila própria (ele só trabalha quando você pede um briefing)' : null),
    executa: async (v) => {
      if (v.agente === 'operacao') {
        const antes = fluxo.estado().operacao?.ligada;
        if (!antes) return { mensagem: 'A operação já estava recolhida.', mudou: false };
        await chefe('recolher_matilha', {});
        if (fluxo.estado().operacao?.ligada) throw new Error('a operação continua solta');
        return { mensagem: 'Recolhi a matilha: ninguém novo é caçado nem abordado; quem já conversa continua sendo respondido.' };
      }
      if (v.agente === 'cobrador') {
        if (ajustes().cobrador === false) return { mensagem: 'O cobrador já estava pausado.', mudou: false };
        await dados.guarda({ ...dados.tudo(), ajustes: { ...(dados.tudo().ajustes || {}), cobrador: false } });
        return { mensagem: 'Pausei o Revenue Guardian: ele não manda mais avisos de mensalidade até você retomar.' };
      }
      const rs = [];
      for (const s of setoresDe(v.agente)) rs.push(await fluxo.pausa(s));
      if (!rs.every((r) => fluxo.trabalhadores.find((t) => t.setor === r.setor)?.pausado)) throw new Error('o agente não ficou pausado');
      const mudou = rs.some((r) => r.mudou);
      const fazendo = rs.filter((r) => r.fazendo).map((r) => r.fazendo);
      if (!mudou) return { mensagem: `${AGENTES[v.agente][0].toUpperCase()}${AGENTES[v.agente].slice(1)} já estava pausado.`, mudou: false };
      return { mensagem: `Pausei ${AGENTES[v.agente]}.${fazendo.length ? ` Ele termina o que estava fazendo (${fazendo.join('; ')}) e para.` : ''} As tarefas dele ficam na caixa.` };
    },
  });
  registro.registra({
    nome: 'agent.resume', agente: 'jarvis',
    descricao: 'Retoma um agente pausado ("coloca o vendedor para trabalhar", "retoma a prospecção"). Se a matilha estiver recolhida, liga os agentes (pede o seu sim, porque eles voltam a mandar mensagens).',
    parametros: PARAM_AGENTE,
    valida: (v) => (v.agente === 'brand_strategist' ? 'o Brand Strategist não tem fila própria para retomar' : null),
    permissao: (v) => {
      if (v.agente === 'operacao') return 'soltar a matilha (caçar e abordar com a meta e as buscas da última vez)';
      if (v.agente === 'cobrador') return ajustes().cobrador === false ? 'religar o Revenue Guardian (ele volta a mandar os avisos de mensalidade pelo WhatsApp)' : null;
      if (!fluxo.ligado) return `ligar os agentes da Matilha para ${AGENTES[v.agente]} trabalhar (eles voltam a responder e a mandar as mensagens que estão na fila)`;
      return null;
    },
    executa: async (v) => {
      if (v.agente === 'operacao') {
        if (fluxo.estado().operacao?.ligada) return { mensagem: 'A operação já estava solta.', mudou: false };
        const r = await chefe('soltar_matilha', {});
        return { mensagem: r.feito || 'Matilha solta.' };
      }
      if (v.agente === 'cobrador') {
        if (ajustes().cobrador !== false) return { mensagem: 'O cobrador já estava ligado.', mudou: false };
        await dados.guarda({ ...dados.tudo(), ajustes: { ...(dados.tudo().ajustes || {}), cobrador: true } });
        return { mensagem: 'Retomei o Revenue Guardian.' };
      }
      const rs = [];
      for (const s of setoresDe(v.agente)) rs.push(await fluxo.retoma(s));
      let ligou = false;
      if (!fluxo.ligado) { await fluxo.liga(); ligou = true; }
      if (rs.some((r) => fluxo.trabalhadores.find((t) => t.setor === r.setor)?.pausado)) throw new Error('o agente continua pausado');
      if (!rs.some((r) => r.mudou) && !ligou) return { mensagem: `${AGENTES[v.agente][0].toUpperCase()}${AGENTES[v.agente].slice(1)} já estava trabalhando.`, mudou: false };
      return { mensagem: `${ligou ? 'Liguei os agentes. ' : ''}${AGENTES[v.agente][0].toUpperCase()}${AGENTES[v.agente].slice(1)} voltou a trabalhar.` };
    },
  });
  registro.registra({
    nome: 'agent.request', agente: 'jarvis',
    descricao: 'Pede um trabalho a um agente: brand_strategist + briefing (o briefing de marca do restaurante: direção de arte, tom, seções, o que vender); ofertas + oferta (o Offer Architect monta a proposta, pelo mural).',
    parametros: { agente: { tipo: 'string', obrigatorio: true, enum: ['brand_strategist', 'ofertas'] }, pedido: { tipo: 'string', enum: ['briefing', 'oferta'] }, ...PARAM_PROJETO },
    executa: async (v, ctx) => {
      const p = precisaProjeto(v, ctx, { tipo: 'clientes' });
      const lead = leads().find((l) => l.id === p.id);
      if (v.agente === 'ofertas') {
        await fluxo.ligaOfertas();
        const t = await fluxo.pedeOferta(lead, { refazer: true, correlacao: ctx.correlacao });
        return { mensagem: `Pedi ao Offer Architect a oferta de ${lead.nome} (tarefa #${t.id} no mural). Aparece em Ofertas para você aprovar.`, tarefa: { id: t.id, setor: 'ofertas' }, agente: 'ofertas' };
      }
      const b = briefingDeMarca(lead, ajustes());
      await fluxo.comOsDados(async (tudo) => { const l = (tudo.leads || []).find((x) => x.id === lead.id); if (l) l.briefing_marca = b; });
      if (!leads().find((l) => l.id === lead.id)?.briefing_marca) throw new Error('o briefing não ficou guardado');
      ponte.envia('dados.recarrega', {}, { cliente: ctx.cliente }).catch(() => {});
      return { mensagem: `O Brand Strategist fez o briefing de ${lead.nome}: ${b.resumo} Ficou guardado na ficha dele.`, dados: b, agente: 'brand_strategist' };
    },
  });

  /* ══ TAREFAS DO MURAL ════════════════════════════════════════ */
  registro.registra({
    nome: 'task.list', agente: 'jarvis',
    descricao: 'As tarefas do mural: pendentes (na caixa ou sendo feitas), travadas, adiadas.',
    parametros: { estado: { tipo: 'string', enum: ['pendentes', 'travadas', 'adiadas', 'todas'], padrao: 'pendentes' }, setor: { tipo: 'string', enum: SETORES_PAUSAVEIS } },
    executa: async (v) => {
      const ts = fluxo.mural.tarefas.filter((t) => (!v.setor || t.setor === v.setor) && (v.estado === 'todas' ? t.estado !== 'feita'
        : v.estado === 'travadas' ? t.estado === 'travada' : v.estado === 'adiadas' ? t.estado === 'esperando' && t.aviso && t.disponivelEm > Date.now()
          : ['esperando', 'fazendo'].includes(t.estado)));
      const conta = {};
      for (const t of ts) conta[t.setor] = (conta[t.setor] || 0) + 1;
      const rotulo = { pendentes: 'pendentes', travadas: 'travadas', adiadas: 'adiadas', todas: 'em aberto' }[v.estado];
      return {
        mensagem: ts.length ? `${plural(ts.length, `tarefa ${rotulo}`, `tarefas ${rotulo}`)}: ${Object.entries(conta).map(([s, n]) => `${n} de ${nomeDoSetor(s)}`).join(', ')}.` : `Nenhuma tarefa ${rotulo}.`,
        dados: ts.slice(0, 50).map((t) => ({ id: t.id, setor: t.setor, tipo: t.tipo, nome: t.dados?.nome || '', estado: t.estado, tentativas: t.tentativas, erro: t.erro, correlacao: t.dados?.correlacao || '' })),
      };
    },
  });
  registro.registra({
    nome: 'task.inspect', agente: 'jarvis',
    descricao: 'Os detalhes de uma tarefa do mural pelo número: setor, estado, tentativas, erro.',
    parametros: { id: { tipo: 'integer', obrigatorio: true } },
    executa: async (v) => {
      const t = fluxo.mural.acha(v.id);
      if (!t) throw new Error(`não existe a tarefa #${v.id} (as feitas antigas saem do mural)`);
      return { mensagem: `Tarefa #${t.id}: ${t.tipo}${t.dados?.nome ? ` de ${t.dados.nome}` : ''}, de ${nomeDoSetor(t.setor)}, ${t.estado}${t.tentativas ? `, ${t.tentativas} tentativa(s)` : ''}${t.erro ? `. Último erro: ${t.erro}` : ''}${t.resultado ? `. Resultado: ${t.resultado}` : ''}.`,
        dados: { ...t }, tarefa: { id: t.id, setor: t.setor } };
    },
  });
  registro.registra({
    nome: 'task.retry', agente: 'jarvis',
    descricao: 'Manda tentar de novo uma tarefa travada (pelo número) ou todas as travadas.',
    parametros: { id: { tipo: 'integer' } },
    executa: async (v) => {
      const travadas = fluxo.mural.tarefas.filter((t) => t.estado === 'travada' && (!v.id || t.id === v.id));
      if (v.id && !travadas.length) throw new Error(`a tarefa #${v.id} não está travada`);
      for (const t of travadas) await fluxo.destrava(t.id);
      return { mensagem: travadas.length ? `${plural(travadas.length, 'tarefa voltou', 'tarefas voltaram')} para a fila.` : 'Não há tarefa travada.', mudou: travadas.length > 0 };
    },
  });

  /* ══ CAMPANHA (a operação) ═══════════════════════════════════ */
  registro.registra({
    nome: 'campaign.start', agente: 'operacao',
    descricao: 'Inicia a campanha: solta a matilha para caçar e abordar (manda mensagens). Pede o seu sim.',
    parametros: { ramos: { tipo: 'string' }, cidades: { tipo: 'string' }, vendas: { tipo: 'integer' } },
    permissao: (v) => `soltar a matilha${v.ramos ? ` em ${v.ramos}` : ''}${v.cidades ? `, ${v.cidades}` : ''} (ela caça e manda o primeiro contato pelo WhatsApp)`,
    executa: async (v) => {
      const r = await chefe('soltar_matilha', v);
      if (!fluxo.estado().operacao?.ligada) throw new Error('a operação não ficou ligada');
      return { mensagem: r.feito };
    },
  });
  registro.registra({
    nome: 'campaign.stop', agente: 'operacao',
    descricao: 'Para a campanha: recolhe a matilha (não caça nem aborda ninguém novo; quem conversa continua sendo respondido).',
    executa: async () => {
      if (!fluxo.estado().operacao?.ligada) return { mensagem: 'A campanha já estava parada.', mudou: false };
      const r = await chefe('recolher_matilha', {});
      if (fluxo.estado().operacao?.ligada) throw new Error('a operação continua ligada');
      return { mensagem: r.feito };
    },
  });
  registro.registra({
    nome: 'contacts.release', agente: 'vendedor',
    descricao: 'Libera o primeiro contato de quem está esperando você (o vendedor manda mensagem). Pede o seu sim.',
    parametros: { quantos: { tipo: 'integer' } },
    permissao: (v) => `liberar ${v.quantos ? plural(v.quantos, 'primeiro contato', 'primeiros contatos') : 'todos os primeiros contatos'} (o vendedor manda mensagem no WhatsApp)`,
    executa: async (v) => ({ mensagem: (await chefe('liberar_contatos', v.quantos ? { quantos: v.quantos } : { todos: true })).feito }),
  });

  /* ══ OFERTAS ═════════════════════════════════════════════════ */
  const ofertaDe = async (v, ctx) => {
    const arq = await fluxo.arquiteto();
    const p = precisaProjeto(v, ctx, { tipo: 'clientes' });
    const o = arq.lista({ leadId: p.id }).find((x) => ['rascunho', 'revisao', 'aprovada'].includes(x.estado));
    if (!o) throw new Error(`não há oferta esperando aprovação para ${p.nome}`);
    return { arq, o, p };
  };
  registro.registra({
    nome: 'offer.approve', agente: 'ofertas',
    descricao: 'Aprova a oferta (a melhor versão) de um cliente. Pede o seu sim.',
    parametros: PARAM_PROJETO,
    permissao: async (v, ctx) => {
      try { const { o, p } = await ofertaDe(v, ctx); const ve = o.versoes[o.escolhida]; return `aprovar a oferta de ${p.nome} (versão ${ve?.rotulo || 1}, nota ${ve?.score ?? '?'})`; } catch { return null; }
    },
    executa: async (v, ctx) => {
      const { arq, o, p } = await ofertaDe(v, ctx);
      if (o.estado === 'aprovada') return { mensagem: `A oferta de ${p.nome} já estava aprovada.`, mudou: false };
      const r = await arq.aprova(o.id);
      return { mensagem: `Aprovei a oferta de ${p.nome} (${r.pacote?.nome || 'pacote'}). Ela vai ao vendedor quando você mandar enviar.` };
    },
  });
  registro.registra({
    nome: 'offer.send', agente: 'ofertas',
    descricao: 'Envia ao vendedor a oferta aprovada de um cliente (o primeiro contato entra na fila). Pede o seu sim.',
    parametros: PARAM_PROJETO,
    permissao: (v, ctx) => { const p = resolveProjeto(v.projeto, ctx, { tipo: 'clientes' }); return `enviar ao vendedor a oferta aprovada${p.nome ? ` de ${p.nome}` : ''} (ele vai mandar mensagem)`; },
    executa: async (v, ctx) => {
      const { o, p } = await ofertaDe(v, ctx);
      const r = await fluxo.enviaOferta(o.id);
      return { mensagem: `A oferta de ${p.nome} foi para o vendedor.${r.aviso ? ` ${r.aviso}` : r.fila ? ' O primeiro contato entrou na fila.' : ''}` };
    },
  });

  /* ══ DADOS (consultas) ═══════════════════════════════════════ */
  registro.registra({
    nome: 'data.query', agente: 'jarvis',
    descricao: 'Consulta os dados reais: encontrados_hoje (quantos restaurantes/negócios a prospecção achou hoje), funil, mensalidades_pendentes, receita (mensalidades ativas), resumo.',
    parametros: { consulta: { tipo: 'string', obrigatorio: true, enum: ['encontrados_hoje', 'funil', 'mensalidades_pendentes', 'receita', 'resumo'] } },
    executa: async (v) => {
      const ls = leads();
      const aj = ajustes();
      if (v.consulta === 'encontrados_hoje') {
        const inicio = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
        const hoje = ls.filter((l) => Number(l.criado) >= inicio);
        const comida = hoje.filter((l) => ehDeComida(l.tipo, listaDeNichos(aj.nichosComida)));
        return { mensagem: hoje.length ? `Hoje a prospecção encontrou ${plural(hoje.length, 'negócio', 'negócios')}, ${plural(comida.length, 'restaurante ou negócio de comida', 'restaurantes ou negócios de comida')}${comida.length ? `: ${lista(comida.map((l) => l.nome), 5)}` : ''}.` : 'Hoje a prospecção ainda não encontrou nenhum negócio.',
          dados: { total: hoje.length, restaurantes: comida.length, nomes: comida.map((l) => l.nome) } };
      }
      if (v.consulta === 'funil' || v.consulta === 'resumo') {
        const conta = {};
        for (const l of ls) conta[l.estagio] = (conta[l.estagio] || 0) + 1;
        return { mensagem: `${plural(ls.length, 'cliente', 'clientes')} no funil: ${Object.entries(conta).map(([k, n]) => `${n} ${k.replace(/_/g, ' ')}`).join(', ') || 'nenhum'}.`, dados: conta };
      }
      const fin = financeiro(ls, aj);
      if (v.consulta === 'mensalidades_pendentes') {
        return { mensagem: fin.pendentes.length ? `${plural(fin.pendentes.length, 'mensalidade pendente', 'mensalidades pendentes')}: ${lista(fin.pendentes.map((p) => `${p.nome} (${p.nome_do_mes}${p.dias_de_atraso > 0 ? `, ${p.dias_de_atraso} dias de atraso` : ''})`), 5)}.` : 'Nenhuma mensalidade pendente.', dados: fin.pendentes };
      }
      return { mensagem: fin.clientes.length ? `${plural(fin.clientes.length, 'cliente pagando', 'clientes pagando')} mensalidade, somando R$ ${fin.mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por mês.` : 'Ainda nenhum cliente pagando mensalidade.', dados: fin };
    },
  });

  /* ══ VALUE INTELLIGENCE ══════════════════════════════════════ */
  const PRODUTO = { produto: { tipo: 'string', enum: ['site', 'cardapio'], descricao: 'site (site completo) ou cardapio (cardápio digital)' } };
  const valorPronto = async () => { await fluxo.arquiteto(); return fluxo.analista(); };
  const briefDoProjeto = async (v, ctx) => {
    const va = await valorPronto();
    const p = precisaProjeto(v, ctx, { tipo: 'clientes' });
    return { va, p, lead: leads().find((l) => l.id === p.id), b: va.briefDe(p.id) };
  };
  const resumoDoBrief = (b) => `Para ${b.restaurant_name} (${b.product_id === 'cardapio' ? 'cardápio digital' : 'site completo'}), os três benefícios que mais pesam: `
    + `${b.prioritized_benefits.map((x, i) => `${i + 1}, ${x.benefit} (${x.relevance_score} pontos, evidência: ${x.evidence_reference})`).join('; ')}. `
    + `Argumento principal: "${b.resumo.argumento_principal}" Pergunta para fazer: "${b.resumo.pergunta_consultiva}"`;
  registro.registra({
    nome: 'value.product', agente: 'valor',
    descricao: 'O valor de um produto (sem cliente): o que ele resolve, os benefícios mais fortes com a evidência, os diferenciais, as limitações e o que não está verificado.',
    parametros: { produto: { ...PRODUTO.produto, obrigatorio: true } },
    executa: async (v) => {
      const va = await valorPronto();
      const a = va.analisaProduto(v.produto, ajustes());
      va.mem.analises.push({ tipo: 'produto', product_id: a.product_id, product_version: a.product_version, quando: Date.now(), principais: a.principais.map((x) => x.benefit) });
      await va._grava();
      return { mensagem: `${a.nome} (versão ${a.product_version}): ${a.principais.map((x) => `${x.benefit}, provado por ${x.evidencia?.tipo || 'nada'}`).join('; ')}. `
        + `O que não tem: ${a.limitacoes.filter((x) => x.startsWith('não tem')).map((x) => x.slice(8)).join(', ') || 'nada a declarar'}.${a.nao_verificado.length ? ` Falta verificar: ${a.nao_verificado.join('; ')}.` : ''}`,
      dados: a, agente: 'valor' };
    },
  });
  registro.registra({
    nome: 'value.analyze', agente: 'valor',
    descricao: 'Pede ao Value Intelligence a análise de valor de um restaurante (pelo mural) e devolve o Value Brief: necessidades verificadas, os três benefícios que mais pesam, perguntas, demonstração e limitações.',
    parametros: { ...PARAM_PROJETO, ...PRODUTO },
    executa: async (v, ctx) => {
      const { va, lead } = await briefDoProjeto(v, ctx);
      await fluxo.ligaOfertas();
      const antes = Date.now();
      const t = await fluxo.pedeValor(lead, { correlacao: ctx.correlacao, forca: true, produto: v.produto || '' });
      // Espera o agente terminar (é rápido); se demorar, diz que está na fila em vez de fingir.
      for (let i = 0; i < 60; i += 1) {
        const b = va.briefDe(lead.id);
        if (b && b.generated_at >= antes) return { mensagem: `${b.estado === 'bloqueado' ? `O brief ficou bloqueado: ${b.problemas.join('; ')}. ` : ''}${resumoDoBrief(b)}`, dados: b, tarefa: { id: t.id, setor: 'valor' }, agente: 'valor' };
        const tt = fluxo.mural.acha(t.id);
        if (tt?.estado === 'travada') throw new Error(`a análise falhou: ${tt.erro}`);
        await new Promise((r) => setTimeout(r, 150));
      }
      return { mensagem: `A análise de ${lead.nome} está na fila do Value Intelligence (tarefa #${t.id}).`, tarefa: { id: t.id, setor: 'valor' }, agente: 'valor' };
    },
  });
  registro.registra({
    nome: 'value.brief', agente: 'valor',
    descricao: 'Mostra o Value Brief de um restaurante: os três maiores benefícios, o argumento, a pergunta consultiva. Com produto, explica por que aquele produto serve (ou não) para ele.',
    parametros: { ...PARAM_PROJETO, ...PRODUTO },
    executa: async (v, ctx) => {
      const { va, p, lead, b } = await briefDoProjeto(v, ctx);
      if (b && (!v.produto || v.produto === b.product_id)) return { mensagem: resumoDoBrief(b), dados: b, agente: 'valor' };
      const a = va.analisaLead(lead, v.produto || '', ajustes());
      const ver = a.identified_needs.filter((n) => n.tipo === 'verificada');
      return { mensagem: `${p.nome} e ${a.nome}: ${ver.length ? `o que se sabe dele: ${ver.map((n) => n.observacao).join(' ')}` : 'não há necessidade verificada; os argumentos seriam genéricos.'} `
        + `Os benefícios que mais pesam: ${a.principais.map((x) => `${x.benefit} (${x.score})`).join('; ')}.${a.principais[0]?.score < 70 ? ' Nenhum passa de "complementar": talvez esse produto não seja o melhor para ele.' : ''}`,
      dados: a, agente: 'valor' };
    },
  });
  registro.registra({
    nome: 'value.compare', agente: 'valor',
    descricao: 'Compara o valor do site completo com o do cardápio digital (de um restaurante, se houver um aberto ou nomeado): o que só um tem, o que os dois têm, e para quem cada um serve.',
    parametros: PARAM_PROJETO,
    executa: async (v, ctx) => {
      const va = await valorPronto();
      const p = v.projeto ? resolveProjeto(v.projeto, ctx, { tipo: 'clientes' }) : null;
      const lead = p?.id ? leads().find((l) => l.id === p.id) : null;
      const c = va.compara(ajustes(), lead);
      const lin = (x) => `${x.nome}: ${x.principais.map((b) => b.benefit).join('; ')}`;
      return { mensagem: `${c.produtos.map(lin).join('. ')}. Só no site: ${c.so_no_site.join(', ') || 'nada'}. Só no cardápio: ${c.so_no_cardapio.join(', ') || 'nada'}. ${c.leitura}`, dados: c, agente: 'valor' };
    },
  });
  registro.registra({
    nome: 'value.ask', agente: 'valor',
    descricao: 'Pergunta ao Value Intelligence como responder a uma objeção ("já tenho Instagram", "tá caro", "aumenta as vendas?", "o outro é mais barato"), com argumento verdadeiro, ou dizendo quando não há vantagem.',
    parametros: { pergunta: { tipo: 'string', obrigatorio: true, max: 400 }, ...PARAM_PROJETO },
    executa: async (v, ctx) => {
      const va = await valorPronto();
      const p = v.projeto ? resolveProjeto(v.projeto, ctx, { tipo: 'clientes' }) : resolveProjeto('', ctx, { tipo: 'clientes' });
      const lead = p?.id ? leads().find((l) => l.id === p.id) : {};
      const r = va.responde(v.pergunta, lead, ajustes());
      await va.guardaAssistencia({ ...r, lead_id: lead.id || null, correlacao: ctx.correlacao });
      return { mensagem: `${r.vantagem_suficiente ? '' : 'Com franqueza: aqui a vantagem é pequena. '}${r.resposta}`, dados: r, agente: 'valor' };
    },
  });
  registro.registra({
    nome: 'value.approve', agente: 'valor',
    descricao: 'Aprova o Value Brief de um restaurante (o vendedor só usa aprovado). Pede o seu sim.',
    parametros: PARAM_PROJETO,
    pedeSim: () => 'aprovar o Value Brief (o vendedor vai usar esses argumentos)',
    permissao: 'confirmar',
    executa: async (v, ctx) => {
      const { va, p, b } = await briefDoProjeto(v, ctx);
      if (!b) throw new Error(`não há Value Brief de ${p.nome}: peça a análise primeiro`);
      const r = await va.aprova(b.brief_id, 'você', ctx.correlacao);
      return { mensagem: r.mudou ? `Aprovei o Value Brief de ${p.nome} (versão ${b.versao}).` : `O Value Brief de ${p.nome} já estava aprovado.`, mudou: r.mudou, agente: 'valor' };
    },
  });
  registro.registra({
    nome: 'value.send', agente: 'valor',
    descricao: 'Envia o Value Brief aprovado de um restaurante para o vendedor (ele passa a usar nos argumentos).',
    parametros: PARAM_PROJETO,
    executa: async (v, ctx) => {
      const { p, b } = await briefDoProjeto(v, ctx);
      if (!b) throw new Error(`não há Value Brief de ${p.nome}`);
      if (b.estado === 'enviado') return { mensagem: `O Value Brief de ${p.nome} já está com o vendedor.`, mudou: false, agente: 'vendedor' };
      await fluxo.enviaBriefAoVendedor(b.brief_id, ctx.correlacao);
      if (!leads().find((l) => l.id === p.id)?.value_brief) throw new Error('o resumo não chegou ao cliente');
      ponte.envia('dados.recarrega', {}, { cliente: ctx.cliente }).catch(() => {});
      return { mensagem: `Enviei o resumo de valor de ${p.nome} para o vendedor: ele passa a usar "${b.resumo.argumento_principal}"`, agente: 'vendedor' };
    },
  });
  registro.registra({
    nome: 'value.revise', agente: 'valor',
    descricao: 'Revisa o Value Brief: troca o argumento principal ou a pergunta consultiva. É conferido de novo e volta a precisar de aprovação.',
    parametros: { ...PARAM_PROJETO, argumento_principal: { tipo: 'string', max: 500 }, pergunta_consultiva: { tipo: 'string', max: 300 } },
    executa: async (v, ctx) => {
      const { va, p, b } = await briefDoProjeto(v, ctx);
      if (!b) throw new Error(`não há Value Brief de ${p.nome}`);
      const novo = await va.revisa(b.brief_id, { ...(v.argumento_principal ? { argumento_principal: v.argumento_principal } : {}), ...(v.pergunta_consultiva ? { pergunta_consultiva: v.pergunta_consultiva } : {}) }, ajustes());
      if (novo.estado === 'bloqueado') throw new Error(`a revisão ficou bloqueada: ${novo.problemas.join('; ')}`);
      return { mensagem: `Revisei o Value Brief de ${p.nome}. Ele volta a precisar da sua aprovação.`, agente: 'valor' };
    },
  });
  registro.registra({
    nome: 'value.feature', agente: 'valor',
    descricao: 'Muda o que o produto entrega (a base de produtos, a fonte da verdade): marca uma funcionalidade como implementada, feita por nós, ou não implementada. A versão do produto sobe e os briefs antigos são refeitos. Pede o seu sim.',
    parametros: { ...PRODUTO, produto: { ...PRODUTO.produto, obrigatorio: true }, funcionalidade: { tipo: 'string', obrigatorio: true }, estado: { tipo: 'string', obrigatorio: true, enum: ['implementada', 'por_nos', 'nao_implementada'] } },
    pedeSim: (v) => `mudar o que o ${v.produto === 'cardapio' ? 'cardápio digital' : 'site completo'} entrega: "${v.funcionalidade}" passa a ${v.estado.replace('_', ' ')} (os argumentos de venda mudam)`,
    permissao: 'confirmar',
    executa: async (v, ctx) => {
      const va = await valorPronto();
      const r = await va.marcaFuncionalidade(v.produto, v.funcionalidade, v.estado, ajustes());
      const postas = await fluxo.refazDesatualizados(ctx.correlacao);
      return { mensagem: `Feito: o produto foi para a versão ${r.versao}. ${postas.length ? `${plural(postas.length, 'brief antigo entrou', 'briefs antigos entraram')} na fila para ser refeito.` : 'Nenhum brief precisava ser refeito.'}`, agente: 'valor' };
    },
  });
  registro.registra({
    nome: 'value.show', agente: 'tela',
    descricao: 'Abre a página do Value Intelligence mostrando a análise de um restaurante (ou só a página).',
    parametros: PARAM_PROJETO,
    executa: async (v, ctx) => {
      const p = v.projeto ? resolveProjeto(v.projeto, ctx, { tipo: 'clientes' }) : resolveProjeto('', ctx, { tipo: 'clientes' });
      const r = await tela('valor.mostra', { lead_id: p?.id || '' }, ctx);
      if (r.estado?.tela !== 'valor') throw new Error('a página do Value Intelligence não abriu');
      return { mensagem: p?.nome ? `Abri o Value Intelligence com ${p.nome}.` : 'Abri o Value Intelligence.', evidencia: r.evidencia };
    },
  });

  return { resolveProjeto, memoria, errosDosAgentes };
}

/** O Financeiro (Revenue Guardian): quem paga, quanto, e quem está pendente. Só dados reais. */
export function financeiro(leads, ajustes = {}, agora = Date.now()) {
  const clientes = leads.filter((l) => l.aprovado_em && !l.cancelado_em).map((l) => {
    const valor = valorDaMensalidade(l, ajustes);
    const s = situacaoDaMensalidade(l, agora);
    return { id: l.id, nome: l.nome, valor, numero: numerosDe(valor)[0] || 0, pendente: Boolean(s), ...(s || {}), arquivado: Boolean(l.arquivado_em) };
  });
  return { clientes, pendentes: clientes.filter((c) => c.pendente), mensal: clientes.reduce((a, c) => a + c.numero, 0) };
}

/**
 * O BRAND STRATEGIST: o briefing de marca de um restaurante, a partir do
 * que o estúdio já sabe (o ramo, a direção de arte sorteada para ele, os
 * fatos da ficha). Determinístico e conferível: nada é inventado.
 */
export function briefingDeMarca(lead, ajustes = {}) {
  const ramo = ramoDe(lead.tipo);
  const d = direcaoDe(lead, ramo.chave);
  const fatos = [lead.nota ? `nota ${String(lead.nota).replace('.', ',')} no Google${lead.avaliacoes ? ` (${lead.avaliacoes} avaliações)` : ''}` : '',
    lead.instagram ? 'tem Instagram' : '', lead.site_proprio ? 'já tem site' : 'sem site próprio encontrado',
    lead.cardapio?.itens?.length ? `${lead.cardapio.itens.length} itens de cardápio lidos das fotos` : ''].filter(Boolean);
  const oferta = lead.oferta_aprovada?.pacote ? `${lead.oferta_aprovada.pacote.nome}` : '';
  return {
    quando: Date.now(),
    restaurante: lead.nome,
    publico_e_angulo: ramo.angulo,
    acao_principal: ramo.acao,
    direcao_de_arte: { nome: d.nome, uso: d.uso, paleta: d.paleta, tipografia: d.tipografia, topo: lead.fotos?.length ? d.topoComFoto : d.topoSemFoto },
    secoes: ramo.secoes,
    fatos_que_podem_ser_usados: fatos,
    oferta_aprovada: oferta || null,
    nao_fazer: 'nada de preço, horário, depoimento ou prêmio inventado; nada de cara de "site de IA" (gradiente, três cartões iguais, frases feitas)',
    resumo: `direção "${d.nome}" (${d.uso}), botão principal "${ramo.acao}", e o argumento: ${texto(ramo.angulo, 160)}`,
  };
}
