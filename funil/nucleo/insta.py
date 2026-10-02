"""
AS CAPTURAS DO INSTAGRAM

Abre o perfil do lead num Chrome com a sua sessão e tira os prints que
antes você tirava no celular: a capa com a bio, a grade, e os primeiros
posts — que é onde mora o cardápio.

> **O risco, escrito.** Os Termos do Instagram proíbem acesso
> automatizado. O que pode acontecer com a SUA conta é checkpoint
> (pedido de confirmação), limite temporário, e no limite suspensão.
> Não é o mesmo risco do WhatsApp — aqui ninguém recebe mensagem, você
> só está abrindo uma página pública que já poderia abrir na mão —, mas
> existe. Por isso o ritmo aqui é de gente olhando perfil, não de robô
> varrendo catálogo:
>
>   • um perfil por vez, nunca uma lista;
>   • rolagem com pausa irregular, como quem lê;
>   • poucos posts abertos (3 por padrão);
>   • e nenhum download de mídia: são capturas de tela da sua própria
>     janela, exatamente o que os seus olhos veriam.
>
> Se preferir risco zero, continue mandando os prints do celular para
> `material/<slug>/`. O agente usa os dois caminhos igual.

Sem login funciona, mas rende pouco: o Instagram tapa a tela com o
convite para entrar depois de alguns segundos. Com a sua sessão
(uma vez, lendo o QR... aqui é login normal) a capa e a grade saem
inteiras.
"""
from __future__ import annotations

import random
import re
import time
from pathlib import Path
from typing import Any

PERFIL_URL = 'https://www.instagram.com/{}/'

FECHAR = [
    'button:has-text("Permitir todos os cookies")',
    'button:has-text("Allow all cookies")',
    'button:has-text("Aceitar")',
    'button:has-text("Agora não")',
    'button:has-text("Not Now")',
    'div[role="dialog"] button[aria-label="Fechar"]',
    'div[role="dialog"] svg[aria-label="Fechar"]',
    'svg[aria-label="Close"]',
]

MUROS = ('Entre para ver', 'Log in to see', 'Entrar no Instagram',
         'Página não disponível', "Sorry, this page isn't available")


class SemAcesso(RuntimeError):
    pass


class Insta:
    def __init__(self, perfil: Path, visivel: bool = True):
        self.perfil = Path(perfil)
        self.visivel = visivel
        self._pw = None
        self.ctx = None
        self.pagina = None

    # ── navegador ───────────────────────────────────────────────────
    def abre(self):
        if self.pagina is not None and not self.pagina.is_closed():
            return self.pagina
        import os

        from playwright.sync_api import sync_playwright
        self.perfil.mkdir(parents=True, exist_ok=True)
        self._pw = sync_playwright().start()
        opcoes = dict(user_data_dir=str(self.perfil), headless=not self.visivel,
                      viewport={'width': 1180, 'height': 1000},
                      args=['--disable-blink-features=AutomationControlled'])
        exe = os.environ.get('FUNIL_CHROME', '')
        try:
            self.ctx = (self._pw.chromium.launch_persistent_context(executable_path=exe, **opcoes)
                        if exe else
                        self._pw.chromium.launch_persistent_context(channel='chrome', **opcoes))
        except Exception:
            self.ctx = self._pw.chromium.launch_persistent_context(**opcoes)
        self.pagina = self.ctx.pages[0] if self.ctx.pages else self.ctx.new_page()
        return self.pagina

    def fecha(self):
        try:
            if self.ctx:
                self.ctx.close()
            if self._pw:
                self._pw.stop()
        finally:
            self.ctx = self._pw = self.pagina = None

    def logado(self) -> bool:
        """Tem sessão? Sem ela a captura sai pela metade."""
        p = self.abre()
        try:
            p.goto('https://www.instagram.com/', wait_until='domcontentloaded',
                   timeout=45000)
            self._fecha_dialogos()
            time.sleep(2)
            corpo = p.inner_text('body')[:3000]
            return not re.search(r'\bEntrar\b|\bLog in\b|Criar nova conta', corpo)
        except Exception:
            return False

    def _fecha_dialogos(self) -> None:
        p = self.pagina
        for s in FECHAR:
            try:
                alvo = p.locator(s).first
                if alvo.is_visible(timeout=800):
                    alvo.click(timeout=1500)
                    time.sleep(0.6)
            except Exception:
                continue
        try:
            p.keyboard.press('Escape')
        except Exception:
            pass

    @staticmethod
    def _respira(a: float = 0.8, b: float = 2.2) -> None:
        time.sleep(random.uniform(a, b))

    # ── a captura ───────────────────────────────────────────────────
    def captura(self, handle: str, destino: Path, posts: int = 3,
                rolagens: int = 3) -> list[Path]:
        """
        Devolve os arquivos criados. Falha só quando não vê nada —
        captura parcial é melhor que nenhuma, e o agente 3 lida bem com
        material incompleto.
        """
        handle = (handle or '').lstrip('@').strip('/')
        if not handle:
            raise SemAcesso('lead sem Instagram')
        p = self.abre()
        destino.mkdir(parents=True, exist_ok=True)
        feitos: list[Path] = []

        p.goto(PERFIL_URL.format(handle), wait_until='domcontentloaded', timeout=60000)
        self._respira(2.0, 4.0)
        self._fecha_dialogos()
        self._respira()

        corpo = p.inner_text('body')[:4000]
        if any(m.lower() in corpo.lower() for m in MUROS):
            raise SemAcesso(
                f'o Instagram não mostrou @{handle} nesta janela. '
                'Entre na sua conta na janela que abriu (é uma vez só) e rode de novo.')

        def tira(nome: str) -> None:
            arquivo = destino / nome
            try:
                p.screenshot(path=str(arquivo))
                feitos.append(arquivo)
            except Exception:
                pass

        tira('01-capa.png')
        for i in range(max(0, rolagens)):
            p.mouse.wheel(0, 900)
            self._respira(1.0, 2.4)        # quem lê, para
            tira(f'{i + 2:02d}-grade.png')

        # Os posts são onde aparece cardápio e preço.
        for i in range(max(0, posts)):
            try:
                p.goto(PERFIL_URL.format(handle), wait_until='domcontentloaded',
                       timeout=45000)
                self._respira(1.5, 3.0)
                self._fecha_dialogos()
                alvos = p.locator('main a[href*="/p/"], main a[href*="/reel/"]')
                if alvos.count() <= i:
                    break
                alvos.nth(i).click(timeout=8000)
                self._respira(2.0, 3.5)
                tira(f'{10 + i:02d}-post.png')
                p.keyboard.press('Escape')
                self._respira()
            except Exception:
                continue

        if not feitos:
            raise SemAcesso(f'não consegui capturar nada de @{handle}')
        return feitos


def ja_tem_material(pasta: Path) -> bool:
    if not pasta.exists():
        return False
    return any(x.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp')
               for x in pasta.iterdir())
