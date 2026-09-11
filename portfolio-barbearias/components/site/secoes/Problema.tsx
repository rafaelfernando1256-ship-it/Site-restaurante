import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { problema } from "@/content/agencia";

export default function Problema() {
  return (
    <Secao id="problema" className="border-t border-fio">
      <CabecaSecao
        etiqueta={problema.etiqueta}
        titulo={problema.titulo}
        texto={problema.texto}
      />

      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-fio bg-fio sm:grid-cols-2">
        {problema.itens.map((item, i) => (
          <Revelar key={item.titulo} atraso={i * 0.06}>
            <article className="group h-full bg-tinta p-7 transition-colors duration-500 hover:bg-tinta-2 sm:p-9">
              <h3 className="font-display text-lg font-semibold tracking-tight text-osso">
                {item.titulo}
              </h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-osso-2">{item.texto}</p>
            </article>
          </Revelar>
        ))}
      </div>
    </Secao>
  );
}
