/* Fontes do demo Larkspur. Isolado de lib/fontes.ts para a página não
   carregar as fontes dos outros demos — veja a nota lá. */
import { Playfair_Display, Karla } from "next/font/google";

export const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--fonte-larkspur-titulo",
  display: "swap",
});
export const karla = Karla({
  subsets: ["latin"],
  variable: "--fonte-larkspur-corpo",
  display: "swap",
});
