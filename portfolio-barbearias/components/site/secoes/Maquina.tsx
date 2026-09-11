import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { maquina } from "@/content/agencia";

/* Ficha técnica, não cartões: só o filete superior separa os itens.
   O numeral é grande porque aqui ele é elemento de composição. */
export default function Maquina() {
  return (
    <Secao id="maquina" tom="base">
      <CabecaSecao
        indice="02"
        etiqueta={maquina.etiqueta}
        titulo={maquina.titulo}
        texto={maquina.texto}
      />

      <ol className="mt-16 grid gap-x-10 gap-y-12 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
        {maquina.pecas.map((p, i) => (
          <Revelar key={p.numero} atraso={i * 0.05} as="li" className="group">
            <div className="relative border-t border-fio pt-7">
              <span
                aria-hidden
                className="absolute -top-px left-0 h-px w-0 bg-osso transition-[width] duration-700 ease-[var(--ease-saida)] group-hover:w-16"
              />
              <span className="t-numeral text-[1.05rem] text-osso-3 transition-colors duration-500 group-hover:text-osso">
                {p.numero}
              </span>
              <h3 className="t-display mt-5 text-[1.3rem] leading-[1.18] text-osso">
                {p.titulo}
              </h3>
              <p className="mt-3.5 max-w-[42ch] text-[0.96rem] leading-[1.72] text-osso-2">
                {p.texto}
              </p>
            </div>
          </Revelar>
        ))}
      </ol>

      <Revelar atraso={0.1}>
        <p className="t-display mt-16 max-w-[26ch] border-t border-fio-forte pt-8 text-[1.5rem] leading-[1.2] text-osso sm:text-[1.9rem]">
          Cinco peças, um objetivo: a próxima cadeira ocupada.
        </p>
      </Revelar>
    </Secao>
  );
}
