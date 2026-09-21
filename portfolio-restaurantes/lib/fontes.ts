/* ═══════════════════════════════════════════════════════════════
   FONTES DO PORTFÓLIO
   Carregadas pelo next/font: são baixadas na hora do build e
   servidas junto com o site. Em produção não há nenhuma chamada
   ao Google — melhor para performance e privacidade.

   ATENÇÃO — um arquivo por site, de propósito.
   O next/font registra TODA fonte declarada no módulo que a rota
   importa. Quando as oito famílias moravam aqui, cada página
   carregava as oito: 214 KB de fonte numa página que usa duas.
   Por isso cada demo tem o seu próprio arquivo (fontes-larkspur.ts,
   fontes-comal.ts, fontes-diner.ts). Ao criar um demo novo, crie
   também o arquivo de fontes dele — não acrescente aqui.
   ═══════════════════════════════════════════════════════════════ */
import { Bricolage_Grotesque, Instrument_Sans } from "next/font/google";

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
