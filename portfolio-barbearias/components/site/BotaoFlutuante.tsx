"use client";

import { useEffect, useState } from "react";
import IconeWhats from "@/components/ui/IconeWhats";
import { fechamento, linkWhats } from "@/content/agencia";

/* Aparece depois da primeira tela: antes disso o hero já tem a ação
   principal, e dois botões competindo dividem a atenção. */
export default function BotaoFlutuante() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > window.innerHeight * 0.75);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <a
      href={linkWhats(fechamento.mensagemWhats)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className={`group fixed right-4 bottom-4 z-50 flex items-center gap-0 rounded-full bg-whats-escuro p-4 text-white shadow-[0_12px_36px_-8px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-all duration-500 ease-[var(--ease-saida)] hover:gap-2.5 hover:bg-whats hover:text-[#06351c] sm:right-6 sm:bottom-6 ${
        visivel ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-90 opacity-0"
      }`}
    >
      <IconeWhats className="h-[22px] w-[22px] shrink-0" />
      <span className="max-w-0 overflow-hidden text-[0.85rem] font-medium whitespace-nowrap transition-all duration-500 ease-[var(--ease-saida)] group-hover:max-w-[14rem]">
        Quero ver o meu de graça
      </span>
    </a>
  );
}
