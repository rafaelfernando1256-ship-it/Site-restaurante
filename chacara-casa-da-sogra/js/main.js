/* ═══════════════════════════════════════════════════════════════
   CHÁCARA CASA DA SOGRA — interações
   ───────────────────────────────────────────────────────────────
   1. Cabeçalho sólido ao rolar
   2. Menu de celular (painel em tela cheia)
   3. Link ativo conforme a seção visível
   4. Revelação dos elementos ao entrar na tela
   5. Parallax do hero
   6. Filtro da galeria por categoria
   7. Lightbox das fotos
   8. Contadores da nota do Google
   9. Formulário "Consulte disponibilidade" → WhatsApp
   10. Botão flutuante e ano do rodapé
   Tudo é progressivo: sem JS o site continua legível e navegável.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Número do WhatsApp usado pelo formulário (55 + DDD + número) */
  var WHATSAPP = '5511985603031';

  var menosMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ─── 1. CABEÇALHO ──────────────────────────────────────── */
  var cabecalho = $('#cabecalho');
  var flutuante = $('#flutuante');

  function aoRolar() {
    var y = window.scrollY;
    if (cabecalho) cabecalho.classList.toggle('solido', y > 40);
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
    $$('.menu__lista li', menu).forEach(function (li, i) {
      li.style.setProperty('--entrada', (0.16 + i * 0.06) + 's');
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
        obs.unobserve(item.target);
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

  /* ─── 6. FILTRO DA GALERIA ──────────────────────────────────
     Cada foto tem data-cat; cada botão, data-filtro.
     Para uma categoria nova, basta criar o botão e usar o mesmo
     nome no data-cat das fotos.                                 */
  var filtros = $('#filtros');
  var fotos = $$('.mosaico__item');

  if (filtros && fotos.length) {
    var botoes = $$('.filtros__btn', filtros);

    filtros.addEventListener('click', function (e) {
      var btn = e.target.closest('.filtros__btn');
      if (!btn) return;

      botoes.forEach(function (b) {
        var ativo = b === btn;
        b.classList.toggle('ativo', ativo);
        b.setAttribute('aria-selected', String(ativo));
      });

      var alvo = btn.dataset.filtro;
      var visiveis = 0;

      fotos.forEach(function (fig) {
        var mostra = (alvo === 'tudo' || fig.dataset.cat === alvo);
        fig.hidden = !mostra;
        if (!mostra) return;
        // reanima as que entraram
        fig.style.animation = 'none';
        void fig.offsetWidth;                        // força o reflow
        fig.style.animation = 'subir .5s cubic-bezier(.22,.61,.36,1) ' + (visiveis * 0.06) + 's both';
        visiveis++;
      });
    });
  }

  /* ─── 7. LIGHTBOX ───────────────────────────────────────── */
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
    var duracao = 1500;
    var inicio = null;

    if (menosMovimento) {
      el.textContent = alvo.toFixed(casas).replace('.', ',');
      return;
    }

    function passo(agora) {
      if (!inicio) inicio = agora;
      var t = Math.min((agora - inicio) / duracao, 1);
      var suave = 1 - Math.pow(1 - t, 3);
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

  /* ─── 9. CONSULTA DE DISPONIBILIDADE ────────────────────────
     Não há servidor: o formulário monta a mensagem e abre o
     WhatsApp já preenchido.                                     */
  var form = $('#consulta');
  var erro = $('#consultaErro');

  function formatarData(iso) {
    // "2026-03-14" → "14/03/2026"
    var p = iso.split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nome = $('#nome'), data = $('#data'), telefone = $('#telefone');
      var faltando = [nome, data, telefone].filter(function (c) { return !c.value.trim(); });

      [nome, data, telefone].forEach(function (c) {
        c.classList.toggle('invalido', !c.value.trim());
      });

      if (faltando.length) {
        erro.hidden = false;
        erro.textContent = 'Preencha nome, data e telefone para continuar.';
        faltando[0].focus();
        return;
      }

      erro.hidden = true;

      var texto = 'Olá! Meu nome é ' + nome.value.trim() + '. '
        + 'Gostaria de consultar a disponibilidade da Chácara Casa da Sogra para o dia '
        + formatarData(data.value) + '. '
        + 'Meu telefone para contato: ' + telefone.value.trim() + '.';

      window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
    });

    // tira o destaque de erro assim que a pessoa corrige
    form.addEventListener('input', function (e) {
      if (e.target.value.trim()) e.target.classList.remove('invalido');
    });
  }

  /* ─── 10. ANO DO RODAPÉ ─────────────────────────────────── */
  var ano = $('#ano');
  if (ano) ano.textContent = String(new Date().getFullYear());

})();
