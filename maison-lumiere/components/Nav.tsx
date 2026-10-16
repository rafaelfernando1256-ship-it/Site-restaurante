'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { site } from '@/content/site';

/**
 * O CABEÇALHO.
 *
 * Transparente sobre a abertura, sólido depois que a página rola —
 * porque texto escuro sobre a cena 3D clara fica ilegível sem fundo.
 *
 * No celular vira uma gaveta de tela cheia. A gaveta fecha com Esc,
 * devolve o foco ao botão que a abriu, e trava a rolagem do fundo
 * enquanto está aberta. São três detalhes que quase todo menu mobile
 * esquece e que quem navega por teclado sente na hora.
 */
export function Nav() {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 40);
    aoRolar();
    window.addEventListener('scroll', aoRolar, { passive: true });
    return () => window.removeEventListener('scroll', aoRolar);
  }, []);

  useEffect(() => {
    if (!aberto) return;
    document.body.style.overflow = 'hidden';
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAberto(false);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-maison ${
          rolou
            ? 'border-b border-areia-escura/70 bg-areia-fundo/85 py-3 backdrop-blur-md'
            : 'border-b border-transparent py-6'
        }`}
      >
        <div className="mx-auto flex max-w-[82rem] items-center justify-between px-6 lg:px-10">
          <a href="#" className="group flex items-baseline gap-2.5">
            <span className="font-display text-xl font-normal tracking-tight text-grafite sm:text-[1.4rem]">
              {site.marca.nome}
            </span>
            <span className="hidden text-[0.6rem] uppercase tracking-[0.28em] text-grafite-suave sm:inline">
              {site.marca.complemento}
            </span>
          </a>

          <nav aria-label="Principal" className="hidden items-center gap-9 lg:flex">
            {site.nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative text-[0.8rem] tracking-wide text-grafite-claro transition-colors hover:text-grafite"
              >
                {item.rotulo}
                {/* O risquinho que cresce no hover. Detalhe barato que
                    muda a percepção de acabamento. */}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-dourado transition-all duration-400 ease-maison group-hover:w-full" />
              </a>
            ))}
            <a
              href={site.navBotao.href}
              className="rounded-full border border-grafite px-6 py-2.5 text-[0.78rem] tracking-wide text-grafite transition-all duration-400 ease-maison hover:bg-grafite hover:text-areia"
            >
              {site.navBotao.rotulo}
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="relative z-50 flex h-11 w-11 items-center justify-center lg:hidden"
            aria-expanded={aberto}
            aria-controls="menu-celular"
            aria-label={aberto ? 'Fechar menu' : 'Abrir menu'}
          >
            <span className="relative block h-3 w-6">
              <span
                className={`absolute left-0 block h-px w-6 bg-grafite transition-all duration-400 ease-maison ${
                  aberto ? 'top-1.5 rotate-45' : 'top-0'
                }`}
              />
              <span
                className={`absolute left-0 block h-px w-6 bg-grafite transition-all duration-400 ease-maison ${
                  aberto ? 'top-1.5 -rotate-45' : 'top-3'
                }`}
              />
            </span>
          </button>
        </div>
      </header>

      <AnimatePresence>
        {aberto && (
          <motion.div
            id="menu-celular"
            className="fixed inset-0 z-40 bg-areia px-6 pt-28 lg:hidden"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav aria-label="Principal, celular" className="flex flex-col">
              {site.nav.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className="border-b border-areia-escura py-5 font-display text-3xl font-light text-grafite"
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.1, duration: 0.45 }}
                >
                  {item.rotulo}
                </motion.a>
              ))}
              <a
                href={site.navBotao.href}
                onClick={() => setAberto(false)}
                className="mt-9 rounded-full bg-grafite px-7 py-4 text-center text-sm tracking-wide text-areia"
              >
                {site.navBotao.rotulo}
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
