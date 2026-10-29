/**
 * A FICHA DO GOOGLE MAPS — tudo o que o Maps mostra da empresa, para o
 * estúdio.
 *
 * Nota, número de avaliações, AS AVALIAÇÕES com o nome de quem escreveu,
 * endereço, horário de cada dia, telefone, faixa de preço, o resumo do
 * Google e as marcações (entrega, retirada, cartão, estacionamento,
 * acessível, pet...). Vai para `_maps/GOOGLE_MAPS.md` na pasta do cliente,
 * e o Sonnet lê esse arquivo junto com os prints do Instagram para
 * escrever o prompt master.
 *
 * DE ONDE VEM
 *
 *   • com a GOOGLE_PLACES_KEY: a Places API oficial, a ficha inteira, com
 *     as avaliações em português. É um pedido por site feito, não por
 *     negócio caçado (na ordem de US$ 25 por mil, dentro da cota grátis).
 *   • sem a chave: o que os caçadores já leram da tela do Maps (nota,
 *     número de avaliações, endereço, telefone, horário, link). Sem o
 *     texto das avaliações — isso a tela da lista não mostra.
 *
 * Lead sem id do Google é achado por "nome + cidade", e a ficha só é
 * aceita se o nome devolvido bater com o do lead: ficha da empresa errada
 * no site é pior que ficha nenhuma.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { texto } from './comum.mjs';

const DETALHES = 'https://places.googleapis.com/v1/places/';
const BUSCA = 'https://places.googleapis.com/v1/places:searchText';

// Tudo o que aparece no painel do Maps. Campo que não existe derruba o
// pedido inteiro com 400: por isso há a lista curta logo abaixo.
export const CAMPOS = [
  'id', 'displayName', 'formattedAddress', 'nationalPhoneNumber',
  'internationalPhoneNumber', 'websiteUri', 'googleMapsUri', 'businessStatus',
  'primaryTypeDisplayName', 'types', 'rating', 'userRatingCount', 'priceLevel',
  'priceRange', 'regularOpeningHours', 'editorialSummary', 'reviews', 'location',
  'delivery', 'dineIn', 'takeout', 'curbsidePickup', 'reservable',
  'servesBreakfast', 'servesBrunch', 'servesLunch', 'servesDinner',
  'servesBeer', 'servesWine', 'servesCocktails', 'servesCoffee',
  'servesDessert', 'servesVegetarianFood', 'menuForChildren',
  'outdoorSeating', 'liveMusic', 'goodForChildren', 'goodForGroups',
  'goodForWatchingSports', 'allowsDogs', 'restroom', 'paymentOptions',
  'parkingOptions', 'accessibilityOptions',
].join(',');

// Se o Google recusar algum campo (renomeado ou fora do plano), a ficha
// sai com estes, que são o coração dela, em vez de não sair.
export const ESSENCIAIS = [
  'id', 'displayName', 'formattedAddress', 'nationalPhoneNumber',
  'internationalPhoneNumber', 'websiteUri', 'googleMapsUri', 'businessStatus',
  'primaryTypeDisplayName', 'rating', 'userRatingCount', 'priceLevel',
  'regularOpeningHours', 'editorialSummary', 'reviews', 'location',
].join(',');

const MARCAS = {
  delivery: 'faz entrega', dineIn: 'consumo no local', takeout: 'retirada',
  curbsidePickup: 'retirada na calçada', reservable: 'aceita reserva',
  servesBreakfast: 'café da manhã', servesBrunch: 'brunch', servesLunch: 'almoço',
  servesDinner: 'jantar', servesBeer: 'cerveja', servesWine: 'vinho',
  servesCocktails: 'drinks', servesCoffee: 'café', servesDessert: 'sobremesa',
  servesVegetarianFood: 'opção vegetariana', menuForChildren: 'cardápio infantil',
  outdoorSeating: 'mesas ao ar livre', liveMusic: 'música ao vivo',
  goodForChildren: 'bom para crianças', goodForGroups: 'bom para grupos',
  goodForWatchingSports: 'transmite jogos', allowsDogs: 'aceita pets', restroom: 'banheiro',
};
const PAGAMENTO = { acceptsCreditCards: 'cartão de crédito', acceptsDebitCards: 'cartão de débito',
  acceptsCashOnly: 'só dinheiro', acceptsNfc: 'aproximação (NFC)' };
const ESTACIONAMENTO = { freeParkingLot: 'estacionamento grátis', paidParkingLot: 'estacionamento pago',
  freeStreetParking: 'vaga na rua grátis', paidStreetParking: 'vaga na rua paga',
  valetParking: 'manobrista', freeGarageParking: 'garagem grátis', paidGarageParking: 'garagem paga' };
const ACESSO = { wheelchairAccessibleParking: 'estacionamento acessível',
  wheelchairAccessibleEntrance: 'entrada acessível', wheelchairAccessibleRestroom: 'banheiro acessível',
  wheelchairAccessibleSeating: 'assento acessível' };
const PRECO = { PRICE_LEVEL_INEXPENSIVE: '$', PRICE_LEVEL_MODERATE: '$$',
  PRICE_LEVEL_EXPENSIVE: '$$$', PRICE_LEVEL_VERY_EXPENSIVE: '$$$$' };

/** A chamada à Places. Erro de HTTP sai com o código no texto ("Places devolveu 400"). */
async function pedePlaces(chave, url, campos, corpo = null) {
  const resposta = await fetch(url, {
    method: corpo ? 'POST' : 'GET',
    headers: { 'content-type': 'application/json', 'X-Goog-Api-Key': chave, 'X-Goog-FieldMask': campos },
    body: corpo ? JSON.stringify(corpo) : undefined,
    signal: AbortSignal.timeout(40_000),
  });
  const bruto = await resposta.text();
  // O corpo de erro do Google não traz a chave: dá para mostrar um pedaço.
  if (!resposta.ok) throw new Error(`Places devolveu ${resposta.status}: ${bruto.slice(0, 200)}`);
  return bruto ? JSON.parse(bruto) : {};
}

