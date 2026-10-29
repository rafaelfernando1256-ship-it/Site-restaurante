/**
 * O PACOTE DE SKILLS DO JARVIS — instalado no seu Claude Code.
 *
 * Skill é um manual que o Claude Code lê quando a tarefa pede: como fazer
 * um PowerPoint de verdade, uma planilha com gráfico, um PDF, uma página
 * com cara de estúdio, como planejar um projeto grande. Ficam instaladas
 * no Claude Code da sua conta (pasta ~/.claude), e servem para tudo o que
 * ele fizer, não só para o Jarvis.
 *
 * Escolhidas pelo que mais aparece nas listas de 2026 e pelo que o Jarvis
 * precisa (apresentação, slide, gráfico, resumo, site):
 *   · Anthropic, o repositório oficial: Word, PowerPoint, Excel, PDF,
 *     frontend-design, theme-factory, canvas-design, web-artifacts,
 *     teste de sites, criador de skills;
 *   · Superpowers (obra): planejar, executar em etapas, depurar, revisar;
 *   · Frontend Slides (zarazhangrui): apresentações em HTML animadas, com
 *     filosofia anti-"cara de IA", e conversão de PowerPoint.
 * Só repositórios conhecidos: skill pode rodar código, então nada de
 * instalar qualquer uma.
 *
 * E as que não são marketplace (3D, gráficos e layout de apresentação) vêm
 * COPIADAS de uma versão fixa (o commit que foi lido e conferido), só as
 * pastas escolhidas, para ~/.claude/skills. Se o dono do repositório mudar
 * alguma coisa depois, não chega aqui sem uma revisão nova:
 *   · threejs-skills (cloudai-x, MIT): o básico ao avançado de three.js;
 *   · Three.js Skill Package (OpenAEC Foundation, MIT, feito para
 *     arquitetura e construção): montar a cena, visualizador IFC (BIM),
 *     otimizar modelo, erros de desempenho e de renderização;
 *   · ECharts (nealepetrillo, MIT): gráficos interativos de 20+ tipos;
 *   · Slides e design-system (ui-ux-pro-max, MIT): onde pôr cada coisa no
 *     slide (25 layouts), qual gráfico para cada dado, estratégias de
 *     apresentação, com uma busca local em planilhas (nada vai para fora);
 *   · AI Sales Team (zubair-trabzada, MIT): uma equipe de vendas dentro do
 *     Claude Code. /sales prospect <site> pesquisa a empresa, qualifica o
 *     lead (BANT e MEDDIC), acha quem decide, escreve a sequência de
 *     abordagem e de follow-up, prepara a reunião, monta proposta, responde
 *     objeções e faz relatório (em PDF, com o Python). São 14 skills, 5
 *     agentes, 4 scripts (eles só leem o site do prospecto) e 6 modelos.
 *   · Marketing Skills (coreyhaines31, MIT): offers, pricing, copywriting,
 *     marketing-psychology, sales-enablement, customer-research e
 *     ab-testing — a base das técnicas do Offer Architect. Só as 7 que
 *     servem para ofertas, não o repositório inteiro.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { rodaClaude } from './claude-cli.mjs';
import { texto } from './comum.mjs';

export const PACOTE = [
  { nome: 'Anthropic (oficial)', marketplace: 'anthropics/skills',
    plugins: ['document-skills@anthropic-agent-skills', 'example-skills@anthropic-agent-skills'],
    faz: 'Word, PowerPoint, Excel, PDF, design de páginas, temas visuais, arte, teste de sites' },
  { nome: 'Superpowers', marketplace: 'obra/superpowers-marketplace',
    plugins: ['superpowers@superpowers-marketplace'],
    faz: 'planejar projetos grandes, executar em etapas, depurar e revisar' },
  { nome: 'Frontend Slides', marketplace: 'zarazhangrui/frontend-slides',
    plugins: ['frontend-slides@frontend-slides'],
    faz: 'apresentações em HTML animadas, prontas para publicar' },
];

/** As copiadas: repositório, o commit conferido e as pastas de skill que entram. */
export const COPIADAS = [
  { nome: 'Three.js (3D)', repo: 'cloudai-x/threejs-skills', commit: '0e181866f095b5f06d005133876e926515390d95',
    pastas: ['animation', 'asset-pipeline', 'fundamentals', 'geometry', 'interaction', 'lighting', 'loaders', 'materials',
      'performance', 'postprocessing', 'react-three-fiber', 'shaders', 'textures'].map((t) => `skills/threejs-${t}`),
    faz: '3D na web: cena, luz, materiais, texturas, animação, desempenho' },
  { nome: 'Three.js para arquitetura', repo: 'OpenAEC-Foundation/Three.js-Claude-Skill-Package', commit: '6c190f0db95d6e4b77d7843d181c6d3325c09d0e',
    pastas: ['threejs-agents/threejs-agents-scene-builder', 'threejs-agents/threejs-agents-model-optimizer', 'threejs-impl/threejs-impl-ifc-viewer',
      'threejs-errors/threejs-errors-performance', 'threejs-errors/threejs-errors-rendering'].map((t) => `skills/source/${t}`),
    faz: 'montar cenas 3D de construção, modelos BIM (IFC), deixar leve' },
  { nome: 'ECharts (gráficos)', repo: 'nealepetrillo/claude-skills-echart', commit: 'c466b46736a338f0916299f7fb2b5b4117062bb8',
    pastas: ['.claude/skills/echart'],
    faz: 'gráficos interativos de mais de 20 tipos, com regras de design' },
  { nome: 'Layout de apresentação', repo: 'nextlevelbuilder/ui-ux-pro-max-skill', commit: '623a9a9037d006ea727f8213f084d02a6b6f11b5',
    pastas: ['.claude/skills/slides', '.claude/skills/design-system'],
    faz: 'onde pôr cada gráfico e cada texto no slide, 25 layouts, estratégia da apresentação' },
  { nome: 'Equipe de vendas (AI Sales Team)', repo: 'zubair-trabzada/ai-sales-team-claude', commit: 'efef8b8a4ce8c93d8d6b4af9d1423db38f0de2ce',
    pastas: ['sales', ...['prospect', 'research', 'qualify', 'contacts', 'outreach', 'followup', 'prep', 'proposal', 'objections', 'icp',
      'competitors', 'report', 'report-pdf'].map((t) => `skills/sales-${t}`)],
    // O orquestrador (/sales) leva junto os scripts e os modelos, como o instalador deles faz.
    extras: [{ de: 'scripts', para: 'sales/scripts' }, { de: 'templates', para: 'sales/templates' }],
    agentes: ['sales-company', 'sales-contacts', 'sales-opportunity', 'sales-competitive', 'sales-strategy'],
    faz: '/sales prospect <site>: pesquisa a empresa, qualifica o lead, acha quem decide, escreve a abordagem, a proposta e o follow-up' },
  // As técnicas que o Offer Architect (agentes/ofertas.mjs) usa, inteiras, para você chamar no Claude Code.
  { nome: 'Marketing: ofertas, preço e copy (Marketing Skills)', repo: 'coreyhaines31/marketingskills', commit: 'e85f3cbc2e4a79bf33b2a12e9bdd9087d414735b',
    pastas: ['offers', 'pricing', 'copywriting', 'marketing-psychology', 'sales-enablement', 'customer-research', 'ab-testing'].map((t) => `skills/${t}`),
    faz: 'montar ofertas (equação de valor, bônus, risco), preço em pacotes, copy, objeções, pesquisa de público e testes A/B' },
];
const PASTA_SKILLS = () => join(homedir(), '.claude', 'skills');
const PASTA_AGENTES = () => join(homedir(), '.claude', 'agents');
const MARCA = '.jarvis-origem';
const nomeDaSkill = (pasta) => pasta.split('/').pop();

