/* ------------------------------------------------------------------
   A IA — chamada direto do seu navegador: Gemini, OpenRouter ou Groq.

   A chave fica no localStorage DESTE navegador. Ela não está no código
   do site: quem abrir o link não vê a sua chave, e se você abrir o
   painel em outro computador vai precisar colar de novo. Isso é de
   propósito — chave no código é chave vazada.

   O catálogo de modelos da Google muda de nome sem avisar, e um nome
   aposentado vira 404 no meio do trabalho. Por isso aqui o modelo é
   perguntado, guardado, e trocado sozinho quando some ou congestiona.
   ------------------------------------------------------------------ */

const BASE = 'https://generativelanguage.googleapis.com/v1beta';

/* OpenRouter e Groq falam o mesmo dialeto (o da OpenAI), então é um
   código só. O que muda é o endereço, a ordem de preferência e onde se
   pega a chave. */
const DIALETOS = {
  openrouter: {
    base: 'https://openrouter.ai/api/v1',
    nome: 'OpenRouter',
    chaves: 'openrouter.ai/keys',
    /* Primeiro os que escrevem melhor em português e seguem esquema. */
    gosto: ['claude', 'gemini', 'gpt-4o', 'gpt-5', 'llama', 'mistral'],
  },
  groq: {
    base: 'https://api.groq.com/openai/v1',
    nome: 'Groq',
    chaves: 'console.groq.com/keys',
    /* Catálogo de modelos abertos: Kimi e gpt-oss escrevem o português
       mais apresentável dos que estão ali. */
    gosto: ['kimi', 'gpt-oss', 'llama-4', 'llama-3.3', 'qwen', 'llama'],
  },
};

/* Transcritor de áudio, censor e voz moram no mesmo catálogo e não
   servem para escrever. Escolher um deles rende 400. */
const EVITA = /embed|moderation|vision-only|whisper|tts|guard|safeguard|rerank|playai/i;

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
  if (c.provedor === 'openrouter' || c.provedor === 'gemini'
      || c.provedor === 'groq') return c.provedor;
  /* Sem escolha explícita, vale a chave que existir. O OpenRouter vem
     primeiro porque uma chave dele já alcança o Claude, o Gemini e o
     GPT; o Groq, por último, porque tem o limite diário mais apertado. */
  if (c.openrouter?.trim()) return 'openrouter';
  if (c.gemini?.trim()) return 'gemini';
  if (c.groq?.trim()) return 'groq';
  return 'gemini';
}

export function chaveDe(estado) {
  const p = provedor(estado);
  return (estado?.chaves?.[p] || '').trim();
}

export function temChave(estado) {
  return Boolean(chaveDe(estado));
}

export function nomeDoProvedor(estado) {
  return DIALETOS[provedor(estado)]?.nome || 'Gemini';
}

/* Onde pegar a chave do provedor que está valendo — a tela de Ajustes
   mostra isso, e dizer "openrouter.ai/keys" para quem escolheu Groq é
   mandar a pessoa para o lugar errado. */
