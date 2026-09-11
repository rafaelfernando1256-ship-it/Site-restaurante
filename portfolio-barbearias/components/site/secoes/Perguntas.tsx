"use client";

import { useState } from "react";
import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { objecoes } from "@/content/agencia";

export default function Perguntas() {
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <Secao id="perguntas" tom="poco">
      <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <CabecaSecao indice="08" etiqueta={objecoes.etiqueta} titulo={objecoes.titulo} />

        <div className="lg:pt-4">
          {objecoes.lista.map((o, i) => {
            const estaAberta = aberta === i;
            return (
              <Revelar key={o.pergunta} atraso={i * 0.04}>
                <div className="border-t border-fio last:border-b">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setAberta(estaAberta ? null : i)}
                      aria-expanded={estaAberta}
                      aria-controls={`resposta-${i}`}
                      className="group flex w-full items-start justify-between gap-6 py-6 text-left"
                    >
                      <span
                        className={`t-display text-[1.12rem] leading-snug transition-colors duration-400 sm:text-[1.2rem] ${
                          estaAberta ? "text-osso" : "text-osso-2 group-hover:text-osso"
                        }`}
                      >
                        {o.pergunta}
                      </span>
                      {/* cruz que gira: dois filetes, sem ícone de biblioteca */}
                      <span aria-hidden className="relative mt-2 h-3 w-3 shrink-0">
                        <span className="absolute top-1/2 left-0 h-px w-3 -translate-y-1/2 bg-osso-2 transition-colors duration-400 group-hover:bg-osso" />
                        <span
                          className={`absolute top-0 left-1/2 h-3 w-px -translate-x-1/2 bg-osso-2 transition-transform duration-500 ease-[var(--ease-saida)] group-hover:bg-osso ${
                            estaAberta ? "scale-y-0" : ""
                          }`}
                        />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`resposta-${i}`}
                    className={`grid transition-all duration-500 ease-[var(--ease-saida)] ${
                      estaAberta ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[58ch] pr-8 pb-7 text-[0.95rem] leading-[1.75] text-osso-2">
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
