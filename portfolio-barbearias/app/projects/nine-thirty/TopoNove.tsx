"use client";

import { useEffect, useState } from "react";

const links = [
  { href: "#equipe", rotulo: "Barbers" },
  { href: "#servicos", rotulo: "Services" },
  { href: "#trabalhos", rotulo: "Work" },
  { href: "#onde", rotulo: "Find us" },
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
          Nine <span>·</span> Thirty
        </a>
        <nav className="n-nav" aria-label="Barbershop navigation">
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
          Book
        </a>
      </div>
    </header>
  );
}
