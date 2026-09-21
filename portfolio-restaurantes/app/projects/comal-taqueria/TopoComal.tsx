"use client";

import { useEffect, useState } from "react";
import { comal } from "@/content/demo-comal-taqueria";

const links = [
  { href: "#menu", rotulo: "Menu" },
  { href: "#today", rotulo: "Today" },
  { href: "#how", rotulo: "How it works" },
  { href: "#catering", rotulo: "Catering" },
  { href: "#find", rotulo: "Find us" },
];

export default function TopoComal() {
  const [solido, setSolido] = useState(false);

  useEffect(() => {
    const aoRolar = () => setSolido(window.scrollY > 40);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header className="c-topo" data-solido={solido}>
      <div className="c-topo__linha">
        <a href="#top" className="c-marca">
          Comal <span>·</span> Street Tacos
        </a>
        <nav className="c-nav" aria-label="Restaurant navigation">
          {links.map((l) => (
            <a key={l.href} href={l.href}>
              {l.rotulo}
            </a>
          ))}
        </nav>
        <a className="c-btn c-btn--chile" href={comal.pedidoUrl} style={{ minHeight: "44px", padding: "11px 20px" }}>
          Order
        </a>
      </div>
    </header>
  );
}
