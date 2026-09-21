import type { Metadata } from "next";
import { display, corpo } from "@/lib/fontes";
import { agencia } from "@/content/agencia";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fullhousestudio.com"),
  title: {
    default: `${agencia.nome} · Restaurant websites that fill tables`,
    template: `%s · ${agencia.nome}`,
  },
  description:
    "A studio building websites for restaurants only. Menu-first, built to measure, live in 5 days, made to turn into orders and reservations. See the work and ask for your free example.",
  keywords: [
    "restaurant website",
    "restaurant website design",
    "online ordering website",
    "restaurant menu website",
    "website for restaurants",
  ],
  authors: [{ name: agencia.nome }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: agencia.nome,
    title: `${agencia.nome} · Restaurant websites that fill tables`,
    description:
      "Demo restaurant websites: reservation, counter service and neighborhood classic. Ask for a free example of yours.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${display.variable} ${corpo.variable}`}>
      <body className="textura antialiased">{children}</body>
    </html>
  );
}
