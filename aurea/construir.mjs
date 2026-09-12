/**
 * AUREA — build estático.
 *
 * Lê o conteúdo, monta as páginas com os componentes e escreve em
 * `publico/`. Sem dependências: roda com `node construir.mjs`.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PECAS } from './conteudo/produtos.js';
import { MARCA } from './conteudo/site.js';
import { paginaHome } from './modelos/home.js';
import { paginaPeca } from './modelos/produto.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SAIDA = join(AQUI, 'publico');

async function gravar(relativo, conteudo) {
  const destino = join(SAIDA, relativo);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, conteudo, 'utf8');
  return { relativo, kb: Buffer.byteLength(conteudo) / 1024 };
}

const hoje = new Date().toISOString().slice(0, 10);

const mapaDoSite = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${MARCA.dominio}/</loc><lastmod>${hoje}</lastmod><priority>1.0</priority></url>
${PECAS.map((p) => `  <url><loc>${MARCA.dominio}/pecas/${p.slug}.html</loc>` +
    `<lastmod>${hoje}</lastmod><priority>0.8</priority></url>`).join('\n')}
</urlset>
`;

const robots = () => `User-agent: *
Allow: /

Sitemap: ${MARCA.dominio}/sitemap.xml
`;

const arquivos = [
  await gravar('index.html', paginaHome()),
  ...await Promise.all(PECAS.map((p) => gravar(`pecas/${p.slug}.html`, paginaPeca(p)))),
  await gravar('sitemap.xml', mapaDoSite()),
  await gravar('robots.txt', robots()),
];

const total = arquivos.reduce((t, a) => t + a.kb, 0);
for (const a of arquivos) console.log(`  ${a.relativo.padEnd(34)} ${a.kb.toFixed(1)} KB`);
console.log(`\n${arquivos.length} arquivos · ${total.toFixed(1)} KB de HTML`);
