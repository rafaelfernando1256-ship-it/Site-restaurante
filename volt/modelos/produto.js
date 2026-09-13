/** VOLT — página individual de produto. */
import { MARCA, linkWhats, AVISO_DEMO } from '../conteudo/site.js';
import { imagensDe, relacionados, nomeCategoria, desconto, CATEGORIAS }
  from '../conteudo/produtos.js';
import { esc, moeda, parcelas, atraso, botao, cabeca, secao, cartao, trilho,
         estrelas, ICO } from './ui.js';
import { pagina, jsonLdMarca } from './base.js';
import { final } from './home.js';

const RAIZ = '../';

const migalhas = (p) => `<nav class="migalhas" aria-label="Você está em">
  <ol>
    <li><a href="${RAIZ}index.html">Início</a></li>
    <li><a href="${RAIZ}index.html#loja" data-ir="${p.categoria}">${esc(nomeCategoria(p.categoria))}</a></li>
    <li><span aria-current="page">${esc(p.nome)}</span></li>
  </ol>
</nav>`;

function galeria(p) {
  const fotos = imagensDe(p);
  return `<div class="galeria">
    <div class="galeria__palco">
      ${fotos.map((src, i) => `<img class="galeria__foto" id="foto-${i}" src="${RAIZ}${src}"
        alt="${esc(p.nome)} — vista ${i + 1} de ${fotos.length}" width="1000" height="1000"${
        i === 0 ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async" hidden'}>`).join('')}
      ${desconto(p) ? `<span class="galeria__off">−${desconto(p)}%</span>` : ''}
    </div>
    <div class="galeria__minis" role="tablist" aria-label="Vistas do produto">
      ${fotos.map((src, i) => `<button type="button" role="tab" class="mini${i === 0 ? ' ativa' : ''}"
        aria-selected="${i === 0}" aria-controls="foto-${i}" tabindex="${i === 0 ? 0 : -1}"
        aria-label="Ver a vista ${i + 1} de ${fotos.length} de ${esc(p.nome)}" data-i="${i}">
        <img src="${RAIZ}${src}" alt="" width="1000" height="1000" loading="lazy" decoding="async">
      </button>`).join('')}
    </div>
  </div>`;
}

function ficha(p) {
  const off = desconto(p);
  return `<div class="ficha"
    data-slug="${p.slug}" data-nome="${esc(p.nome)}" data-preco="${p.preco}"
    data-img="${RAIZ}${imagensDe(p)[0]}" data-url="produtos/${p.slug}.html"
    data-variante-rotulo="${esc(p.variante.rotulo)}">
    <p class="rotulo surge"><b>${esc(p.sku)}</b>${esc(nomeCategoria(p.categoria))}</p>
    <h1 class="surge"${atraso(1)}>${esc(p.nome)}</h1>

    <div class="ficha__nota surge"${atraso(2)}>${estrelas(p.nota, p.avaliacoes)}</div>

    <div class="ficha__preco surge"${atraso(2)}>
      ${p.precoDe ? `<s>${moeda(p.precoDe)}</s>` : ''}
      <b>${moeda(p.preco)}</b>
      ${off ? `<span class="ficha__off">−${off}%</span>` : ''}
      <small>${parcelas(p.preco)} · ou ${moeda(p.preco * 0.95)} no Pix</small>
    </div>

    <p class="ficha__resumo surge"${atraso(3)}>${esc(p.resumo)}</p>

    <div class="ficha__opcoes surge"${atraso(3)}>
      <p class="ficha__rotulo" id="rotVariante">${esc(p.variante.rotulo)}</p>
      <div class="opcoes" id="opcoes" role="radiogroup" aria-labelledby="rotVariante">
        ${p.variante.opcoes.map((o, i) => `<button type="button" class="opcao${
          i === p.variante.padrao ? ' ativa' : ''}" role="radio"
          aria-checked="${i === p.variante.padrao}" tabindex="${i === p.variante.padrao ? 0 : -1}"
          >${esc(o)}</button>`).join('')}
      </div>
    </div>

    <div class="ficha__compra surge"${atraso(4)}>
      <div class="qtd" role="group" aria-label="Quantidade">
        <button type="button" id="qtdMenos" aria-label="Diminuir quantidade">−</button>
        <span id="qtdValor" aria-live="polite">1</span>
        <button type="button" id="qtdMais" aria-label="Aumentar quantidade">+</button>
      </div>
      <button type="button" class="btn btn--volt btn--gg btn--cheio" id="fichaAdd">
        ${ICO.sacola}Adicionar à sacola
      </button>
    </div>
    <p class="surge"${atraso(4)}>
      ${botao({ texto: `${ICO.whats}Tirar dúvida no WhatsApp`, variante: 'linha', tamanho: 'bloco',
        externo: true, extra: ' data-bloco',
        href: linkWhats(`Fala! Queria saber mais sobre o ${p.nome} (ref. ${p.sku}) do site da VOLT.`) })}
    </p>

    <ul class="ficha__garantias surge"${atraso(5)}>
      <li>Frete grátis acima de R$ ${MARCA.freteGratis}</li>
      <li>Troca em 30 dias</li>
      <li>Garantia de 1 ano</li>
      <li>Aço 316L antialérgico</li>
    </ul>

    <div class="ficha__texto surge">
      <h2>Sobre a peça</h2>
      ${p.descricao.map((t) => `<p>${esc(t)}</p>`).join('')}
    </div>

    <h2 class="ficha__titulo surge">Ficha técnica</h2>
    <dl class="especs surge">
      ${p.detalhes.map(([t, v]) => `<div><dt>${esc(t)}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>
  </div>`;
}

export function paginaProduto(p) {
  const fotos = imagensDe(p);
  const corpo = `
<section class="produto">
  <div class="wrap">
    ${migalhas(p)}
    <div class="produto__grade">${galeria(p)}${ficha(p)}</div>
  </div>
</section>

${secao({
    classe: 'relacionados', tom: 'carvao', rotuloAria: 'Produtos relacionados',
    conteudo: cabeca({ etiqueta: 'Combina com', titulo: 'LEVA JUNTO' }) +
      trilho(relacionados(p, 4).map((o, i) =>
        cartao(o, { raiz: RAIZ, i })).join('')),
  })}

${final(RAIZ)}`;

  return pagina({
    titulo: `${p.nome} | ${moeda(p.preco)} | ${MARCA.nome}`,
    descricao: `${p.resumo} ${p.material}. ${moeda(p.preco)} em ${parcelas(p.preco)}. ` +
      `Frete grátis acima de ${moeda(MARCA.freteGratis)} e troca em 30 dias.`,
    caminho: `produtos/${p.slug}.html`, raiz: RAIZ, corpo,
    imagemSocial: fotos[0],
    jsonLd: [
      jsonLdMarca,
      {
        '@context': 'https://schema.org', '@type': 'Product',
        name: p.nome, sku: p.sku, description: p.descricao.join(' '),
        material: p.material, category: nomeCategoria(p.categoria),
        image: fotos.map((f) => `${MARCA.dominio}/${f}`),
        brand: { '@type': 'Brand', name: MARCA.nome },
        offers: {
          '@type': 'Offer', price: p.preco.toFixed(2), priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock',
          url: `${MARCA.dominio}/produtos/${p.slug}.html`,
          seller: { '@type': 'Organization', name: MARCA.nome },
        },
        additionalProperty: p.detalhes.map(([n, v]) =>
          ({ '@type': 'PropertyValue', name: n, value: v })),
        // Nota e contagem são dados INVENTADOS, declarados como demonstração
        // no site. Ficam fora do JSON-LD de propósito: marcar avaliação
        // fictícia como real é justamente o que o Google pune.
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${MARCA.dominio}/` },
          { '@type': 'ListItem', position: 2, name: nomeCategoria(p.categoria),
            item: `${MARCA.dominio}/#loja` },
          { '@type': 'ListItem', position: 3, name: p.nome },
        ],
      },
    ],
  });
}
