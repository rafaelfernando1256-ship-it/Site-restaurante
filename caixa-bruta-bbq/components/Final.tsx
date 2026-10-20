import Brasa from './Brasa';
import BotaoEncomendar from './BotaoEncomendar';
import Nome from './Nome';

const atraso = (ms: number) => ({ '--atraso': `${ms}ms` }) as React.CSSProperties;

/** A brasa volta para fechar a página, e o nome volta inteiro. */
export default function Final({ ano }: { ano: number }) {
  return (
    <>
      <section id="encomendar" aria-labelledby="titulo-final" className="moldura secao">
        <h2 id="titulo-final" className="titulo max-w-[22ch] text-titulo" data-revela>
          A brasa está pronta para o seu próximo momento.
        </h2>
        <div className="mt-12 grid gap-10 lg:mt-16 lg:grid-cols-12 lg:gap-x-8">
          <div className="lg:col-span-7" data-revela style={atraso(80)}>
            <Brasa className="h-[52svh] min-h-[300px] lg:h-[64svh]" rotulo="Brasa acesa sob a grelha" />
          </div>
          <div className="flex flex-col justify-end gap-6 lg:col-span-4 lg:col-start-9">
            <p className="text-destaque leading-[1.45]" data-revela style={atraso(140)}>
              Escolha seu combo, programe sua encomenda com antecedência e deixe o churrasco por nossa conta.
            </p>
            <div data-revela style={atraso(200)}>
              <BotaoEncomendar className="bt bt-acao w-full sm:w-auto">Garantir meu churrasco</BotaoEncomendar>
            </div>
            <p className="font-bold text-dourado" data-revela style={atraso(260)}>
              Pedidos com no mínimo 8 horas de antecedência.
            </p>
          </div>
        </div>
      </section>
      <Nome ano={ano} />
    </>
  );
}
