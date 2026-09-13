/**
 * Build da página. Sem dependências: `node construir.mjs`.
 * Também copia os três projetos para publico/demos/, para que uma
 * pasta só seja publicável e os botões "Ver projeto" funcionem.
 */
import { writeFile, mkdir, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { paginaVitrine } from './modelos/pagina.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, 'publico');
const RAIZ = resolve(AQUI, '..');

const DEMOS = [
  ['prata-nobre', join(RAIZ, 'prata-nobre')],
  ['aurea', join(RAIZ, 'aurea', 'publico')],
  ['volt', join(RAIZ, 'volt', 'publico')],
];

const html = paginaVitrine();
await mkdir(SAIDA, { recursive: true });
await writeFile(join(SAIDA, 'index.html'), html, 'utf8');
console.log(`  index.html  ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);

for (const [nome, origem] of DEMOS) {
  const destino = join(SAIDA, 'demos', nome);
  if (!existsSync(origem)) {
    console.log(`  ⚠ demo ausente: ${nome} (${origem}) — o botão "Ver projeto" vai quebrar`);
    continue;
  }
  await rm(destino, { recursive: true, force: true });
  await mkdir(destino, { recursive: true });
  // O README do projeto não precisa ir junto com o site publicado.
  await cp(origem, destino, { recursive: true,
    filter: (src) => !/README\.md$/i.test(src) });
  console.log(`  demos/${nome}/`);
}

await writeFile(join(SAIDA, 'robots.txt'),
  'User-agent: *\nAllow: /\n', 'utf8');
console.log('\npronto');
