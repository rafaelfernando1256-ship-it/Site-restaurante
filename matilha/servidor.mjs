/**
 * O SERVIDOR LOCAL — a Matilha rodando no seu notebook.
 *
 * Os mesmos quatro agentes da versão da Netlify, sem mudar uma linha
 * deles: cada um já é uma função que recebe um Request e devolve um
 * Response, e o Node 18+ tem os dois nativos. O que muda aqui é o que
 * está em volta — os dados num arquivo, e a ponte do WhatsApp Web.
 *
 * ONDE ELE ESCUTA. No notebook, em 127.0.0.1, sem tranca nenhuma — é
 * a sua própria máquina. Na rede de casa, para o celular alcançar, com
 * um PIN de seis dígitos na porta. Fora do seu wi-fi, nada alcança o
 * painel: ele não é um site na internet. Os detalhes e os limites
 * disso estão em celular.mjs, escritos sem enfeite.
 */
import { createServer } from 'node:http';
import { readFile, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { abreInstalacao, abreLogin, conferePronto, estatisticas, pausadoAte } from './agentes/claude-cli.mjs';
import { RegistroDeAcoes } from './agentes/acoes.mjs';
import { texto } from './agentes/comum.mjs';
import { PonteDaTela } from './agentes/ui-ponte.mjs';
import { financeiro, montaOperador, situacaoDoProjeto } from './agentes/operador.mjs';
import { conversa } from './agentes/vendedor.mjs';
import { ConfigClaude, MODELOS } from './config-claude.mjs';
import { CacadorNavegador } from './agentes/maps.mjs';
import { Matilha, MAX_CACADORES, PADRAO_CACADORES } from './agentes/matilha.mjs';
import { gravaChaves, leChaves } from './chaves.mjs';
import { Dados } from './dados.mjs';
import { Fluxo } from './fluxo.mjs';
import { Operacao } from './operacao.mjs';
import { Celular, biscoito, ehLocal, enderecosNaRede, paginaDoPIN } from './celular.mjs';
import { qrSVG } from './qr.mjs';
import { Tunel } from './tunel.mjs';
import { WhatsApp, casaComLead } from './navegador.mjs';
import { printsDoRamo, todasAsListas } from './agentes/referencias.mjs';
import { RAMOS_COM_REFERENCIA } from './agentes/roteiro.mjs';
import { ACOES, perguntaAoChefe, resumo as resumoDaMatilha } from './agentes/chefe.mjs';
import { Jarvis, transcreve } from './agentes/jarvis.mjs';
import { Trabalhos } from './agentes/trabalhos.mjs';
import { apertaTelaCheia } from './agentes/computador.mjs';
import { Tela, cola, falaNoNotebook } from './agentes/tela.mjs';
import { Atalhos, TECLAS } from './agentes/atalhos.mjs';
import { Lancador } from './agentes/lancador.mjs';
import { Voz } from './agentes/voz.mjs';
import { completaAsCopiadas, instala as instalaSkills, situacao as situacaoDasSkills } from './agentes/skills.mjs';
import { cardapioEmTexto } from './agentes/cardapio.mjs';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const PUBLICO = join(RAIZ, 'public');
const PASTA_DADOS = join(RAIZ, 'dados');
const ENV = join(RAIZ, '.env');
const PORTA = Number(process.env.PORTA) || 8899;
// A porta do túnel: vizinha da do painel, só no 127.0.0.1, e o
// cloudflared é a única coisa que fala com ela.
const PORTA_TUNEL = PORTA + 1;

const TIPOS = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
                '.json': 'application/json', '.svg': 'image/svg+xml',
                '.png': 'image/png', '.ico': 'image/x-icon', '.txt': 'text/plain',
                '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
                '.webmanifest': 'application/manifest+json' };

const dados = new Dados(join(PASTA_DADOS, 'dados.json'));
// "Conectar Claude para WhatsApp": o que ficou escolhido, num arquivo só dele.
const configClaude = new ConfigClaude(join(PASTA_DADOS, 'claude.json'));
const celular = new Celular(join(PASTA_DADOS, 'celular.json'));

// O túnel escuta numa SEGUNDA porta, só dele, no 127.0.0.1. Quem
// chega por ali veio da internet — e isso o servidor sabe pela porta,
// não por cabeçalho, que qualquer um pode forjar.
let tunelAndamento = { etapa: 'parado' };
const tunel = new Tunel({
  pasta: join(PASTA_DADOS, 'cloudflared'),
  aoAndar: (passo) => { tunelAndamento = passo; },
});
const zap = new WhatsApp({ pasta: join(PASTA_DADOS, 'navegador') });
// Perfil separado do WhatsApp de propósito: a sessão de um não se
// mistura com a navegação do outro.
let andamento = { etapa: 'parado' };
const cacador = new CacadorNavegador({
  pasta: join(PASTA_DADOS, 'navegador-cacador'),
  aoAndar: (passo) => { andamento = passo; },
});

// ── AGENTE 1: a matilha de dez ────────────────────────────────────
let matilhaAndamento = { etapa: 'parado' };
/** O andamento da caçada, e quantas janelas de caçador estão abertas agora. */
const comoEstaAMatilha = () => ({ ...matilhaAndamento, janelas: matilha.janelasAbertas() });
const matilha = new Matilha({
  pasta: join(PASTA_DADOS, 'navegador-matilha'),
  cacadores: PADRAO_CACADORES,
  aoAndar: (passo) => { matilhaAndamento = passo; },
});

/**
 * A PONTE COM A NETLIFY.
 *
 * O publicador é uma função HTTP (ela também roda na Netlify, onde é
 * uma função de verdade). Aqui dentro nós a chamamos direto, montando
 * o Request na mão — o mesmo truque que o resto do servidor usa para
 * não manter duas versões de cada agente.
 */
async function publicaNaNetlify(lead, html, versao) {
  const { default: publicar } = await import('./agentes/publicar.mjs');
  const pedido = new Request('http://127.0.0.1/api/publicar', {
    method: 'POST',
    headers: { 'content-type': 'application/json',
               'x-orbita-senha': process.env.PAINEL_SENHA || 'local' },
    body: JSON.stringify({ lead, html, versao }),
  });
  const resposta = await publicar(pedido);
  const saida = await resposta.json();
  if (!resposta.ok) throw new Error(saida?.erro || 'A Netlify recusou.');

  // A Netlify leva alguns segundos processando depois do upload.
  // Mandar o link antes disso é mandar um link quebrado para o
  // cliente — então esperamos a página responder antes de seguir.
  for (let tentativa = 0; tentativa < 10; tentativa += 1) {
    try {
      const olhada = await fetch(saida.url, { method: 'HEAD' });
      if (olhada.ok) break;
    } catch { /* ainda subindo */ }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return saida;
}

/** Tira uma prévia do ar — é o que torna a validade uma validade. */
publicaNaNetlify.derruba = async (siteId) => {
  const token = (process.env.NETLIFY_TOKEN || '').trim();
  if (!token || !siteId) return;
  const resposta = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  });
  // Sem esta conferência, um erro da Netlify marcava a prévia como
  // "saiu do ar" com ela ainda no ar. 404 é "já não existe": tudo bem.
  if (!resposta.ok && resposta.status !== 404) throw new Error(`a Netlify respondeu ${resposta.status} ao tirar do ar`);
};

// ── O FLUXO: o que roda sozinho ───────────────────────────────────
const operacao = new Operacao(join(PASTA_DADOS, 'operacao.json'));

/**
 * Uma leva de buscas da matilha, com entrega na hora.
 *
 * O caçador do fluxo pede uma busca por caçador, e as abas correm
 * juntas. Cada negócio chega no segundo em que é lido — `aoAchar` é
 * repassado direto para a matilha. Reaproveita o MESMO navegador do
 * botão "Caçar agora": duas janelas de Chrome abertas para a mesma
 * coisa seria o dobro da memória pelo mesmo trabalho.
 */
async function umaBusca({ buscas, cacadores, aoAchar }) {
  // Quem já está no funil não precisa ser aberto de novo.
  matilha.conhece((dados.tudo().leads || []).map((l) => l.maps));
  matilha.aoAchar = aoAchar;
  try {
    return await matilha.caca({ buscas, cacadores });
  } finally {
    matilha.aoAchar = null;
  }
}

/**
 * Liga um domínio comprado por você ao site oficial do cliente. A compra
 * (no Registro.br, por exemplo) exige o seu CPF ou CNPJ e pagamento, e
 * por isso é sua; o resto a Matilha faz: avisa a Netlify e diz exatamente
 * o que apontar no DNS.
 */
async function ligaDominio(id, dominioPedido) {
  const dominio = String(dominioPedido || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(dominio)) throw new Error('Domínio inválido. Escreva só o endereço, ex.: pizzariabaggio.com.br');
  const lead = (dados.tudo().leads || []).find((l) => l.id === id);
  const site = lead?.sites?.oficial;
  if (!site?.site_id) throw new Error('Este cliente ainda não tem o site oficial no ar.');
  const token = (process.env.NETLIFY_TOKEN || '').trim();
  if (!token) throw new Error('Falta o NETLIFY_TOKEN em Ajustes › Chaves.');
  const resposta = await fetch(`https://api.netlify.com/api/v1/sites/${site.site_id}`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ custom_domain: dominio, domain_aliases: [`www.${dominio}`] }),
  });
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(corpo.message || `a Netlify respondeu ${resposta.status}`);
  const nomeNetlify = String(site.url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  // O endereço só passa a valer (link do cliente, QR Code) quando o agente
  // do domínio conferir que ele abre com cadeado.
  return {
    dominio,
    dns: [
      `No painel onde você comprou ${dominio} (no Registro.br: "DNS" → "Editar zona"), crie:`,
      `· um registro A para ${dominio} apontando para 75.2.60.5`,
      `· um registro CNAME para www.${dominio} apontando para ${nomeNetlify}`,
      'O cadeado (https) a Netlify põe sozinha quando o DNS propagar, em até algumas horas.',
    ],
  };
}

/**
 * O que o chefe pode fazer: os mesmos botões do painel, e só eles. Quem
 * chega aqui já confirmou (o painel pede confirmação nas ações que
 * mandam mensagem para alguém).
 */
