/**
 * OS PROJETOS DO JARVIS — o trabalho pesado vai para o Claude Code.
 *
 * O Jarvis (no Groq) entende o pedido e conversa; quem FAZ o projeto é o
 * Claude Code, entrando com a sua assinatura (o login da web, nunca chave
 * de API), no Opus 5.5 com esforço alto, e com o pacote de skills
 * instalado (Word, PowerPoint, Excel, PDF, design, apresentações em HTML,
 * planejamento). Cada projeto tem uma pasta própria em Documentos/Jarvis,
 * roda em segundo plano, e quando acaba o Jarvis avisa.
 *
 * Publicar é à parte e pede a sua confirmação: sobe a pasta para a
 * Netlify e devolve o link.
 */
import { createHash, randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

import { entende, falhaDe, rodaClaude } from './claude-cli.mjs';
import { pastasConhecidas } from './computador.mjs';
import { apelido, texto } from './comum.mjs';

export const MODELO = 'claude-opus-5-5';
const LIMITE_MINUTOS = 50;

/** O que o Claude Code pode usar num projeto: arquivos, web, skills e os comandos de quem gera documentos. */
const FERRAMENTAS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebFetch', 'WebSearch', 'Skill', 'TodoWrite',
  ...['python', 'python3', 'py', 'pip', 'pip3', 'node', 'npm', 'npx', 'mkdir', 'ls', 'cp', 'mv', 'cat', 'soffice', 'libreoffice', 'pdftoppm', 'git']
    .map((c) => `Bash(${c}:*)`)].join(',');

const PEDIDO = (pedido, pasta) => `Você é o Claude Code trabalhando para o Jarvis, o assistente pessoal do Rafael. \
O pedido dele está no fim. Entregue trabalho de nível profissional de elite: o que um estúdio caro entregaria.

Como trabalhar:
- Esta pasta (${pasta}) é o projeto. Tudo o que você criar fica aqui dentro.
- Use as skills instaladas quando servirem: pptx (PowerPoint), docx (Word), xlsx (Excel e gráficos), pdf, \
frontend-design e frontend-slides (páginas e apresentações em HTML), theme-factory e canvas-design (visual), \
e as do superpowers para planejar projetos grandes. Siga o que a skill manda.
- Apresentação: além do .pptx (se pedirem PowerPoint), faça uma versão em HTML (index.html na raiz) para \
poder ser publicada e aberta no celular. Gráficos com dados reais ou com a fonte dita; nunca número inventado \
apresentado como fato. Pesquisa: cite as fontes.
- Texto em português do Brasil, claro e direto, sem frases feitas.
- Gráficos em página HTML: skill echart (ECharts, arquivo local, nada de CDN). Onde pôr cada gráfico e cada \
texto no slide, e que estrutura a apresentação segue: skills slides e design-system (a busca local \
search-slides.py). Um gráfico por ideia, título que diz a conclusão, a fonte embaixo.
- A apresentação em HTML vai aparecer em tela cheia na tela do Jarvis, dentro de um quadro: tem que \
funcionar sem internet (bibliotecas copiadas para a pasta do projeto) e passar de slide com as setas do \
teclado E com a mensagem que o Jarvis manda quando o Rafael diz "próximo": \
window.addEventListener('message', (e) => { if (e.data?.jarvis === 'slide') ... e.data.acao é 'proximo', 'anterior' \
ou 'ir' (com e.data.slide, o número do slide começando em 0) }).
- E escreva falas.json na raiz: uma lista com a fala de quem apresenta, uma por slide, na mesma ordem (2 a 5 \
frases naturais por slide, em português falado, sem ler os tópicos palavra por palavra). O Jarvis lê em voz \
alta e passa os slides sozinho quando o Rafael diz "apresenta para mim".
- Confira o que você fez antes de terminar (abra os arquivos, rode o que precisar rodar).
- No fim, escreva RESUMO.md: o que foi entregue, os arquivos e como abrir cada um, em poucas linhas.

O PEDIDO:
${pedido}`;

