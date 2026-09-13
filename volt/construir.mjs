/** VOLT — build estático. Sem dependências: `node construir.mjs`. */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUTOS } from './conteudo/produtos.js';
import { MARCA } from './conteudo/site.js';
import { paginaHome } from './modelos/home.js';
import { paginaProduto } from './modelos/produto.js';

const SAIDA = join(dirname(fileURLToPath(import.meta.url)), 'publico');
const hoje = new Date().toISOString().slice(0, 10);

async function gravar(rel, txt) {
  const destino = join(SAIDA, rel);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, txt, 'utf8');
  return { rel, kb: Buffer.byteLength(txt) / 1024 };
}

const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${MARCA.dominio}/</loc><lastmod>${hoje}</lastmod><priority>1.0</priority></url>
${PRODUTOS.map((p) => `  <url><loc>${MARCA.dominio}/produtos/${p.slug}.html</loc>` +
    `<lastmod>${hoje}</lastmod><priority>0.8</priority></url>`).join('\n')}
</urlset>
`;

const arquivos = [
  await gravar('index.html', paginaHome()),
  ...await Promise.all(PRODUTOS.map((p) => gravar(`produtos/${p.slug}.html`, paginaProduto(p)))),
  await gravar('sitemap.xml', sitemap()),
  await gravar('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${MARCA.dominio}/sitemap.xml\n`),
];

for (const a of arquivos) console.log(`  ${a.rel.padEnd(36)} ${a.kb.toFixed(1)} KB`);
console.log(`\n${arquivos.length} arquivos · ${arquivos.reduce((t, a) => t + a.kb, 0).toFixed(1)} KB`);
