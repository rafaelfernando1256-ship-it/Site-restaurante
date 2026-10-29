/**
 * "CONECTAR CLAUDE PARA WHATSAPP" — o que ficou escolhido.
 *
 * Mora num arquivo só dele (dados/claude.json), e não junto dos
 * ajustes do painel: o painel grava os ajustes inteiros de uma vez, e
 * uma aba aberta desde ontem desligaria o Claude sem ninguém ver,
 * só por salvar um horário.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const PADRAO = {
  // O Claude escreve as mensagens do vendedor? Começa desligado: só
  // liga depois de um teste que deu certo, no painel.
  ligado: false,
  // '' = o modelo padrão da sua conta no Claude Code.
  modelo: '',
  // Sem limite no plano, usar o Groq até ele voltar (se houver chave).
  reservaGroq: true,
  ultimoTeste: null,
};

export const MODELOS = {
  '': 'O padrão do seu Claude Code',
  opus: 'Opus · escreve melhor, gasta mais do limite',
  sonnet: 'Sonnet · equilibrado',
  haiku: 'Haiku · o mais rápido, gasta menos',
};

export class ConfigClaude {
  constructor(arquivo) {
    this.arquivo = arquivo;
    this.valores = { ...PADRAO };
  }

  async carrega() {
    try {
      const lido = JSON.parse(await readFile(this.arquivo, 'utf8'));
      this.valores = { ...PADRAO, ...lido };
    } catch { /* primeira vez */ }
    if (!(this.valores.modelo in MODELOS)) this.valores.modelo = '';
    return this;
  }

  atual() {
    return { ligado: this.valores.ligado === true, modelo: this.valores.modelo,
      reservaGroq: this.valores.reservaGroq !== false };
  }

  get ultimoTeste() { return this.valores.ultimoTeste; }

  async muda(parcial = {}) {
    const novo = { ...this.valores };
    if ('ligado' in parcial) novo.ligado = parcial.ligado === true;
    if ('modelo' in parcial && parcial.modelo in MODELOS) novo.modelo = parcial.modelo;
    if ('reservaGroq' in parcial) novo.reservaGroq = parcial.reservaGroq !== false;
    if ('ultimoTeste' in parcial) novo.ultimoTeste = parcial.ultimoTeste;
    this.valores = novo;
    await mkdir(dirname(this.arquivo), { recursive: true }).catch(() => {});
    const temporario = `${this.arquivo}.escrevendo`;
    await writeFile(temporario, JSON.stringify(novo, null, 2), 'utf8');
    await rename(temporario, this.arquivo);
    return this.atual();
  }
}
