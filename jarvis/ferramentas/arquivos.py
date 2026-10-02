"""Ler, escrever, procurar e listar arquivo. A base de quase tudo."""
from __future__ import annotations

import shutil
from pathlib import Path

from pydantic import BaseModel, Field

from nucleo.permissao import LIVRE, PERIGO, avalia_caminho
from . import Contexto, ferramenta

LIMITE_LEITURA = 120_000


def _p(caminho: str) -> Path:
    return Path(caminho).expanduser()


class LerArgs(BaseModel):
    caminho: str = Field(description='Caminho do arquivo.')
    linhas: int = Field(default=0, description='Só as N primeiras linhas. 0 = tudo.')


@ferramenta('ler_arquivo', 'Lê um arquivo de texto do computador.', LerArgs,
            nivel=LIVRE, resumo=lambda a: f'ler {a.caminho}')
def ler_arquivo(a: LerArgs, ctx: Contexto) -> str:
    p = _p(a.caminho)
    if not p.exists():
        return f'não existe: {p}'
    if p.is_dir():
        return f'{p} é pasta, não arquivo. Use listar_pasta.'
    try:
        texto = p.read_text(encoding='utf-8', errors='replace')
    except Exception as e:
        return f'não consegui ler: {e}'
    if a.linhas:
        texto = '\n'.join(texto.splitlines()[:a.linhas])
    if len(texto) > LIMITE_LEITURA:
        texto = texto[:LIMITE_LEITURA] + f'\n[... cortado, o arquivo tem {len(texto)} letras]'
    return texto


class EscreverArgs(BaseModel):
    caminho: str
    conteudo: str
    acrescentar: bool = Field(default=False, description='True acrescenta no fim.')


@ferramenta('escrever_arquivo', 'Cria ou sobrescreve um arquivo de texto.', EscreverArgs,
            avalia=lambda a, ctx: avalia_caminho(a.caminho, ctx.cfg, escrita=True),
            resumo=lambda a: f'{"acrescentar em" if a.acrescentar else "escrever"} {a.caminho}')
def escrever_arquivo(a: EscreverArgs, ctx: Contexto) -> str:
    p = _p(a.caminho)
    p.parent.mkdir(parents=True, exist_ok=True)
    existia = p.exists()
    with open(p, 'a' if a.acrescentar else 'w', encoding='utf-8') as f:
        f.write(a.conteudo)
    return f'{"acrescentado em" if a.acrescentar else ("sobrescrito" if existia else "criado")}: {p}'


class ListarArgs(BaseModel):
    pasta: str = Field(default='.', description='Pasta a listar.')
    padrao: str = Field(default='*', description='Filtro glob, ex: *.pdf')
    recursivo: bool = False


@ferramenta('listar_pasta', 'Lista arquivos e pastas.', ListarArgs, nivel=LIVRE,
            resumo=lambda a: f'listar {a.pasta}')
def listar_pasta(a: ListarArgs, ctx: Contexto) -> str:
    p = _p(a.pasta)
    if not p.exists():
        return f'não existe: {p}'
    itens = sorted(p.rglob(a.padrao) if a.recursivo else p.glob(a.padrao))[:300]
    if not itens:
        return f'nada em {p} com o padrão {a.padrao}'
    linhas = []
    for i in itens:
        try:
            tam = i.stat().st_size
            linhas.append(f'{"[pasta]" if i.is_dir() else f"{tam:>10,}"}  {i.name}')
        except OSError:
            continue
    return f'{p} — {len(itens)} itens\n' + '\n'.join(linhas)


class ProcurarArgs(BaseModel):
    termo: str = Field(description='Texto a procurar DENTRO dos arquivos.')
    pasta: str = Field(default='.', description='Onde procurar.')
    padrao: str = Field(default='*', description='Quais arquivos, ex: *.py')


