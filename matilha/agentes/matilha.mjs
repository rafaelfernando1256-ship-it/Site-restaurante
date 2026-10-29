/**
 * AGENTE 1 · OS CAÇADORES — vários ao mesmo tempo, cada um no seu Chrome.
 *
 * O caçador antigo abria uma aba e ia de negócio em negócio. Agora
 * cada caçador abre o PRÓPRIO Chrome (um programa separado, com o
 * perfil e os cookies dele em `dados/navegador-matilha/cacador-N/`),
 * e a lista de buscas é repartida entre eles. Mesma leitura, várias
 * vezes mais larga.
 *
 * Quantos caçadores é escolha sua, no painel, de 1 a 7. O teto não é
 * enfeite: cada caçador é um Chrome inteiro, com a memória de um
 * (uns 200 a 300 MB cada). Passar do que o notebook
 * aguenta não acelera nada — faz as janelas brigarem pelo mesmo
 * processador, e o Google ainda passa a ver um monte de busca saindo
 * junto do mesmo lugar, que é exatamente o que acende o "não sou um
 * robô".
 *
 * ─────────────────────────────────────────────────────────────────
 * DE ONDE VEM A VELOCIDADE
 * ─────────────────────────────────────────────────────────────────
 * Não é de tirar as pausas. É de não baixar o que não se lê:
 *
 *   1. IMAGEM, FONTE, VÍDEO E CSS SÃO BLOQUEADOS. O Maps é pesado de
 *      foto, e nós só queremos texto. Sozinho, isto corta a maior
 *      parte do tempo de cada página.
 *   2. VAI DIRETO NA URL DE BUSCA. Sem passar pela home, sem digitar
 *      no campo, sem esperar sugestão.
 *   3. `domcontentloaded`, não `networkidle`. O Maps nunca fica
 *      ocioso de rede — esperar por isso é esperar para sempre.
 *   4. UM CHROME POR CAÇADOR. Nada de abas de um Chrome só: cada
 *      caçador é um Chrome separado, na frente, sem esperar a vez de
 *      uma aba em segundo plano, e um que trava ou fecha não leva os
 *      outros junto. As janelas abrem em escada, para dar para ver
 *      todas. Custa mais memória (é o motivo do teto de 7).
 *   5. OS CHROMES FICAM ABERTOS entre uma caçada e outra: a operação
 *      emenda buscas o dia inteiro, e reabrir sete janelas a cada volta
 *      só piscaria a tela.
 *   6. NÃO ABRE O QUE JÁ SE SABE. O cartão da lista já mostra o botão
 *      "Site" de quem tem site — esse negócio é descartado sem clique.
 *      E quem já foi lido numa busca anterior é pulado: a operação
 *      repete as mesmas buscas o dia inteiro, e antes cada volta
 *      reabria, um por um, os mesmos vinte negócios da volta passada.
 *   7. CADA VOLTA DESCE MAIS. Como os conhecidos são pulados, a busca
 *      rola até achar negócios NOVOS, em vez de parar nos vinte
 *      primeiros de sempre. Quando a lista acaba, a busca avisa que
 *      esgotou, e a operação para de gastar tempo com ela.
 *   8. O PAINEL É LIDO DE UMA VEZ. Uma ida à página traz nome,
 *      telefone, endereço, nota e links juntos — antes eram umas
 *      vinte idas e voltas por negócio.
 *
 * ─────────────────────────────────────────────────────────────────
 * O QUE CONTINUA LENTO DE PROPÓSITO
 * ─────────────────────────────────────────────────────────────────
 * A pausa entre cartões. Vários caçadores disparando sem respiro é o
 * padrão que faz o Google mostrar "não sou um robô" — e aí a
 * velocidade vira zero. A pausa é o que mantém a busca de pé.
 *
 * Se o Google pedir verificação, TODOS os caçadores param. Nada de
 * resolver captcha, nada de esconder que é automação, nada de rodar
 * escondido.
 *
 * O RISCO, ESCRITO: ler o Maps por automação é contra os termos do
 * Google e o risco é da sua conta. Foi escolha sua, e fica aqui para
 * não virar surpresa.
 */
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { texto } from './comum.mjs';
import { categoriaValida, tipoPeloNome } from './roteiro.mjs';

