/**
 * A PONTE DO WHATSAPP WEB — um navegador de verdade, com a SUA sessão.
 *
 * Abre um Chromium com perfil guardado em `dados/navegador/`. Você lê o
 * QR Code uma vez; daí em diante a sessão fica. É o seu WhatsApp, na
 * sua máquina — nada passa por servidor meu nem de ninguém.
 *
 * O QUE VOCÊ PRECISA SABER ANTES DE LIGAR ISTO
 *
 * Automatizar o WhatsApp Web é contra os termos do WhatsApp. O risco é
 * do seu número: banimento acontece, e é o número que sustenta a
 * operação. O que este arquivo faz para diminuir (não zerar) o risco:
 *
 *   • JANELA VISÍVEL, sempre. Você vê cada mensagem sair. Modo
 *     escondido é o que transforma um errinho de código em cinquenta
 *     mensagens erradas antes de alguém perceber.
 *   • PAUSA ALEATÓRIA entre envios, e um teto por dia.
 *   • NADA DE DISPARO EM MASSA: uma mensagem por chamada, e a chamada
 *     vem de você clicando no painel.
 *   • O ENVIO É CONFERIDO: depois de mandar, ele procura a mensagem na
 *     conversa. Se não achar, devolve erro em vez de dizer "enviada".
 *
 * AVISO HONESTO SOBRE OS SELETORES
 *
 * Esta parte depende do HTML do WhatsApp Web, que muda sem avisar. Eu
 * NÃO consegui testar contra o WhatsApp real (não tenho a sua conta).
 * Por isso cada passo falha com mensagem clara E tira um print em
 * `dados/falhas/`: quando quebrar, você me manda o print e eu conserto
 * o seletor. Prometer que nunca vai quebrar seria mentira.
 */
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ESPERA_PADRAO = 25_000;

// Os caminhos até cada peça da tela, em ordem de preferência. Vários de
// propósito: quando o WhatsApp mexe num, costuma sobrar outro.
// Exportada para o diagnóstico em `testes/whatsapp.mjs` poder conferir
// ESTA tabela, e não uma cópia que envelhece em silêncio.
export const ONDE = {
  qr: ['canvas[aria-label*="scan" i]', 'canvas[aria-label*="QR" i]',
       'div[data-ref] canvas', '[data-testid="qrcode"]'],
  pronto: ['#pane-side', '[data-testid="chat-list"]',
           'div[aria-label*="lista de conversas" i]', 'div[aria-label*="Chat list" i]'],
  caixa: ['div[contenteditable="true"][data-tab="10"]',
          'div[contenteditable="true"][data-tab="6"]',
          'footer div[contenteditable="true"]',
          '[data-testid="conversation-compose-box-input"]'],
  enviar: ['button[aria-label*="Enviar" i]', 'button[aria-label*="Send" i]',
           '[data-testid="send"]', 'span[data-icon="send"]'],
  invalido: ['text=/número de telefone.*inválido/i', 'text=/phone number.*invalid/i',
             'text=/URL inválido/i', 'text=/not on WhatsApp/i'],
};

/**
 * O primeiro caminho que aparecer, dentro do prazo.
 *
 * A primeira versão tentava um caminho por vez, DIVIDINDO o prazo
 * entre eles: com quatro caminhos e 6 segundos, cada um ganhava 1,5s.
 * Numa primeira carga lenta do WhatsApp Web isso estourava antes da
 * tela ficar pronta, e o painel ficava preso em "Carregando…" com a
 * conversa já aberta na frente da pessoa.
 *
 * Agora os caminhos correm JUNTOS, cada um com o prazo inteiro. Mesmo
 * tempo total de espera, e quem chegar primeiro vence.
 */
async function primeiro(pagina, lista, espera = 4000) {
  const corrida = lista.map(async (alvo) => {
    const achado = pagina.locator(alvo).first();
    await achado.waitFor({ state: 'visible', timeout: espera });
    return achado;
  });
  try {
    return await Promise.any(corrida);
  } catch { /* nenhum apareceu no prazo */ }
  return null;
}

/**
 * Um pedaço da mensagem que dá para achar na conversa depois de enviada.
 *
 * O WhatsApp mostra a mensagem diferente do texto que foi: *negrito*
 * perde os asteriscos, emoji vira imagem, quebra de linha vira outro
 * bloco. E o `:has-text("…\n…")` do Playwright lia o \n como a letra n.
 * Então a marca é um trecho da primeira linha, só com letra, número e
 * pontuação simples.
 */
