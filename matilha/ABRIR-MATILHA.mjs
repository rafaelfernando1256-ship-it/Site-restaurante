/**
 * ABRIR A MATILHA — o arquivo de clicar.
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE NÃO É UM .bat
 * ─────────────────────────────────────────────────────────────────
 * O Windows 11 tem o Controle de Aplicativo Inteligente, e ele
 * bloqueia `.bat` e `.cmd` POR TIPO DE ARQUIVO quando eles vieram da
 * internet. Não existe "liberar este aqui". Foi o que te barrou na
 * primeira vez.
 *
 * Um `.mjs` não é executado pelo Windows — é LIDO pelo node.exe, que
 * é um programa assinado e conhecido. Não há o que bloquear.
 *
 * ─────────────────────────────────────────────────────────────────
 * UMA VEZ SÓ: ENSINAR O WINDOWS A ABRIR ESTE ARQUIVO
 * ─────────────────────────────────────────────────────────────────
 * Clique com o botão DIREITO neste arquivo → "Abrir com" → "Escolher
 * outro aplicativo" → "Procurar outro aplicativo neste PC" → vá em
 *
 *     C:\Program Files\nodejs\node.exe
 *
 * e marque "Sempre usar este aplicativo".
 *
 * Pronto: a partir daí é DOIS CLIQUES e a Matilha abre. Para sempre.
 *
 * Este arquivo só chama o INSTALAR.mjs, que confere tudo (Node,
 * navegador, chaves), cria o atalho na área de trabalho e sobe o
 * painel. Pode clicar quantas vezes quiser.
 */

// Se algo der errado, a janela preta fecharia antes de você ler. Isto
// segura a janela aberta mostrando o erro — sem isto, o clique
// "não faz nada" e ninguém descobre por quê.
process.on('uncaughtException', async (erro) => {
  console.log('\n  ═══════════════════════════════════════════════');
  console.log('  ✗ Não consegui abrir a Matilha.\n');
  console.log(`    ${erro.message}\n`);
  console.log('  Mande este texto para o Rafael consertar.');
  console.log('  ═══════════════════════════════════════════════\n');
  console.log('  (pressione Enter para fechar)');
  process.stdin.resume();
  process.stdin.on('data', () => process.exit(1));
});

await import('./INSTALAR.mjs');
