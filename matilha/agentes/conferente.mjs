/**
 * O CONFERENTE DE DESIGN — lê o HTML que o estúdio entregou e aponta o
 * que dá cara de "site feito por IA".
 *
 * Pedir no briefing não basta: o modelo volta ao padrão dele assim que
 * se distrai. Então o resultado é conferido, como o vendedor confere
 * preço. O que for "grave" volta para o Claude Code consertar, numa
 * passada só para isso; o que for "aviso" vai junto na revisão visual.
 * As regras seguem um registro de "marcas de site gerado" mantido por
 * quem estuda isso (gradiente, glow, etiqueta em caixa alta, três
 * cartões com ícone, estrelas…), mais a paleta e as fontes da direção
 * escolhida para o cliente.
 */

const FRASES_FEITAS = ['bateu a fome', 'sabor inesquecível', 'sabor inesquecivel', 'feito com amor', 'feita com amor',
  'experiência única', 'experiencia unica', 'qualidade e excelência', 'venha conferir', 'o melhor da região',
  'o melhor da cidade', 'seja bem-vindo', 'seja bem vindo', 'tradição e sabor', 'não perca', 'sabor que conquista',
  'momentos especiais', 'do jeito que você merece', 'excelência em', 'paixão por'];

/** #abc / #aabbcc → {r,g,b}. */
function rgbDe(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
  if (h.length === 8) h = h.slice(0, 6);
  if (h.length !== 6) return null;
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function saturacaoLuz({ r, g, b }) {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B); const min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const s = max === min ? 0 : (l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min));
  return { s, l };
}
const distancia = (a, b) => Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);

/** O CSS da página, regra por regra (seletor e corpo). */
function regras(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '').split('}').map((bloco) => {
    const i = bloco.lastIndexOf('{');
    return i < 0 ? null : { seletor: bloco.slice(0, i).trim(), corpo: bloco.slice(i + 1) };
  }).filter(Boolean);
}

/**
 * Confere um site. Devolve `[{ nivel: 'grave'|'aviso', regra, detalhe }]`.
 * `direcao` traz a paleta e as fontes que tinham de ser usadas.
 */
