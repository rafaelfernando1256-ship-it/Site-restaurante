"""
PROJETOS

"Jarvis, cria um site para a pizzaria do Marcos" — e ele cria, sozinho,
um projeto inteiro.

Quem escreve o código é o **Claude Code**, em modo não interativo
(`claude -p`), rodando dentro da pasta nova. Não é o Jarvis gerando
arquivo por arquivo pelo chat: é a ferramenta certa para a tarefa, com
contexto de projeto, build e correção de erro.

Isto demora minutos, não segundos. Por isso roda em segundo plano e você
pergunta depois: "como está o projeto da pizzaria?"
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import threading
import time
import unicodedata
from pathlib import Path

from pydantic import BaseModel, Field

from nucleo.config import SAIDA
from nucleo.permissao import LIVRE
from . import Contexto, ferramenta

OBRAS: dict[str, dict] = {}     # nome → {estado, pasta, relato, inicio, fim}


def _apelido(texto: str) -> str:
    plano = unicodedata.normalize('NFKD', texto).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', plano.lower()).strip('-')[:40] or 'projeto'


class CriarArgs(BaseModel):
    descricao: str = Field(
        description='O que construir, com o máximo de detalhe que a pessoa deu.')
    nome: str = Field(default='', description='Nome da pasta. Vazio = tirado da descrição.')
    pasta_base: str = Field(default='', description='Onde criar. Vazio = pasta saida/.')


@ferramenta('criar_projeto',
            'Cria um projeto de software inteiro (site, script, app) numa pasta nova, '
            'usando o Claude Code. Roda em segundo plano e demora minutos.',
            CriarArgs, resumo=lambda a: f'criar um projeto: {a.descricao[:90]}')
def criar_projeto(a: CriarArgs, ctx: Contexto) -> str:
    nome = _apelido(a.nome or a.descricao)
    base = Path(a.pasta_base).expanduser() if a.pasta_base else SAIDA / 'projetos'
    pasta = base / nome
    if pasta.exists() and any(pasta.iterdir()):
        nome = f'{nome}-{time.strftime("%H%M%S")}'
        pasta = base / nome
    pasta.mkdir(parents=True, exist_ok=True)

    pedido = (
        f'{a.descricao}\n\n'
        'Construa o projeto completo nesta pasta, pronto para rodar. '
        'Escolha a tecnologia mais simples que resolva — se for site estático, '
        'HTML, CSS e JS puros bastam. Escreva um README.md curto dizendo o que é '
        'e como rodar. Não invente dado que você não tem: deixe o lugar pronto e '
        'liste no README o que falta preencher. Ao terminar, diga em uma linha o '
        'que ficou pronto e o que ficou pendente.')
    (pasta / 'PEDIDO.md').write_text(pedido, encoding='utf-8')

    OBRAS[nome] = {'estado': 'construindo', 'pasta': str(pasta), 'relato': '',
                   'inicio': time.time(), 'fim': 0}

    def constroi():
        try:
            r = subprocess.run(
                ['claude', '-p', pedido, '--permission-mode', 'acceptEdits',
                 '--output-format', 'json'],
                cwd=pasta, capture_output=True, text=True, timeout=3600,
                env={**os.environ, 'CLAUDE_CODE_MAX_OUTPUT_TOKENS': '32000'})
            relato = r.stdout.strip() or r.stderr.strip()
            try:
                relato = json.loads(relato).get('result', relato)
            except Exception:
                pass
            OBRAS[nome].update(estado='pronto' if r.returncode == 0 else 'falhou',
                               relato=relato[:4000], fim=time.time())
        except FileNotFoundError:
            OBRAS[nome].update(estado='falhou', fim=time.time(),
                               relato='o comando "claude" não está instalado ou não está no PATH')
        except subprocess.TimeoutExpired:
            OBRAS[nome].update(estado='falhou', fim=time.time(),
                               relato='passou de uma hora e foi cortado')
        except Exception as e:
            OBRAS[nome].update(estado='falhou', relato=str(e)[:1000], fim=time.time())

    threading.Thread(target=constroi, daemon=True).start()
    return (f'comecei o projeto "{nome}" em {pasta}. '
            'Vai levar alguns minutos — me pergunte "como está o projeto" quando quiser.')


class VerArgs(BaseModel):
    nome: str = Field(default='', description='Qual projeto. Vazio = o último.')


@ferramenta('ver_projetos', 'Diz como estão os projetos que o Jarvis está construindo.',
            VerArgs, nivel=LIVRE, resumo=lambda a: 'ver como estão os projetos')
def ver_projetos(a: VerArgs, ctx: Contexto) -> str:
    if not OBRAS:
        return 'não comecei nenhum projeto nesta sessão'
    itens = [(n, o) for n, o in OBRAS.items() if not a.nome or a.nome.lower() in n]
    if not itens:
        return f'não achei projeto com "{a.nome}"'
    linhas = []
    for nome, o in itens:
        minutos = ((o['fim'] or time.time()) - o['inicio']) / 60
        linhas.append(f'{nome}: {o["estado"]} ({minutos:.0f} min) — {o["pasta"]}')
        if o['relato']:
            linhas.append(f'  {o["relato"][:600]}')
    return '\n'.join(linhas)


class MexerArgs(BaseModel):
    pasta: str = Field(description='Pasta do projeto já existente.')
    pedido: str = Field(description='O que mudar ou acrescentar.')


@ferramenta('mexer_no_projeto',
            'Pede ao Claude Code para alterar um projeto que já existe numa pasta.',
            MexerArgs, resumo=lambda a: f'mexer no projeto em {a.pasta}: {a.pedido[:70]}')
def mexer_no_projeto(a: MexerArgs, ctx: Contexto) -> str:
    pasta = Path(a.pasta).expanduser()
    if not pasta.exists():
        return f'não existe a pasta {pasta}'
    nome = f'{pasta.name}-mudanca-{time.strftime("%H%M%S")}'
    OBRAS[nome] = {'estado': 'construindo', 'pasta': str(pasta), 'relato': '',
                   'inicio': time.time(), 'fim': 0}

    def roda():
        try:
            r = subprocess.run(['claude', '-p', a.pedido, '--permission-mode', 'acceptEdits',
                                '--output-format', 'json'],
                               cwd=pasta, capture_output=True, text=True, timeout=3600)
            relato = r.stdout.strip() or r.stderr.strip()
            try:
                relato = json.loads(relato).get('result', relato)
            except Exception:
                pass
            OBRAS[nome].update(estado='pronto' if r.returncode == 0 else 'falhou',
                               relato=relato[:4000], fim=time.time())
        except Exception as e:
            OBRAS[nome].update(estado='falhou', relato=str(e)[:1000], fim=time.time())

    threading.Thread(target=roda, daemon=True).start()
    return f'mandei mexer em {pasta}. Pergunte depois como ficou.'