/* ── o 3D de nível médio e o de construção ─────────────────────── */
/**
 * O pedido para o Claude Code fazer um 3D. Médio: bonito e com detalhe,
 * leve para o notebook. Construção: em escala, sem limite de detalhe, com
 * planta baixa, cortes e fachada com as medidas, para quem vai construir.
 * `base` é a cena do 3D simples que estava na tela (vira o ponto de partida).
 */
export function pedido3d({ nivel, descricao, medidas = '', base = '' }) {
  const comum = `O QUE FAZER: um 3D navegável de "${descricao}".
${medidas ? `Medidas que o Rafael deu: ${medidas}.` : 'O Rafael não deu medidas.'}
${base ? `\nPONTO DE PARTIDA: o 3D simples que ele já viu (JSON, em metros; largura = eixo x, comprimento = eixo z; \
"parede-frente" é onde fica a entrada). Mantenha o que está ali (as mesmas peças, nos mesmos lugares) e \
aumente o nível:\n${base}\n` : ''}
COMO ENTREGAR (vale para os dois níveis):
- index.html na raiz da pasta, com three.js. Instale com npm (three@0.180.0) e COPIE para ./vendor/three os \
arquivos que usar (o build e os addons), com um importmap no index.html. Nada de CDN nem textura da internet: \
a página abre sem internet, dentro de um quadro na tela do Jarvis, e pode ser publicada como está.
- Use as skills de three.js instaladas (threejs-agents-scene-builder para planejar; threejs-fundamentals, \
threejs-lighting, threejs-materials, threejs-textures, threejs-performance; threejs-errors-* se algo der errado).
- Escala: 1 unidade = 1 metro. Centro da sala em (0, 0, 0), chão em y = 0, fundo em z negativo, entrada (frente) \
em z positivo, esquerda em x negativo.
- Abre com uma visita guiada (uma volta por fora, depois entra pela porta, na altura dos olhos, 1,65 m); \
qualquer clique ou rolagem interrompe e passa para OrbitControls. A parede entre a câmera e a sala some \
quando a câmera está do lado de fora. Passando o mouse, aparece o nome da peça. Respeite prefers-reduced-motion.
- A voz do Rafael manda na câmera: window.addEventListener('message', (e) => { const m = e.data; \
if (m?.jarvis !== 'camera') return; ... }) com m.vista = 'cima' | 'dentro' | 'volta' | 'inicio' | 'parede' \
(com m.parede = 'fundo' | 'frente' | 'esquerda' | 'direita'). Transição suave de 1,5 s.
- Na tela: o nome do projeto e as medidas da sala num canto, discretos. Tudo em português do Brasil.
- Teste antes de terminar: abra no navegador (Playwright, se tiver), confira que não há erro no console e \
tire um print da vista de dentro e da vista de cima para conferir.`;
  if (nivel === 'construcao') {
    return `${comum}

NÍVEL: CONSTRUÇÃO. O objetivo é construir aquilo de verdade. Não há limite de detalhe: a precisão vem antes da beleza.
- Tudo em escala e medido. Paredes com espessura (alvenaria de 15 cm, se não disserem outra), vãos de porta e \
de janela recortados na parede (com as medidas do vão e a altura do peitoril), pé-direito, piso e acabamentos, \
pilares se o vão pedir, pontos de luz, tomadas e interruptores, pontos de água e esgoto onde houver pia, \
bebedouro ou banheiro, e os equipamentos com o tamanho real e o espaço de uso e de passagem em volta.
- Medida que o Rafael NÃO deu: use a medida mais comum no Brasil para aquele item e marque "A CONFIRMAR" \
(no 3D, num painel de medidas, e no RESUMO.md, numa lista só de medidas a confirmar). Não invente mais nada: \
nada de preço, de marca, nem de "está de acordo com a norma". Pode citar a norma que precisa ser conferida \
(por exemplo NBR 9050 para acessibilidade) como algo a conferir.
- No 3D: um botão "Medidas" que mostra as cotas (linhas com o valor em metros) e um botão "Planta" que vai \
para a vista de cima ortográfica.
- PLANTA BAIXA em PDF (planta-baixa.pdf, A3 deitado ou o que couber em escala 1:50, 1:75 ou 1:100, com a escala \
escrita e uma escala gráfica): planta baixa com todas as cotas, nome e área de cada ambiente, portas com o \
sentido de abertura, janelas com a medida do vão, a posição de cada equipamento; um corte longitudinal e um \
transversal com as alturas; a fachada da entrada; um carimbo com o nome do projeto, a data e a frase \
"Estudo preliminar. Não substitui o projeto assinado por arquiteto ou engenheiro (RRT/ART)." Gere com \
Python (matplotlib ou reportlab; instale com pip se faltar) e use a skill pdf. Confira o PDF abrindo as páginas \
como imagem antes de terminar.
- Pode levar o tempo que precisar, mas a página do 3D tem que abrir no notebook: repita peças iguais com \
InstancedMesh.`;
  }
  return `${comum}

NÍVEL: MÉDIO. Mais detalhe que o simples, para impressionar sem pesar.
- Peças reconhecíveis de longe e de perto: cantos arredondados, estofados, cabos, pegadores, telas dos \
aparelhos; materiais PBR (borracha, metal escovado, madeira, vidro) com texturas feitas por código; luz \
de teto que parece de verdade, sombras suaves e um pouco de oclusão de ambiente; espelhos que refletem \
(no máximo 3 com Reflector, os outros só brilhando).
- Rodar liso num notebook com vídeo integrado: até uns 300 mil triângulos, InstancedMesh para o que se repete.`;
}

