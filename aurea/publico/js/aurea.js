/* ═══════════════════════════════════════════════════════════════
   AUREA — comportamento.
   Baunilha pura, sem dependências. Quatro coisas apenas:
   menu do celular, revelação ao rolar, sanfona do FAQ e a galeria
   da página de peça. Tudo opcional: sem JavaScript a página inteira
   continua legível e navegável.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Cabeçalho e menu ───────────────────────────────────────── */
  var topo = $('.topo');
  var nav = $('#nav');
  var btnMenu = $('#abrirMenu');

  if (topo) {
    var acima = null;
    window.addEventListener('scroll', function () {
      var desceu = window.pageYOffset > 8;
      if (desceu !== acima) { topo.classList.toggle('desceu', desceu); acima = desceu; }
    }, { passive: true });
  }

  function fecharMenu() {
    if (!nav) return;
    nav.classList.remove('aberto');
    btnMenu.setAttribute('aria-expanded', 'false');
  }

  if (btnMenu && nav) {
    btnMenu.addEventListener('click', function () {
      var aberto = nav.classList.toggle('aberto');
      btnMenu.setAttribute('aria-expanded', String(aberto));
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', fecharMenu); });
    document.addEventListener('click', function (ev) {
      if (!nav.classList.contains('aberto')) return;
      if (nav.contains(ev.target) || btnMenu.contains(ev.target)) return;
      fecharMenu();
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && nav.classList.contains('aberto')) { fecharMenu(); btnMenu.focus(); }
    });
  }

  /* ── Revelação ao rolar ─────────────────────────────────────── */
  var alvos = $$('.revelar').concat($$('.filete'));

  if (calmo || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('revelado'); });
  } else {
    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('revelado');
        olho.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    alvos.forEach(function (el) { olho.observe(el); });
  }

  /* ── Sanfona ────────────────────────────────────────────────── */
  $$('.sanfona__item').forEach(function (item) {
    var botao = $('button', item);
    var resposta = $('.sanfona__resposta', item);
    if (!botao || !resposta) return;

    if (botao.getAttribute('aria-expanded') === 'true') resposta.style.height = 'auto';

    botao.addEventListener('click', function () {
      var aberto = botao.getAttribute('aria-expanded') === 'true';
      botao.setAttribute('aria-expanded', String(!aberto));

      if (aberto) {
        resposta.style.height = resposta.scrollHeight + 'px';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { resposta.style.height = '0px'; });
        });
      } else {
        resposta.style.height = resposta.scrollHeight + 'px';
        resposta.addEventListener('transitionend', function solto(ev) {
          if (ev.propertyName !== 'height') return;
          resposta.style.height = 'auto';
          resposta.removeEventListener('transitionend', solto);
        });
      }
    });
  });

  /* ── Galeria da peça ────────────────────────────────────────── */
  var miniaturas = $$('.miniatura');
  var fotos = $$('.galeria__foto');

  function mostrar(i) {
    fotos.forEach(function (f, j) {
      f.hidden = j !== i;
      f.classList.toggle('ativa', j === i);
    });
    miniaturas.forEach(function (m, j) {
      m.classList.toggle('ativa', j === i);
      m.setAttribute('aria-selected', String(j === i));
      m.tabIndex = j === i ? 0 : -1;
    });
  }

  miniaturas.forEach(function (m, i) {
    m.addEventListener('click', function () { mostrar(i); });
  });

  /* Setas percorrem as vistas, como manda o padrão de abas. */
  if (miniaturas.length) {
    $('.galeria__miniaturas').addEventListener('keydown', function (ev) {
      var passos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      var passo = passos[ev.key];
      if (!passo) return;
      ev.preventDefault();
      var atual = miniaturas.indexOf(document.activeElement);
      if (atual === -1) return;
      var proximo = (atual + passo + miniaturas.length) % miniaturas.length;
      mostrar(proximo);
      miniaturas[proximo].focus();
    });
  }
})();
