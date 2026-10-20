'use client';

import { useLoja } from '@/lib/loja';

/**
 * "Fazer minha encomenda": com algo na caixa, abre a encomenda; com a
 * caixa vazia, leva ao cardápio, que é por onde a encomenda começa.
 */
export default function BotaoEncomendar({ className, children }: { className: string; children: React.ReactNode }) {
  const loja = useLoja();
  return (
    <a href="#cardapio" className={className}
      onClick={(e) => {
        if (loja.pecas === 0) return;
        e.preventDefault();
        loja.abre();
      }}>
      {children}
    </a>
  );
}
