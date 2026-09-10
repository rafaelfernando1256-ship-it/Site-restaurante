/* ═══════════════════════════════════════════════════════════════
   SORVETERIA E LANCHONETE ALIANÇA — interações
   ───────────────────────────────────────────────────────────────
   1. Cabeçalho sólido ao rolar
   2. Menu de celular (painel em tela cheia)
   3. Link ativo conforme a seção visível
   4. Revelação dos elementos ao entrar na tela
   5. Parallax do hero
   6. Abas do cardápio
   7. Galeria: lightbox
   8. Contadores da nota do Google
   9. Selo "Aberto agora" a partir da tabela de horários
   10. Botão flutuante e ano do rodapé
   Tudo é progressivo: sem JS o site continua legível e navegável.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ─── 1. CABEÇALHO ──────────────────────────────────────── */
  var cabecalho = $('#cabecalho');
  var flutuante = $('#flutuante');

  function aoRolar() {
    var y = window.scrollY;
    if (cabecalho) cabecalho.classList.toggle('solido', y > 40);
    // o botão de WhatsApp entra depois que o hero sai de cena
    if (flutuante) flutuante.classList.toggle('visivel', y > window.innerHeight * 0.6);
  }

  /* ─── 2. MENU DE CELULAR ────────────────────────────────── */
  var hamburguer = $('#hamburguer');
  var menu = $('#menu');

  function fecharMenu() {
    if (!menu) return;
    menu.classList.remove('aberto');
    hamburguer.setAttribute('aria-expanded', 'false');
    hamburguer.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
  }

  if (hamburguer && menu) {
    // escalona a entrada dos links
    $$('.menu__lista li', menu).forEach(function (li, i) {
      li.style.setProperty('--entrada', (0.14 + i * 0.06) + 's');
    });

    hamburguer.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto');
      hamburguer.setAttribute('aria-expanded', String(aberto));
      hamburguer.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      document.body.style.overflow = aberto ? 'hidden' : '';
    });

    menu.addEventListener('click', function (e) { if (e.target.closest('a')) fecharMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharMenu(); });
  }

  /* ─── 3. LINK ATIVO ─────────────────────────────────────── */
  var elos = $$('.menu__lista a');
  var alvos = elos.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);

  if ('IntersectionObserver' in window && alvos.length) {
    var vigia = new IntersectionObserver(function (itens) {
      itens.forEach(function (item) {
        if (!item.isIntersecting) return;
        elos.forEach(function (a) {
          a.classList.toggle('ativo', a.getAttribute('href') === '#' + item.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    alvos.forEach(function (s) { vigia.observe(s); });
  }

  /* ─── 4. REVELAÇÃO NO SCROLL ────────────────────────────── */
  var animados = $$('.anima');

  if (!('IntersectionObserver' in window) || menosMovimento) {
    animados.forEach(function (el) { el.classList.add('visivel'); });
  } else {
    var revelador = new IntersectionObserver(function (itens, obs) {
      itens.forEach(function (item) {
        if (!item.isIntersecting) return;
        item.target.classList.add('visivel');
        obs.unobserve(item.target);           // anima uma vez só
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    animados.forEach(function (el) { revelador.observe(el); });
  }

  /* ─── 5. PARALLAX DO HERO ───────────────────────────────── */
  var camadas = $$('[data-parallax]');
  var tique = false;

  function moverParallax() {
    var y = window.scrollY;
    camadas.forEach(function (el) {
      var fator = parseFloat(el.dataset.parallax) || 0.3;
      el.style.transform = 'translate3d(0,' + (y * fator).toFixed(1) + 'px,0)';
    });
    tique = false;
  }

  function quadro() {
    aoRolar();
    if (!tique && !menosMovimento && camadas.length && window.scrollY < window.innerHeight * 1.4) {
      tique = true;
      window.requestAnimationFrame(moverParallax);
    }
  }

  window.addEventListener('scroll', quadro, { passive: true });
  window.addEventListener('resize', aoRolar, { passive: true });
  aoRolar();

  /* ─── 6. ABAS DO CARDÁPIO ───────────────────────────────── */
  var abas = $('#abas');
  var grupos = $$('.cardapio__grupo');

  if (abas && grupos.length) {
    var botoes = $$('.abas__btn', abas);

    abas.addEventListener('click', function (e) {
      var btn = e.target.closest('.abas__btn');
      if (!btn) return;

      botoes.forEach(function (b) {
        var ativo = b === btn;
        b.classList.toggle('ativo', ativo);
        b.setAttribute('aria-selected', String(ativo));
      });

      grupos.forEach(function (g) { g.hidden = g.dataset.grupo !== btn.dataset.aba; });

      // reanima os cards da categoria que acabou de aparecer
      $$('.item', $('[data-grupo="' + btn.dataset.aba + '"]')).forEach(function (card, i) {
        card.style.animation = 'none';
        void card.offsetWidth;                     // força o reflow
        card.style.animation = 'subir .55s cubic-bezier(.22,.61,.36,1) ' + (i * 0.07) + 's both';
      });
    });

  }

  /* ─── 7. GALERIA / LIGHTBOX ─────────────────────────────── */
  var mosaico = $('#mosaico');
  var lupa = $('#lupa');
  var lupaImg = $('#lupaImg');
  var lupaFechar = $('#lupaFechar');

  function fecharLupa() {
    if (!lupa) return;
    lupa.hidden = true;
    document.body.style.overflow = '';
  }

  if (mosaico && lupa && lupaImg) {
    mosaico.addEventListener('click', function (e) {
      var fig = e.target.closest('.mosaico__item');
      if (!fig) return;
      var img = $('img', fig);
      lupaImg.src = img.currentSrc || img.src;
      lupaImg.alt = img.alt;
      lupa.hidden = false;
      document.body.style.overflow = 'hidden';
      lupaFechar.focus();
    });

    lupa.addEventListener('click', function (e) {
      if (e.target === lupa || e.target === lupaFechar) fecharLupa();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lupa.hidden) fecharLupa();
    });
  }

  /* ─── 8. CONTADORES ─────────────────────────────────────── */
  function contar(el) {
    var alvo = parseFloat(el.dataset.contar);
    var casas = parseInt(el.dataset.decimais || '0', 10);
    var duracao = 1400;
    var inicio = null;

    if (menosMovimento) {
      el.textContent = alvo.toFixed(casas).replace('.', ',');
      return;
    }

    function passo(agora) {
      if (!inicio) inicio = agora;
      var t = Math.min((agora - inicio) / duracao, 1);
      var suave = 1 - Math.pow(1 - t, 3);              // desacelera no fim
      el.textContent = (alvo * suave).toFixed(casas).replace('.', ',');
      if (t < 1) window.requestAnimationFrame(passo);
    }
    window.requestAnimationFrame(passo);
  }

  var contadores = $$('[data-contar]');
  if (contadores.length && 'IntersectionObserver' in window) {
    var vigiaNum = new IntersectionObserver(function (itens, obs) {
      itens.forEach(function (item) {
        if (!item.isIntersecting) return;
        contar(item.target);
        obs.unobserve(item.target);
      });
    }, { threshold: 0.5 });
    contadores.forEach(function (el) { vigiaNum.observe(el); });
  } else {
    contadores.forEach(contar);
  }

  /* ─── 9. SELO DE HORÁRIO ────────────────────────────────────
     Lê a lista #horarios do HTML: cada <li> tem data-dia
     (0 = domingo … 6 = sábado) e o texto "11:00 – 23:00".
     Editar o HTML basta — este código acompanha.               */
  var lista = $('#horarios');
  var selo = $('#seloHorario');

  if (lista && selo) {
    var agora = new Date();
    var hoje = agora.getDay();
    var minutos = agora.getHours() * 60 + agora.getMinutes();
    var aberto = false;

    $$('li', lista).forEach(function (li) {
      if (Number(li.dataset.dia) !== hoje) return;
      li.classList.add('hoje');

      var texto = li.lastElementChild ? li.lastElementChild.textContent : '';
      var faixa = texto.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
      if (!faixa) return;                                   // ex.: "Fechado"

      var abre  = Number(faixa[1]) * 60 + Number(faixa[2]);
      var fecha = Number(faixa[3]) * 60 + Number(faixa[4]);

      aberto = fecha > abre
        ? (minutos >= abre && minutos < fecha)
        : (minutos >= abre || minutos < fecha);             // vira a meia-noite
    });

    selo.hidden = false;
    selo.textContent = aberto ? 'Aberto agora' : 'Fechado agora';
    selo.classList.add(aberto ? 'selo--aberto' : 'selo--fechado');
  }

  /* ─── 10. ANO DO RODAPÉ ─────────────────────────────────── */
  var ano = $('#ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

})();
