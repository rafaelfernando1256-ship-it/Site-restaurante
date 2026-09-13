/* ═══════════════════════════════════════════════════════════════
   VANTA STORE — comportamento da loja. Baunilha pura, sem dependências.

   Os produtos NÃO estão duplicados aqui: cada .card carrega os próprios
   dados em atributos data-*, e busca, filtros, ordenação, carrinho e
   favoritos leem dali. Para mexer no catálogo, edite
   conteudo/produtos.js e rode `node construir.mjs`.

   Sumário
   01 Ajudantes        05 Favoritos          09 Checkout
   02 Topo e menu      06 Catálogo           10 Newsletter e conta
   03 Estado (storage) 07 Busca              11 Sanfona e revelação
   04 Carrinho         08 Página de produto
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 01 · Ajudantes ─────────────────────────────────────────── */
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var RAIZ  = document.body.dataset.raiz || '';
  var FRETE = 299;                 // piso do frete grátis (igual ao site.js)
  var CH_CAR = 'vanta:carrinho';
  var CH_FAV = 'vanta:favoritos';
  var CH_CUP = 'vanta:cupom';
  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CUPONS = [
    { codigo: 'VANTA10',    tipo: 'percentual', valor: 10, minimo: 0 },
    { codigo: 'BEMVINDO',   tipo: 'percentual', valor: 15, minimo: 400 },
    { codigo: 'FRETEVANTA', tipo: 'frete',      valor: 0,  minimo: 0 },
  ];

  function reais(n) {
    return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d),)/g, '.');
  }
  /** Ignora acento e caixa: "tenis" acha "Tênis". */
  function chave(t) {
    return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function atrasar(fn, ms) {
    var t;
    return function () {
      var args = arguments, eu = this;
      clearTimeout(t); t = setTimeout(function () { fn.apply(eu, args); }, ms);
    };
  }
  function guardar(chaveLS, valor) {
    try { localStorage.setItem(chaveLS, JSON.stringify(valor)); } catch (e) { /* modo privado */ }
  }
  function ler(chaveLS, padrao) {
    try {
      var v = JSON.parse(localStorage.getItem(chaveLS));
      return v === null || v === undefined ? padrao : v;
    } catch (e) { return padrao; }
  }
  function focaveis(caixa) {
    return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', caixa)
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }
  function prender(caixa, ev) {
    if (ev.key !== 'Tab') return;
    var l = focaveis(caixa);
    if (!l.length) return;
    var pri = l[0], ult = l[l.length - 1];
    if (ev.shiftKey && document.activeElement === pri) { ev.preventDefault(); ult.focus(); }
    else if (!ev.shiftKey && document.activeElement === ult) { ev.preventDefault(); pri.focus(); }
  }

  var caixaAviso = $('#aviso'), tempoAviso;
  function esconderAviso() { clearTimeout(tempoAviso); if (caixaAviso) caixaAviso.classList.remove('vis'); }
  function painelAberto() {
    return gavetaAberta || (busca && !busca.hidden) || (lightbox && !lightbox.hidden);
  }
  /** Confirmação de ação. Não aparece com painel aberto: ali a mudança já está à vista. */
  function avisar(html) {
    if (!caixaAviso || painelAberto()) return;
    caixaAviso.innerHTML = html;
    caixaAviso.classList.add('vis');
    clearTimeout(tempoAviso);
    tempoAviso = setTimeout(function () { caixaAviso.classList.remove('vis'); }, 3000);
  }

  /* Catálogo lido do DOM: cada .card é a fonte dos próprios dados. */
  function lerCard(el) {
    return {
      el: el, slug: el.dataset.slug, nome: el.dataset.nome,
      cat: el.dataset.cat, tipo: el.dataset.tipo, marca: el.dataset.marca,
      preco: parseFloat(el.dataset.preco),
      de: el.dataset.de ? parseFloat(el.dataset.de) : null,
      off: parseInt(el.dataset.off, 10) || 0,
      estoque: el.dataset.estoque === '1',
      tags: (el.dataset.tags || '').split(' ').filter(Boolean),
      tamanhos: (el.dataset.tamanhos || '').split('|').filter(Boolean),
      cores: (el.dataset.cores || '').split('|').filter(Boolean),
      img: el.dataset.img, url: el.dataset.url,
      busca: chave(el.dataset.busca),
    };
  }

  var CATALOGO = {};
  /* O índice vem embutido em toda página: a busca de topo precisa achar
     os 24 produtos mesmo na home, que só desenha os destaques. */
  (function () {
    var tag = $('#indiceCatalogo');
    if (!tag) return;
    var lista;
    try { lista = JSON.parse(tag.textContent); } catch (e) { return; }
    lista.forEach(function (p) {
      CATALOGO[p.s] = {
        slug: p.s, nome: p.n, tipo: p.t,
        preco: p.p, de: p.d, off: p.d ? Math.round((1 - p.p / p.d) * 100) : 0,
        estoque: p.e === 1, tags: [], tamanhos: [], cores: [],
        img: p.i, url: p.u, busca: chave(p.b),
      };
    });
  }());
  /* Os cartões da página mandam sobre o índice: trazem tags e caminhos
     já relativos a ela. */
  $$('.card').forEach(function (el) {
    CATALOGO[el.dataset.slug] = lerCard(el);
  });
  var fichaEl = $('.ficha');
  if (fichaEl && !CATALOGO[fichaEl.dataset.slug]) {
    CATALOGO[fichaEl.dataset.slug] = {
      slug: fichaEl.dataset.slug, nome: fichaEl.dataset.nome,
      preco: parseFloat(fichaEl.dataset.preco), img: fichaEl.dataset.img,
      url: fichaEl.dataset.url, estoque: fichaEl.dataset.estoque === '1',
    };
  }
  /** Produto do carrinho pode ter vindo de outra página. */
  function produto(slug, guardado) {
    return CATALOGO[slug] || guardado || null;
  }

  /* ── Tarja: uma frase de cada vez, só quando não cabem todas ── */
  (function () {
    var itens = $$('.tarja__item');
    if (itens.length < 2) return;
    var cabemTodas = function () { return window.innerWidth >= 1000; };
    var lento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (cabemTodas() || lento) return;
    var i = 0;
    setInterval(function () {
      if (cabemTodas()) return;                   // no desktop ficam todas
      itens[i].classList.remove('ativo');
      i = (i + 1) % itens.length;
      itens[i].classList.add('ativo');
    }, 4200);
  }());

  /* ── 02 · Topo e menu ───────────────────────────────────────── */
  var btnMenu = $('#abrirMenu'), menu = $('#menuMobile');
  function fecharMenu() {
    if (!menu) return;
    menu.classList.remove('aberto');
    btnMenu.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('travado');
  }
  if (btnMenu && menu) {
    btnMenu.addEventListener('click', function () {
      var abrindo = !menu.classList.contains('aberto');
      if (abrindo) {
        requestAnimationFrame(function () { menu.classList.add('aberto'); });
        btnMenu.setAttribute('aria-expanded', 'true');
        document.body.classList.add('travado');
      } else { fecharMenu(); }
    });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', fecharMenu); });
  }

  /* ── 03 · Estado guardado ───────────────────────────────────── */
  var carrinho = ler(CH_CAR, []).filter(function (l) { return l && l.slug && l.qtd > 0; });
  var favoritos = ler(CH_FAV, []).filter(function (s) { return typeof s === 'string'; });
  var cupom = ler(CH_CUP, null);

  var subtotal = function () {
    return carrinho.reduce(function (t, l) { return t + l.preco * l.qtd; }, 0);
  };
  var pecas = function () {
    return carrinho.reduce(function (t, l) { return t + l.qtd; }, 0);
  };
  function desconto() {
    if (!cupom) return 0;
    var c = CUPONS.find(function (x) { return x.codigo === cupom; });
    if (!c || c.tipo !== 'percentual' || subtotal() < c.minimo) return 0;
    return subtotal() * (c.valor / 100);
  }
  function freteGratis() {
    if (cupom === 'FRETEVANTA') return true;
    return subtotal() - desconto() >= FRETE;
  }
  var total = function () { return Math.max(0, subtotal() - desconto()); };

  /* ── 04 · Carrinho ──────────────────────────────────────────── */
  var cortina   = $('#cortina');
  var gavetaCar = $('#gavetaCarrinho');
  var gavetaFav = $('#gavetaFavoritos');
  var gavetaAberta = null;
  var voltarFoco = null;

  function abrirGaveta(g) {
    if (gavetaAberta === g) return;
    esconderAviso();
    voltarFoco = document.activeElement;
    gavetaAberta = g;
    cortina.hidden = false;
    g.setAttribute('aria-hidden', 'false');
    document.body.classList.add('travado');
    requestAnimationFrame(function () {
      cortina.classList.add('vis');
      g.classList.add('aberta');
      var f = $('.ico-btn', g); if (f) f.focus();
    });
  }
  function fecharGaveta() {
    if (!gavetaAberta) return;
    var g = gavetaAberta;
    gavetaAberta = null;
    g.classList.remove('aberta');
    g.setAttribute('aria-hidden', 'true');
    cortina.classList.remove('vis');
    if (!busca || busca.hidden) document.body.classList.remove('travado');
    setTimeout(function () {
      cortina.hidden = true;
      if (voltarFoco && document.contains(voltarFoco)) voltarFoco.focus();
      voltarFoco = null;
    }, 260);
  }

  function somar(slug, opcoes) {
    var p = CATALOGO[slug];
    if (!p || !p.estoque) return;
    opcoes = opcoes || {};
    var tam = opcoes.tam || null, cor = opcoes.cor || null, quantos = opcoes.qtd || 1;
    var linha = carrinho.find(function (l) {
      return l.slug === slug && l.tam === tam && l.cor === cor;
    });
    if (linha) linha.qtd = Math.min(99, linha.qtd + quantos);
    else carrinho.push({ slug: slug, nome: p.nome, preco: p.preco, de: p.de,
                         img: p.img, url: p.url, tam: tam, cor: cor, qtd: quantos });
    pintarTudo();
    avisar(p.nome + ' no carrinho · <a href="' + RAIZ + 'carrinho.html">ver</a>');
    pular($('#contCar'));
  }
  function mudarQtd(i, d) {
    var l = carrinho[i]; if (!l) return;
    l.qtd += d;
    if (l.qtd < 1) carrinho.splice(i, 1);
    pintarTudo();
  }
  function tirar(i) {
    var l = carrinho[i]; if (!l) return;
    carrinho.splice(i, 1);
    pintarTudo();
    avisar(l.nome + ' saiu do carrinho');
  }
  function pular(el) {
    if (!el) return;
    el.classList.remove('pulo'); void el.offsetWidth; el.classList.add('pulo');
  }

  /** Desenha uma linha do carrinho. `compacto` some com os controles. */
  function linhaItem(l, i, compacto) {
    var d = document.createElement('div');
    d.className = 'item';
    var variacao = [l.cor, l.tam].filter(Boolean).join(' · ');

    var foto = document.createElement('img');
    foto.className = 'item__foto'; foto.src = RAIZ + (l.img || '').replace(/^\.\.\//, '');
    foto.alt = ''; foto.width = 72; foto.height = 72; foto.loading = 'lazy';

    var corpo = document.createElement('div');
    var nome = document.createElement('p');
    nome.className = 'item__nome';
    var link = document.createElement('a');
    link.href = RAIZ + l.url; link.textContent = l.nome;
    nome.appendChild(link); corpo.appendChild(nome);

    if (variacao) {
      var v = document.createElement('p');
      v.className = 'item__var'; v.textContent = variacao;
      corpo.appendChild(v);
    }

    var fila = document.createElement('div');
    fila.className = 'item__linha';

    if (compacto) {
      var q = document.createElement('p');
      q.className = 'item__var'; q.textContent = l.qtd + ' un.';
      fila.appendChild(q);
    } else {
      var qtd = document.createElement('div');
      qtd.className = 'qtd';
      var menos = document.createElement('button');
      menos.type = 'button'; menos.textContent = '−';
      menos.setAttribute('aria-label', 'Diminuir quantidade de ' + l.nome);
      menos.addEventListener('click', function () { mudarQtd(i, -1); });
      var val = document.createElement('span');
      val.textContent = l.qtd; val.setAttribute('aria-label', l.qtd + ' unidades');
      var mais = document.createElement('button');
      mais.type = 'button'; mais.textContent = '+';
      mais.setAttribute('aria-label', 'Aumentar quantidade de ' + l.nome);
      mais.addEventListener('click', function () { mudarQtd(i, 1); });
      qtd.appendChild(menos); qtd.appendChild(val); qtd.appendChild(mais);
      fila.appendChild(qtd);
    }

    var preco = document.createElement('p');
    preco.className = 'item__preco';
    preco.textContent = reais(l.preco * l.qtd);
    if (l.de) {
      var s = document.createElement('s');
      s.textContent = reais(l.de * l.qtd);
      preco.appendChild(s);
    }
    fila.appendChild(preco);
    corpo.appendChild(fila);

    if (!compacto) {
      var rm = document.createElement('button');
      rm.type = 'button'; rm.className = 'item__tirar'; rm.textContent = 'Remover';
      rm.setAttribute('aria-label', 'Remover ' + l.nome + ' do carrinho');
      rm.addEventListener('click', function () { tirar(i); });
      corpo.appendChild(rm);
    }

    d.appendChild(foto); d.appendChild(corpo);
    return d;
  }

  function pintarLista(caixa, vazio, compacto) {
    if (!caixa) return;
    $$('.item', caixa).forEach(function (e) { e.remove(); });
    if (vazio) vazio.hidden = carrinho.length > 0;
    carrinho.forEach(function (l, i) { caixa.appendChild(linhaItem(l, i, compacto)); });
  }

  function pintarTotais() {
    var sub = subtotal(), desc = desconto(), gratis = freteGratis(), tot = total();
    var textoFrete = carrinho.length === 0 ? 'A calcular' : (gratis ? 'Grátis' : 'A calcular');

    [['#carrinhoSubtotal', reais(sub)], ['#resSubtotal', reais(sub)], ['#coSubtotal', reais(sub)],
     ['#carrinhoTotal', reais(tot)], ['#resTotal', reais(tot)], ['#coTotal', reais(tot)],
     ['#carrinhoFrete', textoFrete], ['#resFrete', textoFrete], ['#coFrete', textoFrete],
     ['#carrinhoDesconto', '− ' + reais(desc)], ['#resDesconto', '− ' + reais(desc)],
     ['#coDesconto', '− ' + reais(desc)],
     ['#finalizarTotal', carrinho.length ? '· ' + reais(tot) : ''],
    ].forEach(function (par) {
      var el = $(par[0]); if (el) el.textContent = par[1];
    });
    ['#linhaDesconto', '#resLinhaDesc', '#coLinhaDesc'].forEach(function (s) {
      var el = $(s); if (el) el.hidden = desc <= 0;
    });

    var pixEl = $('#resPix');
    if (pixEl) {
      pixEl.hidden = tot <= 0;
      pixEl.textContent = 'ou ' + reais(tot * 0.95) + ' à vista no Pix (5% de desconto)';
    }

    var n = pecas();
    [['#contCar', n]].forEach(function (par) {
      var el = $(par[0]);
      if (!el) return;
      el.textContent = par[1];
      el.classList.toggle('tem', par[1] > 0);
    });
    var btnCar = $('#abrirCarrinho');
    if (btnCar) btnCar.setAttribute('aria-label',
      n ? 'Abrir carrinho, ' + n + (n === 1 ? ' item' : ' itens') : 'Abrir carrinho');

    var falta = Math.max(0, FRETE - (sub - desc));
    var barra = $('#freteBarra'), texto = $('#freteTexto');
    if (barra) barra.style.width = Math.min(100, ((sub - desc) / FRETE) * 100) + '%';
    if (texto) {
      texto.innerHTML = gratis
        ? '<b>Frete grátis liberado.</b> Boa compra.'
        : 'Faltam <b>' + reais(falta) + '</b> para o frete grátis';
    }

    ['#irCheckout', '#paginaCheckout'].forEach(function (s) {
      var el = $(s);
      if (!el) return;
      var vazio = carrinho.length === 0;
      el.classList.toggle('btn--desativado', vazio);
      el.setAttribute('aria-disabled', String(vazio));
      if (vazio) el.setAttribute('tabindex', '-1'); else el.removeAttribute('tabindex');
    });
  }

  function pintarTudo() {
    guardar(CH_CAR, carrinho);
    guardar(CH_CUP, cupom);
    pintarLista($('#carrinhoItens'), $('#carrinhoVazio'), false);
    pintarLista($('#paginaItens'), $('#paginaVazio'), false);
    pintarLista($('#checkoutItens'), null, true);
    pintarTotais();
    var pg = $('#paginaVazio');
    if (pg) {
      var resumo = $('.resumo');
      if (resumo) resumo.hidden = false;
    }
  }

  if ($('#abrirCarrinho')) $('#abrirCarrinho').addEventListener('click', function () { abrirGaveta(gavetaCar); });
  if ($('#fecharCarrinho')) $('#fecharCarrinho').addEventListener('click', fecharGaveta);
  if ($('#fecharFavoritos')) $('#fecharFavoritos').addEventListener('click', fecharGaveta);
  if ($('#continuarComprando')) $('#continuarComprando').addEventListener('click', fecharGaveta);
  if (cortina) cortina.addEventListener('click', fecharGaveta);
  [gavetaCar, gavetaFav].forEach(function (g) {
    if (g) g.addEventListener('keydown', function (ev) { prender(g, ev); });
  });

  /* cupom */
  var formCupom = $('#formCupom');
  if (formCupom) {
    var campoCupom = $('#cupomCampo'), avisoCupom = $('#cupomAviso');
    function aplicarCupom(codigo) {
      var c = CUPONS.find(function (x) { return x.codigo === codigo.trim().toUpperCase(); });
      delete avisoCupom.dataset.ok; delete avisoCupom.dataset.erro;
      if (!c) {
        avisoCupom.dataset.erro = '1';
        avisoCupom.textContent = 'Cupom não encontrado. Tente VANTA10.';
        return;
      }
      if (subtotal() < c.minimo) {
        avisoCupom.dataset.erro = '1';
        avisoCupom.textContent = 'Este cupom vale a partir de ' + reais(c.minimo) + '.';
        return;
      }
      cupom = c.codigo;
      avisoCupom.dataset.ok = '1';
      avisoCupom.textContent = c.tipo === 'frete'
        ? 'Cupom aplicado: frete grátis.'
        : 'Cupom aplicado: ' + c.valor + '% de desconto.';
      pintarTudo();
    }
    formCupom.addEventListener('submit', function (ev) {
      ev.preventDefault(); aplicarCupom(campoCupom.value);
    });
    $$('[data-cupom]').forEach(function (b) {
      b.addEventListener('click', function () {
        campoCupom.value = b.dataset.cupom; aplicarCupom(b.dataset.cupom);
      });
    });
    if (cupom) { campoCupom.value = cupom; aplicarCupom(cupom); }
  }

  /* ── 05 · Favoritos ─────────────────────────────────────────── */
  function ehFav(slug) { return favoritos.indexOf(slug) !== -1; }
  function alternarFav(slug) {
    var i = favoritos.indexOf(slug);
    if (i === -1) { favoritos.push(slug); avisar(CATALOGO[slug].nome + ' salvo nos favoritos'); }
    else { favoritos.splice(i, 1); avisar(CATALOGO[slug].nome + ' saiu dos favoritos'); }
    guardar(CH_FAV, favoritos);
    pintarFavoritos();
    pular($('#contFav'));
  }
  function pintarFavoritos() {
    $$('.card__fav').forEach(function (b) {
      var on = ehFav(b.closest('.card').dataset.slug);
      b.setAttribute('aria-pressed', String(on));
    });
    var fp = $('#favProduto');
    if (fp && fichaEl) fp.setAttribute('aria-pressed', String(ehFav(fichaEl.dataset.slug)));

    var caixa = $('#favoritosItens'), vazio = $('#favoritosVazio');
    if (caixa) {
      $$('.item', caixa).forEach(function (e) { e.remove(); });
      if (vazio) vazio.hidden = favoritos.length > 0;
      favoritos.forEach(function (slug) {
        var p = CATALOGO[slug];
        if (!p) return;
        var d = document.createElement('div');
        d.className = 'item';
        d.innerHTML =
          '<img class="item__foto" src="' + RAIZ + p.img.replace(/^\.\.\//, '') + '" alt="" width="72" height="72" loading="lazy">' +
          '<div><p class="item__nome"><a href="' + RAIZ + p.url + '"></a></p>' +
          '<div class="item__linha"><p class="item__preco"></p></div></div>';
        $('a', d).textContent = p.nome;
        $('.item__preco', d).textContent = reais(p.preco);
        var rm = document.createElement('button');
        rm.type = 'button'; rm.className = 'item__tirar'; rm.textContent = 'Remover';
        rm.setAttribute('aria-label', 'Remover ' + p.nome + ' dos favoritos');
        rm.addEventListener('click', function () { alternarFav(slug); });
        $('div', d).appendChild(rm);
        caixa.appendChild(d);
      });
    }
    var c = $('#contFav');
    if (c) { c.textContent = favoritos.length; c.classList.toggle('tem', favoritos.length > 0); }
  }
  if ($('#abrirFavoritos')) $('#abrirFavoritos').addEventListener('click', function () { abrirGaveta(gavetaFav); });

  /* Botão de favorito injetado nos cartões: só existe com JavaScript,
     então não fica um controle morto em quem está sem script. */
  $$('.card').forEach(function (card) {
    var foto = $('.card__foto', card);
    if (!foto) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'card__fav';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', 'Salvar ' + card.dataset.nome + ' nos favoritos');
    b.innerHTML = $('#favProduto') ? $('#favProduto').innerHTML :
      '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 1 1 19.3 13Z"/></svg>';
    b.addEventListener('click', function () { alternarFav(card.dataset.slug); });
    card.insertBefore(b, foto.nextSibling);
  });
  $$('.card [data-add]').forEach(function (b) {
    var card = b.closest('.card');
    b.addEventListener('click', function () {
      var p = CATALOGO[card.dataset.slug];
      var tam = p && p.tamanhos.length === 1 ? p.tamanhos[0] : null;
      var cor = p && p.cores.length ? p.cores[0] : null;
      somar(card.dataset.slug, { tam: tam, cor: cor });
    });
  });

  /* ── 06 · Catálogo: busca, filtros e ordenação ──────────────── */
  var grade = $('#grade');
  if (grade) {
    var itens = $$('.card', grade).map(function (el, i) {
      var p = lerCard(el); p.ordem = i; return p;
    });
    var campo = $('#lojaBusca'), limpar = $('#lojaLimpar'), ordem = $('#lojaOrdem');
    var conta = $('#lojaConta'), vazio = $('#lojaVazio'), reset = $('#lojaReset');
    var esqueleto = $('#esqueleto'), painel = $('#painelFiltros');
    var pilulas = $('#pilulasAtivas'), contaFiltros = $('#filtrosAtivos');
    var estado = { termo: '', ordem: 'relevancia' };

    var COMPARA = {
      'relevancia':  function (a, b) { return (b.estoque - a.estoque) || a.ordem - b.ordem; },
      'recentes':    function (a, b) { return (b.tags.indexOf('novo') !== -1) - (a.tags.indexOf('novo') !== -1) || a.ordem - b.ordem; },
      'menor-preco': function (a, b) { return a.preco - b.preco; },
      'maior-preco': function (a, b) { return b.preco - a.preco; },
      'desconto':    function (a, b) { return b.off - a.off || a.preco - b.preco; },
    };

    function marcados(nome) {
      return $$('input[name="' + nome + '"]:checked', painel).map(function (i) { return i.value; });
    }
    var FAIXAS = { 'ate-150': [0, 150], '150-300': [150, 300],
                   '300-500': [300, 500], 'acima-500': [500, Infinity] };

    function passaFiltros(p) {
      var cat = marcados('categoria'), tipo = marcados('tipo'), mar = marcados('marca');
      var fx = marcados('faixa'), tam = marcados('tamanho'), cor = marcados('cor');
      var est = marcados('estoque');
      if (cat.length && cat.indexOf(p.cat) === -1) return false;
      if (tipo.length && tipo.indexOf(p.tipo) === -1) return false;
      if (mar.length && mar.indexOf(p.marca) === -1) return false;
      if (est.length && !p.estoque) return false;
      if (tam.length && !tam.some(function (t) { return p.tamanhos.indexOf(t) !== -1; })) return false;
      if (cor.length && !cor.some(function (c) { return p.cores.indexOf(c) !== -1; })) return false;
      if (fx.length && !fx.some(function (f) {
        var r = FAIXAS[f]; return r && p.preco >= r[0] && p.preco < r[1];
      })) return false;
      return true;
    }

    function pintarFichas() {
      if (!pilulas) return;
      pilulas.innerHTML = '';
      var marcadas = $$('input:checked', painel);
      if (estado.termo) {
        var f = document.createElement('button');
        f.type = 'button'; f.className = 'pilula';
        f.innerHTML = '<b></b><span aria-hidden="true">×</span>';
        $('b', f).textContent = '“' + estado.termo + '”';
        f.setAttribute('aria-label', 'Remover a busca por ' + estado.termo);
        f.addEventListener('click', function () {
          campo.value = ''; estado.termo = ''; aplicar();
        });
        pilulas.appendChild(f);
      }
      marcadas.forEach(function (inp) {
        var f = document.createElement('button');
        f.type = 'button'; f.className = 'pilula';
        f.innerHTML = '<b></b><span aria-hidden="true">×</span>';
        var rotulo = inp.closest('label').textContent.trim().replace(/\s+\d+$/, '');
        $('b', f).textContent = rotulo;
        f.setAttribute('aria-label', 'Remover o filtro ' + rotulo);
        f.addEventListener('click', function () { inp.checked = false; aplicar(); });
        pilulas.appendChild(f);
      });
      pilulas.hidden = !pilulas.children.length;
      if (contaFiltros) {
        contaFiltros.textContent = marcadas.length;
        contaFiltros.hidden = marcadas.length === 0;
      }
    }

    var pintando = false;
    function aplicar(comEspera) {
      var termo = chave(estado.termo).trim();
      var vistos = itens.filter(function (p) {
        if (!passaFiltros(p)) return false;
        if (!termo) return true;
        return termo.split(/\s+/).every(function (t) { return p.busca.indexOf(t) !== -1; });
      });
      vistos.sort(COMPARA[estado.ordem] || COMPARA.relevancia);

      function desenhar() {
        itens.forEach(function (p) { p.el.hidden = true; });
        vistos.forEach(function (p, i) {
          p.el.hidden = false;
          /* Reordena no DOM: a ordem visual e a do teclado têm de bater. */
          grade.appendChild(p.el);
          p.el.classList.remove('visto');
          p.el.style.setProperty('--atraso', (Math.min(i, 10) * 0.025) + 's');
          void p.el.offsetWidth;
          p.el.classList.add('visto');
        });
        if (conta) {
          conta.textContent = vistos.length === itens.length
            ? itens.length + ' produtos'
            : vistos.length + ' de ' + itens.length + ' produtos';
        }
        if (vazio) vazio.hidden = vistos.length > 0;
        if (esqueleto) esqueleto.hidden = true;
        grade.hidden = vistos.length === 0;
        if (limpar) limpar.hidden = !estado.termo;
        pintarFichas();
        pintando = false;
      }

      /* Espera curta só quando o usuário mexeu num controle: o esqueleto
         existe para a mudança não parecer travamento, não para enfeitar. */
      if (comEspera && !calmo && !pintando) {
        pintando = true;
        if (esqueleto) { esqueleto.hidden = false; grade.hidden = true; }
        if (vazio) vazio.hidden = true;
        setTimeout(desenhar, 220);
      } else { desenhar(); }
    }

    if (campo) {
      campo.addEventListener('input', atrasar(function () {
        estado.termo = campo.value; aplicar();
      }, 160));
      campo.addEventListener('search', function () { estado.termo = campo.value; aplicar(); });
    }
    if (limpar) limpar.addEventListener('click', function () {
      campo.value = ''; estado.termo = ''; aplicar(); campo.focus();
    });
    if (ordem) ordem.addEventListener('change', function () {
      estado.ordem = ordem.value; aplicar(true);
    });
    if (painel) {
      painel.addEventListener('change', function () { aplicar(true); });
      painel.addEventListener('submit', function (ev) { ev.preventDefault(); });
      painel.addEventListener('reset', function () {
        setTimeout(function () { aplicar(true); }, 0);
      });
    }
    function fecharPainel() {
      painel.classList.remove('aberto');
      $('#abrirFiltros').setAttribute('aria-expanded', 'false');
      document.body.classList.remove('travado');
    }
    if ($('#abrirFiltros')) {
      $('#abrirFiltros').addEventListener('click', function () {
        var abrindo = !painel.classList.contains('aberto');
        if (abrindo) {
          requestAnimationFrame(function () { painel.classList.add('aberto'); });
          this.setAttribute('aria-expanded', 'true');
          document.body.classList.add('travado');
        } else { fecharPainel(); }
      });
    }
    if ($('#aplicarFiltros')) $('#aplicarFiltros').addEventListener('click', fecharPainel);
    if (reset) reset.addEventListener('click', function () {
      if (campo) campo.value = '';
      estado.termo = ''; estado.ordem = 'relevancia';
      if (ordem) ordem.value = 'relevancia';
      $$('input:checked', painel).forEach(function (i) { i.checked = false; });
      aplicar(true);
    });

    /* No desktop o painel é coluna fixa; no celular, gaveta. */
    function ajustarPainel() {
      if (window.innerWidth >= 1000) painel.classList.remove('aberto');
    }
    ajustarPainel();
    window.addEventListener('resize', atrasar(ajustarPainel, 150));

    /* ?tipo=Camisetas vindo das migalhas já chega filtrado */
    var prm = new URLSearchParams(location.search);
    ['tipo', 'marca', 'categoria'].forEach(function (nome) {
      var v = prm.get(nome);
      if (!v) return;
      var alvo = $$('input[name="' + nome + '"]', painel)
        .find(function (i) { return i.value === v; });
      if (alvo) alvo.checked = true;
    });
    var q = prm.get('q');
    if (q && campo) { campo.value = q; estado.termo = q; }
    aplicar();
  }

  /* ── 07 · Busca em tela cheia ───────────────────────────────── */
  var busca = $('#busca');
  var bCampo = $('#buscaCampo'), bRes = $('#buscaResultados');
  var bStatus = $('#buscaStatus'), bDicas = $('#buscaDicas');
  var TODOS = Object.keys(CATALOGO).map(function (k) { return CATALOGO[k]; })
    .filter(function (p) { return p.busca; });

  function pintarBusca(termo) {
    var t = chave(termo).trim();
    bRes.innerHTML = '';
    if (!t) { bStatus.textContent = ''; bDicas.hidden = false; return; }
    bDicas.hidden = true;
    var achados = TODOS.filter(function (p) {
      return t.split(/\s+/).every(function (q) { return p.busca.indexOf(q) !== -1; });
    }).sort(function (a, b) { return (b.estoque - a.estoque) || a.preco - b.preco; });

    bStatus.textContent = achados.length
      ? achados.length + (achados.length === 1 ? ' produto encontrado' : ' produtos encontrados')
      : 'Nada encontrado para “' + termo.trim() + '”';

    achados.slice(0, 12).forEach(function (p) {
      var a = document.createElement('a');
      a.className = 'achado';
      a.href = RAIZ + p.url;
      a.innerHTML = '<img src="' + RAIZ + p.img.replace(/^\.\.\//, '') + '" alt="" width="62" height="62" loading="lazy">' +
        '<span><p class="achado__nome"></p><p class="achado__cat"></p></span>' +
        '<p class="achado__preco"></p>';
      $('.achado__nome', a).textContent = p.nome;
      $('.achado__cat', a).textContent = p.tipo + (p.estoque ? '' : ' · esgotado');
      $('.achado__preco', a).textContent = reais(p.preco);
      bRes.appendChild(a);
    });
  }
  function abrirBusca() {
    esconderAviso();
    voltarFoco = document.activeElement;
    busca.hidden = false;
    document.body.classList.add('travado');
    requestAnimationFrame(function () { busca.classList.add('vis'); bCampo.focus(); });
  }
  function fecharBusca() {
    busca.classList.remove('vis');
    if (!gavetaAberta) document.body.classList.remove('travado');
    setTimeout(function () {
      busca.hidden = true;
      if (voltarFoco && document.contains(voltarFoco)) voltarFoco.focus();
      voltarFoco = null;
    }, 260);
  }
  if (busca) {
    $('#abrirBusca').addEventListener('click', abrirBusca);
    $('#fecharBusca').addEventListener('click', fecharBusca);
    bCampo.addEventListener('input', atrasar(function () { pintarBusca(bCampo.value); }, 130));
    busca.addEventListener('keydown', function (ev) { prender(busca, ev); });
    $$('[data-termo]', bDicas).forEach(function (b) {
      b.addEventListener('click', function () {
        bCampo.value = b.dataset.termo; pintarBusca(bCampo.value); bCampo.focus();
      });
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== '/' || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var t = ev.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || ev.target.isContentEditable) return;
      ev.preventDefault(); abrirBusca();
    });
  }

  /* ── 08 · Página de produto ─────────────────────────────────── */
  var lightbox = $('#lightbox');
  var minis = $$('.mini'), fotos = $$('.galeria__foto');

  function mostrarFoto(i) {
    fotos.forEach(function (f, j) { f.hidden = j !== i; f.classList.toggle('ativa', j === i); });
    minis.forEach(function (m, j) {
      m.classList.toggle('ativa', j === i);
      m.setAttribute('aria-selected', String(j === i));
      m.tabIndex = j === i ? 0 : -1;
    });
  }
  minis.forEach(function (m, i) { m.addEventListener('click', function () { mostrarFoto(i); }); });
  if (minis.length) {
    $('.galeria__minis').addEventListener('keydown', function (ev) {
      var passos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      var p = passos[ev.key]; if (!p) return;
      ev.preventDefault();
      var a = minis.indexOf(document.activeElement); if (a === -1) return;
      var n = (a + p + minis.length) % minis.length;
      mostrarFoto(n); minis[n].focus();
    });
  }
  fotos.forEach(function (f) {
    f.addEventListener('click', function () {
      if (!lightbox) return;
      esconderAviso();
      voltarFoco = f;
      $('#lightboxImg').src = f.dataset.zoom;
      $('#lightboxImg').alt = $('img', f).alt;
      lightbox.hidden = false;
      document.body.classList.add('travado');
      requestAnimationFrame(function () {
        lightbox.classList.add('vis'); $('#fecharZoom').focus();
      });
    });
  });
  function fecharZoom() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.classList.remove('vis');
    document.body.classList.remove('travado');
    setTimeout(function () {
      lightbox.hidden = true;
      if (voltarFoco && document.contains(voltarFoco)) voltarFoco.focus();
      voltarFoco = null;
    }, 260);
  }
  if (lightbox) {
    $('#fecharZoom').addEventListener('click', fecharZoom);
    lightbox.addEventListener('click', function (ev) { if (ev.target === lightbox) fecharZoom(); });
    lightbox.addEventListener('keydown', function (ev) { prender(lightbox, ev); });
  }

  if (fichaEl) {
    document.body.classList.add('pg-produto');
    var corEscolhida = null, tamEscolhido = null, qtdEscolhida = 1;

    /* preSelecionar: cor pode vir escolhida, tamanho NÃO — tamanho
       marcado por padrão é pedido trocado depois. */
    function grupoRadio(caixa, aoEscolher, preSelecionar) {
      if (!caixa) return;
      var botoes = $$('button', caixa);
      botoes.forEach(function (b) {
        b.addEventListener('click', function () {
          botoes.forEach(function (o) {
            var on = o === b;
            o.classList.toggle('ativa', on);
            o.setAttribute('aria-checked', String(on));
            o.tabIndex = on ? 0 : -1;
          });
          aoEscolher(b);
          b.focus();
        });
      });
      caixa.addEventListener('keydown', function (ev) {
        var passos = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        var p = passos[ev.key]; if (!p) return;
        ev.preventDefault();
        var i = botoes.indexOf(document.activeElement); if (i === -1) return;
        botoes[(i + p + botoes.length) % botoes.length].click();
      });
      if (!preSelecionar) return;
      var inicial = botoes.find(function (b) { return b.classList.contains('ativa'); }) || botoes[0];
      if (inicial) {
        inicial.classList.add('ativa');
        inicial.setAttribute('aria-checked', 'true');
        aoEscolher(inicial);
      }
    }

    grupoRadio($('#cores'), function (b) {
      corEscolhida = b.dataset.nome;
      var alvo = $('#corEscolhida'); if (alvo) alvo.textContent = corEscolhida;
    }, true);
    grupoRadio($('#tamanhos'), function (b) {
      tamEscolhido = b.textContent.trim();
      var e = $('#erroTamanho'); if (e) e.hidden = true;
    });

    var qtdVal = $('#qtdValor');
    function setQtd(n) { qtdEscolhida = Math.max(1, Math.min(99, n)); qtdVal.textContent = qtdEscolhida; }
    $('#qtdMenos').addEventListener('click', function () { setQtd(qtdEscolhida - 1); });
    $('#qtdMais').addEventListener('click', function () { setQtd(qtdEscolhida + 1); });

    function adicionar() {
      if (!tamEscolhido && $('#tamanhos')) {
        var e = $('#erroTamanho');
        if (e) { e.hidden = false; $('#tamanhos').scrollIntoView({ block: 'center' }); }
        return false;
      }
      somar(fichaEl.dataset.slug, { tam: tamEscolhido, cor: corEscolhida, qtd: qtdEscolhida });
      return true;
    }
    if ($('#addCarrinho')) $('#addCarrinho').addEventListener('click', adicionar);
    if ($('#comprarAgora')) $('#comprarAgora').addEventListener('click', function () {
      if (adicionar()) location.href = RAIZ + 'checkout.html';
    });
    if ($('#favProduto')) $('#favProduto').addEventListener('click', function () {
      alternarFav(fichaEl.dataset.slug);
    });

    /* abas */
    var abas = $$('.aba');
    abas.forEach(function (a) {
      a.addEventListener('click', function () {
        abas.forEach(function (o) {
          var on = o === a;
          o.classList.toggle('ativa', on);
          o.setAttribute('aria-selected', String(on));
          o.tabIndex = on ? 0 : -1;
          $('#' + o.getAttribute('aria-controls')).hidden = !on;
        });
      });
    });
    $('.abas__botoes').addEventListener('keydown', function (ev) {
      var passos = { ArrowRight: 1, ArrowLeft: -1 };
      var p = passos[ev.key]; if (!p) return;
      ev.preventDefault();
      var i = abas.indexOf(document.activeElement); if (i === -1) return;
      var n = (i + p + abas.length) % abas.length;
      abas[n].click(); abas[n].focus();
    });

    /* barra fixa de compra no celular */
    if (fichaEl.dataset.estoque === '1') {
      var barra = document.createElement('div');
      barra.className = 'barra-compra'; barra.id = 'barraCompra';
      barra.innerHTML = '<div class="barra-compra__preco"><b></b><span>à vista no Pix</span></div>' +
        '<button type="button" class="btn btn--tinta">Adicionar</button>';
      $('b', barra).textContent = reais(parseFloat(fichaEl.dataset.preco) * 0.95);
      $('button', barra).addEventListener('click', adicionar);
      document.body.appendChild(barra);
      var compraEl = $('.ficha__compra');
      window.addEventListener('scroll', function () {
        var r = compraEl.getBoundingClientRect();
        barra.classList.toggle('vis', r.bottom < 0);
      }, { passive: true });
    }
  }

  /* ── 09 · Checkout ──────────────────────────────────────────── */
  var formCheckout = $('#formCheckout');
  if (formCheckout) {
    var radios = $$('input[name="pagamento"]');
    var camposCartao = $('#camposCartao');
    function trocarPagamento() {
      var v = (radios.find(function (r) { return r.checked; }) || {}).value;
      camposCartao.hidden = v !== 'cartao';
    }
    radios.forEach(function (r) { r.addEventListener('change', trocarPagamento); });
    trocarPagamento();

    /* máscaras leves, só de conveniência */
    var cep = $('#cep');
    if (cep) cep.addEventListener('input', function () {
      var d = cep.value.replace(/\D/g, '').slice(0, 8);
      cep.value = d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d;
    });
    var tel = $('#telefone');
    if (tel) tel.addEventListener('input', function () {
      var d = tel.value.replace(/\D/g, '').slice(0, 11);
      tel.value = d.length > 6
        ? '(' + d.slice(0, 2) + ') ' + d.slice(2, d.length - 4) + '-' + d.slice(-4)
        : d.length > 2 ? '(' + d.slice(0, 2) + ') ' + d.slice(2) : d;
    });

    function erro(campo, msg) {
      var p = $('#erro-' + campo.id);
      campo.setAttribute('aria-invalid', 'true');
      if (p) { p.textContent = msg; p.hidden = false; }
    }
    function limpaErro(campo) {
      campo.removeAttribute('aria-invalid');
      var p = $('#erro-' + campo.id);
      if (p) { p.hidden = true; p.textContent = ''; }
    }

    function validar() {
      var ok = true, primeiro = null;
      $$('[required]', formCheckout).forEach(function (c) {
        if (c.closest('[hidden]')) return;
        limpaErro(c);
        var v = c.value.trim();
        var falha = '';
        if (!v) falha = 'Preencha este campo.';
        else if (c.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
          falha = 'Confira o e-mail: falta algo nele.';
        else if (c.id === 'cep' && v.replace(/\D/g, '').length !== 8)
          falha = 'O CEP tem 8 dígitos.';
        else if (c.id === 'telefone' && v.replace(/\D/g, '').length < 10)
          falha = 'Telefone com DDD, por favor.';
        if (falha) { erro(c, falha); ok = false; primeiro = primeiro || c; }
      });
      if (primeiro) {
        primeiro.focus();
        primeiro.scrollIntoView({ block: 'center', behavior: calmo ? 'auto' : 'smooth' });
      }
      return ok;
    }

    formCheckout.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!carrinho.length) {
        avisar('Seu carrinho está vazio. Escolha um produto primeiro.');
        return;
      }
      if (!validar()) return;
      var caixa = $('#sucesso');
      $('#numPedido').textContent = 'VS-' + String(Date.now()).slice(-6);
      caixa.hidden = false;
      document.body.classList.add('travado');
      requestAnimationFrame(function () {
        caixa.classList.add('vis');
        $('.btn', caixa).focus();
      });
      /* Demonstração: esvazia o carrinho como uma loja real faria. */
      carrinho = []; cupom = null;
      pintarTudo();
    });
    $$('input,select', formCheckout).forEach(function (c) {
      c.addEventListener('input', function () { if (c.getAttribute('aria-invalid')) limpaErro(c); });
    });
    var sucesso = $('#sucesso');
    if (sucesso) sucesso.addEventListener('keydown', function (ev) { prender(sucesso, ev); });
  }

  /* ── 10 · Newsletter e conta ────────────────────────────────── */
  function formSimples(idForm, idCampo, idAviso, mensagem) {
    var f = $(idForm); if (!f) return;
    var campo = $(idCampo), aviso = $(idAviso);
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = campo.value.trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      delete aviso.dataset.ok; delete aviso.dataset.erro;
      if (!ok) {
        campo.setAttribute('aria-invalid', 'true');
        aviso.dataset.erro = '1';
        aviso.textContent = 'Confira o e-mail: falta algo nele.';
        campo.focus();
        return;
      }
      campo.removeAttribute('aria-invalid');
      aviso.dataset.ok = '1';
      aviso.textContent = mensagem;
      f.reset();
    });
  }
  formSimples('#newsForm', '#newsEmail', '#newsAviso',
    'Pronto — mas nada foi enviado: formulário de demonstração.');
  var formConta = $('#formConta');
  if (formConta) {
    formConta.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var em = $('#contaEmail'), se = $('#contaSenha'), av = $('#contaAviso');
      var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim());
      var okSenha = se.value.length >= 4;
      [[em, okEmail, 'Confira o e-mail: falta algo nele.'],
       [se, okSenha, 'Digite ao menos 4 caracteres.']].forEach(function (t) {
        var p = $('#erro-' + t[0].id);
        t[0].toggleAttribute('aria-invalid', !t[1]);
        if (p) { p.hidden = t[1]; p.textContent = t[1] ? '' : t[2]; }
      });
      delete av.dataset.ok;
      if (!okEmail || !okSenha) { (okEmail ? se : em).focus(); return; }
      av.dataset.ok = '1';
      av.textContent = 'Login de demonstração: nenhuma conta foi criada nem consultada.';
      formConta.reset();
    });
  }

  /* ── 11 · Sanfona, teclas e revelação ───────────────────────── */
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

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (lightbox && !lightbox.hidden) fecharZoom();
    else if (busca && !busca.hidden) fecharBusca();
    else if (gavetaAberta) fecharGaveta();
    else if (menu && menu.classList.contains('aberto')) { fecharMenu(); btnMenu.focus(); }
    else if (grade && $('#painelFiltros') && $('#painelFiltros').classList.contains('aberto')) {
      $('#abrirFiltros').click();
    }
  });

  var alvos = $$('.surge');
  if (calmo || !('IntersectionObserver' in window)) {
    alvos.forEach(function (el) { el.classList.add('visto'); });
  } else {
    var olho = new IntersectionObserver(function (ent) {
      ent.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visto');
        olho.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0.05 });
    alvos.forEach(function (el) { olho.observe(el); });
  }

  pintarTudo();
  pintarFavoritos();
})();