async function executaDoChefe(acao, parametros = {}) {
  if (!ACOES[acao] || acao === 'nenhuma') throw new Error('Ação desconhecida.');
  const op = operacao.estado(dados.tudo().leads || []);
  const lista = (v) => (Array.isArray(v) ? v.join(', ') : String(v || '')).trim();
  if (acao === 'soltar_matilha') {
    const ramos = lista(parametros.ramos) || [...new Set((op.buscas || []).map((b) => b.termo))].join(', ');
    const cidades = lista(parametros.cidades) || [...new Set((op.buscas || []).map((b) => b.cidade))].join(', ');
    if (!ramos || !cidades) throw new Error('Diga pelo menos um ramo e uma cidade.');
    await fluxo.comecaOperacao({ ...op.meta, ramos, cidades,
      vendas: Number(parametros.vendas) || op.meta?.vendas, cacadores: Number(parametros.cacadores) || op.meta?.cacadores });
    return { feito: `Matilha solta: ${ramos} em ${cidades}.` };
  }
  if (acao === 'recolher_matilha') {
    await fluxo.paraOperacao('você pediu ao chefe');
    return { feito: 'Matilha recolhida. Quem já está conversando continua sendo respondido.' };
  }
  if (acao === 'liberar_contatos') {
    const fila = (dados.tudo().leads || []).filter((l) => l.estagio === 'aguardando_voce')
      .sort((a, b) => (b.pontuacao || 0) - (a.pontuacao || 0));
    const quantos = parametros.todos ? fila.length : Math.max(1, Number(parametros.quantos) || fila.length);
    const r = await fluxo.liberaPrimeiroContato(fila.slice(0, quantos).map((l) => l.id));
    return { feito: `${r.postas} primeiro(s) contato(s) na caixa do vendedor, com respiro entre eles.${r.erros?.[0] ? ` ${r.erros[0]}` : ''}` };
  }
  if (acao === 'tentar_de_novo') {
    const travadas = fluxo.estado().mural?.travadas || [];
    for (const t of travadas) await fluxo.destrava(t.id);
    return { feito: `${travadas.length} tarefa(s) de volta para a fila.` };
  }
  if (acao === 'cacar_sem_abordar') {
    const ramos = lista(parametros.ramos);
    const cidades = lista(parametros.cidades);
    if (!ramos || !cidades) throw new Error('Diga o ramo e a cidade.');
    // Roda em segundo plano: a caçada leva alguns minutos, e quem acha
    // entra no funil como "achado", sem mensagem nenhuma.
    matilha.caca({ ramos, cidades, porBusca: 20 }).then((saida) => fluxo.comOsDados(async (tudo) => {
      tudo.leads = tudo.leads || [];
      for (const a of saida.leads || []) {
        if (tudo.leads.some((l) => (a.maps && l.maps === a.maps) || (a.whatsapp && l.whatsapp === a.whatsapp))) continue;
        tudo.leads.push({ ...a, id: String(Math.random()).slice(2, 10), estagio: 'novo', criado: Date.now(), conversa: [], sites: {},
          pontuacao: a.pontos ?? null });
      }
    })).catch(() => {});
    return { feito: `Caçando ${ramos} em ${cidades}, sem abordar ninguém. Quem eu achar aparece em Clientes, como "achado".` };
  }
  return { feito: 'Feito.' };
}

/** Vendas desde segunda-feira, 0h. */
function vendidasNaSemana(leads) {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  return leads.filter((l) => Number(l?.vendeu_em) >= inicio.getTime()).length;
}

/** O que os agentes sabem do seu negócio, lido na hora de cada tarefa. */
function ajustesAtuais() {
  const guardados = dados.tudo().ajustes || {};
  return {
    autor: guardados.autor || '',
    preco: guardados.preco || '',
    // A mensalidade que o vendedor informa. Valor padrão, editável
    // no painel.
    mensalidade: guardados.mensalidade || 'R$ 127 por mês',
    // COMO e O QUE cobrar. 'mensal' = só mensalidade, fazer incluído.
    // 'setup_mais_mensal' = paga para fazer + manutenção por mês.
    cobranca: guardados.cobranca || 'setup_mais_mensal',
    ofertas: guardados.ofertas || {},
    nichosComida: guardados.nichosComida || '',
    // O que a mensalidade cobre e como se paga: escrito por você. Sem
    // isso o vendedor só diz que a mensalidade mantém o site no ar, e
    // na hora de fechar avisa que você passa os dados do pagamento.
    inclui: guardados.inclui || '',
    pagamento: guardados.pagamento || '',
    // Lembretes automáticos para quem ficou calado (ligados por padrão).
    lembretes: guardados.lembretes || {},
    // O cobrador da mensalidade e o relatório do mês (ligados por padrão).
    cobrador: guardados.cobrador !== false,
    // O teste A/B do primeiro contato (ligado por padrão).
    testeAB: guardados.testeAB !== false,
    relatorio: guardados.relatorio !== false,
    prazo: guardados.prazo || '',
    // Escassez real: o número que VOCÊ põe aqui é o único que o
    // vendedor tem permissão de citar. Em branco, ele não fala em
    // vaga nenhuma.
    vagas: Number(guardados.vagas) || 0,
    // Quantos sites oficiais você pega por semana (3, se você não mudou),
    // e quantos já foram vendidos nesta semana: é o que torna a escassez
    // verdadeira, e por isso o vendedor pode falar dela.
    vagasSemana: guardados.vagasSemana === undefined ? 3 : Number(guardados.vagasSemana) || 0,
    vendidasNaSemana: vendidasNaSemana(dados.tudo().leads || []),
    chavePix: guardados.chavePix || '',
    referencias: guardados.referencias || {},
    diasDaPrevia: Number(guardados.diasDaPrevia) || 7,
    // De que horas até que horas cada coisa acontece. Duas janelas:
    // FALAR com cliente é comercial; TRABALHAR (caçar, montar site,
    // publicar) é larga, porque não incomoda ninguém.
    horarios: guardados.horarios || {},
    // Quem escreve as mensagens: o Claude (pela sua assinatura) ou o Groq.
    vendedor: configClaude.atual(),
  };
}

const fluxo = new Fluxo({
  dados,
  zap,
  publica: publicaNaNetlify,
  operacao,
  caca: umaBusca,
  pastaTrabalho: join(PASTA_DADOS, 'sites'),
  ajustes: ajustesAtuais,
  ligaDominio: (id, dominio) => ligaDominio(id, dominio),
});

// ── O JARVIS: o assistente do notebook, com a Matilha debaixo do braço ──
// O mural lido já na partida: o Jarvis e a Rede de agentes enxergam as tarefas mesmo com a matilha recolhida.
fluxo._muralPronto().catch((e) => console.log(`  ⚠ não li o mural: ${e.message}`));
fluxo.arquiteto().then(() => fluxo.analista()).catch((e) => console.log(`  ⚠ não li o Value Intelligence: ${e.message}`));
const trabalhos = new Trabalhos({ arquivo: join(PASTA_DADOS, 'jarvis-projetos.json'), diz: console.log });
const telaDoNotebook = new Tela({ pasta: join(PASTA_DADOS, 'telas') });
// A ficha que o Claude Code (pelo agentes/jarvis-mcp.mjs) mostra para usar as ferramentas do Jarvis. Nova a cada vez.
const FICHA_DO_CLAUDE = randomBytes(24).toString('hex');
// O CONTROLE TOTAL: o registro de ações (o que o Jarvis e o painel podem fazer, com permissão e
// auditoria), a ponte com a tela (o painel confirma cada mudança) e as ações reais sobre os agentes.
const registroDeAcoes = new RegistroDeAcoes({ arquivo: join(PASTA_DADOS, 'jarvis-execucoes.json'), diz: console.log });
const ponteDaTela = new PonteDaTela();
const operador = montaOperador({
  registro: registroDeAcoes, ponte: ponteDaTela, fluxo, dados, trabalhos,
  ajustes: ajustesAtuais, chefe: executaDoChefe, zap: () => zap.estado(), claude: () => ({ pausadoAte: pausadoAte() }),
  abrePasta: async (caminho) => (await import('./agentes/computador.mjs')).FERRAMENTAS.abrir_arquivo_ou_pasta.faz({ caminho }),
});
const jarvis = new Jarvis({
  operador: { registro: registroDeAcoes, ponte: ponteDaTela },
  arquivo: join(PASTA_DADOS, 'jarvis.json'),
  trabalhos,
  claude: { pasta: join(PASTA_DADOS, 'jarvis-cerebro'), url: `http://127.0.0.1:${PORTA}`, ficha: FICHA_DO_CLAUDE },
  tela: telaDoNotebook,
  diz: console.log,
  matilha: {
    acoes: ACOES,
    estado: () => resumoDaMatilha({ ...fluxo.estado(), matilha: comoEstaAMatilha() }, dados.tudo().leads || [], zap.estado()),
    executa: (acao, parametros) => executaDoChefe(acao, parametros),
    leads: () => dados.tudo().leads || [],
  },
});
// A voz do Jarvis: a que você escolheu, a mesma no notebook, no celular e no atalho.
const voz = new Voz({ arquivo: join(PASTA_DADOS, 'jarvis-voz.json'), pastaLocal: join(PASTA_DADOS, 'vozes-locais'), diz: console.log });
// Os atalhos de qualquer programa: Ctrl+Alt+Espaço (falar com o Jarvis) e Ctrl+Alt+D (ditado).
const atalhos = new Atalhos({
  pasta: join(PASTA_DADOS, 'telas'),
  diz: console.log,
  aoFalar: async ({ modo, audio, tela }) => {
    const fala = (await transcreve(audio, 'audio/wav')).trim();
    if (!fala) return;
    if (modo === 'ditado') {
      // Ditado é você escolhendo onde escrever: vai para a janela da frente, sem Enter no fim.
      const r = await cola(fala, { recusaTerminal: false });
      console.log(`  ✦ ditado: ${r}`);
      return;
    }
    jarvis.ultimaTela = tela ? { nome: tela, quando: Date.now(), usada: false } : null;
    let r;
    try { r = await jarvis.conversa(fala, { origem: 'atalho' }); } catch (e) { r = { resposta: e.message }; }
    let som = null;
    try { som = await voz.fala(r.resposta); } catch (e) { console.log(`  ⚠ voz do Jarvis: ${e.message} (falo com a voz do Windows)`); }
    await falaNoNotebook(r.resposta, { audio: som?.audio, extensao: som?.tipo === 'audio/wav' ? 'wav' : 'mp3', pasta: join(PASTA_DADOS, 'telas') });
    // O print do atalho só fica se foi usado para responder; senão, some na hora.
    if (tela && !jarvis.ultimaTela?.usada) unlink(join(PASTA_DADOS, 'telas', tela)).catch(() => {});
    telaDoNotebook.limpa();
  },
});
// O celular de qualquer lugar: o lançador fixo na Netlify acompanha o endereço do túnel.
const lancador = new Lancador({ arquivo: join(PASTA_DADOS, 'celular-lancador.json'), pastaPublica: PUBLICO, diz: console.log });
async function acompanhaOTunel() {
  if (!lancador.estado?.chave || !(process.env.NETLIFY_TOKEN || '').trim()) return;
  const url = tunel.estado().url;
  if (url) await lancador.atualiza({ url, pin: celular.pin }).catch(() => {});
}
let skillsInstalando = null;
const testesDeChave = {}; // o último teste de cada chave, para a tela Começar
// O Claude Code está conectado? Conferir custa dois comandos: uma vez a cada 2 minutos basta.
let claudeVisto = { quando: 0, pronto: null };
async function claudeConectado() {
  if (Date.now() - claudeVisto.quando > 120_000) {
    claudeVisto = { quando: Date.now(), pronto: claudeVisto.pronto };
    claudeVisto.pronto = (await conferePronto().catch(() => ({ pronto: false }))).pronto;
  }
  return claudeVisto.pronto;
}

