/**
 * O QR CODE — feito aqui dentro, sem biblioteca e sem internet.
 *
 * Por que não usar um site de "gerar QR"? Porque o que vai dentro
 * deste código é o endereço do seu notebook na rede MAIS o PIN do
 * painel. Mandar isso para um servidor de terceiro para ele desenhar
 * um quadradinho seria entregar a chave da sua casa para o chaveiro
 * tirar foto. Então ele é desenhado aqui.
 *
 * Só o necessário: texto puro (modo byte), correção de erro nível M
 * (aguenta ~15% do desenho sujo ou tapado) e versões 1 a 10, que vão
 * até 216 caracteres. Um endereço com PIN tem uns 40.
 */

/* ── a aritmética de Galois, que é onde mora a correção de erro ──
   Os bytes do QR não se somam como números: eles vivem num corpo de
   256 elementos onde somar é XOR. Estas duas tabelas são o log e o
   antilog desse corpo — com elas, multiplicar vira somar. */
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // o polinômio que define o corpo
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
}
const mul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

/** O polinômio gerador de grau `grau`, usado para dividir e achar o resto. */
function gerador(grau) {
  let poli = [1];
  for (let i = 0; i < grau; i += 1) {
    const novo = new Array(poli.length + 1).fill(0);
    for (let j = 0; j < poli.length; j += 1) {
      novo[j] ^= mul(poli[j], 1);
      novo[j + 1] ^= mul(poli[j], EXP[i]);
    }
    poli = novo;
  }
  return poli;
}

/** O resto da divisão — são esses bytes que deixam o QR legível sujo. */
function corrige(dados, quantos) {
  const gen = gerador(quantos);
  const resto = new Array(quantos).fill(0);
  for (const byte of dados) {
    const fator = byte ^ resto[0];
    resto.shift();
    resto.push(0);
    if (fator !== 0) {
      for (let i = 0; i < quantos; i += 1) resto[i] ^= mul(gen[i + 1], fator);
    }
  }
  return resto;
}

/* ── as tabelas da norma ──────────────────────────────────────────
   [bytes de correção por bloco, blocos do grupo 1, dados por bloco,
    blocos do grupo 2, dados por bloco] — nível M, versões 1 a 10. */
const BLOCOS = {
  1: [10, 1, 16, 0, 0],   2: [16, 1, 28, 0, 0],   3: [26, 1, 44, 0, 0],
  4: [18, 2, 32, 0, 0],   5: [24, 2, 43, 0, 0],   6: [16, 4, 27, 0, 0],
  7: [18, 4, 31, 0, 0],   8: [22, 2, 38, 2, 39],  9: [22, 3, 36, 2, 37],
  10: [26, 4, 43, 1, 44],
};
/** Onde ficam os quadradinhos de alinhamento, por versão. */
const ALINHAMENTO = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
};

const capacidade = (versao) => {
  const [, b1, d1, b2, d2] = BLOCOS[versao];
  return b1 * d1 + b2 * d2;
};

/* ── o desenho ───────────────────────────────────────────────────── */

/** O olho grande dos cantos, que é o que a câmera procura primeiro. */
function poeOlho(mapa, reservado, linha, coluna) {
  for (let i = -1; i <= 7; i += 1) {
    for (let j = -1; j <= 7; j += 1) {
      const l = linha + i; const c = coluna + j;
      if (l < 0 || c < 0 || l >= mapa.length || c >= mapa.length) continue;
      const borda = (i >= 0 && i <= 6 && (j === 0 || j === 6))
        || (j >= 0 && j <= 6 && (i === 0 || i === 6));
      const miolo = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      mapa[l][c] = borda || miolo;
      reservado[l][c] = true;
    }
  }
}