/** O que já está instalado: os plugins (pelo claude plugin list) e as copiadas (pela marca com o commit). */
export async function situacao() {
  const r = await rodaClaude(['plugin', 'list'], { ms: 30_000 });
  const lista = String(r.saida || '');
  const copiadas = await Promise.all(COPIADAS.map(async (c) => {
    let instalado = true;
    for (const pasta of c.pastas) {
      const marca = await readFile(join(PASTA_SKILLS(), nomeDaSkill(pasta), MARCA), 'utf8').catch(() => '');
      if (!marca.includes(c.commit)) instalado = false;
    }
    const origens = await origensDosAgentes();
    // Agente com o mesmo nome que já era seu conta como presente (ele fica, o nosso não entra).
    for (const a of c.agentes || []) {
      const nosso = String(origens[a] || '').includes(c.commit);
      if (!nosso && (origens[a] || !existsSync(join(PASTA_AGENTES(), `${a}.md`)))) instalado = false;
    }
    return { nome: c.nome, faz: c.faz, instalado };
  }));
  return [...PACOTE.map((p) => ({ nome: p.nome, faz: p.faz,
    instalado: p.plugins.every((pl) => lista.includes(pl)) })), ...copiadas];
}

/**
 * Os arquivos de um .tar (o que o GitHub entrega, já sem o gzip): caminho → conteúdo.
 * Entende o cabeçalho pax (caminhos longos) e ignora pastas e links.
 */
