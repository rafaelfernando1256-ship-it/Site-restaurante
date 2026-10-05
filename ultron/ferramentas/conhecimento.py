"""Perguntar ao GPT e ao Gemini, e comparar as três respostas."""
from __future__ import annotations

from pydantic import BaseModel, Field

from nucleo.modelos import pergunta_gemini, pergunta_gpt
from nucleo.permissao import LIVRE
from . import Contexto, ferramenta


class PerguntaArgs(BaseModel):
    pergunta: str = Field(description='A pergunta, completa e sem depender de contexto.')


@ferramenta('perguntar_ao_gpt', 'Faz uma pergunta ao ChatGPT e devolve a resposta dele.',
            PerguntaArgs, nivel=LIVRE, resumo=lambda a: 'perguntar ao GPT')
def perguntar_ao_gpt(a: PerguntaArgs, ctx: Contexto) -> str:
    return pergunta_gpt(a.pergunta, ctx.cfg.openai, ctx.cfg.modelo_gpt)


@ferramenta('perguntar_ao_gemini', 'Faz uma pergunta ao Gemini e devolve a resposta dele.',
            PerguntaArgs, nivel=LIVRE, resumo=lambda a: 'perguntar ao Gemini')
def perguntar_ao_gemini(a: PerguntaArgs, ctx: Contexto) -> str:
    return pergunta_gemini(a.pergunta, ctx.cfg.gemini, ctx.cfg.modelo_gemini)


@ferramenta('ouvir_os_tres',
            'Faz a MESMA pergunta ao ChatGPT e ao Gemini e devolve as duas respostas, '
            'para comparar com a sua própria.', PerguntaArgs, nivel=LIVRE,
            resumo=lambda a: 'perguntar ao GPT e ao Gemini')
def ouvir_os_tres(a: PerguntaArgs, ctx: Contexto) -> str:
    g = pergunta_gpt(a.pergunta, ctx.cfg.openai, ctx.cfg.modelo_gpt)
    m = pergunta_gemini(a.pergunta, ctx.cfg.gemini, ctx.cfg.modelo_gemini)
    return f'=== ChatGPT ===\n{g}\n\n=== Gemini ===\n{m}'
