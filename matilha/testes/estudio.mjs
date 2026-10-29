/**
 * O ESTÚDIO, conferido sem rede e sem gastar a sua conta.
 *
 *     node testes/estudio.mjs
 *
 * O Claude Code é um falso (testes/falsos/claude.mjs) e o Google é um
 * dublê: o que se confere é a ORDEM e o que cada etapa recebe —
 *   ficha do Maps → Sonnet (esforço alto) escreve o prompt master →
 *   Opus 5.5 (esforço alto) recebe o prompt e os prints e faz o site.
 */
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const FALSO = fileURLToPath(new URL('./falsos/claude.mjs', import.meta.url));
process.env.MATILHA_CLAUDE_FALSO = FALSO;

const { fazSite, pedidoDoSite, pedidoPromptMaster } = await import('../agentes/claudecode.mjs');
const { ESSENCIAIS, escreveFicha, fichaDoGoogle, markdownDaFicha, mesmoNome } = await import('../agentes/ficha-maps.mjs');
const { momentoDo } = await import('../agentes/vendedor.mjs');

const FICHA = {
  id: 'ChIJcantina1234567890', displayName: { text: 'Cantina da Vó Zuleica' },
  formattedAddress: 'R. das Flores, 10 - Ponta Negra, Natal - RN', nationalPhoneNumber: '(84) 98888-7777',
  rating: 4.6, userRatingCount: 180, googleMapsUri: 'https://maps.google.com/?cid=123',
  priceLevel: 'PRICE_LEVEL_MODERATE',
  regularOpeningHours: { weekdayDescriptions: ['segunda-feira: Fechado', 'terça-feira: 11:00–15:00'] },
  editorialSummary: { text: 'Comida caseira nordestina.' },
  delivery: true, takeout: true, dineIn: false,
  paymentOptions: { acceptsCreditCards: true, acceptsCashOnly: false },
  reviews: [{ authorAttribution: { displayName: 'Maria Souza' }, rating: 5,
    relativePublishTimeDescription: 'um mês atrás', originalText: { text: 'O baião de dois é o melhor de Natal!' } }],
};

/** Imita a Places: a busca acha a empresa, os detalhes devolvem a ficha. */
function googleFalso({ nomeAchado = 'Cantina da Vó Zuleica', recusaCampo = false } = {}) {
  const pedidos = [];
  const pede = async (chave, url, campos, corpo = null) => {
    pedidos.push({ url, campos });
    if (corpo) return { places: [{ id: 'ChIJcantina1234567890', displayName: { text: nomeAchado } }] };
    if (recusaCampo && campos.includes('priceRange')) throw new Error('Places devolveu 400: campo inválido');
    return FICHA;
  };
  return { pede, pedidos };
}

const LEAD = { id: 'l1', nome: 'Cantina da Vó Zuleica', tipo: 'Restaurante', cidade: 'Natal, RN',
  endereco: 'R. das Flores, 10', telefone: '(84) 98888-7777', whatsapp: '5584988887777',
  nota: 4.6, avaliacoes: 180, maps: 'https://maps.google.com/?cid=123' };

async function pastaNova() { return mkdtemp(join(tmpdir(), 'matilha-estudio-')); }

async function chamadas(log) {
  try { return (await readFile(log, 'utf8')).trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; }
}

test('ficha: nota, avaliação com autor, horário e marcações — e só o que o Maps diz que tem', () => {
  const md = markdownDaFicha(FICHA);
  for (const pedaco of ['4,6 de 5 (180 avaliações)', 'Maria Souza — ★★★★★', 'O baião de dois é o melhor de Natal!',
    'terça-feira: 11:00–15:00', 'faz entrega', 'retirada', 'cartão de crédito', '$$', 'Comida caseira nordestina.']) {
    assert.ok(md.includes(pedaco), `faltou "${pedaco}"`);
  }
  assert.ok(!md.includes('consumo no local') && !md.includes('só dinheiro'), 'marcou o que o Maps diz que NÃO tem');
});

test('ficha: lead sem id é achado pelo nome — e empresa de outro nome é recusada', async () => {
  const g = googleFalso();
  assert.equal((await fichaDoGoogle('k', LEAD, g.pede)).rating, 4.6);
  assert.ok(g.pedidos[0].url.includes('searchText'));
  assert.deepEqual(await fichaDoGoogle('k', LEAD, googleFalso({ nomeAchado: 'Churrascaria Gaúcha' }).pede), {});
  assert.ok(mesmoNome('Cantina da Vó Zuleica', 'Cantina da Vó Zuleica - Ponta Negra'));
});

