/** VOLT — montagem da home. */
import { MARCA, HERO, SECOES, FAQ, AVALIACOES, INSTAGRAM, ORDENACOES,
         AVISO_DEMO, linkWhats, CONSULTA_GERAL } from '../conteudo/site.js';
import { CATEGORIAS, PRODUTOS, comTag, nomeCategoria } from '../conteudo/produtos.js';
import { esc, atraso, botao, cabeca, secao, cartao, trilho, sanfona,
         sanfona as _s, estrelas, ICO } from './ui.js';
import { pagina, jsonLdMarca } from './base.js';

/* ── 01 · Hero ────────────────────────────────────────────── */
const hero = () => `<section class="hero" aria-label="Apresentação">
  <div class="wrap hero__grade">
    <div class="hero__texto">
      <p class="rotulo surge">${esc(HERO.sobretitulo)}</p>
      <h1 class="surge"${atraso(1)}>
        ${HERO.titulo.map((l, i) =>
          `<span class="hero__linha${i ? ' hero__linha--vazada' : ''}">${esc(l)}</span>`).join(' ')}
      </h1>
      <p class="hero__apoio surge"${atraso(2)}>${esc(HERO.texto)}</p>
      <div class="hero__acoes surge"${atraso(3)}>
        ${botao({ texto: HERO.cta, href: '#loja', variante: 'volt', tamanho: 'gg' })}
        ${botao({ texto: HERO.ctaSecundario, href: '#categorias', variante: 'linha', tamanho: 'gg' })}
      </div>
      <ul class="hero__numeros surge"${atraso(4)}>
        ${HERO.numeros.map(([a, b]) =>
          `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}
      </ul>
    </div>
    <figure class="hero__foto surge" data-surge="direita">
      <img src="assets/hero.svg" width="1800" height="1300" fetchpriority="high" decoding="async"
        alt="Corrente cubana, corrente grumet e pingente de cruz em aço cromado">
    </figure>
  </div>
</section>`;

/* ── 02 · Mais vendidos · 03 · Novidades ──────────────────── */
const porTag = (tag, cfg, id) => secao({
  id, classe: `faixa faixa--${tag}`,
  conteudo: cabeca({ ...cfg, acao: `<a class="link-seta" href="#loja">Ver a loja inteira<span aria-hidden="true">→</span></a>` }) +
    trilho(comTag(tag).map((p, i) => cartao(p, { i })).join('')),
});

/* ── 04 · Categorias + loja com busca, filtros e ordenação ── */
const categorias = () => secao({
  id: 'categorias', classe: 'categorias',
  conteudo: cabeca(SECOES.categorias) +
    `<ul class="cats">${CATEGORIAS.map((c, i) => `
      <li class="surge"${atraso(i, 0.05)}>
        <button type="button" class="cat" data-ir="${c.id}">
          <span class="cat__foto"><img src="assets/${c.capa}" alt="${esc(c.nome)}"
            width="1000" height="1000" loading="lazy" decoding="async"></span>
          <span class="cat__nome">${esc(c.nome)}</span>
          <span class="cat__linha">${esc(c.linha)}</span>
        </button>
      </li>`).join('')}</ul>`,
});

const loja = () => secao({
  id: 'loja', classe: 'loja', tom: 'carvao',
  conteudo: cabeca(SECOES.loja) + `
    <div class="ferramentas">
      <div class="ferramentas__busca">
        <label class="sr" for="lojaBusca">Buscar na loja</label>
        ${ICO.busca}
        <input type="search" id="lojaBusca" placeholder="Buscar por nome ou material…"
          autocomplete="off" enterkeyhint="search">
        <button type="button" class="ferramentas__limpar" id="lojaLimpar"
          aria-label="Limpar busca" hidden>${ICO.fechar}</button>
      </div>
      <div class="ferramentas__ordem">
        <label for="lojaOrdem">Ordenar</label>
        <select id="lojaOrdem">
          ${ORDENACOES.map(([v, t]) => `<option value="${v}">${esc(t)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="filtros" role="group" aria-label="Filtrar por categoria">
      <button type="button" class="chip ativo" data-filtro="todas" aria-pressed="true">Tudo</button>
      ${CATEGORIAS.map((c) =>
        `<button type="button" class="chip" data-filtro="${c.id}" aria-pressed="false">${esc(c.nome)}</button>`).join('')}
      <button type="button" class="chip" data-filtro="oferta" aria-pressed="false">Em oferta</button>
    </div>

    <p class="loja__conta" id="lojaConta" role="status" aria-live="polite"></p>
    <div class="grade" id="grade">${PRODUTOS.map((p, i) => cartao(p, { i })).join('')}</div>
    <p class="loja__vazio" id="lojaVazio" hidden>
      Nada encontrado com esses termos.
      <button type="button" class="btn btn--linha btn--peq" id="lojaReset">Limpar filtros</button>
    </p>`,
});

