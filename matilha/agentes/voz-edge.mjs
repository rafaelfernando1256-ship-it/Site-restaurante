/**
 * AS VOZES NEURAIS DA MICROSOFT — as mesmas do "Ler em voz alta" do Edge.
 *
 * Grátis e sem chave: a Matilha conversa com o serviço do Edge como o
 * próprio navegador faz (um WebSocket que recebe o texto e devolve MP3).
 * O serviço pede uma ficha (Sec-MS-GEC) calculada a partir da hora; a
 * Microsoft trocou a conta em outubro de 2026 (a "versão 2"). Esta é a
 * mesma conta do edge-tts (github.com/rany2/edge-tts, licença LGPL/MIT),
 * reescrita em JavaScript e conferida com a dele. Se a versão 2 for
 * recusada, tenta a 1, e acerta o relógio pela hora do servidor.
 */
import { createHash, randomBytes } from 'node:crypto';

const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const BASE = 'speech.platform.bing.com/consumer/speech/synthesize/readaloud';
const CHROMIUM = '143.0.3650.75';
const MAIOR = CHROMIUM.split('.')[0];
const CABECALHOS = {
  'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${MAIOR}.0.0.0 Safari/537.36 Edg/${MAIOR}.0.0.0`,
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'en-US,en;q=0.9',
};

/* ── a ficha (Sec-MS-GEC) ──────────────────────────────────────── */

const M32 = 0xFFFFFFFF;
const rotr = (x, n) => ((x >>> n) | (x << (32 - n))) >>> 0;
const rol16 = (x) => (((x << 16) | (x >>> 16)) >>> 0);
const sig0 = (x) => (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
const sig1 = (x) => (rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10)) >>> 0;
const mul = (a, b) => Math.imul(a, b) >>> 0;

const INICIAL = [0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19];
const ESTADO = [0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A, 0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2];
const AGENDA = [0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA, 0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6, 0xF0C31573,
  0x7058CE4E, 0x7188E606, 0x00E5AB33, 0xD258B060, 0x72766564];
const K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01,
  0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F,
  0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70,
  0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A,
  0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];
const AJUSTE = 0xC9DC06A7;
const K_BLOCO = [...K.slice(0, 14), AJUSTE, ...K.slice(15)];
const AJ_SIG0 = 0x059C0B80;
const AJ_SIG1 = 0x000B92C0;
const CS64 = [[0xE82E91B1, 0xB32700D0], [0x44DE24C6, 0x88DFF51D], [0x3BEB65BC, 0x29514038], [0xC89C5933, 0xB328CBDF],
  [0x8D1EC211, 0xD405B4D5], [0x314EF5D5, 0x26E55F3C], [0xE92491B1, 0x607801C6], [0xF0A5B9D5, 0x82B2C1FB], [0x06064CF3, 0xFA51A3DA],
  [0xDA79FA60, 0x207CC464], [0xBED20560, 0x3C3C74F3], [0x89F9C9F8, 0xD2D14B61], [0x35FA38C6, 0xBB04A2C1], [0xCB49E3C6, 0xC5626167]];
const CS64_FATOR = 0x82893933;
const CS64_AJ0 = 0xF2F90B1A;
const CS64_AJ1 = 0x0B1A0000;

