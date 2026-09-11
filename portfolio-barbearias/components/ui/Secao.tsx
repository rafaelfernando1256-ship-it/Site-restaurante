import type { ReactNode } from "react";
import Revelar from "@/components/ui/Revelar";

/* Cabeçalho padrão de seção: etiqueta + título + texto de apoio.
   Centraliza a hierarquia tipográfica em um lugar só. */
export function CabecaSecao({
  etiqueta,
  titulo,
  texto,
  centro = false,
}: {
  etiqueta: string;
  titulo: ReactNode;
  texto?: string;
  centro?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${centro ? "mx-auto text-center" : ""}`}>
      <Revelar>
        <p className="text-[0.7rem] tracking-[0.24em] text-osso-3 uppercase">{etiqueta}</p>
      </Revelar>
      <Revelar atraso={0.08}>
        <h2 className="mt-4 font-display text-[clamp(1.9rem,4vw,3rem)] leading-[1.1] font-semibold tracking-[-0.02em] text-balance text-osso">
          {titulo}
        </h2>
      </Revelar>
      {texto && (
        <Revelar atraso={0.14}>
          <p className="mt-5 text-[1.02rem] leading-relaxed text-osso-2">{texto}</p>
        </Revelar>
      )}
    </div>
  );
}

export default function Secao({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`relative z-10 py-20 sm:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}
