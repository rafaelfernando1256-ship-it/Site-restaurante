import type { ReactNode } from "react";
import Revelar from "@/components/ui/Revelar";

/* ═══════════════════════════════════════════════════════════════
   SEÇÃO
   Duas decisões ficam centralizadas aqui:
   1. o índice numerado (01 … 07), que faz a página ler como um
      documento pensado e não como blocos empilhados;
   2. o tom da superfície, que cria capítulos ao longo da rolagem.
   ═══════════════════════════════════════════════════════════════ */

type Tom = "base" | "poco" | "claro";

const tons: Record<Tom, string> = {
  base: "bg-tinta text-osso",
  poco: "bg-poco text-osso",
  claro: "bg-bone text-tinta",
};

export function CabecaSecao({
  indice,
  etiqueta,
  titulo,
  texto,
  claro = false,
}: {
  indice: string;
  etiqueta: string;
  titulo: ReactNode;
  texto?: string;
  claro?: boolean;
}) {
  return (
    <header className="max-w-3xl">
      <Revelar>
        <p className="flex items-center gap-4">
          <span
            className={`t-numeral text-[0.82rem] ${claro ? "text-tinta/62" : "text-osso-3"}`}
          >
            {indice}
          </span>
          <span
            aria-hidden
            className={`h-px w-8 ${claro ? "bg-fio-escuro" : "bg-fio-forte"}`}
          />
          <span className={`t-rotulo ${claro ? "text-tinta/65" : "text-osso-2"}`}>
            {etiqueta}
          </span>
        </p>
      </Revelar>

      <Revelar atraso={0.06}>
        <h2
          className={`t-display mt-7 text-[clamp(2rem,4.4vw,3.4rem)] ${
            claro ? "text-tinta" : "text-osso"
          }`}
        >
          {titulo}
        </h2>
      </Revelar>

      {texto && (
        <Revelar atraso={0.12}>
          <p
            className={`mt-6 max-w-[54ch] text-[1.02rem] leading-[1.72] ${
              claro ? "text-tinta/70" : "text-osso-2"
            }`}
          >
            {texto}
          </p>
        </Revelar>
      )}
    </header>
  );
}

export default function Secao({
  id,
  children,
  tom = "base",
  className = "",
}: {
  id?: string;
  children: ReactNode;
  tom?: Tom;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative z-10 py-20 sm:py-28 lg:py-32 ${tons[tom]} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}
