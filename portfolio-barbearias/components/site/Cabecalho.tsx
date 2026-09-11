"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Botao from "@/components/ui/Botao";
import { agencia, hero, linkWhats } from "@/content/agencia";

const links = [
  { href: "/#projetos", rotulo: "Projetos" },
  { href: "/#maquina", rotulo: "O que inclui" },
  { href: "/#processo", rotulo: "Como funciona" },
  { href: "/#planos", rotulo: "Planos" },
  { href: "/#perguntas", rotulo: "Perguntas" },
];

export default function Cabecalho() {
  const [rolou, setRolou] = useState(false);
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  /* Trava a rolagem do fundo enquanto o menu está aberto */
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        rolou ? "border-b border-fio bg-tinta/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="relative z-50 mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link
          href="/"
          className="group flex min-h-[44px] items-baseline gap-2.5 py-1"
          onClick={() => setAberto(false)}
        >
          <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap text-osso">
            {agencia.nome}
          </span>
          <span className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-osso-3 sm:inline">
            {agencia.descritor}
          </span>
        </Link>

        {/* Navegação em telas grandes */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegação principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative text-sm text-osso-2 transition-colors duration-300 hover:text-osso after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-osso after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
            >
              {l.rotulo}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Botao
            href={linkWhats(hero.mensagemWhats)}
            variante="whats"
            externo
            className="max-sm:hidden"
          >
            Falar no WhatsApp
          </Botao>

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-celular"
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[6px] rounded-xl border border-fio transition-colors hover:border-osso-3 lg:hidden"
          >
            <span
              className={`h-px w-5 bg-osso transition-transform duration-300 ${
                aberto ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-5 bg-osso transition-transform duration-300 ${
                aberto ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Menu de celular em tela cheia */}
      <div
        id="menu-celular"
        hidden={!aberto}
        className="fixed inset-0 top-0 z-40 flex flex-col justify-center gap-2 bg-tinta px-7 pt-24 pb-12 lg:hidden"
      >
        {links.map((l, i) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setAberto(false)}
            style={{ transitionDelay: `${0.05 + i * 0.05}s` }}
            className={`font-display text-3xl tracking-tight text-osso transition-all duration-500 ${
              aberto ? "translate-x-0 opacity-100" : "-translate-x-6 opacity-0"
            }`}
          >
            {l.rotulo}
          </Link>
        ))}
        <Botao
          href={linkWhats(hero.mensagemWhats)}
          variante="whats"
          tamanho="lg"
          externo
          className="mt-8 w-full"
        >
          Falar no WhatsApp
        </Botao>
      </div>
    </header>
  );
}
