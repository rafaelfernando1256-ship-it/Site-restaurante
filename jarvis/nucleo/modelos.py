"""
OS MODELOS

Um modelo é o cérebro: é ele que decide o que fazer e usa as ferramentas.
Pode ser o Claude, o Gemini, o OpenRouter ou o Groq — quem manda é
`provedor` no config.toml. Os outros entram como **ferramenta**, não como
cérebro paralelo —
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
_modelo_groq: str = ''

# Todo pedido sai identificado. Não é educação: o Cloudflare na frente da
# API do Groq RECUSA o User-Agent padrão do Python (`Python-urllib/3.x`)
# com 403 e código 1010 — "browser signature banned" — antes de olhar a
# chave. O erro parece chave inválida e não é; nenhuma chave passaria.
# Qualquer User-Agent próprio resolve, e identificar o cliente é o que um
# cliente de API bem-comportado faz de todo jeito.
AGENTE_HTTP = ('jarvis/1.0 '
               '(+https://github.com/rafaelfernando1256-ship-it/Site-restaurante)')

ROTA = 'https://openrouter.ai/api/v1'
GROQ = 'https://api.groq.com/openai/v1'

# Ordem de preferência quando o modelo do OpenRouter não foi escolhido à
# mão. Quem vai dirigir ferramenta precisa seguir esquema bem.
GOSTO = ('claude', 'gpt-5', 'gpt-4o', 'gemini', 'llama', 'mistral')

# No Groq o critério é o mesmo, com outro catálogo: aqui o Jarvis tem 51
# ferramentas na mão, e modelo que não sabe chamar ferramenta responde
# texto onde devia agir. Kimi e gpt-oss são os que dirigem direito.
GOSTO_GROQ = ('kimi', 'gpt-oss', 'llama-4', 'llama-3.3', 'qwen', 'llama')

# Transcritor, censor e voz moram no mesmo catálogo e não servem de
# cérebro. Pedir ferramenta a um deles rende 400, não resposta.
EVITA = ('embed', 'moderation', 'vision-only', 'whisper', 'tts', 'guard',
         'safeguard', 'rerank', 'playai')

# Os dois falam o dialeto da OpenAI, então é um código só. O que muda é
# o endereço, a variável de ambiente e onde se pega a chave.
DIALETOS: dict[str, dict[str, Any]] = {
    'openrouter': {'base': ROTA, 'nome': 'OpenRouter', 'env': 'OPENROUTER_API_KEY',
                   'chaves': 'openrouter.ai/keys', 'gosto': GOSTO},
    'groq': {'base': GROQ, 'nome': 'Groq', 'env': 'GROQ_API_KEY',
             'chaves': 'console.groq.com/keys', 'gosto': GOSTO_GROQ},
}


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


# ── OpenRouter e Groq: o dialeto da OpenAI ──────────────────────────
def dialeto_pede(caminho: str, chave: str, corpo: dict | None = None,
                 tempo: int = 180, provedor: str = 'openrouter') -> Any:
    """HTTPS puro: os dois falam o dialeto da OpenAI."""
    import json
    import urllib.error
    import urllib.request
    d = DIALETOS[provedor]
    nome = d['nome']
    req = urllib.request.Request(
        f'{d["base"]}{caminho}',
        data=json.dumps(corpo).encode() if corpo is not None else None,
        headers={'Authorization': f'Bearer {chave}',
                 'Content-Type': 'application/json',
                 'User-Agent': AGENTE_HTTP,
                 'X-Title': 'Jarvis'},
        method='POST' if corpo is not None else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=tempo) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        detalhe = e.read().decode()[:300]
        if e.code == 401:
            raise RuntimeError(f'o {nome} recusou a chave — {d["chaves"]}') from e
        if e.code == 402:
            raise RuntimeError(f'sem crédito no {nome}. Há modelos grátis em '
                               'openrouter.ai/models?q=free') from e
        if e.code == 403 and '1010' in detalhe:
            raise RuntimeError(
                f'o Cloudflare na frente do {nome} recusou o pedido (403/1010) '
                'por causa da identificação do cliente, não da sua chave.') from e
        if e.code == 429:
            # No plano grátis do Groq são 30 por minuto. Repassar o
            # retry-after evita o "tentei de novo e deu o mesmo erro".
            espera = (getattr(e, 'headers', None) or {}).get('retry-after', '')
            quanto = f' Tente em {espera}s.' if espera else ''
            raise RuntimeError(f'{nome}: limite de requisições estourado.'
                               f'{quanto}') from e
        raise RuntimeError(f'{nome} {e.code}: {detalhe}') from e
    except urllib.error.URLError as e:
        raise RuntimeError(f'não consegui falar com o {nome} — '
                           f'confira a sua internet ({e.reason})') from e


def rota_pede(caminho: str, chave: str, corpo: dict | None = None,
              tempo: int = 180) -> Any:
    return dialeto_pede(caminho, chave, corpo, tempo, 'openrouter')


def groq_pede(caminho: str, chave: str, corpo: dict | None = None,
              tempo: int = 180) -> Any:
    return dialeto_pede(caminho, chave, corpo, tempo, 'groq')


def _canal(provedor: str):
    """
    A função de rede do provedor, resolvida na HORA da chamada — é o que
    deixa o teste trocar por um falso e rodar o caminho inteiro sem rede.
    """
    return groq_pede if provedor == 'groq' else rota_pede


def modelos_dialeto(chave: str, provedor: str = 'openrouter') -> list[str]:
    d = _canal(provedor)('/models', chave)
    return [m['id'] for m in d.get('data', []) if m.get('id')]


def modelo_dialeto(chave: str, preferido: str = '',
                   provedor: str = 'openrouter') -> str:
    """
    O melhor modelo que esta chave alcança. Vai ao catálogo uma vez: id
    de modelo muda de nome e desaparece nos dois, igual ao da Google.
    """
    global _modelo_rota, _modelo_groq
    if preferido:
        return preferido
    guardado = _modelo_groq if provedor == 'groq' else _modelo_rota
    if guardado:
        return guardado
    d = DIALETOS[provedor]
    nomes = modelos_dialeto(chave, provedor)
    if not nomes:
        raise RuntimeError(f'nenhum modelo disponível nesta chave do {d["nome"]}')
    uteis = [n for n in nomes if not any(x in n.lower() for x in EVITA)]
    escolhido = (uteis or nomes)[0]
    for marca in d['gosto']:
        cand = [n for n in uteis if marca in n.lower()]
        if cand:
            escolhido = max(cand, key=_versao)
            break
    if provedor == 'groq':
        _modelo_groq = escolhido
    else:
        _modelo_rota = escolhido
    return escolhido


# nomes antigos, para não quebrar quem já importa
def modelos_rota(chave: str) -> list[str]:
    return modelos_dialeto(chave, 'openrouter')


def modelo_rota(chave: str, preferido: str = '') -> str:
    return modelo_dialeto(chave, preferido, 'openrouter')


def modelos_groq(chave: str) -> list[str]:
    return modelos_dialeto(chave, 'groq')


def modelo_groq(chave: str, preferido: str = '') -> str:
    return modelo_dialeto(chave, preferido, 'groq')
