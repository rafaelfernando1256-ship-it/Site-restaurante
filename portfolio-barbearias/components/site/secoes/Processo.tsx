import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { processo } from "@/content/agencia";

export default function Processo() {
  return (
    <Secao id="processo" tom="poco">
      <CabecaSecao indice="04" etiqueta={processo.etiqueta} titulo={processo.titulo} />

      <ol className="mt-16 grid gap-x-8 gap-y-12 sm:mt-20 sm:grid-cols-2 lg:grid-cols-4">
        {processo.passos.map((p, i) => (
          <Revelar key={p.numero} atraso={i * 0.07} as="li" className="group">
            <div className="relative border-t border-fio pt-7">
              <span
                aria-hidden
                className="absolute -top-[3px] left-0 h-[5px] w-[5px] rounded-full bg-osso-3 transition-colors duration-500 group-hover:bg-osso"
              />
              <div className="flex items-baseline justify-between gap-3">
                <span className="t-numeral text-[1.05rem] text-osso-3 transition-colors duration-500 group-hover:text-osso">
                  {p.numero}
                </span>
                <span className="t-rotulo text-[0.6rem] text-osso-3">{p.prazo}</span>
              </div>
              <h3 className="t-display mt-5 text-[1.28rem] leading-[1.18] text-osso">{p.titulo}</h3>
              <p className="mt-3 text-[0.95rem] leading-[1.7] text-osso-2">{p.texto}</p>
            </div>
          </Revelar>
        ))}
      </ol>
    </Secao>
  );
}
