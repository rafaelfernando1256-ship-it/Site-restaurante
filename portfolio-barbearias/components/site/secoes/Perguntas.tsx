"use client";

import { useState } from "react";
import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { objecoes } from "@/content/agencia";

/* Sanfona acessível: botão real, aria-expanded e conteúdo que
   continua no HTML (bom para SEO e para quem usa leitor de tela). */
export default function Perguntas() {
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <Secao id="perguntas" className="border-t border-fio">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <CabecaSecao etiqueta={objecoes.etiqueta} titulo={objecoes.titulo} />

        <div className="divide-y divide-fio border-y border-fio">
          {objecoes.lista.map((o, i) => {
            const estaAberta = aberta === i;
            return (
              <Revelar key={o.pergunta} atraso={i * 0.04}>
                <div>
                  <h3>
                    <button
                      type="button"
                      onClick={() => setAberta(estaAberta ? null : i)}
                      aria-expanded={estaAberta}
                      aria-controls={`resposta-${i}`}
                      className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors duration-300 hover:text-osso"
                    >
                      <span className="font-display text-lg leading-snug font-medium tracking-tight text-osso">
                        {o.pergunta}
                      </span>
                      <span
                        aria-hidden
                        className={`mt-1 shrink-0 text-xl leading-none text-osso-3 transition-transform duration-400 ${
                          estaAberta ? "rotate-45" : ""
                        }`}
                      >
                        +
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`resposta-${i}`}
                    className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
                      estaAberta ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="pr-10 pb-6 text-[0.95rem] leading-relaxed text-osso-2">
                        {o.resposta}
                      </p>
                    </div>
                  </div>
                </div>
              </Revelar>
            );
          })}
        </div>
      </div>
    </Secao>
  );
}
