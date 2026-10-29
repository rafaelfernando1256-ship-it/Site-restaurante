"""
A FICHA DO GOOGLE MAPS

Tudo o que o Google Maps mostra da empresa, para o estúdio montar o site:
nota, número de avaliações, as avaliações com nome de quem escreveu,
endereço, horário de cada dia, telefone, faixa de preço, o resumo do
Google, e as marcações (entrega, retirada, aceita cartão, estacionamento,
acessível, pet friendly...).

Vai para `GOOGLE_MAPS.md` na pasta do site. O Sonnet lê esse arquivo junto
com os prints do Instagram para escrever o prompt mestre.

DE ONDE VEM

Da Places API (New), a mesma chave do caçador (`GOOGLE_PLACES_KEY`).
Copiar a página do Maps no navegador viola os Termos do Google, quebra a
cada mudança de layout e dá bloqueio de IP; a API devolve os mesmos dados
em JSON, com as avaliações em português.

Lead que veio do caçador já tem o `place_id`. Lead posto à mão (planilha,
`adicionar`, cliente) não tem: aí a ficha é achada pela busca
"nome + cidade", e só é aceita se o nome devolvido bater com o do lead —
ficha da empresa errada no site é pior que ficha nenhuma.

CUSTO

Os detalhes com avaliações estão na faixa mais cara da Places (na ordem de
US$ 25 por mil, dentro da cota grátis mensal). É um pedido por site
construído, não por lead caçado.

AS AVALIAÇÕES NO SITE

São de verdade e de outra pessoa: vão com o nome de quem escreveu, a nota,
a indicação "avaliação no Google" e o link para o perfil no Maps. Nada de
reescrever, encurtar com outras palavras ou escolher só pedaço elogioso
que mude o sentido.
"""
from __future__ import annotations

import json
import re
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from .modelo import AGENTE_HTTP

DETALHES = 'https://places.googleapis.com/v1/places/{}'
BUSCA = 'https://places.googleapis.com/v1/places:searchText'

# Tudo o que aparece no painel do Maps. Pedido campo a campo: a Places
# cobra pela faixa do campo mais caro, e campo que não existe derruba o
# pedido inteiro com 400.
CAMPOS = ','.join([
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
])

# Se o Google recusar algum campo da lista grande (400 — campo renomeado
# ou fora do seu plano), a ficha sai com estes, que são o coração dela,
# em vez de não sair.
ESSENCIAIS = ','.join([
    'id', 'displayName', 'formattedAddress', 'nationalPhoneNumber',
    'internationalPhoneNumber', 'websiteUri', 'googleMapsUri', 'businessStatus',
    'primaryTypeDisplayName', 'rating', 'userRatingCount', 'priceLevel',
    'regularOpeningHours', 'editorialSummary', 'reviews', 'location',
])

# As marcações sim/não do Maps, no português que o painel usa.
MARCAS = {
    'delivery': 'faz entrega', 'dineIn': 'consumo no local', 'takeout': 'retirada',
    'curbsidePickup': 'retirada na calçada', 'reservable': 'aceita reserva',
    'servesBreakfast': 'café da manhã', 'servesBrunch': 'brunch',
    'servesLunch': 'almoço', 'servesDinner': 'jantar', 'servesBeer': 'cerveja',
    'servesWine': 'vinho', 'servesCocktails': 'drinks', 'servesCoffee': 'café',
    'servesDessert': 'sobremesa', 'servesVegetarianFood': 'opção vegetariana',
    'menuForChildren': 'cardápio infantil', 'outdoorSeating': 'mesas ao ar livre',
    'liveMusic': 'música ao vivo', 'goodForChildren': 'bom para crianças',
    'goodForGroups': 'bom para grupos', 'goodForWatchingSports': 'transmite jogos',
    'allowsDogs': 'aceita pets', 'restroom': 'banheiro',
}
PAGAMENTO = {'acceptsCreditCards': 'cartão de crédito', 'acceptsDebitCards': 'cartão de débito',
             'acceptsCashOnly': 'só dinheiro', 'acceptsNfc': 'aproximação (NFC)'}
