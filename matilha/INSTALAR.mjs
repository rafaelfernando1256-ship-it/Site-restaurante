/**
 * O ARQUIVO ÚNICO — você clica (ou roda `node INSTALAR.mjs`) e ele
 * resolve tudo: confere o Node, instala o que falta, baixa o navegador,
 * cria o .env, cria o atalho na área de trabalho e sobe o painel.
 *
 * Pode rodar quantas vezes quiser. Cada passo olha antes se já está
 * feito — na segunda vez ele só sobe o painel, em dois segundos.
 *
 * Quando um passo falha, o programa não cospe o erro cru do Node: ele
 * diz o que fazer, em português, e para ali. Erro que ninguém entende
 * é erro que ninguém conserta.
 */
import { spawn } from 'node:child_process';
import { connect } from 'node:net';
import { access, copyFile, cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('.', import.meta.url));
const WIN = process.platform === 'win32';
const PORTA = Number(process.env.PORTA) || 8899;

/* ── como o programa fala ───────────────────────────────────────── */
let passo = 0;
const diz = (texto) => console.log(`  ${texto}`);
const faz = (texto) => { passo += 1; console.log(`\n  ${passo}. ${texto}`); };
const ok = (texto) => console.log(`     ✓ ${texto}`);

/** Para o programa explicando a saída, não o erro. */
function desiste(titulo, ...saidas) {
  console.log(`\n  ✗ ${titulo}\n`);
  for (const linha of saidas) console.log(`     ${linha}`);
  console.log('');
  process.exitCode = 1;
  // Clicado no atalho, a janela fecharia antes de você ler. O .cmd
  // tem um pause para isso; aqui só garantimos a saída limpa.
  process.exit(1);
}

const existe = (caminho) => access(caminho).then(() => true, () => false);

/**
 * Um texto literal para o PowerShell.
 *
 * NÃO use JSON.stringify para isto. O JSON escapa barra invertida
 * dobrando ela — e o PowerShell NÃO trata `\` como escape (o escape
 * dele é a crase). Resultado: `JSON.stringify("C:\\nodejs")` vira
 * `"C:\\nodejs"`, e o PowerShell lê isso com as barras DOBRADAS,
 * literalmente.
 *
 * Em aspas simples o PowerShell não processa escape nenhum. A única
 * coisa a tratar é a própria aspa simples, que se duplica.
 */
const psTexto = (valor) => `'${String(valor).replaceAll("'", "''")}'`;

/**
 * Roda um comando mostrando a saída dele, e devolve o código.
 *
 * O `shell` não é detalhe. Com ele ligado, o Node NÃO protege os
 * argumentos: ele cola tudo num texto só e entrega ao cmd, que então
 * lê os `(` e os `|` do comando como SINTAXE DELE. Um roteiro de
 * PowerShell passado assim não chega inteiro do outro lado — foi o
 * que derrubou o passo do atalho e o do desbloqueio.
 *
 * Mas no Windows o `npm` e o `npx` são `.cmd`, e esses só rodam
 * ATRAVÉS do shell. Então: shell só para eles, nunca para o resto.
 */
const PRECISAM_DE_SHELL = new Set(['npm', 'npx']);

function roda(comando, argumentos, { calado = false } = {}) {
  return new Promise((resolve) => {
    const filho = spawn(comando, argumentos, {
      cwd: RAIZ,
      stdio: calado ? 'ignore' : 'inherit',
      shell: WIN && PRECISAM_DE_SHELL.has(comando),
    });
    filho.on('error', () => resolve(-1));
    filho.on('close', (codigo) => resolve(codigo ?? -1));
  });
}

/** Alguém já está no 8899? Então o painel está no ar — não suba outro. */
function portaOcupada() {
  return new Promise((resolve) => {
    const tomada = connect({ host: '127.0.0.1', port: PORTA });
    const fim = (resposta) => { tomada.destroy(); resolve(resposta); };
    tomada.setTimeout(700);
    tomada.on('connect', () => fim(true));
    tomada.on('timeout', () => fim(false));
    tomada.on('error', () => fim(false));
  });
}