const ONDE = {
  lista: ['div[role="feed"]', 'div[aria-label^="Resultados"]', 'div[aria-label^="Results"]'],
  cartao: ['a.hfpxzc', 'div[role="feed"] a[href*="/maps/place/"]'],
  nome: ['h1.DUwDvf', 'h1[class*="fontHeadline"]', 'div[role="main"] h1'],
  site: ['a[data-item-id="authority"]', 'a[aria-label^="Site"]', 'a[aria-label^="Website"]'],
  // O botão "Site" que aparece no próprio cartão da lista. Se o Google
  // mudar isto e nada for achado, cada cartão é aberto como antes —
  // fica mais lento, nunca errado.
  siteNaLista: ['a[data-value="Website"]', 'a[data-value="Site"]',
                'a[aria-label^="Visitar o site"]', 'a[aria-label^="Visit"]'],
  telefone: ['button[data-item-id^="phone"]', '[data-item-id^="phone:tel:"]'],
  endereco: ['button[data-item-id="address"]', '[data-item-id="address"]'],
  categoria: ['button[jsaction*="category"]', 'div.fontBodyMedium button[jsaction]'],
  nota: ['div.F7nice span[aria-hidden="true"]'],
  avaliacoes: ['div.F7nice span[aria-label*="avaliaç"]', 'div.F7nice span[aria-label*="review"]'],
  // Qualquer link para fora que esteja no painel: é daqui que sai o
  // Instagram quando o negócio não tem site próprio.
  links: ['div[role="main"] a[href^="http"]'],
  barreira: ['form[action*="consent"]', 'div[aria-label*="Antes de continuar"]',
             'text=/sistemas automatizados/i', 'text=/unusual traffic/i',
             'iframe[src*="recaptcha"]'],
};

/** De 1 a 7 caçadores. Mexer aqui muda o painel junto: o campo lê este
 *  número para montar as opções. */
export const MAX_CACADORES = 7;
export const PADRAO_CACADORES = 7;

/** O que NÃO conta como "site próprio". Um negócio cujo "site" é o
 *  Instagram ou um linktree é exatamente o cliente que procuramos —
 *  tem presença, não tem casa. */
const NAO_E_SITE = [
  'instagram.com', 'facebook.com', 'fb.com', 'wa.me', 'api.whatsapp.com',
  'linktr.ee', 'linktree.com', 'beacons.ai', 'bio.link', 'linkbio',
  'ifood.com.br', 'goo.gl', 'maps.app.goo.gl', 'business.site',
  'negocio.site', 'sites.google.com', 'wixsite.com/placeholder',
];

/** Um número de caçadores que faça sentido, venha ele de onde vier. */
const arruma = (quantos) => Math.max(1, Math.min(MAX_CACADORES,
  Math.round(Number(quantos)) || PADRAO_CACADORES));

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
const entre = (a, b) => a + Math.random() * (b - a);

async function achaAlgum(pagina, caminhos, ms = 8000) {
  const corrida = caminhos.map((a) =>
    pagina.locator(a).first().waitFor({ state: 'visible', timeout: ms }).then(() => true));
  try { return await Promise.any(corrida); } catch { return false; }
}

const limpaRotulo = (v) => texto(v, 300)
  .replace(/^(telefone|phone|endereço|address|site|website)\s*:\s*/i, '').trim();

function hostDe(url) {
  try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
}

