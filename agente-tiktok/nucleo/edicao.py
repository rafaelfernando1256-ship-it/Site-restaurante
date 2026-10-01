"""
EDIÇÃO
Monta o vídeo final a partir do que a captura produziu.

O truque de desempenho está em `_despeja`: em vez de pedir ao ffmpeg que
recorte uma imagem gigante a cada quadro, o recorte é feito em memória
pelo Pillow e o quadro vai cru pelo pipe. Num teste real, 300 quadros
saíram de 60s para 4,3s — catorze vezes mais rápido, e a suavização fica
em Python legível em vez de uma expressão de ffmpeg.

A legenda é ASS, não `drawtext`: ASS dá contorno, sombra e destaque
palavra a palavra, que é o visual padrão do TikTok, e sai queimada no
vídeo (o TikTok não lê faixa de legenda embutida).
"""
from __future__ import annotations

import json
import shutil
import subprocess
import textwrap
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

from .config import Config, ffmpeg


def suave(p: float) -> float:
    """Ease-in-out cúbico: arranca devagar, acelera, freia no fim."""
    return 4 * p**3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2


def _despeja(quadros, cfg: Config, destino: Path, fps: int | None = None) -> Path:
    """Escreve um iterável de imagens PIL direto no ffmpeg, sem passar por disco."""
    v = cfg.video
    fps = fps or v.fps
    destino.parent.mkdir(parents=True, exist_ok=True)
    pr = subprocess.Popen(
        [
            ffmpeg(), "-y", "-hide_banner", "-loglevel", "error",
            "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{v.largura}x{v.altura}", "-r", str(fps), "-i", "-",
            "-c:v", "libx264", "-preset", v.preset, "-crf", str(v.crf),
            "-pix_fmt", "yuv420p", str(destino),
        ],
        stdin=subprocess.PIPE,
    )
    try:
        for img in quadros:
            pr.stdin.write(img.tobytes())
    finally:
        pr.stdin.close()
        if pr.wait() != 0:
            raise RuntimeError(f"ffmpeg falhou ao escrever {destino.name}")
    return destino


def _enquadra(img: Image.Image, cfg: Config) -> Image.Image:
    """Garante exatamente largura×altura, preenchendo com a cor da borda."""
    v = cfg.video
    if img.size == (v.largura, v.altura):
        return img
    fundo = Image.new("RGB", (v.largura, v.altura), img.getpixel((0, 0)))
    fundo.paste(img, (0, 0))
    return fundo


# ── cenas ────────────────────────────────────────────────────────────
def clipe_rolagem(
    pagina: Path, de: int, ate: int, duracao: float, cfg: Config, destino: Path
) -> Path:
    """Desce uma janela 9:16 pela imagem alta da página, com suavização."""
    v = cfg.video
    img = Image.open(pagina).convert("RGB")
    limite = max(0, img.height - v.altura)
    de, ate = min(de, limite), min(ate, limite)
    n = max(2, int(duracao * v.fps))

    def quadros():
        for i in range(n):
            y = round(de + (ate - de) * suave(i / (n - 1)))
            yield _enquadra(img.crop((0, y, v.largura, y + v.altura)), cfg)

    return _despeja(quadros(), cfg, destino)


def clipe_estatico(
    pagina: Path, em: int, duracao: float, cfg: Config, destino: Path, zoom: float = 1.0
) -> Path:
    """
    Segura uma parte da página. Com `zoom` > 1 aplica um empurrão lento
    (efeito Ken Burns), que impede o quadro parado de parecer travado.
    """
    v = cfg.video
    img = Image.open(pagina).convert("RGB")
    limite = max(0, img.height - v.altura)
    em = min(max(0, em), limite)
    n = max(2, int(duracao * v.fps))
    base = img.crop((0, em, v.largura, em + v.altura))

    def quadros():
        for i in range(n):
            if zoom <= 1.0:
                yield _enquadra(base, cfg)
                continue
            f = 1 + (zoom - 1) * (i / (n - 1))
            lc, ac = int(v.largura / f), int(v.altura / f)
            x, y = (v.largura - lc) // 2, (v.altura - ac) // 2
            yield base.crop((x, y, x + lc, y + ac)).resize(
                (v.largura, v.altura), Image.LANCZOS
            )

    return _despeja(quadros(), cfg, destino)


def clipe_sequencia(quadros_png: list[Path], cfg: Config, destino: Path) -> Path:
    """Monta o clipe a partir dos PNGs gravados ao vivo."""

    def quadros():
        for p in quadros_png:
            yield _enquadra(Image.open(p).convert("RGB"), cfg)

    return _despeja(quadros(), cfg, destino)


