import type { Metadata } from "next";
import { display, corpo } from "@/lib/fontes";
import { agencia } from "@/content/agencia";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://fullchair.co.uk"),
  title: {
    default: `${agencia.nome} · Barbershop websites that fill the chair`,
    template: `%s · ${agencia.nome}`,
  },
  description:
    "A studio building websites for barbershops only. Built to measure, live in 3 days, made to turn into bookings rather than decoration. See the work and ask for your free example.",
  keywords: [
    "barbershop website",
    "barber website design",
    "barbershop booking website",
    "website for barbers",
    "barbershop marketing",
  ],
  authors: [{ name: agencia.nome }],
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: agencia.nome,
    title: `${agencia.nome} · Barbershop websites that fill the chair`,
    description:
      "Demo barbershop websites: premium, urban and classic. Ask for a free example of yours.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${corpo.variable}`}>
      <body className="textura antialiased">{children}</body>
    </html>
  );
}
