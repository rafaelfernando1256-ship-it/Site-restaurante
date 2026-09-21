/* Fontes do demo Comal Street Tacos. Isolado de lib/fontes.ts para a
   página não carregar as fontes dos outros demos — veja a nota lá. */
import { Archivo_Black, Space_Grotesk } from "next/font/google";

export const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--fonte-comal-titulo",
  display: "swap",
});
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--fonte-comal-corpo",
  display: "swap",
});