test('ficha: campo recusado pelo Google cai para os essenciais, em vez de sair vazia', async () => {
  const g = googleFalso({ recusaCampo: true });
  assert.equal((await fichaDoGoogle('k', { ...LEAD, place_id: 'ChIJcantina1234567890' }, g.pede)).rating, 4.6);
  assert.equal(g.pedidos.at(-1).campos, ESSENCIAIS);
});

test('ficha: sem a chave, usa o que o caçador leu, e diz por quê', async () => {
  const pasta = await pastaNova();
  const r = await escreveFicha(LEAD, pasta, { chave: '' });
  assert.equal(r.fonte, 'cacador');
  const md = await readFile(r.arquivo, 'utf8');
  assert.ok(md.includes('4,6 de 5 (180 avaliações)') && md.includes('GOOGLE_PLACES_KEY'));
  await rm(pasta, { recursive: true, force: true });
});

test('pedidos: o Sonnet escreve SÓ o prompt e copia o Maps; o Opus recebe o prompt e os prints', () => {
  const instagram = { computador: '_instagram/computador.png', celular: '_instagram/celular.png' };
  const sonnet = pedidoPromptMaster(LEAD, { autor: 'Rafael', instagram });
  assert.ok(sonnet.includes('_maps/GOOGLE_MAPS.md'));
  assert.ok(sonnet.includes('_instagram/computador.png'));
  assert.ok(sonnet.includes('COPIADO para dentro do prompt'));
  assert.ok(sonnet.includes('Não faça o site'));
  assert.ok(sonnet.includes('Opus 5.5'));
  const opus = pedidoDoSite(LEAD, { autor: 'Rafael', instagram });
  assert.ok(opus.includes('PROMPT-MASTER.md'));
  assert.ok(opus.includes('_instagram/celular.png'));
  assert.ok(!opus.includes('_maps/GOOGLE_MAPS.md'), 'o Opus recebe o prompt e os prints, não a ficha');
  for (const p of [sonnet, opus]) assert.ok(p.includes('avaliação no Google') && p.includes('Nada inventado'));
});

test('fazSite: ficha do Maps → Sonnet alto → Opus 5.5 alto, nesta ordem', async () => {
  const pasta = await pastaNova();
  const log = join(pasta, 'chamadas.jsonl');
  process.env.MATILHA_CLAUDE_LOG = log;
  process.env.GOOGLE_PLACES_KEY = 'chave-falsa';   // o Google é o dublê: nada sai para a rede
  const g = googleFalso();
  const feito = await fazSite(LEAD, { autor: 'Rafael', pastaTrabalho: pasta, revisar: false, pedePlaces: g.pede, baixarPagina: async () => '',
    diz: () => {} });
  const [um, dois, ...resto] = await chamadas(log);
  assert.equal(resto.length, 0, 'chamou o Claude Code mais de duas vezes');
  assert.equal(um.modelo, 'sonnet');
  assert.equal(um.esforco, 'high');
  assert.ok(um.tinha_maps, 'o Sonnet começou sem a ficha do Maps');
  assert.ok(!um.ferramentas.includes('WebFetch'), 'o Sonnet só lê e escreve');
  assert.equal(dois.modelo, 'claude-opus-5-5');
  assert.equal(dois.esforco, 'high');
  assert.ok(dois.tinha_prompt, 'o Opus começou sem o prompt master');
  assert.ok(feito.html.includes('<h1>Site</h1>'));
  assert.equal(feito.ficha, 'google');
  assert.ok(feito.promptMaster);
  // o Sonnet falso copia a ficha para o prompt: as avaliações chegam ao Opus por ele
  assert.ok((await readFile(feito.promptMaster, 'utf8')).includes('Maria Souza'));
  delete process.env.MATILHA_CLAUDE_LOG;
  delete process.env.GOOGLE_PLACES_KEY;
  await rm(pasta, { recursive: true, force: true });
});

test('fazSite: sem prompt master, o Opus nem começa', async () => {
  const pasta = await pastaNova();
  const log = join(pasta, 'chamadas.jsonl');
  process.env.MATILHA_CLAUDE_LOG = log;
  process.env.MATILHA_CLAUDE_FALHA = 'sonnet';
  await assert.rejects(fazSite(LEAD, { pastaTrabalho: pasta, revisar: false, pedePlaces: googleFalso().pede, baixarPagina: async () => '' }));
  assert.equal((await chamadas(log)).filter((c) => c.modelo === 'claude-opus-5-5').length, 0);
  delete process.env.MATILHA_CLAUDE_FALHA;
  delete process.env.MATILHA_CLAUDE_LOG;
  await rm(pasta, { recursive: true, force: true });
});

