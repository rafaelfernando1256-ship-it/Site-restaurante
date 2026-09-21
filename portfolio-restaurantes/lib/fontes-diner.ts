/* Fontes do demo Blue Plate Diner. Isolado de lib/fontes.ts para a
   página não carregar as fontes dos outros demos — veja a nota lá. */
import { Alfa_Slab_One, Libre_Baskerville } from "next/font/google";

export const alfaSlab = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--fonte-diner-titulo",
  display: "swap",
});
export const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--fonte-diner-corpo",
  display: "swap",
});
