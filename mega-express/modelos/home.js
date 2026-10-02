/* ═══════════════════════════════════════════════════════════════
   HOME
   A ordem segue a decisão de quem chega:
   onde estou → qual unidade → como é o quarto → o que tem perto
   → quem já ficou → reservo.
   ═══════════════════════════════════════════════════════════════ */
import { MARCA, UNIDADES, COMODIDADES, wa } from '../conteudo/marca.js';
import { REGIAO, ATRACOES } from '../conteudo/regiao.js';
import { destacadas } from '../conteudo/avaliacoes.js';
import {
  HERO, ESCOLHA, RESERVA, ESTRUTURA, QUARTOS, AVALIACOES_SECAO, PERGUNTAS, FECHAMENTO,
} from '../conteudo/pagina.js';
import { pagina, faixaGolpe } from './base.js';
import { botao, cabeca, cardAvaliacao, esc, icone, imagem, listaComodidades } from './ui.js';

function hero() {
  return `
<section class="hero">
  <div class="hero__fundo" aria-hidden="true">
    ${imagem(HERO, { alt: '', lazy: false })}
  </div>
  <div class="wrap hero__corpo">
    <p class="hero__etiqueta">${icone.pino} ${esc(HERO.etiqueta)}</p>
    <h1 class="hero__titulo">${HERO.titulo}</h1>
    <p class="hero__sub">${esc(HERO.texto)}</p>
    <div class="hero__acoes">
      ${botao({ href: '#unidades', texto: HERO.ctaPrincipal, variante: 'vermelho', ico: icone.seta })}
      ${botao({ href: '#reservar', texto: HERO.ctaSecundario, variante: 'claro' })}
    </div>
  </div>
</section>`;
}

/* A seção que escolhe a unidade. É o coração do site: quem chega
   não quer "o hotel", quer saber em qual das duas ficar. */
function unidades() {
  return `
<section class="secao" id="unidades">
  <div class="wrap">
    ${cabeca({ etiqueta: ESCOLHA.etiqueta, titulo: ESCOLHA.titulo, texto: ESCOLHA.texto })}
    <div class="duas">
      ${UNIDADES.map((u) => `
      <article class="uni">
        <a class="uni__foto" href="unidade/${esc(u.slug)}.html"
           aria-label="Ver o ${esc(u.nome)}">
          ${imagem(u, { alt: `Fachada e área do ${u.nome}` })}
          <span class="uni__tarja">${esc(u.apelido)}</span>
        </a>
        <div class="uni__corpo">
          <h3>${esc(u.nome)}</h3>
          <p class="uni__chamada">${esc(u.chamada)}</p>
          <p class="uni__resumo">${esc(u.resumo)}</p>
          <ul class="uni__pontos">
            ${u.destaques.map((d) => `<li><b>${esc(d.titulo)}</b><small>${esc(d.texto)}</small></li>`).join('')}
          </ul>
          <p class="uni__paraquem">${esc(u.paraQuem)}</p>
          <div class="uni__acoes">
            ${botao({ href: `unidade/${u.slug}.html`, texto: 'Ver a unidade', variante: 'linha' })}
            ${botao({
              href: wa(u.telefone, `Oi! Vim pelo site e queria reservar no ${u.nome}.`),
              texto: u.telefoneVisivel, variante: 'whats', ico: icone.whats, externo: true,
            })}
          </div>
        </div>
      </article>`).join('')}
    </div>

    <!-- A diferença que mais gera reclamação quando não é dita
         antes: só a unidade II serve café da manhã. -->
    <p class="secao__aviso">
      Atenção a uma diferença: o <b>café da manhã é servido na unidade II</b>.
      A unidade I não serve — mas fica numa praça cheia de opções, a poucos passos.
    </p>
  </div>
</section>`;
}

function estrutura() {
  const comuns = ['estacionamento', 'wifi', 'ar', 'frigobar', 'tv'];
  return `
<section class="secao secao--clara" id="estrutura">
  <div class="wrap">
    ${cabeca({ etiqueta: ESTRUTURA.etiqueta, titulo: ESTRUTURA.titulo, texto: ESTRUTURA.texto })}
    ${listaComodidades(comuns)}
    <div class="so-na">
      ${UNIDADES.filter((u) => u.cafeDaManha || u.piscina).map((u) => `
        <div class="so-na__item">
          <span class="so-na__sel">Só no ${esc(u.nome)}</span>
          ${listaComodidades(u.comodidades.filter((c) => ['cafe', 'piscina'].includes(c)), { compacta: true })}
        </div>`).join('')}
      <div class="so-na__item">
        <span class="so-na__sel">Só no Mega Express I</span>
        ${listaComodidades(['varanda'], { compacta: true })}
      </div>
    </div>
  </div>
</section>`;
}

function quartos() {
  return `
<section class="secao" id="quartos">
  <div class="wrap">
    ${cabeca({ etiqueta: QUARTOS.etiqueta, titulo: QUARTOS.titulo, texto: QUARTOS.texto })}
    <div class="galeria">
      ${QUARTOS.galeria.map((g) => imagem(g, { alt: g.alt })).join('')}
    </div>
  </div>
</section>`;
}

