/**
 * A VOZ DO JARVIS — você escolhe.
 *
 * Quatro lugares de onde a voz pode vir:
 *   · o Kokoro (agentes/voz-kokoro.mjs): roda no próprio notebook, sem
 *     internet. A George (bm_george), britânica, é a voz padrão do Jarvis;
 *   · as vozes neurais da Microsoft (agentes/voz-edge.mjs): grátis, sem
 *     chave, as mesmas do "Ler em voz alta" do Edge. Antônio, Francisca,
 *     Thalita e as "multilíngues", que falam português com sotaque;
 *   · a ElevenLabs, se você puser a chave: as vozes mais naturais que
 *     existem hoje (as que estiverem na sua conta);
 *   · a voz do próprio navegador ou do Windows: a de sempre, a reserva
 *     quando não há internet.
 *
 * O servidor transforma o texto em MP3 e a página toca: assim a mesma voz
 * sai no notebook, no celular e no atalho Ctrl+Alt+Espaço. Tom e
 * velocidade dá para ajustar (o "Jarvis clássico" é o Antônio mais grave
 * e mais calmo).
 */
import { readFile, writeFile } from 'node:fs/promises';

import { listaDeVozes, sintetiza } from './voz-edge.mjs';
import { Kokoro, VOZES_KOKORO } from './voz-kokoro.mjs';
import { texto } from './comum.mjs';

export const FRASE_DE_TESTE = 'Às suas ordens, Rafael. Posso pesquisar, abrir os seus programas, montar uma apresentação ou cuidar da Matilha. É só pedir.';

/** Os modelos prontos. `voz` é o nome no serviço da Microsoft; tom em Hz, velocidade em %. */
export const MODELOS = [
  { id: 'jarvis', nome: 'Jarvis clássico', descricao: 'O Antônio mais grave e calmo, como um mordomo. Brasileiro.', voz: 'pt-BR-AntonioNeural', tom: -8, velocidade: -4 },
  { id: 'antonio', nome: 'Antônio', descricao: 'Masculina, brasileira, natural e firme.', voz: 'pt-BR-AntonioNeural', tom: 0, velocidade: 0 },
  { id: 'antonio-rapido', nome: 'Antônio, ágil', descricao: 'O Antônio um pouco mais rápido e animado.', voz: 'pt-BR-AntonioNeural', tom: 2, velocidade: 10 },
  { id: 'macerio', nome: 'Macério', descricao: 'Masculina, brasileira, mais nova e expressiva.', voz: 'pt-BR-MacerioMultilingualNeural', tom: 0, velocidade: 0 },
  { id: 'francisca', nome: 'Francisca', descricao: 'Feminina, brasileira, clara e calma.', voz: 'pt-BR-FranciscaNeural', tom: 0, velocidade: 0 },
  { id: 'thalita', nome: 'Thalita', descricao: 'Feminina, brasileira, jovem e leve.', voz: 'pt-BR-ThalitaMultilingualNeural', tom: 0, velocidade: 0 },
  { id: 'andrew', nome: 'Andrew', descricao: 'Masculina, calorosa, português com sotaque americano.', voz: 'en-US-AndrewMultilingualNeural', tom: 0, velocidade: 0 },
  { id: 'brian', nome: 'Brian', descricao: 'Masculina, descontraída, português com sotaque americano.', voz: 'en-US-BrianMultilingualNeural', tom: 0, velocidade: 0 },
  { id: 'remy', nome: 'Rémy', descricao: 'Masculina, elegante, português com sotaque francês.', voz: 'fr-FR-RemyMultilingualNeural', tom: 0, velocidade: 0 },
  { id: 'florian', nome: 'Florian', descricao: 'Masculina, séria, português com sotaque alemão.', voz: 'de-DE-FlorianMultilingualNeural', tom: 0, velocidade: 0 },
  { id: 'ava', nome: 'Ava', descricao: 'Feminina, expressiva, português com sotaque americano.', voz: 'en-US-AvaMultilingualNeural', tom: 0, velocidade: 0 },
  { id: 'seraphina', nome: 'Seraphina', descricao: 'Feminina, suave, português com sotaque alemão.', voz: 'de-DE-SeraphinaMultilingualNeural', tom: 0, velocidade: 0 },
].map((m) => ({ ...m, provedor: 'microsoft' }));
const NAVEGADOR = { id: 'navegador', provedor: 'navegador', nome: 'Voz do navegador', descricao: 'A voz do Windows ou do celular. Funciona sem internet, mas é a mais robótica.' };

