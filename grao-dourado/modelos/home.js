/* ═══════════════════════════════════════════════════════════════
   HOME
   A ordem das seções não é de catálogo, é de decisão:
   o que é → o que tem → quanto custa → onde fica → quando abre.
   ═══════════════════════════════════════════════════════════════ */
import { MARCA, wa, horariosAgrupados } from '../conteudo/marca.js';
import { CATEGORIAS, COMBOS, destaques, porSlug, dinheiro } from '../conteudo/cardapio.js';
import { HERO, ENCOMENDAS, AGENDA, ESPACO, SOBRE, PERGUNTAS, FECHAMENTO } from '../conteudo/pagina.js';
import { pagina } from './base.js';
import { botao, cabeca, cardItem, esc, icone, seloAberto } from './ui.js';

function hero() {
  return `
<section class="hero">
  <div class="wrap hero__grade">
    <div class="hero__texto">
      <p class="hero__etiqueta">${esc(HERO.etiqueta)}</p>
      <h1 class="hero__titulo">${HERO.titulo}</h1>
      <p class="hero__sub">${esc(HERO.texto)}</p>
      <div class="hero__acoes">
        ${botao({ href: 'cardapio.html', texto: HERO.ctaPrincipal, variante: 'ouro', ico: icone.seta })}
        ${botao({ href: wa(HERO.mensagemWhats), texto: HERO.ctaSecundario, variante: 'whats', ico: icone.whats, externo: true })}
      </div>
      <div class="hero__estado">
        ${seloAberto()}
        <span class="hero__local">${icone.pino} ${esc(MARCA.endereco.linha1)} · ${esc(MARCA.endereco.linha2)}</span>
      </div>
    </div>
    <div class="hero__arte">
      <img src="img/hero.svg" alt="Xícara de café sobre grãos torrados"
           width="900" height="1100" fetchpriority="high" decoding="async">
    </div>
  </div>
</section>

<section class="promessas" aria-label="O que a casa garante">
  <div class="wrap promessas__grade">
    ${MARCA.promessas.map((p) => `<div class="promessa">
        <h2>${esc(p.titulo)}</h2><p>${esc(p.texto)}</p></div>`).join('')}
  </div>
</section>`;
}

function vitrine() {
  return `
<section class="secao" id="destaques">
  <div class="wrap">
    ${cabeca({
      etiqueta: 'O que mais sai',
      titulo: 'Se for a primeira vez, comece por aqui',
      texto: 'Os pedidos que mais se repetem no balcão. Toque em adicionar e monte o pedido sem sair da página.',
    })}
    <div class="grade-itens">
      ${destaques().map((i) => cardItem(i)).join('')}
    </div>
    <p class="secao__pe">
      ${botao({ href: 'cardapio.html', texto: 'Ver o cardápio inteiro', variante: 'linha', ico: icone.seta })}
    </p>
  </div>
</section>`;
}

function categorias() {
  return `
<section class="secao secao--escura" id="categorias">
  <div class="wrap">
    ${cabeca({ etiqueta: 'Cardápio', titulo: 'Quatro frentes, um balcão só', classe: 'cabeca--claro' })}
    <div class="cats">
      ${CATEGORIAS.map((c) => `
      <a class="cat" href="cardapio.html#${esc(c.id)}">
        <img src="img/${esc(c.arte)}" alt="" width="900" height="620" loading="lazy" decoding="async">
        <span class="cat__sobre">
          <strong>${esc(c.nome)}</strong>
          <small>${esc(c.resumo)}</small>
        </span>
      </a>`).join('')}
    </div>
  </div>
</section>`;
}

