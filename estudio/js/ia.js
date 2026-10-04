/* ------------------------------------------------------------------
   O CÉREBRO — Groq, Gemini ou OpenRouter, do navegador.

   A chave fica no localStorage DESTE navegador. Não está no código do
   site: quem abrir o link não vê a sua chave.

   O roteirista e o agente de gatilhos são os MESMOS do terminal — as
   instruções foram copiadas inteiras de motor/roteiro.py e
   motor/gatilhos.py. Se divergirem, o site vira a porta de saída para o
   que o terminal recusa, e aí a verificação não vale nada.
   ------------------------------------------------------------------ */

import { avisoDeCorrecao, problemas } from './gatilhos.js';

const ENDERECOS = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
};
const MODELOS = {
  groq: 'openai/gpt-oss-120b',
  openrouter: '',
};
const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';

export function provedor(chaves) {
  if (chaves?.provedor) return chaves.provedor;
  if (chaves?.groq?.trim()) return 'groq';
  if (chaves?.gemini?.trim()) return 'gemini';
  if (chaves?.openrouter?.trim()) return 'openrouter';
  return 'groq';
}

export function nomeDoProvedor(chaves) {
  return { groq: 'Groq', gemini: 'Gemini',
           openrouter: 'OpenRouter' }[provedor(chaves)] || 'Groq';
}

export function temChave(chaves) {
  return Boolean((chaves?.[provedor(chaves)] || '').trim());
}

const ESQUEMA_ROTEIRO = {
  type: 'object',
  properties: {
    gancho: { type: 'string' },
    quadros: {
      type: 'array',
      items: {
        type: 'object',
        properties: { fala: { type: 'string' }, busca: { type: 'string' } },
        required: ['fala', 'busca'],
      },
    },
    fechamento: { type: 'string' },
    legenda_post: { type: 'string' },
    aposta: { type: 'string' },
    diagnostico: { type: 'string' },
  },
  required: ['gancho', 'quadros', 'fechamento', 'legenda_post'],
};

async function fala(instrucao, conteudo, chaves) {
  const p = provedor(chaves);
  const chave = (chaves[p] || '').trim();
  if (!chave) throw new Error(`falta a chave do ${nomeDoProvedor(chaves)}.`);

  if (p === 'gemini') return falaGemini(instrucao, conteudo, chave, chaves);

  const corpo = {
    model: (chaves.modelo || '').trim() || MODELOS[p] || 'openai/gpt-oss-120b',
    messages: [{ role: 'system', content: instrucao },
               { role: 'user', content: conteudo }],
    max_tokens: 6000,
    // json_object e não json_schema: a maioria dos modelos do Groq não
    // aceita esquema, e mandar esquema ali é 400 na cara. Quem cobra a
    // forma é a validação abaixo.
    response_format: { type: 'json_object' },
  };
  let r;
  try {
    r = await fetch(ENDERECOS[p], {
      method: 'POST',
      headers: { Authorization: `Bearer ${chave}`,
                 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
  } catch {
    throw new Error(`não consegui falar com o ${nomeDoProvedor(chaves)} daqui `
      + 'do navegador. Pode ser a sua internet, ou o provedor não liberar '
      + 'chamada direta de página.');
  }
  if (!r.ok) {
    if (r.status === 401) throw new Error('a chave foi recusada.');
    if (r.status === 429) {
      throw new Error('passou do limite agora. No plano grátis do Groq são '
        + '30 pedidos por minuto.');
    }
    throw new Error(`o modelo respondeu ${r.status}.`);
  }
  const d = await r.json();
  return (d?.choices?.[0]?.message?.content || '').trim();
}

async function falaGemini(instrucao, conteudo, chave, chaves) {
  const modelo = (chaves.modelo || '').trim() || 'gemini-3.8-flash';
  const r = await fetch(
    `${GEMINI}/models/${modelo}:generateContent?key=${encodeURIComponent(chave)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instrucao }] },
        contents: [{ role: 'user', parts: [{ text: conteudo }] }],
        generationConfig: { responseMimeType: 'application/json',
                            maxOutputTokens: 6000 },
      }) });
  if (!r.ok) throw new Error(`o Gemini respondeu ${r.status}.`);
  const d = await r.json();
  return (d?.candidates?.[0]?.content?.parts || [])
    .map(p => p.text || '').join('').trim();
}

function leJson(bruto) {
  const limpo = bruto.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(limpo);
  } catch {
    // Às vezes vem prosa em volta do JSON. Pega do primeiro { ao último }.
    const i = limpo.indexOf('{');
    const f = limpo.lastIndexOf('}');
    if (i < 0 || f <= i) throw new Error('o modelo não devolveu JSON.');
    return JSON.parse(limpo.slice(i, f + 1));
  }
}

function valida(r) {
  if (!r || typeof r.gancho !== 'string' || !Array.isArray(r.quadros)) {
    throw new Error('o modelo devolveu JSON fora do formato.');
  }
  r.quadros = r.quadros
    .filter(q => q && typeof q.fala === 'string')
    .map(q => ({ fala: q.fala, busca: String(q.busca || 'dark gym') }));
  r.fechamento = String(r.fechamento || '');
  r.legenda_post = String(r.legenda_post || '');
  r.aposta = String(r.aposta || '');
  r.diagnostico = String(r.diagnostico || '');
  return r;
}

export async function roteiro(tema, biotipo, chaves, instrucao) {
  let conteudo = `Tema do vídeo: ${tema}`;
  if (biotipo) {
    conteudo += `\n\nO público é quem se identifica como ${biotipo}. Use isso `
      + 'para falar a língua dele, mas NÃO baseie nenhuma recomendação no '
      + 'biotipo em si: somatotipo é classificação descritiva dos anos 1940 '
      + 'e não prediz resposta a treino ou dieta.';
  }
  conteudo += `\n\nDevolva SÓ um JSON com: ${JSON.stringify(ESQUEMA_ROTEIRO)}`;

  // Mesmo laço do terminal: se a verificação achar muleta, refaz UMA vez
  // com os achados escritos de volta. Se a segunda também vier suja,
  // entrega a primeira — roteiro imperfeito vale mais que roteiro nenhum.
  let aviso = '';
  let primeiro = null;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    const r = valida(leJson(await fala(instrucao + aviso, conteudo, chaves)));
    const achados = problemas(r);
    if (!achados.length) return { roteiro: r, achados: [] };
    primeiro = primeiro || r;
    if (tentativa) return { roteiro: primeiro, achados: problemas(primeiro) };
    aviso = avisoDeCorrecao(achados);
  }
  return { roteiro: primeiro, achados: problemas(primeiro) };
}
