import { Revelar } from '@/components/Revelar';
import { enderecoEmLinha, site } from '@/content/site';

/**
 * O RODAPÉ.
 *
 * Três colunas e, embaixo de tudo, o aviso de projeto conceitual.
 *
 * Esse aviso não é letra miúda escondida: fica em tamanho legível,
 * separado por uma linha, e diz exatamente o que é fictício — nome,
 * endereço, telefone, números, depoimentos, imagens e a profissional.
 * Um site de portfólio que se faz passar por clínica de verdade
 * confunde quem procura atendimento, e a diferença entre as duas
 * coisas é um parágrafo.
 */
export function Rodape() {
  const { rodape, contato, marca } = site;

  return (
    <footer className="grao relative overflow-hidden bg-grafite pt-24 text-areia lg:pt-32">
      <div className="mx-auto max-w-[82rem] px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-10">
          <Revelar>
            <p className="font-display text-[1.9rem] font-light leading-tight">{marca.nome}</p>
            <p className="mt-2 text-[0.68rem] uppercase tracking-[0.28em] text-dourado">
              {marca.complemento}
            </p>
            <p className="mt-7 max-w-xs text-[0.9rem] leading-relaxed text-areia/55">
              {rodape.sobre}
            </p>
          </Revelar>

          <Revelar atraso={0.06}>
            <h2 className="text-[0.68rem] uppercase tracking-[0.24em] text-areia/40">Navegar</h2>
            <ul className="mt-6 space-y-3.5">
              {site.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-[0.92rem] text-areia/75 transition-colors hover:text-dourado"
                  >
                    {item.rotulo}
                  </a>
                </li>
              ))}
            </ul>
          </Revelar>

          <Revelar atraso={0.12}>
            <h2 className="text-[0.68rem] uppercase tracking-[0.24em] text-areia/40">Contato</h2>
            <ul className="mt-6 space-y-3.5 text-[0.92rem] text-areia/75">
              <li>
                <a
                  href={`tel:${contato.telefoneVisivel.replace(/\D/g, '')}`}
                  className="transition-colors hover:text-dourado"
                >
                  {contato.telefoneVisivel}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contato.email}`}
                  className="transition-colors hover:text-dourado"
                >
                  {contato.email}
                </a>
              </li>
              <li>
                <a
                  href={contato.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-dourado"
                >
                  Instagram
                </a>
              </li>
              <li className="pt-2 leading-relaxed text-areia/55">{enderecoEmLinha()}</li>
            </ul>
          </Revelar>

          <Revelar atraso={0.18}>
            <h2 className="text-[0.68rem] uppercase tracking-[0.24em] text-areia/40">Horários</h2>
            <ul className="mt-6 space-y-3.5 text-[0.92rem] text-areia/75">
              {contato.horarios.map((h) => (
                <li key={h.dias} className="flex justify-between gap-4 lg:block">
                  <span>{h.dias}</span>
                  <span className="text-areia/50 lg:mt-0.5 lg:block">{h.horas}</span>
                </li>
              ))}
            </ul>
          </Revelar>
        </div>

        {/* O aviso. Em cima da assinatura, separado, e em tamanho que
            se lê sem esforço. */}
        <div className="mt-20 border-t border-areia/15 pt-8 lg:mt-24">
          <p className="max-w-3xl text-[0.86rem] leading-relaxed text-areia/55">
            <strong className="font-medium text-dourado">{marca.conceitual}.</strong>{' '}
            {rodape.conceitual}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-areia/10 py-8 text-[0.78rem] text-areia/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {marca.nome} · {rodape.assinatura}
          </p>
          <p>{marca.assinatura}</p>
        </div>
      </div>
    </footer>
  );
}