/* ── a lista de projetos, guardada em dados/jarvis-projetos.json ── */
export class Trabalhos {
  constructor({ arquivo, diz = () => {}, aoMudar = () => {} }) {
    this.arquivo = arquivo;
    this.diz = diz;
    this.aoMudar = aoMudar;
    this.lista = [];
    this.rodando = new Map();
    this.filhos = new Map(); // id → o processo do Claude Code, para encerrar no meio
    this.fichas = new Map(); // ficha → id: o endereço para ver o projeto na tela do Jarvis
    this.carregado = this._carrega();
  }

  async _carrega() {
    try { this.lista = JSON.parse(await readFile(this.arquivo, 'utf8')); } catch { this.lista = []; }
    // Desligou no meio: o projeto não está mais rodando.
    for (const t of this.lista) if (t.estado === 'rodando') { t.estado = 'parou'; t.erro = 'a Matilha foi fechada no meio'; }
  }
  async _grava() { await writeFile(this.arquivo, JSON.stringify(this.lista.slice(-60), null, 2), 'utf8'); this.aoMudar(); }

  pasta() { return join(pastasConhecidas().documentos, 'Jarvis'); }
  acha(id) { return this.lista.find((t) => t.id === id || t.nome === id) || null; }
  resumo() {
    return this.lista.slice(-12).reverse().map((t) => ({ id: t.id, nome: t.nome, estado: t.estado, pasta: t.pasta,
      arquivado: Boolean(t.arquivado_em), encerrado: t.encerrado || null,
      inicio: t.inicio, fim: t.fim, resumo: t.resumo, erro: t.erro, arquivos: (t.arquivos || []).slice(0, 12), link: t.link || '',
      ver: this.ver(t.id) || '' }));
  }

