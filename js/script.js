/* =========================================================
   TEMPERO D' FAMÍLIA — JavaScript do site
   Tudo aqui é opcional: o site continua funcionando sem JS.
   Blocos:
   1. Menu mobile (abre/fecha)
   2. Sombra no cabeçalho ao rolar
   3. Link ativo conforme a seção visível
   4. Filtro de categorias do cardápio
   5. Selo "Aberto agora / Fechado" + destaque do dia
   6. Ano automático no rodapé
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. MENU MOBILE ---------- */
  var navToggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var aberto = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(aberto));
      navToggle.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });

    // Fecha o menu ao clicar em um link (útil no celular)
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menu');
      }
    });
  }

  /* ---------- 2. SOMBRA NO CABEÇALHO ---------- */
  var header = document.getElementById('header');
  function aoRolar() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* ---------- 3. LINK ATIVO CONFORME A SEÇÃO ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav__list a'));
  var secoes = links
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && secoes.length) {
    var observer = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entrada.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    secoes.forEach(function (s) { observer.observe(s); });
  }

  /* ---------- 4. FILTRO DO CARDÁPIO ----------
     Mostra apenas a categoria escolhida. Para adicionar uma
     categoria nova: crie o botão em .filters com data-filter="x"
     e a div .menu-group correspondente com data-category="x".      */
  var filtros = document.getElementById('filters');
  var grupos = Array.prototype.slice.call(document.querySelectorAll('.menu-group'));

  if (filtros && grupos.length) {
    filtros.addEventListener('click', function (e) {
      var btn = e.target.closest('.filters__btn');
      if (!btn) return;

      var alvo = btn.dataset.filter;

      filtros.querySelectorAll('.filters__btn').forEach(function (b) {
        b.classList.toggle('is-active', b === btn);
      });

      grupos.forEach(function (g) {
        g.hidden = !(alvo === 'todos' || g.dataset.category === alvo);
      });
    });
  }

  /* ---------- 5. HORÁRIO: ABERTO AGORA? ----------
     A tabela de horários fica no HTML (ul#hours). Cada <li> tem
     data-day (0=domingo ... 6=sábado) e o texto "11:00 – 23:00".
     Basta editar o HTML: este código lê de lá automaticamente.   */
  var listaHorarios = document.getElementById('hours');
  var selo = document.getElementById('statusHorario');

  if (listaHorarios && selo) {
    var agora = new Date();
    var diaHoje = agora.getDay();
    var minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    var aberto = false;

    listaHorarios.querySelectorAll('li').forEach(function (li) {
      if (Number(li.dataset.day) !== diaHoje) return;

      li.classList.add('is-today');

      // Aceita "11:00 – 23:00" (traço curto ou longo) e "Fechado"
      var texto = li.lastElementChild ? li.lastElementChild.textContent : '';
      var partes = texto.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
      if (!partes) return;

      var abre = Number(partes[1]) * 60 + Number(partes[2]);
      var fecha = Number(partes[3]) * 60 + Number(partes[4]);

      // Cobre horários que passam da meia-noite (ex.: 18:00 – 01:00)
      aberto = fecha > abre
        ? (minutosAgora >= abre && minutosAgora < fecha)
        : (minutosAgora >= abre || minutosAgora < fecha);
    });

    selo.hidden = false;
    selo.textContent = aberto ? 'Aberto agora' : 'Fechado agora';
    selo.classList.add(aberto ? 'status--aberto' : 'status--fechado');
  }

  /* ---------- 6. ANO NO RODAPÉ ---------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

})();
