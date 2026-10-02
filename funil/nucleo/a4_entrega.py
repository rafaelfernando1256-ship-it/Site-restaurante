"""
AGENTE 4 — ENTREGA
Recebe o .zip, publica na Netlify e manda o link para o cliente.

A API da Netlify publica um zip direto, sem Git e sem CLI: um POST com o
arquivo no corpo e `Content-Type: application/zip`. Três passos:

  1. cria o projeto na equipe certa (`account_slug`);
  2. envia o zip;
  3. espera o deploy ficar `ready` — e só então existe link para mandar.

O passo 3 é o que mais gente esquece. A resposta do POST volta na hora,
com o deploy em `uploading`/`processing`: mandar o link nesse instante é
mandar o cliente para uma página que ainda não existe.

O NOME DO PROJETO é único em toda a Netlify. `cantina-da-vo` já é de
alguém, com certeza. Por isso vai com sufixo curto derivado do lead —
feio na URL, mas publica de primeira; e o projeto já nasce com domínio
próprio em mente, que é o que o cliente vai querer se fechar.
"""
from __future__ import annotations

import hashlib
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from .modelo import pede_json
from .estado import Estado, Lead, DEMO_PRONTA, PUBLICADO

AGENTE = 'a4_entrega'
API = 'https://api.netlify.com/api/v1'


# ── Netlify ─────────────────────────────────────────────────────────
def _pede(token: str, caminho: str, metodo: str = 'GET', corpo: bytes | None = None,
          tipo: str = 'application/json', tentativas: int = 3) -> Any:
    req = urllib.request.Request(
        f'{API}{caminho}', data=corpo, method=metodo,
        headers={'Authorization': f'Bearer {token}', 'Content-Type': tipo},
    )
    espera = 2.0
    for t in range(tentativas):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                bruto = r.read()
                return json.loads(bruto) if bruto else {}
        except urllib.error.HTTPError as e:
            detalhe = e.read().decode()[:400]
            if e.code == 401:
                raise RuntimeError('a Netlify recusou o token (401). '
                                   'Gere outro em app.netlify.com/user/applications') from e
            if e.code in (429, 500, 502, 503) and t < tentativas - 1:
                time.sleep(espera)
                espera *= 2
                continue
            raise RuntimeError(f'Netlify {metodo} {caminho} → {e.code}: {detalhe}') from e
        except urllib.error.URLError as e:
            if t < tentativas - 1:
                time.sleep(espera)
                espera *= 2
                continue
            raise RuntimeError(f'não consegui falar com a Netlify: {e}') from e
    raise RuntimeError('a Netlify não respondeu')


def equipes(token: str) -> list[dict]:
    return _pede(token, '/accounts')


def confere_equipe(token: str, slug: str) -> str:
    """Falha agora, com a lista do que existe, em vez de criar na equipe errada."""
    achadas = equipes(token)
    nomes = [a.get('slug', '') for a in achadas]
    if slug in nomes:
        return slug
    raise RuntimeError(
        f'a equipe "{slug}" não aparece nas suas contas da Netlify.\n'
        f'O que existe: {", ".join(n for n in nomes if n) or "(nenhuma)"}'
    )


def nome_projeto(lead: Lead) -> str:
    """Nome de projeto válido: minúsculo, sem acento, com sufixo para não colidir."""
    import unicodedata
    sem_acento = unicodedata.normalize('NFKD', lead.nome).encode('ascii', 'ignore').decode()
    base = re.sub(r'[^a-z0-9]+', '-', sem_acento.lower()).strip('-')[:28].strip('-')
    sufixo = hashlib.sha1(f'{lead.place_id}{lead.id}'.encode()).hexdigest()[:6]
    return f'{base or "demo"}-{sufixo}'


def cria_projeto(token: str, nome: str, equipe: str) -> dict:
    return _pede(token, f'/{equipe}/sites', 'POST',
                 json.dumps({'name': nome}).encode())


def sobe_zip(token: str, site_id: str, zip_: Path) -> dict:
    return _pede(token, f'/sites/{site_id}/deploys', 'POST',
                 zip_.read_bytes(), tipo='application/zip')


def espera_pronto(token: str, deploy_id: str, limite: int = 300) -> dict:
    """
    Espera o deploy virar `ready`. Sem isto, o link vai antes do site.
    """
    fim = time.time() + limite
    espera = 3.0
    ultimo: dict = {}
    while time.time() < fim:
        ultimo = _pede(token, f'/deploys/{deploy_id}')
        estado = ultimo.get('state', '')
        if estado == 'ready':
            return ultimo
        if estado == 'error':
            raise RuntimeError('a Netlify marcou o deploy como erro: '
                               + str(ultimo.get('error_message', ''))[:300])
        time.sleep(espera)
        espera = min(espera * 1.4, 15)
    raise RuntimeError(f'o deploy {deploy_id} não ficou pronto em {limite}s '
                       f'(último estado: {ultimo.get("state", "?")})')


