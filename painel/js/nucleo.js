/* ------------------------------------------------------------------
   O NÚCLEO — estado, memória e as regras que não são de tela.

   Tudo que você digita fica NO SEU NAVEGADOR (localStorage). Nada sobe
   para servidor nenhum: este site é só HTML. Por isso existe o botão de
   exportar — se você limpar o navegador sem exportar, perde.
   ------------------------------------------------------------------ */

const CHAVE = 'painel-vendas-v1';

export const VAZIO = {
  versao: 1,
  negocio: {
    nome: '', cidade: '', whatsapp: '', pixChave: '', pixNome: '', pixCidade: '',
    cnpj: '', site: '',
  },
  precos: {
    montagem: 900, mensalidade: 90, prazoDias: 5, alteracoesInclusas: 2,
    paginas: 1, custoHora: 60, horasEstimadas: 8, margem: 2.0,
  },
  chaves: { gemini: '', openrouter: '', provedor: '', modeloRota: '' },
  leads: [],
  cobrancas: [],
  indicacoes: [],
};

export const ETAPAS = [
  ['novo', 'achado'],
  ['abordado', 'mandei mensagem'],
  ['respondeu', 'respondeu'],
  ['demo', 'viu a demonstração'],
  ['proposta', 'sabe o preço'],
  ['fechado', 'pagou'],
  ['entregue', 'no ar'],
  ['perdido', 'não vai rolar'],
];

export const estado = carrega();

function carrega() {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return estruturaNova();
    const d = JSON.parse(cru);
    return { ...estruturaNova(), ...d,
             negocio: { ...VAZIO.negocio, ...(d.negocio || {}) },
             precos: { ...VAZIO.precos, ...(d.precos || {}) },
             chaves: { ...VAZIO.chaves, ...(d.chaves || {}) } };
  } catch {
    return estruturaNova();
  }
}

function estruturaNova() {
  return JSON.parse(JSON.stringify(VAZIO));
}

let pendente = null;
export function salva() {
  // Agrupa gravações: digitar num campo dispara uma por tecla, e
  // localStorage é síncrono — sem isso, o campo engasga.
  clearTimeout(pendente);
  pendente = setTimeout(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) {
      console.warn('não consegui salvar', e);
    }
  }, 150);
}

export function exporta() {
  const nome = `painel-${new Date().toISOString().slice(0, 10)}.json`;
  baixa(nome, JSON.stringify(estado, null, 2), 'application/json');
}

export function importa(texto) {
  const d = JSON.parse(texto);
  if (!d || typeof d !== 'object' || !Array.isArray(d.leads)) {
    throw new Error('esse arquivo não é um backup do painel');
  }
  Object.assign(estado, estruturaNova(), d);
  salva();
}

