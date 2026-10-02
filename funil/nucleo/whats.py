"""
O WHATSAPP WEB

O agente 2 manda sozinho e o agente 3 fica de olho nas respostas. É a
sua própria sessão do WhatsApp Web, num Chrome de verdade, com um perfil
que fica logado entre execuções — você lê o QR uma vez.

> **O risco, escrito, porque foi decisão sua.** Automatizar WhatsApp
> pessoal é contra os Termos da Meta e o número pode ser banido. O que dá
> para fazer, dentro da sua decisão, é não parecer um robô — e é disso
> que trata metade deste arquivo.

O QUE DERRUBA NÚMERO (e como isto evita)

Não é o volume por si. É o PADRÃO. Conta nova que dispara 50 mensagens
iguais, em 3 minutos, para gente que nunca falou com ela, às 4 da manhã,
e recebe bloqueio de volta — esse é o perfil que cai. Então:

  • intervalo irregular entre envios (45 a 180 s, sorteado), nunca fixo;
  • teto por dia, pequeno por padrão;
  • só em horário comercial;
  • mensagem diferente para cada lead — o agente 2 já escreve uma por vez,
    com os dados daquela casa. Texto idêntico em massa é o que o
    detector procura;
  • pausa longa a cada punhado de envios, como gente que para para fazer
    outra coisa;
  • e o freio que mais importa: **ele para sozinho** se a sessão cair,
    se o WhatsApp recusar um número ou se der erro em sequência.

Nada disso é garantia. Número banido é risco real, e quem decide quanto
arriscar é você — os números estão todos em `config.toml`, em `[envio]`.
"""
from __future__ import annotations

import random
import re
import time
from datetime import date, datetime
from pathlib import Path
from typing import Any

ENDERECO = 'https://web.whatsapp.com/'

PAINEL = ['#pane-side', 'div[data-testid="chat-list"]',
          'div[aria-label*="Lista de conversas"]', 'div[aria-label*="Chat list"]']
ESCRITA = ['div[contenteditable="true"][data-tab="10"]',
           'div[contenteditable="true"][data-tab="6"]',
           'footer div[contenteditable="true"]']
# Telas que significam "pare agora".
CAIU = ['Conectar aparelho', 'Link a device', 'Sua conta foi banida',
        'Your account was banned', 'Não foi possível conectar']


class NaoLogado(RuntimeError):
    pass


class NumeroInvalido(RuntimeError):
    pass


# ── o ritmo ─────────────────────────────────────────────────────────
class Ritmo:
    """
    Quanto esperar, quantos por dia, em que horas. Sem isto o resto é só
    um jeito mais rápido de perder o número.
    """

    def __init__(self, cfg):
        self.minimo, self.maximo = getattr(cfg, 'intervalo_segundos', [45, 180])
        self.max_por_dia = getattr(cfg, 'max_por_dia', 20)
        self.hora_inicio, self.hora_fim = getattr(cfg, 'horario', [9, 20])
        self.so_dias_uteis = getattr(cfg, 'so_dias_uteis', False)
        self.pausa_a_cada = getattr(cfg, 'pausa_a_cada', 5)
        self.pausa_longa = getattr(cfg, 'pausa_longa_segundos', [300, 900])
        self.enviados_hoje = 0
        self.dia = date.today()

    def _vira_o_dia(self) -> None:
        if date.today() != self.dia:
            self.dia = date.today()
            self.enviados_hoje = 0

    def pode_agora(self) -> tuple[bool, str]:
        self._vira_o_dia()
        agora = datetime.now()
        if self.so_dias_uteis and agora.weekday() >= 5:
            return False, 'fim de semana (so_dias_uteis está ligado)'
        if not (self.hora_inicio <= agora.hour < self.hora_fim):
            return False, (f'fora do horário ({self.hora_inicio}h às '
                           f'{self.hora_fim}h)')
        if self.enviados_hoje >= self.max_por_dia:
            return False, f'teto do dia atingido ({self.max_por_dia})'
        return True, ''

    def espera(self) -> float:
        """Quanto esperar ANTES do próximo envio. Sorteado, nunca fixo."""
        self._vira_o_dia()
        if self.enviados_hoje and self.enviados_hoje % self.pausa_a_cada == 0:
            return random.uniform(*self.pausa_longa)
        return random.uniform(self.minimo, self.maximo)

    def contou(self) -> None:
        self.enviados_hoje += 1


