"""
A PONTE PARA O MODELO

Um lugar só para falar com o modelo, para os quatro agentes não terem
cada um a sua gambiarra — e para trocar de modelo não virar quatro
mudanças.

Dois provedores, a mesma função. O `pede_json` recebe um esquema Pydantic
e devolve uma instância validada, venha do Claude ou do Gemini. Quem
chama não sabe de qual.

SAÍDA VALIDADA POR ESQUEMA, sempre. "Peça JSON e dê um json.loads"
funciona em 90% das vezes — e num pipeline que roda sozinho os 10%
restantes aparecem às duas da manhã, no lead que mais valia. Os dois
provedores têm saída estruturada nativa, e é ela que está em uso:
`messages.parse` no Claude, `response_schema` no Gemini.
"""
from __future__ import annotations

import base64
import mimetypes
import time
from pathlib import Path
from typing import Any, Sequence, TypeVar

from pydantic import BaseModel

E = TypeVar('E', bound=BaseModel)

MODELO_CLAUDE = 'claude-opus-5-5'
MODELO_GEMINI = 'gemini-3.8-flash'

ACEITOS = ('image/png', 'image/jpeg', 'image/gif', 'image/webp')

_claude: Any = None
_gemini: Any = None

TEMPORARIOS = ('APIConnectionError', 'APITimeoutError', 'RateLimitError',
               'InternalServerError', 'APIStatusError', 'OverloadedError',
               'ServerError', 'ConnectError', 'ReadTimeout')

# O nome da exceção muda entre SDKs e entre versões; o texto do erro é mais
# estável. "Sobrecarga" e "cota" passam; chave errada, não.
TEXTO_TEMPORARIO = ('UNAVAILABLE', '503', '529', 'RESOURCE_EXHAUSTED',
                    'high demand', 'overloaded', 'try again later',
                    'DEADLINE_EXCEEDED', 'INTERNAL')


def cliente_claude(chave: str = '') -> Any:
    global _claude
    if _claude is None:
        import anthropic
        _claude = anthropic.Anthropic(api_key=chave) if chave else anthropic.Anthropic()
    return _claude


def cliente_gemini(chave: str = '') -> Any:
    global _gemini
    if _gemini is None:
        from google import genai
        _gemini = genai.Client(api_key=chave) if chave else genai.Client()
    return _gemini


# compatibilidade com quem ainda chama pelo nome antigo
cliente = cliente_claude


def _tipo(caminho: Path) -> str:
    tipo = mimetypes.guess_type(caminho.name)[0] or 'image/png'
    if tipo not in ACEITOS:
        raise ValueError(f'{caminho.name}: formato que a API não aceita ({tipo})')
    return tipo


def _bloco_imagem(caminho: Path) -> dict:
    return {
        'type': 'image',
        'source': {'type': 'base64', 'media_type': _tipo(caminho),
                   'data': base64.standard_b64encode(caminho.read_bytes()).decode()},
    }


# ── Claude ──────────────────────────────────────────────────────────
def _json_claude(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens):
    c = cli or cliente_claude()
    partes: list[Any] = [_bloco_imagem(Path(i)) for i in imagens]
    partes.append({'type': 'text', 'text': conteudo})
    r = c.messages.parse(
        model=modelo or MODELO_CLAUDE, max_tokens=max_tokens, system=instrucao,
        thinking={'type': 'adaptive'}, output_format=esquema,
        messages=[{'role': 'user', 'content': partes}])
    saida = r.parsed_output
    if saida is None:
        raise RuntimeError(f'o modelo parou sem resposta (stop_reason={r.stop_reason})')
    return saida


# ── Gemini ──────────────────────────────────────────────────────────
_substituto: str = ''        # modelo achado no catálogo, quando o pedido sumiu


def modelos_gemini(cli: Any) -> list[str]:
    nomes = []
    for m in cli.models.list():
        acoes = getattr(m, 'supported_actions', None) or []
        if acoes and 'generateContent' not in acoes:
            continue
        nome = (getattr(m, 'name', '') or '').replace('models/', '')
        if nome:
            nomes.append(nome)
    return nomes


def _melhor_gemini(cli: Any) -> str:
    """O flash mais novo que esta chave pode usar."""
    nomes = modelos_gemini(cli)
    if not nomes:
        raise RuntimeError('nenhum modelo do Gemini disponível para esta chave')
    flashes = [n for n in nomes if 'flash' in n and 'lite' not in n
               and 'thinking' not in n]
    def versao(n: str):
        import re
        nums = re.findall(r'\d+(?:\.\d+)?', n)
        return [float(x) for x in nums] or [0.0]
    return max(flashes or nomes, key=versao)


def _sumiu(e: Exception) -> bool:
    texto = str(e)
    return ('NOT_FOUND' in texto or 'no longer available' in texto
            or 'is not found' in texto)


def _passageiro(e: Exception) -> bool:
    texto = str(e)
    return (type(e).__name__ in TEMPORARIOS
            or any(m in texto for m in TEXTO_TEMPORARIO))


