'use client';

/**
 * O estado da encomenda, compartilhado pela página inteira: o que está
 * na caixa, se a gaveta está aberta, em que passo do fechamento o
 * cliente está, e o recado de "adicionado".
 *
 * Os itens ficam guardados no navegador: o cliente pode fechar a aba,
 * voltar mais tarde e encontrar a encomenda como deixou. Se o navegador
 * não deixar guardar (aba anônima, armazenamento cheio), tudo continua
 * funcionando — só não sobrevive ao fechar a aba.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react';

import { produtos } from '@/content/cardapio';
import { limpaCarrinho, MAX_POR_ITEM, quantasPecas, subtotal, type Linha } from '@/lib/pedido';

export type Etapa = 'itens' | 'dados' | 'revisao' | 'enviado';

type Estado = {
  linhas: Linha[];
  aberta: boolean;
  etapa: Etapa;
  recado: { texto: string; vez: number } | null;
};

type Acao =
  | { tipo: 'carrega'; linhas: Linha[] }
  | { tipo: 'poe'; id: string; quantidade: number }
  | { tipo: 'muda'; id: string; quantidade: number }
  | { tipo: 'tira'; id: string }
  | { tipo: 'esvazia' }
  | { tipo: 'abre'; etapa?: Etapa }
  | { tipo: 'fecha' }
  | { tipo: 'etapa'; etapa: Etapa }
  | { tipo: 'recado'; texto: string }
  | { tipo: 'some' };

const CHAVE = 'caixabruta:encomenda:v1';

function reduz(e: Estado, a: Acao): Estado {
  switch (a.tipo) {
    case 'carrega': return { ...e, linhas: a.linhas };
    case 'poe': {
      const ja = e.linhas.find((l) => l.id === a.id);
      const linhas = ja
        ? e.linhas.map((l) => (l.id === a.id ? { ...l, quantidade: Math.min(MAX_POR_ITEM, l.quantidade + a.quantidade) } : l))
        : [...e.linhas, { id: a.id, quantidade: Math.min(MAX_POR_ITEM, a.quantidade) }];
      return { ...e, linhas, etapa: e.etapa === 'enviado' ? 'itens' : e.etapa };
    }
    case 'muda': {
      if (a.quantidade <= 0) return { ...e, linhas: e.linhas.filter((l) => l.id !== a.id) };
      const q = Math.min(MAX_POR_ITEM, a.quantidade);
      const ja = e.linhas.some((l) => l.id === a.id);
      return {
        ...e,
        linhas: ja ? e.linhas.map((l) => (l.id === a.id ? { ...l, quantidade: q } : l)) : [...e.linhas, { id: a.id, quantidade: q }],
      };
    }
    case 'tira': return { ...e, linhas: e.linhas.filter((l) => l.id !== a.id) };
    case 'esvazia': return { ...e, linhas: [], etapa: 'itens' };
    case 'abre': return { ...e, aberta: true, etapa: a.etapa ?? (e.etapa === 'enviado' && e.linhas.length ? 'itens' : e.etapa) };
    case 'fecha': return { ...e, aberta: false };
    case 'etapa': return { ...e, etapa: a.etapa };
    case 'recado': return { ...e, recado: { texto: a.texto, vez: (e.recado?.vez ?? 0) + 1 } };
    case 'some': return { ...e, recado: null };
    default: return e;
  }
}

type Loja = Estado & {
  pecas: number;
  subtotal: number;
  quantidadeDe: (id: string) => number;
  poe: (id: string, quantidade?: number) => void;
  muda: (id: string, quantidade: number) => void;
  tira: (id: string) => void;
  esvazia: () => void;
  abre: (etapa?: Etapa) => void;
  fecha: () => void;
  vaiPara: (etapa: Etapa) => void;
  some: () => void;
};

const Contexto = createContext<Loja | null>(null);

export function LojaProvider({ children }: { children: React.ReactNode }) {
  const [estado, despacha] = useReducer(reduz, { linhas: [], aberta: false, etapa: 'itens', recado: null });
  const [leu, setLeu] = useState(false);

  // Lê depois de montar: o HTML do servidor não sabe o que há no
  // navegador, e ler antes faria a página piscar diferente.
  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(CHAVE);
      if (salvo) despacha({ tipo: 'carrega', linhas: limpaCarrinho(JSON.parse(salvo)) });
    } catch { /* sem armazenamento: segue sem guardar */ }
    setLeu(true);
  }, []);

  // Só grava depois de ler: gravar antes apagaria a encomenda guardada
  // com a caixa ainda vazia do primeiro desenho.
  useEffect(() => {
    if (!leu) return;
    try { window.localStorage.setItem(CHAVE, JSON.stringify(estado.linhas)); } catch { /* idem */ }
  }, [estado.linhas, leu]);

  const poe = useCallback((id: string, quantidade = 1) => {
    despacha({ tipo: 'poe', id, quantidade });
    const nome = produtos[id]?.nome ?? 'Item';
    despacha({ tipo: 'recado', texto: quantidade > 1 ? `${quantidade}x ${nome} na encomenda` : `${nome} na encomenda` });
  }, []);

  const valor = useMemo<Loja>(() => ({
    ...estado,
    pecas: quantasPecas(estado.linhas),
    subtotal: subtotal(estado.linhas),
    quantidadeDe: (id) => estado.linhas.find((l) => l.id === id)?.quantidade ?? 0,
    poe,
    muda: (id, quantidade) => despacha({ tipo: 'muda', id, quantidade }),
    tira: (id) => despacha({ tipo: 'tira', id }),
    esvazia: () => despacha({ tipo: 'esvazia' }),
    abre: (etapa) => despacha({ tipo: 'abre', etapa }),
    fecha: () => despacha({ tipo: 'fecha' }),
    vaiPara: (etapa) => despacha({ tipo: 'etapa', etapa }),
    some: () => despacha({ tipo: 'some' }),
  }), [estado, poe]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useLoja() {
  const loja = useContext(Contexto);
  if (!loja) throw new Error('useLoja fora do LojaProvider');
  return loja;
}
