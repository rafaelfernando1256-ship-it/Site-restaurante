'use client';

/**
 * O CARDÁPIO.
 *
 * À direita, os nove combos em lista; à esquerda, parada na tela, a
 * caixa do combo aberto (ou do que está sob o mouse), desenhada vista
 * de cima. No celular a caixa entra dentro da linha aberta.
 */
import { Check, ChevronDown, Minus, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { combos, type Combo } from '@/content/cardapio';
import { useLoja } from '@/lib/loja';
import { MAX_POR_ITEM, reais } from '@/lib/pedido';

import Adicionais from './Adicionais';
import Caixa from './Caixa';

const atraso = (ms: number) => ({ '--atraso': `${ms}ms` }) as React.CSSProperties;

function Foto({ combo, className }: { combo: Combo; className: string }) {
  if (combo.foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={combo.foto} alt={`${combo.nome}: ${combo.itens.map((i) => i.texto).join(', ')}`}
      className={`${className} object-cover`} loading="lazy" decoding="async" width={1280} height={840} />;
  }
  return <Caixa combo={combo} className={className} />;
}

function Linha({ combo, aberta, aoAbrir, aoPassar }: {
  combo: Combo; aberta: boolean; aoAbrir: () => void; aoPassar: () => void;
}) {
  const loja = useLoja();
  const [quantos, setQuantos] = useState(1);
  const [acabou, setAcabou] = useState(false);
  const naCaixa = loja.quantidadeDe(combo.id);
  const painel = `combo-${combo.id}`;

  const adiciona = () => {
    loja.poe(combo.id, quantos);
    setAcabou(true);
    setQuantos(1);
    window.setTimeout(() => setAcabou(false), 1600);
  };

  return (
    <li className={`transition-colors duration-300 ${aberta ? 'bg-profundo' : ''}`} onMouseEnter={aoPassar}>
      <h3>
        <button type="button" onClick={aoAbrir} onFocus={aoPassar} aria-expanded={aberta} aria-controls={painel}
          className="group grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5 px-4 py-5 text-left sm:flex sm:items-baseline sm:px-6">
          <span className={`titulo text-sub leading-[1] transition-colors sm:flex-1 ${aberta ? 'text-tinta' : 'text-tinta group-hover:text-dourado'}`}>
            {combo.nome}
          </span>
          <ChevronDown size={20} aria-hidden className={`row-span-2 shrink-0 transition-transform duration-300 sm:order-last sm:self-center ${aberta ? 'rotate-180' : ''}`} />
          <span className="flex items-baseline gap-3">
            <span className="numeros font-extrabold text-dourado">{reais(combo.preco)}</span>
            {naCaixa > 0 && (
              <span className="numeros bg-grafite px-2 py-0.5 text-nota font-bold">{naCaixa} na encomenda</span>
            )}
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div id={painel} key="painel" className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}>
            <div className="grid gap-6 px-4 pb-7 sm:px-6">
              <Foto combo={combo} className="w-full lg:hidden" />
              {combo.nota && <p className="font-bold text-dourado">{combo.nota}</p>}
              <ul className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
                {combo.itens.map((item) => (
                  <li key={item.texto} className="flex gap-3">
                    <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 bg-brasa" aria-hidden />
                    {item.texto}
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-3">
                <div className="passo" role="group" aria-label={`Quantidade de ${combo.nome}`}>
                  <button type="button" onClick={() => setQuantos((q) => Math.max(1, q - 1))} disabled={quantos <= 1}
                    aria-label="Diminuir quantidade"><Minus size={18} aria-hidden /></button>
                  <output aria-live="polite">{quantos}</output>
                  <button type="button" onClick={() => setQuantos((q) => Math.min(MAX_POR_ITEM, q + 1))}
                    disabled={quantos >= MAX_POR_ITEM} aria-label="Aumentar quantidade"><Plus size={18} aria-hidden /></button>
                </div>
                <button type="button" onClick={adiciona} className="bt bt-acao min-w-[15.5rem] flex-1 sm:flex-none">
                  <AnimatePresence mode="wait" initial={false}>
                    {acabou ? (
                      <motion.span key="ok" className="flex items-center gap-2"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                        <Check size={18} aria-hidden /> Adicionado
                      </motion.span>
                    ) : (
                      <motion.span key="por" className="flex items-center gap-2"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                        Adicionar à encomenda
                        <span className="numeros opacity-85">{reais(combo.preco * quantos)}</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export default function Cardapio() {
  const [aberto, setAberto] = useState<string | null>(combos[0].id);
  const [olhando, setOlhando] = useState<string>(combos[0].id);
  const mostrado = combos.find((c) => c.id === olhando) ?? combos[0];

  return (
    <section id="cardapio" aria-labelledby="titulo-cardapio" className="moldura secao">
      <div className="grid gap-x-8 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <h2 id="titulo-cardapio" className="titulo text-titulo" data-revela>Cardápio</h2>
          <p className="mt-5 max-w-[44ch] text-destaque leading-[1.45]" data-revela style={atraso(60)}>
            Nove combos, montados na caixa para o horário que você escolher.
          </p>
        </div>
        <p className="mt-6 self-end bg-profundo p-5 font-semibold lg:col-span-5 lg:col-start-8 lg:mt-0" data-revela style={atraso(120)}>
          Todos os combos são preparados sob encomenda, com{' '}
          <span className="text-dourado">no mínimo 8 horas de antecedência</span>.
        </p>
      </div>

      <div className="mt-14 grid gap-x-8 lg:mt-20 lg:grid-cols-12">
        <div className="hidden lg:col-span-6 lg:block">
          <div className="sticky top-[14vh]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={mostrado.id} initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.985 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                <Foto combo={mostrado} className="w-full" />
                <p className="mt-4 max-w-[62ch] text-cinza">
                  {mostrado.foto ? mostrado.nome : `${mostrado.nome}, vista de cima: o espaço de cada carne segue o peso do cardápio.`}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <ul className="grid gap-1 lg:col-span-6" aria-label="Combos">
          {combos.map((c) => (
            <Linha key={c.id} combo={c} aberta={aberto === c.id}
              aoAbrir={() => { setAberto((a) => (a === c.id ? null : c.id)); setOlhando(c.id); }}
              aoPassar={() => setOlhando(c.id)} />
          ))}
        </ul>
      </div>

      <Adicionais />
    </section>
  );
}
