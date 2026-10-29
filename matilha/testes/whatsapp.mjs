/**
 * O diagnóstico do WhatsApp, pelo terminal.
 *
 * Você NÃO precisa disto: o mesmo diagnóstico tem um botão no painel,
 * em Operação → WhatsApp → "Conferir se a ponte funciona". Este
 * arquivo existe para quando o painel não sobe.
 *
 *     node testes/whatsapp.mjs
 *
 * Não envia mensagem para ninguém. Só abre, olha e conta.
 */
import { WhatsApp } from '../navegador.mjs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

console.log('\n  ═══ DIAGNÓSTICO DO WHATSAPP WEB ═══\n');
console.log('  Abrindo o navegador. NADA será enviado.');
console.log('  Se aparecer o QR Code, leia com o celular agora.\n');

const zap = new WhatsApp({ pasta: join(RAIZ, 'dados', 'navegador') });
const saida = await zap.diagnostica();

for (const linha of saida.linhas) console.log(`  ${linha}`);

console.log('  ─────────────────────────────────────────────');
console.log(saida.ok
  ? '  RESULTADO: os caminhos batem. A ponte deve funcionar.'
  : '  RESULTADO: alguma coisa não bateu. Me mande esta saída e o print.');
if (saida.print) console.log(`  Print salvo em: ${saida.print}`);
console.log('  ─────────────────────────────────────────────\n');
console.log('  Feche a janela do navegador para encerrar.\n');
