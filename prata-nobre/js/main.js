/* ═══════════════════════════════════════════════════════════════
   PRATA NOBRE — comportamento da loja
   Baunilha pura, sem dependências.

   Os produtos NÃO estão duplicados aqui: cada <article class="peca">
   carrega os próprios dados em atributos data-*, e este arquivo lê
   dali. Para mudar preço, foto ou tamanho, mexa só no HTML.

   Sumário
   01 · Ajudantes            05 · Janela de produto
   02 · Catálogo (do DOM)    06 · Sacola
   03 · Cabeçalho e menu     07 · Dúvidas (sanfona)
   04 · Filtros              08 · Revelação e arremates
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 01 · Ajudantes ─────────────────────────────────────────── */
  var $  = function (s, raiz) { return (raiz || document).querySelector(s); };
  var $$ = function (s, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(s)); };

  var WHATS        = '5511900000000';   // telefone da loja (fictício)
  var FRETE_GRATIS = 299;               // piso para o frete grátis, em reais
  var CHAVE        = 'prata-nobre:sacola';

  function reais(n) {
    return 'R$ ' + n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function focaveis(caixa) {
    return $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', caixa)
      .filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
  }

  /* Prende o Tab dentro de um painel aberto (sacola, janela). */
  function prender(caixa, ev) {
    if (ev.key !== 'Tab') return;
    var lista = focaveis(caixa);
    if (!lista.length) return;
    var primeiro = lista[0], ultimo = lista[lista.length - 1];
    if (ev.shiftKey && document.activeElement === primeiro) { ev.preventDefault(); ultimo.focus(); }
    else if (!ev.shiftKey && document.activeElement === ultimo) { ev.preventDefault(); primeiro.focus(); }
  }

  var aviso = $('#toast'), avisoTempo;
  function avisar(texto) {
    if (!aviso) return;
    aviso.textContent = texto;
    aviso.classList.add('vis');
    clearTimeout(avisoTempo);
    avisoTempo = setTimeout(function () { aviso.classList.remove('vis'); }, 2600);
  }

  /* ── 02 · Catálogo lido do DOM ──────────────────────────────── */
  var cartoes = $$('.peca');

  var catalogo = cartoes.map(function (el) {
    var opcoes = (el.dataset.opcoes || '').split('|').filter(Boolean);
    return {
      el:       el,
      id:       el.dataset.id,
      nome:     el.dataset.nome,
      preco:    parseFloat(el.dataset.preco),
      img:      el.dataset.img,
      cat:      el.dataset.cat,
      desc:     el.dataset.desc,
      detalhe:  el.dataset.detalhe,
      medidas:  el.dataset.medidas,
      opcoes:   opcoes,
      rotulo:   el.dataset.opcoesRotulo || 'Tamanho'
    };
  });

  function achar(id) {
    for (var i = 0; i < catalogo.length; i++) if (catalogo[i].id === id) return catalogo[i];
    return null;
  }

  var NOME_CAT = {
    aneis: 'Anéis', correntes: 'Correntes', pulseiras: 'Pulseiras',
    brincos: 'Brincos', kits: 'Kits'
  };

  /* ── 03 · Cabeçalho e menu ──────────────────────────────────── */
  var topo    = $('.topo');
  var nav     = $('#nav');
  var btnMenu = $('#abrirMenu');

  var ultimoY = -1;
  function aoRolar() {
    var y = window.pageYOffset;
    if ((y > 8) !== (ultimoY > 8)) topo.classList.toggle('desceu', y > 8);
    ultimoY = y;
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  function fecharMenu() {
    nav.classList.remove('aberto');
    btnMenu.setAttribute('aria-expanded', 'false');
  }

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

  /* ── 04 · Filtros por categoria ─────────────────────────────── */
  var filtros = $$('.filtro');
  var vazio   = $('#colecaoVazio');

  function filtrar(chave) {
    var visiveis = 0;

    filtros.forEach(function (b) {
      var ativo = b.dataset.filtro === chave;
      b.classList.toggle('ativo', ativo);
      b.setAttribute('aria-pressed', String(ativo));
    });

    cartoes.forEach(function (el) {
      var mostra = chave === 'todas' || el.dataset.cat === chave;
      el.hidden = !mostra;
      if (mostra) {
        visiveis++;
        /* Reentrada suave: some e volta, sem pular a linha toda. */
        el.classList.remove('vis');
        el.style.setProperty('--atraso', (visiveis * 0.035) + 's');
        void el.offsetWidth;
        el.classList.add('vis');
      }
    });

    if (vazio) vazio.hidden = visiveis > 0;
  }

  filtros.forEach(function (b) {
    b.addEventListener('click', function () { filtrar(b.dataset.filtro); });
  });

  /* Os cartões de categoria já chegam na coleção com o filtro posto. */
  $$('[data-ir]').forEach(function (a) {
    a.addEventListener('click', function () { filtrar(a.dataset.ir); });
  });

  /* ── 05 · Janela de produto ─────────────────────────────────── */
  var janela   = $('#janela');
  var jImg     = $('#janelaImg');
  var jCat     = $('#janelaCat');
  var jNome    = $('#janelaNome');
  var jPreco   = $('#janelaPreco');
  var jDetalhe = $('#janelaDetalhe');
  var jMedidas = $('#janelaMedidas');
  var jRotulo  = $('#janelaOpcoesRotulo');
  var jOpcoes  = $('#janelaOpcoes');
  var jAdd     = $('#janelaAdd');
  var jFechar  = $('#janelaFechar');

  var emCartaz = null;      // produto aberto na janela
  var escolhido = null;     // opção marcada
  var voltarPara = null;    // foco a devolver ao fechar

  function pintarOpcoes(prod) {
    jOpcoes.innerHTML = '';
    escolhido = prod.opcoes[0] || null;

    prod.opcoes.forEach(function (op, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opcao';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(i === 0));
      b.tabIndex = i === 0 ? 0 : -1;
      b.textContent = op;
      b.addEventListener('click', function () {
        escolhido = op;
        $$('.opcao', jOpcoes).forEach(function (o) {
          o.setAttribute('aria-checked', String(o === b));
          o.tabIndex = o === b ? 0 : -1;
        });
        b.focus();
      });
      jOpcoes.appendChild(b);
    });

    /* Setas navegam o grupo de opções, como manda o padrão de rádio. */
    jOpcoes.addEventListener('keydown', function (ev) {
      var teclas = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
      if (teclas.indexOf(ev.key) === -1) return;
      var lista = $$('.opcao', jOpcoes);
      var i = lista.indexOf(document.activeElement);
      if (i === -1) return;
      ev.preventDefault();
      var passo = (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') ? 1 : -1;
      lista[(i + passo + lista.length) % lista.length].click();
    });

    var soUm = prod.opcoes.length <= 1 && (prod.opcoes[0] || '').toLowerCase() === 'único';
    jOpcoes.parentNode.hidden = soUm;
  }

  function abrirJanela(prod, origem) {
    emCartaz   = prod;
    voltarPara = origem || document.activeElement;

    jImg.src          = prod.img;
    jImg.alt          = prod.nome + ' em prata 925';
    jCat.textContent  = NOME_CAT[prod.cat] || '';
    jNome.textContent = prod.nome;
    jPreco.textContent = reais(prod.preco);
    jDetalhe.textContent = prod.detalhe;
    jMedidas.textContent = prod.medidas;
    jRotulo.textContent  = prod.rotulo;
    pintarOpcoes(prod);

    janela.hidden = false;
    document.body.classList.add('travado');
    requestAnimationFrame(function () {
      janela.classList.add('vis');
      jFechar.focus();
    });
  }

  function fecharJanela() {
    janela.classList.remove('vis');
    document.body.classList.remove('travado');
    setTimeout(function () {
      janela.hidden = true;
      if (voltarPara && document.contains(voltarPara)) voltarPara.focus();
      voltarPara = null;
    }, 340);
  }

  jFechar.addEventListener('click', fecharJanela);
  janela.addEventListener('click', function (ev) { if (ev.target === janela) fecharJanela(); });
  janela.addEventListener('keydown', function (ev) { prender(janela.querySelector('.janela__caixa'), ev); });

  jAdd.addEventListener('click', function () {
    if (!emCartaz) return;
    somar(emCartaz, escolhido);
    fecharJanela();
    abrirSacola();
  });

  /* Botões "Ver produto" e a própria foto do cartão. */
  cartoes.forEach(function (el) {
    var prod = achar(el.dataset.id);

    $$('[data-ver]', el).forEach(function (g) {
      g.addEventListener('click', function (ev) {
        ev.preventDefault();
        abrirJanela(prod, g);
      });
    });

    $$('[data-add]', el).forEach(function (g) {
      g.addEventListener('click', function () {
        somar(prod, prod.opcoes[0] || null);
      });
    });
  });

  /* ── 06 · Sacola ────────────────────────────────────────────── */
  var sacola     = $('#sacola');
  var cortina    = $('#cortina');
  var sItens     = $('#sacolaItens');
  var sVazia     = $('#sacolaVazia');
  var sTotal     = $('#sacolaTotal');
  var sBarra     = $('#sacolaBarra');
  var sFrete     = $('#sacolaFreteTexto');
  var sContador  = $('#sacolaContador');
  var sFinalizar = $('#sacolaFinalizar');
  var btnSacola  = $('#abrirSacola');
  var btnFechaS  = $('#fecharSacola');

  var carrinho = [];   // [{ id, opcao, qtd }]

  function ler() {
    try {
      var cru = JSON.parse(localStorage.getItem(CHAVE));
      if (!Array.isArray(cru)) return [];
      /* Descarta o que não existe mais no catálogo. */
      return cru.filter(function (l) { return l && achar(l.id) && l.qtd > 0; })
                .map(function (l) { return { id: l.id, opcao: l.opcao || null, qtd: Math.min(99, l.qtd | 0) }; });
    } catch (e) { return []; }
  }

  function gravar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(carrinho)); } catch (e) { /* modo privado: tudo bem */ }
  }

  function subtotal() {
    return carrinho.reduce(function (t, l) {
      var p = achar(l.id);
      return t + (p ? p.preco * l.qtd : 0);
    }, 0);
  }

  function pecasNaSacola() {
    return carrinho.reduce(function (t, l) { return t + l.qtd; }, 0);
  }

  function somar(prod, opcao) {
    var linha = null;
    for (var i = 0; i < carrinho.length; i++) {
      if (carrinho[i].id === prod.id && carrinho[i].opcao === opcao) { linha = carrinho[i]; break; }
    }
    if (linha) linha.qtd = Math.min(99, linha.qtd + 1);
    else carrinho.push({ id: prod.id, opcao: opcao, qtd: 1 });

    pintarSacola();
    gravar();
    pularContador();
    avisar(prod.nome + ' entrou na sacola.');
  }

  function mudarQtd(indice, delta) {
    var linha = carrinho[indice];
    if (!linha) return;
    linha.qtd += delta;
    if (linha.qtd < 1) carrinho.splice(indice, 1);
    pintarSacola();
    gravar();
  }

  function tirar(indice) {
    var linha = carrinho[indice];
    if (!linha) return;
    var p = achar(linha.id);
    carrinho.splice(indice, 1);
    pintarSacola();
    gravar();
    avisar((p ? p.nome : 'Peça') + ' saiu da sacola.');
  }

  function pularContador() {
    sContador.classList.remove('pulo');
    void sContador.offsetWidth;
    sContador.classList.add('pulo');
  }

  function textoWhats() {
    if (!carrinho.length) return 'Olá! Vi o site da Prata Nobre e queria tirar uma dúvida.';
    var linhas = ['Olá! Gostei destas peças no site da Prata Nobre:', ''];
    carrinho.forEach(function (l) {
      var p = achar(l.id);
      if (!p) return;
      var tam = (l.opcao && l.opcao.toLowerCase() !== 'único') ? ' (' + p.rotulo.toLowerCase() + ' ' + l.opcao + ')' : '';
      linhas.push('• ' + l.qtd + 'x ' + p.nome + tam + ' — ' + reais(p.preco * l.qtd));
    });
    linhas.push('', 'Subtotal: ' + reais(subtotal()));
    return linhas.join('\n');
  }

  function pintarSacola() {
    var total = subtotal();
    var n     = pecasNaSacola();

    /* Itens */
    $$('.item', sItens).forEach(function (el) { el.remove(); });
    sVazia.hidden = carrinho.length > 0;

    carrinho.forEach(function (linha, indice) {
      var p = achar(linha.id);
      if (!p) return;

      var item = document.createElement('div');
      item.className = 'item';

      var foto = document.createElement('img');
      foto.className = 'item__foto';
      foto.src = p.img;
      foto.alt = '';
      foto.width = 72; foto.height = 72;
      foto.loading = 'lazy';

      var corpo = document.createElement('div');

      var nome = document.createElement('p');
      nome.className = 'item__nome';
      nome.textContent = p.nome;
      corpo.appendChild(nome);

      if (linha.opcao && linha.opcao.toLowerCase() !== 'único') {
        var op = document.createElement('p');
        op.className = 'item__opcao';
        op.textContent = p.rotulo + ': ' + linha.opcao;
        corpo.appendChild(op);
      }

      var fila = document.createElement('div');
      fila.className = 'item__linha';

      var qtd = document.createElement('div');
      qtd.className = 'qtd';

      var menos = document.createElement('button');
      menos.type = 'button';
      menos.textContent = '−';
      menos.setAttribute('aria-label', 'Diminuir quantidade de ' + p.nome);
      menos.addEventListener('click', function () { mudarQtd(indice, -1); });

      var conta = document.createElement('span');
      conta.textContent = linha.qtd;
      conta.setAttribute('aria-label', linha.qtd + ' unidades');

      var mais = document.createElement('button');
      mais.type = 'button';
      mais.textContent = '+';
      mais.setAttribute('aria-label', 'Aumentar quantidade de ' + p.nome);
      mais.addEventListener('click', function () { mudarQtd(indice, 1); });

      qtd.appendChild(menos); qtd.appendChild(conta); qtd.appendChild(mais);

      var preco = document.createElement('p');
      preco.className = 'item__preco';
      preco.textContent = reais(p.preco * linha.qtd);

      fila.appendChild(qtd); fila.appendChild(preco);
      corpo.appendChild(fila);

      var remover = document.createElement('button');
      remover.type = 'button';
      remover.className = 'item__remover';
      remover.textContent = 'Remover';
      remover.setAttribute('aria-label', 'Remover ' + p.nome + ' da sacola');
      remover.addEventListener('click', function () { tirar(indice); });
      corpo.appendChild(remover);

      item.appendChild(foto);
      item.appendChild(corpo);
      sItens.appendChild(item);
    });

    /* Totais */
    sTotal.textContent = reais(total);
    sContador.textContent = n;
    sContador.classList.toggle('tem', n > 0);
    btnSacola.setAttribute('aria-label', n > 0
      ? 'Abrir sacola de compras, ' + n + (n === 1 ? ' peça' : ' peças')
      : 'Abrir sacola de compras');

    /* Barra do frete grátis */
    var falta = Math.max(0, FRETE_GRATIS - total);
    sBarra.style.width = Math.min(100, (total / FRETE_GRATIS) * 100) + '%';
    sFrete.innerHTML = falta > 0
      ? 'Faltam <strong>' + reais(falta) + '</strong> para o frete grátis'
      : '<strong>Frete grátis liberado.</strong> Boa escolha.';

    sFinalizar.href = 'https://wa.me/' + WHATS + '?text=' + encodeURIComponent(textoWhats());
  }

  var sacolaAberta = false;

  function abrirSacola() {
    if (sacolaAberta) return;
    sacolaAberta = true;
    voltarPara = voltarPara || document.activeElement;

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
    if (janela.hidden) document.body.classList.remove('travado');

    setTimeout(function () {
      cortina.hidden = true;
      if (voltarPara && document.contains(voltarPara)) voltarPara.focus();
      voltarPara = null;
    }, 340);
  }

  btnSacola.addEventListener('click', function () { voltarPara = btnSacola; abrirSacola(); });
  btnFechaS.addEventListener('click', fecharSacola);
  cortina.addEventListener('click', fecharSacola);
  sacola.addEventListener('keydown', function (ev) { prender(sacola, ev); });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (!janela.hidden) fecharJanela();
    else if (sacolaAberta) fecharSacola();
    else if (nav.classList.contains('aberto')) { fecharMenu(); btnMenu.focus(); }
  });

  carrinho = ler();
  pintarSacola();

  /* ── 07 · Dúvidas (sanfona) ─────────────────────────────────── */
  $$('.sanfona__item').forEach(function (item) {
    var botao    = $('button', item);
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

  /* ── 08 · Revelação e arremates ─────────────────────────────── */
  var alvos = $$('.anima');

  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    alvos.forEach(function (el) { el.classList.add('vis'); });
  } else {
    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('vis');
        olho.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    alvos.forEach(function (el) { olho.observe(el); });
  }

  var ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
