/* ═══════════════════════════════════════════════════════════════
   PÁGINA DO DESTINO

   Hotel de cidade pequena não concorre por "hotel em São Raimundo
   Nonato": concorre pela pessoa que está pesquisando a Serra da
   Capivara e ainda não decidiu onde dormir. Por isso o destino tem
   página própria — e é ela que o Google tem mais chance de achar.
   ═══════════════════════════════════════════════════════════════ */
import { MARCA, UNIDADES, wa } from '../conteudo/marca.js';
import { REGIAO, ATRACOES, PAISAGENS } from '../conteudo/regiao.js';
import { pagina } from './base.js';
import { botao, cabeca, esc, icone, imagem } from './ui.js';

export function paginaRegiao() {
  const corpo = `
<section class="capa capa--alta">
  <div class="capa__fundo" aria-hidden="true">
    ${imagem('rupestre', { alt: '', lazy: false })}
  </div>
  <div class="wrap capa__corpo">
    <p class="migalhas"><a href="index.html">Início</a> <span aria-hidden="true">›</span> Serra da Capivara</p>
    ${cabeca({
      etiqueta: REGIAO.etiqueta,
      titulo: REGIAO.titulo,
      texto: REGIAO.texto,
      nivel: 1,
      classe: 'cabeca--claro',
    })}
  </div>
</section>

<section class="secao">
  <div class="wrap">
    ${cabeca({ etiqueta: 'O que ver', titulo: 'Seis motivos para pegar a estrada' })}
    <div class="atracoes">
      ${ATRACOES.map((a) => `
      <article class="atracao">
        ${imagem(a, { alt: a.nome })}
        <div class="atracao__corpo">
          <h3>${esc(a.nome)}</h3>
          <p class="atracao__resumo">${esc(a.resumo)}</p>
          <p class="atracao__detalhe">${icone.pino} ${esc(a.detalhe)}</p>
          <p class="atracao__dica"><b>Dica:</b> ${esc(a.dica)}</p>
        </div>
      </article>`).join('')}
    </div>
    <p class="secao__aviso">
      Distâncias, horários e regras de visitação mudam. Confirme com a recepção
      ou com a administração do parque antes de sair.
    </p>
  </div>
</section>

<section class="secao secao--escura">
  <div class="wrap">
    ${cabeca({ etiqueta: 'A paisagem', titulo: 'O que você vai ver', classe: 'cabeca--claro' })}
    <div class="galeria galeria--larga">
      ${PAISAGENS.map((p) => imagem(p, { alt: p.alt })).join('')}
    </div>
  </div>
</section>

<section class="secao secao--clara">
  <div class="wrap">
    ${cabeca({
      etiqueta: 'Onde ficar',
      titulo: 'A gente fica nos dois pontos que importam',
      texto: 'Uma unidade no centro, para quem quer resolver tudo a pé. Outra no acesso ao parque, com piscina e café da manhã, para quem volta da trilha.',
    })}
    <div class="duas">
      ${UNIDADES.map((u) => `
      <article class="uni">
        <a class="uni__foto" href="unidade/${esc(u.slug)}.html" aria-label="Ver o ${esc(u.nome)}">
          ${imagem(u, { alt: u.nome })}
          <span class="uni__tarja">${esc(u.apelido)}</span>
        </a>
        <div class="uni__corpo">
          <h3>${esc(u.nome)}</h3>
          <p class="uni__chamada">${esc(u.chamada)}</p>
          <p class="uni__paraquem">${esc(u.paraQuem)}</p>
          <div class="uni__acoes">
            ${botao({ href: `unidade/${u.slug}.html`, texto: 'Ver a unidade', variante: 'linha' })}
            ${botao({
              href: wa(u.telefone, `Oi! Vim pelo site e queria reservar no ${u.nome}.`),
              texto: u.telefoneVisivel, variante: 'whats', ico: icone.whats, externo: true,
            })}
          </div>
        </div>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="fecha">
  <div class="wrap fecha__corpo">
    <h2>Vai subir a serra?</h2>
    <p>Mande as suas datas. A gente confirma a hospedagem e ajuda com o guia para o parque.</p>
    <div class="fecha__botoes">
      ${botao({ href: 'index.html#reservar', texto: 'Fazer a reserva', variante: 'claro', ico: icone.seta })}
    </div>
  </div>
</section>`;

  return pagina({
    titulo: `Serra da Capivara · onde ficar em São Raimundo Nonato | ${MARCA.nome}`,
    descricao:
      'O que ver no Parque Nacional Serra da Capivara: Pedra Furada, pinturas rupestres, boqueirões e o Museu do Homem Americano — e onde se hospedar em São Raimundo Nonato.',
    atual: 'serra-da-capivara.html',
    classe: 'p-regiao',
    corpo,
  });
}
