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
  ['pix', 'js/pix.js', ['crc16', 'semAcento', 'valida', 'montaPix', 'prova']],
  ['nucleo', 'js/nucleo.js', ['VAZIO', 'ETAPAS', 'estado', 'salva', 'exporta',
    'importa', 'baixa', 'REDES', 'DELIVERY', 'classifica', 'PRESENCA',
    'instagramDe', 'e164', 'telefoneBonito', 'pontua', 'novoLead', 'achaLead',
    'moveLead', 'importaLinhas', 'moeda', 'hoje', 'emDias', 'dataBonita',
    'linkWhats']],
  ['ui', 'js/ui.js', ['esc', 'el', 'on', 'campo', 'area', 'numero', 'aviso',
    'recado', 'copia', 'espera', 'carregaScript']],
  ['ia', 'js/ia.js', ['temChave', 'listaModelos', 'modelo', 'pedeTexto', 'modeloEmUso']],
  ['agentes', 'js/agentes.js', ['AGENTES', 'AJUSTES', 'provaPix', 'limpaHtml',
    'validaHtml']],
  ['app', 'js/app.js', []],
];

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

for (const [nome, caminho, exporta] of MODULOS) {
  const corpo = limpa(readFileSync(new URL(caminho, import.meta.url), 'utf8'));
  saida += `
/* ===== ${caminho} ${'='.repeat(Math.max(0, 56 - caminho.length))} */
M.${nome} = (function () {
${corpo}
  return { ${exporta.join(', ')} };
})();
`;
}

saida += '})();\n';

writeFileSync(new URL('js/painel.js', import.meta.url), saida);
console.log(`js/painel.js: ${(saida.length / 1024).toFixed(1)} KB, ` +
            `${MODULOS.length} módulos`);
