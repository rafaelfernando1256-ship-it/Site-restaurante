"""
O COMPUTADOR — terminal, teclado, mouse, janelas, som.

Tudo que é específico de sistema fica aqui, atrás de uma função só, para
o resto do Jarvis não precisar saber se está no Windows ou no Linux.

Os pacotes de automação de tela (pyautogui, pygetwindow) entram DENTRO
das funções, não no topo: se faltarem, só aquela ferramenta avisa o que
instalar — o Jarvis inteiro continua de pé.
"""
from __future__ import annotations

import os
import platform
import shutil
import subprocess
import time
from pathlib import Path

from pydantic import BaseModel, Field

from nucleo.config import sistema
from nucleo.permissao import CUIDADO, LIVRE, Veredito, avalia_comando
from . import Contexto, ferramenta

SO = sistema()


def _shell(comando: str, pasta: str = '', segundos: int = 120) -> tuple[int, str]:
    if SO == 'windows':
        argv = ['powershell', '-NoProfile', '-NonInteractive', '-Command', comando]
    else:
        argv = ['/bin/bash', '-lc', comando]
    try:
        r = subprocess.run(argv, cwd=pasta or None, capture_output=True, text=True,
                           timeout=segundos, errors='replace')
    except subprocess.TimeoutExpired:
        return 124, f'o comando passou de {segundos}s e foi cortado'
    saida = (r.stdout or '') + (('\n' + r.stderr) if r.stderr else '')
    return r.returncode, saida.strip()[:12000]


# ── terminal ────────────────────────────────────────────────────────
class RodarArgs(BaseModel):
    comando: str = Field(description='O comando. No Windows é PowerShell.')
    pasta: str = Field(default='', description='Pasta onde rodar.')
    segundos: int = Field(default=120, description='Teto de tempo.')


@ferramenta('rodar_comando',
            'Roda um comando no terminal (PowerShell no Windows, bash no resto) '
            'e devolve a saída. Use para qualquer coisa que a linha de comando faça.',
            RodarArgs, avalia=lambda a, ctx: avalia_comando(a.comando),
            resumo=lambda a: f'rodar: {a.comando[:90]}')
def rodar_comando(a: RodarArgs, ctx: Contexto) -> str:
    codigo, saida = _shell(a.comando, a.pasta, a.segundos)
    return f'[código {codigo}]\n{saida}' if codigo else (saida or '(sem saída)')


class TerminalArgs(BaseModel):
    pasta: str = Field(default='', description='Pasta onde abrir.')
    comando: str = Field(default='', description='Comando já digitado ao abrir.')


@ferramenta('abrir_terminal', 'Abre uma JANELA de terminal para você, visível.',
            TerminalArgs, resumo=lambda a: 'abrir um terminal')
def abrir_terminal(a: TerminalArgs, ctx: Contexto) -> str:
    pasta = a.pasta or str(Path.home())
    try:
        if SO == 'windows':
            arg = f'-NoExit -Command "cd \'{pasta}\'; {a.comando}"' if a.comando \
                  else f'-NoExit -Command "cd \'{pasta}\'"'
            subprocess.Popen(['cmd', '/c', 'start', 'powershell', *arg.split(' ', 1)],
                             shell=False)
        elif SO == 'mac':
            subprocess.Popen(['open', '-a', 'Terminal', pasta])
        else:
            for t in ('gnome-terminal', 'konsole', 'xfce4-terminal', 'x-terminal-emulator'):
                if shutil.which(t):
                    subprocess.Popen([t, '--working-directory', pasta])
                    break
            else:
                return 'não achei emulador de terminal instalado'
        return f'terminal aberto em {pasta}'
    except Exception as e:
        return f'não consegui abrir: {e}'