/** O perfil do Instagram, a partir de qualquer link para lá. */
function perfilInstagram(url) {
  try {
    const u = new URL(url);
    if (!u.hostname.replace(/^www\./, '').startsWith('instagram.com')) return '';
    const parte = u.pathname.split('/').filter(Boolean)[0] || '';
    // /p/, /reel/, /explore/ são publicações, não perfis.
    if (!parte || ['p', 'reel', 'reels', 'explore', 'stories', 'tv'].includes(parte)) return '';
    return `https://instagram.com/${parte}`;
  } catch { return ''; }
}

/** Quanto este negócio interessa. Quem não tem site vale mais; quem
 *  não tem site MAS tem Instagram ativo vale ainda mais, porque já
 *  provou que se importa com aparecer — e porque o Instagram dele é a
 *  matéria-prima do site de demonstração. */
function pontua(d) {
  let p = d.site_proprio ? 0 : 5;
  if (!d.site_proprio && d.instagram) p += 3;
  if (d.whatsapp) p += 2;
  if (Number(d.avaliacoes) >= 10) p += 1;
  if (Number(d.avaliacoes) >= 60) p += 1;
  if (Number(d.nota) >= 4.2) p += 1;
  return Math.min(10, p);
}

/**
 * A MATILHA.
 *
 * `caca({ ramos, cidades, porBusca, cacadores })` monta a fila de
 * buscas (cada ramo × cada cidade) e reparte entre os caçadores.
 */
export class Matilha {
  constructor({ pasta, cacadores = PADRAO_CACADORES, aoAndar = () => {},
    aoAchar = null } = {}) {
    this.pasta = pasta;
    // Chamado a cada negócio achado, um por um, ainda durante a
    // caçada. É o que liga o Agente 1 ao Agente 2 sem esperar o fim.
    this.aoAchar = aoAchar;
    this.cacadores = arruma(cacadores);
    this.aoAndar = aoAndar;
    // Um Chrome por caçador: { contexto, pagina }, pela posição.
    this.janelas = [];
    this.parar = false;
    // Todo negócio já lido, de qualquer caçada desde que a Matilha
    // abriu: com site, sem site, repetido. É o que impede a operação
    // de reabrir os mesmos cartões a cada volta da roda de buscas.
    this.conhecidos = new Set();
    // Uma caçada por vez. Os mesmos Chromes servem o botão "Soltar a
    // matilha" e o caçador da operação; se os dois entrarem juntos,
    // um fecha os Chromes do outro no meio da leitura.
    this.ocupada = false;
  }

  /** Confere que dá para abrir Chrome (o Playwright está instalado) e que a pasta existe. */
  async _abre() {
    const { chromium } = await import('playwright');
    await mkdir(this.pasta, { recursive: true });
    return chromium;
  }

  /** O perfil do Chrome de cada caçador: cookies e sessão ficam ali entre uma vez e outra. */
  _perfilDo(indice) {
    return join(this.pasta, `cacador-${indice + 1}`);
  }

  /** Os cookies da versão anterior (um arquivo por caçador), lidos uma vez para o perfil novo. */
  _cookiesAntigosDo(indice) {
    return join(this.pasta, `cacador-${indice + 1}.json`);
  }

