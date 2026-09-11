import Image from "next/image";
import Botao from "@/components/ui/Botao";
import IconeWhats from "@/components/ui/IconeWhats";
import Revelar from "@/components/ui/Revelar";
import RevelarMascara from "@/components/ui/RevelarMascara";
import { hero, linkWhats, agencia } from "@/content/agencia";
import { demos } from "@/content/demos";

export default function Hero() {
  return (
    <section className="relative z-10 overflow-hidden border-b border-fio pt-32 pb-16 sm:pt-40 sm:pb-20">
      {/* Luz fria e discreta atrás do título. Um gradiente colorido
          aqui seria exatamente o clichê que queremos evitar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/2 h-[34rem] w-[74rem] -translate-x-1/2 rounded-full opacity-[0.06] blur-3xl"
        style={{ background: "radial-gradient(closest-side, #edeae4, transparent)" }}
      />

      <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-8">
        <div>
          <Revelar>
            <p className="flex items-center gap-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-whats opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-whats" />
              </span>
              <span className="t-rotulo text-osso-2">{hero.etiqueta}</span>
            </p>
          </Revelar>

          <RevelarMascara atraso={0.1}>
            <h1 className="t-display mt-8 text-[clamp(2.7rem,6.4vw,4.8rem)] text-osso">
              {hero.titulo}
            </h1>
          </RevelarMascara>

          <Revelar atraso={0.28}>
            <p className="mt-7 max-w-[48ch] text-[1.06rem] leading-[1.7] text-osso-2">
              {hero.subtitulo}
            </p>
          </Revelar>

          <Revelar atraso={0.36}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Botao href={linkWhats(hero.mensagemWhats)} variante="claro" tamanho="lg" externo>
                <IconeWhats className="h-[18px] w-[18px]" />
                {hero.ctaPrimario}
              </Botao>
              <Botao href="#projetos" variante="contorno" tamanho="lg">
                {hero.ctaSecundario}
              </Botao>
            </div>
            <p className="mt-4 text-[0.8rem] text-osso-3">{agencia.tempoResposta}</p>
          </Revelar>

          {/* Provas: filetes em vez de caixa. Números grandes, rótulos
              pequenos — o contraste de escala é que cria hierarquia. */}
          <Revelar atraso={0.44}>
            <dl className="mt-14 flex max-w-xl flex-wrap gap-x-10 gap-y-6 border-t border-fio pt-8">
              {hero.provas.map((p) => (
                <div key={p.rotulo} className="min-w-[7rem]">
                  <dt className="t-numeral text-[1.75rem] text-osso sm:text-[2rem]">{p.valor}</dt>
                  <dd className="mt-1.5 text-[0.76rem] leading-snug text-osso-3">{p.rotulo}</dd>
                </div>
              ))}
            </dl>
          </Revelar>
        </div>

        {/* Prova antes da promessa: os três projetos já na primeira tela.
            No celular mostramos um só, para não pesar o carregamento. */}
        <Revelar atraso={0.24} className="relative">
          <div className="relative mx-auto flex h-[22rem] w-full max-w-[17rem] items-center justify-center sm:h-[30rem] sm:max-w-md">
            {demos.map((d, i) => (
              <div
                key={d.slug}
                className={`absolute overflow-hidden rounded-[1.9rem] border-[7px] border-[#202024] bg-tinta-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] transition-transform duration-700 ease-[var(--ease-saida)] hover:-translate-y-2 ${
                  i === 1 ? "" : "hidden sm:block"
                }`}
                style={{
                  width: "12.5rem",
                  transform: `translateX(${(i - 1) * 6}rem) rotate(${(i - 1) * 5}deg) translateY(${
                    i === 1 ? "-1rem" : "0.9rem"
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
                  sizes="200px"
                  className="h-[19rem] w-full object-cover object-top sm:h-[25rem]"
                />
                {/* queixo do aparelho: sem isso o mockup lê como imagem cortada */}
                <div aria-hidden className="h-4 bg-[#141417]" />
              </div>
            ))}
          </div>
        </Revelar>
      </div>
    </section>
  );
}