  /**
   * O endereço para ver a página do projeto na tela do Jarvis
   * (/jarvis-ver/<ficha>/index.html), ou null se ele não tem página.
   * A ficha é sorteada a cada vez que a Matilha abre: quem não a tem não
   * vê os arquivos do projeto.
   */
  ver(id) {
    const t = this.acha(id);
    if (!t || t.estado === 'rodando') return null;
    const html = (t.arquivos || []).filter((a) => /\.html?$/i.test(a));
    const pagina = html.find((a) => /^index\.html?$/i.test(a)) || html.find((a) => !a.includes('/')) || html[0];
    if (!pagina) return null;
    let ficha = [...this.fichas].find(([, i]) => i === t.id)?.[0];
    if (!ficha) { ficha = randomBytes(16).toString('hex'); this.fichas.set(ficha, t.id); }
    return `/jarvis-ver/${ficha}/${pagina.split('/').map(encodeURIComponent).join('/')}`;
  }

  /** O arquivo de verdade por trás de /jarvis-ver/<ficha>/<caminho>, só se estiver dentro da pasta do projeto. */
  arquivoParaVer(ficha, caminho) {
    const t = this.acha(this.fichas.get(ficha));
    if (!t) return null;
    const base = resolve(t.pasta);
    const alvo = resolve(base, `.${sep}${caminho}`);
    return alvo.startsWith(base + sep) ? alvo : null;
  }

  /**
   * Começa um projeto novo. Volta na hora; o Claude Code trabalha em segundo plano.
   * `instrucoes` (opcional) é o pedido completo para o Claude Code quando ele é
   * maior que o resumo guardado (o 3D leva a cena inteira junto); `minutos` é o limite.
   */
  async novo({ pedido, nome, instrucoes = '', minutos = LIMITE_MINUTOS }) {
    await this.carregado;
    const id = randomBytes(4).toString('hex');
    const pasta = join(this.pasta(), apelido(nome || pedido.slice(0, 40), id));
    await mkdir(pasta, { recursive: true });
    const t = { id, nome: texto(nome, 80) || texto(pedido, 60), pedido: texto(pedido, 4000), pasta, estado: 'rodando', inicio: Date.now(),
      minutos: Math.min(180, Math.max(10, minutos)) };
    this.lista.push(t);
    await this._grava();
    this._roda(t, PEDIDO(instrucoes ? String(instrucoes).slice(0, 60_000) : t.pedido, pasta));
    return t;
  }

  /** Mais uma instrução no mesmo projeto, continuando a sessão do Claude Code. */
  async continua(id, pedido) {
    await this.carregado;
    const t = this.acha(id);
    if (!t) throw new Error('Não achei esse projeto.');
    if (t.estado === 'rodando') throw new Error('Esse projeto ainda está rodando; espere terminar.');
    t.estado = 'rodando'; t.erro = ''; t.inicio = Date.now(); t.fim = null;
    t.pedido = `${t.pedido}\n\nDepois: ${texto(pedido, 2000)}`;
    await this._grava();
    this._roda(t, `Continue o projeto desta pasta. O Rafael pediu agora: ${pedido}\nAtualize o RESUMO.md no fim.`, t.sessao);
    return t;
  }

