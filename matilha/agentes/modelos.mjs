/**
 * OS TRÊS MODELOS DE SITE, e as duas versões de cada um.
 *
 * demo    — prévia: faixa no topo, aviso no rodapé, noindex. Serve para
 *           o dono ver em trinta segundos como ficaria.
 * oficial — o site dele: sem faixa, sem aviso, indexável, com os dados
 *           de verdade confirmados por ele.
 *
 * A REGRA QUE MANDA EM TUDO: o que não veio nos dados não aparece no
 * site. Sem horário, o site diz "confirme com a casa" — não um horário
 * bonito. Sem telefone, não existe botão de WhatsApp. Dado inventado
 * derruba a venda na primeira conferida do dono.
 */
import { escapa, so_digitos } from './comum.mjs';

export const ESTILOS = {
  restaurante: {
    nome: 'Restaurante / lanchonete',
    fonte: 'Fraunces:opsz,wght@9..144,700&family=Inter:wght@400;600',
    titulo: "'Fraunces', Georgia, serif",
    corpo: "'Inter', system-ui, sans-serif",
    cores: { fundo: '#120f0d', tinta: '#f7f1e8', realce: '#e8762c',
             suave: '#c9bcae', cartao: '#2a211c', linha: 'rgba(247,241,232,.14)' },
  },
  hotel: {
    nome: 'Hotel / pousada',
    fonte: 'Cormorant+Garamond:wght@500;600&family=Jost:wght@300;400;500',
    titulo: "'Cormorant Garamond', Georgia, serif",
    corpo: "'Jost', system-ui, sans-serif",
    cores: { fundo: '#fbf9f5', tinta: '#16302c', realce: '#1f5a52',
             suave: '#5d6b66', cartao: '#ffffff', linha: '#e3ddd2' },
  },
  negocio: {
    nome: 'Negócio local (barbearia, oficina, clínica…)',
    fonte: 'Plus+Jakarta+Sans:wght@400;600;800',
    titulo: "'Plus Jakarta Sans', system-ui, sans-serif",
    corpo: "'Plus Jakarta Sans', system-ui, sans-serif",
    cores: { fundo: '#ffffff', tinta: '#0b1220', realce: '#4f46e5',
             suave: '#5b6472', cartao: '#f8f9fc', linha: '#e6e9ef' },
  },
};

export const POR_TIPO = {
  restaurante: 'restaurante', lanchonete: 'restaurante', pizzaria: 'restaurante',
  hamburgueria: 'restaurante', churrascaria: 'restaurante', bar: 'restaurante',
  padaria: 'restaurante', cafeteria: 'restaurante', 'café': 'restaurante',
  sorveteria: 'restaurante', marmitaria: 'restaurante', pastelaria: 'restaurante',
  hotel: 'hotel', pousada: 'hotel', hostel: 'hotel', resort: 'hotel',
  'chalé': 'hotel', flat: 'hotel',
};