function abreNoNavegador(endereco) {
  const comando = WIN ? `start "" "${endereco}"`
    : process.platform === 'darwin' ? `open "${endereco}"` : `xdg-open "${endereco}"`;
  spawn(comando, { shell: true, stdio: 'ignore', detached: true }).unref();
}

/* ══ 1 · o Node ═════════════════════════════════════════════════ */
function confereNode() {
  faz('Conferindo o Node.js');
  const maior = Number(process.versions.node.split('.')[0]);
  if (maior < 18) {
    desiste(`Este Node é o ${process.versions.node}, velho demais.`,
      'Instale a versão LTS em https://nodejs.org/',
      'Depois rode este arquivo de novo.');
  }
  ok(`Node ${process.versions.node}`);
}

/* ══ 2 · o pacote do navegador ══════════════════════════════════ */
async function confereDependencias() {
  faz('Conferindo o Playwright (o que dirige o navegador) e o resto');
  // Uma atualização pode trazer pacote novo (o ws, da voz do Jarvis): falta um, roda o npm install.
  const pacotes = Object.keys(JSON.parse(await readFile(join(RAIZ, 'package.json'), 'utf8')).dependencies || {});
  const faltam = [];
  for (const p of pacotes) if (!await existe(join(RAIZ, 'node_modules', p, 'package.json'))) faltam.push(p);
  if (!faltam.length) {
    ok('já instalado');
    return;
  }
  diz(`   falta ${faltam.join(', ')}; instalando agora (uns 30 segundos)…\n`);
  const codigo = await roda('npm', ['install', '--no-audit', '--no-fund']);
  if (codigo !== 0 && !faltam.includes('playwright')) {
    // Só faltava um extra (a voz do Jarvis tem reserva dentro do Playwright): segue, e tenta de novo na próxima.
    diz('   ⚠ o npm install não terminou; sigo assim mesmo e tento de novo na próxima vez.');
    return;
  }
  if (codigo !== 0) {
    desiste('O npm install não terminou.',
      'Quase sempre é internet. Confira a conexão e rode de novo.',
      'Se estiver numa rede de empresa, pode ser o proxy dela bloqueando',
      'o registry.npmjs.org.');
  }
  if (!await existe(join(RAIZ, 'node_modules', 'playwright', 'package.json'))) {
    desiste('O npm disse que foi, mas o pacote não está na pasta.',
      'Apague a pasta node_modules e rode este arquivo de novo.');
  }
  ok('Playwright instalado');
}

/* ══ 3 · o Chromium ═════════════════════════════════════════════ */
/**
 * O `npx playwright install chromium` costuma terminar calado, dando a
 * impressão de que funcionou mesmo quando não baixou nada. Então aqui
 * nós não acreditamos no comando: perguntamos ao Playwright onde está o
 * executável e olhamos se o arquivo existe de verdade.
 */
async function caminhoDoChromium() {
  try {
    const { chromium } = await import('playwright');
    const alvo = chromium.executablePath();
    return alvo && existsSync(alvo) ? alvo : null;
  } catch { return null; }
}

async function confereChromium() {
  faz('Conferindo o navegador (Chromium)');
  let onde = await caminhoDoChromium();
  if (onde) { ok(onde); return; }

  diz('   não achei; baixando agora (uns 150 MB, alguns minutos)…\n');
  const codigo = await roda('npx', ['--yes', 'playwright', 'install', 'chromium']);
  onde = await caminhoDoChromium();
  if (!onde) {
    desiste('O Chromium não ficou instalado.',
      codigo === 0
        ? 'O comando terminou sem reclamar, mas o arquivo não está no disco.'
        : `O download falhou (o comando saiu com código ${codigo}).`,
      'Quase sempre é antivírus, firewall ou proxy cortando o download.',
      '',
      'Tente na mão, nesta pasta:',
      '   npx playwright install chromium',
      'e leia o que ele responder.');
  }
  ok('Chromium pronto');
}

