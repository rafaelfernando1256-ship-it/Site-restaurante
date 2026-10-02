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
MODELO_GEMINI = 'gemini-2.5-flash'

ACEITOS = ('image/png', 'image/jpeg', 'image/gif', 'image/webp')

_claude: Any = None
_gemini: Any = None

TEMPORARIOS = ('APIConnectionError', 'APITimeoutError', 'RateLimitError',
               'InternalServerError', 'APIStatusError', 'OverloadedError',
               'ServerError', 'ConnectError', 'ReadTimeout')


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
def _json_gemini(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens):
    from google.genai import types
    c = cli or cliente_gemini()
    partes: list[Any] = [
        types.Part.from_bytes(data=Path(i).read_bytes(), mime_type=_tipo(Path(i)))
        for i in imagens]
    partes.append(types.Part(text=conteudo))
    r = c.models.generate_content(
        model=modelo or MODELO_GEMINI,
        contents=[types.Content(role='user', parts=partes)],
        config=types.GenerateContentConfig(
            system_instruction=instrucao,
            response_mime_type='application/json',
            response_schema=esquema,
            max_output_tokens=max_tokens))
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
              cli: Any = None, max_tokens: int = 8000, tentativas: int = 3,
              provedor: str = 'claude') -> E:
    """
    Instrução + conteúdo (+ imagens) → instância do esquema, validada.

    `cli` existe para teste: qualquer objeto com a interface do SDK serve,
    e aí nada sai para a rede.
    """
    faz = _json_gemini if provedor == 'gemini' else _json_claude
    espera = 2.0
    for t in range(tentativas):
        try:
            return faz(instrucao, conteudo, esquema, modelo, imagens, cli, max_tokens)
        except Exception as e:
            nome = type(e).__name__
            # Sobrecarga e limite de taxa passam; chave errada ou pedido
            # mal formado não melhora esperando.
            if (nome in TEMPORARIOS or 'RESOURCE_EXHAUSTED' in str(e)) \
                    and t < tentativas - 1:
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