function combos() {
  return `
<section class="secao" id="combos">
  <div class="wrap">
    ${cabeca({
      etiqueta: 'Combinações',
      titulo: 'Café com alguma coisa, que é como se faz',
      texto: 'Sai mais em conta do que pedir separado.',
    })}
    <div class="combos">
      ${COMBOS.map((c) => {
        const cheio = c.itens.reduce((s, slug) => s + (porSlug(slug)?.preco || 0), 0);
        const poupa = cheio - c.preco;
        return `<article class="combo">
          <img src="img/${esc(c.arte)}" alt="" width="900" height="560" loading="lazy" decoding="async">
          <div class="combo__corpo">
            <h3>${esc(c.nome)}</h3>
            <p>${esc(c.desc)}</p>
            <div class="combo__pe">
              <span class="combo__preco">${dinheiro(c.preco)}</span>
              ${poupa > 0 ? `<span class="combo__poupa">economiza ${dinheiro(poupa)}</span>` : ''}
            </div>
            <button type="button" class="btn btn--linha btn--sm" data-add-combo="${esc(c.slug)}">
              ${icone.mais}Adicionar
            </button>
          </div>
        </article>`;
      }).join('')}
    </div>
  </div>
</section>`;
}

function encomendas() {
  return `
<section class="secao secao--creme" id="encomendas">
  <div class="wrap">
    ${cabeca({ etiqueta: ENCOMENDAS.etiqueta, titulo: ENCOMENDAS.titulo, texto: ENCOMENDAS.texto })}
    <div class="pacotes">
      ${ENCOMENDAS.pacotes.map((p) => `
      <article class="pacote">
        <img src="img/${esc(p.arte)}" alt="" width="860" height="620" loading="lazy" decoding="async">
        <div class="pacote__corpo">
          <h3>${esc(p.nome)}</h3>
          <p class="pacote__desc">${esc(p.desc)}</p>
          <p class="pacote__detalhe">${esc(p.detalhe)}</p>
          <p class="pacote__preco">${p.preco ? `a partir de <strong>${dinheiro(p.preco)}</strong>` : '<strong>Sob consulta</strong>'}</p>
          ${botao({
            href: wa(`${ENCOMENDAS.mensagemWhats}\n\nPacote: ${p.nome}`),
            texto: 'Pedir orçamento',
            variante: 'linha',
            ico: icone.whats,
            externo: true,
            classe: 'btn--sm',
          })}
        </div>
      </article>`).join('')}
    </div>
    <p class="secao__aviso">Encomenda com 48 horas de antecedência. Valores de demonstração — confirme com a casa.</p>
  </div>
</section>`;
}

function agenda() {
  return `
<section class="secao secao--escura" id="agenda">
  <div class="wrap">
    ${cabeca({ etiqueta: AGENDA.etiqueta, titulo: AGENDA.titulo, texto: AGENDA.texto, classe: 'cabeca--claro' })}
    <div class="eventos">
      ${AGENDA.eventos.map((e) => `
      <article class="evento">
        <img src="img/${esc(e.arte)}" alt="" width="860" height="560" loading="lazy" decoding="async">
        <div class="evento__corpo">
          <p class="evento__quando">${icone.relogio} ${esc(e.quando)} · ${esc(e.hora)}</p>
          <h3>${esc(e.nome)}</h3>
          <p class="evento__artista">${esc(e.artista)}</p>
          <p class="evento__chamada">${esc(e.chamada)}</p>
          <span class="evento__entrada">${esc(e.entrada)}</span>
        </div>
      </article>`).join('')}
    </div>
    <p class="secao__pe secao__pe--claro">
      ${esc(AGENDA.rodape)}
      <a class="link-claro" href="https://instagram.com/${MARCA.instagram}"
         target="_blank" rel="noopener noreferrer">@${esc(MARCA.instagram)}</a>
    </p>
  </div>
</section>`;
}

function espaco() {
  return `
<section class="secao" id="espaco">
  <div class="wrap">
    ${cabeca({ etiqueta: ESPACO.etiqueta, titulo: ESPACO.titulo, texto: ESPACO.texto })}
    <div class="galeria">
      ${ESPACO.galeria.map((g) => `
        <img src="img/${esc(g.arte)}" alt="${esc(g.alt)}" width="900" height="680"
             loading="lazy" decoding="async">`).join('')}
    </div>
    <div class="confortos">
      ${ESPACO.itens.map((i) => `<div class="conforto">
        <h3>${esc(i.titulo)}</h3><p>${esc(i.texto)}</p></div>`).join('')}
    </div>
  </div>
</section>`;
}

