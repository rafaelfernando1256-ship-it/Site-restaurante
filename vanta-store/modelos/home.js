/** VANTA STORE — home. */
import { LOJA, HERO, SECOES, BENEFICIOS, FAQ, INSTAGRAM, ORDENACOES,
         AVISO_DEMO, linkWhats, MSG } from '../conteudo/site.js';
import { CATEGORIAS, MARCAS, PRODUTOS, FAIXAS, comTag, categoria, daCategoria }
  from '../conteudo/produtos.js';
import { esc, atraso, botao, cabeca, secao, cartao, grade, trilho, sanfona,
         ferramentas, catalogo, ICO } from './ui.js';
import { pagina, jsonLdLoja } from './base.js';

/* ── Hero ─────────────────────────────────────────────────── */
const hero = () => `<section class="hero" aria-label="Campanha">
  <div class="wrap hero__grade">
    <div class="hero__texto">
      <p class="rotulo surge">${esc(HERO.sobretitulo)}</p>
      <h1 class="surge"${atraso(1)}>${esc(HERO.titulo)}</h1>
      <p class="hero__sub surge"${atraso(2)}>${esc(HERO.subtitulo)}</p>
      <div class="hero__acoes surge"${atraso(3)}>
        ${botao({ texto: HERO.cta, href: '#loja', variante: 'claro', tamanho: 'gg' })}
        ${botao({ texto: HERO.ctaSecundario, href: '#novidades', variante: 'contorno', tamanho: 'gg' })}
      </div>
      <ul class="hero__numeros surge"${atraso(4)}>
        ${HERO.numeros.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('')}
      </ul>
    </div>
    <figure class="hero__foto surge" data-surge="direita">
      <img src="assets/hero.svg" width="2000" height="1250" fetchpriority="high" decoding="async"
        alt="Moletom, jaqueta, tênis, boné e perfume da nova coleção VANTA STORE">
    </figure>
  </div>
</section>`;

/* ── Categorias ───────────────────────────────────────────── */
const categorias = () => secao({
  id: 'categorias', classe: 'categorias',
  conteudo: cabeca(SECOES.categorias) +
    `<ul class="cats">${CATEGORIAS.map((c, i) => `
      <li class="surge"${atraso(i, 0.05)}>
        <a class="cat" href="categoria/${c.id}.html">
          <span class="cat__foto">
            <img src="assets/${c.bannerAlto}" alt="" width="1200" height="1500" loading="lazy" decoding="async">
          </span>
          <span class="cat__corpo">
            <span class="cat__nome">${esc(c.nome)}</span>
            <span class="cat__linha">${esc(c.chamada)}</span>
            <span class="cat__cta">Explorar ${ICO.seta}</span>
          </span>
        </a>
      </li>`).join('')}</ul>`,
});

/* ── Faixas de produto ────────────────────────────────────── */
const faixa = (tag, cfg, id, tom) => secao({
  id, tom, classe: `faixa faixa--${tag}`,
  conteudo: cabeca({ ...cfg,
    acao: `<a class="link-seta" href="#loja">Ver tudo ${ICO.seta}</a>` }) +
    trilho(comTag(tag).slice(0, 8).map((p, i) => cartao(p, { i })).join('')),
});

/* ── Ofertas ──────────────────────────────────────────────── */
const ofertas = () => secao({
  id: 'ofertas', tom: 'tinta', classe: 'ofertas',
  conteudo: cabeca({ ...SECOES.ofertas,
    acao: `<a class="link-seta" href="categoria/ofertas.html">Ver todas ${ICO.seta}</a>` }) +
    trilho(comTag('oferta').slice(0, 8).map((p, i) => cartao(p, { i })).join('')) +
    `<p class="ofertas__nota surge">Preços demonstrativos. Nenhuma venda é processada nesta loja.</p>`,
});

