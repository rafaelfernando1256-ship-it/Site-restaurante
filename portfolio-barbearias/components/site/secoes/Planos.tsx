import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import Botao from "@/components/ui/Botao";
import { planos, linkWhats } from "@/content/agencia";

/* Cartão aqui é uso correto: são três objetos comparáveis lado a
   lado. O que mudou foi a hierarquia de preço — a mensalidade é o
   número que derruba a objeção, então ela ganhou corpo. */
export default function Planos() {
  return (
    <Secao id="planos" tom="base">
      <CabecaSecao
        indice="05"
        etiqueta={planos.etiqueta}
        titulo={planos.titulo}
        texto={planos.texto}
      />

      <div className="mt-16 grid items-stretch gap-4 sm:mt-20 lg:grid-cols-3">
        {planos.lista.map((p, i) => (
          <Revelar key={p.nome} atraso={i * 0.07}>
            <article
              className={`flex h-full flex-col rounded-[1.25rem] p-8 transition-colors duration-500 sm:p-10 ${
                p.destaque
                  ? "bg-tinta-3 ring-1 ring-fio-forte"
                  : "bg-tinta-2 ring-1 ring-fio hover:ring-fio-forte"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="t-display text-[1.6rem] text-osso">{p.nome}</h3>
                {"selo" in p && p.selo && (
                  <span className="t-rotulo shrink-0 rounded-full bg-whats px-3 py-1.5 text-[0.58rem] text-[#06351c]">
                    {p.selo}
                  </span>
                )}
              </div>

              <p className="mt-3.5 max-w-[34ch] text-[0.92rem] leading-[1.7] text-osso-2">
                {p.resumo}
              </p>

              <div className="mt-9 border-t border-fio pt-8">
                <p className="flex items-baseline gap-2">
                  <span className="t-numeral text-[2.4rem] text-osso">{p.mensal}</span>
                  <span className="text-[0.9rem] text-osso-2">por mês</span>
                </p>
                <p className="mt-1.5 text-[0.78rem] text-osso-3">{p.equivalencia}</p>
                <p className="mt-4 text-[0.92rem] text-osso-2">
                  <span className="t-numeral text-[1.05rem] text-osso">{p.setup}</span> de entrada,
                  uma vez só
                </p>
              </div>

              <ul className="mt-8 flex-1 space-y-3.5">
                {p.inclui.map((item) => (
                  <li key={item} className="flex gap-3.5 text-[0.92rem] leading-[1.6] text-osso-2">
                    <span
                      aria-hidden
                      className="mt-[0.6rem] h-px w-3 shrink-0 bg-osso-3"
                    />
                    {item}
                  </li>
                ))}
              </ul>

              <Botao
                href={linkWhats(
                  `Olá! Tenho interesse no plano ${p.nome} para a minha barbearia.\n\nNome da barbearia: \nCidade: `,
                )}
                variante={p.destaque ? "whats" : "contorno"}
                tamanho="lg"
                externo
                className="mt-10 w-full"
              >
                {p.cta}
              </Botao>
            </article>
          </Revelar>
        ))}
      </div>

      <Revelar atraso={0.1}>
        <p className="mt-8 text-[0.78rem] text-osso-3">
          Sem fidelidade. Domínio registrado no seu nome e seu para sempre.
        </p>
      </Revelar>
    </Secao>
  );
}
