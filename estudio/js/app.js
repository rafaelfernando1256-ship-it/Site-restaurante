/* ------------------------------------------------------------------
   O ESTÚDIO — a tela.

   Um fluxo só, de cima para baixo: tema → roteiro → quadros → baixar.
   Sem menu, sem abas: no celular, menu é mais um toque entre você e o
   vídeo, e este site existe para você postar todo dia.
   ------------------------------------------------------------------ */

import * as Acervo from './acervo.js';
import * as IA from './ia.js';
import * as Quadro from './quadro.js';
import { GATILHOS, ROTEIRO } from './instrucao.js';
import { problemas } from './gatilhos.js';

const CHAVE_GUARDADA = 'estudio-v1';

const E = {
  chaves: { groq: '', gemini: '', openrouter: '', modelo: '', provedor: '',
            pixabay: '', unsplash: '' },
  tema: '', biotipo: '', roteiro: null, achados: [],
  fundos: [],        // {url|File|null} por quadro
};

/* ── guardar ─────────────────────────────────────────────────────── */
function carrega() {
  try {
    const d = JSON.parse(localStorage.getItem(CHAVE_GUARDADA) || '{}');
    Object.assign(E.chaves, d.chaves || {});
    E.tema = d.tema || '';
    E.biotipo = d.biotipo || '';
  } catch { /* primeira vez, ou armazenamento bloqueado */ }
}
function salva() {
  try {
    localStorage.setItem(CHAVE_GUARDADA, JSON.stringify(
      { chaves: E.chaves, tema: E.tema, biotipo: E.biotipo }));
  } catch { /* janela anônima: funciona, só não lembra */ }
}

/* ── utilidades de tela ──────────────────────────────────────────── */
const $ = s => document.querySelector(s);
const escapa = t => String(t).replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function recado(texto, tipo = 'ok') {
  const el = $('#recado');
  el.className = `recado ${tipo}`;
  el.textContent = texto;
  el.hidden = !texto;
}

function ocupado(ligado, texto = '') {
  $('#escrever').disabled = ligado;
  $('#escrever').textContent = ligado ? (texto || 'escrevendo…') : 'Escrever roteiro';
}

/* ── o roteiro ───────────────────────────────────────────────────── */
async function escrever() {
  E.tema = $('#tema').value.trim();
  E.biotipo = $('#biotipo').value;
  salva();
  if (!E.tema) return recado('escreva o tema do vídeo', 'ruim');
  if (!IA.temChave(E.chaves)) {
    return recado(`falta a chave do ${IA.nomeDoProvedor(E.chaves)} em Ajustes`,
                  'ruim');
  }
  ocupado(true);
  recado('');
  try {
    // A mesma instrução do terminal, e o mesmo laço de segunda chance.
    const r = await IA.roteiro(E.tema, E.biotipo, E.chaves,
                               `${ROTEIRO}\n\n${GATILHOS}`);
    E.roteiro = r.roteiro;
    E.achados = r.achados;
    E.fundos = new Array(falas().length).fill(null);
    desenhaRoteiro();
    recado(E.achados.length
      ? `roteiro pronto, mas ${E.achados.length} ponto(s) ainda torto(s)`
      : 'roteiro pronto', E.achados.length ? 'aviso' : 'ok');
  } catch (e) {
    recado(e.message, 'ruim');
  } finally {
    ocupado(false);
  }
}

function falas() {
  if (!E.roteiro) return [];
  return [E.roteiro.gancho, ...E.roteiro.quadros.map(q => q.fala),
          E.roteiro.fechamento];
}
function buscas() {
  if (!E.roteiro) return [];
  const qs = E.roteiro.quadros;
  const primeira = qs[0]?.busca || 'dark gym';
  return [primeira, ...qs.map(q => q.busca),
          qs[qs.length - 1]?.busca || primeira];
}

function desenhaRoteiro() {
  const alvo = $('#roteiro');
  if (!E.roteiro) { alvo.innerHTML = ''; return; }
  const r = E.roteiro;

  alvo.innerHTML = `
    ${r.diagnostico ? `<p class="diagnostico">${escapa(r.diagnostico)}</p>` : ''}
    ${E.achados.length ? `
      <div class="achados">
        <b>Ainda torto</b>
        <ul>${E.achados.map(a => `<li>${escapa(a)}</li>`).join('')}</ul>
        <p class="ajuda">A segunda tentativa não limpou. Edite a frase à mão
        abaixo — o quadro redesenha sozinho.</p>
      </div>` : ''}
    ${r.aposta ? `<p class="aposta"><b>Aposta</b> ${escapa(r.aposta)}</p>` : ''}
    <div class="quadros">
      ${falas().map((fala, i) => `
        <div class="quadro" data-i="${i}">
          <div class="tela"><canvas data-canvas="${i}"></canvas></div>
          <textarea data-fala="${i}" rows="3">${escapa(fala)}</textarea>
          <div class="linha-bt">
            <button class="bt fraco" data-buscar="${i}">buscar imagem</button>
            <label class="bt fraco">
              foto do celular
              <input type="file" accept="image/*" data-arquivo="${i}" hidden>
            </label>
            <button class="bt fraco" data-limpar="${i}">só preto</button>
          </div>
          <p class="busca">${escapa(buscas()[i] || '')}</p>
        </div>`).join('')}
    </div>
    <div class="linha-bt rodape">
      <button class="bt" data-fazer="baixar">Baixar os quadros</button>
      <button class="bt fraco" data-fazer="legenda">Copiar a legenda</button>
    </div>`;

  falas().forEach((_, i) => redesenha(i));
}

