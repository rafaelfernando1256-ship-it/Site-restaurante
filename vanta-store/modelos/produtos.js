/** VANTA STORE — página do catálogo completo.
 *
 * O catálogo saiu da home de propósito: vitrine curada em cima, lista
 * inteira aqui, que é como uma loja de verdade se organiza (e como a
 * home deixa de ter 28.000px de rolagem no celular).
 */
import { LOJA } from '../conteudo/site.js';
import { PRODUTOS } from '../conteudo/produtos.js';
import { cabeca } from './ui.js';
import { catalogoCompleto } from './home.js';
import { pagina, jsonLdLoja } from './base.js';

export function paginaProdutos() {
  const corpo = `
<div class="wrap migalhas__faixa">
  <nav class="migalhas" aria-label="Você está em">
    <ol><li><a href="index.html">Início</a></li>
      <li><span aria-current="page">Todos os produtos</span></li></ol>
  </nav>
</div>
${catalogoCompleto(cabeca({
    nivel: 1, etiqueta: 'Catálogo', titulo: 'TODOS OS PRODUTOS',
    texto: `${PRODUTOS.length} peças entre roupas, tênis, perfumes e acessórios. ` +
           'Use a busca e os filtros para chegar no que você quer.',
  }))}`;

  return pagina({
    titulo: `Todos os produtos | ${LOJA.nome} ${LOJA.sobrenome}`,
    descricao: 'Catálogo completo da VANTA STORE: roupas, tênis, perfumes e ' +
      'acessórios, com busca, filtros por tamanho, cor, marca e preço.',
    caminho: 'produtos.html', raiz: '', corpo, atual: 'produtos',
    jsonLd: [
      jsonLdLoja,
      { '@context': 'https://schema.org', '@type': 'CollectionPage',
        name: 'Todos os produtos',
        numberOfItems: PRODUTOS.length,
        mainEntity: { '@type': 'ItemList',
          itemListElement: PRODUTOS.map((p, i) => ({
            '@type': 'ListItem', position: i + 1, name: p.nome,
            url: `${LOJA.dominio}/produto/${p.slug}.html` })) } },
    ],
  });
}
