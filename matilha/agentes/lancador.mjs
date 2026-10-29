/**
 * O JARVIS NO CELULAR, DE QUALQUER LUGAR — escaneia uma vez e pronto.
 *
 * O endereço de fora de casa (o túnel da Cloudflare) muda toda vez que
 * a Matilha reinicia. Para o celular não precisar de QR novo, ele guarda
 * um endereço que NÃO muda: um site pequeno na sua conta da Netlify, o
 * "lançador". Toda vez que o túnel muda, a Matilha atualiza ali o
 * endereço novo. O celular abre o lançador e é levado ao Jarvis.
 *
 * O endereço e o PIN ficam no lançador EMBARALHADOS (AES-256-GCM). A
 * chave vai só dentro do QR code (na parte depois do #, que o navegador
 * nunca manda para servidor nenhum) e fica guardada só no seu celular.
 * Quem abrir o site da Netlify sem a chave vê um arquivo ilegível.
 *
 * Gerar um QR novo (com chave nova) desliga os celulares antigos.
 */
import { createCipheriv, randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { publicaArquivos } from './trabalhos.mjs';

const b64url = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Embaralha `dados` (objeto) com a chave: { iv, dados } em base64. */
export function embaralha(obj, chave) {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', chave, iv);
  const corpo = Buffer.concat([c.update(JSON.stringify(obj), 'utf8'), c.final(), c.getAuthTag()]);
  return { iv: iv.toString('base64'), dados: corpo.toString('base64') };
}

const PAGINA = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#121826">
<meta name="robots" content="noindex">
<title>Jarvis</title>
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/jarvis-icone-192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<style>
  :root{--noite:#121826;--texto:#ece6da;--suave:#9aa3b8;--ambar:#f2b45a;--linha:#28324c}
  html,body{margin:0;height:100%;background:var(--noite);color:var(--texto);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
  main{min-height:100%;display:grid;place-items:center;padding:24px;box-sizing:border-box;text-align:center}
  .orbe{width:132px;height:132px;margin:0 auto 28px;border-radius:50%;background:url(/jarvis-icone-192.png) center/180% no-repeat;animation:respira 2.4s ease-in-out infinite}
  @keyframes respira{50%{transform:scale(1.06);filter:brightness(1.2)}}
  @media (prefers-reduced-motion:reduce){.orbe{animation:none}}
  h1{font-weight:500;font-size:22px;margin:0 0 8px}
  p{color:var(--suave);margin:0 auto 18px;max-width:30ch}
  button{font:inherit;border:0;border-radius:24px;padding:12px 22px;background:var(--texto);color:var(--noite);font-weight:600}
  [hidden]{display:none}
</style>
</head>
<body>
<main>
  <div>
    <div class="orbe" aria-hidden="true"></div>
    <h1 id="titulo">Chamando o Jarvis…</h1>
    <p id="texto">Procurando o seu notebook.</p>
    <button id="tenta" hidden>Tentar de novo</button>
  </div>
</main>
<script>
const $ = (s) => document.querySelector(s);
const diz = (t, x, botao) => { $('#titulo').textContent = t; $('#texto').textContent = x; $('#tenta').hidden = !botao; };
const guarda = { le: () => { try { return localStorage.getItem('jarvis-chave'); } catch { return null; } },
  poe: (v) => { try { localStorage.setItem('jarvis-chave', v); } catch {} } };
const deB64 = (t) => Uint8Array.from(atob(t.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((t.length + 3) % 4)), (c) => c.charCodeAt(0));
async function abre() {
  // A chave vem no QR (depois do #) só na primeira vez; daí fica no celular e some da barra.
  const doQR = new URLSearchParams(location.hash.slice(1)).get('k');
  if (doQR) { guarda.poe(doQR); history.replaceState(null, '', '/'); }
  const chave = guarda.le();
  if (!chave) { diz('Este celular ainda não está ligado', 'No notebook, abra o Jarvis, toque em Celular e escaneie o QR code com a câmera.'); return; }
  let alvo;
  try {
    const r = await fetch('/endereco.json?t=' + Date.now(), { cache: 'no-store' });
    const e = await r.json();
    const k = await crypto.subtle.importKey('raw', deB64(chave), 'AES-GCM', false, ['decrypt']);
    const claro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deB64(e.iv) }, k, deB64(e.dados));
    alvo = JSON.parse(new TextDecoder().decode(claro));
  } catch {
    diz('Este celular foi desligado', 'Um QR code novo foi gerado no notebook. Escaneie de novo para religar.');
    return;
  }
  if (!alvo.url) { diz('O Jarvis está fora do ar', 'A Matilha fechou ou o acesso de fora de casa foi desligado no notebook.', true); return; }
  // Antes de ir, confere se o notebook responde (uma imagem pequena que não pede PIN).
  const vivo = await new Promise((ok) => { const i = new Image(); const t = setTimeout(() => ok(false), 8000);
    i.onload = () => { clearTimeout(t); ok(true); }; i.onerror = () => { clearTimeout(t); ok(false); }; i.src = alvo.url + '/ping.png?t=' + Date.now(); });
  if (!vivo) { diz('O notebook não respondeu', 'Ele precisa estar ligado, com a Matilha aberta e com internet.', true); return; }
  location.replace(alvo.url + '/jarvis.html?pin=' + encodeURIComponent(alvo.pin));
}
$('#tenta').addEventListener('click', () => { diz('Chamando o Jarvis…', 'Procurando o seu notebook.'); abre(); });
abre();
</script>
</body>
</html>`;

const MANIFESTO = JSON.stringify({
  name: 'Jarvis', short_name: 'Jarvis', start_url: '/', display: 'standalone', background_color: '#121826', theme_color: '#121826',
  lang: 'pt-BR', icons: [{ src: '/jarvis-icone-192.png', sizes: '192x192', type: 'image/png' }, { src: '/jarvis-icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
});
const CABECALHOS = `/endereco.json
  Cache-Control: no-store
/*
  X-Robots-Tag: noindex
  Referrer-Policy: no-referrer
`;

export class Lancador {
  constructor({ arquivo, pastaPublica, diz = () => {} }) {
    this.arquivo = arquivo;        // dados/celular-lancador.json: { site, url, chave }
    this.pastaPublica = pastaPublica;
    this.diz = diz;
    this.estado = null;
    this.publicado = '';           // o endereço que está no lançador agora
    this.erro = '';
  }

  async carrega() {
    try { this.estado = JSON.parse(await readFile(this.arquivo, 'utf8')); } catch { this.estado = null; }
    return this.estado;
  }

  /** Liga um celular novo: chave nova (os antigos param de abrir) e o site criado se ainda não existe. */
  async novaChave() {
    await this.carrega();
    const site = this.estado?.site || `jarvis-${randomBytes(5).toString('hex')}`;
    this.estado = { site, url: this.estado?.url || '', chave: randomBytes(32).toString('base64') };
    await writeFile(this.arquivo, JSON.stringify(this.estado, null, 1), 'utf8');
    this.publicado = '';
    return this.estado;
  }

  /** O endereço que vai no QR: o lançador, com a chave depois do #. */
  enderecoDoQR() {
    if (!this.estado?.url) return '';
    return `${this.estado.url}/#k=${b64url(Buffer.from(this.estado.chave, 'base64'))}`;
  }

  /** Põe no lançador o endereço atual do Jarvis (só se mudou, a menos que `forca`). */
  async atualiza({ url, pin }, { forca = false } = {}) {
    if (!this.estado?.chave) return false;
    if (!forca && `${url}|${pin}` === this.publicado) return false;
    const chave = Buffer.from(this.estado.chave, 'base64');
    const arquivos = {
      '/index.html': Buffer.from(PAGINA),
      '/manifest.webmanifest': Buffer.from(MANIFESTO),
      '/_headers': Buffer.from(CABECALHOS),
      '/endereco.json': Buffer.from(JSON.stringify(embaralha({ url: url || '', pin, quando: Date.now() }, chave))),
      '/jarvis-icone-192.png': await readFile(join(this.pastaPublica, 'jarvis-icone-192.png')),
      '/jarvis-icone-512.png': await readFile(join(this.pastaPublica, 'jarvis-icone-512.png')),
    };
    try {
      const r = await publicaArquivos(arquivos, this.estado.site);
      if (r.url && r.url !== this.estado.url) {
        this.estado.url = r.url.replace(/\/$/, '');
        await writeFile(this.arquivo, JSON.stringify(this.estado, null, 1), 'utf8');
      }
      this.publicado = `${url}|${pin}`;
      this.erro = '';
      this.diz(`  ✦ celular: endereço do Jarvis atualizado no lançador (${this.estado.url})`);
      return true;
    } catch (e) {
      this.erro = e.message;
      this.diz(`  ⚠ celular: não atualizei o lançador (${e.message})`);
      return false;
    }
  }
}
