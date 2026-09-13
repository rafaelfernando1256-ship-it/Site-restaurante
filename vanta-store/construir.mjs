/** VANTA STORE — build estático. Sem dependências: `node construir.mjs`. */
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PRODUTOS, CATEGORIAS } from './conteudo/produtos.js';
import { LOJA } from './conteudo/site.js';
import { paginaHome } from './modelos/home.js';
import { paginaProdutos } from './modelos/produtos.js';
import { paginaProduto } from './modelos/produto.js';
import { paginaCategoria, OFERTAS } from './modelos/categoria.js';
import { paginaCarrinho, paginaCheckout, paginaConta } from './modelos/lojinhas.js';

const SAIDA = join(dirname(fileURLToPath(import.meta.url)), 'publico');
const hoje = new Date().toISOString().slice(0, 10);

async function gravar(rel, txt) {
  const destino = join(SAIDA, rel);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, txt, 'utf8');
  return { rel, kb: Buffer.byteLength(txt) / 1024 };
}

const paginas = [
  ['index.html', paginaHome()],
  ['produtos.html', paginaProdutos()],
  ['carrinho.html', paginaCarrinho()],
  ['checkout.html', paginaCheckout()],
  ['conta.html', paginaConta()],
  ...CATEGORIAS.map((c) => [`categoria/${c.id}.html`, paginaCategoria(c)]),
  ['categoria/ofertas.html', paginaCategoria(OFERTAS)],
  ...PRODUTOS.map((p) => [`produto/${p.slug}.html`, paginaProduto(p)]),
];

const urls = [
  '', 'produtos.html', 'carrinho.html', 'checkout.html', 'conta.html',
  ...CATEGORIAS.map((c) => `categoria/${c.id}.html`), 'categoria/ofertas.html',
  ...PRODUTOS.map((p) => `produto/${p.slug}.html`),
];

const arquivos = await Promise.all([
  ...paginas.map(([rel, html]) => gravar(rel, html)),
  gravar('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${LOJA.dominio}/${u}</loc><lastmod>${hoje}</lastmod>` +
    `<priority>${u === '' ? '1.0' : u === 'produtos.html' ? '0.9' : u.startsWith('produto/') ? '0.8' : '0.6'}</priority></url>`).join('\n')}
</urlset>
`),
  gravar('robots.txt', `User-agent: *\nAllow: /\nDisallow: /checkout.html\nDisallow: /carrinho.html\n\nSitemap: ${LOJA.dominio}/sitemap.xml\n`),
]);

const total = arquivos.reduce((t, a) => t + a.kb, 0);
console.log(`  ${arquivos.length} arquivos · ${total.toFixed(0)} KB de HTML`);
console.log(`  ${PRODUTOS.length} produtos · ${CATEGORIAS.length + 1} categorias`);
