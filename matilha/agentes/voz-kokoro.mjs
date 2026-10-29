/**
 * AS VOZES DO KOKORO — rodam no próprio notebook, sem internet e sem chave.
 *
 * O Kokoro (github.com/hexgrad/kokoro, licença Apache 2.0) é um modelo de
 * voz pequeno (82 milhões de parâmetros) e muito natural. A voz que o
 * Jarvis usa é a George (bm_george): britânica, grave, a do mordomo do
 * filme. Ela fala português pelos fonemas do português (eSpeak-NG, pt-br):
 * sai português com sotaque britânico.
 *
 * Nada disso vem no zip: é coisa de uns 200 MB. Na primeira vez que você
 * escolhe uma voz do Kokoro, a Matilha instala sozinha, numa pasta só dela
 * (dados/vozes-locais):
 *   · o motor (onnxruntime-node, da Microsoft) e o eSpeak-NG (pelo npm);
 *   · o modelo e as vozes, do repositório oficial no Hugging Face
 *     (onnx-community/Kokoro-82M-v1.0-ONNX).
 * Enquanto instala, o Jarvis fala com a voz da Microsoft.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { cpus } from 'node:os';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { texto } from './comum.mjs';

const HF = 'https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main';
const PACOTES = ['onnxruntime-node@1.30.0', '@echogarden/espeak-ng-emscripten@0.3.5'];
const TAXA = 24000;
// Os fonemas que o modelo conhece, com o número de cada um (o vocabulário oficial do Kokoro v1.0).
const VOCAB = {";":1,":":2,",":3,".":4,"!":5,"?":6,"—":9,"…":10,"\"":11,"(":12,")":13,"“":14,"”":15," ":16,"̃":17,"ʣ":18,"ʥ":19,"ʦ":20,"ʨ":21,"ᵝ":22,"ꭧ":23,"A":24,"I":25,"O":31,"Q":33,"S":35,"T":36,"W":39,"Y":41,"ᵊ":42,"a":43,"b":44,"c":45,"d":46,"e":47,"f":48,"h":50,"i":51,"j":52,"k":53,"l":54,"m":55,"n":56,"o":57,"p":58,"q":59,"r":60,"s":61,"t":62,"u":63,"v":64,"w":65,"x":66,"y":67,"z":68,"ɑ":69,"ɐ":70,"ɒ":71,"æ":72,"β":75,"ɔ":76,"ɕ":77,"ç":78,"ɖ":80,"ð":81,"ʤ":82,"ə":83,"ɚ":85,"ɛ":86,"ɜ":87,"ɟ":90,"ɡ":92,"ɥ":99,"ɨ":101,"ɪ":102,"ʝ":103,"ɯ":110,"ɰ":111,"ŋ":112,"ɳ":113,"ɲ":114,"ɴ":115,"ø":116,"ɸ":118,"θ":119,"œ":120,"ɹ":123,"ɾ":125,"ɻ":126,"ʁ":128,"ɽ":129,"ʂ":130,"ʃ":131,"ʈ":132,"ʧ":133,"ʊ":135,"ʋ":136,"ʌ":138,"ɣ":139,"ɤ":140,"χ":142,"ʎ":143,"ʒ":147,"ʔ":148,"ˈ":156,"ˌ":157,"ː":158,"ʰ":162,"ʲ":164,"↓":169,"→":171,"↗":172,"↘":173,"ᵻ":177};

/** As vozes do Kokoro que o Jarvis oferece (o nome do arquivo, e como aparece na tela). */
export const VOZES_KOKORO = [
  { voz: 'bm_george', nome: 'George', descricao: 'Masculina, britânica, grave e elegante: o Jarvis do filme. Português com sotaque britânico.' },
  { voz: 'bm_lewis', nome: 'Lewis', descricao: 'Masculina, britânica, mais madura e séria. Português com sotaque britânico.' },
  { voz: 'bm_daniel', nome: 'Daniel', descricao: 'Masculina, britânica, calma. Português com sotaque britânico.' },
  { voz: 'bm_fable', nome: 'Fable', descricao: 'Masculina, britânica, de narrador. Português com sotaque britânico.' },
  { voz: 'am_michael', nome: 'Michael', descricao: 'Masculina, americana, firme. Português com sotaque americano.' },
  { voz: 'am_onyx', nome: 'Onyx', descricao: 'Masculina, americana, bem grave. Português com sotaque americano.' },
  { voz: 'pm_alex', nome: 'Alex', descricao: 'Masculina, brasileira (a voz em português do próprio Kokoro).' },
  { voz: 'pf_dora', nome: 'Dora', descricao: 'Feminina, brasileira (a voz em português do próprio Kokoro).' },
];

