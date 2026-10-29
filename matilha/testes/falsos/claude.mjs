/**
 * UM CLAUDE CODE FALSO, para testes/estudio.mjs. Responde ao --help, ao
 * --version e ao auth status como o de verdade; nas chamadas de trabalho,
 * anota o que recebeu em $MATILHA_CLAUDE_LOG e escreve o que o estúdio
 * espera: o Sonnet escreve o PROMPT-MASTER.md, o Opus escreve o index.html.
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Options:\n  --model <m>\n  --effort <level>\n  --tools <t>\n  --allowedTools <t>\n'
    + '  --disallowedTools <t>\n  --permission-mode <m>\n  --add-dir <d>\n  --resume <id>');
  process.exit(0);
}
if (args[0] === '--version') { console.log('9.9.9 (falso)'); process.exit(0); }
if (args[0] === 'auth') { console.log(JSON.stringify({ loggedIn: true })); process.exit(0); }

let pedido = '';
process.stdin.on('data', (p) => { pedido += p; });
process.stdin.on('end', () => {
  const valor = (op) => (args.includes(op) ? args[args.indexOf(op) + 1] : '');
  const modelo = valor('--model');
  const pasta = process.cwd();
  const registro = {
    modelo, esforco: valor('--effort'), ferramentas: valor('--tools'),
    tinha_maps: existsSync(join(pasta, '_maps', 'GOOGLE_MAPS.md')),
    tinha_prompt: existsSync(join(pasta, 'PROMPT-MASTER.md')),
    pedido,
  };
  if (process.env.MATILHA_CLAUDE_LOG) appendFileSync(process.env.MATILHA_CLAUDE_LOG, `${JSON.stringify(registro)}\n`);
  if (process.env.MATILHA_CLAUDE_FALHA === modelo) {
    console.log(JSON.stringify({ result: 'quebrou', is_error: true, session_id: 's1' }));
    process.exit(1);
  }
  if (modelo === 'sonnet') {
    const ficha = readFileSync(join(pasta, '_maps', 'GOOGLE_MAPS.md'), 'utf8');
    writeFileSync(join(pasta, 'PROMPT-MASTER.md'), `# Prompt master\n\n${ficha}`);
  } else {
    writeFileSync(join(pasta, 'index.html'),
      '<!doctype html><html lang="pt-BR"><head><meta name="robots" content="noindex,nofollow"><title>x</title></head>'
      + '<body><h1>Site</h1></body></html>');
  }
  console.log(JSON.stringify({ result: 'feito', session_id: 's1' }));
});
