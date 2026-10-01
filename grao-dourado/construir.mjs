/**
 * GRÃO DOURADO — build estático.
 * Sem dependência nenhuma: `node construir.mjs`.
 * Gera HTML puro em publico/, que sobe em qualquer hospedagem.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MARCA } from './conteudo/marca.js';
import { paginaHome } from './modelos/home.js';
import { paginaCardapio } from './modelos/cardapio.js';

const SAIDA = join(dirname(fileURLToPath(import.meta.url)), 'publico');
const hoje = new Date().toISOString().slice(0, 10);
const SITE = 'https://exemplo.com.br'; // trocar pelo domínio real ao publicar

async function gravar(rel, txt) {
  const destino = join(SAIDA, rel);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, txt, 'utf8');
  return { rel, kb: Buffer.byteLength(txt) / 1024 };
}

const paginas = [
  ['index.html', paginaHome()],
  ['cardapio.html', paginaCardapio()],
];

/* O site é demonstrativo e não deve ser indexado: ele fala de um
   negócio real sem ser o site oficial dele. Aparecer na busca por
   "Grão Dourado" seria confundir cliente de verdade. Ao virar o
   site oficial, troque por `Allow: /` e tire o noindex do base.js. */
const robots = `User-agent: *
Disallow: /

# Projeto demonstrativo. Ao publicar como site oficial, troque por:
# User-agent: *
# Allow: /
# Sitemap: ${SITE}/sitemap.xml
`;

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginas.map(([rel]) => `  <url>
    <loc>${SITE}/${rel === 'index.html' ? '' : rel}</loc>
    <lastmod>${hoje}</lastmod>
  </url>`).join('\n')}
</urlset>
`;

const feitos = [];
for (const [rel, html] of paginas) feitos.push(await gravar(rel, html));
feitos.push(await gravar('robots.txt', robots));
feitos.push(await gravar('sitemap.xml', sitemap));

const total = feitos.reduce((s, f) => s + f.kb, 0);
console.log(`${MARCA.nomeCompleto} — ${feitos.length} arquivos`);
for (const f of feitos) console.log(`  ${f.rel.padEnd(16)} ${f.kb.toFixed(1).padStart(7)} KB`);
console.log(`  ${''.padEnd(16)} ${total.toFixed(1).padStart(7)} KB no total`);