ESTACIONAMENTO = {'freeParkingLot': 'estacionamento grátis',
                  'paidParkingLot': 'estacionamento pago',
                  'freeStreetParking': 'vaga na rua grátis',
                  'paidStreetParking': 'vaga na rua paga',
                  'valetParking': 'manobrista', 'freeGarageParking': 'garagem grátis',
                  'paidGarageParking': 'garagem paga'}
ACESSO = {'wheelchairAccessibleParking': 'estacionamento acessível',
          'wheelchairAccessibleEntrance': 'entrada acessível',
          'wheelchairAccessibleRestroom': 'banheiro acessível',
          'wheelchairAccessibleSeating': 'assento acessível'}
PRECO = {'PRICE_LEVEL_INEXPENSIVE': '$', 'PRICE_LEVEL_MODERATE': '$$',
         'PRICE_LEVEL_EXPENSIVE': '$$$', 'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'}


def _pede(chave: str, url: str, campos: str, corpo: dict | None = None,
          tentativas: int = 3) -> dict:
    req = urllib.request.Request(
        url, data=json.dumps(corpo).encode() if corpo is not None else None,
        method='POST' if corpo is not None else 'GET',
        headers={'Content-Type': 'application/json', 'X-Goog-Api-Key': chave,
                 'X-Goog-FieldMask': campos, 'User-Agent': AGENTE_HTTP})
    espera = 1.5
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            texto = e.read().decode()[:400]
            if e.code in (429, 500, 502, 503) and t < tentativas - 1:
                time.sleep(espera)
                espera *= 2
                continue
            raise RuntimeError(f'Places devolveu {e.code}: {texto}') from e
        except urllib.error.URLError as e:
            if t < tentativas - 1:
                time.sleep(espera)
                espera *= 2
                continue
            raise RuntimeError(f'não consegui falar com a Places API: {e}') from e
    raise RuntimeError('Places API não respondeu')


def _simples(t: str) -> str:
    t = unicodedata.normalize('NFKD', t or '').encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', ' ', t.lower()).strip()


def mesmo_nome(a: str, b: str) -> bool:
    """'Cantina da Vó Zuleica' e 'Cantina da Vó Zuleica - Ponta Negra' batem."""
    x, y = _simples(a), _simples(b)
    if not x or not y:
        return False
    if x in y or y in x:
        return True
    px, py = set(x.split()), set(y.split())
    return len(px & py) / max(1, min(len(px), len(py))) >= 0.7


def eh_place_id(texto: str) -> bool:
    """O caçador guarda o id do Google; lead à mão guarda 'manual:...' ou 'cliente:...'."""
    return bool(texto) and ':' not in texto and len(texto) >= 15


def acha_id(chave: str, nome: str, cidade: str, pede: Any = _pede) -> str:
    r = pede(chave, BUSCA, 'places.id,places.displayName',
             {'textQuery': f'{nome} {cidade}'.strip(), 'languageCode': 'pt-BR',
              'regionCode': 'BR', 'pageSize': 5})
    for p in r.get('places', []):
        if mesmo_nome(nome, (p.get('displayName') or {}).get('text', '')):
            return p.get('id', '')
    return ''


def ficha(chave: str, lead, pede: Any = _pede) -> dict:
    """O JSON do Google para este lead. Vazio se não achou a empresa."""
    pid = lead.place_id if eh_place_id(lead.place_id) else ''
    if not pid:
        pid = acha_id(chave, lead.nome, lead.cidade, pede=pede)
    if not pid:
        return {}
    url = DETALHES.format(urllib.parse.quote(pid)) + '?languageCode=pt-BR&regionCode=BR'
    try:
        return pede(chave, url, CAMPOS)
    except RuntimeError as e:
        if 'devolveu 400' not in str(e):
            raise
        print(f'    (o Google recusou algum campo; pedindo só os essenciais: {str(e)[:120]})')
        return pede(chave, url, ESSENCIAIS)


