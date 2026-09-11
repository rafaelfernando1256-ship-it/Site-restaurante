import Link from "next/link";
import { agencia, linkWhats, fechamento } from "@/content/agencia";
import { demos } from "@/content/demos";

export default function Rodape() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-fio bg-poco">
      <div className="mx-auto max-w-6xl px-5 pt-20 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div>
            <p className="t-rotulo text-osso-3">Especialista em um nicho só</p>
            <p className="mt-4 max-w-[34ch] text-[1.05rem] leading-[1.6] text-osso-2">
              Sites para barbearia. Só isso, e por isso bem feito.
            </p>
            <p className="mt-6 text-[0.85rem] text-osso-3">{agencia.cidade}</p>
          </div>

          <nav aria-label="Projetos demonstrativos">
            <p className="t-rotulo text-osso-3">Projetos</p>
            <ul className="mt-4">
              {demos.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/projetos/${d.slug}/`}
                    className="group inline-flex min-h-[40px] items-center gap-2 text-[0.92rem] text-osso-2 transition-colors hover:text-osso"
                  >
                    {d.nome}
                    <span
                      aria-hidden
                      className="opacity-0 transition-all duration-400 group-hover:translate-x-0.5 group-hover:opacity-100"
                    >
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="t-rotulo text-osso-3">Contato</p>
            <ul className="mt-4 text-[0.92rem] text-osso-2">
              <li>
                <a
                  href={linkWhats(fechamento.mensagemWhats)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[40px] items-center transition-colors hover:text-osso"
                >
                  {agencia.whatsappVisivel}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${agencia.email}`}
                  className="inline-flex min-h-[40px] items-center transition-colors hover:text-osso"
                >
                  {agencia.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-t border-fio pt-7 text-[0.75rem] text-osso-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {agencia.nome}. Todos os direitos reservados.
          </p>
          <p>As barbearias dos projetos são fictícias, criadas para demonstração.</p>
        </div>
      </div>

      {/* Assinatura em corpo grande, cortada pela base da página.
          Fecha o documento como capa de portfólio — e é o único
          lugar onde a marca aparece em escala. */}
      <p
        aria-hidden
        className="t-display mt-10 w-full translate-y-[0.18em] px-5 text-center text-[clamp(3.2rem,15.5vw,13rem)] leading-none whitespace-nowrap text-osso opacity-[0.055] select-none sm:px-8"
      >
        {agencia.nome}
      </p>
    </footer>
  );
}
