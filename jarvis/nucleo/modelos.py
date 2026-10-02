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


def resolve_modelo_gemini(cli: Any, preferido: str) -> tuple[str, str]:
    """
    O catálogo da Google muda de nome com frequência, e um id que não
    existe mais só aparece como 404 no meio da primeira frase. Aqui a
    lista é consultada uma vez e, se o preferido sumiu, escolhe-se o
    flash mais novo — dizendo que trocou.
    """
    try:
        nomes = modelos_gemini(cli)
    except Exception:
        return preferido, ''
    if not nomes or preferido in nomes:
        return preferido, ''
    flashes = sorted((n for n in nomes if 'flash' in n and 'lite' not in n), reverse=True)
    escolhido = flashes[0] if flashes else sorted(nomes, reverse=True)[0]
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


def pergunta_gemini(pergunta: str, chave: str, modelo: str = 'gemini-2.5-flash') -> str:
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
