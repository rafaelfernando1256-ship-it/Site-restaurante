import Image from "next/image";
import Botao from "@/components/ui/Botao";
import IconeWhats from "@/components/ui/IconeWhats";
import Revelar from "@/components/ui/Revelar";
import { hero, linkWhats, agencia } from "@/content/agencia";
import { demos } from "@/content/demos";

export default function Hero() {
  return (
    <section className="relative z-10 overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-24">
      {/* brilho suave atrás do título, sem virar gradiente de template */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[38rem] w-[80rem] -translate-x-1/2 rounded-full opacity-[0.07] blur-3xl"
        style={{ background: "radial-gradient(closest-side, #edeae4, transparent)" }}
      />

      <div className="mx-auto grid max-w-6xl gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
        <div>
          <Revelar>
            <p className="inline-flex items-center gap-2.5 rounded-full border border-fio px-4 py-1.5 text-[0.7rem] tracking-[0.14em] text-osso-2 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-whats" />
              {hero.etiqueta}
            </p>
          </Revelar>

          <Revelar atraso={0.08}>
            <h1 className="mt-7 font-display text-[clamp(2.6rem,6.2vw,4.6rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-balance text-osso">
              {hero.titulo}
            </h1>
          </Revelar>

          <Revelar atraso={0.16}>
            <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-osso-2">
              {hero.subtitulo}
            </p>
          </Revelar>

          <Revelar atraso={0.24}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Botao href={linkWhats(hero.mensagemWhats)} variante="whats" tamanho="lg" externo>
                <IconeWhats />
                {hero.ctaPrimario}
              </Botao>
              <Botao href="#projetos" variante="contorno" tamanho="lg">
                {hero.ctaSecundario}
              </Botao>
            </div>
            <p className="mt-4 text-xs text-osso-3">{agencia.tempoResposta}</p>
          </Revelar>

          <Revelar atraso={0.32}>
            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-px overflow-hidden rounded-xl border border-fio bg-fio">
              {hero.provas.map((p) => (
                <div key={p.rotulo} className="bg-tinta px-4 py-5">
                  <dt className="font-display text-xl font-semibold text-osso sm:text-2xl">
                    {p.valor}
                  </dt>
                  <dd className="mt-1 text-[0.7rem] leading-snug text-osso-3">{p.rotulo}</dd>
                </div>
              ))}
            </dl>
          </Revelar>
        </div>

        {/* Os três projetos já na primeira tela: prova antes da promessa */}
        <Revelar atraso={0.2} className="relative hidden lg:block">
          <div className="relative mx-auto flex h-[34rem] w-full max-w-md items-center justify-center">
            {demos.map((d, i) => (
              <div
                key={d.slug}
                className="absolute overflow-hidden rounded-[1.75rem] border-[6px] border-[#26262b] bg-tinta-2 shadow-[0_30px_70px_rgba(0,0,0,0.55)] transition-transform duration-700 hover:-translate-y-3"
                style={{
                  width: "12.5rem",
                  transform: `translateX(${(i - 1) * 6}rem) rotate(${(i - 1) * 5}deg) translateY(${
                    i === 1 ? "-1.25rem" : "0.9rem"
                  })`,
                  zIndex: i === 1 ? 3 : 2 - Math.abs(i - 1),
                }}
              >
                <Image
                  src={d.mockup}
                  alt={`Prévia do site demonstrativo ${d.nome}`}
                  width={420}
                  height={900}
                  priority={i === 1}
                  className="h-[26rem] w-full object-cover object-top"
                />
              </div>
            ))}
          </div>
        </Revelar>
      </div>
    </section>
  );
}
