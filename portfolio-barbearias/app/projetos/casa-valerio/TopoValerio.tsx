"use client";

import { useEffect, useState } from "react";
import { valerio } from "@/content/demo-casa-valerio";

const links = [
  { href: "#ritual", rotulo: "O ritual" },
  { href: "#carta", rotulo: "Serviços" },
  { href: "#mestres", rotulo: "Mestres" },
  { href: "#clube", rotulo: "Clube" },
  { href: "#casa", rotulo: "A casa" },
];

export default function TopoValerio({ linkReserva }: { linkReserva: string }) {
  const [solido, setSolido] = useState(false);

  useEffect(() => {
    const aoRolar = () => setSolido(window.scrollY > 40);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header className="v-topo" data-solido={solido}>
      <div className="v-topo__linha">
        <a href="#topo" className="v-marca">
          <strong>{valerio.nome}</strong>
          <span>{valerio.descritor}</span>
        </a>
        <nav className="v-nav" aria-label="Navegação da barbearia">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>
        <a
          className="v-btn v-btn--ouro"
          href={linkReserva}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "12px 24px", fontSize: "0.68rem" }}
        >
          Reservar
        </a>
      </div>
    </header>
  );
}