/* ── os quadros ──────────────────────────────────────────────────── */
async function redesenha(i) {
  const canvas = document.querySelector(`[data-canvas="${i}"]`);
  if (!canvas) return;
  const texto = document.querySelector(`[data-fala="${i}"]`)?.value ?? '';
  const total = falas().length;
  // Com imagem o texto sobe e deixa a foto respirar; sem imagem ele
  // centraliza, senão sobra 60% de preto e lê como erro de carregamento.
  const fundo = E.fundos[i];
  const posicao = (!fundo || i === 0 || i === total - 1) ? 'meio' : 'alto';
  // Gancho e fechamento em CAIXA ALTA: são os dois que precisam ser lidos
  // de relance — um para parar o dedo, o outro para dizer o que fazer.
  Quadro.desenha(canvas, { imagem: fundo, texto, posicao,
                           caixaAlta: i === 0 || i === total - 1 });
}

async function buscarImagem(i) {
  const termo = buscas()[i];
  recado(`procurando "${termo}"…`);
  try {
    const achadas = await Acervo.busca(termo, 1, E.chaves);
    if (!achadas.length) return recado('nada achado para esse termo', 'aviso');
    E.fundos[i] = await Quadro.carrega(achadas[0].url);
    E.fundos[i].dataset.credito =
      `${achadas[0].autor} · ${achadas[0].fonte}`;
    await redesenha(i);
    recado('');
  } catch (e) {
    recado(e.message, 'ruim');
  }
}

function fotoDoCelular(i, arquivo) {
  const url = URL.createObjectURL(arquivo);
  const img = new Image();
  img.onload = () => { E.fundos[i] = img; redesenha(i); URL.revokeObjectURL(url); };
  img.src = url;     // arquivo local: mesma origem, nunca contamina
}

/* ── baixar ──────────────────────────────────────────────────────── */
async function baixar() {
  const total = falas().length;
  let contaminados = 0;
  for (let i = 0; i < total; i++) {
    const canvas = document.querySelector(`[data-canvas="${i}"]`);
    const blob = await Quadro.paraBlob(canvas);
    if (!blob) { contaminados++; continue; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${String(i).padStart(2, '0')}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    await new Promise(r => setTimeout(r, 120));   // o navegador engasga sem isto
  }
  if (contaminados) {
    recado(`${contaminados} quadro(s) não puderam ser baixados: o servidor `
      + 'da foto não libera leitura. Use a foto do celular nesses — ela '
      + 'sempre baixa.', 'aviso');
  } else {
    recado(`${total} quadros baixados. Monte no CapCut na ordem do nome.`);
  }
}

async function copiarLegenda() {
  const t = E.roteiro?.legenda_post || '';
  try {
    await navigator.clipboard.writeText(t);
    recado('legenda copiada');
  } catch {
    recado('não consegui copiar — selecione e copie: ' + t, 'aviso');
  }
}

/* ── ajustes ─────────────────────────────────────────────────────── */
function abreAjustes() {
  const d = $('#ajustes');
  d.querySelectorAll('input[name]').forEach(i => {
    i.value = E.chaves[i.name] || '';
  });
  d.querySelector('select[name=provedor]').value = E.chaves.provedor || '';
  d.showModal();
}

/* ── ligar ───────────────────────────────────────────────────────── */
function liga() {
  carrega();
  $('#tema').value = E.tema;
  $('#biotipo').value = E.biotipo;

  $('#escrever').addEventListener('click', escrever);
  $('#abrir-ajustes').addEventListener('click', abreAjustes);

  $('#ajustes').addEventListener('input', e => {
    const campo = e.target.name;
    if (campo) { E.chaves[campo] = e.target.value.trim(); salva(); }
  });
  $('#ajustes').addEventListener('change', e => {
    if (e.target.name === 'provedor') { E.chaves.provedor = e.target.value; salva(); }
  });

  // Um ouvinte só, delegado no documento: redesenhar a lista a cada
  // roteiro novo apagaria ouvintes presos nos quadros, e empilhar
  // ouvintes é o defeito que já custou cobrança dupla no outro painel.
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-buscar]');
    if (b) return buscarImagem(Number(b.dataset.buscar));
    const l = e.target.closest('[data-limpar]');
    if (l) { E.fundos[Number(l.dataset.limpar)] = null;
             return redesenha(Number(l.dataset.limpar)); }
    const f = e.target.closest('[data-fazer]');
    if (f?.dataset.fazer === 'baixar') return baixar();
    if (f?.dataset.fazer === 'legenda') return copiarLegenda();
  });
  document.addEventListener('input', e => {
    const t = e.target.closest('[data-fala]');
    if (t) redesenha(Number(t.dataset.fala));
  });
  document.addEventListener('change', e => {
    const a = e.target.closest('[data-arquivo]');
    if (a?.files?.[0]) fotoDoCelular(Number(a.dataset.arquivo), a.files[0]);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', liga);
} else {
  liga();
}

export { E, escapa, falas, problemas };
