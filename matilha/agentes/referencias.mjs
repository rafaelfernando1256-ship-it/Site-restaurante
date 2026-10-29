/**
 * AS REFERÊNCIAS DO ESTÚDIO — prints de sites de marcas grandes do
 * mesmo ramo, para o Claude Code ver o nível que se espera.
 *
 * ─────────────────────────────────────────────────────────────────
 * REFERÊNCIA, NÃO CONTEÚDO
 * ─────────────────────────────────────────────────────────────────
 * Os prints mostram COMO uma marca grande organiza o topo, o cardápio,
 * as fotos, o botão de ação. Eles nunca entram no site do cliente:
 * nada de logo, nome, texto, foto ou cor de marca de ninguém. O
 * briefing diz isso com todas as letras, e os prints ficam numa pasta
 * separada, que o publicador não lê.
 *
 * Os prints são tirados uma vez e guardados (dados/referencias/), e
 * refeitos depois de 30 dias ou quando a lista muda. Tirar print é um
 * Chrome invisível, separado das janelas dos caçadores.
 */
import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { ramoDe, RAMOS_COM_REFERENCIA } from './roteiro.mjs';

const VALIDADE = 30 * 24 * 60 * 60 * 1000;
const NAVEGADOR_COMUM = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0 Safari/537.36';

/** A lista que vale para um ramo: a sua, do painel, ou a padrão. */
export function listaDoRamo(chave, ajustes = {}) {
  const suas = ajustes.referencias?.[chave];
  if (Array.isArray(suas) && suas.length) return suas.filter((u) => /^https?:\/\//.test(u)).slice(0, 8);
  return (RAMOS_COM_REFERENCIA.find((r) => r.chave === chave)?.referencias || []).slice(0, 8);
}

/** Todas as listas, para o painel mostrar e editar. */
export function todasAsListas(ajustes = {}) {
  return Object.fromEntries(RAMOS_COM_REFERENCIA.map((r) => [r.chave, listaDoRamo(r.chave, ajustes)]));
}

const nomeDoArquivo = (url) => {
  const u = new URL(url);
  const caminho = u.pathname.replace(/\/+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
  return `${u.hostname.replace(/^www\./, '')}${u.port ? `-${u.port}` : ''}${caminho ? `-${caminho}` : ''}`.replace(/[^a-z0-9.-]/gi, '-').slice(0, 80);
};

/** Aceita o aviso de cookies, se houver: com ele, o print sai tapado. */
async function tiraOAviso(pagina) {
  for (const rotulo of ['Aceitar todos', 'Aceitar', 'Aceito', 'Concordo', 'Accept all', 'Accept', 'Allow all', 'Entendi', 'OK', 'Got it']) {
    const botao = pagina.getByRole('button', { name: new RegExp(`^\\s*${rotulo}`, 'i') }).first();
    if (await botao.isVisible().catch(() => false)) {
      await botao.click({ timeout: 2000 }).catch(() => {});
      await pagina.waitForTimeout(600);
      return;
    }
  }
}

/** Rola devagar até o fim: muita foto só carrega quando aparece na tela. */
async function rolaTudo(pagina, ate = 3200) {
  for (let y = 0; y < ate; y += 600) {
    await pagina.evaluate((v) => window.scrollTo(0, v), y);
    await pagina.waitForTimeout(250);
  }
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForTimeout(500);
}

/** Um site, dois prints: computador (a página até ~2.800 px) e celular (a primeira tela). */
async function fotografa(navegador, url, pasta) {
  const nome = nomeDoArquivo(url);
  const computador = join(pasta, `${nome}-computador.jpg`);
  const celular = join(pasta, `${nome}-celular.jpg`);

  const ctx = await navegador.newContext({ viewport: { width: 1366, height: 900 }, locale: 'pt-BR', userAgent: NAVEGADOR_COMUM });
  try {
    const pagina = await ctx.newPage();
    await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 35_000 });
    await pagina.waitForTimeout(3500);
    await tiraOAviso(pagina);
    await rolaTudo(pagina);
    const altura = await pagina.evaluate(() => document.documentElement.scrollHeight);
    if (altura < 700) throw new Error('página curta demais (bloqueio ou erro)');
    // Página de bloqueio ("verifique que você é humano") tem quase nada escrito.
    const letras = await pagina.evaluate(() => (document.body?.innerText || '').trim().length);
    if (letras < 60) throw new Error('página quase vazia (bloqueio ou erro)');
    await pagina.screenshot({ path: computador, type: 'jpeg', quality: 62, fullPage: true,
      clip: { x: 0, y: 0, width: 1366, height: Math.min(altura, 2800) } });
  } finally { await ctx.close(); }

  const ctxCel = await navegador.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  try {
    const pagina = await ctxCel.newPage();
    await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 35_000 });
    await pagina.waitForTimeout(3000);
    await tiraOAviso(pagina);
    await pagina.screenshot({ path: celular, type: 'jpeg', quality: 62 });
  } catch { /* o print do celular é bônus */ } finally { await ctxCel.close(); }

  // Página em branco sai num JPEG minúsculo: não serve de referência.
  if ((await stat(computador)).size < 6_000) throw new Error('print em branco');
  return { url, computador, celular: existsSync(celular) ? celular : null };
}