# ── programas ───────────────────────────────────────────────────────
APELIDOS = {
    'windows': {
        'navegador': 'chrome', 'chrome': 'chrome', 'edge': 'msedge',
        'bloco de notas': 'notepad', 'notepad': 'notepad',
        'calculadora': 'calc', 'explorador': 'explorer', 'arquivos': 'explorer',
        'word': 'winword', 'excel': 'excel', 'powerpoint': 'powerpnt',
        'spotify': 'spotify', 'vscode': 'code', 'código': 'code',
        'configurações': 'ms-settings:', 'gerenciador de tarefas': 'taskmgr',
    },
    'linux': {'navegador': 'xdg-open https://google.com', 'arquivos': 'xdg-open .',
              'vscode': 'code', 'calculadora': 'gnome-calculator'},
    'mac': {'navegador': 'open -a Safari', 'arquivos': 'open .', 'vscode': 'code'},
}


class AbrirArgs(BaseModel):
    programa: str = Field(description='Nome do programa, apelido, arquivo ou pasta.')


EXECUTAVEIS = ('.exe', '.bat', '.cmd', '.ps1', '.msi', '.vbs', '.scr', '.com', '.sh')


def _avalia_abrir(a: 'AbrirArgs', ctx) -> Veredito:
    alvo = a.programa.lower().strip()
    if alvo in APELIDOS.get(SO, {}):
        return Veredito(LIVRE)
    p = Path(alvo).expanduser()
    if p.exists() and p.suffix.lower() not in EXECUTAVEIS:
        return Veredito(LIVRE)
    return Veredito(CUIDADO, 'abre um programa que não está na lista de apelidos')


@ferramenta('abrir_programa', 'Abre um programa, arquivo ou pasta do computador.',
            AbrirArgs, avalia=_avalia_abrir, resumo=lambda a: f'abrir {a.programa}')
def abrir_programa(a: AbrirArgs, ctx: Contexto) -> str:
    alvo = APELIDOS.get(SO, {}).get(a.programa.lower().strip(), a.programa)
    caminho = Path(alvo).expanduser()
    try:
        if caminho.exists():
            if SO == 'windows':
                os.startfile(str(caminho))                       # noqa: S606
            else:
                subprocess.Popen(['open' if SO == 'mac' else 'xdg-open', str(caminho)])
            return f'abri {caminho}'
        if SO == 'windows':
            subprocess.Popen(['cmd', '/c', 'start', '', alvo], shell=False)
        elif SO == 'mac':
            subprocess.Popen(['open', '-a', alvo])
        else:
            subprocess.Popen(alvo, shell=True)
        return f'abri {a.programa}'
    except Exception as e:
        return f'não consegui abrir "{a.programa}": {e}'


class FecharArgs(BaseModel):
    programa: str = Field(description='Nome do processo, ex: notepad, chrome.')


@ferramenta('fechar_programa', 'Fecha um programa que está aberto.', FecharArgs,
            resumo=lambda a: f'fechar {a.programa}')
def fechar_programa(a: FecharArgs, ctx: Contexto) -> str:
    nome = a.programa.replace('.exe', '')
    if SO == 'windows':
        codigo, saida = _shell(f'Stop-Process -Name "{nome}" -ErrorAction SilentlyContinue; '
                               f'"fechado"')
    else:
        codigo, saida = _shell(f'pkill -f {nome!r}')
    return saida or f'mandei fechar {a.programa}'


# ── teclado e mouse ─────────────────────────────────────────────────
def _pyautogui():
    import pyautogui
    pyautogui.FAILSAFE = True     # canto superior esquerdo aborta tudo
    return pyautogui


class DigitarArgs(BaseModel):
    texto: str = Field(description='O texto a digitar na janela que está na frente.')
    enter: bool = Field(default=False, description='Aperta Enter no fim.')


@ferramenta('digitar',
            'Digita um texto na janela que está em primeiro plano, como se fosse você.',
            DigitarArgs, resumo=lambda a: f'digitar "{a.texto[:60]}"')
def digitar(a: DigitarArgs, ctx: Contexto) -> str:
    try:
        pg = _pyautogui()
    except ImportError:
        return 'falta instalar: pip install pyautogui'
    # Colar pelo clipboard é muito mais rápido e não erra acento — digitar
    # letra a letra com layout ABNT2 troca ç e til.
    try:
        import pyperclip
        anterior = pyperclip.paste()
        pyperclip.copy(a.texto)
        pg.hotkey('ctrl', 'v')
        time.sleep(0.15)
        pyperclip.copy(anterior)
    except Exception:
        pg.typewrite(a.texto, interval=0.01)
    if a.enter:
        pg.press('enter')
    return f'digitei {len(a.texto)} letras'


