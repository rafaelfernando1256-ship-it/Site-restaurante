'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { IconeWhatsapp } from '@/components/CTA';
import { linkWhatsapp, site } from '@/content/site';
import { usePrefereMenosMovimento } from '@/lib/movimento';

/**
 * O BOTÃO FLUTUANTE DO WHATSAPP.
 *
 * Aparece depois que a pessoa rolou um pouco — não de cara. Botão
 * flutuante no primeiro segundo de visita é interrupção; depois de
 * meia tela de leitura, é conveniência.
 *
 * Some de novo quando a chamada final entra na tela, porque ali já tem
 * um botão grande fazendo a mesma coisa — dois botões idênticos na
 * mesma dobra é poluição.
 */
export function WhatsAppFlutuante() {
  const [visivel, setVisivel] = useState(false);
  const menosMovimento = usePrefereMenosMovimento();

  useEffect(() => {
    const aoRolar = () => {
      const rolouOBastante = window.scrollY > window.innerHeight * 0.6;
      const chamada = document.getElementById('agendar');
      const chamadaNaTela = chamada
        ? chamada.getBoundingClientRect().top < window.innerHeight * 0.85
        : false;
      setVisivel(rolouOBastante && !chamadaNaTela);
    };
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    window.addEventListener('resize', aoRolar);
    return () => {
      window.removeEventListener('scroll', aoRolar);
      window.removeEventListener('resize', aoRolar);
    };
  }, []);

  return (
    <motion.a
      href={linkWhatsapp()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Falar com a ${site.marca.nome} no WhatsApp`}
      // O anel dourado não é enfeite: sobre as seções grafite, um
      // botão grafite sumia no fundo. O anel desenha a borda nos dois
      // casos, sem precisar de um botão de cor diferente por seção.
      className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-grafite text-areia ring-1 ring-dourado/60 shadow-[0_6px_28px_rgba(28,28,28,0.28)] transition-colors hover:bg-dourado-escuro hover:ring-dourado lg:bottom-8 lg:right-8"
      initial={false}
      animate={
        menosMovimento
          ? { opacity: visivel ? 1 : 0, scale: 1 }
          : { opacity: visivel ? 1 : 0, scale: visivel ? 1 : 0.7 }
      }
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      // Invisível também quer dizer inalcançável: sem isto, o Tab
      // pararia num botão que ninguém está vendo.
      style={{ pointerEvents: visivel ? 'auto' : 'none' }}
      tabIndex={visivel ? 0 : -1}
      aria-hidden={!visivel}
    >
      <IconeWhatsapp className="h-6 w-6" />
    </motion.a>
  );
}
