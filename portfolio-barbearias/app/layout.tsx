import type { Metadata } from "next";
import { display, corpo } from "@/lib/fontes";
import { agencia } from "@/content/agencia";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://cadeiracheia.com.br"),
  title: {
    default: `${agencia.nome} · Sites para barbearia que enchem cadeira`,
    template: `%s · ${agencia.nome}`,
  },
  description:
    "Agência especializada em sites para barbearia. Projeto sob medida, pronto em 3 dias, feito para virar agendamento e não enfeite. Veja os projetos e peça o seu exemplo gratuito.",
  keywords: [
    "site para barbearia",
    "criação de site barbearia",
    "site de barbearia com agendamento",
    "agência para barbearia",
    "marketing para barbearia",
  ],
  authors: [{ name: agencia.nome }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: agencia.nome,
    title: `${agencia.nome} · Sites para barbearia que enchem cadeira`,
    description:
      "Projetos demonstrativos de sites para barbearia: premium, urbana e clássica. Peça o exemplo gratuito da sua.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${corpo.variable}`}>
      <body className="textura antialiased">{children}</body>
    </html>
  );
}
