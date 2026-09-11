"use client";

import { useEffect, useState } from "react";
import IconeWhats from "@/components/ui/IconeWhats";
import { fechamento, linkWhats } from "@/content/agencia";

/* Aparece depois que o visitante passa da primeira tela — antes
   disso o hero já tem o botão principal, e dois competindo atrapalham. */
export default function BotaoFlutuante() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const aoRolar = () => setVisivel(window.scrollY > window.innerHeight * 0.7);
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
      className={`group fixed right-4 bottom-4 z-50 flex items-center gap-0 rounded-full bg-whats-escuro p-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-all duration-500 hover:gap-2.5 hover:bg-whats sm:right-6 sm:bottom-6 ${
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <IconeWhats className="h-6 w-6 shrink-0" />
      <span className="max-w-0 overflow-hidden text-sm font-medium whitespace-nowrap transition-all duration-500 group-hover:max-w-[14rem]">
        Quero o meu site
      </span>
    </a>
  );
}
