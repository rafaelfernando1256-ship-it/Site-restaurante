import Image from "next/image";
import Secao, { CabecaSecao } from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import { quemFaz } from "@/content/agencia";

/* ═══════════════════════════════════════════════════════════════
   QUEM FAZ
   O site inteiro era anônimo. Para um serviço local fechado pelo
   WhatsApp, "quem é essa pessoa?" é a pergunta que trava o
   contato — e ela não tinha resposta em lugar nenhum da página.
   ═══════════════════════════════════════════════════════════════ */
export default function QuemFaz() {
  const inicial = quemFaz.nome.trim().charAt(0).toUpperCase();

  return (
    <Secao id="quem-faz" tom="base">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div>
          <CabecaSecao indice="05" etiqueta={quemFaz.etiqueta} titulo={quemFaz.titulo} />

          <Revelar atraso={0.14}>
            <div className="mt-10 flex items-center gap-5">
              {quemFaz.foto ? (
                <Image
                  src={quemFaz.foto}
                  alt={`Foto de ${quemFaz.nome}`}
                  width={112}
                  height={112}
                  className="h-20 w-20 rounded-full object-cover ring-1 ring-fio-forte sm:h-24 sm:w-24"
                />
              ) : (
                <span
                  aria-hidden
                  className="t-display grid h-20 w-20 shrink-0 place-items-center rounded-full bg-tinta-3 text-[1.8rem] text-osso ring-1 ring-fio-forte sm:h-24 sm:w-24"
                >
                  {inicial}
                </span>
              )}
              <div>
                <p className="t-display text-[1.35rem] text-osso">{quemFaz.nome}</p>
                <p className="mt-1 text-[0.9rem] text-osso-2">{quemFaz.papel}</p>
              </div>
            </div>
          </Revelar>
        </div>

        <div className="lg:pt-4">
          {quemFaz.paragrafos.map((texto, i) => (
            <Revelar key={i} atraso={0.06 + i * 0.06}>
              <p className="mb-5 max-w-[58ch] text-[1.02rem] leading-[1.72] text-osso-2">{texto}</p>
            </Revelar>
          ))}

          <Revelar atraso={0.3}>
            <ul className="mt-9 border-t border-fio">
              {quemFaz.compromissos.map((c) => (
                <li
                  key={c}
                  className="flex items-start gap-4 border-b border-fio py-4 text-[0.95rem] text-osso"
                >
                  <span aria-hidden className="mt-[0.7rem] h-px w-4 shrink-0 bg-osso-3" />
                  {c}
                </li>
              ))}
            </ul>
          </Revelar>
        </div>
      </div>
    </Secao>
  );
}
