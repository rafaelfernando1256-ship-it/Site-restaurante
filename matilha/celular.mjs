/**
 * O PAINEL NO CELULAR.
 *
 * Até aqui o servidor só escutava em 127.0.0.1 — ou seja, só o próprio
 * notebook se enxergava. Isso é a tranca mais forte que existe, mas é
 * também o motivo de o celular não abrir nada.
 *
 * Então agora ele escuta também na rede local, e aí a tranca passa a
 * ser um PIN de seis dígitos. O que isso significa, em português:
 *
 *   · quem está no SEU wi-fi consegue BATER na porta do painel;
 *   · sem o PIN, não passa da porta — nem o painel, nem os dados;
 *   · quem não está no seu wi-fi continua sem alcançar nada.
 *
 * E o que isso NÃO é: não é um site na internet. Fora da sua casa, o
 * endereço não existe. Também não é criptografado — dentro do wi-fi o
 * PIN viaja em texto. Para a sua rede de casa está de bom tamanho; num
 * wi-fi de aeroporto eu não ligaria.
 *
 * O PIN erra oito vezes e aquele aparelho fica de castigo por quinze
 * minutos. Seis dígitos com oito tentativas a cada quinze minutos é
 * tempo demais para alguém adivinhar na força bruta.
 */
import { randomInt, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { networkInterfaces } from 'node:os';
import { dirname } from 'node:path';

const QUINZE_MINUTOS = 15 * 60 * 1000;
const TENTATIVAS = 8;
/** Um mês: o celular não vai pedir o PIN de novo a cada abertura. */
const VALIDADE = 30 * 24 * 60 * 60 * 1000;

/** Os endereços deste computador na rede de casa. */
export function enderecosNaRede() {
  const achados = [];
  for (const [nome, lista] of Object.entries(networkInterfaces())) {
    for (const item of lista || []) {
      if (item.family !== 'IPv4' || item.internal) continue;
      achados.push({ nome, ip: item.address });
    }
  }
  // 192.168.x e 10.x primeiro: é o que o wi-fi de casa usa. Endereço de
  // máquina virtual ou de VPN costuma vir depois e não serve.
  const caseiro = (ip) => (ip.startsWith('192.168.') ? 0 : ip.startsWith('10.') ? 1 : 2);
  return achados.sort((a, b) => caseiro(a.ip) - caseiro(b.ip));
}

export const ehLocal = (endereco) => {
  const limpo = String(endereco || '').replace(/^::ffff:/, '');
  return limpo === '127.0.0.1' || limpo === '::1' || limpo === '';
};

export class Celular {
  constructor(arquivo) {
    this.arquivo = arquivo;
    this.pin = '';
    this.fichas = new Map();   // ficha → quando expira
    this.erros = new Map();    // aparelho → { quantos, ate }
    // Deixar o túnel abrir sozinho junto com a Matilha. Fica aqui
    // porque é da mesma família: quem pode chegar ao painel.
    this.tunelSempre = false;
  }

  async carrega() {
    try {
      const salvo = JSON.parse(await readFile(this.arquivo, 'utf8'));
      if (/^\d{6}$/.test(salvo.pin || '')) this.pin = salvo.pin;
      this.tunelSempre = salvo.tunelSempre === true;
      for (const [ficha, ate] of Object.entries(salvo.fichas || {})) {
        if (Number(ate) > Date.now()) this.fichas.set(ficha, Number(ate));
      }
    } catch { /* primeira vez */ }
    if (!this.pin) await this.trocaPin();
    return this.pin;
  }

  async _grava() {
    await mkdir(dirname(this.arquivo), { recursive: true }).catch(() => {});
    await writeFile(this.arquivo, JSON.stringify({
      pin: this.pin, tunelSempre: this.tunelSempre,
      fichas: Object.fromEntries(this.fichas),
    }, null, 2), 'utf8');
  }

  /** PIN novo derruba todo celular que já tinha entrado. De propósito:
   *  é o que você faz quando quer tirar alguém de dentro. */
  async trocaPin() {
    this.pin = String(randomInt(0, 1_000_000)).padStart(6, '0');
    this.fichas.clear();
    this.erros.clear();
    await this._grava();
    return this.pin;
  }

  async guardaSempre(ligado) {
    this.tunelSempre = ligado === true;
    await this._grava();
    return this.tunelSempre;
  }

  decastigo(aparelho) {
    const erro = this.erros.get(aparelho);
    if (!erro) return 0;
    if (erro.ate < Date.now()) { this.erros.delete(aparelho); return 0; }
    return erro.quantos >= TENTATIVAS ? erro.ate - Date.now() : 0;
  }

  /** O PIN está certo? Se estiver, devolve a ficha para o celular guardar. */
  async entra(pin, aparelho) {
    if (this.decastigo(aparelho)) return { ok: false, castigo: this.decastigo(aparelho) };
    if (String(pin || '').trim() !== this.pin) {
      const erro = this.erros.get(aparelho) || { quantos: 0, ate: 0 };
      erro.quantos += 1;
      erro.ate = Date.now() + QUINZE_MINUTOS;
      this.erros.set(aparelho, erro);
      return { ok: false, restam: Math.max(0, TENTATIVAS - erro.quantos) };
    }
    this.erros.delete(aparelho);
    const ficha = randomUUID().replaceAll('-', '');
    this.fichas.set(ficha, Date.now() + VALIDADE);
    await this._grava();
    return { ok: true, ficha };
  }

  temFicha(ficha) {
    const ate = this.fichas.get(ficha);
    if (!ate) return false;
    if (ate < Date.now()) { this.fichas.delete(ficha); return false; }
    return true;
  }
}

/** Lê uma chave do cabeçalho Cookie, sem biblioteca. */
export function biscoito(cabecalho, nome) {
  for (const parte of String(cabecalho || '').split(';')) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }
  return '';
}