export function confereDesign(html, direcao = null) {
  const achados = [];
  const acha = (nivel, regra, detalhe) => achados.push({ nivel, regra, detalhe });
  const css = [...String(html).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n')
    + '\n' + [...String(html).matchAll(/style="([^"]*)"/gi)].map((m) => `x{${m[1]}}`).join('\n');
  const texto = String(html).replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').toLowerCase();

  // gradiente (a película preta lisa sobre foto é a única exceção)
  for (const m of css.matchAll(/(?:linear|radial|conic)-gradient\(([^;]*)\)/gi)) {
    const dentro = m[1].toLowerCase();
    const cores = dentro.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(?:red|orange|yellow|gold|white|green|blue|purple|pink|brown)\b/g) || [];
    const preta = (c) => /^#0{3}(?:0{3})?$/.test(c) || /^#0{6}[0-9a-f]{2}$/.test(c)
      || /^rgba?\(\s*0[\s,]+0[\s,]+0\b/.test(c) || /,\s*0(?:\.0+)?\s*\)$/.test(c);
    const soPelicula = cores.length > 0 && cores.every(preta);
    if (!soPelicula) { acha('grave', 'gradiente', m[0].slice(0, 80)); break; }
  }
  if (/background-clip\s*:\s*text|-webkit-text-fill-color\s*:\s*transparent/i.test(css)) acha('grave', 'texto com gradiente', 'background-clip: text');

  for (const r of regras(css)) {
    const sel = r.seletor.toLowerCase();
    const corpo = r.corpo.toLowerCase();
    // sombra e brilho (foco de teclado e o menu aberto podem)
    if (/box-shadow\s*:\s*(?!none)/.test(corpo) && !/focus|:hover|dialog|menu|modal/.test(sel)) {
      acha('grave', 'sombra ou brilho', `${r.seletor.slice(0, 50)} { box-shadow }`);
    }
    if (/text-shadow\s*:\s*(?!none)/.test(corpo)) acha('grave', 'sombra no texto', r.seletor.slice(0, 50));
    if (/filter\s*:[^;]*drop-shadow/.test(corpo)) acha('grave', 'sombra (drop-shadow)', r.seletor.slice(0, 50));
    // a etiqueta: caixa alta + letras espaçadas + letra pequena
    if (/text-transform\s*:\s*uppercase/.test(corpo)) {
      const espaco = Number((corpo.match(/letter-spacing\s*:\s*(-?[\d.]+)em/) || [])[1] || 0);
      const px = Number((corpo.match(/font-size\s*:\s*([\d.]+)px/) || [])[1] || 0);
      const rem = Number((corpo.match(/font-size\s*:\s*([\d.]+)rem/) || [])[1] || 0);
      const pequena = (px && px <= 15) || (rem && rem <= 0.95) || /font-size\s*:\s*(?:\.\d|0\.\d)/.test(corpo);
      if (espaco >= 0.06 && pequena) acha('grave', 'etiqueta em caixa alta acima de título', r.seletor.slice(0, 50));
    }
    // linha fina separando coisas (tabela de horário pode)
    if (/border(?:-top|-bottom)?\s*:\s*1px\s+solid/.test(corpo) && !/table|td|th|tr|input|textarea|select/.test(sel)) {
      acha('aviso', 'linha ou caixa de 1px', r.seletor.slice(0, 50));
    }
  }

  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(texto.replace(/★/g, ''))) acha('grave', 'emoji', 'emoji no texto');
  if ((String(html).match(/★|⭐/g) || []).length >= 2) acha('grave', 'estrelas desenhadas', 'mais de uma estrela');
  if (/>\s*0[1-9]\s*</.test(html)) acha('grave', 'numeração 01 / 02 / 03', 'números com zero na frente');
  for (const f of FRASES_FEITAS) if (texto.includes(f)) acha('grave', 'frase feita', `"${f}"`);

  // ilustração desenhada do produto: um SVG com muitas formas
  for (const m of String(html).matchAll(/<svg[\s\S]*?<\/svg>/gi)) {
    const formas = (m[0].match(/<(circle|ellipse|path|rect|polygon|line)\b/gi) || []).length;
    if (formas >= 14) { acha('grave', 'ilustração desenhada em SVG', `${formas} formas num desenho só`); break; }
  }

  const consulte = (texto.match(/\bconsulte\b|\bpergunte\b|pelo whatsapp\b/g) || []).length;
  if ((texto.match(/\bconsulte\b/g) || []).length >= 3) acha('grave', 'lista vazia fingindo conteúdo', `${consulte} "consulte/pergunte"`);
  const cartoes = (String(html).match(/class="[^"]*\b(card|cartao|feature)\b/gi) || []).length;
  if (cartoes >= 3) acha('aviso', 'cartões repetidos', `${cartoes} elementos "card"`);
  const centros = (css.match(/text-align\s*:\s*center/gi) || []).length;
  if (centros >= 6) acha('aviso', 'centralizado demais', `${centros} regras centralizadas`);

  if (direcao) {
    // as fontes da direção
    if (!String(html).includes('fonts.googleapis.com') || !css.includes(direcao.fontes.titulo)) {
      acha('grave', 'fontes da direção não usadas', `era ${direcao.fontes.titulo} / ${direcao.fontes.texto}`);
    }
    // cor fora da paleta: só conta cor de verdade (cinza e preto/branco passam)
    const paleta = Object.values(direcao.paleta).map(rgbDe).filter(Boolean);
    const fora = new Set();
    for (const m of css.matchAll(/#([0-9a-f]{3,8})\b/gi)) {
      const c = rgbDe(m[0]);
      if (!c) continue;
      const { s, l } = saturacaoLuz(c);
      if (s < 0.28 || l < 0.12 || l > 0.9) continue;
      if (paleta.some((p) => distancia(p, c) < 42)) continue;
      fora.add(m[0].toLowerCase());
    }
    if (fora.size) acha(fora.size >= 2 ? 'grave' : 'aviso', 'cor fora da paleta', [...fora].slice(0, 6).join(', '));
  }
  return achados;
}

/** Os achados em texto, para o pedido de conserto. */
export function emTexto(achados) {
  // Agrupado por regra: dez linhas de "caixa de 1px" viram uma, com exemplos.
  const grupos = new Map();
  for (const a of achados) {
    const g = grupos.get(a.regra) || { nivel: a.nivel, detalhes: [] };
    if (a.nivel === 'grave') g.nivel = 'grave';
    g.detalhes.push(a.detalhe);
    grupos.set(a.regra, g);
  }
  return [...grupos].map(([regra, g]) => `- [${g.nivel}] ${regra}: ${[...new Set(g.detalhes)].slice(0, 4).join(' · ')}`).join('\n');
}