export function modeloDe(tipo) {
  const plano = String(tipo || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  for (const [chave, modelo] of Object.entries(POR_TIPO)) {
    const limpo = chave.normalize('NFKD').replace(/[̀-ͯ]/g, '');
    // Palavra inteira, não pedaço: "bar" dentro de "barbearia" mandava
    // a barbearia para o modelo de restaurante.
    if (new RegExp(`\\b${limpo}\\b`).test(plano)) return modelo;
  }
  return 'negocio';
}

const AVISO = 'Esta página é uma prévia de demonstração criada por {autor} para '
  + 'apresentar uma proposta de site a {nome}. Não é o site oficial do '
  + 'estabelecimento e não tem vínculo com ele. As imagens são ilustrativas.';

/** O que falta para o site ficar completo. Vira recado, nunca palpite. */
export function pendencias(lead) {
  const falta = [];
  if (!lead.endereco) falta.push('endereço (sem ele não dá mapa)');
  if (!so_digitos(lead.whatsapp || lead.telefone)) falta.push('WhatsApp (sem ele não dá botão)');
  if (!lead.horario) falta.push('horário de funcionamento');
  if (!(lead.itens || []).filter(Boolean).length) falta.push('3 itens para a vitrine');
  return falta;
}

function blocoMapa(endereco, cor) {
  if (!endereco) return '';
  const busca = encodeURIComponent(endereco);
  return `
  <div class="mapa">
    <iframe title="Mapa" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=${busca}&output=embed"></iframe>
  </div>
  <p class="nota"><a href="https://www.google.com/maps/search/?api=1&query=${busca}"
     target="_blank" rel="noopener">Abrir no Google Maps</a> — o mapa acima pode
     não carregar em conexões lentas.</p>`;
}

/**
 * Monta o HTML completo. `copy` é o texto escrito pelo agente 3; se ele
 * faltar, o site sai com as frases neutras — feio não fica, e mentira
 * nenhuma entra.
 */
export function montaSite(lead = {}, copy = {}, { tipo = 'demo', autor = '' } = {}) {
  const modelo = lead.modelo && ESTILOS[lead.modelo] ? lead.modelo : modeloDe(lead.tipo);
  const e = ESTILOS[modelo];
  const c = e.cores;
  const demo = tipo !== 'oficial';
  const fone = so_digitos(lead.whatsapp || lead.telefone);
  const nome = escapa(lead.nome) || 'Seu negócio';
  const cidade = escapa(lead.cidade);
  const ramo = escapa(lead.tipo) || 'Negócio local';
  const horario = escapa(lead.horario) || 'Confirme com a casa';
  const itens = (lead.itens || []).filter(Boolean).slice(0, 6).map(escapa);

  const chamada = escapa(copy.chamada) || nome;
  const linha = escapa(copy.linha)
    || (fone ? 'Fale com a gente pelo WhatsApp.' : 'Tudo o que você precisa saber, numa página só.');
  const sobre = escapa(copy.sobre) || '';
  const tituloItens = escapa(copy.titulo_itens) || (modelo === 'hotel' ? 'O que você encontra' : 'O que a gente faz');
  const fecho = escapa(copy.fecho) || (modelo === 'hotel' ? 'Reserve sua data' : 'Vamos conversar?');

  const zap = fone
    ? `https://wa.me/${fone}?text=${encodeURIComponent(`Olá! Vi o site de ${lead.nome || ''} e queria falar com vocês.`)}`
    : '';

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${demo ? '<meta name="robots" content="noindex, nofollow">' : ''}
<title>${nome}${cidade ? ` — ${ramo} em ${cidade}` : ''}</title>
<meta name="description" content="${demo ? `Prévia de demonstração de site para ${nome}.` : `${nome}${cidade ? ` — ${ramo} em ${cidade}` : ''}. ${linha}`}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${e.fonte}&display=swap" rel="stylesheet">
<style>
  :root{--fundo:${c.fundo};--tinta:${c.tinta};--realce:${c.realce};
        --suave:${c.suave};--cartao:${c.cartao};--linha:${c.linha}}
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:var(--fundo);color:var(--tinta);font:400 17px/1.65 ${e.corpo};
       -webkit-font-smoothing:antialiased;overflow-x:hidden}
  h1,h2,h3{font-family:${e.titulo};line-height:1.12;letter-spacing:-.02em}
  a{color:inherit}
  .env{width:min(100% - 32px,1040px);margin-inline:auto}
  .previa{position:sticky;top:0;z-index:40;background:var(--realce);color:#fff;
    font:600 12.5px/1.4 ${e.corpo};letter-spacing:.08em;text-transform:uppercase;
    text-align:center;padding:8px 14px}
  header{padding:64px 0 52px;position:relative;isolation:isolate;overflow:hidden}
  header::before{content:"";position:absolute;inset:0;z-index:-1;
    background:radial-gradient(760px 420px at 12% -10%,color-mix(in srgb,var(--realce) 28%,transparent),transparent 70%)}
  .selo{display:inline-block;font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;
    color:var(--realce);font-weight:600;margin-bottom:16px}
  h1{font-size:clamp(2.4rem,9vw,4.2rem);font-weight:800}
  .sub{margin-top:16px;font-size:clamp(1rem,3.6vw,1.2rem);color:var(--suave);max-width:48ch}
  .acoes{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
  .bt{display:inline-flex;align-items:center;gap:9px;padding:15px 26px;border-radius:999px;
    text-decoration:none;font-weight:600;font-size:16px;transition:transform .15s ease}
  .bt:active{transform:translateY(1px)}
  .bt-1{background:var(--realce);color:${modelo === 'hotel' ? '#fff' : '#1a0e05'}}
  .bt-2{border:1.5px solid var(--linha);color:var(--tinta)}
  section{padding:56px 0}
  .olho{color:var(--realce);font-size:12.5px;letter-spacing:.16em;text-transform:uppercase;
    font-weight:600;margin-bottom:10px}
  h2{font-size:clamp(1.7rem,6vw,2.4rem)}
  .sobre{margin-top:14px;color:var(--suave);max-width:58ch}
  .grade{list-style:none;display:grid;gap:13px;margin-top:26px}
  .grade li{background:var(--cartao);border:1px solid var(--linha);border-radius:14px;
    padding:20px 22px;display:flex;gap:13px;align-items:center}
  .grade li::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--realce);flex:none}
  .item{font-weight:600;font-size:1.08rem}
  .nota{margin-top:14px;font-size:14px;color:var(--suave)}
  .cartoes{display:grid;gap:13px;margin-top:24px}
  .cartao{background:var(--cartao);border:1px solid var(--linha);border-radius:14px;padding:20px}
  .cartao h3{font-family:${e.corpo};font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--realce);margin-bottom:7px;font-weight:600}
  .mapa{margin-top:20px;border:1px solid var(--linha);border-radius:14px;overflow:hidden;line-height:0}
  .mapa iframe{width:100%;height:300px;border:0}
  .fim{background:var(--realce);color:${modelo === 'hotel' ? '#fff' : '#1a0e05'};
    border-radius:22px;padding:46px 28px;text-align:center;margin:8px 0 56px}
  .fim h2{color:inherit}
  .fim .bt-1{background:${modelo === 'hotel' ? '#fbf9f5' : '#1a0e05'};
    color:var(--realce);margin-top:20px}
  footer{border-top:1px solid var(--linha);padding:30px 0 110px;font-size:13.5px;color:var(--suave)}
  .flutua{position:fixed;right:16px;bottom:16px;z-index:50;background:#25D366;color:#06281a;
    border-radius:999px;padding:15px 22px;font-weight:700;text-decoration:none;
    box-shadow:0 10px 28px rgba(0,0,0,.28)}
  @media (min-width:720px){.grade{grid-template-columns:1fr 1fr}
    .cartoes{grid-template-columns:repeat(3,1fr)}section{padding:76px 0}}
  @media (prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto}}
