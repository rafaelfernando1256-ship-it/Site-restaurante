/**
 * OS DADOS — um arquivo JSON no notebook, e não o navegador.
 *
 * Na versão da Netlify os clientes moravam no localStorage: limpar o
 * navegador apagava tudo, e o celular não via o que o notebook tinha.
 * Rodando aqui, o lugar certo é o disco.
 *
 * Gravação ATÔMICA: escreve num arquivo temporário e troca pelo bom no
 * fim. Sem isso, um desligamento no meio da gravação deixaria um JSON
 * pela metade — e um JSON pela metade é a sua carteira de clientes
 * inteira perdida, não um registro.
 *
 * Toda gravação deixa uma cópia da anterior em `dados/antes.json`. É
 * barato, e é o que salva quando o erro foi seu e não do programa.
 */
import { mkdir, readFile, rename, writeFile, copyFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const VAZIO = { leads: [], ajustes: {}, versao: 1 };

export class Dados {
  constructor(caminho) {
    this.caminho = caminho;
    this.antes = join(dirname(caminho), 'antes.json');
    this.memoria = null;
    this.gravando = Promise.resolve();
  }

  async carrega() {
    try {
      const bruto = JSON.parse(await readFile(this.caminho, 'utf8'));
      this.memoria = {
        ...VAZIO,
        ...bruto,
        leads: Array.isArray(bruto.leads) ? bruto.leads : [],
        ajustes: bruto.ajustes && typeof bruto.ajustes === 'object' ? bruto.ajustes : {},
      };
    } catch (e) {
      if (e.code !== 'ENOENT') {
        // Arquivo corrompido não vira "começar do zero" em silêncio: o
        // ruim fica guardado para você poder tentar recuperar à mão.
        const quebrado = `${this.caminho}.quebrado-${Date.now()}`;
        await rename(this.caminho, quebrado).catch(() => {});
        console.error(`\n  ⚠ O arquivo de dados não abriu (${e.message}).`);
        console.error(`    Guardei o original em ${quebrado} e comecei um novo.\n`);
      }
      this.memoria = structuredClone(VAZIO);
    }
    return this.memoria;
  }

  tudo() { return this.memoria || structuredClone(VAZIO); }

  /** Grava em fila: duas gravações ao mesmo tempo embaralhariam o arquivo. */
  async guarda(novo) {
    this.memoria = {
      ...this.tudo(),
      ...novo,
      leads: Array.isArray(novo.leads) ? novo.leads : this.tudo().leads,
    };
    const conteudo = JSON.stringify(this.memoria, null, 2);
    this.gravando = this.gravando.then(async () => {
      await mkdir(dirname(this.caminho), { recursive: true });
      await copyFile(this.caminho, this.antes).catch(() => {});
      const temporario = `${this.caminho}.novo`;
      await writeFile(temporario, conteudo, 'utf8');
      await rename(temporario, this.caminho);
    }).catch((e) => { console.error('  ⚠ não consegui gravar:', e.message); });
    await this.gravando;
    return this.memoria;
  }
}