# ── o navegador ─────────────────────────────────────────────────────
class Whats:
    def __init__(self, perfil: Path, visivel: bool = True):
        self.perfil = Path(perfil)
        self.visivel = visivel
        self._pw = None
        self.ctx = None
        self.pagina = None

    def abre(self, espera_login: int = 120):
        """Abre o WhatsApp Web. Levanta NaoLogado se precisar do QR."""
        if self.pagina is not None and not self.pagina.is_closed():
            return self.pagina
        from playwright.sync_api import sync_playwright
        import os
        self.perfil.mkdir(parents=True, exist_ok=True)
        self._pw = sync_playwright().start()
        opcoes = dict(user_data_dir=str(self.perfil),
                      headless=not self.visivel,
                      viewport={'width': 1280, 'height': 900},
                      args=['--disable-blink-features=AutomationControlled'])
        exe = os.environ.get('FUNIL_CHROME', '')
        try:
            self.ctx = (self._pw.chromium.launch_persistent_context(executable_path=exe, **opcoes)
                        if exe else
                        self._pw.chromium.launch_persistent_context(channel='chrome', **opcoes))
        except Exception:
            self.ctx = self._pw.chromium.launch_persistent_context(**opcoes)

        self.pagina = self.ctx.pages[0] if self.ctx.pages else self.ctx.new_page()
        self.pagina.goto(ENDERECO, wait_until='domcontentloaded', timeout=60000)
        if not self._espera_lista(espera_login * 1000):
            raise NaoLogado(
                'O WhatsApp Web não está conectado. A janela está aberta: leia o '
                'QR code com o celular (WhatsApp → Aparelhos conectados → Conectar '
                'aparelho). É uma vez só; depois o perfil fica logado.')
        return self.pagina

    def _espera_lista(self, tempo: int) -> bool:
        for s in PAINEL:
            try:
                self.pagina.locator(s).first.wait_for(state='visible', timeout=tempo)
                return True
            except Exception:
                continue
        return False

    def vivo(self) -> bool:
        """A sessão ainda está de pé? Falso = parar tudo."""
        try:
            if self.pagina is None or self.pagina.is_closed():
                return False
            texto = self.pagina.inner_text('body')[:3000]
            return not any(m.lower() in texto.lower() for m in CAIU)
        except Exception:
            return False

    def fecha(self) -> None:
        try:
            if self.ctx:
                self.ctx.close()
            if self._pw:
                self._pw.stop()
        finally:
            self.ctx = self._pw = self.pagina = None

    # ── enviar ──────────────────────────────────────────────────────
    def envia(self, e164: str, texto: str) -> str:
        """
        Abre a conversa pelo número e manda. Devolve o que foi enviado.
        Digita em pedaços, com pausa, porque colar 400 letras de uma vez
        não é coisa que mão humana faça.
        """
        import urllib.parse
        p = self.abre()
        alvo = f'{ENDERECO}send?phone={e164}&text={urllib.parse.quote(texto)}'
        p.goto(alvo, wait_until='domcontentloaded', timeout=60000)
        time.sleep(random.uniform(2.5, 5.0))

        corpo = p.inner_text('body')[:2000]
        if re.search(r'inválido|invalid|não está no WhatsApp|isn\'t on WhatsApp',
                     corpo, re.I):
            raise NumeroInvalido(f'{e164} não tem WhatsApp')

        campo = None
        for s in ESCRITA:
            try:
                campo = p.locator(s).first
                campo.wait_for(state='visible', timeout=20000)
                break
            except Exception:
                campo = None
        if campo is None:
            raise RuntimeError('não achei a caixa de escrever — o layout mudou?')

        campo.click()
        time.sleep(random.uniform(0.6, 1.6))      # lendo antes de mandar
        p.keyboard.press('Enter')
        time.sleep(random.uniform(1.5, 3.0))
        return texto

    # ── ler ─────────────────────────────────────────────────────────
    def conversas(self, quantas: int = 40) -> list[dict]:
        """Lista o painel: nome, prévia e quantas não lidas."""
        p = self.abre()
        linhas = p.evaluate("""(n) => {
            const pane = document.querySelector('#pane-side') || document.body;
            const itens = pane.querySelectorAll('[role="listitem"], [role="row"]');
            return [...itens].slice(0, n).map(i => {
              const t = i.innerText || '';
              const marca = i.querySelector('[aria-label*="não lida"], '
                + '[aria-label*="unread"], span[data-icon="status-unread"]');
              return {texto: t.replace(/\\n+/g, ' | '),
                      naoLidas: marca ? (marca.innerText || '1') : ''};
            });
        }""", quantas)
        saida = []
        for l in linhas:
            texto = (l.get('texto') or '').strip()
            if not texto:
                continue
            nome = texto.split(' | ')[0].strip()
            nao = re.sub(r'\D', '', l.get('naoLidas') or '')
            saida.append({'nome': nome, 'texto': texto,
                          'nao_lidas': int(nao) if nao else 0})
        return saida

    def abre_conversa(self, e164: str) -> bool:
        p = self.abre()
        p.goto(f'{ENDERECO}send?phone={e164}', wait_until='domcontentloaded',
               timeout=60000)
        time.sleep(random.uniform(2.0, 4.0))
        for s in ESCRITA:
            try:
                p.locator(s).first.wait_for(state='visible', timeout=15000)
                return True
            except Exception:
                continue
        return False

    def mensagens(self, quantas: int = 20) -> list[dict]:
        """As últimas mensagens da conversa aberta."""
        p = self.abre()
        cru = p.evaluate("""(n) => {
            const rows = document.querySelectorAll('div.message-in, div.message-out');
            return [...rows].slice(-n).map(r => {
              const pre = r.querySelector('[data-pre-plain-text]');
              return {
                meta: pre ? pre.getAttribute('data-pre-plain-text') : '',
                texto: (r.innerText || '').replace(/\\n+/g, ' ').trim().slice(0, 600),
                minha: r.className.includes('message-out')
              };
            }).filter(m => m.texto);
        }""", quantas)
        saida = []
        for m in cru:
            quando, autor = quebra_meta(m.get('meta', ''))
            saida.append({'quando': quando, 'autor': autor, 'texto': m['texto'],
                          'minha': bool(m.get('minha'))})
        return saida


def quebra_meta(meta: str) -> tuple[int, str]:
    """'[20:31, 02/10/2026] Fulano: ' → (timestamp, 'Fulano')."""
    m = re.match(r'\[(\d{1,2}):(\d{2}),\s*(\d{1,2})/(\d{1,2})/(\d{4})\]\s*(.*?):\s*$',
                 meta or '')
    if not m:
        return 0, ''
    h, mi, d, mes, ano, autor = m.groups()
    try:
        return int(datetime(int(ano), int(mes), int(d), int(h), int(mi)).timestamp()), autor
    except ValueError:
        return 0, autor