function rodadas(estado, w, primeira = 0) {
  let [a, b, c, d, e, f, g, h] = estado;
  const k = primeira === 14 ? K_BLOCO : K;
  for (let i = primeira; i < 64; i += 1) {
    const t1 = (h + ((rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0) + ((g ^ (e & (f ^ g))) >>> 0) + k[i] + w[i]) >>> 0;
    const t2 = (((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0) + (((a & b) | (c & (a | b))) >>> 0)) >>> 0;
    h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
  }
  return [a, b, c, d, e, f, g, h];
}
function expande(w, primeira = 16) {
  for (let i = primeira; i < 64; i += 1) w.push((sig1(w[i - 2]) + w[i - 7] + sig0(w[i - 15]) + w[i - 16]) >>> 0);
}
function inicio(dados) {
  const w = [...new Array(14).fill(0), (dados[0] << 16 | dados[1] << 8 | dados[2]) >>> 0, dados.readUInt32BE(3)];
  for (let i = 16; i < 30; i += 1) {
    let v = AGENDA[i - 16];
    if (i - 2 >= 14) v += i === 16 ? (sig1(w[i - 2]) ^ AJ_SIG1) >>> 0 : sig1(w[i - 2]);
    if (i - 7 >= 14) v += w[i - 7];
    if (i - 15 >= 14) v += i === 29 ? (sig0(w[i - 15]) ^ AJ_SIG0) >>> 0 : sig0(w[i - 15]);
    w.push(v >>> 0);
  }
  w.push(((sig1(w[28]) + w[23] + sig0(w[15]) + w[14] + AJUSTE - K[14]) % 2 ** 32 + 2 ** 32) % 2 ** 32 >>> 0);
  expande(w, 31);
  const r = rodadas(ESTADO, w, 14);
  return INICIAL.map((x, i) => (x + r[i]) >>> 0);
}
function resumo(dados) {
  const tamanho = 57 + dados.length;
  const zeros = (((55 - tamanho) % 64) + 64) % 64;
  const fim = Buffer.alloc(8);
  fim.writeBigUInt64BE(BigInt(tamanho * 8));
  const cheio = Buffer.concat([dados.subarray(7), Buffer.from([0x80]), Buffer.alloc(zeros), fim]);
  let estado = inicio(dados.subarray(0, 7));
  for (let p = 0; p < cheio.length; p += 64) {
    const w = [];
    for (let j = 0; j < 16; j += 1) w.push(cheio.readUInt32BE(p + j * 4));
    expande(w);
    const r = rodadas(estado, w);
    estado = estado.map((x, i) => (x + r[i]) >>> 0);
  }
  const saida = Buffer.alloc(32);
  estado.forEach((x, i) => saida.writeUInt32BE(x, i * 4));
  return saida;
}
function palavrasLE(dados) {
  const cheio = Buffer.concat([dados, Buffer.alloc((4 - (dados.length % 4)) % 4)]);
  const w = [];
  for (let p = 0; p < cheio.length; p += 4) w.push(cheio.readUInt32LE(p));
  if (w.length % 2) w.push(0);
  return w;
}
function cs64(dados, dig) {
  const ka = (dig.readUInt32LE(0) | 1) >>> 0;
  const kb = (dig.readUInt32LE(4) | 1) >>> 0;
  const fatores = [mul(ka, CS64_FATOR), mul(kb, CS64_FATOR)];
  const termos = CS64.map(([c], i) => mul(c, fatores[i % 2]));
  const desvios = CS64.map(([, o]) => o);
  palavrasLE(Buffer.concat([Buffer.from([0]), dados])).forEach((p, i) => {
    let termo = mul(p, i % 2 === 0 ? ka : kb);
    let desvio = mul(rol16(p), i % 2 === 0 ? 0xEF0569FB : 0xC31713DB);
    if (i === 0) { termo = (termo + mul(CS64_AJ0, fatores[0])) >>> 0; desvio = (desvio + CS64_AJ1) >>> 0; }
    termos.push(termo);
    desvios.push(desvio);
  });
  let trocaAc = 0; let trocaUlt = 0; let est = 0; let ac = 0;
  for (let i = 0; i < termos.length; i += 2) {
    const x = termos[i]; const y = termos[i + 1];
    let t = rol16((desvios[i] + x) >>> 0);
    let q = mul(t, 0x76F50F34);
    trocaAc = (trocaAc + ((mul(rol16(q), 0xC3EFEA97) + q) >>> 0)) >>> 0;
    t = rol16((desvios[i + 1] + y) >>> 0);
    q = mul(t, 0x1881CE3C);
    trocaUlt = (mul(rol16(q), 0x35BD1EC9) + q) >>> 0;
    trocaAc = (trocaAc + trocaUlt) >>> 0;
    est = (mul(est, ka) + x) >>> 0;
    est = mul(rol16(est), 0xCF98B111);
    est = mul(rol16(est), 0x87085B9F);
    est = mul(rol16(est), 0x12CEB96D);
    est = mul(rol16(est), 0x257E1D83);
    ac = (ac + est) >>> 0;
    t = (mul(est, kb) + y) >>> 0;
    t = mul(rol16(t), 0xA27416F5);
    t = mul(rol16(t), 0xD38396FF);
    est = mul(rol16(mul(rol16(t), 0x7C932B89)), 0xBFA49F69);
    ac = (ac + est) >>> 0;
  }
  return [(trocaUlt ^ est) >>> 0, (trocaAc ^ ac) >>> 0];
}

let desvioDoRelogio = 0; // segundos: o relógio do notebook pode estar errado
function marcaDeTempo(agora) {
  let t = (agora ?? Date.now() / 1000 + desvioDoRelogio) + 11644473600;
  t -= t % 300;
  return BigInt(t * 1e7).toString();
}
/** A ficha versão 2 (a atual). `agora` em segundos, só para teste. */
export function fichaV2(agora) {
  const dados = Buffer.from(`${marcaDeTempo(agora)}${TOKEN}`, 'ascii');
  const dig = resumo(dados);
  const [a, b] = cs64(dados, dig);
  const c = Buffer.alloc(8); c.writeUInt32LE(a, 0); c.writeUInt32LE(b, 4);
  return `${c.toString('hex').toUpperCase()}-${dig.toString('hex').toUpperCase()}`;
}
/** A ficha versão 1 (a de antes de outubro de 2026). */
export function fichaV1(agora) {
  return createHash('sha256').update(`${marcaDeTempo(agora)}${TOKEN}`, 'ascii').digest('hex').toUpperCase();
}
const VERSOES = [{ ficha: fichaV2, versao: `2-${CHROMIUM}` }, { ficha: fichaV1, versao: `1-${CHROMIUM}` }];
let versaoBoa = 0;

/* ── o WebSocket ───────────────────────────────────────────────── */

let WS = null;
async function webSocket() {
  if (WS) return WS;
  try { WS = (await import('ws')).default; } catch {
    // Instalação antiga, sem o pacote ws: o Playwright traz um igual dentro dele.
    WS = (await import('playwright-core/lib/utilsBundle')).ws;
  }
  return WS;
}

const escapa = (t) => String(t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
const dataJs = () => `${new Date().toUTCString().replace(/^(\w+), (\d+) (\w+) (\d+) /, '$1 $3 $2 $4 ')} GMT+0000 (Coordinated Universal Time)`.replace(' GMT GMT', ' GMT');
const id = () => randomBytes(16).toString('hex');
const sinal = (n, u) => `${n >= 0 ? '+' : ''}${Math.round(n)}${u}`;

/** Um pedaço de texto (até uns 3 mil bytes) vira MP3. */
function sintetizaPedaco(texto, { voz, tom = 0, velocidade = 0 }, versao, { ms = 20_000 } = {}) {
  return new Promise(async (resolve, reject) => {
    const W = await webSocket();
    const v = VERSOES[versao];
    const url = `${process.env.JARVIS_VOZ_WSS || `wss://${BASE}/edge/v1`}?TrustedClientToken=${TOKEN}&ConnectionId=${id()}&Sec-MS-GEC=${v.ficha()}&Sec-MS-GEC-Version=${v.versao}`;
    const ws = new W(url, {
      headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache', Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
        ...CABECALHOS, Cookie: `muid=${randomBytes(16).toString('hex').toUpperCase()};` },
      perMessageDeflate: true,
    });
    const partes = [];
    let acabou = false;
    const termina = (erro) => {
      if (acabou) return;
      acabou = true;
      clearTimeout(relogio);
      try { ws.close(); } catch { /* já fechado */ }
      if (erro) reject(erro);
      else if (!partes.length) reject(new Error('o serviço de voz não mandou áudio'));
      else resolve(Buffer.concat(partes));
    };
    const relogio = setTimeout(() => termina(new Error('o serviço de voz demorou demais')), ms);
    ws.on('unexpected-response', (_req, res) => {
      const e = new Error(`o serviço de voz recusou (HTTP ${res.statusCode})`);
      e.status = res.statusCode;
      const data = Date.parse(res.headers?.date || '');
      if (Number.isFinite(data)) e.desvio = data / 1000 - Date.now() / 1000;
      termina(e);
    });
    ws.on('error', (e) => termina(e));
    ws.on('close', () => termina());
    ws.on('open', () => {
      ws.send(`X-Timestamp:${dataJs()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n`
        + '{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},'
        + '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n');
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voz}'>`
        + `<prosody pitch='${sinal(tom, 'Hz')}' rate='${sinal(velocidade, '%')}' volume='+0%'>${escapa(texto)}</prosody></voice></speak>`;
      ws.send(`X-RequestId:${id()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${dataJs()}Z\r\nPath:ssml\r\n\r\n${ssml}`);
    });
    ws.on('message', (dados, binario) => {
      if (!binario) {
        if (/Path:turn\.end/.test(String(dados))) termina();
        return;
      }
      const b = Buffer.isBuffer(dados) ? dados : Buffer.from(dados);
      if (b.length < 2) return;
      const n = b.readUInt16BE(0);
      const cabeca = b.subarray(2, 2 + n).toString('utf8');
      if (!/Path:audio/.test(cabeca)) return;
      const audio = b.subarray(2 + n);
      if (audio.length) partes.push(audio);
    });
  });
}

/** Corta em pedaços que o serviço aceita, nos fins de frase. */
function pedacos(texto, limite = 2500) {
  const frases = String(texto).match(/[^.!?…\n]+[.!?…]*\s*|\n+/g) || [String(texto)];
  const lista = [];
  for (const f of frases) {
    if (lista.length && Buffer.byteLength(lista[lista.length - 1] + f) <= limite) lista[lista.length - 1] += f;
    else lista.push(f.length > limite ? f.slice(0, limite) : f);
  }
  return lista.map((p) => p.trim()).filter(Boolean);
}

/** O texto inteiro vira um MP3. `voz` é o nome curto (ex.: pt-BR-AntonioNeural). */
export async function sintetiza(texto, opcoes) {
  const audios = [];
  for (const p of pedacos(texto)) {
    let feito = null;
    let ultimoErro = null;
    // A versão que funcionou da última vez primeiro; recusou (403), acerta o relógio e tenta a outra.
    for (const tentativa of [versaoBoa, 1 - versaoBoa, versaoBoa]) {
      try { feito = await sintetizaPedaco(p, opcoes, tentativa); versaoBoa = tentativa; break; } catch (e) {
        ultimoErro = e;
        if (e.desvio !== undefined && Math.abs(e.desvio) > 30) desvioDoRelogio += e.desvio;
        if (e.status && e.status !== 403) break;
      }
    }
    if (!feito) throw ultimoErro;
    audios.push(feito);
  }
  return Buffer.concat(audios);
}

/** A lista das vozes do serviço (todas as línguas). */
export async function listaDeVozes() {
  let ultimo = null;
  for (const tentativa of [versaoBoa, 1 - versaoBoa]) {
    const v = VERSOES[tentativa];
    try {
      const r = await fetch(`https://${BASE}/voices/list?trustedclienttoken=${TOKEN}&Sec-MS-GEC=${v.ficha()}&Sec-MS-GEC-Version=${v.versao}`, {
        headers: { ...CABECALHOS, Accept: '*/*', 'Sec-Fetch-Site': 'none', 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Dest': 'empty',
          'Sec-CH-UA': `" Not;A Brand";v="99", "Microsoft Edge";v="${MAIOR}", "Chromium";v="${MAIOR}"`, 'Sec-CH-UA-Mobile': '?0' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!r.ok) {
        const data = Date.parse(r.headers.get('date') || '');
        if (r.status === 403 && Number.isFinite(data) && Math.abs(data / 1000 - Date.now() / 1000 - desvioDoRelogio) > 30) desvioDoRelogio = data / 1000 - Date.now() / 1000;
        throw new Error(`HTTP ${r.status}`);
      }
      const lista = await r.json();
      versaoBoa = tentativa;
      return lista.map((x) => ({ nome: x.ShortName, local: x.Locale, genero: x.Gender, apelido: x.FriendlyName }));
    } catch (e) { ultimo = e; }
  }
  throw ultimo;
}
