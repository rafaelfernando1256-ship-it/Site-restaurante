/**
 * CAÇADOR PELO NAVEGADOR — abre o Google Maps e lê a lista.
 *
 * É o caçador que você já tinha e pediu de volta: um navegador de
 * verdade, na sua máquina, fazendo a busca que você faria à mão e
 * anotando o que aparece na tela.
 *
 * COMO ELE SE COMPORTA
 *
 *   • JANELA VISÍVEL. Você vê a busca acontecendo. Se algo sair
 *     diferente do esperado, você fecha.
 *   • UMA BUSCA POR CLIQUE SEU. Não existe laço rodando sozinho.
 *   • PAUSA ENTRE OS CARTÕES (1 a 2,5s) e rolagem gradual, como gente.
 *   • TETO por busca (padrão 25). Lista grande é mais tempo de janela
 *     aberta, não mais venda.
 *   • PERFIL SEPARADO do WhatsApp: a sessão de um não contamina o outro.
 *
 * QUANDO QUEBRAR
 *
 * O Maps muda o HTML sem avisar. Cada campo tem vários caminhos
 * alternativos; quando nenhum funciona, o campo volta vazio em vez de
 * inventar, e um print vai para `dados/falhas/`. Me mande o print.
 *
 * O que NÃO está aqui: nada de resolver CAPTCHA, de esconder que é
 * automação, nem de rodar com a janela escondida. Se o Google pedir
 * verificação, a busca para e avisa — resolver na mão é com você.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { texto } from './comum.mjs';
import { categoriaValida, tipoPeloNome } from './roteiro.mjs';

const ONDE = {
  lista: ['div[role="feed"]', 'div[aria-label^="Resultados"]', 'div[aria-label^="Results"]'],
  cartao: ['a.hfpxzc', 'div[role="feed"] a[href*="/maps/place/"]'],
  nome: ['h1.DUwDvf', 'h1[class*="fontHeadline"]', 'div[role="main"] h1'],
  site: ['a[data-item-id="authority"]', 'a[aria-label^="Site"]', 'a[aria-label^="Website"]'],
  telefone: ['button[data-item-id^="phone"]', '[data-item-id^="phone:tel:"]'],
  endereco: ['button[data-item-id="address"]', '[data-item-id="address"]'],
  categoria: ['button[jsaction*="category"]', 'div.fontBodyMedium button[jsaction]'],
  nota: ['div.F7nice span[aria-hidden="true"]'],
  avaliacoes: ['div.F7nice span[aria-label*="avaliaç"]', 'div.F7nice span[aria-label*="review"]'],
  barreira: ['form[action*="consent"]', 'div[aria-label*="Antes de continuar"]',
             'text=/sistemas automatizados/i', 'text=/unusual traffic/i',
             'iframe[src*="recaptcha"]'],
};

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
const entre = (a, b) => a + Math.random() * (b - a);

async function leia(raiz, caminhos, atributo = null) {
  for (const alvo of caminhos) {
    try {
      const elemento = raiz.locator(alvo).first();
      if (!(await elemento.count())) continue;
      const valor = atributo
        ? await elemento.getAttribute(atributo)
        : (await elemento.getAttribute('aria-label')) || (await elemento.innerText());
      if (valor && valor.trim()) return valor.trim();
    } catch { /* tenta o próximo */ }
  }
  return '';
}

async function achaAlgum(pagina, caminhos, espera = 3000) {
  for (const alvo of caminhos) {
    try {
      await pagina.locator(alvo).first().waitFor({ state: 'visible', timeout: espera / caminhos.length });
      return true;
    } catch { /* tenta o próximo */ }
  }
  return false;
}

/** "Telefone: +55 84 98888-7777" → "+55 84 98888-7777" */
function limpaRotulo(valor) {
  return String(valor || '')
    .replace(/^(telefone|phone|endereço|address|site|website)\s*:\s*/i, '')
    .replace(/^(Telefone|Endereço|Site):?\s*/i, '')
    .trim();
}

function pontua(dados) {
  let p = dados.site_achado ? 0 : 4;
  const n = Number(dados.avaliacoes || 0);
  p += n >= 200 ? 3 : n >= 50 ? 2 : n >= 10 ? 1 : 0;
  const nota = Number(dados.nota || 0);
  p += nota >= 4.3 ? 2 : nota >= 3.8 ? 1 : 0;
  p += dados.telefone ? 1 : 0;
  return Math.min(p, 10);
}

export class CacadorNavegador {
  constructor({ pasta, aoAndar = () => {} }) {
    this.pasta = pasta;
    this.aoAndar = aoAndar;
    this.contexto = null;
    this.pagina = null;
    this.ocupado = false;
  }

  async _print(nome) {
    try {
      const pasta = join(this.pasta, '..', 'falhas');
      await mkdir(pasta, { recursive: true });
      const alvo = join(pasta, `cacador-${nome}-${Date.now()}.png`);
      await this.pagina?.screenshot({ path: alvo });
      return alvo;
    } catch { return ''; }
  }

