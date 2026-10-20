/**
 * Empacota a pasta out/ num .zip pronto para a Netlify.
 *
 *   npm run build && npm run zip
 *
 * Gera caixa-bruta-bbq-netlify.zip com o index.html na raiz do zip, que
 * é como a Netlify espera. Sem dependência: o formato zip é escrito à
 * mão, com a compressão do próprio Node.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';

const raiz = new URL('../out/', import.meta.url).pathname;
const destino = new URL('../caixa-bruta-bbq-netlify.zip', import.meta.url).pathname;

function arquivos(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

let lista;
try { lista = arquivos(raiz); } catch {
  console.error('Não achei a pasta out/. Rode antes: npm run build');
  process.exit(1);
}

const partes = [];
const central = [];
let posicao = 0;

for (const caminho of lista) {
  const nome = Buffer.from(relative(raiz, caminho).split(sep).join('/'));
  const dados = readFileSync(caminho);
  const comprimido = deflateRawSync(dados, { level: 9 });
  const crc = crc32(dados);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);           // versão
  local.writeUInt16LE(0x0800, 6);       // nomes em UTF-8
  local.writeUInt16LE(8, 8);            // deflate
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(comprimido.length, 18);
  local.writeUInt32LE(dados.length, 22);
  local.writeUInt16LE(nome.length, 26);
  partes.push(local, nome, comprimido);

  const entrada = Buffer.alloc(46);
  entrada.writeUInt32LE(0x02014b50, 0);
  entrada.writeUInt16LE(20, 4);
  entrada.writeUInt16LE(20, 6);
  entrada.writeUInt16LE(0x0800, 8);
  entrada.writeUInt16LE(8, 10);
  entrada.writeUInt32LE(crc, 16);
  entrada.writeUInt32LE(comprimido.length, 20);
  entrada.writeUInt32LE(dados.length, 24);
  entrada.writeUInt16LE(nome.length, 28);
  entrada.writeUInt32LE(posicao, 42);
  central.push(entrada, nome);

  posicao += local.length + nome.length + comprimido.length;
}

const tamanhoCentral = central.reduce((s, b) => s + b.length, 0);
const fim = Buffer.alloc(22);
fim.writeUInt32LE(0x06054b50, 0);
fim.writeUInt16LE(lista.length, 8);
fim.writeUInt16LE(lista.length, 10);
fim.writeUInt32LE(tamanhoCentral, 12);
fim.writeUInt32LE(posicao, 16);

writeFileSync(destino, Buffer.concat([...partes, ...central, fim]));
console.log(`${lista.length} arquivos → ${relative(process.cwd(), destino)}`);
