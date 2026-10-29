/**
 * ACHAR O INSTAGRAM — trabalho do CAÇADOR (agente 1), que entrega cada
 * negócio com o site, o telefone e o Instagram. O estúdio só usa o que
 * está salvo.
 *
 * O link do Instagram nem sempre aparece na ficha do Maps. Quando não
 * aparece, o caçador procura, nesta ordem (do mais certo para o menos):
 *
 *   1. o "site" cadastrado na ficha do Google, quando ele É o Instagram;
 *   2. a página de links (Linktree, Beacons...) que estava no lugar do
 *      site: ela quase sempre tem o Instagram;
 *   3. uma busca na internet por "nome + cidade + instagram".
 *
 * A busca só aceita um perfil se ele for DESTE negócio: o nome tem de
 * bater com o @ ou com o título do resultado. Instagram de outra empresa
 * nos prints é pior que nenhum — o Opus copiaria a identidade errada.
 *
 * O que for achado fica salvo no cliente.
 */
import { texto } from './comum.mjs';
import { enderecoDoPerfil } from './instagram.mjs';
import { PALAVRAS_DE_RAMO } from './roteiro.mjs';

const NAVEGADOR = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const NAO_E_PERFIL = new Set(['p', 'reel', 'reels', 'explore', 'stories', 'tv', 'accounts', 'about', 'legal',
  'developer', 'direct', 'web', 'privacy', 'terms', 'instagram']);
// Palavras que não identificam ninguém: "Pizzaria do Zé" se reconhece pelo "ze".
const VAZIAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'the', 'and', 'ltda', 'me', 'eireli']);

