import Image from "next/image";
import Link from "next/link";
import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { demos } from "@/content/demos";

export default function Projetos() {
  return (
    <Secao id="projetos" className="border-t border-fio">
      <CabecaSecao
        etiqueta="Projetos"
        titulo={<>Três barbearias, três estratégias diferentes</>}
        texto="Cada projeto resolve um tipo de negócio. Abra no celular e role até o fim — é o site funcionando, não uma imagem."
      />

      <div className="mt-14 space-y-6">
        {demos.map((d, i) => (
          <Revelar key={d.slug} atraso={i * 0.06}>
            <article
              className="group grid overflow-hidden rounded-2xl border border-fio transition-colors duration-500 hover:border-osso-3 lg:grid-cols-[1fr_auto]"
              style={{ backgroundColor: d.corCard }}
            >
              <div className="p-8 sm:p-11">
                <p
                  className="text-[0.68rem] tracking-[0.2em] uppercase"
                  style={{ color: d.corTexto }}
                >
                  {d.arquetipo}
                </p>

                <h3
                  className="mt-4 font-display text-3xl leading-tight font-semibold tracking-tight sm:text-4xl"
                  style={{ color: d.slug === "dom-aurelio" ? "#221E1C" : "#EDEAE4" }}
                >
                  {d.nome}
                </h3>

                <p
                  className="mt-2 text-lg italic"
                  style={{ color: d.slug === "dom-aurelio" ? "#6B4A2F" : "#a6a29a" }}
                >
                  “{d.slogan}”
                </p>

                <p
                  className="mt-6 max-w-md text-[0.95rem] leading-relaxed"
                  style={{ color: d.slug === "dom-aurelio" ? "#4a423c" : "#a6a29a" }}
                >
                  {d.objetivo}
                </p>

                <ul className="mt-7 flex flex-wrap gap-2">
                  {d.destaques.map((h) => (
                    <li
                      key={h}
                      className="rounded-full border px-3 py-1 text-xs"
                      style={{
                        borderColor:
                          d.slug === "dom-aurelio" ? "rgba(34,30,28,0.18)" : "rgba(237,234,228,0.16)",
                        color: d.slug === "dom-aurelio" ? "#4a423c" : "#a6a29a",
                      }}
                    >
                      {h}
                    </li>
                  ))}
                </ul>

                <div className="mt-9 flex flex-wrap items-center gap-5">
                  <Link
                    href={`/projetos/${d.slug}/`}
                    className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-transform duration-300 group-hover:-translate-y-0.5"
                    style={{
                      backgroundColor: d.corTexto,
                      color: d.slug === "dom-aurelio" ? "#F7F1E3" : "#0B0B0C",
                    }}
                  >
                    Abrir o site
                    <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>

                  <div className="flex items-center gap-1.5">
                    {d.paleta.map((c) => (
                      <span
                        key={c.hex}
                        title={`${c.nome} ${c.hex}`}
                        className="h-5 w-5 rounded-full ring-1"
                        style={{
                          backgroundColor: c.hex,
                          // @ts-expect-error propriedade custom do Tailwind
                          "--tw-ring-color":
                            d.slug === "dom-aurelio"
                              ? "rgba(34,30,28,0.25)"
                              : "rgba(237,234,228,0.3)",
                        }}
                      />
                    ))}
                    <span
                      className="ml-2 text-[0.7rem]"
                      style={{ color: d.slug === "dom-aurelio" ? "#6B4A2F" : "#6e6b65" }}
                    >
                      {d.tipografia}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mockup de celular */}
              <div className="relative flex items-end justify-center px-8 pb-0 lg:px-11">
                <div className="w-[15rem] translate-y-8 overflow-hidden rounded-t-[1.75rem] border-[6px] border-b-0 border-[#26262b] shadow-[0_-20px_60px_rgba(0,0,0,0.4)] transition-transform duration-700 group-hover:-translate-y-1 sm:w-[17rem]">
                  <Image
                    src={d.mockup}
                    alt={`Prévia do site ${d.nome} em um celular`}
                    width={420}
                    height={760}
                    className="h-[19rem] w-full object-cover object-top sm:h-[22rem]"
                  />
                </div>
              </div>
            </article>
          </Revelar>
        ))}
      </div>

      <Revelar atraso={0.1}>
        <p className="mt-8 text-center text-xs text-osso-3">
          Barbearias fictícias, criadas para demonstração. Nenhum dado corresponde a negócio real.
        </p>
      </Revelar>
    </Secao>
  );
}
