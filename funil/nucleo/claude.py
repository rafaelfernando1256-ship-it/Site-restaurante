"""
A PONTE PARA O CLAUDE

Um lugar só para falar com o modelo, para os quatro agentes não terem
cada um a sua gambiarra.

Duas decisões que valem explicação:

SAÍDA VALIDADA POR ESQUEMA. `messages.parse` com um modelo Pydantic faz o
texto voltar já validado. "Peça JSON e dê um json.loads" funciona em 90%
das vezes — e em pipeline que roda sozinho os 10% restantes aparecem às
duas da manhã, no lead que mais valia.

PENSAMENTO ADAPTATIVO. `thinking: {type: 'adaptive'}` deixa o modelo
gastar raciocínio conforme o caso. Escrever a abordagem de uma pizzaria
com 800 avaliações não é o mesmo problema que de um boteco com 11.
"""
from __future__ import annotations

import base64
import mimetypes
import time
from pathlib import Path
from typing import Any, Sequence, TypeVar

from pydantic import BaseModel

E = TypeVar('E', bound=BaseModel)

MODELO = 'claude-opus-5-5'
_cliente_padrao: Any = None


def cliente(chave: str = '') -> Any:
    """Cliente único, reaproveitado. Importa o SDK só quando precisa."""
    global _cliente_padrao
    if _cliente_padrao is None:
        import anthropic
        _cliente_padrao = anthropic.Anthropic(api_key=chave) if chave else anthropic.Anthropic()
    return _cliente_padrao


def _bloco_imagem(caminho: Path) -> dict:
    tipo = mimetypes.guess_type(caminho.name)[0] or 'image/png'
    if tipo not in ('image/png', 'image/jpeg', 'image/gif', 'image/webp'):
        raise ValueError(f'{caminho.name}: formato que a API não aceita ({tipo})')
    return {
        'type': 'image',
        'source': {
            'type': 'base64',
            'media_type': tipo,
            'data': base64.standard_b64encode(caminho.read_bytes()).decode(),
        },
    }


def pede_json(instrucao: str, conteudo: str, esquema: type[E],
              modelo: str | None = None, imagens: Sequence[Path] = (),
              cli: Any = None, max_tokens: int = 8000,
              tentativas: int = 3) -> E:
    """
    Manda instrução + conteúdo (+ imagens) e devolve uma instância do
    esquema, já validada. `cli` existe para teste: qualquer objeto com
    `.messages.parse(...)` serve, e aí nada sai para a rede.
    """
    c = cli or cliente()
    partes: list[Any] = [_bloco_imagem(Path(i)) for i in imagens]
    partes.append({'type': 'text', 'text': conteudo})

    espera = 2.0
    for t in range(tentativas):
        try:
            r = c.messages.parse(
                model=modelo or MODELO,
                max_tokens=max_tokens,
                system=instrucao,
                thinking={'type': 'adaptive'},
                output_format=esquema,
                messages=[{'role': 'user', 'content': partes}],
            )
            saida = r.parsed_output
            if saida is None:
                raise RuntimeError(f'o modelo parou sem resposta (stop_reason={r.stop_reason})')
            return saida
        except Exception as e:
            nome = type(e).__name__
            # Sobrecarga e limite de taxa passam; erro de chave ou de
            # pedido mal formado não melhora esperando.
            temporario = nome in ('APIConnectionError', 'APITimeoutError',
                                  'RateLimitError', 'InternalServerError',
                                  'APIStatusError', 'OverloadedError')
            if temporario and t < tentativas - 1:
                time.sleep(espera)
                espera *= 2
                continue
            raise
    raise RuntimeError('o modelo não respondeu')


def pede_texto(instrucao: str, conteudo: str, modelo: str | None = None,
               cli: Any = None, max_tokens: int = 8000) -> str:
    """Resposta em texto corrido, em fluxo — para quando a saída é longa."""
    c = cli or cliente()
    with c.messages.stream(
        model=modelo or MODELO,
        max_tokens=max_tokens,
        system=instrucao,
        thinking={'type': 'adaptive'},
        messages=[{'role': 'user', 'content': conteudo}],
    ) as fluxo:
        final = fluxo.get_final_message()
    return '\n'.join(b.text for b in final.content if getattr(b, 'type', '') == 'text').strip()
