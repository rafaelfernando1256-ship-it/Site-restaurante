/**
 * O PRINT DO INSTAGRAM — o que o estúdio mostra ao Claude Code antes da demo.
 *
 * O Instagram é onde o negócio já mostra a cara: o logo, as cores, o tipo de
 * foto, o jeito de falar. Um print do perfil (no computador e no celular)
 * diz mais ao Claude Code do que qualquer descrição.
 *
 * Sem login: abre o perfil público num navegador limpo, fecha a janela de
 * "entre no Instagram" para a foto não sair coberta, e tira o print.
 *
 * E GUARDA AS FOTOS DOS POSTS (`_instagram/foto-01.jpg`...): elas VÃO PARA O
 * SITE, dentro do próprio HTML. Antes os prints serviam só de referência de
 * cores, e as fotos do site vinham só do Maps — o dono abria a demonstração
 * e não via nenhuma foto do Instagram dele.
 *
 * Se o Instagram mandar para a tela de login ou o perfil não existir, devolve
 * `{ falhou: true, motivo }`: quem chamou decide (o estúdio não faz a demo
 * sem os prints de quem tem Instagram). Nunca usa a sua conta do Instagram.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { texto } from './comum.mjs';

const NAVEGADOR_COMUM = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const CELULAR = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 '
  + '(KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const EXTENSAO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** "@pizzariabella", "instagram.com/pizzariabella" ou o link inteiro → o endereço do perfil. */
export function enderecoDoPerfil(bruto) {
  const t = String(bruto || '').trim();
  if (!t) return '';
  if (/^@?[\w.]{1,30}$/.test(t)) return `https://www.instagram.com/${t.replace(/^@/, '')}/`;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (!/(^|\.)instagram\.com$/i.test(u.hostname)) return '';
    const perfil = u.pathname.split('/').filter(Boolean)[0];
    if (!perfil || ['p', 'reel', 'reels', 'stories', 'explore', 'accounts'].includes(perfil)) return '';
    return `https://www.instagram.com/${perfil}/`;
  } catch { return ''; }
}

/** Fecha (ou tira da frente) a janela de login e os avisos de cookie, só para o print. */
async function tiraDaFrente(pagina) {
  for (const rotulo of [/permitir todos os cookies/i, /allow all cookies/i, /recusar cookies opcionais/i, /decline optional cookies/i]) {
    const b = pagina.getByRole('button', { name: rotulo }).first();
    if (await b.isVisible().catch(() => false)) { await b.click({ timeout: 2500 }).catch(() => {}); await pagina.waitForTimeout(800); break; }
  }
  await pagina.keyboard.press('Escape').catch(() => {});
  const fechar = pagina.locator('[role="dialog"] [aria-label="Fechar"], [role="dialog"] [aria-label="Close"]').first();
  if (await fechar.isVisible().catch(() => false)) {
    await fechar.click({ timeout: 2500 }).catch(() => {});
    await pagina.waitForTimeout(600);
  }
  // O que sobrou na frente (a janela que não fecha, a faixa fixa de "Entrar") sai do print.
  await pagina.evaluate(() => {
    for (const d of document.querySelectorAll('[role="dialog"], [role="presentation"]')) d.remove();
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      if (s.position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.height > window.innerHeight * 0.5 || (/entrar|log in|cadastr|sign up/i.test(el.textContent || '') && r.height < 220)) el.remove();
    }
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
  }).catch(() => {});
}

/**
 * Os bytes de uma imagem: a que a página já baixou, ou baixada de novo.
 * A resposta guardada do navegador às vezes vem VAZIA (o Chromium não
 * guarda o corpo de toda imagem) — e por isso o logo nunca era salvo.
 * Devolve `{ bytes, extensao }` ou nulo.
 */
async function bytesDaImagem(ctx, imagens, src, { minimo = 2_000, maximo = 1_500_000 } = {}) {
  for (const pega of [() => imagens.get(src), () => ctx.request.get(src, { timeout: 20_000 })]) {
    try {
      const r = await pega();
      if (!r || !r.ok()) continue;
      const tipo = String(r.headers()['content-type'] || '').split(';')[0].trim();
      const bytes = EXTENSAO[tipo] ? await r.body() : null;
      if (bytes && bytes.length > minimo && bytes.length < maximo) return { bytes, extensao: EXTENSAO[tipo] };
    } catch { /* tenta o próximo */ }
  }
  return null;
}

