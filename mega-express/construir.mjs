/**
 * MEGA EXPRESS HOTEL — build estático.
 * Sem dependência nenhuma: `node construir.mjs`.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { MARCA, UNIDADES } from './conteudo/marca.js';
import { paginaHome } from './modelos/home.js';
import { paginaUnidade } from './modelos/unidade.js';
import { paginaRegiao } from './modelos/regiao.js';

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
  ['serra-da-capivara.html', paginaRegiao()],
  ...UNIDADES.map((u) => [`unidade/${u.slug}.html`, paginaUnidade(u)]),
];

/* Demonstrativo: não deve ser indexado. Ele fala de um negócio real
   sem ser o site oficial — aparecer na busca por "Mega Express
   Hotel" tiraria reserva de verdade do lugar certo. */
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

/* Favicon: o sinal da marca, em SVG. */
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
<rect width="40" height="40" rx="8" fill="#b02820"/>
<path d="M8 6h12l-4 12h10L12 34l4-13H8l4-15H8Z" fill="#fff" opacity=".95"/>
<path d="M23 6h10l-3.4 9.5H20L23 6Z" fill="#fff" opacity=".6"/>
</svg>
`;

const feitos = [];
for (const [rel, html] of paginas) feitos.push(await gravar(rel, html));
feitos.push(await gravar('robots.txt', robots));
feitos.push(await gravar('sitemap.xml', sitemap));
feitos.push(await gravar('img/favicon.svg', favicon));

const total = feitos.reduce((s, f) => s + f.kb, 0);
console.log(`${MARCA.nome} — ${feitos.length} arquivos`);
for (const f of feitos) console.log(`  ${f.rel.padEnd(34)} ${f.kb.toFixed(1).padStart(7)} KB`);
console.log(`  ${''.padEnd(34)} ${total.toFixed(1).padStart(7)} KB no total`);
