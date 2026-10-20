'use client';

import { useEffect, useState } from 'react';

const EVENTO = 'caixabruta:agora';

/** Faz todos os relógios da página olharem a hora agora, sem esperar a volta. */
export function atualizaAgora() {
  window.dispatchEvent(new Event(EVENTO));
}

/**
 * A hora de agora, que anda sozinha.
 *
 * Começa em null: o HTML vem pronto do build, e a hora do build não é a
 * hora do cliente. Depois de montar, atualiza a cada 30 segundos e
 * sempre que a aba volta a ficar visível — quem deixou a página aberta
 * desde de manhã vê os horários da tarde já apagados.
 */
export function useAgora(intervalo = 30_000) {
  const [agora, setAgora] = useState<Date | null>(null);
  useEffect(() => {
    const anda = () => setAgora(new Date());
    anda();
    const relogio = window.setInterval(anda, intervalo);
    const volta = () => { if (!document.hidden) anda(); };
    document.addEventListener('visibilitychange', volta);
    window.addEventListener(EVENTO, anda);
    return () => {
      window.clearInterval(relogio);
      document.removeEventListener('visibilitychange', volta);
      window.removeEventListener(EVENTO, anda);
    };
  }, [intervalo]);
  return agora;
}