  async _roda(t, pedido, sessao = '') {
    const args = ['-p', '--output-format', 'json', '--max-turns', '150'];
    if (await entende('--model')) args.push('--model', MODELO);
    if (await entende('--effort')) args.push('--effort', 'high');
    if (await entende('--permission-mode')) args.push('--permission-mode', 'acceptEdits');
    if (await entende('--allowedTools')) args.push('--allowedTools', FERRAMENTAS);
    if (await entende('--disallowedTools')) args.push('--disallowedTools', 'mcp__*');
    if (sessao && await entende('--resume')) args.push('--resume', sessao);
    this.rodando.set(t.id, true);
    this.diz(`  ✦ Jarvis: projeto "${t.nome}" no Claude Code (${t.pasta})`);
    const r = await rodaClaude(args, { ms: (t.minutos || LIMITE_MINUTOS) * 60_000, cwd: t.pasta, entrada: pedido,
      aoIniciar: (filho) => this.filhos.set(t.id, filho) });
    this.rodando.delete(t.id);
    this.filhos.delete(t.id);
    if (t.cancelado) {
      // Encerrado por você no meio: o que já foi feito fica na pasta.
      t.cancelado = false;
      t.fim = Date.now();
      t.estado = 'encerrado';
      t.arquivos = await arquivosDe(t.pasta);
      await this._grava();
      return;
    }
    let lido = null;
    try { lido = JSON.parse(String(r.saida).trim().split('\n').filter(Boolean).pop() || ''); } catch { lido = null; }
    const recado = `${lido?.result ?? ''} ${r.erro}`;
    t.fim = Date.now();
    t.sessao = lido?.session_id || t.sessao || '';
    t.arquivos = await arquivosDe(t.pasta);
    let resumo = '';
    try { resumo = await readFile(join(t.pasta, 'RESUMO.md'), 'utf8'); } catch { resumo = typeof lido?.result === 'string' ? lido.result : ''; }
    t.resumo = texto(resumo, 1500);
    if (!lido || lido.is_error || r.codigo !== 0) {
      const falha = falhaDe(recado);
      t.estado = t.arquivos.length && !falha ? 'pronto' : 'falhou';
      t.erro = falha ? falha.message : texto(recado, 300);
    } else {
      t.estado = 'pronto';
    }
    await this._grava();
    this.diz(`  ✦ Jarvis: projeto "${t.nome}" ${t.estado}`);
  }

  /** Arquivar: sai da lista dos ativos; a pasta e tudo o que tem nela ficam. */
  async arquiva(id, sim = true) {
    await this.carregado;
    const t = this.acha(id);
    if (!t) throw new Error('Não achei esse projeto.');
    const ja = Boolean(t.arquivado_em) === sim;
    if (!ja) { if (sim) t.arquivado_em = Date.now(); else delete t.arquivado_em; await this._grava(); }
    return { projeto: t, mudou: !ja };
  }

  /**
   * Encerrar: o trabalho acaba. Rodando, o Claude Code para (o que já foi
   * feito fica); pronto, vira "concluído". Nada é apagado.
   */
  async encerra(id, { cancelar = false } = {}) {
    await this.carregado;
    const t = this.acha(id);
    if (!t) throw new Error('Não achei esse projeto.');
    if (t.encerrado) return { projeto: t, mudou: false };
    if (t.estado === 'rodando') {
      t.cancelado = true;
      const filho = this.filhos.get(t.id);
      filho?.kill('SIGTERM');
      setTimeout(() => { try { filho?.kill('SIGKILL'); } catch { /* já saiu */ } }, 3000);
      t.encerrado = { estado: 'cancelado', em: Date.now() };
      if (!filho) { t.estado = 'encerrado'; t.cancelado = false; }
    } else {
      t.encerrado = { estado: cancelar ? 'cancelado' : (t.estado === 'pronto' ? 'concluido' : 'encerrado'), em: Date.now() };
    }
    await this._grava();
    return { projeto: t, mudou: true };
  }

  /** Publica a pasta do projeto na Netlify (pede confirmação antes, no Jarvis). */
  async publica(id) {
    await this.carregado;
    const t = this.acha(id);
    if (!t) throw new Error('Não achei esse projeto.');
    const r = await publicaPasta(t.pasta, `jarvis-${apelido(t.nome, t.id)}`);
    t.link = r.url;
    await this._grava();
    return r;
  }
}

/** Os arquivos do projeto (até 3 níveis, sem node_modules). */
async function arquivosDe(pasta, base = pasta, nivel = 0) {
  const saida = [];
  let nomes = [];
  try { nomes = await readdir(pasta); } catch { return saida; }
  for (const n of nomes) {
    if (n.startsWith('.') || n === 'node_modules' || n === '__pycache__') continue;
    const c = join(pasta, n);
    const s = await stat(c).catch(() => null);
    if (!s) continue;
    if (s.isDirectory()) { if (nivel < 3) saida.push(...await arquivosDe(c, base, nivel + 1)); } else saida.push(relative(base, c).split(sep).join('/'));
  }
  return saida.slice(0, 200);
}