const KOKORO = VOZES_KOKORO.map((v) => ({ id: `ko:${v.voz}`, provedor: 'kokoro', voz: v.voz, nome: v.nome, descricao: v.descricao, tom: 0, velocidade: 0 }));
// A voz que você pediu para o Jarvis. Quem já tinha a Matilha passa para ela uma vez (versão 2 da escolha).
const PADRAO = 'ko:bm_george';
const VERSAO_DA_ESCOLHA = 2;

const ELEVEN = 'https://api.elevenlabs.io/v1';
const chaveEleven = () => (process.env.ELEVENLABS_API_KEY || '').trim();

export class Voz {
  constructor({ arquivo, pastaLocal, diz = () => {} }) {
    this.arquivo = arquivo;
    this.diz = diz;
    this.kokoro = pastaLocal ? new Kokoro({ pasta: pastaLocal, diz }) : null;
    this.escolha = { id: PADRAO, tom: null, velocidade: null, versao: VERSAO_DA_ESCOLHA };
    this.cache = new Map(); // texto + voz → áudio (as frases que se repetem: "Cancelado.", a frase de teste)
    this.carregado = readFile(arquivo, 'utf8').then((t) => {
      const lida = JSON.parse(t);
      this.escolha = lida.versao >= VERSAO_DA_ESCOLHA ? { ...this.escolha, ...lida } : this.escolha;
    }).catch(() => {});
    this.microsoft = null; // a lista do serviço, lida uma vez
    this.eleven = null;
  }

  /** As vozes para a tela de escolher. */
  async lista() {
    await this.carregado;
    if (!this.microsoft || Date.now() - this.microsoft.quando > 6 * 3600_000) {
      try { this.microsoft = { quando: Date.now(), vozes: await listaDeVozes(), erro: '' }; } catch (e) {
        this.microsoft = { quando: Date.now() - 5.5 * 3600_000, vozes: null, erro: texto(e.message, 160) };
      }
    }
    const existe = new Set((this.microsoft.vozes || []).map((v) => v.nome));
    // Sem a lista (sem internet, serviço fora), mostra os modelos mesmo assim: o teste diz se funcionam.
    const modelos = MODELOS.filter((m) => !this.microsoft.vozes || existe.has(m.voz));
    const outras = (this.microsoft.vozes || [])
      .filter((v) => /^pt-/.test(v.local) || /Multilingual/.test(v.nome))
      .filter((v) => !MODELOS.some((m) => m.voz === v.nome))
      .map((v) => ({ id: `ms:${v.nome}`, provedor: 'microsoft', voz: v.nome, tom: 0, velocidade: 0,
        nome: v.nome.replace(/^[a-z]{2}-[A-Z]{2}-/, '').replace(/(Multilingual)?Neural$/, ''),
        descricao: `${v.genero === 'Female' ? 'Feminina' : 'Masculina'}, ${/^pt-BR/.test(v.local) ? 'brasileira' : /^pt-PT/.test(v.local) ? 'de Portugal' : `com sotaque (${v.local})`}.` }));
    let eleven = { ligado: Boolean(chaveEleven()), vozes: [], erro: '' };
    if (eleven.ligado) {
      try { eleven.vozes = await this._vozesEleven(); } catch (e) { eleven.erro = texto(e.message, 160); }
    }
    const kokoro = { ...(this.kokoro?.estado() || { instalado: false, erro: 'indisponível' }), vozes: KOKORO };
    return { escolha: this.escolha, kokoro, modelos, outras, eleven, navegador: NAVEGADOR, microsoft_erro: this.microsoft.erro, frase: FRASE_DE_TESTE };
  }

  async _vozesEleven() {
    if (this.eleven && Date.now() - this.eleven.quando < 600_000 && this.eleven.chave === chaveEleven()) return this.eleven.vozes;
    const r = await fetch(`${ELEVEN}/voices`, { headers: { 'xi-api-key': chaveEleven() }, signal: AbortSignal.timeout(15_000) });
    if (r.status === 401) throw new Error('a ElevenLabs recusou a chave');
    if (!r.ok) throw new Error(`a ElevenLabs respondeu ${r.status}`);
    const { voices = [] } = await r.json();
    const vozes = voices.map((v) => ({
      id: `el:${v.voice_id}`, provedor: 'elevenlabs', voz: v.voice_id, nome: v.name,
      descricao: [v.labels?.gender === 'female' ? 'Feminina' : v.labels?.gender === 'male' ? 'Masculina' : '', v.labels?.description, v.labels?.accent && `sotaque ${v.labels.accent}`]
        .filter(Boolean).join(', '),
    }));
    this.eleven = { quando: Date.now(), chave: chaveEleven(), vozes };
    return vozes;
  }

  /** O que está escolhido, com tom e velocidade. */
  async atual() {
    await this.carregado;
    return this._resolve(this.escolha);
  }

