'use client';

/**
 * A frase que muda a cada visita: pedindo agora, qual é a primeira
 * entrega possível. É a regra das 8 horas dita em termos do cliente.
 */
import { dataPorExtenso, horaFalada, primeiraEntregaPossivel, quandoFalado } from '@/lib/agenda';
import { useAgora } from '@/lib/useAgora';

export default function ProximaEntrega({ className = '' }: { className?: string }) {
  const agora = useAgora();
  const proxima = agora ? primeiraEntregaPossivel(agora) : null;

  let frase = 'Escolha o dia e o horário na hora de encomendar.';
  if (agora && proxima) {
    const quando = quandoFalado(proxima.data, agora);
    const dia = quando === 'hoje' || quando === 'amanhã' ? `${quando} (${dataPorExtenso(proxima.data).split(',')[0]})` : quando;
    frase = `Pedindo agora, a primeira entrega possível é ${dia}, às ${horaFalada(proxima.hora)}.`;
  }
  return <p className={className} aria-live="polite">{frase}</p>;
}