/**
 * Sobe uma pasta inteira para a Netlify. A raiz do site é a primeira que
 * tiver index.html (a pasta, ou site/, dist/, apresentacao/); sem nenhuma,
 * a Matilha monta um índice com os arquivos para baixar.
 */
export async function publicaPasta(pasta, nomeDoSite) {
  const token = (process.env.NETLIFY_TOKEN || '').trim();
  if (!token) throw new Error('Falta o NETLIFY_TOKEN em Ajustes › Chaves.');
  const raiz = ['', 'site', 'dist', 'build', 'apresentacao', 'public'].map((s) => join(pasta, s)).find((p) => existsSync(join(p, 'index.html'))) || pasta;
  const lista = await arquivosDe(raiz);
  const arquivos = {};
  let total = 0;
  for (const rel of lista) {
    const corpo = await readFile(join(raiz, rel));
    total += corpo.length;
    if (total > 60 * 1024 * 1024) throw new Error('O projeto passa de 60 MB; publique só a pasta do site.');
    arquivos[`/${rel}`] = corpo;
  }
  if (!arquivos['/index.html']) {
    const itens = lista.map((rel) => `<li><a href="${encodeURI(rel)}">${rel.replace(/[<>&]/g, '')}</a></li>`).join('');
    arquivos['/index.html'] = Buffer.from(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${nomeDoSite}</title><body style="font:16px/1.6 system-ui;max-width:640px;margin:40px auto;padding:0 16px"><h1>Arquivos do projeto</h1><ul>${itens}</ul></body></html>`);
  }
  return publicaArquivos(arquivos, nomeDoSite);
}

/**
 * Publica um conjunto de arquivos ({ '/caminho': Buffer }) num site da Netlify
 * com este nome (cria se não existir). Só sobe o que mudou.
 */
export async function publicaArquivos(arquivos, nomeDoSite) {
  const token = (process.env.NETLIFY_TOKEN || '').trim();
  if (!token) throw new Error('Falta o NETLIFY_TOKEN em Ajustes › Chaves.');
  const API = 'https://api.netlify.com/api/v1';
  const cab = { authorization: `Bearer ${token}` };
  const nome = nomeDoSite.replace(/[^a-z0-9-]/g, '').slice(0, 60);
  let site = null;
  const achado = await fetch(`${API}/sites/${nome}.netlify.app`, { headers: cab });
  if (achado.ok) site = await achado.json();
  else {
    const novo = await fetch(`${API}/sites`, { method: 'POST', headers: { ...cab, 'content-type': 'application/json' }, body: JSON.stringify({ name: nome }) });
    if (!novo.ok) throw new Error(`a Netlify respondeu ${novo.status} ao criar o site`);
    site = await novo.json();
  }
  const sha = (b) => createHash('sha1').update(b).digest('hex');
  const digesto = Object.fromEntries(Object.entries(arquivos).map(([c, b]) => [c, sha(b)]));
  const dep = await fetch(`${API}/sites/${site.id}/deploys`, { method: 'POST', headers: { ...cab, 'content-type': 'application/json' }, body: JSON.stringify({ files: digesto }) });
  if (!dep.ok) throw new Error(`a Netlify respondeu ${dep.status} ao publicar`);
  const deploy = await dep.json();
  const faltam = new Set(deploy.required || []);
  for (const [caminho, corpo] of Object.entries(arquivos)) {
    if (!faltam.has(digesto[caminho])) continue;
    const up = await fetch(`${API}/deploys/${deploy.id}/files${encodeURI(caminho)}`, { method: 'PUT', headers: { ...cab, 'content-type': 'application/octet-stream' }, body: corpo });
    if (!up.ok) throw new Error(`a Netlify recusou ${caminho} (${up.status})`);
  }
  return { url: site.ssl_url || site.url || `https://${nome}.netlify.app`, arquivos: Object.keys(arquivos).length };
}