# ── legendas ─────────────────────────────────────────────────────────
@dataclass
class Fala:
    texto: str
    inicio: float
    fim: float


def _tempo_ass(s: float) -> str:
    h, resto = divmod(max(0.0, s), 3600)
    m, seg = divmod(resto, 60)
    return f"{int(h)}:{int(m):02d}:{seg:05.2f}"


def escreve_ass(falas: list[Fala], cfg: Config, destino: Path) -> Path:
    """
    Gera a legenda no estilo que funciona em vídeo vertical: caixa alta,
    centralizada no terço inferior, contorno grosso e sombra — para
    continuar legível sobre qualquer coisa que passe atrás.
    """
    v, m = cfg.video, cfg.marca
    # MarginV de ~22% da altura deixa a legenda acima da barra de
    # interface do TikTok, que come o rodapé da tela.
    margem = int(v.altura * m.altura_legenda)
    corpo = m.corpo_legenda
    cab = textwrap.dedent(
        f"""\
        [Script Info]
        ScriptType: v4.00+
        PlayResX: {v.largura}
        PlayResY: {v.altura}
        WrapStyle: 0
        ScaledBorderAndShadow: yes

        [V4+ Styles]
        Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
        Style: Base,{m.fonte},{corpo},{m.cor_texto},{m.cor_destaque},{m.cor_contorno},&H64000000&,0,0,0,0,100,100,1,0,1,7,4,2,90,90,{margem},1
        Style: Destaque,{m.fonte},{int(corpo * 1.1)},{m.cor_destaque},{m.cor_destaque},{m.cor_contorno},&H64000000&,0,0,0,0,100,100,1,0,1,7,4,2,90,90,{margem},1

        [Events]
        Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
        """
    )
    linhas = []
    for f in falas:
        texto = f.texto.strip().upper().replace("\n", "\\N")
        # Entrada curta com escala: dá o "pop" sem virar animação exagerada.
        efeito = r"{\fad(120,90)\t(0,110,\fscx106\fscy106)\t(110,200,\fscx100\fscy100)}"
        estilo = "Destaque" if texto.startswith("*") else "Base"
        texto = texto.lstrip("*").strip()
        linhas.append(
            f"Dialogue: 0,{_tempo_ass(f.inicio)},{_tempo_ass(f.fim)},{estilo},,0,0,0,,{efeito}{texto}"
        )
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(cab + "\n".join(linhas) + "\n", encoding="utf-8")
    return destino


# ── montagem ─────────────────────────────────────────────────────────
def concatena(clipes: list[Path], destino: Path) -> Path:
    """Junta os clipes sem recodificar — todos saíram do mesmo encoder."""
    lista = destino.parent / "_lista.txt"
    lista.write_text(
        "\n".join(f"file '{c.resolve().as_posix()}'" for c in clipes), encoding="utf-8"
    )
    subprocess.run(
        [ffmpeg(), "-y", "-hide_banner", "-loglevel", "error",
         "-f", "concat", "-safe", "0", "-i", str(lista), "-c", "copy", str(destino)],
        check=True,
    )
    lista.unlink(missing_ok=True)
    return destino


def scrim(cfg: Config, destino: Path, forca: int = 118) -> Path:
    """
    Degradê transparente → preto na faixa da legenda.

    Sem ele a legenda cai em cima do conteúdo: num teste, a frase "tudo
    legível sem zoom" pousou exatamente sobre o preço que estava
    elogiando. O contorno salva a leitura do texto, mas não impede a
    legenda de esconder justamente o que o vídeo quer mostrar. A faixa
    empurra o conteúdo para o fundo e devolve a hierarquia.
    """
    from PIL import Image

    v, m = cfg.video, cfg.marca
    img = Image.new("RGBA", (v.largura, v.altura), (0, 0, 0, 0))
    px = img.load()
    # Começa a escurecer um pouco acima da linha de base da legenda.
    topo = int(v.altura * (1 - m.altura_legenda - 0.14))
    base = int(v.altura * (1 - m.altura_legenda + 0.10))
    for y in range(topo, min(base, v.altura)):
        p = (y - topo) / max(1, base - topo)
        a = int(forca * suave(min(1.0, p * 1.35)))
        for x in range(v.largura):
            px[x, y] = (0, 0, 0, a)
    for y in range(min(base, v.altura), v.altura):
        for x in range(v.largura):
            px[x, y] = (0, 0, 0, forca)
    destino.parent.mkdir(parents=True, exist_ok=True)
    img.save(destino)
    return destino