const simples = (t) => String(t || '').normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** "Cantina da Vó" e "Cantina da Vó - Ponta Negra" são a mesma; "Churrascaria Gaúcha" não. */
export function mesmoNome(a, b) {
  const x = simples(a);
  const y = simples(b);
  if (!x || !y) return false;
  if (x.includes(y) || y.includes(x)) return true;
  const px = new Set(x.split(' '));
  const py = new Set(y.split(' '));
  const comuns = [...px].filter((p) => py.has(p)).length;
  return comuns / Math.max(1, Math.min(px.size, py.size)) >= 0.7;
}

/** O id do Google que o lead já tenha (o caçador da API guarda; o da tela, às vezes). */
function idDoGoogle(lead) {
  const c = String(lead?.place_id || lead?.google_id || '');
  return /^ChIJ[\w-]{10,}$/.test(c) ? c : '';
}

export async function achaId(chave, lead, pede = pedePlaces) {
  const consulta = [lead?.nome, lead?.endereco || lead?.cidade].filter(Boolean).join(' ');
  const r = await pede(chave, BUSCA, 'places.id,places.displayName',
    { textQuery: consulta, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 5 });
  const certo = (r.places || []).find((p) => mesmoNome(lead?.nome, p.displayName?.text));
  return certo?.id || '';
}

/** O JSON do Google para este lead. Vazio se não achou a empresa. */
export async function fichaDoGoogle(chave, lead, pede = pedePlaces) {
  const id = idDoGoogle(lead) || await achaId(chave, lead, pede);
  if (!id) return {};
  const url = `${DETALHES}${encodeURIComponent(id)}?languageCode=pt-BR&regionCode=BR`;
  try {
    return await pede(chave, url, CAMPOS);
  } catch (e) {
    if (!/devolveu 400/.test(e.message)) throw e;
    return pede(chave, url, ESSENCIAIS);
  }
}

const sim = (grupo, nomes) => Object.entries(grupo || {}).filter(([k, v]) => v === true && nomes[k]).map(([k]) => nomes[k]);

