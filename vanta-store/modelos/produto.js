/** VANTA STORE — página individual de produto. */
import { LOJA, ENTREGA, TROCA, linkWhats, MSG, AVISO_DEMO } from '../conteudo/site.js';
import { imagensDe, relacionados, desconto, marca, categoria }
  from '../conteudo/produtos.js';
import { esc, moeda, parcelas, pix, atraso, botao, cabeca, secao, cartao, trilho, ICO }
  from './ui.js';
import { pagina, jsonLdLoja } from './base.js';

const RAIZ = '../';

const migalhas = (p) => {
  const c = categoria(p.categoria);
  return `<nav class="migalhas" aria-label="Você está em">
    <ol>
      <li><a href="${RAIZ}index.html">Início</a></li>
      <li><a href="${RAIZ}categoria/${c.id}.html">${esc(c.nome)}</a></li>
      ${p.tipo.toLowerCase() === c.nome.toLowerCase() ? '' : `
      <li><a href="${RAIZ}categoria/${c.id}.html?tipo=${encodeURIComponent(p.tipo)}">${esc(p.tipo)}</a></li>`}
      <li><span aria-current="page">${esc(p.nome)}</span></li>
    </ol>
  </nav>`;
};

/* ── Galeria com zoom ─────────────────────────────────────── */
function galeria(p) {
  const fotos = imagensDe(p);
  const off = desconto(p);
  return `<div class="galeria">
    <div class="galeria__palco" id="palco">
      ${fotos.map((src, i) => `<button type="button" class="galeria__foto${i === 0 ? ' ativa' : ''}"
        id="foto-${i}" data-zoom="${RAIZ}${src}"${i === 0 ? '' : ' hidden'}
        aria-label="Ampliar a vista ${i + 1} de ${p.nome}">
        <img src="${RAIZ}${src}" alt="${esc(p.nome)} — vista ${i + 1} de ${fotos.length}"
          width="1000" height="1000"${i === 0
            ? ' fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"'}>
      </button>`).join('')}
      ${off ? `<span class="galeria__off">−${off}%</span>` : ''}
      <span class="galeria__lupa" aria-hidden="true">${ICO.zoom}</span>
    </div>
    <div class="galeria__minis" role="tablist" aria-label="Vistas do produto">
      ${fotos.map((src, i) => `<button type="button" role="tab" class="mini${i === 0 ? ' ativa' : ''}"
        aria-selected="${i === 0}" aria-controls="foto-${i}" tabindex="${i === 0 ? 0 : -1}"
        aria-label="Ver a vista ${i + 1} de ${fotos.length}" data-i="${i}">
        <img src="${RAIZ}${src}" alt="" width="1000" height="1000" loading="lazy" decoding="async">
      </button>`).join('')}
    </div>
  </div>`;
}

/* ── Ficha de compra ──────────────────────────────────────── */
function compra(p) {
  const m = marca(p.marca);
  const off = desconto(p);
  return `<div class="ficha" data-slug="${p.slug}" data-nome="${esc(p.nome)}"
    data-preco="${p.preco}" data-img="${RAIZ}${imagensDe(p)[0]}"
    data-url="produto/${p.slug}.html" data-estoque="${p.estoque ? '1' : '0'}">

    <p class="ficha__marca surge"><a href="${RAIZ}categoria/${p.categoria}.html">${esc(m.nome)}</a>
      <span>${esc(p.sku)}</span></p>
    <h1 class="surge"${atraso(1)}>${esc(p.nome)}</h1>
    <p class="ficha__resumo surge"${atraso(2)}>${esc(p.resumo)}</p>

    <div class="ficha__preco surge"${atraso(2)}>
      ${p.precoDe ? `<s>${moeda(p.precoDe)}</s>` : ''}
      <b>${moeda(p.preco)}</b>
      ${off ? `<span class="ficha__off">−${off}%</span>` : ''}
      <small>${parcelas(p.preco)} · ou <b>${pix(p.preco)}</b> no Pix</small>
    </div>

    ${p.cores.length ? `<div class="ficha__bloco surge"${atraso(3)}>
      <p class="ficha__rotulo"><span>Cor: <b id="corEscolhida">${esc(p.cores[0].nome)}</b></span></p>
      <div class="cores" id="cores" role="radiogroup" aria-label="Cor">
        ${p.cores.map((c, i) => `<button type="button" class="cor${i === 0 ? ' ativa' : ''}"
          role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}"
          style="--c:${c.hex}" data-nome="${esc(c.nome)}"
          aria-label="Cor ${esc(c.nome)}"></button>`).join('')}
      </div>
    </div>` : ''}

    <div class="ficha__bloco surge"${atraso(3)}>
      <p class="ficha__rotulo">
        <span>${p.tamanhos.length > 1 ? 'Tamanho' : 'Tamanho único'}</span>
        ${p.tamanhos.length > 1 ? '<a href="#ficha-tecnica">Tabela de medidas</a>' : ''}
      </p>
      <div class="tamanhos" id="tamanhos" role="radiogroup" aria-label="Tamanho">
        ${p.tamanhos.map((t, i) => `<button type="button" class="tam"
          role="radio" aria-checked="false" tabindex="${i === 0 ? 0 : -1}">${esc(t)}</button>`).join('')}
      </div>
      <p class="ficha__erro" id="erroTamanho" role="alert" hidden>Escolha um tamanho antes de continuar.</p>
    </div>

    <div class="ficha__compra surge"${atraso(4)}>
      <div class="qtd" role="group" aria-label="Quantidade">
        <button type="button" id="qtdMenos" aria-label="Diminuir quantidade">−</button>
        <span id="qtdValor" aria-live="polite">1</span>
        <button type="button" id="qtdMais" aria-label="Aumentar quantidade">+</button>
      </div>
      ${p.estoque
        ? `<button type="button" class="btn btn--tinta btn--gg btn--cheio" id="comprarAgora">Comprar agora</button>`
        : `<button type="button" class="btn btn--tinta btn--gg btn--cheio" disabled>Produto esgotado</button>`}
    </div>
    <div class="ficha__acoes surge"${atraso(4)}>
      ${p.estoque
        ? `<button type="button" class="btn btn--linha btn--bloco" id="addCarrinho">
             ${ICO.sacola}Adicionar ao carrinho</button>`
        : `<button type="button" class="btn btn--linha btn--bloco" disabled>Sem estoque</button>`}
      <button type="button" class="btn btn--icone" id="favProduto"
        aria-pressed="false" aria-label="Salvar nos favoritos">${ICO.favorito}</button>
    </div>
    <p class="ficha__ajuda">
      <a href="${linkWhats(MSG.produto(p))}" target="_blank" rel="noopener">
        ${ICO.whats}<span>Dúvida no tamanho? Fale com a gente no WhatsApp</span>
      </a>
    </p>

    <ul class="ficha__garantias surge"${atraso(5)}>
      <li>${ICO.caminhao}Frete grátis acima de ${moeda(LOJA.freteGratis)}</li>
      <li>${ICO.troca}Troca em 30 dias</li>
      <li>${ICO.escudo}Compra segura</li>
    </ul>
  </div>`;
}