def finaliza(
    video: Path,
    ass: Path | None,
    cfg: Config,
    destino: Path,
    audio: Path | None = None,
    dir_fontes: Path | None = None,
    com_scrim: bool = True,
) -> Path:
    """
    Queima a legenda, junta o áudio se houver e exporta no perfil que o
    TikTok aceita sem reprocessar: H.264 High, yuv420p, AAC 128k.
    """
    v = cfg.video
    cmd = [ffmpeg(), "-y", "-hide_banner", "-loglevel", "error", "-i", str(video)]

    arq_scrim = None
    if com_scrim and ass:
        arq_scrim = scrim(cfg, cfg.dir_cache / f"scrim-{v.largura}x{v.altura}.png")
        cmd += ["-i", str(arq_scrim)]
    i_audio = None
    if audio:
        i_audio = 2 if arq_scrim else 1
        cmd += ["-i", str(audio)]

    # Cadeia de filtros nomeada: a faixa é uma SEGUNDA entrada, então não
    # cabe em -vf (que só enxerga a primeira). Daí o filter_complex.
    passos, atual = [], "[0:v]"
    if arq_scrim:
        passos.append(f"{atual}[1:v]overlay=0:0[faixa]")
        atual = "[faixa]"
    if ass:
        # O caminho entra escapado: o filtro subtitles usa ':' como
        # separador de opção, e no Windows o caminho tem ':' depois da letra.
        caminho = str(ass.resolve()).replace("\\", "/").replace(":", r"\:")
        f = f"subtitles='{caminho}'"
        if dir_fontes:
            f += f":fontsdir='{str(dir_fontes.resolve()).replace(chr(92), '/')}'"
        passos.append(f"{atual}{f}[leg]")
        atual = "[leg]"
    passos.append(f"{atual}scale={v.largura}:{v.altura}:flags=lanczos[saida]")
    cmd += ["-filter_complex", ";".join(passos), "-map", "[saida]"]
    if i_audio is not None:
        cmd += ["-map", f"{i_audio}:a"]

    cmd += [
        "-c:v", "libx264", "-profile:v", "high", "-level", "4.1",
        "-preset", "slow", "-crf", str(v.crf), "-pix_fmt", "yuv420p",
        "-r", str(v.fps), "-movflags", "+faststart",
    ]
    if audio:
        cmd += ["-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-shortest"]
    else:
        cmd += ["-an"]
    cmd.append(str(destino))

    subprocess.run(cmd, check=True)
    return destino


def _ffprobe() -> str | None:
    """
    ffprobe ao lado do ffmpeg, se existir. O binário estático do pip não
    traz ffprobe — só o nome do ARQUIVO vira 'ffprobe', nunca a pasta,
    senão o caminho do pacote some junto.
    """
    do_sistema = shutil.which("ffprobe")
    if do_sistema:
        return do_sistema
    p = Path(ffmpeg())
    vizinho = p.with_name(p.name.replace("ffmpeg", "ffprobe"))
    return str(vizinho) if vizinho.exists() else None


def _duracao_pelo_ffmpeg(video: Path) -> float:
    """Lê a duração do cabeçalho que o ffmpeg imprime no stderr."""
    txt = subprocess.run(
        [ffmpeg(), "-hide_banner", "-i", str(video)], capture_output=True, text=True
    ).stderr
    for linha in txt.splitlines():
        if "Duration:" in linha:
            hh, mm, ss = linha.split("Duration:")[1].split(",")[0].strip().split(":")
            return int(hh) * 3600 + int(mm) * 60 + float(ss)
    return 0.0


def sonda(video: Path) -> dict:
    """Lê duração, tamanho e dimensões do arquivo final."""
    exe = _ffprobe()
    saida = subprocess.run(
        [exe, "-v", "quiet", "-print_format", "json",
         "-show_format", "-show_streams", str(video)],
        capture_output=True, text=True,
    ) if exe else None

    if saida is None or saida.returncode != 0 or not saida.stdout.strip():
        return {
            "duracao": _duracao_pelo_ffmpeg(video),
            "mb": video.stat().st_size / 1024 / 1024,
        }
    d = json.loads(saida.stdout)
    fluxo = next((s for s in d["streams"] if s["codec_type"] == "video"), {})
    return {
        "duracao": float(d["format"]["duration"]),
        "mb": video.stat().st_size / 1024 / 1024,
        "largura": fluxo.get("width"),
        "altura": fluxo.get("height"),
    }


def limpa(dir_trabalho: Path) -> None:
    """Apaga os intermediários. Os PNGs de sequência pesam bastante."""
    for alvo in ("quadros", "clipes", "paginas"):
        shutil.rmtree(dir_trabalho / alvo, ignore_errors=True)
