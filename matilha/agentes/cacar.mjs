/**
 * AGENTE 1 · CAÇADOR — acha negócio sem site.
 *
 * DUAS FONTES, e a escolha é sua:
 *
 *   openstreetmap (padrão)  de graça, sem chave, dado aberto. Menos
 *                           negócio cadastrado no Brasil, e vários sem
 *                           telefone — mas custa zero e roda hoje.
 *   places                  a API oficial do Google. Acha mais e melhor,
 *                           exige chave com cartão cadastrado, e a
 *                           consulta com o campo do site cai no nível
 *                           pago depois de 1.000 por mês.
 *
 * Nenhuma das duas RASPA nada. Robô lendo o Google Maps é contra os
 * termos do Google, e quem paga é a conta de quem roda.
 *
 * Sobre a Places API: NÃO raspa o Maps nem o Instagram:
 * raspagem é proibida pelos termos dos dois, e é o tipo de coisa que
 * derruba a conta depois que ela já está dando dinheiro.
 *
 * O campo que interessa é o `websiteUri`. Ele existir é prova de que o
 * negócio TEM site; ele faltar é INDÍCIO de que não tem — a Places pode
 * simplesmente não saber. Essa diferença vai junto no lead, porque é
 * ela que decide o que você pode dizer na primeira mensagem.
 *
 * Atenção à conta: pedir `websiteUri` na máscara de campos joga a busca
 * no nível Enterprise da Places (1.000 grátis por mês, e depois cobra).
 * Sem ele não dá para saber quem tem site, então o custo é o preço da
 * pergunta — mas é melhor você saber disso por aqui do que pela fatura.
 */
import { corpo, destranca, erro, pedeJson, responde, texto } from './comum.mjs';

const CAMPOS = [
  'places.id', 'places.displayName', 'places.formattedAddress',
  'places.nationalPhoneNumber', 'places.internationalPhoneNumber',
  'places.websiteUri', 'places.rating', 'places.userRatingCount',
  'places.primaryTypeDisplayName',
].join(',');

/** Nota de 0 a 10: quem vale a sua prévia primeiro.
 *  Movimento vale mais que tamanho — casa com avaliação é casa que se
 *  importa com imagem, e é com ela que a conversa começa mais quente. */
export function pontua(lugar) {
  let p = 0;
  p += lugar.websiteUri ? 0 : 4;
  const avaliacoes = Number(lugar.userRatingCount || 0);
  p += avaliacoes >= 200 ? 3 : avaliacoes >= 50 ? 2 : avaliacoes >= 10 ? 1 : 0;
  const nota = Number(lugar.rating || 0);
  p += nota >= 4.3 ? 2 : nota >= 3.8 ? 1 : 0;
  p += lugar.nationalPhoneNumber ? 1 : 0;
  return Math.min(p, 10);
}

export function normaliza(lugar) {
  const telefone = lugar.internationalPhoneNumber || lugar.nationalPhoneNumber || '';
  return {
    place_id: texto(lugar.id, 120),
    nome: texto(lugar.displayName?.text, 140),
    endereco: texto(lugar.formattedAddress, 240),
    telefone: texto(telefone, 40),
    whatsapp: String(telefone || '').replace(/\D/g, ''),
    tipo: texto(lugar.primaryTypeDisplayName?.text, 60),
    site_achado: texto(lugar.websiteUri, 300),
    nota: Number(lugar.rating || 0),
    avaliacoes: Number(lugar.userRatingCount || 0),
    pontuacao: pontua(lugar),
    // A frase que você pode dizer sem mentir, escrita aqui para não ser
    // reinventada (errada) na hora da mensagem.
    presenca: lugar.websiteUri ? 'tem_site' : 'sem_site_encontrado',
  };
}

export default async (req) => {
  if (req.method !== 'POST') return erro('Use POST.', 405);
  const trancado = destranca(req);
  if (trancado) return trancado;

  let dados;
  try { dados = await corpo(req); } catch (e) { return erro(e.message); }

  const termo = texto(dados.termo, 120);
  const cidade = texto(dados.cidade, 120);
  if (!termo || !cidade) return erro('Informe o ramo e a cidade.');
  const quantos = Math.min(Math.max(Number(dados.quantos) || 20, 1), 25);

  const chave = (process.env.GOOGLE_PLACES_KEY || '').trim();
  // Sem chave, vai de OpenStreetMap: o caçador funciona hoje, de graça.
  const fonte = dados.fonte || (chave ? 'places' : 'openstreetmap');
  if (fonte === 'openstreetmap') {
    const { caca } = await import('./osm.mjs');
    try {
      return responde(await caca(termo, cidade, quantos));
    } catch (e) {
      return erro(`O caçador do OpenStreetMap não respondeu. (${e.message})`, 502);
    }
  }
  if (!chave) {
    return erro('Para caçar pelo Google falta GOOGLE_PLACES_KEY no .env. '
      + 'Sem ela, use a fonte OpenStreetMap — que é o padrão.', 503);
  }

  let resposta;
  try {
    resposta = await pedeJson('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': chave,
        'X-Goog-FieldMask': CAMPOS,
      },
      body: JSON.stringify({
        textQuery: `${termo} em ${cidade}`,
        languageCode: 'pt-BR',
        regionCode: 'BR',
        maxResultCount: quantos,
      }),
    });
  } catch (e) {
    const dica = e.status === 403
      ? ' Confira se a "Places API (New)" está ativada e se a restrição da chave permite esta API.'
      : '';
    return erro(`O caçador não conseguiu buscar.${dica} (${e.message})`, 502);
  }

  const todos = (resposta.places || []).map(normaliza);
  const sem_site = todos.filter((l) => l.presenca === 'sem_site_encontrado');
  return responde({
    fonte: 'google_places',
    achados: todos.length,
    leads: sem_site.sort((a, b) => b.pontuacao - a.pontuacao),
    descartados_com_site: todos.length - sem_site.length,
    aviso: 'Não achar site aqui é indício, não prova. Confira antes de afirmar '
      + 'na conversa que o negócio não tem site.',
  });
};