export function ondePegarChave(estado) {
  return DIALETOS[provedor(estado)]?.chaves || 'aistudio.google.com/apikey';
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

/* Um cache por dialeto. Um só para os dois faria a troca de provedor
   mandar o id do outro, e aí é 404 no meio do trabalho. */
const guardados = { openrouter: { modelo: '', catalogo: null },
                    groq: { modelo: '', catalogo: null } };

function porVersao(nomes) {
  return nomes.slice().sort((a, b) => {
    const va = versao(a), vb = versao(b);
    for (let i = 0; i < Math.max(va.length, vb.length); i++) {
      const d = (vb[i] || 0) - (va[i] || 0);
      if (d) return d;
    }
    return 0;
  });
}

async function dialetoPede(nome, caminho, chave, corpo) {
  const d = DIALETOS[nome];
  let r;
  try {
    r = await fetch(`${d.base}${caminho}`, {
      method: corpo ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
        'X-Title': 'Painel de vendas',
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch (e) {
    /* `fetch` que falha sem status é quase sempre o navegador barrando a
       resposta por CORS, e o erro que ele dá ("Failed to fetch") não
       explica nada. Dizer o que é poupa uma hora de caça. */
    throw new Error(
      `não consegui falar com o ${d.nome} daqui do navegador. ` +
      'Pode ser a sua internet, ou o provedor não liberar chamada direta ' +
      'de página (CORS). Nesse caso use o Gemini ou o OpenRouter neste ' +
      `painel — a chave do ${d.nome} continua valendo nos agentes que ` +
      'rodam no seu computador.');
  }
  if (r.ok) return r.json();
  let detalhe = '';
  try { detalhe = (await r.json())?.error?.message || ''; } catch { /* vazio */ }
  if (r.status === 401) {
    throw new Error(`O ${d.nome} recusou a chave. Pegue uma em ${d.chaves}`);
  }
  if (r.status === 402) {
    throw new Error(`Sem crédito no ${d.nome}. Há modelos grátis em ` +
                    'openrouter.ai/models?q=free');
  }
  if (r.status === 429) {
    throw new Error(`Passou do limite do ${d.nome} agora.` +
      (nome === 'groq' ? ' No plano grátis são 30 por minuto e 1.000 por dia.'
                       : ''));
  }
  throw new Error(`${d.nome} ${r.status}${detalhe ? ' — ' + detalhe : ''}`);
}

export async function modelosDialeto(chave, nome = 'openrouter') {
  const g = guardados[nome];
  if (g.catalogo) return g.catalogo;
  const d = await dialetoPede(nome, '/models', chave);
  g.catalogo = (d.data || []).map(m => m.id).filter(Boolean);
  return g.catalogo;
}

async function modeloDialeto(chave, preferido, nome = 'openrouter') {
  if (preferido) return preferido;
  const g = guardados[nome];
  if (g.modelo) return g.modelo;
  const nomes = await modelosDialeto(chave, nome);
  if (!nomes.length) throw new Error('nenhum modelo disponível nesta chave');
  const uteis = nomes.filter(n => !EVITA.test(n));
  for (const marca of DIALETOS[nome].gosto) {
    const cand = uteis.filter(n => n.toLowerCase().includes(marca));
    if (cand.length) { g.modelo = porVersao(cand)[0]; return g.modelo; }
  }
  g.modelo = (uteis.length ? uteis : nomes)[0];
  return g.modelo;
}

async function pedeTextoDialeto(chave, instrucao, conteudo,
                                { maxTokens, preferido, nome = 'openrouter' }) {
  const alvo = await modeloDialeto(chave, preferido, nome);
  const d = await dialetoPede(nome, '/chat/completions', chave, {
    model: alvo,
    messages: [{ role: 'system', content: instrucao },
               { role: 'user', content: conteudo }],
    max_tokens: maxTokens,
  });
  const texto = (d?.choices?.[0]?.message?.content || '').trim();
  if (!texto) throw new Error(`o ${DIALETOS[nome].nome} respondeu vazio`);
  return texto;
}

/* nomes antigos, para não quebrar quem já chama */
export const modelosRota = chave => modelosDialeto(chave, 'openrouter');

/* Pede um texto. Tenta de novo quando é sobrecarga, troca de modelo
   quando o nome sumiu, e desiste na hora quando é erro de chave —
   insistir num 400 só queima tempo. */
/* `estado` entra para o chamador não precisar saber qual provedor está
   valendo: ele pede texto, e a ponte resolve. */
export async function pedeTextoCom(estado, instrucao, conteudo, opcoes = {}) {
  const chave = chaveDe(estado);
  if (!chave) throw new Error(`falta a chave do ${nomeDoProvedor(estado)} em Ajustes.`);
  const p = provedor(estado);
  if (DIALETOS[p]) {
    return pedeTextoDialeto(chave, instrucao, conteudo, {
      maxTokens: opcoes.maxTokens || 8000,
      preferido: (estado?.chaves?.[p === 'groq' ? 'modeloGroq' : 'modeloRota']
                  || '').trim(),
      nome: p,
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
  return guardados.openrouter.modelo || guardados.groq.modelo || escolhido;
}
