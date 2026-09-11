import Secao from "@/components/ui/Secao";
import Revelar from "@/components/ui/Revelar";
import RevelarMascara from "@/components/ui/RevelarMascara";
import Botao from "@/components/ui/Botao";
import IconeWhats from "@/components/ui/IconeWhats";
import { garantia, fechamento, agencia, linkWhats } from "@/content/agencia";

export default function Fechamento() {
  return (
    <>
      {/* ─────────────────────────────────────────────────────────
          GARANTIA — a única seção clara da página.
          Depois de sete telas escuras, o branco funciona como
          respiro e joga toda a atenção no argumento que derruba o
          risco. É o momento em que a confiança precisa ser sentida,
          não só lida.
          ───────────────────────────────────────────────────────── */}
      <Secao id="garantia" tom="claro" className="py-28 sm:py-36">
        <div className="grid gap-14 lg:grid-cols-[1fr_26rem] lg:gap-20">
          <div>
            <Revelar>
              <p className="flex items-center gap-4">
                <span className="t-numeral text-[0.82rem] text-tinta/62">07</span>
                <span aria-hidden className="h-px w-8 bg-fio-escuro" />
                <span className="t-rotulo text-tinta/65">Risco zero</span>
              </p>
            </Revelar>

            <Revelar atraso={0.06}>
              <h2 className="t-display mt-7 max-w-[16ch] text-[clamp(2.2rem,5vw,3.8rem)] text-tinta">
                {garantia.titulo}
              </h2>
            </Revelar>

            <Revelar atraso={0.12}>
              <p className="mt-6 max-w-[46ch] text-[1.08rem] leading-[1.7] text-tinta/70">
                {garantia.texto}
              </p>
            </Revelar>
          </div>

          {/* Como a garantia funciona na prática. Sem isso ela soa
              promessa de vendedor; com isso vira procedimento. */}
          <div className="lg:pt-2">
            <ol>
              {garantia.passos.map((p, i) => (
                <Revelar key={p.numero} atraso={0.16 + i * 0.06} as="li">
                  <div className="flex gap-5 border-t border-fio-escuro py-5">
                    <span className="t-numeral text-[0.85rem] text-tinta/62">{p.numero}</span>
                    <p className="text-[0.97rem] leading-[1.6] text-tinta/80">{p.texto}</p>
                  </div>
                </Revelar>
              ))}
              <li aria-hidden className="border-t border-fio-escuro" />
            </ol>

            <Revelar atraso={0.34}>
              <Botao
                href={linkWhats(garantia.mensagemWhats)}
                variante="escuro"
                tamanho="lg"
                externo
                className="mt-8 w-full sm:w-auto"
              >
                {garantia.cta}
              </Botao>
            </Revelar>
          </div>
        </div>
      </Secao>

      {/* ─── Chamada final ─────────────────────────────────────── */}
      <Secao id="contato" tom="base" className="pb-32 sm:pb-40">
        <div className="mx-auto max-w-3xl text-center">
          <RevelarMascara>
            <h2 className="t-display text-[clamp(2.4rem,6.5vw,4.4rem)] text-osso">
              {fechamento.titulo}
            </h2>
          </RevelarMascara>

          <Revelar atraso={0.1}>
            <p className="mx-auto mt-7 max-w-[52ch] text-[1.05rem] leading-[1.7] text-osso-2">
              {fechamento.texto}
            </p>
          </Revelar>

          <Revelar atraso={0.18}>
            <div className="mt-11 flex justify-center">
              <Botao href={linkWhats(fechamento.mensagemWhats)} variante="claro" tamanho="lg" externo>
                <IconeWhats className="h-[18px] w-[18px]" />
                {fechamento.cta}
              </Botao>
            </div>
            <p className="mt-4 text-[0.8rem] text-osso-3">{agencia.tempoResposta}</p>
          </Revelar>
        </div>
      </Secao>
    </>
  );
}
