import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { maquina } from "@/content/agencia";

export default function Maquina() {
  return (
    <Secao id="maquina" className="border-t border-fio">
      <CabecaSecao etiqueta={maquina.etiqueta} titulo={maquina.titulo} texto={maquina.texto} />

      <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-fio bg-fio md:grid-cols-2 lg:grid-cols-3">
        {maquina.pecas.map((p, i) => (
          <Revelar
            key={p.numero}
            atraso={i * 0.05}
            as="li"
            className="group flex h-full flex-col bg-tinta p-7 transition-colors duration-500 hover:bg-tinta-2 sm:p-9"
          >
            <span className="font-display text-sm text-osso-3 tabular-nums transition-colors duration-500 group-hover:text-osso">
              {p.numero}
            </span>
            <h3 className="mt-5 font-display text-xl leading-snug font-semibold tracking-tight text-osso">
              {p.titulo}
            </h3>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-osso-2">{p.texto}</p>
          </Revelar>
        ))}

        {/* célula final: fecha a grade e repete a promessa */}
        <li className="flex flex-col justify-end bg-tinta-2 p-7 sm:p-9">
          <p className="font-display text-xl leading-snug font-semibold tracking-tight text-osso">
            Cinco peças, um objetivo: a próxima cadeira ocupada.
          </p>
        </li>
      </ol>
    </Secao>
  );
}
