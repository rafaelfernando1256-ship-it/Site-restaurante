/** Montagem da página "Projetos para Joias & Acessórios". */
import { EU, HERO, PARA_QUEM, PORQUE, ENTREGA, PROCESSO, DUVIDAS, FINAL,
         linkWhats, CONTATO, AVISO_DEMO } from '../conteudo/site.js';
import { PROJETOS, imagensDe } from '../conteudo/projetos.js';
import { esc, atraso, botao, ctaWhats, cabeca, secao, sanfona, ICO } from './ui.js';
import { pagina } from './base.js';

/* ── Hero ─────────────────────────────────────────────────── */
const hero = () => `<section class="hero" aria-label="Apresentação">
  <div class="wrap">
    <p class="rotulo surge">${esc(HERO.sobretitulo)}</p>
    <h1 class="surge"${atraso(1)}>${esc(HERO.titulo)}</h1>
    <p class="hero__apoio surge"${atraso(2)}>${esc(HERO.texto)}</p>
    <div class="hero__acoes surge"${atraso(3)}>
      ${ctaWhats(linkWhats(CONTATO.orcamento), HERO.cta, 'gg')}
      ${botao({ texto: HERO.ctaSecundario, href: '#projetos', variante: 'linha', tamanho: 'gg' })}
    </div>
    <ul class="hero__provas surge"${atraso(4)}>
      ${HERO.provas.map((p) => `<li>${esc(p)}</li>`).join('')}
    </ul>

    <div class="hero__tiras surge"${atraso(5)} aria-hidden="true">
      ${PROJETOS.map((p) => `<span class="tira" style="--bg:${p.corDeFundo}">
        <img src="${imagensDe(p).desk}" alt="" width="1440" height="900" loading="lazy" decoding="async">
      </span>`).join('')}
    </div>
  </div>
</section>`;

/* ── 01 · Para quem ───────────────────────────────────────── */
const paraQuem = () => secao({
  id: 'paraquem', classe: 'paraquem', tom: 'creme',
  conteudo: cabeca(PARA_QUEM) +
    `<ul class="segmentos">${PARA_QUEM.segmentos.map(([nome, linha], i) => `
      <li class="surge"${atraso(i, 0.05)}>
        <h3>${esc(nome)}</h3>
        <p>${esc(linha)}</p>
      </li>`).join('')}</ul>`,
});

/* ── 02 · Projetos ────────────────────────────────────────── */
function cartaoProjeto(p, i) {
  const img = imagensDe(p);
  return `<article class="projeto surge"${atraso(i, 0.08)} id="projeto-${p.slug}">
    <div class="projeto__telas" style="--bg:${p.corDeFundo}">
      <img class="projeto__desk" src="${img.desk}" alt="${esc(p.alt)}"
        width="1440" height="900" loading="lazy" decoding="async">
      <img class="projeto__cel" src="${img.cel}" alt="" aria-hidden="true"
        width="390" height="780" loading="lazy" decoding="async">
    </div>

    <div class="projeto__corpo">
      <p class="projeto__tipo"><b>${esc(p.tipo)}</b><span>${esc(p.segmento)}</span></p>
      <h3 class="projeto__nome" style="--cor:${p.corDeTexto};--bg:${p.corDeFundo}">${esc(p.nome)}</h3>
      <p class="projeto__resumo">${esc(p.resumo)}</p>

      <p class="projeto__rotulo">Estilo</p>
      <ul class="etiquetas">${p.estilo.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>

      <ul class="projeto__destaques">
        ${p.destaques.map((d) => `<li>${esc(d)}</li>`).join('')}
      </ul>

      <div class="projeto__acoes">
        ${botao({ texto: `Ver projeto${ICO.fora}`, href: p.link, variante: 'tinta',
                  externo: true, rotulo: `Ver o projeto ${p.nome} em uma nova aba` })}
        ${ctaWhats(linkWhats(CONTATO.projeto(p.nome)), 'Quero um assim', null, 'linha')}
      </div>
    </div>
  </article>`;
}

const projetos = () => secao({
  id: 'projetos', classe: 'projetos',
  conteudo: cabeca({
    n: '02', etiqueta: 'Projetos',
    titulo: 'Três marcas, três públicos, três soluções',
    texto: 'Cada um resolve um problema diferente de venda. Abra, navegue e ' +
           'repare: tudo funciona de verdade, inclusive no celular.',
  }) +
    `<p class="aviso-demo surge">${esc(AVISO_DEMO)}</p>
     <div class="projetos__lista">${PROJETOS.map(cartaoProjeto).join('')}</div>`,
});