def _horarios(f: dict) -> list[str]:
    return list((f.get('regularOpeningHours') or {}).get('weekdayDescriptions') or [])


def _sim(grupo: dict, nomes: dict) -> list[str]:
    return [nomes[k] for k, v in (grupo or {}).items() if v is True and k in nomes]


def markdown(f: dict) -> str:
    """A ficha como o Sonnet vai ler: tudo, e escrito do jeito do Maps."""
    if not f:
        return ''
    nome = (f.get('displayName') or {}).get('text', '')
    linhas = [f'# Google Maps — {nome}', '',
              'Dados públicos do perfil da empresa no Google Maps, tirados pela '
              'API oficial. São de verdade: podem ir para o site como estão.', '']
    def item(rotulo, valor):
        if valor:
            linhas.append(f'- **{rotulo}:** {valor}')
    item('Categoria', (f.get('primaryTypeDisplayName') or {}).get('text', ''))
    if f.get('rating'):
        item('Nota no Google', f'{f["rating"]:.1f}'.replace('.', ',') + ' de 5 '
             f'({f.get("userRatingCount", 0)} avaliações)')
    item('Endereço', f.get('formattedAddress', ''))
    item('Telefone', f.get('nationalPhoneNumber', ''))
    item('Site cadastrado', f.get('websiteUri', ''))
    item('Perfil no Maps', f.get('googleMapsUri', ''))
    item('Faixa de preço', PRECO.get(f.get('priceLevel', ''), ''))
    faixa = f.get('priceRange') or {}
    if faixa.get('startPrice'):
        ini = faixa['startPrice'].get('units', '')
        fim = (faixa.get('endPrice') or {}).get('units', '')
        item('Gasto por pessoa', f'R$ {ini}' + (f' a R$ {fim}' if fim else ' ou mais'))
    if f.get('location'):
        loc = f['location']
        item('Coordenadas', f'{loc.get("latitude")}, {loc.get("longitude")}')
    if f.get('businessStatus') and f['businessStatus'] != 'OPERATIONAL':
        item('ATENÇÃO', f'o Google marca a empresa como {f["businessStatus"]}')
    resumo = (f.get('editorialSummary') or {}).get('text', '')
    if resumo:
        linhas += ['', '## Resumo do Google', '', resumo]
    horarios = _horarios(f)
    if horarios:
        linhas += ['', '## Horário de funcionamento', ''] + [f'- {h}' for h in horarios]
    marcas = [MARCAS[k] for k in MARCAS if f.get(k) is True]
    marcas += _sim(f.get('paymentOptions'), PAGAMENTO)
    marcas += _sim(f.get('parkingOptions'), ESTACIONAMENTO)
    marcas += _sim(f.get('accessibilityOptions'), ACESSO)
    if marcas:
        linhas += ['', '## O que o Maps marca', ''] + [f'- {m}' for m in marcas]
    avaliacoes = f.get('reviews') or []
    if avaliacoes:
        linhas += ['', f'## Avaliações ({len(avaliacoes)} das mais relevantes)', '',
                   'Se for usar no site: o texto como está, com o nome do autor, as '
                   'estrelas, "avaliação no Google" e o link do perfil no Maps.', '']
        for a in avaliacoes:
            autor = (a.get('authorAttribution') or {}).get('displayName', 'anônimo')
            texto = ((a.get('originalText') or a.get('text') or {}).get('text', '')).strip()
            quando = a.get('relativePublishTimeDescription', '')
            estrelas = int(a.get('rating') or 0)
            linhas.append(f'### {autor} — {"★" * estrelas}{"☆" * (5 - estrelas)}'
                          + (f' ({quando})' if quando else ''))
            linhas += ['', texto or '(só a nota, sem texto)', '']
    return '\n'.join(linhas).rstrip() + '\n'

