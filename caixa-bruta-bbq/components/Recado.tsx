'use client';

/**
 * O retorno do "adicionar": um recado curto no pé da tela, com o atalho
 * para ver a encomenda. No celular, junto vem a barra fixa da encomenda,
 * que aparece depois do primeiro quadro.
 */
import { Check, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import { useLoja } from '@/lib/loja';
import { reais } from '@/lib/pedido';

export default function Recado() {
  const loja = useLoja();
  const [passouDoTopo, setPassouDoTopo] = useState(false);

  useEffect(() => {
    if (!loja.recado) return;
    const t = window.setTimeout(() => loja.some(), 3600);
    return () => window.clearTimeout(t);
  }, [loja.recado]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ve = () => setPassouDoTopo(window.scrollY > window.innerHeight * 0.8);
    ve();
    window.addEventListener('scroll', ve, { passive: true });
    return () => window.removeEventListener('scroll', ve);
  }, []);

  const barra = passouDoTopo && !loja.aberta;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-[84px] z-40 flex justify-center px-4 md:bottom-8" aria-live="polite">
        <AnimatePresence>
          {loja.recado && !loja.aberta && (
            <motion.div key={loja.recado.vez} role="status"
              className="pointer-events-auto flex max-w-[520px] items-center gap-4 bg-tinta py-2 pl-4 pr-2 text-carvao flutua"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
              <Check size={18} aria-hidden className="shrink-0 text-brasa" />
              <span className="font-bold">{loja.recado.texto}</span>
              <button type="button" onClick={() => { loja.some(); loja.abre('itens'); }}
                className="bg-carvao px-3 py-2 text-nota font-bold text-tinta hover:bg-grafite">
                Ver encomenda
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {barra && (
          <motion.div key="barra" className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 bg-carvao px-4 py-3 md:hidden"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="font-bold">{loja.pecas ? `${loja.pecas} ${loja.pecas === 1 ? 'item' : 'itens'}` : 'Sob encomenda'}</p>
              <p className="numeros text-nota text-cinza">{loja.pecas ? reais(loja.subtotal) : 'com 8 horas de antecedência'}</p>
            </div>
            {loja.pecas
              ? <button type="button" className="bt bt-acao min-h-[48px]" onClick={() => loja.abre()}><ShoppingBag size={18} aria-hidden /> Ver encomenda</button>
              : <a href="#cardapio" className="bt bt-acao min-h-[48px]">Encomendar</a>}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
