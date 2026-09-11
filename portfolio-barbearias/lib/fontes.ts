/* ═══════════════════════════════════════════════════════════════
   FONTES
   Carregadas pelo next/font: são baixadas na hora do build e
   servidas junto com o site. Em produção não há nenhuma chamada
   ao Google — o que é melhor para performance e privacidade.
   ═══════════════════════════════════════════════════════════════ */
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  Marcellus,
  Jost,
  Archivo_Black,
  Space_Grotesk,
  Alfa_Slab_One,
  Libre_Baskerville,
} from "next/font/google";

/* ── Portfólio ── */
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--fonte-display",
  display: "swap",
});
export const corpo = Instrument_Sans({
  subsets: ["latin"],
  variable: "--fonte-corpo",
  display: "swap",
});

/* ── Demo 1 · Casa Valério ── */
export const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--fonte-valerio-titulo",
  display: "swap",
});
export const jost = Jost({
  subsets: ["latin"],
  variable: "--fonte-valerio-corpo",
  display: "swap",
});

/* ── Demo 2 · Nove & Meia ── */
export const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--fonte-nove-titulo",
  display: "swap",
});
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--fonte-nove-corpo",
  display: "swap",
});

/* ── Demo 3 · Dom Aurélio ── */
export const alfaSlab = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--fonte-aurelio-titulo",
  display: "swap",
});
export const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--fonte-aurelio-corpo",
  display: "swap",
});