export function arquivosDoTar(tar) {
  const saida = new Map();
  let i = 0;
  let caminhoPax = null;
  const campo = (ini, fim) => tar.subarray(ini, fim).toString('utf8').replace(/\0.*$/s, '');
  while (i + 512 <= tar.length) {
    const cab = tar.subarray(i, i + 512);
    if (cab.every((b) => b === 0)) break;
    const tamanho = parseInt(campo(i + 124, i + 136).trim() || '0', 8);
    const tipo = String.fromCharCode(cab[156] || 48);
    const prefixo = campo(i + 345, i + 500);
    let caminho = (prefixo ? `${prefixo}/` : '') + campo(i, i + 100);
    const corpo = tar.subarray(i + 512, i + 512 + tamanho);
    if (tipo === 'x') {
      const m = corpo.toString('utf8').match(/\d+ path=([^\n]*)\n/);
      caminhoPax = m ? m[1] : null;
    } else if (tipo !== 'g') {
      if (caminhoPax) { caminho = caminhoPax; caminhoPax = null; }
      if (tipo === '0' || tipo === '\0') saida.set(caminho, Buffer.from(corpo));
    }
    i += 512 + Math.ceil(tamanho / 512) * 512;
  }
  return saida;
}

/** De onde veio cada agente que o Jarvis pôs em ~/.claude/agents (um agente é um arquivo só: a marca fica num índice). */
async function origensDosAgentes() {
  try { return JSON.parse(await readFile(join(PASTA_AGENTES(), MARCA + '.json'), 'utf8')); } catch { return {}; }
}

