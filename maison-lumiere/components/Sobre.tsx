import { Foto } from '@/components/Foto';
import { Revelar } from '@/components/Revelar';
import { site } from '@/content/site';

/**
 * A CASA.
 *
 * Texto à esquerda, foto alta à direita, três selos numerados embaixo.
 * A foto é propositalmente vertical e descolada da grade — é o que
 * impede a seção de virar o bloco "imagem + parágrafo" que todo
 * template tem.
 */
export function Sobre() {
  const { sobre } = site;

  return (
    <section id="sobre" className="grao relative overflow-hidden bg-areia-fundo py-28 lg:py-40">
      <div className="mx-auto max-w-[82rem] px-6 lg:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_0.85fr] lg:gap-24">
          <div>
            <Revelar>
              <p className="sobretitulo">{sobre.sobretitulo}</p>
              <span className="regua mt-5" />
            </Revelar>

            <Revelar atraso={0.08}>
              <h2 className="mt-9 max-w-xl font-display text-[clamp(2.4rem,5.5vw,4.2rem)] text-grafite">
                {sobre.titulo}
              </h2>
            </Revelar>

            <div className="mt-9 max-w-xl space-y-6">
              {sobre.paragrafos.map((texto, i) => (
                <Revelar key={i} atraso={0.14 + i * 0.07}>
                  <p className="text-[1.02rem] leading-[1.75] text-grafite-claro">{texto}</p>
                </Revelar>
              ))}
            </div>
          </div>

          <Revelar atraso={0.1} distancia={44}>
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[2px]">
              <Foto
                src={sobre.foto}
                alt={sobre.fotoAlt}
                semente={1}
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </Revelar>
        </div>

        {/* Os três selos. Numerados como capítulos, separados por linha
            fina — o mesmo vocabulário gráfico do resto do site. */}
        <ul className="mt-24 grid gap-px border-t border-areia-escura bg-areia-escura sm:grid-cols-3 lg:mt-32">
          {sobre.selos.map((selo, i) => (
            <Revelar key={selo.numero} as="li" atraso={i * 0.09} className="bg-areia-fundo p-8 lg:p-10">
              <span className="font-display text-2xl text-dourado">{selo.numero}</span>
              <h3 className="mt-5 text-[0.95rem] font-medium tracking-wide text-grafite">
                {selo.titulo}
              </h3>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-grafite-suave">{selo.texto}</p>
            </Revelar>
          ))}
        </ul>
      </div>
    </section>
  );
}