/** As chaves moram no .env, do lado do servidor. O navegador nunca as vê. */
async function carregaEnv() {
  try {
    const texto = await readFile(join(RAIZ, '.env'), 'utf8');
    for (const linha of texto.split('\n')) {
      const limpo = linha.trim();
      if (!limpo || limpo.startsWith('#') || !limpo.includes('=')) continue;
      const [chave, ...resto] = limpo.split('=');
      const valor = resto.join('=').trim().replace(/^["']|["']$/g, '');
      if (chave.trim() && !process.env[chave.trim()]) process.env[chave.trim()] = valor;
    }
  } catch { /* sem .env, o painel avisa o que falta */ }
}

const json = (dados, status = 200) => new Response(JSON.stringify(dados), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' } });

/** Rodando local, a senha do painel é opcional: a tranca principal é o
 *  127.0.0.1. Se você definir PAINEL_SENHA, ela passa a valer também. */
function destrancado(pedido) {
  const esperada = (process.env.PAINEL_SENHA || '').trim();
  if (!esperada) return true;
  return (pedido.headers.get('x-orbita-senha') || '').trim() === esperada;
}

const AGENTES = { cacar: 'cacar', escrever: 'escrever', estudio: 'estudio', publicar: 'publicar' };

/* ── o Claude do vendedor ──────────────────────────────────────── */

// Conferir chama o `claude` duas vezes (versão e login): leva um ou
// dois segundos. O painel pergunta a cada poucos segundos, então a
// resposta fica guardada por um minuto, a menos que você peça de novo.
let ultimaConferencia = { quando: 0, saida: null };
async function confereClaude(refaz) {
  if (!refaz && ultimaConferencia.saida && Date.now() - ultimaConferencia.quando < 60_000) {
    return ultimaConferencia.saida;
  }
  const saida = await conferePronto();
  ultimaConferencia = { quando: Date.now(), saida };
  return saida;
}

async function estadoDoClaude(refaz) {
  const pronto = await confereClaude(refaz);
  return {
    ...pronto,
    ...configClaude.atual(),
    modelos: MODELOS,
    temGroq: Boolean((process.env.GROQ_API_KEY || '').trim()),
    ultimoTeste: configClaude.ultimoTeste,
    ...estatisticas(),
  };
}

/**
 * O teste do cartão: uma abordagem de verdade, escrita pelo Claude,
 * para um cliente seu (o mais recente do funil) ou, sem nenhum, para
 * um negócio de exemplo. NADA é enviado: a mensagem só aparece no
 * painel. Força o Claude, sem o Groq de reserva — é o Claude que está
 * sendo testado.
 */
async function testaOClaude() {
  const leads = (dados.tudo().leads || []).filter((l) => l?.nome);
  const recente = leads.sort((a, b) => (b.criado || 0) - (a.criado || 0))[0];
  const lead = recente || {
    nome: 'Pizzaria do exemplo', tipo: 'Pizzaria', cidade: 'Sarandi',
    nota: 4.7, avaliacoes: 180, site_proprio: false,
  };
  const ajustes = ajustesAtuais();
  const comecou = Date.now();
  let teste;
  try {
    const saida = await conversa({
      estagio: 'abordagem', lead, historico: [], autor: ajustes.autor,
      ajustes: { ...ajustes, vendedor: { ...configClaude.atual(), ligado: true, reservaGroq: false } },
    });
    teste = {
      quando: Date.now(), ok: true, cliente: lead.nome, exemplo: !recente,
      mensagem: saida.mensagem, revisar: saida.revisar, motor: saida.motor,
      segundos: Math.round((Date.now() - comecou) / 100) / 10,
    };
  } catch (e) {
    teste = { quando: Date.now(), ok: false, cliente: lead.nome, exemplo: !recente,
      erro: String(e.message).slice(0, 300) };
  }
  await configClaude.muda({ ultimoTeste: teste });
  return { ...(await estadoDoClaude(false)), teste };
}

async function rota(pedido, caminho, local) {
  const url = new URL(pedido.url);
  // ── os dados ────────────────────────────────────────────────────
  if (caminho === '/api/dados') {
    if (pedido.method === 'GET') return json(dados.tudo());
    const novo = await pedido.json().catch(() => null);
    if (!novo || typeof novo !== 'object') return json({ erro: 'JSON inválido.' }, 400);
    return json(await dados.guarda(novo));
  }

  // As mudanças do painel, aplicadas na mesma fila dos agentes. Antes o
  // painel mandava o estado INTEIRO e apagava o que um agente tinha
  // acabado de gravar (inclusive um "pare de me mandar mensagem").
  if (caminho === '/api/dados/mudancas') {
    const corpo = await pedido.json().catch(() => null);
    if (!corpo || typeof corpo !== 'object') return json({ erro: 'JSON inválido.' }, 400);
    await fluxo.aplicaMudancas(corpo);
    return json(dados.tudo());
  }

  // ── O CHEFE, no escritório ──────────────────────────────────────
  // ── o Jarvis ──
  if (caminho === '/api/jarvis' && pedido.method === 'POST') {
    const corpo = await pedido.json().catch(() => ({}));
    try { return json(await jarvis.conversa(corpo.mensagem, { origem: corpo.origem === 'painel' ? 'notebook' : local ? 'notebook' : 'celular', cliente: String(corpo.cliente || '') })); } catch (e) { return json({ erro: String(e.message).slice(0, 300) }, 400); }
  }
  // ── A PONTE DA TELA: o painel pega os comandos do Jarvis e devolve o estado de depois ──
  if (caminho === '/api/jarvis/ui/espera') {
    const cmd = await ponteDaTela.aguarda(url.searchParams.get('cliente'), { tipo: url.searchParams.get('tipo') === 'jarvis' ? 'jarvis' : 'painel' });
    return json(cmd || { nada: true });
  }
  if (caminho === '/api/jarvis/ui/estado' && pedido.method === 'POST') {
    const corpo = await pedido.json().catch(() => ({}));
    try { ponteDaTela.estado(corpo.cliente, corpo.estado, corpo.tipo === 'jarvis' ? 'jarvis' : 'painel'); } catch (e) { return json({ erro: e.message }, 400); }
    return json({ ok: true });
  }
  if (caminho === '/api/jarvis/ui/resultado' && pedido.method === 'POST') {
    const corpo = await pedido.json().catch(() => ({}));
    try { return json({ ok: ponteDaTela.resultado(corpo.cliente, corpo) }); } catch (e) { return json({ erro: e.message }, 400); }
  }
  // ── O REGISTRO DE AÇÕES: o catálogo, as execuções e a execução pelos botões do painel ──
  if (caminho === '/api/acoes') return json({ acoes: registroDeAcoes.catalogo() });
  if (caminho === '/api/acoes/executar' && pedido.method === 'POST') {
    const corpo = await pedido.json().catch(() => ({}));
    const passos = Array.isArray(corpo.passos) ? corpo.passos.slice(0, 10) : corpo.acao ? [{ acao: corpo.acao, parametros: corpo.parametros || {} }] : [];
    try {
      const exec = await registroDeAcoes.executaPlano(passos, {
        quem: 'painel', origem: 'painel', cliente: String(corpo.cliente || ''), comando: texto(corpo.comando || '', 300),
        ...(corpo.continua ? { continuaDe: corpo.continua } : {}),
        // O painel já perguntou (o botão de confirmar): o passo que parou fica autorizado.
        confirmados: new Set((Array.isArray(corpo.confirmados) ? corpo.confirmados : []).map(Number)),
      });
      return json({ execucao: exec });
    } catch (e) { return json({ erro: String(e.message).slice(0, 300) }, 400); }
  }
  if (caminho === '/api/jarvis/execucoes') return json({ execucoes: registroDeAcoes.ultimas(Number(url.searchParams.get('n')) || 40) });
  if (caminho.startsWith('/api/jarvis/execucoes/')) {
    const e = registroDeAcoes.execucao(decodeURIComponent(caminho.slice('/api/jarvis/execucoes/'.length)));
    if (!e) return json({ erro: 'Execução não encontrada.' }, 404);
    // As tarefas do mural que ela criou, com o estado de agora.
    const tarefas = e.passos.filter((p) => p.tarefa).map((p) => { const t = fluxo.mural.acha(p.tarefa.id); return t ? { id: t.id, setor: t.setor, tipo: t.tipo, estado: t.estado, erro: t.erro, resultado: t.resultado } : { id: p.tarefa.id, estado: 'saiu do mural' }; });
    return json({ execucao: e, tarefas });
  }
  // A REDE DE AGENTES: quem é quem, o que cada um está fazendo, o que está na caixa, e o Jarvis orquestrando.
  if (caminho === '/api/rede') {
    const e = fluxo.estado();
    const caixa = e.mural?.setores || {};
    const erros = operador.errosDosAgentes();
    const no = (id, nome, papel, extra = {}) => ({ id, nome, papel, caixa: caixa[id] || null, erros: erros[id] || [], ...extra });
    const t = Object.fromEntries((e.trabalhadores || []).map((x) => [x.setor, x]));
    const execucoes = registroDeAcoes.ultimas(40);
    const ultimoToque = {};
    for (const x of execucoes) for (const p of x.passos) { const a = p.agente === 'tela' ? null : p.agente; if (a && !ultimoToque[a]) ultimoToque[a] = x.inicio; }
    const leads = dados.tudo().leads || [];
    return json({
      ligado: e.ligado,
      operacao: e.operacao?.ligada || false,
      nos: [
        no('jarvis', 'Jarvis', 'orquestrador: recebe o seu comando e aciona os agentes', { trabalhador: { ligado: true }, execucoes: execucoes.length }),
        no('cacador', 'Prospecção', 'caçador: acha restaurantes sem site no Google Maps', { trabalhador: t.cacador }),
        no('valor', 'Value Intelligence', 'diz o que vale para cada restaurante, com evidência, e entrega o Value Brief', { trabalhador: t.valor }),
        no('ofertas', 'Offer Architect', 'monta a proposta de cada cliente', { trabalhador: t.ofertas }),
        no('vendedor', 'Vendedor', 'conversa pelo WhatsApp', { trabalhador: t.vendedor }),
        no('brand_strategist', 'Brand Strategist', 'briefing de marca do restaurante (do estúdio)', { trabalhador: { ligado: true, sob_pedido: true } }),
        no('estudio', 'Produção: estúdio', 'monta a demonstração e o site oficial', { trabalhador: t.estudio }),
        no('publicador', 'Produção: publicador', 'põe o site no ar', { trabalhador: t.publicador }),
        no('dominio', 'Domínio', 'o endereço .com.br', { trabalhador: t.dominio }),
        no('cobrador', 'Revenue Guardian', 'mensalidades e relatório do mês', { trabalhador: { ligado: ajustesAtuais().cobrador !== false, pausado: ajustesAtuais().cobrador === false } }),
        no('operacao', 'Operations Commander', 'a operação do dia: meta, freios, soltar e recolher', { trabalhador: { ligado: e.operacao?.ligada || false } }),
      ].map((n) => ({ ...n, tocado_pelo_jarvis: ultimoToque[n.id] || null })),
      // Quem passa tarefa para quem, pelo mural. O número é o que está na caixa de quem recebe.
      ligacoes: [['jarvis', 'valor'], ['cacador', 'valor'], ['valor', 'ofertas'], ['vendedor', 'valor'], ['jarvis', 'cacador'], ['jarvis', 'ofertas'], ['jarvis', 'vendedor'], ['jarvis', 'estudio'], ['jarvis', 'cobrador'], ['jarvis', 'operacao'], ['jarvis', 'brand_strategist'],
        ['operacao', 'cacador'], ['ofertas', 'vendedor'], ['vendedor', 'estudio'], ['brand_strategist', 'estudio'], ['estudio', 'publicador'], ['publicador', 'vendedor'],
        ['vendedor', 'dominio'], ['dominio', 'publicador'], ['cobrador', 'vendedor']].map(([de, para]) => ({ de, para, na_caixa: caixa[para]?.esperando || 0 })),
      tarefas: fluxo.mural.tarefas.filter((x) => x.estado !== 'feita').slice(-60).map((x) => ({ id: x.id, setor: x.setor, tipo: x.tipo, nome: x.dados?.nome || '', estado: x.estado, tentativas: x.tentativas, erro: x.erro, aviso: x.aviso || '', correlacao: x.dados?.correlacao || '' })),
      execucoes,
      projetos: { producao: leads.filter((l) => situacaoDoProjeto(l) === 'producao').length },
      // O rastro do Value Intelligence: tarefa → restaurante → benefícios → brief → oferta → para quem foi.
      valor: fluxo.valor ? fluxo.valor.lista().slice(0, 12).map((b) => ({
        brief_id: b.brief_id, versao: b.versao, restaurante: b.restaurant_name, produto: b.product_id, product_version: b.product_version,
        beneficios: b.prioritized_benefits.map((x) => x.feature), estado: b.estado, oferta_id: b.oferta_id, para: b.saida?.para || '',
        tarefa: b.saida?.tarefa || null, ms: b.ms, correlacao: b.correlacao, problemas: b.problemas || [],
        negociacao: (() => { const l = leads.find((x) => x.id === b.lead_id); return l ? { estagio: l.estagio, com_o_vendedor: l.value_brief?.brief_id === b.brief_id } : null; })(),
      })) : [],
    });
  }
  // ── VALUE INTELLIGENCE: a página (os botões chamam as ações do registro, em /api/acoes/executar) ──
  if (caminho === '/api/valor') {
    const v = await fluxo.arquiteto().then(() => fluxo.analista());
    const leads = dados.tudo().leads || [];
    const lead = url.searchParams.get('lead') ? leads.find((l) => l.id === url.searchParams.get('lead')) : null;
    const painel = v.painel(ajustesAtuais());
    return json({ ...painel,
      leads: leads.filter((l) => l.estagio !== 'perdido').map((l) => ({ id: l.id, nome: l.nome, tipo: l.tipo, cidade: l.cidade, estagio: l.estagio, vendeu_em: l.vendeu_em || null })),
      analise: lead ? v.analisaLead(lead, url.searchParams.get('produto') || v.briefDe(lead.id)?.product_id || '', ajustesAtuais()) : null,
      brief: lead ? v.briefDe(lead.id) : null,
      comparacao: lead ? v.compara(ajustesAtuais(), lead) : v.compara(ajustesAtuais()),
      trabalhador: fluxo.trabalhadores.find((x) => x.setor === 'valor')?.estado() || null,
    });
  }
  if (caminho === '/api/financeiro') {
    const f = financeiro(dados.tudo().leads || [], ajustesAtuais());
    return json({ ...f, cobrador: ajustesAtuais().cobrador !== false });
  }
  // As ferramentas do Jarvis para o Claude Code: só do próprio notebook, e só com a ficha desta vez.
  if (caminho.startsWith('/api/jarvis/mcp/')) {
    if (!local || pedido.headers.get('x-jarvis-ficha') !== FICHA_DO_CLAUDE) return json({ erro: 'Sem a ficha do Jarvis.' }, 403);
    if (caminho === '/api/jarvis/mcp/ferramentas') { await jarvis.carregado; return json({ ferramentas: jarvis.ferramentasParaMcp() }); }
    if (caminho === '/api/jarvis/mcp/chama') {
      const corpo = await pedido.json().catch(() => ({}));
      return json({ resultado: String(await jarvis.chamaPeloMcp(String(corpo.nome || ''), corpo.argumentos || {})) });
    }
  }
  // A voz: a lista para escolher, a escolha, e o texto virando MP3 (a página toca).
  if (caminho === '/api/jarvis/vozes') return json(await voz.lista());
  if (caminho === '/api/jarvis/voz/escolher' && pedido.method === 'POST') {
    const corpo = await pedido.json().catch(() => ({}));
    return json({ escolha: await voz.escolhe(corpo) });
  }
  if (caminho === '/api/jarvis/falar' && pedido.method === 'POST') {
    const corpo = await pedido.json().catch(() => ({}));
    try {
      const som = await voz.fala(corpo.texto, corpo.id ? { id: corpo.id, tom: corpo.tom, velocidade: corpo.velocidade } : null);
      if (!som) return new Response(null, { status: 204 });
      return new Response(som.audio, { headers: { 'content-type': som.tipo, 'cache-control': 'no-store' } });
    } catch (e) { return json({ erro: String(e.message).slice(0, 200), instalando: Boolean(e.instalando) }, e.instalando ? 409 : 502); }
  }
  if (caminho === '/api/jarvis/voz/instalar' && pedido.method === 'POST') {
    voz.kokoro?.instala();
    return json(voz.kokoro?.estado() || { erro: 'indisponível' });
  }
  if (caminho === '/api/jarvis/cerebro' && pedido.method === 'POST') {
    const corpo = await pedido.json().catch(() => ({}));
    return json({ cerebro: await jarvis.escolheCerebro(corpo.cerebro, { modelo: corpo.modelo, esforco: corpo.esforco }), modo: jarvis.modoClaude() });
  }
  if (caminho === '/api/jarvis/estado') {
    return json({ ...(await jarvis.estado()), skills_instalando: Boolean(skillsInstalando),
      ligacoes: { groq: Boolean((process.env.GROQ_API_KEY || '').trim()), claude: await claudeConectado(),
        atalhos: { ...atalhos.situacao, teclas: TECLAS } } });
  }
  if (caminho === '/api/jarvis/ouvir') {
    try {
      const audio = Buffer.from(await pedido.arrayBuffer());
      if (audio.length < 1500) return json({ texto: '' });
      return json({ texto: await transcreve(audio, pedido.headers.get('content-type') || 'audio/webm') });
    } catch (e) { return json({ erro: String(e.message).slice(0, 300) }, 400); }
  }
  // A imersão pede tela cheia de verdade (F11) quando o Chrome não deixa a
  // página pedir sozinha. Só do próprio notebook: do celular, apertar F11
  // no notebook seria mexer na tela de outra pessoa.
  if (caminho === '/api/jarvis/tela-cheia' && pedido.method === 'POST') {
    if (!local) return json({ ok: false });
    return json({ ok: await apertaTelaCheia() });
  }
  // O último gráfico/3D/print que foi para a tela: o celular e o notebook mostram o mesmo.
  if (caminho === '/api/jarvis/visual') {
    const v = jarvis.visual(url.searchParams.get('id') || '');
    return v ? json(v) : json({ erro: 'Nada na tela.' }, 404);
  }
  // Os prints da tela do notebook (só o nome do arquivo; nada de caminho).
  if (caminho.startsWith('/api/jarvis/tela/')) {
    const nome = caminho.slice('/api/jarvis/tela/'.length);
    if (!/^tela-\d+\.jpg$/.test(nome)) return json({ erro: 'Print não encontrado.' }, 404);
    try {
      return new Response(await readFile(join(PASTA_DADOS, 'telas', nome)), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' } });
    } catch { return json({ erro: 'Print não encontrado (são apagados depois de um dia).' }, 404); }
  }
  // Ligar o celular: abre o caminho de fora de casa (e deixa sempre aberto) e devolve o QR.
  if (caminho === '/api/jarvis/celular') {
    if (!local) return json({ erro: 'Isto só aparece no notebook.' }, 403);
    const temNetlify = Boolean((process.env.NETLIFY_TOKEN || '').trim());
    if (pedido.method === 'GET') {
      return json({ ligado: Boolean(lancador.estado?.chave), link: lancador.estado?.url || '', tunel: tunel.estado().url, temNetlify, erro: lancador.erro });
    }
    const corpo = await pedido.json().catch(() => ({}));
    await celular.guardaSempre(true);
    let url;
    try { url = (await tunel.liga(PORTA_TUNEL)).url; } catch (e) { return json({ erro: `não abri o caminho de fora de casa: ${e.message}` }, 502); }
    if (!url) return json({ erro: tunel.estado().erro || 'o caminho de fora de casa não abriu' }, 502);
    if (!temNetlify) {
      return json({ fixo: false, qr: qrSVG(`${url}/jarvis.html?pin=${celular.pin}`, { rotulo: 'QR code do Jarvis' }),
        aviso: 'Sem a chave da Netlify, este QR vale até a Matilha reiniciar. Ponha o NETLIFY_TOKEN em Ajustes › Chaves para o celular acompanhar sozinho.' });
    }
    if (!lancador.estado?.chave || corpo.novo) await lancador.novaChave();
    const ok = await lancador.atualiza({ url, pin: celular.pin }, { forca: true });
    if (!ok) return json({ erro: `não consegui criar o endereço fixo na Netlify: ${lancador.erro}` }, 502);
    return json({ fixo: true, link: lancador.estado.url, qr: qrSVG(lancador.enderecoDoQR(), { rotulo: 'QR code do Jarvis no celular' }) });
  }
  if (caminho === '/api/jarvis/esquecer') { await jarvis.esquece(); return json({ ok: true }); }
  if (caminho === '/api/jarvis/skills') {
    if (pedido.method === 'POST') {
      if (!local) return json({ erro: 'Instale as skills pelo painel no próprio notebook.' }, 403);
      if (!skillsInstalando) skillsInstalando = instalaSkills(console.log).finally(() => { skillsInstalando = null; });
      return json({ feitos: await skillsInstalando });
    }
    return json({ pacote: await situacaoDasSkills(), instalando: Boolean(skillsInstalando) });
  }
  if (caminho === '/api/jarvis/abrir') {
    const corpo = await pedido.json().catch(() => ({}));
    const t = trabalhos.acha(corpo.id);
    if (!t) return json({ erro: 'Projeto não encontrado.' }, 404);
    const { FERRAMENTAS } = await import('./agentes/computador.mjs');
    return json({ feito: await FERRAMENTAS.abrir_arquivo_ou_pasta.faz({ caminho: corpo.arquivo ? join(t.pasta, corpo.arquivo) : t.pasta }) });
  }

  // ── AGENTE 4: OFFER ARCHITECT (a aba Ofertas inteligentes) ─────
  if (caminho.startsWith('/api/ofertas')) {
    const arq = await fluxo.arquiteto();
    const corpo = pedido.method === 'POST' ? await pedido.json().catch(() => ({})) : {};
    try {
      if (caminho === '/api/ofertas' && pedido.method === 'GET') {
        await arq.atualizaResultados(dados.tudo().leads || []);
        await arq.sugere();
        return json({ ...arq.painel(), relatorio: arq.relatorio(),
          trabalhador: fluxo.trabalhadores.find((t) => t.setor === 'ofertas')?.estado() || null,
          caixa: fluxo.mural.estado().setores.ofertas || null });
      }
      if (caminho === '/api/ofertas/catalogo') return json(await arq.salvaCatalogo(corpo.catalogo || {}, ajustesAtuais()));
      if (caminho === '/api/ofertas/pacote') return json({ pacote: await arq.aprovaPacote(String(corpo.chave || ''), corpo.aprovado !== false) });
      if (caminho === '/api/ofertas/gerar') {
        const lead = (dados.tudo().leads || []).find((l) => l.id === corpo.leadId);
        if (!lead) return json({ erro: 'Cliente não encontrado.' }, 404);
        await fluxo.ligaOfertas();
        await fluxo.pedeOferta(lead, { produto: ['site', 'cardapio'].includes(corpo.produto) ? corpo.produto : '', refazer: true });
        return json({ ok: true, recado: `Na caixa do Offer Architect: a oferta de ${lead.nome} sai em instantes.` });
      }
      if (caminho === '/api/ofertas/esperando') {
        await fluxo.ligaOfertas();
        return json(await fluxo.ofertasParaQuemEspera());
      }
      if (caminho === '/api/ofertas/aprovar') return json({ oferta: await arq.aprova(corpo.id, { versao: Number.isInteger(corpo.versao) ? corpo.versao : undefined }) });
      if (caminho === '/api/ofertas/rejeitar') return json({ oferta: await arq.rejeita(corpo.id, corpo.motivo) });
      if (caminho === '/api/ofertas/editar') return json({ oferta: await arq.edita(corpo.id, Number(corpo.versao) || 0, corpo.campos || {}) });
      if (caminho === '/api/ofertas/enviar') return json(await fluxo.enviaOferta(corpo.id));
      if (caminho === '/api/ofertas/sugestao') return json({ sugestao: await arq.marcaSugestao(corpo.id, corpo.estado) });
    } catch (e) { return json({ erro: String(e.message).slice(0, 300) }, 400); }
    return json({ erro: 'Rota de ofertas desconhecida.' }, 404);
  }

  if (caminho === '/api/chefe') {
    const corpo = await pedido.json().catch(() => ({}));
    if (!String(corpo.mensagem || '').trim()) return json({ erro: 'Escreva alguma coisa para o chefe.' }, 400);
    const estado = { ...fluxo.estado(), matilha: comoEstaAMatilha() };
    return json(await perguntaAoChefe({ mensagem: corpo.mensagem, historico: corpo.historico || [], estado,
      leads: dados.tudo().leads || [], zap: zap.estado(), config: configClaude.atual() }));
  }
  if (caminho === '/api/chefe/executar') {
    const corpo = await pedido.json().catch(() => ({}));
    try { return json(await executaDoChefe(corpo.acao, corpo.parametros || {})); }
    catch (e) { return json({ erro: String(e.message).slice(0, 300) }, 400); }
  }

  // ── as referências do estúdio ───────────────────────────────────
  if (caminho === '/api/referencias') {
    const ajustes = dados.tudo().ajustes || {};
    const situacao = {};
    for (const { chave } of RAMOS_COM_REFERENCIA) {
      try {
        const meta = JSON.parse(await readFile(join(PASTA_DADOS, 'referencias', chave, 'meta.json'), 'utf8'));
        situacao[chave] = { quando: meta.quando, ok: meta.ok.map((r) => ({ url: r.url, arquivo: r.computador.split(/[\\/]/).pop() })), falhas: meta.falhas };
      } catch { situacao[chave] = null; }
    }
    return json({ listas: todasAsListas(ajustes), situacao });
  }
  if (caminho === '/api/referencias/prints') {
    if (!local) return json({ erro: 'Isto só roda no notebook.' }, 403);
    const corpo = await pedido.json().catch(() => ({}));
    const ajustes = dados.tudo().ajustes || {};
    const ramos = corpo.ramo ? [corpo.ramo] : RAMOS_COM_REFERENCIA.map((r) => r.chave);
    const saida = {};
    for (const ramo of ramos) {
      try { saida[ramo] = (await printsDoRamo(ramo, { pastaDados: PASTA_DADOS, ajustes, refaz: true })).length; }
      catch (e) { saida[ramo] = `erro: ${String(e.message).slice(0, 120)}`; }
    }
    return json(saida);
  }
  if (caminho === '/api/referencias/imagem') {
    const ramo = String(url.searchParams.get('ramo') || '').replace(/[^a-z]/g, '');
    const arquivo = String(url.searchParams.get('arquivo') || '').replace(/[^a-z0-9.-]/gi, '');
    if (!ramo || !arquivo.endsWith('.jpg')) return new Response('não', { status: 400 });
    try {
      return new Response(await readFile(join(PASTA_DADOS, 'referencias', ramo, arquivo)), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' } });
    } catch { return new Response('não achei', { status: 404 }); }
  }

  // ── COMEÇAR: o que falta para a Matilha e o Jarvis funcionarem de ponta a ponta ──
  // Com ?testar=1, as chaves do Groq e da Netlify são testadas de verdade (uma chave
  // colada errada não aparece como "pronta").
  if (caminho === '/api/comecar') {
    const testar = url.searchParams.get('testar') === '1';
    const chaves = await leChaves(ENV);
    const a = dados.tudo().ajustes || {};
    const [claude, skills] = await Promise.all([
      confereClaude(url.searchParams.get('claude') === '1').catch(() => ({ instalado: false, conectado: false })),
      situacaoDasSkills().catch(() => []),
    ]);
    // O último teste de cada chave fica lembrado (para a mesma chave): uma chave recusada não volta a
    // aparecer como pronta só porque a tela recarregou sem testar.
    const teste = async (nome, preenchida, endereco) => {
      const token = (process.env[nome] || '').trim();
      if (!preenchida) return 'falta';
      const lembrado = testesDeChave[nome];
      if (!testar) return lembrado && lembrado.token === token ? lembrado.resultado : 'preenchida';
      let resultado;
      try {
        const r = await fetch(endereco, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
        resultado = r.ok ? 'ok' : r.status === 401 || r.status === 403 ? 'recusada' : 'sem_resposta';
      } catch { resultado = 'sem_resposta'; }
      testesDeChave[nome] = { token, resultado };
      return resultado;
    };
    const [groq, netlify] = await Promise.all([
      teste('GROQ_API_KEY', chaves.GROQ_API_KEY.preenchida, 'https://api.groq.com/openai/v1/models'),
      teste('NETLIFY_TOKEN', chaves.NETLIFY_TOKEN.preenchida, 'https://api.netlify.com/api/v1/user'),
    ]);
    return json({
      local,
      negocio: Boolean(String(a.autor || '').trim()),
      groq,
      netlify,
      claude: { instalado: Boolean(claude.instalado), conectado: Boolean(claude.conectado) },
      whatsapp: zap.estado()?.situacao || 'desligado',
      skills: { instaladas: skills.filter((x) => x.instalado).length, total: skills.length, instalando: Boolean(skillsInstalando) },
      celular: Boolean(lancador.estado?.chave),
      windows: process.platform === 'win32',
    });
  }

  // ── as chaves (o painel escreve o .env por você) ────────────────
  if (caminho === '/api/chaves') {
    if (pedido.method === 'GET') return json(await leChaves(ENV));
    const novas = await pedido.json().catch(() => null);
    if (!novas || typeof novas !== 'object') return json({ erro: 'JSON inválido.' }, 400);
    const saida = await gravaChaves(ENV, novas);
    return json(saida, saida.erro ? 400 : 200);
  }

  // ── CONECTAR CLAUDE PARA WHATSAPP ───────────────────────────────
  if (caminho === '/api/claude-zap') return json(await estadoDoClaude(false));
  if (caminho === '/api/claude-zap/conferir') return json(await estadoDoClaude(true));
  // Estes dois abrem uma janela NO COMPUTADOR: do celular, ninguém veria.
  if (caminho === '/api/claude-zap/login' || caminho === '/api/claude-zap/instalar') {
    if (!local) return json({ erro: 'Isto abre uma janela no computador. Faça pelo painel no próprio notebook.' }, 403);
    return json(caminho.endsWith('/login') ? abreLogin() : abreInstalacao());
  }
  if (caminho === '/api/claude-zap/testar') return json(await testaOClaude());
  if (caminho === '/api/claude-zap/ligar' || caminho === '/api/claude-zap/ajustar') {
    const corpo = await pedido.json().catch(() => ({}));
    const pronto = await confereClaude(false);
    if (caminho.endsWith('/ligar') && !pronto.pronto) {
      return json({ erro: `${pronto.motivo} ${pronto.conserto || ''}`.trim() }, 409);
    }
    await configClaude.muda({
      ...(caminho.endsWith('/ligar') ? { ligado: true } : {}),
      ...('modelo' in corpo ? { modelo: String(corpo.modelo || '') } : {}),
      ...('reservaGroq' in corpo ? { reservaGroq: corpo.reservaGroq !== false } : {}),
    });
    return json(await estadoDoClaude(false));
  }
  if (caminho === '/api/claude-zap/desligar') {
    await configClaude.muda({ ligado: false });
    return json(await estadoDoClaude(false));
  }

  // ── o WhatsApp Web ──────────────────────────────────────────────
  if (caminho === '/api/zap/estado') return json(await zap.confere());
  if (caminho === '/api/zap/ligar') return json(await zap.liga());
  if (caminho === '/api/zap/desligar') return json(await zap.desliga());
  if (caminho === '/api/zap/novidades') {
    const leads = dados.tudo().leads || [];
    return json(await zap.novidades(10, { eDeLead: (titulo) => Boolean(casaComLead(titulo, leads)) }));
  }
  // O diagnóstico pelo painel: demora (abre o navegador e espera a
  // tela), por isso tem prazo próprio no front.
  if (caminho === '/api/zap/diagnostico') {
    try {
      return json(await zap.diagnostica());
    } catch (e) {
      return json({ linhas: [`Erro: ${e.message.slice(0, 200)}`], ok: false }, 500);
    }
  }
  if (caminho === '/api/zap/enviar') {
    const corpo = await pedido.json().catch(() => ({}));
    const saida = await zap.envia(corpo.numero, corpo.texto);
    return json(saida, saida.enviada ? 200 : 409);
  }

  // ── AGENTE 1 · a matilha de dez ─────────────────────────────────
  // Quantos caçadores o painel pode oferecer — o campo lê daqui, para
  // o teto morar num lugar só.
  if (caminho === '/api/matilha/limites') {
    return json({ maximo: MAX_CACADORES, padrao: PADRAO_CACADORES });
  }
  if (caminho === '/api/matilha') {
    const corpo = await pedido.json().catch(() => ({}));
    try {
      return json(await matilha.caca(corpo));
    } catch (e) {
      return json({ erro: e.message.slice(0, 300) }, 502);
    }
  }
  if (caminho === '/api/matilha/andamento') return json(comoEstaAMatilha());
  if (caminho === '/api/matilha/fechar') {
    await matilha.fecha();
    return json({ fechado: true });
  }

  // ── AO VIVO · o que está acontecendo agora, para o celular ──────
  if (caminho === '/api/ao-vivo') {
    const tudo = dados.tudo();
    const leads = tudo.leads || [];
    const estado = fluxo.estado();

    // As últimas falas, de todo mundo, em ordem. É isto que responde
    // "o que está acontecendo" melhor do que qualquer contador.
    const falas = [];
    for (const lead of leads) {
      for (const fala of (lead.conversa || []).slice(-3)) {
        falas.push({
          nome: lead.nome, quem: fala.quem, texto: String(fala.texto || '').slice(0, 220),
          quando: fala.quando || 0, estagio: lead.estagio,
        });
      }
    }
    falas.sort((a, b) => b.quando - a.quando);

    return json({
      quando: Date.now(),
      operacao: estado.operacao,
      ligado: estado.ligado,
      horarios: estado.horarios,
      funil: estado.funil,
      setores: estado.trabalhadores,
      mural: estado.mural,
      ultimo: estado.ultimo,
      falas: falas.slice(0, 12),
      matilha: comoEstaAMatilha(),
    });
  }

  // ── A OPERAÇÃO · o botão "Fazer dinheiro" ───────────────────────
  if (caminho === '/api/operacao') {
    return json(operacao.estado(dados.tudo().leads || []));
  }
  if (caminho === '/api/operacao/comecar') {
    const corpo = await pedido.json().catch(() => ({}));
    try {
      await fluxo.comecaOperacao(corpo);
      return json(operacao.estado(dados.tudo().leads || []));
    } catch (e) {
      return json({ erro: e.message.slice(0, 300) }, 400);
    }
  }
  if (caminho === '/api/operacao/parar') {
    await fluxo.paraOperacao();
    return json(operacao.estado(dados.tudo().leads || []));
  }

  // ── O FLUXO · o que roda sozinho ────────────────────────────────
  if (caminho === '/api/fluxo') return json({ ...fluxo.estado(), matilha: comoEstaAMatilha() });
  if (caminho === '/api/fluxo/ligar') return json(await fluxo.liga());
  if (caminho === '/api/fluxo/desligar') return json(await fluxo.desliga());
  if (caminho === '/api/fluxo/destravar') {
    const corpo = await pedido.json().catch(() => ({}));
    await fluxo.destrava(corpo.id);
    return json(fluxo.estado());
  }
  if (caminho === '/api/fluxo/liberar') {
    const corpo = await pedido.json().catch(() => ({}));
    const ids = Array.isArray(corpo.ids) ? corpo.ids.slice(0, 50) : [];
    if (!ids.length) return json({ erro: 'Nenhum cliente selecionado.' }, 400);
    return json(await fluxo.liberaPrimeiroContato(ids));
  }
  // O rascunho do site oficial que o estúdio fez, para você conferir.
  if (caminho === '/api/fluxo/rascunho') {
    const lead = (dados.tudo().leads || []).find((l) => l.id === url.searchParams.get('id'));
    const arquivo = lead?.sites?.rascunho_oficial?.caminho;
    if (!arquivo) return new Response('Sem rascunho para este cliente.', { status: 404 });
    try {
      return new Response(await readFile(arquivo), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    } catch { return new Response('O arquivo do rascunho sumiu.', { status: 404 }); }
  }
  // O CARDÁPIO: a lista para você conferir, as fotos de onde ela saiu, e o seu OK.
  if (caminho === '/api/fluxo/cardapio' && pedido.method === 'GET') {
    const lead = (dados.tudo().leads || []).find((l) => l.id === url.searchParams.get('id'));
    if (!lead) return json({ erro: 'Cliente não encontrado.' }, 404);
    const c = lead.cardapio || {};
    return json({ texto: cardapioEmTexto(c.itens || []), itens: (c.itens || []).length, fonte: c.fonte || '',
      conferido: Boolean(c.conferido), observacao: c.observacao || '', fotos: (c.fotos || []).length });
  }
  if (caminho === '/api/fluxo/cardapio') {
    const corpo = await pedido.json().catch(() => ({}));
    try { return json(await fluxo.confereCardapio(corpo.id, corpo.texto)); } catch (e) { return json({ erro: e.message.slice(0, 300) }, 400); }
  }
  if (caminho === '/api/fluxo/cardapio-foto') {
    const lead = (dados.tudo().leads || []).find((l) => l.id === url.searchParams.get('id'));
    const foto = lead?.cardapio?.fotos?.[Number(url.searchParams.get('n')) || 0];
    // Só sai arquivo de dentro da pasta de dados.
    const alvo = foto?.caminho ? resolve(foto.caminho) : '';
    if (!alvo || !alvo.startsWith(resolve(PASTA_DADOS) + sep)) return new Response('Sem foto.', { status: 404 });
    try {
      return new Response(await readFile(alvo), { headers: { 'content-type': TIPOS[extname(alvo).toLowerCase()] || 'image/jpeg', 'cache-control': 'no-store' } });
    } catch { return new Response('A foto sumiu da pasta.', { status: 404 }); }
  }
  // A plaquinha da mesa: o QR Code do cardápio no ar, pronta para imprimir.
  if (caminho === '/api/fluxo/qr') {
    const lead = (dados.tudo().leads || []).find((l) => l.id === url.searchParams.get('id'));
    const endereco = lead?.sites?.oficial?.dominio ? `https://${lead.sites.oficial.dominio}` : lead?.sites?.oficial?.url;
    if (!endereco) return new Response('Este cliente ainda não tem cardápio no ar.', { status: 404 });
    const nome = String(lead.nome || '').replace(/[<>&"]/g, '');
    return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QR Code · ${nome}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;font-family:system-ui,sans-serif;color:#111;background:#fff}
.placa{width:9cm;margin:1cm auto;padding:.8cm;border:1px solid #ddd;text-align:center}
h1{font-size:22pt;margin:0 0 .2cm}p{margin:.2cm 0;font-size:12pt}svg{display:block;margin:.4cm auto}
small{display:block;color:#555;font-size:9pt;word-break:break-all}.dica{max-width:9cm;margin:0 auto;font-size:11pt;color:#555}
@media print{.dica{display:none}.placa{border:0}}</style></head><body>
<p class="dica">Imprima (Ctrl+P) ou salve em PDF e mande ao cliente. Cabem duas por folha A4.</p>
<div class="placa"><h1>${nome}</h1><p>Aponte a câmera do celular para ver o cardápio</p>${qrSVG(endereco, { lado: 260, rotulo: `QR Code do cardápio de ${nome}` })}<small>${endereco}</small></div>
</body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
  }
  // Ligar o domínio que você comprou ao site do cliente, pela API da Netlify.
  if (caminho === '/api/fluxo/dominio') {
    const corpo = await pedido.json().catch(() => ({}));
    try { return json(await ligaDominio(corpo.id, corpo.dominio)); } catch (e) { return json({ erro: e.message.slice(0, 300) }, 400); }
  }
  // O seu "comprei o domínio": daqui o agente do domínio liga e confere.
  if (caminho === '/api/fluxo/dominio-comprado') {
    const corpo = await pedido.json().catch(() => ({}));
    try { return json(await fluxo.dominioComprado(corpo.id, corpo.dominio)); } catch (e) { return json({ erro: e.message.slice(0, 300) }, 400); }
  }
  if (caminho === '/api/fluxo/entregar-sem-dominio') {
    const corpo = await pedido.json().catch(() => ({}));
    try { return json(await fluxo.entregaSemDominio(corpo.id)); } catch (e) { return json({ erro: e.message.slice(0, 300) }, 400); }
  }
  if (caminho === '/api/fluxo/entregar') {
    const corpo = await pedido.json().catch(() => ({}));
    // Sem HTML, vai o rascunho que o estúdio fez.
    if (!corpo.id) return json({ erro: 'Informe o cliente.' }, 400);
    try {
      return json(await fluxo.entrega(corpo.id, String(corpo.html)));
    } catch (e) {
      return json({ erro: e.message.slice(0, 300) }, 502);
    }
  }

  // ── o painel no celular ─────────────────────────────────────────
  // O PIN e o QR só saem para quem está NO notebook. Um celular que já
  // entrou não precisa deles, e um que não entrou não vai ganhá-los de
  // graça.
  if (caminho === '/api/celular') {
    if (!local) return json({ erro: 'Isto só aparece no notebook.' }, 403);
    const enderecos = enderecosNaRede();
    const alvo = enderecos[0]
      ? `http://${enderecos[0].ip}:${PORTA}/?pin=${celular.pin}`
      : '';
    return json({
      enderecos: enderecos.map((e) => ({ ...e, url: `http://${e.ip}:${PORTA}/` })),
      pin: celular.pin,
      qr: alvo ? qrSVG(alvo) : '',
      aparelhos: celular.fichas.size,
    });
  }
  if (caminho === '/api/tunel') {
    if (!local) return json({ erro: 'Isto só aparece no notebook.' }, 403);
    const estado = tunel.estado();
    return json({
      ...estado,
      sempre: celular.tunelSempre,
      andamento: tunelAndamento,
      qr: estado.url ? qrSVG(`${estado.url}/?pin=${celular.pin}`) : '',
      pin: celular.pin,
    });
  }
  if (caminho === '/api/tunel/ligar') {
    if (!local) return json({ erro: 'Isto só aparece no notebook.' }, 403);
    const corpo = await pedido.json().catch(() => ({}));
    if (typeof corpo.sempre === 'boolean') await celular.guardaSempre(corpo.sempre);
    try {
      const estado = await tunel.liga(PORTA_TUNEL);
      return json({
        ...estado, sempre: celular.tunelSempre,
        qr: qrSVG(`${estado.url}/?pin=${celular.pin}`), pin: celular.pin,
      });
    } catch (e) {
      return json({ erro: e.message.slice(0, 300) }, 502);
    }
  }
  // Só guardar a preferência, sem abrir nem fechar nada agora.
  if (caminho === '/api/tunel/sempre') {
    if (!local) return json({ erro: 'Isto só aparece no notebook.' }, 403);
    const corpo = await pedido.json().catch(() => ({}));
    return json({ sempre: await celular.guardaSempre(corpo.sempre === true) });
  }
  if (caminho === '/api/tunel/desligar') {
    if (!local) return json({ erro: 'Isto só aparece no notebook.' }, 403);
    const corpo = await pedido.json().catch(() => ({}));
    if (typeof corpo.sempre === 'boolean') await celular.guardaSempre(corpo.sempre);
    return json({ ...(await tunel.desliga()), sempre: celular.tunelSempre });
  }

  /**
   * O QR de acompanhar.
   *
   * Aponta para a tela "ao vivo", já com o PIN. Se o túnel estiver
   * aberto, usa o endereço da internet — que funciona de qualquer
   * lugar. Se não, o do wi-fi, que só funciona em casa, e diz isso.
   */
  if (caminho === '/api/ao-vivo/qr') {
    if (!local) return json({ erro: 'Isto só aparece no notebook.' }, 403);
    const naRede = enderecosNaRede()[0];
    const tunelAberto = tunel.estado().url;
    const base = tunelAberto || (naRede ? `http://${naRede.ip}:${PORTA}` : '');
    if (!base) {
      return json({ erro: 'Sem rede e sem túnel: não há endereço para o celular.' }, 409);
    }
    const alvo = `${base}/ao-vivo?pin=${celular.pin}`;
    return json({
      url: `${base}/ao-vivo`,
      qr: qrSVG(alvo),
      pin: celular.pin,
      onde: tunelAberto ? 'internet' : 'wifi',
    });
  }

  if (caminho === '/api/celular/novo-pin') {
    if (!local) return json({ erro: 'Isto só aparece no notebook.' }, 403);
    await celular.trocaPin();
    return json({ pin: celular.pin });
  }

  // ── AGENTE 3 · o Claude Code está pronto? ───────────────────────
  if (caminho === '/api/claude-code') return json(await conferePronto());

  // ── o caçador pelo navegador (só existe rodando local) ──────────
  if (caminho === '/api/cacar-navegador') {
    const corpo = await pedido.json().catch(() => ({}));
    const termo = String(corpo.termo || '').trim();
    const cidade = String(corpo.cidade || '').trim();
    if (!termo || !cidade) return json({ erro: 'Informe o ramo e a cidade.' }, 400);
    try {
      return json(await cacador.caca(termo, cidade, corpo.quantos));
    } catch (e) {
      return json({ erro: e.message.slice(0, 300) }, 502);
    }
  }
  if (caminho === '/api/cacar-navegador/andamento') return json(andamento);
  if (caminho === '/api/cacar-navegador/fechar') {
    await cacador.fecha();
    return json({ fechado: true });
  }

  // ── os quatro agentes, sem alteração nenhuma ────────────────────
  const nome = AGENTES[caminho.replace('/api/', '')];
  if (nome) {
    const { default: agente } = await import(`./agentes/${nome}.mjs`);
    // Os agentes conferem a senha por conta própria; local, isso é
    // redundante e tudo bem: duas trancas na mesma porta não atrapalham.
    if (!process.env.PAINEL_SENHA) process.env.PAINEL_SENHA = 'local';
    const cabecalhos = new Headers(pedido.headers);
    cabecalhos.set('x-orbita-senha', process.env.PAINEL_SENHA);
    let corpoDoPedido = await pedido.text();
    if (nome === 'escrever') {
      // O rascunho da ficha usa os MESMOS ajustes da conversa automática
      // (preços, o que a mensalidade cobre, Claude ou Groq), lidos aqui
      // do lado do servidor, e não o pedaço que o navegador mandou.
      try {
        corpoDoPedido = JSON.stringify({ ...JSON.parse(corpoDoPedido), ajustes: ajustesAtuais() });
      } catch { /* o agente responde o erro de JSON */ }
    }
    return agente(new Request(pedido.url, {
      method: 'POST', headers: cabecalhos, body: corpoDoPedido,
    }));
  }
  return null;
}

/**
 * O painel importa o MESMO `oferta.mjs` que o vendedor usa, para a
 * prévia de preço nunca contar uma história diferente da que o agente
 * vai contar ao cliente. Uma cópia dentro de `public/` resolveria
 * hoje e mentiria no dia em que a regra mudasse — então o arquivo é
 * servido do lugar onde ele vive.
 */
async function arquivo(caminho) {
  if (caminho === '/oferta.mjs') {
    try {
      return new Response(await readFile(join(RAIZ, 'oferta.mjs')), {
        headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' },
      });
    } catch { return null; }
  }
  return arquivoPublico(caminho);
}

async function arquivoPublico(caminho) {
  const limpo = normalize(caminho === '/' ? '/index.html' : caminho).replace(/^(\.\.[/\\])+/, '');
  const alvo = join(PUBLICO, limpo);
  // Fora da pasta pública não se serve nada: sem isto, /../.env sairia
  // pelo navegador com as suas chaves dentro.
  if (!alvo.startsWith(PUBLICO)) return null;
  try {
    // Endereço sem extensão (/ao-vivo) acha o arquivo .html. É só para
    // o endereço ficar legível no QR e na barra do celular.
    const caminhoFinal = extname(alvo) ? alvo : `${alvo}.html`;
    const dados = await readFile(caminhoFinal);
    const tipo = TIPOS[extname(caminhoFinal)] || 'application/octet-stream';
    // A fonte não muda nunca: guardada no navegador, o painel abre sem
    // piscar. O resto vai sempre fresco, para uma versão nova valer na hora.
    const ehTexto = /^(text\/|application\/json|image\/svg)/.test(tipo);
    return new Response(dados, { headers: {
      'content-type': ehTexto ? `${tipo}; charset=utf-8` : tipo,
      'cache-control': tipo.startsWith('font/') ? 'public, max-age=604800' : 'no-store' } });
  } catch { return null; }
}

await carregaEnv();
await dados.carrega();
await configClaude.carrega();
await celular.carrega();
await operacao.carrega();

async function atende(req, res, daInternet) {
  const url = new URL(req.url, `http://127.0.0.1:${PORTA}`);
  const pedacos = [];
  for await (const p of req) pedacos.push(p);
  const pedido = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: pedacos.length ? Buffer.concat(pedacos) : undefined,
  });

  // A PORTARIA. Do próprio notebook entra direto. Da rede de casa e da
  // internet, só com PIN. `daInternet` vem da PORTA em que o pedido
  // chegou — a do túnel é só do túnel —, e não de um cabeçalho, que
  // qualquer um escreve. Sem isso, tudo que vem pelo túnel chegaria
  // como 127.0.0.1 (é o cloudflared que entrega aqui dentro) e entraria
  // sem PIN nenhum. Seria o painel inteiro aberto na internet.
  const local = !daInternet && ehLocal(req.socket.remoteAddress);

  // O "estou vivo" do lançador do celular: uma imagem de 1 pixel, sem PIN e sem nenhum dado.
  if (url.pathname === '/ping.png') {
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store', 'access-control-allow-origin': '*' });
    res.end(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64'));
    return;
  }

  // A página de um projeto do Jarvis, na tela dele. Entra pela ficha
  // sorteada (sem ela, nada), e vai numa caixa de areia: o que o Claude
  // Code escreveu ali não fala com o painel nem com o Jarvis.
  if (url.pathname.startsWith('/jarvis-ver/')) {
    const [, , ficha, ...resto] = url.pathname.split('/');
    let caminhoDoArquivo = null;
    try { caminhoDoArquivo = trabalhos.arquivoParaVer(ficha, decodeURIComponent(resto.join('/'))); } catch { caminhoDoArquivo = null; }
    let corpo = null;
    if (caminhoDoArquivo) { try { corpo = await readFile(caminhoDoArquivo); } catch { corpo = null; } }
    if (!corpo) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('não achei'); return; }
    const tipo = { ...TIPOS, '.mjs': 'text/javascript', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff',
      '.ttf': 'font/ttf', '.otf': 'font/otf', '.pdf': 'application/pdf', '.csv': 'text/csv', '.md': 'text/plain' }[extname(caminhoDoArquivo).toLowerCase()]
      || 'application/octet-stream';
    // Na caixa de areia o navegador não dá localStorage à página (e muita
    // apresentação guarda ali o slide atual ou o tema). Ela ganha uma
    // memória só dela, que some ao fechar.
    if (tipo === 'text/html') {
      const memoria = '<script>(()=>{try{localStorage.length}catch{const f=()=>{const d=new Map();return{get length(){return d.size},key:(i)=>[...d.keys()][i]??null,getItem:(k)=>d.has(String(k))?d.get(String(k)):null,setItem:(k,v)=>{d.set(String(k),String(v))},removeItem:(k)=>{d.delete(String(k))},clear:()=>d.clear()}};for(const n of["localStorage","sessionStorage"])try{Object.defineProperty(window,n,{value:f(),configurable:true})}catch{}}})()</script>';
      const html = corpo.toString('utf8');
      corpo = Buffer.from(/<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + memoria) : memoria + html);
    }
    res.writeHead(200, {
      'content-type': /^(text\/|application\/json|image\/svg)/.test(tipo) ? `${tipo}; charset=utf-8` : tipo,
      'content-security-policy': 'sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox',
      // A página na caixa de areia tem origem "nula": sem isto, o navegador não deixa ela carregar os próprios
      // módulos (o three.js de um 3D), fontes e JSON. A ficha sorteada continua sendo a tranca.
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff', 'cache-control': 'no-store',
    });
    res.end(corpo);
    return;
  }

  // OUTRO SITE NÃO MANDA NO PAINEL. O navegador do notebook entra sem PIN;
  // sem esta portaria, qualquer página aberta no Chrome poderia mandar um
  // pedido para 127.0.0.1 (inclusive para o Jarvis, que mexe no
  // computador). Pedido que vem de outra origem, ou de um endereço que não
  // é o do painel (o truque de trocar o DNS), não passa.
  if (url.pathname.startsWith('/api/')) {
    const host = String(req.headers.host || '');
    const origem = req.headers.origin;
    const deFora = (origem && origem !== 'null' && (() => { try { return new URL(origem).host !== host; } catch { return true; } })())
      || origem === 'null' || req.headers['sec-fetch-site'] === 'cross-site';
    const hostEstranho = local && !/^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(host);
    if (deFora || hostEstranho) {
      res.writeHead(403, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ erro: 'Pedido de fora do painel.' }));
      return;
    }
  }
  const aparelho = daInternet
    ? `internet:${req.headers['cf-connecting-ip'] || '?'}`
    : String(req.socket.remoteAddress || '?');

  if (!local) {
    const pin = url.searchParams.get('pin');
    const ficha = biscoito(req.headers.cookie, 'orbita_celular');

    if (pin !== null) {
      const tentativa = await celular.entra(pin, aparelho);
      if (!tentativa.ok) {
        res.writeHead(401, { 'content-type': 'text/html; charset=utf-8' });
        res.end(paginaDoPIN({
          castigo: tentativa.castigo || 0,
          erro: tentativa.castigo ? '' : `PIN errado. Restam ${tentativa.restam} tentativas.`,
        }));
        return;
      }
      // Entrou: guarda a ficha no celular e tira o PIN da barra de
      // endereço, para ele não ficar no histórico do navegador.
      res.writeHead(302, {
        // Volta para a página que ele PEDIU. Mandar sempre para a
        // raiz quebrava o QR do "ao vivo": a pessoa apontava a câmera
        // para a tela de acompanhar e caía no painel inteiro.
        location: url.pathname || '/',
        'set-cookie': `orbita_celular=${tentativa.ficha}; Path=/; Max-Age=2592000; `
          + 'HttpOnly; SameSite=Lax',
      });
      res.end();
      return;
    }

    if (!celular.temFicha(ficha)) {
      if (url.pathname.startsWith('/api/')) {
        res.writeHead(401, { 'content-type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ erro: 'Precisa do PIN.' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(paginaDoPIN());
      return;
    }
  }

  let resposta;
  try {
    if (url.pathname.startsWith('/api/')) {
      resposta = destrancado(pedido)
        ? await rota(pedido, url.pathname, local)
        : json({ erro: 'Senha do painel inválida.' }, 401);
    } else {
      resposta = await arquivo(url.pathname);
    }
  } catch (e) {
    console.error('  ⚠', url.pathname, e.message);
    resposta = json({ erro: e.message.slice(0, 300) }, 500);
  }
  if (!resposta) resposta = new Response('não achei', { status: 404 });

  res.writeHead(resposta.status, Object.fromEntries(resposta.headers));
  res.end(Buffer.from(await resposta.arrayBuffer()));
}

const servidor = createServer((req, res) => atende(req, res, false));
const portaDoTunel = createServer((req, res) => atende(req, res, true));
portaDoTunel.listen(PORTA_TUNEL, '127.0.0.1');

servidor.listen(PORTA, '0.0.0.0', async () => {
  atalhos.liga().catch((e) => console.log(`  ⚠ atalhos do Jarvis: ${e.message}`));
  // O Claude do Jarvis já fica aberto: a primeira pergunta não espera ele acordar.
  setTimeout(() => { jarvis.aquece().catch(() => {}); }, 4000);
  // A voz do Jarvis (a George, do Kokoro) instala sozinha na primeira vez, sem atrapalhar a partida.
  setTimeout(() => { voz.prepara().catch(() => {}); }, 8000);
  // Skill nova no pacote (como a equipe de vendas): quem já tinha o pacote ganha sozinho, sem clicar em nada.
  setTimeout(() => { if (!skillsInstalando) skillsInstalando = completaAsCopiadas(console.log).catch(() => []).finally(() => { skillsInstalando = null; }); }, 20_000);
  await lancador.carrega();
  // A cada 30 s: se o endereço de fora de casa mudou, o lançador do celular fica sabendo.
  setInterval(() => { acompanhaOTunel(); }, 30_000);
  setTimeout(() => { acompanhaOTunel(); }, 15_000);
  const endereco = `http://127.0.0.1:${PORTA}`;
  console.log(`\n  MATILHA no ar · ${endereco}`);
  const naRede = enderecosNaRede()[0];
  if (naRede) {
    console.log(`  no celular  · http://${naRede.ip}:${PORTA}  ·  PIN ${celular.pin}`);
    console.log('               (o QR está no painel, em Ajustes)');
  } else {
    console.log('  no celular  · sem rede no momento — conecte o notebook ao wi-fi');
  }
  console.log(`  ${dados.tudo().leads.length} cliente(s) em ${join(PASTA_DADOS, 'dados.json')}`);
  const faltando = ['GROQ_API_KEY', 'NETLIFY_TOKEN', 'GOOGLE_PLACES_KEY']
    .filter((c) => !(process.env[c] || '').trim());
  if (faltando.length) console.log(`  falta no .env: ${faltando.join(', ')}`);
  console.log('  (feche esta janela para desligar)\n');

  // Se você marcou "deixar sempre aberto", o túnel sobe junto — é o
  // que faz o painel estar lá quando você já saiu de casa.
  if (celular.tunelSempre) {
    try {
      const aberto = await tunel.liga(PORTA_TUNEL);
      console.log(`  de fora de casa · ${aberto.url}  ·  PIN ${celular.pin}`);
      console.log('                    (endereço novo a cada vez que a Matilha abre)\n');
    } catch (e) {
      console.log(`  de fora de casa · não consegui abrir: ${e.message}\n`);
    }
  }
  if (process.env.SEM_NAVEGADOR !== '1') {
    const { exec } = await import('node:child_process');
    const abrir = process.platform === 'win32' ? `start "" "${endereco}"`
      : process.platform === 'darwin' ? `open "${endereco}"` : `xdg-open "${endereco}"`;
    exec(abrir, () => {});
  }
});

// O cloudflared é um programa separado: se a Matilha fecha e ninguém o
// avisa, ele fica rodando sozinho com o túnel aberto.
for (const sinal of ['SIGINT', 'SIGTERM']) {
  process.on(sinal, async () => {
    await tunel.desliga().catch(() => {});
    process.exit(0);
  });
}
