"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   REVELAR COM MÁSCARA
   Usado uma única vez na página, no título do hero. A máscara sobe
   e revela o texto — um momento coreografado vale mais do que
   efeito espalhado por tudo.
   Como no Revelar, o conteúdo nasce visível: a classe que esconde
   só entra via JavaScript.
   ═══════════════════════════════════════════════════════════════ */
export default function RevelarMascara({
  children,
  atraso = 0,
  className = "",
}: {
  children: ReactNode;
  atraso?: number;
  className?: string;
}) {
  const alvo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = alvo.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.classList.add("mascara-oculta", "mascara-revelavel");
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.remove("mascara-oculta");
        el.classList.add("mascara-revelada");
      });
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      ref={alvo}
      className={className}
      style={{ "--atraso": `${atraso}s` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