/** A porta de entrada do celular: só um campo de PIN. */
export function paginaDoPIN({ erro = '', castigo = 0 } = {}) {
  const recado = castigo
    ? `PIN errado vezes demais. Tente de novo em ${Math.ceil(castigo / 60000)} min.`
    : erro;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Matilha</title><style>
*{box-sizing:border-box}
body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#f8f9fa;
  color:#111827;font:400 16px/1.5 "DM Sans",Inter,system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px}
form{width:min(100%,340px);text-align:center}
svg{width:34px;height:34px;fill:#f2600c;stroke:#f8f9fa;stroke-width:1.6;stroke-linejoin:round;margin-bottom:14px}
h1{font-size:22px;letter-spacing:-.02em;margin:0 0 6px}
p{color:#5f6672;font-size:14px;margin:0 0 20px}
input{width:100%;background:#fff;border:1px solid #d1d5db;color:#111827;border-radius:8px;
  padding:14px;font:inherit;font-size:28px;text-align:center;letter-spacing:.35em;font-variant-numeric:tabular-nums}
input:focus{outline:none;border-color:#f2600c;box-shadow:0 0 0 3px rgba(242,96,12,.18)}
button{width:100%;margin-top:12px;background:#f2600c;color:#1b0b02;border:0;border-radius:8px;
  padding:14px;font:inherit;font-weight:600;font-size:16px}
.ruim{color:#831c1e;background:#ffedea;border-radius:8px;padding:10px;font-size:14px;margin-top:14px}
</style></head><body>
<form method="GET" action="/">
  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 27 9.5 7 16 27Z M10 27 16.5 4 23 27Z M17 27 22.5 9 29 27Z"/></svg>
  <h1>Painel da Matilha</h1>
  <p>Digite o PIN que aparece no painel do notebook.</p>
  <input name="pin" inputmode="numeric" pattern="[0-9]*" maxlength="6"
         autocomplete="one-time-code" placeholder="000000" autofocus>
  <button type="submit">Entrar</button>
  ${recado ? `<div class="ruim">${recado}</div>` : ''}
</form></body></html>`;
}
