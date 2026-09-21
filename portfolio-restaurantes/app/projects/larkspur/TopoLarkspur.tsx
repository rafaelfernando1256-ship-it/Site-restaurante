"use client";

import { useEffect, useState } from "react";
import { larkspur } from "@/content/demo-larkspur";

const links = [
  { href: "#kitchen", rotulo: "The kitchen" },
  { href: "#menu", rotulo: "Menu" },
  { href: "#room", rotulo: "The room" },
  { href: "#private", rotulo: "Private dining" },
  { href: "#reserve", rotulo: "Find us" },
];

export default function TopoLarkspur() {
  const [solido, setSolido] = useState(false);

  useEffect(() => {
    const aoRolar = () => setSolido(window.scrollY > 40);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header className="l-topo" data-solido={solido}>
      <div className="l-topo__linha">
        <a href="#top" className="l-marca">
          {larkspur.nome}
          <span>{larkspur.descritor}</span>
        </a>
        <nav className="l-nav" aria-label="Restaurant navigation">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>
        <a className="l-btn l-btn--cobre" href="#reserve" style={{ minHeight: "44px", padding: "11px 22px" }}>
          Reserve
        </a>
      </div>
    </header>
  );
}
