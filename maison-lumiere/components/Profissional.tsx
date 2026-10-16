import { Foto } from '@/components/Foto';
import { Revelar } from '@/components/Revelar';
import { site } from '@/content/site';

/**
 * QUEM ATENDE.
 *
 * Retrato grande à esquerda, texto e citação à direita.
 *
 * O registro profissional fica como "a preencher" de propósito — está
 * assim no content/site.ts e explicado lá. Inventar número de conselho
 * para encher um portfólio é o tipo de detalhe que parece inofensivo e
 * não é: é o campo que o paciente usa para conferir se a pessoa pode
 * exercer. A marcação de "profissional fictícia" aparece logo abaixo
 * do nome, não escondida no rodapé.
 */
export function Profissional() {
  const { profissional } = site;

  return (
    <section id="profissional" className="grao relative overflow-hidden bg-areia py-28 lg:py-40">
      <div className="mx-auto max-w-[82rem] px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.8fr_1fr] lg:items-center lg:gap-24">
          <Revelar distancia={40}>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2px]">
              <Foto
                src={profissional.foto}
                alt={profissional.fotoAlt}
                semente={7}
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </Revelar>

          <div>
            <Revelar>
              <p className="sobretitulo">{profissional.sobretitulo}</p>
              <span className="regua mt-5" />
            </Revelar>

            <Revelar atraso={0.08}>
              <h2 className="mt-9 font-display text-[clamp(2.2rem,5vw,3.6rem)] text-grafite">
                {profissional.nome}
              </h2>
              <p className="mt-3 text-[0.8rem] uppercase tracking-[0.22em] text-dourado-escuro">
                {profissional.cargo}
              </p>
              <p className="mt-1.5 text-[0.82rem] text-grafite-suave">{profissional.registro}</p>
            </Revelar>

            <div className="mt-8 space-y-5">
              {profissional.paragrafos.map((texto, i) => (
                <Revelar key={i} atraso={0.14 + i * 0.07}>
                  <p className="max-w-xl text-[1rem] leading-[1.75] text-grafite-claro">{texto}</p>
                </Revelar>
              ))}
            </div>

            <Revelar atraso={0.3}>
              <blockquote className="mt-10 border-l border-dourado pl-7">
                <p className="max-w-lg font-display text-[1.6rem] font-light leading-snug text-grafite">
                  “{profissional.citacao}”
                </p>
              </blockquote>
            </Revelar>

            <Revelar atraso={0.36}>
              <p className="mt-10 text-[0.78rem] uppercase tracking-[0.16em] text-grafite-suave">
                {profissional.marcacaoFicticia}
              </p>
            </Revelar>
          </div>
        </div>
      </div>
    </section>
  );
}
