import Link from "next/link";
import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import Botao from "@/components/ui/Botao";
import IconeWhats from "@/components/ui/IconeWhats";
import { planos, linkWhats } from "@/content/agencia";
import { acharDemo } from "@/content/demos";

/* ═══════════════════════════════════════════════════════════════
   PLANOS
   Os preços são por modelo, e cada cartão carrega a cor do demo
   correspondente. O dono não escolhe um pacote abstrato: ele
   escolhe o site que acabou de ver e descobre quanto custa aquele.
   ═══════════════════════════════════════════════════════════════ */
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
        {planos.lista.map((p, i) => {
          const demo = acharDemo(p.slug);
          /* paleta[1] é a cor de marca de cada projeto:
             latão, limão elétrico e vermelho esmalte. */
          const acento = demo?.paleta[1]?.hex ?? "#EDEAE4";

          return (
            <Revelar key={p.nome} atraso={i * 0.07}>
              <article
                className={`relative flex h-full flex-col overflow-hidden rounded-[1.25rem] p-8 transition-colors duration-500 sm:p-10 ${
                  p.destaque
                    ? "bg-tinta-3 ring-1 ring-fio-forte"
                    : "bg-tinta-2 ring-1 ring-fio hover:ring-fio-forte"
                }`}
              >
                {/* filete na cor do projeto: liga o preço ao demo */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ backgroundColor: acento }}
                />

                {"selo" in p && p.selo && (
                  <span className="t-rotulo absolute top-7 right-7 rounded-full bg-osso px-3 py-1.5 text-[0.58rem] text-tinta">
                    {p.selo}
                  </span>
                )}

                <div>
                  <h3 className="t-display text-[1.7rem] text-osso">{p.nome}</h3>
                  <p className="mt-1.5 text-[0.82rem]" style={{ color: acento }}>
                    {p.modelo}
                  </p>
                </div>

                <p className="mt-4 max-w-[34ch] text-[0.92rem] leading-[1.7] text-osso-2">
                  {p.resumo}
                </p>

                <div className="mt-9 border-t border-fio pt-8">
                  <p className="t-numeral text-[2.8rem] leading-none text-osso">{p.preco}</p>
                  <p className="mt-2.5 text-[0.88rem] text-osso-2">
                    pagamento único · sem mensalidade
                  </p>
                </div>

                <ul className="mt-8 flex-1 space-y-3.5">
                  {p.inclui.map((item) => (
                    <li key={item} className="flex gap-3.5 text-[0.92rem] leading-[1.6] text-osso-2">
                      <span aria-hidden className="mt-[0.6rem] h-px w-3 shrink-0 bg-osso-3" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex flex-col gap-3">
                  <Botao
                    href={linkWhats(
                      `Olá! Quero um site no modelo ${p.nome} (${p.preco}) para a minha barbearia.\n\nNome da barbearia: \nCidade: `,
                    )}
                    variante={p.destaque ? "claro" : "contorno"}
                    tamanho="lg"
                    externo
                    className="w-full"
                  >
                    <IconeWhats className="h-[18px] w-[18px]" />
                    {p.cta}
                  </Botao>

                  <Link
                    href={`/projetos/${p.slug}/`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-[40px] items-center justify-center gap-2 text-[0.85rem] text-osso-2 transition-colors duration-400 hover:text-osso"
                  >
                    Ver este modelo funcionando
                    <span aria-hidden className="text-[0.8em] opacity-70">
                      ↗
                    </span>
                  </Link>
                </div>
              </article>
            </Revelar>
          );
        })}
      </div>

      {/* O que fica de fora: dito na cara, para não virar surpresa */}
      <Revelar atraso={0.12}>
        <div className="mt-6 rounded-[1.25rem] border border-fio p-8 sm:p-10">
          <h3 className="t-rotulo text-osso-3">{planos.rodape.titulo}</h3>
          <ul className="mt-6 grid gap-5 sm:grid-cols-3">
            {planos.rodape.itens.map((item) => (
              <li
                key={item}
                className="border-t border-fio pt-5 text-[0.88rem] leading-[1.65] text-osso-2"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Revelar>
    </Secao>
  );
}
