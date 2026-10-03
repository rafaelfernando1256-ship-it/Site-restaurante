/* ------------------------------------------------------------------
   OS OITO AGENTES

   Cada um é independente: tem a sua tela, as suas ações e o seu pedaço
   do estado. Nenhum chama o outro — eles se falam pelo lead, que vai
   mudando de etapa. É a mesma ideia do funil em Python: o que liga os
   agentes é o estado compartilhado, não uma cadeia de funções.
   ------------------------------------------------------------------ */

import * as N from './nucleo.js';
import * as IA from './ia.js';
import { montaPix, prova as provaPix } from './pix.js';
import { area, aviso, campo, copia, el, esc, espera, numero, on, recado,
         carregaScript } from './ui.js';

const QRLIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
const ZIPLIB = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';

const E = N.estado;

/* ====== 1. CAÇADOR ================================================ */
const cacador = {
  passo: 1, id: 'cacador', nome: 'Caçador', resumo: 'acha quem precisa',
  conta: () => E.leads.filter(l => l.etapa === 'novo').length,
  render(raiz) {
    const novos = E.leads.filter(l => l.etapa === 'novo');
    raiz.innerHTML = `
      <div class="cabeca">
        <h1>1 · Caçador</h1>
        <p>Restaurante com Instagram ativo e sem site é o seu cliente. Ele já
        tem foto e público; só não tem onde cair quem procura no Google.</p>
      </div>

      <div class="cartao">
        <h3>Colar uma lista</h3>
        <p class="ajuda">Uma linha por restaurante:
        <code>Nome, telefone, @instagram, cidade</code>. Serve o que sai de
        planilha, do funil ou do bloco de notas.</p>
        ${area('', 'colar', '', 'Pizzaria do Marcos, 84 98888-7777, @pizzariadomarcos, Natal')}
        <div class="linha-bt">
          <button class="bt" data-fazer="importar">Importar</button>
          <button class="bt fraco" data-fazer="um">Adicionar um só</button>
        </div>
      </div>

      <div class="cartao">
        <h3>Buscar sozinho, no computador</h3>
        <p class="ajuda">O navegador não pode chamar a API do Google Places
        (a chave ficaria exposta). Quem faz isso é o funil, na sua máquina —
        e o resultado você cola aqui em cima.</p>
        <pre class="mono">cd funil
python funil.py cacar --cidade "${esc(E.negocio.cidade || 'Natal, RN')}"
python funil.py revisar</pre>
        <div class="linha-bt">
          <button class="bt fraco" data-fazer="copiar-comando">Copiar comando</button>
        </div>
      </div>

      <div class="cartao">
        <h3>Na fila <span class="nota">${novos.length}</span></h3>
        <div id="lista">${novos.length ? novos.map(cartaoLead).join('')
          : '<p class="vazio">Nenhum lead novo. Cole uma lista aí em cima.</p>'}</div>
      </div>`;

    on(raiz, '[data-fazer="importar"]', 'click', () => {
      const t = raiz.querySelector('[name=colar]').value;
      const n = N.importaLinhas(t);
      if (!n) return recado('não achei nenhuma linha válida', 'ruim');
      raiz.querySelector('[name=colar]').value = '';
      recado(`${n} lead${n > 1 ? 's' : ''} na fila`);
      this.render(raiz);
    });
    on(raiz, '[data-fazer="um"]', 'click', () => {
      const nome = prompt('Nome do restaurante:');
      if (!nome) return;
      E.leads.unshift(N.novoLead({ nome }));
      N.salva(); this.render(raiz);
    });
    on(raiz, '[data-fazer="copiar-comando"]', 'click', () =>
      copia(`python funil.py cacar --cidade "${E.negocio.cidade || 'Natal, RN'}"`,
            'comando copiado'));
    ligaLead(raiz, () => this.render(raiz));
  },
};

/* ====== 2. ABORDAGEM ============================================== */
const abordagem = {
  passo: 2, id: 'abordagem', nome: 'Abordagem', resumo: 'fala com o dono',
  conta: () => E.leads.filter(l => ['novo', 'abordado'].includes(l.etapa)).length,
  render(raiz) {
    const fila = E.leads.filter(l => ['novo', 'abordado'].includes(l.etapa));
    raiz.innerHTML = `
      <div class="cabeca">
        <h1>2 · Abordagem</h1>
        <p>A primeira frase decide se ele lê o resto. Use o dado real da casa
        dele — avaliações, nota, o link do Google que leva para o Instagram.</p>
      </div>
      ${IA.temChave(E) ? '' : aviso(
        `Sem a chave do ${IA.nomeDoProvedor(E)} em <b>Ajustes</b> eu uso um ` +
        'modelo pronto, igual para todo mundo. Com a chave, cada mensagem sai ' +
        'feita para aquela casa — e é isso que faz diferença na resposta.', 'ruim')}
      <div id="lista">${fila.length ? fila.map(cartaoAbordagem).join('')
        : '<p class="vazio">Ninguém na fila. Volte ao Caçador.</p>'}</div>`;

    on(raiz, '[data-escrever]', 'click', async (e, b) => {
      const l = N.achaLead(b.dataset.escrever);
      const solta = espera(b, 'escrevendo...');
      try {
        l.mensagem = await escreveAbordagem(l);
        N.salva(); this.render(raiz);
        recado('mensagem pronta — leia antes de mandar');
      } catch (err) {
        recado(String(err.message || err), 'ruim');
        solta();
      }
    });
    on(raiz, '[data-mandar]', 'click', (e, b) => {
      const l = N.achaLead(b.dataset.mandar);
      const texto = raiz.querySelector(`[data-msg="${l.id}"]`)?.value || l.mensagem;
      l.mensagem = texto; N.salva();
      window.open(N.linkWhats(l.telefone, texto), '_blank', 'noopener');
      N.moveLead(l.id, 'abordado');
      setTimeout(() => this.render(raiz), 400);
    });
    on(raiz, '[data-msg]', 'input', (e, t) => {
      const l = N.achaLead(t.dataset.msg);
      if (l) { l.mensagem = t.value; N.salva(); }
    });
    ligaLead(raiz, () => this.render(raiz));
  },
};

