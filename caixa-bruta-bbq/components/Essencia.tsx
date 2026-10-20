import { combos } from '@/content/cardapio';

import Caixa from './Caixa';

const atraso = (ms: number) => ({ '--atraso': `${ms}ms` }) as React.CSSProperties;

const rei = combos.find((c) => c.id === 'rei-da-brasa')!;

/** A marca em uma frase, e a maior caixa da casa, aberta. */
export default function Essencia() {
  return (
    <section id="essencia" aria-labelledby="titulo-essencia" className="moldura secao">
      <h2 id="titulo-essencia" className="titulo text-titulo" data-revela>
        <span className="block">O fogo é nossa essência.</span>
        <span className="block pl-[8vw] lg:pl-[16vw]">O sabor é nossa assinatura.</span>
      </h2>

      <div className="mt-14 grid items-end gap-10 lg:mt-20 lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-4">
          <p className="max-w-[30ch] text-destaque leading-[1.45]" data-revela style={atraso(80)}>
            Carnes selecionadas, temperos especiais e preparo dedicado. Cada combo é pensado para
            transformar seu momento em uma verdadeira experiência de churrasco.
          </p>
          <p className="mt-6 max-w-[38ch] text-cinza" data-revela style={atraso(140)}>
            Trabalhamos só com encomendas: cada caixa é montada para o horário que você escolheu.
          </p>
        </div>

        <figure className="lg:col-span-8" data-revela style={atraso(180)}>
          <Caixa combo={rei} className="w-full -rotate-2" />
          <figcaption className="mt-5 max-w-[62ch] text-cinza">
            Rei da Brasa, a maior caixa da casa: 1 kg de alcatra, 700 g de coxinha da asa, 6 linguiças toscanas,
            3 pães de alho, arroz, farofa e vinagrete.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