const sh = process.platform === 'win32';
function roda(comando, args, { cwd, env } = {}) {
  return new Promise((ok) => {
    let saida = '';
    // No Windows o npm é um .cmd: só roda por um shell.
    const filho = spawn(sh ? `${comando}.cmd` : comando, args, { cwd, env: { ...process.env, ...env }, shell: sh, windowsHide: true });
    filho.stdout?.on('data', (p) => { saida = (saida + p).slice(-3000); });
    filho.stderr?.on('data', (p) => { saida = (saida + p).slice(-3000); });
    filho.on('error', (e) => ok({ codigo: -1, saida: e.message }));
    filho.on('close', (codigo) => ok({ codigo, saida }));
  });
}

async function baixa(url, destino, aoAndar) {
  let r;
  try { r = await fetch(url, { signal: AbortSignal.timeout(20 * 60_000) }); } catch {
    throw new Error(`não consegui baixar ${url.split('/').pop()} do Hugging Face (sem internet, ou a rede bloqueia huggingface.co)`);
  }
  if (!r.ok || !r.body) throw new Error(`não consegui baixar ${url.split('/').pop()} (HTTP ${r.status})`);
  const total = Number(r.headers.get('content-length')) || 0;
  const parcial = `${destino}.baixando`;
  const arq = createWriteStream(parcial);
  let feito = 0;
  for await (const pedaco of r.body) {
    feito += pedaco.length;
    if (!arq.write(pedaco)) await new Promise((res) => arq.once('drain', res));
    if (total) aoAndar(feito / total);
  }
  await new Promise((res, rej) => arq.end((e) => (e ? rej(e) : res())));
  await rename(parcial, destino);
}

/** Áudio (Float32, 24 kHz) em WAV de 16 bits. */
export function emWav(amostras, taxa = TAXA) {
  const b = Buffer.alloc(44 + amostras.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + amostras.length * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(taxa, 24); b.writeUInt32LE(taxa * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(amostras.length * 2, 40);
  for (let k = 0; k < amostras.length; k += 1) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(amostras[k] * 32767))), 44 + k * 2);
  return b;
}

