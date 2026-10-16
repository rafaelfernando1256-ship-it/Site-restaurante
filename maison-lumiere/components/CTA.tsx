import { Revelar } from '@/components/Revelar';
import { linkWhatsapp, site } from '@/content/site';

/**
 * A CHAMADA FINAL.
 *
 * Uma seção inteira para um botão só. Depois de dez seções, a pessoa
 * que chegou até aqui não precisa de mais argumento — precisa de um
 * lugar óbvio para clicar.
 *
 * O telefone aparece ao lado como alternativa, porque uma parte do
 * público desta clínica liga em vez de mandar mensagem, e esconder o
 * número atrás de um formulário perde exatamente essa pessoa.
 */
export function CTA() {
  const { cta, contato } = site;

  return (
    <section id="agendar" className="grao relative overflow-hidden bg-dourado/15 py-28 lg:py-40">
      <div className="mx-auto max-w-[82rem] px-6 text-center lg:px-10">
        <Revelar>
          <p className="sobretitulo">{cta.sobretitulo}</p>
          <span className="regua mx-auto mt-5" />
        </Revelar>

        <Revelar atraso={0.08}>
          <h2 className="mx-auto mt-9 max-w-3xl font-display text-[clamp(2.6rem,7vw,5.5rem)] text-grafite">
            {cta.titulo}
          </h2>
        </Revelar>

        <Revelar atraso={0.14}>
          <p className="mx-auto mt-8 max-w-xl text-[1.02rem] leading-[1.75] text-grafite-claro">
            {cta.texto}
          </p>
        </Revelar>

        <Revelar atraso={0.22}>
          <div className="mt-12 flex flex-col items-center gap-6">
            <a
              href={linkWhatsapp()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-grafite px-9 py-4.5 text-[0.85rem] tracking-wide text-areia transition-all duration-400 ease-maison hover:bg-grafite-claro"
            >
              <IconeWhatsapp className="h-4 w-4" />
              {cta.botao.rotulo}
            </a>

            <p className="text-[0.9rem] text-grafite-suave">
              {cta.alternativa}{' '}
              <a
                href={`tel:${contato.telefoneVisivel.replace(/\D/g, '')}`}
                className="border-b border-dourado text-grafite transition-colors hover:text-dourado-escuro"
              >
                {contato.telefoneVisivel}
              </a>
            </p>
          </div>
        </Revelar>
      </div>
    </section>
  );
}

export function IconeWhatsapp({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.993c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.8 11.8 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
    </svg>
  );
}
