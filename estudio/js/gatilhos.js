/* ------------------------------------------------------------------
   OS GATILHOS — a verificação, em código.

   Tradução direta de motor/gatilhos.py: `problemas()`. Existe porque
   proibir em prosa não bastou — "costuma" voltou duas vezes num roteiro
   real, duas rodadas DEPOIS de a palavra ser proibida na instrução. O
   modelo obedece umas regras e esquece outras; o que a máquina pode
   cobrar, ela cobra.

   Mesma lista dos dois lados, de propósito: o site e o terminal têm de
   reprovar exatamente o mesmo roteiro, senão um vira a porta de saída
   para o que o outro recusa.
   ------------------------------------------------------------------ */

export const MULETAS = [
  'costuma', 'costumam', 'talvez', 'geralmente', 'normalmente',
  'tende a', 'tendem a', 'muitas pessoas', 'algumas pessoas',
  'depende de vários', 'depende de muitos', 'cada corpo',
  'cada pessoa é', 'pode variar', 'podem variar',
];

/* "pode" sozinho é legítimo ("você pode registrar a carga"). Vira muleta
   quando enfraquece uma AFIRMAÇÃO — e são estas as combinações que
   aparecem de verdade. */
export const MULETAS_COMPOSTAS = [
  'pode ajudar', 'pode melhorar', 'pode reduzir', 'pode aumentar',
  'pode ficar', 'pode cair', 'pode mudar', 'pode não',
];

const ESQUEMA = /\b\d+\s*[-+]\s*\d+\s*(?:[-+]\s*\d+)?\b/g;

const EXPLICA = ['dias seguidos', 'dias de treino', 'dias de',
                 'significa', 'ou seja', 'dias e'];

export function problemas(roteiro) {
  const falas = [['gancho', roteiro.gancho || '']];
  (roteiro.quadros || []).forEach((q, i) =>
    falas.push([`quadro ${i + 1}`, q.fala || '']));
  falas.push(['fechamento', roteiro.fechamento || '']);

  const achados = [];
  for (const [onde, fala] of falas) {
    const baixo = fala.toLowerCase();
    const muleta = [...MULETAS, ...MULETAS_COMPOSTAS].find(m => baixo.includes(m));
    if (muleta) {
      achados.push(`${onde}: "${fala}" usa a muleta "${muleta}". Afirme ou `
        + 'corte — frase hesitante não é mais honesta, é mais fraca.');
    }
  }

  const tudo = falas.map(([, f]) => f).join(' ');
  const baixoTudo = tudo.toLowerCase();
  const explicado = EXPLICA.some(p => baixoTudo.includes(p));
  for (const achado of new Set(tudo.match(ESQUEMA) || [])) {
    if (!explicado) {
      achados.push(`o esquema "${achado}" aparece sem explicação. Em vídeo `
        + 'curto ninguém decifra sigla: escreva por extenso ("dois dias de '
        + 'treino, dois de descanso").');
    }
  }

  const aposta = (roteiro.aposta || '').trim();
  if (aposta && aposta.split(/\s+/).length < 5) {
    achados.push(`a aposta "${aposta}" é uma palavra solta. Escreva a frase `
      + 'inteira: qual mecanismo carrega o vídeo e por quê — é o que se mede '
      + 'quando ele for bem ou mal.');
  }
  return achados;
}

/* O aviso que volta para o modelo na segunda tentativa. Diz o quadro, a
   palavra e a saída: é isso que faz a segunda acertar em vez de repetir. */
export function avisoDeCorrecao(achados) {
  return '\n\n## O QUE VOCÊ ACABOU DE ERRAR\n\n'
    + achados.map(a => `- ${a}`).join('\n')
    + '\n\nRefaça corrigindo exatamente isto, sem mexer no resto do que já '
    + 'estava bom.';
}
