import Link from "next/link";
import { agencia, linkWhats, fechamento } from "@/content/agencia";
import { demos } from "@/content/demos";

export default function Rodape() {
  return (
    <footer className="relative z-10 border-t border-fio bg-tinta">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-2xl font-semibold tracking-tight text-osso">
              {agencia.nome}
            </p>
            <p className="mt-3 max-w-sm text-sm text-osso-2">
              Sites para barbearia. Só isso, e por isso bem feito. {agencia.cidade}.
            </p>
          </div>

          <nav aria-label="Projetos demonstrativos">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-osso-3">Projetos</p>
            <ul className="mt-2">
              {demos.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/projetos/${d.slug}/`}
                    className="inline-flex min-h-[40px] items-center text-sm text-osso-2 transition-colors hover:text-osso"
                  >
                    {d.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-osso-3">Contato</p>
            <ul className="mt-2 text-sm text-osso-2">
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
                <a href={`mailto:${agencia.email}`} className="inline-flex min-h-[40px] items-center transition-colors hover:text-osso">
                  {agencia.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-fio pt-7 text-xs text-osso-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {agencia.nome}. Todos os direitos reservados.
          </p>
          <p>
            As barbearias apresentadas nos projetos são fictícias, criadas para demonstração.
          </p>
        </div>
      </div>
    </footer>
  );
}