/* ══ 4 · o .env e a pasta de dados ══════════════════════════════ */
/**
 * O programa se chamava Órbita. Quem já usava tem, numa pasta ao lado,
 * os clientes, os ajustes, as chaves e a sessão do WhatsApp. Na
 * primeira vez da Matilha, isso é trazido para cá: ninguém precisa
 * cadastrar tudo de novo nem ler o QR outra vez.
 *
 * Só copia, nunca move: a pasta antiga fica intacta até você apagar.
 */
async function trazDoOrbita() {
  if (await existe(join(RAIZ, 'dados', 'dados.json'))) return;
  // "Extrair tudo" do Windows cria uma pasta com o nome do zip e põe a
  // pasta do programa dentro dela: por isso olha dois andares acima, e
  // dois andares abaixo de cada um.
  const aqui = RAIZ.replace(/[\\/]+$/, '');
  const andares = [dirname(aqui), dirname(dirname(aqui))];
  const subpastas = async (pasta) => {
    try {
      return (await readdir(pasta, { withFileTypes: true }))
        .filter((i) => i.isDirectory()).map((i) => join(pasta, i.name));
    } catch { return []; }
  };
  // O instalar.ps1 lê o atalho "Orbita" da área de trabalho e diz onde ela está.
  const candidatas = process.env.MATILHA_ORBITA ? [process.env.MATILHA_ORBITA] : [];
  for (const andar of andares) {
    for (const pasta of await subpastas(andar)) {
      if (pasta === aqui) continue;
      candidatas.push(pasta, ...(await subpastas(pasta)));
    }
  }
  let velha = null;
  for (const pasta of candidatas) {
    if (await existe(join(pasta, 'ABRIR-ORBITA.mjs')) && await existe(join(pasta, 'dados', 'dados.json'))) {
      velha = pasta;
      break;
    }
  }
  if (!velha) return;

  faz('Trazendo os seus dados do Órbita');
  diz(`     de ${velha}`);
  if (!await existe(join(RAIZ, '.env')) && await existe(join(velha, '.env'))) {
    await copyFile(join(velha, '.env'), join(RAIZ, '.env'));
    ok('as chaves (.env)');
  }
  await mkdir(join(RAIZ, 'dados'), { recursive: true });
  try {
    await cp(join(velha, 'dados'), join(RAIZ, 'dados'), { recursive: true, force: false, errorOnExist: false });
    ok('clientes, ajustes e a sessão do WhatsApp');
  } catch (e) {
    // Com o Órbita antigo aberto, o Chrome dele segura alguns arquivos.
    // O essencial (clientes e ajustes) vai mesmo assim.
    for (const nome of ['dados.json', 'antes.json', 'operacao.json', 'mural.json', 'celular.json']) {
      await copyFile(join(velha, 'dados', nome), join(RAIZ, 'dados', nome)).catch(() => {});
    }
    ok('clientes e ajustes');
    diz('     (a sessão do WhatsApp não veio inteira: o Órbita antigo está aberto?');
    diz('      Se pedir o QR Code, é só ler de novo com o celular.)');
  }
  diz('     A pasta antiga ficou intacta. Depois de conferir, pode apagar.');
}

async function confereArquivos() {
  faz('Conferindo os seus arquivos');
  await mkdir(join(RAIZ, 'dados'), { recursive: true });

  if (await existe(join(RAIZ, '.env'))) {
    ok('.env já existe (suas chaves estão guardadas)');
    return;
  }

  // O molde é só conveniência. Se ele não veio junto (extração pela
  // metade acontece), o .env nasce vazio aqui mesmo — não é motivo para
  // o programa parar, já que quem preenche é o painel.
  if (await existe(join(RAIZ, '.env.exemplo'))) {
    await copyFile(join(RAIZ, '.env.exemplo'), join(RAIZ, '.env'));
  } else {
    await writeFile(join(RAIZ, '.env'),
      '# As chaves você cola no painel: aba Ajustes -> Chaves.\n'
      + 'GROQ_API_KEY=\nNETLIFY_TOKEN=\nGOOGLE_PLACES_KEY=\n',
      { encoding: 'utf8', mode: 0o600 });
  }
  ok('.env criado, ainda em branco');
  diz('       as chaves você põe no painel, na aba Ajustes — não precisa');
  diz('       abrir arquivo nenhum');
}

