/**
 * CAÇADOR SEM CHAVE — OpenStreetMap, pelo Overpass.
 *
 * POR QUE ISTO EXISTE
 *
 * Você pediu caçador pelo navegador. Robô raspando o Google Maps é
 * contra os termos do Google, e eu não construo isso. O caminho oficial
 * do Google (Places API) funciona, mas exige chave, cartão cadastrado e
 * tem conta no fim do mês.
 *
 * O OpenStreetMap é a terceira saída: dado ABERTO, consulta pública,
 * sem chave, sem cartão, e pensado para ser lido por programa. O preço
 * é a cobertura: no Brasil o OSM tem menos negócio cadastrado que o
 * Google, e vários sem telefone. Em compensação, o que ele tem, tem de
 * graça — e o campo `website` existe, que é tudo que o caçador precisa
 * para separar quem já tem site de quem não tem.
 *
 * Educação com o serviço: ele é mantido por doação. User-Agent que diz
 * quem está chamando, um pedido por vez, e teto de resultados. Quem
 * abusa derruba para todo mundo.
 */
import { texto } from './comum.mjs';

const OVERPASS = ['https://overpass-api.de/api/interpreter',
                  'https://overpass.kumi.systems/api/interpreter'];
const AGENTE = 'matilha/1.0 (caçador de negócios sem site)';

/** O que você escreve → o que o OSM chama aquilo. */
export const RAMOS = {
  restaurante: ['node["amenity"="restaurant"]', 'node["amenity"="fast_food"]'],
  lanchonete: ['node["amenity"="fast_food"]'],
  pizzaria: ['node["cuisine"~"pizza",i]', 'node["amenity"="restaurant"]["name"~"pizz",i]'],
  hamburgueria: ['node["cuisine"~"burger",i]'],
  bar: ['node["amenity"="bar"]', 'node["amenity"="pub"]'],
  cafeteria: ['node["amenity"="cafe"]'],
  padaria: ['node["shop"="bakery"]'],
  sorveteria: ['node["amenity"="ice_cream"]'],
  hotel: ['node["tourism"="hotel"]'],
  pousada: ['node["tourism"="guest_house"]', 'node["tourism"="hotel"]'],
  hostel: ['node["tourism"="hostel"]'],
  barbearia: ['node["shop"="hairdresser"]'],
  salao: ['node["shop"="hairdresser"]', 'node["shop"="beauty"]'],
  oficina: ['node["shop"="car_repair"]'],
  petshop: ['node["shop"="pet"]'],
  clinica: ['node["amenity"="clinic"]', 'node["amenity"="doctors"]'],
  dentista: ['node["amenity"="dentist"]'],
  academia: ['node["leisure"="fitness_centre"]'],
  farmacia: ['node["amenity"="pharmacy"]'],
  mercado: ['node["shop"="supermarket"]', 'node["shop"="convenience"]'],
};

function semAcento(v) {
  return String(v || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Monta a consulta. Ramo que eu não conheço vira busca pelo NOME, que
 *  é pior mas é melhor que não achar nada. */
export function consulta(termo, cidade, quantos = 25) {
  const plano = semAcento(termo);
  const achado = Object.entries(RAMOS).find(([chave]) => plano.includes(chave)
    || semAcento(chave).includes(plano));
  const nome = String(cidade || '').split(',')[0].trim().replace(/"/g, '');
  const alvos = achado
    ? achado[1]
    : [`node["name"~"${plano.replace(/[^a-z0-9 ]/g, '')}",i]`,
       `node["amenity"]["name"~"${plano.replace(/[^a-z0-9 ]/g, '')}",i]`];
  return `[out:json][timeout:25];
area["name"="${nome}"]["boundary"="administrative"]->.cidade;
(
${alvos.map((a) => `  ${a}(area.cidade);`).join('\n')}
);
out body ${Math.min(Math.max(quantos * 3, 10), 120)};`;
}

export function normaliza(elemento) {
  const t = elemento.tags || {};
  const telefone = t.phone || t['contact:phone'] || t['contact:mobile'] || '';
  const site = t.website || t['contact:website'] || t.url || '';
  const rua = [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', ');
  const endereco = [rua, t['addr:suburb'], t['addr:city']].filter(Boolean).join(' - ');
  let pontos = site ? 0 : 5;
  if (telefone) pontos += 3;
  if (endereco) pontos += 1;
  if (t['contact:instagram'] || t['contact:facebook']) pontos += 1;
  return {
    place_id: `osm:${elemento.type}/${elemento.id}`,
    nome: texto(t.name, 140),
    endereco: texto(endereco, 240),
    telefone: texto(telefone, 40),
    whatsapp: String(t['contact:whatsapp'] || telefone || '').replace(/\D/g, ''),
    tipo: texto(t.cuisine || t.amenity || t.shop || t.tourism || '', 60),
    site_achado: texto(site, 300),
    instagram: texto(t['contact:instagram'] || '', 120),
    nota: 0,
    avaliacoes: 0,
    pontuacao: Math.min(pontos, 10),
    presenca: site ? 'tem_site' : 'sem_site_encontrado',
  };
}

export async function caca(termo, cidade, quantos = 25) {
  const corpo = consulta(termo, cidade, quantos);
  let ultimoErro = null;
  for (const servidor of OVERPASS) {
    try {
      const controlador = new AbortController();
      const relogio = setTimeout(() => controlador.abort(), 40_000);
      const resposta = await fetch(servidor, {
        method: 'POST',
        headers: { 'content-type': 'text/plain; charset=utf-8', 'user-agent': AGENTE },
        body: corpo,
        signal: controlador.signal,
      }).finally(() => clearTimeout(relogio));
      if (!resposta.ok) {
        ultimoErro = new Error(`o servidor do OpenStreetMap respondeu HTTP ${resposta.status}`);
        continue;
      }
      const dados = await resposta.json();
      const todos = (dados.elements || []).map(normaliza).filter((l) => l.nome);
      const semSite = todos.filter((l) => l.presenca === 'sem_site_encontrado');
      return {
        fonte: 'openstreetmap',
        achados: todos.length,
        descartados_com_site: todos.length - semSite.length,
        leads: semSite.sort((a, b) => b.pontuacao - a.pontuacao).slice(0, quantos),
        aviso: 'Dados do OpenStreetMap: de graça e sem chave, mas com menos '
          + 'negócio cadastrado que o Google. Não achar site aqui é indício, '
          + 'não prova — confira antes de afirmar na conversa.',
      };
    } catch (e) {
      ultimoErro = e;
    }
  }
  throw new Error(ultimoErro?.message || 'nenhum servidor do OpenStreetMap respondeu');
}