class AtalhoArgs(BaseModel):
    teclas: str = Field(description='Ex: "ctrl+s", "alt+tab", "win+d", "enter", "esc".')
    vezes: int = Field(default=1)


@ferramenta('apertar_tecla', 'Aperta uma tecla ou combinação de teclas.', AtalhoArgs,
            resumo=lambda a: f'apertar {a.teclas}')
def apertar_tecla(a: AtalhoArgs, ctx: Contexto) -> str:
    try:
        pg = _pyautogui()
    except ImportError:
        return 'falta instalar: pip install pyautogui'
    partes = [t.strip().lower() for t in a.teclas.replace(' ', '+').split('+') if t.strip()]
    for _ in range(max(1, a.vezes)):
        if len(partes) == 1:
            pg.press(partes[0])
        else:
            pg.hotkey(*partes)
        time.sleep(0.05)
    return f'apertei {a.teclas}'


class CliqueArgs(BaseModel):
    x: int = Field(description='Posição horizontal na tela, em pixels.')
    y: int = Field(description='Posição vertical na tela, em pixels.')
    duplo: bool = False
    direito: bool = False


@ferramenta('clicar_na_tela', 'Clica numa posição da tela. Tire um print antes para saber onde.',
            CliqueArgs, resumo=lambda a: f'clicar em {a.x},{a.y}')
def clicar_na_tela(a: CliqueArgs, ctx: Contexto) -> str:
    try:
        pg = _pyautogui()
    except ImportError:
        return 'falta instalar: pip install pyautogui'
    pg.click(a.x, a.y, clicks=2 if a.duplo else 1,
             button='right' if a.direito else 'left')
    return f'cliquei em {a.x},{a.y}'


class PrintArgs(BaseModel):
    salvar_em: str = Field(default='', description='Caminho do .png. Vazio = pasta saida/.')


@ferramenta('tirar_print', 'Tira uma foto da tela e devolve o caminho do arquivo.',
            PrintArgs, nivel=LIVRE, resumo=lambda a: 'tirar um print da tela')
def tirar_print(a: PrintArgs, ctx: Contexto) -> str:
    from nucleo.config import SAIDA
    destino = Path(a.salvar_em).expanduser() if a.salvar_em else \
        SAIDA / f'tela-{time.strftime("%Y%m%d-%H%M%S")}.png'
    destino.parent.mkdir(parents=True, exist_ok=True)
    try:
        pg = _pyautogui()
        pg.screenshot(str(destino))
    except ImportError:
        try:
            from PIL import ImageGrab
            ImageGrab.grab().save(destino)
        except Exception as e:
            return f'falta instalar pyautogui ou pillow ({e})'
    return str(destino)


# ── área de transferência ───────────────────────────────────────────
class ClipArgs(BaseModel):
    texto: str = Field(default='', description='Vazio = só lê o que está copiado.')


@ferramenta('area_de_transferencia',
            'Lê ou escreve o que está na área de transferência (Ctrl+C / Ctrl+V).',
            ClipArgs, nivel=LIVRE, resumo=lambda a: 'mexer na área de transferência')
def area_de_transferencia(a: ClipArgs, ctx: Contexto) -> str:
    try:
        import pyperclip
    except ImportError:
        if SO == 'windows':
            if a.texto:
                _shell(f'Set-Clipboard -Value {a.texto!r}')
                return 'copiado'
            return _shell('Get-Clipboard')[1]
        return 'falta instalar: pip install pyperclip'
    if a.texto:
        pyperclip.copy(a.texto)
        return 'copiado'
    return pyperclip.paste() or '(vazio)'


# ── som e mídia ─────────────────────────────────────────────────────
class MidiaArgs(BaseModel):
    acao: str = Field(description='tocar_pausar | proxima | anterior | subir | baixar | mudo')
    passos: int = Field(default=2, description='Quantos degraus de volume.')


@ferramenta('controlar_midia', 'Controla volume e reprodução: pausar, pular, subir som.',
            MidiaArgs, nivel=LIVRE, resumo=lambda a: f'mídia: {a.acao}')
