/* ------------------------------------------------------------------
   A IA — Gemini, chamado direto do seu navegador.

   A chave fica no localStorage DESTE navegador. Ela não está no código
   do site: quem abrir o link não vê a sua chave, e se você abrir o
   painel em outro computador vai precisar colar de novo. Isso é de
   propósito — chave no código é chave vazada.

   O catálogo de modelos da Google muda de nome sem avisar, e um nome
   aposentado vira 404 no meio do trabalho. Por isso aqui o modelo é
   perguntado, guardado, e trocado sozinho quando some ou congestiona.
   ------------------------------------------------------------------ */

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const ROTA = 'https://openrouter.ai/api/v1';

/* Ordem de preferência quando o modelo do OpenRouter não foi escolhido
   à mão: primeiro os que escrevem melhor em português e seguem esquema. */
const GOSTO = ['claude', 'gemini', 'gpt-4o', 'gpt-5', 'llama', 'mistral'];

/* Modelos de voz, imagem, vídeo e embedding aparecem na mesma lista e
   vários dizem que fazem texto. Escolher um deles rende um 400 que
   parece erro de código. */
const ESPECIALIZADOS = ['tts', 'image', 'imagen', 'veo', 'embedding', 'embed',
                        'aqa', 'live', 'audio', 'rerank', 'vision', 'learnlm',
                        'gemma', 'computer-use', 'robotics', 'guard'];

let escolhido = '';
let catalogo = null;

/* Qual provedor está valendo. Sem escolha explícita, vale a chave que
   existir — e o OpenRouter vem primeiro porque uma chave dele já alcança
   o Claude, o Gemini e o GPT. */
export function provedor(estado) {
  const c = estado?.chaves || {};
  if (c.provedor === 'openrouter' || c.provedor === 'gemini') return c.provedor;
  if (c.openrouter?.trim()) return 'openrouter';
  return 'gemini';
}

export function chaveDe(estado) {
  return (provedor(estado) === 'openrouter'
    ? estado?.chaves?.openrouter : estado?.chaves?.gemini || '').trim();
}

export function temChave(estado) {
  return Boolean(chaveDe(estado));
}

export function nomeDoProvedor(estado) {
  return provedor(estado) === 'openrouter' ? 'OpenRouter' : 'Gemini';
}

function versao(nome) {
  const nums = (nome.match(/\d+(?:\.\d+)?/g) || ['0']).map(Number);
  return nums;
}

function melhor(nomes, preferir = 'flash') {
  const bons = nomes.filter(n => !ESPECIALIZADOS.some(e => n.toLowerCase().includes(e)));
  const alvo = bons.filter(n => n.includes(preferir) && !n.includes('lite'));
  const fila = (alvo.length ? alvo : bons).slice().sort((a, b) => {
    const va = versao(a), vb = versao(b);
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      const d = (vb[i] || 0) - (va[i] || 0);
      if (d) return d;
    }
    return 0;
  });
  return fila[0] || '';
}

export async function listaModelos(chave) {
  if (catalogo) return catalogo;
  const r = await fetch(`${BASE}/models?key=${encodeURIComponent(chave)}`);
  if (!r.ok) throw new Error(await mensagemDeErro(r));
  const d = await r.json();
  catalogo = (d.models || [])
    .filter(m => !m.supportedGenerationMethods ||
                 m.supportedGenerationMethods.includes('generateContent'))
    .map(m => String(m.name || '').replace('models/', ''))
    .filter(Boolean);
  return catalogo;
}

export async function modelo(chave) {
  if (escolhido) return escolhido;
  try {
    escolhido = melhor(await listaModelos(chave)) || 'gemini-3.8-flash';
  } catch {
    escolhido = 'gemini-3.8-flash';
  }
  return escolhido;
}

async function mensagemDeErro(r) {
  let detalhe = '';
  try {
    const d = await r.json();
    detalhe = d?.error?.message || '';
  } catch { /* corpo não era JSON */ }
  if (r.status === 400 && /API key not valid/i.test(detalhe)) {
    return 'O Google recusou a chave. Confira em aistudio.google.com/apikey.';
  }
  if (r.status === 403) return 'A chave não tem acesso à API do Gemini.';
  if (r.status === 429) return 'Passou da cota gratuita do Gemini. Tente mais tarde.';
  if (r.status === 503) return 'O modelo está sobrecarregado agora.';
  return `${r.status}${detalhe ? ' — ' + detalhe : ''}`;
}

const DORME = ms => new Promise(r => setTimeout(r, ms));

let modeloRota = '';
let catalogoRota = null;