function sobre() {
  return `
<section class="secao secao--creme" id="sobre">
  <div class="wrap sobre">
    <div class="sobre__arte">
      <img src="img/${esc(SOBRE.arte)}" alt="Balcão do café com a xícara e os grãos"
           width="1000" height="760" loading="lazy" decoding="async">
    </div>
    <div class="sobre__texto">
      ${cabeca({ etiqueta: SOBRE.etiqueta, titulo: SOBRE.titulo })}
      ${SOBRE.paragrafos.map((p) => `<p>${esc(p)}</p>`).join('')}
      <p class="sobre__assina">${esc(SOBRE.assinatura)}</p>
    </div>
  </div>
</section>`;
}

function chegar() {
  const horas = horariosAgrupados()
    .map((h) => `<div class="hr__linha${h.fechado ? ' hr__linha--off' : ''}" data-dias="${h.ns.join(',')}">
        <span>${esc(h.dias)}</span><span>${esc(h.horas)}</span></div>`)
    .join('');

  return `
<section class="secao" id="chegar">
  <div class="wrap">
    ${cabeca({ etiqueta: 'Como chegar', titulo: 'A gente fica dentro do lounge da Evidance' })}
    <div class="chegar">
      <a class="chegar__mapa" href="${esc(MARCA.endereco.mapa)}" target="_blank" rel="noopener noreferrer">
        <img src="img/mapa.svg" alt="Mapa aproximado da localização" width="900" height="520"
             loading="lazy" decoding="async">
        <span class="chegar__abrir">Abrir no mapa</span>
      </a>
      <div class="chegar__dados">
        <div class="chegar__bloco">
          <h3>${icone.pino} Endereço</h3>
          <p>${esc(MARCA.endereco.linha1)}<br>${esc(MARCA.endereco.linha2)}</p>
          <p class="chegar__ref">${esc(MARCA.endereco.referencia)}</p>
          <p class="chegar__ref">${esc(MARCA.endereco.estacionamento)}</p>
        </div>
        <div class="chegar__bloco">
          <h3>${icone.relogio} Horário</h3>
          <div class="hr">${horas}</div>
          ${seloAberto()}
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function perguntas() {
  return `
<section class="secao secao--creme" id="perguntas">
  <div class="wrap wrap--estreito">
    ${cabeca({ etiqueta: PERGUNTAS.etiqueta, titulo: PERGUNTAS.titulo })}
    <div class="sanfona">
      ${PERGUNTAS.lista.map((q, i) => `
      <div class="sanfona__item">
        <h3>
          <button type="button" class="sanfona__botao" aria-expanded="false" aria-controls="r${i}">
            <span>${esc(q.p)}</span>
            <span class="sanfona__sinal" aria-hidden="true"></span>
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
    ${botao({
      href: wa(FECHAMENTO.mensagemWhats),
      texto: FECHAMENTO.cta,
      variante: 'whats',
      ico: icone.whats,
      externo: true,
      classe: 'btn--lg',
    })}
    <p class="fecha__num">${esc(MARCA.whatsappVisivel)}</p>
  </div>
</section>`;
}

export function paginaHome() {
  return pagina({
    titulo: `${MARCA.nomeCompleto} · Café, salgado e bolo em Natal`,
    descricao:
      'Café feito na hora, empada que sai do forno e bolo de receita de família, no lounge da Evidance, em Natal. Veja o cardápio com preço e peça pelo WhatsApp.',
    atual: 'index.html',
    classe: 'p-home',
    corpo: [hero(), vitrine(), categorias(), combos(), encomendas(), agenda(),
            espaco(), sobre(), chegar(), perguntas(), fechamento()].join('\n'),
  });
}
