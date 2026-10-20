const atraso = (ms: number) => ({ '--atraso': `${ms}ms` }) as React.CSSProperties;

const PASSOS = [
  { titulo: 'Escolha seu combo', texto: 'Explore o cardápio e selecione suas carnes favoritas.' },
  { titulo: 'Encomende com antecedência', texto: 'Escolha o dia e horário respeitando o prazo mínimo de 8 horas.' },
  { titulo: 'Receba seu churrasco', texto: 'Nossa equipe prepara sua encomenda para o horário combinado, após confirmação.' },
];

/** Três passos, em ordem: aqui a numeração é a informação. */
export default function ComoFunciona() {
  return (
    <section id="como-funciona" aria-labelledby="titulo-como" className="moldura secao">
      <h2 id="titulo-como" className="titulo text-titulo" data-revela>Como funciona</h2>
      <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-8 lg:mt-20">
        {PASSOS.map((p, i) => (
          <li key={p.titulo} className={['', 'md:mt-20', 'md:mt-40'][i]} data-revela style={atraso(90 * i)}>
            <span className="titulo block text-dourado text-mostra leading-[0.85]" aria-hidden>
              {String(i + 1).padStart(2, '0') /* 01, 02, 03: pedido no briefing, e a ordem é real. taste-skill-ignore */}
            </span>
            <h3 className="titulo mt-6 text-sub">{p.titulo}</h3>
            <p className="mt-3 max-w-[30ch] text-cinza">{p.texto}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