  /** Na partida: se a voz escolhida é do Kokoro e ele ainda não está instalado, instala em segundo plano. */
  async prepara() {
    await this.carregado;
    if (this._resolve(this.escolha).provedor === 'kokoro' && this.kokoro && !this.kokoro.instalado()) this.kokoro.instala();
  }

  _resolve({ id, tom, velocidade }) {
    if (id === 'navegador') return NAVEGADOR;
    const k = KOKORO.find((x) => x.id === id);
    if (k) return { ...k, velocidade: Number.isFinite(velocidade) ? velocidade : 0 };
    if (String(id).startsWith('el:')) return { id, provedor: 'elevenlabs', voz: id.slice(3) };
    const m = MODELOS.find((x) => x.id === id)
      || (String(id).startsWith('ms:') ? { id, provedor: 'microsoft', voz: id.slice(3), tom: 0, velocidade: 0 } : MODELOS[0]);
    return { ...m, tom: Number.isFinite(tom) ? tom : m.tom, velocidade: Number.isFinite(velocidade) ? velocidade : m.velocidade };
  }

  async escolhe({ id, tom, velocidade }) {
    await this.carregado;
    const limita = (n, a, b) => (n === null || n === undefined || n === '' || !Number.isFinite(Number(n)) ? null : Math.max(a, Math.min(b, Math.round(Number(n)))));
    this.escolha = { id: String(id || PADRAO).slice(0, 120), tom: limita(tom, -25, 25), velocidade: limita(velocidade, -30, 40), versao: VERSAO_DA_ESCOLHA };
    // Escolheu uma voz do Kokoro que não está no notebook: já começa a instalar.
    if (this._resolve(this.escolha).provedor === 'kokoro' && this.kokoro && !this.kokoro.instalado()) this.kokoro.instala();
    await writeFile(this.arquivo, JSON.stringify(this.escolha), 'utf8');
    return this.escolha;
  }

  /**
   * O texto em áudio, na voz escolhida (ou em `outra`, para ouvir antes de
   * escolher): { audio, tipo }. Devolve null quando a voz é a do navegador.
   */
  async fala(t, outra = null) {
    await this.carregado;
    let v = this._resolve(outra || this.escolha);
    if (v.provedor === 'navegador') return null;
    if (v.provedor === 'kokoro' && !this.kokoro?.instalado()) {
      if (this.kokoro && !this.kokoro.estado().instalando && !this.kokoro.estado().erro) this.kokoro.instala();
      // Para ouvir uma voz que ainda não está aqui, avisa; na conversa, o Jarvis fala com a da Microsoft enquanto isso.
      if (outra) { const e = new Error(this.kokoro?.estado().erro || 'a voz ainda está sendo instalada'); e.instalando = true; throw e; }
      v = this._resolve({ id: 'jarvis' });
    }
    const limpo = texto(String(t || '').replace(/https?:\/\/\S+/g, 'o link'), 3000).trim();
    if (!limpo) return null;
    const chave = `${v.provedor}|${v.voz}|${v.tom}|${v.velocidade}|${limpo}`;
    if (this.cache.has(chave)) return this.cache.get(chave);
    let mp3;
    let tipo = 'audio/mpeg';
    if (v.provedor === 'kokoro') {
      mp3 = await this.kokoro.fala(limpo, { voz: v.voz, velocidade: Math.max(0.6, Math.min(1.6, 1 + (v.velocidade || 0) / 100)) });
      tipo = 'audio/wav';
    } else if (v.provedor === 'elevenlabs') {
      if (!chaveEleven()) throw new Error('falta a chave da ElevenLabs');
      const r = await fetch(`${ELEVEN}/text-to-speech/${encodeURIComponent(v.voz)}?output_format=mp3_44100_128`, {
        method: 'POST', headers: { 'xi-api-key': chaveEleven(), 'content-type': 'application/json', accept: 'audio/mpeg' },
        body: JSON.stringify({ text: limpo, model_id: 'eleven_flash_v2_5', language_code: 'pt' }), signal: AbortSignal.timeout(30_000),
      });
      if (r.status === 401) throw new Error('a ElevenLabs recusou a chave');
      if (r.status === 402 || r.status === 429) throw new Error('acabaram os créditos do mês na ElevenLabs');
      if (!r.ok) throw new Error(`a ElevenLabs respondeu ${r.status}`);
      mp3 = Buffer.from(await r.arrayBuffer());
    } else {
      mp3 = await sintetiza(limpo, { voz: v.voz, tom: v.tom, velocidade: v.velocidade });
    }
    const saida = { audio: mp3, tipo };
    if (limpo.length < 400) {
      this.cache.set(chave, saida);
      if (this.cache.size > 60) this.cache.delete(this.cache.keys().next().value);
    }
    return saida;
  }
}
