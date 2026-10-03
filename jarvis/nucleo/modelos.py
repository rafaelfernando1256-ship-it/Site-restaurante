"""
OS MODELOS

O Claude é o cérebro: é ele que decide o que fazer e usa as ferramentas.
O GPT e o Gemini entram como **ferramenta**, não como cérebro paralelo —
você pergunta "o que o Gemini acha disso?" e o Claude vai lá perguntar.

Por que não três cérebros discutindo: três modelos decidindo o que fazer
na sua máquina é três vezes a chance de alguém decidir errado, e ninguém
responsável pelo resultado. Um decide; os outros opinam quando chamados.
"""
from __future__ import annotations

import time
from typing import Any, TypeVar

from pydantic import BaseModel

E = TypeVar('E', bound=BaseModel)

_claude: Any = None
_gemini: Any = None
_modelo_rota: str = ''

ROTA = 'https://openrouter.ai/api/v1'

# Ordem de preferência quando o modelo do OpenRouter não foi escolhido à
# mão. Quem vai dirigir ferramenta precisa seguir esquema bem.
GOSTO = ('claude', 'gpt-5', 'gpt-4o', 'gemini', 'llama', 'mistral')


def claude(chave: str = '') -> Any:
    global _claude
    if _claude is None:
        import anthropic
        _claude = anthropic.Anthropic(api_key=chave) if chave else anthropic.Anthropic()
    return _claude


TEMPORARIOS = ('APIConnectionError', 'APITimeoutError', 'RateLimitError',
               'InternalServerError', 'OverloadedError')


def pede_json(instrucao: str, conteudo: str, esquema: type[E], modelo: str,
              cli: Any = None, max_tokens: int = 8000, tentativas: int = 3) -> E:
    """Saída validada por esquema. `cli` permite teste sem rede."""
    c = cli or claude()
    espera = 2.0
    for t in range(tentativas):
        try:
            r = c.messages.parse(
                model=modelo, max_tokens=max_tokens, system=instrucao,
                thinking={'type': 'adaptive'}, output_format=esquema,
                messages=[{'role': 'user', 'content': conteudo}])
            if r.parsed_output is None:
                raise RuntimeError(f'o modelo parou sem resposta ({r.stop_reason})')
            return r.parsed_output
        except Exception as e:
            if type(e).__name__ in TEMPORARIOS and t < tentativas - 1:
                time.sleep(espera)
                espera *= 2
                continue
            raise
    raise RuntimeError('o modelo não respondeu')


def gemini(chave: str = '') -> Any:
    global _gemini
    if _gemini is None:
        from google import genai
        _gemini = genai.Client(api_key=chave) if chave else genai.Client()
    return _gemini


def modelos_gemini(cli: Any) -> list[str]:
    """Os modelos que esta chave pode usar para gerar texto."""
    nomes = []
    for m in cli.models.list():
        acoes = getattr(m, 'supported_actions', None) or []
        if acoes and 'generateContent' not in acoes:
            continue
        nome = (getattr(m, 'name', '') or '').replace('models/', '')
        if nome:
            nomes.append(nome)
    return nomes


def _versao(nome: str) -> list[float]:
    """Ordena por número, não por letra: 10.1 vem depois de 3.8."""
    import re
    nums = re.findall(r'\d+(?:\.\d+)?', nome)
    return [float(x) for x in nums] or [0.0]


def resolve_modelo_gemini(cli: Any, preferido: str) -> tuple[str, str]:
    """
    O catálogo da Google aposenta nome de modelo sem avisar, e quem abriu
    conta ontem não enxerga o que quem abriu ano passado enxerga. Um id
    que sumiu só aparece como 404 no meio da primeira frase. Aqui a lista
    é consultada uma vez e, se o preferido não está nela, escolhe-se o
    flash mais novo — dizendo que trocou.
    """
    try:
        nomes = modelos_gemini(cli)
    except Exception:
        return preferido, ''
    if not nomes or preferido in nomes:
        return preferido, ''
    flashes = [n for n in nomes if 'flash' in n and 'lite' not in n
               and 'thinking' not in n]
    escolhido = max(flashes or nomes, key=_versao)
    return escolhido, f'"{preferido}" não existe nesta conta; usando "{escolhido}"'


# ── os outros dois ──────────────────────────────────────────────────
def pergunta_gpt(pergunta: str, chave: str, modelo: str = 'gpt-4o') -> str:
    if not chave:
        return 'falta OPENAI_API_KEY no .env'
    try:
        from openai import OpenAI
    except ImportError:
        return 'falta instalar: pip install openai'
    try:
        c = OpenAI(api_key=chave)
        r = c.chat.completions.create(
            model=modelo, messages=[{'role': 'user', 'content': pergunta}])
        return (r.choices[0].message.content or '').strip()
    except Exception as e:
        return f'o GPT não respondeu: {e}'


def pergunta_gemini(pergunta: str, chave: str, modelo: str = 'gemini-3.8-flash') -> str:
    if not chave:
        return 'falta GEMINI_API_KEY no .env'
    try:
        from google import genai      # noqa: F401
    except ImportError:
        return 'falta instalar: pip install google-genai'
    try:
        c = gemini(chave)
        r = c.models.generate_content(model=modelo, contents=pergunta)
        return (r.text or '').strip()
    except Exception as e:
        return f'o Gemini não respondeu: {e}'


# ── OpenRouter ──────────────────────────────────────────────────────
def rota_pede(caminho: str, chave: str, corpo: dict | None = None,
              tempo: int = 180) -> Any:
    """HTTPS puro: a API do OpenRouter fala o dialeto da OpenAI."""
    import json
    import urllib.error
    import urllib.request
    req = urllib.request.Request(
        f'{ROTA}{caminho}',
        data=json.dumps(corpo).encode() if corpo is not None else None,
        headers={'Authorization': f'Bearer {chave}',
                 'Content-Type': 'application/json',
                 'X-Title': 'Jarvis'},
        method='POST' if corpo is not None else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=tempo) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode()[:300]
        if e.code == 401:
            raise RuntimeError('o OpenRouter recusou a chave — openrouter.ai/keys') from e
        if e.code == 402:
            raise RuntimeError('sem crédito no OpenRouter. Há modelos grátis em '
                               'openrouter.ai/models?q=free') from e
        raise RuntimeError(f'OpenRouter {e.code}: {detalhe}') from e
    except urllib.error.URLError as e:
        raise RuntimeError('não consegui falar com o OpenRouter — '
                           f'confira a sua internet ({e.reason})') from e


def modelos_rota(chave: str) -> list[str]:
    d = rota_pede('/models', chave)
    return [m['id'] for m in d.get('data', []) if m.get('id')]


def modelo_rota(chave: str, preferido: str = '') -> str:
    """
    O melhor modelo que esta chave alcança. Vai ao catálogo uma vez: id
    de modelo no OpenRouter muda de nome e desaparece, igual ao da Google.
    """
    global _modelo_rota
    if preferido:
        return preferido
    if _modelo_rota:
        return _modelo_rota
    nomes = modelos_rota(chave)
    if not nomes:
        raise RuntimeError('nenhum modelo disponível nesta chave do OpenRouter')
    for marca in GOSTO:
        cand = [n for n in nomes if marca in n.lower()
                and not any(x in n.lower() for x in ('embed', 'moderation', 'vision-only'))]
        if cand:
            _modelo_rota = max(cand, key=_versao)
            return _modelo_rota
    _modelo_rota = nomes[0]
    return _modelo_rota