function esqueleto(versao) {
  const lado = versao * 4 + 17;
  const mapa = Array.from({ length: lado }, () => new Array(lado).fill(false));
  const reservado = Array.from({ length: lado }, () => new Array(lado).fill(false));

  poeOlho(mapa, reservado, 0, 0);
  poeOlho(mapa, reservado, 0, lado - 7);
  poeOlho(mapa, reservado, lado - 7, 0);

  // a régua: a linha e a coluna 6, alternando, que dão a escala
  for (let i = 8; i < lado - 8; i += 1) {
    mapa[6][i] = i % 2 === 0; reservado[6][i] = true;
    mapa[i][6] = i % 2 === 0; reservado[i][6] = true;
  }

  // os alinhamentos — menos onde esbarrariam nos olhos
  const centros = ALINHAMENTO[versao];
  for (const l of centros) {
    for (const c of centros) {
      const perto = (a, b) => a < 8 && b < 8;
      if (perto(l, c) || (l < 8 && c > lado - 9) || (l > lado - 9 && c < 8)) continue;
      for (let i = -2; i <= 2; i += 1) {
        for (let j = -2; j <= 2; j += 1) {
          mapa[l + i][c + j] = Math.max(Math.abs(i), Math.abs(j)) !== 1;
          reservado[l + i][c + j] = true;
        }
      }
    }
  }

  // o espaço do formato (máscara + nível de correção)
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) { reservado[8][i] = true; reservado[i][8] = true; }
  }
  for (let i = 0; i < 8; i += 1) {
    reservado[8][lado - 1 - i] = true;
    reservado[lado - 1 - i][8] = true;
  }
  mapa[lado - 8][8] = true; reservado[lado - 8][8] = true; // o módulo sempre preto

  // da versão 7 em diante o QR diz qual versão ele é
  if (versao >= 7) {
    // 6 bits de versão + 12 de correção (divisão pelo gerador 0x1f25)
    let resto = versao << 12;
    for (let i = 5; i >= 0; i -= 1) {
      if ((resto >>> (i + 12)) & 1) resto ^= 0x1f25 << i;
    }
    const info = ((versao << 12) | resto) >>> 0;
    for (let i = 0; i < 18; i += 1) {
      const bit = ((info >> i) & 1) === 1;
      const l = Math.floor(i / 3); const c = i % 3;
      mapa[l][lado - 11 + c] = bit; reservado[l][lado - 11 + c] = true;
      mapa[lado - 11 + c][l] = bit; reservado[lado - 11 + c][l] = true;
    }
  }

  return { mapa, reservado, lado };
}

/** As oito máscaras: embaralham o desenho para não sair tudo preto. */
const MASCARAS = [
  (l, c) => (l + c) % 2 === 0,
  (l) => l % 2 === 0,
  (_, c) => c % 3 === 0,
  (l, c) => (l + c) % 3 === 0,
  (l, c) => (Math.floor(l / 2) + Math.floor(c / 3)) % 2 === 0,
  (l, c) => ((l * c) % 2) + ((l * c) % 3) === 0,
  (l, c) => (((l * c) % 2) + ((l * c) % 3)) % 2 === 0,
  (l, c) => (((l + c) % 2) + ((l * c) % 3)) % 2 === 0,
];

/** O formato: nível M (bits 00) + a máscara, com correção BCH. */
function marcaFormato(mapa, lado, mascara) {
  let bits = (0b00 << 3) | mascara;
  let resto = bits << 10;
  for (let i = 4; i >= 0; i -= 1) {
    if ((resto >>> (i + 10)) & 1) resto ^= 0x537 << i;
  }
  const info = (((bits << 10) | resto) ^ 0x5412) >>> 0;
  for (let i = 0; i < 15; i += 1) {
    const bit = ((info >> i) & 1) === 1;
    if (i < 6) mapa[8][i] = bit;
    else if (i < 8) mapa[8][i + 1] = bit;
    else mapa[lado - 15 + i][8] = bit;

    if (i < 8) mapa[8][lado - 1 - i] = bit;
    else mapa[14 - i][8] = bit;
  }
  bits = null;
}

/** A conta de feiúra da norma: quanto menor, mais fácil de ler. */
function penalidade(mapa) {
  const lado = mapa.length;
  let total = 0;

  const corrida = (pega) => {
    for (let a = 0; a < lado; a += 1) {
      let igual = 1;
      for (let b = 1; b < lado; b += 1) {
        if (pega(a, b) === pega(a, b - 1)) {
          igual += 1;
          if (igual === 5) total += 3;
          else if (igual > 5) total += 1;
        } else igual = 1;
      }
    }
  };
  corrida((a, b) => mapa[a][b]);
  corrida((a, b) => mapa[b][a]);

  for (let l = 0; l < lado - 1; l += 1) {
    for (let c = 0; c < lado - 1; c += 1) {
      const v = mapa[l][c];
      if (v === mapa[l][c + 1] && v === mapa[l + 1][c] && v === mapa[l + 1][c + 1]) total += 3;
    }
  }

  const ruim = [true, false, true, true, true, false, true];
  const bate = (pega, a, b) => {
    for (let i = 0; i < 7; i += 1) if (pega(a, b + i) !== ruim[i]) return false;
    const claro = (ini, fim) => {
      for (let i = ini; i < fim; i += 1) {
        const v = pega(a, i);
        if (v === undefined) continue;
        if (v) return false;
      }
      return true;
    };
    return claro(b - 4, b) || claro(b + 7, b + 11);
  };
  for (let a = 0; a < lado; a += 1) {
    for (let b = 0; b + 7 <= lado; b += 1) {
      if (bate((x, y) => mapa[x][y], a, b)) total += 40;
      if (bate((x, y) => mapa[y]?.[x], a, b)) total += 40;
    }
  }

  let escuros = 0;
  for (const linha of mapa) for (const v of linha) if (v) escuros += 1;
  const porcento = (escuros * 100) / (lado * lado);
  total += Math.floor(Math.abs(porcento - 50) / 5) * 10;
  return total;
}