export function baixa(nome, conteudo, tipo = 'text/plain') {
  const blob = conteudo instanceof Blob ? conteudo : new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---- leads -------------------------------------------------------- */

export const REDES = ['instagram.com', 'facebook.com', 'fb.com', 'linktr.ee',
                      'linktree', 'beacons.ai', 'linkbio', 'bio.link'];
export const DELIVERY = ['ifood.com', 'goomer', 'anota.ai', 'cardapioweb',
                         'ubereats', 'rappi', 'aiqfome'];

/* O filtro que vale dinheiro: o "site" cadastrado no Google quase nunca
   é um site. Quem só tem Instagram é o melhor lead — já tem foto e
   público, e não tem onde cair quem procura no Google. */
export function classifica(url) {
  const u = String(url || '').toLowerCase();
  if (!u.trim()) return 'sem_presenca';
  if (REDES.some(r => u.includes(r))) return 'so_rede';
  if (DELIVERY.some(d => u.includes(d))) return 'so_delivery';
  return 'tem_site';
}

export const PRESENCA = {
  sem_presenca: 'não tem nada',
  so_rede: 'só Instagram',
  so_delivery: 'só delivery',
  tem_site: 'já tem site',
};

export function instagramDe(texto) {
  const t = String(texto || '');
  const m = t.match(/instagram\.com\/+([A-Za-z0-9._]+)/i);
  if (m) {
    const h = m[1].replace(/[/.]+$/, '');
    return ['p', 'reel', 'reels', 'explore', 'stories', 'tv', 'accounts']
      .includes(h.toLowerCase()) ? '' : h;
  }
  const a = t.match(/@([A-Za-z0-9._]{2,})/);
  return a ? a[1] : '';
}

export function e164(telefone) {
  let d = String(telefone || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.length <= 11) d = '55' + d;          // número brasileiro sem o país
  return d;
}

export function telefoneBonito(e) {
  const d = String(e || '').replace(/\D/g, '');
  if (d.length < 12) return e || '';
  const ddd = d.slice(2, 4), resto = d.slice(4);
  return resto.length === 9
    ? `(${ddd}) ${resto.slice(0, 5)}-${resto.slice(5)}`
    : `(${ddd}) ${resto.slice(0, 4)}-${resto.slice(4)}`;
}

export function pontua(lead) {
  let p = 0;
  p += { so_rede: 4, so_delivery: 3, sem_presenca: 2 }[lead.presenca] || 0;
  const n = Number(lead.avaliacoes) || 0;
  p += n >= 200 ? 3 : n >= 50 ? 2 : n >= 10 ? 1 : 0;
  const nota = Number(lead.nota) || 0;
  p += nota >= 4.3 ? 2 : nota >= 3.8 ? 1 : 0;
  if (lead.telefone) p += 1;
  return Math.min(10, p);
}

export function novoLead(dados = {}) {
  const url = dados.url || '';
  const lead = {
    id: 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    nome: '', cidade: estado.negocio.cidade || '', telefone: '', instagram: '',
    url: '', categoria: '', nota: 0, avaliacoes: 0, etapa: 'novo',
    mensagem: '', demoHtml: '', demoUrl: '', valor: 0, anotacoes: '',
    criadoEm: Date.now(), ...dados,
  };
  lead.telefone = e164(lead.telefone);
  lead.instagram = (lead.instagram || instagramDe(url)).replace(/^@/, '');
  lead.presenca = dados.presenca || classifica(url);
  lead.pontuacao = pontua(lead);
  return lead;
}

export function achaLead(id) {
  return estado.leads.find(l => l.id === id);
}

export function moveLead(id, etapa) {
  const l = achaLead(id);
  if (!l) return;
  l.etapa = etapa;
  l.mexidoEm = Date.now();
  salva();
}

/* Importação por colagem: cada linha vira um lead. Aceita o que sai do
   funil, de uma planilha ou de um bloco de notas — separador por tab,
   ponto-e-vírgula ou vírgula, nesta ordem. */
export function importaLinhas(texto) {
  const linhas = String(texto || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const novos = [];
  for (const linha of linhas) {
    if (/^(nome|name)\b/i.test(linha) && /telefone|phone|whats/i.test(linha)) continue;
    const sep = linha.includes('\t') ? '\t' : linha.includes(';') ? ';' : ',';
    const partes = linha.split(sep).map(p => p.trim());
    const [nome, telefone = '', instagram = '', cidade = ''] = partes;
    if (!nome) continue;
    novos.push(novoLead({
      nome, telefone, cidade: cidade || estado.negocio.cidade || '',
      instagram: instagram.replace(/^@/, ''),
      url: instagram.includes('http') ? instagram
           : (instagram ? `https://instagram.com/${instagram.replace(/^@/, '')}` : ''),
    }));
  }
  estado.leads.unshift(...novos);
  salva();
  return novos.length;
}

export function moeda(v) {
  return (Number(v) || 0).toLocaleString('pt-BR',
    { style: 'currency', currency: 'BRL' });
}

export function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function emDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + Number(dias || 0));
  return d.toISOString().slice(0, 10);
}

export function dataBonita(iso) {
  if (!iso) return '';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function linkWhats(telefone, texto) {
  const n = e164(telefone);
  return `https://wa.me/${n}${texto ? '?text=' + encodeURIComponent(texto) : ''}`;
}