  async _abre() {
    if (this.contexto) return;
    const { chromium } = await import('playwright');
    await mkdir(this.pasta, { recursive: true });
    this.contexto = await chromium.launchPersistentContext(this.pasta, {
      headless: false,                      // visível, sempre
      viewport: { width: 1280, height: 860 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });
    this.contexto.on('close', () => { this.contexto = null; this.pagina = null; });
    this.pagina = this.contexto.pages()[0] || await this.contexto.newPage();
  }

  async fecha() {
    await this.contexto?.close().catch(() => {});
    this.contexto = null; this.pagina = null;
  }

  async caca(termo, cidade, limite = 25) {
    if (this.ocupado) throw new Error('Já tem uma busca rodando. Espere ela terminar.');
    this.ocupado = true;
    const quantos = Math.min(Math.max(Number(limite) || 25, 1), 40);
    try {
      await this._abre();
      const busca = `${termo} em ${cidade}`;
      this.aoAndar({ etapa: 'abrindo', detalhe: busca });
      await this.pagina.goto(
        `https://www.google.com/maps/search/${encodeURIComponent(busca)}?hl=pt-BR`,
        { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await dorme(entre(2000, 3500));

      if (await achaAlgum(this.pagina, ONDE.barreira, 2500)) {
        return { parou: 'verificacao',
          motivo: 'O Google pediu verificação (consentimento ou "não sou um robô"). '
            + 'Resolva na janela que abriu e clique em Caçar de novo.',
          leads: [], print: await this._print('verificacao') };
      }
      if (!await achaAlgum(this.pagina, ONDE.lista, 12_000)) {
        return { parou: 'sem_lista',
          motivo: 'Não achei a lista de resultados do Maps. O layout pode ter mudado.',
          leads: [], print: await this._print('sem-lista') };
      }

      // Rola a lista até juntar cartões suficientes.
      const lista = this.pagina.locator(ONDE.lista[0]);
      let cartoes = this.pagina.locator(ONDE.cartao[0]);
      let antes = -1;
      for (let volta = 0; volta < 12; volta += 1) {
        const agora = await cartoes.count();
        this.aoAndar({ etapa: 'rolando', achados: agora });
        if (agora >= quantos || agora === antes) break;
        antes = agora;
        await lista.evaluate((el) => el.scrollBy(0, el.clientHeight * 0.9)).catch(() => {});
        await dorme(entre(900, 1600));
      }
      cartoes = this.pagina.locator(ONDE.cartao[0]);
      const total = Math.min(await cartoes.count(), quantos);
      if (!total) {
        return { parou: 'vazio', motivo: 'A busca não trouxe nenhum resultado.',
                 leads: [], print: await this._print('vazio') };
      }

      const achados = [];
      for (let i = 0; i < total; i += 1) {
        this.aoAndar({ etapa: 'lendo', posicao: i + 1, de: total });
        const cartao = cartoes.nth(i);
        const rotulo = (await cartao.getAttribute('aria-label').catch(() => '')) || '';
        const href = (await cartao.getAttribute('href').catch(() => '')) || '';
        try {
          await cartao.click({ timeout: 8000 });
        } catch { continue; }
        await dorme(entre(1100, 2400));     // pausa de gente, entre cartões

        const painel = this.pagina.locator('div[role="main"]').first();
        const nome = texto(await leia(painel, ONDE.nome) || rotulo, 140);
        if (!nome) continue;
        const site = texto(await leia(painel, ONDE.site, 'href'), 300);
        const telefone = texto(limpaRotulo(await leia(painel, ONDE.telefone)), 40);
        const endereco = texto(limpaRotulo(await leia(painel, ONDE.endereco)), 240);
        const notaBruta = (await leia(painel, ONDE.nota)).replace(',', '.');
        const avaliacoesBrutas = (await leia(painel, ONDE.avaliacoes)).replace(/\D/g, '');

        const dados = {
          place_id: texto(href.split('/maps/place/')[1]?.split('/')[0] || `maps:${nome}`, 160),
          nome,
          endereco,
          telefone,
          whatsapp: telefone.replace(/\D/g, ''),
          tipo: texto(categoriaValida(await leia(painel, ONDE.categoria)) || tipoPeloNome(nome), 60),
          site_achado: site.startsWith('http') ? site : '',
          nota: Number(notaBruta) || 0,
          avaliacoes: Number(avaliacoesBrutas) || 0,
          presenca: site.startsWith('http') ? 'tem_site' : 'sem_site_encontrado',
        };
        dados.pontuacao = pontua(dados);
        achados.push(dados);
      }

      const semSite = achados.filter((l) => l.presenca === 'sem_site_encontrado');
      return {
        fonte: 'navegador_maps',
        achados: achados.length,
        descartados_com_site: achados.length - semSite.length,
        leads: semSite.sort((a, b) => b.pontuacao - a.pontuacao),
        aviso: 'Lido da tela do Google Maps, na sua máquina. Não achar site é '
          + 'indício, não prova — a ficha do Maps pode só não ter o campo preenchido.',
      };
    } finally {
      this.ocupado = false;
      this.aoAndar({ etapa: 'fim' });
    }
  }
}