const PONTUACAO = /(\s*[;:,.!?—…"“”()]+\s*)+/g;

export class Kokoro {
  constructor({ pasta, diz = () => {} }) {
    this.pasta = pasta; // dados/vozes-locais
    this.diz = diz;
    this.situacao = { instalando: false, progresso: 0, etapa: '', erro: '' };
    this.vozes = new Map();
  }

  _arquivo(nome) { return join(this.pasta, nome); }
  get modelo() { return this._arquivo('kokoro-q8.onnx'); }

  /** Já dá para falar? (motor, eSpeak e modelo no lugar) */
  instalado() {
    return existsSync(this.modelo) && existsSync(join(this.pasta, 'node_modules', 'onnxruntime-node', 'package.json'))
      && existsSync(join(this.pasta, 'node_modules', '@echogarden', 'espeak-ng-emscripten', 'package.json'));
  }

  estado() {
    const instalado = this.instalado();
    return { instalado, ...this.situacao, ...(instalado && !this.situacao.instalando ? { erro: '' } : {}) };
  }

  /** Instala tudo (uma vez). Pode chamar de novo: o que já está, fica. */
  instala() {
    if (this.situacao.instalando) return this.instalando;
    this.situacao = { instalando: true, progresso: 0, etapa: 'preparando', erro: '' };
    this.instalando = (async () => {
      try {
        await mkdir(this.pasta, { recursive: true });
        if (!existsSync(join(this.pasta, 'package.json'))) {
          await writeFile(join(this.pasta, 'package.json'), JSON.stringify({ name: 'jarvis-vozes-locais', private: true }), 'utf8');
        }
        const req = createRequire(join(this.pasta, 'package.json'));
        let temTudo = true;
        try { req.resolve('onnxruntime-node'); req.resolve('@echogarden/espeak-ng-emscripten'); } catch { temTudo = false; }
        if (!temTudo) {
          this.situacao.etapa = 'instalando o motor de voz (uns 100 MB)';
          this.diz('  ✦ voz do Kokoro: instalando o motor (onnxruntime-node e eSpeak-NG)…');
          const r = await roda('npm', ['install', '--no-audit', '--no-fund', '--omit=dev', ...PACOTES],
            { cwd: this.pasta, env: { ONNXRUNTIME_NODE_INSTALL: 'skip' } });
          if (r.codigo !== 0) throw new Error(`o npm não instalou o motor de voz (${texto(r.saida.split('\n').filter(Boolean).pop(), 160)})`);
          // O pacote traz o motor para Windows, Mac e Linux: fica só o desta máquina.
          const bin = join(this.pasta, 'node_modules', 'onnxruntime-node', 'bin', 'napi-v6');
          for (const so of ['win32', 'darwin', 'linux']) {
            for (const arq of ['x64', 'arm64']) {
              if (so === process.platform && arq === process.arch) continue;
              await rm(join(bin, so, arq), { recursive: true, force: true }).catch(() => {});
            }
          }
        }
        this.situacao.progresso = 0.3;
        if (!existsSync(this.modelo)) {
          this.situacao.etapa = 'baixando o modelo do Kokoro (92 MB)';
          this.diz('  ✦ voz do Kokoro: baixando o modelo (92 MB, do Hugging Face)…');
          await baixa(`${HF}/onnx/model_quantized.onnx`, this.modelo, (f) => { this.situacao.progresso = 0.3 + f * 0.65; });
          const s = await stat(this.modelo);
          if (s.size < 50 * 1024 ** 2) { await rm(this.modelo, { force: true }); throw new Error('o modelo baixou incompleto'); }
        }
        this.situacao.etapa = 'baixando a voz';
        await this._voz('bm_george');
        this.situacao = { instalando: false, progresso: 1, etapa: 'pronto', erro: '' };
        this.diz('  ✦ voz do Kokoro pronta.');
      } catch (e) {
        this.situacao = { instalando: false, progresso: 0, etapa: '', erro: texto(e.message, 200) };
        this.diz(`  ⚠ voz do Kokoro: ${this.situacao.erro}`);
      }
    })();
    return this.instalando;
  }

  /** O arquivo de uma voz (510 estilos de 256 números): baixa na primeira vez. */
  async _voz(nome) {
    if (this.vozes.has(nome)) return this.vozes.get(nome);
    if (!VOZES_KOKORO.some((v) => v.voz === nome)) throw new Error(`voz desconhecida: ${nome}`);
    const arquivo = join(this.pasta, 'vozes', `${nome}.bin`);
    if (!existsSync(arquivo)) {
      await mkdir(join(this.pasta, 'vozes'), { recursive: true });
      await baixa(`${HF}/voices/${nome}.bin`, arquivo, () => {});
    }
    const b = await readFile(arquivo);
    if (b.length !== 510 * 256 * 4) throw new Error(`a voz ${nome} veio estragada`);
    const estilos = new Float32Array(b.buffer, b.byteOffset, b.length / 4).slice();
    this.vozes.set(nome, estilos);
    return estilos;
  }

  async _carrega() {
    if (this.motor) return this.motor;
    this.motor = (async () => {
      const req = createRequire(join(this.pasta, 'package.json'));
      const ort = (await import(pathToFileURL(req.resolve('onnxruntime-node')).href)).default;
      const { default: iniciaEspeak } = await import(pathToFileURL(req.resolve('@echogarden/espeak-ng-emscripten')).href);
      const espeak = await iniciaEspeak();
      const trabalhador = new espeak.eSpeakNGWorker();
      trabalhador.set_voice('pt-br');
      const sessao = await ort.InferenceSession.create(this.modelo, { intraOpNumThreads: Math.max(1, Math.min(8, cpus().length - 1)) });
      return { ort, espeak, trabalhador, sessao };
    })();
    this.motor.catch(() => { this.motor = null; });
    return this.motor;
  }

  /** Os fonemas do português (eSpeak-NG, pt-br), só os que o modelo conhece; a pontuação fica. */
  async fonemas(t) {
    const { espeak, trabalhador } = await this._carrega();
    const doEspeak = (trecho) => {
      const r = trabalhador.convert_to_phonemes(trecho, true);
      const bytes = [];
      for (let p = r.ptr; espeak.HEAPU8[p] !== 0; p += 1) bytes.push(espeak.HEAPU8[p]);
      return Buffer.from(bytes).toString('utf8').replace(/_/g, '').replace(/\s*\|\s*/g, ' ');
    };
    let saida = ''; let i = 0;
    for (const m of t.matchAll(PONTUACAO)) {
      if (m.index > i) saida += doEspeak(t.slice(i, m.index));
      saida += m[0];
      i = m.index + m[0].length;
    }
    if (i < t.length) saida += doEspeak(t.slice(i));
    return [...saida].filter((c) => c in VOCAB).join('').replace(/\s+/g, ' ').trim();
  }

  /** O texto em WAV, na voz pedida. `velocidade`: 1 é o normal. */
  async fala(t, { voz = 'bm_george', velocidade = 1 } = {}) {
    if (!this.instalado()) throw new Error('as vozes do Kokoro ainda não foram instaladas');
    const { ort, sessao } = await this._carrega();
    const estilos = await this._voz(voz);
    // Uma frase de cada vez (o modelo aceita até 510 fonemas); frase comprida vai partida nas vírgulas.
    const frases = String(t).replace(/https?:\/\/\S+/g, 'o link').match(/[^.!?…]+[.!?…]*\s*/g) || [String(t)];
    const pedacos = [];
    for (const f of frases) {
      const fon = await this.fonemas(f.trim());
      if (!fon) continue;
      if (fon.length <= 500) { pedacos.push(fon); continue; }
      let atual = '';
      for (const parte of fon.split(/(?<=[,;:])\s/)) {
        if ((atual + parte).length > 500 && atual) { pedacos.push(atual); atual = ''; }
        atual += (atual ? ' ' : '') + parte.slice(0, 500);
      }
      if (atual) pedacos.push(atual);
    }
    const audios = [];
    const pausa = new Float32Array(Math.round(TAXA * 0.12));
    for (const fon of pedacos) {
      const ids = [0, ...[...fon].map((c) => VOCAB[c]), 0];
      const n = Math.min(ids.length - 2, 509);
      const r = await sessao.run({
        input_ids: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
        style: new ort.Tensor('float32', estilos.slice(n * 256, n * 256 + 256), [1, 256]),
        speed: new ort.Tensor('float32', Float32Array.from([velocidade]), [1]),
      });
      audios.push(r.waveform.data, pausa);
    }
    if (!audios.length) throw new Error('nada para falar');
    const total = audios.reduce((s, a) => s + a.length, 0);
    const junto = new Float32Array(total);
    let pos = 0;
    for (const a of audios) { junto.set(a, pos); pos += a.length; }
    return emWav(junto);
  }
}
