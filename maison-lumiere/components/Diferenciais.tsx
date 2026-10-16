'use client';

import { animate, useInView } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { Revelar } from '@/components/Revelar';
import { site } from '@/content/site';
import { usePrefereMenosMovimento } from '@/lib/movimento';

/**
 * OS NÚMEROS.
 *
 * Contam de zero até o valor quando a seção entra na tela.
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE NÃO GSAP
 * ─────────────────────────────────────────────────────────────────
 * A primeira versão usava GSAP + ScrollTrigger aqui. Funcionava bem,
 * e era a única coisa no site inteiro que os usava: 70 KB de
 * biblioteca para contar quatro números.
 *
 * O Lighthouse em modo celular cobrou essa conta. Agora a contagem usa
 * o `animate` e o `useInView` do framer-motion, que já estão no pacote
 * porque o resto do site anima com eles. Mesmo resultado, uma
 * dependência a menos.
 *
 * ─────────────────────────────────────────────────────────────────
 * O NÚMERO ESTÁ NO HTML DESDE O SERVIDOR
 * ─────────────────────────────────────────────────────────────────
 * O valor final é renderizado no servidor e só então sobrescrito pela
 * animação. Quem chega sem JavaScript, com JS falhando, ou com um
 * leitor de tela, vê "12" — e não um zero parado, que é o que acontece
 * quando se começa a contagem do HTML em branco.
 *
 * Quem pediu menos movimento não vê contagem nenhuma: os números já
 * estão certos, e nada precisa acontecer.
 */
export function Diferenciais() {
  const { diferenciais } = site;
  const secao = useRef<HTMLElement>(null);
  const menosMovimento = usePrefereMenosMovimento();

  // `useInView` observa a seção; a contagem começa quando ela entra
  // e acontece uma vez só. Contar de novo a cada rolagem para cima
  // transformaria informação em enfeite.
  const naTela = useInView(secao, { once: true, margin: '0px 0px -15% 0px' });

  useEffect(() => {
    if (menosMovimento || !naTela || !secao.current) return;

    const paradas = Array.from(
      secao.current.querySelectorAll<HTMLElement>('[data-numero]'),
    ).map((elemento) => {
      const alvo = Number(elemento.dataset.numero);
      const sufixo = elemento.dataset.sufixo ?? '';

      return animate(0, alvo, {
        duration: 1.9,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (valor) => {
          elemento.textContent = `${Math.round(valor)}${sufixo}`;
        },
        // Se o componente sair antes do fim, o número tem que ficar
        // certo — e não congelado em "7 anos de casa".
        onComplete: () => {
          elemento.textContent = `${alvo}${sufixo}`;
        },
      });
    });

    return () => paradas.forEach((parada) => parada.stop());
  }, [menosMovimento, naTela]);

  return (
    <section ref={secao} className="grao relative overflow-hidden bg-areia py-28 lg:py-40">
      <div className="mx-auto max-w-[82rem] px-6 lg:px-10">
        <div className="max-w-2xl">
          <Revelar>
            <p className="sobretitulo">{diferenciais.sobretitulo}</p>
            <span className="regua mt-5" />
          </Revelar>
          <Revelar atraso={0.08}>
            <h2 className="mt-9 font-display text-[clamp(2.2rem,5vw,3.8rem)] text-grafite">
              {diferenciais.titulo}
            </h2>
          </Revelar>
          <Revelar atraso={0.14}>
            <p className="mt-7 text-[0.98rem] leading-[1.75] text-grafite-suave">
              {diferenciais.texto}
            </p>
          </Revelar>
        </div>

        <ul className="mt-20 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
          {diferenciais.itens.map((item, i) => (
            <Revelar
              key={item.rotulo}
              as="li"
              atraso={i * 0.08}
              className="border-t border-grafite/15 pt-7"
            >
              <p className="font-display text-[clamp(3.4rem,7vw,5rem)] font-light leading-none text-grafite">
                <span data-numero={item.numero} data-sufixo={item.sufixo}>
                  {item.numero}
                  {item.sufixo}
                </span>
              </p>
              <p className="mt-4 text-[0.95rem] font-medium tracking-wide text-grafite">
                {item.rotulo}
              </p>
              <p className="mt-2 text-[0.88rem] leading-relaxed text-grafite-suave">
                {item.detalhe}
              </p>
            </Revelar>
          ))}
        </ul>
      </div>
    </section>
  );
}