/* ── Loja: busca, filtros e ordenação ─────────────────────── */
const loja = () => {
  const tipos = [...new Set(PRODUTOS.map((p) => p.tipo))].sort()
    .map((t) => [t, t, String(PRODUTOS.filter((p) => p.tipo === t).length)]);
  const tamanhos = [...new Set(PRODUTOS.flatMap((p) => p.tamanhos))]
    .sort((a, b) => (isNaN(a) || isNaN(b)) ? 0 : a - b).map((t) => [t, t]);
  const cores = [...new Set(PRODUTOS.flatMap((p) => p.cores.map((c) => c.nome)))]
    .sort().map((c) => [c, c]);
  return secao({
    id: 'loja', classe: 'loja',
    conteudo: cabeca({ etiqueta: 'Catálogo', titulo: 'TODOS OS PRODUTOS',
                       texto: 'Use a busca e os filtros para achar o que você quer em dois toques.' }) +
      ferramentas({
        categorias: CATEGORIAS.map((c) => [c.id, c.nome, String(daCategoria(c.id).length)]),
        marcas: MARCAS.map((m) => [m.id, m.nome, m.linha]),
        tipos, tamanhos, cores,
        faixas: FAIXAS.map((f) => [f.id, f.nome]),
        ordenacoes: ORDENACOES,
      }) +
      catalogo(PRODUTOS.map((p, i) => cartao(p, { i })).join('')),
  });
};

/* ── Benefícios ───────────────────────────────────────────── */
const beneficios = () => secao({
  id: 'beneficios', tom: 'creme', classe: 'beneficios',
  conteudo: cabeca({ ...SECOES.beneficios, centro: true }) +
    `<ul class="bens">${BENEFICIOS.map(([t, d], i) => `
      <li class="surge"${atraso(i, 0.04)}>
        <span class="bens__n">${String(i + 1).padStart(2, '0')}</span>
        <h3>${esc(t)}</h3><p>${esc(d)}</p>
      </li>`).join('')}</ul>`,
});

/* ── Instagram ────────────────────────────────────────────── */
const instagram = () => secao({
  id: 'instagram', classe: 'insta',
  conteudo: cabeca({ ...SECOES.instagram,
    acao: LOJA.redes.Instagram
      ? botao({ texto: 'Seguir no Instagram', href: LOJA.redes.Instagram,
                variante: 'linha', externo: true })
      : '' }) +
    `<ul class="insta__grade">${INSTAGRAM.map(([src, alt, slug], i) => `
      <li class="surge"${atraso(i, 0.03)}>
        <a href="produto/${slug}.html" aria-label="${esc(alt)} — ver produto">
          <img src="assets/${src}" alt="${esc(alt)}" width="1000" height="1000" loading="lazy" decoding="async">
        </a></li>`).join('')}</ul>`,
});

const faq = () => secao({
  id: 'faq', tom: 'creme', classe: 'faq',
  conteudo: `<div class="faq__grade">${cabeca(SECOES.faq)}${sanfona(FAQ)}</div>`,
});

export function paginaHome() {
  const corpo = [
    hero(), categorias(),
    faixa('mais-vendido', SECOES.vendidos, 'vendidos'),
    faixa('novo', SECOES.novidades, 'novidades', 'creme'),
    ofertas(), loja(), beneficios(), instagram(), faq(),
  ].join('\n');

  return pagina({
    titulo: `${LOJA.nome} ${LOJA.sobrenome} | Roupas, tênis, perfumes e acessórios`,
    descricao: 'Loja multimarcas de moda e lifestyle: camisetas, calças, moletons, ' +
      'tênis, perfumes, bonés, relógios e mais. Frete grátis acima de R$ 299 e ' +
      'troca em 30 dias. Projeto demonstrativo.',
    caminho: '', raiz: '', corpo,
    jsonLd: [
      jsonLdLoja,
      { '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQ.map(([p, r]) => ({ '@type': 'Question', name: p,
          acceptedAnswer: { '@type': 'Answer', text: r } })) },
      { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Catálogo VANTA STORE',
        itemListElement: PRODUTOS.map((p, i) => ({ '@type': 'ListItem', position: i + 1,
          name: p.nome, url: `${LOJA.dominio}/produto/${p.slug}.html` })) },
    ],
  });
}
