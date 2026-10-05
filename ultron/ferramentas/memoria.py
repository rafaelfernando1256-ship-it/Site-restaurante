"""
MEMÓRIA

O que ele lembra entre sessões, e o que ele fez hoje.

Lembrete é FATO, não transcrição: "o contador se chama Edson", "a pasta
dos contratos é D:\\Trabalho\\Contratos". Guardar conversa inteira enche
o contexto e piora a resposta; guardar fato melhora.
"""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field

from nucleo.permissao import LIVRE
from . import Contexto, ferramenta


class LembrarArgs(BaseModel):
    assunto: str = Field(description='Chave curta, ex: "contador" ou "pasta dos contratos".')
    fato: str = Field(description='O que lembrar, em uma frase.')


@ferramenta('lembrar', 'Guarda um fato para lembrar nas próximas conversas.', LembrarArgs,
            nivel=LIVRE, resumo=lambda a: f'lembrar que {a.assunto}: {a.fato[:60]}')
def lembrar(a: LembrarArgs, ctx: Contexto) -> str:
    if ctx.diario is None:
        return 'sem diário ligado'
    ctx.diario.lembra(a.assunto.strip().lower(), a.fato.strip())
    return f'guardado: {a.assunto} — {a.fato}'


class EsquecerArgs(BaseModel):
    assunto: str


@ferramenta('esquecer', 'Apaga um fato que estava guardado.', EsquecerArgs,
            nivel=LIVRE, resumo=lambda a: f'esquecer "{a.assunto}"')
def esquecer(a: EsquecerArgs, ctx: Contexto) -> str:
    if ctx.diario is None:
        return 'sem diário ligado'
    return ('esqueci' if ctx.diario.esquece(a.assunto.strip().lower())
            else f'eu não tinha nada guardado sobre "{a.assunto}"')


class NadaArgs(BaseModel):
    pass


@ferramenta('o_que_voce_fez', 'Conta o que o Ultron fez hoje: tudo fica registrado.',
            NadaArgs, nivel=LIVRE, resumo=lambda a: 'contar o que fiz hoje')
def o_que_voce_fez(a: NadaArgs, ctx: Contexto) -> str:
    if ctx.diario is None:
        return 'sem diário ligado'
    r = ctx.diario.resumo_do_dia()
    if not r['total']:
        return 'hoje eu ainda não fiz nada'
    linhas = [f'{r["total"]} ações hoje:']
    for item in sorted(r['por_ferramenta'], key=lambda x: -x['n']):
        linhas.append(f'  {item["ferramenta"]} — {item["n"]} ({item["decisao"]})')
    linhas.append('\nÚltimas:')
    for l in ctx.diario.ultimas(10, desde=r['desde']):
        hora = datetime.fromtimestamp(l['quando']).strftime('%H:%M')
        linhas.append(f'  {hora} {l["ferramenta"]} [{l["decisao"]}] '
                      f'{(l["resultado"] or "")[:90]}')
    return '\n'.join(linhas)
