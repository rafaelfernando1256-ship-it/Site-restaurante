"use client";

import { bluePlate } from "@/content/demo-blue-plate-diner";

const links = [
  { href: "#story", rotulo: "Our story" },
  { href: "#menu", rotulo: "Menu" },
  { href: "#people", rotulo: "Who's here" },
  { href: "#find", rotulo: "Find us" },
];

export default function TopoDiner() {
  return (
    <header className="d-topo">
      <div className="d-topo__linha">
        <a href="#top" className="d-marca">
          <strong>Blue Plate Diner</strong>
          <span>{bluePlate.descritor}</span>
        </a>
        <nav className="d-nav" aria-label="Restaurant navigation">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>
        <a className="d-btn d-btn--vermelho" href={`tel:${bluePlate.telefone}`} style={{ minHeight: "46px", padding: "11px 20px", fontSize: "0.98rem" }}>
          Call
        </a>
      </div>
    </header>
  );
}
