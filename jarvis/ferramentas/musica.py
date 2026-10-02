"""
MÚSICA

Duas fontes, nesta ordem: arquivo seu, se existir; senão, YouTube Music
na mesma janela do navegador que ele já controla.

Pausar, pular e volume não estão aqui — estão em `controlar_midia`, que
fala com a tecla de mídia do sistema e funciona com Spotify, YouTube e
qualquer player, inclusive os que ele não abriu.
"""
from __future__ import annotations

import os
import subprocess
import time
from pathlib import Path

from pydantic import BaseModel, Field

from nucleo.config import sistema
from nucleo.permissao import LIVRE
from . import Contexto, ferramenta

SO = sistema()
EXTENSOES = ('.mp3', '.m4a', '.flac', '.wav', '.ogg', '.opus', '.aac', '.wma')


class TocarArgs(BaseModel):
    o_que: str = Field(description='Nome da música, artista, álbum ou playlist.')
    onde: str = Field(default='auto', description='auto | arquivo | youtube')


@ferramenta('tocar_musica', 'Toca uma música: arquivo seu, se tiver, ou no YouTube Music.',
            TocarArgs, nivel=LIVRE, resumo=lambda a: f'tocar {a.o_que}')
def tocar_musica(a: TocarArgs, ctx: Contexto) -> str:
    if a.onde in ('auto', 'arquivo'):
        achado = _acha_local(a.o_que, ctx.cfg.pasta_musica)
        if achado:
            try:
                if SO == 'windows':
                    os.startfile(str(achado))             # noqa: S606
                elif SO == 'mac':
                    subprocess.Popen(['open', str(achado)])
                else:
                    tocador = 'mpv' if _tem('mpv') else 'xdg-open'
                    subprocess.Popen([tocador, str(achado)],
                                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return f'tocando {achado.name}'
            except Exception as e:
                return f'achei {achado.name} mas não consegui tocar: {e}'
        if a.onde == 'arquivo':
            return f'não achei "{a.o_que}" nos seus arquivos'

    from .navegador import AbrirArgs, abrir_site, _nav
    url = 'https://music.youtube.com/search?q=' + a.o_que.replace(' ', '+')
    abrir_site(AbrirArgs(endereco=url, nova_aba=True), ctx)
    p = _nav(ctx).pagina()
    time.sleep(2.5)
    # O primeiro resultado da busca é o que a pessoa quis em quase todo caso.
    for tentativa in ('ytmusic-responsive-list-item-renderer',
                      'ytmusic-card-shelf-renderer'):
        try:
            p.locator(tentativa).first.dblclick(timeout=5000)
            time.sleep(1.5)
            return f'tocando "{a.o_que}" no YouTube Music'
        except Exception:
            continue
    return (f'abri o YouTube Music buscando "{a.o_que}". '
            'Se não começou sozinho, diga "clica no primeiro".')


def _tem(programa: str) -> bool:
    from shutil import which
    return which(programa) is not None


def _acha_local(termo: str, pasta: str) -> Path | None:
    raizes = [Path(pasta).expanduser()] if pasta else []
    if not raizes:
        casa = Path.home()
        raizes = [casa / n for n in ('Music', 'Músicas', 'Music/iTunes') if (casa / n).exists()]
    alvo = termo.lower()
    melhor = None
    for r in raizes:
        if not r.exists():
            continue
        for arq in r.rglob('*'):
            if arq.suffix.lower() in EXTENSOES and alvo in arq.stem.lower():
                if melhor is None or len(arq.stem) < len(melhor.stem):
                    melhor = arq
    return melhor


class ListaArgs(BaseModel):
    termo: str = Field(default='', description='Filtro pelo nome. Vazio = tudo.')


@ferramenta('musicas_no_computador', 'Lista as músicas que existem no computador.',
            ListaArgs, nivel=LIVRE, resumo=lambda a: 'procurar músicas no computador')
def musicas_no_computador(a: ListaArgs, ctx: Contexto) -> str:
    pasta = Path(ctx.cfg.pasta_musica).expanduser() if ctx.cfg.pasta_musica else Path.home()
    achados = [p for p in pasta.rglob('*')
               if p.suffix.lower() in EXTENSOES
               and (not a.termo or a.termo.lower() in p.stem.lower())][:80]
    if not achados:
        return f'não achei música em {pasta}'
    return f'{len(achados)} em {pasta}:\n' + '\n'.join(f'  {p.stem}' for p in achados)
