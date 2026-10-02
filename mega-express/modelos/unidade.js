/* ═══════════════════════════════════════════════════════════════
   PÁGINA DE UMA UNIDADE
   Cada unidade tem a sua: é o link que a recepção manda no
   WhatsApp, e é o que o Google precisa para entender que são dois
   endereços e não um. Ela também diz o que a unidade NÃO tem — a
   omissão é o que vira reclamação no balcão.
   ═══════════════════════════════════════════════════════════════ */
import { MARCA, UNIDADES, COMODIDADES, wa } from '../conteudo/marca.js';
import { avaliacoesDe } from '../conteudo/avaliacoes.js';
import { pagina, faixaGolpe } from './base.js';
import { botao, cabeca, cardAvaliacao, esc, icone, imagem, listaComodidades } from './ui.js';

export function paginaUnidade(u) {
  const outra = UNIDADES.find((o) => o.slug !== u.slug);
  const avals = avaliacoesDe(u.slug).slice(0, 6);
  const msg = `Oi! Vim pelo site e queria reservar no ${u.nome}.\n\nEntrada: \nSaída: \nPessoas: `;

  /* O que esta unidade NÃO tem, dito na cara. Um hóspede que
     descobre no balcão que não há café da manhã escreve isso na
     avaliação; um que leu antes, não. */
  const naoTem = [];
  if (!u.cafeDaManha) naoTem.push({
    o: 'Café da manhã', q: `Não é servido nesta unidade. Fica numa praça com várias opções a poucos passos — e o ${outra.nome} serve.`,
  });
  if (!u.piscina) naoTem.push({
    o: 'Piscina', q: `Esta unidade não tem. A piscina fica no ${outra.nome}.`,
  });

  const corpo = `
<section class="capa">
  <div class="capa__fundo" aria-hidden="true">${imagem(u, { raiz: '../', alt: '', lazy: false })}</div>
  <div class="wrap capa__corpo">
    <p class="migalhas"><a href="../index.html">Início</a> <span aria-hidden="true">›</span> ${esc(u.nome)}</p>
    ${cabeca({
      etiqueta: `${MARCA.cidade} · ${u.apelido}`,
      titulo: esc(u.nome),
      texto: u.chamada,
      nivel: 1,
      classe: 'cabeca--claro',
    })}
    <div class="capa__acoes">
      ${botao({ href: wa(u.telefone, msg), texto: `Reservar · ${u.telefoneVisivel}`,
                variante: 'whats', ico: icone.whats, externo: true, classe: 'btn--lg' })}
    </div>
  </div>
</section>

<section class="secao">
  <div class="wrap uni-sobre">
    <div>
      <h2 class="t-sec">A unidade</h2>
      <p class="uni-sobre__texto">${esc(u.resumo)}</p>
      <p class="uni-sobre__paraquem">${esc(u.paraQuem)}</p>
      <ul class="uni__pontos uni__pontos--grande">
        ${u.destaques.map((d) => `<li><b>${esc(d.titulo)}</b><small>${esc(d.texto)}</small></li>`).join('')}
      </ul>
    </div>
    <div class="uni-sobre__comods">
      <h2 class="t-sec">O que tem</h2>
      ${listaComodidades(u.comodidades)}
      ${naoTem.length ? `
      <div class="naotem">
        <h3>O que esta unidade não tem</h3>
        <ul>${naoTem.map((n) => `<li><b>${esc(n.o)}.</b> ${esc(n.q)}</li>`).join('')}</ul>
      </div>` : ''}
    </div>
  </div>
</section>

<section class="secao secao--clara">
  <div class="wrap">
    ${cabeca({ etiqueta: 'Fotos', titulo: `Por dentro do ${esc(u.nome)}` })}
    <div class="galeria">
      ${u.galeria.map((f) => imagem(f, { raiz: '../', alt: `${u.nome}` })).join('')}
    </div>
  </div>
</section>

${avals.length ? `
<section class="secao">
  <div class="wrap">
    ${cabeca({
      etiqueta: 'Quem já ficou',
      titulo: 'Avaliações de hóspedes',
      texto: 'Publicadas no Google e no TripAdvisor, reproduzidas como foram escritas.',
    })}
    <div class="avals">${avals.map((a) => cardAvaliacao(a)).join('')}</div>
  </div>
</section>` : ''}

<section class="secao secao--escura">
  <div class="wrap outra">
    <div>
      <p class="outra__etiqueta">Pensando na outra?</p>
      <h2>${esc(outra.nome)} — ${esc(outra.chamada)}</h2>
      <p>${esc(outra.resumo)}</p>
    </div>
    <div class="outra__acoes">
      ${botao({ href: `${outra.slug}.html`, texto: `Ver o ${outra.nome}`, variante: 'claro', ico: icone.seta })}
    </div>
  </div>
</section>

${faixaGolpe()}

<section class="fecha">
  <div class="wrap fecha__corpo">
    <h2>Reservar no ${esc(u.nome)}</h2>
    <p>Mande as suas datas pelo WhatsApp desta unidade. A gente confirma a disponibilidade e o valor.</p>
    <div class="fecha__botoes">
      ${botao({ href: wa(u.telefone, msg), texto: u.telefoneVisivel,
                variante: 'whats', ico: icone.whats, externo: true, classe: 'btn--lg' })}
    </div>
  </div>
</section>`;

  return pagina({
    titulo: `${u.nome} · ${MARCA.nome} em São Raimundo Nonato`,
    descricao: `${u.chamada}. ${u.resumo}`,
    atual: `unidade/${u.slug}.html`,
    raiz: '../',
    classe: 'p-unidade',
    corpo,
  });
}
