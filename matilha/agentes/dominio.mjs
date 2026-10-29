/**
 * O AGENTE DO DOMÍNIO — o endereço .com.br do site final.
 *
 * A demonstração fica na Netlify (nome-previa.netlify.app) e some. O site
 * final tem endereço próprio, .com.br, registrado no SEU nome: você embute
 * os ~R$ 40 por ano na mensalidade e tem o controle. A Netlify continua
 * guardando os arquivos, mas ninguém vê "netlify" no endereço.
 *
 * O que este agente faz, e o que não faz:
 *   · procura nomes livres a partir do nome do negócio (consulta pública
 *     do Registro.br, a mesma da busca do site deles);
 *   · depois que você compra, confere sozinho se o DNS já aponta para o
 *     site e se o cadeado (https) já está ativo — e pede o cadeado à
 *     Netlify quando falta.
 *   · NÃO compra: o Registro.br exige CPF ou CNPJ e pagamento, e não vende
 *     por programa. A compra é sua, com o link pronto no painel.
 */
import { promises as dns } from 'node:dns';

import { texto } from './comum.mjs';

/** O IP da Netlify para o domínio sem www (o "A" do DNS). */
export const IP_NETLIFY = '75.2.60.5';

const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Só letras e números: "Pizzaria Forno de Pedra" → "pizzariafornodepedra". */
const junta = (t) => semAcento(t).replace(/&/g, 'e').replace(/[^a-z0-9]+/g, '');
/** Sufixo de empresa: não entra no endereço. */
const EMPRESA = /\b(ltda|me|eireli|epp|sa)\b/g;
/** Conectores: "Forno de Pedra" fica melhor com o "de"; sem ele, é a versão curta. */
const CONECTORES = /\b(de|do|da|dos|das|e)\b/g;

/** Um nome .com.br válido: 2 a 26 caracteres, letras, números e hífen, sem hífen na ponta. */
export const dominioValido = (d) => /^[a-z0-9](?:[a-z0-9-]{0,24}[a-z0-9])?\.com\.br$/.test(String(d || ''));

/** Os nomes a testar, do mais natural ao mais longo. */
export function sugestoesDeNome(lead = {}) {
  const nome = semAcento(lead.nome).replace(/[^a-z0-9 ]+/g, ' ').replace(EMPRESA, ' ');
  const cidade = junta(lead.cidade);
  const palavras = nome.split(/\s+/).filter(Boolean);
  // Sem a palavra do ramo no começo ("pizzaria", "barbearia"...) e sem o
  // conector que sobra na frente: "Pizzaria Forno de Pedra" → "fornodepedra".
  let resto = palavras.slice(1);
  while (resto.length && /^(de|do|da|dos|das|e)$/.test(resto[0])) resto = resto.slice(1);
  const semRamo = junta(resto.join(' '));
  const inteiro = junta(nome);
  const curto = junta(nome.replace(CONECTORES, ' '));
  const tentativas = [inteiro, semRamo.length >= 5 ? semRamo : '', curto,
    cidade && `${inteiro}${cidade}`, cidade && semRamo.length >= 3 && `${semRamo}${cidade}`, cidade && `${inteiro}-${cidade}`];
  return [...new Set(tentativas.filter(Boolean).map((t) => `${t}.com.br`))].filter(dominioValido).slice(0, 8);
}

/**
 * Está livre? Pela consulta pública (RDAP) do Registro.br: 404 é "ninguém
 * registrou". Devolve true, false, ou null quando não deu para saber
 * (internet fora, consulta bloqueada) — e aí quem decide é você, no site
 * do Registro.br.
 */
export async function estaLivre(dominio, { espera = 12_000 } = {}) {
  try {
    const r = await fetch(`https://rdap.registro.br/domain/${encodeURIComponent(dominio)}`, {
      headers: { accept: 'application/rdap+json' }, signal: AbortSignal.timeout(espera),
    });
    if (r.status === 404) return true;
    if (r.ok) return false;
    return null;
  } catch { return null; }
}

/** Até `quantos` nomes livres (ou não conferidos, se a consulta falhar). */
export async function procuraLivres(lead, { quantos = 3, consulta = estaLivre } = {}) {
  const achados = [];
  for (const dominio of sugestoesDeNome(lead)) {
    if (achados.filter((a) => a.livre).length >= quantos) break;
    const livre = await consulta(dominio);
    if (livre !== false) achados.push({ dominio, livre });
  }
  // Os conferidos como livres vêm primeiro.
  return achados.sort((a, b) => Number(b.livre === true) - Number(a.livre === true)).slice(0, quantos);
}

/** O link do Registro.br já com o nome, para você comprar. */
export const linkDeCompra = (dominio) => `https://registro.br/busca-dominio/?fqdn=${encodeURIComponent(dominio)}`;

/** Normaliza o que alguém escreveu ("www.Forno-de-Pedra.com.br/") para "forno-de-pedra.com.br". */
export function limpaDominio(bruto) {
  let d = semAcento(bruto).trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/?#].*$/, '');
  if (d && !d.includes('.')) d = `${d.replace(/[^a-z0-9-]/g, '')}.com.br`;
  return d;
}

/**
 * Já está no ar? Confere o DNS (o A no IP da Netlify, ou o www apontando
 * para o site na Netlify) e se o https abre. Devolve o que falta.
 */
export async function confereNoAr(dominio, { nomeNetlify = '' } = {}) {
  const saida = { dns: false, https: false, detalhe: '' };
  try {
    const ips = await dns.resolve4(dominio);
    saida.dns = ips.includes(IP_NETLIFY);
    if (!saida.dns) saida.detalhe = `o DNS aponta para ${ips.join(', ')}, e não para ${IP_NETLIFY}`;
  } catch (e) {
    saida.detalhe = e.code === 'ENOTFOUND' || e.code === 'ENODATA' ? 'o DNS ainda não tem o registro A' : `DNS: ${texto(e.message, 80)}`;
  }
  if (!saida.dns && nomeNetlify) {
    try {
      const cname = await dns.resolveCname(`www.${dominio}`);
      if (cname.some((c) => c.replace(/\.$/, '') === nomeNetlify)) { saida.dns = true; saida.detalhe = ''; }
    } catch { /* sem www também */ }
  }
  if (saida.dns) {
    try {
      const r = await fetch(`https://${dominio}`, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(15_000) });
      saida.https = r.ok;
      if (!r.ok) saida.detalhe = `o site respondeu ${r.status}`;
    } catch (e) {
      saida.detalhe = `o cadeado (https) ainda não está pronto (${texto(e.cause?.code || e.message, 60)})`;
    }
  }
  return saida;
}

/** Pede à Netlify o cadeado (Let's Encrypt) do domínio. Ela só consegue depois que o DNS aponta. */
export async function pedeCadeado(siteId) {
  const token = (process.env.NETLIFY_TOKEN || '').trim();
  if (!token || !siteId) return false;
  try {
    const r = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/ssl`, {
      method: 'POST', headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(20_000),
    });
    return r.ok;
  } catch { return false; }
}