/* ── Abas de conteúdo ─────────────────────────────────────── */
const abas = (p) => `<div class="abas" id="ficha-tecnica">
  <div class="abas__botoes" role="tablist" aria-label="Informações do produto">
    ${[['desc', 'Descrição'], ['tec', 'Ficha técnica'], ['ent', 'Entrega'], ['tro', 'Trocas']]
      .map(([id, t], i) => `<button type="button" role="tab" class="aba${i === 0 ? ' ativa' : ''}"
        id="aba-${id}" aria-controls="painel-${id}" aria-selected="${i === 0}"
        tabindex="${i === 0 ? 0 : -1}">${t}</button>`).join('')}
  </div>

  <div class="abas__painel" id="painel-desc" role="tabpanel" aria-labelledby="aba-desc">
    ${p.descricao.map((t) => `<p>${esc(t)}</p>`).join('')}
  </div>
  <div class="abas__painel" id="painel-tec" role="tabpanel" aria-labelledby="aba-tec" hidden>
    <dl class="especs">${p.ficha.map(([t, v]) =>
      `<div><dt>${esc(t)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
  </div>
  <div class="abas__painel" id="painel-ent" role="tabpanel" aria-labelledby="aba-ent" hidden>
    <dl class="especs">${ENTREGA.itens.map(([t, v]) =>
      `<div><dt>${esc(t)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <p class="abas__nota">${esc(ENTREGA.nota)}</p>
  </div>
  <div class="abas__painel" id="painel-tro" role="tabpanel" aria-labelledby="aba-tro" hidden>
    <dl class="especs">${TROCA.itens.map(([t, v]) =>
      `<div><dt>${esc(t)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <p class="abas__nota">${esc(TROCA.nota)}</p>
  </div>
</div>`;

export function paginaProduto(p) {
  const fotos = imagensDe(p);
  const c = categoria(p.categoria);
  const corpo = `
<section class="produto">
  <div class="wrap">
    ${migalhas(p)}
    <div class="produto__grade">${galeria(p)}${compra(p)}</div>
    ${abas(p)}
  </div>
</section>

${secao({ tom: 'creme', classe: 'relacionados', rotuloAria: 'Produtos relacionados',
  conteudo: cabeca({ etiqueta: 'Combina com', titulo: 'QUEM VIU, LEVOU JUNTO' }) +
    trilho(relacionados(p, 4).map((o, i) => cartao(o, { raiz: RAIZ, i })).join('')) })}

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Imagem ampliada" hidden>
  <button class="ico-btn lightbox__fechar" id="fecharZoom" aria-label="Fechar imagem">${ICO.fechar}</button>
  <img id="lightboxImg" alt=""
    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
</div>`;

  return pagina({
    titulo: `${p.nome} — ${marca(p.marca).nome} | ${LOJA.nome} ${LOJA.sobrenome}`,
    descricao: `${p.resumo} ${moeda(p.preco)} em ${parcelas(p.preco)}. ` +
      `Frete grátis acima de ${moeda(LOJA.freteGratis)} e troca em 30 dias.`,
    caminho: `produto/${p.slug}.html`, raiz: RAIZ, corpo, classe: 'pg-produto', atual: p.categoria,
    imagemSocial: fotos[0],
    jsonLd: [
      jsonLdLoja,
      {
        '@context': 'https://schema.org', '@type': 'Product',
        name: p.nome, sku: p.sku, description: p.descricao.join(' '),
        category: `${c.nome} > ${p.tipo}`,
        image: fotos.map((f) => `${LOJA.dominio}/${f}`),
        brand: { '@type': 'Brand', name: marca(p.marca).nome },
        offers: {
          '@type': 'Offer', price: p.preco.toFixed(2), priceCurrency: 'BRL',
          availability: p.estoque
            ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `${LOJA.dominio}/produto/${p.slug}.html`,
          seller: { '@type': 'Organization', name: `${LOJA.nome} ${LOJA.sobrenome}` },
        },
        additionalProperty: p.ficha.map(([n, v]) =>
          ({ '@type': 'PropertyValue', name: n, value: v })),
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${LOJA.dominio}/` },
          { '@type': 'ListItem', position: 2, name: c.nome,
            item: `${LOJA.dominio}/categoria/${c.id}.html` },
          { '@type': 'ListItem', position: 3, name: p.nome },
        ],
      },
    ],
  });
}
