'use client';

/**
 * SEU CHURRASCO MERECE TEMPO DE PREPARO.
 *
 * O aviso que vem antes do cardápio, e a prova dele: os próximos dias
 * de entrega, calculados agora, com o primeiro horário que cada um
 * ainda aceita.
 */
import { diaCurto, dataCurta, diasDoCalendario, horaFalada, horariosDoDia, quandoFalado } from '@/lib/agenda';
import { useLoja } from '@/lib/loja';
import { useAgora } from '@/lib/useAgora';

const atraso = (ms: number) => ({ '--atraso': `${ms}ms` }) as React.CSSProperties;

const NOME_DO_DIA: Record<string, string> = { qui: 'Quinta', sex: 'Sexta', 'sáb': 'Sábado' };

export default function Prazo() {
  const agora = useAgora();
  const loja = useLoja();
  const dias = agora ? diasDoCalendario(agora).slice(0, 3) : [];

  return (
    <section id="prazo" aria-labelledby="titulo-prazo" className="moldura secao">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-8">
        <p className="titulo normal-case text-dourado text-[clamp(9rem,26vw,22rem)] leading-[0.8] lg:col-span-5" aria-hidden data-revela>
          8h
        </p>

        <div className="lg:col-span-7 lg:self-end">
          <h2 id="titulo-prazo" className="titulo text-titulo" data-revela style={atraso(60)}>
            Seu churrasco merece tempo de preparo.
          </h2>
          <p className="mt-6 max-w-[52ch] text-destaque leading-[1.45]" data-revela style={atraso(120)}>
            Trabalhamos exclusivamente com encomendas antecipadas. Para garantir a qualidade e o sabor
            de cada combo, faça seu pedido com <strong className="text-dourado">pelo menos 8 horas de antecedência</strong>.
          </p>

          <div className="mt-10" data-revela style={atraso(180)}>
            <h3 className="font-bold">Se você encomendar agora</h3>
            <ul className="mt-3 grid gap-1.5" aria-live="polite">
              {(dias.length ? dias : [null, null, null]).map((dia, i) => {
                if (!dia || !agora) {
                  return <li key={i} className="h-[60px] bg-profundo" aria-hidden />;
                }
                const primeiro = horariosDoDia(dia.data, agora).find((h) => h.disponivel);
                const quando = quandoFalado(dia.data, agora);
                return (
                  <li key={dia.data} className="flex min-h-[60px] flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-profundo px-5 py-3">
                    <span className="font-bold">
                      {NOME_DO_DIA[diaCurto(dia.data)]}, {dataCurta(dia.data)}
                      {(quando === 'hoje' || quando === 'amanhã') && <span className="font-medium text-cinza"> ({quando})</span>}
                    </span>
                    {primeiro
                      ? <span className="font-semibold text-dourado">entrega a partir das {horaFalada(primeiro.hora)}</span>
                      : <span className="font-semibold text-cinza">prazo encerrado para este dia</span>}
                  </li>
                );
              })}
            </ul>
            <button type="button" className="bt bt-calmo mt-5"
              onClick={() => {
                if (loja.pecas === 0) {
                  document.getElementById('cardapio')?.scrollIntoView();
                  return;
                }
                loja.abre('dados');
              }}>
              {loja.pecas === 0 ? 'Escolher meu combo primeiro' : 'Escolher dia e horário'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
