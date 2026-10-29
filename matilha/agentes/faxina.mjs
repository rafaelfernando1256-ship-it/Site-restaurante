/**
 * A FAXINA DO NOTEBOOK — o que está ocupando espaço, e o que dá para tirar.
 *
 * Olhar é livre: o tamanho do disco, das pastas da sua conta, os maiores
 * arquivos e o que está velho em Downloads. Tirar sempre espera o seu
 * "confirmar": esvaziar a Lixeira, limpar os temporários, apagar um
 * arquivo (que vai para a Lixeira, pela ferramenta apagar).
 *
 * A contagem tem limite de tempo: num disco muito cheio ela para no
 * meio e avisa que o número é "pelo menos" isto.
 */
import { lstat, readdir, rmdir, statfs, unlink } from 'node:fs/promises';
import { homedir, platform, tmpdir } from 'node:os';
import { join, parse } from 'node:path';

import { powershell } from './tela.mjs';

const GB = 1024 ** 3;
const gb = (b) => Math.round((b / GB) * 10) / 10;
const DIA = 24 * 3600_000;

/** Soma uma pasta inteira (sem seguir atalhos), guardando os maiores arquivos. */
async function soma(pasta, { ate, grandes, velhos }) {
  let total = 0; let parcial = false;
  const fila = [pasta];
  while (fila.length) {
    if (Date.now() > ate) { parcial = true; break; }
    const lote = fila.splice(0, 24);
    await Promise.all(lote.map(async (dir) => {
      let itens;
      try { itens = await readdir(dir, { withFileTypes: true }); } catch { return; }
      await Promise.all(itens.map(async (it) => {
        const c = join(dir, it.name);
        if (it.isSymbolicLink()) return;
        if (it.isDirectory()) { fila.push(c); return; }
        if (!it.isFile()) return;
        try {
          const s = await lstat(c);
          total += s.size;
          if (s.size > 50 * 1024 ** 2) grandes.push({ arquivo: c, gb: gb(s.size), bytes: s.size, mudou: s.mtimeMs });
          if (velhos && Date.now() - s.mtimeMs > 90 * DIA) velhos.total += s.size;
        } catch { /* sumiu ou sem acesso */ }
      }));
    }));
  }
  return { total, parcial };
}

/** O tamanho da Lixeira (Windows). */
async function lixeira() {
  if (platform() !== 'win32') return null;
  const r = await powershell("$i = (New-Object -ComObject Shell.Application).NameSpace(10).Items(); $s = 0; foreach ($x in $i) { $s += [int64]$x.ExtendedProperty('Size') }; Write-Output $s", { ms: 30_000 });
  const n = Number(String(r.saida).trim());
  return Number.isFinite(n) ? n : null;
}

/** O raio-x: disco, pastas, maiores arquivos, Downloads velhos, temporários e Lixeira. */
export async function espacoNoDisco({ segundos = 25 } = {}) {
  const casa = homedir();
  const ate = Date.now() + segundos * 1000;
  const raiz = parse(casa).root;
  let disco = null;
  try { const s = await statfs(raiz); disco = { total_gb: gb(s.blocks * s.bsize), livre_gb: gb(s.bavail * s.bsize) }; } catch { disco = null; }
  const grandes = [];
  const velhos = { total: 0 };
  let itens = [];
  try { itens = await readdir(casa, { withFileTypes: true }); } catch { itens = []; }
  const pastas = [];
  let parcial = false;
  for (const it of itens.filter((x) => x.isDirectory() && !x.isSymbolicLink())) {
    const c = join(casa, it.name);
    const r = await soma(c, { ate, grandes, velhos: /^downloads$/i.test(it.name) ? velhos : null });
    if (r.parcial) parcial = true;
    if (r.total > 50 * 1024 ** 2) pastas.push({ pasta: it.name, gb: gb(r.total), bytes: r.total });
  }
  const temp = await soma(tmpdir(), { ate: Date.now() + 8000, grandes: [] });
  const lx = await lixeira();
  grandes.sort((a, b) => b.bytes - a.bytes);
  pastas.sort((a, b) => b.bytes - a.bytes);
  return {
    disco,
    pastas: pastas.slice(0, 10).map(({ pasta, gb: g }) => ({ pasta, gb: g })),
    maiores_arquivos: grandes.slice(0, 12).map(({ arquivo, gb: g, mudou }) => ({ arquivo, gb: g, ultima_mudanca: new Date(mudou).toLocaleDateString('pt-BR') })),
    downloads_com_mais_de_90_dias_gb: gb(velhos.total),
    temporarios_gb: gb(temp.total),
    lixeira_gb: lx === null ? null : gb(lx),
    contagem_incompleta: parcial,
  };
}

/** O raio-x no formato da tela: as pastas que mais ocupam. */
export function visualDaFaxina(r) {
  const linhas = [...r.pastas.slice(0, 7).map((p) => [p.pasta, p.gb])];
  if (r.temporarios_gb >= 0.1) linhas.push(['Temporários', r.temporarios_gb]);
  if (r.lixeira_gb >= 0.1) linhas.push(['Lixeira', r.lixeira_gb]);
  return {
    tipo: 'barras',
    titulo: r.disco ? `${r.disco.livre_gb.toLocaleString('pt-BR')} GB livres de ${r.disco.total_gb.toLocaleString('pt-BR')} GB` : 'O que ocupa o seu disco',
    subtitulo: `As pastas da sua conta, em GB${r.contagem_incompleta ? ' (contagem parada no meio: os números são "pelo menos")' : ''}.`,
    unidade: 'GB',
    rotulos: linhas.map((l) => l[0]),
    series: [{ nome: 'Tamanho', valores: linhas.map((l) => l[1]) }],
    destaque: linhas.length ? linhas.reduce((a, b) => (b[1] > a[1] ? b : a))[0] : '',
    fontes: [{ nome: 'Contagem feita agora no notebook' }],
  };
}

/** Apaga os temporários com mais de 2 dias (os em uso ficam). Devolve quanto liberou. */
export async function limpaTemporarios() {
  let liberado = 0; let apagados = 0;
  const limite = Date.now() - 2 * DIA;
  const varre = async (dir, nivel) => {
    let itens;
    try { itens = await readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const it of itens) {
      const c = join(dir, it.name);
      if (it.isSymbolicLink()) continue;
      if (it.isDirectory()) {
        if (nivel < 8) {
          await varre(c, nivel + 1);
          // Só some a pasta vazia e antiga: uma pasta criada agora pode ser de um programa aberto.
          const s = await lstat(c).catch(() => null);
          if (s && s.mtimeMs < limite) await rmdir(c).catch(() => {});
        }
        continue;
      }
      try {
        const s = await lstat(c);
        if (s.mtimeMs < limite) { await unlink(c); liberado += s.size; apagados += 1; }
      } catch { /* em uso: fica */ }
    }
  };
  await varre(tmpdir(), 0);
  return `Apaguei ${apagados} arquivos temporários e liberei ${gb(liberado)} GB. Os que estavam em uso ficaram.`;
}

/** Esvazia a Lixeira (Windows). */
export async function esvaziaLixeira() {
  if (platform() !== 'win32') return 'Esvaziar a Lixeira só funciona no Windows.';
  const antes = await lixeira();
  const r = await powershell('Clear-RecycleBin -Force -ErrorAction SilentlyContinue', { ms: 120_000 });
  if (r.codigo !== 0) return 'Não consegui esvaziar a Lixeira.';
  return antes ? `Lixeira esvaziada: ${gb(antes)} GB liberados.` : 'Lixeira esvaziada.';
}