/** A ficha do Google como o Sonnet vai ler: tudo, escrito do jeito do Maps. */
export function markdownDaFicha(f) {
  if (!f || !Object.keys(f).length) return '';
  const nome = f.displayName?.text || '';
  const l = [`# Google Maps — ${nome}`, '',
    'Dados públicos do perfil da empresa no Google Maps, pela API oficial. São de verdade: podem ir para o site como estão.', ''];
  const item = (rotulo, valor) => { if (valor) l.push(`- **${rotulo}:** ${valor}`); };
  item('Categoria', f.primaryTypeDisplayName?.text);
  if (f.rating) item('Nota no Google', `${Number(f.rating).toFixed(1).replace('.', ',')} de 5 (${f.userRatingCount || 0} avaliações)`);
  item('Endereço', f.formattedAddress);
  item('Telefone', f.nationalPhoneNumber);
  item('Site cadastrado', f.websiteUri);
  item('Perfil no Maps', f.googleMapsUri);
  item('Faixa de preço', PRECO[f.priceLevel]);
  if (f.priceRange?.startPrice?.units) {
    const fim = f.priceRange.endPrice?.units;
    item('Gasto por pessoa', `R$ ${f.priceRange.startPrice.units}${fim ? ` a R$ ${fim}` : ' ou mais'}`);
  }
  if (f.businessStatus && f.businessStatus !== 'OPERATIONAL') item('ATENÇÃO', `o Google marca a empresa como ${f.businessStatus}`);
  if (f.editorialSummary?.text) l.push('', '## Resumo do Google', '', f.editorialSummary.text);
  const horas = f.regularOpeningHours?.weekdayDescriptions || [];
  if (horas.length) l.push('', '## Horário de funcionamento', '', ...horas.map((h) => `- ${h}`));
  const marcas = [...Object.keys(MARCAS).filter((k) => f[k] === true).map((k) => MARCAS[k]),
    ...sim(f.paymentOptions, PAGAMENTO), ...sim(f.parkingOptions, ESTACIONAMENTO), ...sim(f.accessibilityOptions, ACESSO)];
  if (marcas.length) l.push('', '## O que o Maps marca', '', ...marcas.map((m) => `- ${m}`));
  const avaliacoes = f.reviews || [];
  if (avaliacoes.length) {
    l.push('', `## Avaliações (${avaliacoes.length} das mais relevantes)`, '',
      'Se for usar no site: o texto como está, com o nome do autor, as estrelas, "avaliação no Google" e o link do perfil no Maps.', '');
    for (const a of avaliacoes) {
      const estrelas = Math.max(0, Math.min(5, Math.round(Number(a.rating) || 0)));
      const quando = a.relativePublishTimeDescription ? ` (${a.relativePublishTimeDescription})` : '';
      const corpo = (a.originalText?.text || a.text?.text || '').trim();
      l.push(`### ${a.authorAttribution?.displayName || 'anônimo'} — ${'★'.repeat(estrelas)}${'☆'.repeat(5 - estrelas)}${quando}`,
        '', corpo || '(só a nota, sem texto)', '');
    }
  }
  return `${l.join('\n').trimEnd()}\n`;
}

/** Sem a chave: o que os caçadores já leram da tela do Maps. */
export function markdownDoCacador(lead) {
  const l = [`# Google Maps — ${texto(lead?.nome, 140)}`, '',
    'Lido da tela do Google Maps pelo caçador. Sem o texto das avaliações: para elas, ponha a GOOGLE_PLACES_KEY em Ajustes › Chaves.', ''];
  const item = (rotulo, valor) => { if (valor) l.push(`- **${rotulo}:** ${valor}`); };
  item('Categoria', texto(lead?.tipo, 60));
  if (lead?.nota) item('Nota no Google', `${String(lead.nota).replace('.', ',')} de 5${lead.avaliacoes ? ` (${lead.avaliacoes} avaliações)` : ''}`);
  item('Endereço', texto(lead?.endereco, 240));
  item('Telefone', texto(lead?.telefone, 40));
  item('Perfil no Maps', texto(lead?.maps, 400));
  item('Horário', texto(lead?.horario, 400));
  const fotos = (Array.isArray(lead?.fotos) ? lead.fotos : []).slice(0, 8);
  if (fotos.length) l.push('', '## Fotos públicas da ficha', '', ...fotos.map((f) => `- ${f}`));
  return `${l.join('\n').trimEnd()}\n`;
}

/**
 * Escreve `_maps/GOOGLE_MAPS.md` (e `_maps/google.json`, quando vem da API)
 * na pasta do cliente. Devolve `{ arquivo, fonte, motivo }` — `fonte` é
 * 'google' ou 'cacador'; `motivo` diz por que não veio do Google.
 * Nunca lança: ficha que falha não para o site.
 */
export async function escreveFicha(lead, pasta, { chave = process.env.GOOGLE_PLACES_KEY, pede, diz = () => {} } = {}) {
  const dir = join(pasta, '_maps');
  await mkdir(dir, { recursive: true });
  const arquivo = join(dir, 'GOOGLE_MAPS.md');
  let motivo = '';
  if (String(chave || '').trim()) {
    try {
      const f = await fichaDoGoogle(String(chave).trim(), lead, pede);
      if (Object.keys(f).length) {
        await writeFile(join(dir, 'google.json'), JSON.stringify(f, null, 2), 'utf8');
        await writeFile(arquivo, markdownDaFicha(f), 'utf8');
        diz(`  · ${lead?.nome}: ficha do Maps — nota ${f.rating ?? '—'}, ${(f.reviews || []).length} avaliações, `
          + `${(f.regularOpeningHours?.weekdayDescriptions || []).length} dias de horário`);
        return { arquivo, fonte: 'google', motivo: '', website: f.websiteUri || '' };
      }
      motivo = 'a empresa não foi achada no Google pelo nome';
    } catch (e) {
      motivo = `a Places API falhou (${texto(e.message, 140)})`;
    }
  } else {
    motivo = 'sem GOOGLE_PLACES_KEY';
  }
  diz(`  · ${lead?.nome}: ficha do Maps só com o que o caçador leu (${motivo})`);
  await writeFile(arquivo, markdownDoCacador(lead), 'utf8');
  return { arquivo, fonte: 'cacador', motivo };
}
