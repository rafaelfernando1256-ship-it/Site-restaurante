/** AUREA — montagem da home a partir do conteúdo e dos componentes. */
import { MARCA, HERO, SECOES, FAQ, INSTAGRAM, linkWhats, consultaPeca, CONSULTA_GERAL }
  from '../conteudo/site.js';
import { CATEGORIAS, COLECOES, PECAS, destaques, pecasDaCategoria, pecasDaColecao }
  from '../conteudo/produtos.js';
import { esc, atraso, botao, botaoConsulta, filete, cabecaSecao, secao,
         cartaoPeca, sanfona, figura, moeda } from './ui.js';
import { pagina, jsonLdMarca } from './base.js';

const nomeColecao = (id) => (COLECOES.find((c) => c.id === id) || {}).nome;

/* ── Hero ─────────────────────────────────────────────────── */
const hero = () => `<section class="hero" aria-label="Apresentação">
  <div class="wrap hero__grade">
    <div class="hero__texto">
      <p class="rotulo revelar">${esc(HERO.sobretitulo)}</p>
      <h1 class="revelar"${atraso(1)}>${esc(HERO.titulo)}</h1>
      <p class="hero__apoio revelar"${atraso(2)}>${esc(HERO.texto)}</p>
      <div class="hero__acoes revelar"${atraso(3)}>
        ${botao({ texto: HERO.cta, href: '#destaque', variante: 'claro', tamanho: 'gg' })}
        ${botaoConsulta(linkWhats(CONSULTA_GERAL), HERO.ctaSecundario, 'linha', 'gg')}
      </div>
      <ul class="hero__selos revelar"${atraso(4)}>
        ${HERO.selos.map(([n, t]) =>
          `<li><strong>${esc(n)}</strong><span>${esc(t)}</span></li>`).join('')}
      </ul>
    </div>
    ${figura({ src: 'hero.svg', largura: 1800, altura: 1100, prioridade: true, classe: 'hero__foto',
      lado: 'direita',
      alt: 'Anel Solstício em ouro amarelo 18k com diamante central, sobre fundo escuro' })}
  </div>
  ${filete('filete--hero')}
</section>`;

/* ── 01 · Coleção em destaque ─────────────────────────────── */
const emDestaque = () => secao({
  id: 'destaque', tom: 'breu', classe: 'destaque',
  conteudo: cabecaSecao(SECOES.destaque) +
    `<div class="grade-pecas">${destaques().map((p, i) =>
      cartaoPeca(p, { consulta: consultaPeca(p), colecao: nomeColecao(p.colecao), i })).join('')}</div>`,
});

/* ── 02 a 05 · Uma faixa editorial por categoria ──────────── */
function faixaCategoria(cat, indice, invertida) {
  const pecas = pecasDaCategoria(cat.id);
  return secao({
    id: cat.id, tom: invertida ? 'noite' : 'breu',
    classe: `categoria ${invertida ? 'categoria--invertida' : ''}`,
    conteudo: `<div class="categoria__grade">
      <div class="categoria__capa">
        ${figura({ src: cat.capa, alt: `${cat.titulo} da AUREA`, largura: 1000, altura: 1200,
                   lado: invertida ? 'direita' : 'esquerda' })}
      </div>
      <div class="categoria__corpo">
        ${cabecaSecao({ indice, etiqueta: cat.nome, titulo: cat.titulo, texto: cat.linha })}
        <div class="categoria__pecas">${pecas.map((p, i) =>
          cartaoPeca(p, { consulta: consultaPeca(p), colecao: nomeColecao(p.colecao), i, compacto: true })
        ).join('')}</div>
      </div>
    </div>`,
  });
}

/* ── 06 · Coleções especiais ──────────────────────────────── */
const colecoes = () => secao({
  id: 'colecoes', tom: 'breu', classe: 'colecoes',
  conteudo: cabecaSecao(SECOES.colecoes) +
    `<ul class="colecoes__lista">${COLECOES.map((c, i) => {
      const n = pecasDaColecao(c.id).length;
      return `<li class="colecao revelar"${atraso(i, 0.08)}>
        <span class="colecao__foto">
          <img src="assets/${c.capa}" alt="Coleção ${esc(c.nome)}" width="1000" height="1200"
               loading="lazy" decoding="async">
        </span>
        <div class="colecao__corpo">
          <p class="colecao__ano">${esc(c.ano)}</p>
          <h3>${esc(c.nome)}</h3>
          <p class="colecao__texto">${esc(c.texto)}</p>
          <p class="colecao__n">${n} ${n === 1 ? 'peça' : 'peças'} nesta linha</p>
        </div>
      </li>`;
    }).join('')}</ul>`,
});

/* ── 07 · História da marca ───────────────────────────────── */
const historia = () => secao({
  id: 'marca', tom: 'noite', classe: 'historia',
  conteudo: `<div class="historia__grade">
    ${figura({ src: 'ed-atelie.svg', alt: 'Peças em acabamento na bancada do ateliê AUREA',
               largura: 1100, altura: 1200, lado: 'esquerda', classe: 'historia__foto' })}
    <div class="historia__texto">
      ${cabecaSecao(SECOES.historia)}
      ${SECOES.historia.paragrafos.map((p, i) =>
        `<p class="revelar"${atraso(i + 3)}>${esc(p)}</p>`).join('')}
      <ol class="marcos">${SECOES.historia.marcos.map(([ano, texto], i) =>
        `<li class="revelar"${atraso(i, 0.05)}>
          <span class="marcos__ano">${esc(ano)}</span>
          <span class="marcos__texto">${esc(texto)}</span>
        </li>`).join('')}</ol>
    </div>
  </div>`,
});