/** Baixa o commit conferido e copia só as pastas escolhidas para ~/.claude/skills. */
async function copia(c) {
  const r = await fetch(`https://codeload.github.com/${c.repo}/tar.gz/${c.commit}`, { signal: AbortSignal.timeout(120_000) });
  if (!r.ok) throw new Error(`o GitHub respondeu ${r.status}`);
  const arquivos = arquivosDoTar(gunzipSync(Buffer.from(await r.arrayBuffer())));
  const puladas = [];
  for (const pasta of c.pastas) {
    const destino = resolve(PASTA_SKILLS(), nomeDaSkill(pasta));
    // Uma skill sua com o mesmo nome não é apagada nem misturada.
    const marca = await readFile(join(destino, MARCA), 'utf8').catch(() => null);
    if (existsSync(destino) && marca === null) { puladas.push(nomeDaSkill(pasta)); continue; }
    let achou = false;
    for (const [caminho, corpo] of arquivos) {
      const semRaiz = caminho.split('/').slice(1).join('/'); // o GitHub põe "repo-commit/" na frente de tudo
      if (!semRaiz.startsWith(`${pasta}/`) || /\/tests?\//.test(semRaiz)) continue;
      const alvo = resolve(destino, semRaiz.slice(pasta.length + 1));
      if (!alvo.startsWith(destino + sep)) continue;
      await mkdir(dirname(alvo), { recursive: true });
      await writeFile(alvo, corpo);
      achou = true;
    }
    if (!achou || !existsSync(join(destino, 'SKILL.md'))) throw new Error(`a pasta ${pasta} não veio no download`);
    await writeFile(join(destino, MARCA), `${c.repo}@${c.commit}\n`);
  }
  // Pastas do repositório que vão para dentro de uma skill (os scripts e os modelos do /sales).
  for (const { de, para } of c.extras || []) {
    const destino = resolve(PASTA_SKILLS(), para);
    if (puladas.includes(para.split('/')[0])) continue;
    for (const [caminho, corpo] of arquivos) {
      const semRaiz = caminho.split('/').slice(1).join('/');
      if (!semRaiz.startsWith(`${de}/`)) continue;
      const alvo = resolve(destino, semRaiz.slice(de.length + 1));
      if (!alvo.startsWith(destino + sep)) continue;
      await mkdir(dirname(alvo), { recursive: true });
      await writeFile(alvo, corpo);
    }
  }
  // Os agentes (subagentes do Claude Code): um arquivo cada, em ~/.claude/agents. Um seu com o mesmo nome fica.
  if (c.agentes?.length) {
    await mkdir(PASTA_AGENTES(), { recursive: true });
    const origens = await origensDosAgentes();
    for (const nome of c.agentes) {
      const alvo = join(PASTA_AGENTES(), `${nome}.md`);
      if (existsSync(alvo) && !origens[nome]) { puladas.push(`agente ${nome}`); continue; }
      const achado = [...arquivos].find(([caminho]) => caminho.split('/').slice(1).join('/') === `agents/${nome}.md`);
      if (!achado) throw new Error(`o agente ${nome} não veio no download`);
      await writeFile(alvo, achado[1]);
      origens[nome] = `${c.repo}@${c.commit}`;
    }
    await writeFile(join(PASTA_AGENTES(), MARCA + '.json'), JSON.stringify(origens, null, 1));
  }
  return puladas;
}

/**
 * Quem já instalou o pacote antes ganha sozinho as copiadas novas (como a equipe de vendas):
 * é só copiar arquivos de uma versão conferida, sem mexer nos plugins.
 */
export async function completaAsCopiadas(diz = () => {}) {
  const s = await situacao().catch(() => []);
  const copiadas = s.slice(PACOTE.length);
  if (!copiadas.some((c) => c.instalado)) return [];
  const feitos = [];
  for (const [i, c] of COPIADAS.entries()) {
    if (copiadas[i]?.instalado) continue;
    try {
      const puladas = await copia(c);
      diz(`  ✦ skills: ${c.nome} instalado${puladas.length ? ` (já existiam: ${puladas.join(', ')})` : ''}`);
      feitos.push({ nome: c.nome, ok: true });
    } catch (e) {
      diz(`  ✦ skills: ${c.nome} falhou (${e.message})`);
      feitos.push({ nome: c.nome, ok: false, erro: texto(e.message, 200) });
    }
  }
  return feitos;
}

/** Instala o pacote inteiro (o que já está instalado é só conferido). */
export async function instala(diz = () => {}) {
  const feitos = [];
  for (const p of PACOTE) {
    const m = await rodaClaude(['plugin', 'marketplace', 'add', p.marketplace], { ms: 180_000 });
    const jaTinha = /already|já existe|exists/i.test(`${m.saida} ${m.erro}`);
    if (m.codigo !== 0 && !jaTinha) {
      feitos.push({ nome: p.nome, ok: false, erro: texto(m.erro || m.saida, 200) });
      continue;
    }
    let ok = true;
    let erro = '';
    for (const pl of p.plugins) {
      const r = await rodaClaude(['plugin', 'install', pl], { ms: 240_000 });
      if (r.codigo !== 0 && !/already installed|já instalad/i.test(`${r.saida} ${r.erro}`)) { ok = false; erro = texto(r.erro || r.saida, 200); }
    }
    diz(`  ✦ skills: ${p.nome} ${ok ? 'instalado' : `falhou (${erro})`}`);
    feitos.push({ nome: p.nome, ok, erro });
  }
  for (const c of COPIADAS) {
    try {
      const puladas = await copia(c);
      const erro = puladas.length ? `você já tinha skills com o nome ${puladas.join(', ')}; ficaram as suas` : '';
      diz(`  ✦ skills: ${c.nome} instalado${erro ? ` (${erro})` : ''}`);
      feitos.push({ nome: c.nome, ok: true, erro });
    } catch (e) {
      diz(`  ✦ skills: ${c.nome} falhou (${e.message})`);
      feitos.push({ nome: c.nome, ok: false, erro: texto(e.message, 200) });
    }
  }
  return feitos;
}
