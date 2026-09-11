import Secao from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import Botao from "@/components/ui/Botao";
import IconeWhats from "@/components/ui/IconeWhats";
import { garantia, fechamento, agencia, linkWhats } from "@/content/agencia";

export default function Fechamento() {
  return (
    <>
      {/* Garantia — tira o risco da mesa antes de pedir o contato */}
      <Secao className="border-t border-fio">
        <Revelar>
          <div className="rounded-2xl border border-fio bg-tinta-2 p-9 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-tight font-semibold tracking-tight text-osso">
                  {garantia.titulo}
                </h2>
                <p className="mt-4 max-w-xl text-[1rem] leading-relaxed text-osso-2">
                  {garantia.texto}
                </p>
              </div>
              <Botao
                href={linkWhats(garantia.mensagemWhats)}
                variante="claro"
                tamanho="lg"
                externo
              >
                {garantia.cta}
              </Botao>
            </div>
          </div>
        </Revelar>
      </Secao>

      {/* Chamada final */}
      <Secao id="contato" className="border-t border-fio pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <Revelar>
            <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] leading-[1.08] font-semibold tracking-[-0.02em] text-balance text-osso">
              {fechamento.titulo}
            </h2>
          </Revelar>
          <Revelar atraso={0.08}>
            <p className="mt-6 text-[1.05rem] leading-relaxed text-osso-2">{fechamento.texto}</p>
          </Revelar>
          <Revelar atraso={0.16}>
            <div className="mt-10 flex justify-center">
              <Botao href={linkWhats(fechamento.mensagemWhats)} variante="whats" tamanho="lg" externo>
                <IconeWhats />
                {fechamento.cta}
              </Botao>
            </div>
            <p className="mt-4 text-xs text-osso-3">{agencia.tempoResposta}</p>
          </Revelar>
        </div>
      </Secao>
    </>
  );
}
