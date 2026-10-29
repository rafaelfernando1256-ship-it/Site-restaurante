/**
 * O CARDÁPIO — de onde vêm os pratos e os preços.
 *
 * Um cardápio digital sem os pratos do restaurante não vende nada, e um
 * cardápio com prato inventado é pior: o dono abre, vê "Pizza Marguerita
 * R$ 39,90" que ele nunca vendeu, e a conversa acaba ali. Então os itens
 * só vêm de três lugares, todos do próprio restaurante:
 *
 *   1. as fotos de cardápio da ficha dele no Google Maps;
 *   2. os posts do Instagram dele que são cardápio (a legenda automática
 *      do Instagram diz "pode ser uma imagem de texto que diz 'CARDÁPIO'");
 *   3. depois da venda, a foto que ELE manda pelo WhatsApp — essa é a que
 *      vale, porque é a de hoje.
 *
 * Este arquivo só ACHA e BAIXA as fotos, e cuida do formato da lista.
 * Quem lê a foto e transcreve é o Claude Code (`leCardapio`, no
 * claudecode.mjs), e quem confere antes de ir ao ar é você, no painel.
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { texto } from './comum.mjs';

const NAVEGADOR_COMUM = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0 Safari/537.36';

/** Legenda (alt) que sugere foto de cardápio. */
const PARECE_CARDAPIO = /card[áa]pio|menu|pre[çc]os?|r\$\s*\d|\d+,\d{2}|sabores|tabela|combos?|promo[çc]/i;

const EXTENSAO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };

/** Tamanho bom para ler: o Maps entrega miniatura, e o tamanho está no fim do endereço. */
const grandeDoMaps = (u) => u.replace(/=[swh]\d+[^/]*$/, '=w1600-h1600-k-no');

/** Clica no "Aceitar tudo" do Google, se aparecer: com ele na frente, nada carrega. */
async function aceitaCookies(pagina) {
  for (const rotulo of [/aceitar tudo/i, /accept all/i, /aceitar/i]) {
    const botao = pagina.getByRole('button', { name: rotulo }).first();
    if (await botao.isVisible().catch(() => false)) {
      await botao.click({ timeout: 2500 }).catch(() => {});
      await pagina.waitForTimeout(1200);
      return;
    }
  }
}

