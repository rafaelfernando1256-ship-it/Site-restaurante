/** AUREA — página individual de peça. */
import { MARCA, consultaPeca, linkWhats } from '../conteudo/site.js';
import { CATEGORIAS, COLECOES, imagensDe, relacionadas } from '../conteudo/produtos.js';
import { esc, moeda, atraso, botao, botaoConsulta, filete, cartaoPeca, figura, secao }
  from './ui.js';
import { pagina, jsonLdMarca } from './base.js';
import { chamadaFinal } from './home.js';

const RAIZ = '../';
const acharCat = (id) => CATEGORIAS.find((c) => c.id === id) || {};
const acharCol = (id) => COLECOES.find((c) => c.id === id);

/* ── Migalhas ─────────────────────────────────────────────── */
const migalhas = (peca) => {
  const cat = acharCat(peca.categoria);
  return `<nav class="migalhas" aria-label="Você está em">
    <ol>
      <li><a href="${RAIZ}index.html">Início</a></li>
      <li><a href="${RAIZ}index.html#${cat.id}">${esc(cat.nome)}</a></li>
      <li><span aria-current="page">${esc(peca.nome)}</span></li>
    </ol>
  </nav>`;
};

/* ── Galeria ──────────────────────────────────────────────── */
function galeria(peca) {
  const fotos = imagensDe(peca);
  return `<div class="galeria">
    <div class="galeria__palco">
      ${fotos.map((src, i) => `<img class="galeria__foto${i === 0 ? ' ativa' : ''}"
        id="foto-${i}" src="${RAIZ}${src}"
        alt="${esc(peca.nome)} — vista ${i + 1} de ${fotos.length}"
        width="1000" height="1000"${i === 0
          ? ' fetchpriority="high" decoding="async"'
          : ' loading="lazy" decoding="async"'}${i === 0 ? '' : ' hidden'}>`).join('')}
    </div>
    ${fotos.length > 1 ? `<div class="galeria__miniaturas" role="tablist" aria-label="Vistas da peça">
      ${fotos.map((src, i) => `<button type="button" role="tab" class="miniatura${i === 0 ? ' ativa' : ''}"
        aria-selected="${i === 0}" aria-controls="foto-${i}" tabindex="${i === 0 ? 0 : -1}"
        aria-label="Ver a vista ${i + 1} de ${fotos.length} de ${esc(peca.nome)}"
        data-indice="${i}">
        <img src="${RAIZ}${src}" alt="" width="1000" height="1000" loading="lazy" decoding="async">
      </button>`).join('')}
    </div>` : ''}
  </div>`;
}

/* ── Ficha ────────────────────────────────────────────────── */
function ficha(peca) {
  const cat = acharCat(peca.categoria);
  const col = acharCol(peca.colecao);
  return `<div class="ficha">
    <p class="rotulo revelar">
      <span class="rotulo__n">${esc(peca.ref)}</span>${esc(cat.nome)}
    </p>
    <h1 class="revelar"${atraso(1)}>${esc(peca.nome)}</h1>
    ${col ? `<p class="ficha__colecao revelar"${atraso(2)}>Coleção ${esc(col.nome)} · ${esc(col.ano)}</p>` : ''}

    <p class="ficha__preco revelar"${atraso(2)}>
      ${moeda(peca.preco)}<span>valor de referência · confirmado na consulta</span>
    </p>

    <div class="ficha__descricao revelar"${atraso(3)}>
      ${peca.descricao.map((p) => `<p>${esc(p)}</p>`).join('')}
    </div>

    <p class="ficha__material revelar"${atraso(4)}>
      <span>Material</span>${esc(peca.material)}
    </p>

    <div class="ficha__acoes revelar"${atraso(5)}>
      ${botaoConsulta(consultaPeca(peca), 'Consultar esta peça', 'ouro', 'gg')}
      ${botao({ texto: 'Agendar uma prova', variante: 'linha', tamanho: 'gg', externo: true,
        href: linkWhats(`Olá! Gostaria de agendar uma visita ao ateliê para provar a peça ` +
                        `${peca.nome} (ref. ${peca.ref}).`) })}
    </div>
    <p class="aviso-canal revelar"${atraso(6)}>
      O WhatsApp é o nosso canal de atendimento e consulta: um consultor confirma
      disponibilidade, prazo e condições. Nenhum pagamento é processado pelo site.
    </p>

    <h2 class="ficha__titulo revelar">Especificações</h2>
    <dl class="especs revelar">
      ${peca.especificacoes.map(([t, v]) =>
        `<div><dt>${esc(t)}</dt><dd>${esc(v)}</dd></div>`).join('')}
    </dl>
  </div>`;
}

/* ── Página ───────────────────────────────────────────────── */
export function paginaPeca(peca) {
  const cat = acharCat(peca.categoria);
  const fotos = imagensDe(peca);

  const corpo = `
<section class="peca-topo">
  <div class="wrap">
    ${migalhas(peca)}
    <div class="peca-topo__grade">
      ${galeria(peca)}
      ${ficha(peca)}
    </div>
  </div>
</section>

${secao({
    tom: 'noite', classe: 'relacionadas', rotuloAria: 'Peças relacionadas',
    conteudo: `<header class="cabeca">
        <p class="rotulo revelar">Também do ateliê</p>
        <h2 class="titulo revelar"${atraso(1)}>Peças que combinam com esta</h2>
      </header>
      <div class="grade-pecas">${relacionadas(peca, 3).map((p, i) =>
        cartaoPeca(p, { raiz: RAIZ, consulta: consultaPeca(p),
                        colecao: (acharCol(p.colecao) || {}).nome, i })).join('')}</div>`,
  })}

${chamadaFinal()}`;

  return pagina({
    titulo: `${peca.nome} | ${peca.material} | ${MARCA.nome}`,
    descricao: `${peca.resumo} ${peca.material}. Valor de referência ` +
      `${moeda(peca.preco)}. Consulta e atendimento por WhatsApp com o ateliê AUREA.`,
    caminho: `pecas/${peca.slug}.html`, raiz: RAIZ, corpo,
    imagemSocial: fotos[0],
    jsonLd: [
      jsonLdMarca,
      {
        '@context': 'https://schema.org', '@type': 'Product',
        name: peca.nome, sku: peca.ref,
        description: peca.descricao.join(' '),
        material: peca.material,
        category: cat.nome,
        image: fotos.map((f) => `${MARCA.dominio}/${f}`),
        brand: { '@type': 'Brand', name: MARCA.nome },
        offers: {
          '@type': 'Offer', price: peca.preco, priceCurrency: 'BRL',
          availability: 'https://schema.org/InStock',
          url: `${MARCA.dominio}/pecas/${peca.slug}.html`,
          seller: { '@type': 'Organization', name: MARCA.nome },
        },
        additionalProperty: peca.especificacoes.map(([n, v]) => ({
          '@type': 'PropertyValue', name: n, value: v,
        })),
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${MARCA.dominio}/` },
          { '@type': 'ListItem', position: 2, name: cat.nome, item: `${MARCA.dominio}/#${cat.id}` },
          { '@type': 'ListItem', position: 3, name: peca.nome },
        ],
      },
    ],
  });
}