test('vendedor: demo feita pelo botão antes de ele responder ainda é "antes da demo"', () => {
  const demo = { url: 'https://x.netlify.app', antes_do_contato: true };
  assert.equal(momentoDo({ estagio: 'aguardando_voce', sites: { demo } }), 'antes_da_demo');
  assert.equal(momentoDo({ estagio: 'demo_no_ar', sites: { demo: { ...demo, avisado_em: 1 } } }), 'depois_da_demo');
  assert.equal(momentoDo({ estagio: 'demo_no_ar', sites: { demo: { url: 'https://x' } } }), 'depois_da_demo');
});

/* ── o fluxo: o botão, a fila e o link que não sai sozinho ───────── */
const { Fluxo } = await import('../fluxo.mjs');
const { Dados } = await import('../dados.mjs');

async function fluxoDeTeste(leads) {
  const raiz = await pastaNova();
  const dados = new Dados(join(raiz, 'dados', 'dados.json'));
  await dados.carrega();
  await dados.guarda({ leads });
  const publicados = [];
  const fluxo = new Fluxo({
    dados, pastaTrabalho: join(raiz, 'dados', 'sites'), diz: () => {},
    publica: async (lead, html, versao) => { publicados.push({ lead: lead.id, versao }); return { url: `https://${lead.id}.netlify.app`, site_id: 's' }; },
  });
  // O botão liga o estúdio e o publicador; aqui ninguém gira sozinho, o teste faz cada passo.
  fluxo.ligaEstudio = async () => {};
  await fluxo._muralPronto();
  return { fluxo, dados, raiz, publicados };
}

const novo = (id, extra = {}) => ({ id, nome: `Casa ${id}`, tipo: 'Pizzaria', cidade: 'Natal', estagio: 'aguardando_voce',
  whatsapp: '5584900000000', conversa: [], sites: {}, ...extra });

test('botão: põe na caixa do estúdio uma vez só, e recusa cliente', async () => {
  const { fluxo, raiz } = await fluxoDeTeste([novo('a'), novo('b', { estagio: 'fechado' })]);
  const r = await fluxo.pedeDemo('a');
  assert.ok(r.ok);
  const doA = fluxo.mural.tarefas.filter((t) => t.setor === 'estudio' && t.dados.leadId === 'a');
  assert.equal(doA.length, 1);
  assert.equal(doA[0].dados.manual, true);
  assert.match((await fluxo.pedeDemo('a')).aviso, /já está na caixa/);
  assert.equal(fluxo.mural.tarefas.filter((t) => t.setor === 'estudio' && t.dados.leadId === 'a').length, 1);
  await assert.rejects(fluxo.pedeDemo('b'), /alteração/);
  assert.equal(fluxo.estadoDoEstudio().leads.find((l) => l.id === 'a').situacao, 'na_fila');
  await rm(raiz, { recursive: true, force: true });
});

test('botão: tarefa travada volta para a fila no "Tentar de novo"', async () => {
  const { fluxo, raiz } = await fluxoDeTeste([novo('a')]);
  await fluxo.pedeDemo('a');
  const t = fluxo.mural.tarefas.find((x) => x.dados.leadId === 'a');
  t.estado = 'travada'; t.erro = 'o Claude Code saiu com código 1';
  const linha = fluxo.estadoDoEstudio().leads.find((l) => l.id === 'a');
  assert.equal(linha.situacao, 'falhou');
  assert.match(linha.erro, /código 1/);
  assert.match((await fluxo.pedeDemo('a')).aviso, /tentando de novo/);
  assert.equal(t.estado, 'esperando');
  await rm(raiz, { recursive: true, force: true });
});

test('publicador: demo do botão para quem nunca respondeu fica no ar, e o link NÃO sai', async () => {
  const { fluxo, dados, raiz } = await fluxoDeTeste([novo('a')]);
  const arquivo = join(raiz, 'index.html');
  await (await import('node:fs/promises')).writeFile(arquivo, '<h1>x</h1>');
  const r = await fluxo._publicador({ dados: { leadId: 'a', nome: 'Casa a', versao: 'demo', caminho: arquivo, manual: true } });
  assert.match(r, /ainda não respondeu/);
  const lead = dados.tudo().leads.find((l) => l.id === 'a');
  assert.equal(lead.sites.demo.url, 'https://a.netlify.app');
  assert.equal(lead.sites.demo.antes_do_contato, true);
  assert.equal(lead.estagio, 'aguardando_voce', 'tirou o lead da fila do primeiro contato');
  assert.equal(fluxo.mural.tarefas.filter((t) => t.setor === 'vendedor').length, 0, 'mandou o link para quem não pediu');
  assert.equal(momentoDo(lead), 'antes_da_demo');
  await rm(raiz, { recursive: true, force: true });
});