const simples = (t) => String(t || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Palavras de ramo e de fachada: toda clínica tem "clinica", toda pizzaria tem "pizzaria".
const GENERICAS = new Set([...PALAVRAS_DE_RAMO.map(simples), 'clinica', 'studio', 'estudio', 'espaco', 'casa',
  'centro', 'instituto', 'consultorio', 'medicina', 'saude', 'bem', 'estar', 'beleza', 'hair', 'nails',
  'delivery', 'express', 'gourmet', 'harmonizacao', 'facial', 'odontologia', 'restaurante', 'lanches']);

/** As palavras do nome que identificam ESTE negócio ("Clínica de Estética Batel" → batel). */
function palavrasDo(nome) {
  return simples(nome).split(' ').filter((p) => p.length >= 2 && !VAZIAS.has(p));
}
// A cidade também não identifica: "@esteticamaringa" é de qualquer clínica de Maringá.
function proprias(nome, cidade = '') {
  const daCidade = new Set(simples(cidade).split(' '));
  return palavrasDo(nome).filter((p) => !GENERICAS.has(p) && !daCidade.has(p));
}

/** Todos os perfis de Instagram citados num texto (HTML, resultado de busca...). */
export function perfisNoTexto(conteudo) {
  const achados = [];
  const bruto = String(conteudo || '').replace(/\\\//g, '/');
  const decodificado = bruto + ' ' + (() => { try { return decodeURIComponent(bruto); } catch { return ''; } })();
  for (const m of decodificado.matchAll(/instagram\.com\/([A-Za-z0-9_.]{1,30})/gi)) {
    const perfil = m[1].replace(/\.+$/, '');
    if (!perfil || NAO_E_PERFIL.has(perfil.toLowerCase())) continue;
    if (!achados.some((a) => a.toLowerCase() === perfil.toLowerCase())) achados.push(perfil);
  }
  return achados;
}

/**
 * O perfil é deste negócio? O @ tem de trazer o nome próprio dele (a
 * primeira palavra que não é de ramo: "batel", "baggio", "allure") e a
 * maior parte do resto; ou o título do resultado tem de trazer todas as
 * palavras próprias. Nome feito só de palavras de ramo ("Pizzaria
 * Delivery") exige todas no @, porque aí qualquer pizzaria combinaria.
 */
export function perfilCombina(perfil, nome, titulo = '', cidade = '') {
  const arroba = simples(perfil).replace(/ /g, '');
  const todas = palavrasDo(nome);
  if (!arroba || !todas.length) return false;
  const minhas = proprias(nome, cidade);
  if (!minhas.length) return todas.every((p) => arroba.includes(p));
  const marca = minhas.find((p) => p.length >= 3) || minhas[0];
  const cobertas = minhas.filter((p) => arroba.includes(p)).length;
  // Nome próprio curto ("Ki Delícia"): todas as palavras; longo: a maior parte.
  const precisa = minhas.length <= 2 ? minhas.length : Math.ceil(minhas.length / 2);
  if (arroba.includes(marca) && cobertas >= precisa) return true;
  const t = simples(titulo);
  return Boolean(t) && minhas.every((p) => t.includes(p));
}

async function baixa(url, segundos = 15) {
  const r = await fetch(url, { headers: { 'user-agent': NAVEGADOR, 'accept-language': 'pt-BR,pt;q=0.9' },
    redirect: 'follow', signal: AbortSignal.timeout(segundos * 1000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

/** Os resultados de uma busca: { url, titulo }, de onde der para ler. */
export function resultadosDaBusca(html) {
  const saida = [];
  // DuckDuckGo (versão HTML): o link real vem em uddg=..., o título no texto do <a>.
  for (const m of String(html).matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    let url = m[1];
    const uddg = url.match(/[?&]uddg=([^&]+)/);
    if (uddg) { try { url = decodeURIComponent(uddg[1]); } catch { /* fica o bruto */ } }
    saida.push({ url, titulo: m[2].replace(/<[^>]+>/g, '') });
  }
  // Bing: <h2><a href="...">título</a></h2>. O link às vezes vem embrulhado
  // num redirecionamento (bing.com/ck/a?...&u=a1<endereço em base64>).
  for (const m of String(html).matchAll(/<h2[^>]*><a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>/g)) {
    let url = m[1].replace(/&amp;/g, '&');
    const embrulhado = url.match(/[?&]u=a1([^&]+)/);
    if (embrulhado) {
      try { url = Buffer.from(embrulhado[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); } catch { /* fica o bruto */ }
    }
    saida.push({ url, titulo: m[2].replace(/<[^>]+>/g, '') });
  }
  return saida;
}

const BUSCAS = [
  (q) => `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}&kl=br-pt`,
  (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}&setlang=pt-BR&cc=BR`,
];

/**
 * Procura o Instagram do negócio. Devolve `{ instagram, como }` — o link do
 * perfil e de onde veio —, ou `{ instagram: '', como: 'motivo' }`.
 * Nunca lança: não achar não impede o site.
 */
export async function achaInstagram(lead, { websiteDoGoogle = '', baixar = baixa, diz = () => {} } = {}) {
  const nome = texto(lead?.nome, 140);
  if (!nome) return { instagram: '', como: 'sem nome' };

  // 1. O "site" da ficha do Google é o próprio Instagram.
  for (const candidato of [websiteDoGoogle, lead?.link_social, lead?.website, lead?.site]) {
    const perfil = enderecoDoPerfil(candidato);
    if (perfil) return { instagram: perfil, como: 'o site cadastrado no Google é o Instagram' };
  }

  // 2. A página de links (Linktree e parecidos) que estava no lugar do site.
  for (const pagina of [lead?.link_social, websiteDoGoogle, lead?.website].filter(Boolean)) {
    if (!/linktr\.ee|beacons\.ai|linkbio|bio\.link|lnk\.bio|campsite\.bio|taplink|linkin\.bio/i.test(pagina)) continue;
    try {
      const [perfil] = perfisNoTexto(await baixar(pagina));
      if (perfil) return { instagram: `https://www.instagram.com/${perfil}/`, como: 'achado na página de links dele' };
    } catch (e) {
      diz(`  · ${nome}: a página de links não abriu (${texto(e.message, 80)})`);
    }
  }

  // 3. A busca: "nome cidade instagram". Só vale perfil que combina com o nome.
  const consulta = `${nome} ${texto(lead?.cidade, 80)} instagram`.trim();
  let abriu = 0;
  for (const endereco of BUSCAS) {
    let html = '';
    try { html = await baixar(endereco(consulta)); abriu += 1; } catch { continue; }
    for (const r of resultadosDaBusca(html)) {
      const [perfil] = perfisNoTexto(r.url);
      if (perfil && perfilCombina(perfil, nome, r.titulo, lead?.cidade)) {
        return { instagram: `https://www.instagram.com/${perfil}/`, como: `achado na busca ("${texto(r.titulo, 60)}")` };
      }
    }
  }
  return { instagram: '', como: abriu ? 'nenhum perfil com o nome dele apareceu na busca'
    : 'a busca na internet não abriu (sem internet, ou o buscador recusou)' };
}
