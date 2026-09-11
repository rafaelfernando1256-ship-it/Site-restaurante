import Link from "next/link";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════
   BOTÃO
   Um componente para todos os botões do portfólio. Externo vira
   <a target="_blank">, interno vira <Link> do Next.
   ═══════════════════════════════════════════════════════════════ */
type Variante = "claro" | "contorno" | "whats";

const base =
  "group relative inline-flex items-center justify-center gap-2.5 rounded-full " +
  "font-medium tracking-tight whitespace-nowrap transition-all duration-300 " +
  "focus-visible:outline-2 focus-visible:outline-offset-4 active:translate-y-0";

const variantes: Record<Variante, string> = {
  claro:
    "bg-osso text-tinta hover:bg-white hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(237,234,228,0.18)]",
  contorno:
    "border border-fio text-osso hover:border-osso hover:-translate-y-0.5 hover:bg-osso hover:text-tinta",
  whats:
    "bg-whats text-[#08351d] hover:bg-[#1fbe5a] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(37,211,102,0.3)]",
};

const tamanhos = {
  md: "px-6 py-3 text-sm",
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