/* ── 08 · Qualidade e autenticidade ───────────────────────── */
const qualidade = () => secao({
  id: 'qualidade', tom: 'breu', classe: 'qualidade',
  conteudo: `<div class="qualidade__grade">
    <div class="qualidade__texto">
      ${cabecaSecao(SECOES.qualidade)}
      <ol class="garantias">${SECOES.qualidade.itens.map(([t, d], i) =>
        `<li class="revelar"${atraso(i, 0.05)}>
          <span class="garantias__n">${String(i + 1).padStart(2, '0')}</span>
          <div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>
        </li>`).join('')}</ol>
    </div>
    ${figura({ src: 'ed-certificado.svg', alt: 'Lupa de ourives sobre um diamante',
               largura: 1120, altura: 1240, lado: 'direita', classe: 'qualidade__foto' })}
  </div>`,
});

/* ── 09 · Atendimento personalizado ───────────────────────── */
const atendimento = () => secao({
  id: 'atendimento', tom: 'noite', classe: 'atendimento',
  conteudo: `<div class="atendimento__grade">
    ${figura({ src: 'ed-atendimento.svg', alt: 'Duas joias apresentadas lado a lado',
               largura: 1120, altura: 1240, lado: 'esquerda', classe: 'atendimento__foto' })}
    <div class="atendimento__texto">
      ${cabecaSecao(SECOES.atendimento)}
      ${SECOES.atendimento.paragrafos.map((p, i) =>
        `<p class="revelar"${atraso(i + 3)}>${esc(p)}</p>`).join('')}
      <ol class="etapas">${SECOES.atendimento.etapas.map(([n, t, d], i) =>
        `<li class="revelar"${atraso(i, 0.05)}>
          <span class="etapas__n">${esc(n)}</span>
          <div><h3>${esc(t)}</h3><p>${esc(d)}</p></div>
        </li>`).join('')}</ol>
      <p class="aviso-canal revelar">${esc(SECOES.atendimento.nota)}</p>
      <p class="revelar">${botaoConsulta(linkWhats(CONSULTA_GERAL), 'Começar pelo WhatsApp', 'ouro')}</p>
    </div>
  </div>`,
});

/* ── 10 · Instagram ───────────────────────────────────────── */
const instagram = () => secao({
  id: 'instagram', tom: 'breu', classe: 'insta',
  conteudo: cabecaSecao({ ...SECOES.instagram, centro: true }) +
    `<ul class="insta__grade">${INSTAGRAM.map(([src, alt], i) =>
      `<li class="revelar"${atraso(i, 0.04)}><a href="#" aria-label="Publicação no Instagram: ${esc(alt)}">
        <img src="assets/${src}" alt="${esc(alt)}" width="1000" height="1000" loading="lazy" decoding="async">
      </a></li>`).join('')}</ul>
    <p class="insta__cta revelar">${botao({ texto: SECOES.instagram.cta, href: '#', variante: 'linha' })}</p>`,
});

/* ── 11 · FAQ ─────────────────────────────────────────────── */
const faq = () => secao({
  id: 'faq', tom: 'noite', classe: 'faq',
  conteudo: `<div class="faq__grade">
    ${cabecaSecao(SECOES.faq)}
    ${sanfona(FAQ)}
  </div>`,
});

/* ── 12 · Chamada final ───────────────────────────────────── */
export const chamadaFinal = () => `<section class="final" aria-label="Fale com a AUREA">
  <div class="wrap final__caixa">
    ${filete()}
    <p class="rotulo revelar">${esc(SECOES.final.etiqueta)}</p>
    <h2 class="revelar"${atraso(1)}>${esc(SECOES.final.titulo)}</h2>
    <p class="final__texto revelar"${atraso(2)}>${esc(SECOES.final.texto)}</p>
    <p class="revelar"${atraso(3)}>${botaoConsulta(linkWhats(CONSULTA_GERAL), SECOES.final.cta, 'ouro', 'gg')}</p>
    <p class="final__nota revelar"${atraso(4)}>Atendimento e consulta. Nenhum pagamento é processado pelo site.</p>
  </div>
</section>`;

/* ── Página ───────────────────────────────────────────────── */
export function paginaHome() {
  const corpo = [
    hero(),
    emDestaque(),
    ...CATEGORIAS.map((c, i) => faixaCategoria(c, String(i + 2).padStart(2, '0'), i % 2 === 1)),
    colecoes(),
    historia(),
    qualidade(),
    atendimento(),
    instagram(),
    faq(),
    chamadaFinal(),
  ].join('\n');

  return pagina({
    titulo: `${MARCA.nome} | Alta joalheria autoral em ouro 18k`,
    descricao: 'Anéis, colares, brincos e pulseiras em ouro 18k com pedras ' +
      'certificadas. Peças autorais feitas à mão, com atendimento por WhatsApp ' +
      'e visita ao ateliê com hora marcada.',
    caminho: '', raiz: '', atual: 'home', corpo,
    jsonLd: [
      jsonLdMarca,
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: FAQ.map(([p, r]) => ({
          '@type': 'Question', name: p,
          acceptedAnswer: { '@type': 'Answer', text: r },
        })),
      },
      {
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: 'Coleção AUREA',
        itemListElement: PECAS.map((p, i) => ({
          '@type': 'ListItem', position: i + 1, name: p.nome,
          url: `${MARCA.dominio}/pecas/${p.slug}.html`,
        })),
      },
    ],
  });
}
