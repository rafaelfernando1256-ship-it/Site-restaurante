'use client';

import { useEffect, useState } from 'react';

/**
 * Quem pediu menos movimento no sistema recebe menos movimento aqui.
 *
 * Por que um hook em vez de só CSS: o `prefers-reduced-motion` do CSS
 * corta transição e animação, mas não impede o JavaScript de montar um
 * canvas 3D rodando a 60 quadros por segundo, nem o Lenis de sequestrar
 * a rolagem. Essas duas coisas precisam ser decididas no React — e são,
 * usando este valor.
 *
 * Começa em `false` de propósito: no servidor não dá para saber a
 * preferência, e assumir "sem movimento" faria o site piscar de um
 * estado para o outro na hidratação. O efeito corrige no primeiro
 * quadro do cliente, antes de qualquer animação começar.
 */
export function usePrefereMenosMovimento(): boolean {
  const [prefere, setPrefere] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefere(consulta.matches);

    // Dá para mudar a preferência com o site aberto. Raro, mas é uma
    // linha respeitar.
    const aoMudar = (evento: MediaQueryListEvent) => setPrefere(evento.matches);
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);

  return prefere;
}

/**
 * A tela é grande o bastante para valer um canvas 3D?
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE ESTA PERGUNTA EXISTE
 * ─────────────────────────────────────────────────────────────────
 * Medindo com o Lighthouse em modo celular, a abertura 3D custou
 * 10,4 SEGUNDOS de bloqueio da thread principal e levou a nota de
 * desempenho para 41. São 500 KB de three.js mais a montagem da cena,
 * cobrados justamente do aparelho com menos folga para pagar.
 *
 * E no celular a forma aparece a 45% de opacidade, atrás do texto,
 * como atmosfera. O degradê em CSS faz o mesmo papel visual por zero.
 *
 * Então, abaixo de 1024px, não é que a animação fique mais simples:
 * o three.js nem é baixado. Não é uma degradação, é a escolha certa
 * para aquele tamanho de tela.
 */
export function useTelaGrande(): boolean {
  const [grande, setGrande] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 1024px)');
    setGrande(consulta.matches);
    const aoMudar = (evento: MediaQueryListEvent) => setGrande(evento.matches);
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);

  return grande;
}
