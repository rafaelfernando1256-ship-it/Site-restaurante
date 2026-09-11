import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import Botao from "@/components/ui/Botao";
import { planos, linkWhats } from "@/content/agencia";

export default function Planos() {
  return (
    <Secao id="planos" className="border-t border-fio">
      <CabecaSecao
        etiqueta={planos.etiqueta}
        titulo={planos.titulo}
        texto={planos.texto}
        centro
      />

      <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
        {planos.lista.map((p, i) => (
          <Revelar key={p.nome} atraso={i * 0.07}>
            <article
              className={`flex h-full flex-col rounded-2xl border p-8 transition-all duration-500 sm:p-9 ${
                p.destaque
                  ? "border-osso bg-tinta-2 lg:-translate-y-4 lg:scale-[1.02]"
                  : "border-fio hover:border-osso-3"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-osso">
                  {p.nome}
                </h3>
                {"selo" in p && p.selo && (
                  <span className="rounded-full bg-osso px-3 py-1 text-[0.65rem] font-medium tracking-wider text-tinta uppercase">
                    {p.selo}
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-osso-2">{p.resumo}</p>

              <div className="mt-8 border-t border-fio pt-7">
                <p className="flex items-baseline gap-2">
                  <span className="font-display text-4xl font-semibold tracking-tight text-osso tabular-nums">
                    {p.setup}
                  </span>
                  <span className="text-sm text-osso-3">de entrada</span>
                </p>
                <p className="mt-2 text-[0.95rem] text-osso-2">
                  <span className="font-medium text-osso tabular-nums">{p.mensal}</span> por mês
                </p>
                <p className="mt-1 text-xs text-osso-3">{p.equivalencia}</p>
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {p.inclui.map((item) => (
                  <li key={item} className="flex gap-3 text-[0.92rem] leading-relaxed text-osso-2">
                    <span aria-hidden className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-osso-3" />
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
                className="mt-9 w-full"
              >
                {p.cta}
              </Botao>
            </article>
          </Revelar>
        ))}
      </div>

      <Revelar atraso={0.1}>
        <p className="mt-8 text-center text-xs text-osso-3">
          Sem fidelidade. Domínio registrado no seu nome e seu para sempre.
        </p>
      </Revelar>
    </Secao>
  );
}