/* ── 03 · Por que ─────────────────────────────────────────── */
const porque = () => secao({
  id: 'porque', classe: 'porque', tom: 'tinta',
  conteudo: cabeca(PORQUE) +
    `<ul class="motivos">${PORQUE.itens.map((m, i) => `
      <li class="surge"${atraso(i, 0.05)}>
        <span class="motivos__n">${esc(m.n)}</span>
        <div>
          <h3>${esc(m.titulo)}</h3>
          <p class="motivos__dor"><span>Sem site</span>${esc(m.dor)}</p>
          <p class="motivos__ok"><span>Com site</span>${esc(m.solucao)}</p>
        </div>
      </li>`).join('')}</ul>
     <p class="porque__cta surge">
       ${ctaWhats(linkWhats(CONTATO.orcamento), 'Resolver isso na minha marca', 'gg')}
     </p>`,
});

/* ── 04 · Entrega ─────────────────────────────────────────── */
const entrega = () => secao({
  id: 'entrega', classe: 'entrega', tom: 'creme',
  conteudo: cabeca(ENTREGA) +
    `<ul class="entregas">${ENTREGA.itens.map(([t, d], i) => `
      <li class="surge"${atraso(i, 0.04)}>
        <h3>${esc(t)}</h3><p>${esc(d)}</p>
      </li>`).join('')}</ul>`,
});

/* ── 05 · Processo ────────────────────────────────────────── */
const processo = () => secao({
  id: 'processo', classe: 'processo',
  conteudo: cabeca(PROCESSO) +
    `<ol class="etapas">${PROCESSO.etapas.map(([n, t, d], i) => `
      <li class="surge"${atraso(i, 0.06)}>
        <span class="etapas__n">${esc(n)}</span>
        <h3>${esc(t)}</h3>
        <p>${esc(d)}</p>
      </li>`).join('')}</ol>`,
});

/* ── 06 · Dúvidas ─────────────────────────────────────────── */
const duvidas = () => secao({
  id: 'duvidas', classe: 'duvidas', tom: 'creme',
  conteudo: `<div class="duvidas__grade">${cabeca(DUVIDAS)}${sanfona(DUVIDAS.itens)}</div>`,
});

/* ── Chamada final ────────────────────────────────────────── */
const final = () => `<section class="final" id="contato" aria-label="Fale comigo">
  <div class="wrap final__caixa">
    <p class="rotulo surge">${esc(FINAL.etiqueta)}</p>
    <h2 class="surge"${atraso(1)}>${esc(FINAL.titulo)}</h2>
    <p class="final__texto surge"${atraso(2)}>${esc(FINAL.texto)}</p>
    <p class="surge"${atraso(3)}>${ctaWhats(linkWhats(CONTATO.orcamento), FINAL.cta, 'gg', 'claro')}</p>
    <p class="final__nota surge"${atraso(4)}>${esc(FINAL.nota)}</p>
    <p class="final__outro surge"${atraso(4)}>
      Prefere escrever? <a href="mailto:${esc(EU.email)}">${esc(EU.email)}</a>
    </p>
  </div>
</section>`;

export function paginaVitrine() {
  const corpo = [hero(), paraQuem(), projetos(), porque(), entrega(),
                 processo(), duvidas(), final()].join('\n');

  const titulo = 'Projetos para Joias & Acessórios | Sites para joalherias, ' +
                 'prataria e semijoias';
  const descricao = 'Sites sob medida para lojas de prata, joalherias, semijoias, ' +
    'acessórios e marcas de moda. Veja três projetos completos e peça o seu ' +
    'orçamento pelo WhatsApp.';

  return pagina({
    titulo, descricao,
    corpo,
    jsonLd: [
      {
        '@context': 'https://schema.org', '@type': 'ProfessionalService',
        name: `${EU.nome} — sites para joias e acessórios`,
        description: descricao,
        url: EU.dominio + '/',
        telephone: EU.whatsappVisivel,
        email: EU.email,
        areaServed: 'BR',
        serviceType: 'Criação de sites para joalherias, lojas de prata, ' +
                     'semijoias, acessórios e marcas de moda',
        address: { '@type': 'PostalAddress', addressLocality: EU.cidade, addressCountry: 'BR' },
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: DUVIDAS.itens.map(([p, r]) => ({
          '@type': 'Question', name: p,
          acceptedAnswer: { '@type': 'Answer', text: r },
        })),
      },
      {
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: 'Projetos para joias e acessórios',
        itemListElement: PROJETOS.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.nome,
          description: p.resumo, url: `${EU.dominio}/${p.link}`,
        })),
      },
    ],
  });
}