def controlar_midia(a: MidiaArgs, ctx: Contexto) -> str:
    teclas = {'tocar_pausar': 'playpause', 'proxima': 'nexttrack',
              'anterior': 'prevtrack', 'subir': 'volumeup',
              'baixar': 'volumedown', 'mudo': 'volumemute'}
    tecla = teclas.get(a.acao)
    if not tecla:
        return f'não conheço a ação "{a.acao}". Use: {", ".join(teclas)}'
    if SO == 'linux' and shutil.which('playerctl') and a.acao in (
            'tocar_pausar', 'proxima', 'anterior'):
        mapa = {'tocar_pausar': 'play-pause', 'proxima': 'next', 'anterior': 'previous'}
        _shell(f'playerctl {mapa[a.acao]}')
        return f'mídia: {a.acao}'
    try:
        pg = _pyautogui()
    except ImportError:
        return 'falta instalar: pip install pyautogui'
    for _ in range(a.passos if a.acao in ('subir', 'baixar') else 1):
        pg.press(tecla)
    return f'mídia: {a.acao}'


# ── estado da máquina ───────────────────────────────────────────────
class NadaArgs(BaseModel):
    pass


@ferramenta('estado_do_computador',
            'Diz como está a máquina: bateria, memória, disco, rede, programas abertos.',
            NadaArgs, nivel=LIVRE, resumo=lambda a: 'ver o estado da máquina')
def estado_do_computador(a: NadaArgs, ctx: Contexto) -> str:
    linhas = [f'Sistema: {platform.system()} {platform.release()} ({platform.machine()})']
    try:
        import psutil
        mem = psutil.virtual_memory()
        linhas.append(f'Memória: {mem.percent}% em uso '
                      f'({mem.used / 2**30:.1f} de {mem.total / 2**30:.1f} GB)')
        linhas.append(f'Processador: {psutil.cpu_percent(interval=0.3)}%')
        for d in psutil.disk_partitions(all=False):
            try:
                u = psutil.disk_usage(d.mountpoint)
                linhas.append(f'Disco {d.mountpoint}: {u.percent}% cheio, '
                              f'{u.free / 2**30:.0f} GB livres')
            except OSError:
                continue
        bat = getattr(psutil, 'sensors_battery', lambda: None)()
        if bat:
            linhas.append(f'Bateria: {bat.percent:.0f}%'
                          + (' na tomada' if bat.power_plugged else ' na bateria'))
        nomes = sorted({p.info['name'] for p in psutil.process_iter(['name'])
                        if p.info['name']})
        linhas.append(f'Processos: {len(nomes)} programas diferentes rodando')
    except ImportError:
        linhas.append('(instale psutil para memória, disco e bateria: pip install psutil)')
    return '\n'.join(linhas)


class RedeArgs(BaseModel):
    testar: str = Field(default='', description='Endereço para testar, ex: google.com')


@ferramenta('rede', 'Mostra a rede: wi-fi conectado, IP, e testa se a internet responde.',
            RedeArgs, nivel=LIVRE, resumo=lambda a: 'olhar a rede')
def rede(a: RedeArgs, ctx: Contexto) -> str:
    partes = []
    if SO == 'windows':
        partes.append(_shell('(Get-NetConnectionProfile | '
                             'Select-Object Name,InterfaceAlias,IPv4Connectivity | '
                             'Format-Table | Out-String).Trim()')[1])
        partes.append(_shell('(Get-NetIPAddress -AddressFamily IPv4 | '
                             'Where-Object {$_.IPAddress -notlike "127.*"} | '
                             'Select-Object IPAddress,InterfaceAlias | '
                             'Format-Table | Out-String).Trim()')[1])
    else:
        partes.append(_shell('ip -brief addr 2>/dev/null || ifconfig')[1][:1500])
    alvo = a.testar or 'google.com'
    conta = '-n 2' if SO == 'windows' else '-c 2'
    codigo, saida = _shell(f'ping {conta} {alvo}', segundos=20)
    partes.append(f'Teste com {alvo}: ' + ('respondeu' if codigo == 0 else 'NÃO respondeu'))
    return '\n\n'.join(p for p in partes if p)