/**
 * As fotos dos posts da grade, salvas como arquivo. Prefere a versão de uns
 * 640px que o próprio Instagram oferece (boa no site e leve no HTML); se o
 * download falhar, recorta a foto da tela, sem a interface em volta.
 */
async function guardaFotos(pagina, ctx, imagens, destino, { maximo = 8 } = {}) {
  const SELETOR = 'a[href*="/p/"] img, a[href*="/reel/"] img';
  const lidas = await pagina.evaluate((seletor) => [...document.querySelectorAll(seletor)].map((img) => {
    const opcoes = (img.srcset || '').split(',').map((x) => x.trim().split(/\s+/))
      .filter((x) => x[0]).map(([u, w]) => ({ u, w: parseInt(w, 10) || 0 }));
    const boa = opcoes.filter((o) => o.w >= 600).sort((a, b) => a.w - b.w)[0]
      || opcoes.sort((a, b) => b.w - a.w)[0];
    const r = img.getBoundingClientRect();
    return { src: boa?.u || img.currentSrc || img.src || '', alt: img.alt || '', grande: r.width >= 80 };
  }), SELETOR).catch(() => []);
  const fotos = [];
  for (const [i, f] of lidas.entries()) {
    if (fotos.length >= maximo) break;
    if (!f.grande) continue;
    const numero = String(fotos.length + 1).padStart(2, '0');
    let arquivo = '';
    if (f.src && !f.src.startsWith('data:')) {
      const img = await bytesDaImagem(ctx, imagens, f.src, { minimo: 6_000 });
      if (img) {
        arquivo = `foto-${numero}.${img.extensao}`;
        await writeFile(join(destino, arquivo), img.bytes);
      }
    }
    if (!arquivo) {
      try {
        const alvo = pagina.locator(SELETOR).nth(i);
        await alvo.scrollIntoViewIfNeeded({ timeout: 3000 });
        arquivo = `foto-${numero}.jpg`;
        await alvo.screenshot({ path: join(destino, arquivo), type: 'jpeg', quality: 85, timeout: 5000 });
      } catch { arquivo = ''; }
    }
    if (arquivo) fotos.push({ arquivo: `_instagram/${arquivo}`, descricao: texto(f.alt, 200) });
  }
  return fotos;
}

/** O que dá para ler do perfil sem login: o nome, a bio, o link. Vai em texto, ao lado do print. */
async function leCabecalho(pagina) {
  return pagina.evaluate(() => {
    const cab = document.querySelector('header');
    const meta = document.querySelector('meta[property="og:description"], meta[name="description"]');
    return { cabecalho: cab ? cab.innerText : '', descricao: meta?.getAttribute('content') || '' };
  }).catch(() => ({ cabecalho: '', descricao: '' }));
}

/**
 * Tira os prints do perfil para `pasta/_instagram/`. Devolve
 * `{ url, computador, celular, texto, logo }` (caminhos relativos à pasta)
 * ou `null` com o motivo no `diz`.
 */
