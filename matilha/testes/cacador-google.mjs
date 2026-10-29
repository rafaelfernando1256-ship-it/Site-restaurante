/**
 * Testa o caçador pelo NAVEGADOR, sozinho, sem subir o painel:
 *
 *   node TESTAR-CACADOR-GOOGLE.mjs pizzaria Natal
 *
 * Abre uma janela do Chromium, faz a busca no Google Maps e imprime o
 * que leu. Serve para ver se os seletores ainda batem antes de usar
 * num lote — e, se quebrarem, deixa um print em dados/falhas/.
 */
import { CacadorNavegador } from '../agentes/maps.mjs';

const termo = process.argv[2] || 'restaurante';
const cidade = process.argv[3] || 'Natal';
const quantos = Number(process.argv[4]) || 8;

const cacador = new CacadorNavegador({
  pasta: new URL('../dados/navegador-cacador', import.meta.url).pathname,
  aoAndar: (p) => {
    const frases = { abrindo: `  abrindo: ${p.detalhe || ''}`,
      rolando: `  rolando… ${p.achados || 0} cartões`,
      lendo: `  lendo ${p.posicao}/${p.de}` };
    if (frases[p.etapa]) process.stdout.write(`\r${frases[p.etapa].padEnd(60)}`);
  },
});

console.log(`\n  procurando "${termo}" em ${cidade} (até ${quantos})\n`);
try {
  const r = await cacador.caca(termo, cidade, quantos);
  process.stdout.write('\r'.padEnd(62) + '\r');
  if (r.parou) {
    console.log(`  ⚠ ${r.motivo}`);
    if (r.print) console.log(`    print: ${r.print}`);
  } else {
    console.log(`  ${r.achados} lidos · ${r.leads.length} SEM SITE · `
      + `${r.descartados_com_site} já têm site\n`);
    for (const l of r.leads) {
      console.log(`  ${String(l.pontuacao).padStart(2)}/10  ${l.nome}`);
      console.log(`         ${l.telefone || 'sem telefone'} · ${l.endereco || 'sem endereço'}`);
      if (l.nota) console.log(`         nota ${l.nota} · ${l.avaliacoes} avaliações`);
    }
  }
} catch (e) {
  console.error(`\n  ✗ ${e.message}`);
} finally {
  console.log('\n  fechando a janela…\n');
  await cacador.fecha();
}
