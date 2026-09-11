import Link from "next/link";

/* ═══════════════════════════════════════════════════════════════
   BARRA DE DEMONSTRAÇÃO
   Fica no canto inferior esquerdo — o lado oposto ao CTA de cada
   barbearia, para nunca competir com ele. Cumpre dois papéis:
   deixa claro que é um projeto demonstrativo (honestidade) e dá
   o caminho de volta ao portfólio (o prospect não se perde).
   ═══════════════════════════════════════════════════════════════ */
export default function BarraDemo({ nome }: { nome: string }) {
  return (
    <Link
      href="/#projetos"
      className="group fixed bottom-4 left-4 z-[60] flex min-h-[44px] items-center gap-2.5 rounded-full border border-white/15 bg-black/75 px-4 py-2.5 text-[0.78rem] text-white/75 backdrop-blur-md transition-all duration-400 hover:border-white/35 hover:bg-black/90 hover:text-white sm:bottom-6 sm:left-6"
    >
      <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-0.5">
        ←
      </span>
      <span>
        <span className="hidden sm:inline">Projeto demonstrativo · </span>
        {nome}
      </span>
    </Link>
  );
}
