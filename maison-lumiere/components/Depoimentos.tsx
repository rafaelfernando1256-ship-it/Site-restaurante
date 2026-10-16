import { Revelar } from '@/components/Revelar';
import { site } from '@/content/site';

/**
 * AS VOZES.
 *
 * Três depoimentos em colunas, sobre grafite.
 *
 * O aviso de que são FICTÍCIOS fica no topo da seção, em texto normal
 * e legível — não como asterisco no rodapé. Depoimento inventado
 * apresentado como real é propaganda enganosa mesmo em portfólio, e a
 * única coisa que separa um do outro é dizer.
 */
export function Depoimentos() {
  const { depoimentos } = site;

  return (
    <section className="grao relative overflow-hidden bg-grafite py-28 lg:py-40">
      <div className="mx-auto max-w-[82rem] px-6 lg:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Revelar>
              <p className="sobretitulo !text-dourado">{depoimentos.sobretitulo}</p>
              <span className="regua mt-5" />
            </Revelar>
            <Revelar atraso={0.08}>
              <h2 className="mt-9 font-display text-[clamp(2.4rem,5.5vw,4.2rem)] text-areia">
                {depoimentos.titulo}
              </h2>
            </Revelar>
          </div>
          <Revelar atraso={0.14}>
            <p className="max-w-xs text-[0.82rem] leading-relaxed text-areia/50">
              {depoimentos.aviso}
            </p>
          </Revelar>
        </div>

        <ul className="mt-16 grid gap-px border-t border-areia/15 bg-areia/15 lg:mt-24 lg:grid-cols-3">
          {depoimentos.itens.map((item, i) => (
            <Revelar
              key={item.nome}
              as="li"
              atraso={i * 0.09}
              className="flex flex-col justify-between bg-grafite p-8 lg:p-10"
            >
              <p className="font-display text-[1.4rem] font-light leading-snug text-areia/90">
                “{item.texto}”
              </p>
              <footer className="mt-10">
                <p className="text-[0.88rem] font-medium tracking-wide text-dourado">{item.nome}</p>
                <p className="mt-1 text-[0.8rem] text-areia/45">{item.detalhe}</p>
              </footer>
            </Revelar>
          ))}
        </ul>
      </div>
    </section>
  );
}
