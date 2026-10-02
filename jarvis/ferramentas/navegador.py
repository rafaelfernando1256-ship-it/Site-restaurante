"""
O NAVEGADOR

Um Chrome de verdade, controlado pelo Playwright, com **perfil próprio e
permanente**: você faz login uma vez (Google, WhatsApp Web, o que for) e
ele continua logado nas próximas vezes.

Por que perfil próprio e não o seu Chrome do dia a dia: o Chrome tranca
a pasta do perfil enquanto está aberto. Apontar para o seu perfil faria
o Jarvis falhar toda vez que você estivesse navegando — que é sempre.
Com perfil próprio, os dois convivem.

Ele enxerga as abas como você: lista, troca, fecha, abre. "Fecha essa
aba" só faz sentido se existir o conceito de aba ATUAL — e existe:
`atual` aponta para a última aba que ele mexeu ou que você mandou trocar.
"""
from __future__ import annotations

import os
import re
import time
from pathlib import Path

from pydantic import BaseModel, Field

from nucleo.config import DADOS
from nucleo.permissao import LIVRE
from . import Contexto, ferramenta

PERFIL = DADOS / 'navegador'
LIMITE_TEXTO = 24_000


class Navegador:
    """Um navegador só, vivo entre comandos. Abre na primeira vez que precisa."""

    def __init__(self, cfg):
        self.cfg = cfg
        self._pw = None
        self.ctx = None
        self.atual = None

    # ── ciclo de vida ───────────────────────────────────────────────
    def liga(self):
        if self.ctx:
            return self.ctx
        from playwright.sync_api import sync_playwright
        self._pw = sync_playwright().start()
        pasta = Path(self.cfg.perfil_navegador or PERFIL).expanduser()
        pasta.mkdir(parents=True, exist_ok=True)
        # JARVIS_HEADLESS=1 roda sem janela (serve para teste e para máquina
        # sem tela); JARVIS_CHROME aponta um executável fora do lugar comum.
        escondido = os.environ.get('JARVIS_HEADLESS') == '1'
        opcoes = dict(user_data_dir=str(pasta), headless=escondido,
                      viewport=None if not escondido else {'width': 1280, 'height': 900},
                      args=[] if escondido else ['--start-maximized'])
        exe = os.environ.get('JARVIS_CHROME', '')
        if exe:
            self.ctx = self._pw.chromium.launch_persistent_context(
                executable_path=exe, **opcoes)
        else:
            try:
                self.ctx = self._pw.chromium.launch_persistent_context(
                    channel='chrome', **opcoes)
            except Exception:
                # Sem Chrome instalado, cai no Chromium que vem com o Playwright.
                self.ctx = self._pw.chromium.launch_persistent_context(**opcoes)
        self.atual = self.ctx.pages[0] if self.ctx.pages else self.ctx.new_page()
        return self.ctx

    def desliga(self):
        try:
            if self.ctx:
                self.ctx.close()
            if self._pw:
                self._pw.stop()
        finally:
            self.ctx = self._pw = self.atual = None

    # ── abas ────────────────────────────────────────────────────────
    def abas(self):
        self.liga()
        return [p for p in self.ctx.pages if not p.is_closed()]

    def pagina(self):
        self.liga()
        if self.atual and not self.atual.is_closed():
            return self.atual
        vivas = self.abas()
        self.atual = vivas[-1] if vivas else self.ctx.new_page()
        return self.atual

    def nova(self, url: str = ''):
        self.liga()
        # Aproveita uma aba em branco em vez de deixar lixo: o Chrome com
        # perfil permanente sempre nasce com uma about:blank, e "abre o
        # YouTube" não deveria sobrar uma aba vazia do lado.
        p = next((x for x in self.abas()
                  if x.url in ('', 'about:blank', 'chrome://newtab/')), None)
        if p is None:
            p = self.ctx.new_page()
        if url:
            p.goto(_url(url), wait_until='domcontentloaded', timeout=45000)
        self.atual = p
        return p


def _url(texto: str) -> str:
    t = texto.strip()
    if t.startswith(('http://', 'https://', 'file://')):
        return t
    if re.match(r'^[\w.-]+\.[a-z]{2,}(/|$)', t, re.I):
        return 'https://' + t
    return 'https://www.google.com/search?q=' + t.replace(' ', '+')


def _nav(ctx: Contexto) -> Navegador:
    n = ctx.partilha.get('navegador')
    if n is None:
        n = Navegador(ctx.cfg)
        ctx.partilha['navegador'] = n
    return n


def _titulo(p) -> str:
    try:
        return (p.title() or p.url)[:70]
    except Exception:
        return p.url[:70]


