import Image from "next/image";
import Link from "next/link";
import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import Botao from "@/components/ui/Botao";
import IconeWhats from "@/components/ui/IconeWhats";
import { chamadaProjetos, linkWhats, planos } from "@/content/agencia";
import { demos } from "@/content/demos";

export default function Projetos() {
  return (
    <Secao id="projetos" tom="poco">
      <CabecaSecao
        indice="03"
        etiqueta="Projetos"
        titulo="Três barbearias, três estratégias diferentes"
        texto="Cada projeto resolve um tipo de negócio. Abra no celular e role até o fim — é o site funcionando, não uma imagem."
      />

      <div className="mt-16 space-y-5 sm:mt-20">
        {demos.map((d, i) => {
          const claro = d.slug === "dom-aurelio";
          const plano = planos.lista.find((p) => p.slug === d.slug);
          const corTexto = claro ? "#221E1C" : "#EDEAE4";
          const corApoio = claro ? "rgba(34,30,28,0.62)" : "rgba(237,234,228,0.62)";
          const corFio = claro ? "rgba(34,30,28,0.16)" : "rgba(237,234,228,0.16)";

          return (
            <Revelar key={d.slug} atraso={i * 0.06}>
              <article
                className="group grid overflow-hidden rounded-[1.5rem] lg:grid-cols-[1fr_23rem]"
                style={{ backgroundColor: d.corCard }}
              >
                <div className="flex flex-col p-8 sm:p-12">
                  {/* índice + arquétipo na mesma linha: dá ordem à série */}
                  <p className="flex items-center gap-4">
                    <span className="t-numeral text-[0.82rem]" style={{ color: corApoio }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span aria-hidden className="h-px w-7" style={{ backgroundColor: corFio }} />
                    <span className="t-rotulo text-[0.64rem]" style={{ color: d.corTexto }}>
                      {d.arquetipo}
                    </span>
                  </p>

                  <h3
                    className="t-display mt-6 text-[2rem] leading-[1.04] sm:text-[2.6rem]"
                    style={{ color: corTexto }}
                  >
                    {d.nome}
                  </h3>

                  <p
                    className="mt-3 text-[1.05rem] leading-snug italic"
                    style={{ color: corApoio }}
                  >
                    “{d.slogan}”
                  </p>

                  <p
                    className="mt-7 max-w-[46ch] text-[0.97rem] leading-[1.7]"
                    style={{ color: corApoio }}
                  >
                    {d.objetivo}
                  </p>

                  {/* Lista separada por filete em vez de pílulas: quatro
                      pílulas empilhadas no celular ocupavam meia tela. */}
                  <ul
                    className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.82rem]"
                    style={{ color: corApoio }}
                  >
                    {d.destaques.map((h, j) => (
                      <li key={h} className="flex items-center gap-3">
                        {j > 0 && (
                          <span aria-hidden className="h-3 w-px" style={{ backgroundColor: corFio }} />
                        )}
                        {h}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-4 pt-10">
                    {/* Nova aba de propósito: se o demo abre na mesma,
                        o portfólio some e o visitante não volta. */}
                    <Link
                      href={`/projetos/${d.slug}/`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[0.88rem] font-medium transition-transform duration-500 ease-[var(--ease-suave)] group-hover:-translate-y-0.5"
                      style={{ backgroundColor: d.corTexto, color: claro ? "#F7F1E3" : "#0B0B0C" }}
                    >
                      Abrir o site
                      <span aria-hidden className="text-[0.8em] opacity-70">↗</span>
                    </Link>

                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-1.5">
                        {d.paleta.map((c) => (
                          <span
                            key={c.hex}
                            title={`${c.nome} ${c.hex}`}
                            className="h-5 w-5 rounded-full ring-2"
                            style={{
                              backgroundColor: c.hex,
                              // @ts-expect-error variável do anel do Tailwind
                              "--tw-ring-color": d.corCard,
                            }}
                          />
                        ))}
                      </div>
                      {/* O dono de barbearia não liga para nome de fonte.
                          Ele liga para saber se o projeto é do tipo dele. */}
                      <span className="text-[0.78rem]" style={{ color: corApoio }}>
                        {d.publico}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mockup: com bisel e queixo, para ler como aparelho */}
                <div className="relative flex items-end justify-center px-8 pb-0 lg:px-0">
                  <div
                    className="w-[15.5rem] translate-y-10 overflow-hidden rounded-t-[2rem] border-[8px] border-b-0 shadow-[0_-24px_70px_-18px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-[var(--ease-saida)] group-hover:-translate-y-0 sm:w-[17rem]"
                    style={{ borderColor: claro ? "#2A2622" : "#202024" }}
                  >
                    <Image
                      src={d.mockup}
                      alt={`Prévia do site ${d.nome} em um celular`}
                      width={420}
                      height={760}
                      loading="lazy"
                      sizes="(min-width: 640px) 272px, 248px"
                      className="h-[20rem] w-full object-cover object-top sm:h-[23rem]"
                    />
                  </div>
                  {plano && (
                    <p className="mt-6 text-[0.85rem]" style={{ color: corApoio }}>
                      Este modelo sai por{" "}
                      <a
                        href="#planos"
                        className="underline underline-offset-4 transition-colors"
                        style={{ color: corTexto }}
                      >
                        {plano.preco}, pagamento único
                      </a>
                    </p>
                  )}
                </div>
              </article>
            </Revelar>
          );
        })}
      </div>

      <Revelar atraso={0.1}>
        <p className="mt-10 text-[0.78rem] text-osso-3">
          Barbearias fictícias, criadas para demonstração. Nenhum dado corresponde a negócio real.
        </p>
      </Revelar>

      {/* Pico de interesse da página: ele acabou de ver três sites
          funcionando. Deixar esse trecho sem ação era desperdício. */}
      <Revelar atraso={0.14}>
        <div className="mt-14 flex flex-col items-start gap-7 border-t border-fio-forte pt-12 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="t-display max-w-[20ch] text-[clamp(1.5rem,3vw,2.2rem)] text-osso">
              {chamadaProjetos.titulo}
            </h3>
            <p className="mt-4 max-w-[48ch] text-[0.98rem] leading-[1.7] text-osso-2">
              {chamadaProjetos.texto}
            </p>
          </div>
          <Botao
            href={linkWhats(chamadaProjetos.mensagemWhats)}
            variante="claro"
            tamanho="lg"
            externo
            className="shrink-0"
          >
            <IconeWhats className="h-[18px] w-[18px]" />
            {chamadaProjetos.cta}
          </Botao>
        </div>
      </Revelar>
    </Secao>
  );
}
