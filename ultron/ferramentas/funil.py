"""
O FUNIL DE CLIENTES

"Quantos clientes em fase de negociação?" não é uma pergunta para o
WhatsApp — é uma pergunta para o banco do projeto `funil/`, que já sabe
em que ponto cada cliente está. O WhatsApp sabe o que foi dito; o funil
sabe o que isso significa.

A tradução entre o jeito que você fala e o jeito que o banco guarda mora
aqui, num lugar só:
"""
from __future__ import annotations

import sqlite3
from pathlib import Path

from pydantic import BaseModel, Field

from nucleo.permissao import LIVRE
from . import Contexto, ferramenta

FASES = {
    'prospeccao':  ['novo', 'rascunho'],
    'abordados':   ['abordado', 'sem_resposta'],
    'negociacao':  ['respondeu', 'quer_demo', 'demo_pronta'],
    'proposta':    ['demo_pronta', 'publicado'],
    'fechados':    ['fechado'],
    'perdidos':    ['sem_interesse', 'descartado'],
}

APELIDOS = {
    'negociação': 'negociacao', 'negociando': 'negociacao', 'conversa': 'negociacao',
    'andamento': 'negociacao', 'quentes': 'negociacao',
    'prospecção': 'prospeccao', 'novos': 'prospeccao', 'frios': 'prospeccao',
    'contactados': 'abordados', 'abordado': 'abordados',
    'fechado': 'fechados', 'ganhos': 'fechados', 'clientes': 'fechados',
    'perdido': 'perdidos', 'perdeu': 'perdidos',
    'proposta enviada': 'proposta', 'demonstração': 'proposta',
}


def _banco(ctx: Contexto):
    caminho = Path(ctx.cfg.funil_db).expanduser()
    if not caminho.exists():
        return None
    cx = sqlite3.connect(f'file:{caminho}?mode=ro', uri=True, timeout=15)
    cx.row_factory = sqlite3.Row
    return cx


def _fase(nome: str) -> list[str]:
    n = (nome or '').strip().lower()
    n = APELIDOS.get(n, n)
    return FASES.get(n, [])


class NadaArgs(BaseModel):
    pass


@ferramenta('clientes_resumo',
            'Quantos clientes existem em cada fase: prospecção, abordados, negociação, '
            'fechados, perdidos.', NadaArgs, nivel=LIVRE,
            resumo=lambda a: 'olhar o funil de clientes')
def clientes_resumo(a: NadaArgs, ctx: Contexto) -> str:
    cx = _banco(ctx)
    if cx is None:
        return (f'não achei o banco do funil em {ctx.cfg.funil_db}. '
                'Aponte o caminho certo em config.toml (integracoes.funil_db).')
    bruto = {r['estado']: r['n'] for r in
             cx.execute('SELECT estado, COUNT(*) n FROM leads GROUP BY estado')}
    cx.close()
    linhas = [f'{sum(bruto.values())} clientes no funil']
    for fase, estados in FASES.items():
        if fase == 'proposta':
            continue
        n = sum(bruto.get(e, 0) for e in estados)
        if n:
            linhas.append(f'  {fase:<12} {n:>4}   ({", ".join(e for e in estados if bruto.get(e))})')
    return '\n'.join(linhas)


class FaseArgs(BaseModel):
    fase: str = Field(description='negociacao | prospeccao | abordados | fechados | perdidos')
    quantos: int = Field(default=20)


@ferramenta('clientes_na_fase',
            'Lista os clientes que estão numa fase, com telefone e Instagram.',
            FaseArgs, nivel=LIVRE, resumo=lambda a: f'listar clientes em {a.fase}')
def clientes_na_fase(a: FaseArgs, ctx: Contexto) -> str:
    estados = _fase(a.fase)
    if not estados:
        return f'não conheço a fase "{a.fase}". Use: {", ".join(FASES)}'
    cx = _banco(ctx)
    if cx is None:
        return f'não achei o banco do funil em {ctx.cfg.funil_db}'
    marcas = ','.join('?' * len(estados))
    linhas = list(cx.execute(
        f'SELECT nome, cidade, estado, telefone, instagram, pontuacao FROM leads '
        f'WHERE estado IN ({marcas}) ORDER BY pontuacao DESC LIMIT ?',
        estados + [a.quantos]))
    cx.close()
    if not linhas:
        return f'nenhum cliente em {a.fase}'
    saida = [f'{len(linhas)} em {a.fase}:']
    for l in linhas:
        saida.append(f'  {l["nome"]} ({l["cidade"]}) — {l["estado"]}'
                     + (f' · {l["telefone"]}' if l['telefone'] else '')
                     + (f' · @{l["instagram"]}' if l['instagram'] else ''))
    return '\n'.join(saida)


class ClienteArgs(BaseModel):
    nome: str = Field(description='Parte do nome do cliente.')


@ferramenta('cliente_situacao',
            'Conta tudo sobre um cliente: em que fase está, o que foi falado, se tem demo.',
            ClienteArgs, nivel=LIVRE, resumo=lambda a: f'ver a situação de {a.nome}')
def cliente_situacao(a: ClienteArgs, ctx: Contexto) -> str:
    cx = _banco(ctx)
    if cx is None:
        return f'não achei o banco do funil em {ctx.cfg.funil_db}'
    leads = list(cx.execute(
        'SELECT * FROM leads WHERE nome LIKE ? ORDER BY pontuacao DESC LIMIT 5',
        (f'%{a.nome}%',)))
    if not leads:
        cx.close()
        return f'não achei cliente com "{a.nome}" no nome'
    saida = []
    for l in leads:
        saida.append(f'{l["nome"]} ({l["cidade"]}) — fase: {l["estado"]}')
        saida.append(f'  {l["telefone"] or "sem telefone"}'
                     + (f' · @{l["instagram"]}' if l['instagram'] else '')
                     + f' · {l["avaliacoes"]} avaliações · nota {l["pontuacao"]}/10')
        for m in cx.execute('SELECT tipo,situacao,texto FROM mensagens WHERE lead_id=? '
                            'ORDER BY id', (l['id'],)):
            saida.append(f'  [{m["tipo"]}/{m["situacao"]}] {m["texto"][:160]}')
        d = cx.execute('SELECT url,situacao FROM demos WHERE lead_id=? ORDER BY id DESC '
                       'LIMIT 1', (l['id'],)).fetchone()
        if d:
            saida.append(f'  demo: {d["situacao"]} {d["url"] or ""}')
        saida.append('')
    cx.close()
    return '\n'.join(saida)