# ── ferramentas ─────────────────────────────────────────────────────
class AbrirArgs(BaseModel):
    endereco: str = Field(description='Site, URL ou termo de busca.')
    nova_aba: bool = Field(default=True, description='False reaproveita a aba atual.')


@ferramenta('abrir_site', 'Abre um site numa aba do navegador. Aceita URL ou busca.',
            AbrirArgs, nivel=LIVRE, resumo=lambda a: f'abrir {a.endereco}')
def abrir_site(a: AbrirArgs, ctx: Contexto) -> str:
    n = _nav(ctx)
    url = _url(a.endereco)
    p = n.nova(url) if a.nova_aba else n.pagina()
    if not a.nova_aba:
        p.goto(url, wait_until='domcontentloaded', timeout=45000)
    time.sleep(0.6)
    return f'aberto: {_titulo(p)} — {p.url}'


class NadaArgs(BaseModel):
    pass


@ferramenta('listar_abas', 'Lista as abas abertas, com número, título e endereço.',
            NadaArgs, nivel=LIVRE, resumo=lambda a: 'listar as abas')
def listar_abas(a: NadaArgs, ctx: Contexto) -> str:
    n = _nav(ctx)
    abas = n.abas()
    if not abas:
        return 'nenhuma aba aberta'
    atual = n.pagina()
    return '\n'.join(
        f'{i + 1}. {"➤ " if p == atual else "  "}{_titulo(p)} — {p.url[:90]}'
        for i, p in enumerate(abas))


class AbaArgs(BaseModel):
    numero: int = Field(default=0, description='Número da aba, como em listar_abas.')
    contendo: str = Field(default='', description='Ou parte do título/endereço da aba.')


@ferramenta('trocar_aba', 'Vai para outra aba, pelo número ou por parte do título.',
            AbaArgs, nivel=LIVRE, resumo=lambda a: f'trocar para a aba {a.numero or a.contendo}')
def trocar_aba(a: AbaArgs, ctx: Contexto) -> str:
    n = _nav(ctx)
    abas = n.abas()
    alvo = None
    if a.numero and 1 <= a.numero <= len(abas):
        alvo = abas[a.numero - 1]
    elif a.contendo:
        termo = a.contendo.lower()
        for p in abas:
            if termo in _titulo(p).lower() or termo in p.url.lower():
                alvo = p
                break
    if not alvo:
        return 'não achei essa aba. Use listar_abas.'
    alvo.bring_to_front()
    n.atual = alvo
    return f'agora na aba: {_titulo(alvo)}'


@ferramenta('fechar_aba', 'Fecha uma aba (a atual, se não disser qual).', AbaArgs,
            nivel=LIVRE, resumo=lambda a: f'fechar a aba {a.numero or a.contendo or "atual"}')
def fechar_aba(a: AbaArgs, ctx: Contexto) -> str:
    n = _nav(ctx)
    abas = n.abas()
    alvo = n.pagina()
    if a.numero and 1 <= a.numero <= len(abas):
        alvo = abas[a.numero - 1]
    elif a.contendo:
        termo = a.contendo.lower()
        alvo = next((p for p in abas if termo in _titulo(p).lower()
                     or termo in p.url.lower()), alvo)
    titulo = _titulo(alvo)
    alvo.close()
    restantes = n.abas()
    n.atual = restantes[-1] if restantes else None
    return f'fechei "{titulo}" — restam {len(restantes)} abas'


class LerArgs(BaseModel):
    so_links: bool = Field(default=False, description='True devolve só os links.')


@ferramenta('ler_pagina', 'Lê o texto da página que está aberta na aba atual.', LerArgs,
            nivel=LIVRE, resumo=lambda a: 'ler a página aberta')
def ler_pagina(a: LerArgs, ctx: Contexto) -> str:
    p = _nav(ctx).pagina()
    try:
        p.wait_for_load_state('domcontentloaded', timeout=15000)
    except Exception:
        pass
    if a.so_links:
        links = p.eval_on_selector_all(
            'a[href]', '(as) => as.slice(0,120).map(a => a.innerText.trim() + " → " + a.href)')
        return '\n'.join(l for l in links if l.strip(' →'))[:LIMITE_TEXTO] or 'sem links'
    texto = p.inner_text('body')
    texto = re.sub(r'\n{3,}', '\n\n', texto).strip()
    corte = texto[:LIMITE_TEXTO]
    return (f'{_titulo(p)} — {p.url}\n\n{corte}'
            + ('\n[... página cortada]' if len(texto) > LIMITE_TEXTO else ''))


class ClicarArgs(BaseModel):
    texto: str = Field(description='O texto do botão ou link, como aparece na tela.')


@ferramenta('clicar_na_pagina', 'Clica num botão ou link da página pelo texto dele.',
            ClicarArgs, resumo=lambda a: f'clicar em "{a.texto}"')