/* ══ 5 · o arquivo de clicar ════════════════════════════════════ */
/**
 * Por que criar o .cmd aqui em vez de mandar pronto no zip: arquivo que
 * veio da internet chega com uma marca ("Mark of the Web"), e o Windows
 * 11 bloqueia .bat e .cmd marcados. Arquivo que nasce no seu
 * computador não tem marca nenhuma — e por isso abre com um clique.
 */
const CMD = `@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
title Matilha

where node >nul 2>nul
if errorlevel 1 (
    echo.
    echo   O Node.js nao esta instalado neste computador.
    echo   Pegue a versao LTS em https://nodejs.org/ e clique aqui de novo.
    echo.
    pause
    exit /b 1
)

node INSTALAR.mjs
if errorlevel 1 pause
`;

/**
 * TIRA A MARCA DE "VEIO DA INTERNET".
 *
 * Arquivo baixado chega com um carimbo invisível (Mark of the Web), e
 * o Windows 11 bloqueia .bat e .cmd carimbados. Foi o que travou o
 * .bat antigo na sua primeira tentativa.
 *
 * Como nós já estamos rodando — ou seja, já passamos pelo bloqueio —,
 * dá para limpar a pasta inteira de uma vez. Da próxima, o .bat abre
 * com um clique como qualquer programa.
 *
 * Isto NÃO desliga proteção nenhuma do Windows. Só remove o carimbo
 * DESTA pasta, que é a mesma coisa que o botão "Desbloquear" das
 * Propriedades do arquivo faz.
 */
async function tiraOBloqueio() {
  if (!WIN) return;
  faz('Tirando a marca de "veio da internet" desta pasta');
  const codigo = await roda('powershell', [
    '-NoProfile', '-NonInteractive', '-Command',
    `Get-ChildItem -LiteralPath ${psTexto(RAIZ)} -Recurse -File `
    + '| Unblock-File -ErrorAction SilentlyContinue',
  ], { calado: true });
  if (codigo === 0) ok('pronto');
  else diz('     (não consegui limpar — não faz falta, o atalho não depende disso)');
}

/**
 * O ATALHO — e por que ele aponta para o node.exe, não para um .cmd.
 *
 * ─────────────────────────────────────────────────────────────────
 * O CONTROLE DE APLICATIVO INTELIGENTE
 * ─────────────────────────────────────────────────────────────────
 * O Windows 11 tem o Smart App Control, que é mais rígido que o aviso
 * comum do SmartScreen: ele bloqueia POR TIPO DE ARQUIVO. `.bat` e
 * `.cmd` estão na lista, e NÃO existe lista de exceção por arquivo —
 * não dá para "liberar este aqui". A única forma de desligá-lo é um
 * caminho sem volta: uma vez desligado, só volta reinstalando o
 * Windows.
 *
 * Então insistir no `.cmd` é bater na mesma parede toda vez.
 *
 * A saída é não ter roteiro nenhum no meio: o atalho aponta DIRETO
 * para o `node.exe` — um programa assinado, que o Windows já conhece
 * e não bloqueia — passando o INSTALAR.mjs como argumento. O `.mjs`
 * não é executado pelo Windows, é LIDO pelo node. Não há o que
 * bloquear.
 *
 * O `.cmd` continua sendo criado para quem não tem o Smart App
 * Control ligado, mas ele é o plano B agora, não o plano A.
 */
/** Pergunta ao Windows onde fica a área de trabalho de verdade. */
function ondeFicaAAreaDeTrabalho() {
  return new Promise((resolve) => {
    const filho = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command',
      "[Environment]::GetFolderPath('Desktop')"],
    { cwd: RAIZ, stdio: ['ignore', 'pipe', 'ignore'] });
    let saida = '';
    filho.stdout.on('data', (pedaco) => { saida += pedaco; });
    filho.on('error', () => resolve(''));
    filho.on('close', () => resolve(saida.trim()));
  });
}

