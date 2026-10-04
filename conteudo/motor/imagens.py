"""
AS IMAGENS — busca em acervo com licença comercial, nunca raspagem.

POR QUE NÃO PINTEREST

O Pinterest é mural: quase toda imagem ali é de terceiro, com direito
autoral de quem fez. Baixar e pôr num TikTok monetizado e num e-book que
se vende é infração, e raspar o site viola os Termos deles. Não é
tecnicalidade — é o que derruba conta, desmonetiza e vira notificação
depois que você já está faturando.

Os três acervos aqui têm licença de uso comercial explícita e API de
verdade. Mesma imagem, mesmo trabalho, sem a bomba-relógio:

  Pexels    uso comercial liberado, sem atribuição obrigatória
  Pixabay   idem
  Unsplash  idem (pede crédito por educação, não por licença)

O Pinterest continua servindo para uma coisa: referência. Você monta o
painel do que quer, descreve em palavra-chave, e a busca traz equivalente
licenciado.

TRÊS PROVEDORES, UMA INTERFACE

Mesmo padrão do funil: se um cair ou a cota acabar, o próximo responde. A
chave de cada um é grátis e sai em dois minutos.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path

AGENTE_HTTP = ('conteudo-ebook/1.0 '
               '(+https://github.com/rafaelfernando1256-ship-it/Site-restaurante)')

# Vertical primeiro: o destino é TikTok, 1080x1920. Pedir paisagem e
# cortar depois joga fora a parte boa de toda foto.
ORIENTACAO = 'portrait'


@dataclass
class Foto:
    """Uma foto achada. `credito` existe para você poder dar crédito."""
    id: str
    url: str
    largura: int
    altura: int
    autor: str
    fonte: str
    pagina: str

    @property
    def vertical(self) -> bool:
        return self.altura >= self.largura


class SemChave(RuntimeError):
    """Nenhum acervo configurado. A mensagem diz onde pegar cada chave."""


ONDE_PEGAR = {
    'pexels': 'pexels.com/api/new — grátis, 200 buscas/hora',
    'pixabay': 'pixabay.com/api/docs — grátis, 100 por minuto',
    'unsplash': 'unsplash.com/developers — grátis, 50/hora no modo demo',
}


def _pede(url: str, cabecalhos: dict, tempo: int = 30) -> dict:
    req = urllib.request.Request(
        url, headers={'User-Agent': AGENTE_HTTP, **cabecalhos})
    try:
        with urllib.request.urlopen(req, timeout=tempo) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode()[:200]
        if e.code in (401, 403):
            raise RuntimeError(f'chave recusada ({e.code}): {detalhe}') from e
        if e.code == 429:
            raise RuntimeError('passou da cota deste acervo agora') from e
        raise RuntimeError(f'{e.code}: {detalhe}') from e
    except urllib.error.URLError as e:
        raise RuntimeError(f'sem internet? ({e.reason})') from e


def _pexels(termo: str, quantas: int, chave: str) -> list[Foto]:
    d = _pede(
        'https://api.pexels.com/v1/search?'
        + urllib.parse.urlencode({'query': termo, 'per_page': quantas,
                                  'orientation': ORIENTACAO}),
        {'Authorization': chave})
    return [Foto(id=str(f['id']), url=f['src']['large2x'],
                 largura=f['width'], altura=f['height'],
                 autor=f.get('photographer', ''), fonte='pexels',
                 pagina=f.get('url', ''))
            for f in d.get('photos', [])]


def _pixabay(termo: str, quantas: int, chave: str) -> list[Foto]:
    d = _pede('https://pixabay.com/api/?' + urllib.parse.urlencode({
        'key': chave, 'q': termo, 'per_page': max(3, quantas),
        'orientation': 'vertical', 'image_type': 'photo',
        'safesearch': 'true'}), {})
    return [Foto(id=str(f['id']), url=f['largeImageURL'],
                 largura=f['imageWidth'], altura=f['imageHeight'],
                 autor=f.get('user', ''), fonte='pixabay',
                 pagina=f.get('pageURL', ''))
            for f in d.get('hits', [])]


def _unsplash(termo: str, quantas: int, chave: str) -> list[Foto]:
    d = _pede(
        'https://api.unsplash.com/search/photos?'
        + urllib.parse.urlencode({'query': termo, 'per_page': quantas,
                                  'orientation': ORIENTACAO}),
        {'Authorization': f'Client-ID {chave}'})
    return [Foto(id=f['id'], url=f['urls']['regular'],
                 largura=f['width'], altura=f['height'],
                 autor=(f.get('user') or {}).get('name', ''), fonte='unsplash',
                 pagina=(f.get('links') or {}).get('html', ''))
            for f in d.get('results', [])]


ACERVOS = {'pexels': (_pexels, 'PEXELS_API_KEY'),
           'pixabay': (_pixabay, 'PIXABAY_API_KEY'),
           'unsplash': (_unsplash, 'UNSPLASH_ACCESS_KEY')}


def chaves_configuradas() -> list[str]:
    return [nome for nome, (_, var) in ACERVOS.items() if os.environ.get(var)]


def busca(termo: str, quantas: int = 6, acervo: str = '') -> list[Foto]:
    """
    Procura nos acervos que tiverem chave, na ordem, até juntar o pedido.

    Não para no primeiro que falha: cota estourada num acervo às onze da
    noite é rotina, e o ponto de ter três é justamente esse.
    """
    disponiveis = [acervo] if acervo else chaves_configuradas()
    if not disponiveis:
        raise SemChave(
            'nenhum acervo configurado. Pegue UMA chave (todas grátis) e '
            'ponha no .env:\n'
            + '\n'.join(f'  {ACERVOS[n][1]}={"":<10} {ONDE_PEGAR[n]}'
                        for n in ACERVOS))
    achadas: list[Foto] = []
    problemas: list[str] = []
    for nome in disponiveis:
        if len(achadas) >= quantas:
            break
        faz, var = ACERVOS[nome]
        chave = os.environ.get(var, '')
        if not chave:
            continue
        try:
            achadas += faz(termo, quantas - len(achadas), chave)
        except RuntimeError as e:
            problemas.append(f'{nome}: {e}')
    if not achadas and problemas:
        raise RuntimeError('nenhum acervo respondeu — ' + ' · '.join(problemas))
    return achadas[:quantas]


def baixa(foto: Foto, destino: Path) -> Path:
    """Baixa para o disco. O nome carrega a fonte, para o crédito não sumir."""
    destino.mkdir(parents=True, exist_ok=True)
    caminho = destino / f'{foto.fonte}-{foto.id}.jpg'
    if caminho.exists():
        return caminho
    req = urllib.request.Request(foto.url, headers={'User-Agent': AGENTE_HTTP})
    with urllib.request.urlopen(req, timeout=60) as r:
        caminho.write_bytes(r.read())
    # O crédito fica ao lado do arquivo. Licença que dispensa atribuição
    # não impede você de dar: é o que te protege se alguém reclamar.
    creditos = destino / 'creditos.json'
    tudo = json.loads(creditos.read_text()) if creditos.exists() else {}
    tudo[caminho.name] = {'autor': foto.autor, 'fonte': foto.fonte,
                          'pagina': foto.pagina}
    creditos.write_text(json.dumps(tudo, ensure_ascii=False, indent=2))
    return caminho