async function escreveAbordagem(l) {
  const presenca = {
    so_rede: `o "site" dele no Google é o Instagram (@${l.instagram || '?'}) — ` +
             'quem busca no Google não acha onde ver cardápio',
    so_delivery: 'o "site" dele no Google é um app de delivery, onde ele paga comissão',
    sem_presenca: 'não existe nenhum link de site no Google dele',
    tem_site: 'ele já tem site',
  }[l.presenca] || '';

  if (!IA.temChave(E)) {
    return `Oi! Vi a ${l.nome} aqui no Google` +
      (l.avaliacoes ? ` — ${l.avaliacoes} avaliações, isso é bastante gente` : '') +
      `. Reparei que ${presenca}. Posso montar um exemplo de site de vocês, ` +
      'de graça, só para você ver como ficaria no celular? Se não gostar, ' +
      'tudo bem, não custa nada.';
  }

  const instrucao = `Você escreve a primeira mensagem de WhatsApp de um desenvolvedor \
brasileiro que faz site para restaurante. Ele manda na mão, uma por vez.

NÃO PODE: começar com "Olá, tudo bem? Me chamo"; prometer número que não dá \
para provar; pressa falsa; elogio genérico; emoji.

TEM QUE: dizer em uma frase o que você viu de específico na casa dele, usando \
o dado real; oferecer MONTAR um exemplo de graça, sem compromisso; terminar com \
uma pergunta curta de sim ou não. No máximo 4 linhas, português do Brasil falado.

O site ainda NÃO existe — ele é montado depois que a pessoa aceitar. Nunca \
escreva "montei", "já está pronto" ou "te mando o link": escreva no futuro.

Responda só com a mensagem, sem aspas e sem explicação.`;

  const dados = `Restaurante: ${l.nome}
Cidade: ${l.cidade || E.negocio.cidade}
${l.categoria ? 'Tipo: ' + l.categoria : ''}
${l.avaliacoes ? `Avaliações no Google: ${l.avaliacoes}` : ''}${l.nota ? ` · nota ${l.nota}` : ''}
Situação: ${presenca}
${l.instagram ? 'Instagram: @' + l.instagram : ''}`;

  return (await IA.pedeTextoCom(E, instrucao, dados, { maxTokens: 900 }))
    .replace(/^["'\s]+|["'\s]+$/g, '');
}

/* ====== 3. DEMONSTRAÇÃO =========================================== */
const demonstracao = {
  passo: 3, id: 'demo', nome: 'Demonstração', resumo: 'mostra antes de cobrar',
  conta: () => E.leads.filter(l => ['respondeu', 'demo'].includes(l.etapa)).length,
  render(raiz) {
    const fila = E.leads.filter(l => ['abordado', 'respondeu', 'demo'].includes(l.etapa));
    raiz.innerHTML = `
      <div class="cabeca">
        <h1>3 · Demonstração</h1>
        <p>O site pronto antes de falar de preço. É o que nenhum concorrente
        faz, e é o que transforma "quanto custa?" em "quando fica pronto?".</p>
      </div>
      ${IA.temChave(E) ? '' : aviso('Para gerar o site preciso da chave do ' +
        `${IA.nomeDoProvedor(E)} em <b>Ajustes</b>.`, 'ruim')}
      <div id="lista">${fila.length ? fila.map(cartaoDemo).join('')
        : '<p class="vazio">Ninguém esperando demonstração.</p>'}</div>`;

    on(raiz, '[data-gerar]', 'click', async (e, b) => {
      const l = N.achaLead(b.dataset.gerar);
      const bruto = raiz.querySelector(`[data-sobre="${l.id}"]`)?.value || '';
      const solta = espera(b, 'montando o site...');
      try {
        l.demoHtml = await geraSite(l, bruto);
        l.sobre = bruto;
        if (l.etapa === 'abordado' || l.etapa === 'respondeu') l.etapa = 'demo';
        N.salva(); this.render(raiz);
        recado('site pronto — veja antes de mandar');
      } catch (err) {
        recado(String(err.message || err), 'ruim');
        solta();
      }
    });
    on(raiz, '[data-ver]', 'click', (e, b) => {
      const l = N.achaLead(b.dataset.ver);
      const w = window.open('', '_blank');
      if (!w) return recado('o navegador bloqueou a janela', 'ruim');
      w.document.write(l.demoHtml); w.document.close();
    });
    on(raiz, '[data-baixar]', 'click', (e, b) => baixaSite(N.achaLead(b.dataset.baixar)));
    on(raiz, '[data-sobre]', 'input', (e, t) => {
      const l = N.achaLead(t.dataset.sobre);
      if (l) { l.sobre = t.value; N.salva(); }
    });
    on(raiz, '[data-url]', 'change', (e, t) => {
      const l = N.achaLead(t.dataset.url);
      if (l) { l.demoUrl = t.value.trim(); N.salva(); }
    });
    on(raiz, '[data-mandar-demo]', 'click', (e, b) => {
      const l = N.achaLead(b.dataset.mandarDemo);
      if (!l.demoUrl) return recado('publique primeiro e cole o link aqui', 'ruim');
      const texto = `Ficou pronto, dá uma olhada: ${l.demoUrl}\n\n` +
        'É um exemplo, feito com as fotos do Instagram de vocês. ' +
        'O que você mudaria primeiro?';
      window.open(N.linkWhats(l.telefone, texto), '_blank', 'noopener');
      N.moveLead(l.id, 'demo');
    });
    ligaLead(raiz, () => this.render(raiz));
  },
};

const INSTRUCAO_SITE = `Você escreve o HTML completo de um site de uma página para \
um restaurante.

FORMATO: só o HTML. Comece com <!doctype html> e termine com </html>. Sem crase, \
sem \`\`\`html, sem explicação. CSS dentro de <style>, JS dentro de <script> se \
precisar. Arquivo único, sem imagem externa.

NÃO PODE: inventar preço, horário, endereço, avaliação, nota, prêmio ou tempo de \
casa. Use só o que eu der. O que faltar vira um lugar visível escrito "a combinar" \
ou "confirmar". Nada de depoimento, nada de estrelas, nada de banco de imagem.

TEM QUE TER: <meta name="robots" content="noindex,nofollow">; uma faixa discreta \
no topo dizendo que é um exemplo e não o site oficial; um botão grande de WhatsApp \
apontando para https://wa.me/NUMERO com mensagem de pedido pronta; funcionar em \
celular de 360px sem rolagem lateral; contraste alto.

COMO PARECER: tipografia grande, muito espaço, poucas cores, nada de animação \
além de transições curtas. A primeira tela diz o que é, onde fica, e tem o botão \
de pedido. Use emoji grande ou formas em CSS no lugar de fotos — não existem \
imagens disponíveis.`;

async function geraSite(l, sobre) {
  const dados = `NOME: ${l.nome}
CIDADE: ${l.cidade || E.negocio.cidade}
WHATSAPP (para o wa.me): ${N.e164(l.telefone) || 'NÃO INFORMADO'}
INSTAGRAM: ${l.instagram ? '@' + l.instagram : 'não informado'}
TIPO: ${l.categoria || 'restaurante'}

O QUE A CASA VENDE (escrito pelo dono do negócio ou tirado do Instagram):
${sobre || '(não informado — monte um site genérico de restaurante e deixe tudo marcado como "a combinar")'}

NÃO INVENTE preço, horário nem endereço que não estejam aí em cima.`;
  const bruto = await IA.pedeTextoCom(E, INSTRUCAO_SITE, dados,
                                      { maxTokens: 32000 });
  return limpaHtml(bruto);
}

export function limpaHtml(bruto) {
  let t = String(bruto || '').trim();
  t = t.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
  const i = t.toLowerCase().indexOf('<!doctype');
  const j = i === -1 ? t.toLowerCase().indexOf('<html') : i;
  if (j > 0) t = t.slice(j);
  const f = t.toLowerCase().lastIndexOf('</html>');
  if (f !== -1) t = t.slice(0, f + 7);
  return t.trim();
}

export function validaHtml(html) {
  const b = String(html || '').toLowerCase();
  const p = [];
  if (!b.startsWith('<!doctype') && !b.startsWith('<html')) p.push('não é uma página completa');
  if (!b.includes('</html>')) p.push('resposta cortada no meio');
  if (!b.includes('noindex')) p.push('falta o noindex');
  if (!b.includes('wa.me/')) p.push('falta o botão de WhatsApp');
  if (html.length < 1500) p.push('página curta demais');
  return p;
}

async function baixaSite(l) {
  if (!l?.demoHtml) return recado('gere o site primeiro', 'ruim');
  const nome = (l.nome || 'site').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site';
  const ok = await carregaScript(ZIPLIB);
  if (!ok || !window.JSZip) {
    N.baixa(`${nome}.html`, l.demoHtml, 'text/html');
    return recado('baixei o .html — arraste ele mesmo no Netlify Drop');
  }
  const zip = new window.JSZip();
  zip.file('index.html', l.demoHtml);
  zip.file('robots.txt', 'User-agent: *\nDisallow: /\n');
  const blob = await zip.generateAsync({ type: 'blob' });
  N.baixa(`${nome}.zip`, blob);
  recado('zip pronto — arraste em app.netlify.com/drop');
}

/* ====== 4. PREÇO ================================================== */
const preco = {
  passo: 4, id: 'preco', nome: 'Preço', resumo: 'responde "quanto custa?"',
  conta: () => E.leads.filter(l => l.etapa === 'proposta').length,
  render(raiz) {
    const p = E.precos;
    const sugerido = Math.round((p.custoHora * p.horasEstimadas * p.margem) / 50) * 50;
    raiz.innerHTML = `
      <div class="cabeca">
        <h1>4 · Preço</h1>
        <p>A pergunta vem logo depois de "gostei". Se você gaguejar aqui,
        perde — e o silêncio de dois dias para "pensar num valor" mata mais
        venda que preço alto.</p>
      </div>

      <div class="cartao">
        <h3>De onde sai o número</h3>
        <p class="ajuda">Preço não é chute nem é o que o concorrente cobra: é o
        seu custo por hora vezes as horas, com margem. A margem paga o que você
        não cobra — a conversa, a proposta, o cliente que some.</p>
        <div class="grade g3">
          ${campo('Seu custo por hora (R$)', 'custoHora', p.custoHora, { tipo: 'number' })}
          ${campo('Horas por site', 'horasEstimadas', p.horasEstimadas, { tipo: 'number' })}
          ${campo('Margem (2 = dobro)', 'margem', p.margem, { tipo: 'number', passo: '0.1' })}
        </div>
        ${aviso(`Isso dá <b>${esc(N.moeda(sugerido))}</b> de montagem.
          ${sugerido < 500 ? 'Está baixo para o mercado — repare que preço baixo também ' +
            'atrai o cliente que mais dá trabalho.' : ''}`)}
      </div>

      <div class="cartao">
        <h3>O que você vende</h3>
        <div class="grade g3">
          ${campo('Montagem (R$)', 'montagem', p.montagem, { tipo: 'number' })}
          ${campo('Mensalidade (R$)', 'mensalidade', p.mensalidade, { tipo: 'number' })}
          ${campo('Prazo (dias úteis)', 'prazoDias', p.prazoDias, { tipo: 'number' })}
          ${campo('Páginas inclusas', 'paginas', p.paginas, { tipo: 'number' })}
          ${campo('Alterações inclusas', 'alteracoesInclusas', p.alteracoesInclusas, { tipo: 'number' })}
        </div>
        <p class="ajuda" style="margin-top:12px">A mensalidade é o que separa dez
        trabalhos avulsos de um salário: ${esc(N.moeda(p.mensalidade))} × 10 clientes =
        <b>${esc(N.moeda(p.mensalidade * 10))} todo mês</b>, por trocar foto e
        atualizar cardápio.</p>
      </div>

      <div class="cartao">
        <h3>A resposta pronta</h3>
        <p class="ajuda">Decore esta. Quando ele perguntar o preço, você
        responde em 10 segundos.</p>
        <pre class="mono" id="resposta">${esc(respostaPreco())}</pre>
        <div class="linha-bt">
          <button class="bt" data-fazer="copiar">Copiar</button>
          ${IA.temChave(E) ? '<button class="bt fraco" data-fazer="melhorar">Reescrever com a IA</button>' : ''}
        </div>
      </div>`;

    on(raiz, 'input', 'input', (e, i) => {
      if (!(i.name in p)) return;
      p[i.name] = Number(i.value) || 0;
      N.salva();
      raiz.querySelector('#resposta').textContent = respostaPreco();
    });
    on(raiz, '[data-fazer="copiar"]', 'click', () => copia(respostaPreco()));
    on(raiz, '[data-fazer="melhorar"]', 'click', async (e, b) => {
      const solta = espera(b, 'escrevendo...');
      try {
        const t = await IA.pedeTextoCom(E,
          'Reescreva esta resposta de preço para WhatsApp: curta, direta, ' +
          'sem jargão de vendas, sem emoji, no máximo 5 linhas, português do ' +
          'Brasil falado. Mantenha TODOS os números exatamente como estão. ' +
          'Responda só com o texto.', respostaPreco(), { maxTokens: 700 });
        raiz.querySelector('#resposta').textContent = t.trim();
      } catch (err) { recado(String(err.message || err), 'ruim'); }
      solta();
    });
  },
};

function respostaPreco() {
  const p = E.precos;
  return `Fica ${N.moeda(p.montagem)} para montar, e ${N.moeda(p.mensalidade)} por mês \
depois — nessa mensalidade entra a hospedagem, o domínio e as alterações do dia a dia \
(trocar foto, mudar cardápio, horário de feriado).

Fica pronto em ${p.prazoDias} dias úteis. ${p.alteracoesInclusas} rodadas de ajuste \
inclusas.

Se fizer sentido, eu já começo hoje.`;
}

/* ====== 5. RECEBER ================================================ */
const receber = {
  passo: 5, id: 'receber', nome: 'Receber', resumo: 'Pix e cobrança',
  conta: () => E.cobrancas.filter(c => !c.pago).length,
  render(raiz) {
    const n = E.negocio;
    const pendentes = E.cobrancas.filter(c => !c.pago);
    const pagas = E.cobrancas.filter(c => c.pago);
    const recebido = pagas.reduce((s, c) => s + Number(c.valor || 0), 0);
    const aReceber = pendentes.reduce((s, c) => s + Number(c.valor || 0), 0);

    raiz.innerHTML = `
      <div class="cabeca">
        <h1>5 · Receber</h1>
        <p>Pix copia-e-cola gerado aqui, no seu navegador. O código segue o
        padrão do Banco Central e é conferido na abertura do painel.</p>
      </div>

      <div class="numeros" style="margin-bottom:14px">
        ${numero(N.moeda(recebido), 'recebido')}
        ${numero(N.moeda(aReceber), 'a receber')}
        ${numero(pendentes.length, 'cobranças abertas')}
      </div>

      ${n.pixChave ? '' : aviso('Preencha a sua chave Pix em <b>Ajustes</b> ' +
        'para gerar cobrança.', 'ruim')}

      <div class="cartao">
        <h3>Nova cobrança</h3>
        <div class="grade g3">
          <div>
            <label for="c-quem">Cliente</label>
            <select id="c-quem" name="quem">
              <option value="">— escolha ou deixe em branco —</option>
              ${E.leads.map(l => `<option value="${esc(l.id)}">${esc(l.nome)}</option>`).join('')}
            </select>
          </div>
          ${campo('Valor (R$)', 'valor', E.precos.montagem, { tipo: 'number', passo: '0.01' })}
          ${campo('Do que é', 'descricao', 'Montagem do site')}
        </div>
        <div class="linha-bt">
          <button class="bt" data-fazer="gerar">Gerar Pix</button>
        </div>
        <div id="saida"></div>
        <!-- o último Pix continua na tela depois do redesenho -->
      </div>

      <div class="cartao">
        <h3>Cobranças</h3>
        ${E.cobrancas.length ? `<table><thead><tr>
            <th>Quando</th><th>Cliente</th><th>Do que</th>
            <th class="num">Valor</th><th></th></tr></thead><tbody>
          ${E.cobrancas.slice().reverse().map(c => `<tr>
            <td>${esc(N.dataBonita(c.data))}</td>
            <td>${esc(c.cliente || '—')}</td>
            <td>${esc(c.descricao || '—')}</td>
            <td class="num">${esc(N.moeda(c.valor))}</td>
            <td style="text-align:right">
              ${c.pago ? '<span class="etiqueta verde">pago</span>'
                : `<button class="bt fraco" data-pagar="${esc(c.id)}"
                     style="padding:4px 10px;min-height:0">marcar pago</button>`}
              <button class="bt perigo" data-apagar="${esc(c.id)}"
                      style="padding:4px 10px;min-height:0">×</button>
            </td></tr>`).join('')}
          </tbody></table>` : '<p class="vazio">Nenhuma cobrança ainda.</p>'}
      </div>`;

    if (this.ultimoPix) {
      mostraPix(raiz.querySelector('#saida'), this.ultimoPix.codigo,
                this.ultimoPix.valor, this.ultimoPix.lead);
    }

    on(raiz, '[data-fazer="gerar"]', 'click', () => {
      const valor = Number(raiz.querySelector('[name=valor]').value) || 0;
      const descricao = raiz.querySelector('[name=descricao]').value.trim();
      const idLead = raiz.querySelector('[name=quem]').value;
      const lead = idLead ? N.achaLead(idLead) : null;
      try {
        const codigo = montaPix({
          chave: n.pixChave,
          nome: n.pixNome || n.nome,
          cidade: n.pixCidade || n.cidade,
          valor, descricao,
          txid: 'P' + Date.now().toString(36).toUpperCase(),
        });
        E.cobrancas.push({
          id: 'c' + Date.now().toString(36), data: N.hoje(), valor,
          descricao, cliente: lead?.nome || '', leadId: idLead || '',
          codigo, pago: false,
        });
        if (lead && lead.etapa === 'demo') N.moveLead(lead.id, 'proposta');
        N.salva();
        this.ultimoPix = { codigo, valor, lead };
        this.render(raiz);          // a tabela e os números têm que acompanhar
        recado('cobrança criada');
      } catch (err) {
        recado(String(err.message || err), 'ruim');
      }
    });
    on(raiz, '[data-pagar]', 'click', (e, b) => {
      const c = E.cobrancas.find(x => x.id === b.dataset.pagar);
      if (!c) return;
      c.pago = true; c.pagoEm = N.hoje();
      const l = c.leadId ? N.achaLead(c.leadId) : null;
      if (l && ['proposta', 'demo', 'respondeu'].includes(l.etapa)) l.etapa = 'fechado';
      N.salva(); this.render(raiz);
      recado('pago — bom trabalho');
    });
    on(raiz, '[data-apagar]', 'click', (e, b) => {
      E.cobrancas = E.cobrancas.filter(x => x.id !== b.dataset.apagar);
      N.salva(); this.render(raiz);
    });
  },
};

async function mostraPix(caixa, codigo, valor, lead) {
  caixa.innerHTML = `
    <div style="display:grid;grid-template-columns:auto 1fr;gap:16px;
                align-items:start;margin-top:16px">
      <div id="qr" style="background:#fff;padding:10px;border-radius:8px;
           width:188px;height:188px;display:grid;place-items:center">
        <span style="color:#666;font-size:.75rem">gerando…</span></div>
      <div>
        <p style="margin:0 0 6px"><b>${esc(N.moeda(valor))}</b>
          ${lead ? '· ' + esc(lead.nome) : ''}</p>
        <pre class="mono" style="max-height:120px;overflow:auto">${esc(codigo)}</pre>
        <div class="linha-bt">
          <button class="bt" data-fazer="copiar-pix">Copiar código</button>
          ${lead?.telefone ? `<button class="bt fraco" data-fazer="mandar-pix">Mandar no WhatsApp</button>` : ''}
        </div>
      </div>
    </div>`;

  caixa.querySelector('[data-fazer="copiar-pix"]')
    .addEventListener('click', () => copia(codigo, 'código Pix copiado'));
  caixa.querySelector('[data-fazer="mandar-pix"]')?.addEventListener('click', () => {
    const texto = `Segue o Pix de ${N.moeda(valor)}:\n\n${codigo}\n\n` +
      'É só copiar esse código e colar no app do banco, em "Pix copia e cola".';
    window.open(N.linkWhats(lead.telefone, texto), '_blank', 'noopener');
  });

  const ok = await carregaScript(QRLIB);
  const alvo = caixa.querySelector('#qr');
  if (ok && window.QRCode && alvo) {
    alvo.innerHTML = '';
    new window.QRCode(alvo, { text: codigo, width: 168, height: 168,
                              correctLevel: window.QRCode.CorrectLevel.M });
  } else if (alvo) {
    alvo.innerHTML = '<span style="color:#666;font-size:.75rem;text-align:center">' +
                     'sem internet para<br>desenhar o QR —<br>use o copia e cola</span>';
  }
}

/* ====== 6. ENTREGAR =============================================== */
const entregar = {
  passo: 6, id: 'entregar', nome: 'Entregar', resumo: 'põe no ar',
  conta: () => E.leads.filter(l => l.etapa === 'fechado').length,
  render(raiz) {
    const fila = E.leads.filter(l => ['fechado', 'entregue'].includes(l.etapa));
    raiz.innerHTML = `
      <div class="cabeca">
        <h1>6 · Entregar</h1>
        <p>O que ele comprou não é o arquivo: é o site no ar, com o nome dele,
        achável no Google.</p>
      </div>
      ${aviso('<b>Registre o domínio no CNPJ ou CPF do cliente</b>, não no seu. ' +
        'Domínio no seu nome vira refém — e no dia em que ele quiser trocar de ' +
        'fornecedor, vira briga que você perde mesmo ganhando.')}
      <div id="lista">${fila.length ? fila.map(cartaoEntrega).join('')
        : '<p class="vazio">Nenhum cliente fechado ainda.</p>'}</div>`;

    on(raiz, '[data-marcar]', 'change', (e, c) => {
      const l = N.achaLead(c.dataset.marcar);
      l.entrega = l.entrega || {};
      l.entrega[c.value] = c.checked;
      const tudo = PASSOS_ENTREGA.every(([k]) => l.entrega[k]);
      if (tudo && l.etapa === 'fechado') l.etapa = 'entregue';
      N.salva();
      if (tudo) { recado('entregue! agora peça a indicação'); this.render(raiz); }
    });
    on(raiz, '[data-contrato]', 'click', (e, b) => contrato(N.achaLead(b.dataset.contrato)));
  },
};

const PASSOS_ENTREGA = [
  ['dominio', 'Domínio registrado no nome do cliente (registro.br, ~R$ 40/ano)'],
  ['conteudo', 'Conteúdo real: fotos boas, cardápio atual, horário, endereço'],
  ['publicado', 'Site publicado e abrindo no celular'],
  ['dns', 'Domínio apontando para o site'],
  ['google', 'Google Meu Negócio com o site preenchido'],
  ['whats', 'Botão de WhatsApp testado, abrindo no número certo'],
  ['contrato', 'Contrato assinado (uma página basta)'],
  ['pago', 'Pagamento da montagem recebido'],
];

function cartaoEntrega(l) {
  const e = l.entrega || {};
  const feitos = PASSOS_ENTREGA.filter(([k]) => e[k]).length;
  return `<div class="lead">
    <div class="lead-topo">
      <div><div class="lead-nome">${esc(l.nome)}</div>
        <div class="lead-meta">${feitos} de ${PASSOS_ENTREGA.length} prontos</div></div>
      ${l.etapa === 'entregue' ? '<span class="etiqueta verde">no ar</span>' : ''}
    </div>
    <div style="margin-top:10px;display:grid;gap:7px">
      ${PASSOS_ENTREGA.map(([k, t]) => `<label style="display:flex;gap:9px;
        align-items:flex-start;color:var(--texto);font-size:.875rem;cursor:pointer">
        <input type="checkbox" data-marcar="${esc(l.id)}" value="${k}"
               ${e[k] ? 'checked' : ''} style="width:auto;margin-top:3px">
        <span>${esc(t)}</span></label>`).join('')}
    </div>
    <div class="linha-bt">
      <button class="bt fraco" data-contrato="${esc(l.id)}">Gerar contrato</button>
    </div>
  </div>`;
}

function contrato(l) {
  const n = E.negocio, p = E.precos;
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Contrato — ${esc(l.nome)}</title>
<style>
  body{font:12pt/1.6 Georgia,serif;max-width:17cm;margin:2cm auto;padding:0 1cm;color:#111}
  h1{font-size:15pt;margin:0 0 4pt} h2{font-size:11pt;margin:16pt 0 4pt}
  .cab{border-bottom:2px solid #111;padding-bottom:8pt;margin-bottom:14pt}
  .meta{color:#555;font-size:10pt}
  ul{margin:4pt 0;padding-left:18pt} li{margin:2pt 0}
  .assina{margin-top:40pt;display:flex;gap:30pt}
  .assina div{flex:1;border-top:1px solid #111;padding-top:5pt;font-size:10pt}
  @media print{body{margin:0}}
</style></head><body>
<div class="cab">
  <h1>Contrato de criação de site</h1>
  <p class="meta">${esc(n.nome || 'Prestador')}${n.cnpj ? ' · ' + esc(n.cnpj) : ''}
     &nbsp;•&nbsp; ${esc(N.dataBonita(N.hoje()))}</p>
</div>
<h2>1. Partes</h2>
<p><b>Prestador:</b> ${esc(n.nome || '—')}${n.cnpj ? ', CNPJ ' + esc(n.cnpj) : ''}.<br>
<b>Contratante:</b> ${esc(l.nome)}${l.cidade ? ', ' + esc(l.cidade) : ''}.</p>

<h2>2. O que está incluso</h2>
<ul>
  <li>Site de ${p.paginas} página${p.paginas > 1 ? 's' : ''}, funcionando em celular e computador.</li>
  <li>Botão de contato por WhatsApp.</li>
  <li>Publicação e configuração do domínio.</li>
  <li>${p.alteracoesInclusas} rodada${p.alteracoesInclusas > 1 ? 's' : ''} de ajustes
      após a entrega.</li>
</ul>

<h2>3. O que não está incluso</h2>
<ul>
  <li>Produção de fotos e textos — o conteúdo é fornecido pelo contratante.</li>
  <li>Loja virtual, sistema de pedidos ou pagamento online.</li>
  <li>Anúncios pagos e gestão de redes sociais.</li>
  <li>Alterações além das rodadas inclusas, cobradas à parte e combinadas antes.</li>
</ul>

<h2>4. Valores e prazo</h2>
<p>Montagem: <b>${esc(N.moeda(l.valor || p.montagem))}</b>, pagos na contratação.<br>
Mensalidade: <b>${esc(N.moeda(p.mensalidade))}</b>, cobrindo hospedagem, domínio e
alterações do dia a dia.<br>
Prazo de entrega: <b>${p.prazoDias} dias úteis</b> contados da entrega do conteúdo
pelo contratante.</p>

<h2>5. Domínio</h2>
<p>O domínio é registrado em nome do <b>contratante</b>, que permanece seu titular.</p>

<h2>6. Encerramento</h2>
<p>Qualquer das partes pode encerrar a mensalidade com 30 dias de aviso. Encerrada,
o site deixa de ser hospedado e atualizado; os arquivos são entregues ao contratante.</p>

<div class="assina">
  <div>${esc(n.nome || 'Prestador')}</div>
  <div>${esc(l.nome)}</div>
</div>
</body></html>`;
  const w = window.open('', '_blank');
  if (!w) return recado('o navegador bloqueou a janela', 'ruim');
  w.document.write(html); w.document.close();
  setTimeout(() => w.print(), 600);
}

/* ====== 7. MANTER ================================================= */
const manter = {
  passo: 7, id: 'manter', nome: 'Manter', resumo: 'a mensalidade',
  conta: () => E.leads.filter(l => l.etapa === 'entregue').length,
  render(raiz) {
    const clientes = E.leads.filter(l => l.etapa === 'entregue');
    const mrr = clientes.length * E.precos.mensalidade;
    raiz.innerHTML = `
      <div class="cabeca">
        <h1>7 · Manter</h1>
        <p>Cinco minutos de trabalho por mês, por cliente. É aqui que mora a
        diferença entre vender site e ter uma empresa.</p>
      </div>
      <div class="numeros" style="margin-bottom:14px">
        ${numero(clientes.length, 'clientes no ar')}
        ${numero(N.moeda(mrr), 'por mês')}
        ${numero(N.moeda(mrr * 12), 'por ano')}
      </div>
      <div class="cartao">
        <h3>Cobrança do mês</h3>
        <p class="ajuda">Gera um Pix para cada cliente ativo, de uma vez.</p>
        <div class="linha-bt">
          <button class="bt" data-fazer="mensalidades"
            ${clientes.length ? '' : 'disabled'}>Gerar ${clientes.length} cobranças</button>
        </div>
      </div>
      <div class="cartao">
        <h3>Clientes ativos</h3>
        ${clientes.length ? clientes.map(l => `<div class="lead">
          <div class="lead-topo">
            <div><div class="lead-nome">${esc(l.nome)}</div>
              <div class="lead-meta">${esc(l.demoUrl || 'sem link anotado')}</div></div>
            <span class="nota">${esc(N.moeda(E.precos.mensalidade))}/mês</span>
          </div>
          <div class="linha-bt">
            ${l.telefone ? `<button class="bt fraco" data-aviso="${esc(l.id)}">
              Avisar de atualização</button>` : ''}
          </div></div>`).join('')
          : '<p class="vazio">Nenhum site entregue ainda.</p>'}
      </div>`;

    on(raiz, '[data-fazer="mensalidades"]', 'click', () => {
      if (!E.negocio.pixChave) return recado('falta a chave Pix em Ajustes', 'ruim');
      let feitas = 0;
      for (const l of clientes) {
        try {
          const codigo = montaPix({
            chave: E.negocio.pixChave,
            nome: E.negocio.pixNome || E.negocio.nome,
            cidade: E.negocio.pixCidade || E.negocio.cidade,
            valor: E.precos.mensalidade,
            descricao: 'Mensalidade do site',
            txid: 'M' + Date.now().toString(36).toUpperCase() + feitas,
          });
          E.cobrancas.push({
            id: 'c' + Date.now().toString(36) + feitas, data: N.hoje(),
            valor: E.precos.mensalidade, descricao: 'Mensalidade',
            cliente: l.nome, leadId: l.id, codigo, pago: false,
          });
          feitas++;
        } catch (err) { recado(String(err.message || err), 'ruim'); break; }
      }
      N.salva();
      if (feitas) recado(`${feitas} cobranças criadas — veja em Receber`);
    });
    on(raiz, '[data-aviso]', 'click', (e, b) => {
      const l = N.achaLead(b.dataset.aviso);
      window.open(N.linkWhats(l.telefone,
        `Oi! Tudo certo com o site de vocês?\n\nSe tiver foto nova, mudança no ` +
        'cardápio ou horário diferente para algum feriado, me manda que eu ' +
        'atualizo hoje mesmo.'), '_blank', 'noopener');
    });
  },
};

/* ====== 8. CRESCER ================================================ */
const crescer = {
  passo: 8, id: 'crescer', nome: 'Crescer', resumo: 'indicação e números',
  conta: () => 0,
  render(raiz) {
    const t = E.leads.length;
    const por = k => E.leads.filter(l => l.etapa === k).length;
    const fechados = por('fechado') + por('entregue');
    const taxa = t ? Math.round((fechados / t) * 100) : 0;
    const prontos = E.leads.filter(l => l.etapa === 'entregue');
    raiz.innerHTML = `
      <div class="cabeca">
        <h1>8 · Crescer</h1>
        <p>Dono de restaurante conhece dono de restaurante. Peça a indicação no
        dia da entrega, enquanto ele está feliz com o site novo — uma semana
        depois o entusiasmo já passou.</p>
      </div>

      <div class="numeros" style="margin-bottom:14px">
        ${numero(t, 'leads')}
        ${numero(fechados, 'fechados')}
        ${numero(taxa + '%', 'conversão')}
        ${numero(N.moeda(E.cobrancas.filter(c => c.pago)
          .reduce((s, c) => s + Number(c.valor || 0), 0)), 'recebido')}
      </div>

      <div class="cartao">
        <h3>O funil inteiro</h3>
        <table><tbody>
          ${N.ETAPAS.map(([k, rotulo]) => {
            const n = por(k);
            const larg = t ? Math.round((n / t) * 100) : 0;
            return `<tr><td style="width:150px">${esc(rotulo)}</td>
              <td><div style="background:var(--acento);height:9px;border-radius:5px;
                   width:${larg}%;min-width:${n ? '6px' : '0'}"></div></td>
              <td class="num" style="width:50px">${n}</td></tr>`;
          }).join('')}
        </tbody></table>
      </div>

      <div class="cartao">
        <h3>Pedir indicação</h3>
        ${prontos.length ? prontos.map(l => `<div class="lead">
          <div class="lead-topo"><div class="lead-nome">${esc(l.nome)}</div></div>
          <div class="linha-bt">
            <button class="bt" data-indicar="${esc(l.id)}">Pedir no WhatsApp</button>
          </div></div>`).join('')
          : '<p class="vazio">Entregue um site primeiro.</p>'}
      </div>`;

    on(raiz, '[data-indicar]', 'click', (e, b) => {
      const l = N.achaLead(b.dataset.indicar);
      window.open(N.linkWhats(l.telefone,
        `Que bom que você gostou do site!\n\nUma ajuda: você conhece outro dono ` +
        'de restaurante que ainda não tem site? Se puder passar meu contato, ' +
        'eu agradeço muito — é assim que meu trabalho anda.'), '_blank', 'noopener');
    });
  },
};

/* ====== Ajustes =================================================== */
const ajustes = {
  passo: 0, id: 'ajustes', nome: 'Ajustes', resumo: 'seus dados',
  conta: () => 0,
  render(raiz) {
    const n = E.negocio;
    const prov = E.chaves.provedor || '';
    raiz.innerHTML = `
      <div class="cabeca"><h1>Ajustes</h1>
        <p>Tudo fica guardado só neste navegador. Exporte de vez em quando.</p></div>

      <div class="cartao">
        <h3>Você</h3>
        <div class="grade g2">
          ${campo('Seu nome ou da empresa', 'nome', n.nome, { dica: 'Rafael Fernando' })}
          ${campo('Sua cidade', 'cidade', n.cidade, { dica: 'Natal, RN' })}
          ${campo('Seu WhatsApp', 'whatsapp', n.whatsapp, { dica: '84 98888-7777' })}
          ${campo('CNPJ (opcional)', 'cnpj', n.cnpj)}
        </div>
      </div>

      <div class="cartao">
        <h3>Pix</h3>
        <p class="ajuda">Nome e cidade vão impressos no app do cliente. O padrão
        do Banco Central corta em 25 e 15 caracteres.</p>
        <div class="grade g2">
          ${campo('Chave Pix', 'pixChave', n.pixChave, { dica: 'e-mail, telefone ou aleatória' })}
          ${campo('Nome que aparece (até 25)', 'pixNome', n.pixNome, { dica: n.nome || 'Rafael Fernando' })}
          ${campo('Cidade (até 15)', 'pixCidade', n.pixCidade, { dica: 'NATAL' })}
        </div>
      </div>

      <div class="cartao">
        <h3>A inteligência</h3>
        <p class="ajuda">Sem chave o painel funciona, mas as mensagens e os
        sites saem de modelo pronto em vez de feitos para cada casa.</p>
        <div style="margin-bottom:12px">
          <label for="c-provedor">Quem escreve</label>
          <select id="c-provedor" name="provedor">
            <option value="">— o que tiver chave —</option>
            <option value="openrouter" ${prov === 'openrouter' ? 'selected' : ''}>
              OpenRouter (uma chave, vários modelos)</option>
            <option value="gemini" ${prov === 'gemini' ? 'selected' : ''}>
              Gemini (Google)</option>
            <option value="groq" ${prov === 'groq' ? 'selected' : ''}>
              Groq (grátis, sem cartão, muito rápido)</option>
          </select>
        </div>
        <div class="grade g2">
          ${campo('Chave do OpenRouter', 'openrouter', E.chaves.openrouter || '',
                  { tipo: 'password', dica: 'sk-or-v1-...' })}
          ${campo('Chave do Gemini', 'gemini', E.chaves.gemini, { tipo: 'password' })}
          ${campo('Chave do Groq', 'groq', E.chaves.groq || '',
                  { tipo: 'password', dica: 'gsk_...' })}
        </div>
        <div class="grade g2">
          ${campo('Modelo do OpenRouter (vazio = ele escolhe)', 'modeloRota',
                  E.chaves.modeloRota || '', { dica: 'anthropic/claude-sonnet-4.5' })}
          ${campo('Modelo do Groq (vazio = ele escolhe)', 'modeloGroq',
                  E.chaves.modeloGroq || '',
                  { dica: 'moonshotai/kimi-k2-instruct-0905' })}
        </div>
        <p class="ajuda" style="margin-top:10px">
          OpenRouter: <a href="https://openrouter.ai/keys" target="_blank"
          rel="noopener">openrouter.ai/keys</a> — uma chave só alcança Claude,
          Gemini e GPT, e tem modelos grátis.<br>
          Gemini: <a href="https://aistudio.google.com/apikey" target="_blank"
          rel="noopener">aistudio.google.com/apikey</a> — grátis, sem cartão.<br>
          Groq: <a href="https://console.groq.com/keys" target="_blank"
          rel="noopener">console.groq.com/keys</a> — grátis, sem cartão, e o
          mais rápido. Em troca: 30 pedidos por minuto e 1.000 por dia.
        </p>
        <p class="ajuda">As chaves ficam só neste navegador — não estão no
        código do site, e quem abrir o link não vê.</p>
      </div>

      <div class="cartao">
        <h3>Seus dados</h3>
        <div class="linha-bt">
          <button class="bt fraco" data-fazer="exportar">Exportar backup</button>
          <button class="bt fraco" data-fazer="importar">Importar backup</button>
          <button class="bt perigo" data-fazer="limpar">Apagar tudo</button>
        </div>
        <input type="file" accept="application/json" id="arquivo" style="display:none">
      </div>`;

    on(raiz, 'input', 'input', (e, i) => {
      if (['gemini', 'openrouter', 'groq', 'modeloRota', 'modeloGroq']
          .includes(i.name)) {
        E.chaves[i.name] = i.value.trim(); N.salva(); return;
      }
      if (i.name in n) { n[i.name] = i.value; N.salva(); }
    });
    on(raiz, 'select[name=provedor]', 'change', (e, sel) => {
      E.chaves.provedor = sel.value;
      N.salva();
      const nomes = { openrouter: 'OpenRouter', gemini: 'Gemini', groq: 'Groq' };
      recado(sel.value ? `agora quem escreve é o ${nomes[sel.value] || sel.value}`
                       : 'vale a chave que existir');
    });
    on(raiz, '[data-fazer="exportar"]', 'click', () => { N.exporta(); recado('backup baixado'); });
    on(raiz, '[data-fazer="importar"]', 'click', () => raiz.querySelector('#arquivo').click());
    raiz.querySelector('#arquivo').addEventListener('change', async e => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        N.importa(await f.text());
        recado('backup carregado');
        location.reload();
      } catch (err) { recado(String(err.message || err), 'ruim'); }
    });
    on(raiz, '[data-fazer="limpar"]', 'click', () => {
      if (!confirm('Apagar TODOS os leads, cobranças e ajustes deste navegador?')) return;
      if (!confirm('Tem certeza? Isso não tem desfazer.')) return;
      localStorage.removeItem('painel-vendas-v1');
      location.reload();
    });
  },
};

/* ====== peças compartilhadas ====================================== */
function cartaoLead(l) {
  return `<div class="lead" data-lead="${esc(l.id)}">
    <div class="lead-topo">
      <div>
        <div class="lead-nome">${esc(l.nome)}</div>
        <div class="lead-meta">
          ${esc(l.cidade || '')}${l.telefone ? ' · ' + esc(N.telefoneBonito(l.telefone)) : ' · sem telefone'}
          ${l.instagram ? ' · @' + esc(l.instagram) : ''}
        </div>
      </div>
      <div style="text-align:right">
        <span class="etiqueta ${l.presenca === 'so_rede' ? 'verde' : ''}">${esc(N.PRESENCA[l.presenca] || l.presenca)}</span>
        <div class="nota">${l.pontuacao}/10</div>
      </div>
    </div>
    <div class="grade g3" style="margin-top:10px">
      ${campoLead(l, 'nome', 'Nome')}
      ${campoLead(l, 'telefone', 'WhatsApp')}
      ${campoLead(l, 'instagram', 'Instagram')}
    </div>
    <div class="linha-bt">
      <button class="bt fraco" data-apagar-lead="${esc(l.id)}"
              style="padding:5px 12px;min-height:0">remover</button>
    </div>
  </div>`;
}

function campoLead(l, nome, rotulo) {
  return `<div><label>${esc(rotulo)}</label>
    <input data-campo="${esc(l.id)}" name="${nome}" value="${esc(l[nome] ?? '')}"></div>`;
}

function cartaoAbordagem(l) {
  return `<div class="lead">
    <div class="lead-topo">
      <div><div class="lead-nome">${esc(l.nome)}</div>
        <div class="lead-meta">${esc(N.telefoneBonito(l.telefone) || 'sem telefone')}
          ${l.instagram ? ' · @' + esc(l.instagram) : ''}</div></div>
      <span class="etiqueta ${l.etapa === 'abordado' ? 'verde' : ''}">
        ${l.etapa === 'abordado' ? 'já mandei' : 'na fila'}</span>
    </div>
    <div style="margin-top:10px">
      <label>Mensagem</label>
      <textarea data-msg="${esc(l.id)}"
        placeholder="Clique em Escrever para o agente montar">${esc(l.mensagem || '')}</textarea>
    </div>
    <div class="linha-bt">
      <button class="bt fraco" data-escrever="${esc(l.id)}">Escrever</button>
      <button class="bt" data-mandar="${esc(l.id)}"
        ${l.telefone ? '' : 'disabled title="falta o telefone"'}>Abrir no WhatsApp</button>
    </div>
  </div>`;
}

function cartaoDemo(l) {
  const problemas = l.demoHtml ? validaHtml(l.demoHtml) : [];
  return `<div class="lead">
    <div class="lead-topo">
      <div><div class="lead-nome">${esc(l.nome)}</div>
        <div class="lead-meta">${l.demoHtml ? 'site gerado' : 'sem site ainda'}</div></div>
      ${l.demoUrl ? '<span class="etiqueta verde">publicado</span>' : ''}
    </div>
    <div style="margin-top:10px">
      <label>O que a casa vende (cole aqui a bio e o cardápio do Instagram)</label>
      <textarea data-sobre="${esc(l.id)}" placeholder="Pizza em forno a lenha, massa de fermentação natural. Também fazem calzone. Abrem de terça a domingo à noite.">${esc(l.sobre || '')}</textarea>
    </div>
    ${problemas.length ? aviso('A página saiu com problema: ' +
       esc(problemas.join('; ')) + '. Gere de novo.', 'ruim') : ''}
    <div class="linha-bt">
      <button class="bt fraco" data-gerar="${esc(l.id)}">
        ${l.demoHtml ? 'Gerar de novo' : 'Gerar site'}</button>
      ${l.demoHtml ? `<button class="bt fraco" data-ver="${esc(l.id)}">Ver</button>
        <button class="bt" data-baixar="${esc(l.id)}">Baixar .zip</button>` : ''}
    </div>
    ${l.demoHtml ? `<div style="margin-top:12px">
      <label>Link depois de publicar (arraste o zip em
        <a href="https://app.netlify.com/drop" target="_blank" rel="noopener">app.netlify.com/drop</a>)</label>
      <input data-url="${esc(l.id)}" value="${esc(l.demoUrl || '')}"
             placeholder="https://algo.netlify.app">
      <div class="linha-bt">
        <button class="bt" data-mandar-demo="${esc(l.id)}">Mandar o link</button>
      </div></div>` : ''}
  </div>`;
}

function ligaLead(raiz, redesenha) {
  on(raiz, '[data-campo]', 'input', (e, i) => {
    const l = N.achaLead(i.dataset.campo);
    if (!l) return;
    if (i.name === 'telefone') l.telefone = N.e164(i.value);
    else if (i.name === 'instagram') {
      l.instagram = i.value.replace(/^@/, '').trim();
      l.url = l.instagram ? `https://instagram.com/${l.instagram}` : '';
      l.presenca = N.classifica(l.url);
    } else l[i.name] = i.value;
    l.pontuacao = N.pontua(l);
    N.salva();
  });
  on(raiz, '[data-apagar-lead]', 'click', (e, b) => {
    const l = N.achaLead(b.dataset.apagarLead);
    if (!confirm(`Remover ${l?.nome}?`)) return;
    N.estado.leads = E.leads.filter(x => x.id !== b.dataset.apagarLead);
    E.leads = N.estado.leads;
    N.salva(); redesenha();
  });
}

export const AGENTES = [cacador, abordagem, demonstracao, preco, receber,
                        entregar, manter, crescer];
export const AJUSTES = ajustes;
export { provaPix };
