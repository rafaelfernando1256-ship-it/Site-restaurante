'use client';

import { useEffect } from 'react';

import { usePrefereMenosMovimento, useTelaGrande } from '@/lib/movimento';

/**
 * A ROLAGEM SUAVE.
 *
 * O Lenis substitui a rolagem do navegador por uma interpolada — é o
 * que dá o peso de site de agência em vez de página que pula.
 *
 * Duas decisões importantes:
 *
 * 1. Quem pediu menos movimento NÃO recebe o Lenis. Rolagem
 *    sequestrada é um gatilho real de enjoo para quem tem sensibilidade
 *    vestibular, e aqui ela simplesmente não é instalada — não é
 *    "instalada e desligada".
 *
 * 2. Abaixo de 1024px o Lenis NEM É CARREGADO. Ele suaviza a roda do
 *    mouse, e celular não tem roda: a rolagem por dedo já é boa, e
 *    interceptá-la dá aquela sensação de atraso que todo mundo
 *    reconhece e ninguém sabe nomear. Era peso e trabalho de thread
 *    em troca de nada no aparelho com menos folga.
 */
export function SuaveScroll() {
  const menosMovimento = usePrefereMenosMovimento();
  const telaGrande = useTelaGrande();

  useEffect(() => {
    if (menosMovimento || !telaGrande) return;

    // O import é dinâmico e fica DENTRO do efeito: assim o Lenis só é
    // baixado quando vai mesmo ser usado. Com `import` no topo do
    // arquivo ele entraria no pacote de todo mundo, inclusive de quem
    // nunca vai instanciá-lo — que é justamente o celular.
    let lenis: import('lenis').default | undefined;
    let quadro = 0;
    let aoClicar: ((evento: MouseEvent) => void) | undefined;
    let cancelado = false;

    import('lenis').then(({ default: Lenis }) => {
      if (cancelado) return;
      lenis = new Lenis({
        duration: 1.05,
        // Uma exponencial: rápida no começo, assentando no fim.
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });

      const roda = (tempo: number) => {
        lenis?.raf(tempo);
        quadro = requestAnimationFrame(roda);
      };
      quadro = requestAnimationFrame(roda);

      // Os links de âncora precisam passar pelo Lenis, senão o
      // navegador dá o salto nativo e a suavidade some justo no
      // clique. Onde o Lenis não é carregado, quem suaviza é o
      // `scroll-behavior` do CSS.
      aoClicar = (evento: MouseEvent) => {
        const alvo = (evento.target as HTMLElement | null)?.closest('a[href^="#"]');
        if (!alvo) return;
        const destino = alvo.getAttribute('href');
        if (!destino || destino === '#') return;
        const elemento = document.querySelector(destino);
        if (!elemento) return;
        evento.preventDefault();
        lenis?.scrollTo(elemento as HTMLElement, { offset: -80 });
      };

      document.addEventListener('click', aoClicar);
    });

    return () => {
      cancelado = true;
      if (aoClicar) document.removeEventListener('click', aoClicar);
      cancelAnimationFrame(quadro);
      lenis?.destroy();
    };
  }, [menosMovimento, telaGrande]);

  return null;
}
