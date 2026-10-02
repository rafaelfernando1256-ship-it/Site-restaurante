/* ═══════════════════════════════════════════════════════════════
   MEGA EXPRESS — comportamento
   Sem framework. Três coisas: menu de celular, sanfona das
   perguntas e o formulário de reserva, que vira mensagem de
   WhatsApp da unidade escolhida.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DADOS = window.MEGA || {};

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
      // Um quadro de folga para o navegador registrar o estado
      // inicial antes da classe que anima.
      requestAnimationFrame(() => {
        menu.classList.add('is-aberto');
        botao.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
      });
    };

    botao.addEventListener('click', () =>
      botao.getAttribute('aria-expanded') === 'true' ? fecha() : abre());
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) fecha(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecha(); });
    matchMedia('(min-width:1000px)').addEventListener('change', (e) => { if (e.matches) fecha(); });
  })();

  /* ── 2. Sanfona ──────────────────────────────────────────────── */
  (() => {
    $$('.sanfona__botao').forEach((b) =>
      b.addEventListener('click', () => {
        const alvo = document.getElementById(b.getAttribute('aria-controls'));
        const aberto = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', String(!aberto));
        if (alvo) alvo.hidden = aberto;
      }));
  })();

  /* ── 3. Reserva ──────────────────────────────────────────────── */
  /* Não há motor de reservas e não há pagamento: o formulário monta
     a mensagem e abre o WhatsApp DA UNIDADE escolhida. Mandar para
     a central errada é o jeito mais rápido de perder a reserva. */
  (() => {
    const form = $('[data-reserva]');
    if (!form || !DADOS.unidades) return;

    const resumo = $('[data-resumo]', form);
    const erro = $('[data-erro]', form);
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

    const iso = (d) => d.toISOString().slice(0, 10);
    const lerData = (v) => {
      // Lê como data LOCAL. `new Date('2026-10-02')` é interpretado
      // como UTC e, a oeste de Greenwich, volta um dia — o hóspede
      // pediria a diária errada.
      const [a, m, d] = (v || '').split('-').map(Number);
      return a && m && d ? new Date(a, m - 1, d) : null;
    };
    const porExtenso = (d) =>
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

    const entrada = form.elements.entrada;
    const saida = form.elements.saida;
    entrada.min = iso(hoje);
    saida.min = iso(hoje);

    function estado() {
      const e = lerData(entrada.value);
      const s = lerData(saida.value);
      const ad = Math.max(1, Number(form.elements.adultos.value) || 1);
      const cr = Math.max(0, Number(form.elements.criancas.value) || 0);
      const uni = DADOS.unidades.find((u) => u.slug === form.elements.unidade.value);
      const noites = e && s ? Math.round((s - e) / 86400000) : 0;
      return { e, s, ad, cr, uni, noites };
    }

    function valida({ e, s, noites }) {
      if (!e || !s) return 'Preencha a data de entrada e a de saída.';
      if (e < hoje) return 'A data de entrada não pode estar no passado.';
      if (noites < 1) return 'A saída precisa ser pelo menos um dia depois da entrada.';
      return '';
    }

    function pinta() {
      const st = estado();
      const problema = valida(st);
      if (st.noites > 0 && !problema) {
        const pessoas = st.ad + st.cr;
        resumo.innerHTML =
          `<b>${st.noites}</b> ${st.noites === 1 ? 'noite' : 'noites'} · ` +
          `<b>${pessoas}</b> ${pessoas === 1 ? 'pessoa' : 'pessoas'} · ` +
          `<b>${st.uni ? st.uni.nome : ''}</b>`;
      } else {
        resumo.textContent = 'Escolha as datas para ver o resumo.';
      }
      // O erro só aparece depois de a pessoa ter mexido nas duas
      // datas: avisar antes disso é implicância, não ajuda.
      const mexeu = entrada.value && saida.value;
      erro.hidden = !(mexeu && problema);
      if (mexeu && problema) erro.textContent = problema;
    }

    function mensagem(st) {
      const linhas = [
        `Oi! Vim pelo site e queria reservar no ${st.uni.nome}.`,
        '',
        `Entrada: ${porExtenso(st.e)}`,
        `Saída: ${porExtenso(st.s)}`,
        `Noites: ${st.noites}`,
        `Pessoas: ${st.ad} ${st.ad === 1 ? 'adulto' : 'adultos'}` +
          (st.cr ? ` e ${st.cr} ${st.cr === 1 ? 'criança' : 'crianças'}` : ''),
      ];
      const obs = (form.elements.obs.value || '').trim();
      if (obs) linhas.push('', `Observação: ${obs}`);
      linhas.push('', 'Pode confirmar a disponibilidade e o valor?');
      return linhas.join('\n');
    }

    form.addEventListener('input', pinta);
    form.addEventListener('change', pinta);

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const st = estado();
      const problema = valida(st);
      if (problema) {
        erro.hidden = false;
        erro.textContent = problema;
        (!st.e ? entrada : saida).focus();
        return;
      }
      window.open(
        `https://wa.me/${st.uni.telefone}?text=${encodeURIComponent(mensagem(st))}`,
        '_blank', 'noopener'
      );
    });

    // Escolher a entrada já empurra a saída para o dia seguinte:
    // poupa um toque e evita o erro mais comum do formulário.
    entrada.addEventListener('change', () => {
      const e = lerData(entrada.value);
      if (!e) return;
      const minSaida = new Date(e); minSaida.setDate(minSaida.getDate() + 1);
      saida.min = iso(minSaida);
      const s = lerData(saida.value);
      if (!s || s <= e) saida.value = iso(minSaida);
      pinta();
    });

    pinta();
  })();
})();
