/**
 * Testa o caçador sem chave contra o OpenStreetMap de verdade.
 *   node TESTAR-CACADOR.mjs pizzaria Natal
 * Serve para você ver, em dez segundos, se a fonte responde na sua rede
 * e quanta coisa ela acha na sua cidade — antes de montar um lote.
 */
import { caca, consulta } from '../agentes/osm.mjs';

const termo = process.argv[2] || 'restaurante';
const cidade = process.argv[3] || 'Natal';

console.log(`\n  procurando "${termo}" em ${cidade}…\n`);
console.log('  consulta enviada:');
console.log(consulta(termo, cidade).split('\n').map((l) => `    ${l}`).join('\n'));
try {
  const r = await caca(termo, cidade, 10);
  console.log(`\n  ${r.achados} lugares · ${r.leads.length} SEM SITE · `
    + `${r.descartados_com_site} já têm site\n`);
  for (const l of r.leads) {
    console.log(`  ${String(l.pontuacao).padStart(2)}/10  ${l.nome}`);
    console.log(`         ${l.telefone || 'sem telefone'} · ${l.endereco || 'sem endereço'}`);
  }
  if (!r.leads.length) {
    console.log('  Nada sem site. Tente outro ramo, ou escreva só o nome da');
    console.log('  cidade (sem o estado) — o OSM casa pelo nome exato.');
  }
  console.log();
} catch (e) {
  console.error(`\n  ✗ ${e.message}\n`);
  console.error('  Se foi tempo esgotado, tente de novo: o Overpass é mantido');
  console.error('  por doação e às vezes está cheio.\n');
  process.exit(1);
}