test('publicador: demo do botão para quem já conversa manda o link', async () => {
  const conversa = [{ quem: 'nos', texto: 'oi' }, { quem: 'dono', texto: 'pode mandar' }];
  const { fluxo, raiz } = await fluxoDeTeste([novo('a', { estagio: 'conversando', abordado_em: 1, conversa })]);
  const arquivo = join(raiz, 'index.html');
  await (await import('node:fs/promises')).writeFile(arquivo, '<h1>x</h1>');
  await fluxo._publicador({ dados: { leadId: 'a', nome: 'Casa a', versao: 'demo', caminho: arquivo, manual: true } });
  const aviso = fluxo.mural.tarefas.find((t) => t.setor === 'vendedor' && t.tipo === 'avisar_demo');
  assert.ok(aviso, 'não mandou o link para quem pediu');
  assert.equal(aviso.dados.url, 'https://a.netlify.app');
  await rm(raiz, { recursive: true, force: true });
});

/* ── o que o print do painel mostrou ─────────────────────────────── */
test('ramo: "Ver mais" não é ramo — o nome diz qual é', async () => {
  const { categoriaValida, tipoDoLead } = await import('../agentes/roteiro.mjs');
  assert.equal(categoriaValida('Ver mais'), '');
  assert.equal(categoriaValida('Fechado · Abre às 18:00'), '');
  assert.equal(categoriaValida('Pizzaria'), 'Pizzaria');
  assert.equal(tipoDoLead({ tipo: 'Ver mais', nome: 'Clínica de Estética Batel' }), 'Estética');
  assert.equal(tipoDoLead({ tipo: 'Ver mais', nome: 'KI DELÍCIA PIZZARIA' }), 'Pizzaria');
  assert.equal(tipoDoLead({ tipo: 'Ver mais', nome: 'Salão Mônika Ganem' }), 'Salão');
  assert.equal(tipoDoLead({ tipo: 'Hamburgueria', nome: 'Casa X' }), 'Hamburgueria');
});

test('publicador: a chamada de dentro da Matilha passa sem PAINEL_SENHA; a de fora, não', async () => {
  const { SENHA_INTERNA, destranca } = await import('../agentes/comum.mjs');
  const antes = process.env.PAINEL_SENHA;
  delete process.env.PAINEL_SENHA;
  const pedido = (senha) => new Request('http://127.0.0.1/api/publicar', { method: 'POST', headers: senha ? { 'x-orbita-senha': senha } : {} });
  assert.equal(destranca(pedido(SENHA_INTERNA)), null, 'recusou a chamada interna (era o "Defina PAINEL_SENHA")');
  assert.equal(destranca(pedido('local')).status, 503, 'aceitou um chute');
  assert.equal(destranca(pedido('')).status, 503);
  process.env.PAINEL_SENHA = 'minha';
  assert.equal(destranca(pedido('minha')), null);
  assert.equal(destranca(pedido(SENHA_INTERNA)).status, 401, 'com senha definida, vale a senha');
  if (antes === undefined) delete process.env.PAINEL_SENHA; else process.env.PAINEL_SENHA = antes;
});


/* ── o Instagram que o estúdio acha sozinho ──────────────────────── */
const { achaInstagram, perfilCombina } = await import('../agentes/acha-instagram.mjs');

const DDG = (resultados) => resultados.map(([url, titulo]) =>
  `<a rel="nofollow" class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent(url)}&amp;rut=x">${titulo}</a>`).join('\n');

test('instagram: o site cadastrado no Google já é o Instagram — nem busca', async () => {
  let baixou = 0;
  const r = await achaInstagram({ nome: 'Pizzaria Baggio', cidade: 'Maringá' },
    { websiteDoGoogle: 'https://www.instagram.com/pizzariabaggio/', baixar: async () => { baixou += 1; return ''; } });
  assert.equal(r.instagram, 'https://www.instagram.com/pizzariabaggio/');
  assert.equal(baixou, 0);
});