/**
 * Transforma um texto no desenho do QR.
 * Devolve uma matriz de true/false — true é quadradinho preto.
 */
export function desenhaQR(texto) {
  const bytes = [...new TextEncoder().encode(texto)];

  let versao = 0;
  for (let v = 1; v <= 10; v += 1) {
    const contador = v < 10 ? 8 : 16;
    const precisa = Math.ceil((4 + contador + bytes.length * 8) / 8);
    if (precisa <= capacidade(v)) { versao = v; break; }
  }
  if (!versao) throw new Error('texto comprido demais para um QR pequeno');

  /* 1 — os bits: modo byte, quantos são, o conteúdo, o fim, o enchimento */
  const bits = [];
  const poe = (valor, quantos) => {
    for (let i = quantos - 1; i >= 0; i -= 1) bits.push((valor >> i) & 1);
  };
  poe(0b0100, 4);
  poe(bytes.length, versao < 10 ? 8 : 16);
  for (const b of bytes) poe(b, 8);

  const totalDados = capacidade(versao) * 8;
  for (let i = 0; i < 4 && bits.length < totalDados; i += 1) bits.push(0);
  while (bits.length % 8) bits.push(0);

  const dados = [];
  for (let i = 0; i < bits.length; i += 8) {
    dados.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));
  }
  const enchimento = [0xec, 0x11];
  for (let i = 0; dados.length < capacidade(versao); i += 1) dados.push(enchimento[i % 2]);

  /* 2 — os blocos, cada um com a sua correção */
  const [bytesEC, b1, d1, b2, d2] = BLOCOS[versao];
  const blocos = []; const correcoes = [];
  let corte = 0;
  for (let i = 0; i < b1 + b2; i += 1) {
    const tamanho = i < b1 ? d1 : d2;
    const pedaco = dados.slice(corte, corte + tamanho);
    corte += tamanho;
    blocos.push(pedaco);
    correcoes.push(corrige(pedaco, bytesEC));
  }

  // intercalado: byte 0 de cada bloco, byte 1 de cada bloco, e assim por diante
  const fila = [];
  const maiorBloco = Math.max(...blocos.map((b) => b.length));
  for (let i = 0; i < maiorBloco; i += 1) {
    for (const bloco of blocos) if (i < bloco.length) fila.push(bloco[i]);
  }
  for (let i = 0; i < bytesEC; i += 1) {
    for (const ec of correcoes) fila.push(ec[i]);
  }

  /* 3 — o desenho, em ziguezague de baixo para cima */
  const { mapa, reservado, lado } = esqueleto(versao);
  const fluxo = [];
  for (const byte of fila) for (let i = 7; i >= 0; i -= 1) fluxo.push(((byte >> i) & 1) === 1);

  let indice = 0; let subindo = true;
  for (let c = lado - 1; c > 0; c -= 2) {
    if (c === 6) c -= 1; // a régua vertical não conta como coluna
    for (let passo = 0; passo < lado; passo += 1) {
      const l = subindo ? lado - 1 - passo : passo;
      for (const coluna of [c, c - 1]) {
        if (reservado[l][coluna]) continue;
        mapa[l][coluna] = indice < fluxo.length ? fluxo[indice] : false;
        indice += 1;
      }
    }
    subindo = !subindo;
  }

  /* 4 — a máscara menos feia das oito */
  let melhor = null;
  for (let m = 0; m < 8; m += 1) {
    const copia = mapa.map((linha) => [...linha]);
    for (let l = 0; l < lado; l += 1) {
      for (let c = 0; c < lado; c += 1) {
        if (!reservado[l][c] && MASCARAS[m](l, c)) copia[l][c] = !copia[l][c];
      }
    }
    marcaFormato(copia, lado, m);
    const nota = penalidade(copia);
    if (!melhor || nota < melhor.nota) melhor = { nota, mapa: copia };
  }
  return melhor.mapa;
}

/** O mesmo desenho, já como SVG para jogar numa página. */
export function qrSVG(texto, { lado = 220, margem = 4, rotulo = 'QR code do endereço do painel' } = {}) {
  const mapa = desenhaQR(texto);
  const n = mapa.length;
  const total = n + margem * 2;
  let caminho = '';
  for (let l = 0; l < n; l += 1) {
    for (let c = 0; c < n; c += 1) {
      if (mapa[l][c]) caminho += `M${c + margem} ${l + margem}h1v1h-1z`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${lado}" height="${lado}" `
    + `viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" role="img" `
    + `aria-label="${String(rotulo).replace(/[<>&"]/g, '')}">`
    + `<rect width="${total}" height="${total}" fill="#fff"/>`
    + `<path d="${caminho}" fill="#000"/></svg>`;
}
