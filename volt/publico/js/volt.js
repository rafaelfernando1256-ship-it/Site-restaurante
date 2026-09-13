/* ═══════════════════════════════════════════════════════════════
   VOLT — comportamento da loja. Baunilha pura, sem dependências.

   Os produtos NÃO estão duplicados aqui: cada .card carrega os
   próprios dados em atributos data-*, e a busca, os filtros, a
   ordenação e a sacola leem dali. Para mexer no catálogo, mexa no
   conteudo/produtos.js e rode a build.

   Sumário
   01 · Ajudantes        05 · Sacola
   02 · Topo e menu      06 · Galeria e ficha do produto
   03 · Loja             07 · Sanfona e newsletter
   04 · Busca            08 · Revelação
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 01 · Ajudantes ─────────────────────────────────────────── */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var WHATS  = '5511999990000';   // telefone da loja (fictício)
  var FRETE  = 199;               // piso do frete grátis, em reais
  var CHAVE  = 'volt:sacola';
  var calmo  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function reais(n) {
    return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d),)/g, '.');
  }

  /** Ignora acento e caixa: "aneis" acha "Anéis". */
  function chave(t) {
    return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function atrasar(fn, ms) {
    var t;
    return function () {
      var args = arguments, eu = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(eu, args); }, ms);
    };
  }

  function focaveis(caixa) {
    return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', caixa)
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }

  /** Prende o Tab dentro de um painel aberto. */
  function prender(caixa, ev) {
    if (ev.key !== 'Tab') return;
    var lista = focaveis(caixa);
    if (!lista.length) return;
    var pri = lista[0], ult = lista[lista.length - 1];
    if (ev.shiftKey && document.activeElement === pri) { ev.preventDefault(); ult.focus(); }
    else if (!ev.shiftKey && document.activeElement === ult) { ev.preventDefault(); pri.focus(); }
  }

  var sacolaAberta = false;
  var painel = $('#busca');

  var caixaAviso = $('#aviso'), tempoAviso;

  function esconderAviso() {
    if (!caixaAviso) return;
    clearTimeout(tempoAviso);
    caixaAviso.classList.remove('vis');
  }

  /* Com a sacola ou a busca abertas, o aviso cobriria justamente o botão
     de fechar pedido ou o campo de busca — e ali a confirmação já está à
     vista, dentro do próprio painel. Então ele não aparece. */
  function painelAberto() {
    return sacolaAberta || (painel && !painel.hidden);
  }

  function avisar(txt) {
    if (!caixaAviso || painelAberto()) return;
    caixaAviso.textContent = txt;
    caixaAviso.classList.add('vis');
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(function () { caixaAviso.classList.remove('vis'); }, 2400);
  }

  /* Catálogo lido do DOM: cada .card é a fonte dos próprios dados. */
  function lerCard(el) {
    return {
      el: el,
      slug: el.dataset.slug,
      nome: el.dataset.nome,
      cat: el.dataset.cat,
      catNome: el.dataset.catNome || '',
      preco: parseFloat(el.dataset.preco),
      de: el.dataset.de ? parseFloat(el.dataset.de) : null,
      off: parseInt(el.dataset.off, 10) || 0,
      nota: parseFloat(el.dataset.nota),
      tags: (el.dataset.tags || '').split(' '),
      img: el.dataset.img,
      url: el.dataset.url,
      variante: el.dataset.variante || null,
      varRotulo: el.dataset.varianteRotulo || 'Opção',
      busca: chave(el.dataset.busca),
    };
  }

  /* Um produto pode aparecer em várias seções; a sacola precisa de um
     registro só por slug, então junta tudo num mapa. */
  var CATALOGO = {};
  $$('.card').forEach(function (el) {
    var p = lerCard(el);
    if (!CATALOGO[p.slug]) CATALOGO[p.slug] = p;
  });
  var fichaEl = $('.ficha');
  if (fichaEl && !CATALOGO[fichaEl.dataset.slug]) {
    CATALOGO[fichaEl.dataset.slug] = {
      slug: fichaEl.dataset.slug, nome: fichaEl.dataset.nome,
      preco: parseFloat(fichaEl.dataset.preco), img: fichaEl.dataset.img,
      url: fichaEl.dataset.url, varRotulo: fichaEl.dataset.varianteRotulo,
    };
  }

  /* ── 02 · Topo e menu ───────────────────────────────────────── */
  var topo = $('.topo'), nav = $('#nav'), btnMenu = $('#abrirMenu');

  if (topo) {
    var antes = null;
    window.addEventListener('scroll', function () {
      var d = window.pageYOffset > 6;
      if (d !== antes) { topo.classList.toggle('desceu', d); antes = d; }
    }, { passive: true });
  }

  function fecharMenu() {
    if (!nav) return;
    nav.classList.remove('aberto');
    btnMenu.setAttribute('aria-expanded', 'false');
  }

  if (btnMenu && nav) {
    btnMenu.addEventListener('click', function () {
      var a = nav.classList.toggle('aberto');
      btnMenu.setAttribute('aria-expanded', String(a));
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', fecharMenu); });
    document.addEventListener('click', function (ev) {
      if (!nav.classList.contains('aberto')) return;
      if (nav.contains(ev.target) || btnMenu.contains(ev.target)) return;
      fecharMenu();
    });
  }

  /* ── 03 · Loja: busca, filtros e ordenação ──────────────────── */
  var grade    = $('#grade');
  var campo    = $('#lojaBusca');
  var limpar   = $('#lojaLimpar');
  var ordem    = $('#lojaOrdem');
  var conta    = $('#lojaConta');
  var vazio    = $('#lojaVazio');
  var reset    = $('#lojaReset');
  var filtros  = $$('.filtros .chip');

  var estado = { termo: '', filtro: 'todas', ordem: 'relevancia' };

  if (grade) {
    var itens = $$('.card', grade).map(function (el, i) {
      var p = lerCard(el);
      p.ordemOriginal = i;
      return p;
    });

    var COMPARA = {
      'relevancia':  function (a, b) { return a.ordemOriginal - b.ordemOriginal; },
      'menor-preco': function (a, b) { return a.preco - b.preco; },
      'maior-preco': function (a, b) { return b.preco - a.preco; },
      'desconto':    function (a, b) { return b.off - a.off || a.preco - b.preco; },
      'nota':        function (a, b) { return b.nota - a.nota || a.preco - b.preco; },
      'nome':        function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); },
    };

    function aplicar() {
      var termo = chave(estado.termo).trim();
      var vistos = itens.filter(function (p) {
        var passaFiltro = estado.filtro === 'todas' ||
          p.cat === estado.filtro ||
          p.tags.indexOf(estado.filtro) !== -1;
        var passaBusca = !termo || termo.split(/\s+/).every(function (t) {
          return p.busca.indexOf(t) !== -1;
        });
        return passaFiltro && passaBusca;
      });

      vistos.sort(COMPARA[estado.ordem] || COMPARA.relevancia);

      itens.forEach(function (p) { p.el.hidden = true; });
      vistos.forEach(function (p, i) {
        p.el.hidden = false;
        /* Reordena de verdade no DOM: a ordem visual e a ordem do
           teclado têm de bater, então nada de `order` do flex aqui. */
        grade.appendChild(p.el);
        p.el.classList.remove('visto');
        p.el.style.setProperty('--atraso', (Math.min(i, 8) * 0.03) + 's');
        void p.el.offsetWidth;
        p.el.classList.add('visto');
      });

      if (conta) {
        conta.textContent = vistos.length === itens.length
          ? itens.length + ' produtos'
          : vistos.length + ' de ' + itens.length + ' produtos';
      }
      if (vazio) vazio.hidden = vistos.length > 0;
      if (limpar) limpar.hidden = !estado.termo;
    }

    filtros.forEach(function (b) {
      b.addEventListener('click', function () {
        estado.filtro = b.dataset.filtro;
        filtros.forEach(function (o) {
          var on = o === b;
          o.classList.toggle('ativo', on);
          o.setAttribute('aria-pressed', String(on));
        });
        aplicar();
      });
    });

    if (campo) {
      campo.addEventListener('input', atrasar(function () {
        estado.termo = campo.value;
        aplicar();
      }, 140));
      campo.addEventListener('search', function () { estado.termo = campo.value; aplicar(); });
    }
    if (limpar) limpar.addEventListener('click', function () {
      campo.value = ''; estado.termo = ''; aplicar(); campo.focus();
    });
    if (ordem) ordem.addEventListener('change', function () {
      estado.ordem = ordem.value; aplicar();
    });
    if (reset) reset.addEventListener('click', function () {
      estado.termo = ''; estado.filtro = 'todas'; estado.ordem = 'relevancia';
      if (campo) campo.value = '';
      if (ordem) ordem.value = 'relevancia';
      filtros.forEach(function (o) {
        var on = o.dataset.filtro === 'todas';
        o.classList.toggle('ativo', on);
        o.setAttribute('aria-pressed', String(on));
      });
      aplicar();
    });

    aplicar();
  }

  /** Categorias e menu levam à loja já com o filtro posto. */
  function irParaCategoria(cat) {
    var alvo = $('.filtros .chip[data-filtro="' + cat + '"]');
    if (alvo) alvo.click();
  }
  $$('[data-ir]').forEach(function (el) {
    el.addEventListener('click', function () {
      var cat = el.dataset.ir;
      if (grade) {
        irParaCategoria(cat);
        if (el.tagName === 'BUTTON') {
          $('#loja').scrollIntoView({ behavior: calmo ? 'auto' : 'smooth', block: 'start' });
        }
      } else {
        /* Fora da home: guarda a escolha e aplica ao chegar. */
        try { sessionStorage.setItem('volt:filtro', cat); } catch (e) { /* ok */ }
      }
    });
  });
  if (grade) {
    try {
      var guardado = sessionStorage.getItem('volt:filtro');
      if (guardado) { sessionStorage.removeItem('volt:filtro'); irParaCategoria(guardado); }
    } catch (e) { /* ok */ }
  }

  /* ── 04 · Busca em tela cheia ───────────────────────────────── */
  var bCampo = $('#buscaCampo');
  var bRes   = $('#buscaResultados');
  var bStatus = $('#buscaStatus');
  var bDicas = $('#buscaDicas');
  var voltarFoco = null;

  var TODOS = Object.keys(CATALOGO).map(function (k) { return CATALOGO[k]; })
    .filter(function (p) { return p.busca; });

  function pintarBusca(termo) {
    var t = chave(termo).trim();
    bRes.innerHTML = '';
    if (!t) {
      bStatus.textContent = '';
      bDicas.hidden = false;
      return;
    }
    bDicas.hidden = true;
    var achados = TODOS.filter(function (p) {
      return t.split(/\s+/).every(function (q) { return p.busca.indexOf(q) !== -1; });
    }).sort(function (a, b) { return a.preco - b.preco; });

    bStatus.textContent = achados.length
      ? achados.length + (achados.length === 1 ? ' produto encontrado' : ' produtos encontrados')
      : 'Nada encontrado para “' + termo.trim() + '”';

    achados.forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'achado';
      a.href = p.url;
      a.innerHTML =
        '<img src="' + p.img + '" alt="" width="68" height="68" loading="lazy">' +
        '<span><p class="achado__nome"></p><p class="achado__cat"></p></span>' +
        '<p class="achado__preco"></p>';
      $('.achado__nome', a).textContent = p.nome;
      $('.achado__cat', a).textContent = p.catNome;
      $('.achado__preco', a).textContent = reais(p.preco);
      bRes.appendChild(a);
    });
  }

  function abrirBusca() {
    esconderAviso();
    voltarFoco = document.activeElement;
    painel.hidden = false;
    document.body.classList.add('travado');
    requestAnimationFrame(function () {
      painel.classList.add('vis');
      bCampo.focus();
    });
  }
  function fecharBusca() {
    painel.classList.remove('vis');
    if (!sacolaAberta) document.body.classList.remove('travado');
    setTimeout(function () {
      painel.hidden = true;
      if (voltarFoco && document.contains(voltarFoco)) voltarFoco.focus();
      voltarFoco = null;
    }, 240);
  }

  if (painel) {
    $('#abrirBusca').addEventListener('click', abrirBusca);
    $('#fecharBusca').addEventListener('click', fecharBusca);
    bCampo.addEventListener('input', atrasar(function () { pintarBusca(bCampo.value); }, 120));
    painel.addEventListener('keydown', function (ev) { prender(painel, ev); });
    $$('[data-termo]', bDicas).forEach(function (b) {
      b.addEventListener('click', function () {
        bCampo.value = b.dataset.termo;
        pintarBusca(bCampo.value);
        bCampo.focus();
      });
    });
    /* "/" abre a busca, como em qualquer loja que se preze. */
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== '/' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var t = ev.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || ev.target.isContentEditable) return;
      ev.preventDefault();
      abrirBusca();
    });
  }

  /* ── 05 · Sacola ────────────────────────────────────────────── */
  var sacola   = $('#sacola');
  var cortina  = $('#cortina');
  var sItens   = $('#sacolaItens');
  var sVazia   = $('#sacolaVazia');
  var sTotal   = $('#sacolaTotal');
  var sBarra   = $('#freteBarra');
  var sFrete   = $('#freteTexto');
  var contador = $('#contador');
  var sFechar  = $('#sacolaFechar');
  var btnSacola = $('#abrirSacola');
  var btnFechaS = $('#fecharSacola');
  var carrinho = [];

  function ler() {
    try {
      var cru = JSON.parse(localStorage.getItem(CHAVE));
      if (!Array.isArray(cru)) return [];
      return cru.filter(function (l) { return l && CATALOGO[l.slug] && l.qtd > 0; })
        .map(function (l) {
          return { slug: l.slug, variante: l.variante || null, qtd: Math.min(99, l.qtd | 0) };
        });
    } catch (e) { return []; }
  }
  function gravar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(carrinho)); } catch (e) { /* modo privado */ }
  }

  var subtotal = function () {
    return carrinho.reduce(function (t, l) {
      var p = CATALOGO[l.slug];
      return t + (p ? p.preco * l.qtd : 0);
    }, 0);
  };
  var pecas = function () {
    return carrinho.reduce(function (t, l) { return t + l.qtd; }, 0);
  };

  function somar(slug, variante, quantos) {
    var p = CATALOGO[slug];
    if (!p) return;
    quantos = quantos || 1;
    var linha = null;
    for (var i = 0; i < carrinho.length; i++) {
      if (carrinho[i].slug === slug && carrinho[i].variante === variante) {
        linha = carrinho[i]; break;
      }
    }
    if (linha) linha.qtd = Math.min(99, linha.qtd + quantos);
    else carrinho.push({ slug: slug, variante: variante, qtd: quantos });

    pintar(); gravar(); pular();
    avisar(p.nome + ' na sacola');
  }

  function mudar(i, delta) {
    var l = carrinho[i];
    if (!l) return;
    l.qtd += delta;
    if (l.qtd < 1) carrinho.splice(i, 1);
    pintar(); gravar();
  }
  function tirar(i) {
    var l = carrinho[i];
    if (!l) return;
    var p = CATALOGO[l.slug];
    carrinho.splice(i, 1);
    pintar(); gravar();
    avisar((p ? p.nome : 'Produto') + ' saiu da sacola');
  }
  function pular() {
    contador.classList.remove('pulo');
    void contador.offsetWidth;
    contador.classList.add('pulo');
  }

  function textoPedido() {
    if (!carrinho.length) return 'Fala! Vim pelo site da VOLT e queria tirar uma dúvida.';
    var l = ['Fala! Quero fechar este pedido pelo site da VOLT:', ''];
    carrinho.forEach(function (it) {
      var p = CATALOGO[it.slug];
      if (!p) return;
      var v = it.variante ? ' (' + p.varRotulo.toLowerCase() + ' ' + it.variante + ')' : '';
      l.push('• ' + it.qtd + 'x ' + p.nome + v + ' — ' + reais(p.preco * it.qtd));
    });
    var t = subtotal();
    l.push('', 'Subtotal: ' + reais(t));
    l.push(t >= FRETE ? 'Frete grátis (acima de ' + reais(FRETE) + ')' : 'Frete a combinar');
    return l.join('\n');
  }

  function pintar() {
    var total = subtotal(), n = pecas();

    $$('.item', sItens).forEach(function (el) { el.remove(); });
    sVazia.hidden = carrinho.length > 0;

    carrinho.forEach(function (linha, i) {
      var p = CATALOGO[linha.slug];
      if (!p) return;

      var item = document.createElement('div');
      item.className = 'item';

      var foto = document.createElement('img');
      foto.className = 'item__foto';
      foto.src = p.img; foto.alt = ''; foto.width = 66; foto.height = 66; foto.loading = 'lazy';

      var corpo = document.createElement('div');

      var nome = document.createElement('p');
      nome.className = 'item__nome';
      nome.textContent = p.nome;
      corpo.appendChild(nome);

      if (linha.variante) {
        var v = document.createElement('p');
        v.className = 'item__var';
        v.textContent = p.varRotulo + ': ' + linha.variante;
        corpo.appendChild(v);
      }

      var fila = document.createElement('div');
      fila.className = 'item__linha';

      var qtd = document.createElement('div');
      qtd.className = 'qtd';
      var menos = document.createElement('button');
      menos.type = 'button'; menos.textContent = '−';
      menos.setAttribute('aria-label', 'Diminuir quantidade de ' + p.nome);
      menos.addEventListener('click', function () { mudar(i, -1); });
      var val = document.createElement('span');
      val.textContent = linha.qtd;
      val.setAttribute('aria-label', linha.qtd + ' unidades');
      var mais = document.createElement('button');
      mais.type = 'button'; mais.textContent = '+';
      mais.setAttribute('aria-label', 'Aumentar quantidade de ' + p.nome);
      mais.addEventListener('click', function () { mudar(i, 1); });
      qtd.appendChild(menos); qtd.appendChild(val); qtd.appendChild(mais);

      var preco = document.createElement('p');
      preco.className = 'item__preco';
      preco.textContent = reais(p.preco * linha.qtd);

      fila.appendChild(qtd); fila.appendChild(preco);
      corpo.appendChild(fila);

      var tirarBtn = document.createElement('button');
      tirarBtn.type = 'button';
      tirarBtn.className = 'item__tirar';
      tirarBtn.textContent = 'Remover';
      tirarBtn.setAttribute('aria-label', 'Remover ' + p.nome + ' da sacola');
      tirarBtn.addEventListener('click', function () { tirar(i); });
      corpo.appendChild(tirarBtn);

      item.appendChild(foto); item.appendChild(corpo);
      sItens.appendChild(item);
    });

    sTotal.textContent = reais(total);
    contador.textContent = n;
    contador.classList.toggle('tem', n > 0);
    btnSacola.setAttribute('aria-label', n
      ? 'Abrir sacola, ' + n + (n === 1 ? ' item' : ' itens')
      : 'Abrir sacola');

    var falta = Math.max(0, FRETE - total);
    sBarra.style.width = Math.min(100, (total / FRETE) * 100) + '%';
    sFrete.innerHTML = falta > 0
      ? 'Faltam <b>' + reais(falta) + '</b> para o frete grátis'
      : '<b>Frete grátis liberado.</b> Boa.';

    sFechar.href = 'https://wa.me/' + WHATS + '?text=' + encodeURIComponent(textoPedido());
  }

  function abrirSacola() {
    if (sacolaAberta) return;
    esconderAviso();
    sacolaAberta = true;
    voltarFoco = voltarFoco || document.activeElement;
    cortina.hidden = false;
    sacola.setAttribute('aria-hidden', 'false');
    document.body.classList.add('travado');
    requestAnimationFrame(function () {
      cortina.classList.add('vis');
      sacola.classList.add('aberta');
      btnFechaS.focus();
    });
  }
  function fecharSacola() {
    if (!sacolaAberta) return;
    sacolaAberta = false;
    sacola.classList.remove('aberta');
    cortina.classList.remove('vis');
    sacola.setAttribute('aria-hidden', 'true');
    if (painel.hidden) document.body.classList.remove('travado');
    setTimeout(function () {
      cortina.hidden = true;
      if (voltarFoco && document.contains(voltarFoco)) voltarFoco.focus();
      voltarFoco = null;
    }, 240);
  }

  btnSacola.addEventListener('click', function () { voltarFoco = btnSacola; abrirSacola(); });
  btnFechaS.addEventListener('click', fecharSacola);
  cortina.addEventListener('click', fecharSacola);
  sacola.addEventListener('keydown', function (ev) { prender(sacola, ev); });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (painel && !painel.hidden) fecharBusca();
    else if (sacolaAberta) fecharSacola();
    else if (nav && nav.classList.contains('aberto')) { fecharMenu(); btnMenu.focus(); }
  });

  /* Botão "Add" dos cartões */
  $$('.card [data-add]').forEach(function (b) {
    var card = b.closest('.card');
    b.addEventListener('click', function () {
      somar(card.dataset.slug, card.dataset.variante || null);
    });
  });

  carrinho = ler();
  pintar();

  /* ── 06 · Galeria e ficha do produto ────────────────────────── */
  var minis = $$('.mini'), fotos = $$('.galeria__foto');

  function mostrar(i) {
    fotos.forEach(function (f, j) { f.hidden = j !== i; });
    minis.forEach(function (m, j) {
      m.classList.toggle('ativa', j === i);
      m.setAttribute('aria-selected', String(j === i));
      m.tabIndex = j === i ? 0 : -1;
    });
  }
  minis.forEach(function (m, i) { m.addEventListener('click', function () { mostrar(i); }); });
  if (minis.length) {
    $('.galeria__minis').addEventListener('keydown', function (ev) {
      var passos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      var passo = passos[ev.key];
      if (!passo) return;
      ev.preventDefault();
      var atual = minis.indexOf(document.activeElement);
      if (atual === -1) return;
      var prox = (atual + passo + minis.length) % minis.length;
      mostrar(prox); minis[prox].focus();
    });
  }

  if (fichaEl) {
    var opcoes = $$('.opcao', fichaEl);
    var escolhida = (opcoes.find(function (o) { return o.classList.contains('ativa'); })
      || opcoes[0] || {}).textContent || null;

    opcoes.forEach(function (o) {
      o.addEventListener('click', function () {
        escolhida = o.textContent;
        opcoes.forEach(function (x) {
          var on = x === o;
          x.classList.toggle('ativa', on);
          x.setAttribute('aria-checked', String(on));
          x.tabIndex = on ? 0 : -1;
        });
        o.focus();
      });
    });
    var grupo = $('#opcoes', fichaEl);
    if (grupo) grupo.addEventListener('keydown', function (ev) {
      var passos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      var passo = passos[ev.key];
      if (!passo) return;
      ev.preventDefault();
      var i = opcoes.indexOf(document.activeElement);
      if (i === -1) return;
      opcoes[(i + passo + opcoes.length) % opcoes.length].click();
    });

    var qtd = 1;
    var qtdVal = $('#qtdValor');
    function setQtd(n) {
      qtd = Math.max(1, Math.min(99, n));
      qtdVal.textContent = qtd;
    }
    $('#qtdMenos').addEventListener('click', function () { setQtd(qtd - 1); });
    $('#qtdMais').addEventListener('click', function () { setQtd(qtd + 1); });
    $('#fichaAdd').addEventListener('click', function () {
      somar(fichaEl.dataset.slug, escolhida, qtd);
      abrirSacola();
    });
  }

  /* ── 07 · Sanfona e newsletter ──────────────────────────────── */
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

  var form = $('#newsForm');
  if (form) {
    var email = $('#newsEmail'), retorno = $('#newsAviso');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = email.value.trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      email.setAttribute('aria-invalid', String(!ok));
      if (!ok) {
        retorno.dataset.erro = '1';
        retorno.textContent = 'Confere o e-mail: falta algo nele.';
        email.focus();
        return;
      }
      delete retorno.dataset.erro;
      retorno.textContent = 'Pronto — mas nada foi enviado: formulário de demonstração.';
      email.value = '';
      email.removeAttribute('aria-invalid');
    });
  }

  /* ── 08 · Revelação ─────────────────────────────────────────── */
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
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });
    alvos.forEach(function (el) { olho.observe(el); });
  }
})();