def clicar_na_pagina(a: ClicarArgs, ctx: Contexto) -> str:
    p = _nav(ctx).pagina()
    tentativas = [
        lambda: p.get_by_role('button', name=a.texto, exact=False).first,
        lambda: p.get_by_role('link', name=a.texto, exact=False).first,
        lambda: p.get_by_text(a.texto, exact=False).first,
        lambda: p.locator(f'[aria-label*={a.texto!r} i]').first,
    ]
    for pega in tentativas:
        try:
            alvo = pega()
            alvo.click(timeout=4000)
            time.sleep(0.5)
            return f'cliquei em "{a.texto}" — agora em {p.url[:90]}'
        except Exception:
            continue
    return f'não achei "{a.texto}" clicável nesta página'


class PreencherArgs(BaseModel):
    campo: str = Field(description='Rótulo, placeholder ou nome do campo.')
    valor: str
    enviar: bool = Field(default=False, description='Aperta Enter depois.')


@ferramenta('preencher_campo', 'Escreve num campo de formulário da página.', PreencherArgs,
            resumo=lambda a: f'preencher "{a.campo}"')
def preencher_campo(a: PreencherArgs, ctx: Contexto) -> str:
    p = _nav(ctx).pagina()
    tentativas = [
        lambda: p.get_by_label(a.campo, exact=False).first,
        lambda: p.get_by_placeholder(a.campo, exact=False).first,
        lambda: p.locator(f'input[name*={a.campo!r} i], textarea[name*={a.campo!r} i]').first,
        lambda: p.locator('input:visible, textarea:visible').first,
    ]
    for pega in tentativas:
        try:
            alvo = pega()
            alvo.fill(a.valor, timeout=4000)
            if a.enviar:
                alvo.press('Enter')
                time.sleep(1.0)
            return f'preenchi "{a.campo}"' + (' e enviei' if a.enviar else '')
        except Exception:
            continue
    return f'não achei o campo "{a.campo}"'


class RolarArgs(BaseModel):
    direcao: str = Field(default='baixo', description='baixo | cima | fim | topo')


@ferramenta('rolar_pagina', 'Rola a página para ver mais conteúdo.', RolarArgs,
            nivel=LIVRE, resumo=lambda a: f'rolar para {a.direcao}')
def rolar_pagina(a: RolarArgs, ctx: Contexto) -> str:
    p = _nav(ctx).pagina()
    js = {'baixo': 'window.scrollBy(0, window.innerHeight*0.9)',
          'cima': 'window.scrollBy(0, -window.innerHeight*0.9)',
          'fim': 'window.scrollTo(0, document.body.scrollHeight)',
          'topo': 'window.scrollTo(0, 0)'}.get(a.direcao, 'window.scrollBy(0, 600)')
    p.evaluate(js)
    time.sleep(0.4)
    return f'rolei para {a.direcao}'


class BuscarArgs(BaseModel):
    termo: str
    quantos: int = Field(default=6, description='Quantos resultados trazer.')


@ferramenta('buscar_na_web',
            'Busca no Google e devolve os primeiros resultados com título, link e trecho.',
            BuscarArgs, nivel=LIVRE, resumo=lambda a: f'buscar "{a.termo}"')
def buscar_na_web(a: BuscarArgs, ctx: Contexto) -> str:
    n = _nav(ctx)
    p = n.pagina()
    p.goto('https://duckduckgo.com/?q=' + a.termo.replace(' ', '+'),
           wait_until='domcontentloaded', timeout=45000)
    time.sleep(1.2)
    try:
        itens = p.eval_on_selector_all(
            'article, div[data-testid="result"]',
            '(xs) => xs.slice(0,10).map(x => x.innerText.replace(/\\n+/g, " | ").slice(0,320))')
    except Exception:
        itens = []
    if not itens:
        texto = p.inner_text('body')[:4000]
        return f'resultados brutos:\n{texto}'
    return '\n\n'.join(f'{i + 1}. {t}' for i, t in enumerate(itens[:a.quantos]))


@ferramenta('voltar_pagina', 'Volta para a página anterior na mesma aba.', NadaArgs,
            nivel=LIVRE, resumo=lambda a: 'voltar uma página')
def voltar_pagina(a: NadaArgs, ctx: Contexto) -> str:
    p = _nav(ctx).pagina()
    p.go_back(timeout=20000)
    return f'voltei para {_titulo(p)}'


@ferramenta('fechar_navegador', 'Fecha o navegador inteiro.', NadaArgs,
            resumo=lambda a: 'fechar o navegador')
def fechar_navegador(a: NadaArgs, ctx: Contexto) -> str:
    n = ctx.partilha.get('navegador')
    if not n or not n.ctx:
        return 'o navegador nem estava aberto'
    n.desliga()
    return 'navegador fechado'