/* ── 05 · Ofertas ─────────────────────────────────────────── */
const ofertas = () => secao({
  id: 'ofertas', classe: 'ofertas', tom: 'volt',
  conteudo: cabeca(SECOES.ofertas) +
    trilho(comTag('oferta').map((p, i) => cartao(p, { i })).join('')),
});

/* ── 06 · Kits ────────────────────────────────────────────── */
const kits = () => secao({
  id: 'kits', classe: 'kits',
  conteudo: cabeca(SECOES.kits) +
    `<div class="grade grade--dupla">${PRODUTOS.filter((p) => p.categoria === 'kits')
      .map((p, i) => cartao(p, { i })).join('')}</div>`,
});

/* ── 07 · Avaliações (demonstração) ───────────────────────── */
const avaliacoes = () => secao({
  id: 'avaliacoes', classe: 'avaliacoes', tom: 'carvao',
  conteudo: cabeca(SECOES.avaliacoes) + `
    <p class="tarja-demo surge">
      <b>Conteúdo de demonstração.</b> Os depoimentos abaixo, os nomes e as notas
      exibidas nos produtos foram inventados para mostrar o formato do bloco.
      Não representam pessoas nem compras reais.
    </p>
    <ul class="depos">${AVALIACOES.map((a, i) => `
      <li class="depo surge"${atraso(i, 0.06)}>
        <p class="depo__demo">Exemplo</p>
        ${estrelas(a.nota)}
        <p class="depo__texto">${esc(a.texto)}</p>
        <p class="depo__autor">${esc(a.autor)}<span>${esc(a.produto)}</span></p>
      </li>`).join('')}</ul>`,
});

/* ── 08 · Instagram ───────────────────────────────────────── */
const instagram = () => secao({
  id: 'instagram', classe: 'insta',
  conteudo: cabeca({ ...SECOES.instagram,
    acao: botao({ texto: `Seguir ${MARCA.instagram}`, href: '#', variante: 'linha' }) }) +
    `<ul class="insta__grade">${INSTAGRAM.map(([src, alt], i) => `
      <li class="surge"${atraso(i, 0.035)}><a href="#" aria-label="Publicação no Instagram: ${esc(alt)}">
        <img src="assets/${src}" alt="${esc(alt)}" width="1000" height="1000" loading="lazy" decoding="async">
      </a></li>`).join('')}</ul>`,
});

/* ── 09 · FAQ ─────────────────────────────────────────────── */
const faq = () => secao({
  id: 'faq', classe: 'faq', tom: 'carvao',
  conteudo: `<div class="faq__grade">${cabeca(SECOES.faq)}${sanfona(FAQ)}</div>`,
});

/* ── 10 · Chamada final ───────────────────────────────────── */
/** `raiz` vazia na home, '../' dentro de /produtos — sem isso o botão
 *  aponta para uma âncora que só existe na home. */
export const final = (raiz = '') => `<section class="final" aria-label="Chamada final">
  <div class="wrap final__caixa">
    <p class="rotulo surge">${esc(SECOES.final.etiqueta)}</p>
    <h2 class="surge"${atraso(1)}>${esc(SECOES.final.titulo)}</h2>
    <p class="final__texto surge"${atraso(2)}>${esc(SECOES.final.texto)}</p>
    <div class="final__acoes surge"${atraso(3)}>
      ${botao({ texto: 'Comprar agora', href: `${raiz}${raiz ? 'index.html' : ''}#loja`,
                variante: 'preto', tamanho: 'gg' })}
      ${botao({ texto: `${ICO.whats}Chamar no WhatsApp`, href: linkWhats(CONSULTA_GERAL),
                variante: 'contorno-preto', tamanho: 'gg', externo: true })}
    </div>
  </div>
</section>`;

export function paginaHome() {
  const corpo = [
    hero(),
    porTag('mais-vendido', SECOES.vendidos, 'vendidos'),
    porTag('novidade', SECOES.novidades, 'novidades'),
    categorias(),
    loja(),
    ofertas(),
    kits(),
    avaliacoes(),
    instagram(),
    faq(),
    final(),
  ].join('\n');

  return pagina({
    titulo: `${MARCA.nome} | Correntes, anéis, pulseiras e brincos em aço 316L`,
    descricao: 'Acessórios unissex em aço inox 316L: correntes cubanas, anéis, ' +
      'pulseiras e brincos. Frete grátis acima de R$ 199, troca em 30 dias e ' +
      'garantia de 1 ano. Projeto demonstrativo.',
    caminho: '', raiz: '', corpo,
    jsonLd: [
      jsonLdMarca,
      { '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQ.map(([p, r]) => ({ '@type': 'Question', name: p,
          acceptedAnswer: { '@type': 'Answer', text: r } })) },
      { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Loja VOLT',
        itemListElement: PRODUTOS.map((p, i) => ({ '@type': 'ListItem', position: i + 1,
          name: p.nome, url: `${MARCA.dominio}/produtos/${p.slug}.html` })) },
    ],
  });
}