async function criaAtalhos() {
  if (!WIN) return;
  faz('Deixando a Matilha a um clique');

  // `process.execPath` é o caminho completo do node que está rodando
  // AGORA — exatamente o que o atalho precisa chamar.
  const node = process.execPath;
  const script = join(RAIZ, 'INSTALAR.mjs');

  // NÃO monte a área de trabalho como homedir()+'Desktop'. Com o
  // OneDrive ligado — que é o padrão de fábrica do Windows 11 — a
  // pasta real é `...\\OneDrive\\Área de Trabalho`, e aquele caminho
  // simplesmente não existe. Quem sabe onde ela está é o Windows.
  const ps = [
    "$area=[Environment]::GetFolderPath('Desktop');",
    '$s=(New-Object -ComObject WScript.Shell).CreateShortcut(',
    "(Join-Path $area 'Matilha.lnk'));",
    `$s.TargetPath=${psTexto(node)};`,
    // O argumento vai entre aspas DUPLAS dentro do texto, porque o
    // caminho da pasta costuma ter espaço ("Documents\matilha local").
    `$s.Arguments=${psTexto(`"${script}"`)};`,
    `$s.WorkingDirectory=${psTexto(RAIZ)};`,
    '$s.Description=\'Painel da Matilha\';',
    '$s.Save();',
    // O atalho do nome antigo (Orbita) apontava para a pasta antiga.
    "$velho=Join-Path $area 'Orbita.lnk'; if(Test-Path $velho){Remove-Item $velho}",
  ].join('');

  const codigo = await roda('powershell',
    ['-NoProfile', '-NonInteractive', '-Command', ps], { calado: true });

  // Onde o atalho foi parar, para conferir se ele existe mesmo: a
  // mesma pergunta, feita ao Windows.
  const area = await ondeFicaAAreaDeTrabalho();

  if (codigo === 0 && area && existsSync(join(area, 'Matilha.lnk'))) {
    ok('atalho "Matilha" na área de trabalho — é por ele que você abre');
    diz('       (ele chama o node direto, então o Controle de Aplicativo');
    diz('        Inteligente não tem o que bloquear)');
  } else {
    diz('     (não consegui criar o atalho. Para abrir, use o Terminal');
    diz('      nesta pasta e rode:  node INSTALAR.mjs)');
  }

  /* O .cmd é escrito AQUI, pelo programa, e não vem no zip.
   *
   * A diferença não é detalhe: o Windows carimba todo arquivo que veio
   * da internet, e o Controle de Aplicativo Inteligente bloqueia `.bat`
   * e `.cmd` carimbados, por tipo de arquivo. Um `.cmd` que nasce na
   * sua máquina não tem carimbo nenhum — e por isso abre normal.
   *
   * Era esse o erro: eu mandava o `.bat` dentro do zip. Ele chegava
   * carimbado e levava bloqueio na primeira tentativa de clicar. */
  const alvo = join(RAIZ, 'MATILHA.cmd');
  await writeFile(alvo, CMD.replace(/\n/g, '\r\n'), 'utf8');
}

/* ══ 6 · o painel ═══════════════════════════════════════════════ */
async function sobePainel() {
  faz('Subindo o painel');
  const endereco = `http://127.0.0.1:${PORTA}`;

  if (await portaOcupada()) {
    ok('já estava no ar — abrindo a janela que existe');
    abreNoNavegador(endereco);
    diz('');
    diz(`     ${endereco}`);
    diz('     (se quiser subir um novo, feche a outra janela preta primeiro)');
    diz('');
    return;
  }

  ok('tudo pronto');
  // O servidor avisa o endereço e abre o navegador por conta própria.
  await import('./servidor.mjs');
}

/* ══ tudo junto ═════════════════════════════════════════════════ */
console.log('\n  ═══ MATILHA ═══════════════════════════════════════════\n');
diz('  Não precisa fazer nada. Se faltar algo, eu instalo.');

try {
  confereNode();
  await confereDependencias();
  await confereChromium();
  await trazDoOrbita();
  await confereArquivos();
  await tiraOBloqueio();
  await criaAtalhos();
  await sobePainel();
} catch (e) {
  desiste('Travou num lugar que eu não previ.',
    e.message, '', 'Me manda esta mensagem e eu conserto.');
}
