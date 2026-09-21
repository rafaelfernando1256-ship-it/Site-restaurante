import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { problema } from "@/content/agencia";

/* Antes era uma grade de caixas com borda — o mesmo desenho da
   seção seguinte. Virou lista editorial: numeral grande, filete
   fino e nada de moldura. Conteúdo diferente, forma diferente. */
export default function Problema() {
  return (
    <Secao id="problema" tom="poco">
      <CabecaSecao
        indice="01"
        etiqueta={problema.etiqueta}
        titulo={problema.titulo}
        texto={problema.texto}
      />

      <ol className="mt-16 sm:mt-20">
        {problema.itens.map((item, i) => (
          <Revelar key={item.titulo} atraso={i * 0.05} as="li">
            <div className="group grid gap-x-8 gap-y-3 border-t border-fio py-8 sm:grid-cols-[3.5rem_1fr] sm:py-10 lg:grid-cols-[5rem_22rem_1fr]">
              <span className="t-numeral text-[1.6rem] text-osso-3 transition-colors duration-500 group-hover:text-osso sm:text-[2rem]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="t-display text-[1.35rem] leading-[1.15] text-osso sm:text-[1.55rem]">
                {item.titulo}
              </h3>
              <p className="max-w-[52ch] text-[0.98rem] leading-[1.72] text-osso-2 sm:col-start-2 lg:col-start-3">
                {item.texto}
              </p>
            </div>
          </Revelar>
        ))}
        <li aria-hidden className="border-t border-fio" />
      </ol>
    </Secao>
  );
}