/** As fotos da aba "Cardápio" da ficha do Maps. */
async function doMaps(contexto, endereco, diz) {
  const pagina = await contexto.newPage();
  try {
    await pagina.goto(endereco, { waitUntil: 'domcontentloaded', timeout: 35_000 });
    await pagina.waitForTimeout(3500);
    await aceitaCookies(pagina);
    // A ficha tem uma aba ou um botão "Cardápio" (às vezes "Menu").
    let abriu = false;
    for (const papel of ['tab', 'button']) {
      const alvo = pagina.getByRole(papel, { name: /^\s*(card[áa]pio|menu)\b/i }).first();
      if (await alvo.isVisible().catch(() => false)) {
        await alvo.click({ timeout: 4000 }).catch(() => {});
        abriu = true;
        break;
      }
    }
    if (!abriu) { diz('  · Maps: a ficha não tem aba de cardápio'); return []; }
    await pagina.waitForTimeout(3000);
    const fotos = await pagina.evaluate(() => [...new Set([...document.querySelectorAll('img[src*="googleusercontent.com"], [style*="googleusercontent.com"]')]
      .map((el) => el.getAttribute('src') || (el.getAttribute('style') || '').match(/url\(["']?([^"')]+)/)?.[1] || '')
      .filter((u) => /googleusercontent\.com\/(?:p|gps-cs-s|geougc)\//.test(u)))]);
    return fotos.slice(0, 8).map((u) => ({ url: grandeDoMaps(u), origem: 'maps', dica: 'aba Cardápio do Google Maps' }));
  } catch (e) {
    diz(`  · Maps: ${texto(e.message, 100)}`);
    return [];
  } finally { await pagina.close().catch(() => {}); }
}

/** Os posts do Instagram que parecem cardápio, pela legenda automática. */
async function doInstagram(contexto, perfil, diz) {
  const pagina = await contexto.newPage();
  try {
    await pagina.goto(perfil, { waitUntil: 'domcontentloaded', timeout: 35_000 });
    await pagina.waitForTimeout(4500);
    if (/accounts\/login|challenge/.test(pagina.url())) { diz('  · Instagram pediu login: seguindo só com o Maps'); return []; }
    await pagina.evaluate(() => window.scrollBy(0, 900)).catch(() => {});
    await pagina.waitForTimeout(1500);
    const fotos = await pagina.evaluate(() => [...document.images]
      .filter((i) => /cdninstagram|fbcdn/.test(i.currentSrc || i.src) && (i.naturalWidth || i.width) >= 150)
      .map((i) => ({ url: i.currentSrc || i.src, alt: i.alt || '' })));
    if (!fotos.length) { diz('  · Instagram: nenhuma foto visível sem login'); return []; }
    // As que a legenda diz que têm texto de cardápio vêm primeiro; o
    // resto vai junto, poucas, porque às vezes a legenda não diz nada.
    const sim = fotos.filter((f) => PARECE_CARDAPIO.test(f.alt));
    const talvez = fotos.filter((f) => !PARECE_CARDAPIO.test(f.alt));
    return [...sim.slice(0, 6), ...talvez.slice(0, sim.length ? 2 : 4)]
      .map((f) => ({ url: f.url, origem: 'instagram', dica: texto(f.alt, 160) || 'post do Instagram' }));
  } catch (e) {
    diz(`  · Instagram: ${texto(e.message, 100)}`);
    return [];
  } finally { await pagina.close().catch(() => {}); }
}

/**
 * Acha e baixa as fotos que podem ser o cardápio deste restaurante, para
 * `pasta/_cardapio/`. Devolve `[{ arquivo, origem, dica }]`, na ordem em
 * que valem a pena ser lidas. Nada aqui é obrigatório: sem foto, a demo
 * sai sem a lista de pratos, como antes.
 */
export async function buscaFotosDoCardapio(lead, pasta, { maximo = 10, diz = () => {} } = {}) {
  const destino = join(pasta, '_cardapio');
  await mkdir(destino, { recursive: true });

  const { chromium } = await import('playwright');
  const navegador = await chromium.launch({ headless: true });
  const salvas = [];
  try {
    const contexto = await navegador.newContext({ viewport: { width: 1280, height: 900 }, locale: 'pt-BR', userAgent: NAVEGADOR_COMUM });
    const candidatas = [];
    if (lead?.maps) candidatas.push(...await doMaps(contexto, lead.maps, diz));
    if (lead?.instagram) candidatas.push(...await doInstagram(contexto, lead.instagram, diz));
    // As fotos que o caçador já anotou da ficha: às vezes uma delas é o cardápio.
    for (const u of (lead?.fotos || []).slice(0, 6)) candidatas.push({ url: grandeDoMaps(u), origem: 'maps', dica: 'foto da ficha do Google Maps' });

    const vistas = new Set();
    for (const c of candidatas) {
      if (salvas.length >= maximo) break;
      try {
        const r = await contexto.request.get(c.url, { timeout: 25_000 });
        const tipo = String(r.headers()['content-type'] || '').split(';')[0].trim();
        if (!r.ok() || !EXTENSAO[tipo]) continue;
        const corpo = await r.body();
        // Ícone e miniatura não se leem; foto de 8 MB é outra coisa.
        if (corpo.length < 8_000 || corpo.length > 8_000_000) continue;
        const marca = createHash('sha1').update(corpo).digest('hex');
        if (vistas.has(marca)) continue;
        vistas.add(marca);
        const nome = `${String(salvas.length + 1).padStart(2, '0')}-${c.origem}.${EXTENSAO[tipo]}`;
        await writeFile(join(destino, nome), corpo);
        salvas.push({ arquivo: `_cardapio/${nome}`, origem: c.origem, dica: c.dica });
      } catch { /* uma foto que não baixa não para as outras */ }
    }
  } finally { await navegador.close().catch(() => {}); }
  diz(`  ▤ ${lead?.nome}: ${salvas.length} foto(s) para procurar o cardápio`);
  return salvas;
}

/** Guarda as fotos que chegaram pelo WhatsApp (base64) e devolve o caminho de cada uma. */
export async function guardaFotoRecebida(pastaDados, leadId, foto) {
  const tipo = EXTENSAO[foto?.tipo] ? foto.tipo : 'image/jpeg';
  const corpo = Buffer.from(String(foto?.base64 || ''), 'base64');
  if (corpo.length < 2_000) return null;
  const marca = createHash('sha1').update(corpo).digest('hex');
  const pasta = join(pastaDados, 'recebidas', String(leadId).replace(/[^\w-]/g, ''));
  await mkdir(pasta, { recursive: true });
  const arquivo = join(pasta, `${marca.slice(0, 14)}.${EXTENSAO[tipo]}`);
  await writeFile(arquivo, corpo);
  return { arquivo, marca };
}

/* ── o formato da lista ───────────────────────────────────────── */

/** Limpa o que o Claude Code devolveu: só campos de texto, curtos, sem item vazio. */
export function normalizaItens(lista) {
  if (!Array.isArray(lista)) return [];
  return lista.map((i) => ({
    categoria: texto(i?.categoria, 60),
    nome: texto(i?.nome, 120),
    descricao: texto(i?.descricao, 220),
    preco: texto(i?.preco, 60),
  })).filter((i) => i.nome).slice(0, 300);
}

/** Agrupado por categoria, na ordem em que aparecem. */
export function porCategoria(itens = []) {
  const grupos = [];
  for (const i of normalizaItens(itens)) {
    const nome = i.categoria || 'Cardápio';
    let g = grupos.find((x) => x.categoria === nome);
    if (!g) { g = { categoria: nome, itens: [] }; grupos.push(g); }
    g.itens.push({ nome: i.nome, ...(i.descricao ? { descricao: i.descricao } : {}), ...(i.preco ? { preco: i.preco } : {}) });
  }
  return grupos;
}

/**
 * A lista em texto, para você conferir e corrigir no painel:
 *
 *   # Pizzas
 *   Calabresa | molho, calabresa e cebola | R$ 39,90
 *   Mussarela | R$ 35,00
 */
export function cardapioEmTexto(itens = []) {
  return porCategoria(itens).map((g) => [`# ${g.categoria}`,
    ...g.itens.map((i) => [i.nome, i.descricao, i.preco].filter(Boolean).join(' | '))].join('\n')).join('\n\n');
}

const PARECE_PRECO = /r\$|\d+[.,]\d{2}\b|^\s*\d+\s*$/i;

/** O caminho de volta: o texto do painel vira a lista. */
export function textoEmCardapio(bruto) {
  const itens = [];
  let categoria = '';
  for (const linha of String(bruto || '').split(/\r?\n/)) {
    const l = linha.trim();
    if (!l) continue;
    if (l.startsWith('#')) { categoria = l.replace(/^#+\s*/, ''); continue; }
    const partes = l.split('|').map((p) => p.trim());
    const [nome] = partes;
    let descricao = '';
    let preco = '';
    if (partes.length >= 3) { descricao = partes[1]; preco = partes.slice(2).join(' | '); } else if (partes.length === 2) {
      if (PARECE_PRECO.test(partes[1])) preco = partes[1]; else descricao = partes[1];
    }
    itens.push({ categoria, nome, descricao, preco });
  }
  return normalizaItens(itens);
}
