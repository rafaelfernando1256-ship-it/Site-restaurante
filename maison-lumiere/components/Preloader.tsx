'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { site } from '@/content/site';
import { usePrefereMenosMovimento } from '@/lib/movimento';

/**
 * A CORTINA DE ABERTURA.
 *
 * Fica por cima da página, mostra a marca, e sai de cena. É o momento
 * em que o site diz quem é antes de dizer o que faz.
 *
 * Três cuidados que separam um preloader bom de um preloader chato:
 *
 * 1. É CURTO. 1,1 segundo no total. Preloader de três segundos é
 *    pedágio, não introdução.
 *
 * 2. NÃO MENTE sobre carregamento. Ele não finge uma barra de
 *    progresso de download — o conteúdo já está lá, renderizado pelo
 *    servidor, embaixo dele. A linha dourada é uma transição, e é
 *    honesta sobre isso por ser só uma linha.
 *
 * 3. NÃO EXISTE para quem pediu menos movimento, e não existe para
 *    quem não tem JavaScript: a página vem inteira do servidor, e esta
 *    cortina é posta por cima depois. Se o JS falhar, o visitante
 *    simplesmente vê o site.
 */
export function Preloader() {
  const menosMovimento = usePrefereMenosMovimento();
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    if (menosMovimento) {
      setVisivel(false);
      return;
    }

    // Enquanto a cortina está no ar, a rolagem fica travada — senão dá
    // para rolar às cegas por trás dela.
    document.body.style.overflow = 'hidden';
    const relogio = setTimeout(() => setVisivel(false), 1100);

    return () => {
      clearTimeout(relogio);
      document.body.style.overflow = '';
    };
  }, [menosMovimento]);

  useEffect(() => {
    if (!visivel) document.body.style.overflow = '';
  }, [visivel]);

  if (menosMovimento) return null;

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center bg-areia"
          // A cortina sobe inteira, como um pano de teatro.
          exit={{ y: '-100%' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          // Leitor de tela não deve anunciar isto: o conteúdo real já
          // está no DOM e é ele que importa.
          aria-hidden="true"
        >
          <div className="text-center">
            <motion.p
              className="font-display text-4xl font-light tracking-tight text-grafite sm:text-5xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {site.marca.nome}
            </motion.p>

            <motion.div
              className="mx-auto mt-5 h-px bg-dourado"
              initial={{ width: 0 }}
              animate={{ width: 96 }}
              transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.p
              className="mt-5 text-[0.65rem] uppercase tracking-[0.32em] text-grafite-suave"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {site.marca.assinatura}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