</style>
</head>
<body>
${demo ? '<div class="previa">Prévia · site de demonstração</div>' : ''}
<header class="env">
  <span class="selo">${ramo}${cidade ? ` · ${cidade}` : ''}</span>
  <h1>${chamada}</h1>
  <p class="sub">${linha}</p>
  <div class="acoes">
    ${zap ? `<a class="bt bt-1" href="${zap}">Falar no WhatsApp</a>` : ''}
    ${lead.endereco ? `<a class="bt bt-2" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.endereco)}" target="_blank" rel="noopener">Como chegar</a>` : ''}
  </div>
</header>
${itens.length ? `
<section class="env">
  <p class="olho">${modelo === 'restaurante' ? 'Da casa' : 'Serviços'}</p>
  <h2>${tituloItens}</h2>
  ${sobre ? `<p class="sobre">${sobre}</p>` : ''}
  <ul class="grade">
${itens.map((i) => `    <li><span class="item">${i}</span></li>`).join('\n')}
  </ul>
  <p class="nota">Valores e detalhes: fale com a gente pelo WhatsApp.</p>
</section>` : (sobre ? `
<section class="env">
  <h2>${tituloItens}</h2>
  <p class="sobre">${sobre}</p>
</section>` : '')}
<section class="env">
  <p class="olho">Contato</p>
  <h2>Onde e quando</h2>
  <div class="cartoes">
    ${lead.endereco ? `<div class="cartao"><h3>Endereço</h3><p>${escapa(lead.endereco)}</p></div>` : ''}
    <div class="cartao"><h3>Horário</h3><p>${horario}</p></div>
    ${lead.telefone ? `<div class="cartao"><h3>Telefone</h3><p>${escapa(lead.telefone)}</p></div>` : ''}
  </div>
  ${blocoMapa(lead.endereco, c)}
</section>
<div class="env">
  <div class="fim">
    <h2>${fecho}</h2>
    ${zap ? `<a class="bt bt-1" href="${zap}">Chamar no WhatsApp</a>`
          : '<p>Coloque aqui o contato do negócio.</p>'}
  </div>
</div>
${demo ? `<footer class="env"><p>${escapa(AVISO.replace('{autor}', autor || 'um desenvolvedor local').replace('{nome}', lead.nome || 'este estabelecimento'))}</p></footer>` : ''}
${zap ? `<a class="flutua" href="${zap}" aria-label="Falar no WhatsApp">WhatsApp</a>` : ''}
</body>
</html>`;
}
