import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { processo } from "@/content/agencia";

export default function Processo() {
  return (
    <Secao id="processo" className="border-t border-fio">
      <CabecaSecao etiqueta={processo.etiqueta} titulo={processo.titulo} />

      <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {processo.passos.map((p, i) => (
          <Revelar key={p.numero} atraso={i * 0.07} as="li">
            <div className="relative border-t border-fio pt-6">
              {/* marcador na linha do tempo */}
              <span
                aria-hidden
                className="absolute -top-[4.5px] left-0 h-2 w-2 rounded-full bg-osso"
              />
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-sm text-osso-3 tabular-nums">{p.numero}</span>
                <span className="rounded-full border border-fio px-2.5 py-0.5 text-[0.65rem] tracking-wider text-osso-3 uppercase">
                  {p.prazo}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-osso">
                {p.titulo}
              </h3>
              <p className="mt-2.5 text-[0.93rem] leading-relaxed text-osso-2">{p.texto}</p>
            </div>
          </Revelar>
        ))}
      </ol>
    </Secao>
  );
}
