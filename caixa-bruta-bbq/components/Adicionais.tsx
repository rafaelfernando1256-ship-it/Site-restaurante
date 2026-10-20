'use client';

import { Minus, Plus } from 'lucide-react';

import { adicionais } from '@/content/cardapio';
import { useLoja } from '@/lib/loja';
import { MAX_POR_ITEM, reais } from '@/lib/pedido';

const atraso = (ms: number) => ({ '--atraso': `${ms}ms` }) as React.CSSProperties;

/** As porções extras: mexer no número já muda a encomenda. */
export default function Adicionais() {
  const loja = useLoja();
  return (
    <div id="adicionais" className="mt-[clamp(80px,10vw,144px)] grid gap-10 lg:grid-cols-12 lg:gap-x-8">
      <div className="lg:col-span-5">
        <h3 className="titulo text-sub" data-revela>Adicionais</h3>
        <p className="mt-4 max-w-[36ch] text-cinza" data-revela style={atraso(60)}>
          Porções extras para completar a sua encomenda. Não trabalhamos com bebidas: o foco é o churrasco.
        </p>
      </div>
      <ul className="grid gap-1 lg:col-span-7" aria-label="Adicionais">
        {adicionais.map((a, i) => {
          const q = loja.quantidadeDe(a.id);
          return (
            <li key={a.id} className={`flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 transition-colors sm:px-6 ${q ? 'bg-profundo' : ''}`}
              data-revela style={atraso(40 * i)}>
              <span className="min-w-0 flex-1">
                <span className="block font-bold sm:inline">{a.nome}</span>{' '}
                <span className="block text-cinza sm:inline">{a.porcao}</span>
              </span>
              <span className="numeros font-extrabold text-dourado">{reais(a.preco)}</span>
              <div className="passo" role="group" aria-label={`Quantidade de ${a.nome} (${a.porcao})`}>
                <button type="button" onClick={() => loja.muda(a.id, q - 1)} disabled={q === 0}
                  aria-label={`Tirar uma porção de ${a.nome}`}><Minus size={18} aria-hidden /></button>
                <output aria-live="polite">{q}</output>
                <button type="button" onClick={() => (q === 0 ? loja.poe(a.id) : loja.muda(a.id, q + 1))}
                  disabled={q >= MAX_POR_ITEM} aria-label={`Pôr uma porção de ${a.nome}`}><Plus size={18} aria-hidden /></button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
