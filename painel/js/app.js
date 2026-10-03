/* ------------------------------------------------------------------
   A montagem: menu, roteamento e a conferência de abertura.
   ------------------------------------------------------------------ */

import * as N from './nucleo.js';
import { AGENTES, AJUSTES, provaPix } from './agentes.js';
import { esc, recado } from './ui.js';

const TODOS = [...AGENTES, AJUSTES];

function rota() {
  const h = (location.hash || '').replace('#', '');
  return TODOS.find(a => a.id === h) ? h : 'cacador';
}

function desenhaMenu() {
  const menu = document.querySelector('#menu');
  const atual = rota();
  menu.innerHTML = `
    <div class="marca">
      <strong>${esc(N.estado.negocio.nome || 'Painel de vendas')}</strong>
      <span>8 agentes · sites para restaurante</span>
    </div>
    ${AGENTES.map(a => botao(a, atual)).join('')}
    <hr>
    ${botao(AJUSTES, atual)}`;
}

function botao(a, atual) {
  const n = a.conta ? a.conta() : 0;
  return `<button data-ir="${a.id}" class="${a.id === atual ? 'ativo' : ''}">
    <span class="passo">${a.passo || '·'}</span>
    <span>${esc(a.nome)}</span>
    ${n ? `<span class="num">${n}</span>` : '<span></span>'}
  </button>`;
}

function desenha() {
  const a = TODOS.find(x => x.id === rota());

  // Troca o elemento inteiro em vez de limpar o conteúdo. Os agentes
  // registram ouvintes delegados NELE, e ele sobrevive ao innerHTML = ''
  // — cada redesenho somava mais um ouvinte, e um clique virava dois,
  // depois três. Elemento novo nasce sem ouvinte nenhum.
  const antiga = document.querySelector('#tela');
  const tela = antiga.cloneNode(false);
  antiga.replaceWith(tela);
  desenhaMenu();
  try {
    a.render(tela);
  } catch (e) {
    console.error(e);
    tela.innerHTML = `<div class="aviso ruim"><b>Essa tela quebrou.</b><br>
      ${esc(e.message || e)}<br><br>Os seus dados estão salvos. Recarregue a
      página; se continuar, exporte o backup em Ajustes e me mande.</div>`;
  }
  tela.scrollIntoView({ block: 'start' });
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-ir]');
  if (!b) return;
  location.hash = b.dataset.ir;
});

window.addEventListener('hashchange', desenha);

/* O menu mostra contadores que mudam quando o agente mexe no estado.
   Redesenhar só o menu é barato e evita perder o que está digitado. */
const vigia = setInterval(desenhaMenu, 1500);
window.addEventListener('beforeunload', () => clearInterval(vigia));

/* Conferência de abertura: se o gerador de Pix estiver errado, é melhor
   saber agora do que na frente do cliente. */
const falhas = provaPix();
if (falhas.length) {
  document.body.prepend(Object.assign(document.createElement('div'), {
    className: 'aviso ruim',
    style: 'margin:12px',
    innerHTML: '<b>O gerador de Pix não passou na própria prova.</b><br>' +
               esc(falhas.join('; ')) + '<br>Não use as cobranças até isso ser corrigido.',
  }));
}

if (!N.estado.negocio.nome && !N.estado.leads.length) location.hash = 'ajustes';
desenha();

// Primeira visita: um empurrão, uma vez só.
if (!localStorage.getItem('painel-apresentado')) {
  localStorage.setItem('painel-apresentado', '1');
  setTimeout(() => recado('Comece por Ajustes: seu nome, cidade e chave Pix.'), 700);
}
