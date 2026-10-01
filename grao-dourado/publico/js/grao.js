/* ═══════════════════════════════════════════════════════════════
   GRÃO DOURADO — comportamento
   Sem framework e sem dependência. Cinco coisas:
   menu de celular, selo aberto/fechado, filtro do cardápio,
   pedido (que vira mensagem de WhatsApp) e sanfona das perguntas.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DADOS = window.GRAO || {};
  const dinheiro = (v) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  /* ── 1. Menu de celular ──────────────────────────────────────── */
  (() => {
    const botao = $('[data-menu-abre]');
    const menu = $('[data-menu]');
    if (!botao || !menu) return;

    const fecha = () => {
      botao.setAttribute('aria-expanded', 'false');
      menu.classList.remove('is-aberto');
      document.body.style.overflow = '';
      // O hidden volta só depois da transição, senão o painel some
      // de uma vez em vez de esmaecer.
      setTimeout(() => {
        if (botao.getAttribute('aria-expanded') === 'false') menu.hidden = true;
      }, 300);
    };
    const abre = () => {
      menu.hidden = false;
      // Um quadro de folga para o navegador registrar o estado inicial
      // antes da classe que anima — sem isso não há transição.
      requestAnimationFrame(() => {
        menu.classList.add('is-aberto');
        botao.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      });
    };

    botao.addEventListener('click', () =>
      botao.getAttribute('aria-expanded') === 'true' ? fecha() : abre()
    );
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) fecha(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecha(); });
    // Ao passar para desktop o menu some por CSS; o estado precisa
    // acompanhar, senão o scroll do corpo fica travado.
    matchMedia('(min-width:1000px)').addEventListener('change', (e) => {
      if (e.matches) fecha();
    });
  })();

  /* ── 2. Aberto agora ─────────────────────────────────────────── */
  /* Roda no cliente de propósito: o que vale é o relógio de quem
     visita, não o do momento em que o site foi gerado. */
  (() => {
    const selos = $$('[data-aberto]');
    if (!selos.length || !DADOS.horarios) return;

    function estado() {
      const agora = new Date();
      const n = agora.getDay();
      const min = agora.getHours() * 60 + agora.getMinutes();
      const hoje = DADOS.horarios.find((h) => h.n === n);

      if (hoje && hoje.abre !== null && min >= hoje.abre && min < hoje.fecha) {
        const falta = hoje.fecha - min;
        return falta <= 60
          ? { aberto: true, texto: `Fecha em ${falta} min` }
          : { aberto: true, texto: `Aberto até ${rel(hoje.fecha)}` };
      }
      // Procura o próximo dia com expediente, dando a volta na semana.
      for (let i = 0; i < 8; i++) {
        const d = DADOS.horarios.find((h) => h.n === (n + i) % 7);
        if (!d || d.abre === null) continue;
        if (i === 0 && min < d.abre) return { aberto: false, texto: `Abre às ${rel(d.abre)}` };
        if (i === 0) continue;
        return {
          aberto: false,
          texto: i === 1 ? `Abre amanhã às ${rel(d.abre)}` : `Abre ${d.curto} às ${rel(d.abre)}`,
        };
      }
      return { aberto: false, texto: 'Fechado' };
    }
    const rel = (m) =>
      `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;

    function pinta() {
      const e = estado();
      selos.forEach((s) => {
        s.hidden = false;
        s.classList.toggle('is-fechado', !e.aberto);
        const t = $('.aberto__texto', s);
        if (t) t.textContent = e.texto;
      });
      // Destaca a linha de hoje na tabela de horários. Como as linhas
      // agrupam dias seguidos ("Segunda a Quinta"), cada uma carrega em
      // data-dias os números que cobre.
      const hojeN = new Date().getDay();
      $$('.hr__linha').forEach((linha) => {
        const dias = (linha.dataset.dias || '').split(',').map(Number);
        linha.classList.toggle('is-hoje', dias.includes(hojeN));
      });
    }
    pinta();
    setInterval(pinta, 60_000);
  })();

  /* ── 3. Filtro do cardápio ───────────────────────────────────── */
  (() => {
    const barra = $('[data-filtros]');
    if (!barra) return;
    const botoes = $$('.filtro', barra);

    botoes.forEach((b) =>
      b.addEventListener('click', () => {
        const alvo = b.dataset.filtro;
        botoes.forEach((o) => {
          const ativo = o === b;
          o.classList.toggle('is-ativo', ativo);
          o.setAttribute('aria-pressed', String(ativo));
        });
        $$('[data-bloco]').forEach((bloco) => {
          bloco.hidden = alvo !== 'tudo' && bloco.dataset.bloco !== alvo;
        });
      })
    );

    // Chegou com #categoria na URL: já entra filtrado.
    // O hashchange não é luxo: clicar num link de categoria do rodapé
    // ESTANDO já no cardápio troca só o hash, sem recarregar — sem este
    // ouvinte a página rolava até a seção mas o filtro não mexia.
    const aplicaHash = () => {
      const hash = location.hash.slice(1);
      if (!hash) return;
      const b = botoes.find((x) => x.dataset.filtro === hash);
      if (b && !b.classList.contains('is-ativo')) b.click();
    };
    aplicaHash();
    window.addEventListener('hashchange', aplicaHash);
  })();

  /* ── 4. Pedido ───────────────────────────────────────────────── */
  /* Não há pagamento e não há servidor: o pedido vira uma mensagem
     escrita no WhatsApp, que é onde a casa já atende. */
  (() => {
    const painel = $('[data-pedido]');
    const bolha = $('[data-pedido-abre]');
    if (!painel || !bolha || !DADOS.itens) return;

    const CHAVE = 'grao-pedido';
    const acha = (slug) => DADOS.itens.find((i) => i.slug === slug);
    let carrinho = [];

    try {
      carrinho = JSON.parse(localStorage.getItem(CHAVE) || '[]')
        .filter((l) => acha(l.slug) && l.qtd > 0);
    } catch { carrinho = []; }

    const grava = () => {
      // localStorage pode estourar em aba anônima ou com dados de site
      // bloqueados. O pedido continua funcionando na memória.
      try { localStorage.setItem(CHAVE, JSON.stringify(carrinho)); } catch { /* ok */ }
    };
    const total = () =>
      carrinho.reduce((s, l) => s + (acha(l.slug)?.preco || 0) * l.qtd, 0);
    const pecas = () => carrinho.reduce((s, l) => s + l.qtd, 0);

    function mensagem() {
      const linhas = carrinho.map((l) => {
        const i = acha(l.slug);
        return `• ${l.qtd}x ${i.nome} — ${dinheiro(i.preco * l.qtd)}`;
      });
      return (
        'Oi! Quero fazer este pedido:\n\n' +
        linhas.join('\n') +
        `\n\nTotal: ${dinheiro(total())}` +
        '\n\nNome: \nRetirada ou entrega: \nEndereço (se for entrega): '
      );
    }

    function pinta() {
      const lista = $('[data-pedido-lista]');
      const n = pecas();

      bolha.hidden = n === 0;
      $('[data-pedido-contagem]', bolha).textContent = String(n);
      $('[data-pedido-total]').textContent = dinheiro(total());

      const enviar = $('[data-pedido-enviar]');
      enviar.href = `https://wa.me/${DADOS.whatsapp}?text=${encodeURIComponent(mensagem())}`;

      lista.innerHTML = carrinho.length
        ? carrinho.map((l) => {
            const i = acha(l.slug);
            return `<li>
              <span class="pd-nome"><b>${i.nome}</b><small>${dinheiro(i.preco)} cada</small></span>
              <span class="pedido__qtd">
                <button type="button" data-menos="${l.slug}" aria-label="Tirar um ${i.nome}">−</button>
                <span>${l.qtd}</span>
                <button type="button" data-mais="${l.slug}" aria-label="Mais um ${i.nome}">+</button>
              </span>
              <b>${dinheiro(i.preco * l.qtd)}</b>
            </li>`;
          }).join('')
        : '<li class="pedido__vazio">Seu pedido está vazio.</li>';

      if (!carrinho.length) fecha();
      grava();
    }

    function soma(slug, d = 1) {
      if (!acha(slug)) return;
      const linha = carrinho.find((l) => l.slug === slug);
      if (linha) linha.qtd += d;
      else if (d > 0) carrinho.push({ slug, qtd: d });
      carrinho = carrinho.filter((l) => l.qtd > 0);
      pinta();
    }

    const abre = () => {
      painel.hidden = false;
      requestAnimationFrame(() => painel.classList.add('is-aberto'));
    };
    const fecha = () => {
      painel.classList.remove('is-aberto');
      setTimeout(() => { if (!painel.classList.contains('is-aberto')) painel.hidden = true; }, 300);
    };

    document.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) {
        soma(add.dataset.add);
        add.classList.add('is-feito');
        const rotulo = $('span', add);
        if (rotulo) {
          rotulo.textContent = 'Adicionado';
          setTimeout(() => {
            rotulo.textContent = 'Adicionar';
            add.classList.remove('is-feito');
          }, 1300);
        }
        return;
      }
      const combo = e.target.closest('[data-add-combo]');
      if (combo) {
        const c = (DADOS.combos || []).find((x) => x.slug === combo.dataset.addCombo);
        if (c) { c.itens.forEach((s) => soma(s)); abre(); }
        return;
      }
      const mais = e.target.closest('[data-mais]');
      if (mais) return soma(mais.dataset.mais, 1);
      const menos = e.target.closest('[data-menos]');
      if (menos) return soma(menos.dataset.menos, -1);
      if (e.target.closest('[data-pedido-abre]')) return abre();
      if (e.target.closest('[data-pedido-fecha]')) return fecha();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && painel.classList.contains('is-aberto')) fecha();
    });

    pinta();
  })();

  /* ── 5. Sanfona ──────────────────────────────────────────────── */
  (() => {
    $$('.sanfona__botao').forEach((b) =>
      b.addEventListener('click', () => {
        const alvo = document.getElementById(b.getAttribute('aria-controls'));
        const aberto = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', String(!aberto));
        if (alvo) alvo.hidden = aberto;
      })
    );
  })();
})();
