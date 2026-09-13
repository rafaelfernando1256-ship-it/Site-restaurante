/** VANTA STORE — página de categoria (banner, descrição, filtros, produtos). */
import { LOJA, ORDENACOES, SECOES } from '../conteudo/site.js';
import { CATEGORIAS, MARCAS, PRODUTOS, FAIXAS, daCategoria, comTag, desconto }
  from '../conteudo/produtos.js';
import { esc, atraso, cabeca, secao, cartao, ferramentas, catalogo, ICO } from './ui.js';
import { pagina, jsonLdLoja } from './base.js';

const RAIZ = '../';

/** A página de ofertas usa a mesma casca das categorias. */
export const OFERTAS = {
  id: 'ofertas', nome: 'Ofertas', banner: 'cat-roupas.svg',
  chamada: 'Desconto direto no preço, sem cupom',
  texto: 'Peças com preço reduzido enquanto durar o estoque. O desconto já ' +
         'aparece no valor mostrado — não precisa de código no checkout.',
};

export function paginaCategoria(cat) {
  const itens = cat.id === 'ofertas' ? comTag('oferta') : daCategoria(cat.id);
  const tipos = [...new Set(itens.map((p) => p.tipo))].sort()
    .map((t) => [t, t, String(itens.filter((p) => p.tipo === t).length)]);
  const marcas = MARCAS.filter((m) => itens.some((p) => p.marca === m.id))
    .map((m) => [m.id, m.nome, m.linha]);
  const tamanhos = [...new Set(itens.flatMap((p) => p.tamanhos))]
    .sort((a, b) => (isNaN(a) || isNaN(b)) ? 0 : a - b).map((t) => [t, t]);
  const cores = [...new Set(itens.flatMap((p) => p.cores.map((c) => c.nome)))]
    .sort().map((c) => [c, c]);

  const corpo = `
<section class="banner">
  <img class="banner__foto" src="${RAIZ}assets/${cat.banner}" alt=""
    width="2000" height="1100" fetchpriority="high" decoding="async">
  <div class="wrap banner__corpo">
    <nav class="migalhas migalhas--claro" aria-label="Você está em">
      <ol>
        <li><a href="${RAIZ}index.html">Início</a></li>
        <li><span aria-current="page">${esc(cat.nome)}</span></li>
      </ol>
    </nav>
    <h1>${esc(cat.nome).toUpperCase()}</h1>
    <p class="banner__chamada">${esc(cat.chamada)}</p>
    <p class="banner__texto">${esc(cat.texto)}</p>
  </div>
</section>

${secao({ id: 'loja', classe: 'loja',
  conteudo: ferramentas({
    categorias: CATEGORIAS.map((c) => [c.id, c.nome]),
    marcas, tipos, tamanhos, cores,
    faixas: FAIXAS.map((f) => [f.id, f.nome]),
    ordenacoes: ORDENACOES,
    catFixa: true,
  }) + catalogo(itens.map((p, i) => cartao(p, { raiz: RAIZ, i })).join(''),
    `Produtos de ${cat.nome}`) })}`;

  return pagina({
    titulo: `${cat.nome} | ${LOJA.nome} ${LOJA.sobrenome}`,
    descricao: `${cat.chamada}. ${cat.texto} Frete grátis acima de ` +
      `R$ ${LOJA.freteGratis} e troca em 30 dias.`,
    caminho: `categoria/${cat.id}.html`, raiz: RAIZ, corpo, atual: cat.id,
    imagemSocial: `assets/${cat.banner}`,
    jsonLd: [
      jsonLdLoja,
      { '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: cat.nome, description: cat.texto,
        url: `${LOJA.dominio}/categoria/${cat.id}.html`,
        mainEntity: { '@context': 'https://schema.org', '@type': 'ItemList',
          itemListElement: itens.map((p, i) => ({ '@type': 'ListItem', position: i + 1,
            name: p.nome, url: `${LOJA.dominio}/produto/${p.slug}.html` })) } },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${LOJA.dominio}/` },
          { '@type': 'ListItem', position: 2, name: cat.nome },
        ] },
    ],
  });
}
