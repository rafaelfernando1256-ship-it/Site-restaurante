/* ------------------------------------------------------------------
   O build: junta os módulos num arquivo só.

   Por que isto existe: `<script type="module">` é bloqueado quando a
   página é aberta direto do disco (file://) — o navegador trata cada
   arquivo como origem diferente e recusa o import. No Netlify funciona,
   mas quem descompacta o zip e dá dois cliques veria página em branco.

   Então o código fonte continua em módulos, legível e separado, e aqui
   eles viram um script clássico que roda nos dois lugares.
   ------------------------------------------------------------------ */
import { readFileSync, writeFileSync } from 'node:fs';

const MODULOS = [
  ['instrucao', 'js/instrucao.js'],
  ['gatilhos', 'js/gatilhos.js'],
  ['quadro', 'js/quadro.js'],
  ['acervo', 'js/acervo.js'],
  ['ia', 'js/ia.js'],
  ['app', 'js/app.js'],
];

/* Os exports são LIDOS do arquivo, não escritos aqui.
   A primeira versão tinha a lista à mão e um export novo ficou de fora
   em silêncio: a tela só quebrava em tempo de execução, com "não é uma
   função". Lista que precisa ser mantida em dois lugares é lista que vai
   dessincronizar. */
function exportados(codigo) {
  const nomes = new Set();
  for (const m of codigo.matchAll(
      /^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    nomes.add(m[1]);
  }
  for (const m of codigo.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const parte of m[1].split(',')) {
      const nome = parte.includes(' as ')
        ? parte.split(' as ')[1].trim() : parte.trim();
      if (nome) nomes.add(nome);
    }
  }
  return [...nomes];
}

/* Troca os imports por aliases dos módulos já montados e tira os
   `export`. Nenhum renomeia nada no caminho, então o corpo continua
   sendo exatamente o código que está no arquivo-fonte. */
function limpa(codigo) {
  return codigo
    .replace(/^\s*import\s+\*\s+as\s+(\w+)\s+from\s+'\.\/(\w+)\.js';?$/gm,
             (_, alias, mod) => `  const ${alias} = M.${mod};`)
    .replace(/^\s*import\s*\{([^}]+)\}\s*from\s*'\.\/(\w+)\.js';?$/gms,
             (_, nomes, mod) => {
               const lista = nomes.split(',').map(n => n.trim()).filter(Boolean)
                 .map(n => n.includes(' as ')
                   ? `${n.split(' as ')[0].trim()}: ${n.split(' as ')[1].trim()}`
                   : n);
               return `  const { ${lista.join(', ')} } = M.${mod};`;
             })
    .replace(/^export\s+\{[^}]*\};?$/gm, '')
    .replace(/^export\s+/gm, '');
}

let saida = `/* GERADO por construir.mjs — não edite aqui.
   O código legível está em js/*.js, um arquivo por assunto. */
(function () {
  'use strict';
  const M = {};
`;

let total = 0;
for (const [nome, caminho] of MODULOS) {
  const fonte = readFileSync(new URL(caminho, import.meta.url), 'utf8');
  const exporta = exportados(fonte);
  total += exporta.length;
  const corpo = limpa(fonte);
  saida += `
/* ===== ${caminho} ${'='.repeat(Math.max(0, 56 - caminho.length))} */
M.${nome} = (function () {
${corpo}
  return { ${exporta.join(', ')} };
})();
`;
}

saida += '})();\n';

writeFileSync(new URL('js/estudio.js', import.meta.url), saida);
console.log(`js/estudio.js: ${(saida.length / 1024).toFixed(1)} KB, ` +
            `${MODULOS.length} módulos, ${total} exports`);
