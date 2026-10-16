'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

import { usePrefereMenosMovimento } from '@/lib/movimento';

/**
 * O APARECER NA ROLAGEM.
 *
 * Um envelope que sobe o conteúdo alguns pixels e abre a opacidade
 * quando ele entra na tela. Usado em quase toda seção — por isso mora
 * num componente só, em vez de repetido doze vezes.
 *
 * `once: true` é deliberado: o elemento aparece uma vez e fica. Site
 * que anima de novo toda vez que você rola para cima cansa em trinta
 * segundos.
 *
 * Quem pediu menos movimento recebe o conteúdo já no lugar — sem
 * deslocamento, sem fade, sem espera. Importa que seja assim e não
 * "animação mais curta": o conteúdo tem que estar visível de imediato.
 */

type Props = {
  children: React.ReactNode;
  /** Atraso em segundos, para escalonar itens de uma lista. */
  atraso?: number;
  /** Distância que o elemento sobe, em pixels. */
  distancia?: number;
  className?: string;
  as?: 'div' | 'li' | 'span' | 'section' | 'article';
};

export function Revelar({
  children,
  atraso = 0,
  distancia = 28,
  className = '',
  as = 'div',
}: Props) {
  const alvo = useRef<HTMLDivElement>(null);
  const menosMovimento = usePrefereMenosMovimento();
  // A margem negativa embaixo faz o elemento esperar entrar de verdade
  // na tela, e não disparar com um pixel aparecendo.
  const naTela = useInView(alvo, { once: true, margin: '0px 0px -12% 0px' });

  const Componente = motion[as];

  if (menosMovimento) {
    const Simples = as;
    return (
      <Simples ref={alvo as never} className={className}>
        {children}
      </Simples>
    );
  }

  return (
    <Componente
      ref={alvo as never}
      className={className}
      initial={{ opacity: 0, y: distancia }}
      animate={naTela ? { opacity: 1, y: 0 } : { opacity: 0, y: distancia }}
      transition={{ duration: 0.85, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Componente>
  );
}
