"use client";

import { domAurelio } from "@/content/demo-dom-aurelio";

const links = [
  { href: "#historia", rotulo: "História" },
  { href: "#precos", rotulo: "Preços" },
  { href: "#familia", rotulo: "Quem atende" },
  { href: "#onde", rotulo: "Onde fica" },
];

export default function TopoAurelio() {
  return (
    <header className="a-topo">
      <div className="a-topo__linha">
        <a href="#topo" className="a-marca">
          <strong>Dom Aurélio</strong>
          <span>{domAurelio.descritor}</span>
        </a>
        <nav className="a-nav" aria-label="Navegação da barbearia">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>
        <a className="a-btn a-btn--vermelho" href={`tel:${domAurelio.telefone}`} style={{ minHeight: "44px", padding: "10px 20px", fontSize: "0.95rem" }}>
          Ligar
        </a>
      </div>
    </header>
  );
}