def publica(token: str, lead: Lead, zip_: Path, equipe: str,
            site_id: str = '') -> tuple[str, str]:
    """Devolve (url, site_id). Reaproveita o projeto se o lead já tiver um."""
    if not site_id:
        projeto = cria_projeto(token, nome_projeto(lead), equipe)
        site_id = projeto['id']
    deploy = sobe_zip(token, site_id, zip_)
    pronto = espera_pronto(token, deploy['id'])
    url = (pronto.get('ssl_url') or pronto.get('url')
           or f'https://{nome_projeto(lead)}.netlify.app')
    return url, site_id


# ── A mensagem de entrega ───────────────────────────────────────────
class Entrega(BaseModel):
    mensagem: str = Field(description='A mensagem com o link, pronta para o WhatsApp.')


ENTREGA_INSTRUCAO = """Você escreve a mensagem que entrega um site de exemplo \
pronto, no WhatsApp, para o dono do restaurante que pediu para ver.

Regras:
- Mande o link primeiro ou logo na primeira linha. É o que ele quer.
- Diga em uma frase o que ele vai encontrar lá.
- Diga, sem rodeio, o que ficou em branco porque você não tinha o dado \
(a lista vem no pedido). Isso não é fraqueza: é o que mostra que nada foi inventado \
e dá a ele um motivo concreto para responder.
- Avise que é um exemplo, que o site não aparece no Google e que o conteúdo \
é editável.
- Termine com uma pergunta curta, aberta, sobre o que ele mudaria.
- No máximo 5 linhas. Português do Brasil falado. Nada de "atenciosamente", \
nada de preço — preço é a conversa seguinte, puxada por ele.

Responda só com o JSON pedido."""


def entrega(est: Estado, cfg, limite: int = 10, cli: Any = None) -> dict[str, Any]:
    """Publica tudo que está pronto e enfileira a mensagem com o link."""
    conta: dict[str, Any] = {'publicadas': 0, 'falhas': 0, 'links': []}
    equipe = confere_equipe(cfg.netlify, cfg.equipe_netlify)

    for l in est.leads(DEMO_PRONTA, limite=limite):
        d = est.demo(l.id)
        if not d or not d['zip']:
            conta['falhas'] += 1
            est.anota(AGENTE, 'erro', l.id, 'sem zip registrado')
            continue
        zip_ = Path(d['zip'])
        if not zip_.exists():
            conta['falhas'] += 1
            est.guarda_demo(l.id, situacao='falhou', erro=f'zip não existe: {zip_}')
            print(f'  ✗ {l.nome}: não achei {zip_}')
            continue
        try:
            print(f'  publicando {l.nome} ({zip_.stat().st_size // 1024} KB)...')
            url, site_id = publica(cfg.netlify, l, zip_, equipe, d['site_id'] or '')
            est.guarda_demo(l.id, url=url, site_id=site_id, situacao='publicado', erro='')

            pendencias = _pendencias(Path(d['pasta'])) if d['pasta'] else []
            r: Entrega = pede_json(
                instrucao=ENTREGA_INSTRUCAO,
                conteudo=(f'Restaurante: {l.nome} ({l.cidade})\n'
                          f'Link do exemplo: {url}\n'
                          f'O que ficou em branco por falta de dado:\n'
                          + ('\n'.join(f'- {p}' for p in pendencias) or '- (nada)')),
                esquema=Entrega, modelo=cfg.modelo_do_cerebro, cli=cli,
                provedor=cfg.provedor,
            )
            msg_id = est.guarda_mensagem(l.id, 'entrega', r.mensagem.strip())
            est.move(l.id, PUBLICADO, AGENTE, url)
            conta['publicadas'] += 1
            conta['links'].append({'lead': l.nome, 'url': url, 'msg_id': msg_id,
                                   'lead_id': l.id})
            print(f'  ✓ {l.nome}: {url}')
        except Exception as e:
            conta['falhas'] += 1
            est.guarda_demo(l.id, situacao='falhou', erro=str(e)[:500])
            est.anota(AGENTE, 'erro', l.id, str(e)[:300])
            print(f'  ✗ {l.nome}: {e}')
    return conta


def _pendencias(pasta: Path) -> list[str]:
    """O que o agente 3 marcou como 'não sei' — é o que a mensagem assume."""
    arquivo = pasta / 'leitura.json'
    if not arquivo.exists():
        return []
    try:
        return list(json.loads(arquivo.read_text(encoding='utf-8')).get('nao_sei', []))
    except Exception:
        return []
