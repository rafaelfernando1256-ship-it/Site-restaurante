'use client';

/**
 * O fecho: o nome inteiro, de margem a margem, crescendo de leve
 * enquanto chega — o único momento barulhento da página. Embaixo, uma
 * linha só com o essencial.
 *
 * O tamanho é a largura útil dividida pela largura do próprio nome em
 * Anton (4,3 vezes a altura): assim ele vai de margem a margem em
 * qualquer tela, sem vazar.
 */
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

import { negocio } from '@/content/negocio';

export default function Nome({ ano }: { ano: number }) {
  const caixa = useRef<HTMLElement>(null);
  const quieto = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: caixa, offset: ['start end', 'end end'] });
  const escala = useTransform(scrollYProgress, [0, 1], [0.93, 1]);

  return (
    <footer ref={caixa} className="moldura mt-[var(--entre-secoes)] overflow-hidden pb-8">
      <motion.p aria-hidden className="titulo origin-bottom-left whitespace-nowrap text-[calc((100vw-2*var(--margem))*0.229)] leading-[0.8] tracking-[-0.01em] text-tinta"
        style={quieto ? undefined : { scale: escala }}>
        Caixa Bruta
      </motion.p>
      <div className="mt-10 grid gap-3 text-nota sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-8">
        <p className="text-cinza">Churrasco sob encomenda em Sarandi, PR</p>
        <nav aria-label="Rodapé" className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
          <a href="#cardapio" className="hover:text-dourado">Cardápio</a>
          <a href="#como-funciona" className="hover:text-dourado">Como funciona</a>
          <a href={`https://wa.me/${negocio.whatsapp.numero}`} target="_blank" rel="noopener" className="hover:text-dourado">
            WhatsApp {negocio.whatsapp.exibicao}
          </a>
        </nav>
        <p className="text-cinza sm:text-right">{ano} {negocio.nome}. {negocio.slogan}</p>
      </div>
    </footer>
  );
}
