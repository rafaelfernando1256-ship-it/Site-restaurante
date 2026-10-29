/**
 * AGENTE 4 · PUBLICADOR — põe o site no ar e devolve o link.
 *
 * Usa a API oficial da Netlify pelo método do DIGEST: manda a lista de
 * arquivos com o SHA-1 de cada um, a Netlify responde quais ainda não
 * tem, e só esses sobem. Sem zip, sem biblioteca — por isso este
 * projeto inteiro não tem uma dependência sequer, e você pode arrastar
 * a pasta para a Netlify sem passo de build.
 *
 * O TOKEN NUNCA VAI PARA O NAVEGADOR. Ele vive numa variável de
 * ambiente do site e só esta função o enxerga. Se ele vazasse, quem
 * pegasse poderia publicar e apagar qualquer site da sua conta.
 *
 * Demonstração e site oficial ficam em SITES SEPARADOS, de propósito: o
 * oficial é indexável e o da prévia não pode disputar busca com o
 * cliente, nem sumir quando você republicar o outro.
 */
import { createHash } from 'node:crypto';
import { apelido, corpo, destranca, erro, pedeJson, responde, texto } from './comum.mjs';
import { poeContador } from './relatorio.mjs';

const API = 'https://api.netlify.com/api/v1';

export function sha1(conteudo) {
  return createHash('sha1').update(conteudo, 'utf8').digest('hex');
}

/** O nome do site na Netlify. Previsível de propósito: republicar o
 *  mesmo cliente tem que cair no MESMO site, não criar um novo a cada
 *  tentativa. */
export function nomeDoSite(lead, versao) {
  return `orbita-${apelido(lead?.nome, lead?.id)}-${versao === 'oficial' ? 'site' : 'previa'}`
    .replace(/[^a-z0-9-]/g, '').slice(0, 60);
}

async function achaOuCria(token, nome) {
  const cabecalho = { authorization: `Bearer ${token}` };
  try {
    const achado = await pedeJson(`${API}/sites/${nome}.netlify.app`, { headers: cabecalho });
    if (achado?.id) return { site: achado, criado: false };
  } catch (e) {
    if (e.status && e.status !== 404) throw e;
  }
  const novo = await pedeJson(`${API}/sites`, {
    method: 'POST',
    headers: { ...cabecalho, 'content-type': 'application/json' },
    body: JSON.stringify({ name: nome }),
  });
  return { site: novo, criado: true };
}

export default async (req) => {
  if (req.method !== 'POST') return erro('Use POST.', 405);
  const trancado = destranca(req);
  if (trancado) return trancado;

  const token = (process.env.NETLIFY_TOKEN || '').trim();
  if (!token) {
    return erro('Falta NETLIFY_TOKEN nas variáveis do site. Pegue em '
      + 'app.netlify.com → User settings → Applications → Personal access tokens.', 503);
  }
  let dados;
  try { dados = await corpo(req); } catch (e) { return erro(e.message); }

  const html = String(dados.html || '');
  if (!html.toLowerCase().includes('<html')) return erro('O HTML do site não veio.');
  if (html.length > 2 * 1024 * 1024) return erro('O HTML passou de 2 MB.');
  const versao = dados.versao === 'oficial' ? 'oficial' : 'demo';
  const lead = dados.lead || {};
  if (!texto(lead.nome, 140)) return erro('O negócio precisa de um nome.');

  // Trava de segurança que não depende de ninguém lembrar: uma prévia
  // SEMPRE sai sem indexação. Se o HTML chegou sem o noindex, ele entra
  // aqui, antes de subir.
  let corpoFinal = html;
  if (versao === 'demo' && !/noindex/i.test(corpoFinal)) {
    corpoFinal = corpoFinal.replace(/<head([^>]*)>/i,
      '<head$1>\n<meta name="robots" content="noindex, nofollow">');
  }
  // O site final leva o contador de cliques do WhatsApp (relatório do mês).
  if (versao === 'oficial') corpoFinal = poeContador(corpoFinal);
  const arquivos = { '/index.html': corpoFinal };
  if (versao === 'demo') arquivos['/robots.txt'] = 'User-agent: *\nDisallow: /\n';

  const nome = nomeDoSite(lead, versao);
  try {
    const { site, criado } = await achaOuCria(token, nome);
    const digesto = Object.fromEntries(
      Object.entries(arquivos).map(([caminho, conteudo]) => [caminho, sha1(conteudo)]));

    const deploy = await pedeJson(`${API}/sites/${site.id}/deploys`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ files: digesto, draft: false }),
    }, 30);

    // Um de cada vez: mandar em paralelo faz a API responder
    // "No records matched" em todos menos o último.
    const faltando = new Set(deploy.required || []);
    for (const [caminho, conteudo] of Object.entries(arquivos)) {
      if (!faltando.has(digesto[caminho])) continue;
      const resposta = await fetch(`${API}/deploys/${deploy.id}/files${caminho}`, {
        method: 'PUT',
        headers: { authorization: `Bearer ${token}`,
                   'content-type': 'application/octet-stream' },
        body: conteudo,
      });
      if (!resposta.ok) {
        return erro(`A Netlify recusou o arquivo ${caminho} (HTTP ${resposta.status}).`, 502);
      }
    }

    const url = site.ssl_url || site.url || `https://${nome}.netlify.app`;
    return responde({
      url,
      site_id: site.id,
      deploy_id: deploy.id,
      versao,
      site_criado_agora: criado,
      // A Netlify ainda processa depois do upload. Dizer que está no ar
      // sem conferir é o jeito mais fácil de mandar um link quebrado ao
      // cliente — então o painel confere antes de liberar o envio.
      aviso: 'Abra o link e confira antes de mandar para o cliente: a Netlify '
        + 'leva alguns segundos para processar o deploy.',
    });
  } catch (e) {
    return erro(`A publicação não concluiu. (${e.message})`, 502);
  }
};
