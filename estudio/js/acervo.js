/* ------------------------------------------------------------------
   O ACERVO — imagem com licença comercial, buscada do navegador.

   Pixabay e Unsplash. Sem Pexels: eles suspenderam a emissão de chaves
   novas em out/2026. Sem Pinterest: é mural de imagem de terceiro, e
   usar aquilo em vídeo monetizado é o que derruba conta depois que ela
   já está faturando.

   A FOTO DO CELULAR É A PRIMEIRA OPÇÃO, NÃO O PLANO B

   Foto que você tirou não tem pergunta de licença, não depende de cota,
   não contamina o canvas (arquivo local é mesma origem) — e é mais
   autêntica que banco de imagem, que é justamente o que o tratamento
   dark existe para disfarçar. O acervo entra quando você não tem a foto.
   ------------------------------------------------------------------ */

const PIXABAY = 'https://pixabay.com/api/';
const UNSPLASH = 'https://api.unsplash.com/search/photos';

export const ONDE_PEGAR = {
  pixabay: {
    nome: 'Pixabay',
    url: 'https://pixabay.com/api/docs/',
    dica: 'a chave aparece na própria página quando você está logado',
  },
  unsplash: {
    nome: 'Unsplash',
    url: 'https://unsplash.com/developers',
    dica: 'New Application → copie a Access Key (não a Secret)',
  },
};

async function pede(url, cabecalhos = {}) {
  let r;
  try {
    r = await fetch(url, { headers: cabecalhos });
  } catch {
    // fetch que falha sem status é quase sempre o navegador barrando a
    // resposta, e a mensagem dele ("Failed to fetch") não explica nada.
    throw new Error('não consegui falar com o acervo daqui. Pode ser a sua '
      + 'internet, ou o provedor não liberar chamada direta de página. '
      + 'Nesse caso use a foto do celular, que sempre funciona.');
  }
  if (r.ok) return r.json();
  if (r.status === 401 || r.status === 403) {
    throw new Error('a chave foi recusada. Confira se copiou inteira.');
  }
  if (r.status === 429) throw new Error('passou da cota deste acervo agora.');
  throw new Error(`o acervo respondeu ${r.status}.`);
}

async function pixabay(termo, quantas, chave) {
  const q = new URLSearchParams({
    key: chave, q: termo, per_page: String(Math.max(3, quantas)),
    orientation: 'vertical',     // a palavra do Pixabay; no Unsplash é portrait
    image_type: 'photo', safesearch: 'true',
  });
  const d = await pede(`${PIXABAY}?${q}`);
  return (d.hits || []).map(f => ({
    id: String(f.id), url: f.largeImageURL,
    largura: f.imageWidth, altura: f.imageHeight,
    autor: f.user || '', fonte: 'pixabay', pagina: f.pageURL || '',
  }));
}

async function unsplash(termo, quantas, chave) {
  const q = new URLSearchParams({
    query: termo, per_page: String(quantas), orientation: 'portrait',
  });
  // "Client-ID" é o prefixo só do Unsplash; sem ele é 401 sem explicação.
  const d = await pede(`${UNSPLASH}?${q}`, { Authorization: `Client-ID ${chave}` });
  return (d.results || []).map(f => ({
    id: f.id, url: f.urls.regular, largura: f.width, altura: f.height,
    autor: f.user?.name || '', fonte: 'unsplash',
    pagina: f.links?.html || '',
  }));
}

const ACERVOS = { pixabay, unsplash };

export function configurados(chaves) {
  return Object.keys(ACERVOS).filter(n => (chaves?.[n] || '').trim());
}

/* Busca nos acervos que tiverem chave, até juntar o pedido. Não para no
   primeiro que falha: cota estourada às onze da noite é rotina, e o
   ponto de ter dois é esse. */
export async function busca(termo, quantas, chaves) {
  const quais = configurados(chaves);
  if (!quais.length) {
    throw new Error('nenhum acervo configurado — ponha uma chave em Ajustes, '
      + 'ou use a foto do celular.');
  }
  const achadas = [];
  const problemas = [];
  for (const nome of quais) {
    if (achadas.length >= quantas) break;
    try {
      achadas.push(...await ACERVOS[nome](
        termo, quantas - achadas.length, chaves[nome].trim()));
    } catch (e) {
      problemas.push(`${nome}: ${e.message}`);
    }
  }
  if (!achadas.length && problemas.length) throw new Error(problemas.join(' · '));
  return achadas.slice(0, quantas);
}
