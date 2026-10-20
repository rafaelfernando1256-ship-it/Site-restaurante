import { negocio } from '@/content/negocio';
import { reais } from '@/lib/pedido';

const atraso = (ms: number) => ({ '--atraso': `${ms}ms` }) as React.CSSProperties;

const GRUPOS = [
  {
    nome: 'Em cada caixa',
    itens: ['Carnes selecionadas', 'Temperos especiais', 'Preparo dedicado', 'Combos generosos', 'Sabor de churrasco de verdade'],
  },
  {
    nome: 'Quando entregamos',
    itens: ['Quinta-feira', 'Sexta-feira', 'Sábado', 'A partir das 20h', 'Com 8 horas de antecedência'],
  },
  {
    nome: 'Onde entregamos',
    itens: [
      'Sarandi: entrega grátis',
      `Maringá até ${negocio.entrega.raioGratisMaringaKm} km: entrega grátis`,
      `Demais regiões: ${reais(negocio.entrega.taxaDemaisRegioes)}`,
    ],
  },
];

/** O que a marca promete e as regras práticas, em texto corrido. */
export default function Qualidade() {
  return (
    <section id="entrega" aria-labelledby="titulo-qualidade" className="moldura secao">
      <h2 id="titulo-qualidade" className="titulo max-w-[18ch] text-titulo" data-revela>
        Carne de verdade, sem enrolação.
      </h2>
      <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8">
        {GRUPOS.map((g, i) => (
          <div key={g.nome} data-revela style={atraso(80 * i)}>
            <h3 className="text-destaque font-extrabold">{g.nome}</h3>
            <ul className="mt-4 grid gap-1.5 text-cinza">
              {g.itens.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        ))}
        <div className="bg-profundo p-6" data-revela style={atraso(240)}>
          <h3 className="text-destaque font-extrabold">Pelo WhatsApp</h3>
          <p className="numeros mt-3 text-destaque font-extrabold">{negocio.whatsapp.exibicao}</p>
          <p className="mt-2 text-cinza">Dúvidas sobre o cardápio ou sobre a entrega no seu endereço.</p>
          <a href={`https://wa.me/${negocio.whatsapp.numero}`} target="_blank" rel="noopener"
            className="mt-5 inline-block font-bold text-dourado underline hover:text-tinta">
            Conversar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