  /**
   * O Chrome do caçador `indice`: abre se ainda não existe, ou se você
   * fechou. É um Chrome SEPARADO (um programa, um perfil), não uma aba
   * nem uma janela dentro do Chrome dos outros.
   */
  async _janela(indice) {
    const ja = this.janelas[indice];
    if (ja && !ja.pagina.isClosed()) return ja;
    const chromium = await this._abre();
    const perfil = this._perfilDo(indice);
    const novo = !existsSync(perfil);
    // Em escada: cada janela um pouco para o lado e para baixo, para
    // dar para ver o título (e o que está fazendo) de todas.
    // (Cabe numa tela de notebook de 1366 de largura até o sétimo.)
    const x = 20 + indice * 80;
    const y = 20 + indice * 45;
    const opcoes = {
      // Visível, como sempre. Você vê cada caçador trabalhando.
      headless: false,
      args: ['--window-size=1040,780', `--window-position=${x},${y}`, '--no-first-run', '--no-default-browser-check'],
    };
    const daJanela = { viewport: { width: 1020, height: 700 }, locale: 'pt-BR' };
    let contexto;
    try {
      contexto = await chromium.launchPersistentContext(perfil, { ...opcoes, ...daJanela });
    } catch (e) {
      // O perfil está preso (um Chrome desse caçador que ficou aberto de
      // uma vez anterior, por exemplo): abre um Chrome separado sem perfil
      // guardado, em vez de deixar o caçador parado.
      const avulso = await chromium.launch(opcoes);
      contexto = await avulso.newContext(daJanela);
      contexto.on('close', () => { avulso.close().catch(() => {}); });
      this.avisoDoPerfil = `caçador ${indice + 1}: perfil em uso, abriu um Chrome sem cookies guardados (${String(e.message).slice(0, 80)})`;
    }
    // Quem já caçava na versão anterior não perde os cookies (nem a verificação já resolvida).
    const antigos = this._cookiesAntigosDo(indice);
    if (novo && existsSync(antigos)) {
      try {
        const { cookies = [] } = JSON.parse(await readFile(antigos, 'utf8'));
        if (cookies.length) await contexto.addCookies(cookies);
      } catch { /* sem os cookies antigos, começa limpo */ }
    }

    // O corte que faz a diferença: nada de imagem, fonte, vídeo ou
    // folha de estilo. O Maps continua funcionando — o texto está no
    // DOM, não nas fotos.
    await contexto.route('**/*', (rota) => {
      const tipo = rota.request().resourceType();
      if (tipo === 'image' || tipo === 'media' || tipo === 'font' || tipo === 'stylesheet') {
        return rota.abort();
      }
      return rota.continue();
    });

    // O Chrome já abre com uma aba: é nela que o caçador trabalha (nada de aba a mais).
    const pagina = contexto.pages()[0] || await contexto.newPage();
    for (const sobra of contexto.pages().filter((p) => p !== pagina)) await sobra.close().catch(() => {});
    const janela = { contexto, pagina };
    this.janelas[indice] = janela;
    // Fechou esse Chrome na mão? Só ele é esquecido: a próxima busca dele abre de novo.
    contexto.on('close', () => { if (this.janelas[indice] === janela) this.janelas[indice] = null; });
    return janela;
  }

  /** Quantas janelas de caçador estão abertas agora. */
  janelasAbertas() {
    return (this.janelas || []).filter((j) => j && !j.pagina.isClosed()).length;
  }

  /** Fecha as janelas que sobraram: escolher 3 caçadores depois de 7 não deixa 4 paradas. */
  async _fechaJanelasDepoisDe(quantas) {
    const sobrando = (this.janelas || []).slice(quantas);
    this.janelas = (this.janelas || []).slice(0, quantas);
    await Promise.all(sobrando.filter(Boolean).map((j) => j.contexto.close().catch(() => {})));
  }

  /** Ensina à matilha negócios que ela não precisa abrir de novo —
   *  os que já estão no funil, por exemplo. */
  conhece(enderecos = []) {
    for (const url of enderecos) {
      const chave = String(url || '').split('?')[0];
      if (chave) this.conhecidos.add(chave);
    }
  }

  async fecha() {
    this.parar = true;
    const abertas = (this.janelas || []).filter(Boolean);
    this.janelas = [];
    await Promise.all(abertas.map((j) => j.contexto.close().catch(() => {})));
  }

  async _print(pagina, etiqueta) {
    try {
      const destino = join(this.pasta, '..', 'falhas');
      await mkdir(destino, { recursive: true });
      await pagina.screenshot({ path: join(destino, `matilha-${etiqueta}-${Date.now()}.png`) });
    } catch { /* print é cortesia, não requisito */ }
  }