/**
 * Os prints de um ramo, do cache ou tirados agora. Devolve a lista dos
 * que deram certo; um site que falha não para os outros.
 */
export async function printsDoRamo(chave, { pastaDados, ajustes = {}, maximo = 3, refaz = false, diz = () => {} } = {}) {
  const urls = listaDoRamo(chave, ajustes);
  const pasta = join(pastaDados, 'referencias', chave);
  const arquivoMeta = join(pasta, 'meta.json');
  await mkdir(pasta, { recursive: true });

  let meta = null;
  try { meta = JSON.parse(await readFile(arquivoMeta, 'utf8')); } catch { meta = null; }
  const valeAinda = meta && !refaz && JSON.stringify(meta.urls) === JSON.stringify(urls)
    && Date.now() - meta.quando < VALIDADE && meta.ok?.length
    && meta.ok.every((r) => existsSync(r.computador));
  if (valeAinda) return meta.ok;

  const { chromium } = await import('playwright');
  const navegador = await chromium.launch({ headless: true });
  const ok = [];
  const falhas = [];
  try {
    for (const url of urls) {
      if (ok.length >= maximo) break;
      try {
        ok.push(await fotografa(navegador, url, pasta));
        diz(`  ▣ referência: ${url}`);
      } catch (e) {
        falhas.push({ url, erro: String(e.message).split('\n')[0].slice(0, 120) });
      }
    }
  } finally { await navegador.close().catch(() => {}); }

  await writeFile(arquivoMeta, JSON.stringify({ urls, quando: Date.now(), ok, falhas }, null, 2), 'utf8');
  return ok;
}

/** Copia os prints do ramo deste cliente para a pasta onde o Claude Code trabalha. */
export async function referenciasParaOCliente(lead, pastaCliente, opcoes = {}) {
  const ramo = ramoDe(lead?.tipo);
  let prints = [];
  try {
    prints = await printsDoRamo(ramo.chave, opcoes);
  } catch (e) {
    opcoes.diz?.(`  · referências de ${ramo.chave} indisponíveis: ${String(e.message).slice(0, 120)}`);
    return [];
  }
  const destino = join(pastaCliente, '_referencias');
  await mkdir(destino, { recursive: true });
  const copiados = [];
  for (const p of prints) {
    for (const arquivo of [p.computador, p.celular].filter(Boolean)) {
      const nome = arquivo.split(/[\\/]/).pop();
      await copyFile(arquivo, join(destino, nome)).catch(() => {});
      copiados.push({ url: p.url, arquivo: `_referencias/${nome}` });
    }
  }
  return copiados;
}

/**
 * Prints do site que o Claude Code acabou de fazer, no computador e no
 * celular, e a lista de imagens que não carregaram. É o que ele recebe
 * na revisão visual: corrigir olhando, e não imaginando.
 */
export async function fotografaOSite(arquivoHtml, pastaSaida) {
  await mkdir(pastaSaida, { recursive: true });
  const { chromium } = await import('playwright');
  const navegador = await chromium.launch({ headless: true });
  const endereco = pathToFileURL(arquivoHtml).href;
  const quebradas = new Set();
  const erros = [];
  try {
    for (const [nome, opcoes, maxAltura] of [
      ['computador', { viewport: { width: 1366, height: 900 } }, 5200],
      ['celular', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, 4200],
    ]) {
      const ctx = await navegador.newContext(opcoes);
      const pagina = await ctx.newPage();
      pagina.on('pageerror', (e) => erros.push(e.message));
      await pagina.goto(endereco, { waitUntil: 'load', timeout: 45_000 }).catch(() => {});
      await rolaTudo(pagina, 6000);
      await pagina.waitForTimeout(1200);
      for (const src of await pagina.evaluate(() => [...document.images]
        .filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src))) quebradas.add(src);
      const medidas = await pagina.evaluate(() => ({
        altura: document.documentElement.scrollHeight,
        largura: document.documentElement.scrollWidth,
      }));
      if (nome === 'celular' && medidas.largura > 392) erros.push(`no celular a página tem ${medidas.largura}px de largura: rola para o lado`);
      await pagina.screenshot({ path: join(pastaSaida, `${nome}.jpg`), type: 'jpeg', quality: 62, fullPage: true,
        clip: { x: 0, y: 0, width: opcoes.viewport.width, height: Math.min(medidas.altura, maxAltura) } });
      await ctx.close();
    }
  } finally { await navegador.close().catch(() => {}); }
  return { computador: '_revisao/computador.jpg', celular: '_revisao/celular.jpg', quebradas: [...quebradas], erros };
}
