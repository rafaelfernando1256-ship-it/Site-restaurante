"""
A VOZ

Três motores, escolhidos por disponibilidade:

  sapi      a voz do próprio Windows (pyttsx3 → SAPI5). Offline, instantânea,
            zero download. É o padrão no Windows porque funciona no minuto
            seguinte à instalação — e um assistente que precisa de 2 GB de
            modelo para dizer "ok" não é um assistente, é uma tarefa.
  edge      vozes neurais da Microsoft (edge-tts). Muito melhor em português,
            precisa de internet e de um pacote a mais.
  imprime   escreve na tela. Serve para máquina sem som e para teste.

Duas coisas que mudam a sensação de estar falando com alguém:

**Falar em pedaço.** O cérebro manda frase por frase, assim que cada uma
fecha. Ele começa a responder enquanto ainda está pensando o resto.

**Poder calar.** `cale()` corta no meio. Assistente que não cala quando
você fala por cima é assistente que você desliga na primeira semana.
"""
from __future__ import annotations

import os
import queue
import re
import subprocess
import tempfile
import threading
import time
from pathlib import Path


def limpa_para_fala(texto: str) -> str:
    """Tira o que é para o olho e não para o ouvido."""
    t = re.sub(r'```.*?```', ' (o código está na tela) ', texto, flags=re.S)
    t = re.sub(r'`([^`]*)`', r'\1', t)
    t = re.sub(r'https?://\S+', 'o link está na tela', t)
    t = re.sub(r'[*_#>|]+', ' ', t)
    t = re.sub(r'^\s*[-–—]\s*', '', t, flags=re.M)
    t = re.sub(r'[ \t]{2,}', ' ', t)
    return t.strip()


class Voz:
    def __init__(self, cfg, motor: str = 'auto'):
        self.cfg = cfg
        self.motor = motor if motor != 'auto' else self._escolhe()
        self._fila: queue.Queue = queue.Queue()
        self._parar = threading.Event()
        self._sapi = None
        self._processo = None
        self._linha = threading.Thread(target=self._trabalha, daemon=True)
        self._linha.start()

    def _escolhe(self) -> str:
        if os.environ.get('ULTRON_SEM_VOZ') == '1':
            return 'imprime'
        try:
            import pyttsx3                      # noqa: F401
            return 'sapi'
        except ImportError:
            pass
        try:
            import edge_tts                     # noqa: F401
            return 'edge'
        except ImportError:
            return 'imprime'

    # ── fila ────────────────────────────────────────────────────────
    def fala(self, texto: str) -> None:
        texto = limpa_para_fala(texto)
        if texto:
            self._parar.clear()
            self._fila.put(texto)

    def cale(self) -> None:
        """Para de falar agora e joga fora o que estava na fila."""
        self._parar.set()
        while not self._fila.empty():
            try:
                self._fila.get_nowait()
            except queue.Empty:
                break
        if self._processo and self._processo.poll() is None:
            self._processo.terminate()
        if self._sapi is not None:
            try:
                self._sapi.stop()
            except Exception:
                pass

    def espera(self, segundos: float = 30) -> None:
        fim = time.time() + segundos
        while not self._fila.empty() and time.time() < fim:
            time.sleep(0.05)

    def _trabalha(self) -> None:
        while True:
            texto = self._fila.get()
            if self._parar.is_set():
                continue
            try:
                getattr(self, f'_diz_{self.motor}', self._diz_imprime)(texto)
            except Exception as e:
                print(f'  (voz falhou: {e})')
                print(f'  {self.cfg.nome}: {texto}')

    # ── motores ─────────────────────────────────────────────────────
    def _diz_imprime(self, texto: str) -> None:
        print(f'  {self.cfg.nome}: {texto}')

    def _diz_sapi(self, texto: str) -> None:
        import pyttsx3
        if self._sapi is None:
            self._sapi = pyttsx3.init()
            self._sapi.setProperty('rate', 185)
            # Procura uma voz em português; sem isso ele lê português com
            # sotaque de inglês, que é pior que não falar.
            for v in self._sapi.getProperty('voices'):
                marca = f'{getattr(v, "id", "")} {getattr(v, "name", "")}'.lower()
                if 'pt' in marca or 'brazil' in marca or 'portug' in marca:
                    self._sapi.setProperty('voice', v.id)
                    break
        self._sapi.say(texto)
        self._sapi.runAndWait()

    def _diz_edge(self, texto: str) -> None:
        import asyncio

        import edge_tts
        destino = Path(tempfile.gettempdir()) / f'ultron-{int(time.time() * 1000)}.mp3'

        async def gera():
            com = edge_tts.Communicate(texto, self.cfg.modelo_voz,
                                       rate=self.cfg.velocidade_voz)
            await com.save(str(destino))

        asyncio.run(gera())
        self._toca(destino)
        try:
            destino.unlink()
        except OSError:
            pass

    def _toca(self, arquivo: Path) -> None:
        from nucleo.config import sistema
        so = sistema()
        for argv in ([ 'ffplay', '-nodisp', '-autoexit', '-loglevel', 'quiet', str(arquivo)],
                     ['mpv', '--no-video', '--really-quiet', str(arquivo)]):
            from shutil import which
            if which(argv[0]):
                self._processo = subprocess.Popen(argv, stdout=subprocess.DEVNULL,
                                                  stderr=subprocess.DEVNULL)
                self._processo.wait()
                return
        try:
            from playsound3 import playsound
            playsound(str(arquivo))
            return
        except ImportError:
            pass
        if so == 'windows':
            subprocess.run(['powershell', '-NoProfile', '-Command',
                            f'(New-Object Media.SoundPlayer "{arquivo}").PlaySync()'],
                           capture_output=True)
        elif so == 'mac':
            subprocess.run(['afplay', str(arquivo)], capture_output=True)
        else:
            print('  (sem tocador de áudio: instale ffmpeg ou playsound3)')
