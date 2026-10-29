/**
 * VER DE FORA DE CASA.
 *
 * O painel no celular (celular.mjs) só funciona dentro do seu wi-fi.
 * Na rua, o `192.168.x.x` não existe — é um endereço que só vale
 * dentro da sua casa.
 *
 * Para alcançar de fora há dois caminhos. O primeiro é abrir uma porta
 * no seu roteador apontando para o notebook: é pôr a sua máquina na
 * internet aberta, onde ela passa a levar varredura automática o dia
 * inteiro. Não vamos por aí.
 *
 * O segundo é o que este arquivo faz: o seu notebook abre uma conexão
 * DE DENTRO PARA FORA com a Cloudflare, e ela devolve um endereço
 * https. Ninguém de fora consegue iniciar conversa com o seu
 * computador — é sempre ele que puxa. O roteador não precisa de
 * nenhuma mudança, e o trânsito vai criptografado, o que conserta de
 * quebra o problema do PIN viajando em texto no wi-fi.
 *
 * O QUE ISTO CUSTA EM TROCA — e é bom você saber antes de ligar:
 *
 *   · o endereço é público. Quem souber dele chega na porta do
 *     painel. A tranca continua sendo o PIN, e agora ela é a ÚNICA.
 *     Por isso tudo que chega por este caminho pede PIN, sempre, sem
 *     exceção — nem que chegue parecendo o próprio notebook.
 *   · o endereço MUDA toda vez que a Matilha reinicia. Endereço fixo
 *     exige conta e domínio na Cloudflare; isso dá para fazer depois.
 *   · é o plano grátis de testes da Cloudflare. Eles não prometem que
 *     ele fica de pé. Para o painel, serve.
 */
import { spawn } from 'node:child_process';
import { chmod, mkdir, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { join } from 'node:path';

const BASE = 'https://github.com/cloudflare/cloudflared/releases/latest/download/';
const ARQUIVOS = {
  win32: { x64: 'cloudflared-windows-amd64.exe', arm64: 'cloudflared-windows-arm64.exe' },
  darwin: { x64: 'cloudflared-darwin-amd64.tgz', arm64: 'cloudflared-darwin-arm64.tgz' },
  linux: { x64: 'cloudflared-linux-amd64', arm64: 'cloudflared-linux-arm64' },
};

export class Tunel {
  constructor({ pasta, aoAndar = () => {} }) {
    this.pasta = pasta;
    this.aoAndar = aoAndar;
    this.processo = null;
    this.url = '';
    this.erro = '';
    this.baixando = false;
  }

  get programa() {
    const nome = ARQUIVOS[process.platform]?.[process.arch];
    return nome ? join(this.pasta, nome.replace('.tgz', '')) : '';
  }

  estado() {
    return {
      ligado: Boolean(this.processo),
      url: this.url,
      erro: this.erro,
      baixando: this.baixando,
      suportado: Boolean(ARQUIVOS[process.platform]?.[process.arch]),
    };
  }

  /** Baixa o cloudflared na primeira vez. Depois disso, já está aqui. */
  async garanteOPrograma() {
    const nome = ARQUIVOS[process.platform]?.[process.arch];
    if (!nome) throw new Error(`sem cloudflared para ${process.platform}/${process.arch}`);
    if (nome.endsWith('.tgz')) {
      throw new Error('no Mac, instale com: brew install cloudflared');
    }
    const alvo = this.programa;
    try {
      const info = await stat(alvo);
      if (info.size > 1_000_000) return alvo;
    } catch { /* ainda não existe */ }

    this.baixando = true;
    this.aoAndar({ etapa: 'baixando', detalhe: 'buscando o cloudflared (uns 40 MB)' });
    try {
      await mkdir(this.pasta, { recursive: true });
      const resposta = await fetch(BASE + nome, { redirect: 'follow' });
      if (!resposta.ok) throw new Error(`a Cloudflare respondeu ${resposta.status}`);
      await pipeline(Readable.fromWeb(resposta.body), createWriteStream(alvo));
      if (process.platform !== 'win32') await chmod(alvo, 0o755);
      return alvo;
    } finally {
      this.baixando = false;
    }
  }

  /**
   * Liga o túnel apontando para `porta` — que NÃO é a porta do painel,
   * e sim uma segunda, exclusiva dele. É assim que o servidor sabe,
   * sem depender de cabeçalho nenhum, que aquele pedido veio da
   * internet e tem que mostrar o PIN.
   */
  async liga(porta) {
    if (this.processo) return this.estado();
    this.erro = '';
    const programa = await this.garanteOPrograma();

    this.aoAndar({ etapa: 'ligando', detalhe: 'abrindo o caminho com a Cloudflare' });
    const filho = spawn(programa, [
      'tunnel', '--no-autoupdate', '--url', `http://127.0.0.1:${porta}`,
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    this.processo = filho;

    let tudo = '';
    const url = await new Promise((resolve) => {
      const olha = (pedaco) => {
        tudo += pedaco;
        // O cloudflared escreve o endereço no meio de uma moldura de
        // asteriscos, na saída de erro. É de lá que ele sai.
        //
        // O `(?!api\.)` não é frescura. Quando o túnel FALHA, a
        // mensagem de erro cita `api.trycloudflare.com` — que casa com
        // qualquer regra ingênua. Foi o que aconteceu na primeira
        // versão disto: o túnel morria e o painel anunciava
        // `https://api.trycloudflare.com` como se estivesse no ar.
        const achado = tudo.match(/https:\/\/(?!api\.)[a-z0-9-]+\.trycloudflare\.com/);
        if (achado) resolve(achado[0]);
      };
      filho.stdout.on('data', olha);
      filho.stderr.on('data', olha);
      filho.on('error', (e) => { this.erro = e.message; resolve(''); });
      filho.on('close', () => {
        if (!this.url) {
          // A última linha do cloudflared diz por quê. Sem ela, o
          // painel só sabe dizer "não deu", que não ajuda ninguém.
          const motivo = tudo.split('\n').filter((l) => l.trim()).pop() || '';
          this.erro = this.erro
            || `o cloudflared fechou antes de dar o endereço — ${motivo.slice(-180)}`;
        }
        this.processo = null;
        this.url = '';
        resolve('');
      });
      setTimeout(() => resolve(''), 45_000);
    });

    if (!url) {
      this.erro = this.erro || 'a Cloudflare não respondeu em 45 segundos';
      await this.desliga();
      throw new Error(this.erro);
    }
    this.url = url;
    this.aoAndar({ etapa: 'no ar', detalhe: url });
    return this.estado();
  }

  async desliga() {
    const filho = this.processo;
    this.processo = null;
    this.url = '';
    if (!filho) return this.estado();
    filho.kill();
    await new Promise((r) => { filho.once('close', r); setTimeout(r, 3000); });
    this.aoAndar({ etapa: 'desligado' });
    return this.estado();
  }
}
