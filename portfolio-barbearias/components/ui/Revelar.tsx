"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   REVELAR
   Anima o elemento quando ele entra na tela.
   Estratégia à prova de falha: o conteúdo nasce visível no HTML.
   A classe que esconde só é aplicada pelo JavaScript, e apenas se
   o navegador suportar IntersectionObserver e o usuário não tiver
   pedido menos movimento. Sem JS, nada some.
   ═══════════════════════════════════════════════════════════════ */
type Props = {
  children: ReactNode;
  /** Atraso em segundos, para escalonar itens de uma lista. */
  atraso?: number;
  className?: string;
  as?: ElementType;
  /** Qualquer outro atributo (data-*, id, role...) vai para o elemento. */
  [chave: string]: unknown;
};

export default function Revelar({
  children,
  atraso = 0,
  className = "",
  as: Tag = "div",
  ...resto
}: Props) {
  const alvo = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = alvo.current;
    if (!el) return;

    const menosMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (menosMovimento || !("IntersectionObserver" in window)) return;

    el.classList.add("oculto", "revelavel");

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.remove("oculto");
          entrada.target.classList.add("revelado");
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );

    observador.observe(el);
    return () => observador.disconnect();
  }, []);

  return (
    <Tag
      ref={alvo}
      className={className}
      style={{ "--atraso": `${atraso}s` } as React.CSSProperties}
      {...resto}
    >
      {children}
    </Tag>
  );
}
