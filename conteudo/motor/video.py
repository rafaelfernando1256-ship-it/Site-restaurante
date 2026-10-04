"""
A MONTAGEM — quadros + narração viram um MP4 que o TikTok aceita.

O ffmpeg vem do pacote `imageio-ffmpeg`, que traz o binário junto: sem
isso, instalar ffmpeg no Windows é baixar um zip, descompactar e mexer no
PATH, e é onde a maioria desiste.

O QUE O TIKTOK QUER (e por que cada número está aqui)

  1080x1920, H.264, yuv420p   o perfil que toca em qualquer aparelho;
                              yuv420p é o que faz o vídeo não ficar verde
                              em celular antigo
  30 fps                      slideshow não precisa de mais
  AAC 128k                    áudio que o app não recomprime feio
  +faststart                  move o índice para o começo do arquivo: sem
                              isso o upload fica "processando" eternamente
"""
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


def ffmpeg() -> str:
    """O ffmpeg do sistema, ou o que vem com o imageio-ffmpeg."""
    achado = shutil.which('ffmpeg')
    if achado:
        return achado
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        raise RuntimeError(
            'sem ffmpeg. Instale o que já traz o binário junto:\n'
            '  pip install imageio-ffmpeg')


def monta(quadros: list[tuple[Path, Path | None, float]], destino: Path,
          fade: float = 0.25) -> Path:
    """
    Monta o vídeo. Cada quadro é (imagem, áudio ou None, segundos).

    Áudio e imagem são concatenados por LISTA DE ARQUIVOS e não por
    filtro complexo: o filtro quebra de um jeito ilegível quando um
    quadro tem áudio e outro não, que é o caso normal (capa sem narração,
    corpo com).
    """
    if not quadros:
        raise ValueError('nenhum quadro para montar')
    destino.parent.mkdir(parents=True, exist_ok=True)
    trabalho = destino.parent / '_pedacos'
    trabalho.mkdir(exist_ok=True)
    exe = ffmpeg()

    pedacos: list[Path] = []
    for i, (imagem, audio, segundos) in enumerate(quadros):
        pedaco = trabalho / f'{i:03d}.mp4'
        cmd = [exe, '-y', '-loop', '1', '-i', str(imagem)]
        if audio:
            cmd += ['-i', str(audio)]
        # Zoom lentíssimo: 4% ao longo do quadro. Imagem 100% parada lê
        # como erro de carregamento no feed; movimento visível distrai.
        passos = max(1, int(segundos * 30))
        cmd += [
            '-vf', (f"zoompan=z='min(zoom+0.0013,1.04)':d={passos}"
                    f":s=1080x1920:fps=30,"
                    f"fade=t=in:st=0:d={fade},"
                    f"fade=t=out:st={max(0, segundos - fade):.2f}:d={fade}"),
            '-t', f'{segundos:.2f}',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-r', '30',
        ]
        cmd += (['-c:a', 'aac', '-b:a', '128k', '-shortest'] if audio
                else ['-an'])
        cmd.append(str(pedaco))
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        if r.returncode != 0:
            raise RuntimeError(f'ffmpeg falhou no quadro {i}: '
                               f'{r.stderr[-400:]}')
        pedacos.append(pedaco)

    lista = trabalho / 'lista.txt'
    lista.write_text('\n'.join(f"file '{p.name}'" for p in pedacos))
    r = subprocess.run(
        [exe, '-y', '-f', 'concat', '-safe', '0', '-i', str(lista),
         '-c', 'copy', '-movflags', '+faststart', str(destino)],
        capture_output=True, text=True, cwd=trabalho, timeout=300)
    if r.returncode != 0:
        raise RuntimeError(f'ffmpeg falhou ao juntar: {r.stderr[-400:]}')

    for p in pedacos:
        p.unlink(missing_ok=True)
    lista.unlink(missing_ok=True)
    trabalho.rmdir()
    return destino
