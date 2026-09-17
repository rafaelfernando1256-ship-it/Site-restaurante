"use client";

import { domAurelio } from "@/content/demo-dom-aurelio";

const links = [
  { href: "#historia", rotulo: "Our story" },
  { href: "#precos", rotulo: "Prices" },
  { href: "#familia", rotulo: "The barbers" },
  { href: "#onde", rotulo: "Find us" },
];

export default function TopoAurelio() {
  return (
    <header className="a-topo">
      <div className="a-topo__linha">
        <a href="#topo" className="a-marca">
          <strong>Aurelio &amp; Sons</strong>
          <span>{domAurelio.descritor}</span>
        </a>
        <nav className="a-nav" aria-label="Barbershop navigation">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>
        <a className="a-btn a-btn--vermelho" href={`tel:${domAurelio.telefone}`} style={{ minHeight: "44px", padding: "10px 20px", fontSize: "0.95rem" }}>
          Call
        </a>
      </div>
    </header>
  );
}
