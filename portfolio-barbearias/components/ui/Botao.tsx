import Link from "next/link";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   BOTÃO
   Decisão de direção de arte: a ação principal é OSSO (claro), não
   verde. Num conjunto monocromático, o verde saturado grita e
   derruba a percepção de valor. O verde fica reservado para o
   botão flutuante e para o plano em destaque — onde a associação
   com WhatsApp ajuda a conversão sem poluir a página.
   ═══════════════════════════════════════════════════════════════ */
type Variante = "claro" | "contorno" | "whats" | "escuro";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2.5 rounded-full " +
  "border border-transparent " +
  "font-medium tracking-[-0.01em] whitespace-nowrap " +
  "transition-[transform,background-color,color,border-color,box-shadow] duration-400 ease-[var(--ease-suave)] " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 active:translate-y-px";

const variantes: Record<Variante, string> = {
  claro:
    "bg-osso text-tinta shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] " +
    "hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_28px_-6px_rgba(237,234,228,0.28),0_1px_0_rgba(255,255,255,0.5)_inset]",
  contorno:
    "border-fio-forte text-osso hover:-translate-y-0.5 hover:border-osso hover:bg-osso hover:text-tinta",
  escuro:
    "bg-tinta text-osso hover:-translate-y-0.5 hover:bg-poco hover:shadow-[0_10px_28px_-8px_rgba(11,11,12,0.5)]",
  whats:
    "bg-whats text-[#06351c] shadow-[0_1px_0_rgba(255,255,255,0.28)_inset] " +
    "hover:-translate-y-0.5 hover:bg-[#2fe074] hover:shadow-[0_10px_28px_-6px_rgba(37,211,102,0.36)]",
};

const tamanhos = {
  md: "px-6 py-3 text-[0.86rem]",
  lg: "px-8 py-4 text-[0.95rem]",
};

type Props = {
  href: string;
  children: ReactNode;
  variante?: Variante;
  tamanho?: keyof typeof tamanhos;
  externo?: boolean;
  className?: string;
  "aria-label"?: string;
};

export default function Botao({
  href,
  children,
  variante = "claro",
  tamanho = "md",
  externo = false,
  className = "",
  ...resto
}: Props) {
  const classe = `${base} ${variantes[variante]} ${tamanhos[tamanho]} ${className}`;

  if (externo) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classe} {...resto}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classe} {...resto}>
      {children}
    </Link>
  );
}