export function marcaDaMensagem(corpo) {
const linha = String(corpo || '').split('\n').find((l) => l.trim()) || '';
return linha.replace(/[*_~`]/g, '')
  .replace(/[^\p{L}\p{N}\s.,!?:;()\-]/gu, ' ')
  .replace(/\s+/g, ' ').trim().slice(0, 32).trim();
}


/**
 * De qual lead é esta conversa? O título da conversa é o NOME quando o
 * contato está salvo e o NÚMERO quando não está; casa pelos 8 últimos
 * dígitos ou pelo nome exato. Quem não casa não é lead.
 */
export function casaComLead(titulo, leads = []) {
  const digitos = String(titulo || '').replace(/\D/g, '');
  const nome = String(titulo || '').toLowerCase().trim();
  return leads.find((l) => {
    const dele = String(l?.whatsapp || '').replace(/\D/g, '');
    if (digitos.length >= 8 && dele.length >= 8 && dele.slice(-8) === digitos.slice(-8)) return true;
    return Boolean(nome) && String(l?.nome || '').toLowerCase().trim() === nome;
  }) || null;
}

export class WhatsApp {
  constructor({ pasta, maxPorDia = 40, pausa = [12, 35], aoMudar = () => {} }) {
    this.pasta = pasta;
    this.maxPorDia = maxPorDia;
    this.pausa = pausa;
    this.aoMudar = aoMudar;
    this.contexto = null;
    this.pagina = null;
    this.situacao = 'desligado';   // desligado | abrindo | qr | pronto | erro
    this.detalhe = '';
    this.enviadasHoje = 0;
    this.dia = new Date().toDateString();
    this.ultimoEnvio = 0;
  }

  estado() {
    this._viraOdia();
    return {
      situacao: this.situacao,
      detalhe: this.detalhe,
      enviadas_hoje: this.enviadasHoje,
      max_por_dia: this.maxPorDia,
      restam_hoje: Math.max(0, this.maxPorDia - this.enviadasHoje),
    };
  }

  _viraOdia() {
    const hoje = new Date().toDateString();
    if (hoje !== this.dia) { this.dia = hoje; this.enviadasHoje = 0; }
  }

  _muda(situacao, detalhe = '') {
    this.situacao = situacao;
    this.detalhe = detalhe;
    this.aoMudar(this.estado());
  }

  /**
   * O diagnóstico, pelo painel — sem terminal nenhum.
   *
   * Abre o navegador se preciso, olha a tela e devolve o relatório em
   * texto. Não envia nada. É o mesmo código que o teste de terminal
   * usa, para os dois nunca contarem histórias diferentes.
   */
  async diagnostica() {
    if (!this.contexto) await this.liga();
    if (!this.pagina) {
      return { linhas: ['Não consegui abrir o navegador.'], ok: false, print: '' };
    }
    // Dá tempo de a tela carregar: na primeira vez o WhatsApp Web é
    // lento, e um diagnóstico apressado acusa falha que não existe.
    await primeiro(this.pagina, [...ONDE.pronto, ...ONDE.qr], 45_000);
    const { diagnostica } = await import('./diagnostico-zap.mjs');
    const saida = await diagnostica(this.pagina);
    const print = await this._print('diagnostico');
    return { ...saida, print };
  }

  async _print(nome) {
    try {
      const pasta = join(this.pasta, '..', 'falhas');
      await mkdir(pasta, { recursive: true });
      const alvo = join(pasta, `${nome}-${Date.now()}.png`);
      await this.pagina?.screenshot({ path: alvo, fullPage: false });
      return alvo;
    } catch { return ''; }
  }

  async liga() {
    if (this.contexto) return this.estado();
    this._muda('abrindo');
    let chromium;
    try {
      ({ chromium } = await import('playwright'));
    } catch {
      this._muda('erro', 'Playwright não instalado. Rode: npm install');
      return this.estado();
    }
    await mkdir(this.pasta, { recursive: true });
    this.contexto = await chromium.launchPersistentContext(this.pasta, {
      // Janela VISÍVEL de propósito. Veja o aviso no topo do arquivo.
      headless: false,
      viewport: { width: 1180, height: 800 },
      // Aqui havia um `--disable-blink-features=AutomationControlled`,
      // que existe só para o navegador parecer menos automatizado.
      // Tirei: o resto do projeto diz, por escrito, que não esconde
      // que é automação, e não dá para dizer isso num arquivo e fazer
      // o contrário no outro. Também não fazia falta — o Playwright
      // abre o WhatsApp Web sem ele.
    });
    this.contexto.on('close', () => {
      this.contexto = null; this.pagina = null; this._muda('desligado', 'A janela foi fechada.');
    });
    this.pagina = this.contexto.pages()[0] || await this.contexto.newPage();
    // O endereço é o WhatsApp Web. A variável existe para eu conseguir
    // provar o diagnóstico contra uma página de mentira do meu lado —
    // sem ela, esse caminho só seria executado pela primeira vez na
    // sua máquina.
    await this.pagina.goto(process.env.WHATSAPP_URL || 'https://web.whatsapp.com',
      { waitUntil: 'domcontentloaded' });
    return this.confere();
  }

  async confere() {
    if (!this.pagina) { this._muda('desligado'); return this.estado(); }
    if (await primeiro(this.pagina, ONDE.pronto, 6000)) {
      this._muda('pronto', 'Sessão aberta.');
    } else if (await primeiro(this.pagina, ONDE.qr, 4000)) {
      this._muda('qr', 'Leia o QR Code na janela que abriu, pelo celular.');
    } else {
      this._muda('abrindo', 'Carregando o WhatsApp Web…');
    }
    return this.estado();
  }

  async desliga() {
    await this.contexto?.close().catch(() => {});
    this.contexto = null; this.pagina = null;
    this._muda('desligado');
    return this.estado();
  }

  /** Espera entre envios: nem rajada, nem relógio suíço. */
  async _respira() {
    const [minimo, maximo] = this.pausa;
    const alvo = (minimo + Math.random() * (maximo - minimo)) * 1000;
    const passou = Date.now() - this.ultimoEnvio;
    if (this.ultimoEnvio && passou < alvo) {
      await new Promise((r) => setTimeout(r, alvo - passou));
    }
  }

  /**
   * Manda UMA mensagem e confere que ela apareceu na conversa.
   * Devolve {enviada, motivo, print}. Nunca diz "enviada" sem ver.
   */
  async envia(numero, texto) {
    this._viraOdia();
    const fone = String(numero || '').replace(/\D/g, '');
    const corpo = String(texto || '').trim();
    if (!fone || fone.length < 10) return { enviada: false, motivo: 'Número inválido.' };
    if (!corpo) return { enviada: false, motivo: 'Mensagem vazia.' };
    if (this.situacao !== 'pronto') {
      await this.confere();
      if (this.situacao !== 'pronto') {
        return { enviada: false, motivo: 'O WhatsApp Web não está conectado.' };
      }
    }
    if (this.enviadasHoje >= this.maxPorDia) {
      return { enviada: false, motivo: `Teto de ${this.maxPorDia} mensagens no dia atingido.` };
    }
    await this._respira();

    const marca = marcaDaMensagem(corpo);
    try {
      await this.pagina.goto(
        `https://web.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(corpo)}`,
        { waitUntil: 'domcontentloaded', timeout: ESPERA_PADRAO });

      const ruim = await primeiro(this.pagina, ONDE.invalido, 3000);
      if (ruim) {
        return { enviada: false, motivo: 'O WhatsApp diz que este número não existe.' };
      }
      const caixa = await primeiro(this.pagina, ONDE.caixa, 15000);
      if (!caixa) {
        return { enviada: false, motivo: 'Não achei a caixa de texto do WhatsApp Web.',
                 print: await this._print('sem-caixa') };
      }
      await caixa.click();
      // O texto já vai na URL; se não foi, digita. Digitar é mais lento
      // e mais parecido com gente, então serve de plano A também.
      const temTexto = (await caixa.innerText().catch(() => '')).trim().length > 0;
      if (!temTexto) await caixa.type(corpo, { delay: 18 });

      const botao = await primeiro(this.pagina, ONDE.enviar, 6000);
      if (botao) await botao.click();
      else await this.pagina.keyboard.press('Enter');

      // A CONFERÊNCIA: a mensagem tem que aparecer na conversa.
      await this.pagina.waitForTimeout(1200);
      const apareceu = await this.pagina
        .locator('div.message-out').filter({ hasText: marca }).first()
        .waitFor({ state: 'visible', timeout: 12000 })
        .then(() => true)
        .catch(() => false);
      if (!apareceu) {
        // INCERTA, e não "falhou": o clique aconteceu. Tentar de novo
        // sozinho é o que fazia o dono receber a mesma mensagem cinco
        // vezes. Quem confere é você, olhando a conversa.
        this.enviadasHoje += 1;
        this.ultimoEnvio = Date.now();
        return { enviada: false, incerta: true, motivo: 'Cliquei em enviar mas não vi a mensagem na conversa. '
          + 'Confira a janela antes de mandar de novo.', print: await this._print('sem-confirmar') };
      }
      this.enviadasHoje += 1;
      this.ultimoEnvio = Date.now();
      this.aoMudar(this.estado());
      return { enviada: true };
    } catch (e) {
      return { enviada: false, motivo: `Falhou: ${e.message}`.slice(0, 300),
               print: await this._print('erro') };
    }
  }

  /**
   * Lê as conversas com mensagem não lida e devolve o que chegou.
   * Não responde nada sozinho: quem decide é você, no painel.
   */
  async novidades(limite = 10, { eDeLead = null } = {}) {
    if (this.situacao !== 'pronto') {
      await this.confere();
      if (this.situacao !== 'pronto') return { conversas: [], motivo: 'não conectado' };
    }
    try {
      const naoLidas = this.pagina.locator(
        '#pane-side [aria-label*="não lida" i], #pane-side [aria-label*="unread" i]');
      const total = Math.min(await naoLidas.count(), 60);
      const conversas = [];
      for (let i = 0; i < total && conversas.length < limite; i += 1) {
        const linha = naoLidas.nth(i).locator('xpath=ancestor::*[@role="listitem"][1]');
        const titulo = (await linha.innerText().catch(() => '')).split('\n')[0] || '';
        // SÓ CONVERSA DE LEAD. Abrir uma conversa marca como lida no seu
        // celular: a de um amigo, de um fornecedor, de um grupo, nem é
        // aberta. Fica não lida, do jeito que estava, e nada dela é lido.
        if (eDeLead && !eDeLead(titulo)) continue;
        await linha.click().catch(() => {});
        await this.pagina.waitForTimeout(900);
        const entrando = this.pagina.locator('div.message-in');
        const total = await entrando.count();
        const falas = [];
        const fotos = [];
        for (let j = Math.max(0, total - 4); j < total; j += 1) {
          const bolha = entrando.nth(j);
          const t = (await bolha.innerText().catch(() => '')).trim();
          // A última linha da bolha é a hora ("10:32"): não é fala.
          const fala = t.split('\n').slice(0, -1).join('\n').trim();
          // FOTO: o WhatsApp Web mostra a imagem a partir de um blob da
          // própria página, e é dali que ela é copiada (a foto do cardápio
          // que o cliente manda depois de fechar).
          const imagens = await bolha.evaluate(async (el) => {
            const saida = [];
            for (const img of el.querySelectorAll('img[src^="blob:"]')) {
              if ((img.naturalWidth || 0) < 120) continue;
              try {
                const blob = await (await fetch(img.src)).blob();
                const bytes = new Uint8Array(await blob.arrayBuffer());
                let bin = '';
                for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
                saida.push({ tipo: blob.type || 'image/jpeg', base64: btoa(bin) });
              } catch { /* foto que ainda não baixou fica para a próxima volta */ }
            }
            return saida;
          }).catch(() => []);
          const marcas = [];
          for (const imagem of imagens) {
            const marca = createHash('sha1').update(Buffer.from(imagem.base64, 'base64')).digest('hex');
            fotos.push({ ...imagem, marca });
            marcas.push(`[foto ${marca.slice(0, 8)}]`);
          }
          const tudo = [fala, ...marcas].filter(Boolean).join('\n');
          if (tudo) falas.push(tudo);
          else if (t && !/^\d{1,2}:\d{2}/.test(t)) falas.push(t);
        }
        // O título é o NOME quando o contato está salvo, e o NÚMERO
        // quando não está. Quem vai casar isso com o lead precisa das
        // duas coisas, então saem as duas — e os dígitos já extraídos,
        // para ninguém ter que adivinhar o formato lá na frente.
        const nome = titulo.trim();
        conversas.push({
          de: nome,
          digitos: nome.replace(/\D/g, ''),
          mensagens: falas.slice(-4),
          fotos,
        });
      }
      return { conversas };
    } catch (e) {
      return { conversas: [], motivo: e.message.slice(0, 200),
               print: await this._print('ler') };
    }
  }
}
