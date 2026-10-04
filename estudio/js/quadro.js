/* ------------------------------------------------------------------
   O QUADRO — o tratamento dark e a legenda, em Canvas.

   É a tradução do motor/visual.py e motor/legenda.py para o navegador,
   com os MESMOS números, calibrados olhando três intensidades lado a
   lado: saturação 0.22, contraste 1.35, brilho 0.62, vinheta forte.

   O PROBLEMA QUE DECIDE O DESENHO: CANVAS CONTAMINADO

   Desenhar foto de outro domínio no canvas é permitido. LER os pixels de
   volta — que é o que `toBlob` faz, e é como a pessoa baixa o quadro —
   não é, a menos que o servidor da foto mande `Access-Control-Allow-
   Origin`. O canvas fica "contaminado" e o download falha.

   Por isso aqui:

     • a imagem é pedida com `crossOrigin = 'anonymous'` ANTES do `src`.
       A ordem importa de verdade: no Safari e em vários navegadores de
       celular, src antes de crossOrigin contamina do mesmo jeito.
     • o tratamento usa `ctx.filter`, que NÃO lê pixel. Funciona até em
       canvas contaminado, então a prévia sempre aparece.
     • o download é testado antes de ser oferecido. Se contaminou, a
       pessoa é avisada e tem a saída: usar foto do próprio celular, que
       é mesma origem e nunca contamina.
   ------------------------------------------------------------------ */

export const LARGURA = 1080;
export const ALTURA = 1920;

export const TEMA = {
  fundo: '#000000',          // preto PURO: em OLED o pixel apaga e a
  texto: '#ffffff',          // imagem flutua; #111 vira retângulo visível
  destaque: '#dc2626',
  saturacao: 0.22,
  contraste: 1.35,
  brilho: 0.62,
  vinheta: 0.92,
  grao: 7,
};

/* A fonte. Impact existe em todo Windows; as outras entram se a pessoa
   tiver instalado. A lista vai da melhor para a que sempre existe. */
export const FONTES =
  '"Anton", "Oswald", Impact, "Haettenschweiler", "Arial Black", sans-serif';

export function carrega(url) {
  return new Promise((ok, erro) => {
    const img = new Image();
    // ANTES do src, sempre. Depois não adianta.
    img.crossOrigin = 'anonymous';
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error('não consegui carregar a imagem'));
    img.src = url;
  });
}

/* Corta 9:16 pelo centro-ALTO. Em foto de pessoa o rosto está no terço
   superior; cortar pelo centro geométrico decapita metade delas. */
function recorte(img) {
  const alvo = LARGURA / ALTURA;
  const { width: l, height: a } = img;
  if (l / a > alvo) {
    const nl = Math.round(a * alvo);
    return { sx: Math.round((l - nl) / 2), sy: 0, sl: nl, sa: a };
  }
  const na = Math.round(l / alvo);
  return { sx: 0, sy: Math.round((a - na) * 0.15), sl: l, sa: na };
}

function vinheta(ctx, forca) {
  if (!forca) return;
  const g = ctx.createRadialGradient(
    LARGURA / 2, ALTURA / 2, Math.min(LARGURA, ALTURA) * 0.25,
    LARGURA / 2, ALTURA / 2, Math.max(LARGURA, ALTURA) * 0.62);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${forca})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, LARGURA, ALTURA);
}

/* Grão: desenhado como ruído, não lido do canvas — ler contaminaria. */
function grao(ctx, forca) {
  if (!forca) return;
  const n = 5200;
  ctx.save();
  ctx.globalAlpha = 0.055;
  for (let i = 0; i < n; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(Math.random() * LARGURA, Math.random() * ALTURA, 2, 2);
  }
  ctx.restore();
}

/* Quebra por palavra, medindo de verdade. */
function quebra(ctx, texto, larguraMax) {
  const linhas = [];
  let atual = '';
  for (const palavra of texto.split(/\s+/)) {
    const tenta = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(tenta).width <= larguraMax || !atual) atual = tenta;
    else { linhas.push(atual); atual = palavra; }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/* Acha o maior corpo que cabe. Diminuir é melhor que cortar: frase
   cortada no meio é o que mais faz rolar o feed. */
function corpoQueCabe(ctx, texto, larguraMax, alturaMax) {
  for (let tam = 110; tam >= 46; tam -= 4) {
    ctx.font = `700 ${tam}px ${FONTES}`;
    const linhas = quebra(ctx, texto, larguraMax);
    if (linhas.length * Math.round(tam * 1.18) <= alturaMax) {
      return { tam, linhas };
    }
  }
  ctx.font = `700 46px ${FONTES}`;
  return { tam: 46, linhas: quebra(ctx, texto, larguraMax) };
}

const MARCA = /\*([^*]+)\*/g;

export function desenha(canvas, { imagem = null, texto = '', posicao = 'meio',
                                  tema = TEMA } = {}) {
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = tema.fundo;
  ctx.fillRect(0, 0, LARGURA, ALTURA);

  if (imagem) {
    const { sx, sy, sl, sa } = recorte(imagem);
    // `filter` não lê pixel: funciona mesmo em canvas contaminado, e é o
    // que garante que a prévia sempre aparece.
    ctx.filter = `saturate(${tema.saturacao}) contrast(${tema.contraste}) `
               + `brightness(${tema.brilho})`;
    ctx.drawImage(imagem, sx, sy, sl, sa, 0, 0, LARGURA, ALTURA);
    ctx.filter = 'none';
    vinheta(ctx, tema.vinheta);
    grao(ctx, tema.grao);
  }

  if (!texto.trim()) return canvas;

  const margem = Math.round(LARGURA * 0.12);
  const larguraMax = LARGURA - 2 * margem;
  const limpo = texto.replace(MARCA, '$1');
  const { tam, linhas } = corpoQueCabe(ctx, limpo, larguraMax, ALTURA * 0.42);
  const passo = Math.round(tam * 1.18);
  const alto = linhas.length * passo;

  let y = posicao === 'alto' ? Math.round(ALTURA * 0.17)
        : posicao === 'baixo' ? Math.round(ALTURA * 0.62)
        : Math.round((ALTURA - alto) / 2);

  const marcadas = new Set();
  for (const m of texto.matchAll(MARCA)) {
    for (const p of m[1].split(/\s+/)) marcadas.add(limpa(p));
  }

  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(4, Math.round(tam / 7));
  ctx.strokeStyle = '#000';

  for (const linha of linhas) {
    let x = Math.round((LARGURA - ctx.measureText(linha).width) / 2);
    for (const palavra of linha.split(' ')) {
      const largura = ctx.measureText(palavra + ' ').width;
      // Contorno grosso em vez de caixa: legível sobre qualquer foto, sem
      // tapar a imagem nem parecer template.
      ctx.strokeText(palavra, x, y);
      ctx.fillStyle = marcadas.has(limpa(palavra)) ? tema.destaque : tema.texto;
      ctx.fillText(palavra, x, y);
      x += largura;
    }
    y += passo;
  }
  return canvas;
}

function limpa(p) {
  return p.replace(/[.,!?:;]/g, '').toLowerCase();
}

/* Dá o PNG, ou null quando o canvas está contaminado. Quem chama
   decide o que dizer — a mensagem certa depende de onde veio a foto. */
export function paraBlob(canvas) {
  return new Promise(ok => {
    try {
      canvas.toBlob(b => ok(b), 'image/png');
    } catch {
      ok(null);
    }
  });
}
