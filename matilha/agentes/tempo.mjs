/**
 * A PREVISÃO DO TEMPO DO "BOM DIA" — Open-Meteo (open-meteo.com), grátis
 * e sem chave. A cidade é a que você disse ao Jarvis uma vez ("eu moro em
 * Maringá"); ele guarda as coordenadas e pergunta só se não souber.
 *
 * Os números vêm do serviço como estão: o Jarvis só transforma em fala.
 */
import { texto } from './comum.mjs';

// Os códigos de tempo da Organização Meteorológica Mundial (WMO), como o Open-Meteo devolve.
const CODIGOS = {
  0: 'céu limpo', 1: 'quase sem nuvens', 2: 'parcialmente nublado', 3: 'nublado',
  45: 'neblina', 48: 'neblina com geada',
  51: 'garoa fraca', 53: 'garoa', 55: 'garoa forte', 56: 'garoa congelante', 57: 'garoa congelante forte',
  61: 'chuva fraca', 63: 'chuva', 65: 'chuva forte', 66: 'chuva congelante', 67: 'chuva congelante forte',
  71: 'neve fraca', 73: 'neve', 75: 'neve forte', 77: 'grãos de neve',
  80: 'pancadas de chuva fracas', 81: 'pancadas de chuva', 82: 'pancadas de chuva fortes',
  85: 'pancadas de neve', 86: 'pancadas de neve fortes',
  95: 'trovoadas', 96: 'trovoadas com granizo', 97: 'trovoadas fortes com granizo', 99: 'trovoadas fortes com granizo',
};
export const comoEsta = (codigo) => CODIGOS[codigo] ?? 'tempo variável';

async function pede(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!r.ok) throw new Error(`o serviço do tempo respondeu ${r.status}`);
  return r.json();
}

/** "Maringá" → { nome, estado, pais, lat, lon }. Procura primeiro no Brasil. */
export async function achaCidade(nome) {
  const q = encodeURIComponent(texto(nome, 80).trim());
  if (!q) throw new Error('falta o nome da cidade');
  const base = `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=5&language=pt&format=json`;
  let r = await pede(`${base}&countryCode=BR`);
  if (!r.results?.length) r = await pede(base);
  const c = r.results?.[0];
  if (!c) throw new Error(`não achei a cidade "${texto(nome, 60)}"`);
  return { nome: c.name, estado: c.admin1 || '', pais: c.country || '', lat: c.latitude, lon: c.longitude };
}

/** A chance de chuva de manhã, à tarde e à noite de um dia (as horas do próprio lugar). */
function periodos(hourly, dia) {
  const faixas = { manha: [6, 12], tarde: [12, 18], noite: [18, 24] };
  const saida = {};
  for (const [nome, [de, ate]] of Object.entries(faixas)) {
    const vals = (hourly?.time || []).map((t, i) => [t, hourly.precipitation_probability?.[i]])
      .filter(([t, v]) => t.startsWith(dia) && Number(t.slice(11, 13)) >= de && Number(t.slice(11, 13)) < ate && typeof v === 'number')
      .map(([, v]) => v);
    if (vals.length) saida[nome] = Math.max(...vals);
  }
  return saida;
}

/** A previsão: agora, hoje e amanhã. */
export async function previsao(cidade) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${cidade.lat}&longitude=${cidade.lon}`
    + '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max'
    + '&hourly=precipitation_probability&timezone=auto&forecast_days=3';
  const r = await pede(url);
  const d = r.daily || {};
  const dia = (i) => (d.time?.[i] ? {
    data: d.time[i],
    como: comoEsta(d.weather_code?.[i]),
    maxima: d.temperature_2m_max?.[i],
    minima: d.temperature_2m_min?.[i],
    chance_de_chuva: d.precipitation_probability_max?.[i],
    chuva_mm: d.precipitation_sum?.[i],
    uv_max: d.uv_index_max?.[i],
    chance_de_chuva_por_periodo: periodos(r.hourly, d.time[i]),
  } : null);
  return {
    cidade: [cidade.nome, cidade.estado].filter(Boolean).join(', '),
    agora: r.current ? {
      temperatura: r.current.temperature_2m, sensacao: r.current.apparent_temperature,
      como: comoEsta(r.current.weather_code), vento_kmh: r.current.wind_speed_10m,
    } : null,
    hoje: dia(0),
    amanha: dia(1),
    unidades: 'temperaturas em °C, chuva em mm, chance em %',
    fonte: 'Open-Meteo',
  };
}

/** Uma linha curta para a tela do bom dia. */
export function linhaDoTempo(p) {
  if (!p?.hoje) return '';
  const g = (v) => `${Math.round(v)}°`;
  const chuva = p.hoje.chance_de_chuva >= 30 ? `, ${p.hoje.chance_de_chuva}% de chance de chuva` : '';
  return `${p.cidade}: ${p.agora ? `${g(p.agora.temperatura)} agora, ${p.agora.como}. ` : ''}Hoje ${g(p.hoje.minima)} a ${g(p.hoje.maxima)}${chuva}.`;
}
