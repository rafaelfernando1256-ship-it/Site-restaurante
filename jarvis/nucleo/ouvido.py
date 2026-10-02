"""
O OUVIDO — palavra de ativação e transcrição

Tudo local: o áudio do seu microfone **não sai da máquina**. A palavra de
ativação roda em ONNX pequeno, e a transcrição no `faster-whisper`. Só o
TEXTO do que você falou vai para a nuvem, e só depois que você chamou.

Três coisas que fazem a diferença entre "funciona na demonstração" e
"funciona na sua sala":

**Limiar calibrado, não chutado.** Ele mede o barulho do seu ambiente nos
primeiros segundos e define o corte a partir dele. Silêncio de escritório
e silêncio de casa com TV ligada são coisas diferentes.

**Fim de fala por silêncio, com teto.** Para de gravar depois de ~1,2 s
quieto, e no máximo 20 s. Sem teto, um ventilador perto do microfone grava
para sempre.

**Começo guardado.** Um pedaço do áudio ANTES do silêncio acabar vai junto:
sem isso, a primeira sílaba some e "abre o YouTube" vira "bre o YouTube".
"""
from __future__ import annotations

import collections
import queue
import time
from typing import Any

TAXA = 16000
BLOCO = 1280            # 80 ms — o tamanho que o detector espera
PRE_FALA = 8            # blocos guardados antes do começo (~0,6 s)


class SemAudio(Exception):
    pass


class Ouvido:
    def __init__(self, cfg):
        self.cfg = cfg
        self._detector = None
        self._whisper = None
        self._stream = None
        self._fila: queue.Queue = queue.Queue()
        self.piso = 0.0          # nível de ruído medido do ambiente

    # ── o que está instalado ────────────────────────────────────────
    @staticmethod
    def checa() -> tuple[bool, str]:
        faltam = []
        for pacote, pip in (('sounddevice', 'sounddevice'),
                            ('numpy', 'numpy'),
                            ('faster_whisper', 'faster-whisper')):
            try:
                __import__(pacote)
            except ImportError:
                faltam.append(pip)
        if faltam:
            return False, 'falta instalar: pip install ' + ' '.join(faltam)
        return True, 'ok'

    # ── microfone ───────────────────────────────────────────────────
    def abre(self):
        import sounddevice as sd
        if self._stream is not None:
            return self._stream

        def entra(dados, quadros, tempo, estado):          # noqa: ARG001
            self._fila.put(bytes(dados))

        self._stream = sd.RawInputStream(samplerate=TAXA, blocksize=BLOCO, dtype='int16',
                                         channels=1, callback=entra)
        self._stream.start()
        return self._stream

    def fecha(self):
        if self._stream is not None:
            self._stream.stop()
            self._stream.close()
            self._stream = None

    def _bloco(self, espera: float = 1.0):
        import numpy as np
        try:
            cru = self._fila.get(timeout=espera)
        except queue.Empty:
            return None
        return np.frombuffer(cru, dtype=np.int16)

    # ── calibragem ──────────────────────────────────────────────────
    def calibra(self, segundos: float = 1.5) -> float:
        import numpy as np
        self.abre()
        amostras = []
        fim = time.time() + segundos
        while time.time() < fim:
            b = self._bloco(0.5)
            if b is not None:
                amostras.append(float(np.sqrt(np.mean(b.astype(np.float32) ** 2))))
        self.piso = (sorted(amostras)[len(amostras) // 2] if amostras else 120.0)
        return self.piso

    # ── palavra de ativação ─────────────────────────────────────────
    def _carrega_detector(self):
        if self._detector is not None:
            return self._detector
        try:
            from openwakeword.model import Model
        except ImportError as e:
            raise SemAudio('falta instalar: pip install openwakeword') from e
        alvo = self.cfg.palavra_chave.lower().replace(' ', '_')
        try:
            self._detector = Model(wakeword_models=[alvo], inference_framework='onnx')
        except Exception:
            # Nome fora do catálogo: usa todos os modelos que vieram juntos.
            self._detector = Model(inference_framework='onnx')
        return self._detector

    def espera_chamado(self, limiar: float = 0.5, enquanto=None) -> bool:
        """Fica ouvindo até alguém dizer a palavra. True = chamaram."""
        d = self._carrega_detector()
        self.abre()
        while True:
            if enquanto is not None and not enquanto():
                return False
            b = self._bloco(0.5)
            if b is None:
                continue
            try:
                notas = d.predict(b)
            except Exception:
                continue
            if notas and max(notas.values()) >= limiar:
                d.reset()
                return True

    # ── gravar uma fala ─────────────────────────────────────────────
    def grava(self, maximo: float = 20.0):
        """Grava até o silêncio. Devolve float32 em -1..1, pronto para o whisper."""
        import numpy as np
        self.abre()
        if not self.piso:
            self.piso = 120.0
        corte = max(self.piso * 2.2, 220.0)
        anteriores = collections.deque(maxlen=PRE_FALA)
        pedacos: list[Any] = []
        falou = False
        quieto_desde = None
        comeco = time.time()

        while time.time() - comeco < maximo:
            b = self._bloco(0.5)
            if b is None:
                continue
            nivel = float(np.sqrt(np.mean(b.astype(np.float32) ** 2)))
            if nivel >= corte:
                if not falou:
                    pedacos.extend(anteriores)   # a primeira sílaba vem daqui
                    falou = True
                quieto_desde = None
                pedacos.append(b)
            elif falou:
                pedacos.append(b)
                quieto_desde = quieto_desde or time.time()
                if time.time() - quieto_desde >= self.cfg.silencio_para_parar:
                    break
            else:
                anteriores.append(b)
                if time.time() - comeco > 6 and not falou:
                    break                        # chamou e não falou nada
        if not pedacos:
            return None
        return np.concatenate(pedacos).astype(np.float32) / 32768.0

    # ── transcrever ─────────────────────────────────────────────────
    def _carrega_whisper(self):
        if self._whisper is not None:
            return self._whisper
        from faster_whisper import WhisperModel
        self._whisper = WhisperModel(self.cfg.modelo_escuta, device='cpu',
                                     compute_type='int8')
        return self._whisper

    def transcreve(self, audio) -> str:
        if audio is None or len(audio) < TAXA * 0.3:
            return ''
        m = self._carrega_whisper()
        partes, _ = m.transcribe(audio, language=self.cfg.idioma, vad_filter=True,
                                 beam_size=1, condition_on_previous_text=False)
        return ' '.join(p.text.strip() for p in partes).strip()

    def ouve(self) -> str:
        """Grava uma fala e devolve o texto. Use depois de `espera_chamado`."""
        return self.transcreve(self.grava())
