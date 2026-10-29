/**
 * A PONTE ENTRE O CLAUDE CODE E AS FERRAMENTAS DO JARVIS (um servidor MCP).
 *
 * O Claude Code abre este programa e conversa com ele pela entrada e saída
 * padrão (JSON-RPC, uma mensagem por linha). Ele só repassa: a lista de
 * ferramentas e cada chamada vão para a Matilha (JARVIS_URL), que executa
 * do mesmo jeito que fazia com o Groq. A ficha (JARVIS_FICHA) é sorteada
 * cada vez que a Matilha abre: sem ela, a Matilha não aceita a chamada.
 */
import { createInterface } from 'node:readline';

const URL_BASE = process.env.JARVIS_URL || 'http://127.0.0.1:8899';
const cabecalhos = { 'content-type': 'application/json', 'x-jarvis-ficha': process.env.JARVIS_FICHA || '',
  ...(process.env.PAINEL_SENHA ? { 'x-orbita-senha': process.env.PAINEL_SENHA } : {}) };
const responde = (id, corpo) => process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id, ...corpo })}\n`);

async function pede(caminho, corpo) {
  const r = await fetch(`${URL_BASE}${caminho}`, { method: 'POST', headers: cabecalhos, body: JSON.stringify(corpo || {}), signal: AbortSignal.timeout(170_000) });
  const lido = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(lido.erro || `a Matilha respondeu ${r.status}`);
  return lido;
}

createInterface({ input: process.stdin }).on('line', async (linha) => {
  let m;
  try { m = JSON.parse(linha); } catch { return; }
  const { id, method: metodo, params } = m;
  try {
    if (metodo === 'initialize') {
      responde(id, { result: { protocolVersion: params?.protocolVersion || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'jarvis', version: '1.0.0' } } });
    } else if (metodo === 'tools/list') {
      const { ferramentas } = await pede('/api/jarvis/mcp/ferramentas');
      responde(id, { result: { tools: ferramentas } });
    } else if (metodo === 'tools/call') {
      const { resultado } = await pede('/api/jarvis/mcp/chama', { nome: params?.name, argumentos: params?.arguments || {} });
      responde(id, { result: { content: [{ type: 'text', text: String(resultado) }] } });
    } else if (metodo === 'ping') {
      responde(id, { result: {} });
    } else if (id !== undefined) {
      responde(id, { error: { code: -32601, message: `não sei fazer ${metodo}` } });
    }
  } catch (e) {
    if (metodo === 'tools/call') responde(id, { result: { content: [{ type: 'text', text: `Falhou: ${e.message}` }], isError: true } });
    else if (id !== undefined) responde(id, { error: { code: -32603, message: e.message } });
  }
});
