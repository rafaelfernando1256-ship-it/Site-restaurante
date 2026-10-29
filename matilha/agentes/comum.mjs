/**
 * O que toda função precisa: porta trancada, resposta honesta, e as
 * regras que não podem cair.
 *
 * ESTE SITE FICA NA INTERNET. Qualquer um que descobrir a URL pode
 * chamar as funções — gastar a sua cota do Groq, publicar sites com o
 * seu token da Netlify. Por isso TODA função exige a senha do painel,
 * que mora numa variável de ambiente e nunca no navegador.
 */
const LIMITE_CORPO = 512 * 1024;

export function responde(dados, status = 200) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8',
               'cache-control': 'no-store' },
  });
}

export function erro(mensagem, status = 400) {
  return responde({ erro: mensagem }, status);
}

/** Comparação em tempo constante: sem isso, dá para descobrir a senha
 *  medindo quanto tempo cada tentativa demora. */
function mesmoSegredo(a, b) {
  const x = new TextEncoder().encode(a || '');
  const y = new TextEncoder().encode(b || '');
  if (x.length !== y.length) return false;
  let diferenca = 0;
  for (let i = 0; i < x.length; i += 1) diferenca |= x[i] ^ y[i];
  return diferenca === 0;
}

export function destranca(req) {
  const esperada = (process.env.PAINEL_SENHA || '').trim();
  if (!esperada) {
    return erro('Defina PAINEL_SENHA nas variáveis de ambiente do site. '
      + 'Sem ela o painel ficaria aberto para qualquer um na internet.', 503);
  }
  const enviada = (req.headers.get('x-orbita-senha') || '').trim();
  if (!mesmoSegredo(enviada, esperada)) return erro('Senha do painel inválida.', 401);
  return null;
}

export async function corpo(req) {
  const bruto = await req.text();
  if (bruto.length > LIMITE_CORPO) throw new Error('Corpo grande demais.');
  try {
    const dados = JSON.parse(bruto || '{}');
    if (!dados || typeof dados !== 'object' || Array.isArray(dados)) {
      throw new Error('Esperava um objeto JSON.');
    }
    return dados;
  } catch (e) {
    throw new Error('JSON inválido no pedido.');
  }
}

/** Texto do lead, limpo: nada de HTML vindo de dado de terceiro. */
export function texto(valor, limite = 300) {
  return String(valor ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, limite);
}

export function escapa(valor) {
  return texto(valor, 2000)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function so_digitos(valor) {
  return String(valor ?? '').replace(/\D/g, '').slice(0, 15);
}

/** Um slug de pasta/subdomínio seguro. */
export function apelido(nome, id) {
  const plano = String(nome ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `${plano.slice(0, 40) || 'cliente'}-${String(id ?? '').slice(0, 8) || 'x'}`;
}

export async function pedeJson(url, opcoes = {}, segundos = 25) {
  const controlador = new AbortController();
  const relogio = setTimeout(() => controlador.abort(), segundos * 1000);
  try {
    const resposta = await fetch(url, { ...opcoes, signal: controlador.signal });
    const bruto = await resposta.text();
    let dados = null;
    try { dados = bruto ? JSON.parse(bruto) : {}; } catch { dados = null; }
    if (!resposta.ok) {
      // O corpo do provedor pode trazer credencial e dado pessoal: só o
      // código sai daqui — o HTTP e, se houver, o código de erro dele
      // ("model_not_found"), que é um rótulo fixo e não dado de ninguém.
      const codigo = String(dados?.error?.code ?? dados?.code ?? '');
      const rotulo = /^[a-z][a-z0-9_.-]{1,60}$/i.test(codigo) ? codigo : '';
      const e = new Error(`O provedor respondeu HTTP ${resposta.status}`
        + `${rotulo ? ` (${rotulo})` : ''}.`);
      e.status = resposta.status;
      e.codigo = rotulo;
      // Quanto esperar quando o limite do plano estoura (o Groq diz em segundos).
      const espera = Number(resposta.headers.get('retry-after'));
      if (Number.isFinite(espera)) e.esperar = espera;
      throw e;
    }
    if (dados === null) throw new Error('O provedor devolveu uma resposta que não é JSON.');
    return dados;
  } finally {
    clearTimeout(relogio);
  }
}

/* ── o Groq, num lugar só ─────────────────────────────────────── */

/**
 * O modelo padrão. Antes eram três cópias de 'llama-3.3-70b-versatile',
 * e quando o Groq desligou o Llama (16/08/2026) os três agentes
 * passaram a levar HTTP 404 ao mesmo tempo. Agora é uma linha.
 */
export const MODELO_GROQ = 'openai/gpt-oss-120b';

/** Modelos que o Groq já desligou no plano grátis. Se um deles ficou
 *  gravado em GROQ_MODELO, vale o padrão — senão o 404 continuaria
 *  mesmo depois de atualizar a Matilha. */
const DESLIGADOS = new Set(['llama-3.3-70b-versatile', 'llama-3.1-8b-instant']);

export function modeloGroq() {
  const escolhido = (process.env.GROQ_MODELO || '').trim();
  return escolhido && !DESLIGADOS.has(escolhido) ? escolhido : MODELO_GROQ;
}

/**
 * O corpo do pedido ao Groq, já com o modelo.
 *
 * O gpt-oss pensa antes de responder, e o que ele pensa conta no
 * max_tokens: com 800 e esforço médio ele às vezes gasta tudo
 * pensando e devolve a mensagem vazia. Esforço baixo e folga no teto
 * resolvem — para escrever uma mensagem de WhatsApp não precisa mais.
 */
export function corpoGroq(pedido, { minimo = 3000 } = {}) {
  const model = modeloGroq();
  if (!model.startsWith('openai/gpt-oss')) return { model, ...pedido };
  return {
    model,
    ...pedido,
    // O teto conta no limite de tokens por minuto do plano: quem precisa de menos (o Jarvis) pede menos.
    max_tokens: Math.max(Number(pedido.max_tokens) || 0, minimo),
    reasoning_effort: 'low',
  };
}

/** Traduz o 404 de modelo para o que você faz a respeito. */
export function explicaGroq(e) {
  if (e?.status === 404 || e?.codigo === 'model_not_found') {
    return `o Groq não tem o modelo "${modeloGroq()}". Em Ajustes → Chaves, `
      + 'apague o "Modelo do Groq" para usar o padrão.';
  }
  return e?.message || String(e);
}
