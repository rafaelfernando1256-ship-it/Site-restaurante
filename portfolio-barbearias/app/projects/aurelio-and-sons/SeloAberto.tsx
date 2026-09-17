"use client";

import { useEffect, useState } from "react";
import { domAurelio } from "@/content/demo-dom-aurelio";

/* ═══════════════════════════════════════════════════════════════
   SELO "ABERTO AGORA"
   Lê a tabela de horários do arquivo de conteúdo e calcula sozinho.
   Roda só no navegador: no HTML entregue o selo não existe, o que
   evita marcar "aberto" numa página estática gerada de madrugada.
   ═══════════════════════════════════════════════════════════════ */
export default function SeloAberto() {
  const [estado, setEstado] = useState<{ aberto: boolean; texto: string } | null>(null);

  useEffect(() => {
    const agora = new Date();
    const hoje = agora.getDay();
    const minutos = agora.getHours() * 60 + agora.getMinutes();

    const linha = domAurelio.horarios.find((h) => h.dataDia === hoje);
    const faixa = linha?.hora.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);

    if (!faixa) {
      setEstado({ aberto: false, texto: "Fechado hoje" });
      return;
    }

    const abre = Number(faixa[1]) * 60 + Number(faixa[2]);
    const fecha = Number(faixa[3]) * 60 + Number(faixa[4]);
    const aberto =
      fecha > abre ? minutos >= abre && minutos < fecha : minutos >= abre || minutos < fecha;

    setEstado({ aberto, texto: aberto ? "Aberto agora" : "Fechado agora" });
  }, []);

  if (!estado) return null;

  return (
    <span className="a-selo-aberto" data-aberto={estado.aberto}>
      {estado.texto}
    </span>
  );
}
