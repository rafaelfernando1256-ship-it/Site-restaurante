"use client";

import { useEffect, useState } from "react";
import IconeTelefone from "@/components/ui/IconeTelefone";
import { agencia, linkTel } from "@/content/agencia";

/* Aparece depois da primeira tela: antes disso o hero já tem a ação
   principal, e dois botões competindo dividem a atenção.

   Nos EUA o canal direto é ligar, não WhatsApp — por isso o botão
   disca em vez de abrir um app de mensagem. */
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
      href={linkTel()}
      aria-label={`Call ${agencia.nome} at ${agencia.telefoneVisivel}`}
      className={`group fixed right-4 bottom-4 z-50 flex items-center gap-0 rounded-full bg-osso p-4 text-tinta shadow-[0_12px_36px_-8px_rgba(0,0,0,0.7)] ring-1 ring-black/10 transition-all duration-500 ease-[var(--ease-saida)] hover:gap-2.5 hover:bg-white sm:right-6 sm:bottom-6 ${
        visivel ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-4 scale-90 opacity-0"
      }`}
    >
      <IconeTelefone className="h-[22px] w-[22px] shrink-0" />
      <span className="max-w-0 overflow-hidden text-[0.85rem] font-medium whitespace-nowrap transition-all duration-500 ease-[var(--ease-saida)] group-hover:max-w-[14rem]">
        {agencia.telefoneVisivel}
      </span>
    </a>
  );
}
