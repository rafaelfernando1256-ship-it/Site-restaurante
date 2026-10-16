'use client';

import { Component, type ReactNode } from 'react';

/**
 * A REDE EMBAIXO DO 3D.
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE ISTO EXISTE
 * ─────────────────────────────────────────────────────────────────
 * Rodando o Lighthouse com a GPU desligada, o three.js não conseguiu
 * criar o contexto WebGL e lançou erro DURANTE a renderização. Em
 * React 19, erro na renderização sem ninguém para pegar derruba a
 * árvore inteira — e o React refez o documento do zero, o que apagou
 * o <title>, o lang e a meta description que o Next tinha posto.
 *
 * Ou seja: uma máquina sem aceleração gráfica não perdia só a
 * animação. Perdia a página.
 *
 * Isso não é hipótese de laboratório: GPU antiga, driver na lista de
 * bloqueio do Chrome, máquina virtual, navegador corporativo com WebGL
 * desligado — tudo isso existe no mundo real, e cai exatamente aqui.
 *
 * A defesa é em duas camadas:
 *
 *   1. `temWebGL()` pergunta antes de montar, com um canvas
 *      descartável. Barato e determinístico.
 *   2. Esta fronteira de erro pega o que escapar — inclusive falha
 *      que só aparece no meio da renderização do Canvas.
 *
 * Nos dois casos entra o `alternativa`: o mesmo clima, em CSS.
 */

type Props = { children: ReactNode; alternativa: ReactNode };
type Estado = { quebrou: boolean };

export class SemWebGL extends Component<Props, Estado> {
  state: Estado = { quebrou: false };

  static getDerivedStateFromError(): Estado {
    return { quebrou: true };
  }

  componentDidCatch(erro: unknown) {
    // Não é erro de programação, é ausência de capacidade na máquina
    // de quem visita. Fica registrado para quem abrir o console, sem
    // escândalo e sem derrubar nada.
    console.info('Órbita 3D indisponível nesta máquina; usando o plano de fundo estático.', erro);
  }

  render() {
    return this.state.quebrou ? this.props.alternativa : this.props.children;
  }
}

/** Dá para criar um contexto WebGL aqui? Pergunta feita uma vez, com
 *  um canvas que é jogado fora em seguida. */
export function temWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const tela = document.createElement('canvas');
    const contexto =
      tela.getContext('webgl2') ||
      tela.getContext('webgl') ||
      tela.getContext('experimental-webgl');
    return Boolean(contexto);
  } catch {
    return false;
  }
}
