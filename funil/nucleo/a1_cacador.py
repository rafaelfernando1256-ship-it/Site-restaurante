"""
AGENTE 1 — CAÇADOR
Acha restaurante sem site e entrega com telefone e Instagram.

FONTE: Google Places API (New), oficial. Raspar o Maps viola os Termos,
quebra toda semana e dá bloqueio de IP. A API custa — na ordem de
US$ 32 por mil buscas e US$ 17 por mil detalhes, com cota grátis
mensal — e é barata no volume de quem prospecta à mão.

O FILTRO QUE IMPORTA
O campo `websiteUri` da Places API quase nunca é só "tem ou não tem".
Restaurante pequeno costuma cadastrar como "site" o link do Instagram,
do Linktree ou do iFood. Isso separa os leads em quatro grupos, e três
deles são cliente:

  sem_presenca  campo vazio      → não tem nada. Precisa de tudo.
  so_rede       instagram/face/  → TEM público e TEM foto, só não tem
                linktree           onde mandar quem procura no Google.
                                   É o MELHOR lead: a demonstração se
                                   monta sozinha com o Instagram dele.
  so_delivery   ifood/goomer/    → paga comissão para ter presença.
                anota.ai           O argumento de margem fecha sozinho.
  tem_site      outro domínio    → descarta.

O Instagram vem de graça quando `websiteUri` é um link do Instagram —
que é exatamente o caso do melhor lead. Nos outros, fica em branco e
você preenche à mão; não invento handle.
"""
from __future__ import annotations

import json
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass

from .estado import Estado
from .modelo import AGENTE_HTTP

ENDERECO = 'https://places.googleapis.com/v1/places:searchText'

# Campos pedidos explicitamente: a Places API cobra por campo pedido, e
# pedir tudo multiplica a conta sem servir para nada.
CAMPOS = ','.join([
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.rating',
    'places.userRatingCount',
    'places.primaryTypeDisplayName',
    'places.businessStatus',
    'places.googleMapsUri',
    'nextPageToken',
])

REDES = ('instagram.com', 'facebook.com', 'fb.com', 'linktr.ee', 'linktree',
         'beacons.ai', 'linkbio', 'bio.link')
DELIVERY = ('ifood.com', 'goomer.app', 'goomer.com', 'anota.ai', 'cardapioweb',
            'delivery.much', 'ubereats', 'rappi', 'aiqfome')


@dataclass
class Achado:
    place_id: str
    nome: str
    telefone: str
    telefone_e164: str
    endereco: str
    categoria: str
    nota: float
    avaliacoes: int
    presenca: str
    url_achada: str
    instagram: str
    pontuacao: int
    mapa: str


def classifica(url: str) -> str:
    if not url:
        return 'sem_presenca'
    u = url.lower()
    if any(r in u for r in REDES):
        return 'so_rede'
    if any(d in u for d in DELIVERY):
        return 'so_delivery'
    return 'tem_site'


def instagram_de(url: str) -> str:
    """Extrai o @ quando a 'URL do site' é um perfil do Instagram."""
    if not url or 'instagram.com' not in url.lower():
        return ''
    m = re.search(r'instagram\.com/+([A-Za-z0-9._]+)', url, re.I)
    if not m:
        return ''
    handle = m.group(1).strip('/.')
    # Caminhos do próprio Instagram não são perfil.
    if handle.lower() in {'p', 'reel', 'reels', 'explore', 'stories', 'tv', 'accounts'}:
        return ''
    return handle


def e164(telefone_internacional: str) -> str:
    """+55 84 98765-4321 → 5584987654321. Só dígitos, sem o '+'."""
    return re.sub(r'\D', '', telefone_internacional or '')


def pontua(a: dict, presenca: str) -> int:
    """
    Nota de 0 a 10. Prioriza quem tem movimento e material, porque a
    demonstração sai melhor e a conversa começa mais quente:
      • presença só em rede vale mais que nenhuma (já tem foto pronta);
      • muita avaliação = casa que funciona e que se importa com imagem;
      • nota muito baixa tira ponto: a dor dele não é o site.
    """
    p = 0
    p += {'so_rede': 4, 'so_delivery': 3, 'sem_presenca': 2}.get(presenca, 0)
    n = a.get('userRatingCount') or 0
    p += 3 if n >= 200 else 2 if n >= 50 else 1 if n >= 10 else 0
    nota = a.get('rating') or 0
    p += 2 if nota >= 4.3 else 1 if nota >= 3.8 else 0
    if a.get('nationalPhoneNumber'):
        p += 1
    if (a.get('businessStatus') or 'OPERATIONAL') != 'OPERATIONAL':
        p = 0
    return min(10, p)


