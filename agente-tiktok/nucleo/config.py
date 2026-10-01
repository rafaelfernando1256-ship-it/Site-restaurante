"""
CONFIGURAÇÃO
Um único lugar para caminhos, credenciais e as medidas do vídeo.

Credencial NUNCA entra em arquivo versionado. Tudo que é segredo sai de
variável de ambiente (ou do .env, que está no .gitignore).
"""
from __future__ import annotations

import os
import shutil
import tomllib
from dataclasses import dataclass, field
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PADRAO = RAIZ / "config.toml"
EXEMPLO = RAIZ / "config.exemplo.toml"


def _carrega_env() -> None:
    """Lê o .env sem depender de biblioteca externa."""
    env = RAIZ / ".env"
    if not env.exists():
        return
    for linha in env.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        os.environ.setdefault(chave.strip(), valor.strip().strip("'\""))


@dataclass
class Video:
    largura: int = 1080
    altura: int = 1920
    fps: int = 60
    # Largura CSS com que a página é aberta. 390px é o que a maioria dos
    # celulares reporta — é nesse ponto que o site mostra o layout mobile.
    largura_css: int = 390
    crf: int = 20
    preset: str = "veryfast"

    @property
    def escala(self) -> float:
        """Fator de densidade para o print sair com `largura` px reais."""
        return self.largura / self.largura_css


@dataclass
class Marca:
    nome: str = "Seu Estúdio"
    # Cor das legendas queimadas. &HBBGGRR& é a ordem do formato ASS —
    # invertida em relação ao hex da web, é assim mesmo.
    cor_texto: str = "&H00FFFFFF&"
    cor_contorno: str = "&H00000000&"
    cor_destaque: str = "&H0033E5FF&"  # #FFE533 em BGR
    fonte: str = "Anton"
    # 112px em 1920 de altura ≈ 5,8% da tela. Abaixo disso a legenda
    # some num celular segurado a um braço de distância.
    corpo_legenda: int = 112
    # Fração da altura em que a legenda se apoia. 0.26 deixa ela acima
    # da barra de interface do TikTok e fora do miolo do conteúdo.
    altura_legenda: float = 0.26


@dataclass
class Config:
    video: Video = field(default_factory=Video)
    marca: Marca = field(default_factory=Marca)
    pais: str = "BR"
    idioma: str = "pt-BR"
    # Sites do repositório que o agente pode mostrar, slug -> pasta.
    sites: dict[str, str] = field(default_factory=dict)
    porta_servidor: int = 4500
    modelo_claude: str = "claude-sonnet-5"
    fonte_tendencias: str = "manual"

    @property
    def dir_saida(self) -> Path:
        return RAIZ / "saida"

    @property
    def dir_dados(self) -> Path:
        return RAIZ / "dados"

    @property
    def dir_biblioteca(self) -> Path:
        return RAIZ / "biblioteca"

    @property
    def dir_cache(self) -> Path:
        return RAIZ / ".cache"

    # ── segredos, sempre do ambiente ──
    @property
    def chave_anthropic(self) -> str | None:
        return os.environ.get("ANTHROPIC_API_KEY")

    @property
    def tiktok_client_key(self) -> str | None:
        return os.environ.get("TIKTOK_CLIENT_KEY")

    @property
    def tiktok_client_secret(self) -> str | None:
        return os.environ.get("TIKTOK_CLIENT_SECRET")

    @property
    def tiktok_access_token(self) -> str | None:
        return os.environ.get("TIKTOK_ACCESS_TOKEN")


def carrega(caminho: Path | None = None) -> Config:
    _carrega_env()
    arq = caminho or PADRAO
    if not arq.exists():
        arq = EXEMPLO
    bruto = tomllib.loads(arq.read_text(encoding="utf-8")) if arq.exists() else {}

    cfg = Config()
    v = bruto.get("video", {})
    for campo in ("largura", "altura", "fps", "largura_css", "crf", "preset"):
        if campo in v:
            setattr(cfg.video, campo, v[campo])
    m = bruto.get("marca", {})
    for campo in ("nome", "cor_texto", "cor_contorno", "cor_destaque", "fonte"):
        if campo in m:
            setattr(cfg.marca, campo, m[campo])
    g = bruto.get("geral", {})
    for campo in ("pais", "idioma", "porta_servidor", "modelo_claude", "fonte_tendencias"):
        if campo in g:
            setattr(cfg, campo, g[campo])
    cfg.sites = bruto.get("sites", {})

    for d in (cfg.dir_saida, cfg.dir_dados, cfg.dir_cache):
        d.mkdir(parents=True, exist_ok=True)
    return cfg


def ffmpeg() -> str:
    """Caminho do ffmpeg. Prefere o do sistema; cai no binário do pip."""
    do_sistema = shutil.which("ffmpeg")
    if do_sistema:
        return do_sistema
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError as e:  # pragma: no cover
        raise RuntimeError(
            "ffmpeg não encontrado. Instale com `pip install imageio-ffmpeg` "
            "ou pelo gerenciador de pacotes do seu sistema."
        ) from e


def chromium() -> str | None:
    """
    Caminho do Chromium do Playwright. Devolve None para o Playwright
    resolver sozinho — que é o caso normal numa máquina com
    `playwright install chromium` já rodado.
    """
    forcado = os.environ.get("CHROMIUM_EXE")
    if forcado and Path(forcado).exists():
        return forcado
    base = Path(os.environ.get("PLAYWRIGHT_BROWSERS_PATH", ""))
    if base.is_dir():
        for p in sorted(base.glob("chromium-*/chrome-linux*/chrome"), reverse=True):
            return str(p)
    return None
