"""
A VOZ — narração em português, sem chave e sem mensalidade.

Usa edge-tts: as vozes neurais da Microsoft, grátis, sem cadastro. As
pt-BR são boas o bastante para narração de vídeo curto, e é o mesmo
motor que o Jarvis já usa aqui no repositório.

A VOZ ESCURA

Para o tom dark, três ajustes contam mais que a escolha da voz:

  • VELOCIDADE UM POUCO ABAIXO do normal. Narração apressada soa a
    anúncio; devagar demais soa a meditação. -4% é o meio.
  • TOM UM POUCO GRAVE. -8Hz dá peso sem virar caricatura.
  • PAUSA ENTRE FRASES, não entre palavras. O silêncio é o que dá peso ao
    que vem depois, e é o que mais falta em narração automática.

Antonio é a voz masculina padrão: grave e seca. Thalita, a feminina.
"""
from __future__ import annotations

import asyncio
import shutil
from dataclasses import dataclass
from pathlib import Path

VOZES = {
    'antonio': 'pt-BR-AntonioNeural',    # masculina, grave
    'thalita': 'pt-BR-ThalitaNeural',    # feminina
    'francisca': 'pt-BR-FranciscaNeural',
}


@dataclass
class Fala:
    voz: str = 'antonio'
    velocidade: str = '-4%'
    tom: str = '-8Hz'
    pausa_entre_frases: float = 0.45     # segundos


ESCURA = Fala()


def disponivel() -> tuple[bool, str]:
    try:
        import edge_tts     # noqa: F401
    except ImportError:
        return False, 'falta instalar: python -m pip install edge-tts'
    return True, ''


async def _gera(texto: str, destino: Path, fala: Fala) -> None:
    import edge_tts
    com = edge_tts.Communicate(
        texto, VOZES.get(fala.voz, VOZES['antonio']),
        rate=fala.velocidade, pitch=fala.tom)
    await com.save(str(destino))


def narra(texto: str, destino: Path, fala: Fala = ESCURA) -> Path:
    """
    Gera o MP3 de uma frase.

    Uma frase por arquivo, de propósito: o vídeo é montado quadro a
    quadro, e cada quadro precisa durar exatamente o que a sua frase dura.
    Narrar tudo de uma vez obrigaria a cortar o áudio depois, que é onde
    a sincronia se perde.
    """
    pode, falta = disponivel()
    if not pode:
        raise RuntimeError(falta)
    destino.parent.mkdir(parents=True, exist_ok=True)
    asyncio.run(_gera(texto, destino, fala))
    return destino


def duracao(audio: Path) -> float:
    """Quanto dura, em segundos. É isso que define o tempo do quadro."""
    import json
    import subprocess
    ffprobe = shutil.which('ffprobe')
    if not ffprobe:
        try:
            import imageio_ffmpeg
            # O ffprobe não vem junto; o ffmpeg sabe dizer a duração.
            return _duracao_por_ffmpeg(audio)
        except ImportError:
            raise RuntimeError('sem ffprobe nem ffmpeg para medir o áudio')
    saida = subprocess.run(
        [ffprobe, '-v', 'quiet', '-print_format', 'json', '-show_format',
         str(audio)], capture_output=True, text=True, timeout=30)
    return float(json.loads(saida.stdout)['format']['duration'])


def _duracao_por_ffmpeg(audio: Path) -> float:
    import re
    import subprocess
    from .video import ffmpeg
    saida = subprocess.run([ffmpeg(), '-i', str(audio)],
                           capture_output=True, text=True, timeout=30)
    m = re.search(r'Duration: (\d+):(\d+):(\d+\.\d+)', saida.stderr)
    if not m:
        raise RuntimeError(f'não consegui medir {audio.name}')
    h, mi, s = m.groups()
    return int(h) * 3600 + int(mi) * 60 + float(s)
