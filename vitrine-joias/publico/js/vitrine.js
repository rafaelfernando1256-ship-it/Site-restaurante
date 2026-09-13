/* ═══════════════════════════════════════════════════════════════
   Projetos para Joias & Acessórios — comportamento.
   Baunilha pura. Três coisas: sombra do topo, sanfona das dúvidas e
   revelação ao rolar. Sem JavaScript a página continua inteira.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Topo e barra fixa ──────────────────────────────────────── */
  var topo = $('.topo');
  var barra = $('#barraFixa');
  var final = $('.final');
  var antes = null;

  function aoRolar() {
    var y = window.pageYOffset;
    var desceu = y > 8;
    if (desceu !== antes) { topo.classList.toggle('desceu', desceu); antes = desceu; }

    /* A barra só aparece depois que o visitante passou do hero, e some
       ao chegar na chamada final — ali o CTA grande já está na tela e
       duas chamadas competindo atrapalham em vez de ajudar. */
    if (barra) {
      var passouHero = y > window.innerHeight * 0.6;
      var noFim = final && final.getBoundingClientRect().top < window.innerHeight * 0.9;
      barra.classList.toggle('vis', passouHero && !noFim);
    }
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  window.addEventListener('resize', aoRolar, { passive: true });
  aoRolar();

  /* ── Sanfona ────────────────────────────────────────────────── */
  $$('.sanfona__item').forEach(function (item) {
    var b = $('button', item), r = $('.sanfona__resposta', item);
    if (!b || !r) return;
    if (b.getAttribute('aria-expanded') === 'true') r.style.height = 'auto';

    b.addEventListener('click', function () {
      var aberto = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(!aberto));
      if (aberto) {
        r.style.height = r.scrollHeight + 'px';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { r.style.height = '0px'; });
        });
      } else {
        r.style.height = r.scrollHeight + 'px';
        r.addEventListener('transitionend', function solto(ev) {
          if (ev.propertyName !== 'height') return;
          r.style.height = 'auto';
          r.removeEventListener('transitionend', solto);
        });
      }
    });
  });

  /* ── Revelação ──────────────────────────────────────────────── */
  var alvos = $$('.surge');
  if (calmo || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('visto'); });
  } else {
    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visto');
        olho.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    alvos.forEach(function (el) { olho.observe(el); });
  }
})();
