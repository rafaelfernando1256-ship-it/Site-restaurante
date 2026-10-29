/**
 * O INTÉRPRETE — os comandos de sempre, entendidos na hora, sem modelo.
 *
 * "Abre o painel, mostra os agentes com erro e pausa o vendedor" vira um
 * plano de três passos (navigation.open → agent.errors → agent.pause).
 * Rápido, sempre igual e testável. Quando um pedaço da fala não é um
 * comando conhecido, o intérprete devolve null e quem pensa é o modelo
 * (Claude ou Groq), com as mesmas ações à mão.
 *
 * "Fechar" é a palavra perigosa. "Fecha essa janela" fecha a janela.
 * "Fecha o projeto" depende da tela: aberto, fecha a janela dele; fechado,
 * o Jarvis pergunta se é arquivar ou encerrar. Nunca apaga nada.
 */
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[“”"!?¿¡]/g, ' ').replace(/\s+/g, ' ').trim();

const PAGINAS = [
  ['rede', /\b(rede (de|dos) agentes|agent network|mapa dos agentes|como os agentes (estao|se) (se )?comunica\w*|comunicacao (dos|entre os) agentes|agentes (se )?comunicando)\b/],
  ['financeiro', /\b(revenue guardian|financeiro|financas|mensalidades|cobrancas?|receita|faturamento)\b/],
  ['valor', /\b(value intelligence|inteligencia de valor|valor dos produtos|pagina de valor)\b/],
  ['ofertas', /\b(ofertas|offer architect)\b/],
  ['clientes', /\b(clientes|funil|projetos)\b/],
  ['cacada', /\b(cacada|prospeccao|operations commander)\b/],
  ['escritorio', /\b(escritorio)\b/],
  ['whatsapp', /\b(whats ?app|zap)\b/],
  ['ajustes', /\b(ajustes|configuracoes|configuracao)\b/],
  ['comecar', /\b(comecar|tela de comecar)\b/],
  ['jarvis', /\b(tela do jarvis|jarvis)\b/],
  ['hoje', /\b(restaurant sales|painel principal|tela principal|pagina principal|painel inicial|pagina inicial|inicio|hoje|matilha|painel)\b/],
];
const AGENTES = [
  ['todos', /\b(todos os agentes|todo mundo|todos eles)\b/],
  ['vendedor', /\b(vendedor(es)?|agente vendedor|agente de vendas)\b/],
  ['valor', /\b(value intelligence|agente de valor|inteligencia de valor)\b/],
  ['ofertas', /\b(offer architect|agente de ofertas|ofertas)\b/],
  ['brand_strategist', /\b(brand strategist|estrategista de marca)\b/],
  ['producao', /\b(producao|agente de producao)\b/],
  ['estudio', /\b(estudio)\b/],
  ['publicador', /\b(publicador)\b/],
  ['dominio', /\b(dominio|agente do dominio)\b/],
  ['cobrador', /\b(cobrador|revenue guardian|cobranca)\b/],
  ['operacao', /\b(operations commander|operacao)\b/],
  ['cacador', /\b(prospeccao|cacador(es)?|cacada|agente de prospeccao)\b/],
];
const pagina = (n) => PAGINAS.find(([, re]) => re.test(n))?.[0] || null;
const agente = (n) => AGENTES.find(([, re]) => re.test(n))?.[0] || null;

const VERBO = '(?:abr\\w*|mostr\\w*|exib\\w*|paus\\w*|par[ae]|suspend\\w*|retom\\w*|religa\\w*|reativ\\w*|colo[cq]\\w*|bot[ae]|volt\\w*|fech\\w*|arquiv\\w*|desarquiv\\w*|encerr\\w*|finaliz\\w*|conclu\\w*|cancel\\w*|pe[cç]a|ped[ei]\\w*|solicit\\w*|aprov\\w*|filtr\\w*|vai|va|ir|leva\\w*|entr\\w*|solt\\w*|recolh\\w*|inici\\w*|comec\\w*|tent\\w*|inspecion\\w*|quant\\w*|qual|quais|liste?\\w*|traz\\w*|me)';
/** Separa "abre X, mostra Y e pausa Z" em três pedaços (o "e" só separa quando vem um verbo depois). */
export function separa(t) {
  return norm(t).replace(/^jarvis[,.]?\s*/, '').replace(/\bpor favor\b/g, '').split(new RegExp(`\\s*(?:[,;]\\s*(?:e\\s+|depois\\s+|entao\\s+)?|\\s+e\\s+(?=${VERBO}\\b)|\\s+(?:depois|entao)\\s+(?=${VERBO}\\b))`))
    .map((x) => x.replace(/^(e|depois|entao|ai)\s+/, '').replace(/[.\s]+$/, '').trim()).filter(Boolean);
}

/** O nome do projeto dentro da fala ("o projeto da Pizzaria Bella" → "pizzaria bella"; "este projeto" → "este"). */
function projetoDe(n) {
  if (/\b(este|esse|deste|desse|neste|nesse|esta|essa)\s+(projeto|restaurante|cliente|negocio|pizzaria|lanchonete|hamburgueria)\b/.test(n)
    || /^\S+\s+(isso|ele|ela)$/.test(n)) return 'este';
  const m = n.match(/\b(?:projeto|cliente|restaurante|ficha|oferta|briefing)\s+(?:(?:da|do|de|das|dos|pra|para a|para o|para)\s+)?(.+)$/);
  if (m) {
    const nome = m[1].replace(/^(a|o)\s+/, '').trim();
    if (/^(este|esse|isso|aqui|atual)$/.test(nome)) return 'este';
    return nome;
  }
  return '';
}

/** Um pedaço da fala → um ou mais passos, ou null se não é um comando conhecido. */
function umPedaco(n) {
  const passos = [];
  const p = (acao, parametros = {}, descricao = '') => passos.push({ acao, parametros, descricao });

  // ── CONSULTAS ─────────────────────────────────────────────────
  if (/\bquant[oa]s?\b.*\b(restaurantes?|negocios?|leads?|clientes? novos?|pizzarias?|lanchonetes?)\b.*\b(encontr|ach|cac|prospect)\w*.*\bhoje\b|\bquant[oa]s?\b.*\b(encontr|ach|cac)\w*\b.*\bhoje\b/.test(n)) {
    p('data.query', { consulta: 'encontrados_hoje' }, 'contar os negócios encontrados hoje');
    return passos;
  }
  if (/\b(qua(l|is)|algum|tem)\b.*\bagentes?\b.*\berr(o|os|ado)\b|\bagentes?\b.*\bcom erro\b|\berros? (dos|nos) agentes\b/.test(n)) {
    if (/^(mostr|exib|abr|ve|ver|me mostr)/.test(n)) {
      p('navigation.open', { tela: 'rede' }, 'abrir a Rede de agentes');
      p('dashboard.filter', { tela: 'rede', filtro: 'erros' }, 'mostrar só os agentes com erro');
    }
    p('agent.errors', {}, 'ver quais agentes estão com erro');
    return passos;
  }
  if (/\btarefas?\b.*\b(pendentes?|na fila|esperando|em aberto|travadas?)\b/.test(n)) {
    const travadas = /travad/.test(n);
    if (/^(mostr|exib|abr|ve|ver|me mostr|list)/.test(n)) {
      p('navigation.open', { tela: 'rede' }, 'abrir a Rede de agentes');
      p('dashboard.filter', { tela: 'rede', filtro: travadas ? 'erros' : 'pendentes' }, `mostrar as tarefas ${travadas ? 'travadas' : 'pendentes'}`);
    }
    p('task.list', { estado: travadas ? 'travadas' : 'pendentes' }, `listar as tarefas ${travadas ? 'travadas' : 'pendentes'}`);
    return passos;
  }
  const filtroProjeto = /\bprojetos?\b.*\b(em producao|produzindo|sendo feitos?)\b/.test(n) ? 'producao'
    : /\bprojetos?\b.*\b(finalizad|conclu|entregue|terminad|encerrad)\w*/.test(n) ? 'finalizados'
      : /\bprojetos?\b.*\barquivad\w*/.test(n) ? 'arquivados' : /\bprojetos?\b.*\bativos?\b/.test(n) ? 'ativos' : null;
  if (filtroProjeto && /^(mostr|exib|abr|ve|ver|me mostr|list|quais|qual|quant|traz)/.test(n)) {
    p('navigation.open', { tela: 'clientes' }, 'abrir os projetos (Clientes)');
    p('dashboard.filter', { tela: 'clientes', filtro: filtroProjeto }, `filtrar os projetos ${filtroProjeto === 'producao' ? 'em produção' : filtroProjeto}`);
    p('project.list', { filtro: filtroProjeto }, 'contar os projetos');
    return passos;
  }
  if (/\bmensalidades?\b.*\b(pendentes?|atrasad\w*|em aberto|devendo|vencid\w*)\b|\bquem (esta|ta) devendo\b/.test(n)) {
    if (/^(mostr|exib|abr|ve|ver|me mostr|list|quais|traz)/.test(n)) {
      p('navigation.open', { tela: 'financeiro' }, 'abrir o Financeiro');
      p('dashboard.filter', { tela: 'financeiro', filtro: 'pendentes' }, 'filtrar as mensalidades pendentes');
    }
    p('data.query', { consulta: 'mensalidades_pendentes' }, 'ver as mensalidades pendentes');
    return passos;
  }
  if (/\b(como (estao|vao) os agentes|status dos agentes|estado dos agentes|o que os agentes estao fazendo)\b/.test(n)) {
    p('agent.status', {}, 'ver o estado dos agentes');
    return passos;
  }

  // ── VALUE INTELLIGENCE: o valor do que vendemos ─────────────────
  const produtoDe = (t) => (/\bcardapio\b/.test(t) ? 'cardapio' : /\bsite\b/.test(t) ? 'site' : '');
  if (/\bcompar\w*\b.*\bsite\b.*\bcardapio\b|\bcompar\w*\b.*\bcardapio\b.*\bsite\b|\bcompar\w* (os )?beneficios\b/.test(n)) {
    p('value.compare', { projeto: /\b(este|esse|deste|desse)\b/.test(n) ? 'este' : '' }, 'comparar o valor do site e do cardápio');
    return passos;
  }
  if (/^(qual|quais) (e |eh )?(o )?valor (do|da|de) (nosso|nossa)?\s*(cardapio|site)/.test(n) || /^(qual|quais) (o|os) (valor|beneficios?) (do|da) (nosso|nossa)? ?(cardapio|site)/.test(n)) {
    p('value.product', { produto: produtoDe(n) }, 'mostrar o valor do produto');
    return passos;
  }
  if (/^(expliqu\w*|explica|por que|porque|diz por que)\b.*\bprecisari\w*\b.*\b(site|cardapio)\b/.test(n)) {
    p('value.brief', { projeto: projetoDe(n.replace(/\bprecisari\w*.*$/, '')) || 'este', produto: produtoDe(n.replace(/^.*\bprecisari\w*/, '')) }, 'explicar o valor para este restaurante');
    return passos;
  }
  if (/\b(tres|3) (maiores|principais|melhores) beneficios\b|\bprincipais beneficios\b/.test(n)) {
    const nome = /\b(da|do|de) (nossa |nosso )?oferta\b/.test(n) ? 'este' : projetoDe(n) || 'este';
    p('value.brief', { projeto: nome }, 'mostrar os três maiores benefícios');
    return passos;
  }
  if (/\b(value intelligence|agente de valor)\b.*\banalis\w*|\banalis\w* de valor\b/.test(n) && /^(pe[cç]a|ped[ei]\w*|solicit\w*|manda\w*|faz\w*|faca|gera\w*|quero)/.test(n)) {
    const nome = projetoDe(n.replace(/\buma analise( de valor)?\b/, '').replace(/\b(ao|para o|pro) (value intelligence|agente de valor)\b/, '')) || 'este';
    p('value.analyze', { projeto: nome }, 'pedir a análise ao Value Intelligence');
    p('value.show', { projeto: nome }, 'mostrar a análise na tela');
    return passos;
  }
  if (/^(envi\w*|mand\w*|pass\w*)\b.*\b(resumo de valor|value brief|brief de valor|briefing de valor)\b/.test(n)) {
    p('value.send', { projeto: projetoDe(n.replace(/\b(para o|pro|ao) vendedor\b/, '')) || 'este' }, 'enviar o resumo de valor ao vendedor');
    return passos;
  }
  if (/^aprov\w*\b.*\b(resumo de valor|value brief|brief de valor|briefing de valor|briefing)\b/.test(n) && !/brand/.test(n)) {
    p('value.approve', { projeto: projetoDe(n) || 'este' }, 'aprovar o resumo de valor');
    return passos;
  }

  // ── PEDIR TRABALHO A UM AGENTE ────────────────────────────────
  if (/\bbriefing\b/.test(n) && /^(pe[cç]a|ped[ei]\w*|solicit\w*|manda\w*|faz\w*|faca|gera\w*|prepar\w*|cri\w*|quero)/.test(n)) {
    const nome = projetoDe(n.replace(/\b(ao|para o|pro) (brand strategist|estrategista de marca)\b/, '').replace(/\bum briefing\b/, 'briefing'));
    p('agent.request', { agente: 'brand_strategist', pedido: 'briefing', projeto: nome || 'este' }, 'pedir o briefing ao Brand Strategist');
    return passos;
  }
  if (/^(gera\w*|monta\w*|faz\w*|faca|pe[cç]a|ped[ei]\w*|cri\w*)\b.*\boferta\b/.test(n)) {
    p('agent.request', { agente: 'ofertas', pedido: 'oferta', projeto: projetoDe(n) || 'este' }, 'pedir a oferta ao Offer Architect');
    return passos;
  }
  if (/^aprov\w*\b.*\boferta\b/.test(n)) { p('offer.approve', { projeto: projetoDe(n) || 'este' }, 'aprovar a oferta'); return passos; }

  // ── CAMPANHA E AGENTES ────────────────────────────────────────
  if (/^(solt\w*|inici\w*|comec\w*|lig\w*)\s+(a\s+)?(matilha|campanha|operacao|cacada)\b/.test(n)) { p('campaign.start', {}, 'soltar a matilha'); return passos; }
  if (/^(recolh\w*|par[ae]\w*\s+(a\s+)?(campanha|matilha|operacao|cacada)|encerr\w*\s+a\s+campanha)\b/.test(n)) { p('campaign.stop', {}, 'recolher a matilha'); return passos; }
  if (/^(paus\w*|par[ae]|suspend\w*|congel\w*|segur\w*)\b/.test(n) && agente(n)) {
    p('agent.pause', { agente: agente(n) }, `pausar ${agente(n)}`);
    return passos;
  }
  if ((/^(retom\w*|religa\w*|reativ\w*|despaus\w*|liga\w*|continu\w*)\b/.test(n) || /^(colo[cq]\w*|bot[ae]|poe|ponha|manda\w*)\b.*\b(para|pra) trabalhar\b/.test(n)
    || /^volt\w*\s+(a|com)\s+/.test(n)) && agente(n)) {
    p('agent.resume', { agente: agente(n) }, `retomar ${agente(n)}`);
    return passos;
  }

  // ── TAREFAS ───────────────────────────────────────────────────
  let m = n.match(/^(inspecion\w*|abr\w*|mostr\w*|ve|ver)\s+(a\s+)?tarefa\s+#?(\d+)/);
  if (m) { p('task.inspect', { id: Number(m[3]) }, `ver a tarefa ${m[3]}`); return passos; }
  m = n.match(/^tent\w*\s+de novo\b.*?(?:tarefa\s+#?(\d+))?$/);
  if (m) { p('task.retry', m[1] ? { id: Number(m[1]) } : {}, 'tentar de novo as tarefas travadas'); return passos; }

  // ── PROJETOS ──────────────────────────────────────────────────
  if (/^desarquiv\w*/.test(n)) { p('project.unarchive', { projeto: projetoDe(n) || 'este' }, 'desarquivar o projeto'); return passos; }
  if (/^arquiv\w*/.test(n)) { p('project.archive', { projeto: projetoDe(n) || 'este' }, 'arquivar o projeto'); return passos; }
  if (/^cancel\w*\s+(o\s+|este\s+|esse\s+)?projeto/.test(n)) { p('project.cancel', { projeto: projetoDe(n) || 'este' }, 'cancelar o projeto'); return passos; }
  if (/^(encerr\w*|finaliz\w*|conclu\w*|termin\w*|da\s+(como\s+)?(concluido|encerrado))\b/.test(n) && /\b(projeto|trabalho)\b|^(encerr\w*|finaliz\w*|conclu\w*)\s+(o|a)\s+\S/.test(n)) {
    p('project.close', { projeto: projetoDe(n) || n.replace(/^\S+\s+(o|a)\s+/, '') }, 'encerrar o projeto');
    return passos;
  }
  if (/^(abr\w*|mostr\w*|exib\w*|ve|ver|entr\w*\s+n[oa])\b.*\b(projeto|ficha|cliente)\s+(d[aoe]s?|para)\s+\S/.test(n)
    || /^(abr\w*|mostr\w*)\s+(este|esse)\s+projeto\b/.test(n)) {
    p('project.open', { projeto: projetoDe(n) }, 'abrir o projeto');
    return passos;
  }

  // ── FECHAR ────────────────────────────────────────────────────
  if (/^(fech\w*|feche|sai\w*\s+d[ae]|escond\w*|tir\w*)\b/.test(n)) {
    if (/\b(imersao|tela cheia)\b/.test(n)) return null; // a imersão é com o próprio Jarvis
    if (/\bprojeto\b/.test(n)) { p('project.fechar', { projeto: projetoDe(n) }, 'fechar o projeto'); return passos; }
    if (/\b(janelas|graficos|todas)\b/.test(n)) { p('panel.close', { qual: 'janelas' }, 'fechar as janelas soltas'); return passos; }
    const qual = /\b(ficha|detalhes?|painel de detalhes)\b/.test(n) ? 'ficha' : /\b(gaveta|lateral|conversa)\b/.test(n) ? 'gaveta'
      : /\b(grafico|apresentacao|slides?|palco)\b/.test(n) ? 'palco' : 'auto';
    if (/\b(janela|isso|isto|ficha|detalhes?|painel|modal|dialogo|tela|aba|gaveta|grafico|apresentacao|slides?|aqui|ela|ele)\b/.test(n) || /^(fech\w*|feche)$/.test(n)) {
      p('panel.close', { qual }, 'fechar a janela');
      return passos;
    }
    return null;
  }

  // ── NAVEGAR ───────────────────────────────────────────────────
  if (/^(volt\w*|retorn\w*)\b/.test(n)) {
    const destino = n.replace(/^(volt\w*|retorn\w*)\s*/, '');
    if (!destino || /^(atras|para tras|pra tras|a pagina anterior|a tela anterior|uma tela|um pouco)$/.test(destino)) { p('navigation.back', {}, 'voltar'); return passos; }
    const tela = pagina(destino);
    if (tela && /^(para|pra|pro|ao|a|no|na|pras?)\b/.test(destino)) { p('navigation.open', { tela }, `voltar para ${tela}`); return passos; }
    return null;
  }
  if (/^(abr\w*|mostr\w*|exib\w*|vai|va|ir|leva\w*|entr\w*|me mostr\w*|quero ver|traz\w*)\b/.test(n)) {
    const tela = pagina(n.replace(/^\S+\s*/, ''));
    if (tela) {
      p('navigation.open', { tela }, `abrir ${tela}`);
      return passos;
    }
  }
  return null;
}

/**
 * A fala inteira → { passos, interpretacao } | null.
 * null: algum pedaço não é comando conhecido; o modelo resolve a fala toda.
 */
export function interpreta(fala) {
  const pedacos = separa(fala);
  if (!pedacos.length || pedacos.length > 8) return null;
  const passos = [];
  for (const pedaco of pedacos) {
    const r = umPedaco(pedaco);
    if (!r) return null;
    passos.push(...r);
  }
  // Abrir a mesma tela duas vezes seguidas (o "mostra" de dois pedidos) é um passo só.
  const limpos = passos.filter((x, i) => !(i && x.acao === 'navigation.open' && passos[i - 1].acao === 'navigation.open'
    && x.parametros.tela === passos[i - 1].parametros.tela));
  return { passos: limpos, interpretacao: limpos.map((x) => x.acao).join(' → ') };
}