def _reserva(cli: Any, atual: str) -> str:
    """
    Outro modelo que esta chave pode usar, para quando o primeiro está
    congestionado. Sobrecarga costuma ser de um modelo, não da conta — e
    esperar cinco minutos por um flash lotado enquanto outro está livre é
    tempo jogado fora.
    """
    try:
        nomes = [n for n in modelos_gemini(cli) if n != atual]
    except Exception:
        return ''
    if not nomes:
        return ''
    # Mesma família primeiro (um flash troca bem por outro flash), depois
    # qualquer um, sempre o de maior versão.
    familia = 'flash' if 'flash' in atual else 'pro'
    def versao(n):
        import re
        nums = re.findall(r'\d+(?:\.\d+)?', n)
        return [float(x) for x in nums] or [0.0]
    iguais = [n for n in nomes if familia in n and 'lite' not in n]
    return max(iguais or nomes, key=versao)


def _json_gemini(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens):
    from google.genai import types
    global _substituto
    c = cli or cliente_gemini()
    partes: list[Any] = [
        types.Part.from_bytes(data=Path(i).read_bytes(), mime_type=_tipo(Path(i)))
        for i in imagens]
    partes.append(types.Part(text=conteudo))

    config = types.GenerateContentConfig(
        system_instruction=instrucao,
        response_mime_type='application/json',
        response_schema=esquema,
        max_output_tokens=max_tokens,
        # Aqui não existe ferramenta nenhuma; declarar isso desligado tira
        # um aviso do SDK que só assusta quem está lendo a saída.
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True))

    alvo = _substituto or modelo or MODELO_GEMINI
    conteudos = [types.Content(role='user', parts=partes)]
    try:
        r = c.models.generate_content(model=alvo, contents=conteudos, config=config)
    except Exception as e:
        # Duas falhas diferentes resolvem do mesmo jeito: trocar de modelo.
        #   • o nome sumiu do catálogo (conta nova não vê modelo antigo);
        #   • o modelo está congestionado agora (503).
        # Em ambos, perguntar o que existe e refazer é melhor que desistir.
        if _sumiu(e):
            _substituto = _melhor_gemini(c)
            print(f'    (o modelo "{alvo}" não existe para esta chave; '
                  f'usando "{_substituto}" — fixe isso em config.toml)')
        elif _passageiro(e):
            outro = _reserva(c, alvo)
            if not outro:
                raise
            _substituto = outro
            print(f'    ("{alvo}" está sobrecarregado agora; tentando "{outro}")')
        else:
            raise
        r = c.models.generate_content(model=_substituto, contents=conteudos,
                                      config=config)

    saida = getattr(r, 'parsed', None)
    if saida is None:
        # Acontece quando o modelo é cortado por limite de saída: o JSON
        # vem pela metade e o SDK não consegue validar. Dizer "não
        # respondeu" esconderia a causa.
        bruto = (getattr(r, 'text', '') or '')[:300]
        raise RuntimeError('o Gemini não devolveu o JSON esperado'
                           + (f' — veio: {bruto}' if bruto else ''))
    return saida


# ── o que os agentes chamam ─────────────────────────────────────────
def pede_json(instrucao: str, conteudo: str, esquema: type[E],
              modelo: str | None = None, imagens: Sequence[Path] = (),
              cli: Any = None, max_tokens: int = 8000, tentativas: int = 4,
              provedor: str = 'claude') -> E:
    """
    Instrução + conteúdo (+ imagens) → instância do esquema, validada.

    `cli` existe para teste: qualquer objeto com a interface do SDK serve,
    e aí nada sai para a rede.
    """
    faz = _json_gemini if provedor == 'gemini' else _json_claude
    espera = 3.0
    for t in range(tentativas):
        try:
            return faz(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens)
        except Exception as e:
            # Sobrecarga e limite de taxa passam; chave errada ou pedido
            # mal formado não melhora esperando.
            if _passageiro(e) and t < tentativas - 1:
                print(f'    (tentativa {t + 1} falhou: {str(e)[:90]} — '
                      f'esperando {espera:.0f}s)')
                time.sleep(espera)
                espera *= 2
                continue
            raise
    raise RuntimeError('o modelo não respondeu')


def pede_texto(instrucao: str, conteudo: str, modelo: str | None = None,
               cli: Any = None, max_tokens: int = 8000,
               provedor: str = 'claude') -> str:
    if provedor == 'gemini':
        from google.genai import types
        c = cli or cliente_gemini()
        r = c.models.generate_content(
            model=modelo or MODELO_GEMINI, contents=conteudo,
            config=types.GenerateContentConfig(system_instruction=instrucao,
                                               max_output_tokens=max_tokens))
        return (getattr(r, 'text', '') or '').strip()

    c = cli or cliente_claude()
    with c.messages.stream(
        model=modelo or MODELO_CLAUDE, max_tokens=max_tokens, system=instrucao,
        thinking={'type': 'adaptive'}, messages=[{'role': 'user', 'content': conteudo}],
    ) as fluxo:
        final = fluxo.get_final_message()
    return '\n'.join(b.text for b in final.content
                     if getattr(b, 'type', '') == 'text').strip()
