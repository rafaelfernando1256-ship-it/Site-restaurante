import { Foto } from '@/components/Foto';
import { Revelar } from '@/components/Revelar';
import { site } from '@/content/site';

/**
 * OS PROTOCOLOS.
 *
 * Seis cartões sobre fundo escuro. O escuro aqui é proposital: depois
 * de duas seções em areia, a página precisa de um respiro de contraste
 * — e é sobre grafite que o dourado finalmente aparece como dourado, e
 * não como bege.
 *
 * No hover a foto aproxima um pouco e a linha dourada atravessa o
 * cartão. Nada de cartão que levanta e ganha sombra: isso é vocabulário
 * de painel de controle, não de clínica.
 */
export function Procedimentos() {
  const { procedimentos } = site;

  return (
    <section id="procedimentos" className="grao relative overflow-hidden bg-grafite py-28 lg:py-40">
      <div className="mx-auto max-w-[82rem] px-6 lg:px-10">
        <div className="max-w-2xl">
          <Revelar>
            <p className="sobretitulo !text-dourado">{procedimentos.sobretitulo}</p>
            <span className="regua mt-5" />
          </Revelar>
          <Revelar atraso={0.08}>
            <h2 className="mt-9 font-display text-[clamp(2.4rem,5.5vw,4.2rem)] text-areia">
              {procedimentos.titulo}
            </h2>
          </Revelar>
          <Revelar atraso={0.14}>
            <p className="mt-7 text-[1.02rem] leading-[1.75] text-areia/65">
              {procedimentos.texto}
            </p>
          </Revelar>
        </div>

        <ul className="mt-20 grid gap-x-10 gap-y-16 sm:grid-cols-2 lg:mt-28 lg:grid-cols-3">
          {procedimentos.itens.map((item, i) => (
            <Revelar key={item.nome} as="li" atraso={(i % 3) * 0.08} className="group">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2px]">
                <div className="absolute inset-0 transition-transform duration-[900ms] ease-maison group-hover:scale-[1.04]">
                  <Foto
                    src={item.foto}
                    alt={`${item.nome} — ${item.resumo}`}
                    semente={i + 2}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                {/* A linha que corre por cima da foto no hover. */}
                <span className="absolute bottom-0 left-0 h-px w-0 bg-dourado transition-all duration-[700ms] ease-maison group-hover:w-full" />
              </div>

              <div className="mt-7 flex items-baseline justify-between gap-4">
                <h3 className="font-display text-[1.75rem] font-light text-areia">{item.nome}</h3>
                <span className="shrink-0 text-[0.65rem] uppercase tracking-[0.2em] text-dourado">
                  {item.resumo}
                </span>
              </div>

              <p className="mt-4 text-[0.92rem] leading-[1.7] text-areia/60">{item.texto}</p>

              <p className="mt-5 text-[0.72rem] uppercase tracking-[0.22em] text-areia/35">
                {item.duracao}
              </p>
            </Revelar>
          ))}
        </ul>
      </div>
    </section>
  );
}