def _pede(chave: str, corpo: dict, tentativas: int = 3) -> dict:
    req = urllib.request.Request(
        ENDERECO,
        data=json.dumps(corpo).encode(),
        headers={
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': chave,
            'X-Goog-FieldMask': CAMPOS,
            'User-Agent': AGENTE_HTTP,
        },
    )
    espera = 1.5
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            texto = e.read().decode()[:400]
            # 429 e 5xx valem nova tentativa; 400/403 são erro de chave
            # ou de cota e não melhoram esperando.
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


def busca(chave: str, consulta: str, paginas: int = 3, idioma: str = 'pt-BR',
          regiao: str = 'BR') -> list[Achado]:
    """Uma consulta de texto, paginada. Devolve só o que NÃO tem site."""
    achados: list[Achado] = []
    token = None
    for _ in range(max(1, paginas)):
        corpo = {'textQuery': consulta, 'languageCode': idioma, 'regionCode': regiao}
        if token:
            corpo['pageToken'] = token
        resposta = _pede(chave, corpo)
        for a in resposta.get('places', []):
            url = a.get('websiteUri', '') or ''
            presenca = classifica(url)
            if presenca == 'tem_site':
                continue
            nome = (a.get('displayName') or {}).get('text', '').strip()
            if not nome:
                continue
            achados.append(Achado(
                place_id=a.get('id', ''),
                nome=nome,
                telefone=a.get('nationalPhoneNumber', '') or '',
                telefone_e164=e164(a.get('internationalPhoneNumber', '')),
                endereco=a.get('formattedAddress', '') or '',
                categoria=(a.get('primaryTypeDisplayName') or {}).get('text', ''),
                nota=float(a.get('rating') or 0),
                avaliacoes=int(a.get('userRatingCount') or 0),
                presenca=presenca,
                url_achada=url,
                instagram=instagram_de(url),
                pontuacao=pontua(a, presenca),
                mapa=a.get('googleMapsUri', '') or '',
            ))
        token = resposta.get('nextPageToken')
        if not token:
            break
        # A Places API pede uma pausa antes de aceitar o pageToken.
        time.sleep(2)
    return achados


def caca(est: Estado, chave: str, cidade: str, termos: list[str],
         paginas: int = 3, minimo: int = 4,
         marca: dict | None = None) -> dict[str, int]:
    """
    Roda as buscas, guarda o que serve e deixa tudo em NOVO para o
    agente 2. Lead repetido é atualizado, não duplicado — o place_id é
    único no banco.
    """
    conta = {'achados': 0, 'novos': 0, 'atualizados': 0, 'fracos': 0}
    for termo in termos:
        consulta = f'{termo} em {cidade}'
        print(f'  buscando: {consulta}')
        try:
            for a in busca(chave, consulta, paginas=paginas):
                conta['achados'] += 1
                if a.pontuacao < minimo:
                    conta['fracos'] += 1
                    continue
                _id, novo = est.guarda_lead(
                    place_id=a.place_id, nome=a.nome, telefone=a.telefone,
                    telefone_e164=a.telefone_e164, instagram=a.instagram,
                    endereco=a.endereco, cidade=cidade, categoria=a.categoria,
                    nota=a.nota, avaliacoes=a.avaliacoes, presenca=a.presenca,
                    url_achada=a.url_achada, pontuacao=a.pontuacao,
                    dados={'mapa': a.mapa, 'termo': termo, **(marca or {})},
                )
                conta['novos' if novo else 'atualizados'] += 1
                if novo:
                    est.anota('a1_cacador', 'achou', _id,
                              f'{a.presenca} · nota {a.pontuacao} · {termo}')
        except RuntimeError as e:
            print(f'    ⚠ {e}')
            est.anota('a1_cacador', 'erro', None, str(e)[:300])
    return conta