  /** Um caçador: pega busca da fila até acabar, na janela dele. */
  async _cacador(indice, fila, vistos, achados, estado) {
    const { pagina } = await this._janela(indice);
    try {
      while (fila.length && !this.parar && !estado.barreira) {
        const busca = fila.shift();
        if (!busca) break;
        estado.emAndamento[indice] = `${busca.termo} · ${busca.cidade}`;
        this.aoAndar({ ...estado, achados: achados.length });

        try {
          await this._umaBusca(pagina, busca, vistos, achados, estado);
        } catch (e) {
          estado.erros.push(`${busca.termo}/${busca.cidade}: ${e.message.slice(0, 120)}`);
          await this._print(pagina, `erro-${indice}`);
        }
      }
    } finally {
      // A janela fica aberta: a operação emenda uma caçada na outra, e
      // fechar e reabrir sete janelas a cada volta só piscaria a tela.
      estado.emAndamento[indice] = '';
    }
  }

  async _umaBusca(pagina, busca, vistos, achados, estado) {
    const { termo, cidade, porBusca } = busca;
    const alvo = `https://www.google.com/maps/search/${encodeURIComponent(`${termo} ${cidade}`)}?hl=pt-BR`;
    // `domcontentloaded` e não `networkidle`: o Maps mantém conexão
    // aberta o tempo todo e nunca fica ocioso.
    await pagina.goto(alvo, { waitUntil: 'domcontentloaded', timeout: 45_000 });

    if (await achaAlgum(pagina, ONDE.barreira, 2500)) {
      estado.barreira = true;
      await this._print(pagina, 'verificacao');
      return;
    }

    if (!await achaAlgum(pagina, ONDE.lista, 12_000)) return;

    const lista = pagina.locator(ONDE.lista[0]);
    const cartoes = pagina.locator(ONDE.cartao[0]);

    // Lê todos os cartões numa ida só: o link, o nome e, se o próprio
    // cartão já mostrar, o site.
    const leCartoes = () => cartoes.evaluateAll((nos, seletorSite) => nos.map((a, indice) => {
      const caixa = a.closest('div.Nv2PK') || a.parentElement;
      const site = caixa?.querySelector(seletorSite);
      return {
        indice,
        href: a.getAttribute('href') || '',
        rotulo: a.getAttribute('aria-label') || '',
        site: site ? site.getAttribute('href') || '' : '',
      };
    }), ONDE.siteNaLista.join(',')).catch(() => []);

    const ehNovo = (c) => {
      const chave = c.href.split('?')[0];
      return chave && !vistos.has(chave) && !this.conhecidos.has(chave);
    };
    const temSiteNaLista = (c) => {
      const host = hostDe(c.site);
      return Boolean(host) && !NAO_E_SITE.some((d) => host.includes(d));
    };

    // Rola até juntar `porBusca` negócios NOVOS e sem site — não só
    // `porBusca` cartões. Os conhecidos não contam: são justamente os
    // que a volta anterior já leu.
    let lidos = await leCartoes();
    let parado = 0;
    let fimDaLista = false;
    for (let volta = 0; volta < 40; volta += 1) {
      const candidatos = lidos.filter((c) => ehNovo(c) && !temSiteNaLista(c)).length;
      if (candidatos >= porBusca) break;
      await lista.evaluate((el) => el.scrollBy(0, el.clientHeight * 0.9)).catch(() => {});
      await dorme(entre(450, 900));
      const agora = await leCartoes();
      if (agora.length === lidos.length) {
        parado += 1;
        // Três roladas sem cartão novo: a lista acabou.
        if (parado >= 3) { fimDaLista = true; break; }
      } else parado = 0;
      lidos = agora;
    }

    // Quem mostra site no cartão sai daqui sem clique.
    const fila = [];
    for (const c of lidos) {
      if (!ehNovo(c)) { estado.pulados += 1; continue; }
      const chave = c.href.split('?')[0];
      if (temSiteNaLista(c)) {
        vistos.add(chave);
        this.conhecidos.add(chave);
        estado.descartados += 1;
        estado.lidos += 1;
        continue;
      }
      fila.push(c);
    }

    const total = Math.min(fila.length, porBusca);
    let ultimoNome = '';
    let completa = true;
    for (let i = 0; i < total; i += 1) {
      if (this.parar || estado.barreira) { completa = false; break; }
      const { indice, href, rotulo } = fila[i];
      const chave = href.split('?')[0];
      // A deduplicação é compartilhada entre todos os caçadores: duas buscas
      // vizinhas trazem os mesmos negócios, e o cliente não pode
      // aparecer duas vezes no funil.
      if (vistos.has(chave) || this.conhecidos.has(chave)) continue;
      vistos.add(chave);
      this.conhecidos.add(chave);

      try {
        await cartoes.nth(indice).click({ timeout: 8000 });
      } catch { continue; }

      // Espera o painel trocar para ESTE negócio. Esperar só "um nome
      // visível" não basta: o nome do anterior continua na tela por
      // um instante, e lia-se o telefone de um com o nome do outro.
      await pagina.waitForFunction(({ seletor, nome, anterior }) => {
        const igual = (a, b) => a && b && (a === b || a.startsWith(b) || b.startsWith(a));
        return [...document.querySelectorAll(seletor)].some((h) => {
          const t = (h.innerText || '').trim().toLowerCase();
          return t && (igual(t, nome) || (anterior && t !== anterior));
        });
      }, { seletor: ONDE.nome.join(','), nome: rotulo.trim().toLowerCase(), anterior: ultimoNome },
      { timeout: 6500 }).catch(() => {});

      const lido = await pagina.evaluate(({ onde, nome }) => {
        const titulos = [...document.querySelectorAll(onde.nome.join(','))];
        const titulo = titulos.find((h) => (h.innerText || '').trim().toLowerCase() === nome)
          || titulos[titulos.length - 1];
        const raiz = titulo?.closest('div[role="main"]') || document;
        const um = (seletores, atributo) => {
          for (const alvo of seletores) {
            const el = raiz.querySelector(alvo);
            if (!el) continue;
            const v = atributo ? el.getAttribute(atributo)
              : (el.getAttribute('aria-label') || el.innerText);
            if (v && v.trim()) return v.trim();
          }
          return '';
        };
        return {
          nome: (titulo?.innerText || '').trim(),
          site: um(onde.site, 'href'),
          telefone: um(onde.telefone),
          endereco: um(onde.endereco),
          // Todas as candidatas, não só a primeira: a primeira às vezes é o "Ver mais".
          categoria: (() => {
            for (const alvo of onde.categoria) {
              for (const el of raiz.querySelectorAll(alvo)) {
                const v = (el.innerText || '').trim();
                if (v && v.length < 60 && !/^(ver mais|ver menos|see more|mais|more)$/i.test(v)) return v;
              }
            }
            return '';
          })(),
          nota: um(onde.nota),
          avaliacoes: um(onde.avaliacoes),
          links: [...raiz.querySelectorAll('a[href^="http"]')].slice(0, 40).map((a) => a.href),
          // As fotos públicas da ficha. As imagens não são baixadas (o
          // caçador bloqueia imagem para ir rápido): só o endereço delas
          // é anotado, e quem usa é o estúdio, na demonstração.
          fotos: [...new Set([...raiz.querySelectorAll('img[src*="googleusercontent.com"], [style*="googleusercontent.com"]')]
            .map((el) => el.getAttribute('src') || (el.getAttribute('style') || '').match(/url\(["']?([^"')]+)/)?.[1] || '')
            .filter((u) => /googleusercontent\.com\/(?:p|gps-cs-s|geougc)\//.test(u)))].slice(0, 8),
          // O horário vem num aria-label do tipo "Segunda-feira, 18:00 a 23:00; ...".
          horario: [...raiz.querySelectorAll('[aria-label]')].map((el) => el.getAttribute('aria-label') || '')
            .find((t) => /(segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)[^;]{0,40}(\d{1,2}[:h]\d{2}|fechado|24 horas)/i.test(t)) || '',
        };
      }, {
        onde: { nome: ONDE.nome, site: ONDE.site, telefone: ONDE.telefone,
          endereco: ONDE.endereco, categoria: ONDE.categoria, nota: ONDE.nota,
          avaliacoes: ONDE.avaliacoes },
        nome: rotulo.trim().toLowerCase(),
      }).catch(() => null);
      if (!lido) continue;
      ultimoNome = lido.nome.toLowerCase();

      const siteBruto = texto(lido.site, 400);
      const host = hostDe(siteBruto);
      const eSiteProprio = Boolean(host) && !NAO_E_SITE.some((d) => host.includes(d));

      // O Instagram sai de dois lugares: do campo "site" quando o
      // negócio usa o perfil como site, ou de qualquer link do painel.
      let instagram = perfilInstagram(siteBruto);
      if (!instagram) {
        for (const u of lido.links) {
          const perfil = perfilInstagram(u);
          if (perfil) { instagram = perfil; break; }
        }
      }

      const telefone = limpaRotulo(lido.telefone);
      const achado = {
        fonte: 'matilha_maps',
        nome: texto(lido.nome || rotulo, 140),
        tipo: texto(categoriaValida(lido.categoria) || tipoPeloNome(lido.nome || rotulo), 60),
        cidade: texto(cidade, 120),
        endereco: texto(limpaRotulo(lido.endereco), 240),
        telefone: texto(telefone, 40),
        whatsapp: texto(telefone, 40).replace(/\D/g, ''),
        instagram,
        site: eSiteProprio ? siteBruto : '',
        site_proprio: eSiteProprio,
        // O que estava no campo "site" mas não é site: guardado, porque
        // é informação (um linktree diz muito sobre o negócio).
        link_social: eSiteProprio ? '' : texto(siteBruto, 300),
        // Tamanho bom para site: o Maps entrega miniaturas, e o tamanho
        // está escrito no fim do endereço (=w80-h106-k-no).
        fotos: (lido.fotos || []).map((u) => u.replace(/=[swh]\d+[^/]*$/, '=w1280-h960-k-no')),
        horario: texto(String(lido.horario || '').replace(/\.?\s*(Ocultar|Copiar) hor[áa]rio.*$/i, ''), 400),
        nota: Number(lido.nota.replace(',', '.')) || null,
        avaliacoes: Number(lido.avaliacoes.replace(/\D/g, '')) || null,
        maps: chave,
        achado_em: Date.now(),
      };
      achado.pontos = pontua(achado);

      // Só interessa quem NÃO tem site. Quem tem, nós anotamos e
      // seguimos — não é cliente deste serviço.
      if (!achado.site_proprio && achado.nome) {
        achados.push(achado);
        // ENTREGA NA HORA. Cada negócio sai daqui no segundo em que é
        // lido — o vendedor não espera a busca acabar.
        if (this.aoAchar) {
          try {
            await this.aoAchar(achado);
          } catch (e) {
            estado.erros.push(`entregar ${achado.nome}: ${String(e.message).slice(0, 90)}`);
          }
        }
      } else estado.descartados += 1;

      estado.lidos += 1;
      this.aoAndar({ ...estado, achados: achados.length });
      // O respiro entre cartões fica: é ele que segura o "não sou um
      // robô". Ficou menor porque agora só se abre quem vale a pena.
      await dorme(entre(500, 1100));
    }

    // A lista chegou ao fim e não sobrou ninguém novo para abrir: a
    // próxima volta nesta busca só reencontraria conhecidos.
    if (fimDaLista && completa && fila.length <= porBusca) {
      estado.esgotadas.push({ termo, cidade });
    }
  }

  /**
   * A caçada. `ramos` e `cidades` viram a fila: cada ramo em cada
   * cidade é uma busca, e os caçadores puxam dela até esvaziar.
   */
  async caca({ ramos, cidades, buscas, porBusca = 20, cacadores } = {}) {
    // O número vem a cada caçada, não só no começo: assim mudar o
    // campo no painel vale já na próxima, sem reiniciar a Matilha.
    const naMatilha = cacadores === undefined ? this.cacadores : arruma(cacadores);
    const teto = Math.max(1, Math.min(40, Number(porBusca) || 20));

    // A operação já manda as buscas montadas, várias de uma vez, para
    // cada caçador pegar uma.
    if (Array.isArray(buscas)) {
      return this._soltaMatilha(buscas
        .map((b) => ({ termo: texto(b?.termo, 60), cidade: texto(b?.cidade, 80), porBusca: teto }))
        .filter((b) => b.termo && b.cidade), naMatilha);
    }

    const listaRamos = (Array.isArray(ramos) ? ramos : String(ramos || '').split(','))
      .map((r) => texto(r, 60).trim()).filter(Boolean);
    const listaCidades = (Array.isArray(cidades) ? cidades : String(cidades || '').split(','))
      .map((c) => texto(c, 80).trim()).filter(Boolean);

    if (!listaRamos.length || !listaCidades.length) {
      throw new Error('Informe pelo menos um ramo e uma cidade.');
    }

    const fila = [];
    for (const cidade of listaCidades) {
      for (const termo of listaRamos) fila.push({ termo, cidade, porBusca: teto });
    }
    return this._soltaMatilha(fila, naMatilha);
  }

  async _soltaMatilha(fila, naMatilha) {
    if (!fila.length) throw new Error('Informe pelo menos um ramo e uma cidade.');
    if (this.ocupada) throw new Error('a matilha já está caçando agora');
    this.ocupada = true;

    this.parar = false;
    try {
      await this._abre();
      await this._fechaJanelasDepoisDe(Math.min(naMatilha, fila.length));
    } catch (e) {
      // Sem isto, um Chrome que não abriu deixava a matilha "ocupada"
      // para sempre, e toda caçada seguinte morria em "já está caçando".
      this.ocupada = false;
      throw e;
    }

    const vistos = new Set();
    const achados = [];
    const estado = {
      etapa: 'caçando',
      total: fila.length,
      lidos: 0,
      descartados: 0,
      pulados: 0,
      esgotadas: [],
      barreira: false,
      erros: [],
      emAndamento: new Array(naMatilha).fill(''),
      comecou: Date.now(),
    };

    // Mais caçadores que buscas seria abrir janela para ficar parada.
    const quantos = Math.min(naMatilha, fila.length);
    try {
      await Promise.all(
        Array.from({ length: quantos }, (_, i) => this._cacador(i, fila, vistos, achados, estado)),
      );
    } finally {
      this.ocupada = false;
    }

    estado.etapa = estado.barreira ? 'parado_verificacao' : 'pronto';
    estado.segundos = Math.round((Date.now() - estado.comecou) / 1000);
    this.aoAndar({ ...estado, achados: achados.length });

    achados.sort((a, b) => b.pontos - a.pontos);

    return {
      fonte: 'matilha_maps',
      cacadores: quantos,
      buscas: estado.total,
      lidos: estado.lidos,
      descartados_com_site: estado.descartados,
      ja_conhecidos: estado.pulados,
      esgotadas: estado.esgotadas,
      segundos: estado.segundos,
      leads: achados,
      parou: estado.barreira ? 'verificacao' : null,
      aviso: estado.barreira
        ? 'O Google pediu verificação e a caçada parou. Resolva na janela aberta e rode de novo.'
        : null,
      erros: estado.erros.slice(0, 10),
    };
  }
}