async function rotaPede(caminho, chave, corpo) {
  const r = await fetch(`${ROTA}${caminho}`, {
    method: corpo ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
      'X-Title': 'Painel de vendas',
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (r.ok) return r.json();
  let detalhe = '';
  try { detalhe = (await r.json())?.error?.message || ''; } catch { /* vazio */ }
  if (r.status === 401) {
    throw new Error('O OpenRouter recusou a chave. Pegue uma em openrouter.ai/keys');
  }
  if (r.status === 402) {
    throw new Error('Sem crédito no OpenRouter. Há modelos grátis em ' +
                    'openrouter.ai/models?q=free');
  }
  if (r.status === 429) throw new Error('Passou do limite do OpenRouter agora.');
  throw new Error(`OpenRouter ${r.status}${detalhe ? ' — ' + detalhe : ''}`);
}

export async function modelosRota(chave) {
  if (catalogoRota) return catalogoRota;
  const d = await rotaPede('/models', chave);
  catalogoRota = (d.data || []).map(m => m.id).filter(Boolean);
  return catalogoRota;
}

async function modeloRotaEscolhido(chave, preferido) {
  if (preferido) return preferido;
  if (modeloRota) return modeloRota;
  const nomes = await modelosRota(chave);
  if (!nomes.length) throw new Error('nenhum modelo disponível nesta chave');
  for (const marca of GOSTO) {
    const cand = nomes.filter(n => n.toLowerCase().includes(marca)
      && !/embed|moderation|vision-only/i.test(n));
    if (cand.length) { modeloRota = cand.sort((a, b) => {
      const va = versao(a), vb = versao(b);
      for (let i = 0; i < Math.max(va.length, vb.length); i++) {
        const d = (vb[i] || 0) - (va[i] || 0);
        if (d) return d;
      }
      return 0;
    })[0]; return modeloRota; }
  }
  modeloRota = nomes[0];
  return modeloRota;
}

async function pedeTextoRota(chave, instrucao, conteudo, { maxTokens, preferido }) {
  const alvo = await modeloRotaEscolhido(chave, preferido);
  const d = await rotaPede('/chat/completions', chave, {
    model: alvo,
    messages: [{ role: 'system', content: instrucao },
               { role: 'user', content: conteudo }],
    max_tokens: maxTokens,
  });
  const texto = (d?.choices?.[0]?.message?.content || '').trim();
  if (!texto) throw new Error('o OpenRouter respondeu vazio');
  return texto;
}

/* Pede um texto. Tenta de novo quando é sobrecarga, troca de modelo
   quando o nome sumiu, e desiste na hora quando é erro de chave —
   insistir num 400 só queima tempo. */
/* `estado` entra para o chamador não precisar saber qual provedor está
   valendo: ele pede texto, e a ponte resolve. */
export async function pedeTextoCom(estado, instrucao, conteudo, opcoes = {}) {
  const chave = chaveDe(estado);
  if (!chave) throw new Error(`falta a chave do ${nomeDoProvedor(estado)} em Ajustes.`);
  if (provedor(estado) === 'openrouter') {
    return pedeTextoRota(chave, instrucao, conteudo, {
      maxTokens: opcoes.maxTokens || 8000,
      preferido: (estado?.chaves?.modeloRota || '').trim(),
    });
  }
  return pedeTexto(chave, instrucao, conteudo, opcoes);
}

export async function pedeTexto(chave, instrucao, conteudo, { maxTokens = 8000,
                                                              tentativas = 3 } = {}) {
  if (!chave?.trim()) throw new Error('falta a chave do Gemini em Ajustes.');
  let espera = 2500;
  let alvo = await modelo(chave);

  for (let t = 0; t < tentativas; t++) {
    const r = await fetch(
      `${BASE}/models/${alvo}:generateContent?key=${encodeURIComponent(chave)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instrucao }] },
          contents: [{ role: 'user', parts: [{ text: conteudo }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8 },
        }),
      });

    if (r.ok) {
      const d = await r.json();
      const partes = d?.candidates?.[0]?.content?.parts || [];
      const texto = partes.map(p => p.text || '').join('').trim();
      if (texto) return texto;
      const motivo = d?.candidates?.[0]?.finishReason || 'sem motivo';
      throw new Error(`o Gemini respondeu vazio (${motivo})`);
    }

    const erro = await mensagemDeErro(r);
    const sumiu = r.status === 404;
    const passageiro = r.status === 503 || r.status === 429 || r.status >= 500;

    if (sumiu) {
      catalogo = null; escolhido = '';
      const outros = (await listaModelos(chave)).filter(n => n !== alvo);
      alvo = melhor(outros);
      if (!alvo) throw new Error(erro);
      escolhido = alvo;
      continue;
    }
    if (passageiro && t < tentativas - 1) {
      await DORME(espera);
      espera *= 2;
      // Na última chance, tenta outro modelo: congestionamento costuma
      // ser de um modelo, não da conta.
      if (t === tentativas - 2) {
        try {
          const outros = (await listaModelos(chave)).filter(n => n !== alvo);
          if (outros.length) { alvo = melhor(outros); escolhido = alvo; }
        } catch { /* segue com o mesmo */ }
      }
      continue;
    }
    throw new Error(erro);
  }
  throw new Error('o Gemini não respondeu');
}

export function modeloEmUso() {
  return modeloRota || escolhido;
}
