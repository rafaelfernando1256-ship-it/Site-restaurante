'use client';

import { useCallback, useRef, useState } from 'react';

import { Foto } from '@/components/Foto';
import { Revelar } from '@/components/Revelar';
import { site } from '@/content/site';

/**
 * O ANTES E DEPOIS.
 *
 * Duas imagens empilhadas, a de cima recortada por `clip-path`, e um
 * divisor que você arrasta.
 *
 * ─────────────────────────────────────────────────────────────────
 * ELE FUNCIONA NO TECLADO, E ISSO NÃO É DETALHE
 * ─────────────────────────────────────────────────────────────────
 * Comparador de antes/depois é o controle que mais costuma ficar de
 * fora para quem não usa mouse. Aqui o divisor é um `role="slider"` de
 * verdade: recebe foco, anda com as setas, pula de dez em dez com
 * PageUp/PageDown, vai aos extremos com Home/End, e anuncia a posição
 * em porcentagem. Quem navega por teclado consegue ver as duas fotos.
 *
 * O arrasto usa Pointer Events — um único caminho de código para
 * mouse, dedo e caneta — com `setPointerCapture`, que é o que faz o
 * arrasto continuar funcionando quando o cursor sai da imagem.
 */
export function AntesDepois() {
  const { resultados } = site;

  return (
    <section id="resultados" className="grao relative overflow-hidden bg-areia-fundo py-28 lg:py-40">
      <div className="mx-auto max-w-[82rem] px-6 lg:px-10">
        <div className="max-w-2xl">
          <Revelar>
            <p className="sobretitulo">{resultados.sobretitulo}</p>
            <span className="regua mt-5" />
          </Revelar>
          <Revelar atraso={0.08}>
            <h2 className="mt-9 font-display text-[clamp(2.4rem,5.5vw,4.2rem)] text-grafite">
              {resultados.titulo}
            </h2>
          </Revelar>
          <Revelar atraso={0.14}>
            <p className="mt-7 text-[0.98rem] leading-[1.75] text-grafite-claro">
              {resultados.texto}
            </p>
          </Revelar>
        </div>

        <ul className="mt-16 grid gap-x-8 gap-y-14 lg:mt-20 lg:grid-cols-3">
          {resultados.pares.map((par, i) => (
            <Revelar key={par.titulo} as="li" atraso={i * 0.1}>
              <Comparador
                antes={par.antes}
                depois={par.depois}
                titulo={par.titulo}
                semente={i + 9}
              />
              <h3 className="mt-6 text-[0.95rem] font-medium tracking-wide text-grafite">
                {par.titulo}
              </h3>
              <p className="mt-1.5 text-[0.85rem] text-grafite-suave">{par.legenda}</p>
            </Revelar>
          ))}
        </ul>

        <Revelar atraso={0.1}>
          <p className="mt-14 border-t border-areia-escura pt-6 text-[0.78rem] uppercase tracking-[0.18em] text-grafite-suave">
            {resultados.aviso}
          </p>
        </Revelar>
      </div>
    </section>
  );
}

function Comparador({
  antes,
  depois,
  titulo,
  semente,
}: {
  antes: string;
  depois: string;
  titulo: string;
  semente: number;
}) {
  const moldura = useRef<HTMLDivElement>(null);
  const [posicao, setPosicao] = useState(50);

  const mover = useCallback((clienteX: number) => {
    const caixa = moldura.current?.getBoundingClientRect();
    if (!caixa || caixa.width === 0) return;
    const bruto = ((clienteX - caixa.left) / caixa.width) * 100;
    setPosicao(Math.min(100, Math.max(0, bruto)));
  }, []);

  const aoTeclar = (evento: React.KeyboardEvent) => {
    const passo = evento.shiftKey ? 10 : 2;
    const mapa: Record<string, number> = {
      ArrowLeft: -passo,
      ArrowRight: passo,
      ArrowDown: -passo,
      ArrowUp: passo,
      PageDown: -10,
      PageUp: 10,
    };
    if (evento.key === 'Home') {
      evento.preventDefault();
      setPosicao(0);
      return;
    }
    if (evento.key === 'End') {
      evento.preventDefault();
      setPosicao(100);
      return;
    }
    const delta = mapa[evento.key];
    if (delta === undefined) return;
    evento.preventDefault();
    setPosicao((p) => Math.min(100, Math.max(0, p + delta)));
  };

  return (
    <div
      ref={moldura}
      className="relative aspect-[4/5] w-full touch-none select-none overflow-hidden rounded-[2px] bg-areia-escura"
      onPointerDown={(evento) => {
        // A captura é o que faz o arrasto sobreviver a sair da caixa.
        evento.currentTarget.setPointerCapture(evento.pointerId);
        mover(evento.clientX);
      }}
      onPointerMove={(evento) => {
        if (evento.currentTarget.hasPointerCapture(evento.pointerId)) mover(evento.clientX);
      }}
    >
      {/* A de baixo: o depois. */}
      <Foto
        src={depois}
        alt={`${titulo} — ${site.resultados.rotuloDepois}`}
        semente={semente}
        sizes="(max-width: 1024px) 100vw, 33vw"
      />

      {/* A de cima: o antes, recortada até a posição do divisor. */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - posicao}% 0 0)` }}
      >
        <Foto
          src={antes}
          alt={`${titulo} — ${site.resultados.rotuloAntes}`}
          semente={semente + 40}
          sizes="(max-width: 1024px) 100vw, 33vw"
        />
      </div>

      <Etiqueta lado="left">{site.resultados.rotuloAntes}</Etiqueta>
      <Etiqueta lado="right">{site.resultados.rotuloDepois}</Etiqueta>

      {/* O divisor. É ele que recebe o foco e as setas. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Comparar antes e depois — ${titulo}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(posicao)}
        aria-valuetext={`${Math.round(posicao)}% do antes visível`}
        onKeyDown={aoTeclar}
        className="absolute inset-y-0 z-10 w-10 -translate-x-1/2 cursor-ew-resize focus-visible:outline-none"
        style={{ left: `${posicao}%` }}
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-areia-fundo/90" />
        <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-areia-fundo/70 bg-areia-fundo/85 shadow-[0_2px_14px_rgba(28,28,28,0.14)] backdrop-blur-[2px]">
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true">
            <path d="M5 1L1 5l4 4M11 1l4 4-4 4" stroke="#1C1C1C" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </div>
  );
}

function Etiqueta({ lado, children }: { lado: 'left' | 'right'; children: React.ReactNode }) {
  return (
    <span
      className={`pointer-events-none absolute bottom-4 z-10 rounded-full bg-grafite/75 px-3.5 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-areia backdrop-blur-[2px] ${
        lado === 'left' ? 'left-4' : 'right-4'
      }`}
    >
      {children}
    </span>
  );
}
