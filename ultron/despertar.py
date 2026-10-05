#!/usr/bin/env python3
"""
DESPERTAR — o Ultron ligado quando o notebook abre.

    python ultron.py despertar --ligar
    python ultron.py despertar --desligar
    python ultron.py despertar            (diz como está)

COMO ELE ACORDA, E POR QUE ASSIM

No Windows, o jeito honesto é a pasta Inicializar do usuário: um atalho
em `shell:startup`. Roda quando VOCÊ entra na conta — que é o momento em
que o notebook vira seu de novo, e é exatamente o que você pediu.

Três decisões que custam caro se forem erradas:

  • NA SUA CONTA, não como serviço do sistema. Serviço roda como SYSTEM,
    sem acesso ao seu microfone, ao seu navegador logado, ao seu
    WhatsApp Web. Um Ultron sem suas sessões é um Ultron inútil.
  • SEM JANELA PRETA. `pythonw.exe` em vez de `python.exe`: senão toda
    vez que você liga o notebook aparece um terminal que você vai querer
    fechar — e fechar mata o Ultron.
  • ELE NÃO ESCUTA SOZINHO DE CARA. Sobe em modo de espera, esperando a
    palavra-chave ou o atalho. Microfone aberto por padrão numa máquina
    que vai para a mesa de qualquer lugar é decisão sua, não minha: ligue
    em config.toml → voz.escuta_sempre.

O atalho é um .vbs de três linhas em vez de .lnk de propósito: .lnk
precisa de COM e de pywin32, e um arquivo de texto você abre, lê e apaga
quando quiser. Transparência vale mais que elegância aqui.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

NOME = 'Ultron.vbs'


def _pasta_inicializar() -> Path | None:
    """A pasta Inicializar do usuário. Só existe no Windows."""
    if os.name != 'nt':
        return None
    base = os.environ.get('APPDATA')
    if not base:
        return None
    return (Path(base) / 'Microsoft' / 'Windows' / 'Start Menu'
            / 'Programs' / 'Startup')


def _pythonw() -> str:
    """
    O interpretador sem console. Se não achar, usa o normal e avisa — é
    melhor um terminal aparecendo que um Ultron que não sobe.
    """
    atual = Path(sys.executable)
    sem_janela = atual.with_name('pythonw.exe')
    return str(sem_janela if sem_janela.exists() else atual)


def _script_vbs(interpretador: str, alvo: Path) -> str:
    # O 0 no Run é "janela escondida"; o False é "não espere terminar".
    return (
        "' Sobe o Ultron quando você entra na conta. Apague este arquivo\n"
        "' para desligar, ou rode: python ultron.py despertar --desligar\n"
        'Set sh = CreateObject("WScript.Shell")\n'
        f'sh.CurrentDirectory = "{alvo.parent}"\n'
        f'sh.Run """{interpretador}"" ""{alvo}"" ouvir", 0, False\n')


def estado() -> tuple[bool, str]:
    pasta = _pasta_inicializar()
    if pasta is None:
        return False, ('despertar automático só existe no Windows. No Linux '
                       'ou Mac, ponha `ultron.py ouvir` no que a sua área de '
                       'trabalho usar para iniciar programas.')
    atalho = pasta / NOME
    if atalho.exists():
        return True, f'ligado · {atalho}'
    return False, f'desligado · ele entraria em {atalho}'


def liga(raiz: Path) -> tuple[bool, str]:
    pasta = _pasta_inicializar()
    if pasta is None:
        return False, estado()[1]
    alvo = raiz / 'ultron.py'
    if not alvo.exists():
        return False, f'não achei {alvo}'
    try:
        pasta.mkdir(parents=True, exist_ok=True)
        (pasta / NOME).write_text(_script_vbs(_pythonw(), alvo),
                                  encoding='utf-8')
    except OSError as e:
        return False, f'não consegui escrever em {pasta}: {e}'
    aviso = ''
    if 'pythonw' not in _pythonw():
        aviso = ('\n  Atenção: não achei o pythonw.exe, então vai aparecer '
                 'uma janela preta ao ligar o notebook. Fechar ela mata o '
                 'Ultron.')
    return True, (f'ligado. Ele sobe quando você entrar na sua conta.\n'
                  f'  atalho: {pasta / NOME}\n'
                  f'  Para desligar, apague esse arquivo ou rode '
                  f'`python ultron.py despertar --desligar`.{aviso}')


def desliga() -> tuple[bool, str]:
    pasta = _pasta_inicializar()
    if pasta is None:
        return False, estado()[1]
    atalho = pasta / NOME
    if not atalho.exists():
        return True, 'já estava desligado.'
    try:
        atalho.unlink()
    except OSError as e:
        return False, f'não consegui apagar {atalho}: {e}'
    return True, 'desligado. Ele não sobe mais sozinho.'
