"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#equipe", rotulo: "Barbeiros" },
  { href: "#servicos", rotulo: "Serviços" },
  { href: "#trabalhos", rotulo: "Trabalhos" },
  { href: "#onde", rotulo: "Onde é" },
];

export default function TopoNove({ linkAgendar }: { linkAgendar: string }) {
  const [solido, setSolido] = useState(false);

  useEffect(() => {
    const aoRolar = () => setSolido(window.scrollY > 40);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header className="n-topo" data-solido={solido}>
      <div className="n-topo__linha">
        <a href="#topo" className="n-marca">
          Nove <span>&amp;</span> Meia
        </a>
        <nav className="n-nav" aria-label="Navegação da barbearia">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>
        <a
          className="n-btn n-btn--limao"
          href={linkAgendar}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "11px 20px", fontSize: "0.82rem" }}
        >
          Agendar
        </a>
      </div>
    </header>
  );
}