test('instagram: achado no Linktree que estava no lugar do site', async () => {
  const r = await achaInstagram({ nome: 'Salão Mônika Ganem', cidade: 'Curitiba', link_social: 'https://linktr.ee/monikaganem' },
    { baixar: async (url) => (url.includes('linktr.ee') ? '<a href="https://instagram.com/monika.ganem">Instagram</a>' : '') });
  assert.equal(r.instagram, 'https://www.instagram.com/monika.ganem/');
  assert.match(r.como, /página de links/);
});

test('instagram: a busca pula o perfil de outra empresa e pega o certo', async () => {
  const html = DDG([
    ['https://www.instagram.com/esteticacuritiba/', 'Estética Curitiba (@esteticacuritiba)'],
    ['https://www.instagram.com/p/C123abc/', 'post qualquer'],
    ['https://www.instagram.com/clinicabatel/', 'Clínica Batel (@clinicabatel) • Instagram'],
  ]);
  const r = await achaInstagram({ nome: 'Clínica de Estética Batel', cidade: 'Curitiba' }, { baixar: async () => html });
  assert.equal(r.instagram, 'https://www.instagram.com/clinicabatel/');
});

test('instagram: nada que combine com o nome = sem Instagram, e o motivo', async () => {
  const html = DDG([['https://www.instagram.com/pizzariabella/', 'Pizzaria Bella']]);
  const r = await achaInstagram({ nome: 'Pizzaria Baggio', cidade: 'Maringá' }, { baixar: async () => html });
  assert.equal(r.instagram, '');
  assert.match(r.como, /nenhum perfil/);
});

test('instagram: a regra do nome — o nome próprio, nunca o ramo nem a cidade', () => {
  assert.ok(perfilCombina('esteticabatel', 'Clínica de Estética Batel'));
  assert.ok(!perfilCombina('esteticacuritiba', 'Clínica de Estética Batel', '', 'Curitiba'));
  assert.ok(!perfilCombina('deliciapizzas', 'KI DELÍCIA PIZZARIA'));
  assert.ok(perfilCombina('beauniquemaringa', 'Clinica de Estética em Maringá Beaunique', '', 'Maringá'));
  assert.ok(!perfilCombina('esteticamaringa', 'Clinica de Estética em Maringá Beaunique', '', 'Maringá'));
  assert.ok(perfilCombina('ganem.beauty', 'Salão Mônika Ganem', 'Mônika Ganem (@ganem.beauty) • Instagram'));
});

test('fazSite: sem @ salvo, procura sozinho e avisa quem guarda no cliente', async () => {
  const pasta = await pastaNova();
  process.env.MATILHA_CLAUDE_LOG = join(pasta, 'chamadas.jsonl');
  const guardado = [];
  const html = DDG([['https://www.instagram.com/cantinadavozuleica/', 'Cantina da Vó Zuleica (@cantinadavozuleica)']]);
  await fazSite({ ...LEAD, instagram: '' }, { pastaTrabalho: pasta, revisar: false, pedePlaces: googleFalso().pede,
    baixarPagina: async () => html, aoProcurarInstagram: (perfil, como) => guardado.push({ perfil, como }),
    // os prints em si precisam do navegador: aqui o teste para na busca
    prepararInstagram: async () => { throw new Error('sem navegador no teste'); } });
  assert.equal(guardado.length, 1);
  assert.equal(guardado[0].perfil, 'https://www.instagram.com/cantinadavozuleica/');
  delete process.env.MATILHA_CLAUDE_LOG;
  await rm(pasta, { recursive: true, force: true });
});

test('instagram: link do Bing embrulhado em redirecionamento é desembrulhado', async () => {
  const { resultadosDaBusca } = await import('../agentes/acha-instagram.mjs');
  const alvo = Buffer.from('https://www.instagram.com/pizzariabaggio/').toString('base64').replace(/=+$/, '');
  const html = `<h2><a href="https://www.bing.com/ck/a?!&amp;&amp;p=abc&amp;u=a1${alvo}&amp;ntb=1">Pizzaria Baggio (@pizzariabaggio)</a></h2>`;
  assert.equal(resultadosDaBusca(html)[0].url, 'https://www.instagram.com/pizzariabaggio/');
});

test('instagram: busca que nem abriu diz isso, e não "não achou"', async () => {
  const r = await achaInstagram({ nome: 'Pizzaria Baggio', cidade: 'Maringá' }, { baixar: async () => { throw new Error('ENOTFOUND'); } });
  assert.match(r.como, /não abriu/);
});