export async function fotografaInstagram(bruto, pasta, { diz = () => {}, espera = 5000, prepara = null } = {}) {
  const url = enderecoDoPerfil(bruto);
  if (!url) return { falhou: true, motivo: `"${texto(bruto, 80)}" não é um perfil do Instagram` };
  const destino = join(pasta, '_instagram');
  await mkdir(destino, { recursive: true });
  const { chromium } = await import('playwright');
  // MATILHA_CHROMIUM: só para os testes, numa máquina com outro Chrome.
  const navegador = await chromium.launch({ headless: true, ...(process.env.MATILHA_CHROMIUM ? { executablePath: process.env.MATILHA_CHROMIUM } : {}) });
  const saida = { url, computador: '', celular: '', texto: '', logo: '', fotos: [] };
  let motivo = '';
  try {
    for (const [nome, opcoes, alturaMax] of [
      ['computador', { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, userAgent: NAVEGADOR_COMUM }, 2200],
      ['celular', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: CELULAR }, 2600],
    ]) {
      const ctx = await navegador.newContext({ ...opcoes, locale: 'pt-BR' });
      if (prepara) await prepara(ctx); // só nos testes: o Instagram de mentira
      const pagina = await ctx.newPage();
      // As imagens que a página já baixou: o logo sai daqui, sem baixar de novo.
      const imagens = new Map();
      pagina.on('response', (resp) => { if (resp.request().resourceType() === 'image') imagens.set(resp.url(), resp); });
      try {
        await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 40_000 });
        await pagina.waitForTimeout(espera);
        const corpo = await pagina.evaluate(() => document.body.innerText || '').catch(() => '');
        const login = /accounts\/login|challenge|\/suspended/.test(pagina.url());
        const fora = /esta página não está disponível|this page isn.t available|sorry, this page/i.test(corpo) || !(await pagina.locator('header').count());
        if (login || fora) {
          // Um dos dois (computador ou celular) às vezes passa quando o outro
          // cai no login: tenta o outro antes de desistir.
          motivo = login ? 'o Instagram pediu login para abrir o perfil'
            : `o perfil ${url} não abriu (não existe ou está fora do ar)`;
          continue;
        }
        await tiraDaFrente(pagina);
        // Rola um pouco para as fotos da grade carregarem, e volta ao topo.
        await pagina.evaluate(() => window.scrollBy(0, 1400)).catch(() => {});
        await pagina.waitForTimeout(1500);
        await pagina.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
        await tiraDaFrente(pagina);
        await pagina.waitForTimeout(500);
        const altura = await pagina.evaluate(() => document.documentElement.scrollHeight).catch(() => 900);
        await pagina.screenshot({ path: join(destino, `perfil-${nome}.jpg`), type: 'jpeg', quality: 72, fullPage: true,
          clip: { x: 0, y: 0, width: opcoes.viewport.width, height: Math.min(altura, alturaMax) } });
        saida[nome] = `_instagram/perfil-${nome}.jpg`;
        // As fotos dos posts: na primeira vista que abrir (computador ou celular).
        if (!saida.fotos.length) saida.fotos = await guardaFotos(pagina, ctx, imagens, destino);

        if (nome === 'computador') {
          const lido = await leCabecalho(pagina);
          saida.texto = texto(`${lido.cabecalho}\n${lido.descricao}`.trim(), 1500);
          if (saida.texto) await writeFile(join(destino, 'perfil.txt'), saida.texto, 'utf8');
          // A foto do perfil, que quase sempre é o logo.
          const src = await pagina.evaluate(() => {
            const i = [...document.querySelectorAll('header img')].sort((a, b) => (b.naturalWidth || 0) - (a.naturalWidth || 0))[0];
            return i ? (i.currentSrc || i.src) : '';
          }).catch(() => '');
          if (src) {
            const img = await bytesDaImagem(ctx, imagens, src, { maximo: 600_000 });
            if (img) {
              const arquivo = `logo.${img.extensao}`;
              await writeFile(join(destino, arquivo), img.bytes);
              saida.logo = `_instagram/${arquivo}`;
            } else {
              // O download falhou: recorta o logo da tela, como as fotos.
              try {
                await pagina.locator('header img').first().screenshot({ path: join(destino, 'logo.png'), type: 'png', timeout: 5000 });
                saida.logo = '_instagram/logo.png';
              } catch { /* sem logo, segue */ }
            }
          }
        }
      } finally { await ctx.close().catch(() => {}); }
    }
  } catch (e) {
    motivo = `o navegador falhou: ${texto(e.message, 120)}`;
  } finally { await navegador.close().catch(() => {}); }
  if (!saida.computador && !saida.celular) {
    diz(`  ✗ Instagram ${url}: ${motivo || 'nenhum print saiu'}`);
    return { falhou: true, motivo: motivo || 'nenhum print saiu', url };
  }
  diz(`  ▣ Instagram ${url}: print tirado e ${saida.fotos.length} foto(s) dos posts guardada(s)`);
  return saida;
}
