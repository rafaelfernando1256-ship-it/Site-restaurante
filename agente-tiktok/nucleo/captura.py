"""
CAPTURA
Transforma um site em matéria-prima de vídeo.

Duas estratégias, porque servem a coisas diferentes:

1. `pagina_inteira` — um único print da página toda, bem alto. A rolagem
   é animada depois, recortando uma janela 9:16 que desce por essa imagem.
   É de longe o caminho mais rápido (um print em vez de 300) e sai
   perfeitamente fluido, porque não existe quadro perdido.

2. `sequencia` — print por quadro, enquanto o navegador roda de verdade.
   Mais lento, e só vale quando a cena depende de algo que acontece ao
   vivo: abrir menu, clicar, passar o mouse, animação de entrada.

Antes de qualquer print a página é rolada até o fim e de volta ao topo.
Sem isso, tudo que aparece com `IntersectionObserver` — que é quase toda
animação de entrada moderna — sai invisível no print.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

from .config import Config, chromium


@dataclass
class Acao:
    """Um passo dentro de uma cena ao vivo."""

    tipo: str  # clicar | pairar | rolar_para | esperar | teclar
    seletor: str | None = None
    valor: float | str | None = None


class Capturador:
    """
    Abre o navegador uma vez e reaproveita para todas as cenas — subir
    Chromium custa ~1,5s, e um roteiro tem muitas cenas.
    """

    def __init__(self, cfg: Config):
        self.cfg = cfg
        self._pw = None
        self._nav = None
        self._ctx = None

    def __enter__(self) -> "Capturador":
        self._pw = sync_playwright().start()
        exe = chromium()
        args = ["--no-sandbox", "--disable-dev-shm-usage", "--force-color-profile=srgb"]
        self._nav = self._pw.chromium.launch(
            executable_path=exe, args=args
        ) if exe else self._pw.chromium.launch(args=args)
        self._ctx = self._nav.new_context(
            viewport={"width": self.cfg.video.largura_css, "height": 844},
            device_scale_factor=self.cfg.video.escala,
            # Fuso e idioma do público, não da máquina: muda data, moeda
            # e qualquer "aberto agora" que o site calcule.
            locale=self.cfg.idioma,
            timezone_id="America/Sao_Paulo",
            reduced_motion="no-preference",
        )
        return self

    def __exit__(self, *_) -> None:
        for obj in (self._ctx, self._nav):
            if obj:
                obj.close()
        if self._pw:
            self._pw.stop()

    # ── preparo comum ────────────────────────────────────────────────
    def _abre(self, url: str) -> Page:
        pg = self._ctx.new_page()
        pg.goto(url, wait_until="networkidle", timeout=60_000)
        self._revela(pg)
        return pg

    @staticmethod
    def _revela(pg: Page) -> None:
        """Rola até o fim e volta, para disparar as animações de entrada."""
        pg.evaluate(
            """async () => {
              const alt = document.body.scrollHeight;
              for (let y = 0; y <= alt; y += 400) {
                window.scrollTo({ top: y, behavior: 'instant' });
                await new Promise(r => setTimeout(r, 35));
              }
              window.scrollTo({ top: 0, behavior: 'instant' });
            }"""
        )
        pg.wait_for_timeout(700)

    @staticmethod
    def _esconde_fixos(pg: Page) -> None:
        """
        Some com cabeçalho fixo e botão flutuante durante o print inteiro.

        Um elemento `position: fixed` aparece grudado em CADA fatia da
        imagem alta — o print inteiro ficaria com trinta cabeçalhos
        empilhados descendo a tela. Eles voltam nas cenas ao vivo, que é
        onde fazem sentido.
        """
        pg.add_style_tag(
            content="""
            *[style*="position: fixed"], .fixed,
            header[class*="fixed"], header[class*="sticky"],
            [class*="flutuante"], [class*="BotaoFlutuante"] {
              position: static !important;
            }
            [data-captura="ocultar"] { visibility: hidden !important; }
            """
        )
        pg.wait_for_timeout(120)

    # ── estratégia 1: um print alto ──────────────────────────────────
    def pagina_inteira(self, url: str, destino: Path) -> tuple[Path, int]:
        """Devolve (caminho do PNG, altura em px) da página toda."""
        pg = self._abre(url)
        self._esconde_fixos(pg)
        destino.parent.mkdir(parents=True, exist_ok=True)
        pg.screenshot(path=str(destino), full_page=True)
        altura = pg.evaluate(
            "() => Math.ceil(document.documentElement.scrollHeight * window.devicePixelRatio)"
        )
        pg.close()
        return destino, int(altura)

    # ── estratégia 2: quadro a quadro, ao vivo ───────────────────────
    def sequencia(
        self,
        url: str,
        acoes: list[Acao],
        duracao: float,
        destino: Path,
        fps: int | None = None,
    ) -> list[Path]:
        """
        Executa as ações enquanto grava quadros. As ações são distribuídas
        ao longo da duração; entre uma e outra o navegador só segue vivo,
        que é quando as transições do próprio site aparecem.
        """
        fps = fps or self.cfg.video.fps
        destino.mkdir(parents=True, exist_ok=True)
        for velho in destino.glob("*.png"):
            velho.unlink()

        pg = self._abre(url)
        total = max(1, int(duracao * fps))
        intervalo = 1.0 / fps
        # Momento (em quadros) de disparar cada ação, espalhado na linha.
        marcos = (
            {int(total * (i + 0.6) / (len(acoes) + 1)): a for i, a in enumerate(acoes)}
            if acoes
            else {}
        )

        quadros: list[Path] = []
        inicio = time.time()
        for i in range(total):
            if i in marcos:
                self._executa(pg, marcos[i])
            arq = destino / f"q{i:05d}.png"
            pg.screenshot(path=str(arq))
            quadros.append(arq)
            # Mantém o relógio do navegador perto do tempo real, para as
            # transições CSS avançarem entre um quadro e o seguinte.
            atraso = (inicio + i * intervalo) - time.time()
            if atraso > 0:
                pg.wait_for_timeout(atraso * 1000)
        pg.close()
        return quadros

    @staticmethod
    def _executa(pg: Page, a: Acao) -> None:
        try:
            if a.tipo == "clicar" and a.seletor:
                pg.click(a.seletor, timeout=4000)
            elif a.tipo == "pairar" and a.seletor:
                pg.hover(a.seletor, timeout=4000)
            elif a.tipo == "rolar_para" and a.seletor:
                pg.eval_on_selector(
                    a.seletor,
                    "el => el.scrollIntoView({behavior:'smooth', block:'center'})",
                )
            elif a.tipo == "teclar" and a.valor:
                pg.keyboard.press(str(a.valor))
            elif a.tipo == "esperar":
                pg.wait_for_timeout(float(a.valor or 0.4) * 1000)
        except Exception as e:
            # Uma ação que falha não derruba a gravação: o seletor pode ter
            # mudado no site e o resto da cena continua valendo.
            print(f"    ⚠ ação '{a.tipo}' em '{a.seletor}' falhou: {e}")

    # ── medidas úteis para o roteiro ─────────────────────────────────
    def pontos_de_interesse(self, url: str) -> dict[str, int]:
        """
        Devolve a posição vertical (em px do print) de cada seção com id.
        É o que permite o roteiro dizer "mostra a seção de preços" em vez
        de chutar um número de pixel.
        """
        pg = self._abre(url)
        self._esconde_fixos(pg)
        pontos = pg.evaluate(
            """() => {
              const r = {}, dpr = window.devicePixelRatio;
              document.querySelectorAll('section[id], div[id], main [id]').forEach(el => {
                const b = el.getBoundingClientRect();
                if (b.height > 200) r[el.id] = Math.round((b.top + window.scrollY) * dpr);
              });
              r.__altura__ = Math.round(document.documentElement.scrollHeight * dpr);
              return r;
            }"""
        )
        pg.close()
        return {k: int(v) for k, v in pontos.items()}