function regiao() {
  return `
<section class="secao secao--escura" id="regiao">
  <div class="wrap regiao">
    <div class="regiao__texto">
      ${cabeca({ etiqueta: REGIAO.etiqueta, titulo: REGIAO.titulo, texto: REGIAO.texto, classe: 'cabeca--claro' })}
      ${botao({ href: 'serra-da-capivara.html', texto: 'O que fazer na região', variante: 'claro', ico: icone.seta })}
    </div>
    <div class="regiao__cartoes">
      ${ATRACOES.slice(0, 3).map((a) => `
      <article class="atracao atracao--mini">
        ${imagem(a, { alt: a.nome })}
        <div class="atracao__corpo">
          <h3>${esc(a.nome)}</h3>
          <p>${esc(a.detalhe)}</p>
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>`;
}

function avaliacoes() {
  const nomeDe = (slug) => UNIDADES.find((u) => u.slug === slug)?.nome || '';
  return `
<section class="secao secao--clara" id="avaliacoes">
  <div class="wrap">
    ${cabeca({
      etiqueta: AVALIACOES_SECAO.etiqueta,
      titulo: AVALIACOES_SECAO.titulo,
      texto: AVALIACOES_SECAO.texto,
    })}
    <div class="avals">
      ${destacadas().map((a) => cardAvaliacao(a, { unidadeNome: nomeDe(a.unidade) })).join('')}
    </div>
    <p class="secao__pe">
      ${botao({ href: 'index.html#reservar', texto: 'Reservar a minha', variante: 'vermelho', ico: icone.seta })}
    </p>
  </div>
</section>`;
}

/* ── Reserva ────────────────────────────────────────────────────
   Sem motor de reservas e sem pagamento: o formulário monta a
   mensagem e abre o WhatsApp DA UNIDADE escolhida. Mandar para a
   central errada é o jeito mais rápido de perder a reserva. */
function reservar() {
  return `
<section class="secao" id="reservar">
  <div class="wrap wrap--estreito">
    ${cabeca({ etiqueta: RESERVA.etiqueta, titulo: RESERVA.titulo, texto: RESERVA.texto })}
    <form class="reserva" data-reserva novalidate>
      <fieldset class="reserva__unidade">
        <legend>Unidade</legend>
        ${UNIDADES.map((u, i) => `
        <label class="opcao">
          <input type="radio" name="unidade" value="${esc(u.slug)}"${i === 0 ? ' checked' : ''}>
          <span class="opcao__corpo">
            <b>${esc(u.nome)}</b>
            <small>${esc(u.chamada)}</small>
          </span>
        </label>`).join('')}
      </fieldset>

      <div class="reserva__linha">
        <label class="campo">
          <span>Entrada</span>
          <input type="date" name="entrada" required>
        </label>
        <label class="campo">
          <span>Saída</span>
          <input type="date" name="saida" required>
        </label>
      </div>

      <div class="reserva__linha">
        <label class="campo">
          <span>Adultos</span>
          <input type="number" name="adultos" min="1" max="12" value="2" inputmode="numeric">
        </label>
        <label class="campo">
          <span>Crianças</span>
          <input type="number" name="criancas" min="0" max="12" value="0" inputmode="numeric">
        </label>
      </div>

      <label class="campo">
        <span>Alguma observação <small>(opcional)</small></span>
        <textarea name="obs" rows="2" placeholder="Quarto com varanda, chegada tarde, guia para o parque…"></textarea>
      </label>

      <p class="reserva__resumo" data-resumo aria-live="polite"></p>
      <p class="reserva__erro" data-erro role="alert" hidden></p>

      <button type="submit" class="btn btn--whats btn--lg btn--bloco">
        ${icone.whats}Enviar pelo WhatsApp
      </button>
      <p class="reserva__nota">${esc(RESERVA.nota)}</p>
    </form>
  </div>
</section>`;
}

function perguntas() {
  return `
<section class="secao secao--clara" id="perguntas">
  <div class="wrap wrap--estreito">
    ${cabeca({ etiqueta: PERGUNTAS.etiqueta, titulo: PERGUNTAS.titulo })}
    <div class="sanfona">
      ${PERGUNTAS.lista.map((q, i) => `
      <div class="sanfona__item">
        <h3>
          <button type="button" class="sanfona__botao" aria-expanded="false" aria-controls="r${i}">
            <span>${esc(q.p)}</span><span class="sanfona__sinal" aria-hidden="true"></span>
          </button>
        </h3>
        <div class="sanfona__resposta" id="r${i}" hidden><p>${esc(q.r)}</p></div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
}

function fechamento() {
  return `
<section class="fecha">
  <div class="wrap fecha__corpo">
    <h2>${esc(FECHAMENTO.titulo)}</h2>
    <p>${esc(FECHAMENTO.texto)}</p>
    <div class="fecha__botoes">
      ${UNIDADES.map((u) => botao({
        href: wa(u.telefone, `Oi! Vim pelo site e queria reservar no ${u.nome}.`),
        texto: `${u.nome} · ${u.telefoneVisivel}`,
        variante: 'whats', ico: icone.whats, externo: true,
      })).join('')}
    </div>
  </div>
</section>`;
}

export function paginaHome() {
  return pagina({
    titulo: `${MARCA.nome} · Hotel em São Raimundo Nonato, Serra da Capivara`,
    descricao:
      'Duas unidades em São Raimundo Nonato (PI): uma no centro, outra no acesso ao Parque Nacional Serra da Capivara, com piscina e café da manhã. Reserve pelo WhatsApp.',
    atual: 'index.html',
    classe: 'p-home',
    corpo: [hero(), unidades(), estrutura(), quartos(), regiao(),
            avaliacoes(), reservar(), perguntas(), faixaGolpe(), fechamento()].join('\n'),
  });
}