@ferramenta('procurar_em_arquivos', 'Procura um texto dentro dos arquivos de uma pasta.',
            ProcurarArgs, nivel=LIVRE, resumo=lambda a: f'procurar "{a.termo}" em {a.pasta}')
def procurar_em_arquivos(a: ProcurarArgs, ctx: Contexto) -> str:
    p = _p(a.pasta)
    achados = []
    for arq in list(p.rglob(a.padrao))[:4000]:
        if not arq.is_file() or arq.stat().st_size > 4_000_000:
            continue
        try:
            for n, linha in enumerate(arq.read_text(encoding='utf-8', errors='ignore')
                                      .splitlines(), 1):
                if a.termo.lower() in linha.lower():
                    achados.append(f'{arq}:{n}: {linha.strip()[:160]}')
                    if len(achados) >= 80:
                        return '\n'.join(achados) + '\n[... muitos resultados]'
        except OSError:
            continue
    return '\n'.join(achados) or f'não achei "{a.termo}" em {p}'


class AcharArgs(BaseModel):
    nome: str = Field(description='Parte do nome do arquivo, ex: "contrato" ou "*.pdf"')
    pasta: str = Field(default='', description='Vazio = procura nas pastas liberadas.')


@ferramenta('achar_arquivo', 'Acha arquivos pelo NOME, nas pastas liberadas.', AcharArgs,
            nivel=LIVRE, resumo=lambda a: f'achar arquivo "{a.nome}"')
def achar_arquivo(a: AcharArgs, ctx: Contexto) -> str:
    padrao = a.nome if '*' in a.nome or '.' in a.nome else f'*{a.nome}*'
    raizes = [_p(a.pasta)] if a.pasta else [_p(r) for r in ctx.cfg.raizes_seguras]
    achados: list[str] = []
    for r in raizes:
        if not r.exists():
            continue
        for i, arq in enumerate(r.rglob(padrao)):
            if i > 30000:
                break
            achados.append(str(arq))
            if len(achados) >= 60:
                break
    return '\n'.join(achados) or f'não achei nada com "{a.nome}"'


class MoverArgs(BaseModel):
    origem: str
    destino: str
    copiar: bool = Field(default=False, description='True copia em vez de mover.')


@ferramenta('mover_arquivo', 'Move ou copia um arquivo ou pasta.', MoverArgs,
            avalia=lambda a, ctx: avalia_caminho(a.destino, ctx.cfg, escrita=True),
            resumo=lambda a: f'{"copiar" if a.copiar else "mover"} {a.origem} para {a.destino}')
def mover_arquivo(a: MoverArgs, ctx: Contexto) -> str:
    o, d = _p(a.origem), _p(a.destino)
    if not o.exists():
        return f'não existe: {o}'
    d.parent.mkdir(parents=True, exist_ok=True)
    if a.copiar:
        shutil.copytree(o, d) if o.is_dir() else shutil.copy2(o, d)
        return f'copiado para {d}'
    shutil.move(str(o), str(d))
    return f'movido para {d}'


class ApagarArgs(BaseModel):
    caminho: str
    pasta_inteira: bool = Field(default=False, description='True apaga a pasta com tudo dentro.')


# Apagar é sempre PERIGO: não existe "apagar com cuidado" por voz.
@ferramenta('apagar_arquivo', 'Apaga um arquivo ou pasta. Pede confirmação digitada.',
            ApagarArgs, nivel=PERIGO,
            resumo=lambda a: f'APAGAR {a.caminho}')
def apagar_arquivo(a: ApagarArgs, ctx: Contexto) -> str:
    p = _p(a.caminho)
    if not p.exists():
        return f'não existe: {p}'
    if p.is_dir():
        if not a.pasta_inteira:
            return f'{p} é uma pasta. Para apagar a pasta inteira, diga isso explicitamente.'
        shutil.rmtree(p)
        return f'apagada a pasta {p}'
    p.unlink()
    return f'apagado {p}'
