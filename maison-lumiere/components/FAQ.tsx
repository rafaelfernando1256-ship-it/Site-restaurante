'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

import { Revelar } from '@/components/Revelar';
import { site } from '@/content/site';
import { usePrefereMenosMovimento } from '@/lib/movimento';

/**
 * AS DÚVIDAS.
 *
 * Sanfona de uma pergunta aberta por vez.
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE <button> E NÃO <div onClick>
 * ─────────────────────────────────────────────────────────────────
 * Porque botão já vem com tudo que importa de graça: foco, Enter,
 * barra de espaço, papel anunciado pelo leitor de tela. O
 * `aria-expanded` e o `aria-controls` completam — quem ouve a página
 * sabe que aquilo abre, e se está aberto agora.
 *
 * A resposta fica no HTML mesmo fechada, e é escondida com `hidden`.
 * Isso importa para o Google: as mesmas respostas vão nos dados
 * estruturados do layout, e divergir entre o que o schema diz e o que
 * a página tem é motivo de penalidade.
 */
export function FAQ() {
  const { faq } = site;
  const [aberta, setAberta] = useState<number | null>(0);
  const menosMovimento = usePrefereMenosMovimento();

  return (
    <section id="duvidas" className="grao relative overflow-hidden bg-areia-fundo py-28 lg:py-40">
      <div className="mx-auto max-w-[82rem] px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.75fr_1fr] lg:gap-24">
          <div>
            <Revelar>
              <p className="sobretitulo">{faq.sobretitulo}</p>
              <span className="regua mt-5" />
            </Revelar>
            <Revelar atraso={0.08}>
              <h2 className="mt-9 font-display text-[clamp(2.2rem,5vw,3.6rem)] text-grafite lg:sticky lg:top-32">
                {faq.titulo}
              </h2>
            </Revelar>
          </div>

          <ul className="border-t border-areia-escura">
            {faq.itens.map((item, i) => {
              const estaAberta = aberta === i;
              return (
                <Revelar key={item.pergunta} as="li" atraso={Math.min(i, 3) * 0.06}>
                  <div className="border-b border-areia-escura">
                    <h3>
                      <button
                        type="button"
                        onClick={() => setAberta(estaAberta ? null : i)}
                        aria-expanded={estaAberta}
                        aria-controls={`resposta-${i}`}
                        className="group flex w-full items-start justify-between gap-6 py-7 text-left"
                      >
                        <span className="font-display text-[1.4rem] font-light leading-snug text-grafite transition-colors group-hover:text-dourado-escuro">
                          {item.pergunta}
                        </span>
                        {/* Um mais que vira menos: a barra vertical
                            some quando abre. */}
                        <span className="relative mt-2 block h-3 w-3 shrink-0" aria-hidden="true">
                          <span className="absolute left-0 top-1/2 h-px w-3 -translate-y-1/2 bg-dourado-escuro" />
                          <span
                            className={`absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-dourado-escuro transition-transform duration-400 ease-maison ${
                              estaAberta ? 'scale-y-0' : 'scale-y-100'
                            }`}
                          />
                        </span>
                      </button>
                    </h3>

                    <AnimatePresence initial={false}>
                      {estaAberta && (
                        <motion.div
                          id={`resposta-${i}`}
                          initial={menosMovimento ? false : { height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={menosMovimento ? undefined : { height: 0, opacity: 0 }}
                          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="pb-8 pr-10 text-[0.98rem] leading-[1.8] text-grafite-claro">
                            {item.resposta}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* A resposta fechada continua no documento, para
                        busca e leitor de tela — e para bater com o
                        FAQPage dos dados estruturados. */}
                    {!estaAberta && (
                      <p id={`resposta-${i}`} hidden>
                        {item.resposta}
                      </p>
                    )}
                  </div>
                </Revelar>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
