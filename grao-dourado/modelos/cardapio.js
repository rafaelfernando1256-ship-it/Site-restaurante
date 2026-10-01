/* ═══════════════════════════════════════════════════════════════
   PÁGINA DO CARDÁPIO
   É a página que mais recebe visita num site de café. Por isso ela
   é separada da home: carrega mais rápido, dá para mandar o link
   direto no WhatsApp e entra no Google por conta própria.
   ═══════════════════════════════════════════════════════════════ */
import { MARCA, wa } from '../conteudo/marca.js';
import { CATEGORIAS, itensDe } from '../conteudo/cardapio.js';
import { HERO } from '../conteudo/pagina.js';
import { pagina } from './base.js';
import { botao, cabeca, cardItem, esc, icone, seloAberto } from './ui.js';

export function paginaCardapio() {
  const filtros = [
    `<button type="button" class="filtro is-ativo" data-filtro="tudo" aria-pressed="true">Tudo</button>`,
    ...CATEGORIAS.map(
      (c) => `<button type="button" class="filtro" data-filtro="${esc(c.id)}" aria-pressed="false">${esc(c.nome)}</button>`
    ),
  ].join('');

  const blocos = CATEGORIAS.map(
    (c) => `
  <section class="bloco" id="${esc(c.id)}" data-bloco="${esc(c.id)}">
    <header class="bloco__cabeca">
      <h2>${esc(c.nome)}</h2>
      <p>${esc(c.resumo)}</p>
    </header>
    <div class="grade-itens">
      ${itensDe(c.id).map((i) => cardItem(i)).join('')}
    </div>
  </section>`
  ).join('');

  const corpo = `
<section class="topo-cardapio">
  <div class="wrap">
    ${cabeca({
      etiqueta: 'Cardápio',
      titulo: 'Tudo que tem hoje, com o preço do lado',
      texto: 'Sem PDF e sem precisar dar zoom. Toque em adicionar para montar o pedido e envie pelo WhatsApp no fim.',
      nivel: 1,
    })}
    <div class="topo-cardapio__pe">
      ${seloAberto()}
      ${botao({
        href: wa(HERO.mensagemWhats),
        texto: 'Falar direto no WhatsApp',
        variante: 'whats',
        ico: icone.whats,
        externo: true,
        classe: 'btn--sm',
      })}
    </div>
  </div>
</section>

<div class="filtros" data-filtros>
  <div class="wrap filtros__trilho">${filtros}</div>
</div>

<div class="wrap">
  ${blocos}
  <p class="secao__aviso">
    Os valores são de demonstração e podem ter mudado. Confirme com a casa antes de fechar o pedido.
  </p>
</div>`;

  return pagina({
    titulo: `Cardápio · ${MARCA.nomeCompleto}`,
    descricao:
      'Cardápio completo do Grão Dourado: cafés, salgados feitos na hora, bolos de receita de família e bebidas geladas, com preço.',
    atual: 'cardapio.html',
    classe: 'p-cardapio',
    corpo,
  });
}
